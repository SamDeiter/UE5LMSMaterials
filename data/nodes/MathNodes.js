/**
 * Math Node Definitions
 * Contains arithmetic operations: Add, Subtract, Multiply, Divide, Lerp, Clamp, etc.
 */

export const MathNodes = {
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

  Distance: {
    title: "Distance",
    type: "material-expression",
    category: "Math",
    icon: "↔",
    pins: [
      { id: "a", name: "A", type: "float3", dir: "in" },
      { id: "b", name: "B", type: "float3", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = distance({a}, {b});`,
  },

  Round: {
    title: "Round",
    type: "material-expression",
    category: "Math",
    icon: "≈",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = round({in});`,
  },

  Truncate: {
    title: "Truncate",
    type: "material-expression",
    category: "Math",
    icon: "⌊⌋",
    description: "Removes the fractional part (truncates towards zero)",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = trunc({in});`,
  },

  Step: {
    title: "Step",
    type: "material-expression",
    category: "Math",
    icon: "⊥",
    description: "Returns 0 if X < Y, else 1",
    pins: [
      { id: "y", name: "Y", type: "float", dir: "in" },
      { id: "x", name: "X", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = step({y}, {x});`,
  },

  SmoothStep: {
    title: "SmoothStep",
    type: "material-expression",
    category: "Math",
    icon: "∫",
    description: "Hermite interpolation between 0 and 1 when X is between Min and Max",
    pins: [
      { id: "min", name: "Min", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "max", name: "Max", type: "float", dir: "in", defaultValue: 1.0 },
      { id: "value", name: "Value", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = smoothstep({min}, {max}, {value});`,
  },
};
