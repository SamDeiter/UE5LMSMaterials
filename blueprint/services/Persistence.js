/**
 * Persistence - Manages localStorage save/load.
 * Extracted from services.js for code complexity reduction.
 */

/**
 * Manages saving and loading from localStorage.
 */
export class Persistence {
    constructor(app, storageKey = 'blueprintGraph_v3') {
        this.storageKey = storageKey;
        this.timeoutId = null;
        this.app = app;
    }

    /** Saves the graph with a small delay to bundle quick changes. */
    autoSave(actionType = 'change') {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
            this.app.history.saveState(actionType);
            this.timeoutId = null;
        }, 500);
    }

    /** Serializes the latest state from history and saves it to localStorage. */
    save() {
        try {
            if (this.app.history.undoStack.length === 0) {
                return;
            }
            const stateJSON = this.app.history.undoStack[this.app.history.undoStack.length - 1].state;
            localStorage.setItem(this.storageKey, stateJSON);
            this.app.compiler.log("Graph saved to local storage.", "success");
        } catch (e) {
            console.error("Failed to save graph:", e);
            this.app.compiler.log(`Failed to save graph. Error: ${e.message}.`, "error");
        }
    }

    /** Loads the graph state from localStorage and initializes the history stack. */
    load() {
        try {
            const stateJSON = localStorage.getItem(this.storageKey);

            if (stateJSON) {
                this.app.history.undoStack.push({ state: stateJSON, action: 'initial load' });
                this.app.history.applyState(stateJSON);
                this.app.compiler.log("Graph loaded from previous session.");
            } else {
                this.loadDefaultGraph();
                this.app.compiler.log("Loaded default graph.");
            }
        } catch (e) {
            console.error("Failed to load or parse graph data:", e);
            localStorage.removeItem(this.storageKey);

            if (this.app.history.undoStack.length > 0) {
                this.app.history.undoStack = [];
                this.app.history.redoStack = [];
            }
            this.loadDefaultGraph();
            this.app.compiler.log("Failed to load graph, starting fresh.", 'error');
        }
    }

    /** Loads a simple default graph if no save file is found. */
    loadDefaultGraph() {
        if (this.app.graph) {
            this.app.graph.nodes.clear();
            this.app.graph.nodesContainer.innerHTML = '';
        }
        if (this.app.wiring) {
            this.app.wiring.links.clear();
            if (this.app.wiring.svgGroup) {
                this.app.wiring.svgGroup.innerHTML = '<path id="ghost-wire" class="wire" style="pointer-events: none;"></path>';
            }
        }

        if (this.app.graph && this.app.history) {
            this.app.graph.addNode("EventBeginPlay", 50, 50);
            this.app.graph.addNode("PrintString", 300, 50);
            this.app.history.saveState('default graph load');
        } else {
            console.error("Persistence.loadDefaultGraph: Required components (graph/history) are undefined.");
        }
    }
}
