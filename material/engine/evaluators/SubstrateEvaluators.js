/**
 * SubstrateEvaluators
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

// SUBSTRATE NODE EVALUATORS (UE5.1+)
// ============================================================================

/**
 * Evaluate a Substrate Slab BSDF node
 * Returns a BSDF closure object that can be used for preview rendering
 */
export function evaluateSubstrateSlabBSDF(pinEvaluator, node, visited) {
  // Get input values
  const diffusePin = node.inputs?.find(p => p.localId === 'diffuse_albedo');
  const f0Pin = node.inputs?.find(p => p.localId === 'f0');
  const f90Pin = node.inputs?.find(p => p.localId === 'f90');
  const roughnessPin = node.inputs?.find(p => p.localId === 'roughness');
  const coveragePin = node.inputs?.find(p => p.localId === 'coverage');
  const fuzzAmountPin = node.inputs?.find(p => p.localId === 'fuzz_amount');
  const fuzzColorPin = node.inputs?.find(p => p.localId === 'fuzz_color');
  
  const diffuseAlbedo = pinEvaluator?.(diffusePin, new Set(visited || [])) ?? [0.5, 0.5, 0.5];
  const f0 = pinEvaluator?.(f0Pin, new Set(visited || [])) ?? [0.04, 0.04, 0.04];
  const f90 = pinEvaluator?.(f90Pin, new Set(visited || [])) ?? [1.0, 1.0, 1.0];
  const roughness = pinEvaluator?.(roughnessPin, new Set(visited || [])) ?? 0.5;
  const coverage = pinEvaluator?.(coveragePin, new Set(visited || [])) ?? 1.0;
  const fuzzAmount = pinEvaluator?.(fuzzAmountPin, new Set(visited || [])) ?? 0.0;
  const fuzzColor = pinEvaluator?.(fuzzColorPin, new Set(visited || [])) ?? [1.0, 1.0, 1.0];
  
  // Return Substrate BSDF closure for preview
  return {
    type: 'substrate_bsdf',
    diffuseAlbedo: Array.isArray(diffuseAlbedo) ? diffuseAlbedo : [diffuseAlbedo, diffuseAlbedo, diffuseAlbedo],
    f0: Array.isArray(f0) ? f0 : [f0, f0, f0],
    f90: Array.isArray(f90) ? f90 : [f90, f90, f90],
    roughness: typeof roughness === 'number' ? roughness : 0.5,
    coverage: typeof coverage === 'number' ? coverage : 1.0,
    fuzzAmount: typeof fuzzAmount === 'number' ? fuzzAmount : 0.0,
    fuzzColor: Array.isArray(fuzzColor) ? fuzzColor : [fuzzColor, fuzzColor, fuzzColor],
  };
}

/**
 * Evaluate Substrate Vertical Layer - layers one BSDF on top of another
 */
export function evaluateSubstrateVerticalLayer(pinEvaluator, node, visited) {
  const topPin = node.inputs?.find(p => p.localId === 'top');
  const bottomPin = node.inputs?.find(p => p.localId === 'bottom');
  const thicknessPin = node.inputs?.find(p => p.localId === 'thickness');
  
  const top = pinEvaluator?.(topPin, new Set(visited || []));
  const bottom = pinEvaluator?.(bottomPin, new Set(visited || []));
  const thickness = pinEvaluator?.(thicknessPin, new Set(visited || [])) ?? 1.0;
  
  // Blend top and bottom based on thickness (simplified model)
  // Real implementation would use Beer-Lambert absorption
  const topBsdf = top?.type === 'substrate_bsdf' ? top : { diffuseAlbedo: [0.5, 0.5, 0.5], f0: [0.04, 0.04, 0.04], roughness: 0.5 };
  const bottomBsdf = bottom?.type === 'substrate_bsdf' ? bottom : { diffuseAlbedo: [0.5, 0.5, 0.5], f0: [0.04, 0.04, 0.04], roughness: 0.5 };
  
  // Simplified: top layer attenuation based on thickness
  const topWeight = Math.min(1.0, thickness);
  const bottomWeight = 1.0 - topWeight * 0.5; // Partial transmission
  
  return {
    type: 'substrate_bsdf',
    diffuseAlbedo: [
      topBsdf.diffuseAlbedo[0] * topWeight + bottomBsdf.diffuseAlbedo[0] * bottomWeight * (1 - topWeight),
      topBsdf.diffuseAlbedo[1] * topWeight + bottomBsdf.diffuseAlbedo[1] * bottomWeight * (1 - topWeight),
      topBsdf.diffuseAlbedo[2] * topWeight + bottomBsdf.diffuseAlbedo[2] * bottomWeight * (1 - topWeight),
    ],
    f0: topBsdf.f0, // Top layer dominates specular
    f90: topBsdf.f90 || [1, 1, 1],
    roughness: topBsdf.roughness,
    coverage: topBsdf.coverage ?? 1.0,
  };
}

