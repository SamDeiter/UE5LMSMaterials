/**
 * tests/engine/pbr-evaluation.test.js
 * 
 * Verifies PBR material property evaluation from the graph.
 */

import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("../../material/engine/TextureManager.js", () => ({
  textureManager: {
    get: vi.fn((id) => {
      if (id === "test-texture") return { dataUrl: "data:image/png;base64,123" };
      return null;
    }),
  },
}));

import { MaterialEvaluator } from "../../material/engine/MaterialEvaluator.js";

// Mock graph
function createMockGraph(nodes = [], links = []) {
  return {
    nodes: new Map(nodes.map(n => [n.id, n])),
    links: new Map(links.map(l => [l.id, l])),
  };
}

describe("PBR Evaluation", () => {
  it("should evaluate default PBR properties correctly", () => {
    const mainNode = {
      id: "main",
      type: "main-output",
      inputs: [
        { id: "main-roughness", name: "Roughness", connectedTo: null, defaultValue: 0.5 },
        { id: "main-metallic", name: "Metallic", connectedTo: null, defaultValue: 0 },
      ],
      properties: {},
    };
    
    const graph = createMockGraph([mainNode]);
    const evaluator = new MaterialEvaluator(graph);
    
    const result = evaluator.evaluate();
    expect(result.roughness).toBe(0.5);
    expect(result.metallic).toBe(0);
  });

  it("should evaluate Roughness from Constant node", () => {
    const constNode = {
      id: "const-1",
      nodeKey: "Constant",
      properties: { R: 0.8 },
      outputs: [{ id: "const-out" }],
    };
    
    const mainNode = {
      id: "main",
      type: "main-output",
      inputs: [
        { id: "main-roughness", name: "Roughness", connectedTo: "link-1" },
      ],
      properties: {},
    };
    
    const link = {
      id: "link-1",
      sourcePin: { id: "const-out", node: constNode },
      outputPin: { id: "const-out" },
      targetPin: { id: "main-roughness", node: mainNode },
    };
    
    const graph = createMockGraph([constNode, mainNode], [link]);
    const evaluator = new MaterialEvaluator(graph);
    
    const result = evaluator.evaluate();
    expect(result.roughness).toBe(0.8);
  });

  it("should evaluate Roughness from individual Texture channel", () => {
    const texNode = {
      id: "tex-1",
      nodeKey: "TextureSample",
      properties: { TextureAsset: "test-texture" },
      inputs: [],
      outputs: [
        { id: "tex-rgb", name: "RGB" },
        { id: "tex-r", name: "R" },
      ],
    };
    
    const mainNode = {
      id: "main",
      type: "main-output",
      inputs: [
        { id: "main-roughness", name: "Roughness", connectedTo: "link-1" },
      ],
      properties: {},
    };
    
    const link = {
      id: "link-1",
      sourcePin: { id: "tex-r", node: texNode },
      outputPin: { id: "tex-r", localId: "r" },
      targetPin: { id: "main-roughness", node: mainNode },
    };
    
    const graph = createMockGraph([texNode, mainNode], [link]);
    const evaluator = new MaterialEvaluator(graph);
    
    const result = evaluator.evaluate();
    expect(result.roughnessTexture).toBeDefined();
    expect(result.roughness).toBe(1.0); // Multiplier when map is present
  });

  it("should evaluate Advanced PBR properties (Clear Coat, Anisotropy)", () => {
    const mainNode = {
      id: "main",
      type: "main-output",
      inputs: [
        { id: "main-clearcoat", name: "Clear Coat", connectedTo: null, defaultValue: 1.0 },
        { id: "main-anisotropy", name: "Anisotropy", connectedTo: null, defaultValue: 0.5 },
      ],
    };
    
    const graph = createMockGraph([mainNode]);
    const evaluator = new MaterialEvaluator(graph);
    
    const result = evaluator.evaluate();
    expect(result.clearCoat).toBe(1.0);
    expect(result.anisotropy).toBe(0.5);
  });
});
