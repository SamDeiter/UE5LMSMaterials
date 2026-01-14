/**
 * Main Application Logic for the UE5-style Blueprint Editor.
 * This is the main entry point that imports all other modules
 * and orchestrates the application.
 */

// Import all controllers
import { Pin, Node, WiringController, GraphController } from './graph.js';
import { VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController, LayoutController } from './ui.js';
import { Compiler, Persistence, GridController, HistoryManager, SimulationEngine } from './services.js';
// Cache bust the tests module to ensure latest export is found
import { TestRunner, registerTests } from './tests.js?v=2';
import { BlueprintValidator, SAMPLE_TASK } from './validator.js';
import { nodeRegistry } from './registries/NodeRegistry.js';
import { NodeDefinitions } from './data/NodeDefinitions.js';


/**
 * Main static application class to initialize and namespace all controllers.
 */
class BlueprintApp {
    /**
     * Initializes all controllers and loads the graph.
     */
    static init() {
        // Expose for inline events (onclick)
        window.app = BlueprintApp;

        console.log("Initializing BlueprintApp...");
        // Register static node definitions into the runtime registry
        // Ensures `graph.addNode(nodeKey, ...)` can find node definitions
        try {
            nodeRegistry.registerBatch(NodeDefinitions);
        } catch (err) {
            console.error('Failed to register NodeDefinitions:', err);
        }
        // DOM Elements - Fail early if missing
        const graphEditorEl = document.getElementById('graph-editor');
        const nodesContainerEl = document.getElementById('nodes-container');
        const graphSvgEl = document.getElementById('graph-svg');
        const graphCanvasEl = document.getElementById('graph-canvas');

        if (!graphEditorEl || !nodesContainerEl || !graphSvgEl || !graphCanvasEl) {
            console.error("Critical DOM elements missing. Initialization aborted.");
            return;
        }

        // --- Controller Initialization (Order is Crucial) ---

        // 0. Layout Controller (Resizers) - Needs to be early to bind to DOM
        BlueprintApp.layout = new LayoutController(BlueprintApp);

        // 1. Core Graph/Canvas Handlers 
        // Use local variable to ensure stability throughout init()
        const graphController = new GraphController(
            graphEditorEl,
            graphSvgEl,
            nodesContainerEl,
            BlueprintApp
        );
        BlueprintApp.graph = graphController;

        const gridController = new GridController(
            graphCanvasEl,
            BlueprintApp
        );
        BlueprintApp.grid = gridController;

        // 2. Data Model/UI Controllers
        BlueprintApp.wiring = new WiringController(graphSvgEl, BlueprintApp);
        BlueprintApp.variables = new VariableController(BlueprintApp);
        BlueprintApp.palette = new PaletteController(BlueprintApp);
        BlueprintApp.details = new DetailsController(BlueprintApp);

        // 3. Service Controllers
        // Pass BlueprintApp class, but controllers internally rely on the static props assigned above
        BlueprintApp.history = new HistoryManager(BlueprintApp);
        BlueprintApp.persistence = new Persistence(BlueprintApp);
        BlueprintApp.actionMenu = new ActionMenu(BlueprintApp);
        BlueprintApp.contextMenu = new ContextMenu(BlueprintApp);
        BlueprintApp.compiler = new Compiler(BlueprintApp);
        BlueprintApp.sim = new SimulationEngine(BlueprintApp);

        // 4. Test Runner
        BlueprintApp.testRunner = new TestRunner(BlueprintApp);
        registerTests(BlueprintApp.testRunner);
        window.runTests = () => BlueprintApp.testRunner.run();

        // 5. Blueprint Validator
        BlueprintApp.validator = new BlueprintValidator(BlueprintApp);
        window.validateSampleTask = () => BlueprintApp.validator.validateTask(SAMPLE_TASK);

        // --- Bind Events ---
        // Use the local variable 'graphController' to guarantee it exists
        if (graphController) {
            graphController.initEvents();
        } else {
            console.error("GraphController failed to initialize.");
        }

        // Trigger full compilation logic instead of just validation
        const compileBtn = document.getElementById('compile-btn');
        if (compileBtn) compileBtn.addEventListener('click', () => BlueprintApp.compiler.compile());

        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => BlueprintApp.persistence.save());

