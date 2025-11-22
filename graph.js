/**
 * Core Graph Logic: Pin, Node, WiringController, GraphController.
 * This file manages the data model, rendering, and all user interactions 
 * (pan, zoom, drag, selection, wiring).
 */
import { Utils, NodeLibrary } from './utils.js';

// --- CORE DATA MODEL CLASSES ---

/**
 * Represents a single data pin on a node.
 */
class Pin {
    constructor(node, pinData) {
        this.id = pinData.id.includes(node.id) ? pinData.id : `${node.id}-${pinData.id}`;
        this.node = node;
        this.name = pinData.name;
        this.type = (pinData.type || '').toLowerCase(); // Safe lowercasing
        this.dir = pinData.dir;
        this.element = null;
        this.links = [];
        this.containerType = pinData.containerType || 'single';
        this.defaultValue = pinData.defaultValue !== undefined ? pinData.defaultValue : this.getDefaultValue();
        this.isCustom = pinData.isCustom || false;
    }

    getDefaultValue() {
        switch (this.type) {
            case 'bool': return false;
            case 'int':
            case 'int64':
            case 'byte': return 0;
            case 'float': return 0.0;
            default: return '';
        }
    }

    isConnected() { return this.links.length > 0; }

    getMaxLinks() {
        if (this.dir === 'in' && this.type !== 'exec') {
            return 1;
        }
        return Infinity;
    }
}

/**
 * Represents a single node in the graph canvas.
 */
class Node {
    constructor(id, nodeData, x, y, nodeKey, app) {
        this.id = id;
        this.title = nodeData.title || "Unknown Node";
        this.type = nodeData.type || "pure-node";
        this.icon = nodeData.icon;
        this.devWarning = nodeData.devWarning;
        this.variableType = nodeData.variableType;
        this.variableId = nodeData.variableId;
        this.app = app;
        this.nodeKey = nodeKey;
        this.x = x;
        this.y = y;
        this.element = null;

        this.customData = nodeData.customData || {};

        const pinDataArray = nodeData.pins || [];
        this.pins = pinDataArray.map(p => new Pin(this, p));
        this.refreshPinCache();

        this.pinLiterals = new Map();
        this.pins.forEach(p => {
            this.pinLiterals.set(p.id, p.defaultValue);
        });
    }

    refreshPinCache() {
        if (!this.pins) this.pins = [];
        this.pinsIn = this.pins.filter(p => p.dir === 'in');
        this.pinsOut = this.pins.filter(p => p.dir === 'out');
    }

    findPinById(pinId) {
        return this.pins.find(p => p.id === pinId);
    }

