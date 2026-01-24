/**
 * LayerNodes.js
 *
 * Material Layer system nodes for UE5 Material Layers feature.
 * Allows stacking and blending multiple material definitions.
 */

export const LayerNodes = {
  // ============================================================================
  // MATERIAL LAYER BLEND - Main node for combining layers
  // ============================================================================
  MaterialLayerBlend: {
    title: "Material Layer Blend",
    type: "material-expression",
    category: "Material Layers",
    icon: "📚",
    headerColor: "linear-gradient(180deg, #6a4a8a 0%, #4a2a6a 100%)", // Purple for layers
    showPreview: true,
    pins: [
      // Inputs - Base layer and blend layers
      {
        name: "Base Layer",
        direction: "input",
        type: "materialattributes",
        localId: "base",
      },
      {
        name: "Layer A",
        direction: "input",
        type: "materialattributes",
        localId: "layerA",
      },
      {
        name: "Layer A Weight",
        direction: "input",
        type: "float",
        localId: "weightA",
        defaultValue: 0.5,
      },
      {
        name: "Layer A Mask",
        direction: "input",
        type: "float",
        localId: "maskA",
        defaultValue: 1.0,
      },
      {
        name: "Layer B",
        direction: "input",
        type: "materialattributes",
        localId: "layerB",
      },
      {
        name: "Layer B Weight",
        direction: "input",
        type: "float",
        localId: "weightB",
        defaultValue: 0.0,
      },
      {
        name: "Layer B Mask",
        direction: "input",
        type: "float",
        localId: "maskB",
        defaultValue: 1.0,
      },
      // Output
      {
        name: "Result",
        direction: "output",
        type: "materialattributes",
        localId: "out",
      },
    ],
    properties: {
      BlendMode: "Normal", // Normal, Height, Mask, Angle
    },
    shaderCode: `
      // Material Layer Blend (%id%)
      FMaterialAttributes BlendedMaterial_%id%;
      float effectiveWeightA = %weightA% * %maskA%;
      float effectiveWeightB = %weightB% * %maskB%;
      BlendedMaterial_%id% = BlendMaterialAttributes(%base%, %layerA%, effectiveWeightA);
      BlendedMaterial_%id% = BlendMaterialAttributes(BlendedMaterial_%id%, %layerB%, effectiveWeightB);
    `,
  },

  // ============================================================================
  // MAKE MATERIAL ATTRIBUTES - Create material attributes from individual inputs
  // ============================================================================
  MakeMaterialAttributes: {
    title: "Make Material Attributes",
    type: "material-expression",
    category: "Material Layers",
    icon: "🎨",
    headerColor: "linear-gradient(180deg, #6a4a8a 0%, #4a2a6a 100%)",
    showPreview: true,
    pins: [
      // Standard PBR inputs
      {
        name: "Base Color",
        direction: "input",
        type: "float3",
        localId: "baseColor",
        defaultValue: [0.5, 0.5, 0.5],
      },
      {
        name: "Metallic",
        direction: "input",
        type: "float",
        localId: "metallic",
        defaultValue: 0.0,
      },
      {
        name: "Specular",
        direction: "input",
        type: "float",
        localId: "specular",
        defaultValue: 0.5,
      },
      {
        name: "Roughness",
        direction: "input",
        type: "float",
        localId: "roughness",
        defaultValue: 0.5,
      },
      {
        name: "Emissive Color",
        direction: "input",
        type: "float3",
        localId: "emissive",
        defaultValue: [0, 0, 0],
      },
      {
        name: "Opacity",
        direction: "input",
        type: "float",
        localId: "opacity",
        defaultValue: 1.0,
      },
      {
        name: "Normal",
        direction: "input",
        type: "float3",
        localId: "normal",
        defaultValue: [0, 0, 1],
      },
      {
        name: "World Position Offset",
        direction: "input",
        type: "float3",
        localId: "wpo",
        defaultValue: [0, 0, 0],
      },
      {
        name: "Ambient Occlusion",
        direction: "input",
        type: "float",
        localId: "ao",
        defaultValue: 1.0,
      },
      // Output
      {
        name: "Material Attributes",
        direction: "output",
        type: "materialattributes",
        localId: "out",
      },
    ],
    properties: {},
    shaderCode: `
      // Make Material Attributes (%id%)
      FMaterialAttributes MaterialAttrs_%id%;
      MaterialAttrs_%id%.BaseColor = %baseColor%;
      MaterialAttrs_%id%.Metallic = %metallic%;
      MaterialAttrs_%id%.Specular = %specular%;
      MaterialAttrs_%id%.Roughness = %roughness%;
      MaterialAttrs_%id%.EmissiveColor = %emissive%;
      MaterialAttrs_%id%.Opacity = %opacity%;
      MaterialAttrs_%id%.Normal = %normal%;
      MaterialAttrs_%id%.WorldPositionOffset = %wpo%;
      MaterialAttrs_%id%.AmbientOcclusion = %ao%;
    `,
  },

  // ============================================================================
  // BREAK MATERIAL ATTRIBUTES - Extract individual properties from attributes
  // ============================================================================
  BreakMaterialAttributes: {
    title: "Break Material Attributes",
    type: "material-expression",
    category: "Material Layers",
    icon: "🔨",
    headerColor: "linear-gradient(180deg, #6a4a8a 0%, #4a2a6a 100%)",
    showPreview: false,
    pins: [
      // Input
      {
        name: "Material Attributes",
        direction: "input",
        type: "materialattributes",
        localId: "attrs",
      },
      // Outputs - all PBR properties
      {
        name: "Base Color",
        direction: "output",
        type: "float3",
        localId: "baseColor",
      },
      {
        name: "Metallic",
        direction: "output",
        type: "float",
        localId: "metallic",
      },
      {
        name: "Specular",
        direction: "output",
        type: "float",
        localId: "specular",
      },
      {
        name: "Roughness",
        direction: "output",
        type: "float",
        localId: "roughness",
      },
      {
        name: "Emissive Color",
        direction: "output",
        type: "float3",
        localId: "emissive",
      },
      {
        name: "Opacity",
        direction: "output",
        type: "float",
        localId: "opacity",
      },
      {
        name: "Normal",
        direction: "output",
        type: "float3",
        localId: "normal",
      },
      {
        name: "World Position Offset",
        direction: "output",
        type: "float3",
        localId: "wpo",
      },
      {
        name: "Ambient Occlusion",
        direction: "output",
        type: "float",
        localId: "ao",
      },
    ],
    properties: {},
    shaderCode: `
      // Break Material Attributes (%id%)
      float3 BaseColor_%id% = %attrs%.BaseColor;
      float Metallic_%id% = %attrs%.Metallic;
      float Specular_%id% = %attrs%.Specular;
      float Roughness_%id% = %attrs%.Roughness;
      float3 Emissive_%id% = %attrs%.EmissiveColor;
      float Opacity_%id% = %attrs%.Opacity;
      float3 Normal_%id% = %attrs%.Normal;
      float3 WPO_%id% = %attrs%.WorldPositionOffset;
      float AO_%id% = %attrs%.AmbientOcclusion;
    `,
  },

  // ============================================================================
  // HEIGHT BLEND - Blend layers based on height/displacement maps
  // ============================================================================
  HeightBlendLayers: {
    title: "Height Blend Layers",
    type: "material-expression",
    category: "Material Layers",
    icon: "⛰️",
    headerColor: "linear-gradient(180deg, #6a6a4a 0%, #4a4a2a 100%)", // Brown/tan for height
    showPreview: true,
    pins: [
      {
        name: "Layer A",
        direction: "input",
        type: "materialattributes",
        localId: "layerA",
      },
      {
        name: "Layer A Height",
        direction: "input",
        type: "float",
        localId: "heightA",
        defaultValue: 0.5,
      },
      {
        name: "Layer B",
        direction: "input",
        type: "materialattributes",
        localId: "layerB",
      },
      {
        name: "Layer B Height",
        direction: "input",
        type: "float",
        localId: "heightB",
        defaultValue: 0.5,
      },
      {
        name: "Blend Sharpness",
        direction: "input",
        type: "float",
        localId: "sharpness",
        defaultValue: 0.1,
      },
      {
        name: "Alpha",
        direction: "input",
        type: "float",
        localId: "alpha",
        defaultValue: 0.5,
      },
      // Output
      {
        name: "Result",
        direction: "output",
        type: "materialattributes",
        localId: "out",
      },
    ],
    properties: {},
    shaderCode: `
      // Height Blend Layers (%id%)
      float heightDiff_%id% = %heightA% - %heightB%;
      float blend_%id% = saturate(heightDiff_%id% / max(%sharpness%, 0.001) + 0.5);
      blend_%id% = lerp(0.5, blend_%id%, %alpha% * 2.0);
      FMaterialAttributes HeightBlended_%id% = BlendMaterialAttributes(%layerB%, %layerA%, blend_%id%);
    `,
  },

  // ============================================================================
  // ANGLE BLEND - Blend based on surface angle (slope-based blending)
  // ============================================================================
  AngleBlendLayers: {
    title: "Angle Blend Layers",
    type: "material-expression",
    category: "Material Layers",
    icon: "📐",
    headerColor: "linear-gradient(180deg, #4a6a8a 0%, #2a4a6a 100%)", // Blue for angle
    showPreview: true,
    pins: [
      {
        name: "Base Layer",
        direction: "input",
        type: "materialattributes",
        localId: "base",
      },
      {
        name: "Slope Layer",
        direction: "input",
        type: "materialattributes",
        localId: "slope",
      },
      {
        name: "Angle Threshold",
        direction: "input",
        type: "float",
        localId: "threshold",
        defaultValue: 0.5,
      },
      {
        name: "Blend Falloff",
        direction: "input",
        type: "float",
        localId: "falloff",
        defaultValue: 0.1,
      },
      // Output
      {
        name: "Result",
        direction: "output",
        type: "materialattributes",
        localId: "out",
      },
    ],
    properties: {},
    shaderCode: `
      // Angle Blend Layers (%id%)
      float worldNormalZ_%id% = saturate(dot(WorldNormal, float3(0, 0, 1)));
      float angleBlend_%id% = saturate((worldNormalZ_%id% - %threshold%) / max(%falloff%, 0.001));
      FMaterialAttributes AngleBlended_%id% = BlendMaterialAttributes(%slope%, %base%, angleBlend_%id%);
    `,
  },

  // ============================================================================
  // VERTEX COLOR BLEND - Blend using vertex colors as weights
  // ============================================================================
  VertexColorBlendLayers: {
    title: "Vertex Color Blend",
    type: "material-expression",
    category: "Material Layers",
    icon: "🎨",
    headerColor: "linear-gradient(180deg, #8a4a4a 0%, #6a2a2a 100%)", // Red for vertex
    showPreview: true,
    pins: [
      {
        name: "Layer R",
        direction: "input",
        type: "materialattributes",
        localId: "layerR",
      },
      {
        name: "Layer G",
        direction: "input",
        type: "materialattributes",
        localId: "layerG",
      },
      {
        name: "Layer B",
        direction: "input",
        type: "materialattributes",
        localId: "layerB",
      },
      {
        name: "Layer A",
        direction: "input",
        type: "materialattributes",
        localId: "layerA",
      },
      {
        name: "Base Layer",
        direction: "input",
        type: "materialattributes",
        localId: "base",
      },
      // Output
      {
        name: "Result",
        direction: "output",
        type: "materialattributes",
        localId: "out",
      },
    ],
    properties: {},
    shaderCode: `
      // Vertex Color Blend Layers (%id%)
      float4 vtxColor_%id% = VertexColor;
      FMaterialAttributes VtxBlended_%id% = %base%;
      VtxBlended_%id% = BlendMaterialAttributes(VtxBlended_%id%, %layerR%, vtxColor_%id%.r);
      VtxBlended_%id% = BlendMaterialAttributes(VtxBlended_%id%, %layerG%, vtxColor_%id%.g);
      VtxBlended_%id% = BlendMaterialAttributes(VtxBlended_%id%, %layerB%, vtxColor_%id%.b);
      VtxBlended_%id% = BlendMaterialAttributes(VtxBlended_%id%, %layerA%, vtxColor_%id%.a);
    `,
  },
};
