/**
 * tests/core/graph-renderer.test.js
 * 
 * Tests for GraphRenderer - handles canvas rendering and viewport culling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphRenderer } from "../../material/core/GraphRenderer.js";

// Mock controller
function createMockController() {
  const canvas = {
    width: 800,
    height: 600,
    getContext: vi.fn().mockReturnValue({
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn()
    })
  };
  
  return {
    canvas,
    ctx: canvas.getContext('2d'),
    graphPanel: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    },
    svg: {
      setAttribute: vi.fn()
    },
    panX: 0,
    panY: 0,
    zoom: 1,
    nodes: new Map(),
    links: new Map(),
    wiring: {
      updateAllWires: vi.fn()
    }
  };
}

describe("GraphRenderer", () => {
  let renderer;
  let mockController;

  beforeEach(() => {
    mockController = createMockController();
    renderer = new GraphRenderer(mockController);
  });

  describe("Viewport Bounds", () => {
    it("should calculate viewport bounds at default zoom", () => {
      mockController.panX = 0;
      mockController.panY = 0;
      mockController.zoom = 1;

      const bounds = renderer.getViewportBounds();

      // With 0 pan and zoom 1, bounds should match viewport
      // Includes padding (GRAPH.VIEWPORT_CULLING_PADDING = 200)
      expect(bounds.left).toBeLessThan(0); // Negative due to padding
      expect(bounds.top).toBeLessThan(0);
      expect(bounds.right).toBeGreaterThan(800);
      expect(bounds.bottom).toBeGreaterThan(600);
    });

    it("should account for pan offset in bounds", () => {
      mockController.panX = -500; // Panned far left
      mockController.panY = -400; // Panned far up
      mockController.zoom = 1;

      const bounds = renderer.getViewportBounds();

      // With negative pan, viewport shows content further right/down
      // Padding is 200, so bounds.left = (-(-500) - 200) / 1 = 300
      expect(bounds.left).toBeGreaterThan(200);
      expect(bounds.top).toBeGreaterThan(100);
    });

    it("should account for zoom level in bounds", () => {
      mockController.panX = 0;
      mockController.panY = 0;
      mockController.zoom = 0.5; // Zoomed out

      const bounds = renderer.getViewportBounds();

      // At 0.5 zoom, viewport covers twice the graph-space area
      expect(bounds.right).toBeGreaterThan(1600);
      expect(bounds.bottom).toBeGreaterThan(1200);
    });
  });

  describe("Lazy Rendering", () => {
    it("should mark visible nodes as not culled", () => {
      const visibleNode = {
        id: "visible-node",
        x: 100,
        y: 100,
        element: {
          offsetWidth: 200,
          offsetHeight: 150,
          classList: {
            toggle: vi.fn()
          }
        }
      };

      mockController.nodes.set("visible-node", visibleNode);

      renderer.updateLazyRendering();

      expect(visibleNode.element.classList.toggle).toHaveBeenCalledWith("culled", false);
    });

    it("should mark offscreen nodes as culled", () => {
      const offscreenNode = {
        id: "offscreen-node",
        x: 5000, // Far off to the right
        y: 5000,
        element: {
          offsetWidth: 200,
          offsetHeight: 150,
          classList: {
            toggle: vi.fn()
          }
        }
      };

      mockController.nodes.set("offscreen-node", offscreenNode);

      renderer.updateLazyRendering();

      expect(offscreenNode.element.classList.toggle).toHaveBeenCalledWith("culled", true);
    });

    it("should skip nodes without elements", () => {
      const elementlessNode = {
        id: "no-element",
        x: 100,
        y: 100,
        element: null
      };

      mockController.nodes.set("no-element", elementlessNode);

      // Should not throw
      expect(() => renderer.updateLazyRendering()).not.toThrow();
    });

    it("should cull wires when both endpoints are offscreen", () => {
      const offscreenNode1 = {
        id: "node-1",
        x: 5000,
        y: 5000,
        element: { classList: { toggle: vi.fn(), contains: vi.fn().mockReturnValue(true) } }
      };

      const offscreenNode2 = {
        id: "node-2",
        x: 6000,
        y: 6000,
        element: { classList: { toggle: vi.fn(), contains: vi.fn().mockReturnValue(true) } }
      };

      mockController.nodes.set("node-1", offscreenNode1);
      mockController.nodes.set("node-2", offscreenNode2);

      const link = {
        id: "link-1",
        sourcePin: { node: offscreenNode1 },
        targetPin: { node: offscreenNode2 }
      };

      mockController.links.set("link-1", link);

      // Mock wire element
      global.document = {
        getElementById: vi.fn().mockReturnValue({
          classList: { toggle: vi.fn() }
        })
      };

      renderer.updateLazyRendering();

      const wireEl = document.getElementById("wire-link-1");
      expect(wireEl.classList.toggle).toHaveBeenCalledWith("culled", true);
    });

    it("should NOT cull wires when one endpoint is visible", () => {
      const visibleNode = {
        id: "node-1",
        x: 100,
        y: 100,
        element: { 
          offsetWidth: 200,
          offsetHeight: 150,
          classList: { toggle: vi.fn(), contains: vi.fn().mockReturnValue(false) } 
        }
      };

      const offscreenNode = {
        id: "node-2",
        x: 6000,
        y: 6000,
        element: { 
          offsetWidth: 200,
          offsetHeight: 150,
          classList: { toggle: vi.fn(), contains: vi.fn().mockReturnValue(true) } 
        }
      };

      mockController.nodes.set("node-1", visibleNode);
      mockController.nodes.set("node-2", offscreenNode);

      const link = {
        id: "link-2",
        sourcePin: { node: visibleNode },
        targetPin: { node: offscreenNode }
      };

      mockController.links.set("link-2", link);

      global.document = {
        getElementById: vi.fn().mockReturnValue({
          classList: { toggle: vi.fn() }
        })
      };

      renderer.updateLazyRendering();

      const wireEl = document.getElementById("wire-link-2");
      // Wire should NOT be culled because one endpoint is visible
      expect(wireEl.classList.toggle).toHaveBeenCalledWith("culled", false);
    });
  });

  describe("Resize", () => {
    it("should update canvas dimensions on resize", () => {
      mockController.graphPanel.getBoundingClientRect = () => ({ 
        left: 0, top: 0, width: 1200, height: 800 
      });

      renderer.resize();

      expect(renderer.canvas.width).toBe(1200);
      expect(renderer.canvas.height).toBe(800);
    });

    it("should update SVG dimensions on resize", () => {
      mockController.graphPanel.getBoundingClientRect = () => ({ 
        left: 0, top: 0, width: 1200, height: 800 
      });

      renderer.resize();

      expect(renderer.svg.setAttribute).toHaveBeenCalledWith("width", 1200);
      expect(renderer.svg.setAttribute).toHaveBeenCalledWith("height", 800);
    });
  });
});
