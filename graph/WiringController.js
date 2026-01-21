/**
 * WiringController - Manages wire connections between nodes.
 * Extracted from graph.js for code complexity reduction.
 */
import { Utils } from '../utils.js';

/**
 * Manages wire connections, link selection, and visual wire rendering.
 */
export class WiringController {
    constructor(svg, app) {
        this.svgGroup = svg.getElementById('wire-group');
        this.ghostWire = svg.getElementById('ghost-wire');
        this.links = new Map();
        this.selectedLinks = new Set();
        this.app = app;
    }

    findLink(linkId) { 
        return this.links.get(linkId); 
    }

    findLinksByNodeId(nodeId) { 
        return [...this.links.values()].filter(l => l.startPin.node.id === nodeId || l.endPin.node.id === nodeId); 
    }

    findLinksByPinId(pinId) { 
        return [...this.links.values()].filter(l => l.startPin.id === pinId || l.endPin.id === pinId); 
    }

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

        // Prevent connection if already exists
        const linkExists = startPin.links.some(linkId => {
            const link = this.links.get(linkId);
            return link && link.endPin.id === endPin.id;
        });
        if (linkExists) return;

        // Break existing connection if input pin is single-link
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
                    if (startPin.node.variableId || endPin.node.variableId) {
                        convNode.title = `Convert ${startPin.type.toUpperCase()} to ${endPin.type.toUpperCase()}`;
                    }

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
        
        if (!oldEl.isConnected) {
            console.warn(`Attempted to update visuals for detached node ${node.id}`);
            return;
        }

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

        if (startPin && startPin.links) {
            startPin.links = startPin.links.filter(id => id !== linkId);
        }
        if (endPin && endPin.links) {
            endPin.links = endPin.links.filter(id => id !== linkId);
        }

        this.links.delete(linkId);
        this.selectedLinks.delete(linkId);
        const wireEl = document.getElementById(link.id);
        if (wireEl && wireEl.parentNode) {
            wireEl.remove();
        }

        if (endPin) this.updateVisuals(endPin.node);
        if (startPin) this.updateVisuals(startPin.node);

        requestAnimationFrame(() => {
            if (endPin) this.app.graph.redrawNodeWires(endPin.node.id);
            if (startPin) this.app.graph.redrawNodeWires(startPin.node.id);
            this.app.persistence.autoSave();
            this.app.compiler.markDirty();
        });
    }

    breakPinLinks(pinId) {
        const linksToBreak = this.findLinksByPinId(pinId);
        linksToBreak.map(l => l.id).forEach(linkId => this.breakLinkById(linkId));
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

    deleteSelectedLinks() {
        if (this.selectedLinks.size === 0) return;
        const linksToDelete = Array.from(this.selectedLinks);
        linksToDelete.forEach(linkId => {
            this.breakLinkById(linkId);
        });
        this.clearLinkSelection();
        this.app.persistence.autoSave();
    }
}
