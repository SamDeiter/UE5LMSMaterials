/**
 * NodeEvaluators.js
 *
 * Node-specific evaluation logic for the material graph.
 * Each evaluator handles a specific category of nodes.
 */

import { textureManager } from "./TextureManager.js";
import {
  multiplyValues,
  addValues,
  subtractValues,
  divideValues,
  lerpValues,
  applyUnary,
  applyBinary,
} from "./MathUtils.js";

// ============================================================================
// CONSTANT NODE EVALUATORS
// ============================================================================

export function evaluateConstant(node) {
  return node.properties.R ?? node.properties.DefaultValue ?? 0;
}

export function evaluateConstant3Vector(node) {
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
  return [
    node.properties.R ?? 1,
    node.properties.G ?? 1,
    node.properties.B ?? 1,
    node.properties.A ?? 1,
  ];
}

// ============================================================================
// MATH NODE EVALUATORS
// ============================================================================

export function evaluateMultiply(pinEvaluator, node, visited) {
  const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
  const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
  const valA = pinEvaluator(pinA, new Set(visited)) ?? 1;
  const valB = pinEvaluator(pinB, new Set(visited)) ?? 1;

  const isTexA = valA && typeof valA === "object" && valA.type === "texture";
  const isTexB = valB && typeof valB === "object" && valB.type === "texture";

  // Handle texture × color
  if (isTexA && !isTexB) {
    return { type: "pending", operation: "multiply", texture: valA, color: valB };
  }
  if (isTexB && !isTexA) {
    return { type: "pending", operation: "multiply", texture: valB, color: valA };
  }
  if (isTexA && isTexB) {
    return valA;
  }

  return multiplyValues(valA, valB);
}

export function evaluateBinaryOp(pinEvaluator, node, visited, operation, defaultVal) {
  const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
  const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
  const valA = pinEvaluator(pinA, new Set(visited)) ?? defaultVal;
  const valB = pinEvaluator(pinB, new Set(visited)) ?? defaultVal;
  return operation(valA, valB);
}

export function evaluateLerp(pinEvaluator, node, visited) {
  const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
  const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
  const pinAlpha = node.inputs.find((p) => p.localId === "alpha" || p.name === "Alpha");
  
  // Use pin.defaultValue if not connected, fallback to 0
  const valA = pinEvaluator(pinA, new Set(visited)) ?? pinA?.defaultValue ?? 0;
  const valB = pinEvaluator(pinB, new Set(visited)) ?? pinB?.defaultValue ?? 0;
  
  // For alpha: if connected to texture, extract scalar from result
  let alpha = pinEvaluator(pinAlpha, new Set(visited));
  if (alpha === null || alpha === undefined) {
    alpha = pinAlpha?.defaultValue ?? 0.5;
  } else if (typeof alpha === 'object' && alpha.url) {
    // Texture - default to 0.5 for now (would need actual sampling)
    alpha = 0.5;
  } else if (Array.isArray(alpha)) {
    // Use R channel as alpha
    alpha = alpha[0] ?? 0.5;
  }
  
  console.log("[Lerp] A:", valA, "B:", valB, "alpha:", alpha);
  return lerpValues(valA, valB, alpha);
}

export function evaluateUnaryOp(pinEvaluator, node, visited, fn) {
  const inputPin = node.inputs.find(
    (p) => p.localId === "in" || p.localId === "input" || p.name === "Input" || p.name === "" || p.localId === "x"
  );
  const val = pinEvaluator(inputPin, new Set(visited)) ?? 0;
  return applyUnary(val, fn);
}

export function evaluateBinaryMath(pinEvaluator, node, visited, fn) {
  const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
  const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
  const valA = pinEvaluator(pinA, new Set(visited)) ?? 0;
  const valB = pinEvaluator(pinB, new Set(visited)) ?? 0;
  return applyBinary(valA, valB, fn);
}

export function evaluateClamp(pinEvaluator, node, visited) {
  const inputPin = node.inputs.find(
    (p) => p.localId === "value" || p.localId === "input" || p.name === "Input" || p.name === "Value"
  );
  const minPin = node.inputs.find((p) => p.localId === "min" || p.name === "Min");
  const maxPin = node.inputs.find((p) => p.localId === "max" || p.name === "Max");
  let val = pinEvaluator(inputPin, new Set(visited)) ?? 0;
  const minVal = pinEvaluator(minPin, new Set(visited)) ?? 0;
  const maxVal = pinEvaluator(maxPin, new Set(visited)) ?? 1;
  if (typeof val === "number") {
    return Math.max(minVal, Math.min(maxVal, val));
  }
  return val;
}

export function evaluatePower(pinEvaluator, node, visited) {
  const basePin = node.inputs.find((p) => p.localId === "base" || p.name === "Base");
  const expPin = node.inputs.find((p) => p.localId === "exponent" || p.name === "Exp");
  const base = pinEvaluator(basePin, new Set(visited)) ?? 1;
  const exp = pinEvaluator(expPin, new Set(visited)) ?? node.properties?.Exponent ?? 2;
  return applyUnary(base, (v) => Math.pow(v, exp));
}

