/**
 * MathUtils.js
 *
 * Vector and scalar math operations for material evaluation.
 * Supports mixed scalar/vector operations with automatic broadcasting.
 */

/**
 * Multiply two values (scalar or vector)
 */
export function multiplyValues(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((v, i) => v * (b[i] ?? 1));
  }
  if (Array.isArray(a)) {
    return a.map((v) => v * (typeof b === "number" ? b : 1));
  }
  if (Array.isArray(b)) {
    return b.map((v) => v * (typeof a === "number" ? a : 1));
  }
  return (typeof a === "number" ? a : 1) * (typeof b === "number" ? b : 1);
}

/**
 * Add two values
 */
export function addValues(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((v, i) => v + (b[i] ?? 0));
  }
  if (Array.isArray(a)) {
    return a.map((v) => v + (typeof b === "number" ? b : 0));
  }
  if (Array.isArray(b)) {
    return b.map((v) => v + (typeof a === "number" ? a : 0));
  }
  return (typeof a === "number" ? a : 0) + (typeof b === "number" ? b : 0);
}

/**
 * Subtract two values
 */
export function subtractValues(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((v, i) => v - (b[i] ?? 0));
  }
  if (Array.isArray(a)) {
    return a.map((v) => v - (typeof b === "number" ? b : 0));
  }
  if (Array.isArray(b)) {
    return b.map((v) => (typeof a === "number" ? a : 0) - v);
  }
  return (typeof a === "number" ? a : 0) - (typeof b === "number" ? b : 0);
}

/**
 * Divide two values (with divide-by-zero protection)
 */
export function divideValues(a, b) {
  const safeDivide = (x, y) => x / Math.max(y, 0.0001);
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((v, i) => safeDivide(v, b[i] ?? 1));
  }
  if (Array.isArray(a)) {
    return a.map((v) => safeDivide(v, typeof b === "number" ? b : 1));
  }
  if (Array.isArray(b)) {
    return b.map((v) => safeDivide(typeof a === "number" ? a : 1, v));
  }
  return safeDivide(typeof a === "number" ? a : 1, typeof b === "number" ? b : 1);
}

/**
 * Lerp (linear interpolate) two values
 */
export function lerpValues(a, b, t) {
  const alpha = typeof t === "number" ? t : 0.5;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((v, i) => v + (b[i] - v) * alpha);
  }
  if (typeof a === "number" && typeof b === "number") {
    return a + (b - a) * alpha;
  }
  return a;
}

/**
 * Apply a unary function to a value (scalar or vector)
 */
export function applyUnary(val, fn) {
  if (typeof val === "number") return fn(val);
  if (Array.isArray(val)) return val.map((v) => fn(v));
  return val;
}

/**
 * Apply a binary function to two values
 */
export function applyBinary(a, b, fn) {
  if (typeof a === "number" && typeof b === "number") return fn(a, b);
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((v, i) => fn(v, b[i] ?? 0));
  }
  return a;
}
