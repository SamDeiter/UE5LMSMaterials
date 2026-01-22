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

  // Check for connected UV input and extract tiling
  let uvTiling = { uTiling: 1.0, vTiling: 1.0 };
  const uvPin = node.inputs?.find(p => p.localId === 'uv' || p.name?.toLowerCase() === 'uvs');
  if (uvPin && pinEvaluator) {
    const uvValue = pinEvaluator(uvPin, new Set(visited || []));
    if (uvValue && uvValue.type === 'uv_transform') {
      uvTiling = { uTiling: uvValue.uTiling, vTiling: uvValue.vTiling };
    }
  }

  // For RGB output, return texture or color array with UV tiling info
  if (textureId && textureManager) {
    const texData = textureManager.get(textureId);
    if (texData && texData.dataUrl) {
      return { 
        type: "texture", 
        url: texData.dataUrl,
        uTiling: uvTiling.uTiling,
        vTiling: uvTiling.vTiling
      };
    }
  }

  // Fallback to mid-gray
  return [0.5, 0.5, 0.5];
}

// ============================================================================
// UTILITY NODE EVALUATORS
// ============================================================================

export function evaluateFresnel(pinEvaluator, node, visited) {
  // Fresnel uses Schlick's approximation: F = F0 + (1 - F0) * (1 - N·V)^n
  // For preview, we simulate a viewing angle since we don't have per-pixel camera vector
  
  // Get exponent from connected pin or property
  const expPin = node.inputs?.find(p => p.localId === 'exp_in' || p.name === 'ExponentIn');
  let exponent = node.properties?.Exponent ?? 5.0;
  if (expPin && pinEvaluator) {
    const expVal = pinEvaluator(expPin, new Set(visited || []));
    if (expVal !== null && expVal !== undefined && typeof expVal === 'number' && expVal !== 0) {
      exponent = expVal;
    }
  }
  
  // Get base reflectivity from connected pin or property
  const basePin = node.inputs?.find(p => p.localId === 'base_reflect' || p.name === 'BaseReflect');
  let baseReflect = node.properties?.BaseReflectFraction ?? 0.04;
  if (basePin && pinEvaluator) {
    const baseVal = pinEvaluator(basePin, new Set(visited || []));
    if (baseVal !== null && baseVal !== undefined && typeof baseVal === 'number') {
      baseReflect = baseVal;
    }
  }
  
  // Simulate viewing angle for preview
  // N·V at 45° angle gives a mid-range Fresnel effect visible in viewport
  // This creates a value between baseReflect and 1.0 based on exponent
  const simulatedNdotV = 0.5; // ~60° viewing angle
  const fresnel = baseReflect + (1.0 - baseReflect) * Math.pow(1.0 - simulatedNdotV, exponent);
  
  return fresnel;
}

export function evaluateTime() {
  // Return a time value based on performance.now() for animated materials
  // Scale to reasonable range (~0-10 over 10 seconds for visible animation)
  const timeSeconds = (performance.now() / 1000) % 100;
  return timeSeconds;
}

export function evaluateNoise(pinEvaluator, node, visited) {
  // Simple procedural noise implementation
  // In a real shader this would be 3D Perlin/Simplex noise
  // For preview, we generate a pseudo-random value based on position
  
  const posPin = node.inputs?.find(p => p.localId === 'position' || p.name === 'Position');
  let position = [0, 0, 0];
  if (posPin && pinEvaluator) {
    const posVal = pinEvaluator(posPin, new Set(visited || []));
    if (Array.isArray(posVal)) {
      position = posVal;
    } else if (typeof posVal === 'number') {
      position = [posVal, posVal, posVal];
    }
  }
  
  const scale = node.properties?.Scale ?? 1.0;
  
  // Simple hash-based noise (not true Perlin, but gives variation)
  const hashNoise = (x, y, z) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return n - Math.floor(n);
  };
  
  const scaledPos = [position[0] * scale, position[1] * scale, position[2] * scale];
  const noise = hashNoise(scaledPos[0], scaledPos[1], scaledPos[2]);
  
  return noise;
}

export function evaluateSphereMask(pinEvaluator, node, visited) {
  // SphereMask creates a radial falloff from a center point
  // For preview without world position, return a mid-value
  
  const radius = node.properties?.AttenuationRadius ?? 100.0;
  const hardness = node.properties?.HardnessPercent ?? 0.5;
  
  // Simulate being at mid-distance from sphere center
  const simulatedDistance = radius * 0.5;
  const falloff = radius * (1.0 - hardness);
  const mask = 1.0 - Math.max(0, Math.min(1, (simulatedDistance - radius + falloff) / Math.max(falloff, 0.0001)));
  
  return mask;
}

