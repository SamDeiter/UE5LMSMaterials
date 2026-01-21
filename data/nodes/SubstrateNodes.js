/**
 * Substrate Node Definitions (UE5.1+)
 * Contains the new physical-layer material system nodes
 */

export const SubstrateNodes = {
  SubstrateSlabBSDF: {
    title: "Substrate Slab BSDF",
    type: "substrate-expression",
    category: "Substrate",
    icon: "◆",
    headerColor: "#B8860B",
    description:
      "The fundamental building block of Substrate materials. Defines a physical layer of matter with Interface (surface) and Medium (volumetric) properties.",
    pins: [
      // Interface inputs (surface reflection)
      {
        id: "diffuse_albedo",
        name: "Diffuse Albedo",
        type: "float3",
        dir: "in",
        tooltip: "Base diffuse color for non-metallic surfaces",
      },
      {
        id: "f0",
        name: "F0",
        type: "float3",
        dir: "in",
        defaultValue: [0.04, 0.04, 0.04],
        tooltip: "Fresnel reflectance at 0° (perpendicular viewing angle)",
      },
      {
        id: "f90",
        name: "F90",
        type: "float3",
        dir: "in",
        defaultValue: [1.0, 1.0, 1.0],
        tooltip:
          "Fresnel reflectance at 90° (grazing angle). Enables gonio-chromatic materials.",
      },
      {
        id: "roughness",
        name: "Roughness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
        tooltip: "Microfacet variance: 0=mirror, 1=fully matte",
      },
      {
        id: "anisotropy",
        name: "Anisotropy",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
        tooltip:
          "Stretches specular highlight along tangent direction (-1 to 1)",
      },
      {
        id: "normal",
        name: "Normal",
        type: "float3",
        dir: "in",
        tooltip: "Custom normal map input",
      },
      {
        id: "tangent",
        name: "Tangent",
        type: "float3",
        dir: "in",
        tooltip: "Required for anisotropic materials",
      },
      // Medium inputs (volumetric transmission)
      {
        id: "mfp",
        name: "Mean Free Path",
        type: "float3",
        dir: "in",
        tooltip:
          "RGB subsurface scattering depth (high=translucent, low=opaque)",
      },
      {
        id: "transmittance",
        name: "Transmittance",
        type: "float3",
        dir: "in",
        tooltip: "Optical transparency color (not physical presence)",
      },
      {
        id: "coverage",
        name: "Coverage",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "Physical presence of matter (0=hole, 1=solid)",
      },
      {
        id: "fuzz_amount",
        name: "Fuzz Amount",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
        tooltip: "Grazing-angle sheen for velvet, dust, peach fuzz",
      },
      {
        id: "fuzz_color",
        name: "Fuzz Color",
        type: "float3",
        dir: "in",
        defaultValue: [1.0, 1.0, 1.0],
        tooltip: "Color of the fuzz layer",
      },
      // Output
      { id: "out", name: "", type: "substrate", dir: "out" },
    ],
    properties: {
      SubSurfaceType: "Wrap", // Wrap, Two-Sided Wrap, Diffusion, Simple Volume
    },
    shaderCode: `
            // Substrate Slab BSDF - Physical layer definition
            SubstrateSlab {OUTPUT};
            {OUTPUT}.DiffuseAlbedo = {diffuse_albedo};
            {OUTPUT}.F0 = {f0};
            {OUTPUT}.F90 = {f90};
            {OUTPUT}.Roughness = {roughness};
            {OUTPUT}.Anisotropy = {anisotropy};
            {OUTPUT}.Normal = {normal};
            {OUTPUT}.Tangent = {tangent};
            {OUTPUT}.MeanFreePath = {mfp};
            {OUTPUT}.Transmittance = {transmittance};
            {OUTPUT}.Coverage = {coverage};
            {OUTPUT}.FuzzAmount = {fuzz_amount};
            {OUTPUT}.FuzzColor = {fuzz_color};
            {OUTPUT}.SubSurfaceType = SSS_{SubSurfaceType};
        `,
  },

  SubstrateVerticalLayer: {
    title: "Substrate Vertical Layer",
    type: "substrate-expression",
    category: "Substrate",
    icon: "▥",
    headerColor: "#B8860B",
    description:
      "Layers one Substrate material on top of another, simulating physical coating with recursive light evaluation (Top = coating, Bottom = substrate).",
    pins: [
      {
        id: "top",
        name: "Top",
        type: "substrate",
        dir: "in",
        required: true,
        tooltip: "The coating layer (e.g., clear coat, water, dust)",
      },
      {
        id: "bottom",
        name: "Bottom",
        type: "substrate",
        dir: "in",
        required: true,
        tooltip: "The substrate layer (e.g., base material)",
      },
      {
        id: "thickness",
        name: "Thickness",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip:
          "Optical depth of the top layer (drives Beer-Lambert absorption)",
      },
      { id: "out", name: "", type: "substrate", dir: "out" },
    ],
    shaderCode: `
            // Substrate Vertical Layer - Physical coating simulation
            // Light path: hits Top interface -> transmits through Top medium -> hits Bottom -> returns through Top
            SubstrateSlab {OUTPUT} = SubstrateVerticalLayer({top}, {bottom}, {thickness});
        `,
  },

  SubstrateHorizontalBlend: {
    title: "Substrate Horizontal Blend",
    type: "substrate-expression",
    category: "Substrate",
    icon: "▤",
    headerColor: "#B8860B",
    description:
      "Mixes two Substrate materials side-by-side, partitioning the pixel surface area. Unlike legacy blending, this operates on full BSDF closures.",
    pins: [
      {
        id: "background",
        name: "Background",
        type: "substrate",
        dir: "in",
        required: true,
        tooltip: "First material (shown when Mix = 0)",
      },
      {
        id: "foreground",
        name: "Foreground",
        type: "substrate",
        dir: "in",
        required: true,
        tooltip: "Second material (shown when Mix = 1)",
      },
      {
        id: "mix",
        name: "Mix",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
        tooltip: "Blend weight (0.0 to 1.0)",
      },
      { id: "out", name: "", type: "substrate", dir: "out" },
    ],
    shaderCode: `
            // Substrate Horizontal Blend - BSDF-level spatial mixing
            SubstrateSlab {OUTPUT} = SubstrateHorizontalBlend({background}, {foreground}, {mix});
        `,
  },

  SubstrateUnlitBSDF: {
    title: "Substrate Unlit BSDF",
    type: "substrate-expression",
    category: "Substrate",
    icon: "◇",
    headerColor: "#B8860B",
    description:
      "An unlit Substrate slab that supports colored transmittance (for stained-glass effects) and can be layered with other Slabs.",
    pins: [
      {
        id: "emissive_color",
        name: "Emissive Color",
        type: "float3",
        dir: "in",
        tooltip: "Self-illumination color",
      },
      {
        id: "transmittance",
        name: "Transmittance",
        type: "float3",
        dir: "in",
        tooltip: "Colored transparency for stained-glass effects",
      },
      {
        id: "coverage",
        name: "Coverage",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "Physical presence (0=hole, 1=solid)",
      },
      { id: "out", name: "", type: "substrate", dir: "out" },
    ],
    shaderCode: `
            // Substrate Unlit BSDF - Emissive with optional transmittance
            SubstrateUnlit {OUTPUT};
            {OUTPUT}.EmissiveColor = {emissive_color};
            {OUTPUT}.Transmittance = {transmittance};
            {OUTPUT}.Coverage = {coverage};
        `,
  },

  SubstrateMetalnessHelper: {
    title: "Metalness To DiffuseAlbedo F0",
    type: "substrate-expression",
    category: "Substrate",
    icon: "⚙",
    headerColor: "#B8860B",
    description:
      "Helper node that converts legacy Metalness workflow inputs to Substrate native format. Metallic=0 outputs BaseColor to Diffuse; Metallic=1 outputs BaseColor to F0.",
    pins: [
      {
        id: "base_color",
        name: "Base Color",
        type: "float3",
        dir: "in",
        required: true,
        tooltip: "Legacy combined color input",
      },
      {
        id: "metallic",
        name: "Metallic",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
        tooltip: "0=dielectric (diffuse), 1=metal (specular color)",
      },
      {
        id: "specular",
        name: "Specular",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
        tooltip: "Dielectric specular intensity (0.5 = 4% reflectance)",
      },
      {
        id: "diffuse_albedo",
        name: "Diffuse Albedo",
        type: "float3",
        dir: "out",
        tooltip: "Output for Slab Diffuse Albedo pin",
      },
      {
        id: "f0",
        name: "F0",
        type: "float3",
        dir: "out",
        tooltip: "Output for Slab F0 pin",
      },
    ],
    shaderCode: `
            // Metalness to Substrate conversion
            // When Metallic=0: BaseColor -> Diffuse, Specular -> F0
            // When Metallic=1: Black -> Diffuse, BaseColor -> F0
            float3 {OUTPUT}_diffuse_albedo = {base_color} * (1.0 - {metallic});
            float3 dielectric_f0 = float3({specular} * 0.08, {specular} * 0.08, {specular} * 0.08);
            float3 {OUTPUT}_f0 = lerp(dielectric_f0, {base_color}, {metallic});
        `,
  },

  SubstrateLegacyConversion: {
    title: "Substrate Legacy Conversion",
    type: "substrate-expression",
    category: "Substrate",
    icon: "↻",
    headerColor: "#B8860B",
    description:
      "Wraps legacy material inputs and converts them to Substrate format. Used automatically when enabling Substrate on existing materials.",
    pins: [
      { id: "base_color", name: "Base Color", type: "float3", dir: "in" },
      {
        id: "metallic",
        name: "Metallic",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
      },
      {
        id: "specular",
        name: "Specular",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
      },
      {
        id: "roughness",
        name: "Roughness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
      },
      { id: "normal", name: "Normal", type: "float3", dir: "in" },
      {
        id: "emissive_color",
        name: "Emissive Color",
        type: "float3",
        dir: "in",
      },
      {
        id: "opacity",
        name: "Opacity",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
      },
      { id: "out", name: "", type: "substrate", dir: "out" },
    ],
    shaderCode: `
            // Legacy to Substrate conversion wrapper
            float3 diffuse_albedo = {base_color} * (1.0 - {metallic});
            float3 f0 = lerp(float3({specular} * 0.08), {base_color}, {metallic});
            SubstrateSlab {OUTPUT};
            {OUTPUT}.DiffuseAlbedo = diffuse_albedo;
            {OUTPUT}.F0 = f0;
            {OUTPUT}.Roughness = {roughness};
            {OUTPUT}.Normal = {normal};
            {OUTPUT}.Coverage = {opacity};
        `,
  },
};
