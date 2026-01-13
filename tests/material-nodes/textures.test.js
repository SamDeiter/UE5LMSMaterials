/**
 * Texture Nodes Test Suite
 * =========================
 * Tests for TextureSample, TextureObject, TextureCoordinate based on UE5 Materials Spec
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getRegistry, createNode, getDefinition } from "../setup.js";

describe("Texture Nodes", () => {
  beforeAll(() => {
    getRegistry(); // Initialize registry
  });

  // =========================================================================
  // TEXTURE SAMPLE NODE
  // =========================================================================
  describe("TextureSample Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("TextureSample");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with Texture2DSample intrinsic", () => {
      const node = createNode("TextureSample");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("Texture2DSample");
    });

    it("should have UV input pin (float2)", () => {
      const def = getDefinition("TextureSample");
      const uvPin = def.pins.find((p) => p.id === "uv");

      expect(uvPin).toBeDefined();
      expect(uvPin.type).toBe("float2");
      expect(uvPin.dir).toBe("in");
    });

    it("should have texture input pin", () => {
      const def = getDefinition("TextureSample");
      const texPin = def.pins.find((p) => p.id === "tex");

      expect(texPin).toBeDefined();
      expect(texPin.type).toBe("texture");
      expect(texPin.dir).toBe("in");
    });

    it("should have RGB, R, G, B, A output channels", () => {
      const def = getDefinition("TextureSample");
      const outPins = def.pins.filter((p) => p.dir === "out").map((p) => p.id);

      expect(outPins).toContain("rgb");
      expect(outPins).toContain("r");
      expect(outPins).toContain("g");
      expect(outPins).toContain("b");
      expect(outPins).toContain("a");
    });

    it("should have TextureAsset property", () => {
      const def = getDefinition("TextureSample");
      expect(def.properties).toHaveProperty("TextureAsset");
    });

    it("should have SamplerType property", () => {
      const def = getDefinition("TextureSample");
      expect(def.properties).toHaveProperty("SamplerType");
    });

    it('should have hotkey "T"', () => {
      const def = getDefinition("TextureSample");
      expect(def.hotkey).toBe("T");
    });

    it("should be in Texture category", () => {
      const def = getDefinition("TextureSample");
      expect(def.category).toBe("Texture");
    });

    it("should enable preview", () => {
      const def = getDefinition("TextureSample");
      expect(def.showPreview).toBe(true);
    });
  });

  // =========================================================================
  // TEXTURE OBJECT NODE
  // =========================================================================
  describe("TextureObject Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("TextureObject");
      expect(def).toBeDefined();
    });

    it("should have texture output pin", () => {
      const def = getDefinition("TextureObject");
      const outPin = def.pins.find((p) => p.id === "out");

      expect(outPin).toBeDefined();
      expect(outPin.type).toBe("texture");
      expect(outPin.dir).toBe("out");
    });

    it("should have TextureAsset property", () => {
      const def = getDefinition("TextureObject");
      expect(def.properties).toHaveProperty("TextureAsset");
    });

    it("should be in Texture category", () => {
      const def = getDefinition("TextureObject");
      expect(def.category).toBe("Texture");
    });

    it("should enable preview", () => {
      const def = getDefinition("TextureObject");
      expect(def.showPreview).toBe(true);
    });
  });

  // =========================================================================
  // TEXTURE COORDINATE NODE
  // =========================================================================
  describe("TextureCoordinate Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("TextureCoordinate");
      expect(def).toBeDefined();
    });

    it("should output float2 (UV coordinates)", () => {
      const def = getDefinition("TextureCoordinate");
      const outPin = def.pins.find((p) => p.dir === "out");

      expect(outPin).toBeDefined();
      expect(outPin.type).toBe("float2");
    });

    it("should have CoordinateIndex property", () => {
      const def = getDefinition("TextureCoordinate");
      expect(def.properties).toHaveProperty("CoordinateIndex");
    });

    it("should have UTiling and VTiling properties", () => {
      const def = getDefinition("TextureCoordinate");
      expect(def.properties).toHaveProperty("UTiling");
      expect(def.properties).toHaveProperty("VTiling");
    });

    it("should default tiling to 1.0", () => {
      const def = getDefinition("TextureCoordinate");
      expect(def.properties.UTiling).toBe(1.0);
      expect(def.properties.VTiling).toBe(1.0);
    });

    it("should default CoordinateIndex to 0", () => {
      const def = getDefinition("TextureCoordinate");
      expect(def.properties.CoordinateIndex).toBe(0);
    });

    it("should produce HLSL with GetTextureCoordinates", () => {
      const node = createNode("TextureCoordinate");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("GetTextureCoordinates");
    });
  });

  // =========================================================================
  // TEXTURE PARAMETER NODE
  // =========================================================================
  describe("TextureParameter Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("TextureParameter");
      expect(def).toBeDefined();
    });

    it("should have ParameterName property", () => {
      const def = getDefinition("TextureParameter");
      expect(def.properties).toHaveProperty("ParameterName");
    });

    it("should have UV input pin", () => {
      const def = getDefinition("TextureParameter");
      const uvPin = def.pins.find((p) => p.id === "uv");

      expect(uvPin).toBeDefined();
      expect(uvPin.type).toBe("float2");
      expect(uvPin.dir).toBe("in");
    });

    it("should have RGB, R, G, B, A output channels", () => {
      const def = getDefinition("TextureParameter");
      const outPins = def.pins.filter((p) => p.dir === "out").map((p) => p.id);

      expect(outPins).toContain("rgb");
      expect(outPins).toContain("r");
      expect(outPins).toContain("g");
      expect(outPins).toContain("b");
      expect(outPins).toContain("a");
    });

    it("should be a material-parameter type", () => {
      const def = getDefinition("TextureParameter");
      expect(def.type).toBe("material-parameter");
    });

    it("should have teal header color", () => {
      const def = getDefinition("TextureParameter");
      expect(def.headerColor).toBe("#00838F");
    });
  });
});