    render() {

        if (!this.nodeKey) {
            console.error(`Node ${this.id} missing nodeKey.`);
            this.nodeKey = 'INVALID_NODE';
        }

        if (this.nodeKey.startsWith('Get_') || this.nodeKey.startsWith('Conv_')) {
            return this.renderCompactNode();
        }
        if (this.nodeKey.startsWith('Set_')) {
            return this.renderSetNode();
        }


        const element = document.createElement('div');
        element.id = this.id;
        element.className = `node ${this.type}`;
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;

        const header = document.createElement('div');
        header.className = 'node-title';

        if (this.variableType) {
            const gradient = Utils.getVariableHeaderColor(this.variableType);
            header.style.background = `linear-gradient(to bottom, ${gradient.start}, ${gradient.end})`;
            header.style.borderBottomColor = 'rgba(0,0,0,0.5)';
        }

        if (this.icon) {
            const iconEl = document.createElement('span');
            if (this.icon.startsWith('fa-')) {
                iconEl.className = `fas ${this.icon}`;
            } else if (this.type === 'function-node' && this.icon === 'f') {
                iconEl.style.fontWeight = 'bold';
                iconEl.style.fontStyle = 'italic';
                iconEl.style.color = 'white';
                iconEl.textContent = 'f';
            } else {
                iconEl.textContent = this.icon;
            }
            header.appendChild(iconEl);
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = this.title;
        header.appendChild(titleSpan);

        if (this.type === 'event-node') {
            const delegateIcon = document.createElement('div');
            delegateIcon.className = 'event-delegate-icon';
            delegateIcon.title = "Output Delegate";
            header.appendChild(delegateIcon);
        }

        if (this.type === 'comment-node' || this.nodeKey === 'CustomEvent') {
            header.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                header.contentEditable = true;
                header.focus();
                document.execCommand('selectAll', false, null);
                header.classList.add('editing-title');
            });

            const finishEditing = () => {
                header.contentEditable = false;
                this.title = header.textContent;
                header.classList.remove('editing-title');
                if (this.app.details && this.app.graph.selectedNodes.has(this.id)) {
                    if (this.nodeKey === 'CustomEvent') {
                        this.app.details.showNodeDetails(this);
                    }
                }
                this.app.persistence.autoSave();
            };

            header.addEventListener('blur', finishEditing);
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    header.blur();
                }
            });
            header.addEventListener('mousedown', (e) => {
                if (header.isContentEditable) {
                    e.stopPropagation();
                }
            });
        }

        element.appendChild(header);

        const content = document.createElement('div');
        content.className = 'node-content';

        if (this.type === 'pure-node') {
            content.classList.add('pure-node-content');
            const inCol = document.createElement('div');
            inCol.className = 'pin-column in';
            this.pinsIn.forEach(pinIn => inCol.appendChild(this.renderPin(pinIn)));
            content.appendChild(inCol);

            const outCol = document.createElement('div');
            outCol.className = 'pin-column out';
            this.pinsOut.forEach(pinOut => outCol.appendChild(this.renderPin(pinOut)));
            content.appendChild(outCol);
        } else {
            // SAFEGUARD: Ensure pins arrays exist and have length before checking
            const inLen = this.pinsIn ? this.pinsIn.length : 0;
            const outLen = this.pinsOut ? this.pinsOut.length : 0;
            const maxRows = Math.max(inLen, outLen);

            for (let i = 0; i < maxRows; i++) {
                const row = document.createElement('div');
                row.className = 'pin-row';

                const pinIn = this.pinsIn[i];
                const pinOut = this.pinsOut[i];

                if (pinIn) {
                    row.appendChild(this.renderPin(pinIn));
                } else {
                    const spacer = document.createElement('div');
                    spacer.style.minWidth = '10px';
                    row.appendChild(spacer);
                }

                if (pinOut) {
                    row.appendChild(this.renderPin(pinOut));
                } else {
                    const spacer = document.createElement('div');
                    spacer.minWidth = '10px';
                    row.appendChild(spacer);
                }
                content.appendChild(row);
            }
        }

        element.appendChild(content);

        if (this.devWarning) {
            const devBar = document.createElement('div');
            devBar.className = 'development-bar';
            const textSpan = document.createElement('span');
            textSpan.textContent = this.devWarning.toUpperCase();
            devBar.appendChild(textSpan);
            const arrowIcon = document.createElement('i');
            arrowIcon.className = 'fas fa-chevron-down';
            arrowIcon.style.marginLeft = '5px';
            arrowIcon.style.fontSize = '8px';
            arrowIcon.style.color = 'rgba(255,255,255,0.7)';
            arrowIcon.style.position = 'relative';
            arrowIcon.style.zIndex = '2';
            devBar.appendChild(arrowIcon);
            element.appendChild(devBar);
        }

        this.element = element;
        return element;
    }

    renderSetNode() {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = `node ${this.type} set-node`;
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;

        const header = document.createElement('div');
        header.className = 'node-title';
        if (this.variableType) {
            const gradient = Utils.getVariableHeaderColor(this.variableType);
            header.style.background = `linear-gradient(to bottom, ${gradient.start}, ${gradient.end})`;
            header.style.borderBottomColor = 'rgba(0,0,0,0.5)';
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = "SET";
        header.appendChild(titleSpan);
        element.appendChild(header);

        const content = document.createElement('div');
        content.className = 'node-content';

        // Defensive check: ensure pin arrays exist
        if (!this.pinsIn || !this.pinsOut) {
            this.refreshPinCache();
        }

        const execIn = this.pinsIn ? this.pinsIn.find(p => p.type === 'exec') : null;
        const execOut = this.pinsOut ? this.pinsOut.find(p => p.type === 'exec') : null;
        const dataIn = this.pinsIn ? this.pinsIn.find(p => p.type !== 'exec') : null;
        const dataOut = this.pinsOut ? this.pinsOut.find(p => p.type !== 'exec') : null;

        const execRow = document.createElement('div');
        execRow.className = 'pin-row';
        if (execIn) execRow.appendChild(this.renderPin(execIn, true));
        else execRow.appendChild(document.createElement('div'));

        if (execOut) execRow.appendChild(this.renderPin(execOut, true));
        else execRow.appendChild(document.createElement('div'));
        content.appendChild(execRow);

        const dataRow = document.createElement('div');
        dataRow.className = 'pin-row';

        if (dataIn) {
            dataRow.appendChild(this.renderPin(dataIn));
        } else {
            dataRow.appendChild(document.createElement('div'));
        }

        if (dataOut) {
            dataRow.appendChild(this.renderPin(dataOut, true));
        } else {
            dataRow.appendChild(document.createElement('div'));
        }
        content.appendChild(dataRow);

        element.appendChild(content);
        this.element = element;
        return element;
    }

    renderCompactNode() {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = `node compact-node ${this.type}`;
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;

        const container = document.createElement('div');
        container.className = 'compact-node-container';

        const pinIn = this.pinsIn[0];
        const pinOut = this.pinsOut[0];

        // 1. Left Pin (Input)
        if (pinIn) {
            const pinContainer = document.createElement('div');
            pinContainer.className = `pin-container in ${Utils.getPinTypeClass(pinIn.type)}`;
            pinContainer.dataset.pinId = pinIn.id;

            const pinDot = this.createPinDot(pinIn);
            pinIn.element = pinDot;
            pinContainer.appendChild(pinDot);

            // If unconnected, show the input widget (pill-box style)
            if (!pinIn.isConnected()) {
                const inputWidget = this.createInputWidget(pinIn);
                if (inputWidget) {
                    inputWidget.classList.add('compact-input-widget');
                    pinContainer.appendChild(inputWidget);
                }
            }

            container.appendChild(pinContainer);
        }

        // 2. Separator Dot (The grey dot in the middle)
        const sep = document.createElement('div');
        sep.className = 'compact-node-separator';
        container.appendChild(sep);

        // --- INSERT LABEL ---
        const labelSpan = document.createElement('span');
        labelSpan.className = 'compact-node-label';
        // Clean up "Get_" prefix for display to match standard UI
        if (this.nodeKey.startsWith('Get_')) {
            labelSpan.textContent = this.nodeKey.substring(4);
        } else {
            labelSpan.textContent = this.title;
        }
        container.appendChild(labelSpan);

        // 3. Right Pin (Output)
        if (pinOut) {
            const pinContainer = document.createElement('div');
            pinContainer.className = `pin-container out ${Utils.getPinTypeClass(pinOut.type)}`;
            pinContainer.dataset.pinId = pinOut.id;

            const pinDot = this.createPinDot(pinOut);
            pinOut.element = pinDot;
            pinContainer.appendChild(pinDot);

            container.appendChild(pinContainer);
        }

        element.appendChild(container);
        this.element = element;
        return element;
    }

    createPinDot(pin, forceHollow = false) {
        const typeClass = Utils.getPinTypeClass(pin.type);
        const pinDot = document.createElement('div');
        let dotClasses = `pin-dot ${typeClass}`;
        const isConnected = pin.links.length > 0;
        if (forceHollow || !isConnected) {
            dotClasses += ' hollow';
        }
        pinDot.className = dotClasses;
        pinDot.title = `${pin.name} (${pin.type})`;

        // Handle container types with proper icons
        // Only add container styling if it's not a single value
        if (pin.containerType && pin.containerType !== 'single') {
            pinDot.classList.add('container-pin'); // Remove default circle styling

            if (pin.containerType === 'array') {
                pinDot.classList.add('array-pin');
                const icon = document.createElement('i');
                icon.className = 'fas fa-th';
                icon.style.fontSize = '8px';
                icon.style.color = Utils.getPinColor(pin.type);
                pinDot.appendChild(icon);
            } else if (pin.containerType === 'set') {
                pinDot.classList.add('set-pin');
                const icon = document.createElement('span');
                icon.textContent = '{}';
                icon.style.fontSize = '8px';
                icon.style.fontWeight = 'bold';
                icon.style.color = Utils.getPinColor(pin.type);
                pinDot.appendChild(icon);
            } else if (pin.containerType === 'map') {
                pinDot.classList.add('map-pin');
                const icon = document.createElement('i');
                icon.className = 'fas fa-list-ul';
                icon.style.fontSize = '8px';
                icon.style.color = Utils.getPinColor(pin.type);
                pinDot.appendChild(icon);
            }
        }

        return pinDot;
    }

    renderPin(pin, hideLabel = false) {
        const pinContainer = document.createElement('div');
        const typeClass = Utils.getPinTypeClass(pin.type);
        pinContainer.className = `pin-container ${pin.dir} ${typeClass}`;
        pinContainer.dataset.pinId = pin.id;

        const pinDot = this.createPinDot(pin);
        pin.element = pinDot;

        let effectiveHideLabel = hideLabel;
        if (this.type === 'function-node' && pin.type === 'exec') {
            effectiveHideLabel = true;
        }

        const pinLabel = document.createElement('span');
        pinLabel.className = `pin-label-${pin.dir}`;
        pinLabel.textContent = pin.name;
        if (effectiveHideLabel) {
            pinLabel.style.display = 'none';
        }

        let inputWidget = null;
        const isDataPin = pin.type !== 'exec';
        const isConnected = pin.links.length > 0;

        if (pin.dir === 'in' && isDataPin && !isConnected) {
            inputWidget = this.createInputWidget(pin);
        }

        if (pin.dir === 'in') {
            pinContainer.appendChild(pinDot);
            // UPDATED: Added 'pin-wrapper' class for easier styling access
            const wrapper = document.createElement('div');
            wrapper.className = 'pin-wrapper'; // Class added here
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';

            if (!effectiveHideLabel) wrapper.appendChild(pinLabel);
            if (inputWidget) wrapper.appendChild(inputWidget);
            pinContainer.appendChild(wrapper);
        } else {
            if (!effectiveHideLabel) pinContainer.appendChild(pinLabel);
            pinContainer.appendChild(pinDot);
        }
        return pinContainer;
    }

    createInputWidget(pin) {
        let inputEl;
        const pinValue = this.pinLiterals.get(pin.id);
        const updateLiteral = (e) => {
            let newValue = e.target.value;
            if (['int', 'int64', 'byte'].includes(pin.type)) {
                newValue = parseInt(newValue) || 0;
            } else if (pin.type === 'float') {
                newValue = parseFloat(newValue) || 0.0;
            } else if (pin.type === 'bool') {
                newValue = e.target.checked;
            }
            this.pinLiterals.set(pin.id, newValue);
            this.app.persistence.autoSave();
        };

        if (pin.type === 'bool') {
            inputEl = document.createElement('input');
            inputEl.type = 'checkbox';
            inputEl.className = 'ue5-checkbox';
            inputEl.checked = pinValue;
            inputEl.addEventListener('change', updateLiteral);
        } else {
            inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.value = pinValue;
            inputEl.className = 'node-literal-input';
            const wideTypes = ['string', 'text', 'name'];
            inputEl.style.width = wideTypes.includes(pin.type) ? '80px' : '40px';
            inputEl.style.backgroundColor = '#111';
            inputEl.style.color = 'white';
            inputEl.style.border = '1px solid #444';
            inputEl.style.borderRadius = '2px';
            inputEl.style.marginLeft = '5px';
            inputEl.addEventListener('change', updateLiteral);
        }
        return inputEl;
    }

    getPinsData() {
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
        const nodeData = NodeLibrary[nodeKey];
        if (!nodeData) return null;
        const id = Utils.uniqueId('node');
        const node = new Node(id, nodeData, x, y, nodeKey, this.app);
        this.nodes.set(id, node);
        const nodeEl = node.render();
        this.nodesContainer.appendChild(nodeEl);
        return node;
    }
    // ... (duplicate, select, delete, etc. remain standard) ...
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
        const template = NodeLibrary[node.nodeKey];
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

    selectNode(nodeId, multiSelect = false, mode = 'new') {
        this.app.wiring.clearLinkSelection();
        this.app.details.currentVariable = null;
        if (!multiSelect || mode === 'new') {
            this.clearSelection();
            mode = 'add';
        }
        const node = this.nodes.get(nodeId);
        if (!node || !node.element) return;
        const isSelected = this.selectedNodes.has(nodeId);
        if (mode === 'add') {
            node.element.classList.add('selected');
            this.selectedNodes.add(nodeId);
        } else if (mode === 'remove') {
            node.element.classList.remove('selected');
            this.selectedNodes.delete(nodeId);
        } else if (mode === 'toggle') {
            if (isSelected) {
                node.element.classList.remove('selected');
                this.selectedNodes.delete(nodeId);
            } else {
                node.element.classList.add('selected');
                this.selectedNodes.add(nodeId);
            }
        }
        if (this.selectedNodes.size === 1) {
            this.app.details.showNodeDetails(this.nodes.get(nodeId));
        } else {
            this.app.details.clear();
        }
    }
    selectNodesInRect(rect, mode = 'new') {
        let selectionMode = mode;
        if (mode === 'new') {
            this.clearSelection();
            selectionMode = 'add';
        }
        for (const node of this.nodes.values()) {
            if (!node.element) continue;
            const nodeRect = node.element.getBoundingClientRect();
            const intersects = (
                nodeRect.left < rect.right &&
                nodeRect.right > rect.left &&
                nodeRect.top < rect.bottom &&
                nodeRect.bottom > rect.top
            );
            if (intersects) {
                this.selectNode(node.id, true, selectionMode);
            }
        }
    }
    clearSelection() {
        this.selectedNodes.forEach(nodeId => {
            const node = this.nodes.get(nodeId);
            if (node && node.element) {
                node.element.classList.remove('selected');
            }
        });
        this.selectedNodes.clear();
        this.app.details.clear();
    }
    deleteSelectedNodes() {
        this.app.wiring.clearLinkSelection();
        for (const nodeId of this.selectedNodes) {
            this.app.wiring.findLinksByNodeId(nodeId).forEach(link => this.app.wiring.breakLinkById(link.id));
            const node = this.nodes.get(nodeId);
            if (node && node.element) {
                node.element.remove();
            }
            this.nodes.delete(nodeId);
        }
        this.selectedNodes.clear();
        this.app.details.clear();
        this.app.persistence.autoSave();
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
            const template = NodeLibrary[nodeData.nodeKey];
            if (!template) {
                console.warn(`Skipping node during load: Key '${nodeData.nodeKey}' not found in NodeLibrary.`);
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

export { Pin, Node, WiringController, GraphController };