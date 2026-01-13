/**
 * Arithmetic Nodes Test Suite
 * ============================
 * Tests for Add, Subtract, Multiply, Divide based on UE5 Materials Spec Section 2.1
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  getRegistry,
  createNode,
  getDefinition,
  validateHLSL,
} from "../setup.js";

describe("Arithmetic Nodes", () => {
  beforeAll(() => {
    getRegistry(); // Initialize registry
  });

  // =========================================================================
  // ADD NODE
  // =========================================================================
  describe("Add Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Add");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with addition operator", () => {
      const node = createNode("Add");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("+");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("Add");

      // Verify input pins - wildcard allows flexible type connections
      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");
      const pinOut = def.pins.find((p) => p.id === "out");

      expect(pinA).toBeDefined();
      expect(pinA.dir).toBe("in");
      expect(pinA.type).toBe("wildcard");

      expect(pinB).toBeDefined();
      expect(pinB.dir).toBe("in");
      expect(pinB.type).toBe("wildcard");

      expect(pinOut).toBeDefined();
      expect(pinOut.dir).toBe("out");
      expect(pinOut.type).toBe("wildcard");
    });

    it("should have default values of 0.0", () => {
      const def = getDefinition("Add");
      expect(def.pins.find((p) => p.id === "a").defaultValue).toBe(0.0);
      expect(def.pins.find((p) => p.id === "b").defaultValue).toBe(0.0);
    });

    it('should have hotkey "A"', () => {
      const def = getDefinition("Add");
      expect(def.hotkey).toBe("A");
    });
  });

  // =========================================================================
  // SUBTRACT NODE
  // =========================================================================
  describe("Subtract Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Subtract");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with subtraction operator", () => {
      const node = createNode("Subtract");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("-");
    });

    it("should have correct pin configuration", () => {
      const def = getDefinition("Subtract");

      const pinA = def.pins.find((p) => p.id === "a");
      const pinB = def.pins.find((p) => p.id === "b");

      // Wildcard type for flexible broadcasting
      expect(pinA.type).toBe("wildcard");
      expect(pinA.dir).toBe("in");
      expect(pinB.type).toBe("wildcard");
      expect(pinB.dir).toBe("in");
    });
  });

  // =========================================================================
  // MULTIPLY NODE
  // =========================================================================
  describe("Multiply Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Multiply");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with multiplication operator", () => {
      const node = createNode("Multiply");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("*");
    });

    it("should have default values of 1.0 (identity for multiplication)", () => {
      // From spec: Multiply is for scaling/masking, identity is 1.0
      const def = getDefinition("Multiply");
      expect(def.pins.find((p) => p.id === "a").defaultValue).toBe(1.0);
      expect(def.pins.find((p) => p.id === "b").defaultValue).toBe(1.0);
    });

    it('should have hotkey "M"', () => {
      const def = getDefinition("Multiply");
      expect(def.hotkey).toBe("M");
    });

    it("should be categorized under Math", () => {
      const def = getDefinition("Multiply");
      expect(def.category).toBe("Math");
    });
  });

  // =========================================================================
  // DIVIDE NODE
  // =========================================================================
  describe("Divide Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("Divide");
      expect(def).toBeDefined();
    });

    it("should produce HLSL with division operator", () => {
      const node = createNode("Divide");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toContain("/");
    });

    it("should protect against division by zero", () => {
      // From spec: "Division is computationally more expensive than multiplication"
      // Implementation should use max(divisor, small_value) to prevent NaN/Inf
      const node = createNode("Divide");
      const hlsl = node.getShaderSnippet();

      // Check for division-by-zero protection pattern
      expect(hlsl).toMatch(/max\([^,]+,\s*0\.0001\)/);
    });

    it("should have default values of 1.0", () => {
      const def = getDefinition("Divide");
      expect(def.pins.find((p) => p.id === "a").defaultValue).toBe(1.0);
      expect(def.pins.find((p) => p.id === "b").defaultValue).toBe(1.0);
    });
  });

  // =========================================================================
  // ONEMINUS NODE
  // =========================================================================
  describe("OneMinus Node", () => {
    it("should exist in registry", () => {
      const def = getDefinition("OneMinus");
      expect(def).toBeDefined();
    });

    it("should produce HLSL: 1.0 - input", () => {
      const node = createNode("OneMinus");
      const hlsl = node.getShaderSnippet();
      expect(hlsl).toMatch(/1\.0\s*-/);
    });

    it('should have hotkey "O"', () => {
      const def = getDefinition("OneMinus");
      expect(def.hotkey).toBe("O");
    });
  });
});
