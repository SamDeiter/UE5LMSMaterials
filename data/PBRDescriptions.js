/**
 * PBRDescriptions.js
 *
 * Educational metadata for PBR (Physically Based Rendering) inputs.
 * Provides physics explanations, value ranges, and tips for each material pin.
 */

export const PBRDescriptions = {
  // ==========================================================================
  // MAIN MATERIAL NODE INPUTS
  // ==========================================================================

  base_color: {
    physics:
      "Diffuse Albedo - the specific wavelengths of light reflected diffusely (scattered in all directions) by the surface.",
    range: { min: 0.02, max: 0.9, unit: "linear sRGB" },
    pbrRules: [
      "For non-metals: the actual color of the object",
      "For metals: tints the specular reflection (diffuse is black)",
      "Never use pure black (0.0) or pure white (1.0) - physically impossible",
    ],
    commonMistakes: [
      "Using values too dark (below 0.02) - even coal reflects ~4% light",
      "Using values of 1.0 - no real material reflects 100% of light",
    ],
  },

  metallic: {
    physics:
      "Conductivity - determines if the surface behaves as a conductor (metal) or dielectric (non-metal).",
    range: { min: 0, max: 1, unit: "binary (0 or 1)" },
    pbrRules: [
      "0.0 = Dielectric (plastic, wood, skin) - ~4% white specular, colored diffuse",
      "1.0 = Conductor (metal) - high colored specular, no diffuse",
      "Gray values are generally physically invalid",
    ],
    commonMistakes: [
      "Using 0.5 for 'semi-metallic' - this is not physically accurate",
      "Exception: Use gradients only for transitions (rust on metal)",
    ],
  },

  specular: {
    physics:
      "Fresnel Reflectance at Normal Incidence (F0) - controls reflectivity for non-metal surfaces.",
    range: { min: 0, max: 1, unit: "remapped (0.5 = 4% reflectance)" },
    pbrRules: [
      "Default 0.5 = 4% reflectance (correct for most materials)",
      "Water, glass, plastic all use ~0.5",
      "Has NO effect when Metallic = 1",
    ],
    commonMistakes: [
      "Texturing this slot unnecessarily - rarely needed",
      "Values for: Gemstones (0.8), Ice (0.3)",
    ],
  },

  roughness: {
    physics:
      "Microfacet Distribution - describes the microscopic irregularity of the surface.",
    range: { min: 0, max: 1, unit: "perceptually linear" },
    pbrRules: [
      "0.0 = Perfectly smooth (mirror-like reflection)",
      "1.0 = Perfectly rough (matte, blurry reflection)",
      "Most real materials: 0.3-0.8",
    ],
    commonMistakes: [
      "Using 0.0 for 'shiny' - pure mirrors are rare",
      "Using 1.0 everywhere - even concrete has some sheen",
    ],
  },

  emissive_color: {
    physics:
      "Self-illumination - light emitted by the surface, independent of external lighting.",
    range: { min: 0, max: 100, unit: "HDR (values > 1.0)" },
    pbrRules: [
      "Values > 1.0 trigger Bloom post-process",
      "With Lumen: can actually illuminate surrounding objects",
      "Common values: Screens (2-5), Neon (10-50), Sun (100+)",
    ],
    commonMistakes: [
      "Using emissive instead of proper lighting",
      "Setting too high (>100) causes blown-out bloom",
    ],
  },

  normal: {
    physics:
      "Tangent-space surface perturbation - modifies the perceived surface angle per-pixel without changing geometry.",
    range: { min: -1, max: 1, unit: "tangent-space (encoded 0-1)" },
    pbrRules: [
      "R channel = X-axis slope",
      "G channel = Y-axis slope",
      "B channel = Z-up vector (always ~1.0 for flat)",
      "Blue-purple appearance indicates tangent-space normals",
    ],
    commonMistakes: [
      "Using world-space normals without conversion",
      "Flipping Green channel when porting from other engines",
    ],
  },

  ambient_occlusion: {
    physics:
      "Large-scale light occlusion - simulates shadows in crevices where indirect light cannot reach.",
    range: { min: 0, max: 1, unit: "multiplier" },
    pbrRules: [
      "With Lumen: mainly serves as Specular Occluder",
      "Dims reflections in cracks to prevent unrealistic shine",
      "Baked AO complements real-time GI",
    ],
    commonMistakes: [
      "Using AO for small details (normal maps are better)",
      "Applying AO to highly metallic surfaces incorrectly",
    ],
  },

  opacity: {
    physics:
      "Transparency control - determines how much of background is visible through the surface.",
    range: { min: 0, max: 1, unit: "alpha" },
    pbrRules: [
      "Only active in Translucent blend mode",
      "0.0 = Fully transparent",
      "1.0 = Fully opaque",
    ],
    commonMistakes: [
      "Using Translucent when Masked would work (expensive)",
      "Forgetting sorting issues with translucency",
    ],
  },

  opacity_mask: {
    physics:
      "Binary visibility - clips pixels below threshold, discarding them entirely.",
    range: { min: 0, max: 1, unit: "compared to clip value" },
    pbrRules: [
      "Only active in Masked blend mode",
      "Pixels below Opacity Mask Clip Value are discarded",
      "Default clip value: 0.5",
    ],
    commonMistakes: [
      "Using for soft edges (use Translucent or dithering)",
      "Not adjusting clip value for thin geometry",
    ],
  },

  world_position_offset: {
    physics:
      "Vertex displacement - moves vertices in world space via the Vertex Shader.",
    range: { min: -10000, max: 10000, unit: "world units (cm)" },
    pbrRules: [
      "Used for: wind animation, pulsating, vertex animation",
      "Executes in Vertex Shader (cheap for simple math)",
      "Can break culling if vertices move outside bounding box",
    ],
    commonMistakes: [
      "Forgetting to increase Bounds Scale on the mesh",
      "Using for high-frequency detail (use PDO or tessellation)",
    ],
  },

  pixel_depth_offset: {
    physics:
      "Artificial Z-buffer adjustment - pushes pixels deeper into the depth buffer.",
    range: { min: 0, max: 1000, unit: "world units (cm)" },
    pbrRules: [
      "Used for soft blending (rocks into terrain)",
      "Eliminates harsh intersection lines",
      "Only affects depth testing, not actual position",
    ],
    commonMistakes: [
      "Using negative values (can cause z-fighting)",
      "Applying to transparent materials (no depth write)",
    ],
  },

  refraction: {
    physics:
      "Light bending through transparent materials based on Index of Refraction (IOR).",
    range: { min: 1.0, max: 2.5, unit: "IOR" },
    pbrRules: [
      "Air = 1.0 (no bending)",
      "Water = 1.33",
      "Glass = 1.52",
      "Diamond = 2.42",
    ],
    commonMistakes: [
      "Using refraction without Translucent blend mode",
      "Values below 1.0 (physically impossible)",
    ],
  },

  // ==========================================================================
  // SHADING MODEL SPECIFIC
  // ==========================================================================

  subsurface_color: {
    physics:
      "Light scattering color - simulates light penetrating and scattering inside translucent materials.",
    range: { min: 0, max: 1, unit: "sRGB" },
    pbrRules: [
      "Active for: Subsurface, Subsurface Profile, Two Sided Foliage",
      "Represents color of light after scattering through material",
      "Skin: warm red-orange, Wax: yellow, Jade: green",
    ],
    commonMistakes: [
      "Making subsurface color same as surface color",
      "Using with non-subsurface shading models (has no effect)",
    ],
  },

  clear_coat: {
    physics:
      "Secondary specular layer strength - simulates a clear varnish layer over the base material.",
    range: { min: 0, max: 1, unit: "strength" },
    pbrRules: [
      "Active only for Clear Coat shading model",
      "0.0 = No clear coat",
      "1.0 = Full strength clear coat layer",
    ],
    commonMistakes: [
      "Using on non-Clear Coat model (has no effect)",
      "Not adjusting Clear Coat Roughness separately",
    ],
  },

  clear_coat_roughness: {
    physics:
      "Roughness of the clear coat layer - independent from base layer roughness.",
    range: { min: 0, max: 1, unit: "roughness" },
    pbrRules: [
      "Typically lower than base roughness (glossy clear coat)",
      "Car paint: 0.0-0.1",
      "Carbon fiber: 0.1-0.2",
    ],
    commonMistakes: [
      "Making equal to base roughness (defeats purpose)",
      "Using 0.0 for all clear coats (some have micro-scratches)",
    ],
  },
};

export default PBRDescriptions;
