/**
 * Parameter Node Definitions
 * Contains ScalarParameter, VectorParameter, TextureParameter, StaticBoolParameter
 */

export const ParameterNodes = {
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
};
