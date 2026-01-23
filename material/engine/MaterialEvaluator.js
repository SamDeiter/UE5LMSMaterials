/**
 * MaterialEvaluator.js
 *
 * Material Graph Evaluation Engine
 * =================================
 * Evaluates the material graph to compute material properties for the 3D preview.
 * Delegates node evaluation to NodeEvaluators.js.
 */

import { shaderEvaluator } from "./ShaderEvaluator.js";
import { dispatchNodeEvaluation } from "./NodeEvaluators.js";

/**
 * Evaluates a material graph and returns PBR material properties
 */
export class MaterialEvaluator {
  constructor(graph) {
    this.graph = graph;
  }

  // ==========================================================================
  // PIN EVALUATION
  // ==========================================================================

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

    // Delegate to node dispatcher
    return dispatchNodeEvaluation(
      this.evaluatePin.bind(this),
      sourceNode,
      link.outputPin,
      visited
    );
  }

  // ==========================================================================
  // MAIN EVALUATION
  // ==========================================================================

  /**
   * Evaluate the full material graph and return material properties
   * @returns {Object} Material properties for the viewport
   */
  evaluate() {
    const mainNode = [...this.graph.nodes.values()].find(
      (n) => n.type === "main-output"
    );
    if (!mainNode) return null;

    // Read material settings from DOM
    const shadingModelEl = document.getElementById("shading-model");
    const blendModeEl = document.getElementById("blend-mode");
    const shadingModel = shadingModelEl ? shadingModelEl.value : "DefaultLit";
    const blendMode = blendModeEl ? blendModeEl.value : "Opaque";

    const result = {
      // Material settings
      shadingModel,
      blendMode,
      // PBR properties
      baseColor: [1.0, 1.0, 1.0], // Default white to match UE5 default
      metallic: 0,
      roughness: 0.5,
      emissive: null,
      opacity: 1.0,
      // Shading model specific
      subsurfaceColor: null,
      clearCoat: 0,
      clearCoatRoughness: 0,
      // Texture maps
      baseColorTexture: null,
      roughnessTexture: null,
      metallicTexture: null,
      normalTexture: null,
    };

    // Evaluate each main node input
    mainNode.inputs.forEach((pin) => {
      const value = this.evaluatePin(pin);
      if (value === null) return;

      const pinName = pin.name.toLowerCase().trim();

      switch (pinName) {
        case "base color":
          this.processBaseColor(value, result);
          break;
        case "metallic":
          this.processScalarOrTexture(value, result, 'metallic', 'metallicTexture', 0);
          break;
        case "roughness":
          this.processScalarOrTexture(value, result, 'roughness', 'roughnessTexture', 0.5);
          break;
        case "emissive color":
          result.emissive = this.extractColor(value);
          break;
        case "normal":
          // Handle normal map texture
          if (value && typeof value === "object" && value.type === "texture") {
            result.normalTexture = value.url;
          }
          break;
        case "opacity":
          result.opacity = this.extractScalar(value, 1.0);
          break;
        case "subsurface color":
          result.subsurfaceColor = this.extractColor(value);
          break;
        case "clear coat":
          result.clearCoat = this.extractScalar(value, 0);
          break;
        case "clear coat roughness":
          result.clearCoatRoughness = this.extractScalar(value, 0);
          break;
      }
    });

    return result;
  }

  // ==========================================================================
  // VALUE EXTRACTORS
  // ==========================================================================

  /** Extract a scalar from any value type */
  extractScalar(value, fallback) {
    if (typeof value === "number") return value;
    if (Array.isArray(value)) return value[0];
    return fallback;
  }

  /** Process a value that could be scalar or texture */
  processScalarOrTexture(value, result, scalarKey, textureKey, fallback) {
    // Handle texture objects
    if (value && typeof value === "object" && value.type === "texture") {
      result[textureKey] = value.url;
      result[scalarKey] = 1.0; // Use full range when texture is present
    } else {
      result[scalarKey] = this.extractScalar(value, fallback);
    }
  }

  /** Extract an RGB color from any value type */
  extractColor(value) {
    if (Array.isArray(value)) return value.slice(0, 3);
    if (typeof value === "number") return [value, value, value];
    return null;
  }

  /** Process base color (handles textures and pending operations) */
  processBaseColor(value, result) {
    if (value && typeof value === "object" && value.type === "pending") {
      if (value.operation === "multiply") {
        result.pendingBaseColor = shaderEvaluator.multiplyTextureByColor(
          value.texture,
          value.color
        );
        // Preserve UV tiling from texture
        if (value.texture.uTiling !== undefined) {
          result.baseColorUTiling = value.texture.uTiling;
          result.baseColorVTiling = value.texture.vTiling;
        }
      } else if (value.operation === "lerp_texture_alpha") {
        // Lerp between two colors using texture's grayscale as per-pixel alpha
        result.pendingBaseColor = shaderEvaluator.lerpColorsWithTextureAlpha(
          value.colorA,
          value.colorB,
          value.alphaTexture
        );
      }
    } else if (value && typeof value === "object" && value.type === "texture") {
      result.baseColorTexture = value.url;
      result.baseColor = [1, 1, 1];
      // Extract UV tiling if present
      if (value.uTiling !== undefined) {
        result.baseColorUTiling = value.uTiling;
        result.baseColorVTiling = value.vTiling;
      }
    } else if (Array.isArray(value)) {
      result.baseColor = value.slice(0, 3);
    } else if (typeof value === "number") {
      result.baseColor = [value, value, value];
    }
  }

  // ==========================================================================
  // FINALIZATION
  // ==========================================================================

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
