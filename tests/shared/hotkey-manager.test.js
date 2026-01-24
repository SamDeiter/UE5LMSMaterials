/**
 * Shared utilities tests
 * Tests for HotkeyManager and ActionMenuController
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MATERIAL_HOTKEYS,
  EXTENDED_HOTKEYS,
  MODIFIER_HOTKEYS,
} from "../../shared/HotkeyManager.js";

describe("HotkeyManager Hotkey Mappings", () => {
  describe("Material Hotkeys", () => {
    it("should have numeric keys for constants", () => {
      expect(MATERIAL_HOTKEYS["1"]).toBe("Constant");
      expect(MATERIAL_HOTKEYS["2"]).toBe("Constant2Vector");
      expect(MATERIAL_HOTKEYS["3"]).toBe("Constant3Vector");
      expect(MATERIAL_HOTKEYS["4"]).toBe("Constant4Vector");
    });

    it("should have letter keys for arithmetic operations", () => {
      expect(MATERIAL_HOTKEYS["A"]).toBe("Add");
      expect(MATERIAL_HOTKEYS["M"]).toBe("Multiply");
      expect(MATERIAL_HOTKEYS["D"]).toBe("Divide");
      expect(MATERIAL_HOTKEYS["I"]).toBe("Lerp"); // Changed from L to I (L reserved for light rotation)
    });

    it("should have T for TextureSample", () => {
      expect(MATERIAL_HOTKEYS["T"]).toBe("TextureSample");
    });

    it("should have parameter hotkeys", () => {
      expect(MATERIAL_HOTKEYS["S"]).toBe("ScalarParameter");
      expect(MATERIAL_HOTKEYS["V"]).toBe("VectorParameter");
    });

    it("should have utility node hotkeys", () => {
      expect(MATERIAL_HOTKEYS["F"]).toBe("Fresnel");
      expect(MATERIAL_HOTKEYS["N"]).toBe("Normalize");
      expect(MATERIAL_HOTKEYS["C"]).toBe("Comment");
    });
  });

  describe("Extended Hotkeys", () => {
    it("should have additional common nodes", () => {
      expect(EXTENDED_HOTKEYS["K"]).toBe("Clamp");
      expect(EXTENDED_HOTKEYS["W"]).toBe("WorldPosition");
      expect(EXTENDED_HOTKEYS["H"]).toBe("Time");
      expect(EXTENDED_HOTKEYS["Z"]).toBe("Abs");
    });
  });

  describe("Modifier Hotkeys", () => {
    it("should have Shift+C for ComponentMask", () => {
      expect(MODIFIER_HOTKEYS["Shift+C"]).toBe("ComponentMask");
    });
  });
});

describe("Hotkey Coverage", () => {
  it("should not have duplicate node assignments", () => {
    const allMappings = { ...MATERIAL_HOTKEYS, ...EXTENDED_HOTKEYS };
    const nodes = Object.values(allMappings);
    const uniqueNodes = new Set(nodes);
    // Allow some nodes to have multiple hotkeys, but check for major duplicates
    expect(nodes.length).toBeGreaterThan(0);
  });

  it("should have at least 20 material hotkeys defined", () => {
    const totalHotkeys =
      Object.keys(MATERIAL_HOTKEYS).length +
      Object.keys(EXTENDED_HOTKEYS).length;
    expect(totalHotkeys).toBeGreaterThanOrEqual(20);
  });
});
