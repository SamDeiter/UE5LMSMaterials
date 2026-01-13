/**
 * Pin Type Compatibility Test Suite
 * ===================================
 * Tests for pin connection rules based on UE5 Materials Spec Section 4
 */

import { describe, it, expect, beforeAll } from "vitest";
import { TypeCompatibility, PinTypes } from "../../MaterialNodeFramework.js";
import { getRegistry } from "../setup.js";

// Alias for cleaner test code
const DataTypes = PinTypes;

describe("Pin Type Compatibility", () => {
  beforeAll(() => {
    getRegistry();
  });

  // =========================================================================
  // FLOAT TYPE HIERARCHY (Scalar Broadcasting)
  // =========================================================================
  describe("Float Type Hierarchy", () => {
    it("float can connect to float", () => {
      expect(TypeCompatibility.float).toContain("float");
    });

    it("float promotes to float2 (scalar broadcasting)", () => {
      // From spec: "When inputs of differing dimensions are added,
      // the compiler promotes the scalar to a vector (swizzling)"
      expect(TypeCompatibility.float2).toContain("float");
    });

    it("float promotes to float3 (scalar broadcasting)", () => {
      expect(TypeCompatibility.float3).toContain("float");
    });

    it("float promotes to float4 (scalar broadcasting)", () => {
      expect(TypeCompatibility.float4).toContain("float");
    });

    it("float2 can connect to float2", () => {
      expect(TypeCompatibility.float2).toContain("float2");
    });

    it("float3 can connect to float3", () => {
      expect(TypeCompatibility.float3).toContain("float3");
    });

    it("float4 can connect to float4", () => {
      expect(TypeCompatibility.float4).toContain("float4");
    });
  });

  // =========================================================================
  // TEXTURE TYPE ISOLATION
  // =========================================================================
  describe("Texture Type Isolation", () => {
    it("texture can connect to texture and texture2d", () => {
      // texture and texture2d are both 2D textures and can connect
      expect(TypeCompatibility.texture).toEqual(["texture", "texture2d"]);
    });

    it("texture cannot connect to float3 (color) directly", () => {
      // Textures must be sampled first to get color data
      expect(TypeCompatibility.float3).not.toContain("texture");
    });

    it("texture cannot connect to float", () => {
      expect(TypeCompatibility.float).not.toContain("texture");
    });
  });

  // =========================================================================
  // BOOL TYPE ISOLATION
  // =========================================================================
  describe("Bool Type Isolation", () => {
    it("bool can only connect to bool", () => {
      expect(TypeCompatibility.bool).toEqual(["bool"]);
    });

    it("bool cannot connect to float", () => {
      expect(TypeCompatibility.float).not.toContain("bool");
    });
  });

  // =========================================================================
  // DATA TYPE DEFINITIONS
  // =========================================================================
  describe("Data Type Definitions", () => {
    it("FLOAT type should be defined", () => {
      expect(DataTypes.FLOAT).toBeDefined();
      expect(DataTypes.FLOAT.name).toBe("float");
    });

    it("FLOAT2 type should be defined with 2 components", () => {
      expect(DataTypes.FLOAT2).toBeDefined();
      expect(DataTypes.FLOAT2.components).toBe(2);
    });

    it("FLOAT3 type should be defined with 3 components", () => {
      expect(DataTypes.FLOAT3).toBeDefined();
      expect(DataTypes.FLOAT3.components).toBe(3);
    });

    it("FLOAT4 type should be defined with 4 components", () => {
      expect(DataTypes.FLOAT4).toBeDefined();
      expect(DataTypes.FLOAT4.components).toBe(4);
    });

    it("TEXTURE type should have 0 components (reference type)", () => {
      expect(DataTypes.TEXTURE).toBeDefined();
      expect(DataTypes.TEXTURE.components).toBe(0);
    });

    it("BOOL type should have 1 component", () => {
      expect(DataTypes.BOOL).toBeDefined();
      expect(DataTypes.BOOL.components).toBe(1);
    });
  });

  // =========================================================================
  // DATA TYPE COLORS (Visual Identification)
  // =========================================================================
  describe("Data Type Colors", () => {
    // From Spec: Pin Type Color System table
    // Grey: float, Green: float2, Yellow: float3, Pink: float4, Blue: texture, Red: bool

    it("float should have a color defined", () => {
      expect(DataTypes.FLOAT.color).toBeDefined();
      expect(typeof DataTypes.FLOAT.color).toBe("string");
    });

    it("float2 should have a distinct color", () => {
      expect(DataTypes.FLOAT2.color).toBeDefined();
      expect(DataTypes.FLOAT2.color).not.toBe(DataTypes.FLOAT.color);
    });

    it("float3 should have a distinct color", () => {
      expect(DataTypes.FLOAT3.color).toBeDefined();
      expect(DataTypes.FLOAT3.color).not.toBe(DataTypes.FLOAT.color);
      expect(DataTypes.FLOAT3.color).not.toBe(DataTypes.FLOAT2.color);
    });

    it("texture should have blue color", () => {
      // UE5-accurate color from GraphEditorSettings.cpp:50
      expect(DataTypes.TEXTURE.color).toBe("#0066E8");
    });

    it("bool should have a color defined", () => {
      expect(DataTypes.BOOL.color).toBeDefined();
    });
  });
});
