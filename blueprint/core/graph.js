/**
 * Core Graph Logic: GraphController.
 * Pin and Node have been extracted to graph/Node.js
 * WiringController has been extracted to graph/WiringController.js
 * SelectionController has been extracted to graph/SelectionController.js
 * This file now manages the GraphController and all user interactions 
 * (pan, zoom, drag, wiring).
 */
import { Utils } from '../../shared/utils.js';
import { nodeRegistry } from '../registries/NodeRegistry.js';
import { WiringController } from './WiringController.js';
import { SelectionController } from './SelectionController.js';
import { Pin, Node } from './Node.js';

// Re-export for compatibility
export { Pin, Node };

class GraphController {
    constructor(editor, svg, nodesContainer, app) {
        this.editor = editor;
        this.svg = svg;
        this.nodesContainer = nodesContainer;
        this.app = app;
        this.nodes = new Map();
        this.zoomReadout = document.getElementById('zoom-readout');
        this.pan = { x: 0, y: 0 };
        this.zoom = 1;
        this.isPanning = false;
        this.isDraggingNode = false;
        this.isWiring = false;
        this.isRmbDown = false;
        this.isMarqueeing = false;
        this.isEditingLiteral = false; // New flag to prevent graph interaction
        this.hasDragged = false;
        this.activePin = null;
        // Selection is now delegated to SelectionController
        this.selection = new SelectionController(this);
        this.dragStart = { x: 0, y: 0 };
        this.nodeDragOffsets = new Map();
        this.marqueeStart = { x: 0, y: 0 };
        this.marqueeEl = document.getElementById('selection-marquee');
        this.handleGlobalMouseMove = this.handleGlobalMouseMove.bind(this);
        this.handleGlobalMouseUp = this.handleGlobalMouseUp.bind(this);
        
        // Backwards compatibility: expose selectedNodes as a getter
        Object.defineProperty(this, 'selectedNodes', {
            get: () => this.selection.selectedNodes,
            configurable: true
        });
    }


