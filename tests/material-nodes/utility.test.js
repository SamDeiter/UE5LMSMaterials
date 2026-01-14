/**
 * Utility Nodes Test Suite
 * =========================
 * Tests for utility nodes based on UE5 Materials Spec Section 7
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getRegistry, createNode, getDefinition } from "../setup.js";

describe("Utility Nodes", () => {
  beforeAll(() => {
    getRegistry();
  });

  // =========================================================================
  // FRESNEL NODE
  // =========================================================================
  describe("Fresnel Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Fresnel")).toBeDefined();
    });

    it("should implement Schlick approximation pattern", () => {
      // From spec: Result = Base + (1 - Base) * pow(1 - dot(Normal, View), Exponent)
      const hlsl = createNode("Fresnel").getShaderSnippet();

      // Should contain pow for the exponent
      expect(hlsl).toContain("pow(");

      // Should contain saturate(dot(...)) for the view angle
      expect(hlsl).toMatch(/saturate\(dot\(/);
    });

    it("should default BaseReflectFraction to 0.04 (dielectric F0)", () => {
      // From spec: Base reflectivity for dielectrics ~0.04
      const def = getDefinition("Fresnel");
      expect(def.properties.BaseReflectFraction).toBe(0.04);
    });

    it("should default Exponent to 5.0", () => {
      const def = getDefinition("Fresnel");
      expect(def.properties.Exponent).toBe(5.0);
    });

    it("should accept optional Normal input override", () => {
      const def = getDefinition("Fresnel");
      const normalPin = def.pins.find((p) => p.id === "normal");
      expect(normalPin).toBeDefined();
      expect(normalPin.dir).toBe("in");
      expect(normalPin.type).toBe("float3");
    });

    it('should have hotkey "F"', () => {
      const def = getDefinition("Fresnel");
      expect(def.hotkey).toBe("F");
    });

    it("should output float", () => {
      const def = getDefinition("Fresnel");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float");
    });
  });

  // =========================================================================
  // NOISE NODE
  // =========================================================================
  describe("Noise Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Noise")).toBeDefined();
    });

    it("should have Position input (float3)", () => {
      const def = getDefinition("Noise");
      const posPin = def.pins.find((p) => p.id === "position");
      expect(posPin).toBeDefined();
      expect(posPin.type).toBe("float3");
    });

    it("should have Scale property", () => {
      const def = getDefinition("Noise");
      expect(def.properties).toHaveProperty("Scale");
    });

    it("should have Quality property", () => {
      // From spec: "Quality" controls iterations
      const def = getDefinition("Noise");
      expect(def.properties).toHaveProperty("Quality");
    });

    it("should have Function property (noise algorithm)", () => {
      // From spec: "Simplex, Perlin, Gradient"
      const def = getDefinition("Noise");
      expect(def.properties).toHaveProperty("Function");
    });

    it("should output float", () => {
      const def = getDefinition("Noise");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float");
    });
  });

  // =========================================================================
  // STATIC SWITCH NODE
  // =========================================================================
  describe("StaticSwitch Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("StaticSwitch")).toBeDefined();
    });

    it("should have True, False, and Value pins", () => {
      const def = getDefinition("StaticSwitch");
      expect(def.pins.find((p) => p.id === "true_in")).toBeDefined();
      expect(def.pins.find((p) => p.id === "false_in")).toBeDefined();
      expect(def.pins.find((p) => p.id === "value")).toBeDefined();
    });

    it("should have Value pin of type bool", () => {
      const def = getDefinition("StaticSwitch");
      const valuePin = def.pins.find((p) => p.id === "value");
      expect(valuePin.type).toBe("bool");
    });

    it("should produce HLSL ternary operator", () => {
      const hlsl = createNode("StaticSwitch").getShaderSnippet();
      expect(hlsl).toContain("?");
      expect(hlsl).toContain(":");
    });
  });

  // =========================================================================
  // IF NODE
  // =========================================================================
  describe("If Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("If")).toBeDefined();
    });

    it("should have A, B comparison inputs", () => {
      const def = getDefinition("If");
      expect(def.pins.find((p) => p.id === "a")).toBeDefined();
      expect(def.pins.find((p) => p.id === "b")).toBeDefined();
    });

    it("should have three result inputs: A > B, A = B, A < B", () => {
      const def = getDefinition("If");
      expect(def.pins.find((p) => p.id === "a_greater")).toBeDefined();
      expect(def.pins.find((p) => p.id === "a_equal")).toBeDefined();
      expect(def.pins.find((p) => p.id === "a_less")).toBeDefined();
    });

    it("should produce HLSL with comparison operators", () => {
      const hlsl = createNode("If").getShaderSnippet();
      expect(hlsl).toContain(">");
      expect(hlsl).toContain("<");
    });
  });

  // =========================================================================
  // FLATTEN NORMAL NODE
  // =========================================================================
  describe("FlattenNormal Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("FlattenNormal")).toBeDefined();
    });

    it("should have Normal and Flatness inputs", () => {
      const def = getDefinition("FlattenNormal");
      expect(def.pins.find((p) => p.id === "normal")).toBeDefined();
      expect(def.pins.find((p) => p.id === "flatness")).toBeDefined();
    });

    it("should default Flatness to 0.5", () => {
      const def = getDefinition("FlattenNormal");
      expect(def.pins.find((p) => p.id === "flatness").defaultValue).toBe(0.5);
    });

    it("should output float3", () => {
      const def = getDefinition("FlattenNormal");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float3");
    });

    it("should use lerp to blend normal toward (0,0,1)", () => {
      const hlsl = createNode("FlattenNormal").getShaderSnippet();
      expect(hlsl).toContain("lerp(");
      expect(hlsl).toContain("0, 0, 1");
    });
  });
});
