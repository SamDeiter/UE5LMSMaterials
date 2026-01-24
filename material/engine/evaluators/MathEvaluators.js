/**
 * MathEvaluators
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
  
  // For alpha: check if it's a texture
  let alpha = pinEvaluator(pinAlpha, new Set(visited));
  
  console.log("[Lerp Debug] Raw alpha value:", alpha);
  console.log("[Lerp Debug] valA:", valA, "valB:", valB);
  
  // Check if alpha is a texture - handle both texture objects and URLs
  const isAlphaTexture = alpha && typeof alpha === 'object' && (alpha.type === 'texture' || alpha.url);
  
  // Check if A and B are colors (not textures)
  const isAColor = Array.isArray(valA) || typeof valA === 'number';
  const isBColor = Array.isArray(valB) || typeof valB === 'number';
  
  console.log("[Lerp Debug] isAlphaTexture:", isAlphaTexture, "isAColor:", isAColor, "isBColor:", isBColor);
  
  // If alpha is a texture and A/B are colors, return pending operation for per-pixel lerp
  if (isAlphaTexture && isAColor && isBColor) {
    // Ensure we have a properly formatted texture object with url
    const textureObj = alpha.url ? alpha : { type: 'texture', url: alpha.dataUrl || alpha };
    
    console.log("[Lerp] Creating per-pixel lerp with texture alpha");
    console.log("[Lerp] colorA:", valA, "colorB:", valB);
    console.log("[Lerp] texture url length:", textureObj.url?.length || 'no url');
    
    return {
      type: "pending",
      operation: "lerp_texture_alpha",
      colorA: valA,
      colorB: valB,
      alphaTexture: textureObj
    };
  }
  
  // Otherwise, resolve alpha to a scalar
  if (alpha === null || alpha === undefined) {
    alpha = pinAlpha?.defaultValue ?? 0.5;
  } else if (isAlphaTexture) {
    // Texture without color lerp - default to 0.5
    alpha = 0.5;
  } else if (Array.isArray(alpha)) {
    // Use R channel as alpha
    alpha = alpha[0] ?? 0.5;
  }
  
  console.log("[Lerp] Scalar lerp - A:", valA, "B:", valB, "alpha:", alpha);
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
  const val = pinEvaluator(inputPin, new Set(visited)) ?? 0;
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