    /**
     * Initializes all event listeners for the graph editor.
     * Binds mouse, wheel, drag, and keyboard events.
     */
    initEvents() {
        this.editor.addEventListener('mousedown', this.handleEditorMouseDown.bind(this));
        this.editor.addEventListener('wheel', this.handleZoom.bind(this));
        this.editor.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        this.nodesContainer.addEventListener('contextmenu', this.handlePinContextMenu.bind(this));
        this.editor.addEventListener('dragover', this.handleDragOver.bind(this));
        this.editor.addEventListener('drop', this.handleDrop.bind(this));
        // Add delete listener
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selection.size > 0) {
                e.preventDefault();
                this.selection.deleteSelectedNodes();
            } else if (this.app.wiring.selectedLinks.size > 0) {
                e.preventDefault();
                this.app.wiring.deleteSelectedLinks();
            }
        }
        if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
            if (this.selection.size > 0) {
                e.preventDefault();
                this.selection.duplicateSelectedNodes(null, nodeRegistry, Utils, Node);
            }
        }
    }

    handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
    handleDrop(e) {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const graphCoords = this.getGraphCoords(e.clientX, e.clientY);
        if (data.startsWith('VARIABLE:')) {
            const varName = data.split(':')[1];
            let nodeKey = null;
            if (e.altKey) nodeKey = `Set_${varName}`;
            else if (e.ctrlKey) nodeKey = `Get_${varName}`;
            if (nodeKey) {
                this.addNode(nodeKey, graphCoords.x, graphCoords.y);
                this.app.persistence.autoSave();
            } else {
                this.app.actionMenu.show(e.clientX, e.clientY, null, varName);
            }
        }
        else if (data.startsWith('PALETTE_NODE:')) {
            const nodeType = data.split(':')[1];
            this.addNode(nodeType, graphCoords.x, graphCoords.y);
            this.app.persistence.autoSave();
        }
    }
    handleEditorMouseDown(e) {
        // If user is editing a text input, ignore mousedown on the graph background
        if (this.isEditingLiteral) {
            return;
        }

        this.hasDragged = false;
        this.app.wiring.clearLinkSelection();
        if (this.isMarqueeing) {
            this.isMarqueeing = false;
            this.marqueeEl.style.display = 'none';
        }

        const pinElement = e.target.closest('.pin-container');
        const nodeElement = e.target.closest('.node');

        // 1. Wiring Start
        if (pinElement && e.button === 0) {
            e.stopPropagation();
            e.preventDefault();
            this.isWiring = true;
            const pinId = pinElement.dataset.pinId;
            this.activePin = this.findPinById(pinId);

            if (e.altKey && this.activePin && this.activePin.isConnected()) {
                this.app.wiring.breakPinLinks(this.activePin.id);
            }

            // If the pin is connected and we are starting to drag *from* it, break the link automatically if it's an input pin (to avoid creating a loop/invalid state)
            if (this.activePin && this.activePin.dir === 'in' && this.activePin.isConnected()) {
                this.app.wiring.breakPinLinks(this.activePin.id);
                // After breaking, the activePin is now free to start a new connection, but we flip it to act as an output for the drag.
                // This is a common UE-style behavior, but for simplicity we treat it as an output pin starting a drag.
            }

            if (this.activePin) {
                this.app.wiring.updateGhostWire(e, this.activePin);
            }

            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            return;
        }

        // 2. Node Dragging/Selection
        if (nodeElement && e.button === 0) {
            e.stopPropagation();
            this.isDraggingNode = true;
            const mode = e.ctrlKey ? 'toggle' : (e.shiftKey ? 'add' : 'new');

            if (mode === 'new' && !this.selectedNodes.has(nodeElement.id)) {
                this.selectNode(nodeElement.id, false, 'new');
            } else if (mode !== 'new') {
                this.selectNode(nodeElement.id, true, mode);
            }

            const mouseGraphCoords = this.getGraphCoords(e.clientX, e.clientY);
            this.nodeDragOffsets.clear();
            for (const nodeId of this.selectedNodes) {
                const node = this.nodes.get(nodeId);
                if (node) {
                    this.nodeDragOffsets.set(nodeId, {
                        x: mouseGraphCoords.x - node.x,
                        y: mouseGraphCoords.y - node.y
                    });
                }
            }

            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            return;
        }

        // 3. Panning
        if (e.button === 2) { // Right mouse button
            e.preventDefault(); // Prevents context menu popup on initial mousedown
            this.isRmbDown = true;
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
            this.editor.classList.add('dragging');
            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            return;
        }

        // 4. Marqueeing (Click on background)
        if (e.button === 0) {
            this.isMarqueeing = true;
            this.marqueeStart.x = e.clientX;
            this.marqueeStart.y = e.clientY;
            // Position marquee relative to the editor container
            const rect = this.editor.getBoundingClientRect();
            this.marqueeEl.style.display = 'block';
            this.marqueeEl.style.left = `${e.clientX - rect.left}px`;
            this.marqueeEl.style.top = `${e.clientY - rect.top}px`;
            this.marqueeEl.style.width = '0px';
            this.marqueeEl.style.height = '0px';

            if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
                this.clearSelection();
            }

            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
        }
    }

    handleGlobalMouseMove(e) {
        if (e.movementX !== 0 || e.movementY !== 0) { this.hasDragged = true; }
        e.preventDefault();

        if (this.isRmbDown) { // Panning
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            this.pan.x += dx;
            this.pan.y += dy;
            this.updateTransform();
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
        }
        else if (this.isDraggingNode) { // Node Dragging
            const mouseGraphCoords = this.getGraphCoords(e.clientX, e.clientY);
            for (const nodeId of this.selectedNodes) {
                const node = this.nodes.get(nodeId);
                const offset = this.nodeDragOffsets.get(nodeId);
                if (node && offset) {
                    node.x = mouseGraphCoords.x - offset.x;
                    node.y = mouseGraphCoords.y - offset.y;
                    node.element.style.left = `${node.x}px`;
                    node.element.style.top = `${node.y}px`;
                    this.redrawNodeWires(node.id);
                }
            }
        }
        else if (this.isWiring) { // Wiring
            if (this.activePin) {
                this.app.wiring.updateGhostWire(e, this.activePin);
            }
        }
        else if (this.isMarqueeing) { // Marqueeing
            const rect = this.editor.getBoundingClientRect();
            const left = Math.min(e.clientX, this.marqueeStart.x) - rect.left;
            const top = Math.min(e.clientY, this.marqueeStart.y) - rect.top;
            const width = Math.abs(e.clientX - this.marqueeStart.x);
            const height = Math.abs(e.clientY - this.marqueeStart.y);
            this.marqueeEl.style.left = `${left}px`;
            this.marqueeEl.style.top = `${top}px`;
            this.marqueeEl.style.width = `${width}px`;
            this.marqueeEl.style.height = `${height}px`;
        }
    }

    handleGlobalMouseUp(e) {
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);

        if (this.isWiring) {
            const targetPinEl = e.target.closest('.pin-container');
            if (targetPinEl && this.activePin) {
                const endPinId = targetPinEl.dataset.pinId;
                const endPin = this.findPinById(endPinId);

                if (endPin && this.canConnect(this.activePin, endPin)) {
                    this.app.wiring.createConnection(this.activePin, endPin);
                } else if (endPin && !this.canConnect(this.activePin, endPin)) {
                    // Fail to connect, open action menu only if user dragged a lot
                    if (this.hasDragged) {
                        this.app.actionMenu.show(e.clientX, e.clientY, this.activePin);
                    }
                } else if (!endPin && this.hasDragged) {
                    // Drop on canvas, open action menu
                    this.app.actionMenu.show(e.clientX, e.clientY, this.activePin);
                    this.isWiring = false;
                    this.activePin = null;
                    this.app.wiring.updateGhostWire(null, null);
                    return;
                }
            } else if (this.activePin && this.hasDragged) {
                // Drop on canvas, open action menu
                this.app.actionMenu.show(e.clientX, e.clientY, this.activePin);
                this.isWiring = false;
                this.activePin = null;
                this.app.wiring.updateGhostWire(null, null);
                return;
            } else if (this.activePin && !this.hasDragged) {
                // Simple click on pin - just clear wiring mode
            }

            this.isWiring = false;
            this.activePin = null;
            this.app.wiring.updateGhostWire(null, null);
        }

        if (this.isDraggingNode) {
            this.isDraggingNode = false;
            this.snapSelectedNodesToGrid();
            this.nodeDragOffsets.clear();
            this.app.persistence.autoSave();
            this.app.compiler.markDirty();
        }

        if (this.isMarqueeing) {
            this.isMarqueeing = false;
            const marqueeRect = this.marqueeEl.getBoundingClientRect();
            this.marqueeEl.style.display = 'none';

            // Only select if there was movement
            if (this.hasDragged) {
                let mode = 'new';
                if (e.shiftKey) mode = 'add';
                else if (e.ctrlKey) mode = 'toggle';
                else if (e.altKey) mode = 'remove';
                this.selectNodesInRect(marqueeRect, mode);
            } else {
                // Simple click on background clears selection unless modifier key is held
                if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
                    this.clearSelection();
                }
            }
        }

        if (this.isRmbDown) { this.isRmbDown = false; }
        this.isPanning = false;
        this.editor.classList.remove('dragging');
        this.hasDragged = false;
        this.dragStart = { x: 0, y: 0 };
    }

    handleZoom(e) {
        e.preventDefault();

        // Prevent zoom if user is trying to scroll a node literal input field
        if (e.target.closest('.node-literal-input')) {
            return;
        }

        const scaleAmount = 1.1;
        const rect = this.editor.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const mouseGraphX_before = (mouseX - this.pan.x) / this.zoom;
        const mouseGraphY_before = (mouseY - this.pan.y) / this.zoom;

        if (e.deltaY < 0) this.zoom *= scaleAmount;
        else this.zoom /= scaleAmount;

        this.zoom = Math.max(0.2, Math.min(this.zoom, 1.5));

        this.pan.x = mouseX - mouseGraphX_before * this.zoom;
        this.pan.y = mouseY - mouseGraphY_before * this.zoom;

        this.updateTransform();
        this.app.grid.draw();
        this.zoomReadout.textContent = `${Math.round(this.zoom * 100)}%`;

        // Redraw all wires after zoom/pan
        this.drawAllWires();
    }

    handleContextMenu(e) {
        e.preventDefault();
        if (e.target.closest('.node')) { return; }
        this.app.actionMenu.show(e.clientX, e.clientY, null);
    }

    handlePinContextMenu(e) {
        const pinContainerEl = e.target.closest('.pin-container');
        if (pinContainerEl) {
            e.preventDefault();
            e.stopPropagation();
            const pinId = pinContainerEl.dataset.pinId;
            const pin = this.findPinById(pinId);

            if (!pin || pin.type === 'exec') return;

            const items = [
                { label: `Promote to Variable`, callback: () => this.promotePinToVariable(pin) }
            ];

            // Add custom event options if applicable
            const node = pin.node;
            if (node.nodeKey === 'CustomEvent' && pin.isCustom) {
                items.push({ label: '---', callback: () => { } });
                items.push({ label: `Remove Pin: ${pin.name}`, callback: () => this.removeCustomPin(node.id, pin.id) });
            }

            this.app.contextMenu.show(e.clientX, e.clientY, items);
        }
    }

    /**
     * Creates and adds a new node to the graph.
     * @param {string} nodeKey - The node type key from NodeRegistry.
     * @param {number} x - X position in graph coordinates.
     * @param {number} y - Y position in graph coordinates.
     * @returns {Node|null} The created node, or null if failed.
     */
    addNode(nodeKey, x, y) {
        const nodeData = nodeRegistry.get(nodeKey);
        if (!nodeData) return null;

        // Check for Singleton
        if (nodeData.isSingleton) {
            const existingNode = [...this.nodes.values()].find(n => n.nodeKey === nodeKey);
            if (existingNode) {
                this.selectNode(existingNode.id, false, 'new');
                console.warn(`Cannot add ${nodeData.title}: Only one instance allowed.`);
                return null;
            }
        }

        const id = Utils.uniqueId('node');
        const node = new Node(id, nodeData, x, y, nodeKey, this.app);
        this.nodes.set(id, node);
        const nodeEl = node.render();
        this.nodesContainer.appendChild(nodeEl);
        this.app.compiler.markDirty();
        return node;
    }

    removeCustomPin(nodeId, pinId) {
        const node = this.nodes.get(nodeId);
        if (!node || node.nodeKey !== 'CustomEvent') return;

        const pinToRemove = node.findPinById(pinId);
        if (!pinToRemove || !pinToRemove.isCustom) return;

        // 1. Break all links to the pin
        this.app.wiring.breakPinLinks(pinId);

        // 2. Remove pin from node's array and literals map
        node.pins = node.pins.filter(p => p.id !== pinId);
        node.pinLiterals.delete(pinId);

        // 3. Refresh caches and visuals
        node.refreshPinCache();
        this.app.wiring.updateVisuals(node);

        // 4. Update details panel if this node is selected
        if (this.selectedNodes.has(nodeId) && this.app.details) {
            this.app.details.showNodeDetails(node);
        }

        this.app.persistence.autoSave();
        this.app.compiler.markDirty();
    }

    /**
     * Duplicates all currently selected nodes.
     * Preserves internal connections between duplicated nodes.
     */
    duplicateSelectedNodes() {
        if (this.selectedNodes.size === 0) {
            this.app.wiring.deleteSelectedLinks();
            return;
        }

        const oldToNewPinIds = new Map();
        const newSelection = [];
        const offset = 20;
        const originalNodes = Array.from(this.selectedNodes).map(id => this.nodes.get(id)).filter(n => n);

        for (const oldNode of originalNodes) {
            // Re-create nodeData structure to ensure all properties (like title/type) are included
            const nodeData = nodeRegistry.get(oldNode.nodeKey);
            if (!nodeData) continue;

            // Handle custom pin data for dynamic nodes (like CustomEvent)
            const pinsToUse = oldNode.nodeKey === 'CustomEvent' ? oldNode.getPinsData().map(p => ({
                id: p.id, name: p.name, type: p.type, dir: p.dir, containerType: p.containerType, isCustom: p.isCustom
            })) : nodeData.pins;

            const newNodeData = {
                ...nodeData,
                title: oldNode.title,
                variableType: oldNode.variableType,
                variableId: oldNode.variableId,
                customData: { ...oldNode.customData },
                pins: pinsToUse // Use the determined pin structure
            };

            const id = Utils.uniqueId('node');
            const newNode = new Node(id, newNodeData, oldNode.x + offset, oldNode.y + offset, oldNode.nodeKey, this.app);

            // Transfer pin literal values
            oldNode.pinLiterals.forEach((value, pinId) => {
                const oldPinIdRelative = pinId.replace(`${oldNode.id}-`, '');
                const newPin = newNode.pins.find(p => p.id.endsWith(oldPinIdRelative));
                if (newPin) {
                    newNode.pinLiterals.set(newPin.id, value);
                }
            });

            this.nodes.set(id, newNode);
            this.nodesContainer.appendChild(newNode.render());
            newSelection.push(newNode.id);

            oldNode.pins.forEach((oldPin, index) => {
                const newPin = newNode.pins.find(p => p.name === oldPin.name && p.dir === oldPin.dir); // Find by name/dir in case pin order changed
                if (newPin) {
                    oldToNewPinIds.set(oldPin.id, newPin.id);
                }
            });
        }

        // Duplicate internal connections
        for (const link of this.app.wiring.links.values()) {
            const startNodeIsSelected = this.selectedNodes.has(link.startPin.node.id);
            const endNodeIsSelected = this.selectedNodes.has(link.endPin.node.id);

            if (startNodeIsSelected && endNodeIsSelected) {
                const newStartPinId = oldToNewPinIds.get(link.startPin.id);
                const newEndPinId = oldToNewPinIds.get(link.endPin.id);

                if (newStartPinId && newEndPinId) {
                    const newStartPin = this.findPinById(newStartPinId);
                    const newEndPin = this.findPinById(newEndPinId);

                    if (newStartPin && newEndPin && this.canConnect(newStartPin, newEndPin)) {
                        this.app.wiring.createConnection(newStartPin, newEndPin);
                    }
                }
            }
        }

        this.app.wiring.clearLinkSelection();
        this.clearSelection();
        newSelection.forEach(nodeId => this.selectNode(nodeId, true, 'add'));
        this.app.persistence.autoSave();
        this.app.compiler.markDirty();
    }

    findPinById(pinId) {
        if (!pinId) return null;
        // The format is usually 'node-id-part1-pinName'
        const parts = pinId.split('-');
        if (parts.length < 2) return null;

        // Find the node ID part, which could be 'node-XXXX' or similar
        // We try to reconstruct the Node ID by iterating from the end
        let nodeId = parts[0];
        const pinName = parts.slice(1).join('-');

        // Assuming node IDs are 'node-UUID' where UUID is 8 characters (or just UUID if the 'node-' prefix is removed)
        // More robust: search for a node ID that is a prefix of pinId
        const nodeIds = Array.from(this.nodes.keys());

        for (const id of nodeIds) {
            if (pinId.startsWith(id)) {
                nodeId = id;
                break;
            }
        }

        const node = this.nodes.get(nodeId);
        return node ? node.findPinById(pinId) : null;
    }

    /**
     * Checks if two pins can be connected.
     * Validates direction, type compatibility, and max links.
     * @param {Pin} pinA - First pin.
     * @param {Pin} pinB - Second pin.
     * @returns {boolean} True if connection is valid.
     */
    canConnect(pinA, pinB) {
        if (!pinA || !pinB || !pinA.node || !pinB.node) return false;
        if (pinA.node.id === pinB.node.id) return false;
        if (pinA.dir === pinB.dir) return false;

        const startPin = pinA.dir === 'out' ? pinA : pinB;
        const endPin = pinA.dir === 'in' ? pinA : pinB;

        // If the end pin already has max links, prevent connection
        if (endPin.links.length >= endPin.getMaxLinks()) return false;

        // Check container type match (single, array, set, map)
        if (startPin.containerType !== endPin.containerType) return false;

        // Check type match or executable type
        if (startPin.type === endPin.type) return true;
        if (startPin.type === 'exec' && endPin.type === 'exec') return true;

        // Check for implicit conversion
        const conversionKey = Utils.getConversionNodeKey(startPin.type, endPin.type);
        if (conversionKey) return true;

        return false;
    }

    promotePinToVariable(pin) {
        const newVariable = this.app.variables.createVariableFromPin(pin);

        let nodeToSpawnKey;
        if (pin.dir === 'in') {
            nodeToSpawnKey = `Get_${newVariable.name}`;
        } else {
            nodeToSpawnKey = `Set_${newVariable.name}`;
        }

        // Calculate position offset relative to the pin's center
        const pinPos = Utils.getPinPosition(pin.element, this.app);
        const x = pinPos.x - 10;
        const y = pinPos.y - 15;

        const newNode = this.app.graph.addNode(nodeToSpawnKey, x, y);

        if (newNode) {
            const targetPinName = (pin.dir === 'in') ? 'val_out' : 'val_in';
            const newPin = newNode.pins.find(p => p.id.endsWith(targetPinName));

            // Connect the pin being promoted to the new variable node
            if (newPin) {
                // If the pin being promoted is an input pin, the Get node output connects to it (newPin is the output)
                // If the pin being promoted is an output pin, the Set node input connects to it (newPin is the input)
                if (pin.dir === 'in') {
                    this.app.wiring.createConnection(newPin, pin); // newPin (out) -> pin (in)
                } else {
                    this.app.wiring.createConnection(pin, newPin); // pin (out) -> newPin (in)
                }
            }
        }

        this.app.persistence.autoSave();
    }

    updateVariableNodes(oldName, newName) {
        const getKey = `Get_${oldName}`;
        const setKey = `Set_${oldName}`;

        for (const node of this.nodes.values()) {
            if (node.nodeKey === getKey || node.nodeKey === setKey) {
                const newKey = node.nodeKey === getKey ? `Get_${newName}` : `Set_${newName}`;
                node.nodeKey = newKey;
                this.synchronizeNodeWithTemplate(node);
            }
        }
    }

    /**
     * Synchronizes a node instance with its template definition from the NodeRegistry.
     * Updates the node's title, pins, and preserves existing connections and literal values.
     * @param {Node} node - The node instance to synchronize.
     */
    synchronizeNodeWithTemplate(node) {
        const template = nodeRegistry.get(node.nodeKey);
        if (!template) return;

        node.title = template.title;
        node.type = template.type || 'pure-node';
        node.icon = template.icon;
        node.devWarning = template.devWarning;
        node.variableType = template.variableType;
        node.variableId = template.variableId;
        node.customData = template.customData || {};

        const oldPinsMap = new Map(node.pins.map(p => [p.id, p]));
        const oldLiterals = new Map(node.pinLiterals);

        const newPins = [];
        const newLiterals = new Map();

        // 1. Create new pins based on template, transferring links and literals if the pin ID matches
        template.pins.forEach(pData => {
            const newPin = new Pin(node, pData);
            const fullPinId = newPin.id;
            const oldPin = oldPinsMap.get(fullPinId);

            if (oldPin) {
                // Transfer links, default value, and literal value
                newPin.links = oldPin.links;
                // Preserve the runtime literal value
                newLiterals.set(fullPinId, oldLiterals.get(fullPinId));

                // Update links to point to the new Pin instance
                newPin.links.forEach(linkId => {
                    const link = this.app.wiring.links.get(linkId);
                    if (link) {
                        if (link.startPin.id === fullPinId) link.startPin = newPin;
                        if (link.endPin.id === fullPinId) link.endPin = newPin;
                    }
                });
            } else {
                // Use default literal value for new pins
                newLiterals.set(fullPinId, newPin.defaultValue);
            }
            newPins.push(newPin);
        });

        // 2. Cleanup pins/literals/links for pins that no longer exist (e.g., when changing variable type and pins change)
        oldPinsMap.forEach((oldPin, oldId) => {
            if (!newPins.some(p => p.id === oldId)) {
                // Pin was removed: break its links
                this.app.wiring.breakPinLinks(oldId);
            }
        });


        node.pins = newPins;
        node.pinLiterals = newLiterals;

        node.refreshPinCache();
        this.app.wiring.updateVisuals(node);
        this.redrawNodeWires(node.id);
    }

    /**
     * Selects or deselects a node based on the mode.
     * @param {string} nodeId - The node ID to select.
     * @param {boolean} addToSelection - If true, adds to current selection.
     * @param {string} mode - Selection mode: 'add', 'remove', 'toggle', 'new'.
     */
    selectNode(nodeId, addToSelection = false, mode = 'toggle') {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // If not adding to selection, clear existing selection once
        if (!addToSelection) {
            this.clearSelection();
        }

        let shouldSelect = false;
        if (mode === 'add') {
            shouldSelect = true;
        } else if (mode === 'remove') {
            shouldSelect = false;
        } else if (mode === 'toggle') {
            shouldSelect = !this.selectedNodes.has(nodeId);
        } else if (mode === 'new') {
            shouldSelect = true;
        }

        if (shouldSelect) {
            this.selectedNodes.add(nodeId);
            node.element.classList.add('selected');
        } else {
            this.selectedNodes.delete(nodeId);
            node.element.classList.remove('selected');
        }

        // Handle details panel display
        if (this.selectedNodes.size === 1) {
            const selectedNode = this.nodes.get([...this.selectedNodes][0]);
            this.app.details.showNodeDetails(selectedNode);
        } else {
            this.app.details.clear();
        }
    }

    /**
     * Clears all selected nodes.
     */
    clearSelection() {
        this.selectedNodes.forEach(nodeId => {
            const node = this.nodes.get(nodeId);
            if (node) node.element.classList.remove('selected');
        });
        this.selectedNodes.clear();
        this.app.details.clear();
    }

    selectNodesInRect(rect, mode) {
        for (const node of this.nodes.values()) {
            const nodeRect = node.element.getBoundingClientRect();
            // Check if node rect intersects with selection rect
            const intersects = (
                nodeRect.left < rect.right &&
                nodeRect.right > rect.left &&
                nodeRect.top < rect.bottom &&
                nodeRect.bottom > rect.top
            );

            if (intersects) {
                // Marquee selects the node
                this.selectNode(node.id, true, mode);
            } else if (mode === 'new') {
                // In 'new' mode, if it doesn't intersect, ensure it's unselected
                this.selectedNodes.delete(node.id);
                node.element.classList.remove('selected');
            }
        }

        // Re-run selectNode logic for the final set to ensure details panel is updated correctly
        if (this.selectedNodes.size === 1) {
            this.app.details.showNodeDetails(this.nodes.get([...this.selectedNodes][0]));
        } else {
            this.app.details.clear();
        }
    }

    /**
     * Deletes all currently selected nodes and their connections.
     */
    deleteSelectedNodes() {
        if (this.selectedNodes.size === 0) return;

        // Convert to array to allow deletion while iterating
        const nodesToDelete = Array.from(this.selectedNodes);

        for (const nodeId of nodesToDelete) {
            const node = this.nodes.get(nodeId);
            if (!node) continue;

            // 1. Break all associated wires
            node.pins.forEach(pin => {
                this.app.wiring.breakPinLinks(pin.id);
            });

            // 2. Remove node element from DOM
            node.element.remove();

            // 3. Remove node from graph map
            this.nodes.delete(nodeId);
        }

        this.selectedNodes.clear();
        this.app.details.clear();
        this.app.persistence.autoSave();
        this.app.compiler.markDirty();
    }

    snapSelectedNodesToGrid() {
        const gridSize = 10;
        for (const nodeId of this.selectedNodes) {
            const node = this.nodes.get(nodeId);
            if (node) {
                node.x = Math.round(node.x / gridSize) * gridSize;
                node.y = Math.round(node.y / gridSize) * gridSize;
                node.element.style.left = `${node.x}px`;
                node.element.style.top = `${node.y}px`;
                this.redrawNodeWires(node.id);
            }
        }
    }

    /**
     * Updates the CSS transform for pan and zoom.
     */
    updateTransform() {
        const transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
        this.nodesContainer.style.transform = transform;
        const svgTransform = `translate(${this.pan.x}, ${this.pan.y}) scale(${this.zoom})`;
        this.app.wiring.svgGroup.setAttribute('transform', svgTransform);
        this.app.grid.draw();
        // Redraw wires on transform update to ensure ghost wire is correctly positioned during pan/zoom
        this.drawAllWires();
    }

    /**
     * Redraws all wires connected to a specific node.
     * @param {string} nodeId - The node ID whose wires to redraw.
     */
    redrawNodeWires(nodeId) {
        this.app.wiring.findLinksByNodeId(nodeId).forEach(link => this.app.wiring.drawWire(link));
    }

    /**
     * Redraws all wire connections in the graph.
     */
    drawAllWires() {
        // Find all wires and ensure they are redrawn
        for (const link of this.app.wiring.links.values()) {
            this.app.wiring.drawWire(link);
        }
    }

    /**
     * Renders all nodes in the graph to the DOM.
     */
    renderAllNodes() {
        this.nodesContainer.innerHTML = '';
        for (const node of this.nodes.values()) {
            this.nodesContainer.appendChild(node.render());
        }
    }

    /**
     * Converts screen coordinates to graph coordinates.
     * @param {number} clientX - Screen X position.
     * @param {number} clientY - Screen Y position.
     * @returns {{x: number, y: number}} Graph coordinates.
     */
    getGraphCoords(clientX, clientY) {
        const rect = this.editor.getBoundingClientRect();
        const x = (clientX - rect.left - this.pan.x) / this.zoom;
        const y = (clientY - rect.top - this.pan.y) / this.zoom;
        return { x, y };
    }

    loadState(state) {
        // Ensure state is an object, or default to an empty object
        const safeState = state || {};
        const safeNodes = safeState.nodes || [];
        const safeLinks = safeState.links || [];

        // Clear existing state
        this.nodes.clear();
        this.app.wiring.links.clear();
        this.clearSelection();
        this.app.wiring.clearLinkSelection();

        // 1. Load Nodes
        safeNodes.forEach((nodeData) => {
            const template = nodeRegistry.get(nodeData.nodeKey);
            if (!template) {
                console.warn(`Skipping node during load: Key '${nodeData.nodeKey}' not found in NodeRegistry.`);
                return;
            }

            // Determine the final pin definition to use: saved pins (for dynamic nodes) or template pins (for static nodes)
            let pinsToLoad = template.pins;

            // If the node is a Custom Event (or other dynamic node) AND saved pins exist
            if (nodeData.nodeKey === 'CustomEvent') {
                // Check if saved pins contains custom pins (more than the base exec/delegate pins)
                const hasCustomPins = nodeData.pins && nodeData.pins.some(p => p.isCustom);
                if (hasCustomPins) {
                    pinsToLoad = nodeData.pins;
                }
            } else if (nodeData.nodeKey.startsWith('Func_') && nodeData.pins) {
                // Function call pins may change. We should handle merging the template and saved pins if needed, 
                // but for simplicity here, we assume if we have saved pins, we use them to restore literal values/structure if dynamic.
            }

            const fullNodeData = { ...template, ...nodeData, pins: pinsToLoad };
            const node = new Node(nodeData.id, fullNodeData, nodeData.x, nodeData.y, nodeData.nodeKey, this.app);
            this.nodes.set(node.id, node);

            // Restore literal values
            if (nodeData.pins) {
                nodeData.pins.forEach(savedPin => {
                    // Normalize saved pin ID to match the runtime Pin ID format
                    const fullPinId = savedPin.id.includes(node.id) ? savedPin.id : `${node.id}-${savedPin.id}`;
                    const pin = node.findPinById(fullPinId);

                    if (pin && savedPin.literalValue !== undefined) {
                        node.pinLiterals.set(pin.id, savedPin.literalValue);
                    } else if (pin) {
                        // Ensure a default is set if literalValue was missing or undefined
                        node.pinLiterals.set(pin.id, pin.defaultValue);
                    }
                });
            }
        });

        // 2. Load Links
        safeLinks.forEach(linkData => {
            const startPin = this.findPinById(linkData.startPinId);
            const endPin = this.findPinById(linkData.endPinId);

            if (startPin && endPin) {
                const link = { id: linkData.id, startPin, endPin };
                this.app.wiring.links.set(link.id, link);
                startPin.links.push(link.id);
                endPin.links.push(link.id);
            } else {
                console.warn(`Skipping link during load due to missing pin: ${linkData.id}`);
            }
        });

        // 3. Render and Redraw
        // The second CRITICAL APP INITIALIZATION ERROR trace points to a failure related to 'renderAllNodes'.
        // This is where the graph should be re-rendered after loading data.
        this.renderAllNodes();
        this.drawAllWires();

        // 4. Restore Pan/Zoom
        if (safeState.pan) this.pan = safeState.pan;
        if (safeState.zoom) this.zoom = safeState.zoom;
        this.updateTransform();
    }
}

export { Pin, Node, WiringController, GraphController };