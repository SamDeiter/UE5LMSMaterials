/**
 * AdvancedNodes.js
 *
 * Advanced UE5 Material Editor nodes including:
 * - Curve Atlas (procedural curve lookups)
 * - Runtime Virtual Textures (RVT)
 * - Nanite/Lumen support nodes
 * - Custom Expressions
 */

export const AdvancedNodes = {
  // ===========================================================================
  // CURVE ATLAS NODES
  // ===========================================================================

  /**
   * CurveAtlasRowParameter - Sample from a curve atlas
   */
  CurveAtlasRowParameter: {
    type: "expression",
    title: "Curve Atlas Row Parameter",
    category: "Parameters",
    description: "Samples a curve from a Curve Atlas texture",
    color: "#4a6b8a",
    pins: [
      {
        localId: "atlas",
        name: "Atlas",
        direction: "input",
        type: "texture2d",
        description: "Curve Atlas texture asset",
      },
      {
        localId: "curveIndex",
        name: "Curve Index",
        direction: "input",
        type: "float",
        defaultValue: 0,
        description: "Index of the curve row in the atlas",
      },
      {
        localId: "inputValue",
        name: "Input Value",
        direction: "input",
        type: "float",
        defaultValue: 0.5,
        description: "Input value (0-1) to sample along the curve",
      },
      {
        localId: "result",
        name: "Result",
        direction: "output",
        type: "float4",
        description: "Sampled RGBA value from curve",
      },
    ],
    properties: {
      ParameterName: "CurveAtlas",
      DefaultCurve: "Linear",
    },
    shaderCode: `
      // Curve Atlas Row Parameter
      float2 curveUV_%id% = float2(%inputValue%, %curveIndex% / AtlasRows);
      float4 %id%_result = CurveAtlasSample(%atlas%, curveUV_%id%);
    `,
  },

  /**
   * ScalarCurveParameter - Simple scalar curve lookup
   */
  ScalarCurveParameter: {
    type: "expression",
    title: "Scalar Curve Parameter",
    category: "Parameters",
    description: "Evaluate a scalar curve at a given time",
    color: "#4a6b8a",
    pins: [
      {
        localId: "time",
        name: "Time",
        direction: "input",
        type: "float",
        defaultValue: 0,
        description: "Time/position along the curve (0-1)",
      },
      {
        localId: "result",
        name: "Result",
        direction: "output",
        type: "float",
        description: "Evaluated curve value",
      },
    ],
    properties: {
      ParameterName: "ScalarCurve",
      CurveType: "Float",
      DefaultValue: 1.0,
    },
    shaderCode: `
      // Scalar Curve Parameter
      float %id%_result = EvaluateCurve(%time%, CurveData_%id%);
    `,
  },

  /**
   * VectorCurveParameter - RGB curve lookup
   */
  VectorCurveParameter: {
    type: "expression",
    title: "Vector Curve Parameter",
    category: "Parameters",
    description: "Evaluate an RGB vector curve at a given time",
    color: "#4a6b8a",
    pins: [
      {
        localId: "time",
        name: "Time",
        direction: "input",
        type: "float",
        defaultValue: 0,
        description: "Time/position along the curve (0-1)",
      },
      {
        localId: "result",
        name: "Result",
        direction: "output",
        type: "float3",
        description: "Evaluated RGB curve value",
      },
    ],
    properties: {
      ParameterName: "VectorCurve",
      DefaultColor: [1, 1, 1],
    },
    shaderCode: `
      // Vector Curve Parameter
      float3 %id%_result = EvaluateColorCurve(%time%, CurveData_%id%);
    `,
  },

  // ===========================================================================
  // RUNTIME VIRTUAL TEXTURE (RVT) NODES
  // ===========================================================================

  /**
   * RuntimeVirtualTextureSample - Sample from RVT
   */
  RuntimeVirtualTextureSample: {
    type: "expression",
    title: "Runtime Virtual Texture Sample",
    category: "Textures",
    description: "Sample from a Runtime Virtual Texture",
    color: "#8b4513",
    pins: [
      {
        localId: "virtualTexture",
        name: "Virtual Texture",
        direction: "input",
        type: "virtualTexture",
        description: "Runtime Virtual Texture asset",
      },
      {
        localId: "uvs",
        name: "UVs",
        direction: "input",
        type: "float2",
        description: "World position XY for sampling",
      },
      {
        localId: "worldHeight",
        name: "World Height",
        direction: "input",
        type: "float",
        defaultValue: 0,
        description: "World Z position",
      },
      {
        localId: "baseColor",
        name: "Base Color",
        direction: "output",
        type: "float3",
        description: "Sampled base color",
      },
      {
        localId: "specular",
        name: "Specular",
        direction: "output",
        type: "float",
        description: "Sampled specular value",
      },
      {
        localId: "roughness",
        name: "Roughness",
        direction: "output",
        type: "float",
        description: "Sampled roughness value",
      },
      {
        localId: "normal",
        name: "Normal",
        direction: "output",
        type: "float3",
        description: "Sampled world normal",
      },
      {
        localId: "mask",
        name: "Mask",
        direction: "output",
        type: "float",
        description: "Virtual texture mask",
      },
    ],
    properties: {
      VirtualTextureContent: "YCoCg BaseColor, Normal, Roughness, Specular",
      bSinglePhysicalSpace: false,
      bAdaptive: true,
    },
    shaderCode: `
      // Runtime Virtual Texture Sample
      VTPageTableResult PageTable_%id% = VirtualTexturePageTable(%virtualTexture%, %uvs%);
      float4 Sample0_%id% = VirtualTextureSample(PageTable_%id%, 0);
      float4 Sample1_%id% = VirtualTextureSample(PageTable_%id%, 1);
      
      float3 %id%_baseColor = DecodeYCoCg(Sample0_%id%.rgb);
      float3 %id%_normal = DecodeNormal(Sample1_%id%.rg);
      float %id%_roughness = Sample1_%id%.b;
      float %id%_specular = Sample1_%id%.a;
      float %id%_mask = saturate(PageTable_%id%.Coverage);
    `,
  },

  /**
   * RuntimeVirtualTextureOutput - Write to RVT
   */
  RuntimeVirtualTextureOutput: {
    type: "expression",
    title: "Runtime Virtual Texture Output",
    category: "Textures",
    description: "Output to a Runtime Virtual Texture",
    color: "#8b4513",
    pins: [
      {
        localId: "baseColor",
        name: "Base Color",
        direction: "input",
        type: "float3",
        defaultValue: [0.5, 0.5, 0.5],
        description: "Base color to write",
      },
      {
        localId: "specular",
        name: "Specular",
        direction: "input",
        type: "float",
        defaultValue: 0.5,
        description: "Specular value to write",
      },
      {
        localId: "roughness",
        name: "Roughness",
        direction: "input",
        type: "float",
        defaultValue: 0.5,
        description: "Roughness value to write",
      },
      {
        localId: "normal",
        name: "Normal",
        direction: "input",
        type: "float3",
        defaultValue: [0, 0, 1],
        description: "Normal to write",
      },
      {
        localId: "worldHeight",
        name: "World Height",
        direction: "input",
        type: "float",
        defaultValue: 0,
        description: "World Z for height output",
      },
      {
        localId: "opacity",
        name: "Opacity",
        direction: "input",
        type: "float",
        defaultValue: 1,
        description: "Output opacity/mask",
      },
    ],
    properties: {
      VirtualTextureContent:
        "YCoCg BaseColor, Normal, Roughness, Specular, WorldHeight",
    },
    shaderCode: `
      // Runtime Virtual Texture Output
      RVTOutput_%id%.BaseColor = EncodeYCoCg(%baseColor%);
      RVTOutput_%id%.Normal = EncodeNormal(%normal%);
      RVTOutput_%id%.Roughness = %roughness%;
      RVTOutput_%id%.Specular = %specular%;
      RVTOutput_%id%.WorldHeight = %worldHeight%;
      RVTOutput_%id%.Opacity = %opacity%;
    `,
  },

  // ===========================================================================
  // NANITE / LUMEN NODES
  // ===========================================================================

  /**
   * NaniteVertexFactory - Nanite-specific vertex data
   */
  NaniteFallbackFactor: {
    type: "expression",
    title: "Nanite Fallback Factor",
    category: "Utility",
    description:
      "Returns 1 when rendering Nanite proxy mesh, 0 for full Nanite rendering",
    color: "#6a8759",
    pins: [
      {
        localId: "result",
        name: "Fallback Factor",
        direction: "output",
        type: "float",
        description: "1.0 for proxy, 0.0 for Nanite",
      },
    ],
    properties: {},
    shaderCode: `
      // Nanite Fallback Factor
      float %id%_result = GetNaniteFallbackFactor();
    `,
  },

  /**
   * IsNaniteProxy - Check if rendering Nanite proxy
   */
  IsNaniteProxy: {
    type: "expression",
    title: "Is Nanite Proxy",
    category: "Utility",
    description: "Returns true if currently rendering the Nanite fallback mesh",
    color: "#6a8759",
    pins: [
      {
        localId: "result",
        name: "Is Proxy",
        direction: "output",
        type: "bool",
        description: "True if proxy mesh",
      },
    ],
    properties: {},
    shaderCode: `
      // Is Nanite Proxy
      bool %id%_result = IsNaniteProxyMesh();
    `,
  },

  /**
   * LumenCardCapture - Info about Lumen card captures
   */
  IsLumenCardCapture: {
    type: "expression",
    title: "Is Lumen Card Capture",
    category: "Utility",
    description: "Returns true during Lumen surface cache capture pass",
    color: "#8a6b4a",
    pins: [
      {
        localId: "result",
        name: "Is Card Capture",
        direction: "output",
        type: "bool",
        description: "True during Lumen capture",
      },
    ],
    properties: {},
    shaderCode: `
      // Is Lumen Card Capture
      bool %id%_result = IsLumenCardCapturePass();
    `,
  },

  /**
   * SkyAtmosphereLightDirection - Get sun/moon direction for Lumen
   */
  SkyAtmosphereLightDirection: {
    type: "expression",
    title: "Sky Atmosphere Light Direction",
    category: "Atmosphere",
    description: "Returns the direction to the main sky light (sun)",
    color: "#87ceeb",
    pins: [
      {
        localId: "lightIndex",
        name: "Light Index",
        direction: "input",
        type: "int",
        defaultValue: 0,
        description: "0 = Sun, 1 = Moon",
      },
      {
        localId: "direction",
        name: "Light Direction",
        direction: "output",
        type: "float3",
        description: "Normalized direction to light",
      },
    ],
    properties: {},
    shaderCode: `
      // Sky Atmosphere Light Direction
      float3 %id%_direction = GetSkyLightDirection(%lightIndex%);
    `,
  },

  /**
   * SkyAtmosphereLightDiskLuminance - Sun/moon disk brightness
   */
  SkyAtmosphereLightDiskLuminance: {
    type: "expression",
    title: "Sky Atmosphere Light Disk Luminance",
    category: "Atmosphere",
    description: "Returns the luminance of the sun/moon disk",
    color: "#87ceeb",
    pins: [
      {
        localId: "lightIndex",
        name: "Light Index",
        direction: "input",
        type: "int",
        defaultValue: 0,
        description: "0 = Sun, 1 = Moon",
      },
      {
        localId: "luminance",
        name: "Luminance",
        direction: "output",
        type: "float3",
        description: "Light disk luminance (RGB)",
      },
    ],
    properties: {},
    shaderCode: `
      // Sky Atmosphere Light Disk Luminance
      float3 %id%_luminance = GetSkyLightDiskLuminance(%lightIndex%);
    `,
  },

  // ===========================================================================
  // CUSTOM EXPRESSION NODES
  // ===========================================================================

  /**
   * Custom - Write custom HLSL code
   */
  Custom: {
    type: "expression",
    title: "Custom",
    category: "Custom",
    description: "Write custom HLSL shader code",
    color: "#cc7000",
    pins: [
      {
        localId: "input0",
        name: "Input 0",
        direction: "input",
        type: "float4",
        description: "First custom input",
      },
      {
        localId: "input1",
        name: "Input 1",
        direction: "input",
        type: "float4",
        description: "Second custom input",
      },
      {
        localId: "result",
        name: "Result",
        direction: "output",
        type: "float4",
        description: "Custom output",
      },
    ],
    properties: {
      Code: "return Input0;",
      OutputType: "float4",
      Description: "Custom expression",
      AdditionalDefines: "",
      IncludeFilePaths: "",
    },
    shaderCode: `
      // Custom Expression
      // User code: %Code%
      float4 %id%_result = CustomExpression_%id%(%input0%, %input1%);
    `,
  },

  /**
   * DebugScalarValues - Visualize scalar for debugging
   */
  DebugScalarValues: {
    type: "expression",
    title: "Debug Scalar Values",
    category: "Debug",
    description: "Visualize scalar values as colors for debugging",
    color: "#ff6600",
    pins: [
      {
        localId: "value",
        name: "Value",
        direction: "input",
        type: "float",
        defaultValue: 0.5,
        description: "Scalar value to visualize",
      },
      {
        localId: "minRange",
        name: "Min Range",
        direction: "input",
        type: "float",
        defaultValue: 0,
        description: "Minimum expected value (blue)",
      },
      {
        localId: "maxRange",
        name: "Max Range",
        direction: "input",
        type: "float",
        defaultValue: 1,
        description: "Maximum expected value (red)",
      },
      {
        localId: "result",
        name: "Color",
        direction: "output",
        type: "float3",
        description: "Debug visualization color",
      },
    ],
    properties: {
      ColorMode: "BlueToRed",
    },
    shaderCode: `
      // Debug Scalar Values
      float normalized_%id% = saturate((%value% - %minRange%) / (%maxRange% - %minRange%));
      float3 %id%_result = lerp(float3(0, 0, 1), float3(1, 0, 0), normalized_%id%);
    `,
  },

  /**
   * DebugFloat2Values - Visualize float2 as RG
   */
  DebugFloat2Values: {
    type: "expression",
    title: "Debug Float2 Values",
    category: "Debug",
    description: "Visualize float2 values as RG colors",
    color: "#ff6600",
    pins: [
      {
        localId: "value",
        name: "Value",
        direction: "input",
        type: "float2",
        defaultValue: [0.5, 0.5],
        description: "Float2 value to visualize",
      },
      {
        localId: "result",
        name: "Color",
        direction: "output",
        type: "float3",
        description: "Debug visualization (RG, B=0)",
      },
    ],
    properties: {},
    shaderCode: `
      // Debug Float2 Values
      float3 %id%_result = float3(saturate(%value%), 0);
    `,
  },

  /**
   * DebugFloat3Values - Visualize float3 as RGB
   */
  DebugFloat3Values: {
    type: "expression",
    title: "Debug Float3 Values",
    category: "Debug",
    description: "Visualize float3 values as RGB colors",
    color: "#ff6600",
    pins: [
      {
        localId: "value",
        name: "Value",
        direction: "input",
        type: "float3",
        defaultValue: [0.5, 0.5, 0.5],
        description: "Float3 value to visualize",
      },
      {
        localId: "result",
        name: "Color",
        direction: "output",
        type: "float3",
        description: "Debug visualization (RGB)",
      },
    ],
    properties: {},
    shaderCode: `
      // Debug Float3 Values  
      float3 %id%_result = saturate(%value%);
    `,
  },

  /**
   * Comment - Visual comment box (no code output)
   */
  Comment: {
    type: "utility",
    title: "Comment",
    category: "Utility",
    description: "Add a comment to the graph (no shader output)",
    color: "#444444",
    pins: [],
    properties: {
      CommentText: "Add comment here...",
      CommentColor: "#444444",
      FontSize: 14,
    },
    shaderCode: `
      // Comment: %CommentText%
    `,
  },

  /**
   * Reroute - Visual wire routing node
   */
  Reroute: {
    type: "utility",
    title: "Reroute",
    category: "Utility",
    description: "Reroute node for cleaner wire organization",
    color: "#333333",
    pins: [
      {
        localId: "input",
        name: "",
        direction: "input",
        type: "wildcard",
        description: "Input (any type)",
      },
      {
        localId: "output",
        name: "",
        direction: "output",
        type: "wildcard",
        description: "Output (same as input)",
      },
    ],
    properties: {},
    shaderCode: `
      // Reroute passthrough
      auto %id%_output = %input%;
    `,
  },

  /**
   * NamedReroute - Named reroute for referencing
   */
  NamedRerouteDeclaration: {
    type: "utility",
    title: "Named Reroute Declaration",
    category: "Utility",
    description: "Declare a named reroute that can be used elsewhere",
    color: "#555555",
    pins: [
      {
        localId: "input",
        name: "Value",
        direction: "input",
        type: "wildcard",
        description: "Value to name",
      },
    ],
    properties: {
      Name: "MyValue",
    },
    shaderCode: `
      // Named Reroute Declaration: %Name%
      #define NamedReroute_%Name% %input%
    `,
  },

  /**
   * NamedRerouteUsage - Use a named reroute
   */
  NamedRerouteUsage: {
    type: "utility",
    title: "Named Reroute Usage",
    category: "Utility",
    description: "Use a previously declared named reroute",
    color: "#555555",
    pins: [
      {
        localId: "output",
        name: "Value",
        direction: "output",
        type: "wildcard",
        description: "Referenced value",
      },
    ],
    properties: {
      Name: "MyValue",
    },
    shaderCode: `
      // Named Reroute Usage: %Name%
      auto %id%_output = NamedReroute_%Name%;
    `,
  },
};
