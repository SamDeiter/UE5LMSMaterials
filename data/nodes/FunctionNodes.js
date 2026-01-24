/**
 * FunctionNodes.js
 *
 * Material Function node definitions including:
 * - Function Input/Output nodes for creating functions
 * - Built-in reusable Material Functions (MF_Fresnel, etc.)
 */

export const FunctionNodes = {
  // ============================================================================
  // FUNCTION INPUT - Define inputs for a Material Function
  // ============================================================================
  FunctionInput: {
    title: "Function Input",
    type: "function-node",
    category: "Material Functions",
    icon: "📥",
    headerColor: "linear-gradient(180deg, #4a8a4a 0%, #2a6a2a 100%)", // Green for inputs
    showPreview: false,
    pins: [
      {
        name: "Preview",
        direction: "input",
        type: "float3",
        localId: "preview",
        defaultValue: [0, 0, 0],
      },
      { name: "Output", direction: "output", type: "float3", localId: "out" },
    ],
    properties: {
      InputName: "Input",
      InputType: "float3",
      Description: "",
      SortPriority: 0,
      UsePreviewValue: false,
    },
    shaderCode: `
      // Function Input: %InputName% (%id%)
      float3 FunctionInput_%id% = %preview%;
    `,
  },

  // ============================================================================
  // FUNCTION OUTPUT - Define outputs for a Material Function
  // ============================================================================
  FunctionOutput: {
    title: "Function Output",
    type: "function-node",
    category: "Material Functions",
    icon: "📤",
    headerColor: "linear-gradient(180deg, #8a4a4a 0%, #6a2a2a 100%)", // Red for outputs
    showPreview: true,
    pins: [
      { name: "Input", direction: "input", type: "float3", localId: "in" },
    ],
    properties: {
      OutputName: "Output",
      OutputType: "float3",
      Description: "",
      SortPriority: 0,
    },
    shaderCode: `
      // Function Output: %OutputName% (%id%)
      // Output connected to: %in%
    `,
  },

  // ============================================================================
  // BUILT-IN MATERIAL FUNCTIONS
  // ============================================================================

  // MF_Fresnel - Classic Fresnel effect with customizable power
  MF_Fresnel: {
    title: "MF_Fresnel",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "🌊",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)", // Blue-gray for functions
    showPreview: true,
    pins: [
      {
        name: "Normal",
        direction: "input",
        type: "float3",
        localId: "normal",
        defaultValue: [0, 0, 1],
      },
      {
        name: "Exponent",
        direction: "input",
        type: "float",
        localId: "exponent",
        defaultValue: 5.0,
      },
      {
        name: "Base Reflect Fraction",
        direction: "input",
        type: "float",
        localId: "baseReflect",
        defaultValue: 0.04,
      },
      { name: "Result", direction: "output", type: "float", localId: "out" },
    ],
    properties: {},
    shaderCode: `
      // MF_Fresnel (%id%)
      float3 CamVector_%id% = normalize(CameraPosition - WorldPosition);
      float NdotV_%id% = saturate(dot(%normal%, CamVector_%id%));
      float Fresnel_%id% = %baseReflect% + (1.0 - %baseReflect%) * pow(1.0 - NdotV_%id%, %exponent%);
    `,
  },

  // MF_HeightBlend - Height-based texture blending
  MF_HeightBlend: {
    title: "MF_HeightBlend",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "⛰️",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)",
    showPreview: true,
    pins: [
      {
        name: "Layer A",
        direction: "input",
        type: "float3",
        localId: "layerA",
        defaultValue: [1, 0, 0],
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
        type: "float3",
        localId: "layerB",
        defaultValue: [0, 0, 1],
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
        defaultValue: 0.2,
      },
      { name: "Result", direction: "output", type: "float3", localId: "out" },
    ],
    properties: {},
    shaderCode: `
      // MF_HeightBlend (%id%)
      float heightDiff_%id% = %heightA% - %heightB%;
      float blend_%id% = saturate(heightDiff_%id% / max(%sharpness%, 0.001) + 0.5);
      float3 HeightBlend_%id% = lerp(%layerB%, %layerA%, blend_%id%);
    `,
  },

  // MF_DetailTexture - Tiling detail texture overlay
  MF_DetailTexture: {
    title: "MF_DetailTexture",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "🔍",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)",
    showPreview: true,
    pins: [
      {
        name: "Base Color",
        direction: "input",
        type: "float3",
        localId: "baseColor",
        defaultValue: [0.5, 0.5, 0.5],
      },
      {
        name: "Detail Texture",
        direction: "input",
        type: "texture2d",
        localId: "detailTex",
      },
      {
        name: "Detail Tiling",
        direction: "input",
        type: "float",
        localId: "tiling",
        defaultValue: 4.0,
      },
      {
        name: "Detail Intensity",
        direction: "input",
        type: "float",
        localId: "intensity",
        defaultValue: 0.5,
      },
      { name: "UV", direction: "input", type: "float2", localId: "uv" },
      { name: "Result", direction: "output", type: "float3", localId: "out" },
    ],
    properties: {},
    shaderCode: `
      // MF_DetailTexture (%id%)
      float2 detailUV_%id% = %uv% * %tiling%;
      float3 detailSample_%id% = Texture2DSample(%detailTex%, detailUV_%id%).rgb;
      float3 detailResult_%id% = lerp(%baseColor%, %baseColor% * detailSample_%id% * 2.0, %intensity%);
    `,
  },

  // MF_WorldAlignedBlend - Blend based on world-space position
  MF_WorldAlignedBlend: {
    title: "MF_WorldAlignedBlend",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "🌍",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)",
    showPreview: true,
    pins: [
      {
        name: "Top Material",
        direction: "input",
        type: "float3",
        localId: "topMat",
        defaultValue: [0.2, 0.6, 0.2],
      },
      {
        name: "Side Material",
        direction: "input",
        type: "float3",
        localId: "sideMat",
        defaultValue: [0.4, 0.3, 0.2],
      },
      {
        name: "Sharpness",
        direction: "input",
        type: "float",
        localId: "sharpness",
        defaultValue: 2.0,
      },
      { name: "Result", direction: "output", type: "float3", localId: "out" },
    ],
    properties: {},
    shaderCode: `
      // MF_WorldAlignedBlend (%id%)
      float worldBlend_%id% = pow(abs(WorldNormal.z), %sharpness%);
      float3 WorldAligned_%id% = lerp(%sideMat%, %topMat%, worldBlend_%id%);
    `,
  },

  // MF_Desaturation - Desaturate color by amount
  MF_Desaturation: {
    title: "MF_Desaturation",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "⬜",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)",
    showPreview: true,
    pins: [
      {
        name: "Color",
        direction: "input",
        type: "float3",
        localId: "color",
        defaultValue: [1, 0.5, 0.25],
      },
      {
        name: "Fraction",
        direction: "input",
        type: "float",
        localId: "fraction",
        defaultValue: 0.5,
      },
      {
        name: "Luminance Weights",
        direction: "input",
        type: "float3",
        localId: "weights",
        defaultValue: [0.3, 0.59, 0.11],
      },
      { name: "Result", direction: "output", type: "float3", localId: "out" },
    ],
    properties: {},
    shaderCode: `
      // MF_Desaturation (%id%)
      float luminance_%id% = dot(%color%, %weights%);
      float3 Desaturated_%id% = lerp(%color%, float3(luminance_%id%, luminance_%id%, luminance_%id%), %fraction%);
    `,
  },

  // MF_CheapContrast - Fast contrast adjustment
  MF_CheapContrast: {
    title: "MF_CheapContrast",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "⚡",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)",
    showPreview: true,
    pins: [
      {
        name: "Value",
        direction: "input",
        type: "float3",
        localId: "value",
        defaultValue: [0.5, 0.5, 0.5],
      },
      {
        name: "Contrast",
        direction: "input",
        type: "float",
        localId: "contrast",
        defaultValue: 1.0,
      },
      { name: "Result", direction: "output", type: "float3", localId: "out" },
    ],
    properties: {},
    shaderCode: `
      // MF_CheapContrast (%id%)
      float3 CheapContrast_%id% = saturate(lerp(float3(0.5, 0.5, 0.5), %value%, %contrast%));
    `,
  },

  // MF_TriplanarProjection - Tri-planar texture mapping
  MF_TriplanarProjection: {
    title: "MF_TriplanarProjection",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "📐",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)",
    showPreview: true,
    pins: [
      {
        name: "Texture X",
        direction: "input",
        type: "texture2d",
        localId: "texX",
      },
      {
        name: "Texture Y",
        direction: "input",
        type: "texture2d",
        localId: "texY",
      },
      {
        name: "Texture Z",
        direction: "input",
        type: "texture2d",
        localId: "texZ",
      },
      {
        name: "Tiling",
        direction: "input",
        type: "float",
        localId: "tiling",
        defaultValue: 1.0,
      },
      {
        name: "Sharpness",
        direction: "input",
        type: "float",
        localId: "sharpness",
        defaultValue: 2.0,
      },
      { name: "Result", direction: "output", type: "float3", localId: "out" },
    ],
    properties: {},
    shaderCode: `
      // MF_TriplanarProjection (%id%)
      float3 blendWeights_%id% = pow(abs(WorldNormal), %sharpness%);
      blendWeights_%id% /= dot(blendWeights_%id%, float3(1, 1, 1));
      
      float2 uvX_%id% = WorldPosition.yz * %tiling%;
      float2 uvY_%id% = WorldPosition.xz * %tiling%;
      float2 uvZ_%id% = WorldPosition.xy * %tiling%;
      
      float3 sampleX_%id% = Texture2DSample(%texX%, uvX_%id%).rgb;
      float3 sampleY_%id% = Texture2DSample(%texY%, uvY_%id%).rgb;
      float3 sampleZ_%id% = Texture2DSample(%texZ%, uvZ_%id%).rgb;
      
      float3 Triplanar_%id% = sampleX_%id% * blendWeights_%id%.x + 
                              sampleY_%id% * blendWeights_%id%.y + 
                              sampleZ_%id% * blendWeights_%id%.z;
    `,
  },

  // MF_ParallaxOcclusionMapping - POM for depth effect
  MF_ParallaxOcclusion: {
    title: "MF_ParallaxOcclusion",
    type: "material-function",
    category: "Material Functions|Built-in",
    icon: "🏔️",
    headerColor: "linear-gradient(180deg, #5a6a8a 0%, #3a4a6a 100%)",
    showPreview: false,
    pins: [
      {
        name: "Height Map",
        direction: "input",
        type: "texture2d",
        localId: "heightMap",
      },
      { name: "UV", direction: "input", type: "float2", localId: "uv" },
      {
        name: "Height Scale",
        direction: "input",
        type: "float",
        localId: "scale",
        defaultValue: 0.05,
      },
      {
        name: "Min Steps",
        direction: "input",
        type: "float",
        localId: "minSteps",
        defaultValue: 8,
      },
      {
        name: "Max Steps",
        direction: "input",
        type: "float",
        localId: "maxSteps",
        defaultValue: 32,
      },
      {
        name: "Displaced UV",
        direction: "output",
        type: "float2",
        localId: "outUV",
      },
    ],
    properties: {},
    shaderCode: `
      // MF_ParallaxOcclusion (%id%)
      float3 viewDir_%id% = normalize(CameraPosition - WorldPosition);
      float3 tanViewDir_%id% = mul(viewDir_%id%, TangentBasis);
      
      float numSteps_%id% = lerp(%maxSteps%, %minSteps%, abs(dot(float3(0, 0, 1), tanViewDir_%id%)));
      float stepSize_%id% = 1.0 / numSteps_%id%;
      float2 uvOffset_%id% = tanViewDir_%id%.xy * %scale% * stepSize_%id%;
      
      float2 currentUV_%id% = %uv%;
      float currentHeight_%id% = 1.0;
      float heightFromTexture_%id% = Texture2DSample(%heightMap%, currentUV_%id%).r;
      
      // Simple raymarching (abbreviated for shader snippet)
      for (int i = 0; i < int(numSteps_%id%); i++) {
        if (heightFromTexture_%id% > currentHeight_%id%) break;
        currentHeight_%id% -= stepSize_%id%;
        currentUV_%id% += uvOffset_%id%;
        heightFromTexture_%id% = Texture2DSample(%heightMap%, currentUV_%id%).r;
      }
      
      float2 POM_UV_%id% = currentUV_%id%;
    `,
  },
};
