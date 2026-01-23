/**
 * tests/core/graph-commands.test.js
 * 
 * Verifies graph command logic and undo/redo state.
 */

import { describe, it, expect, vi } from "vitest";
import { DeleteNodesCommand } from "../../material/core/GraphCommands.js";

function createMockGraph(nodes = [], links = []) {
  const graph = {
    nodes: new Map(nodes.map(n => [n.id, n])),
    links: new Map(links.map(l => [l.id, l])),
    wiring: {
      breakLink: vi.fn(id => {
        graph.links.delete(id);
      }),
      createConnection: vi.fn((src, tgt, id) => {
        const link = { id, sourcePin: src, targetPin: tgt };
        graph.links.set(id, link);
        return link;
      })
    },
    app: {
      updateCounts: vi.fn()
    },
    addNode: vi.fn((key, x, y, id) => {
      const node = { 
        id, 
        nodeKey: key, 
        x, 
        y, 
        properties: {}, 
        findPin: vi.fn(), 
        element: { 
          remove: vi.fn(),
          querySelector: vi.fn().mockReturnValue({})
        }, 
        updatePreview: vi.fn() 
      };
      graph.nodes.set(id, node);
      return node;
    })
  };
  return graph;
}

describe("Graph Commands", () => {
  describe("DeleteNodesCommand", () => {
    it("should automatically find and include connected links for deletion", () => {
      const nodeA = { id: "node-a", pins: { outputs: [{ id: "out" }] }, element: { remove: vi.fn() } };
      const nodeB = { id: "node-b", pins: { inputs: [{ id: "in" }] }, element: { remove: vi.fn() } };
      
      const link = { 
        id: "link-1", 
        sourcePin: { id: "out", node: nodeA, localId: "out" }, 
        targetPin: { id: "in", node: nodeB, localId: "in" },
        type: "float"
      };
      
      const graph = createMockGraph([nodeA, nodeB], [link]);
      
      // Delete nodeA, but don't provide the link in the selection
      const command = new DeleteNodesCommand(graph, [nodeA], []);
      
      expect(command.linksData).toHaveLength(1);
      expect(command.linksData[0].id).toBe("link-1");
      
      // Execute deletion
      command.execute();
      
      expect(graph.nodes.has("node-a")).toBe(false);
      expect(graph.links.has("link-1")).toBe(false);
      expect(graph.wiring.breakLink).toHaveBeenCalledWith("link-1");
    });

    it("should restore links on undo", () => {
      const nodeA = { id: "node-a", nodeKey: "Constant", pins: { outputs: [{ id: "out" }] }, element: { remove: vi.fn() }, findPin: vi.fn() };
      const nodeB = { id: "node-b", nodeKey: "Add", pins: { inputs: [{ id: "in" }] }, element: { remove: vi.fn() }, findPin: vi.fn() };
      
      const link = { 
        id: "link-1", 
        sourcePin: { id: "out", node: nodeA, localId: "out" }, 
        targetPin: { id: "in", node: nodeB, localId: "in" },
        type: "float"
      };
      
      const graph = createMockGraph([nodeA, nodeB], [link]);
      
      // Mock findPin to return the correct pin objects
      nodeA.findPin = vi.fn().mockReturnValue(link.sourcePin);
      nodeB.findPin = vi.fn().mockReturnValue(link.targetPin);
      graph.nodes.get = (id) => {
          if (id === "node-a") return nodeA;
          if (id === "node-b") return nodeB;
          return null;
      };

      const command = new DeleteNodesCommand(graph, [nodeA, nodeB], [link]);
      command.execute();
      
      // Undo
      command.undo();
      
      expect(graph.nodes.has("node-a")).toBe(true);
      expect(graph.nodes.has("node-b")).toBe(true);
      expect(graph.wiring.createConnection).toHaveBeenCalled();
    });
  });
});
