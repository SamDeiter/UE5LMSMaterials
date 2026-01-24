/**
 * LayerNodes Tests
 *
 * Tests for Material Layer node definitions.
 */

import { describe, it, expect } from "vitest";
import { LayerNodes } from "../../data/nodes/LayerNodes.js";

describe("LayerNodes", () => {
  // =========================================================================
  // NODE DEFINITIONS EXIST
  // =========================================================================
  describe("Node Definitions", () => {
    const expectedNodes = [
      "MaterialLayerBlend",
      "MakeMaterialAttributes",
      "BreakMaterialAttributes",
      "HeightBlendLayers",
      "AngleBlendLayers",
      "VertexColorBlendLayers",
    ];

    it.each(expectedNodes)("should have %s node defined", (nodeName) => {
      expect(LayerNodes[nodeName]).toBeDefined();
    });

    it("should have 6 layer nodes total", () => {
      expect(Object.keys(LayerNodes).length).toBe(6);
    });
  });

  // =========================================================================
  // MATERIAL LAYER BLEND NODE
  // =========================================================================
  describe("MaterialLayerBlend Node", () => {
    const node = LayerNodes.MaterialLayerBlend;

    it("should have correct metadata", () => {
      expect(node.title).toBe("Material Layer Blend");
      expect(node.category).toBe("Material Layers");
    });

    it("should have base layer and two blend layers", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Base Layer");
      expect(pinNames).toContain("Layer A");
      expect(pinNames).toContain("Layer B");
    });

    it("should have weight and mask inputs for each blend layer", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Layer A Weight");
      expect(pinNames).toContain("Layer A Mask");
      expect(pinNames).toContain("Layer B Weight");
      expect(pinNames).toContain("Layer B Mask");
    });

    it("should output materialattributes type", () => {
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("materialattributes");
    });

    it("should have BlendMode property", () => {
      expect(node.properties.BlendMode).toBe("Normal");
    });
  });

  // =========================================================================
  // MAKE MATERIAL ATTRIBUTES NODE
  // =========================================================================
  describe("MakeMaterialAttributes Node", () => {
    const node = LayerNodes.MakeMaterialAttributes;

    it("should have all PBR inputs", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Base Color");
      expect(pinNames).toContain("Metallic");
      expect(pinNames).toContain("Specular");
      expect(pinNames).toContain("Roughness");
      expect(pinNames).toContain("Emissive Color");
      expect(pinNames).toContain("Opacity");
      expect(pinNames).toContain("Normal");
      expect(pinNames).toContain("World Position Offset");
      expect(pinNames).toContain("Ambient Occlusion");
    });

    it("should output materialattributes", () => {
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("materialattributes");
    });

    it("should have shader code setting all attributes", () => {
      expect(node.shaderCode).toContain("BaseColor");
      expect(node.shaderCode).toContain("Metallic");
      expect(node.shaderCode).toContain("Roughness");
    });
  });

  // =========================================================================
  // BREAK MATERIAL ATTRIBUTES NODE
  // =========================================================================
  describe("BreakMaterialAttributes Node", () => {
    const node = LayerNodes.BreakMaterialAttributes;

    it("should have single materialattributes input", () => {
      const inputPins = node.pins.filter((p) => p.direction === "input");
      expect(inputPins.length).toBe(1);
      expect(inputPins[0].type).toBe("materialattributes");
    });

    it("should output all PBR properties", () => {
      const outputPins = node.pins.filter((p) => p.direction === "output");
      const outputNames = outputPins.map((p) => p.name);
      expect(outputNames).toContain("Base Color");
      expect(outputNames).toContain("Metallic");
      expect(outputNames).toContain("Roughness");
      expect(outputNames).toContain("Normal");
    });

    it("should have correct output types", () => {
      const baseColorOut = node.pins.find(
        (p) => p.name === "Base Color" && p.direction === "output",
      );
      const metallicOut = node.pins.find(
        (p) => p.name === "Metallic" && p.direction === "output",
      );
      expect(baseColorOut.type).toBe("float3");
      expect(metallicOut.type).toBe("float");
    });
  });

  // =========================================================================
  // HEIGHT BLEND LAYERS NODE
  // =========================================================================
  describe("HeightBlendLayers Node", () => {
    const node = LayerNodes.HeightBlendLayers;

    it("should have layer inputs with height values", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Layer A");
      expect(pinNames).toContain("Layer A Height");
      expect(pinNames).toContain("Layer B");
      expect(pinNames).toContain("Layer B Height");
    });

    it("should have blend sharpness control", () => {
      const sharpnessPin = node.pins.find((p) => p.localId === "sharpness");
      expect(sharpnessPin).toBeDefined();
      expect(sharpnessPin.defaultValue).toBe(0.1);
    });

    it("should have alpha blend weight", () => {
      const alphaPin = node.pins.find((p) => p.localId === "alpha");
      expect(alphaPin).toBeDefined();
      expect(alphaPin.defaultValue).toBe(0.5);
    });
  });

  // =========================================================================
  // ANGLE BLEND LAYERS NODE
  // =========================================================================
  describe("AngleBlendLayers Node", () => {
    const node = LayerNodes.AngleBlendLayers;

    it("should have base and slope layer inputs", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Base Layer");
      expect(pinNames).toContain("Slope Layer");
    });

    it("should have angle threshold and falloff", () => {
      const thresholdPin = node.pins.find((p) => p.localId === "threshold");
      const falloffPin = node.pins.find((p) => p.localId === "falloff");
      expect(thresholdPin.defaultValue).toBe(0.5);
      expect(falloffPin.defaultValue).toBe(0.1);
    });

    it("should reference WorldNormal in shader", () => {
      expect(node.shaderCode).toContain("WorldNormal");
    });
  });

  // =========================================================================
  // VERTEX COLOR BLEND LAYERS NODE
  // =========================================================================
  describe("VertexColorBlendLayers Node", () => {
    const node = LayerNodes.VertexColorBlendLayers;

    it("should have RGBA layer inputs", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Layer R");
      expect(pinNames).toContain("Layer G");
      expect(pinNames).toContain("Layer B");
      expect(pinNames).toContain("Layer A");
    });

    it("should have base layer input", () => {
      const basePin = node.pins.find((p) => p.localId === "base");
      expect(basePin).toBeDefined();
    });

    it("should reference VertexColor in shader", () => {
      expect(node.shaderCode).toContain("VertexColor");
    });
  });

  // =========================================================================
  // SHADER CODE VALIDATION
  // =========================================================================
  describe("Shader Code Validation", () => {
    const nodeNames = Object.keys(LayerNodes);

    it.each(nodeNames)("%s should have shader code", (nodeName) => {
      const node = LayerNodes[nodeName];
      expect(node.shaderCode).toBeDefined();
      expect(node.shaderCode.length).toBeGreaterThan(10);
    });

    it.each(nodeNames)(
      "%s shader code should include node ID placeholder",
      (nodeName) => {
        const node = LayerNodes[nodeName];
        expect(node.shaderCode).toContain("%id%");
      },
    );
  });

  // =========================================================================
  // PIN TYPE CONSISTENCY
  // =========================================================================
  describe("Pin Type Consistency", () => {
    it("all layer blend nodes should accept materialattributes", () => {
      const blendNodes = [
        LayerNodes.MaterialLayerBlend,
        LayerNodes.HeightBlendLayers,
        LayerNodes.AngleBlendLayers,
        LayerNodes.VertexColorBlendLayers,
      ];

      blendNodes.forEach((node) => {
        const attrInputs = node.pins.filter(
          (p) => p.type === "materialattributes" && p.direction === "input",
        );
        expect(attrInputs.length).toBeGreaterThan(0);
      });
    });

    it("all layer blend nodes should output materialattributes", () => {
      const blendNodes = [
        LayerNodes.MaterialLayerBlend,
        LayerNodes.HeightBlendLayers,
        LayerNodes.AngleBlendLayers,
        LayerNodes.VertexColorBlendLayers,
      ];

      blendNodes.forEach((node) => {
        const attrOutput = node.pins.find(
          (p) => p.type === "materialattributes" && p.direction === "output",
        );
        expect(attrOutput).toBeDefined();
      });
    });
  });
});
