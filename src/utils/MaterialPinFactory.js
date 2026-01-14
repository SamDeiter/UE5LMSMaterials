/**
 * MaterialPinFactory - Utility for generating common Material Editor pin patterns
 *
 * Adapted from UE5LMSBlueprint PinFactory for Material Editor data types.
 * Material graphs are data-flow only (no exec pins).
 *
 * Usage:
 *   import { MaterialPinFactory as MPF } from '../utils/MaterialPinFactory.js';
 *
 *   inputs: [
 *     MPF.floatIn('opacity', 'Opacity', 1.0),
 *     ...MPF.float3In('normal', 'Normal', '0,0,1'),
 *   ],
 *   outputs: [
 *     MPF.substrateOut('output', 'Output'),
 *   ]
 */

export class MaterialPinFactory {
  // ============================================================================
  // FLOAT TYPES (Scalar & Vector)
  // ============================================================================

  /**
   * Float (scalar) input pin
   */
  static floatIn(id, name, defaultValue = 0.0) {
    return { id, name, type: "float", dir: "in", defaultValue };
  }

  /**
   * Float2 (UV, 2D vector) input pin
   */
  static float2In(id, name, defaultValue = "0,0") {
    return { id, name, type: "float2", dir: "in", defaultValue };
  }

  /**
   * Float3 (RGB, 3D vector, normal) input pin
   */
  static float3In(id, name, defaultValue = "0,0,0") {
    return { id, name, type: "float3", dir: "in", defaultValue };
  }

  /**
   * Float4 (RGBA, 4D vector) input pin
   */
  static float4In(id, name, defaultValue = "0,0,0,1") {
    return { id, name, type: "float4", dir: "in", defaultValue };
  }

  /**
   * Float output pin
   */
  static floatOut(id, name = "Result") {
    return { id, name, type: "float", dir: "out" };
  }

  /**
   * Float2 output pin
   */
  static float2Out(id, name = "Result") {
    return { id, name, type: "float2", dir: "out" };
  }

  /**
   * Float3 output pin
   */
  static float3Out(id, name = "Result") {
    return { id, name, type: "float3", dir: "out" };
  }

  /**
   * Float4 output pin
   */
  static float4Out(id, name = "Result") {
    return { id, name, type: "float4", dir: "out" };
  }

  // ============================================================================
  // SUBSTRATE / MATERIAL ATTRIBUTES
  // ============================================================================

  /**
   * Substrate data input (new UE5.4+ system)
   */
  static substrateIn(id, name) {
    return { id, name, type: "substrate", dir: "in" };
  }

  /**
   * Substrate data output
   */
  static substrateOut(id, name = "Substrate") {
    return { id, name, type: "substrate", dir: "out" };
  }

  /**
   * Material Attributes input (legacy system)
   */
  static materialAttributesIn(id, name) {
    return { id, name, type: "attributes", dir: "in" };
  }

  /**
   * Material Attributes output
   */
  static materialAttributesOut(id, name = "Material Attributes") {
    return { id, name, type: "attributes", dir: "out" };
  }

  // ============================================================================
  // TEXTURE TYPES
  // ============================================================================

  /**
   * Texture2D sample input
   */
  static texture2DIn(id, name) {
    return { id, name, type: "texture2d", dir: "in" };
  }

  /**
   * TextureCube sample input
   */
  static textureCubeIn(id, name) {
    return { id, name, type: "texturecube", dir: "in" };
  }

  /**
   * Texture object (reference) input
   */
  static textureObjectIn(id, name) {
    return { id, name, type: "textureobject", dir: "in" };
  }

  // ============================================================================
  // BOOLEAN
  // ============================================================================

  /**
   * Boolean input pin
   */
  static boolIn(id, name, defaultValue = false) {
    return { id, name, type: "bool", dir: "in", defaultValue };
  }

  /**
   * Boolean output pin
   */
  static boolOut(id, name = "Result") {
    return { id, name, type: "bool", dir: "out" };
  }

  // ============================================================================
  // COMMON MATH PATTERNS
  // ============================================================================

  /**
   * Binary math operation pins (A, B inputs + Result output)
   * @param {string} type - Pin type (float, float2, float3, float4)
   * @param {*} defaultA - Default value for A
   * @param {*} defaultB - Default value for B
   */
  static binaryOp(type, defaultA = 0, defaultB = 0) {
    return {
      inputs: [
        { id: "a_in", name: "A", type, dir: "in", defaultValue: defaultA },
        { id: "b_in", name: "B", type, dir: "in", defaultValue: defaultB },
      ],
      outputs: [{ id: "result_out", name: "Result", type, dir: "out" }],
    };
  }

  /**
   * Unary math operation pins (input + output, potentially different types)
   */
  static unaryOp(inputType, outputType = null, defaultValue = 0) {
    return {
      inputs: [
        { id: "a_in", name: "A", type: inputType, dir: "in", defaultValue },
      ],
      outputs: [
        {
          id: "result_out",
          name: "Result",
          type: outputType || inputType,
          dir: "out",
        },
      ],
    };
  }

