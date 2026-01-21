/**
 * SimulationEngine - Handles Blueprint runtime execution.
 * Extracted from services.js for code complexity reduction.
 */

/**
 * Handles the runtime execution of the Blueprint graph.
 */
export class SimulationEngine {
    constructor(app) {
        this.app = app;
        this.isRunning = false;
        this.playBtn = document.getElementById('play-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.consoleOutput = document.getElementById('compiler-results');
        this.simInterval = null;
    }

    /** Starts the simulation. */
    run() {
        if (this.isRunning) return;

        const isValid = this.app.compiler.validate();
        if (!isValid) {
            this.log("Simulation halted: Fix compiler errors before playing.", "error");
            return;
        }

        this.isRunning = true;
        this.updateUI();
        this.log("--- Simulation Started ---", "success");

        const startNodes = [...this.app.graph.nodes.values()].filter(n => n.nodeKey === 'EventBeginPlay');
        startNodes.forEach(node => {
            this.executeFlow(node);
        });
    }

    /** Stops the simulation. */
    stop() {
        this.isRunning = false;
        this.updateUI();
        this.log("--- Simulation Stopped ---", "error");
    }

    /** Updates Play/Stop button state and UI visual cues. */
    updateUI() {
        if (this.playBtn) this.playBtn.disabled = this.isRunning;
        if (this.stopBtn) this.stopBtn.disabled = !this.isRunning;

        if (this.isRunning) {
            this.app.graph.editor.style.boxShadow = 'inset 0 0 0 2px #4CAF50';
        } else {
            this.app.graph.editor.style.boxShadow = 'none';
        }
    }

    /** Logs runtime messages to the output panel. */
    log(msg, type = 'log') {
        const div = document.createElement('div');
        div.textContent = `[Runtime] ${msg}`;
        if (type === 'error') div.className = 'compiler-issue';
        else if (type === 'success') div.className = 'compiler-success';
        else div.className = 'compiler-log';
        this.consoleOutput.prepend(div);
    }

    /**
     * Asynchronously follows the execution flow from a starting node.
     * @param {Node} startNode - The node to begin execution from.
     */
    async executeFlow(startNode) {
        let currentNode = startNode;
        let steps = 0;
        const maxSteps = 5000;

        while (currentNode && this.isRunning && steps < maxSteps) {
            steps++;

            const nextPinId = await this.executeNodeLogic(currentNode);

            let outPin = null;
            if (nextPinId) {
                outPin = currentNode.findPinById(`${currentNode.id}-${nextPinId}`);
            } else {
                outPin = currentNode.pinsOut.find(p => p.type === 'exec');
            }

            if (!outPin || !outPin.isConnected()) {
                currentNode = null;
                break;
            }

            const linkId = outPin.links[0];
            const link = this.app.wiring.links.get(linkId);

            if (link) {
                currentNode = link.endPin.node;
            } else {
                currentNode = null;
            }
        }

        if (steps >= maxSteps) {
            this.log("Infinite loop detected or max steps reached. Stopping.", "error");
            this.stop();
        }
    }

    /** Executes the core logic of a specific node. */
    async executeNodeLogic(node) {
        switch (node.nodeKey) {
            case 'EventBeginPlay':
                return null;

            case 'PrintString':
                const strVal = this.evaluateInput(node, 'str_in');
                this.log(`Print: ${strVal}`);
                return null;

            case 'Branch':
                const condition = this.evaluateInput(node, 'cond_in');
                return condition ? 'exec_true' : 'exec_false';

            default:
                if (node.nodeKey.startsWith('Set_')) {
                    const varName = node.nodeKey.replace('Set_', '');
                    const val = this.evaluateInput(node, 'val_in');
                    const variable = this.app.variables.variables.get(varName);
                    if (variable) {
                        variable.defaultValue = val;
                    }
                    return null;
                }
                return null;
        }
    }

    /**
     * Recursively evaluates the value of an input pin.
     * @param {Node} node - The node requesting the value.
     * @param {string} pinLocalId - The local ID of the input pin.
     */
    evaluateInput(node, pinLocalId) {
        const fullPinId = `${node.id}-${pinLocalId}`;
        const pin = node.findPinById(fullPinId);

        if (!pin) return null;

        if (pin.isConnected()) {
            const linkId = pin.links[0];
            const link = this.app.wiring.links.get(linkId);
            const sourcePin = link.startPin;
            const sourceNode = sourcePin.node;
            return this.evaluateNodeValue(sourceNode, sourcePin);
        }

        const literal = node.pinLiterals.get(fullPinId);
        return literal !== undefined ? literal : pin.defaultValue;
    }

    /** Evaluates the return value of a node (Pure nodes). */
    evaluateNodeValue(node, outputPin) {
        if (node.nodeKey.startsWith('Get_')) {
            const varName = node.nodeKey.replace('Get_', '');
            const variable = this.app.variables.variables.get(varName);
            return variable ? variable.defaultValue : null;
        }

        if (node.nodeKey.startsWith('Conv_')) {
            const val = this.evaluateInput(node, 'val_in');
            return String(val);
        }

        if (node.nodeKey === 'AddInt') {
            const a = this.evaluateInput(node, 'a_in');
            const b = this.evaluateInput(node, 'b_in');
            return Number(a) + Number(b);
        }
        if (node.nodeKey === 'AddFloat') {
            const a = this.evaluateInput(node, 'a_in');
            const b = this.evaluateInput(node, 'b_in');
            return parseFloat(a) + parseFloat(b);
        }
        if (node.nodeKey === 'SubtractFloat') {
            const a = this.evaluateInput(node, 'a_in');
            const b = this.evaluateInput(node, 'b_in');
            return parseFloat(a) - parseFloat(b);
        }

        return null;
    }
}