/**
 * Evaluate Substrate Horizontal Blend - spatial blend of two BSDFs
 */
export function evaluateSubstrateHorizontalBlend(pinEvaluator, node, visited) {
  const bgPin = node.inputs?.find(p => p.localId === 'background');
  const fgPin = node.inputs?.find(p => p.localId === 'foreground');
  const mixPin = node.inputs?.find(p => p.localId === 'mix');
  
  const bg = pinEvaluator?.(bgPin, new Set(visited || []));
  const fg = pinEvaluator?.(fgPin, new Set(visited || []));
  const mix = pinEvaluator?.(mixPin, new Set(visited || [])) ?? 0.5;
  
  const bgBsdf = bg?.type === 'substrate_bsdf' ? bg : { diffuseAlbedo: [0.5, 0.5, 0.5], f0: [0.04, 0.04, 0.04], roughness: 0.5 };
  const fgBsdf = fg?.type === 'substrate_bsdf' ? fg : { diffuseAlbedo: [0.5, 0.5, 0.5], f0: [0.04, 0.04, 0.04], roughness: 0.5 };
  const t = typeof mix === 'number' ? Math.max(0, Math.min(1, mix)) : 0.5;
  
  // Linear blend of BSDF properties
  return {
    type: 'substrate_bsdf',
    diffuseAlbedo: [
      bgBsdf.diffuseAlbedo[0] * (1 - t) + fgBsdf.diffuseAlbedo[0] * t,
      bgBsdf.diffuseAlbedo[1] * (1 - t) + fgBsdf.diffuseAlbedo[1] * t,
      bgBsdf.diffuseAlbedo[2] * (1 - t) + fgBsdf.diffuseAlbedo[2] * t,
    ],
    f0: [
      bgBsdf.f0[0] * (1 - t) + fgBsdf.f0[0] * t,
      bgBsdf.f0[1] * (1 - t) + fgBsdf.f0[1] * t,
      bgBsdf.f0[2] * (1 - t) + fgBsdf.f0[2] * t,
    ],
    roughness: bgBsdf.roughness * (1 - t) + fgBsdf.roughness * t,
    coverage: (bgBsdf.coverage ?? 1) * (1 - t) + (fgBsdf.coverage ?? 1) * t,
  };
}

/**
 * Evaluate Substrate Unlit BSDF - emissive-only substrate
 */
export function evaluateSubstrateUnlitBSDF(pinEvaluator, node, visited) {
  const emissivePin = node.inputs?.find(p => p.localId === 'emissive_color');
  const transmittancePin = node.inputs?.find(p => p.localId === 'transmittance');
  const coveragePin = node.inputs?.find(p => p.localId === 'coverage');
  
  const emissive = pinEvaluator?.(emissivePin, new Set(visited || [])) ?? [0, 0, 0];
  const transmittance = pinEvaluator?.(transmittancePin, new Set(visited || [])) ?? [1, 1, 1];
  const coverage = pinEvaluator?.(coveragePin, new Set(visited || [])) ?? 1.0;
  
  return {
    type: 'substrate_bsdf',
    diffuseAlbedo: [0, 0, 0], // No diffuse for unlit
    f0: [0, 0, 0], // No specular for unlit
    emissive: Array.isArray(emissive) ? emissive : [emissive, emissive, emissive],
    transmittance: Array.isArray(transmittance) ? transmittance : [transmittance, transmittance, transmittance],
    roughness: 1.0,
    coverage: typeof coverage === 'number' ? coverage : 1.0,
    isUnlit: true,
  };
}