// ============================================================================
// TEXTURE NODE EVALUATORS
// ============================================================================

export function evaluateTextureSample(node, outputPin) {
  let textureId = node.properties?.TextureAsset || node.properties?.texture;

  if (!textureId && textureManager) {
    textureId = "checkerboard";
  }

  // Check which output pin is being used
  const pinId = outputPin?.localId?.toLowerCase() || outputPin?.name?.toLowerCase() || 'rgb';
  
  // For individual channel pins, return a scalar value
  // In a real implementation, this would sample the texture
  // For preview, we return mid-gray (0.5) for channels
  if (pinId === 'r') {
    return 0.5; // Red channel as scalar
  }
  if (pinId === 'g') {
    return 0.5; // Green channel as scalar
  }
  if (pinId === 'b') {
    return 0.5; // Blue channel as scalar
  }
  if (pinId === 'a') {
    return 1.0; // Alpha channel as scalar (default opaque)
  }

  // For RGB output, return texture or color array
  if (textureId && textureManager) {
    const texData = textureManager.get(textureId);
    if (texData && texData.dataUrl) {
      return { type: "texture", url: texData.dataUrl };
    }
  }

  // Fallback to mid-gray
  return [0.5, 0.5, 0.5];
}

// ============================================================================
// UTILITY NODE EVALUATORS
// ============================================================================

export function evaluateFresnel(node) {
  return 0.5; // Approximate for preview
}

// ============================================================================
// NODE DISPATCHER
// ============================================================================

/**
 * Dispatch node evaluation to the appropriate evaluator
 */
export function dispatchNodeEvaluation(pinEvaluator, node, outputPin, visited) {
  const nodeKey = node.nodeKey || node.type;

  // Constants
  if (nodeKey === "Constant" || nodeKey === "ScalarParameter") {
    return evaluateConstant(node);
  }
  if (nodeKey === "Constant3Vector" || nodeKey === "VectorParameter") {
    return evaluateConstant3Vector(node);
  }
  if (nodeKey === "Constant2Vector") {
    return evaluateConstant2Vector(node);
  }
  if (nodeKey === "Constant4Vector") {
    return evaluateConstant4Vector(node);
  }

  // Math operations
  if (nodeKey === "Multiply") {
    return evaluateMultiply(pinEvaluator, node, visited);
  }
  if (nodeKey === "Add") {
    return evaluateBinaryOp(pinEvaluator, node, visited, addValues, 0);
  }
  if (nodeKey === "Subtract") {
    return evaluateBinaryOp(pinEvaluator, node, visited, subtractValues, 0);
  }
  if (nodeKey === "Divide") {
    return evaluateBinaryOp(pinEvaluator, node, visited, divideValues, 1);
  }
  if (nodeKey === "Lerp" || nodeKey === "LinearInterpolate") {
    return evaluateLerp(pinEvaluator, node, visited);
  }
  if (nodeKey === "Max") {
    return evaluateBinaryMath(pinEvaluator, node, visited, Math.max);
  }
  if (nodeKey === "Min") {
    return evaluateBinaryMath(pinEvaluator, node, visited, Math.min);
  }
  if (nodeKey === "Clamp") {
    return evaluateClamp(pinEvaluator, node, visited);
  }
  if (nodeKey === "Power") {
    return evaluatePower(pinEvaluator, node, visited);
  }

  // Unary math
  if (nodeKey === "OneMinus") {
    return evaluateUnaryOp(pinEvaluator, node, visited, (v) => 1 - v);
  }
  if (nodeKey === "Abs") {
    return evaluateUnaryOp(pinEvaluator, node, visited, Math.abs);
  }
  if (nodeKey === "Saturate") {
    return evaluateUnaryOp(pinEvaluator, node, visited, (v) => Math.max(0, Math.min(1, v)));
  }
  if (nodeKey === "Sin") {
    return evaluateUnaryOp(pinEvaluator, node, visited, Math.sin);
  }
  if (nodeKey === "Cos") {
    return evaluateUnaryOp(pinEvaluator, node, visited, Math.cos);
  }
  if (nodeKey === "Floor") {
    return evaluateUnaryOp(pinEvaluator, node, visited, Math.floor);
  }
  if (nodeKey === "Ceil") {
    return evaluateUnaryOp(pinEvaluator, node, visited, Math.ceil);
  }
  if (nodeKey === "Frac") {
    return evaluateUnaryOp(pinEvaluator, node, visited, (v) => v - Math.floor(v));
  }
  if (nodeKey === "SquareRoot") {
    return evaluateUnaryOp(pinEvaluator, node, visited, (v) => Math.sqrt(Math.max(0, v)));
  }

  // Textures
  if (nodeKey === "TextureSample" || nodeKey === "TextureParameter") {
    return evaluateTextureSample(node, outputPin);
  }

  // Utility
  if (nodeKey === "Fresnel") {
    return evaluateFresnel(node);
  }

  // Default: try properties
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

  console.warn(`Node type "${nodeKey}" not evaluated, using fallback.`);
  return 0.5;
}