export function evaluateWorldPosition(node) {
  // WorldPosition returns the world-space position of the current pixel
  // For preview, we simulate positions across the preview sphere
  // These positions will be interpolated across the mesh surface
  
  // Return a representative world position for preview
  // In a real shader, this would come from vertex interpolation
  const scale = node.properties?.V3 ?? 1.0; // Scale multiplier if present
  
  // Simulate a position in world space (center of preview object)
  return [0.0 * scale, 0.0 * scale, 0.0 * scale];
}

export function evaluateBumpOffset(pinEvaluator, node, visited) {
  // BumpOffset performs parallax occlusion mapping
  // It offsets UV coordinates based on height and view angle
  
  const heightPin = node.inputs?.find(p => p.localId === 'height' || p.name === 'Height');
  const coordPin = node.inputs?.find(p => p.localId === 'coordinate' || p.name === 'Coordinate');
  
  // Get height value (0-1 heightmap value)
  let height = 0.5;
  if (heightPin && pinEvaluator) {
    const heightVal = pinEvaluator(heightPin, new Set(visited || []));
    if (typeof heightVal === 'number') {
      height = heightVal;
    } else if (Array.isArray(heightVal)) {
      height = heightVal[0]; // Use R channel
    }
  }
  
  // Get height ratio and reference plane from properties
  const heightRatio = node.properties?.HeightRatio ?? 0.05;
  const referencePlane = node.properties?.ReferencePlane ?? 0.5;
  
  // Get base UV coordinates
  let baseUV = [0, 0];
  if (coordPin && pinEvaluator) {
    const uvVal = pinEvaluator(coordPin, new Set(visited || []));
    if (uvVal && uvVal.type === 'uv_transform') {
      baseUV = [uvVal.uTiling, uvVal.vTiling];
    } else if (Array.isArray(uvVal)) {
      baseUV = [uvVal[0] ?? 0, uvVal[1] ?? 0];
    }
  }
  
  // Calculate UV offset based on height and simulated view angle
  // In a real shader: offset = height * heightRatio * ViewDir.xy
  // For preview, simulate a 45-degree viewing angle
  const simulatedViewXY = [0.5, 0.5]; // Normalized view direction in XY
  const adjustedHeight = height - referencePlane;
  
  const offsetU = adjustedHeight * heightRatio * simulatedViewXY[0];
  const offsetV = adjustedHeight * heightRatio * simulatedViewXY[1];
  
  // Return offset UV coordinates
  return {
    type: "uv_transform",
    uTiling: baseUV[0] + offsetU,
    vTiling: baseUV[1] + offsetV,
    offsetU: offsetU,
    offsetV: offsetV
  };
}

