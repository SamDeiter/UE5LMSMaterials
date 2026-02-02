/**
 * UtilityEvaluators
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
  // 3D Perlin noise implementation for authentic procedural noise
  // Matches UE5's Noise node behavior more closely than hash-based approximation
  
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
  const scaledPos = [position[0] * scale, position[1] * scale, position[2] * scale];
  
  // Use Perlin noise for smooth, continuous procedural noise
  const noise = perlin3D(scaledPos[0], scaledPos[1], scaledPos[2]);
  
  // Perlin returns -1 to 1, normalize to 0 to 1 like UE5
  return (noise + 1) * 0.5;
}

// ============================================================================
// PERLIN NOISE IMPLEMENTATION
// ============================================================================

// Permutation table for Perlin noise (standard 256-element permutation)
const PERLIN_PERM = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];

// Double the permutation to avoid overflow
const PERLIN_P = [...PERLIN_PERM, ...PERLIN_PERM];

// Gradient vectors for 3D Perlin noise
const PERLIN_GRAD3 = [
  [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
  [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
  [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
];

// Fade function: 6t^5 - 15t^4 + 10t^3 (improved Perlin smoothstep)
function perlinFade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Linear interpolation
function perlinLerp(a, b, t) {
  return a + t * (b - a);
}

// Gradient function for 3D
function perlinGrad3(hash, x, y, z) {
  const g = PERLIN_GRAD3[hash % 12];
  return g[0] * x + g[1] * y + g[2] * z;
}

/**
 * 3D Perlin noise function
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @returns {number} Noise value in range [-1, 1]
 */
function perlin3D(x, y, z) {
  // Find unit grid cell containing point
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  
  // Get relative xyz coordinates of point within cell
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  
  // Compute fade curves for each coordinate
  const u = perlinFade(xf);
  const v = perlinFade(yf);
  const w = perlinFade(zf);
  
  // Hash coordinates of the 8 cube corners
  const A = PERLIN_P[X] + Y;
  const AA = PERLIN_P[A] + Z;
  const AB = PERLIN_P[A + 1] + Z;
  const B = PERLIN_P[X + 1] + Y;
  const BA = PERLIN_P[B] + Z;
  const BB = PERLIN_P[B + 1] + Z;
  
  // Add blended results from 8 corners of cube
  return perlinLerp(
    perlinLerp(
      perlinLerp(
        perlinGrad3(PERLIN_P[AA], xf, yf, zf),
        perlinGrad3(PERLIN_P[BA], xf - 1, yf, zf),
        u
      ),
      perlinLerp(
        perlinGrad3(PERLIN_P[AB], xf, yf - 1, zf),
        perlinGrad3(PERLIN_P[BB], xf - 1, yf - 1, zf),
        u
      ),
      v
    ),
    perlinLerp(
      perlinLerp(
        perlinGrad3(PERLIN_P[AA + 1], xf, yf, zf - 1),
        perlinGrad3(PERLIN_P[BA + 1], xf - 1, yf, zf - 1),
        u
      ),
      perlinLerp(
        perlinGrad3(PERLIN_P[AB + 1], xf, yf - 1, zf - 1),
        perlinGrad3(PERLIN_P[BB + 1], xf - 1, yf - 1, zf - 1),
        u
      ),
      v
    ),
    w
  );
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