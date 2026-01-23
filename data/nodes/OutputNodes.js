/**
 * Output Node Definitions
 * Contains the Main Material Output Node
 *
 * Full UE5 Material Inputs Reference:
 * https://docs.unrealengine.com/5.0/en-US/material-inputs-in-unreal-engine/
 */

export const OutputNodes = {
  MainMaterialNode: {
    title: "M_NewMaterial",
    type: "main-output",
    category: "Output",
    isMainNode: true,
    headerColor: "#3a3a3a",
    pins: [
      // ===== Core PBR Inputs =====
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
      {
        id: "anisotropy",
        name: "Anisotropy",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
      },
      { id: "emissive", name: "Emissive Color", type: "float3", dir: "in" },

      // ===== Transparency =====
      {
        id: "opacity",
        name: "Opacity",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        conditionalOn: ["Translucent", "Additive"],
      },
      {
        id: "opacity_mask",
        name: "Opacity Mask",
        type: "float",
        dir: "in",
        conditionalOn: ["Masked"],
      },
      {
        id: "refraction",
        name: "Refraction",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        conditionalOn: ["Translucent"],
      },

      // ===== Surface/Geometry =====
      { id: "normal", name: "Normal", type: "float3", dir: "in" },
      { id: "tangent", name: "Tangent", type: "float3", dir: "in" },
      {
        id: "world_position_offset",
        name: "World Position Offset",
        type: "float3",
        dir: "in",
      },
      {
        id: "ambient_occlusion",
        name: "Ambient Occlusion",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
      },
      {
        id: "pixel_depth_offset",
        name: "Pixel Depth Offset",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
      },

      // ===== Subsurface Scattering =====
      {
        id: "subsurface_color",
        name: "Subsurface Color",
        type: "float3",
        dir: "in",
        conditionalOn: ["Subsurface", "PreintegratedSkin", "SubsurfaceProfile"],
      },

      // ===== Clear Coat =====
      {
        id: "clear_coat",
        name: "Clear Coat",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
        conditionalOn: ["ClearCoat"],
      },
      {
        id: "clear_coat_roughness",
        name: "Clear Coat Roughness",
        type: "float",
        dir: "in",
        defaultValue: 0.1,
        conditionalOn: ["ClearCoat"],
      },

      // ===== Custom Data (for custom shading models) =====
      {
        id: "custom_data_0",
        name: "Custom Data 0",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
      },
      {
        id: "custom_data_1",
        name: "Custom Data 1",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
      },
    ],
    shaderCode: `
            // Material Output
            MaterialOutput.BaseColor = {base_color};
            MaterialOutput.Metallic = {metallic};
            MaterialOutput.Specular = {specular};
            MaterialOutput.Roughness = {roughness};
            MaterialOutput.Anisotropy = {anisotropy};
            MaterialOutput.EmissiveColor = {emissive};
            MaterialOutput.Normal = {normal};
            MaterialOutput.Tangent = {tangent};
            MaterialOutput.WorldPositionOffset = {world_position_offset};
            MaterialOutput.AmbientOcclusion = {ambient_occlusion};
            MaterialOutput.PixelDepthOffset = {pixel_depth_offset};
            MaterialOutput.SubsurfaceColor = {subsurface_color};
            MaterialOutput.ClearCoat = {clear_coat};
            MaterialOutput.ClearCoatRoughness = {clear_coat_roughness};
            MaterialOutput.Refraction = {refraction};
            MaterialOutput.CustomData0 = {custom_data_0};
            MaterialOutput.CustomData1 = {custom_data_1};
        `,
  },
};
