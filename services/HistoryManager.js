/**
 * HistoryManager - Manages undo/redo functionality.
 * Extracted from services.js for code complexity reduction.
 */

/**
 * Manages the history stack for undo/redo and handles application state persistence.
 */
export class HistoryManager {
    constructor(app, maxHistory = 50) {
        this.app = app;
        this.maxHistory = maxHistory;
        this.undoStack = [];
        this.redoStack = [];
        this.isPerformingHistoryAction = false;
        this.undoBtn = document.getElementById('undo-btn');
        this.redoBtn = document.getElementById('redo-btn');
        this.updateButtons();
    }

    /**
     * Captures the current application state and pushes it to the undo stack.
     * @param {string} actionType - Description of the action for logging.
     */
    saveState(actionType = 'action') {
        if (this.isPerformingHistoryAction) return;

        const nodesArray = (this.app.graph && this.app.graph.nodes) ? [...this.app.graph.nodes.values()] : [];
        const linksArray = (this.app.wiring && this.app.wiring.links) ? [...this.app.wiring.links.values()] : [];
        const variablesArray = (this.app.variables && this.app.variables.variables) ? [...this.app.variables.variables.values()] : [];

        const state = {
            nodes: nodesArray.map(node => ({
                id: node.id, title: node.title, x: node.x, y: node.y,
                type: node.type, nodeKey: node.nodeKey, icon: node.icon,
                isCollapsed: node.isCollapsed, pins: node.getPinsData(),
                customData: node.customData,
                variableId: node.variableId
            })),
            links: linksArray.map(link => ({
                id: link.id, startPinId: link.startPin.id, endPinId: link.endPin.id,
            })),
            variables: variablesArray,
            pendingRenames: this.app.compiler ? this.app.compiler.pendingRenames : []
        };

        const stateJSON = JSON.stringify(state);

        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1].state === stateJSON) {
            return;
        }

        this.undoStack.push({ state: stateJSON, action: actionType });

        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        this.redoStack = [];
        this.updateButtons();
        this.app.persistence.save();
    }

    /**
     * Applies a state retrieved from a stack to the application.
     * @param {string} stateJSON - The serialized state to load.
     */
    applyState(stateJSON) {
        this.isPerformingHistoryAction = true;
        try {
            const state = JSON.parse(stateJSON);

            if (this.app.graph && this.app.graph.nodes) this.app.graph.nodes.clear();
            if (this.app.wiring && this.app.wiring.links) this.app.wiring.links.clear();
            if (this.app.variables && this.app.variables.variables) this.app.variables.variables.clear();

            if (this.app.graph && this.app.graph.nodesContainer) this.app.graph.nodesContainer.innerHTML = '';
            if (this.app.wiring && this.app.wiring.svgGroup) {
                this.app.wiring.svgGroup.innerHTML = '<path id="ghost-wire" class="wire" style="pointer-events: none;"></path>';
            }

            if (this.app.variables) this.app.variables.loadState(state);
            if (this.app.graph) this.app.graph.loadState(state);

            if (this.app.compiler && state.pendingRenames) {
                this.app.compiler.pendingRenames = state.pendingRenames;
                if (state.pendingRenames.length > 0) {
                    this.app.compiler.markDirty();
                }
            }

            if (this.app.graph) this.app.graph.renderAllNodes();
            if (this.app.graph) this.app.graph.drawAllWires();
            if (this.app.graph) this.app.graph.updateTransform();
            if (this.app.details) this.app.details.clear();
            if (this.app.compiler) this.app.compiler.validate();
            if (this.app.graph) this.app.graph.clearSelection();
        } catch (e) {
            this.app.compiler.log(`Error performing history action: ${e.message}`, 'error');
            console.error("History Application Error:", e);
        } finally {
            this.isPerformingHistoryAction = false;
        }
    }

    /** Rolls back the state by one step. */
    undo() {
        if (this.undoStack.length < 2) return;

        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);

        const prevState = this.undoStack[this.undoStack.length - 1];
        if (prevState) {
            this.applyState(prevState.state);
            this.app.compiler.log(`Undo successful: Rolled back one ${prevState.action}.`);
        }

        this.updateButtons();
        this.app.persistence.save();
    }

    /** Rolls forward the state by one step. */
    redo() {
        if (this.redoStack.length === 0) return;

        const nextState = this.redoStack.pop();
        this.undoStack.push(nextState);

        this.applyState(nextState.state);
        this.app.compiler.log(`Redo successful: Reverted one ${nextState.action}.`);

        this.updateButtons();
        this.app.persistence.save();
    }

    /** Enables/disables the undo/redo buttons based on stack size. */
    updateButtons() {
        if (this.undoBtn && this.redoBtn) {
            this.undoBtn.disabled = this.undoStack.length <= 1;
            this.redoBtn.disabled = this.redoStack.length === 0;
        }
    }
}
