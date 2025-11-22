/**
 * Main Application Logic for the UE5-style Blueprint Editor.
 * This is the main entry point that imports all other modules
 * and orchestrates the application.
 */

// Import all controllers
import { Pin, Node, WiringController, GraphController } from './graph.js';
import { VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController, LayoutController } from './ui.js';
import { Compiler, Persistence, GridController, HistoryManager, SimulationEngine } from './services.js';


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

        // --- Controller Initialization (Order is Crucial) ---

        // 0. Layout Controller (Resizers) - Needs to be early to bind to DOM
        BlueprintApp.layout = new LayoutController(BlueprintApp);

        // 1. Core Graph/Canvas Handlers 
        BlueprintApp.graph = new GraphController(
            document.getElementById('graph-editor'),
            document.getElementById('graph-svg'),
            document.getElementById('nodes-container'),
            BlueprintApp
        );
        BlueprintApp.grid = new GridController(
            document.getElementById('graph-canvas'),
            BlueprintApp
        );

        // 2. Data Model/UI Controllers
        BlueprintApp.wiring = new WiringController(document.getElementById('graph-svg'), BlueprintApp);
        BlueprintApp.variables = new VariableController(BlueprintApp);
        BlueprintApp.palette = new PaletteController(BlueprintApp);
        BlueprintApp.details = new DetailsController(BlueprintApp);

        // 3. Service Controllers
        BlueprintApp.history = new HistoryManager(BlueprintApp);
        BlueprintApp.persistence = new Persistence(BlueprintApp);
        BlueprintApp.actionMenu = new ActionMenu(BlueprintApp);
        BlueprintApp.contextMenu = new ContextMenu(BlueprintApp);
        BlueprintApp.compiler = new Compiler(BlueprintApp);
        BlueprintApp.sim = new SimulationEngine(BlueprintApp); // Initialize Simulation Engine

        // --- Bind Events ---
        BlueprintApp.graph.initEvents();

        // CHANGED: Trigger full compilation logic instead of just validation
        document.getElementById('compile-btn').addEventListener('click', () => BlueprintApp.compiler.compile());
        document.getElementById('save-btn').addEventListener('click', () => BlueprintApp.persistence.save());

        // Bind Undo/Redo Buttons
        document.getElementById('undo-btn').addEventListener('click', () => BlueprintApp.history.undo());
        document.getElementById('redo-btn').addEventListener('click', () => BlueprintApp.history.redo());

        // Bind Play/Stop Buttons
        document.getElementById('play-btn').addEventListener('click', () => BlueprintApp.sim.run());
        document.getElementById('stop-btn').addEventListener('click', () => BlueprintApp.sim.stop());

        // Help Modal Events
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'flex';
        });
        document.getElementById('help-modal-close').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'none';
        });

        // --- Global Hotkeys ---
        document.addEventListener('keydown', (e) => {
            // Use e.target to strictly identify the element receiving the input
            const target = e.target;
            const tagName = target.tagName ? target.tagName.toUpperCase() : '';

            // Allow typing in inputs/textareas/contentEditable unless explicitly handled
            // We check isContentEditable (the property) which handles inherited editability correctly.
            const isTextEditor = tagName === 'INPUT' ||
                tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // If we are in a text editor, RETURN IMMEDIATELY.
            // This prevents the code below (Delete/Backspace) from running e.preventDefault(),
            // which allows the browser to perform the default action (deleting text).
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
                // We only reach here if isTextEditor is FALSE.
                e.preventDefault();

                let wasDeleted = false;
                let varToDelete = null;

                // --- PRIORITY 1: CHECK FOR VARIABLE DELETION ---
                varToDelete = BlueprintApp.details.currentVariable;

                if (!varToDelete) {
                    // Fallback: try to find variable selection in the DOM list if not in Details controller
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
                // CHANGED: Trigger full compilation logic
                BlueprintApp.compiler.compile();
            }
        });

        // Removed keyup listener for Space bar panning

        // --- Load & Render Sequence ---
        BlueprintApp.persistence.load();

        BlueprintApp.graph.renderAllNodes();
        BlueprintApp.palette.populateList();
        BlueprintApp.compiler.validate();
        BlueprintApp.grid.draw();

        // 3. Draw wires in the next frame.
        requestAnimationFrame(() => {
            BlueprintApp.graph.drawAllWires();
        });
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