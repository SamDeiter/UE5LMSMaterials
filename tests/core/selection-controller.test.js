/**
 * tests/core/selection-controller.test.js
 * 
 * Tests for SelectionController - manages selection state for nodes/links.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SelectionController } from "../../material/core/SelectionController.js";

// Mock app and graph
function createMockApp() {
  return {
    details: {
      showNodeProperties: vi.fn(),
      showMaterialProperties: vi.fn()
    }
  };
}

function createMockGraph() {
  return {
    nodes: new Map(),
    links: new Map()
  };
}

function createMockNode(id) {
  return {
    id,
    element: {
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      }
    }
  };
}

function createMockLink(id) {
  return {
    id,
    element: {
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      }
    }
  };
}

describe("SelectionController", () => {
  let controller;
  let mockApp;
  let mockGraph;

  beforeEach(() => {
    mockApp = createMockApp();
    mockGraph = createMockGraph();
    controller = new SelectionController(mockApp, mockGraph);
  });

  describe("Initialization", () => {
    it("should start with empty selection", () => {
      expect(controller.selectedNodes.size).toBe(0);
      expect(controller.selectedLinks.size).toBe(0);
    });

    it("should report no selection on init", () => {
      expect(controller.hasSelection()).toBe(false);
    });
  });

  describe("Node Selection", () => {
    it("should select a single node", () => {
      const node = createMockNode("node-1");
      mockGraph.nodes.set("node-1", node);

      controller.selectNode(node);

      expect(controller.selectedNodes.has("node-1")).toBe(true);
      expect(node.element.classList.add).toHaveBeenCalledWith("selected");
    });

    it("should show node properties in details panel", () => {
      const node = createMockNode("node-1");
      mockGraph.nodes.set("node-1", node);

      controller.selectNode(node);

      expect(mockApp.details.showNodeProperties).toHaveBeenCalledWith(node);
    });

    it("should deselect previous nodes when not additive", () => {
      const node1 = createMockNode("node-1");
      const node2 = createMockNode("node-2");
      mockGraph.nodes.set("node-1", node1);
      mockGraph.nodes.set("node-2", node2);

      controller.selectNode(node1);
      controller.selectNode(node2);

      expect(controller.selectedNodes.has("node-1")).toBe(false);
      expect(controller.selectedNodes.has("node-2")).toBe(true);
    });

    it("should keep previous selection when additive", () => {
      const node1 = createMockNode("node-1");
      const node2 = createMockNode("node-2");
      mockGraph.nodes.set("node-1", node1);
      mockGraph.nodes.set("node-2", node2);

      controller.selectNode(node1);
      controller.selectNode(node2, true);

      expect(controller.selectedNodes.has("node-1")).toBe(true);
      expect(controller.selectedNodes.has("node-2")).toBe(true);
    });

    it("should deselect a specific node", () => {
      const node = createMockNode("node-1");
      mockGraph.nodes.set("node-1", node);

      controller.selectNode(node);
      controller.deselectNode(node);

      expect(controller.selectedNodes.has("node-1")).toBe(false);
      expect(node.element.classList.remove).toHaveBeenCalledWith("selected");
    });
  });

  describe("Link Selection", () => {
    it("should select a link", () => {
      const link = createMockLink("link-1");
      mockGraph.links.set("link-1", link);

      controller.selectLink(link);

      expect(controller.selectedLinks.has("link-1")).toBe(true);
      expect(link.element.classList.add).toHaveBeenCalledWith("selected");
    });

    it("should deselect nodes when selecting a link (non-additive)", () => {
      const node = createMockNode("node-1");
      const link = createMockLink("link-1");
      mockGraph.nodes.set("node-1", node);
      mockGraph.links.set("link-1", link);

      controller.selectNode(node);
      controller.selectLink(link);

      expect(controller.selectedNodes.size).toBe(0);
      expect(controller.selectedLinks.has("link-1")).toBe(true);
    });
  });

  describe("Deselect All", () => {
    it("should clear all selections", () => {
      const node = createMockNode("node-1");
      const link = createMockLink("link-1");
      mockGraph.nodes.set("node-1", node);
      mockGraph.links.set("link-1", link);

      controller.selectNode(node);
      controller.selectLink(link, true);
      controller.deselectAll();

      expect(controller.selectedNodes.size).toBe(0);
      expect(controller.selectedLinks.size).toBe(0);
    });

    it("should remove selected class from all elements", () => {
      const node = createMockNode("node-1");
      mockGraph.nodes.set("node-1", node);

      controller.selectNode(node);
      controller.deselectAll();

      expect(node.element.classList.remove).toHaveBeenCalledWith("selected");
    });

    it("should show material properties after deselecting", () => {
      const node = createMockNode("node-1");
      mockGraph.nodes.set("node-1", node);

      controller.selectNode(node);
      controller.deselectAll();

      expect(mockApp.details.showMaterialProperties).toHaveBeenCalled();
    });
  });

  describe("Selection Getters", () => {
    it("should return selected nodes as array", () => {
      const node1 = createMockNode("node-1");
      const node2 = createMockNode("node-2");
      mockGraph.nodes.set("node-1", node1);
      mockGraph.nodes.set("node-2", node2);

      controller.selectNode(node1);
      controller.selectNode(node2, true);

      const selected = controller.getSelectedNodes();
      expect(selected).toHaveLength(2);
      expect(selected).toContain(node1);
      expect(selected).toContain(node2);
    });

    it("should return selected links as array", () => {
      const link = createMockLink("link-1");
      mockGraph.links.set("link-1", link);

      controller.selectLink(link);

      const selected = controller.getSelectedLinks();
      expect(selected).toHaveLength(1);
      expect(selected).toContain(link);
    });

    it("should filter out missing nodes", () => {
      controller.selectedNodes.add("deleted-node");

      const selected = controller.getSelectedNodes();
      expect(selected).toHaveLength(0);
    });
  });

  describe("Has Selection", () => {
    it("should return true when nodes are selected", () => {
      controller.selectedNodes.add("node-1");
      expect(controller.hasSelection()).toBe(true);
    });

    it("should return true when links are selected", () => {
      controller.selectedLinks.add("link-1");
      expect(controller.hasSelection()).toBe(true);
    });

    it("should return false when nothing is selected", () => {
      expect(controller.hasSelection()).toBe(false);
    });
  });
});
