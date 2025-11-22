import { NodeLibrary } from './utils.js';

/**
 * Simple compiler to validate the graph for errors.
 */
class Compiler {
    constructor(app) {
        this.output = document.getElementById('compiler-results');
        this.statusElement = document.getElementById('toolbar-status');
        this.countElement = document.getElementById('compiler-count');
        this.app = app;
        this.lastValidationErrors = 0;
        
        // Queue to store variable renames that haven't been applied to the graph yet
        this.pendingRenames = []; 
        this.isDirty = false;
    }
    
    /**
     * Logs a message to the compiler results panel.
     * @param {string} message - The message to log.
     * @param {'log' | 'error' | 'success'} [type='log'] - The type of message.
     * @returns {boolean} True if the message was an error.
     */
    log(message, type = 'log') {
        const div = document.createElement('div');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        if (type === 'error') div.className = 'compiler-issue';
        else if (type === 'success') div.className = 'compiler-success';
        else div.className = 'compiler-log';
        this.output.prepend(div);
        return type === 'error';
    }

    /** Registers a variable rename operation to be applied on Compile. */
    registerRename(oldName, newName) {
        this.pendingRenames.push({ oldName, newName });
        this.markDirty();
    }

    /** Marks the graph as needing compilation. */
    markDirty() {
        this.isDirty = true;
        if (this.statusElement) {
            this.statusElement.textContent = "Status: Dirty (Needs Compile)";
            this.statusElement.style.color = "#ffaa00";
        }
    }

    /** * Compiles the graph: Applies pending changes (renames) and runs validation.
     */
    compile() {
        this.log("Compiling...", "log");

        // 1. Apply pending variable renames to the graph nodes
        if (this.pendingRenames.length > 0) {
            this.pendingRenames.forEach(({ oldName, newName }) => {
                this.app.graph.updateVariableNodes(oldName, newName);
            });
            this.log(`Applied ${this.pendingRenames.length} pending variable rename(s).`);
            this.pendingRenames = [];
        }

        // 2. Run standard validation
        const isValid = this.validate();
        
        // 3. Update state
        this.isDirty = !isValid;
        
        if (isValid) {
            this.log("Compile Complete!", "success");
            // Clear any persistent dirty state
            this.app.persistence.autoSave(); 
        } else {
            this.log("Compile Failed.", "error");
        }

        // Force a redraw of wires to make them visible again (if they were hidden)
        this.app.graph.drawAllWires();
    }
    
