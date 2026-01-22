/**
 * Parameter Nodes Test Suite
 * ===========================
 * Tests for ScalarParameter, VectorParameter, TextureParameter, StaticBoolParameter
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getRegistry, createNode, getDefinition } from "../setup.js";

describe("Parameter Nodes", () => {
  beforeAll(() => {
    getRegistry(); // Initialize registry
  });

  // =========================================================================
  // SCALAR PARAMETER NODE
  // =========================================================================
  describe("ScalarParameter Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("ScalarParameter");
      expect(def).toBeDefined();
    });

    it("should be a material-parameter type", () => {
      const def = getDefinition("ScalarParameter");
      expect(def.type).toBe("material-parameter");
    });

    it("should output float", () => {
      const def = getDefinition("ScalarParameter");
      const outPin = def.pins.find((p) => p.dir === "out");

      expect(outPin).toBeDefined();
      expect(outPin.type).toBe("float");
    });

    it("should have ParameterName property", () => {
      const def = getDefinition("ScalarParameter");
      expect(def.properties).toHaveProperty("ParameterName");
    });

    it("should have Group property", () => {
      const def = getDefinition("ScalarParameter");
      expect(def.properties).toHaveProperty("Group");
    });

    it("should have DefaultValue property", () => {
      const def = getDefinition("ScalarParameter");
      expect(def.properties).toHaveProperty("DefaultValue");
    });

    it("should have SliderMin and SliderMax properties", () => {
      const def = getDefinition("ScalarParameter");
      expect(def.properties).toHaveProperty("SliderMin");
      expect(def.properties).toHaveProperty("SliderMax");
    });

    it('should have hotkey "S"', () => {
      const def = getDefinition("ScalarParameter");
      expect(def.hotkey).toBe("S");
    });

    it("should have teal header color for parameters", () => {
      const def = getDefinition("ScalarParameter");
      expect(def.headerColor).toBe("#00838F");
    });

    it("should produce HLSL referencing MaterialParameters", () => {
      const node = createNode("ScalarParameter");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("MaterialParameters.");
    });
  });

  // =========================================================================
  // VECTOR PARAMETER NODE
  // =========================================================================
  describe("VectorParameter Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("VectorParameter");
      expect(def).toBeDefined();
    });

    it("should be a material-parameter type", () => {
      const def = getDefinition("VectorParameter");
      expect(def.type).toBe("material-parameter");
    });

    it("should have RGB, R, G, B, A output pins", () => {
      const def = getDefinition("VectorParameter");
      const outPins = def.pins.filter((p) => p.dir === "out").map((p) => p.id);

      expect(outPins).toContain("rgb");
      expect(outPins).toContain("r");
      expect(outPins).toContain("g");
      expect(outPins).toContain("b");
      expect(outPins).toContain("a");
    });

    it("should have ParameterName property", () => {
      const def = getDefinition("VectorParameter");
      expect(def.properties).toHaveProperty("ParameterName");
    });

    it("should have DefaultValue as RGBA object", () => {
      const def = getDefinition("VectorParameter");
      expect(def.properties).toHaveProperty("DefaultValue");
      expect(def.properties.DefaultValue).toHaveProperty("R");
      expect(def.properties.DefaultValue).toHaveProperty("G");
      expect(def.properties.DefaultValue).toHaveProperty("B");
      expect(def.properties.DefaultValue).toHaveProperty("A");
    });

    it('should have hotkey "V"', () => {
      const def = getDefinition("VectorParameter");
      expect(def.hotkey).toBe("V");
    });

    it("should enable preview", () => {
      const def = getDefinition("VectorParameter");
      expect(def.showPreview).toBe(true);
    });
  });

  // =========================================================================
  // STATIC BOOL PARAMETER NODE
  // =========================================================================
  describe("StaticBoolParameter Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("StaticBoolParameter");
      expect(def).toBeDefined();
    });

    it("should be a material-parameter type", () => {
      const def = getDefinition("StaticBoolParameter");
      expect(def.type).toBe("material-parameter");
    });

    it("should output bool", () => {
      const def = getDefinition("StaticBoolParameter");
      const outPin = def.pins.find((p) => p.dir === "out");

      expect(outPin).toBeDefined();
      expect(outPin.type).toBe("bool");
    });

    it("should have ParameterName property", () => {
      const def = getDefinition("StaticBoolParameter");
      expect(def.properties).toHaveProperty("ParameterName");
    });

    it("should have DefaultValue property (boolean)", () => {
      const def = getDefinition("StaticBoolParameter");
      expect(def.properties).toHaveProperty("DefaultValue");
      expect(typeof def.properties.DefaultValue).toBe("boolean");
    });

    it("should produce HLSL referencing MaterialParameters", () => {
      const node = createNode("StaticBoolParameter");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("MaterialParameters.");
    });
  });

  // =========================================================================
  // CONSTANT NODES (Related to Parameters)
  // =========================================================================
  describe("Constant Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Constant");
      expect(def).toBeDefined();
    });

    it("should output float", () => {
      const def = getDefinition("Constant");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float");
    });

    it('should have hotkey "1"', () => {
      const def = getDefinition("Constant");
      expect(def.hotkey).toBe("1");
    });

    it("should have R property", () => {
      const def = getDefinition("Constant");
      expect(def.properties).toHaveProperty("R");
    });
  });

  describe("Constant3Vector Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Constant3Vector");
      expect(def).toBeDefined();
    });

    it("should output float3", () => {
      const def = getDefinition("Constant3Vector");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float3");
    });

    it('should have hotkey "3"', () => {
      const def = getDefinition("Constant3Vector");
      expect(def.hotkey).toBe("3");
    });

    it("should have Color property with R, G, B", () => {
      const def = getDefinition("Constant3Vector");
      expect(def.properties).toHaveProperty("Color");
      expect(def.properties.Color).toHaveProperty("R");
      expect(def.properties.Color).toHaveProperty("G");
      expect(def.properties.Color).toHaveProperty("B");
    });

    it("should enable preview", () => {
      const def = getDefinition("Constant3Vector");
      expect(def.showPreview).toBe(true);
    });
  });

  describe("Constant4Vector Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Constant4Vector");
      expect(def).toBeDefined();
    });

    it("should output float4", () => {
      const def = getDefinition("Constant4Vector");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float4");
    });

    it("should have Color property with R, G, B and separate A", () => {
      const def = getDefinition("Constant4Vector");
      expect(def.properties).toHaveProperty("Color");
      expect(def.properties.Color).toHaveProperty("R");
      expect(def.properties.Color).toHaveProperty("G");
      expect(def.properties.Color).toHaveProperty("B");
      expect(def.properties).toHaveProperty("A");
    });
  });
});
