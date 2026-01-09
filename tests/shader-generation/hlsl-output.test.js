/**
 * HLSL Shader Generation Test Suite
 * ===================================
 * Tests for shader code output accuracy
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getRegistry, createNode, getDefinition } from "../setup.js";

describe("HLSL Code Generation", () => {
  beforeAll(() => {
    getRegistry();
  });

  // =========================================================================
  // MAIN MATERIAL NODE
  // =========================================================================
  describe("Main Material Node Output", () => {
    it("should exist in registry", () => {
      expect(getDefinition("MainMaterialNode")).toBeDefined();
    });

    it("should be marked as isMainNode", () => {
      const def = getDefinition("MainMaterialNode");
      expect(def.isMainNode).toBe(true);
    });

    it("should output all PBR channels", () => {
      const node = createNode("MainMaterialNode");
      const hlsl = node.getShaderSnippet();

      expect(hlsl).toContain("MaterialOutput.BaseColor");
      expect(hlsl).toContain("MaterialOutput.Metallic");
      expect(hlsl).toContain("MaterialOutput.Roughness");
      expect(hlsl).toContain("MaterialOutput.Normal");
    });

    it("should include EmissiveColor output", () => {
      const node = createNode("MainMaterialNode");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("MaterialOutput.EmissiveColor");
    });

    it("should include WorldPositionOffset output", () => {
      const node = createNode("MainMaterialNode");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("MaterialOutput.WorldPositionOffset");
    });

    it("should include AmbientOcclusion output", () => {
      const node = createNode("MainMaterialNode");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("MaterialOutput.AmbientOcclusion");
    });

    it("should have conditional Opacity pin for Translucent mode", () => {
      const def = getDefinition("MainMaterialNode");
      const opacityPin = def.pins.find((p) => p.id === "opacity");
      expect(opacityPin).toBeDefined();
      expect(opacityPin.conditionalOn).toContain("Translucent");
    });

    it("should have conditional OpacityMask pin for Masked mode", () => {
      const def = getDefinition("MainMaterialNode");
      const maskPin = def.pins.find((p) => p.id === "opacity_mask");
      expect(maskPin).toBeDefined();
      expect(maskPin.conditionalOn).toContain("Masked");
    });
  });

  // =========================================================================
  // PARAMETER NODES
  // =========================================================================
  describe("Parameter Nodes", () => {
    describe("ScalarParameter", () => {
      it("should exist in registry", () => {
        expect(getDefinition("ScalarParameter")).toBeDefined();
      });

      it("should be marked as material-parameter type", () => {
        const def = getDefinition("ScalarParameter");
        expect(def.type).toBe("material-parameter");
      });

      it("should reference MaterialParameters uniform", () => {
        const node = createNode("ScalarParameter");
        const hlsl = node.getShaderSnippet();
        expect(hlsl).toContain("MaterialParameters.");
      });

      it("should have ParameterName property", () => {
        const def = getDefinition("ScalarParameter");
        expect(def.properties).toHaveProperty("ParameterName");
      });

      it("should have SliderMin and SliderMax properties", () => {
        const def = getDefinition("ScalarParameter");
        expect(def.properties).toHaveProperty("SliderMin");
        expect(def.properties).toHaveProperty("SliderMax");
      });

      it("should have teal header color", () => {
        const def = getDefinition("ScalarParameter");
        expect(def.headerColor).toBe("#00838F");
      });

      it('should have hotkey "S"', () => {
        const def = getDefinition("ScalarParameter");
        expect(def.hotkey).toBe("S");
      });
    });

    describe("VectorParameter", () => {
      it("should exist in registry", () => {
        expect(getDefinition("VectorParameter")).toBeDefined();
      });

      it("should output RGB and individual R/G/B/A channels", () => {
        const def = getDefinition("VectorParameter");
        const outPins = def.pins
          .filter((p) => p.dir === "out")
          .map((p) => p.id);
        expect(outPins).toContain("rgb");
        expect(outPins).toContain("r");
        expect(outPins).toContain("g");
        expect(outPins).toContain("b");
        expect(outPins).toContain("a");
      });

      it('should have hotkey "V"', () => {
        const def = getDefinition("VectorParameter");
        expect(def.hotkey).toBe("V");
      });
    });

    describe("StaticBoolParameter", () => {
      it("should exist in registry", () => {
        expect(getDefinition("StaticBoolParameter")).toBeDefined();
      });

      it("should output bool type", () => {
        const def = getDefinition("StaticBoolParameter");
        const outPin = def.pins.find((p) => p.dir === "out");
        expect(outPin.type).toBe("bool");
      });
    });
  });

  // =========================================================================
  // TEXTURE NODES
  // =========================================================================
  describe("Texture Nodes", () => {
    describe("TextureSample", () => {
      it("should exist in registry", () => {
        expect(getDefinition("TextureSample")).toBeDefined();
      });

      it("should use Texture2DSample HLSL intrinsic", () => {
        const node = createNode("TextureSample");
        const hlsl = node.getShaderSnippet();
        expect(hlsl).toContain("Texture2DSample");
      });

      it("should have UVs input (float2)", () => {
        const def = getDefinition("TextureSample");
        const uvPin = def.pins.find((p) => p.id === "uv");
        expect(uvPin).toBeDefined();
        expect(uvPin.type).toBe("float2");
      });

      it("should have Tex input (texture)", () => {
        const def = getDefinition("TextureSample");
        const texPin = def.pins.find((p) => p.id === "tex");
        expect(texPin).toBeDefined();
        expect(texPin.type).toBe("texture");
      });

      it("should output RGB and individual R/G/B/A channels", () => {
        const def = getDefinition("TextureSample");
        const outPins = def.pins
          .filter((p) => p.dir === "out")
          .map((p) => p.id);
        expect(outPins).toContain("rgb");
        expect(outPins).toContain("r");
        expect(outPins).toContain("g");
        expect(outPins).toContain("b");
        expect(outPins).toContain("a");
      });

      it('should have hotkey "T"', () => {
        const def = getDefinition("TextureSample");
        expect(def.hotkey).toBe("T");
      });

      it("should have showPreview enabled", () => {
        const def = getDefinition("TextureSample");
        expect(def.showPreview).toBe(true);
      });
    });

    describe("TextureObject", () => {
      it("should exist in registry", () => {
        expect(getDefinition("TextureObject")).toBeDefined();
      });

      it("should output texture type (reference)", () => {
        const def = getDefinition("TextureObject");
        const outPin = def.pins.find((p) => p.dir === "out");
        expect(outPin.type).toBe("texture");
      });
    });
  });

  // =========================================================================
  // CONSTANT NODES
  // =========================================================================
  describe("Constant Nodes", () => {
    describe("Constant (scalar)", () => {
      it("should exist in registry", () => {
        expect(getDefinition("Constant")).toBeDefined();
      });

      it("should output float type", () => {
        const def = getDefinition("Constant");
        const outPin = def.pins.find((p) => p.dir === "out");
        expect(outPin.type).toBe("float");
      });

      it("should have R property", () => {
        const def = getDefinition("Constant");
        expect(def.properties).toHaveProperty("R");
      });

      it('should have hotkey "1"', () => {
        const def = getDefinition("Constant");
        expect(def.hotkey).toBe("1");
      });
    });

    describe("Constant3Vector", () => {
      it("should exist in registry", () => {
        expect(getDefinition("Constant3Vector")).toBeDefined();
      });

      it("should output float3 type", () => {
        const def = getDefinition("Constant3Vector");
        const outPin = def.pins.find((p) => p.dir === "out");
        expect(outPin.type).toBe("float3");
      });

      it("should have R, G, B properties", () => {
        const def = getDefinition("Constant3Vector");
        expect(def.properties).toHaveProperty("R");
        expect(def.properties).toHaveProperty("G");
        expect(def.properties).toHaveProperty("B");
      });

      it('should have hotkey "3"', () => {
        const def = getDefinition("Constant3Vector");
        expect(def.hotkey).toBe("3");
      });

      it("should have showPreview enabled", () => {
        const def = getDefinition("Constant3Vector");
        expect(def.showPreview).toBe(true);
      });

      it("should produce float3 HLSL constructor", () => {
        const node = createNode("Constant3Vector");
        const hlsl = node.getShaderSnippet();
        expect(hlsl).toContain("float3(");
      });
    });

    describe("Constant4Vector", () => {
      it("should exist in registry", () => {
        expect(getDefinition("Constant4Vector")).toBeDefined();
      });

      it("should output float4 type", () => {
        const def = getDefinition("Constant4Vector");
        const outPin = def.pins.find((p) => p.dir === "out");
        expect(outPin.type).toBe("float4");
      });

      it("should have R, G, B, A properties", () => {
        const def = getDefinition("Constant4Vector");
        expect(def.properties).toHaveProperty("R");
        expect(def.properties).toHaveProperty("G");
        expect(def.properties).toHaveProperty("B");
        expect(def.properties).toHaveProperty("A");
      });
    });
  });
});
