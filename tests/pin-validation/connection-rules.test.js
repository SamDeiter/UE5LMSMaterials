/**
 * Connection Rules Test Suite
 * ============================
 * Tests for what pins can connect to what
 */

import { describe, it, expect, beforeAll } from "vitest";
import { TypeCompatibility } from "../../MaterialNodeFramework.js";
import { getRegistry, getDefinition } from "../setup.js";

describe("Connection Rules", () => {
  beforeAll(() => {
    getRegistry();
  });

  // =========================================================================
  // SAME-TYPE CONNECTIONS (Always Allowed)
  // =========================================================================
  describe("Same-Type Connections", () => {
    it("float to float should connect", () => {
      expect(TypeCompatibility.float).toContain("float");
    });

    it("float2 to float2 should connect", () => {
      expect(TypeCompatibility.float2).toContain("float2");
    });

    it("float3 to float3 should connect", () => {
      expect(TypeCompatibility.float3).toContain("float3");
    });

    it("float4 to float4 should connect", () => {
      expect(TypeCompatibility.float4).toContain("float4");
    });

    it("texture to texture should connect", () => {
      expect(TypeCompatibility.texture).toContain("texture");
    });

    it("bool to bool should connect", () => {
      expect(TypeCompatibility.bool).toContain("bool");
    });
  });

  // =========================================================================
  // CROSS-CATEGORY RESTRICTIONS
  // =========================================================================
  describe("Cross-Category Restrictions", () => {
    it("texture cannot connect to any float type", () => {
      expect(TypeCompatibility.float).not.toContain("texture");
      expect(TypeCompatibility.float2).not.toContain("texture");
      expect(TypeCompatibility.float3).not.toContain("texture");
      expect(TypeCompatibility.float4).not.toContain("texture");
    });

    it("bool cannot connect to any float type", () => {
      expect(TypeCompatibility.float).not.toContain("bool");
      expect(TypeCompatibility.float2).not.toContain("bool");
      expect(TypeCompatibility.float3).not.toContain("bool");
      expect(TypeCompatibility.float4).not.toContain("bool");
    });

    it("float cannot connect to texture", () => {
      expect(TypeCompatibility.texture).not.toContain("float");
      expect(TypeCompatibility.texture).not.toContain("float2");
      expect(TypeCompatibility.texture).not.toContain("float3");
      expect(TypeCompatibility.texture).not.toContain("float4");
    });

    it("float cannot connect to bool", () => {
      expect(TypeCompatibility.bool).not.toContain("float");
    });
  });

  // =========================================================================
  // TEXTURE SAMPLE OUTPUT CONNECTIONS
  // =========================================================================
  describe("Texture Sample Output Connections", () => {
    it("TextureSample RGB output should be float3", () => {
      const def = getDefinition("TextureSample");
      const rgbPin = def.pins.find((p) => p.id === "rgb");
      expect(rgbPin.type).toBe("float3");
    });

    it("TextureSample R/G/B/A outputs should be float", () => {
      const def = getDefinition("TextureSample");
      const rPin = def.pins.find((p) => p.id === "r");
      const gPin = def.pins.find((p) => p.id === "g");
      const bPin = def.pins.find((p) => p.id === "b");
      const aPin = def.pins.find((p) => p.id === "a");

      expect(rPin.type).toBe("float");
      expect(gPin.type).toBe("float");
      expect(bPin.type).toBe("float");
      expect(aPin.type).toBe("float");
    });

    it("TextureSample tex input should be texture", () => {
      const def = getDefinition("TextureSample");
      const texPin = def.pins.find((p) => p.id === "tex");
      expect(texPin.type).toBe("texture");
    });
  });

  // =========================================================================
  // MAIN MATERIAL NODE INPUT REQUIREMENTS
  // =========================================================================
  describe("Main Material Node Inputs", () => {
    it("BaseColor input should accept float3", () => {
      const def = getDefinition("MainMaterialNode");
      const baseColorPin = def.pins.find((p) => p.id === "base_color");
      expect(baseColorPin.type).toBe("float3");
    });

    it("Metallic input should accept float", () => {
      const def = getDefinition("MainMaterialNode");
      const metallicPin = def.pins.find((p) => p.id === "metallic");
      expect(metallicPin.type).toBe("float");
    });

    it("Roughness input should accept float", () => {
      const def = getDefinition("MainMaterialNode");
      const roughnessPin = def.pins.find((p) => p.id === "roughness");
      expect(roughnessPin.type).toBe("float");
    });

    it("Normal input should accept float3", () => {
      const def = getDefinition("MainMaterialNode");
      const normalPin = def.pins.find((p) => p.id === "normal");
      expect(normalPin.type).toBe("float3");
    });

    it("Emissive input should accept float3", () => {
      const def = getDefinition("MainMaterialNode");
      const emissivePin = def.pins.find((p) => p.id === "emissive");
      expect(emissivePin.type).toBe("float3");
    });
  });

  // =========================================================================
  // VECTOR OPERATION INPUT REQUIREMENTS
  // =========================================================================
  describe("Vector Operation Inputs", () => {
    it("DotProduct requires float3 inputs", () => {
      const def = getDefinition("DotProduct");
      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");

      expect(pinA.type).toBe("float3");
      expect(pinB.type).toBe("float3");
    });

    it("DotProduct outputs float", () => {
      const def = getDefinition("DotProduct");
      const outPin = def.pins.find((p) => p.id === "out");
      expect(outPin.type).toBe("float");
    });

    it("CrossProduct requires float3 inputs and outputs float3", () => {
      const def = getDefinition("CrossProduct");
      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");
      const outPin = def.pins.find((p) => p.id === "out");

      expect(pinA.type).toBe("float3");
      expect(pinB.type).toBe("float3");
      expect(outPin.type).toBe("float3");
    });

    it("Normalize requires float3 input and outputs float3", () => {
      const def = getDefinition("Normalize");
      const inPin = def.pins.find((p) => p.id === "in");
      const outPin = def.pins.find((p) => p.id === "out");

      expect(inPin.type).toBe("float3");
      expect(outPin.type).toBe("float3");
    });
  });

  // =========================================================================
  // COORDINATE NODE OUTPUT TYPES
  // =========================================================================
  describe("Coordinate Node Outputs", () => {
    it("TextureCoordinate outputs float2", () => {
      const def = getDefinition("TextureCoordinate");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float2");
    });

    it("WorldPosition outputs float3", () => {
      const def = getDefinition("WorldPosition");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float3");
    });

    it("Panner outputs float2", () => {
      const def = getDefinition("Panner");
      const outPin = def.pins.find((p) => p.id === "out");
      expect(outPin.type).toBe("float2");
    });
  });
});
