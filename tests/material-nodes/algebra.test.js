/**
 * Algebra Nodes Test Suite
 * =========================
 * Tests for advanced math nodes based on UE5 Materials Spec Section 2.2
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getRegistry, createNode, getDefinition } from "../setup.js";

describe("Advanced Algebra Nodes", () => {
  beforeAll(() => {
    getRegistry();
  });

  // =========================================================================
  // POWER NODE
  // =========================================================================
  describe("Power Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Power")).toBeDefined();
    });

    it("should produce pow() HLSL intrinsic", () => {
      const hlsl = createNode("Power").getShaderSnippet();
      expect(hlsl).toMatch(/pow\(/);
    });

    it("should protect against negative base values", () => {
      // From spec: "Essential for Gamma correction and specular highlights"
      // Negative bases with fractional exponents produce NaN
      const hlsl = createNode("Power").getShaderSnippet();
      expect(hlsl).toContain("max(");
    });

    it("should default Exp to 2.0 (common squaring case)", () => {
      const def = getDefinition("Power");
      expect(def.pins.find((p) => p.id === "exp").defaultValue).toBe(2.0);
    });
  });

  // =========================================================================
  // TRIGONOMETRIC NODES
  // =========================================================================
  describe("Sine Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Sin")).toBeDefined();
    });

    it("should produce sin() HLSL intrinsic", () => {
      const hlsl = createNode("Sin").getShaderSnippet();
      expect(hlsl).toContain("sin(");
    });

    it("should have single input and output pins", () => {
      const def = getDefinition("Sin");
      const inPins = def.pins.filter((p) => p.dir === "in");
      const outPins = def.pins.filter((p) => p.dir === "out");
      expect(inPins.length).toBe(1);
      expect(outPins.length).toBe(1);
    });
  });

  describe("Cosine Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Cos")).toBeDefined();
    });

    it("should produce cos() HLSL intrinsic", () => {
      const hlsl = createNode("Cos").getShaderSnippet();
      expect(hlsl).toContain("cos(");
    });
  });

  // =========================================================================
  // ROUNDING NODES
  // =========================================================================
  describe("Floor Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Floor")).toBeDefined();
    });

    it("should produce floor() HLSL intrinsic", () => {
      const hlsl = createNode("Floor").getShaderSnippet();
      expect(hlsl).toContain("floor(");
    });
  });

  describe("Ceil Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Ceil")).toBeDefined();
    });

    it("should produce ceil() HLSL intrinsic", () => {
      const hlsl = createNode("Ceil").getShaderSnippet();
      expect(hlsl).toContain("ceil(");
    });
  });

  describe("Frac Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Frac")).toBeDefined();
    });

    it("should produce frac() HLSL intrinsic", () => {
      // From spec: "frac(x) [equivalent to x - floor(x)]"
      const hlsl = createNode("Frac").getShaderSnippet();
      expect(hlsl).toContain("frac(");
    });
  });

  describe("Abs Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Abs")).toBeDefined();
    });

    it("should produce abs() HLSL intrinsic", () => {
      const hlsl = createNode("Abs").getShaderSnippet();
      expect(hlsl).toContain("abs(");
    });
  });

  describe("SquareRoot Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("SquareRoot")).toBeDefined();
    });

    it("should produce sqrt() HLSL intrinsic", () => {
      const hlsl = createNode("SquareRoot").getShaderSnippet();
      expect(hlsl).toContain("sqrt(");
    });

    it("should protect against negative input", () => {
      // sqrt of negative number is undefined
      const hlsl = createNode("SquareRoot").getShaderSnippet();
      expect(hlsl).toContain("max(");
    });
  });

  // =========================================================================
  // CLAMP / LERP NODES
  // =========================================================================
  describe("Clamp Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Clamp")).toBeDefined();
    });

    it("should produce clamp() HLSL intrinsic", () => {
      const hlsl = createNode("Clamp").getShaderSnippet();
      expect(hlsl).toMatch(/clamp\(/);
    });

    it("should default Min=0.0, Max=1.0 (common 0-1 range)", () => {
      const def = getDefinition("Clamp");
      expect(def.pins.find((p) => p.id === "min").defaultValue).toBe(0.0);
      expect(def.pins.find((p) => p.id === "max").defaultValue).toBe(1.0);
    });
  });

  describe("Lerp Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Lerp")).toBeDefined();
    });

    it("should produce lerp() HLSL intrinsic", () => {
      // From spec: "lerp(A, B, Alpha) compiles to A + Alpha * (B - A)"
      const hlsl = createNode("Lerp").getShaderSnippet();
      expect(hlsl).toContain("lerp(");
    });

    it("should have three inputs: A, B, Alpha", () => {
      const def = getDefinition("Lerp");
      expect(def.pins.find((p) => p.id === "a")).toBeDefined();
      expect(def.pins.find((p) => p.id === "b")).toBeDefined();
      expect(def.pins.find((p) => p.id === "alpha")).toBeDefined();
    });

    it("should default Alpha to 0.5 (midpoint blend)", () => {
      const def = getDefinition("Lerp");
      expect(def.pins.find((p) => p.id === "alpha").defaultValue).toBe(0.5);
    });

    it('should have hotkey "L"', () => {
      const def = getDefinition("Lerp");
      expect(def.hotkey).toBe("L");
    });
  });
});
