/**
 * MaterialProperties.js
 *
 * MATERIAL ROOT PROPERTY DEFINITIONS
 * ==================================
 * These properties are displayed in the Details Panel when
 * the Main Material Node is selected or no node is selected.
 *
 * Based on UE5 Material Editor Interface Specification.
 */

// Material Domains define where the material can be applied
export const MaterialDomains = [
  {
    id: "Surface",
    name: "Surface",
    description: "Standard 3D surface materials",
  },
  { id: "Decal", name: "Decal", description: "Projected onto surfaces" },
  {
    id: "PostProcess",
    name: "Post Process",
    description: "Full-screen effects",
  },
  {
    id: "LightFunction",
    name: "Light Function",
    description: "Light shape/falloff control",
  },
  { id: "Volume", name: "Volume", description: "Volumetric fog/clouds" },
  { id: "UI", name: "User Interface", description: "2D UI elements" },
];

// Blend Modes control how the material interacts with background
export const BlendModes = [
  { id: "Opaque", name: "Opaque", description: "Fully solid, no transparency" },
  {
    id: "Masked",
    name: "Masked",
    description: "Binary opacity via clip threshold",
  },
  {
    id: "Translucent",
    name: "Translucent",
    description: "Smooth transparency blending",
  },
  {
    id: "Additive",
    name: "Additive",
    description: "Adds light (glow effects)",
  },
  {
    id: "Modulate",
    name: "Modulate",
    description: "Multiplies with background",
  },
];

// Shading Models define the BRDF/lighting calculation
export const ShadingModels = [
  {
    id: "DefaultLit",
    name: "Default Lit",
    description: "Standard PBR with full lighting",
  },
  { id: "Unlit", name: "Unlit", description: "No lighting, emissive only" },
  {
    id: "Subsurface",
    name: "Subsurface",
    description: "Internal light scattering (wax, jade)",
  },
  {
    id: "PreintegratedSkin",
    name: "Preintegrated Skin",
    description: "Optimized skin shader",
  },
  {
    id: "ClearCoat",
    name: "Clear Coat",
    description: "Dual-layer (car paint, lacquer)",
  },
  {
    id: "SubsurfaceProfile",
    name: "Subsurface Profile",
    description: "Advanced SSS with profile",
  },
  {
    id: "TwoSidedFoliage",
    name: "Two Sided Foliage",
    description: "Translucent leaves/grass",
  },
  { id: "Hair", name: "Hair", description: "Kajiya-Kay hair anisotropy" },
  { id: "Cloth", name: "Cloth", description: "Fabric sheen and fuzz" },
  { id: "Eye", name: "Eye", description: "Specialized eye shader" },
  {
    id: "SingleLayerWater",
    name: "Single Layer Water",
    description: "Real-time water surface",
  },
  {
    id: "ThinTranslucent",
    name: "Thin Translucent",
    description: "Thin surface transmission",
  },
];

// Default material settings
export const DefaultMaterialSettings = {
  domain: "Surface",
  blendMode: "Opaque",
  shadingModel: "DefaultLit",
  twoSided: false,
  opacityMaskClipValue: 0.3333,
  useMaterialAttributes: false,
  allowNegativeEmissiveColor: false,
  // Substrate-specific (future)
  useSubstrate: false,
};

// Pin visibility rules based on Blend Mode and Shading Model
export const PinVisibilityRules = {
  // Pins that only show for specific blend modes
  blendModeConditional: {
    opacity: ["Translucent", "Additive"],
    opacity_mask: ["Masked"],
  },
  // Pins that only show for specific shading models
  shadingModelConditional: {
    subsurface_color: ["Subsurface", "PreintegratedSkin", "SubsurfaceProfile"],
    clear_coat: ["ClearCoat"],
    clear_coat_roughness: ["ClearCoat"],
  },
};

/**
 * Get visible pins for the Main Material Node based on current settings
 * @param {Object} materialSettings - Current material configuration
 * @param {Array} allPins - All available pins on the Main Material Node
 * @returns {Array} Filtered pins that should be visible
 */
export function getVisiblePins(materialSettings, allPins) {
  return allPins.filter((pin) => {
    // Always show pins without conditions
    if (!pin.conditionalOn) return true;

    const { blendMode, shadingModel } = materialSettings;

    // Check if pin's condition matches current blend mode
    if (PinVisibilityRules.blendModeConditional[pin.id]) {
      return PinVisibilityRules.blendModeConditional[pin.id].includes(
        blendMode
      );
    }

    // Check if pin's condition matches current shading model
    if (PinVisibilityRules.shadingModelConditional[pin.id]) {
      return PinVisibilityRules.shadingModelConditional[pin.id].includes(
        shadingModel
      );
    }

    // Default: check if any condition is met
    return (
      pin.conditionalOn.includes(blendMode) ||
      pin.conditionalOn.includes(shadingModel)
    );
  });
}
