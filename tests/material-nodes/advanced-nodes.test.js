/**
 * AdvancedNodes Tests
 *
 * Tests for advanced UE5 Material Editor nodes:
 * - Curve Atlas nodes
 * - Runtime Virtual Texture (RVT) nodes
 * - Nanite/Lumen support nodes
 * - Custom Expression nodes
 * - Utility nodes (Comment, Reroute)
 */

import { describe, it, expect } from "vitest";
import { AdvancedNodes } from "../../data/nodes/AdvancedNodes.js";

describe("AdvancedNodes", () => {
  // =========================================================================
  // NODE DEFINITIONS EXIST
  // =========================================================================
  describe("Node Definitions", () => {
    const expectedNodes = [
      // Curve Atlas
      "CurveAtlasRowParameter",
      "ScalarCurveParameter",
      "VectorCurveParameter",
      // RVT
      "RuntimeVirtualTextureSample",
      "RuntimeVirtualTextureOutput",
      // Nanite/Lumen
      "NaniteFallbackFactor",
      "IsNaniteProxy",
      "IsLumenCardCapture",
      "SkyAtmosphereLightDirection",
      "SkyAtmosphereLightDiskLuminance",
      // Custom Expressions
      "Custom",
      "DebugScalarValues",
      "DebugFloat2Values",
      "DebugFloat3Values",
      // Utility
      "Comment",
      "Reroute",
      "NamedRerouteDeclaration",
      "NamedRerouteUsage",
    ];

    it.each(expectedNodes)("should have %s node defined", (nodeName) => {
      expect(AdvancedNodes[nodeName]).toBeDefined();
    });

    it("should have 18 advanced nodes total", () => {
      expect(Object.keys(AdvancedNodes).length).toBe(18);
    });
  });

  // =========================================================================
  // CURVE ATLAS NODES
  // =========================================================================
  describe("Curve Atlas Nodes", () => {
    it("CurveAtlasRowParameter should have atlas input", () => {
      const node = AdvancedNodes.CurveAtlasRowParameter;
      const atlasPin = node.pins.find((p) => p.localId === "atlas");
      expect(atlasPin).toBeDefined();
      expect(atlasPin.type).toBe("texture2d");
    });

    it("ScalarCurveParameter should output float", () => {
      const node = AdvancedNodes.ScalarCurveParameter;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("float");
    });

    it("VectorCurveParameter should output float3", () => {
      const node = AdvancedNodes.VectorCurveParameter;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("float3");
    });
  });

  // =========================================================================
  // RUNTIME VIRTUAL TEXTURE NODES
  // =========================================================================
  describe("Runtime Virtual Texture Nodes", () => {
    it("RuntimeVirtualTextureSample should have multiple outputs", () => {
      const node = AdvancedNodes.RuntimeVirtualTextureSample;
      const outputs = node.pins.filter((p) => p.direction === "output");
      expect(outputs.length).toBeGreaterThanOrEqual(5);

      const outputNames = outputs.map((p) => p.name);
      expect(outputNames).toContain("Base Color");
      expect(outputNames).toContain("Roughness");
      expect(outputNames).toContain("Normal");
    });

    it("RuntimeVirtualTextureOutput should have material inputs", () => {
      const node = AdvancedNodes.RuntimeVirtualTextureOutput;
      const inputs = node.pins.filter((p) => p.direction === "input");

      const inputNames = inputs.map((p) => p.name);
      expect(inputNames).toContain("Base Color");
      expect(inputNames).toContain("Roughness");
      expect(inputNames).toContain("Normal");
      expect(inputNames).toContain("World Height");
    });
  });

  // =========================================================================
  // NANITE / LUMEN NODES
  // =========================================================================
  describe("Nanite / Lumen Nodes", () => {
    it("NaniteFallbackFactor should output float", () => {
      const node = AdvancedNodes.NaniteFallbackFactor;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("float");
    });

    it("IsNaniteProxy should output bool", () => {
      const node = AdvancedNodes.IsNaniteProxy;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("bool");
    });

    it("IsLumenCardCapture should output bool", () => {
      const node = AdvancedNodes.IsLumenCardCapture;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("bool");
    });

    it("SkyAtmosphereLightDirection should output float3", () => {
      const node = AdvancedNodes.SkyAtmosphereLightDirection;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("float3");
    });

    it("SkyAtmosphereLightDiskLuminance should have light index input", () => {
      const node = AdvancedNodes.SkyAtmosphereLightDiskLuminance;
      const indexPin = node.pins.find((p) => p.localId === "lightIndex");
      expect(indexPin).toBeDefined();
      expect(indexPin.type).toBe("int");
    });
  });

  // =========================================================================
  // CUSTOM EXPRESSION NODES
  // =========================================================================
  describe("Custom Expression Nodes", () => {
    it("Custom should have Code property", () => {
      const node = AdvancedNodes.Custom;
      expect(node.properties.Code).toBeDefined();
      expect(node.properties.OutputType).toBe("float4");
    });

    it("Custom should have multiple inputs", () => {
      const node = AdvancedNodes.Custom;
      const inputs = node.pins.filter((p) => p.direction === "input");
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it("DebugScalarValues should have min/max range inputs", () => {
      const node = AdvancedNodes.DebugScalarValues;
      const minPin = node.pins.find((p) => p.localId === "minRange");
      const maxPin = node.pins.find((p) => p.localId === "maxRange");
      expect(minPin.defaultValue).toBe(0);
      expect(maxPin.defaultValue).toBe(1);
    });

    it("DebugFloat2Values should output float3", () => {
      const node = AdvancedNodes.DebugFloat2Values;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("float3");
    });

    it("DebugFloat3Values should output float3", () => {
      const node = AdvancedNodes.DebugFloat3Values;
      const outPin = node.pins.find((p) => p.direction === "output");
      expect(outPin.type).toBe("float3");
    });
  });

  // =========================================================================
  // UTILITY NODES
  // =========================================================================
  describe("Utility Nodes", () => {
    it("Comment should have no pins", () => {
      const node = AdvancedNodes.Comment;
      expect(node.pins.length).toBe(0);
    });

    it("Comment should have text property", () => {
      const node = AdvancedNodes.Comment;
      expect(node.properties.CommentText).toBeDefined();
      expect(node.properties.CommentColor).toBeDefined();
    });

    it("Reroute should have wildcard type pins", () => {
      const node = AdvancedNodes.Reroute;
      const inputPin = node.pins.find((p) => p.direction === "input");
      const outputPin = node.pins.find((p) => p.direction === "output");
      expect(inputPin.type).toBe("wildcard");
      expect(outputPin.type).toBe("wildcard");
    });

    it("NamedRerouteDeclaration should have Name property", () => {
      const node = AdvancedNodes.NamedRerouteDeclaration;
      expect(node.properties.Name).toBe("MyValue");
    });

    it("NamedRerouteUsage should have Name property", () => {
      const node = AdvancedNodes.NamedRerouteUsage;
      expect(node.properties.Name).toBe("MyValue");
    });
  });

  // =========================================================================
  // SHADER CODE VALIDATION
  // =========================================================================
  describe("Shader Code Validation", () => {
    const nodeNames = Object.keys(AdvancedNodes);

    it.each(nodeNames)("%s should have shader code", (nodeName) => {
      const node = AdvancedNodes[nodeName];
      expect(node.shaderCode).toBeDefined();
      expect(node.shaderCode.length).toBeGreaterThan(5);
    });

    it.each(nodeNames)("%s should have valid category", (nodeName) => {
      const node = AdvancedNodes[nodeName];
      expect(node.category).toBeDefined();
      expect(node.category.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // NODE CATEGORIES
  // =========================================================================
  describe("Node Categories", () => {
    it("should have Parameter category nodes", () => {
      const paramNodes = Object.values(AdvancedNodes).filter(
        (n) => n.category === "Parameters",
      );
      expect(paramNodes.length).toBeGreaterThanOrEqual(3);
    });

    it("should have Texture category nodes", () => {
      const texNodes = Object.values(AdvancedNodes).filter(
        (n) => n.category === "Textures",
      );
      expect(texNodes.length).toBeGreaterThanOrEqual(2);
    });

    it("should have Utility category nodes", () => {
      const utilNodes = Object.values(AdvancedNodes).filter(
        (n) => n.category === "Utility",
      );
      expect(utilNodes.length).toBeGreaterThanOrEqual(4);
    });

    it("should have Debug category nodes", () => {
      const debugNodes = Object.values(AdvancedNodes).filter(
        (n) => n.category === "Debug",
      );
      expect(debugNodes.length).toBeGreaterThanOrEqual(3);
    });
  });
});
