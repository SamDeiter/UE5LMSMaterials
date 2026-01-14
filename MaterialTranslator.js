/**
 * MaterialTranslator.js
 *
 * Handles graph evaluation and PBR input translation.
 * Adopts UE5-style patterns: Scoped caching (Deduplication) and result structs.
 */

import { shaderEvaluator } from "./ShaderEvaluator.js";
import { textureManager } from "./TextureManager.js";

export class MaterialTranslator {
  constructor() {
    this.scopeMap = new Map();
  }

  /**
   * Main entry point: Translate graph starting from main node
   */
  translate(graph, mainNode) {
    this.scopeMap.clear();

    const result = {
      baseColor: [0.5, 0.5, 0.5],
      metallic: 0,
      roughness: 0.5,
      emissive: null,
      baseColorTexture: null,
      pendingBaseColor: null,
    };

    if (!mainNode) return result;

    // Evaluate each main node input
    mainNode.inputs.forEach((pin) => {
      const value = this.evaluatePin(graph, pin);
      if (value === null) return;

      const pinName = pin.name.toLowerCase();

      if (pinName.includes("base color") || pinName.includes("basecolor")) {
        if (value && typeof value === "object" && value.type === "pending") {
          if (value.operation === "multiply") {
            result.pendingBaseColor = shaderEvaluator.multiplyTextureByColor(
              value.texture,
              value.color
            );
          }
        } else if (
          value &&
          typeof value === "object" &&
          value.type === "texture"
        ) {
          result.baseColorTexture = value.url;
          result.baseColor = [1, 1, 1];
        } else if (Array.isArray(value)) {
          result.baseColor = value.slice(0, 3);
        } else if (typeof value === "number") {
          result.baseColor = [value, value, value];
        }
      } else if (pinName.includes("metallic")) {
        result.metallic =
          typeof value === "number"
            ? value
            : Array.isArray(value)
            ? value[0]
            : 0;
      } else if (pinName.includes("roughness")) {
        result.roughness =
          typeof value === "number"
            ? value
            : Array.isArray(value)
            ? value[0]
            : 0.5;
      } else if (pinName.includes("emissive")) {
        if (Array.isArray(value)) {
          result.emissive = value.slice(0, 3);
        }
      }
    });

    return result;
  }

  /**
   * Recursively evaluate a pin to get its value
   */
  evaluatePin(graph, pin, visited = new Set()) {
    if (!pin || visited.has(pin.id)) return null;
    visited.add(pin.id);

    // If not connected, return default value
    if (!pin.connectedTo) {
      return pin.defaultValue !== undefined ? pin.defaultValue : null;
    }

    // Get the link and source node
    const link = graph.links.get(pin.connectedTo);
    if (!link || !link.outputPin) return null;

    const sourceNode = [...graph.nodes.values()].find((n) =>
      n.outputs.some((p) => p.id === link.outputPin.id)
    );
    if (!sourceNode) return null;

    // Check scope map for deduplication
    const hash = sourceNode.id + "_" + link.outputPin.id;
    if (this.scopeMap.has(hash)) return this.scopeMap.get(hash);

    // Evaluate node
    const result = this.evaluateNode(
      graph,
      sourceNode,
      link.outputPin,
      visited
    );
    this.scopeMap.set(hash, result);
    return result;
  }

  /**
   * Evaluate a node output
   */
  evaluateNode(graph, node, outputPin, visited) {
    const nodeKey = node.nodeKey || node.type;

    if (nodeKey === "Constant" || nodeKey === "ScalarParameter") {
      return node.properties.R ?? node.properties.DefaultValue ?? 0;
    }

    if (nodeKey === "Constant3Vector" || nodeKey === "VectorParameter") {
      return [
        node.properties.R ?? 1,
        node.properties.G ?? 1,
        node.properties.B ?? 1,
      ];
    }

    if (nodeKey === "Multiply") {
      const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
      const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
      const valA = this.evaluatePin(graph, pinA, new Set(visited)) ?? 1;
      const valB = this.evaluatePin(graph, pinB, new Set(visited)) ?? 1;

      const isTexA =
        valA && typeof valA === "object" && valA.type === "texture";
      const isTexB =
        valB && typeof valB === "object" && valB.type === "texture";

      if (isTexA && !isTexB) {
        return {
          type: "pending",
          operation: "multiply",
          texture: valA,
          color: valB,
        };
      }
      if (isTexB && !isTexA) {
        return {
          type: "pending",
          operation: "multiply",
          texture: valB,
          color: valA,
        };
      }
      return this.multiplyValues(valA, valB);
    }

    if (nodeKey === "Add") {
      const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
      const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
      const valA = this.evaluatePin(graph, pinA, new Set(visited)) ?? 0;
      const valB = this.evaluatePin(graph, pinB, new Set(visited)) ?? 0;
      return this.addValues(valA, valB);
    }

    if (nodeKey === "Lerp") {
      const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
      const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
      const pinAlpha = node.inputs.find(
        (p) => p.localId === "alpha" || p.name === "Alpha"
      );
      const valA = this.evaluatePin(graph, pinA, new Set(visited)) ?? 0;
      const valB = this.evaluatePin(graph, pinB, new Set(visited)) ?? 1;
      const alpha = this.evaluatePin(graph, pinAlpha, new Set(visited)) ?? 0.5;
      return this.lerpValues(valA, valB, alpha);
    }

    if (nodeKey === "TextureSample" || nodeKey === "TextureParameter") {
      let textureId = node.properties?.TextureAsset || node.properties?.texture;
      if (!textureId && textureManager) textureId = "checkerboard";

      if (textureId && textureManager) {
        const texData = textureManager.get(textureId);
        if (texData && texData.dataUrl) {
          return { type: "texture", url: texData.dataUrl };
        }
      }
      if (
        outputPin &&
        (outputPin.localId === "rgb" || outputPin.name === "RGB")
      ) {
        return [0.5, 0.5, 0.5];
      }
      return 0.5;
    }

    // Default property reading
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

    return null;
  }

  multiplyValues(a, b) {
    if (Array.isArray(a) && Array.isArray(b))
      return a.map((v, i) => v * (b[i] ?? 1));
    if (Array.isArray(a))
      return a.map((v) => v * (typeof b === "number" ? b : 1));
    if (Array.isArray(b))
      return b.map((v) => v * (typeof a === "number" ? a : 1));
    return (typeof a === "number" ? a : 1) * (typeof b === "number" ? b : 1);
  }

  addValues(a, b) {
    if (Array.isArray(a) && Array.isArray(b))
      return a.map((v, i) => v + (b[i] ?? 0));
    if (Array.isArray(a))
      return a.map((v) => v + (typeof b === "number" ? b : 0));
    if (Array.isArray(b))
      return b.map((v) => v + (typeof a === "number" ? a : 0));
    return (typeof a === "number" ? a : 0) + (typeof b === "number" ? b : 0);
  }

  lerpValues(a, b, t) {
    const alpha = typeof t === "number" ? t : 0.5;
    if (Array.isArray(a) && Array.isArray(b))
      return a.map((v, i) => v + (b[i] - v) * alpha);
    if (typeof a === "number" && typeof b === "number")
      return a + (b - a) * alpha;
    return a;
  }
}
