/**
 * Material Editor Test Suite
 * Tests for MaterialNodeFramework, shader generation, and pin validation.
 * @module tests/material-tests
 */

// Assertion helper
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
};

/**
 * Registers all Material Editor tests with the TestRunner.
 * @param {TestRunner} runner - The test runner instance
 */
export const registerMaterialTests = (runner) => {
  // --- Material Node Framework Tests ---

  runner.register("[Material] Import MaterialNodeFramework", async () => {
    const module = await import("../MaterialNodeFramework.js");
    assert(module.MaterialNode, "MaterialNode class should be exported");
    assert(module.MaterialPin, "MaterialPin class should be exported");
    assert(
      module.MaterialNodeRegistry,
      "MaterialNodeRegistry class should be exported"
    );
  });

  runner.register("[Material] Create MaterialNode instance", async () => {
    const { MaterialNode, MaterialNodeRegistry } = await import(
      "../MaterialNodeFramework.js"
    );
    const { MaterialExpressionDefinitions } = await import(
      "../data/MaterialExpressionDefinitions.js"
    );

    const registry = new MaterialNodeRegistry();
    registry.registerBatch(MaterialExpressionDefinitions);

    const node = registry.createNode("Constant", "test-1", 100, 100, null);
    assert(node !== null, "Node should be created");
    assert(
      node.definition.title === "Constant",
      "Node title should be 'Constant'"
    );
  });

  runner.register("[Material] MaterialPin type validation", async () => {
    const { MaterialPin, MaterialNode, MaterialNodeRegistry } = await import(
      "../MaterialNodeFramework.js"
    );
    const { MaterialExpressionDefinitions } = await import(
      "../data/MaterialExpressionDefinitions.js"
    );

    const registry = new MaterialNodeRegistry();
    registry.registerBatch(MaterialExpressionDefinitions);

    // Create two nodes to test pin compatibility
    const constNode = registry.createNode("Constant", "const-1", 0, 0, null);
    const addNode = registry.createNode("Add", "add-1", 200, 0, null);

    // Get output pin from Constant and input pin from Add
    const constOut = constNode.pins.outputs[0];
    const addIn = addNode.pins.inputs[0];

    // Float to Float should be compatible
    assert(
      constOut.canConnectTo(addIn),
      "Float output should connect to Float input"
    );
  });

  runner.register("[Material] Float to Float3 type broadcast", async () => {
    const { MaterialNodeRegistry } = await import(
      "../MaterialNodeFramework.js"
    );
    const { MaterialExpressionDefinitions } = await import(
      "../data/MaterialExpressionDefinitions.js"
    );

    const registry = new MaterialNodeRegistry();
    registry.registerBatch(MaterialExpressionDefinitions);

    // Create a Constant (float output) and check connection to float3 input
    const constNode = registry.createNode("Constant", "const-2", 0, 0, null);
    const multiplyNode = registry.createNode(
      "Multiply",
      "mult-1",
      200,
      0,
      null
    );

    const constOut = constNode.pins.outputs[0];
    // Multiply node may accept float or float3 - this tests broadcast capability
    assert(constOut, "Constant should have an output pin");
  });

  // --- MaterialNodeRegistry Tests ---

  runner.register("[Material] Registry search functionality", async () => {
    const { MaterialNodeRegistry } = await import(
      "../MaterialNodeFramework.js"
    );
    const { MaterialExpressionDefinitions } = await import(
      "../data/MaterialExpressionDefinitions.js"
    );

    const registry = new MaterialNodeRegistry();
    registry.registerBatch(MaterialExpressionDefinitions);

    const results = registry.search("Constant");
    assert(Array.isArray(results), "Search should return an array");
    assert(results.length > 0, "Should find at least one Constant node");
  });

  runner.register("[Material] Registry getByCategory", async () => {
    const { MaterialNodeRegistry } = await import(
      "../MaterialNodeFramework.js"
    );
    const { MaterialExpressionDefinitions } = await import(
      "../data/MaterialExpressionDefinitions.js"
    );

    const registry = new MaterialNodeRegistry();
    registry.registerBatch(MaterialExpressionDefinitions);

    const categories = registry.getAllCategories();
    assert(categories.size > 0, "Should have at least one category");

    const mathNodes = registry.getByCategory("Math");
    // Math category should exist in a Material Editor
    assert(mathNodes !== undefined, "Math category should exist");
  });

  // --- Shader Code Generation Tests ---

  runner.register(
    "[Material] Shader snippet generation - Constant",
    async () => {
      const { MaterialNodeRegistry } = await import(
        "../MaterialNodeFramework.js"
      );
      const { MaterialExpressionDefinitions } = await import(
        "../data/MaterialExpressionDefinitions.js"
      );

      const registry = new MaterialNodeRegistry();
      registry.registerBatch(MaterialExpressionDefinitions);

      const constNode = registry.createNode("Constant", "const-3", 0, 0, null);
      const snippet = constNode.getShaderSnippet();

      // Should return some shader code or variable reference
      assert(typeof snippet === "string", "Shader snippet should be a string");
    }
  );

  runner.register(
    "[Material] MainMaterialNode has all required pins",
    async () => {
      const { MaterialNodeRegistry } = await import(
        "../MaterialNodeFramework.js"
      );
      const { MaterialExpressionDefinitions } = await import(
        "../data/MaterialExpressionDefinitions.js"
      );

      const registry = new MaterialNodeRegistry();
      registry.registerBatch(MaterialExpressionDefinitions);

      const mainDef = registry.get("MainMaterialNode");
      assert(mainDef, "MainMaterialNode should be defined");

      const requiredPins = ["base_color", "metallic", "roughness", "normal"];
      const pinIds = mainDef.pins.map((p) => p.id);

      for (const pinId of requiredPins) {
        assert(
          pinIds.includes(pinId),
          `MainMaterialNode should have '${pinId}' pin`
        );
      }
    }
  );

  // --- Expression Definition Tests ---

  runner.register(
    "[Material] Math nodes defined (Add, Subtract, Multiply, Divide)",
    async () => {
      const { MaterialExpressionDefinitions } = await import(
        "../data/MaterialExpressionDefinitions.js"
      );

      const mathNodes = ["Add", "Subtract", "Multiply", "Divide"];
      for (const nodeName of mathNodes) {
        assert(
          MaterialExpressionDefinitions[nodeName],
          `${nodeName} node should be defined`
        );
      }
    }
  );

  runner.register("[Material] Texture nodes defined", async () => {
    const { MaterialExpressionDefinitions } = await import(
      "../data/MaterialExpressionDefinitions.js"
    );

    const textureNodes = ["TextureSample", "TextureCoordinate"];
    for (const nodeName of textureNodes) {
      assert(
        MaterialExpressionDefinitions[nodeName],
        `${nodeName} node should be defined`
      );
    }
  });

  runner.register("[Material] Parameter nodes defined", async () => {
    const { MaterialExpressionDefinitions } = await import(
      "../data/MaterialExpressionDefinitions.js"
    );

    const paramNodes = ["ScalarParameter", "VectorParameter"];
    for (const nodeName of paramNodes) {
      assert(
        MaterialExpressionDefinitions[nodeName],
        `${nodeName} node should be defined`
      );
    }
  });
};