/**
 * Evaluate Substrate Metalness Helper - converts legacy metalness workflow to Substrate
 */
export function evaluateSubstrateMetalnessHelper(pinEvaluator, node, outputPin, visited) {
  const baseColorPin = node.inputs?.find(p => p.localId === 'base_color');
  const metallicPin = node.inputs?.find(p => p.localId === 'metallic');
  const specularPin = node.inputs?.find(p => p.localId === 'specular');
  
  const baseColor = pinEvaluator?.(baseColorPin, new Set(visited || [])) ?? [0.5, 0.5, 0.5];
  const metallic = pinEvaluator?.(metallicPin, new Set(visited || [])) ?? 0.0;
  const specular = pinEvaluator?.(specularPin, new Set(visited || [])) ?? 0.5;
  
  const bc = Array.isArray(baseColor) ? baseColor : [baseColor, baseColor, baseColor];
  const m = typeof metallic === 'number' ? metallic : 0.0;
  const s = typeof specular === 'number' ? specular : 0.5;
  
  // Calculate diffuse albedo and F0 based on metalness
  const diffuseAlbedo = [bc[0] * (1 - m), bc[1] * (1 - m), bc[2] * (1 - m)];
  const dielectricF0 = s * 0.08;
  const f0 = [
    dielectricF0 * (1 - m) + bc[0] * m,
    dielectricF0 * (1 - m) + bc[1] * m,
    dielectricF0 * (1 - m) + bc[2] * m,
  ];
  
  // Return based on which output pin is queried
  const pinId = outputPin?.localId || 'diffuse_albedo';
  if (pinId === 'f0') return f0;
  return diffuseAlbedo;
}

/**
 * Evaluate Substrate Legacy Conversion - wraps legacy material inputs
 */
export function evaluateSubstrateLegacyConversion(pinEvaluator, node, visited) {
  const baseColorPin = node.inputs?.find(p => p.localId === 'base_color');
  const metallicPin = node.inputs?.find(p => p.localId === 'metallic');
  const specularPin = node.inputs?.find(p => p.localId === 'specular');
  const roughnessPin = node.inputs?.find(p => p.localId === 'roughness');
  const opacityPin = node.inputs?.find(p => p.localId === 'opacity');
  const emissivePin = node.inputs?.find(p => p.localId === 'emissive_color');
  
  const baseColor = pinEvaluator?.(baseColorPin, new Set(visited || [])) ?? [0.5, 0.5, 0.5];
  const metallic = pinEvaluator?.(metallicPin, new Set(visited || [])) ?? 0.0;
  const specular = pinEvaluator?.(specularPin, new Set(visited || [])) ?? 0.5;
  const roughness = pinEvaluator?.(roughnessPin, new Set(visited || [])) ?? 0.5;
  const opacity = pinEvaluator?.(opacityPin, new Set(visited || [])) ?? 1.0;
  const emissive = pinEvaluator?.(emissivePin, new Set(visited || [])) ?? [0, 0, 0];
  
  const bc = Array.isArray(baseColor) ? baseColor : [baseColor, baseColor, baseColor];
  const m = typeof metallic === 'number' ? metallic : 0.0;
  const s = typeof specular === 'number' ? specular : 0.5;
  
  // Convert legacy inputs to Substrate BSDF
  const diffuseAlbedo = [bc[0] * (1 - m), bc[1] * (1 - m), bc[2] * (1 - m)];
  const dielectricF0 = s * 0.08;
  const f0 = [
    dielectricF0 * (1 - m) + bc[0] * m,
    dielectricF0 * (1 - m) + bc[1] * m,
    dielectricF0 * (1 - m) + bc[2] * m,
  ];
  
  return {
    type: 'substrate_bsdf',
    diffuseAlbedo,
    f0,
    f90: [1, 1, 1],
    roughness: typeof roughness === 'number' ? roughness : 0.5,
    coverage: typeof opacity === 'number' ? opacity : 1.0,
    emissive: Array.isArray(emissive) ? emissive : [0, 0, 0],
  };
}

// ============================================================================