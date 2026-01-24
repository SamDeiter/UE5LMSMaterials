/**
 * FunctionNodes Tests
 *
 * Tests for Material Function node definitions.
 */

import { describe, it, expect } from "vitest";
import { FunctionNodes } from "../../data/nodes/FunctionNodes.js";

describe("FunctionNodes", () => {
  // =========================================================================
  // NODE DEFINITIONS EXIST
  // =========================================================================
  describe("Node Definitions", () => {
    const expectedNodes = [
      "FunctionInput",
      "FunctionOutput",
      "MF_Fresnel",
      "MF_HeightBlend",
      "MF_DetailTexture",
      "MF_WorldAlignedBlend",
      "MF_Desaturation",
      "MF_CheapContrast",
      "MF_TriplanarProjection",
      "MF_ParallaxOcclusion",
    ];

    it.each(expectedNodes)("should have %s node defined", (nodeName) => {
      expect(FunctionNodes[nodeName]).toBeDefined();
    });

    it("should have 10 function nodes total", () => {
      expect(Object.keys(FunctionNodes).length).toBe(10);
    });
  });

  // =========================================================================
  // FUNCTION INPUT NODE
  // =========================================================================
  describe("FunctionInput Node", () => {
    const node = FunctionNodes.FunctionInput;

    it("should have correct metadata", () => {
      expect(node.title).toBe("Function Input");
      expect(node.type).toBe("function-node");
      expect(node.category).toBe("Material Functions");
    });

    it("should have preview input and output pin", () => {
      const inputPins = node.pins.filter((p) => p.direction === "input");
      const outputPins = node.pins.filter((p) => p.direction === "output");
      expect(inputPins.length).toBe(1);
      expect(outputPins.length).toBe(1);
    });

    it("should have input configuration properties", () => {
      expect(node.properties.InputName).toBeDefined();
      expect(node.properties.InputType).toBeDefined();
      expect(node.properties.SortPriority).toBeDefined();
    });
  });

  // =========================================================================
  // FUNCTION OUTPUT NODE
  // =========================================================================
  describe("FunctionOutput Node", () => {
    const node = FunctionNodes.FunctionOutput;

    it("should have correct metadata", () => {
      expect(node.title).toBe("Function Output");
      expect(node.type).toBe("function-node");
    });

    it("should have only input pin (no output)", () => {
      const inputPins = node.pins.filter((p) => p.direction === "input");
      const outputPins = node.pins.filter((p) => p.direction === "output");
      expect(inputPins.length).toBe(1);
      expect(outputPins.length).toBe(0);
    });
  });

  // =========================================================================
  // MF_FRESNEL NODE
  // =========================================================================
  describe("MF_Fresnel Node", () => {
    const node = FunctionNodes.MF_Fresnel;

    it("should have correct metadata", () => {
      expect(node.title).toBe("MF_Fresnel");
      expect(node.type).toBe("material-function");
      expect(node.category).toContain("Built-in");
    });

    it("should have required pins", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Normal");
      expect(pinNames).toContain("Exponent");
      expect(pinNames).toContain("Base Reflect Fraction");
      expect(pinNames).toContain("Result");
    });

    it("should have default exponent of 5", () => {
      const expPin = node.pins.find((p) => p.localId === "exponent");
      expect(expPin.defaultValue).toBe(5.0);
    });

    it("should have shader code with Fresnel calculation", () => {
      expect(node.shaderCode).toContain("Fresnel");
      expect(node.shaderCode).toContain("pow");
    });
  });

  // =========================================================================
  // MF_HEIGHTBLEND NODE
  // =========================================================================
  describe("MF_HeightBlend Node", () => {
    const node = FunctionNodes.MF_HeightBlend;

    it("should have two layer inputs", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Layer A");
      expect(pinNames).toContain("Layer B");
    });

    it("should have height inputs for both layers", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Layer A Height");
      expect(pinNames).toContain("Layer B Height");
    });

    it("should have blend sharpness control", () => {
      const sharpnessPin = node.pins.find((p) => p.localId === "sharpness");
      expect(sharpnessPin).toBeDefined();
      expect(sharpnessPin.defaultValue).toBe(0.2);
    });
  });

  // =========================================================================
  // MF_DETAILTEXTURE NODE
  // =========================================================================
  describe("MF_DetailTexture Node", () => {
    const node = FunctionNodes.MF_DetailTexture;

    it("should have texture2d input", () => {
      const texPin = node.pins.find((p) => p.type === "texture2d");
      expect(texPin).toBeDefined();
    });

    it("should have tiling and intensity controls", () => {
      const pinIds = node.pins.map((p) => p.localId);
      expect(pinIds).toContain("tiling");
      expect(pinIds).toContain("intensity");
    });
  });

  // =========================================================================
  // MF_WORLDALIGNEDBLEND NODE
  // =========================================================================
  describe("MF_WorldAlignedBlend Node", () => {
    const node = FunctionNodes.MF_WorldAlignedBlend;

    it("should have top and side material inputs", () => {
      const pinNames = node.pins.map((p) => p.name);
      expect(pinNames).toContain("Top Material");
      expect(pinNames).toContain("Side Material");
    });

    it("should have shader code referencing WorldNormal", () => {
      expect(node.shaderCode).toContain("WorldNormal");
    });
  });

  // =========================================================================
  // MF_DESATURATION NODE
  // =========================================================================
  describe("MF_Desaturation Node", () => {
    const node = FunctionNodes.MF_Desaturation;

    it("should have fraction control", () => {
      const fractionPin = node.pins.find((p) => p.localId === "fraction");
      expect(fractionPin).toBeDefined();
      expect(fractionPin.defaultValue).toBe(0.5);
    });

    it("should have luminance weights input", () => {
      const weightsPin = node.pins.find((p) => p.localId === "weights");
      expect(weightsPin).toBeDefined();
      // Standard luminance weights (Rec. 601)
      expect(weightsPin.defaultValue).toEqual([0.3, 0.59, 0.11]);
    });
  });

  // =========================================================================
  // MF_CHEAPCONTRAST NODE
  // =========================================================================
  describe("MF_CheapContrast Node", () => {
    const node = FunctionNodes.MF_CheapContrast;

    it("should have contrast control defaulting to 1", () => {
      const contrastPin = node.pins.find((p) => p.localId === "contrast");
      expect(contrastPin).toBeDefined();
      expect(contrastPin.defaultValue).toBe(1.0);
    });

    it("should have shader code with lerp from 0.5", () => {
      expect(node.shaderCode).toContain("lerp");
      expect(node.shaderCode).toContain("0.5");
    });
  });

  // =========================================================================
  // MF_TRIPLANARPROJECTION NODE
  // =========================================================================
  describe("MF_TriplanarProjection Node", () => {
    const node = FunctionNodes.MF_TriplanarProjection;

    it("should have three texture inputs (X, Y, Z)", () => {
      const texPins = node.pins.filter((p) => p.type === "texture2d");
      expect(texPins.length).toBe(3);
    });

    it("should have shader code calculating blend weights", () => {
      expect(node.shaderCode).toContain("blendWeights");
      expect(node.shaderCode).toContain("WorldPosition");
    });
  });

  // =========================================================================
  // MF_PARALLAXOCCLUSION NODE
  // =========================================================================
  describe("MF_ParallaxOcclusion Node", () => {
    const node = FunctionNodes.MF_ParallaxOcclusion;

    it("should have height map input", () => {
      const heightPin = node.pins.find((p) => p.localId === "heightMap");
      expect(heightPin).toBeDefined();
      expect(heightPin.type).toBe("texture2d");
    });

    it("should have min/max steps controls", () => {
      const minSteps = node.pins.find((p) => p.localId === "minSteps");
      const maxSteps = node.pins.find((p) => p.localId === "maxSteps");
      expect(minSteps.defaultValue).toBe(8);
      expect(maxSteps.defaultValue).toBe(32);
    });

    it("should output displaced UV", () => {
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("float2");
    });
  });

  // =========================================================================
  // SHADER CODE VALIDATION
  // =========================================================================
  describe("Shader Code Validation", () => {
    const nodeNames = Object.keys(FunctionNodes);

    it.each(nodeNames)("%s should have shader code", (nodeName) => {
      const node = FunctionNodes[nodeName];
      expect(node.shaderCode).toBeDefined();
      expect(node.shaderCode.length).toBeGreaterThan(10);
    });

    it.each(nodeNames)(
      "%s shader code should include node ID placeholder",
      (nodeName) => {
        const node = FunctionNodes[nodeName];
        expect(node.shaderCode).toContain("%id%");
      },
    );
  });
});
