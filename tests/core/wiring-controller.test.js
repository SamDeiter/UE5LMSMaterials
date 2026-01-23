/**
 * tests/core/wiring-controller.test.js
 * 
 * Tests for MaterialWiringController - manages wire connections.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialWiringController } from "../../material/core/MaterialWiringController.js";

// Mock dependencies
vi.mock("../../shared/WireRenderer.js", () => ({
  WireRenderer: {
    getWirePath: vi.fn().mockReturnValue("M 0 0 C 50 0 50 100 100 100")
  }
}));

vi.mock("./GraphCommands.js", () => ({
  CreateLinkCommand: class {
    constructor(graph, sourceId, targetId) {
      this.graph = graph;
      this.sourceId = sourceId;
      this.targetId = targetId;
    }
    execute() {}
    undo() {}
  },
  BreakLinkCommand: class {
    constructor(graph, linkId) {
      this.graph = graph;
      this.linkId = linkId;
    }
    execute() {}
    undo() {}
  }
}));

// Mock pin
function createMockPin(id, dir, type = "float") {
  return {
    id,
    dir,
    type,
    color: "#888",
    connectedTo: null,
    element: {
      querySelector: vi.fn().mockReturnValue({
        classList: { add: vi.fn(), remove: vi.fn() },
        getBoundingClientRect: () => ({ left: 100, top: 100, width: 10, height: 10 })
      })
    },
    canConnectTo: vi.fn().mockReturnValue(true)
  };
}

// Mock graph controller
function createMockGraphController() {
  return {
    app: {
      updateStatus: vi.fn(),
      updateCounts: vi.fn(),
      triggerLiveUpdate: vi.fn()
    },
    graphPanel: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    },
    wireGroup: {
      appendChild: vi.fn()
    },
    links: new Map(),
    isWiring: false,
    wiringStartPin: null,
    selection: {
      selectLink: vi.fn(),
      selectedLinks: new Set()
    },
    commands: {
      execute: vi.fn()
    }
  };
}

describe("MaterialWiringController", () => {
  let controller;
  let mockGraph;

  beforeEach(() => {
    // Mock DOM
    global.document = {
      getElementById: vi.fn().mockReturnValue({
        style: { display: '', stroke: '' },
        setAttribute: vi.fn()
      }),
      createElementNS: vi.fn().mockReturnValue({
        classList: { add: vi.fn() },
        setAttribute: vi.fn(),
        addEventListener: vi.fn(),
        style: { stroke: '' },
        id: '',
        remove: vi.fn() // Add remove function for breakLink
      })
    };

    mockGraph = createMockGraphController();
    controller = new MaterialWiringController(mockGraph);
  });

  describe("Start Wiring", () => {
    it("should set wiring state to true", () => {
      const pin = createMockPin("pin-1", "out");
      controller.startWiring(pin, { clientX: 100, clientY: 100 });
      
      expect(mockGraph.isWiring).toBe(true);
    });

    it("should store starting pin", () => {
      const pin = createMockPin("pin-1", "out");
      controller.startWiring(pin, { clientX: 100, clientY: 100 });
      
      expect(mockGraph.wiringStartPin).toBe(pin);
    });

    it("should show ghost wire", () => {
      const pin = createMockPin("pin-1", "out");
      controller.startWiring(pin, { clientX: 100, clientY: 100 });
      
      const ghostWire = document.getElementById("ghost-wire");
      expect(ghostWire.style.display).toBe("block");
    });
  });

  describe("End Wiring", () => {
    it("should reset wiring state", () => {
      const pin = createMockPin("pin-1", "out");
      controller.startWiring(pin, { clientX: 100, clientY: 100 });
      controller.endWiring();
      
      expect(mockGraph.isWiring).toBe(false);
      expect(mockGraph.wiringStartPin).toBeNull();
    });

    it("should hide ghost wire", () => {
      const pin = createMockPin("pin-1", "out");
      controller.startWiring(pin, { clientX: 100, clientY: 100 });
      controller.endWiring();
      
      const ghostWire = document.getElementById("ghost-wire");
      expect(ghostWire.style.display).toBe("none");
    });

    it("should create connection when target pin provided", () => {
      const sourcePin = createMockPin("pin-1", "out");
      const targetPin = createMockPin("pin-2", "in");
      
      controller.startWiring(sourcePin, { clientX: 100, clientY: 100 });
      controller.endWiring(targetPin);
      
      expect(mockGraph.commands.execute).toHaveBeenCalled();
    });

    it("should not create connection when no target pin", () => {
      const pin = createMockPin("pin-1", "out");
      controller.startWiring(pin, { clientX: 100, clientY: 100 });
      controller.endWiring();
      
      expect(mockGraph.commands.execute).not.toHaveBeenCalled();
    });
  });

  describe("Create Connection", () => {
    it("should validate connection compatibility", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      // Source code checks outputPin.canConnectTo(inputPin)
      outputPin.canConnectTo.mockReturnValue(false);
      
      const result = controller.createConnection(outputPin, inputPin);
      
      expect(result).toBe(false);
      expect(mockGraph.app.updateStatus).toHaveBeenCalledWith("Cannot connect: incompatible types");
    });

    it("should create link for valid connection", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link = controller.createConnection(outputPin, inputPin);
      
      expect(link).toBeTruthy();
      expect(mockGraph.links.size).toBe(1);
    });

    it("should update pin connected state", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link = controller.createConnection(outputPin, inputPin);
      
      expect(outputPin.connectedTo).toBe(link.id);
      expect(inputPin.connectedTo).toBe(link.id);
    });

    it("should break existing connection on input pin", () => {
      const output1 = createMockPin("out-1", "out");
      const output2 = createMockPin("out-2", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link1 = controller.createConnection(output1, inputPin);
      const link2 = controller.createConnection(output2, inputPin);
      
      // First link should be broken
      expect(mockGraph.links.has(link1.id)).toBe(false);
      expect(mockGraph.links.has(link2.id)).toBe(true);
    });

    it("should use explicit ID when provided", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link = controller.createConnection(outputPin, inputPin, "my-custom-id");
      
      expect(link.id).toBe("my-custom-id");
    });

    it("should trigger live update after connection", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      controller.createConnection(outputPin, inputPin);
      
      expect(mockGraph.app.triggerLiveUpdate).toHaveBeenCalled();
    });
  });

  describe("Break Link", () => {
    it("should remove link from links map", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link = controller.createConnection(outputPin, inputPin);
      controller.breakLink(link.id);
      
      expect(mockGraph.links.has(link.id)).toBe(false);
    });

    it("should reset pin connected states", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link = controller.createConnection(outputPin, inputPin);
      controller.breakLink(link.id);
      
      expect(outputPin.connectedTo).toBeNull();
      expect(inputPin.connectedTo).toBeNull();
    });

    it("should do nothing for non-existent link", () => {
      controller.breakLink("fake-link-id");
      // Should not throw
      expect(true).toBe(true);
    });

    it("should remove from selected links", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link = controller.createConnection(outputPin, inputPin);
      mockGraph.selection.selectedLinks.add(link.id);
      
      controller.breakLink(link.id);
      
      expect(mockGraph.selection.selectedLinks.has(link.id)).toBe(false);
    });

    it("should trigger live update after breaking", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      const link = controller.createConnection(outputPin, inputPin);
      vi.clearAllMocks();
      
      controller.breakLink(link.id);
      
      expect(mockGraph.app.triggerLiveUpdate).toHaveBeenCalled();
    });
  });

  describe("Select Link", () => {
    it("should delegate to selection controller", () => {
      const mockLink = { id: "link-1" };
      
      controller.selectLink(mockLink);
      
      expect(mockGraph.selection.selectLink).toHaveBeenCalledWith(mockLink);
    });
  });

  describe("Update All Wires", () => {
    it("should redraw all links", () => {
      const outputPin = createMockPin("out-1", "out");
      const inputPin = createMockPin("in-1", "in");
      
      controller.createConnection(outputPin, inputPin);
      
      const drawWireSpy = vi.spyOn(controller, 'drawWire');
      controller.updateAllWires();
      
      expect(drawWireSpy).toHaveBeenCalledTimes(1);
    });
  });
});