    /** Runs validation rules on the entire graph. */
    validate() {
        this.output.innerHTML = '';
        this.log("Running validation...");
        
        let errorCount = 0;
        
        const singletonCounts = new Map();
        const customEventNames = new Set();

        // Validation Loop
        for (const node of this.app.graph.nodes.values()) {
            const nodeDef = NodeLibrary[node.nodeKey];
            
            // Rule 0: Check for Stale/Broken Variable Nodes
            if (node.nodeKey.startsWith('Get_') || node.nodeKey.startsWith('Set_')) {
                const varName = node.nodeKey.replace('Get_', '').replace('Set_', '');
                
                // Check 1: Does the variable exist by name?
                // We trim() the name to handle accidental whitespaces from user input
                if (!this.app.variables.variables.has(varName) && !this.app.variables.variables.has(varName.trim())) {
                    
                    // Check 2: Can we recover it by ID?
                    let recovered = false;
                    if (node.variableId) {
                        // Find variable by ID
                        const variable = [...this.app.variables.variables.values()].find(v => v.id === node.variableId);
                        
                        if (variable) {
                            // AUTO-FIX: We found the variable, but the name didn't match.
                            this.log(`Auto-fixing node "${node.title}": Name mismatch detected. Updating to "${variable.name}".`, 'log');
                            
                            // Update Key immediately
                            const newName = variable.name;
                            node.nodeKey = node.nodeKey.startsWith('Get_') ? `Get_${newName}` : `Set_${newName}`;
                            // Note: Title and Pins will be updated by the sync method below
                            
                            // Force complete refresh from template to ensure Pins (labels) match new variable name
                            this.app.graph.synchronizeNodeWithTemplate(node);
                            
                            recovered = true;
                        }
                    }

                    if (!recovered) {
                        this.log(`Error: Node "${node.title}" references a missing variable "${varName}". Recompile to fix.`, 'error');
                        errorCount++;
                        continue; 
                    }
                }
            }

            // Rule 1: Strict Singleton Check (BeginPlay, Tick, etc.)
            if (nodeDef && nodeDef.isSingleton) {
                const count = (singletonCounts.get(node.nodeKey) || 0) + 1;
                singletonCounts.set(node.nodeKey, count);
                
                if (count > 1) {
                    this.log(`Error: Duplicate event "${node.title}" detected. This event type must be unique in the graph.`, 'error');
                    errorCount++;
                }
            }

            // Rule 2: Custom Event Name Uniqueness Check
            if (node.nodeKey === 'CustomEvent') {
                if (customEventNames.has(node.title)) {
                     this.log(`Error: Ambiguous Custom Event "${node.title}". Multiple custom events cannot share the same name.`, 'error');
                     errorCount++;
                } else {
                    customEventNames.add(node.title);
                }
            }

            // REVISED Rule 3: Relaxed check for unconnected pins.
            // We no longer flag unconnected data pins as errors, because they have default/literal values.
        }
        
        this.lastValidationErrors = errorCount;

        // Update status
        if(this.countElement) this.countElement.textContent = errorCount;
        
        const statusText = errorCount === 0 ? "Status: Up to date" : `Status: ${errorCount} Error(s)`;
        const statusColor = errorCount === 0 ? "#888" : "#ff5555";

        if (this.statusElement) {
            this.statusElement.textContent = statusText;
            this.statusElement.style.color = statusColor;
        }

        return errorCount === 0;
    }
}

// ... (HistoryManager, Persistence, GridController, SimulationEngine unchanged) ...
/**
 * Manages the history stack for undo/redo and handles application state persistence.
 */
class HistoryManager {
    constructor(app, maxHistory = 50) {
        this.app = app;
        this.maxHistory = maxHistory;
        this.undoStack = [];
        this.redoStack = [];
        this.isPerformingHistoryAction = false;
        this.undoBtn = document.getElementById('undo-btn');
        this.redoBtn = document.getElementById('redo-btn');
        this.updateButtons(); // Initialize button states
    }

