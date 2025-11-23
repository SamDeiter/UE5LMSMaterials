/**
 * Automated Testing Framework for the Blueprint Editor.
 * Allows running integration tests to verify graph logic.
 */

export class TestRunner {
    constructor(app) {
        this.app = app;
        this.tests = [];
    }

    /**
     * Registers a new test case.
     * @param {string} name - Name of the test.
     * @param {Function} testFn - Async function containing test logic. Receives 'app' as argument.
     */
    addTest(name, testFn) {
        this.tests.push({ name, fn: testFn });
    }

    /**
     * Executes all registered tests sequentially.
     */
    async run() {
        console.group("--- Starting Tests ---");
        let passed = 0;
        let failed = 0;

        for (const test of this.tests) {
            try {
                console.log(`Running: ${test.name}`);
                // Reset state logic could go here if needed
                await test.fn(this.app);
                console.log(`%c✅ Passed: ${test.name}`, "color: #4CAF50");
                passed++;
            } catch (e) {
                console.error(`%c❌ Failed: ${test.name}`, "color: #ff5555", e);
                failed++;
            }
        }

        console.log(`%c--- Tests Complete: ${passed} Passed, ${failed} Failed ---`,
            failed === 0 ? "color: #4CAF50; font-weight: bold;" : "color: #ff5555; font-weight: bold;"
        );
        console.groupEnd();
        return failed === 0;
    }
}

/**
 * Registers standard integration tests for the application.
 * @param {TestRunner} runner 
 */
export function registerTests(runner) {
    runner.addTest("Graph Initialization", async (app) => {
        if (!app.graph) throw new Error("Graph controller not initialized");
        // Default graph should have at least 2 nodes (BeginPlay, PrintString)
        // We check > 0 to be safe, as exact count might vary if save data loaded
        if (app.graph.nodes.size === 0) throw new Error("Graph should have nodes, found 0");
    });

    runner.addTest("Variable Management", async (app) => {
        if (!app.variables) throw new Error("Variable controller missing");

        const initialCount = app.variables.variables.size;
        const newVar = app.variables.addVariable();

        if (!newVar) throw new Error("addVariable returned null");
        if (app.variables.variables.size !== initialCount + 1) {
            throw new Error("Variable count did not increment");
        }

        // Clean up
        app.variables.deleteVariable(newVar);
        if (app.variables.variables.size !== initialCount) {
            throw new Error("Variable deletion failed to restore count");
        }
    });

    runner.addTest("Node Addition", async (app) => {
        const node = app.graph.addNode("PrintString", 100, 100);
        if (!node) throw new Error("Failed to create PrintString node");

        const domEl = document.getElementById(node.id);
        if (!domEl) throw new Error("Node element not found in DOM");

        // Clean up
        app.graph.selectNode(node.id, false, 'new');
        app.graph.deleteSelectedNodes();

        if (app.graph.nodes.has(node.id)) throw new Error("Node deletion failed");
    });
}