        // Bind Undo/Redo Buttons
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) undoBtn.addEventListener('click', () => BlueprintApp.history.undo());

        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) redoBtn.addEventListener('click', () => BlueprintApp.history.redo());

        // Bind Play/Stop Buttons
        const playBtn = document.getElementById('play-btn');
        if (playBtn) playBtn.addEventListener('click', () => BlueprintApp.sim.run());

        const stopBtn = document.getElementById('stop-btn');
        if (stopBtn) stopBtn.addEventListener('click', () => BlueprintApp.sim.stop());

        // Help Modal Events
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                const modal = document.getElementById('help-modal');
                if (modal) modal.style.display = 'flex';
            });
        }

        const helpCloseBtn = document.getElementById('help-modal-close');
        if (helpCloseBtn) {
            helpCloseBtn.addEventListener('click', () => {
                const modal = document.getElementById('help-modal');
                if (modal) modal.style.display = 'none';
            });
        }

        // --- Global Hotkeys ---
        document.addEventListener('keydown', (e) => {
            // Use e.target to strictly identify the element receiving the input
            const target = e.target;
            const tagName = target.tagName ? target.tagName.toUpperCase() : '';

            // Allow typing in inputs/textareas/contentEditable unless explicitly handled
            const isTextEditor = tagName === 'INPUT' ||
                tagName === 'TEXTAREA' ||
                target.isContentEditable;

            if (isTextEditor) {
                return;
            }

            if (e.ctrlKey) {
                if (e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    BlueprintApp.history.undo();
                    return;
                }
                if (e.key === 'y' || e.key === 'Y') {
                    e.preventDefault();
                    BlueprintApp.history.redo();
                    return;
                }
                if (e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    BlueprintApp.persistence.save();
                    return;
                }
                if (e.key === 'w' || e.key === 'W') {
                    e.preventDefault();
                    BlueprintApp.graph.duplicateSelectedNodes();
                    return;
                }
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();

                let wasDeleted = false;
                let varToDelete = null;

                // --- PRIORITY 1: CHECK FOR VARIABLE DELETION ---
                varToDelete = BlueprintApp.details.currentVariable;

                if (!varToDelete) {
                    const activeEl = document.activeElement;
                    if (activeEl) {
                        const focusedVarEl = activeEl.closest('.tree-item[data-var-id]');
                        if (focusedVarEl) {
                            const varId = focusedVarEl.dataset.varId;
                            varToDelete = [...BlueprintApp.variables.variables.values()].find(v => v.id === varId);
                        }
                    }
                }

                if (varToDelete) {
                    BlueprintApp.variables.deleteVariable(varToDelete); // Triggers confirmation modal
                    wasDeleted = true;
                }
                // 2. Check for selected nodes/links
                else if (BlueprintApp.graph.selectedNodes.size > 0 || BlueprintApp.wiring.selectedLinks.size > 0) {
                    BlueprintApp.graph.deleteSelectedNodes();
                    wasDeleted = true;
                }
            }

            if (e.key === 'F7') {
                e.preventDefault();
                BlueprintApp.compiler.compile();
            }
        });

        // --- Load & Render Sequence ---
        console.log("Loading state...");
        BlueprintApp.persistence.load();

        console.log("Rendering initial state...");

        // Use the local variable again to be safe
        if (graphController) {
            graphController.renderAllNodes();

            // Draw wires in the next frame.
            requestAnimationFrame(() => {
                graphController.drawAllWires();
            });
        }

        BlueprintApp.palette.populateList();
        BlueprintApp.compiler.validate();
        BlueprintApp.grid.draw();

        console.log("App Initialization Complete.");
    }
}

// Start the application once the DOM is fully loaded
window.addEventListener('load', () => {
    try {
        BlueprintApp.init.bind(BlueprintApp)();
    } catch (e) {
        // CRITICAL: Catch and log module/init errors that occur before the main body executes
        console.error("CRITICAL APP INITIALIZATION ERROR:", e.message, e);
    }
});