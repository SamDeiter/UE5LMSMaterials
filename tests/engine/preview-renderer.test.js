/**
 * NodePreviewRenderer Tests
 *
 * Tests for the WebGL-based node preview rendering system.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  NodePreviewRenderer,
  initNodePreviewRenderer,
} from "../../material/engine/NodePreviewRenderer.js";

describe("NodePreviewRenderer", () => {
  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  describe("Initialization", () => {
    it("should create a new instance", () => {
      const mockSceneManager = { THREE: null };
      const renderer = new NodePreviewRenderer(mockSceneManager);
      expect(renderer).toBeDefined();
      expect(renderer.initialized).toBe(false);
    });

    it("should have correct preview size", () => {
      const mockSceneManager = { THREE: null };
      const renderer = new NodePreviewRenderer(mockSceneManager);
      expect(renderer.previewSize).toBe(64);
    });

    it("should start with empty preview cache", () => {
      const mockSceneManager = { THREE: null };
      const renderer = new NodePreviewRenderer(mockSceneManager);
      expect(renderer.previewCache.size).toBe(0);
    });

    it("should not initialize without THREE available", async () => {
      const mockSceneManager = { THREE: null };
      const renderer = new NodePreviewRenderer(mockSceneManager);
      const result = await renderer.init();
      expect(result).toBe(false);
      expect(renderer.initialized).toBe(false);
    });
  });

  // =========================================================================
  // VALUE TO COLOR CONVERSION
  // =========================================================================
  describe("Value to Color Conversion", () => {
    let renderer;

    beforeEach(() => {
      const mockSceneManager = { THREE: null };
      renderer = new NodePreviewRenderer(mockSceneManager);
    });

    it("should convert null to gray", () => {
      const color = renderer.valueToColor(null);
      expect(color).toBe(0x808080);
    });

    it("should convert undefined to gray", () => {
      const color = renderer.valueToColor(undefined);
      expect(color).toBe(0x808080);
    });

    it("should convert array [1, 0, 0] to red", () => {
      const color = renderer.valueToColor([1, 0, 0]);
      expect(color).toBe(0xff0000);
    });

    it("should convert array [0, 1, 0] to green", () => {
      const color = renderer.valueToColor([0, 1, 0]);
      expect(color).toBe(0x00ff00);
    });

    it("should convert array [0, 0, 1] to blue", () => {
      const color = renderer.valueToColor([0, 0, 1]);
      expect(color).toBe(0x0000ff);
    });

    it("should convert object {R, G, B} format", () => {
      const color = renderer.valueToColor({ R: 1, G: 0.5, B: 0 });
      // Math.round(0.5 * 255) = 128 = 0x80
      expect(color).toBe(0xff8000);
    });

    it("should convert object {r, g, b} lowercase format", () => {
      const color = renderer.valueToColor({ r: 0, g: 0.5, b: 1 });
      expect(color).toBe(0x0080ff);
    });

    it("should convert single number to grayscale", () => {
      const color = renderer.valueToColor(0.5);
      expect(color).toBe(0x808080); // Mid gray (128, 128, 128)
    });

    it("should convert hex string", () => {
      const color = renderer.valueToColor("#ff00ff");
      expect(color).toBe(0xff00ff); // Magenta
    });
  });

  // =========================================================================
  // NORMAL TO COLOR CONVERSION
  // =========================================================================
  describe("Normal to Color Conversion", () => {
    let renderer;

    beforeEach(() => {
      const mockSceneManager = { THREE: null };
      renderer = new NodePreviewRenderer(mockSceneManager);
    });

    it("should convert flat normal [0, 0, 1] to blue-ish", () => {
      const color = renderer.normalToColor([0, 0, 1]);
      // Normal (0, 0, 1) maps to RGB (128, 128, 255) in normal map space
      expect(color).toBe(0x8080ff);
    });

    it("should convert X-facing normal [1, 0, 0]", () => {
      const color = renderer.normalToColor([1, 0, 0]);
      // Normal (1, 0, 0) with z defaulting to 1 maps to RGB (255, 128, 255)
      expect(color).toBe(0xff80ff);
    });

    it("should convert Y-facing normal [0, 1, 0]", () => {
      const color = renderer.normalToColor([0, 1, 0]);
      // Normal (0, 1, 0) with z defaulting to 1 maps to RGB (128, 255, 255)
      expect(color).toBe(0x80ffff);
    });

    it("should handle object format {x, y, z}", () => {
      const color = renderer.normalToColor({ x: 0, y: 0, z: 1 });
      expect(color).toBe(0x8080ff);
    });
  });

  // =========================================================================
  // CACHE MANAGEMENT
  // =========================================================================
  describe("Cache Management", () => {
    let renderer;

    beforeEach(() => {
      const mockSceneManager = { THREE: null };
      renderer = new NodePreviewRenderer(mockSceneManager);
      // Manually populate cache for testing
      renderer.previewCache.set("node1-value1-sphere", "dataUrl1");
      renderer.previewCache.set("node1-value2-color", "dataUrl2");
      renderer.previewCache.set("node2-value1-mask", "dataUrl3");
    });

    it("should invalidate cache for specific node", () => {
      renderer.invalidateNode("node1");
      expect(renderer.previewCache.has("node1-value1-sphere")).toBe(false);
      expect(renderer.previewCache.has("node1-value2-color")).toBe(false);
      expect(renderer.previewCache.has("node2-value1-mask")).toBe(true);
    });

    it("should clear all cache", () => {
      renderer.clearCache();
      expect(renderer.previewCache.size).toBe(0);
    });
  });

  // =========================================================================
  // SINGLETON INITIALIZATION
  // =========================================================================
  describe("Singleton Initialization", () => {
    it("initNodePreviewRenderer should return a renderer instance", () => {
      const mockSceneManager = { THREE: null };
      const renderer = initNodePreviewRenderer(mockSceneManager);
      expect(renderer).toBeDefined();
      expect(renderer instanceof NodePreviewRenderer).toBe(true);
    });
  });
});
