/**
 * NodeDispatcher
 *
 * Main dispatcher that routes node evaluation to appropriate evaluators.
 */

import { addValues, subtractValues, divideValues } from "../MathUtils.js";

// Import evaluators from sibling modules
import {
  evaluateConstant,
  evaluateConstant2Vector,
  evaluateConstant3Vector,
  evaluateConstant4Vector,
} from "./ConstantEvaluators.js";

import {
  evaluateMultiply,
  evaluateBinaryOp,
  evaluateLerp,
  evaluateUnaryOp,
  evaluateBinaryMath,
  evaluateClamp,
  evaluatePower,
} from "./MathEvaluators.js";

import {
  evaluateTextureCoordinate,
  evaluateTextureSample,
} from "./TextureEvaluators.js";

import {
  evaluateFresnel,
  evaluateTime,
  evaluateNoise,
  evaluateSphereMask,
  evaluateWorldPosition,
  evaluateBumpOffset,
  evaluateDistance,
  evaluateRotateAboutAxis,
} from "./UtilityEvaluators.js";

import {
  evaluateSubstrateSlabBSDF,
  evaluateSubstrateVerticalLayer,
  evaluateSubstrateHorizontalBlend,
  evaluateSubstrateUnlitBSDF,
  evaluateSubstrateMetalnessHelper,
  evaluateSubstrateLegacyConversion,
} from "./SubstrateEvaluators.js";

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
    return evaluateUnaryOp(pinEvaluator, node, visited, (v) =>
      Math.max(0, Math.min(1, v)),
    );
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
    return evaluateUnaryOp(
      pinEvaluator,
      node,
      visited,
      (v) => v - Math.floor(v),
    );
  }
  if (nodeKey === "SquareRoot") {
    return evaluateUnaryOp(pinEvaluator, node, visited, (v) =>
      Math.sqrt(Math.max(0, v)),
    );
  }

  // Textures
  if (nodeKey === "TextureCoordinate" || nodeKey === "TexCoord") {
    return evaluateTextureCoordinate(node);
  }
  if (nodeKey === "TextureSample" || nodeKey === "TextureParameter") {
    return evaluateTextureSample(node, outputPin, pinEvaluator, visited);
  }

  // Utility
  if (nodeKey === "Fresnel") {
    return evaluateFresnel(pinEvaluator, node, visited);
  }
  if (nodeKey === "Time") {
    return evaluateTime();
  }
  if (nodeKey === "Noise") {
    return evaluateNoise(pinEvaluator, node, visited);
  }
  if (nodeKey === "SphereMask") {
    return evaluateSphereMask(pinEvaluator, node, visited);
  }
  if (
    nodeKey === "WorldPosition" ||
    nodeKey === "ObjectPosition" ||
    nodeKey === "ActorPosition"
  ) {
    return evaluateWorldPosition(node);
  }
  if (nodeKey === "BumpOffset") {
    return evaluateBumpOffset(pinEvaluator, node, visited);
  }
  if (nodeKey === "Distance") {
    return evaluateDistance(pinEvaluator, node, visited);
  }
  if (nodeKey === "RotateAboutAxis") {
    return evaluateRotateAboutAxis(pinEvaluator, node, visited);
  }
  if (nodeKey === "CameraVector") {
    // Return normalized camera direction (approximate for preview)
    return [0, 0, 1];
  }
  if (nodeKey === "PixelNormalWS") {
    // Return world-space normal (up direction for preview)
    return [0, 0, 1];
  }

  // Noise variants - all use the same evaluator with different parameters
  if (
    nodeKey === "SimplexNoise" ||
    nodeKey === "VoronoiNoise" ||
    nodeKey === "GradientNoise"
  ) {
    return evaluateNoise(pinEvaluator, node, visited);
  }

  // Substrate nodes (UE5.1+)
  if (nodeKey === "SubstrateSlabBSDF") {
    return evaluateSubstrateSlabBSDF(pinEvaluator, node, visited);
  }
  if (nodeKey === "SubstrateVerticalLayer") {
    return evaluateSubstrateVerticalLayer(pinEvaluator, node, visited);
  }
  if (nodeKey === "SubstrateHorizontalBlend") {
    return evaluateSubstrateHorizontalBlend(pinEvaluator, node, visited);
  }
  if (nodeKey === "SubstrateUnlitBSDF") {
    return evaluateSubstrateUnlitBSDF(pinEvaluator, node, visited);
  }
  if (nodeKey === "SubstrateMetalnessHelper") {
    return evaluateSubstrateMetalnessHelper(
      pinEvaluator,
      node,
      outputPin,
      visited,
    );
  }
  if (nodeKey === "SubstrateLegacyConversion") {
    return evaluateSubstrateLegacyConversion(pinEvaluator, node, visited);
  }

  // MakeFloat nodes - construct vectors from scalars
  if (nodeKey === "MakeFloat2") {
    const pinR = node.inputs.find((p) => p.localId === "r" || p.name === "R");
    const pinG = node.inputs.find((p) => p.localId === "g" || p.name === "G");
    const r = pinEvaluator(pinR, new Set(visited || [])) ?? 0;
    const g = pinEvaluator(pinG, new Set(visited || [])) ?? 0;
    return [r, g];
  }
  if (nodeKey === "MakeFloat3") {
    const pinR = node.inputs.find((p) => p.localId === "r" || p.name === "R");
    const pinG = node.inputs.find((p) => p.localId === "g" || p.name === "G");
    const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
    const r = pinEvaluator(pinR, new Set(visited || [])) ?? 0;
    const g = pinEvaluator(pinG, new Set(visited || [])) ?? 0;
    const b = pinEvaluator(pinB, new Set(visited || [])) ?? 0;
    return [r, g, b];
  }
  if (nodeKey === "MakeFloat4") {
    const pinR = node.inputs.find((p) => p.localId === "r" || p.name === "R");
    const pinG = node.inputs.find((p) => p.localId === "g" || p.name === "G");
    const pinB = node.inputs.find((p) => p.localId === "b" || p.name === "B");
    const pinA = node.inputs.find((p) => p.localId === "a" || p.name === "A");
    const r = pinEvaluator(pinR, new Set(visited || [])) ?? 0;
    const g = pinEvaluator(pinG, new Set(visited || [])) ?? 0;
    const b = pinEvaluator(pinB, new Set(visited || [])) ?? 0;
    const a = pinEvaluator(pinA, new Set(visited || [])) ?? 1;
    return [r, g, b, a];
  }

  // BreakFloat nodes - extract components from vectors
  if (
    nodeKey === "BreakOutFloat2Components" ||
    nodeKey === "BreakOutFloat3Components" ||
    nodeKey === "BreakOutFloat4Components"
  ) {
    const inputPin = node.inputs.find(
      (p) => p.localId === "in" || p.name === "",
    );
    const val = pinEvaluator(inputPin, new Set(visited || [])) ?? [0, 0, 0];
    const arr = Array.isArray(val) ? val : [val, val, val];

    const outputPinId = outputPin?.localId?.toLowerCase() || "r";
    if (outputPinId === "r") return arr[0] ?? 0;
    if (outputPinId === "g") return arr[1] ?? 0;
    if (outputPinId === "b") return arr[2] ?? 0;
    if (outputPinId === "a") return arr[3] ?? 1;
    return arr;
  }

  // StaticBoolParameter
  if (nodeKey === "StaticBoolParameter") {
    return node.properties?.DefaultValue ? 1 : 0;
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
