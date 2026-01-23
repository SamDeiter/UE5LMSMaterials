/**
 * Property Editors Test Suite
 * ===========================
 * Tests for PropertyEditors.js utility functions.
 */

import { describe, it, expect } from "vitest";
import * as PropertyEditors from "../../material/ui/PropertyEditors.js";

describe("PropertyEditors", () => {
  describe("renderBoolean", () => {
    it("should render a checked checkbox when value is true", () => {
      const html = PropertyEditors.renderBoolean("Test Bool", true);
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
      expect(html).toContain("Test Bool");
    });

    it("should render an unchecked checkbox when value is false", () => {
      const html = PropertyEditors.renderBoolean("Test Bool", false);
      expect(html).toContain('type="checkbox"');
      expect(html).not.toContain('checked');
    });
  });

  describe("renderNumber", () => {
    it("should render an input with the correct value and step", () => {
      const html = PropertyEditors.renderNumber("Test Num", 0.5, 0.1);
      expect(html).toContain('type="number"');
      expect(html).toContain('value="0.5"');
      expect(html).toContain('step="0.1"');
      expect(html).toContain("Test Num");
    });
  });

  describe("renderColor", () => {
    it("should render a color input and RGB value labels", () => {
      const html = PropertyEditors.renderColor("Test Color", 1, 0.5, 0);
      expect(html).toContain('type="color"');
      expect(html).toContain('value="#ff8000"'); // #FF8000 is [1, 0.5, 0]
      expect(html).toContain("Test Color");
    });
  });

  describe("renderDropdown", () => {
    it("should render a select with correct options and selected value", () => {
      const options = ["Option 1", "Option 2", "Option 3"];
      const html = PropertyEditors.renderDropdown("Test Dropdown", options, "Option 2");
      expect(html).toContain("<select");
      expect(html).toContain("<option");
      expect(html).toContain('value="Option 2" selected');
      expect(html).toContain("Option 1");
      expect(html).toContain("Option 3");
    });
  });

  describe("renderTexture", () => {
    it("should render a texture picker with the texture name", () => {
      const html = PropertyEditors.renderTexture("Test Texture", "T_Brick_D");
      expect(html).toContain("Test Texture");
      expect(html).toContain("T_Brick_D");
      expect(html).toContain("texture-picker");
    });
  });
});
