/**
 * tests/core/clipboard-controller.test.js
 * 
 * Tests for ClipboardController - handles copy, paste, and duplicate.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClipboardController } from "../../material/core/ClipboardController.js";

// Mock selection controller
function createMockSelection() {
  return {
    getSelectedNodes: vi.fn().mockReturnValue([]),
    deselectAll: vi.fn(),
    selectNode: vi.fn()
  };
}

// Mock graph controller
function createMockGraph() {
  return {
    selection: createMockSelection(),
    graphPanel: {
      getBoundingClientRect: () => ({ width: 800, height: 600 })
    },
    panX: 0,
    panY: 0,
    zoom: 1,
    addNode: vi.fn((key, x, y) => ({
      id: `node-${Date.now()}`,
      nodeKey: key,
      x,
      y,
      properties: {}
    }))
  };
}

describe("ClipboardController", () => {
  let controller;
  let mockApp;
  let mockGraph;

  beforeEach(() => {
    mockApp = {
      updateStatus: vi.fn()
    };
    mockGraph = createMockGraph();
    controller = new ClipboardController(mockApp, mockGraph);
  });

  describe("Initialization", () => {
    it("should start with empty clipboard", () => {
      expect(controller.clipboard).toEqual([]);
    });
  });

  describe("Copy", () => {
    it("should show status when no nodes selected", () => {
      controller.copySelected();
      expect(mockApp.updateStatus).toHaveBeenCalledWith("No nodes selected to copy");
    });

    it("should copy selected nodes to clipboard", () => {
      const mockNode = {
        id: "node-1",
        nodeKey: "Constant",
        type: "material-expression",
        x: 100,
        y: 200,
        properties: { Value: 0.5 }
      };
      mockGraph.selection.getSelectedNodes.mockReturnValue([mockNode]);

      controller.copySelected();

      expect(controller.clipboard).toHaveLength(1);
      expect(controller.clipboard[0]).toEqual({
        nodeKey: "Constant",
        x: 100,
        y: 200,
        properties: { Value: 0.5 }
      });
    });

    it("should skip main-output nodes when copying", () => {
      const mainOutput = {
        id: "main",
        type: "main-output",
        nodeKey: "Material",
        x: 500,
        y: 300,
        properties: {}
      };
      const normalNode = {
        id: "node-1",
        type: "material-expression",
        nodeKey: "Constant",
        x: 100,
        y: 200,
        properties: {}
      };
      mockGraph.selection.getSelectedNodes.mockReturnValue([mainOutput, normalNode]);

      controller.copySelected();

      expect(controller.clipboard).toHaveLength(1);
      expect(controller.clipboard[0].nodeKey).toBe("Constant");
    });

    it("should update status with copy count", () => {
      const nodes = [
        { id: "1", nodeKey: "A", x: 0, y: 0, properties: {} },
        { id: "2", nodeKey: "B", x: 100, y: 0, properties: {} }
      ];
      mockGraph.selection.getSelectedNodes.mockReturnValue(nodes);

      controller.copySelected();

      expect(mockApp.updateStatus).toHaveBeenCalledWith("Copied 2 node(s)");
    });

    it("should replace previous clipboard contents", () => {
      const node1 = { id: "1", nodeKey: "A", x: 0, y: 0, properties: {} };
      const node2 = { id: "2", nodeKey: "B", x: 0, y: 0, properties: {} };

      mockGraph.selection.getSelectedNodes.mockReturnValue([node1]);
      controller.copySelected();
      expect(controller.clipboard).toHaveLength(1);

      mockGraph.selection.getSelectedNodes.mockReturnValue([node2]);
      controller.copySelected();
      expect(controller.clipboard).toHaveLength(1);
      expect(controller.clipboard[0].nodeKey).toBe("B");
    });
  });

  describe("Paste", () => {
    it("should show status when clipboard is empty", () => {
      controller.pasteNodes();
      expect(mockApp.updateStatus).toHaveBeenCalledWith("Clipboard is empty");
    });

    it("should paste nodes from clipboard", () => {
      controller.clipboard = [
        { nodeKey: "Constant", x: 100, y: 200, properties: { Value: 0.5 } }
      ];

      controller.pasteNodes();

      expect(mockGraph.addNode).toHaveBeenCalledWith(
        "Constant",
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should deselect all before selecting pasted nodes", () => {
      controller.clipboard = [
        { nodeKey: "Constant", x: 100, y: 200, properties: {} }
      ];

      controller.pasteNodes();

      expect(mockGraph.selection.deselectAll).toHaveBeenCalled();
    });

    it("should select all pasted nodes", () => {
      controller.clipboard = [
        { nodeKey: "A", x: 0, y: 0, properties: {} },
        { nodeKey: "B", x: 100, y: 0, properties: {} }
      ];

      controller.pasteNodes();

      expect(mockGraph.selection.selectNode).toHaveBeenCalledTimes(2);
    });

    it("should update status with paste count", () => {
      controller.clipboard = [
        { nodeKey: "A", x: 0, y: 0, properties: {} }
      ];

      controller.pasteNodes();

      expect(mockApp.updateStatus).toHaveBeenCalledWith("Pasted 1 node(s)");
    });

    it("should preserve relative positions of pasted nodes", () => {
      controller.clipboard = [
        { nodeKey: "A", x: 100, y: 100, properties: {} },
        { nodeKey: "B", x: 200, y: 100, properties: {} }
      ];

      controller.pasteNodes();

      // First node at paste origin, second node 100px to the right
      const firstCall = mockGraph.addNode.mock.calls[0];
      const secondCall = mockGraph.addNode.mock.calls[1];
      
      const deltaX = secondCall[1] - firstCall[1];
      expect(deltaX).toBe(100); // B was 100px right of A
    });
  });

  describe("Duplicate", () => {
    it("should duplicate selected nodes", () => {
      const mockNode = {
        id: "node-1",
        nodeKey: "Constant",
        type: "material-expression",
        x: 100,
        y: 200,
        properties: { Value: 0.75 }
      };
      mockGraph.selection.getSelectedNodes.mockReturnValue([mockNode]);

      controller.duplicateSelected();

      expect(mockGraph.addNode).toHaveBeenCalledWith("Constant", 150, 250);
    });

    it("should skip main-output nodes when duplicating", () => {
      const mainOutput = {
        id: "main",
        type: "main-output",
        nodeKey: "Material",
        x: 500,
        y: 300,
        properties: {}
      };
      mockGraph.selection.getSelectedNodes.mockReturnValue([mainOutput]);

      controller.duplicateSelected();

      expect(mockGraph.addNode).not.toHaveBeenCalled();
    });

    it("should offset duplicated nodes by 50px", () => {
      const mockNode = {
        id: "node-1",
        nodeKey: "Add",
        type: "material-expression",
        x: 200,
        y: 300,
        properties: {}
      };
      mockGraph.selection.getSelectedNodes.mockReturnValue([mockNode]);

      controller.duplicateSelected();

      expect(mockGraph.addNode).toHaveBeenCalledWith("Add", 250, 350);
    });

    it("should select duplicated nodes after duplication", () => {
      const mockNode = {
        id: "node-1",
        nodeKey: "Constant",
        type: "material-expression",
        x: 100,
        y: 200,
        properties: {}
      };
      mockGraph.selection.getSelectedNodes.mockReturnValue([mockNode]);

      controller.duplicateSelected();

      expect(mockGraph.selection.deselectAll).toHaveBeenCalled();
      expect(mockGraph.selection.selectNode).toHaveBeenCalledWith(
        expect.objectContaining({ nodeKey: "Constant" }),
        true
      );
    });

    it("should copy properties to duplicated nodes", () => {
      const mockNode = {
        id: "node-1",
        nodeKey: "Constant",
        type: "material-expression",
        x: 0,
        y: 0,
        properties: { Value: 0.123 }
      };
      mockGraph.selection.getSelectedNodes.mockReturnValue([mockNode]);

      controller.duplicateSelected();

      const createdNode = mockGraph.addNode.mock.results[0].value;
      expect(createdNode.properties).toEqual({ Value: 0.123 });
    });
  });
});
