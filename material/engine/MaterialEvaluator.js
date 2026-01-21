/**
 * MaterialEvaluator.js
 *
 * Material Graph Evaluation Engine
 * =================================
 * Evaluates the material graph to compute material properties for the 3D preview.
 * Extracted from material-app.js to improve maintainability.
 */

import { textureManager } from "./TextureManager.js";
import { shaderEvaluator } from "./ShaderEvaluator.js";

/**
 * Evaluates a material graph and returns PBR material properties
 */
export class MaterialEvaluator {
  constructor(graph) {
    this.graph = graph;
  }

  // ============================================================================
  // MATH HELPERS
  // ============================================================================

  /** Multiply two values (scalar or vector) */
  multiplyValues(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((v, i) => v * (b[i] ?? 1));
    }
    if (Array.isArray(a)) {
      return a.map((v) => v * (typeof b === "number" ? b : 1));
    }
    if (Array.isArray(b)) {
      return b.map((v) => v * (typeof a === "number" ? a : 1));
    }
    return (typeof a === "number" ? a : 1) * (typeof b === "number" ? b : 1);
  }

  /** Add two values */
  addValues(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((v, i) => v + (b[i] ?? 0));
    }
    if (Array.isArray(a)) {
      return a.map((v) => v + (typeof b === "number" ? b : 0));
    }
    if (Array.isArray(b)) {
      return b.map((v) => v + (typeof a === "number" ? a : 0));
    }
    return (typeof a === "number" ? a : 0) + (typeof b === "number" ? b : 0);
  }

  /** Subtract two values */
  subtractValues(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((v, i) => v - (b[i] ?? 0));
    }
    if (Array.isArray(a)) {
      return a.map((v) => v - (typeof b === "number" ? b : 0));
    }
    if (Array.isArray(b)) {
      return b.map((v) => (typeof a === "number" ? a : 0) - v);
    }
    return (typeof a === "number" ? a : 0) - (typeof b === "number" ? b : 0);
  }

  /** Divide two values (with divide-by-zero protection) */
  divideValues(a, b) {
    const safeDivide = (x, y) => x / Math.max(y, 0.0001);
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((v, i) => safeDivide(v, b[i] ?? 1));
    }
    if (Array.isArray(a)) {
      return a.map((v) => safeDivide(v, typeof b === "number" ? b : 1));
    }
    if (Array.isArray(b)) {
      return b.map((v) => safeDivide(typeof a === "number" ? a : 1, v));
    }
    return safeDivide(typeof a === "number" ? a : 1, typeof b === "number" ? b : 1);
  }

  /** Lerp (linear interpolate) two values */
  lerpValues(a, b, t) {
    const alpha = typeof t === "number" ? t : 0.5;
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.map((v, i) => v + (b[i] - v) * alpha);
    }
    if (typeof a === "number" && typeof b === "number") {
      return a + (b - a) * alpha;
    }
    return a;
  }

  // ============================================================================
  // PIN EVALUATION
  // ============================================================================

  /**
   * Recursively evaluate a pin to get its value
   */
  evaluatePin(pin, visited = new Set()) {
    if (!pin || visited.has(pin.id)) return null;
    visited.add(pin.id);

    // If not connected, return default value from pin
    if (!pin.connectedTo) {
      if (pin.defaultValue !== undefined) {
        return pin.defaultValue;
      }
      return null;
    }

    // Get the link and source node
    const link = this.graph.links.get(pin.connectedTo);
    if (!link || !link.outputPin) return null;

    const sourceNode = [...this.graph.nodes.values()].find((n) =>
      n.outputs.some((p) => p.id === link.outputPin.id)
    );
    if (!sourceNode) return null;

    // Evaluate based on node type
    return this.evaluateNode(sourceNode, link.outputPin, visited);
  }

  // ============================================================================
  // NODE EVALUATION
  // ============================================================================

  /**
   * Evaluate a node's output
   */
  evaluateNode(node, outputPin, visited) {
    const nodeKey = node.nodeKey || node.type;

    // Constant nodes - return property value
    if (nodeKey === "Constant" || nodeKey === "ScalarParameter") {
      return node.properties.R ?? node.properties.DefaultValue ?? 0;
    }

    // Vector constants
    if (nodeKey === "Constant3Vector" || nodeKey === "VectorParameter") {
      return [
        node.properties.R ?? 1,
        node.properties.G ?? 1,
        node.properties.B ?? 1,
      ];
    }

    // Constant2Vector - returns float2
    if (nodeKey === "Constant2Vector") {
      return [node.properties.R ?? 0, node.properties.G ?? 0];
    }

    // Constant4Vector - returns float4
    if (nodeKey === "Constant4Vector") {
      return [
        node.properties.R ?? 1,
        node.properties.G ?? 1,
        node.properties.B ?? 1,
        node.properties.A ?? 1,
      ];
    }

    // Multiply node
    if (nodeKey === "Multiply") {
      return this.evaluateMultiply(node, visited);
    }

    // Add node
    if (nodeKey === "Add") {
      return this.evaluateBinaryOp(node, visited, this.addValues.bind(this), 0);
    }

    // Subtract node
    if (nodeKey === "Subtract") {
      return this.evaluateBinaryOp(node, visited, this.subtractValues.bind(this), 0);
    }

    // Divide node
    if (nodeKey === "Divide") {
      return this.evaluateBinaryOp(node, visited, this.divideValues.bind(this), 1);
    }

    // Lerp node
    if (nodeKey === "Lerp") {
      return this.evaluateLerp(node, visited);
    }

    // Texture sample
    if (nodeKey === "TextureSample" || nodeKey === "TextureParameter") {
      return this.evaluateTextureSample(node, outputPin);
    }

    // Fresnel
    if (nodeKey === "Fresnel") {
      return 0.5; // Approximate for preview
    }

    // OneMinus
    if (nodeKey === "OneMinus") {
      return this.evaluateUnaryOp(node, visited, (v) => 1 - v);
    }

    // Clamp
    if (nodeKey === "Clamp") {
      return this.evaluateClamp(node, visited);
    }

    // Power
    if (nodeKey === "Power") {
      return this.evaluatePower(node, visited);
    }

    // Max
    if (nodeKey === "Max") {
      return this.evaluateBinaryMath(node, visited, Math.max);
    }

    // Min
    if (nodeKey === "Min") {
      return this.evaluateBinaryMath(node, visited, Math.min);
    }

    // Abs
    if (nodeKey === "Abs") {
      return this.evaluateUnaryOp(node, visited, Math.abs);
    }

    // Saturate
    if (nodeKey === "Saturate") {
      return this.evaluateUnaryOp(node, visited, (v) => Math.max(0, Math.min(1, v)));
    }

    // Sin
    if (nodeKey === "Sin") {
      return this.evaluateUnaryOp(node, visited, Math.sin);
    }

    // Cos
    if (nodeKey === "Cos") {
      return this.evaluateUnaryOp(node, visited, Math.cos);
    }

    // Floor
    if (nodeKey === "Floor") {
      return this.evaluateUnaryOp(node, visited, Math.floor);
    }

    // Ceil
    if (nodeKey === "Ceil") {
      return this.evaluateUnaryOp(node, visited, Math.ceil);
    }

    // Frac
    if (nodeKey === "Frac") {
      return this.evaluateUnaryOp(node, visited, (v) => v - Math.floor(v));
    }

    // SquareRoot
    if (nodeKey === "SquareRoot") {
      return this.evaluateUnaryOp(node, visited, (v) => Math.sqrt(Math.max(0, v)));
    }

    // Default: try to read properties
    if (node.properties.R !== undefined) {
      return [
        node.properties.R ?? 0,
        node.properties.G ?? 0,
        node.properties.B ?? 0,
      ];
    }
    if (node.properties.Value !== undefined) {
      return node.properties.Value;
    }

    // Fallback for unknown nodes
    console.warn(`Node type "${nodeKey}" not evaluated, using fallback.`);
    return 0.5;
  }

  // ============================================================================
  // NODE TYPE EVALUATORS
  // ============================================================================

  /** Evaluate Multiply node (handles texture × color) */
  evaluateMultiply(node, visited) {
    const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
    const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
    const valA = this.evaluatePin(pinA, new Set(visited)) ?? 1;
    const valB = this.evaluatePin(pinB, new Set(visited)) ?? 1;

    const isTexA = valA && typeof valA === "object" && valA.type === "texture";
    const isTexB = valB && typeof valB === "object" && valB.type === "texture";

    // If one input is a texture, return pending operation
    if (isTexA && !isTexB) {
      return { type: "pending", operation: "multiply", texture: valA, color: valB };
    }
    if (isTexB && !isTexA) {
      return { type: "pending", operation: "multiply", texture: valB, color: valA };
    }
    if (isTexA && isTexB) {
      return valA; // Both textures - return first for now
    }

    return this.multiplyValues(valA, valB);
  }

  /** Evaluate binary operation (Add, Subtract, Divide) */
  evaluateBinaryOp(node, visited, operation, defaultVal) {
    const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
    const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
    const valA = this.evaluatePin(pinA, new Set(visited)) ?? defaultVal;
    const valB = this.evaluatePin(pinB, new Set(visited)) ?? defaultVal;
    return operation(valA, valB);
  }

  /** Evaluate Lerp node */
  evaluateLerp(node, visited) {
    const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
    const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
    const pinAlpha = node.inputs.find((p) => p.localId === "alpha" || p.name === "Alpha");
    const valA = this.evaluatePin(pinA, new Set(visited)) ?? 0;
    const valB = this.evaluatePin(pinB, new Set(visited)) ?? 1;
    const alpha = this.evaluatePin(pinAlpha, new Set(visited)) ?? 0.5;
    return this.lerpValues(valA, valB, alpha);
  }

  /** Evaluate texture sample */
  evaluateTextureSample(node, outputPin) {
    let textureId = node.properties?.TextureAsset || node.properties?.texture;

    if (!textureId && textureManager) {
      textureId = "checkerboard";
    }

    if (textureId && textureManager) {
      const texData = textureManager.get(textureId);
      if (texData && texData.dataUrl) {
        return { type: "texture", url: texData.dataUrl };
      }
    }

    // Fallback to mid-gray
    if (outputPin && (outputPin.localId === "rgb" || outputPin.name === "RGB")) {
      return [0.5, 0.5, 0.5];
    }
    return 0.5;
  }

  /** Evaluate unary operation */
  evaluateUnaryOp(node, visited, fn) {
    const inputPin = node.inputs.find(
      (p) => p.localId === "in" || p.localId === "input" || p.name === "Input" || p.name === "" || p.localId === "x"
    );
    const val = this.evaluatePin(inputPin, new Set(visited)) ?? 0;
    if (typeof val === "number") return fn(val);
    if (Array.isArray(val)) return val.map((v) => fn(v));
    return val;
  }

  /** Evaluate binary math operation (Max, Min) */
  evaluateBinaryMath(node, visited, fn) {
    const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
    const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
    const valA = this.evaluatePin(pinA, new Set(visited)) ?? 0;
    const valB = this.evaluatePin(pinB, new Set(visited)) ?? 0;
    if (typeof valA === "number" && typeof valB === "number") return fn(valA, valB);
    if (Array.isArray(valA) && Array.isArray(valB)) {
      return valA.map((v, i) => fn(v, valB[i] ?? 0));
    }
    return valA;
  }

  /** Evaluate Clamp node */
  evaluateClamp(node, visited) {
    const inputPin = node.inputs.find(
      (p) => p.localId === "value" || p.localId === "input" || p.name === "Input" || p.name === "Value"
    );
    const minPin = node.inputs.find((p) => p.localId === "min" || p.name === "Min");
    const maxPin = node.inputs.find((p) => p.localId === "max" || p.name === "Max");
    let val = this.evaluatePin(inputPin, new Set(visited)) ?? 0;
    const minVal = this.evaluatePin(minPin, new Set(visited)) ?? 0;
    const maxVal = this.evaluatePin(maxPin, new Set(visited)) ?? 1;
    if (typeof val === "number") {
      return Math.max(minVal, Math.min(maxVal, val));
    }
    return val;
  }

  /** Evaluate Power node */
  evaluatePower(node, visited) {
    const basePin = node.inputs.find((p) => p.localId === "base" || p.name === "Base");
    const expPin = node.inputs.find((p) => p.localId === "exponent" || p.name === "Exp");
    const base = this.evaluatePin(basePin, new Set(visited)) ?? 1;
    const exp = this.evaluatePin(expPin, new Set(visited)) ?? node.properties?.Exponent ?? 2;
    if (typeof base === "number") return Math.pow(base, exp);
    if (Array.isArray(base)) return base.map((v) => Math.pow(v, exp));
    return base;
  }

  // ============================================================================
  // MAIN EVALUATION ENTRY POINT
  // ============================================================================

  /**
   * Evaluate the full material graph and return material properties
   * @returns {Object} Material properties for the viewport
   */
  evaluate() {
    const mainNode = [...this.graph.nodes.values()].find(
      (n) => n.type === "main-output"
    );
    if (!mainNode) return null;

    const result = {
      baseColor: [0.5, 0.5, 0.5],
      metallic: 0,
      roughness: 0.5,
      emissive: null,
      opacity: 1.0,
    };

    // Evaluate each main node input
    mainNode.inputs.forEach((pin) => {
      const value = this.evaluatePin(pin);
      if (value === null) return;

      const pinName = pin.name.toLowerCase().trim();

      // Base Color
      if (pinName === "base color") {
        this.processBaseColor(value, result);
      }
      // Metallic
      else if (pinName === "metallic") {
        result.metallic = typeof value === "number" ? value : Array.isArray(value) ? value[0] : 0;
      }
      // Roughness (exact match)
      else if (pinName === "roughness") {
        result.roughness = typeof value === "number" ? value : Array.isArray(value) ? value[0] : 0.5;
      }
      // Emissive Color
      else if (pinName === "emissive color") {
        if (Array.isArray(value)) {
          result.emissive = value.slice(0, 3);
        } else if (typeof value === "number") {
          result.emissive = [value, value, value];
        }
      }
      // Opacity
      else if (pinName === "opacity") {
        result.opacity = typeof value === "number" ? value : Array.isArray(value) ? value[0] : 1.0;
      }
    });

    return result;
  }

  /** Process base color value (handles textures and pending operations) */
  processBaseColor(value, result) {
    if (value && typeof value === "object" && value.type === "pending") {
      if (value.operation === "multiply") {
        result.pendingBaseColor = shaderEvaluator.multiplyTextureByColor(
          value.texture,
          value.color
        );
      }
    } else if (value && typeof value === "object" && value.type === "texture") {
      result.baseColorTexture = value.url;
      result.baseColor = [1, 1, 1];
    } else if (Array.isArray(value)) {
      result.baseColor = value.slice(0, 3);
    } else if (typeof value === "number") {
      result.baseColor = [value, value, value];
    }
  }

  /**
   * Finalize async operations and update viewport
   * @param {Object} result - The evaluation result
   * @param {Object} viewport - The viewport controller
   */
  async finalize(result, viewport) {
    if (result.pendingBaseColor) {
      try {
        const texture = await result.pendingBaseColor;
        if (texture && texture.url) {
          result.baseColorTexture = texture.url;
          result.baseColor = [1, 1, 1];
        }
      } catch (e) {
        console.warn("Failed to process texture operation:", e);
      }
      delete result.pendingBaseColor;
    }

    if (viewport) {
      viewport.updateMaterial(result);
    }
  }
}
