/**
 * ConstantEvaluators
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

// CONSTANT NODE EVALUATORS
// ============================================================================

export function evaluateConstant(node) {
  return node.properties.R ?? node.properties.DefaultValue ?? 0;
}

export function evaluateConstant3Vector(node) {
  // Support both nested Color object and individual R, G, B properties
  if (node.properties.Color && typeof node.properties.Color === 'object') {
    return [
      node.properties.Color.R ?? 1,
      node.properties.Color.G ?? 1,
      node.properties.Color.B ?? 1,
    ];
  }
  // Fallback to old-style properties
  return [
    node.properties.R ?? 1,
    node.properties.G ?? 1,
    node.properties.B ?? 1,
  ];
}

export function evaluateConstant2Vector(node) {
  return [node.properties.R ?? 0, node.properties.G ?? 0];
}

export function evaluateConstant4Vector(node) {
  // Support both nested Color object and individual R, G, B, A properties
  if (node.properties.Color && typeof node.properties.Color === 'object') {
    return [
      node.properties.Color.R ?? 1,
      node.properties.Color.G ?? 1,
      node.properties.Color.B ?? 1,
      node.properties.A ?? 1,
    ];
  }
  // Fallback to old-style properties
  return [
    node.properties.R ?? 1,
    node.properties.G ?? 1,
    node.properties.B ?? 1,
    node.properties.A ?? 1,
  ];
}

// ============================================================================