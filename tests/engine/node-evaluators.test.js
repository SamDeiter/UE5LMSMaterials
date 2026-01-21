/**
 * Tests for NodeEvaluators.js
 * Validates node-specific evaluation logic for the material graph.
 */

import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock TextureManager before importing NodeEvaluators
vi.mock("../../material/engine/TextureManager.js", () => ({
  textureManager: {
    get: vi.fn(() => null),
  },
}));

import {
  evaluateConstant,
  evaluateConstant3Vector,
  evaluateConstant2Vector,
  evaluateConstant4Vector,
  evaluateMultiply,
  evaluateBinaryOp,
  evaluateLerp,
  evaluateUnaryOp,
  evaluateBinaryMath,
  evaluateClamp,
  evaluatePower,
  evaluateFresnel,
  dispatchNodeEvaluation,
} from "../../material/engine/NodeEvaluators.js";
import { addValues, multiplyValues } from "../../material/engine/MathUtils.js";

// Mock node factory
function createMockNode(nodeKey, properties = {}, inputs = []) {
  return {
    nodeKey,
    type: nodeKey,
    properties,
    inputs,
    outputs: [],
  };
}

// Mock pin evaluator that returns predefined values
function createMockPinEvaluator(valueMap) {
  return (pin, visited) => {
    if (!pin) return null;
    const key = pin.localId || pin.name;
    return valueMap[key] ?? null;
  };
}

describe("NodeEvaluators", () => {
  // ==========================================================================
  // Constant Evaluators
  // ==========================================================================
  describe("Constant Evaluators", () => {
    it("evaluateConstant should return R property", () => {
      const node = createMockNode("Constant", { R: 0.75 });
      expect(evaluateConstant(node)).toBe(0.75);
    });

    it("evaluateConstant should fall back to DefaultValue", () => {
      const node = createMockNode("ScalarParameter", { DefaultValue: 0.5 });
      expect(evaluateConstant(node)).toBe(0.5);
    });

    it("evaluateConstant3Vector should return RGB array", () => {
      const node = createMockNode("Constant3Vector", { R: 1, G: 0.5, B: 0 });
      expect(evaluateConstant3Vector(node)).toEqual([1, 0.5, 0]);
    });

    it("evaluateConstant2Vector should return RG array", () => {
      const node = createMockNode("Constant2Vector", { R: 0.3, G: 0.7 });
      expect(evaluateConstant2Vector(node)).toEqual([0.3, 0.7]);
    });

    it("evaluateConstant4Vector should return RGBA array", () => {
      const node = createMockNode("Constant4Vector", { R: 1, G: 0.8, B: 0.6, A: 0.5 });
      expect(evaluateConstant4Vector(node)).toEqual([1, 0.8, 0.6, 0.5]);
    });
  });

  // ==========================================================================
  // Math Node Evaluators
  // ==========================================================================
  describe("Math Node Evaluators", () => {
    it("evaluateMultiply should multiply two values", () => {
      const node = createMockNode("Multiply", {}, [
        { localId: "a" },
        { localId: "b" },
      ]);
      const pinEval = createMockPinEvaluator({ a: 2, b: 3 });
      expect(evaluateMultiply(pinEval, node, new Set())).toBe(6);
    });

    it("evaluateBinaryOp should apply operation to inputs", () => {
      const node = createMockNode("Add", {}, [
        { localId: "a" },
        { localId: "b" },
      ]);
      const pinEval = createMockPinEvaluator({ a: 5, b: 3 });
      expect(evaluateBinaryOp(pinEval, node, new Set(), addValues, 0)).toBe(8);
    });

    it("evaluateLerp should interpolate between A and B", () => {
      const node = createMockNode("Lerp", {}, [
        { localId: "a" },
        { localId: "b" },
        { localId: "alpha" },
      ]);
      const pinEval = createMockPinEvaluator({ a: 0, b: 10, alpha: 0.5 });
      expect(evaluateLerp(pinEval, node, new Set())).toBe(5);
    });

    it("evaluateUnaryOp should apply function to input", () => {
      const node = createMockNode("Abs", {}, [{ localId: "in" }]);
      const pinEval = createMockPinEvaluator({ in: -5 });
      expect(evaluateUnaryOp(pinEval, node, new Set(), Math.abs)).toBe(5);
    });

    it("evaluateBinaryMath should apply Math function", () => {
      const node = createMockNode("Max", {}, [
        { localId: "a" },
        { localId: "b" },
      ]);
      const pinEval = createMockPinEvaluator({ a: 3, b: 7 });
      expect(evaluateBinaryMath(pinEval, node, new Set(), Math.max)).toBe(7);
    });

    it("evaluateClamp should clamp value between min and max", () => {
      const node = createMockNode("Clamp", {}, [
        { localId: "value" },
        { localId: "min" },
        { localId: "max" },
      ]);
      const pinEval = createMockPinEvaluator({ value: 1.5, min: 0, max: 1 });
      expect(evaluateClamp(pinEval, node, new Set())).toBe(1);
    });

    it("evaluatePower should raise base to exponent", () => {
      const node = createMockNode("Power", {}, [
        { localId: "base" },
        { localId: "exponent" },
      ]);
      const pinEval = createMockPinEvaluator({ base: 2, exponent: 3 });
      expect(evaluatePower(pinEval, node, new Set())).toBe(8);
    });
  });

  // ==========================================================================
  // Utility Evaluators
  // ==========================================================================
  describe("Utility Evaluators", () => {
    it("evaluateFresnel should return 0.5 (preview approximation)", () => {
      const node = createMockNode("Fresnel", { Exponent: 5 });
      expect(evaluateFresnel(node)).toBe(0.5);
    });
  });

  // ==========================================================================
  // Node Dispatcher
  // ==========================================================================
  describe("dispatchNodeEvaluation", () => {
    it("should dispatch Constant nodes correctly", () => {
      const node = createMockNode("Constant", { R: 0.8 });
      const pinEval = () => null;
      expect(dispatchNodeEvaluation(pinEval, node, null, new Set())).toBe(0.8);
    });

    it("should dispatch Constant3Vector correctly", () => {
      const node = createMockNode("Constant3Vector", { R: 1, G: 0, B: 0 });
      const pinEval = () => null;
      expect(dispatchNodeEvaluation(pinEval, node, null, new Set())).toEqual([1, 0, 0]);
    });

    it("should dispatch Add correctly", () => {
      const node = createMockNode("Add", {}, [
        { localId: "a" },
        { localId: "b" },
      ]);
      const pinEval = createMockPinEvaluator({ a: 2, b: 3 });
      expect(dispatchNodeEvaluation(pinEval, node, null, new Set())).toBe(5);
    });

    it("should dispatch Sin correctly", () => {
      const node = createMockNode("Sin", {}, [{ localId: "in" }]);
      const pinEval = createMockPinEvaluator({ in: 0 });
      expect(dispatchNodeEvaluation(pinEval, node, null, new Set())).toBe(0);
    });

    it("should return 0.5 for unknown node types", () => {
      const node = createMockNode("UnknownNode", {});
      const pinEval = () => null;
      // Suppress console.warn for this test
      const warn = console.warn;
      console.warn = vi.fn();
      expect(dispatchNodeEvaluation(pinEval, node, null, new Set())).toBe(0.5);
      console.warn = warn;
    });
  });
});
