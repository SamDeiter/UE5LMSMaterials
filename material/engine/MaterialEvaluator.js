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
    if (!link || !link.sourcePin) return null;

    const sourceNode = [...this.graph.nodes.values()].find((n) =>
      n.outputs.some((p) => p.id === link.sourcePin.id),
    );
    if (!sourceNode) return null;

    // Delegate to node dispatcher
    return dispatchNodeEvaluation(
      this.evaluatePin.bind(this),
      sourceNode,
      link.outputPin,
      visited,
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
      (n) => n.type === "main-output",
    );
    if (!mainNode) return null;

    // Read material settings from DOM
    const shadingModelEl =
      typeof document !== "undefined"
        ? document.getElementById("shading-model")
        : null;
    const blendModeEl =
      typeof document !== "undefined"
        ? document.getElementById("blend-mode")
        : null;
    const shadingModel = shadingModelEl ? shadingModelEl.value : "DefaultLit";
    const blendMode = blendModeEl ? blendModeEl.value : "Opaque";

    const result = {
      // Material settings
      shadingModel,
      blendMode,
      // PBR properties
      // PBR properties
      baseColor: [0.0, 0.0, 0.0], // Default BLACK when nothing connected (UE5 behavior)
      metallic: 0,
      specular: 0.5,
      roughness: 0.5,
      anisotropy: 0,
      emissive: null,
      opacity: 1.0,
      ao: 1.0,
      emissiveIntensity: 1.0,
      // Shading model specific
      subsurfaceColor: null,
      clearCoat: 0,
      clearCoatRoughness: 0,
      // Texture maps
      baseColorTexture: null,
      roughnessTexture: null,
      metallicTexture: null,
      specularTexture: null,
      normalTexture: null,
      aoTexture: null,
      emissiveTexture: null,
      // Tiling info
      baseColorUTiling: 1,
      baseColorVTiling: 1,
      roughnessUTiling: 1,
      roughnessVTiling: 1,
      metallicUTiling: 1,
      metallicVTiling: 1,
      specularUTiling: 1,
      specularVTiling: 1,
      normalUTiling: 1,
      normalVTiling: 1,
      aoUTiling: 1,
      aoVTiling: 1,
      emissiveUTiling: 1,
      emissiveVTiling: 1,
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
          this.processScalarOrTexture(
            value,
            result,
            "metallic",
            "metallicTexture",
            0,
          );
          break;
        case "specular":
          this.processScalarOrTexture(
            value,
            result,
            "specular",
            "specularTexture",
            0.5,
          );
          break;
        case "roughness":
          this.processScalarOrTexture(
            value,
            result,
            "roughness",
            "roughnessTexture",
            0.5,
          );
          break;
        case "anisotropy":
          result.anisotropy = this.extractScalar(value, 0);
          break;
        case "emissive color":
          this.processEmissive(value, result);
          break;
        case "normal":
          this.processScalarOrTexture(
            value,
            result,
            null,
            "normalTexture",
            null,
          );
          break;
        case "ambient occlusion":
          this.processScalarOrTexture(value, result, "ao", "aoTexture", 1.0);
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
    if (value && typeof value === "object" && value.type === "texture") {
      result[textureKey] = value.url;
      if (scalarKey) result[scalarKey] = 1.0;

      // Extract tiling
      const tilingPrefix = textureKey.replace("Texture", "");
      result[`${tilingPrefix}UTiling`] = value.uTiling ?? 1.0;
      result[`${tilingPrefix}VTiling`] = value.vTiling ?? 1.0;
    } else {
      if (scalarKey) result[scalarKey] = this.extractScalar(value, fallback);
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
          value.color,
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
          value.alphaTexture,
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

  /** Process emissive color (handles textures, colors, and pending operations like Multiply) */
  processEmissive(value, result) {
    if (value && typeof value === "object" && value.type === "pending") {
      // Handle Multiply and other operations
      if (value.operation === "multiply") {
        result.pendingEmissive = shaderEvaluator.multiplyTextureByColor(
          value.texture,
          value.color,
        );
        if (value.texture.uTiling !== undefined) {
          result.emissiveUTiling = value.texture.uTiling;
          result.emissiveVTiling = value.texture.vTiling;
        }
      } else if (value.operation === "lerp_texture_alpha") {
        result.pendingEmissive = shaderEvaluator.lerpColorsWithTextureAlpha(
          value.colorA,
          value.colorB,
          value.alphaTexture,
        );
      }
      result.emissive = [1, 1, 1]; // White base for texture modulation
      result.emissiveIntensity = 1.0;
    } else if (value && typeof value === "object" && value.type === "texture") {
      // Direct texture
      result.emissiveTexture = value.url;
      result.emissive = [1, 1, 1];
      result.emissiveIntensity = 1.0;
      if (value.uTiling !== undefined) {
        result.emissiveUTiling = value.uTiling;
        result.emissiveVTiling = value.vTiling;
      }
    } else if (Array.isArray(value)) {
      // Direct color array - HDR values allowed
      result.emissive = value.slice(0, 3);
      // Calculate intensity from max component if HDR
      const maxVal = Math.max(...result.emissive);
      if (maxVal > 1) {
        result.emissiveIntensity = maxVal;
        result.emissive = result.emissive.map((v) => v / maxVal);
      } else {
        result.emissiveIntensity = 1.0;
      }
    } else if (typeof value === "number") {
      result.emissive = [value, value, value];
      result.emissiveIntensity = value > 1 ? value : 1.0;
      if (value > 1) {
        result.emissive = [1, 1, 1];
      }
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
        console.warn("Failed to process base color texture operation:", e);
      }
      delete result.pendingBaseColor;
    }

    if (result.pendingEmissive) {
      try {
        const texture = await result.pendingEmissive;
        if (texture && texture.url) {
          result.emissiveTexture = texture.url;
          result.emissive = [1, 1, 1];
          result.emissiveIntensity = 1.0;
        }
      } catch (e) {
        console.warn("Failed to process emissive texture operation:", e);
      }
      delete result.pendingEmissive;
    }

    if (viewport) {
      viewport.updateMaterial(result);
    }
  }
}
