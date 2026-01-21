/**
 * Constant Node Definitions
 * Contains Constant, Constant2Vector, Constant3Vector, Constant4Vector
 */

export const ConstantNodes = {
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
};