    /**
     * Captures the current application state (graph, links, variables) and pushes it to the undo stack.
     * Clears the redo stack.
     */
    saveState(actionType = 'action') {
        if (this.isPerformingHistoryAction) return;

        // 1. Serialize state (Defensive checks before reading .values())
        const nodesArray = (this.app.graph && this.app.graph.nodes) ? [...this.app.graph.nodes.values()] : [];
        const linksArray = (this.app.wiring && this.app.wiring.links) ? [...this.app.wiring.links.values()] : [];
        const variablesArray = (this.app.variables && this.app.variables.variables) ? [...this.app.variables.variables.values()] : [];

        const state = {
            nodes: nodesArray.map(node => ({
                id: node.id, title: node.title, x: node.x, y: node.y,
                type: node.type, nodeKey: node.nodeKey, icon: node.icon,
                isCollapsed: node.isCollapsed, pins: node.getPinsData(),
                customData: node.customData,
                variableId: node.variableId // ADDED: Save variable ID
            })),
            links: linksArray.map(link => ({
                id: link.id, startPinId: link.startPin.id, endPinId: link.endPin.id,
            })),
            variables: variablesArray,
            // Persist pending renames so they aren't lost on reload
            pendingRenames: this.app.compiler ? this.app.compiler.pendingRenames : []
        };

        const stateJSON = JSON.stringify(state);

        // 2. Check if the state is actually different from the last saved state
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1].state === stateJSON) {
            return;
        }

        // 3. Push to undo stack
        this.undoStack.push({ state: stateJSON, action: actionType });

        // 4. Truncate undo stack if necessary
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        // 5. Clear redo stack
        this.redoStack = [];
        
        this.updateButtons();
        // Automatically save the latest state to localStorage when the history state changes
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
            
            // 1. Clear current state (ULTRA-DEFENSIVE CHECKS: Resolves previous TypeErrors)
            if (this.app.graph && this.app.graph.nodes) this.app.graph.nodes.clear();
            if (this.app.wiring && this.app.wiring.links) this.app.wiring.links.clear();
            if (this.app.variables && this.app.variables.variables) this.app.variables.variables.clear();
            
            // Clear DOM elements
            if (this.app.graph && this.app.graph.nodesContainer) this.app.graph.nodesContainer.innerHTML = '';
            if (this.app.wiring && this.app.wiring.svgGroup) {
                // Ensure ghost wire path remains
                this.app.wiring.svgGroup.innerHTML = '<path id="ghost-wire" class="wire" style="pointer-events: none;"></path>';
            }

            // 2. Load the state. Must ensure variables load first to populate NodeLibrary
            if (this.app.variables) this.app.variables.loadState(state); // Loads variables & updates NodeLibrary
            if (this.app.graph) this.app.graph.loadState(state);     // Loads nodes and links (data model)
            
            // 3. Restore Compiler State (Pending Renames)
            if (this.app.compiler && state.pendingRenames) {
                this.app.compiler.pendingRenames = state.pendingRenames;
                if (state.pendingRenames.length > 0) {
                    this.app.compiler.markDirty();
                }
            }

            // 4. Re-render UI
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
        if (this.undoStack.length < 2) return; // Need at least two states (current + previous)

        // 1. Move current state from undo to redo
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);
        
        // 2. Load the previous state
        const prevState = this.undoStack[this.undoStack.length - 1];
        if (prevState) {
            this.applyState(prevState.state);
            this.app.compiler.log(`Undo successful: Rolled back one ${prevState.action}.`);
        }

        this.updateButtons();
        this.app.persistence.save(); // Save current state to local storage
    }

    /** Rolls forward the state by one step. */
    redo() {
        if (this.redoStack.length === 0) return;

        // 1. Move state from redo back to undo
        const nextState = this.redoStack.pop();
        this.undoStack.push(nextState);

        // 2. Apply the state
        this.applyState(nextState.state);
        this.app.compiler.log(`Redo successful: Reverted one ${nextState.action}.`);

        this.updateButtons();
        this.app.persistence.save(); // Save current state to local storage
    }
    
    /** Enables/disables the undo/redo buttons based on stack size. */
    updateButtons() {
        if (this.undoBtn && this.redoBtn) {
            this.undoBtn.disabled = this.undoStack.length <= 1;
            this.redoBtn.disabled = this.redoStack.length === 0;
        }
    }
}


/**
 * Manages saving and loading from localStorage (now delegates heavy lifting to HistoryManager).
 */
class Persistence {
    constructor(app, storageKey = 'blueprintGraph_v3') {
        this.storageKey = storageKey;
        this.timeoutId = null;
        this.app = app;
    }
    
