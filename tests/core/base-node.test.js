/**
 * tests/core/base-node.test.js
 * 
 * Tests for MaterialNode (BaseNode.js) - core node rendering and properties.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialNode } from "../../material/core/BaseNode.js";

// Mock MaterialPin to avoid DOM dependencies
vi.mock("../../material/core/MaterialPin.js", () => ({
  MaterialPin: class MockPin {
    constructor(node, def) {
      this.node = node;
      this.id = `${node.id}-${def.id}`;
      this.localId = def.id;
      this.name = def.name;
      this.dir = def.dir;
      this.type = def.type;
      this.defaultValue = def.defaultValue;
      this.connectedTo = null;
    }
    isConnected() { return !!this.connectedTo; }
    render() { return document.createElement('div'); }
    getDefaultValue() { return this.defaultValue ?? 0; }
    getConnectedOutputVar() { return 'input_var'; }
  }
}));

// Mock document for headless testing
function setupMockDocument() {
  global.document = {
    createElement: vi.fn((tag) => ({
      tagName: tag.toUpperCase(),
      className: '',
      id: '',
      style: {},
      dataset: {},
      innerHTML: '',
      textContent: '',
      children: [],
      appendChild: vi.fn(function(child) { this.children.push(child); return child; }),
      addEventListener: vi.fn(),
      querySelector: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn()
      }
    }))
  };
}

describe("MaterialNode", () => {
  beforeEach(() => {
    setupMockDocument();
  });

  describe("Construction", () => {
    it("should initialize with correct properties", () => {
      const definition = {
        key: "Constant",
        title: "Constant",
        type: "material-expression",
        category: "Constants",
        pins: [],
        properties: { Value: 1.0 }
      };

      const node = new MaterialNode("node-1", definition, 100, 200, null);

      expect(node.id).toBe("node-1");
      expect(node.x).toBe(100);
      expect(node.y).toBe(200);
      expect(node.nodeKey).toBe("Constant");
      expect(node.title).toBe("Constant");
      expect(node.category).toBe("Constants");
    });

    it("should copy properties from definition", () => {
      const definition = {
        key: "Constant3Vector",
        title: "Constant3Vector",
        pins: [],
        properties: { Color: { R: 1, G: 0.5, B: 0 } }
      };

      const node = new MaterialNode("node-1", definition, 0, 0, null);

      expect(node.properties.Color).toEqual({ R: 1, G: 0.5, B: 0 });
    });

    it("should initialize inputs and outputs from pins", () => {
      const definition = {
        key: "Add",
        title: "Add",
        pins: [
          { id: "a", name: "A", dir: "in", type: "float" },
          { id: "b", name: "B", dir: "in", type: "float" },
          { id: "out", name: "", dir: "out", type: "float" }
        ],
        properties: {}
      };

      const node = new MaterialNode("add-1", definition, 0, 0, null);

      expect(node.inputs).toHaveLength(2);
      expect(node.outputs).toHaveLength(1);
      expect(node.inputs[0].name).toBe("A");
      expect(node.inputs[1].name).toBe("B");
    });
  });

  describe("Shader Code Generation", () => {
    it("should substitute property values into shader code", () => {
      const definition = {
        key: "Constant",
        title: "Constant",
        pins: [],
        properties: { Value: 0.75 },
        shaderCode: "float result = {Value};"
      };

      const node = new MaterialNode("const-1", definition, 0, 0, null);
      const snippet = node.getShaderSnippet();

      expect(snippet).toBe("float result = 0.75;");
    });

    it("should substitute nested property paths", () => {
      const definition = {
        key: "Constant3Vector",
        title: "Constant3Vector",
        pins: [],
        properties: { Color: { R: 1, G: 0.5, B: 0.25 } },
        shaderCode: "float3 result = float3({Color.R}, {Color.G}, {Color.B});"
      };

      const node = new MaterialNode("color-1", definition, 0, 0, null);
      const snippet = node.getShaderSnippet();

      expect(snippet).toBe("float3 result = float3(1, 0.5, 0.25);");
    });

    it("should substitute pin inputs", () => {
      const definition = {
        key: "Multiply",
        title: "Multiply",
        pins: [
          { id: "a", name: "A", dir: "in", type: "float", defaultValue: 1 },
          { id: "b", name: "B", dir: "in", type: "float", defaultValue: 1 }
        ],
        properties: {},
        shaderCode: "float result = {A} * {B};"
      };

      const node = new MaterialNode("mul-1", definition, 0, 0, null);
      const snippet = node.getShaderSnippet();

      // Unconnected pins should use default values
      expect(snippet).toContain("1");
    });
  });

  describe("Rendering", () => {
    it("should render standard node for material-expression type", () => {
      const definition = {
        key: "Constant",
        title: "Constant",
        type: "material-expression",
        pins: [],
        properties: {}
      };

      const node = new MaterialNode("node-1", definition, 0, 0, null);
      const element = node.render();

      expect(element).toBeDefined();
      expect(node.element).toBe(element);
    });

    it("should render reroute node for reroute-node type", () => {
      const definition = {
        key: "Reroute",
        title: "Reroute",
        type: "reroute-node",
        pins: [
          { id: "in", name: "", dir: "in", type: "float" },
          { id: "out", name: "", dir: "out", type: "float" }
        ],
        properties: {}
      };

      const node = new MaterialNode("reroute-1", definition, 0, 0, null);
      const element = node.render();

      expect(element.className).toContain("reroute");
    });

    it("should render comment node for comment-node type", () => {
      const definition = {
        key: "Comment",
        title: "Comment",
        type: "comment-node",
        pins: [],
        properties: { CommentText: "Test Comment", Width: 300, Height: 150 }
      };

      const node = new MaterialNode("comment-1", definition, 0, 0, null);
      const element = node.render();

      expect(element.className).toContain("comment");
    });
  });

  describe("Preview", () => {
    it("should update preview with color from Color property", () => {
      const definition = {
        key: "Constant3Vector",
        title: "Constant3Vector",
        type: "material-expression",
        pins: [],
        properties: { Color: { R: 1, G: 0, B: 0 } },
        showPreview: true
      };

      const node = new MaterialNode("color-1", definition, 0, 0, null);
      const previewEl = { style: {} };
      
      node.updatePreview(previewEl);

      expect(previewEl.style.backgroundColor).toBe("rgb(255, 0, 0)");
    });

    it("should update preview with color from individual R,G,B properties", () => {
      const definition = {
        key: "OldColor",
        title: "OldColor",
        type: "material-expression",
        pins: [],
        properties: { R: 0, G: 1, B: 0.5 },
        showPreview: true
      };

      const node = new MaterialNode("old-1", definition, 0, 0, null);
      const previewEl = { style: {} };
      
      node.updatePreview(previewEl);

      expect(previewEl.style.backgroundColor).toBe("rgb(0, 255, 128)");
    });

    it("should show gradient for substrate-expression type", () => {
      const definition = {
        key: "SubstrateSlabBSDF",
        title: "Substrate Slab BSDF",
        type: "substrate-expression",
        pins: [],
        properties: {}
      };

      const node = new MaterialNode("substrate-1", definition, 0, 0, null);
      node.app = { graph: {} };
      const previewEl = { style: {} };
      
      node.updatePreview(previewEl);

      // Substrate fallback shows purple gradient
      expect(previewEl.style.background).toContain("gradient");
    });
  });

  describe("Pin Management", () => {
    it("should find pin by ID", () => {
      const definition = {
        key: "Add",
        title: "Add",
        pins: [
          { id: "a", name: "A", dir: "in", type: "float" },
          { id: "out", name: "", dir: "out", type: "float" }
        ],
        properties: {}
      };

      const node = new MaterialNode("add-1", definition, 0, 0, null);
      
      const inputPin = node.findPin("add-1-a");
      const outputPin = node.findPin("add-1-out");

      expect(inputPin).toBeDefined();
      expect(inputPin.name).toBe("A");
      expect(outputPin).toBeDefined();
    });

    it("should return undefined for non-existent pin", () => {
      const definition = {
        key: "Constant",
        title: "Constant",
        pins: [],
        properties: {}
      };

      const node = new MaterialNode("const-1", definition, 0, 0, null);
      
      const pin = node.findPin("non-existent");
      expect(pin).toBeUndefined();
    });
  });

  describe("Serialization", () => {
    it("should serialize node state", () => {
      const definition = {
        key: "Constant",
        title: "Constant",
        pins: [],
        properties: { Value: 0.5 }
      };

      const node = new MaterialNode("const-1", definition, 150, 250, null);
      const serialized = node.serialize();

      expect(serialized).toEqual({
        id: "const-1",
        nodeKey: "Constant",
        x: 150,
        y: 250,
        properties: { Value: 0.5 }
      });
    });

    it("should create independent copy of properties", () => {
      const definition = {
        key: "Constant3Vector",
        title: "Constant3Vector",
        pins: [],
        properties: { Color: { R: 1, G: 0, B: 0 } }
      };

      const node = new MaterialNode("color-1", definition, 0, 0, null);
      const serialized = node.serialize();

      // Modify original
      node.properties.Color.R = 0.5;

      // Serialized should be unchanged
      expect(serialized.properties.Color.R).toBe(1);
    });
  });
});
