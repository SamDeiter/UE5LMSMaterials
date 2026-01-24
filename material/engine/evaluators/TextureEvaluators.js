/**
 * TextureEvaluators
 * 
 * Extracted from NodeEvaluators.js for modularity.
 */

import { textureManager } from "../TextureManager.js";
import {
  multiplyValues,
  addValues,
  subtractValues,
  divideValues,
  lerpValues,
  applyUnary,
  applyBinary,
} from "../MathUtils.js";

// TEXTURE NODE EVALUATORS
// ============================================================================

export function evaluateTextureCoordinate(node) {
  // Return UV scaling information that can be used by TextureSample
  return {
    type: "uv_transform",
    uTiling: node.properties?.UTiling ?? 1.0,
    vTiling: node.properties?.VTiling ?? 1.0,
    coordinateIndex: node.properties?.CoordinateIndex ?? 0
  };
}

export function evaluateTextureSample(node, outputPin, pinEvaluator, visited) {
  let textureId = node.properties?.TextureAsset || node.properties?.texture;

  if (!textureId && textureManager) {
    textureId = "checkerboard";
  }

  // Check which output pin is being used
  const pinId = outputPin?.localId?.toLowerCase() || outputPin?.name?.toLowerCase() || 'rgb';
  
  // Check for connected UV input and extract tiling
  let uvTiling = { uTiling: 1.0, vTiling: 1.0 };
  const uvPin = node.inputs?.find(p => p.localId === 'uv' || p.name?.toLowerCase() === 'uvs');
  if (uvPin && pinEvaluator) {
    const uvValue = pinEvaluator(uvPin, new Set(visited || []));
    if (uvValue && uvValue.type === 'uv_transform') {
      uvTiling = { uTiling: uvValue.uTiling, vTiling: uvValue.vTiling };
    }
  }

  // Handle texture sample
  let result = [0.5, 0.5, 0.5];
  if (textureId && textureManager) {
    const texData = textureManager.get(textureId);
    if (texData && texData.dataUrl) {
      result = { 
        type: "texture", 
        url: texData.dataUrl,
        uTiling: uvTiling.uTiling,
        vTiling: uvTiling.vTiling
      };
    }
  }

  // If sampling a specific channel, return the texture object with a channel hint
  if (['r', 'g', 'b', 'a'].includes(pinId)) {
    if (typeof result === 'object' && result.type === 'texture') {
      return { ...result, channel: pinId };
    }
    // Fallback if no texture map
    return 0.5;
  }

  return result;
}

// ============================================================================