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