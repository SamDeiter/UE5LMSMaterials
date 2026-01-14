/**
 * Vector Operations Test Suite
 * =============================
 * Tests for Dot, Cross, Normalize, Append, Mask, MakeFloat3 based on UE5 Materials Spec
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getRegistry, createNode, getDefinition } from "../setup.js";

describe("Vector Operation Nodes", () => {
  beforeAll(() => {
    getRegistry(); // Initialize registry
  });

  // =========================================================================
  // DOT PRODUCT NODE
  // =========================================================================
  describe("DotProduct Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("DotProduct");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with dot() intrinsic", () => {
      const node = createNode("DotProduct");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("dot(");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("DotProduct");

      // Both inputs should be float3
      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");
      const pinOut = def.pins.find((p) => p.id === "out");

      expect(pinA).toBeDefined();
      expect(pinA.dir).toBe("in");
      expect(pinA.type).toBe("float3");

      expect(pinB).toBeDefined();
      expect(pinB.dir).toBe("in");
      expect(pinB.type).toBe("float3");

      // Output should be float (scalar result)
      expect(pinOut).toBeDefined();
      expect(pinOut.dir).toBe("out");
      expect(pinOut.type).toBe("float");
    });

    it("should be in Math|Vector category", () => {
      const def = getDefinition("DotProduct");
      expect(def.category).toBe("Math|Vector");
    });
  });

  // =========================================================================
  // CROSS PRODUCT NODE
  // =========================================================================
  describe("CrossProduct Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("CrossProduct");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with cross() intrinsic", () => {
      const node = createNode("CrossProduct");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("cross(");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("CrossProduct");

      // Both inputs should be float3
      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");
      const pinOut = def.pins.find((p) => p.id === "out");

      expect(pinA).toBeDefined();
      expect(pinA.type).toBe("float3");

      expect(pinB).toBeDefined();
      expect(pinB.type).toBe("float3");

      // Output should also be float3 (perpendicular vector)
      expect(pinOut).toBeDefined();
      expect(pinOut.type).toBe("float3");
    });
  });

  // =========================================================================
  // NORMALIZE NODE
  // =========================================================================
  describe("Normalize Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Normalize");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with normalize() intrinsic", () => {
      const node = createNode("Normalize");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("normalize(");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("Normalize");

      const pinIn = def.pins.find((p) => p.id === "in");
      const pinOut = def.pins.find((p) => p.id === "out");

      // Input/output should be float3 (vector normalization)
      expect(pinIn).toBeDefined();
      expect(pinIn.type).toBe("float3");

      expect(pinOut).toBeDefined();
      expect(pinOut.type).toBe("float3");
    });

    it("should be in Math|Vector category", () => {
      const def = getDefinition("Normalize");
      expect(def.category).toBe("Math|Vector");
    });
  });

  // =========================================================================
  // APPEND VECTOR NODE
  // =========================================================================
  describe("AppendVector Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("AppendVector");
      expect(def).toBeDefined();
    });

    it("should produce HLSL creating float2 from two floats", () => {
      const node = createNode("AppendVector");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("float2");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("AppendVector");

      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");
      const pinOut = def.pins.find((p) => p.id === "out");

      // Two float inputs, one float2 output
      expect(pinA).toBeDefined();
      expect(pinA.type).toBe("float");

      expect(pinB).toBeDefined();
      expect(pinB.type).toBe("float");

      expect(pinOut).toBeDefined();
      expect(pinOut.type).toBe("float2");
    });
  });

  // =========================================================================
  // COMPONENT MASK NODE
  // =========================================================================
  describe("ComponentMask Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("ComponentMask");
      expect(def).toBeDefined();
    });

    it("should have mask properties (R, G, B, A)", () => {
      const def = getDefinition("ComponentMask");

      expect(def.properties).toHaveProperty("R");
      expect(def.properties).toHaveProperty("G");
      expect(def.properties).toHaveProperty("B");
      expect(def.properties).toHaveProperty("A");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("ComponentMask");

      const pinIn = def.pins.find((p) => p.id === "in");
      const pinOut = def.pins.find((p) => p.id === "out");

      // Input takes float4/float3/float2, output varies by mask
      expect(pinIn).toBeDefined();
      expect(pinIn.type).toBe("float4");

      expect(pinOut).toBeDefined();
      expect(pinOut.type).toBe("float");
    });

    it("should default to R channel only", () => {
      const def = getDefinition("ComponentMask");
      expect(def.properties.R).toBe(true);
      expect(def.properties.G).toBe(false);
      expect(def.properties.B).toBe(false);
      expect(def.properties.A).toBe(false);
    });
  });

  // =========================================================================
  // MAKE FLOAT3 NODE
  // =========================================================================
  describe("MakeFloat3 Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("MakeFloat3");
      expect(def).toBeDefined();
    });

    it("should produce HLSL creating float3 from three floats", () => {
      const node = createNode("MakeFloat3");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("float3");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("MakeFloat3");

      const pinR = def.pins.find((p) => p.id === "r");
      const pinG = def.pins.find((p) => p.id === "g");
      const pinB = def.pins.find((p) => p.id === "b");
      const pinOut = def.pins.find((p) => p.id === "out");

      // Three float inputs, one float3 output
      expect(pinR.type).toBe("float");
      expect(pinG.type).toBe("float");
      expect(pinB.type).toBe("float");

      expect(pinOut.type).toBe("float3");
    });

    it("should have default values of 0.0", () => {
      const def = getDefinition("MakeFloat3");
      expect(def.pins.find((p) => p.id === "r").defaultValue).toBe(0.0);
      expect(def.pins.find((p) => p.id === "g").defaultValue).toBe(0.0);
      expect(def.pins.find((p) => p.id === "b").defaultValue).toBe(0.0);
    });
  });

  // =========================================================================
  // BREAK OUT FLOAT3 COMPONENTS NODE
  // =========================================================================
  describe("BreakOutFloat3Components Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("BreakOutFloat3Components");
      expect(def).toBeDefined();
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("BreakOutFloat3Components");

      const pinIn = def.pins.find((p) => p.id === "in");
      const pinR = def.pins.find((p) => p.id === "r");
      const pinG = def.pins.find((p) => p.id === "g");
      const pinB = def.pins.find((p) => p.id === "b");

      // One float3 input, three float outputs
      expect(pinIn.type).toBe("float3");
      expect(pinR.type).toBe("float");
      expect(pinG.type).toBe("float");
      expect(pinB.type).toBe("float");
    });

    it("should produce HLSL extracting .r, .g, .b components", () => {
      const node = createNode("BreakOutFloat3Components");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain(".r");
      expect(hlsl).toContain(".g");
      expect(hlsl).toContain(".b");
    });
  });
});