    /** Saves the graph with a small delay to bundle quick changes. */
    autoSave(actionType = 'change') {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
            // Instead of saving directly to localStorage, we save to history.
            this.app.history.saveState(actionType);
            this.timeoutId = null;
        }, 500); // Wait 500ms after the last change to save
    }
    
    /** Serializes the latest state from history and saves it to localStorage. */
    save() {
        try {
            if (this.app.history.undoStack.length === 0) {
                 // Nothing to save if the undo stack is empty (should only happen on startup)
                 return;
            }
            // Use the JSON state from the top of the history stack
            const stateJSON = this.app.history.undoStack[this.app.history.undoStack.length - 1].state;
            
            localStorage.setItem(this.storageKey, stateJSON);
            this.app.compiler.log("Graph saved to local storage.", "success");
        } catch (e) {
            // CRITICAL: Log persistence failure explicitly
            console.error("Failed to save graph:", e);
            this.app.compiler.log(`Failed to save graph. Error: ${e.message}.`, "error");
        }
    }
    
    /** Loads the graph state from localStorage and initializes the history stack. */
    load() {
        try {
            const stateJSON = localStorage.getItem(this.storageKey);
            
            if (stateJSON) {
                // If saved state exists: push it to history and apply it.
                this.app.history.undoStack.push({ state: stateJSON, action: 'initial load' });
                this.app.history.applyState(stateJSON);
                this.app.compiler.log("Graph loaded from previous session.");
            } else {
                // If no saved state, load the default graph.
                this.loadDefaultGraph();
                this.app.compiler.log("Loaded default graph.");
            }
        } catch (e) {
            console.error("Failed to load or parse graph data:", e);
            // If parsing/loading fails, clear corrupted data and restart clean (default graph).
            localStorage.removeItem(this.storageKey); 
            
            // FIX: Ensure history stack is reset before loading default, and re-run loadDefaultGraph
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
        // Clear existing nodes and links in case this is called mid-load from a catch block
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
        
        // This helper only ADDS nodes, then calls history.saveState to capture the new state
        this.app.graph.addNode("EventBeginPlay", 50, 50);
        this.app.graph.addNode("PrintString", 300, 50);
        
        // FIX: Capture the state immediately here. HistoryManager handles adding it to the stack.
        this.app.history.saveState('default graph load');
    }
} 

/**
 * Draws the background grid on the canvas.
 */
class GridController {
    constructor(canvas, app) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.app = app;
        // Redraw grid if the window is resized
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas.parentElement);
        this.resize();
    }
    
    /** Resizes the canvas to fill its parent container. */
    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.draw();
    }
    
    /** Draws the background grid, respecting pan and zoom. */
    draw() {
        // CRITICAL FIX: Ensure app.graph and app.graph.pan exist before destructuring
        if (!this.app.graph || !this.app.graph.pan) {
             // Draw a simple background if initialization is incomplete
             this.ctx.fillStyle = '#222222';
             this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
             return; 
        }

        const { pan, zoom } = this.app.graph;
        const { width, height } = this.canvas;
        
        this.ctx.fillStyle = '#222222'; // Dark background
        this.ctx.fillRect(0, 0, width, height);
        
        const gridSizeSmall = 10 * zoom;
        const gridSizeLarge = 100 * zoom;

        // Calculate offsets for pan
        const transX = pan.x % gridSizeSmall;
        const transY = pan.y % gridSizeSmall;
        const transXLarge = pan.x % gridSizeLarge;
        const transYLarge = pan.y % gridSizeLarge;

        // Draw small grid lines
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        for (let x = transX; x < width; x += gridSizeSmall) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
        }
        for (let y = transY; y < height; y += gridSizeSmall) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
        }
        
        // Draw large grid lines
        this.ctx.strokeStyle = '#404040';
        this.ctx.lineWidth = 2;
        for (let x = transXLarge; x < width; x += gridSizeLarge) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
        }
        for (let y = transYLarge; y < height; y += gridSizeLarge) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
        }
    }
}

/**
 * Handles the runtime execution of the Blueprint graph.
 * Traversing execution pins and evaluating data dependencies.
 */
class SimulationEngine {
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

        // FORCE VALIDATION BEFORE RUNNING
        // In UE5, you cannot Play In Editor (PIE) if there are compiler errors.
        const isValid = this.app.compiler.validate();
        if (!isValid) {
            this.log("Simulation halted: Fix compiler errors before playing.", "error");
            return;
        }

        this.isRunning = true;
        this.updateUI();
        this.log("--- Simulation Started ---", "success");

        // Find all EventBeginPlay nodes to start execution
        const startNodes = [...this.app.graph.nodes.values()].filter(n => n.nodeKey === 'EventBeginPlay');
        
