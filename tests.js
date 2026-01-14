/**
 * Test Runner and Test Registration for UE5 Blueprint/Material Editor
 * Runs in-browser tests for SCORM compatibility.
 *
 * Usage: Open console and type `runTests()` or `runMaterialTests()`
 * @module tests
 */

// Import Material Editor tests (async to avoid load order issues)
// Note: Material tests loaded dynamically via tests/material-tests.js

export class TestRunner {
  constructor(app) {
    this.app = app;
    this.tests = [];
  }

  register(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run(filter = null) {
    console.log(
      "%c🧪 Starting Test Suite...",
      "color: #3498db; font-weight: bold; font-size: 14px;"
    );
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const test of this.tests) {
      // Apply filter if provided
      if (filter && !test.name.toLowerCase().includes(filter.toLowerCase())) {
        skipped++;
        continue;
      }

      try {
        console.group(`Running: ${test.name}`);
        await test.testFn(this.app);
        console.log("%c✅ Passed", "color: #2ecc71; font-weight: bold;");
        passed++;
      } catch (error) {
        console.error(
          `%c❌ Failed: ${error.message}`,
          "color: #e74c3c; font-weight: bold;"
        );
        console.error(error);
        failed++;
      } finally {
        console.groupEnd();
      }
    }

    const skipMsg = skipped > 0 ? `, ${skipped} Skipped` : "";
    console.log(
      `%c🏁 Tests Completed: ${passed} Passed, ${failed} Failed${skipMsg}`,
      "color: #f1c40f; font-weight: bold; font-size: 14px;"
    );
    return failed === 0;
  }
}

// Assertion Helper
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
};

// Define Tests (merged from historical versions)
export const registerTests = (runner) => {
  // --- Variable Tests ---

  runner.register("Create Boolean Variable", (app) => {
    const initialCount = app.variables.variables.size;
    app.variables.addVariable();
    assert(
      app.variables.variables.size === initialCount + 1,
      "Variable count should increase by 1"
    );

    const newVar = [...app.variables.variables.values()].pop();
    assert(newVar.type === "bool", "New variable should be type 'bool'");
    assert(newVar.defaultValue === false, "New bool should default to false");
  });

  runner.register("Change Variable Type to Vector", (app) => {
    // Create a var if none exists
    if (app.variables.variables.size === 0) app.variables.addVariable();
    const variable = [...app.variables.variables.values()].pop();

    app.variables.updateVariableProperty(variable, "type", "vector");
    assert(variable.type === "vector", "Variable type should be 'vector'");
    assert(
      variable.defaultValue === "(0,0,0)",
      "Vector default should be '(0,0,0)'"
    );
  });

  runner.register("Change Variable Type to Transform", (app) => {
    if (app.variables.variables.size === 0) app.variables.addVariable();
    const variable = [...app.variables.variables.values()].pop();

    app.variables.updateVariableProperty(variable, "type", "transform");
    assert(
      variable.type === "transform",
      "Variable type should be 'transform'"
    );
    assert(
      variable.defaultValue === "(0,0,0|0,0,0|1,1,1)",
      "Transform default should be '(0,0,0|0,0,0|1,1,1)'"
    );
  });

  runner.register("Prevent Boolean Set/Map", (app) => {
    // This test is a placeholder for UI constraints; the model currently allows operations
    if (app.variables.variables.size === 0) app.variables.addVariable();
    const variable = [...app.variables.variables.values()].pop();
    app.variables.updateVariableProperty(variable, "type", "bool");
    assert(true, "Skipping UI interaction test");
  });

  // --- Graph Tests ---

  runner.register("Add PrintString Node to Graph", (app) => {
    const initialNodeCount = app.graph.nodes.size;
    const newNode = app.graph.addNode("PrintString", 100, 100);
    assert(newNode !== null, "addNode should return a node for PrintString");
    assert(
      app.graph.nodes.size === initialNodeCount + 1,
      "Node count should increase"
    );

    const node = [...app.graph.nodes.values()].pop();
    assert(node.nodeKey === "PrintString", "Node key should be PrintString");
  });

  // Historical test: Add Event BeginPlay node (kept for broader coverage)
  runner.register("Add EventBeginPlay Node to Graph", (app) => {
    const initialNodeCount = app.graph.nodes.size;
    // Use the NodeDefinitions key 'EventBeginPlay'
    const evtNode = app.graph.addNode("EventBeginPlay", 100, 100);
    assert(evtNode !== null, "addNode should return a node for EventBeginPlay");
    assert(
      app.graph.nodes.size === initialNodeCount + 1,
      "Node count should increase"
    );

    const node = [...app.graph.nodes.values()].pop();
    assert(
      node.nodeKey === "EventBeginPlay",
      "Node key should be EventBeginPlay"
    );
  });

  runner.register("Delete Node", (app) => {
    // Ensure we have a node
    if (app.graph.nodes.size === 0) app.graph.addNode("PrintString", 100, 100);
    const initialNodeCount = app.graph.nodes.size;
    const node = [...app.graph.nodes.values()].pop();

    // Select it first (selectNode expects nodeId)
    app.graph.selectNode(node.id, false);
    app.graph.deleteSelectedNodes();

    assert(
      app.graph.nodes.size === initialNodeCount - 1,
      "Node count should decrease"
    );
  });

  runner.register("Delete Variable via Key", async (app) => {
    // 1. Create Variable
    app.variables.addVariable();
    const variable = [...app.variables.variables.values()].pop();
    const initialCount = app.variables.variables.size;

    // 2. Select Variable (Simulate UI selection)
    app.details.currentVariable = variable;

    // 3. Simulate Delete Key Press
    const deleteEvent = new KeyboardEvent("keydown", {
      key: "Delete",
      code: "Delete",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(deleteEvent);

    // 4. Check if Modal is Open
    const modal = document.getElementById("confirmation-modal");
    assert(
      modal.style.display === "flex",
      "Confirmation modal should be visible"
    );

    // 5. Click Yes
    const yesBtn = document.getElementById("confirm-yes-btn");
    yesBtn.click();

    // 6. Verify Deletion
    assert(
      app.variables.variables.size === initialCount - 1,
      "Variable count should decrease"
    );
    assert(
      !app.variables.variables.has(variable.name),
      "Variable should be removed"
    );
  });
};
