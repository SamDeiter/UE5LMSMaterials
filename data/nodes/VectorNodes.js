/**
 * Vector Node Definitions
 * Contains vector operations: Normalize, Dot, Cross, AppendVector, ComponentMask, etc.
 */

export const VectorNodes = {
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

  ReflectionVector: {
    title: "ReflectionVector",
    type: "material-expression",
    category: "Vectors",
    icon: "R",
    hotkey: "R",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = reflect(-CameraVectorWS, PixelNormalWS);`,
  },

  BreakOutFloat2Components: {
    title: "BreakOutFloat2",
    type: "material-expression",
    category: "Math|Vector",
    icon: "⊟",
    description: "Breaks a float2 into R and G components",
    pins: [
      { id: "in", name: "", type: "float2", dir: "in" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
    ],
    shaderCode: `
            float {OUTPUT}_r = {in}.r;
            float {OUTPUT}_g = {in}.g;
        `,
  },

  BreakOutFloat4Components: {
    title: "BreakOutFloat4",
    type: "material-expression",
    category: "Math|Vector",
    icon: "⊟",
    description: "Breaks a float4 into R, G, B, and A components",
    pins: [
      { id: "in", name: "", type: "float4", dir: "in" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
      { id: "b", name: "B", type: "float", dir: "out" },
      { id: "a", name: "A", type: "float", dir: "out" },
    ],
    shaderCode: `
            float {OUTPUT}_r = {in}.r;
            float {OUTPUT}_g = {in}.g;
            float {OUTPUT}_b = {in}.b;
            float {OUTPUT}_a = {in}.a;
        `,
  },

  MakeFloat2: {
    title: "MakeFloat2",
    type: "material-expression",
    category: "Math|Vector",
    icon: "⊞",
    description: "Combines two floats into a float2",
    pins: [
      { id: "r", name: "R", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "g", name: "G", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    shaderCode: `float2 {OUTPUT} = float2({r}, {g});`,
  },

  MakeFloat4: {
    title: "MakeFloat4",
    type: "material-expression",
    category: "Math|Vector",
    icon: "⊞",
    description: "Combines four floats into a float4",
    pins: [
      { id: "r", name: "R", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "g", name: "G", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "b", name: "B", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "a", name: "A", type: "float", dir: "in", defaultValue: 1.0 },
      { id: "out", name: "", type: "float4", dir: "out" },
    ],
    shaderCode: `float4 {OUTPUT} = float4({r}, {g}, {b}, {a});`,
  },
};
