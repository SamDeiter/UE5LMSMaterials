/**
 * Material Studio - Node Registry
 * Defines all available node types with their inputs, outputs, and evaluation functions.
 */

import {
  Vec3,
  toVec,
  toScalar,
  operate,
  operateSingle,
  lerp,
  clamp,
} from "./utils.js";

/**
 * All node type definitions
 */
export const NODE_TYPES = {
  // ═══════════════════════════════════════════════════════════════════════════
  // DATA TYPES
  // ═══════════════════════════════════════════════════════════════════════════

  float: {
    category: "Data Types",
    title: "Float (Scalar)",
    inputs: [],
    outputs: [{ id: "out", type: "float" }],
    data: { value: 0.5 },
    renderUI: (data, id) => `
            <div class="node-ui-row">
                <input type="range" min="0" max="1" step="0.01" value="${
                  data.value
                }" 
                    data-node="${id}" data-key="value" class="node-slider">
                <span class="node-value" id="val_${id}">${parseFloat(
      data.value
    ).toFixed(2)}</span>
            </div>`,
    func: (_, data) => data.value,
  },

  float2: {
    category: "Data Types",
    title: "Float2 (Vector2)",
    inputs: [],
    outputs: [{ id: "out", type: "float2" }],
    data: { x: 0, y: 0 },
    renderUI: (data, id) => `
            <div class="node-ui-row">
                <span class="node-label">X</span>
                <input type="number" class="node-input-small" value="${data.x}" 
                    data-node="${id}" data-key="x">
            </div>
            <div class="node-ui-row">
                <span class="node-label">Y</span>
                <input type="number" class="node-input-small" value="${data.y}" 
                    data-node="${id}" data-key="y">
            </div>`,
    func: (_, data) => ({ x: data.x, y: data.y }),
  },

  float3: {
    category: "Data Types",
    title: "Float3 (Vector3)",
    inputs: [],
    outputs: [{ id: "out", type: "float3" }],
    data: { value: "#ff0000" },
    renderUI: (data, id) => `
            <div class="node-ui-row">
                <input type="color" value="${data.value}" data-node="${id}" data-key="value" class="node-color">
            </div>`,
    func: (_, data) => toVec(data.value),
  },

  float4: {
    category: "Data Types",
    title: "Float4 (Vector4)",
    inputs: [],
    outputs: [
      { id: "rgba", type: "float4" },
      { id: "r", type: "float" },
      { id: "g", type: "float" },
      { id: "b", type: "float" },
      { id: "a", type: "float" },
    ],
    data: { value: "#ff0000", a: 1.0 },
    renderUI: (data, id) => `
            <div class="node-ui-row">
                <input type="color" value="${data.value}" data-node="${id}" data-key="value" class="node-color">
            </div>
            <div class="node-ui-row">
                <span class="node-label">A</span>
                <input type="number" step="0.1" class="node-input-small" value="${data.a}" 
                    data-node="${id}" data-key="a">
            </div>`,
    func: (_, data) => {
      const v = toVec(data.value);
      return { r: v.x, g: v.y, b: v.z, a: data.a };
    },
  },

  static_bool: {
    category: "Data Types",
    title: "Static Bool",
    inputs: [],
    outputs: [{ id: "out", type: "bool" }],
    data: { value: false },
    renderUI: (data, id) => `
            <div class="node-ui-row">
                <input type="checkbox" ${
                  data.value ? "checked" : ""
                } data-node="${id}" data-key="value">
                <span class="node-label">Value</span>
            </div>`,
    func: (_, data) => data.value,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSTRATE
  // ═══════════════════════════════════════════════════════════════════════════

  substrate_slab: {
    category: "Substrate",
    title: "Substrate Slab BSDF",
    inputs: [
      { id: "DiffuseAlbedo", type: "float3" },
      { id: "F0", type: "float3" },
      { id: "F90", type: "float3" },
      { id: "Roughness", type: "float" },
      { id: "Anisotropy", type: "float" },
      { id: "SSS_MFP", type: "float3" },
      { id: "Emissive", type: "float3" },
    ],
    outputs: [{ id: "Out", type: "substrate" }],
    func: (inputs) => {
      const [diffuse, f0, f90, rough, aniso, sss, emissive] = inputs;
      return {
        isSubstrate: true,
        diffuse: toVec(diffuse || "#808080"),
        f0: toVec(f0 || "#080808"),
        roughness: toScalar(rough !== null ? rough : 0.5),
        anisotropy: toScalar(aniso || 0.0),
        emissive: toVec(emissive || "#000000"),
      };
    },
  },

  substrate_horizontal: {
    category: "Substrate",
    title: "Horizontal Blend",
    inputs: [
      { id: "Fore", type: "substrate" },
      { id: "Back", type: "substrate" },
      { id: "Mix", type: "float" },
    ],
    outputs: [{ id: "Out", type: "substrate" }],
    func: (inputs) => {
      const [a, b, mix] = inputs;
      const m = toScalar(mix || 0.5);
      const def = {
        isSubstrate: true,
        diffuse: new Vec3(),
        f0: new Vec3(),
        roughness: 0.5,
        anisotropy: 0,
        emissive: new Vec3(),
      };
      const sa = a || def;
      const sb = b || def;
      return {
        isSubstrate: true,
        diffuse: Vec3.lerpVectors(sa.diffuse, sb.diffuse, m),
        f0: Vec3.lerpVectors(sa.f0, sb.f0, m),
        roughness: lerp(sa.roughness, sb.roughness, m),
        anisotropy: lerp(sa.anisotropy, sb.anisotropy, m),
        emissive: Vec3.lerpVectors(sa.emissive, sb.emissive, m),
      };
    },
  },

  substrate_vertical: {
    category: "Substrate",
    title: "Vertical Layer",
    inputs: [
      { id: "Top", type: "substrate" },
      { id: "Bottom", type: "substrate" },
      { id: "Thickness", type: "float" },
    ],
    outputs: [{ id: "Out", type: "substrate" }],
    func: (inputs) => {
      const [a, b, thick] = inputs;
      const t = clamp(toScalar(thick || 0.1) * 5, 0, 1);
      const def = {
        isSubstrate: true,
        diffuse: new Vec3(),
        f0: new Vec3(),
        roughness: 0.5,
        anisotropy: 0,
        emissive: new Vec3(),
      };
      const sa = a || def;
      const sb = b || def;
      return {
        isSubstrate: true,
        diffuse: Vec3.lerpVectors(sb.diffuse, sa.diffuse, t * 0.5),
        f0: Vec3.lerpVectors(sb.f0, sa.f0, t),
        roughness: lerp(sb.roughness, sa.roughness, t),
        anisotropy: sb.anisotropy,
        emissive: sb.emissive,
      };
    },
  },

  substrate_weight: {
    category: "Substrate",
    title: "Substrate Weight",
    inputs: [
      { id: "Substrate", type: "substrate" },
      { id: "Weight", type: "float" },
    ],
    outputs: [{ id: "Out", type: "substrate" }],
    func: (inputs) => inputs[0], // Pass through for preview
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATERIAL ATTRIBUTES
  // ═══════════════════════════════════════════════════════════════════════════

  make_attributes: {
    category: "Material Attributes",
    title: "MakeMaterialAttributes",
    inputs: [
      { id: "BaseColor", type: "float3" },
      { id: "Metallic", type: "float" },
      { id: "Specular", type: "float" },
      { id: "Roughness", type: "float" },
      { id: "Emissive", type: "float3" },
      { id: "Normal", type: "float3" },
    ],
    outputs: [{ id: "Out", type: "attributes" }],
    func: (inputs) => {
      const [bc, met, spec, rough, emis, norm] = inputs;
      return {
        isAttributes: true,
        baseColor: toVec(bc || "#808080"),
        metallic: toScalar(met !== null ? met : 0),
        specular: toScalar(spec !== null ? spec : 0.5),
        roughness: toScalar(rough !== null ? rough : 0.5),
        emissive: toVec(emis || "#000000"),
        normal: toVec(norm || new Vec3(0, 0, 1)),
      };
    },
  },

  break_attributes: {
    category: "Material Attributes",
    title: "BreakMaterialAttributes",
    inputs: [{ id: "Attributes", type: "attributes" }],
    outputs: [
      { id: "BaseColor", type: "float3" },
      { id: "Metallic", type: "float" },
      { id: "Specular", type: "float" },
      { id: "Roughness", type: "float" },
      { id: "Emissive", type: "float3" },
      { id: "Normal", type: "float3" },
    ],
    func: (inputs) =>
      inputs[0] || {
        isAttributes: true,
        baseColor: new Vec3(),
        metallic: 0,
        specular: 0.5,
        roughness: 0.5,
        emissive: new Vec3(),
      },
  },

  blend_attributes: {
    category: "Material Attributes",
    title: "BlendMaterialAttributes",
    inputs: [
      { id: "A", type: "attributes" },
      { id: "B", type: "attributes" },
      { id: "Alpha", type: "float" },
    ],
    outputs: [{ id: "Out", type: "attributes" }],
    func: (inputs) => {
      const [a, b, alpha] = inputs;
      const def = {
        isAttributes: true,
        baseColor: new Vec3(0.5, 0.5, 0.5),
        metallic: 0,
        specular: 0.5,
        roughness: 0.5,
        emissive: new Vec3(),
      };
      const attrA = a || def;
      const attrB = b || def;
      const t = toScalar(alpha !== null ? alpha : 0.5);
      return {
        isAttributes: true,
        baseColor: Vec3.lerpVectors(attrA.baseColor, attrB.baseColor, t),
        metallic: lerp(attrA.metallic, attrB.metallic, t),
        specular: lerp(attrA.specular, attrB.specular, t),
        roughness: lerp(attrA.roughness, attrB.roughness, t),
        emissive: Vec3.lerpVectors(attrA.emissive, attrB.emissive, t),
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATH
  // ═══════════════════════════════════════════════════════════════════════════

  add: {
    category: "Math",
    title: "Add",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => operate(inputs[0], inputs[1], (x, y) => x + y),
  },

  subtract: {
    category: "Math",
    title: "Subtract",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => operate(inputs[0], inputs[1], (x, y) => x - y),
  },

  multiply: {
    category: "Math",
    title: "Multiply",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => operate(inputs[0], inputs[1], (x, y) => x * y),
  },

  divide: {
    category: "Math",
    title: "Divide",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) =>
      operate(inputs[0], inputs[1], (x, y) => (y === 0 ? 0 : x / y)),
  },

  lerp: {
    category: "Math",
    title: "Lerp",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
      { id: "alpha", type: "float" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) =>
      Vec3.lerpVectors(toVec(inputs[0]), toVec(inputs[1]), toScalar(inputs[2])),
  },

  abs: {
    category: "Math",
    title: "Abs",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], Math.abs),
  },

  ceil: {
    category: "Math",
    title: "Ceil",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], Math.ceil),
  },

  floor: {
    category: "Math",
    title: "Floor",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], Math.floor),
  },

  round: {
    category: "Math",
    title: "Round",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], Math.round),
  },

  sqrt: {
    category: "Math",
    title: "SquareRoot",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], Math.sqrt),
  },

  min: {
    category: "Math",
    title: "Min",
    inputs: [
      { id: "a", type: "float" },
      { id: "b", type: "float" },
    ],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operate(inputs[0], inputs[1], Math.min),
  },

  max: {
    category: "Math",
    title: "Max",
    inputs: [
      { id: "a", type: "float" },
      { id: "b", type: "float" },
    ],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operate(inputs[0], inputs[1], Math.max),
  },

  clamp: {
    category: "Math",
    title: "Clamp",
    inputs: [
      { id: "in", type: "float" },
      { id: "min", type: "float" },
      { id: "max", type: "float" },
    ],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => {
      const v = toVec(inputs[0]);
      const mn = toVec(inputs[1] !== null ? inputs[1] : 0);
      const mx = toVec(inputs[2] !== null ? inputs[2] : 1);
      return new Vec3(
        clamp(v.x, mn.x, mx.x),
        clamp(v.y, mn.y, mx.y),
        clamp(v.z, mn.z, mx.z)
      );
    },
  },

  saturate: {
    category: "Math",
    title: "Saturate",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], (x) => clamp(x, 0, 1)),
  },

  sine: {
    category: "Math",
    title: "Sine",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], Math.sin),
  },

  cosine: {
    category: "Math",
    title: "Cosine",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], Math.cos),
  },

  frac: {
    category: "Math",
    title: "Frac",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], (x) => x - Math.floor(x)),
  },

  oneminus: {
    category: "Math",
    title: "OneMinus",
    inputs: [{ id: "in", type: "float" }],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => operateSingle(inputs[0], (x) => 1.0 - x),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VECTOR OPS
  // ═══════════════════════════════════════════════════════════════════════════

  append: {
    category: "VectorOps",
    title: "Append",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => {
      const vA = toVec(inputs[0]);
      const vB = toVec(inputs[1]);
      return new Vec3(vA.x, vB.x, vB.y);
    },
  },

  dot: {
    category: "VectorOps",
    title: "Dot Product",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => toVec(inputs[0]).dot(toVec(inputs[1])),
  },

  cross: {
    category: "VectorOps",
    title: "Cross Product",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => toVec(inputs[0]).cross(toVec(inputs[1])),
  },

  normalize: {
    category: "VectorOps",
    title: "Normalize",
    inputs: [{ id: "in", type: "float3" }],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => toVec(inputs[0]).clone().normalize(),
  },

  distance: {
    category: "VectorOps",
    title: "Distance",
    inputs: [
      { id: "a", type: "float3" },
      { id: "b", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float" }],
    func: (inputs) => toVec(inputs[0]).distanceTo(toVec(inputs[1])),
  },

  componentmask: {
    category: "VectorOps",
    title: "ComponentMask",
    inputs: [{ id: "in", type: "float3" }],
    outputs: [{ id: "out", type: "float3" }],
    data: { r: true, g: true, b: true },
    renderUI: (data, id) => `
            <div class="node-ui-row node-checkboxes">
                <label><input type="checkbox" ${
                  data.r ? "checked" : ""
                } data-node="${id}" data-key="r"> R</label>
                <label><input type="checkbox" ${
                  data.g ? "checked" : ""
                } data-node="${id}" data-key="g"> G</label>
                <label><input type="checkbox" ${
                  data.b ? "checked" : ""
                } data-node="${id}" data-key="b"> B</label>
            </div>`,
    func: (inputs, data) => {
      const v = toVec(inputs[0]);
      return new Vec3(data.r ? v.x : 0, data.g ? v.y : 0, data.b ? v.z : 0);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLOR
  // ═══════════════════════════════════════════════════════════════════════════

  desaturation: {
    category: "Color",
    title: "Desaturation",
    inputs: [
      { id: "Input", type: "float3" },
      { id: "Fraction", type: "float" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => {
      const v = toVec(inputs[0]);
      const f =
        inputs[1] === null || inputs[1] === undefined
          ? 1.0
          : toScalar(inputs[1]);
      const lum = v.x * 0.3 + v.y * 0.59 + v.z * 0.11;
      const vLum = new Vec3(lum, lum, lum);
      return Vec3.lerpVectors(v, vLum, f);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════

  time: {
    category: "Utility",
    title: "Time",
    inputs: [],
    outputs: [{ id: "out", type: "float" }],
    func: () => Date.now() / 1000,
  },

  fresnel: {
    category: "Utility",
    title: "Fresnel",
    inputs: [
      { id: "Exponent", type: "float" },
      { id: "BaseReflect", type: "float" },
    ],
    outputs: [{ id: "out", type: "float" }],
    func: () => {
      // Visual approximation for logic graph
      const t = Date.now() / 1000;
      return 0.5 + 0.5 * Math.sin(t);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  if: {
    category: "Logic",
    title: "If",
    inputs: [
      { id: "A", type: "float" },
      { id: "B", type: "float" },
      { id: "A>B", type: "float3" },
      { id: "A==B", type: "float3" },
      { id: "A<B", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => {
      const valA = toScalar(inputs[0]);
      const valB = toScalar(inputs[1]);
      if (valA > valB) return toVec(inputs[2]);
      if (valA === valB) return toVec(inputs[3]);
      return toVec(inputs[4]);
    },
  },

  switch: {
    category: "Logic",
    title: "Switch",
    inputs: [
      { id: "Value", type: "bool" },
      { id: "True", type: "float3" },
      { id: "False", type: "float3" },
    ],
    outputs: [{ id: "out", type: "float3" }],
    func: (inputs) => (inputs[0] ? toVec(inputs[1]) : toVec(inputs[2])),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTURE
  // ═══════════════════════════════════════════════════════════════════════════

  texture: {
    category: "Texture",
    title: "Texture Sample",
    inputs: [{ id: "uv", type: "float2" }],
    outputs: [
      { id: "rgb", type: "float3" },
      { id: "r", type: "float" },
      { id: "g", type: "float" },
      { id: "b", type: "float" },
    ],
    data: { type: "checker", customTex: null },
    renderUI: (data, id) => `
            <select class="node-select" data-node="${id}" data-key="type">
                <option value="checker" ${
                  data.type === "checker" ? "selected" : ""
                }>Checkerboard</option>
                <option value="noise" ${
                  data.type === "noise" ? "selected" : ""
                }>Noise</option>
                <option value="custom" ${
                  data.type === "custom" ? "selected" : ""
                }>Custom</option>
            </select>
            <div class="node-ui-row" style="margin-top:4px">
                <input type="file" accept="image/*" class="node-file" data-node="${id}" data-key="customTex">
            </div>`,
    func: () => new Vec3(0.5, 0.5, 0.5),
  },

  texcoord: {
    category: "Texture",
    title: "TextureCoordinate",
    inputs: [],
    outputs: [{ id: "out", type: "float2" }],
    func: () => ({ x: 0, y: 0 }),
  },

  panner: {
    category: "Texture",
    title: "Panner",
    inputs: [
      { id: "coord", type: "float2" },
      { id: "time", type: "float" },
      { id: "speed", type: "float2" },
    ],
    outputs: [{ id: "out", type: "float2" }],
    data: { speedX: 0.1, speedY: 0.1 },
    func: (inputs, data) => {
      const time = inputs[1] || Date.now() / 1000;
      const sx = inputs[2]?.x || data.speedX;
      const sy = inputs[2]?.y || data.speedY;
      return { x: time * sx, y: time * sy };
    },
  },

  rotator: {
    category: "Texture",
    title: "Rotator",
    inputs: [
      { id: "coord", type: "float2" },
      { id: "center", type: "float2" },
      { id: "time", type: "float" },
    ],
    outputs: [{ id: "out", type: "float2" }],
    func: () => ({ x: 0, y: 0 }),
  },

  worldpos: {
    category: "Texture",
    title: "WorldPosition",
    inputs: [],
    outputs: [{ id: "out", type: "float3" }],
    func: () => new Vec3(0, 100, 0),
  },

  pixeldepth: {
    category: "Texture",
    title: "PixelDepth",
    inputs: [],
    outputs: [{ id: "out", type: "float" }],
    func: () => 1000.0,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULT
  // ═══════════════════════════════════════════════════════════════════════════

  result: {
    category: "Main",
    title: "Material Result",
    inputs: [
      { id: "FrontMaterial", type: "substrate" },
      { id: "MaterialAttributes", type: "attributes" },
      { id: "BaseColor", type: "float3" },
      { id: "Metallic", type: "float" },
      { id: "Specular", type: "float" },
      { id: "Roughness", type: "float" },
      { id: "Emissive", type: "float3" },
      { id: "Normal", type: "float3" },
    ],
    outputs: [],
    data: { mode: "substrate", useAttributes: false },
    renderUI: (data, id) => `
            <div class="node-ui-row">
                <label class="node-label-small">Material Domain</label>
                <select class="node-select" data-node="${id}" data-key="mode">
                    <option value="substrate" ${
                      data.mode === "substrate" ? "selected" : ""
                    }>Substrate</option>
                    <option value="legacy" ${
                      data.mode === "legacy" ? "selected" : ""
                    }>Legacy (UE4/5)</option>
                </select>
            </div>
            <div class="node-ui-row">
                <input type="checkbox" ${data.useAttributes ? "checked" : ""} 
                    data-node="${id}" data-key="useAttributes" id="attr_${id}">
                <label for="attr_${id}" class="node-label">Use Material Attributes</label>
            </div>`,
  },
};

/**
 * Get node definition by type
 */
export function getNodeType(type) {
  return NODE_TYPES[type] || null;
}

/**
 * Get all node types grouped by category
 */
export function getNodesByCategory() {
  const categories = {};
  for (const [type, def] of Object.entries(NODE_TYPES)) {
    if (type === "result") continue;
    if (!categories[def.category]) categories[def.category] = [];
    categories[def.category].push({ type, ...def });
  }
  return categories;
}

/**
 * Category display order
 */
export const CATEGORY_ORDER = [
  "Substrate",
  "Data Types",
  "Material Attributes",
  "Math",
  "Color",
  "VectorOps",
  "Texture",
  "Utility",
  "Logic",
];

export default NODE_TYPES;
