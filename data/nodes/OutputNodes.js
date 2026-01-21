/**
 * Output Node Definitions
 * Contains the Main Material Output Node
 */

export const OutputNodes = {
  MainMaterialNode: {
    title: "M_NewMaterial",
    type: "main-output",
    category: "Output",
    isMainNode: true,
    headerColor: "#3a3a3a",
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
      { id: "emissive", name: "Emissive Color", type: "float3", dir: "in" },
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
      { id: "normal", name: "Normal", type: "float3", dir: "in" },
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
      {
        id: "subsurface_color",
        name: "Subsurface Color",
        type: "float3",
        dir: "in",
        conditionalOn: ["Subsurface", "PreintegratedSkin", "SubsurfaceProfile"],
      },
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
    ],
    shaderCode: `
            // Material Output
            MaterialOutput.BaseColor = {base_color};
            MaterialOutput.Metallic = {metallic};
            MaterialOutput.Specular = {specular};
            MaterialOutput.Roughness = {roughness};
            MaterialOutput.EmissiveColor = {emissive};
            MaterialOutput.Normal = {normal};
            MaterialOutput.WorldPositionOffset = {world_position_offset};
            MaterialOutput.AmbientOcclusion = {ambient_occlusion};
            MaterialOutput.PixelDepthOffset = {pixel_depth_offset};
            MaterialOutput.SubsurfaceColor = {subsurface_color};
            MaterialOutput.ClearCoat = {clear_coat};
            MaterialOutput.ClearCoatRoughness = {clear_coat_roughness};
        `,
  },
};
