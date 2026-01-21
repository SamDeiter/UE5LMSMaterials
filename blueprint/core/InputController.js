/**
 * InputController - Manages all mouse and keyboard input for the graph editor.
 * Extracted from graph.js for code complexity reduction.
 * 
 * Handles: mouse down/move/up, zoom, context menus, keyboard shortcuts.
 */

export class InputController {
    constructor(graphController) {
        this.graph = graphController;
        this.app = graphController.app;
        this.editor = graphController.editor;
        
        // Wiring state
        this.isWiring = false;
        this.activePin = null;
        
        // Node dragging state
        this.isDraggingNode = false;
        this.nodeDragOffsets = new Map();
        
        // Panning state
        this.isRmbDown = false;
        this.isPanning = false;
        this.dragStart = { x: 0, y: 0 };
        
        // Marquee selection state
        this.isMarqueeing = false;
        this.marqueeStart = { x: 0, y: 0 };
        this.marqueeEl = document.getElementById('selection-marquee');
        
        // General state
        this.hasDragged = false;
        
        // Bind handlers
        this.handleGlobalMouseMove = this.handleGlobalMouseMove.bind(this);
        this.handleGlobalMouseUp = this.handleGlobalMouseUp.bind(this);
    }

    /**
     * Handle mouse down on the editor canvas.
     */
    handleEditorMouseDown(e) {
        // If user is editing a text input, ignore mousedown on the graph background
        if (this.graph.isEditingLiteral) {
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
            this.activePin = this.graph.findPinById(pinId);

            if (e.altKey && this.activePin && this.activePin.isConnected()) {
                this.app.wiring.breakPinLinks(this.activePin.id);
            }

            // If the pin is connected and we are starting to drag *from* it, break the link automatically if it's an input pin
            if (this.activePin && this.activePin.dir === 'in' && this.activePin.isConnected()) {
                this.app.wiring.breakPinLinks(this.activePin.id);
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

            if (mode === 'new' && !this.graph.selectedNodes.has(nodeElement.id)) {
                this.graph.selectNode(nodeElement.id, false, 'new');
            } else if (mode !== 'new') {
                this.graph.selectNode(nodeElement.id, true, mode);
            }

            const mouseGraphCoords = this.graph.getGraphCoords(e.clientX, e.clientY);
            this.nodeDragOffsets.clear();
            for (const nodeId of this.graph.selectedNodes) {
                const node = this.graph.nodes.get(nodeId);
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
            e.preventDefault();
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
            const rect = this.editor.getBoundingClientRect();
            this.marqueeEl.style.display = 'block';
            this.marqueeEl.style.left = `${e.clientX - rect.left}px`;
            this.marqueeEl.style.top = `${e.clientY - rect.top}px`;
            this.marqueeEl.style.width = '0px';
            this.marqueeEl.style.height = '0px';

            if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
                this.graph.clearSelection();
            }

            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
        }
    }

    /**
     * Handle global mouse move during drag operations.
     */
    handleGlobalMouseMove(e) {
        if (e.movementX !== 0 || e.movementY !== 0) { this.hasDragged = true; }
        e.preventDefault();

        if (this.isRmbDown) { // Panning
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            this.graph.pan.x += dx;
            this.graph.pan.y += dy;
            this.graph.updateTransform();
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
        }
        else if (this.isDraggingNode) { // Node Dragging
            const mouseGraphCoords = this.graph.getGraphCoords(e.clientX, e.clientY);
            for (const nodeId of this.graph.selectedNodes) {
                const node = this.graph.nodes.get(nodeId);
                const offset = this.nodeDragOffsets.get(nodeId);
                if (node && offset) {
                    node.x = mouseGraphCoords.x - offset.x;
                    node.y = mouseGraphCoords.y - offset.y;
                    node.element.style.left = `${node.x}px`;
                    node.element.style.top = `${node.y}px`;
                    this.graph.redrawNodeWires(node.id);
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

    /**
     * Handle global mouse up to complete drag operations.
     */
    handleGlobalMouseUp(e) {
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);

        if (this.isWiring) {
            const targetPinEl = e.target.closest('.pin-container');
            if (targetPinEl && this.activePin) {
                const endPinId = targetPinEl.dataset.pinId;
                const endPin = this.graph.findPinById(endPinId);

                if (endPin && this.graph.canConnect(this.activePin, endPin)) {
                    this.app.wiring.createConnection(this.activePin, endPin);
                } else if (endPin && !this.graph.canConnect(this.activePin, endPin)) {
                    if (this.hasDragged) {
                        this.app.actionMenu.show(e.clientX, e.clientY, this.activePin);
                    }
                } else if (!endPin && this.hasDragged) {
                    this.app.actionMenu.show(e.clientX, e.clientY, this.activePin);
                    this.isWiring = false;
                    this.activePin = null;
                    this.app.wiring.updateGhostWire(null, null);
                    return;
                }
            } else if (this.activePin && this.hasDragged) {
                this.app.actionMenu.show(e.clientX, e.clientY, this.activePin);
                this.isWiring = false;
                this.activePin = null;
                this.app.wiring.updateGhostWire(null, null);
                return;
            }

            this.isWiring = false;
            this.activePin = null;
            this.app.wiring.updateGhostWire(null, null);
        }

        if (this.isDraggingNode) {
            this.isDraggingNode = false;
            this.graph.snapSelectedNodesToGrid();
            this.nodeDragOffsets.clear();
            this.app.persistence.autoSave();
            this.app.compiler.markDirty();
        }

        if (this.isMarqueeing) {
            this.isMarqueeing = false;
            const marqueeRect = this.marqueeEl.getBoundingClientRect();
            this.marqueeEl.style.display = 'none';

            if (this.hasDragged) {
                let mode = 'new';
                if (e.shiftKey) mode = 'add';
                else if (e.ctrlKey) mode = 'toggle';
                else if (e.altKey) mode = 'remove';
                this.graph.selectNodesInRect(marqueeRect, mode);
            } else {
                if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
                    this.graph.clearSelection();
                }
            }
        }

        if (this.isRmbDown) { this.isRmbDown = false; }
        this.isPanning = false;
        this.editor.classList.remove('dragging');
        this.hasDragged = false;
        this.dragStart = { x: 0, y: 0 };
    }

    /**
     * Handle mouse wheel zoom.
     */
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

        const mouseGraphX_before = (mouseX - this.graph.pan.x) / this.graph.zoom;
        const mouseGraphY_before = (mouseY - this.graph.pan.y) / this.graph.zoom;

        if (e.deltaY < 0) this.graph.zoom *= scaleAmount;
        else this.graph.zoom /= scaleAmount;

        this.graph.zoom = Math.max(0.2, Math.min(this.graph.zoom, 1.5));

        this.graph.pan.x = mouseX - mouseGraphX_before * this.graph.zoom;
        this.graph.pan.y = mouseY - mouseGraphY_before * this.graph.zoom;

        this.graph.updateTransform();
        this.app.grid.draw();
        this.graph.zoomReadout.textContent = `${Math.round(this.graph.zoom * 100)}%`;

        this.graph.drawAllWires();
    }

    /**
     * Handle context menu (right-click).
     */
    handleContextMenu(e) {
        e.preventDefault();
        if (e.target.closest('.node')) { return; }
        this.app.actionMenu.show(e.clientX, e.clientY, null);
    }

    /**
     * Handle keyboard shortcuts.
     */
    handleKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.app.wiring.selectedLinks.size > 0) {
                e.preventDefault();
                this.app.wiring.deleteSelectedLinks();
            } else if (this.graph.selection.size > 0) {
                e.preventDefault();
                this.graph.selection.deleteSelectedNodes();
            }
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'w') {
            e.preventDefault();
            this.graph.duplicateSelectedNodes();
        }
    }
}
