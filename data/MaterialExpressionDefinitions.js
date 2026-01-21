/**
 * MaterialExpressionDefinitions.js
 *
 * MATERIAL EXPRESSION NODE LIBRARY
 * ================================
 * Each node is defined declaratively with:
 *   - Metadata (title, category, icon, hotkey)
 *   - Pins (inputs/outputs with types)
 *   - Shader code snippet (injected into the framework)
 *   - Properties (editable in Details panel)
 *
 * The MaterialNodeFramework handles all rendering and wiring logic.
 */

export const MaterialExpressionDefinitions = {
  // ========================================================================
  // MAIN MATERIAL OUTPUT NODE
  // ========================================================================
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
      // New pins from Encyclopedia
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

  // ========================================================================
  // CONSTANTS
  // ========================================================================
  Constant: {
    title: "Constant",
    type: "material-expression",
    category: "Constants",
    icon: "1",
    hotkey: "1",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    properties: {
      R: 0.0,
    },
    shaderCode: `float {OUTPUT} = {R};`,
  },

  Constant2Vector: {
    title: "Constant2Vector",
    type: "material-expression",
    category: "Constants",
    icon: "2",
    hotkey: "2",
    pins: [{ id: "out", name: "", type: "float2", dir: "out" }],
    properties: {
      R: 0.0,
      G: 0.0,
    },
    shaderCode: `float2 {OUTPUT} = float2({R}, {G});`,
  },

  Constant3Vector: {
    title: "Constant3Vector",
    type: "material-expression",
    category: "Constants",
    icon: "3",
    hotkey: "3",
    showPreview: true,
    pins: [{ id: "rgb", name: "", type: "float3", dir: "out" }],
    properties: {
      R: 1.0,
      G: 1.0,
      B: 1.0,
    },
    shaderCode: `float3 {OUTPUT} = float3({R}, {G}, {B});`,
  },

  Constant4Vector: {
    title: "Constant4Vector",
    type: "material-expression",
    category: "Constants",
    icon: "4",
    showPreview: true,
    pins: [{ id: "rgba", name: "", type: "float4", dir: "out" }],
    properties: {
      R: 1.0,
      G: 1.0,
      B: 1.0,
      A: 1.0,
    },
    shaderCode: `float4 {OUTPUT} = float4({R}, {G}, {B}, {A});`,
  },

  // ========================================================================
  // PARAMETERS (Exposed to Material Instances)
  // ========================================================================
  ScalarParameter: {
    title: "Scalar Parameter",
    type: "material-parameter",
    category: "Parameters",
    icon: "S",
    hotkey: "S",
    headerColor: "#00838F",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    properties: {
      ParameterName: "ScalarParam",
      Group: "",
      DefaultValue: 1.0,
      SliderMin: 0.0,
      SliderMax: 1.0,
    },
    shaderCode: `float {OUTPUT} = MaterialParameters.{ParameterName};`,
  },

  VectorParameter: {
    title: "Vector Parameter",
    type: "material-parameter",
    category: "Parameters",
    icon: "V",
    hotkey: "V",
    headerColor: "#00838F",
    showPreview: true,
    pins: [
      { id: "rgb", name: "RGB", type: "float3", dir: "out" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
      { id: "b", name: "B", type: "float", dir: "out" },
      { id: "a", name: "A", type: "float", dir: "out" },
    ],
    properties: {
      ParameterName: "ColorParam",
      Group: "",
      DefaultValue: { R: 1.0, G: 1.0, B: 1.0, A: 1.0 },
    },
    shaderCode: `
            float4 {OUTPUT}_full = MaterialParameters.{ParameterName};
            float3 {OUTPUT}_rgb = {OUTPUT}_full.rgb;
            float {OUTPUT}_r = {OUTPUT}_full.r;
            float {OUTPUT}_g = {OUTPUT}_full.g;
            float {OUTPUT}_b = {OUTPUT}_full.b;
            float {OUTPUT}_a = {OUTPUT}_full.a;
        `,
  },

  TextureParameter: {
    title: "Texture Sample Parameter",
    type: "material-parameter",
    category: "Parameters",
    icon: "T",
    headerColor: "#00838F",
    showPreview: true,
    pins: [
      { id: "uv", name: "UVs", type: "float2", dir: "in" },
      { id: "rgb", name: "RGB", type: "float3", dir: "out" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
      { id: "b", name: "B", type: "float", dir: "out" },
      { id: "a", name: "A", type: "float", dir: "out" },
    ],
    properties: {
      ParameterName: "TextureParam",
      Group: "",
      TextureAsset: null,
    },
    shaderCode: `
            float4 {OUTPUT}_sample = Texture2DSample(MaterialParameters.{ParameterName}, {uv});
            float3 {OUTPUT}_rgb = {OUTPUT}_sample.rgb;
            float {OUTPUT}_r = {OUTPUT}_sample.r;
            float {OUTPUT}_g = {OUTPUT}_sample.g;
            float {OUTPUT}_b = {OUTPUT}_sample.b;
            float {OUTPUT}_a = {OUTPUT}_sample.a;
        `,
  },

  StaticBoolParameter: {
    title: "Static Bool Parameter",
    type: "material-parameter",
    category: "Parameters",
    icon: "B",
    headerColor: "#00838F",
    pins: [{ id: "out", name: "", type: "bool", dir: "out" }],
    properties: {
      ParameterName: "BoolParam",
      Group: "",
      DefaultValue: false,
    },
    shaderCode: `bool {OUTPUT} = MaterialParameters.{ParameterName};`,
  },

  // ========================================================================
  // TEXTURE NODES
  // ========================================================================
  TextureSample: {
    title: "Texture Sample",
    type: "material-expression",
    category: "Texture",
    icon: "T",
    hotkey: "T",
    showPreview: true,
    pins: [
      { id: "uv", name: "UVs", type: "float2", dir: "in" },
      { id: "tex", name: "Tex", type: "texture", dir: "in" },
      { id: "rgb", name: "RGB", type: "float3", dir: "out" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
      { id: "b", name: "B", type: "float", dir: "out" },
      { id: "a", name: "A", type: "float", dir: "out" },
    ],
    properties: {
      TextureAsset: null,
      SamplerType: "Linear",
    },
    shaderCode: `
            float2 uv_coords = {uv} != float2(0,0) ? {uv} : GetDefaultUVs();
            float4 {OUTPUT}_sample = Texture2DSample({tex}, uv_coords);
            float3 {OUTPUT}_rgb = {OUTPUT}_sample.rgb;
            float {OUTPUT}_r = {OUTPUT}_sample.r;
            float {OUTPUT}_g = {OUTPUT}_sample.g;
            float {OUTPUT}_b = {OUTPUT}_sample.b;
            float {OUTPUT}_a = {OUTPUT}_sample.a;
        `,
  },

  TextureCoordinate: {
    title: "TexCoord",
    type: "material-expression",
    category: "Texture",
    icon: "●",
    pins: [{ id: "out", name: "", type: "float2", dir: "out" }],
    properties: {
      CoordinateIndex: 0,
      UTiling: 1.0,
      VTiling: 1.0,
    },
    shaderCode: `float2 {OUTPUT} = GetTextureCoordinates({CoordinateIndex}) * float2({UTiling}, {VTiling});`,
  },

  TextureObject: {
    title: "Texture Object",
    type: "material-expression",
    category: "Texture",
    icon: "□",
    showPreview: true,
    pins: [{ id: "out", name: "", type: "texture", dir: "out" }],
    properties: {
      TextureAsset: null,
    },
    shaderCode: `Texture2D {OUTPUT} = {TextureAsset};`,
  },

  Panner: {
    title: "Panner",
    type: "material-expression",
    category: "Texture",
    icon: "→",
    pins: [
      { id: "coordinate", name: "Coordinate", type: "float2", dir: "in" },
      { id: "time", name: "Time", type: "float", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      SpeedX: 0.0,
      SpeedY: 0.0,
    },
    shaderCode: `
            float time_val = {time} != 0.0 ? {time} : Time;
            float2 {OUTPUT} = {coordinate} + float2({SpeedX}, {SpeedY}) * time_val;
        `,
  },

  Rotator: {
    title: "Rotator",
    type: "material-expression",
    category: "Texture",
    icon: "↻",
    pins: [
      { id: "coordinate", name: "Coordinate", type: "float2", dir: "in" },
      { id: "center", name: "Center", type: "float2", dir: "in" },
      { id: "time", name: "Time", type: "float", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      Speed: 0.25,
    },
    shaderCode: `
            float2 center_pt = {center};
            float rot_time = {time} != 0.0 ? {time} : Time;
            float angle = rot_time * {Speed} * 6.28318;
            float2 offset = {coordinate} - center_pt;
            float2 {OUTPUT} = center_pt + float2(
                offset.x * cos(angle) - offset.y * sin(angle),
                offset.x * sin(angle) + offset.y * cos(angle)
            );
        `,
  },

  FlipBook: {
    title: "FlipBook",
    type: "material-expression",
    category: "Texture",
    icon: "▦",
    pins: [
      {
        id: "animation",
        name: "Animation Phase (0-1)",
        type: "float",
        dir: "in",
      },
      { id: "uv", name: "UVs", type: "float2", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      NumberOfRows: 4,
      NumberOfColumns: 4,
    },
    shaderCode: `
            float totalFrames = {NumberOfRows} * {NumberOfColumns};
            float frame = floor({animation} * totalFrames);
            float row = floor(frame / {NumberOfColumns});
            float col = fmod(frame, {NumberOfColumns});
            float2 frameSize = float2(1.0 / {NumberOfColumns}, 1.0 / {NumberOfRows});
            float2 {OUTPUT} = {uv} * frameSize + float2(col, row) * frameSize;
        `,
  },

  // ========================================================================
  // MATH NODES
  // ========================================================================
  Add: {
    title: "Add",
    type: "material-expression",
    category: "Math",
    icon: "+",
    hotkey: "A",
    pins: [
      { id: "a", name: "A", type: "wildcard", dir: "in", defaultValue: 0.0 },
      { id: "b", name: "B", type: "wildcard", dir: "in", defaultValue: 0.0 },
      { id: "out", name: "", type: "wildcard", dir: "out" },
    ],
    shaderCode: `auto {OUTPUT} = {a} + {b};`,
  },

  Subtract: {
    title: "Subtract",
    type: "material-expression",
    category: "Math",
    icon: "-",
    pins: [
      { id: "a", name: "A", type: "wildcard", dir: "in", defaultValue: 0.0 },
      { id: "b", name: "B", type: "wildcard", dir: "in", defaultValue: 0.0 },
      { id: "out", name: "", type: "wildcard", dir: "out" },
    ],
    shaderCode: `auto {OUTPUT} = {a} - {b};`,
  },

  Multiply: {
    title: "Multiply",
    type: "material-expression",
    category: "Math",
    icon: "×",
    hotkey: "M",
    pins: [
      { id: "a", name: "A", type: "wildcard", dir: "in", defaultValue: 1.0 },
      { id: "b", name: "B", type: "wildcard", dir: "in", defaultValue: 1.0 },
      { id: "out", name: "", type: "wildcard", dir: "out" },
    ],
    shaderCode: `auto {OUTPUT} = {a} * {b};`,
  },

  Divide: {
    title: "Divide",
    type: "material-expression",
    category: "Math",
    icon: "÷",
    pins: [
      { id: "a", name: "A", type: "wildcard", dir: "in", defaultValue: 1.0 },
      { id: "b", name: "B", type: "wildcard", dir: "in", defaultValue: 1.0 },
      { id: "out", name: "", type: "wildcard", dir: "out" },
    ],
    shaderCode: `auto {OUTPUT} = {a} / max({b}, 0.0001);`,
  },

  Lerp: {
    title: "LinearInterpolate",
    type: "material-expression",
    category: "Math",
    icon: "L",
    hotkey: "L",
    pins: [
      { id: "a", name: "A", type: "wildcard", dir: "in", defaultValue: 0.0 },
      { id: "b", name: "B", type: "wildcard", dir: "in", defaultValue: 1.0 },
      {
        id: "alpha",
        name: "Alpha",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
      },
      { id: "out", name: "", type: "wildcard", dir: "out" },
    ],
    shaderCode: `auto {OUTPUT} = lerp({a}, {b}, {alpha});`,
  },

  Clamp: {
    title: "Clamp",
    type: "material-expression",
    category: "Math",
    icon: "⊐",
    pins: [
      { id: "value", name: "Value", type: "float", dir: "in" },
      { id: "min", name: "Min", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "max", name: "Max", type: "float", dir: "in", defaultValue: 1.0 },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = clamp({value}, {min}, {max});`,
  },

  OneMinus: {
    title: "OneMinus",
    type: "material-expression",
    category: "Math",
    icon: "1-x",
    hotkey: "O",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = 1.0 - {in};`,
  },

  Power: {
    title: "Power",
    type: "material-expression",
    category: "Math",
    icon: "^",
    pins: [
      { id: "base", name: "Base", type: "float", dir: "in" },
      { id: "exp", name: "Exp", type: "float", dir: "in", defaultValue: 2.0 },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = pow(max({base}, 0.0001), {exp});`,
  },

  SquareRoot: {
    title: "SquareRoot",
    type: "material-expression",
    category: "Math",
    icon: "√",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = sqrt(max({in}, 0.0));`,
  },

  Abs: {
    title: "Abs",
    type: "material-expression",
    category: "Math",
    icon: "|x|",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = abs({in});`,
  },

  Sin: {
    title: "Sine",
    type: "material-expression",
    category: "Math",
    icon: "∿",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = sin({in});`,
  },

  Cos: {
    title: "Cosine",
    type: "material-expression",
    category: "Math",
    icon: "∿",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = cos({in});`,
  },

  Floor: {
    title: "Floor",
    type: "material-expression",
    category: "Math",
    icon: "⌊⌋",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = floor({in});`,
  },

  Ceil: {
    title: "Ceil",
    type: "material-expression",
    category: "Math",
    icon: "⌈⌉",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = ceil({in});`,
  },

  Frac: {
    title: "Frac",
    type: "material-expression",
    category: "Math",
    icon: ".x",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = frac({in});`,
  },

  Saturate: {
    title: "Saturate",
    type: "material-expression",
    category: "Math",
    icon: "⊏",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = saturate({in});`,
  },

  Max: {
    title: "Max",
    type: "material-expression",
    category: "Math",
    icon: "⊔",
    pins: [
      { id: "a", name: "A", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "b", name: "B", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = max({a}, {b});`,
  },

  Min: {
    title: "Min",
    type: "material-expression",
    category: "Math",
    icon: "⊓",
    pins: [
      { id: "a", name: "A", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "b", name: "B", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = min({a}, {b});`,
  },

  Fmod: {
    title: "Fmod",
    type: "material-expression",
    category: "Math",
    icon: "%",
    pins: [
      { id: "a", name: "A", type: "float", dir: "in", defaultValue: 1.0 },
      { id: "b", name: "B", type: "float", dir: "in", defaultValue: 1.0 },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = fmod({a}, {b});`,
  },

  // ========================================================================
  // VECTOR OPERATIONS
  // ========================================================================
  AppendVector: {
    title: "AppendVector",
    type: "material-expression",
    category: "Math|Vector",
    icon: "⊕",
    pins: [
      { id: "a", name: "A", type: "float", dir: "in" },
      { id: "b", name: "B", type: "float", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    shaderCode: `float2 {OUTPUT} = float2({a}, {b});`,
  },

  ComponentMask: {
    title: "ComponentMask",
    type: "material-expression",
    category: "Math|Vector",
    icon: "◫",
    pins: [
      { id: "in", name: "", type: "float4", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      R: true,
      G: false,
      B: false,
      A: false,
    },
    shaderCode: `float {OUTPUT} = {in}.{mask};`, // mask computed from R,G,B,A properties
  },

  BreakOutFloat3Components: {
    title: "BreakOutFloat3",
    type: "material-expression",
    category: "Math|Vector",
    icon: "⊟",
    pins: [
      { id: "in", name: "", type: "float3", dir: "in" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
      { id: "b", name: "B", type: "float", dir: "out" },
    ],
    shaderCode: `
            float {OUTPUT}_r = {in}.r;
            float {OUTPUT}_g = {in}.g;
            float {OUTPUT}_b = {in}.b;
        `,
  },

  MakeFloat3: {
    title: "MakeFloat3",
    type: "material-expression",
    category: "Math|Vector",
    icon: "⊞",
    pins: [
      { id: "r", name: "R", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "g", name: "G", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "b", name: "B", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `float3 {OUTPUT} = float3({r}, {g}, {b});`,
  },

  Normalize: {
    title: "Normalize",
    type: "material-expression",
    category: "Math|Vector",
    icon: "n̂",
    pins: [
      { id: "in", name: "", type: "float3", dir: "in" },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `float3 {OUTPUT} = normalize({in});`,
  },

  DotProduct: {
    title: "Dot",
    type: "material-expression",
    category: "Math|Vector",
    icon: "·",
    pins: [
      { id: "a", name: "A", type: "float3", dir: "in" },
      { id: "b", name: "B", type: "float3", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = dot({a}, {b});`,
  },

  CrossProduct: {
    title: "Cross",
    type: "material-expression",
    category: "Math|Vector",
    icon: "×",
    pins: [
      { id: "a", name: "A", type: "float3", dir: "in" },
      { id: "b", name: "B", type: "float3", dir: "in" },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `float3 {OUTPUT} = cross({a}, {b});`,
  },

  // ========================================================================
  // UTILITY NODES
  // ========================================================================
  Fresnel: {
    title: "Fresnel",
    type: "material-expression",
    category: "Utility",
    icon: "F",
    hotkey: "F",
    pins: [
      { id: "exp_in", name: "ExponentIn", type: "float", dir: "in" },
      {
        id: "base_reflect",
        name: "BaseReflect",
        type: "float",
        dir: "in",
        defaultValue: 0.04,
      },
      { id: "normal", name: "Normal", type: "float3", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      Exponent: 5.0,
      BaseReflectFraction: 0.04,
    },
    shaderCode: `
            float3 normal_vec = length({normal}) > 0 ? {normal} : PixelNormalWS;
            float exp_val = {exp_in} != 0.0 ? {exp_in} : {Exponent};
            float {OUTPUT} = {base_reflect} + (1.0 - {base_reflect}) * pow(1.0 - saturate(dot(normal_vec, CameraVectorWS)), exp_val);
        `,
  },

  BumpOffset: {
    title: "BumpOffset",
    type: "material-expression",
    category: "Utility",
    icon: "B",
    hotkey: "B",
    pins: [
      { id: "coordinate", name: "Coordinate", type: "float2", dir: "in" },
      { id: "height", name: "Height", type: "float", dir: "in" },
      { id: "height_ratio", name: "HeightRatio", type: "float", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      HeightRatioInput: 0.05,
      ReferencePlane: 0.5,
    },
    shaderCode: `
            float2 uv_in = {coordinate};
            float h = {height} - {ReferencePlane};
            float ratio = {height_ratio} != 0.0 ? {height_ratio} : {HeightRatioInput};
            float3 viewDir = normalize(CameraVectorWS);
            float2 {OUTPUT} = uv_in + (viewDir.xy / viewDir.z) * h * ratio;
        `,
  },

  ReflectionVector: {
    title: "ReflectionVector",
    type: "material-expression",
    category: "Vectors",
    icon: "R",
    hotkey: "R",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = reflect(-CameraVectorWS, PixelNormalWS);`,
  },

  Time: {
    title: "Time",
    type: "material-expression",
    category: "Utility",
    icon: "⏱",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    shaderCode: `float {OUTPUT} = Time;`,
  },

  CameraVector: {
    title: "CameraVector",
    type: "material-expression",
    category: "Utility",
    icon: "📷",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = CameraVectorWS;`,
  },

  PixelNormalWS: {
    title: "PixelNormalWS",
    type: "material-expression",
    category: "Utility",
    icon: "N",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = PixelNormalWS;`,
  },

  WorldPosition: {
    title: "WorldPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "W",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = WorldPositionWS;`,
  },

  ObjectPosition: {
    title: "ObjectPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "O",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = ObjectPositionWS;`,
  },

  CameraPosition: {
    title: "CameraPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "📍",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = CameraPositionWS;`,
  },

  VertexNormalWS: {
    title: "VertexNormalWS",
    type: "material-expression",
    category: "Coordinates",
    icon: "V",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = VertexNormalWS;`,
  },

  ScreenPosition: {
    title: "ScreenPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "⊡",
    pins: [{ id: "out", name: "", type: "float2", dir: "out" }],
    shaderCode: `float2 {OUTPUT} = ScreenUV;`,
  },

  FlattenNormal: {
    title: "FlattenNormal",
    type: "material-expression",
    category: "Utility",
    icon: "⊥",
    pins: [
      { id: "normal", name: "Normal", type: "float3", dir: "in" },
      {
        id: "flatness",
        name: "Flatness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
      },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `float3 {OUTPUT} = lerp({normal}, float3(0, 0, 1), {flatness});`,
  },

  // ========================================================================
  // WORLD POSITION OFFSET NODES
  // ========================================================================
  RotateAboutAxis: {
    title: "RotateAboutAxis",
    type: "material-expression",
    category: "Utility",
    icon: "↻",
    description:
      "Rotates a position around an axis using Rodrigues' rotation formula. Returns the OFFSET (delta) to add to World Position Offset.",
    pins: [
      {
        id: "rotation_axis",
        name: "NormalizedRotationAxis",
        type: "float3",
        dir: "in",
        defaultValue: [0, 0, 1],
        tooltip: "The axis to rotate around (should be normalized)",
      },
      {
        id: "rotation_angle",
        name: "RotationAngle",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
        tooltip: "Angle in radians (use Time node for animation)",
      },
      {
        id: "pivot_point",
        name: "PivotPoint",
        type: "float3",
        dir: "in",
        defaultValue: [0, 0, 0],
        tooltip: "The center point of rotation (usually ObjectPosition)",
      },
      {
        id: "position",
        name: "Position",
        type: "float3",
        dir: "in",
        tooltip: "The position to rotate (usually WorldPosition)",
      },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `
            // Rodrigues' rotation formula - returns OFFSET (delta)
            float3 _axis = normalize({rotation_axis});
            float _angle = {rotation_angle};
            float3 _point = {position} - {pivot_point};
            
            float _sin, _cos;
            sincos(_angle, _sin, _cos);
            
            // Rotated point = point*cos + (axis x point)*sin + axis*(axis·point)*(1-cos)
            float3 _rotated = _point * _cos 
                            + cross(_axis, _point) * _sin 
                            + _axis * dot(_axis, _point) * (1.0 - _cos);
            
            float3 {OUTPUT} = _rotated + {pivot_point} - {position};
        `,
  },

  // ========================================================================
  // NORMAL MAP UTILITY NODES
  // ========================================================================
  DeriveNormalZ: {
    title: "DeriveNormalZ",
    type: "material-expression",
    category: "Utility",
    icon: "Z",
    description:
      "Reconstructs the Z component of a normal vector from X and Y. Essential for BC5 (2-channel) compressed normal maps.",
    pins: [
      {
        id: "in_xy",
        name: "InXY",
        type: "float2",
        dir: "in",
        tooltip: "The XY components of the normal (from RG channels of BC5 texture)",
      },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `
            // Reconstruct Z from unit vector: x² + y² + z² = 1
            // saturate prevents NaN from compression artifacts
            float3 {OUTPUT};
            {OUTPUT}.xy = {in_xy};
            {OUTPUT}.z = sqrt(saturate(1.0 - dot({in_xy}, {in_xy})));
        `,
  },

  // ========================================================================
  // MASKING UTILITY NODES
  // ========================================================================
  SphereMask: {
    title: "SphereMask",
    type: "material-expression",
    category: "Utility",
    icon: "◯",
    description:
      "Creates a spherical falloff mask. Useful for local effects, interaction highlights, and atmospheric effects.",
    pins: [
      {
        id: "a",
        name: "A",
        type: "float3",
        dir: "in",
        tooltip: "First position (e.g., WorldPosition)",
      },
      {
        id: "b",
        name: "B",
        type: "float3",
        dir: "in",
        tooltip: "Second position (e.g., effect center)",
      },
      {
        id: "radius",
        name: "Radius",
        type: "float",
        dir: "in",
        defaultValue: 100.0,
        tooltip: "Inner radius where mask is 1",
      },
      {
        id: "hardness",
        name: "Hardness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
        tooltip: "Falloff sharpness (0=soft, 1=hard edge)",
      },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      AttenuationRadius: 100.0,
      HardnessPercent: 0.5,
    },
    shaderCode: `
            float _dist = distance({a}, {b});
            float _rad = {radius} != 0.0 ? {radius} : {AttenuationRadius};
            float _hard = {hardness} != 0.0 ? {hardness} : {HardnessPercent};
            float _falloff = _rad * (1.0 - _hard);
            float {OUTPUT} = 1.0 - saturate((_dist - _rad + _falloff) / max(_falloff, 0.0001));
        `,
  },

  // ========================================================================
  // CONTROL FLOW
  // ========================================================================
  StaticSwitch: {
    title: "StaticSwitch",
    type: "material-expression",
    category: "Utility",
    icon: "⇄",
    pins: [
      { id: "true_in", name: "True", type: "float", dir: "in" },
      { id: "false_in", name: "False", type: "float", dir: "in" },
      { id: "value", name: "Value", type: "bool", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      DefaultValue: true,
    },
    shaderCode: `float {OUTPUT} = {value} ? {true_in} : {false_in};`,
  },

  If: {
    title: "If",
    type: "material-expression",
    category: "Utility",
    icon: "?",
    pins: [
      { id: "a", name: "A", type: "float", dir: "in" },
      { id: "b", name: "B", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "a_greater", name: "A > B", type: "float", dir: "in" },
      { id: "a_equal", name: "A = B", type: "float", dir: "in" },
      { id: "a_less", name: "A < B", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = {a} > {b} ? {a_greater} : ({a} < {b} ? {a_less} : {a_equal});`,
  },

  // ========================================================================
  // NOISE
  // ========================================================================
  Noise: {
    title: "Noise",
    type: "material-expression",
    category: "Utility",
    icon: "◌",
    pins: [
      { id: "position", name: "Position", type: "float3", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      Scale: 1.0,
      Quality: 1,
      Function: "Simplex",
    },
    shaderCode: `float {OUTPUT} = SimplexNoise({position} * {Scale});`,
  },

  // ========================================================================
  // DEPTH NODES (Translucency & Scene Sampling)
  // ========================================================================
  PixelDepth: {
    title: "PixelDepth",
    type: "material-expression",
    category: "Depth",
    icon: "D",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    shaderCode: `float {OUTPUT} = PixelDepth;`,
  },

  SceneDepth: {
    title: "SceneDepth",
    type: "material-expression",
    category: "Depth",
    icon: "S",
    pins: [
      { id: "uv", name: "UV", type: "float2", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = SampleSceneDepth({uv});`,
  },

  DepthFade: {
    title: "DepthFade",
    type: "material-expression",
    category: "Depth",
    icon: "≈",
    pins: [
      {
        id: "opacity",
        name: "Opacity",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
      },
      { id: "fade_distance", name: "Fade Distance", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      FadeDistanceDefault: 100.0,
    },
    shaderCode: `
            float fade_dist = {fade_distance} != 0.0 ? {fade_distance} : {FadeDistanceDefault};
            float depth_diff = SceneDepth - PixelDepth;
            float {OUTPUT} = {opacity} * saturate(depth_diff / fade_dist);
        `,
  },

  // ========================================================================
  // COMMENT NODES (Visual Organization)
  // ========================================================================
  Comment: {
    title: "Comment",
    type: "comment-node",
    category: "Utility",
    icon: "💬",
    hotkey: "C",
    headerColor: "#2E7D32",
    pins: [],
    properties: {
      CommentText: "New Comment",
      Width: 200,
      Height: 100,
      CommentColor: { R: 0.18, G: 0.49, B: 0.2 },
    },
  },

  // ========================================================================
  // REROUTE NODES (Wire Organization)
  // ========================================================================
  RerouteNode: {
    title: "",
    type: "reroute-node",
    category: "Utility",
    icon: "",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `{OUTPUT} = {in};`,
  },

  NamedRerouteDeclaration: {
    title: "Named Reroute",
    type: "named-reroute",
    category: "Utility",
    icon: "◉",
    pins: [{ id: "in", name: "", type: "float", dir: "in" }],
    properties: {
      Name: "RerouteName",
    },
    shaderCode: `// Named reroute: {Name} = {in};`,
  },

  NamedRerouteUsage: {
    title: "Named Reroute Usage",
    type: "named-reroute-usage",
    category: "Utility",
    icon: "○",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    properties: {
      Declaration: null, // Reference to NamedRerouteDeclaration
    },
    shaderCode: `{OUTPUT} = NamedReroute_{Name};`,
  },

  // ========================================================================
  // SUBSTRATE MATERIAL FRAMEWORK (UE5.1+)
  // ========================================================================
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
