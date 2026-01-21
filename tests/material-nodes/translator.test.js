import { describe, it, expect, beforeAll, vi } from "vitest";

// Mock browser-only modules before importing MaterialTranslator
// The paths must match the actual import paths in MaterialTranslator.js
vi.mock("../../material/engine/TextureManager.js", () => ({
  textureManager: {
    get: vi.fn().mockReturnValue({ dataUrl: "mock-url" }),
  },
  TextureManager: class {},
}));

vi.mock("../../material/engine/ShaderEvaluator.js", () => ({
  shaderEvaluator: {
    multiplyTextureByColor: vi
      .fn()
      .mockReturnValue(Promise.resolve({ url: "processed-url" })),
  },
}));

import { getRegistry, createNode } from "../setup.js";
import { MaterialTranslator } from "../../MaterialTranslator.js";

describe("MaterialTranslator", () => {
  let translator;
  let graph;

  beforeAll(() => {
    getRegistry();
    translator = new MaterialTranslator();
    // Mock graph object that nodes expect
    graph = {
      nodes: new Map(),
      links: new Map(),
    };
  });

  it("should translate constant scalars to result values", () => {
    const mainNode = createNode("MainMaterialNode");
    const constNode = createNode("Constant");
    constNode.properties.R = 0.75;

    graph.nodes.set(mainNode.id, mainNode);
    graph.nodes.set(constNode.id, constNode);

    // Connect Metallic pin (id: metallic) to Constant output
    const metallicPin = mainNode.inputs.find((p) => p.localId === "metallic");
    const outputPin = constNode.outputs[0];

    const linkId = "link-1";
    graph.links.set(linkId, { outputPin: outputPin });
    metallicPin.connectedTo = linkId;

    const result = translator.translate(graph, mainNode);
    expect(result.metallic).toBe(0.75);
  });

  it("should deduplicate node evaluation using scopeMap", () => {
    const mainNode = createNode("MainMaterialNode");
    const constNode = createNode("Constant");
    constNode.properties.R = 0.5;

    graph.nodes.set(mainNode.id, mainNode);
    graph.nodes.set(constNode.id, constNode);

    const metallicPin = mainNode.inputs.find((p) => p.localId === "metallic");
    const roughnessPin = mainNode.inputs.find((p) => p.localId === "roughness");
    const outputPin = constNode.outputs[0];

    const linkId = "link-1";
    graph.links.set(linkId, { outputPin: outputPin });
    metallicPin.connectedTo = linkId;
    roughnessPin.connectedTo = linkId;

    // Spy on evaluateNode
    const spy = vi.spyOn(translator, "evaluateNode");

    translator.translate(graph, mainNode);

    // evaluateNode should only be called once for constNode despite two pins connecting to it
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("should handle base color vector translation", () => {
    const mainNode = createNode("MainMaterialNode");
    const vecNode = createNode("Constant3Vector");
    vecNode.properties.R = 1;
    vecNode.properties.G = 0;
    vecNode.properties.B = 0;

    graph.nodes.set(mainNode.id, mainNode);
    graph.nodes.set(vecNode.id, vecNode);

    const bcPin = mainNode.inputs.find((p) => p.localId === "base_color");
    const outputPin = vecNode.outputs[0];

    const linkId = "link-2";
    graph.links.set(linkId, { outputPin: outputPin });
    bcPin.connectedTo = linkId;

    const result = translator.translate(graph, mainNode);
    expect(result.baseColor).toEqual([1, 0, 0]);
  });
});
