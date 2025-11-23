
import os

file_path = r'c:\Users\Sam Deiter\Desktop\UE5LMSBlueprint-main\graph.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the start of getPinsData
start_index = -1
for i, line in enumerate(lines):
    if 'getPinsData() {' in line:
        start_index = i
        break

if start_index == -1:
    print("Could not find getPinsData")
    exit(1)

# Keep everything before getPinsData
new_content = lines[:start_index]

# Append the correct code
correct_code = """    getPinsData() {
        return this.pins.map(p => ({
            id: p.id ? p.id.replace(`${this.id}-`, '') : 'CORRUPTED',
            name: p.name,
            type: p.type,
            dir: p.dir,
            containerType: p.containerType,
            literalValue: this.pinLiterals.get(p.id),
            isCustom: p.isCustom
        }));
    }
}

class WiringController {
    constructor(svg, app) {
        this.svgGroup = svg.getElementById('wire-group');
        this.ghostWire = svg.getElementById('ghost-wire');
        this.links = new Map();
        this.selectedLinks = new Set();
        this.app = app;
    }
    findLink(linkId) { return this.links.get(linkId); }
    findLinksByNodeId(nodeId) { return [...this.links.values()].filter(l => l.startPin.node.id === nodeId || l.endPin.node.id === nodeId); }
    findLinksByPinId(pinId) { return [...this.links.values()].filter(l => l.startPin.id === pinId || l.endPin.id === pinId); }
    toggleLinkSelection(linkId) {
        const wireEl = document.getElementById(linkId);
        this.app.graph.clearSelection();
        if (!this.selectedLinks.has(linkId)) {
            this.clearLinkSelection();
            this.selectedLinks.add(linkId);
            if (wireEl) wireEl.classList.add('link-selected');
        } else {
            this.selectedLinks.delete(linkId);
            if (wireEl) wireEl.classList.remove('link-selected');
        }
    }
    clearLinkSelection() {
        this.selectedLinks.forEach(linkId => {
            const wireEl = document.getElementById(linkId);
            if (wireEl) wireEl.classList.remove('link-selected');
        });
        this.selectedLinks.clear();
    }
    createConnection(pinA, pinB) {
        if (!pinA || !pinB) return;
        const startPin = pinA.dir === 'out' ? pinA : pinB;
        const endPin = pinA.dir === 'in' ? pinA : pinB;
        if (endPin.getMaxLinks() === 1 && endPin.isConnected()) {
            this.breakPinLinks(endPin.id);
        }
        const isExecPin = startPin.type === 'exec' || endPin.type === 'exec';
        const typesMatch = startPin.type === endPin.type;
        if (!isExecPin && !typesMatch) {
            const convKey = Utils.getConversionNodeKey(startPin.type, endPin.type);
            if (convKey) {
                const startPos = Utils.getPinPosition(startPin.element, this.app);
                const endPos = Utils.getPinPosition(endPin.element, this.app);
                const midX = (startPos.x + endPos.x) / 2;
                const midY = (startPos.y + endPos.y) / 2;
                const convNode = this.app.graph.addNode(convKey, midX - 40, midY - 15);
                if (convNode) {
                    const convIn = convNode.findPinById(`${convNode.id}-val_in`);
                    const convOut = convNode.findPinById(`${convNode.id}-val_out`);
                    if (convIn && convOut) {
                        this._addLink(startPin, convIn);
                        this._addLink(convOut, endPin);
                        this.updateVisuals(startPin.node);
                        this.updateVisuals(convNode);
                        this.updateVisuals(endPin.node);
                        requestAnimationFrame(() => {
                            this.app.graph.redrawNodeWires(startPin.node.id);
                            this.app.graph.redrawNodeWires(convNode.id);
                            this.app.graph.redrawNodeWires(endPin.node.id);
                        });
                        this.app.persistence.autoSave();
                        this.app.compiler.markDirty();
                        return;
                    } else {
                        convNode.element.remove();
                        this.app.graph.nodes.delete(convNode.id);
                    }
                }
            }
        }
        this._addLink(startPin, endPin);
        this.updateVisuals(endPin.node);
        this.updateVisuals(startPin.node);
        requestAnimationFrame(() => {
            this.app.graph.redrawNodeWires(endPin.node.id);
            this.app.graph.redrawNodeWires(startPin.node.id);
        });
        this.app.persistence.autoSave();
        this.app.compiler.markDirty();
    }
    _addLink(startPin, endPin) {
        const link = {
            id: Utils.uniqueId('link'),
            startPin: startPin,
            endPin: endPin,
        };
        this.links.set(link.id, link);
        startPin.links.push(link.id);
        endPin.links.push(link.id);
    }
    updateVisuals(node) {
        if (!node || !node.element || !node.element.parentNode) return;
        const isSelected = node.element.classList.contains('selected');
        const oldEl = node.element;
        const newEl = node.render();
        oldEl.replaceWith(newEl);
        if (isSelected) {
            newEl.classList.add('selected');
        }
        node.element = newEl;
    }
    breakLinkById(linkId) {
        const link = this.links.get(linkId);
        if (!link) return;
        const { startPin, endPin } = link;
        startPin.links = startPin.links.filter(id => id !== linkId);
        endPin.links = endPin.links.filter(id => id !== linkId);
        this.links.delete(linkId);
        this.selectedLinks.delete(linkId);
        const wireEl = document.getElementById(link.id);
        if (wireEl && wireEl.parentNode) {
            wireEl.remove();
        }
        this.updateVisuals(endPin.node);
        this.updateVisuals(startPin.node);
        requestAnimationFrame(() => {
            this.app.graph.redrawNodeWires(endPin.node.id);
            this.app.graph.redrawNodeWires(startPin.node.id);
            this.app.persistence.autoSave();
            this.app.compiler.markDirty();
        });
    }
    breakPinLinks(pinId) {
        const linksToBreak = this.findLinksByPinId(pinId);
        linksToBreak.forEach(link => this.breakLinkById(link.id));
    }
    drawWire(link) {
        const { startPin, endPin } = link;
        if (!startPin.element || !endPin.element || !startPin.element.isConnected || !endPin.element.isConnected) {
            if (this.links.has(link.id)) {
                this.breakLinkById(link.id);
            }
            return;
        }
        let wireEl = document.getElementById(link.id);
        if (!wireEl) {
            wireEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            wireEl.id = link.id;
            this.svgGroup.appendChild(wireEl);
            wireEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLinkSelection(link.id);
            });
        } else {
            wireEl.style.display = '';
        }

        // Always update wire color based on current pin type
        const pinColor = Utils.getPinColor(startPin.type);
        wireEl.setAttribute('stroke', pinColor);

        const typeClass = Utils.getPinTypeClass(startPin.type);
        wireEl.setAttribute('class', `wire ${typeClass} ${this.selectedLinks.has(link.id) ? 'link-selected' : ''}`);
        const p1 = Utils.getPinPosition(startPin.element, this.app);
        const p2 = Utils.getPinPosition(endPin.element, this.app);
        wireEl.setAttribute('d', Utils.getWirePath(p1.x, p1.y, p2.x, p2.y));
    }
    updateGhostWire(e, startPin) {
        if (!startPin || !startPin.element) {
            this.ghostWire.style.display = 'none';
            return;
        }
        this.ghostWire.style.display = 'block';
        if (this.ghostWire.parentNode !== this.svgGroup) {
            this.svgGroup.appendChild(this.ghostWire);
        }
        this.ghostWire.style.strokeWidth = '3px';
        this.ghostWire.style.opacity = '1';
        const typeClass = Utils.getPinTypeClass(startPin.type);
        this.ghostWire.setAttribute('class', `wire ${typeClass}`);
        const pinColor = Utils.getPinColor(startPin.type);
        this.ghostWire.setAttribute('stroke', pinColor);
        const p1 = Utils.getPinPosition(startPin.element, this.app);
        const p2 = this.app.graph.getGraphCoords(e.clientX, e.clientY);
        const startX = startPin.dir === 'out' ? p1.x : p2.x;
        const startY = startPin.dir === 'out' ? p1.y : p2.y;
        const endX = startPin.dir === 'out' ? p2.x : p1.x;
        const endY = startPin.dir === 'out' ? p2.y : p1.y;
        this.ghostWire.setAttribute('d', Utils.getWirePath(startX, startY, endX, endY));
    }
}

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
        this.hasDragged = false;
        this.activePin = null;
        this.selectedNodes = new Set();
        this.dragStart = { x: 0, y: 0 };
        this.nodeDragOffsets = new Map();
        this.marqueeStart = { x: 0, y: 0 };
        this.marqueeEl = document.getElementById('selection-marquee');
        this.handleGlobalMouseMove = this.handleGlobalMouseMove.bind(this);
        this.handleGlobalMouseUp = this.handleGlobalMouseUp.bind(this);
    }

    initEvents() {
        this.editor.addEventListener('mousedown', this.handleEditorMouseDown.bind(this));
        this.editor.addEventListener('wheel', this.handleZoom.bind(this));
        this.editor.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        this.nodesContainer.addEventListener('contextmenu', this.handlePinContextMenu.bind(this));
        this.editor.addEventListener('dragover', this.handleDragOver.bind(this));
        this.editor.addEventListener('drop', this.handleDrop.bind(this));
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
        this.hasDragged = false;
        this.app.wiring.clearLinkSelection();
        if (this.isMarqueeing) {
            this.isMarqueeing = false;
            this.marqueeEl.style.display = 'none';
        }
        const pinElement = e.target.closest('.pin-container');
        const nodeElement = e.target.closest('.node');
        if (e.target.classList.contains('wire')) { return; }
        if (pinElement && e.button === 0) {
            e.stopPropagation();
            e.preventDefault();
            this.isWiring = true;
            const pinId = pinElement.dataset.pinId;
            this.activePin = this.findPinById(pinId);
            if (e.altKey && this.activePin && this.activePin.isConnected()) {
                this.app.wiring.breakPinLinks(this.activePin.id);
            }
            if (this.activePin) {
                this.app.wiring.updateGhostWire(e, this.activePin);
            }
            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            return;
        }
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
        if (e.button === 1 || (e.button === 0 && e.code === 'Space')) {
            this.isPanning = true;
            this.editor.classList.add('dragging');
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
            e.preventDefault();
            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            return;
        }
        if (e.button === 2) {
            this.isRmbDown = true;
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            return;
        }
        if (e.button === 0) {
            this.isMarqueeing = true;
            this.marqueeStart.x = e.clientX;
            this.marqueeStart.y = e.clientY;
            this.marqueeEl.style.display = 'block';
            this.marqueeEl.style.left = `${e.clientX}px`;
            this.marqueeEl.style.top = `${e.clientY}px`;
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
        if (this.isPanning || this.isRmbDown) {
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            this.pan.x += dx;
            this.pan.y += dy;
            this.updateTransform();
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
        }
        else if (this.isDraggingNode) {
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
        else if (this.isWiring) {
            if (this.activePin) {
                this.app.wiring.updateGhostWire(e, this.activePin);
            }
        }
        else if (this.isMarqueeing) {
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
                }
            } else if (this.activePin) {
                this.app.actionMenu.show(e.clientX, e.clientY, this.activePin);
                this.isWiring = false;
                return;
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
            let mode = 'new';
            if (e.shiftKey) mode = 'add';
            else if (e.ctrlKey) mode = 'toggle';
            else if (e.altKey) mode = 'remove';
            this.selectNodesInRect(marqueeRect, mode);
        }
        if (this.isRmbDown) { this.isRmbDown = false; }
        this.isPanning = false;
        this.editor.classList.remove('dragging');
        this.hasDragged = false;
        this.dragStart = { x: 0, y: 0 };
    }
    handleZoom(e) {
        e.preventDefault();
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
            this.app.contextMenu.show(e.clientX, e.clientY, items);
        }
    }
    addNode(nodeKey, x, y) {
        const nodeData = nodeRegistry.get(nodeKey);
        if (!nodeData) return null;

        // Check for Singleton
        if (nodeData.isSingleton) {
            const existingNode = [...this.nodes.values()].find(n => n.nodeKey === nodeKey);
            if (existingNode) {
                // Flash/Select existing node
                this.selectNode(existingNode.id, false, 'new');
                // Optional: Pan to it (simple implementation)
                const rect = this.editor.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                // We don't want to jarringly move the camera, but selecting it is good feedback.
                // If we had a toast notification system, we'd use it here.
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
    duplicateSelectedNodes() {
        if (this.selectedNodes.size === 0) {
            this.app.wiring.deleteSelectedLinks();
            return;
        }
        const oldToNewPinIds = new Map();
        const newSelection = [];
        const offset = 20;
        for (const nodeId of this.selectedNodes) {
            const oldNode = this.nodes.get(nodeId);
            if (oldNode) {
                const newNode = this.addNode(oldNode.nodeKey, oldNode.x + offset, oldNode.y + offset);
                newSelection.push(newNode.id);
                oldNode.pins.forEach((oldPin, index) => {
                    const newPin = newNode.pins[index];
                    oldToNewPinIds.set(oldPin.id, newPin.id);
                });
            }
        }
        for (const link of this.app.wiring.links.values()) {
            const startNodeIsSelected = this.selectedNodes.has(link.startPin.node.id);
            const endNodeIsSelected = this.selectedNodes.has(link.endPin.node.id);
            if (startNodeIsSelected && endNodeIsSelected) {
                const newStartPin = this.findPinById(oldToNewPinIds.get(link.startPin.id));
                const newEndPin = this.findPinById(oldToNewPinIds.get(link.endPin.id));
                if (newStartPin && newEndPin) {
                    this.app.wiring.createConnection(newStartPin, newEndPin);
                }
            }
        }
        this.app.wiring.clearLinkSelection();
        this.clearSelection();
        newSelection.forEach(nodeId => this.selectNode(nodeId, true, 'add'));
        this.app.persistence.autoSave();
    }
    findPinById(pinId) {
        if (!pinId) return null;
        const parts = pinId.split('-');
        if (parts.length < 2) return null;
        const nodeId = `${parts[0]}-${parts[1]}`;
        const node = this.nodes.get(nodeId);
        return node ? node.findPinById(pinId) : null;
    }
    canConnect(pinA, pinB) {
        if (!pinA || !pinB || !pinA.node || !pinB.node) return false;
        if (pinA.node.id === pinB.node.id) return false;
        if (pinA.dir === pinB.dir) return false;
        const startPin = pinA.dir === 'out' ? pinA : pinB;
        const endPin = pinA.dir === 'in' ? pinA : pinB;
        if (startPin.containerType !== endPin.containerType) return false;
        if (startPin.type === endPin.type) return true;
        if (startPin.type === 'exec' && endPin.type === 'exec') return true;
        const conversionKey = Utils.getConversionNodeKey(startPin.type, endPin.type);
        if (conversionKey) return true;
        return false;
    }
    promotePinToVariable(pin) {
        const newVariable = this.app.variables.createVariableFromPin(pin);
        let nodeToSpawnKey;
        const pinToConnectName = pin.id.split('-').pop();
        if (pin.dir === 'in') {
            nodeToSpawnKey = `Get_${newVariable.name}`;
        } else {
            nodeToSpawnKey = `Set_${newVariable.name}`;
        }
        const x = pin.node.x - 200;
        const y = pin.node.y + 50;
        const newNode = this.app.graph.addNode(nodeToSpawnKey, x, y);
        if (newNode) {
            const targetPinName = (pin.dir === 'in') ? 'val_out' : 'val_in';
            const newPin = newNode.pins.find(p => p.id.endsWith(targetPinName));
            if (newPin) this.app.wiring.createConnection(pin, newPin);
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

                // Use the robust sync method to update visual and data state
                this.synchronizeNodeWithTemplate(node);
            }
        }
    }

    // ADDED: Helper to fully refresh a node's pins and title from the NodeLibrary
    synchronizeNodeWithTemplate(node) {
        const template = nodeRegistry.get(node.nodeKey);
        if (!template) return;

        node.title = template.title;

        // Preserve old pins to keep connections valid
        const oldPinsMap = new Map(node.pins.map(p => [p.id, p]));

        node.pins = template.pins.map(p => {
            const newPin = new Pin(node, p);
            const fullPinId = `${node.id}-${p.id}`;
            const oldPin = oldPinsMap.get(fullPinId);
            if (oldPin) {
                newPin.links = oldPin.links;
                newPin.defaultValue = oldPin.defaultValue;
                node.pinLiterals.set(newPin.id, node.pinLiterals.get(oldPin.id));
                newPin.links.forEach(linkId => {
                    const link = this.app.wiring.links.get(linkId);
                    if (link) {
                        if (link.startPin === oldPin) link.startPin = newPin;
                        if (link.endPin === oldPin) link.endPin = newPin;
                    }
                });
            }
            return newPin;
        });

        node.refreshPinCache();
        this.app.wiring.updateVisuals(node);
        this.redrawNodeWires(node.id);
    }
    selectNode(nodeId, addToSelection = false, mode = 'toggle') {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        if (!addToSelection) {
            this.clearSelection();
        }
        if (mode === 'add') {
            this.selectedNodes.add(nodeId);
            node.element.classList.add('selected');
        } else if (mode === 'remove') {
            this.selectedNodes.delete(nodeId);
            node.element.classList.remove('selected');
        } else if (mode === 'toggle') {
            if (this.selectedNodes.has(nodeId)) {
                this.selectedNodes.delete(nodeId);
                node.element.classList.remove('selected');
            } else {
                this.selectedNodes.add(nodeId);
                node.element.classList.add('selected');
            }
        } else if (mode === 'new') {
            this.selectedNodes.add(nodeId);
            node.element.classList.add('selected');
        }
        if (this.selectedNodes.size === 1) {
            const selectedNode = this.nodes.get([...this.selectedNodes][0]);
            this.app.details.showNodeDetails(selectedNode);
        } else {
            this.app.details.clear();
        }
    }
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
            const nodeCenterX = nodeRect.left + nodeRect.width / 2;
            const nodeCenterY = nodeRect.top + nodeRect.height / 2;
            if (nodeCenterX >= rect.left && nodeCenterX <= rect.right &&
                nodeCenterY >= rect.top && nodeCenterY <= rect.bottom) {
                this.selectNode(node.id, true, mode);
            }
        }
    }
    deleteSelectedNodes() {
        if (this.selectedNodes.size === 0) return;
        for (const nodeId of this.selectedNodes) {
            const node = this.nodes.get(nodeId);
            if (!node) continue;
            node.pins.forEach(pin => {
                this.app.wiring.breakPinLinks(pin.id);
            });
            node.element.remove();
            this.nodes.delete(nodeId);
        }
        this.selectedNodes.clear();
        this.app.details.clear();
        this.app.persistence.autoSave();
        this.app.compiler.markDirty();
    }
    deleteSelectedLinks() {
        if (this.app.wiring.selectedLinks.size === 0) return;
        const linksToDelete = Array.from(this.app.wiring.selectedLinks);
        linksToDelete.forEach(linkId => {
            this.app.wiring.breakLinkById(linkId);
        });
        this.app.wiring.clearLinkSelection();
        this.app.persistence.autoSave();
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
    updateTransform() {
        const transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
        this.nodesContainer.style.transform = transform;
        const svgTransform = `translate(${this.pan.x}, ${this.pan.y}) scale(${this.zoom})`;
        this.app.wiring.svgGroup.setAttribute('transform', svgTransform);
        this.app.grid.draw();
    }
    redrawNodeWires(nodeId) {
        this.app.wiring.findLinksByNodeId(nodeId).forEach(link => this.app.wiring.drawWire(link));
    }
    drawAllWires() {
        for (const link of this.app.wiring.links.values()) {
            this.app.wiring.drawWire(link);
        }
    }
    renderAllNodes() {
        this.nodesContainer.innerHTML = '';
        for (const node of this.nodes.values()) {
            this.nodesContainer.appendChild(node.render());
        }
    }
    getGraphCoords(clientX, clientY) {
        const rect = this.editor.getBoundingClientRect();
        const x = (clientX - rect.left - this.pan.x) / this.zoom;
        const y = (clientY - rect.top - this.pan.y) / this.zoom;
        return { x, y };
    }
    loadState(state) {
        this.nodes.clear();
        this.app.wiring.links.clear();
        state.nodes.forEach(nodeData => {
            const template = nodeRegistry.get(nodeData.nodeKey);
            if (!template) {
                console.warn(`Skipping node during load: Key '${nodeData.nodeKey}' not found in NodeRegistry.`);
                return;
            }

            // CRITICAL FIX: Restore dynamic pins properly
            let pinsToLoad = template.pins;

            if (nodeData.nodeKey === 'CustomEvent') {
                // Filter out legacy delegate pin from saved data if present
                if (nodeData.pins) {
                    nodeData.pins = nodeData.pins.filter(p => p.id !== 'delegate_out' && p.name !== 'Output Delegate');
                }

                // Logic to determine if we use saved pins (for dynamic params) or template
                if (nodeData.pins && nodeData.pins.length > template.pins.length) {
                    pinsToLoad = nodeData.pins;
                }
            } else {
                const isCustomNode = (nodeData.nodeKey === 'CustomEvent');
                if (isCustomNode && nodeData.pins && nodeData.pins.length > template.pins.length) {
                    pinsToLoad = nodeData.pins;
                }
            }

            const fullNodeData = { ...template, ...nodeData, pins: pinsToLoad };
            const node = new Node(nodeData.id, fullNodeData, nodeData.x, nodeData.y, nodeData.nodeKey, this.app);
            this.nodes.set(node.id, node);

            if (nodeData.pins) {
                nodeData.pins.forEach(savedPin => {
                    const fullPinId = savedPin.id.includes(node.id) ? savedPin.id : `${node.id}-${savedPin.id}`;
                    const pin = node.findPinById(fullPinId);

                    if (pin && savedPin.literalValue !== undefined) {
                        node.pinLiterals.set(pin.id, savedPin.literalValue);
                    } else if (pin) {
                        node.pinLiterals.set(pin.id, pin.defaultValue);
                    }
                });
            }
        });
        state.links.forEach(linkData => {
            const startPin = this.findPinById(linkData.startPinId);
            const endPin = this.findPinById(linkData.endPinId);
            if (startPin && endPin) {
                const link = { id: linkData.id, startPin, endPin };
                this.app.wiring.links.set(link.id, link);
                startPin.links.push(link.id);
                endPin.links.push(link.id);
            }
        });
    }
}

export { Pin, Node, WiringController, GraphController };"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content)
    f.write(correct_code)

print("Successfully restored graph.js")
