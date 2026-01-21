/**
 * Type Promotion Test Suite
 * ==========================
 * Tests for scalar broadcasting to vectors (float → float2/3/4 promotion)
 */

import { describe, it, expect, beforeAll } from "vitest";
import { TypeCompatibility, PinTypes } from "../../material/core/MaterialNodeFramework.js";
import { getRegistry, getDefinition, createNode } from "../setup.js";

describe("Type Promotion (Scalar Broadcasting)", () => {
  beforeAll(() => {
    getRegistry();
  });

  // =========================================================================
  // SCALAR TO VECTOR PROMOTION
  // =========================================================================
  describe("Scalar to Vector Broadcasting", () => {
    it("float should be promotable to float2", () => {
      // When you connect a float to a float2 input,
      // HLSL broadcasts: float x -> float2(x, x)
      expect(TypeCompatibility.float2).toContain("float");
    });

    it("float should be promotable to float3", () => {
      // float x -> float3(x, x, x)
      expect(TypeCompatibility.float3).toContain("float");
    });

    it("float should be promotable to float4", () => {
      // float x -> float4(x, x, x, x)
      expect(TypeCompatibility.float4).toContain("float");
    });

    it("float2 can promote to float3 (impl allows padding)", () => {
      // The implementation allows float2 to connect to float3 inputs
      expect(TypeCompatibility.float3).toContain("float2");
    });

    it("float2 can promote to float4 (impl allows padding)", () => {
      expect(TypeCompatibility.float4).toContain("float2");
    });

    it("float3 can promote to float4 (impl allows padding)", () => {
      expect(TypeCompatibility.float4).toContain("float3");
    });
  });

  // =========================================================================
  // INVERSE PROMOTION (Wider to Narrower)
  // =========================================================================
  describe("Inverse Promotion (Not Allowed)", () => {
    it("float2 should NOT demote to float", () => {
      // Cannot implicitly reduce dimensions
      expect(TypeCompatibility.float).not.toContain("float2");
    });

    it("float3 should NOT demote to float", () => {
      expect(TypeCompatibility.float).not.toContain("float3");
    });

    it("float4 should NOT demote to float", () => {
      expect(TypeCompatibility.float).not.toContain("float4");
    });

    it("float3 should NOT demote to float2", () => {
      expect(TypeCompatibility.float2).not.toContain("float3");
    });
  });

  // =========================================================================
  // WILDCARD TYPE BEHAVIOR
  // =========================================================================
  describe("Wildcard Type Behavior", () => {
    it("wildcard should accept float", () => {
      expect(TypeCompatibility.wildcard).toContain("float");
    });

    it("wildcard should accept float2", () => {
      expect(TypeCompatibility.wildcard).toContain("float2");
    });

    it("wildcard should accept float3", () => {
      expect(TypeCompatibility.wildcard).toContain("float3");
    });

    it("wildcard should accept float4", () => {
      expect(TypeCompatibility.wildcard).toContain("float4");
    });

    it("Add node should use wildcard pins for flexible connections", () => {
      const def = getDefinition("Add");
      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");
      const pinOut = def.pins.find((p) => p.id === "out");

      expect(pinA.type).toBe("wildcard");
      expect(pinB.type).toBe("wildcard");
      expect(pinOut.type).toBe("wildcard");
    });

    it("Multiply node should use wildcard pins", () => {
      const def = getDefinition("Multiply");
      const pinA = def.pins.find((p) => p.id === "a");
      expect(pinA.type).toBe("wildcard");
    });

    it("Lerp node should have wildcard A/B pins but float alpha", () => {
      const def = getDefinition("Lerp");
      const pinA = def.pins.find((p) => p.id === "a");
      const pinAlpha = def.pins.find((p) => p.id === "alpha");

      expect(pinA.type).toBe("wildcard");
      expect(pinAlpha.type).toBe("float");
    });
  });

  // =========================================================================
  // COMPONENT COUNTS
  // =========================================================================
  describe("Component Counts", () => {
    it("float has 1 component", () => {
      expect(PinTypes.FLOAT.components).toBe(1);
    });

    it("float2 has 2 components", () => {
      expect(PinTypes.FLOAT2.components).toBe(2);
    });

    it("float3 has 3 components", () => {
      expect(PinTypes.FLOAT3.components).toBe(3);
    });

    it("float4 has 4 components", () => {
      expect(PinTypes.FLOAT4.components).toBe(4);
    });
  });
});
