/**
 * Tests for MathUtils.js
 * Validates vector/scalar math operations used in material evaluation.
 */

import { describe, it, expect } from "vitest";
import {
  multiplyValues,
  addValues,
  subtractValues,
  divideValues,
  lerpValues,
  applyUnary,
  applyBinary,
} from "../../material/engine/MathUtils.js";

describe("MathUtils", () => {
  // ==========================================================================
  // multiplyValues
  // ==========================================================================
  describe("multiplyValues", () => {
    it("should multiply two scalars", () => {
      expect(multiplyValues(2, 3)).toBe(6);
    });

    it("should multiply scalar by vector", () => {
      expect(multiplyValues(2, [1, 2, 3])).toEqual([2, 4, 6]);
    });

    it("should multiply vector by scalar", () => {
      expect(multiplyValues([1, 2, 3], 2)).toEqual([2, 4, 6]);
    });

    it("should multiply two vectors element-wise", () => {
      expect(multiplyValues([2, 3, 4], [1, 2, 3])).toEqual([2, 6, 12]);
    });

    it("should handle null/undefined as 1", () => {
      expect(multiplyValues(null, 5)).toBe(5);
      expect(multiplyValues(5, undefined)).toBe(5);
    });
  });

  // ==========================================================================
  // addValues
  // ==========================================================================
  describe("addValues", () => {
    it("should add two scalars", () => {
      expect(addValues(2, 3)).toBe(5);
    });

    it("should add scalar to vector", () => {
      expect(addValues(1, [1, 2, 3])).toEqual([2, 3, 4]);
    });

    it("should add vector and scalar", () => {
      expect(addValues([1, 2, 3], 1)).toEqual([2, 3, 4]);
    });

    it("should add two vectors element-wise", () => {
      expect(addValues([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    });

    it("should handle null/undefined as 0", () => {
      expect(addValues(null, 5)).toBe(5);
      expect(addValues(5, undefined)).toBe(5);
    });
  });

  // ==========================================================================
  // subtractValues
  // ==========================================================================
  describe("subtractValues", () => {
    it("should subtract two scalars", () => {
      expect(subtractValues(5, 3)).toBe(2);
    });

    it("should subtract scalar from vector", () => {
      expect(subtractValues([4, 5, 6], 1)).toEqual([3, 4, 5]);
    });

    it("should subtract vector from scalar (broadcasts)", () => {
      expect(subtractValues(10, [1, 2, 3])).toEqual([9, 8, 7]);
    });

    it("should subtract two vectors element-wise", () => {
      expect(subtractValues([5, 7, 9], [1, 2, 3])).toEqual([4, 5, 6]);
    });
  });

  // ==========================================================================
  // divideValues
  // ==========================================================================
  describe("divideValues", () => {
    it("should divide two scalars", () => {
      expect(divideValues(6, 2)).toBe(3);
    });

    it("should divide vector by scalar", () => {
      expect(divideValues([2, 4, 6], 2)).toEqual([1, 2, 3]);
    });

    it("should divide two vectors element-wise", () => {
      expect(divideValues([4, 9, 16], [2, 3, 4])).toEqual([2, 3, 4]);
    });

    it("should protect against divide by zero", () => {
      const result = divideValues(10, 0);
      expect(result).toBeGreaterThan(0); // Should not be Infinity
      expect(result).toBeLessThan(Infinity);
    });

    it("should protect against divide by zero in vectors", () => {
      const result = divideValues([10, 10], [0, 0]);
      expect(result[0]).toBeGreaterThan(0);
      expect(result[0]).toBeLessThan(Infinity);
    });
  });

  // ==========================================================================
  // lerpValues
  // ==========================================================================
  describe("lerpValues", () => {
    it("should interpolate two scalars at t=0.5", () => {
      expect(lerpValues(0, 10, 0.5)).toBe(5);
    });

    it("should return a at t=0", () => {
      expect(lerpValues(5, 10, 0)).toBe(5);
    });

    it("should return b at t=1", () => {
      expect(lerpValues(5, 10, 1)).toBe(10);
    });

    it("should interpolate two vectors", () => {
      expect(lerpValues([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
    });

    it("should default to t=0.5 if t is not a number", () => {
      expect(lerpValues(0, 10, null)).toBe(5);
    });
  });

  // ==========================================================================
  // applyUnary
  // ==========================================================================
  describe("applyUnary", () => {
    it("should apply function to scalar", () => {
      expect(applyUnary(4, Math.sqrt)).toBe(2);
    });

    it("should apply function to each element of vector", () => {
      expect(applyUnary([1, 4, 9], Math.sqrt)).toEqual([1, 2, 3]);
    });

    it("should return value unchanged if not number or array", () => {
      expect(applyUnary("test", Math.sqrt)).toBe("test");
    });
  });

  // ==========================================================================
  // applyBinary
  // ==========================================================================
  describe("applyBinary", () => {
    it("should apply function to two scalars", () => {
      expect(applyBinary(3, 5, Math.max)).toBe(5);
    });

    it("should apply function element-wise to two vectors", () => {
      expect(applyBinary([1, 5, 3], [2, 4, 6], Math.max)).toEqual([2, 5, 6]);
    });

    it("should return first value if types don't match", () => {
      expect(applyBinary([1, 2], 5, Math.max)).toEqual([1, 2]);
    });
  });
});
