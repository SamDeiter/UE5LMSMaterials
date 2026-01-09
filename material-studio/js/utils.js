/**
 * Material Studio Utilities
 * Math helpers and performance utilities.
 */

// Vector3-like object for calculations (avoids Three.js dependency in core logic)
export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.isVector3 = true;
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }

  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  static lerpVectors(a, b, t) {
    return new Vec3(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t
    );
  }
}

/**
 * Convert any value to a Vec3
 */
export function toVec(val) {
  if (val && val.isVector3) return val;
  if (val && val.isColor) return new Vec3(val.r, val.g, val.b);
  if (typeof val === "string" && val.startsWith("#")) {
    return hexToVec(val);
  }
  const n = Number(val) || 0;
  return new Vec3(n, n, n);
}

/**
 * Convert hex color string to Vec3
 */
export function hexToVec(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return new Vec3(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }
  return new Vec3(0, 0, 0);
}

/**
 * Convert Vec3 to hex color string
 */
export function vecToHex(vec) {
  const r = Math.round(Math.max(0, Math.min(1, vec.x)) * 255);
  const g = Math.round(Math.max(0, Math.min(1, vec.y)) * 255);
  const b = Math.round(Math.max(0, Math.min(1, vec.z)) * 255);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert any value to a scalar number
 */
export function toScalar(val) {
  if (val && val.isVector3) return val.x;
  if (val && val.isColor) return val.r;
  return Number(val) || 0;
}

/**
 * Apply binary operation to two values (supports scalar and vector)
 */
export function operate(a, b, op) {
  const vA = toVec(a);
  const vB = toVec(b);
  return new Vec3(op(vA.x, vB.x), op(vA.y, vB.y), op(vA.z, vB.z));
}

/**
 * Apply unary operation to a value
 */
export function operateSingle(a, op) {
  const vA = toVec(a);
  return new Vec3(op(vA.x), op(vA.y), op(vA.z));
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Debounce function for performance
 */
export function debounce(fn, ms) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle(fn, ms) {
  let lastCall = 0;
  let timeoutId;
  return function (...args) {
    const now = Date.now();
    const remaining = ms - (now - lastCall);

    clearTimeout(timeoutId);

    if (remaining <= 0) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Generate unique ID
 */
export function generateId(prefix = "node") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a DocumentFragment for batch DOM operations
 */
export function createFragment(htmlString) {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  return template.content;
}