        // Even though validation ensures only 1 exists, we keep this generic loop structure.
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
             this.app.graph.editor.style.boxShadow = 'inset 0 0 0 2px #4CAF50'; // Green border
        } else {
             this.app.graph.editor.style.boxShadow = 'none';
        }
    }

    /** Logs runtime messages to the output panel. */
    log(msg, type='log') {
        const div = document.createElement('div');
        div.textContent = `[Runtime] ${msg}`;
        if (type === 'error') div.className = 'compiler-issue';
        else if (type === 'success') div.className = 'compiler-success';
        else div.className = 'compiler-log';
        this.consoleOutput.prepend(div);
    }

    /** * Asynchronously follows the execution flow from a starting node.
     * @param {Node} startNode - The node to begin execution from.
     */
    async executeFlow(startNode) {
        let currentNode = startNode;
        
        // Safety limiter to prevent infinite loops crashing the browser in this phase
        let steps = 0;
        const maxSteps = 5000; 

        while (currentNode && this.isRunning && steps < maxSteps) {
            steps++;
            
            // 1. Execute the specific logic for this node
            // Returns the ID of the output pin to follow (e.g., "exec_true"), or null for default
            const nextPinId = await this.executeNodeLogic(currentNode);
            
            // 2. Find the output execution pin to follow
            let outPin = null;
            if (nextPinId) {
                outPin = currentNode.findPinById(`${currentNode.id}-${nextPinId}`);
            } else {
                // Default: look for the first execution output pin
                outPin = currentNode.pinsOut.find(p => p.type === 'exec');
            }

            // If no valid output pin or it's unconnected, stop flow
            if (!outPin || !outPin.isConnected()) {
                currentNode = null;
                break;
            }

            // 3. Follow the wire to the next node
            const linkId = outPin.links[0]; // Execution pins only have one outgoing link
            const link = this.app.wiring.links.get(linkId);
            
            if (link) {
                currentNode = link.endPin.node;
                // Small delay to visualize flow could go here
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
                return null; // Pass through

            case 'PrintString':
                const strVal = this.evaluateInput(node, 'str_in');
                this.log(`Print: ${strVal}`);
                return null;
            
            case 'Branch':
                const condition = this.evaluateInput(node, 'cond_in');
                return condition ? 'exec_true' : 'exec_false';

            default:
                // Handle dynamic Set nodes
                if (node.nodeKey.startsWith('Set_')) {
                    const varName = node.nodeKey.replace('Set_', '');
                    const val = this.evaluateInput(node, 'val_in');
                    
                    const variable = this.app.variables.variables.get(varName);
                    if (variable) {
                        variable.defaultValue = val; // Update the runtime value
                        // Note: This mutates the 'default' value which persists in the UI.
                        // In a real engine, runtime state is separate from edit-time defaults.
                    }
                    return null;
                }
                return null;
        }
    }

    /** * Recursively evaluates the value of an input pin.
     * @param {Node} node - The node requesting the value.
     * @param {string} pinLocalId - The local ID of the input pin (e.g., 'a_in').
     */
    evaluateInput(node, pinLocalId) {
        const fullPinId = `${node.id}-${pinLocalId}`;
        const pin = node.findPinById(fullPinId);
        
        if (!pin) return null;

        // 1. If connected, pull value from the source node
        if (pin.isConnected()) {
            const linkId = pin.links[0]; // Data inputs only have one link
            const link = this.app.wiring.links.get(linkId);
            const sourcePin = link.startPin;
            const sourceNode = sourcePin.node;
            
            return this.evaluateNodeValue(sourceNode, sourcePin);
        }

        // 2. If not connected, use the literal value (or default)
        const literal = node.pinLiterals.get(fullPinId);
        return literal !== undefined ? literal : pin.defaultValue;
    }

    /** Evaluates the return value of a node (Pure nodes). */
    evaluateNodeValue(node, outputPin) {
        // 1. Variable Getters
        if (node.nodeKey.startsWith('Get_')) {
            const varName = node.nodeKey.replace('Get_', '');
            const variable = this.app.variables.variables.get(varName);
            return variable ? variable.defaultValue : null;
        }
        
        // 2. Type Conversions
        if (node.nodeKey.startsWith('Conv_')) {
             const val = this.evaluateInput(node, 'val_in');
             // Basic string conversion
             return String(val);
        }
        
        // 3. Math Nodes
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

export { Compiler, Persistence, GridController, HistoryManager, SimulationEngine };