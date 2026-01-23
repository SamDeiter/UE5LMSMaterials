/**
 * tests/core/input-controller.test.js
 * 
 * Tests for MaterialInputController - handles mouse/keyboard input for the graph.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialInputController } from "../../material/core/MaterialInputController.js";

// Mock graph controller
function createMockGraphController() {
  return {
    graphPanel: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    },
    app: {
      updateCounts: vi.fn()
    },
    nodes: new Map(),
    links: new Map(),
    selection: {
      selectedNodes: new Set()
    },
    isPanning: false,
    isDragging: false,
    isWiring: false,
    panX: 0,
    panY: 0,
    zoom: 1,
    dragStartX: 0,
    dragStartY: 0,
    drawGrid: vi.fn(),
    updateLazyRendering: vi.fn(),
    updateNodePosition: vi.fn(),
    deselectAll: vi.fn(),
    selectNode: vi.fn(),
    wiring: {
      updateAllWires: vi.fn(),
      updateGhostWire: vi.fn(),
      endWiring: vi.fn()
    },
    renderer: {
      updateLazyRendering: vi.fn()
    }
  };
}

describe("MaterialInputController", () => {
  let controller;
  let mockGraph;

  beforeEach(() => {
    // Mock DOM elements
    global.document = {
      getElementById: vi.fn().mockReturnValue(null),
      elementFromPoint: vi.fn().mockReturnValue(null)
    };
    
    mockGraph = createMockGraphController();
    controller = new MaterialInputController(mockGraph);
  });

  describe("Marquee Selection", () => {
    it("should initialize marquee state", () => {
      expect(controller.isMarquee).toBe(false);
      expect(controller.marqueeStart).toEqual({ x: 0, y: 0 });
    });

    it("should start marquee on left-click on graph area", () => {
      const mockEvent = {
        button: 0,
        clientX: 100,
        clientY: 100,
        target: { 
          id: 'graph-canvas',
          closest: vi.fn().mockReturnValue(null) // Not on a node
        },
        ctrlKey: false,
        metaKey: false
      };

      controller.onMouseDown(mockEvent);

      expect(controller.isMarquee).toBe(true);
      expect(mockGraph.deselectAll).toHaveBeenCalled();
    });

    it("should NOT start marquee on right-click", () => {
      const mockEvent = {
        button: 2, // Right click
        clientX: 100,
        clientY: 100,
        target: { 
          id: 'graph-canvas',
          closest: vi.fn().mockReturnValue(null)
        },
        preventDefault: vi.fn()
      };

      controller.onMouseDown(mockEvent);

      expect(controller.isMarquee).toBe(false);
    });

    it("should keep selection when Ctrl+clicking for marquee", () => {
      const mockEvent = {
        button: 0,
        clientX: 100,
        clientY: 100,
        target: { 
          id: 'graph-canvas',
          closest: vi.fn().mockReturnValue(null)
        },
        ctrlKey: true,
        metaKey: false
      };

      controller.onMouseDown(mockEvent);

      expect(controller.isMarquee).toBe(true);
      expect(mockGraph.deselectAll).not.toHaveBeenCalled();
    });

    it("should end marquee on mouse up", () => {
      controller.isMarquee = true;
      controller.marqueeEl = { style: { display: 'block' } };

      controller.onMouseUp({ button: 0 });

      expect(controller.isMarquee).toBe(false);
      expect(controller.marqueeEl.style.display).toBe('none');
    });
  });

  describe("Panning", () => {
    it("should start panning on middle mouse", () => {
      const mockEvent = {
        button: 1,
        clientX: 400,
        clientY: 300,
        target: {},
        preventDefault: vi.fn()
      };

      controller.onMouseDown(mockEvent);

      expect(mockGraph.isPanning).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it("should update pan position during handlePanning", () => {
      mockGraph.isPanning = true;
      mockGraph.dragStartX = 0;
      mockGraph.dragStartY = 0;

      const mockEvent = {
        clientX: 50,
        clientY: 30
      };

      controller.handlePanning(mockEvent);

      expect(mockGraph.panX).toBe(50);
      expect(mockGraph.panY).toBe(30);
      expect(mockGraph.drawGrid).toHaveBeenCalled();
      expect(mockGraph.wiring.updateAllWires).toHaveBeenCalled();
    });

    it("should throttle lazy rendering during pan", () => {
      mockGraph.isPanning = true;
      mockGraph.dragStartX = 0;
      mockGraph.dragStartY = 0;

      // First call should update
      controller.handlePanning({ clientX: 10, clientY: 10 });
      expect(mockGraph.updateLazyRendering).toHaveBeenCalledTimes(1);

      // Immediate second call should be throttled
      controller.handlePanning({ clientX: 20, clientY: 20 });
      expect(mockGraph.updateLazyRendering).toHaveBeenCalledTimes(1);
    });

    it("should force lazy update when panning ends", () => {
      mockGraph.isPanning = true;

      controller.onMouseUp({ button: 1 });

      expect(mockGraph.isPanning).toBe(false);
      expect(mockGraph.updateLazyRendering).toHaveBeenCalled();
    });
  });

  describe("Node Dragging", () => {
    it("should track drag start positions for selected nodes", () => {
      const mockNode = { id: "node-1", x: 100, y: 200 };
      mockGraph.nodes.set("node-1", mockNode);
      mockGraph.selection.selectedNodes = new Set(["node-1"]);

      const mockEvent = {
        button: 0,
        clientX: 100,
        clientY: 200,
        target: { 
          closest: vi.fn().mockReturnValue({ dataset: { nodeId: "node-1" } })
        },
        ctrlKey: false,
        metaKey: false
      };

      controller.onMouseDown(mockEvent);

      expect(controller.dragStartPositions).not.toBeNull();
      expect(controller.dragStartPositions.get("node-1")).toEqual({ x: 100, y: 200 });
    });
  });

  describe("Graph Area Detection", () => {
    it("should detect click on graph-canvas as graph area", () => {
      const mockEvent = {
        button: 0,
        clientX: 100,
        clientY: 100,
        target: { 
          id: 'graph-canvas',
          closest: vi.fn().mockReturnValue(null)
        },
        ctrlKey: false,
        metaKey: false
      };

      controller.onMouseDown(mockEvent);
      expect(controller.isMarquee).toBe(true);
    });

    it("should detect click on graph-svg as graph area", () => {
      const mockEvent = {
        button: 0,
        clientX: 100,
        clientY: 100,
        target: { 
          id: 'graph-svg',
          closest: vi.fn().mockReturnValue(null)
        },
        ctrlKey: false,
        metaKey: false
      };

      controller.onMouseDown(mockEvent);
      expect(controller.isMarquee).toBe(true);
    });

    it("should detect click on nodes-container as graph area", () => {
      const mockEvent = {
        button: 0,
        clientX: 100,
        clientY: 100,
        target: { 
          id: 'nodes-container',
          closest: vi.fn().mockReturnValue(null)
        },
        ctrlKey: false,
        metaKey: false
      };

      controller.onMouseDown(mockEvent);
      expect(controller.isMarquee).toBe(true);
    });

    it("should NOT start marquee when clicking on a node", () => {
      const mockEvent = {
        button: 0,
        clientX: 100,
        clientY: 100,
        target: { 
          id: 'nodes-container',
          closest: vi.fn().mockImplementation((sel) => {
            if (sel === '.node') return { dataset: { nodeId: 'node-1' } };
            return null;
          })
        },
        ctrlKey: false,
        metaKey: false
      };

      controller.onMouseDown(mockEvent);
      expect(controller.isMarquee).toBe(false);
    });
  });
});