export function evaluateDistance(pinEvaluator, node, visited) {
  // Distance between two vectors
  const pinA = node.inputs?.find(p => p.localId === 'a' || p.name === 'A');
  const pinB = node.inputs?.find(p => p.localId === 'b' || p.name === 'B');
  
  let posA = [0, 0, 0];
  let posB = [0, 0, 0];
  
  if (pinA && pinEvaluator) {
    const valA = pinEvaluator(pinA, new Set(visited || []));
    if (Array.isArray(valA)) posA = valA;
    else if (typeof valA === 'number') posA = [valA, valA, valA];
  }
  
  if (pinB && pinEvaluator) {
    const valB = pinEvaluator(pinB, new Set(visited || []));
    if (Array.isArray(valB)) posB = valB;
    else if (typeof valB === 'number') posB = [valB, valB, valB];
  }
  
  // Calculate Euclidean distance
  const dx = posA[0] - posB[0];
  const dy = posA[1] - (posB[1] ?? 0);
  const dz = posA[2] - (posB[2] ?? 0);
  
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

export function evaluateRotateAboutAxis(pinEvaluator, node, visited) {
  // Rotate a vector about an arbitrary axis
  const posPin = node.inputs?.find(p => p.localId === 'position' || p.name === 'Position');
  const axisPin = node.inputs?.find(p => p.localId === 'axis' || p.name === 'NormalizedRotationAxis');
  const anglePin = node.inputs?.find(p => p.localId === 'angle' || p.name === 'RotationAngle');
  const pivotPin = node.inputs?.find(p => p.localId === 'pivot' || p.name === 'PivotPoint');
  
  let position = [0, 0, 0];
  let axis = [0, 0, 1]; // Default: Z-axis
  let angle = 0;
  let pivot = [0, 0, 0];
  
  if (posPin && pinEvaluator) {
    const val = pinEvaluator(posPin, new Set(visited || []));
    if (Array.isArray(val)) position = val;
  }
  
  if (axisPin && pinEvaluator) {
    const val = pinEvaluator(axisPin, new Set(visited || []));
    if (Array.isArray(val)) axis = val;
  }
  
  if (anglePin && pinEvaluator) {
    const val = pinEvaluator(anglePin, new Set(visited || []));
    if (typeof val === 'number') angle = val;
  }
  
  if (pivotPin && pinEvaluator) {
    const val = pinEvaluator(pivotPin, new Set(visited || []));
    if (Array.isArray(val)) pivot = val;
  }
  
  // Rodrigues' rotation formula
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // Translate to pivot
  const p = [position[0] - pivot[0], position[1] - pivot[1], position[2] - pivot[2]];
  
  // Normalize axis
  const axisLen = Math.sqrt(axis[0]*axis[0] + axis[1]*axis[1] + axis[2]*axis[2]);
  const k = axisLen > 0 ? [axis[0]/axisLen, axis[1]/axisLen, axis[2]/axisLen] : [0, 0, 1];
  
  // Cross product k × p
  const kCrossP = [
    k[1] * p[2] - k[2] * p[1],
    k[2] * p[0] - k[0] * p[2],
    k[0] * p[1] - k[1] * p[0]
  ];
  
  // Dot product k · p
  const kDotP = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
  
  // Apply rotation
  const rotated = [
    p[0] * cos + kCrossP[0] * sin + k[0] * kDotP * (1 - cos) + pivot[0],
    p[1] * cos + kCrossP[1] * sin + k[1] * kDotP * (1 - cos) + pivot[1],
    p[2] * cos + kCrossP[2] * sin + k[2] * kDotP * (1 - cos) + pivot[2]
  ];
  
  return rotated;
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
  if (nodeKey === "WorldPosition" || nodeKey === "ObjectPosition" || nodeKey === "ActorPosition") {
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
  if (nodeKey === "SimplexNoise" || nodeKey === "VoronoiNoise" || nodeKey === "GradientNoise") {
    return evaluateNoise(pinEvaluator, node, visited);
  }
  
  // MakeFloat nodes - construct vectors from scalars
  if (nodeKey === "MakeFloat2") {
    const pinR = node.inputs.find(p => p.localId === 'r' || p.name === 'R');
    const pinG = node.inputs.find(p => p.localId === 'g' || p.name === 'G');
    const r = pinEvaluator(pinR, new Set(visited || [])) ?? 0;
    const g = pinEvaluator(pinG, new Set(visited || [])) ?? 0;
    return [r, g];
  }
  if (nodeKey === "MakeFloat3") {
    const pinR = node.inputs.find(p => p.localId === 'r' || p.name === 'R');
    const pinG = node.inputs.find(p => p.localId === 'g' || p.name === 'G');
    const pinB = node.inputs.find(p => p.localId === 'b' || p.name === 'B');
    const r = pinEvaluator(pinR, new Set(visited || [])) ?? 0;
    const g = pinEvaluator(pinG, new Set(visited || [])) ?? 0;
    const b = pinEvaluator(pinB, new Set(visited || [])) ?? 0;
    return [r, g, b];
  }
  if (nodeKey === "MakeFloat4") {
    const pinR = node.inputs.find(p => p.localId === 'r' || p.name === 'R');
    const pinG = node.inputs.find(p => p.localId === 'g' || p.name === 'G');
    const pinB = node.inputs.find(p => p.localId === 'b' || p.name === 'B');
    const pinA = node.inputs.find(p => p.localId === 'a' || p.name === 'A');
    const r = pinEvaluator(pinR, new Set(visited || [])) ?? 0;
    const g = pinEvaluator(pinG, new Set(visited || [])) ?? 0;
    const b = pinEvaluator(pinB, new Set(visited || [])) ?? 0;
    const a = pinEvaluator(pinA, new Set(visited || [])) ?? 1;
    return [r, g, b, a];
  }
  
  // BreakFloat nodes - extract components from vectors
  if (nodeKey === "BreakOutFloat2Components" || nodeKey === "BreakOutFloat3Components" || nodeKey === "BreakOutFloat4Components") {
    const inputPin = node.inputs.find(p => p.localId === 'in' || p.name === '');
    const val = pinEvaluator(inputPin, new Set(visited || [])) ?? [0, 0, 0];
    const arr = Array.isArray(val) ? val : [val, val, val];
    
    const outputPinId = outputPin?.localId?.toLowerCase() || 'r';
    if (outputPinId === 'r') return arr[0] ?? 0;
    if (outputPinId === 'g') return arr[1] ?? 0;
    if (outputPinId === 'b') return arr[2] ?? 0;
    if (outputPinId === 'a') return arr[3] ?? 1;
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