  /**
   * Comparison operation pins (A, B float inputs + bool output)
   */
  static comparison(type = "float", defaultA = 0, defaultB = 0) {
    return {
      inputs: [
        { id: "a_in", name: "A", type, dir: "in", defaultValue: defaultA },
        { id: "b_in", name: "B", type, dir: "in", defaultValue: defaultB },
      ],
      outputs: [{ id: "result_out", name: "Result", type: "bool", dir: "out" }],
    };
  }

  // ============================================================================
  // VECTOR PATTERNS
  // ============================================================================

  /**
   * Make Float3 pins (R, G, B inputs + Float3 output)
   */
  static makeFloat3() {
    return {
      inputs: [
        { id: "r_in", name: "R", type: "float", dir: "in", defaultValue: 0 },
        { id: "g_in", name: "G", type: "float", dir: "in", defaultValue: 0 },
        { id: "b_in", name: "B", type: "float", dir: "in", defaultValue: 0 },
      ],
      outputs: [{ id: "rgb_out", name: "RGB", type: "float3", dir: "out" }],
    };
  }

  /**
   * Break Float3 pins (Float3 input + R, G, B outputs)
   */
  static breakFloat3() {
    return {
      inputs: [{ id: "rgb_in", name: "RGB", type: "float3", dir: "in" }],
      outputs: [
        { id: "r_out", name: "R", type: "float", dir: "out" },
        { id: "g_out", name: "G", type: "float", dir: "out" },
        { id: "b_out", name: "B", type: "float", dir: "out" },
      ],
    };
  }

  /**
   * Make Float4 pins (R, G, B, A inputs + Float4 output)
   */
  static makeFloat4() {
    return {
      inputs: [
        { id: "r_in", name: "R", type: "float", dir: "in", defaultValue: 0 },
        { id: "g_in", name: "G", type: "float", dir: "in", defaultValue: 0 },
        { id: "b_in", name: "B", type: "float", dir: "in", defaultValue: 0 },
        { id: "a_in", name: "A", type: "float", dir: "in", defaultValue: 1 },
      ],
      outputs: [{ id: "rgba_out", name: "RGBA", type: "float4", dir: "out" }],
    };
  }

  /**
   * Break Float4 pins (Float4 input + R, G, B, A outputs)
   */
  static breakFloat4() {
    return {
      inputs: [{ id: "rgba_in", name: "RGBA", type: "float4", dir: "in" }],
      outputs: [
        { id: "r_out", name: "R", type: "float", dir: "out" },
        { id: "g_out", name: "G", type: "float", dir: "out" },
        { id: "b_out", name: "B", type: "float", dir: "out" },
        { id: "a_out", name: "A", type: "float", dir: "out" },
      ],
    };
  }

  // ============================================================================
  // CLAMP/LERP PATTERNS
  // ============================================================================

  /**
   * Clamp operation pins (Value, Min, Max inputs + output)
   */
  static clamp(
    type = "float",
    valueDefault = 0,
    minDefault = 0,
    maxDefault = 1
  ) {
    return {
      inputs: [
        {
          id: "val_in",
          name: "Value",
          type,
          dir: "in",
          defaultValue: valueDefault,
        },
        {
          id: "min_in",
          name: "Min",
          type,
          dir: "in",
          defaultValue: minDefault,
        },
        {
          id: "max_in",
          name: "Max",
          type,
          dir: "in",
          defaultValue: maxDefault,
        },
      ],
      outputs: [{ id: "result_out", name: "Result", type, dir: "out" }],
    };
  }

  /**
   * Lerp operation pins (A, B, Alpha inputs + output)
   */
  static lerp(type = "float") {
    return {
      inputs: [
        { id: "a_in", name: "A", type, dir: "in", defaultValue: 0 },
        { id: "b_in", name: "B", type, dir: "in", defaultValue: 1 },
        {
          id: "alpha_in",
          name: "Alpha",
          type: "float",
          dir: "in",
          defaultValue: 0.5,
        },
      ],
      outputs: [{ id: "result_out", name: "Result", type, dir: "out" }],
    };
  }

  // ============================================================================
  // TEXTURE SAMPLING PATTERNS
  // ============================================================================

  /**
   * Standard texture sample pins (Texture, UVs inputs + RGB, A outputs)
   */
  static textureSample() {
    return {
      inputs: [
        { id: "tex_in", name: "Texture", type: "texture2d", dir: "in" },
        { id: "uv_in", name: "UVs", type: "float2", dir: "in" },
      ],
      outputs: [
        { id: "rgb_out", name: "RGB", type: "float3", dir: "out" },
        { id: "r_out", name: "R", type: "float", dir: "out" },
        { id: "g_out", name: "G", type: "float", dir: "out" },
        { id: "b_out", name: "B", type: "float", dir: "out" },
        { id: "a_out", name: "A", type: "float", dir: "out" },
        { id: "rgba_out", name: "RGBA", type: "float4", dir: "out" },
      ],
    };
  }
}
