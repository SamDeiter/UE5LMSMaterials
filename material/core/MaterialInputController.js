/**
 * MaterialInputController - Manages all mouse and keyboard input for the Material Editor graph.
 * Extracted from MaterialGraphController.js for code complexity reduction.
 * 
 * Handles: mouse down/move/up, zoom, context menus, keyboard shortcuts.
 */

export class MaterialInputController {
    constructor(graphController) {
        this.graph = graphController;
        this.app = graphController.app;
        this.graphPanel = graphController.graphPanel;
    }

    /**
     * Handle mouse down
     */
    onMouseDown(e) {
        // Middle mouse or right mouse for panning
        if (e.button === 1 || (e.button === 2 && !e.target.closest(".node"))) {
            this.graph.isPanning = true;
            this.graph.dragStartX = e.clientX - this.graph.panX;
            this.graph.dragStartY = e.clientY - this.graph.panY;
            e.preventDefault();
        }
    }

    /**
     * Handle mouse move
     */
    onMouseMove(e) {
        if (this.graph.isPanning) {
            this.graph.panX = e.clientX - this.graph.dragStartX;
            this.graph.panY = e.clientY - this.graph.dragStartY;
            this.graph.drawGrid();
            this.graph.nodes.forEach((node) => this.graph.updateNodePosition(node));
            this.graph.wiring.updateAllWires();
        }

        if (this.graph.isDragging && this.graph.dragOffsets) {
            const dx = (e.clientX - this.graph.dragStartX) / this.graph.zoom;
            const dy = (e.clientY - this.graph.dragStartY) / this.graph.zoom;

            this.graph.selectedNodes.forEach((nodeId) => {
                const node = this.graph.nodes.get(nodeId);
                const offset = this.graph.dragOffsets.get(nodeId);
                if (node && offset) {
                    node.x = offset.x + dx;
                    node.y = offset.y + dy;
                    this.graph.updateNodePosition(node);
                }
            });

            this.graph.wiring.updateAllWires();
        }

        if (this.graph.isWiring) {
            this.graph.wiring.updateGhostWire(e);
        }
    }

    /**
     * Handle mouse up
     */
    onMouseUp(e) {
        if (this.graph.isPanning) {
            this.graph.isPanning = false;
        }

        if (this.graph.isDragging) {
            this.graph.isDragging = false;
            this.graph.dragOffsets = null;
        }

        if (this.graph.isWiring) {
            // Check if we're over a valid target pin
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (target && target.classList.contains("pin-dot")) {
                const pinEl = target.parentElement;
                const pinId = pinEl.dataset.pinId;

                // Find the target node and pin
                for (const [id, node] of this.graph.nodes) {
                    const pin = node.findPin(pinId);
                    if (pin && pin !== this.graph.wiringStartPin) {
                        this.graph.wiring.endWiring(pin);
                        return;
                    }
                }
            }

            this.graph.wiring.endWiring();
        }
    }

    /**
     * Handle mouse wheel (zoom)
     */
    onWheel(e) {
        e.preventDefault();

        const rect = this.graphPanel.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.25, Math.min(2, this.graph.zoom * zoomFactor));

        // Zoom toward mouse position
        const zoomRatio = newZoom / this.graph.zoom;
        this.graph.panX = mouseX - (mouseX - this.graph.panX) * zoomRatio;
        this.graph.panY = mouseY - (mouseY - this.graph.panY) * zoomRatio;
        this.graph.zoom = newZoom;

        // Update display
        document.getElementById("zoom-readout").textContent = `${Math.round(
            this.graph.zoom * 100
        )}%`;

        this.graph.drawGrid();
        this.graph.nodes.forEach((node) => this.graph.updateNodePosition(node));
        this.graph.wiring.updateAllWires();
    }

    /**
     * Handle context menu (right-click)
     */
    onContextMenu(e) {
        e.preventDefault();

        // Don't show menu if over a node
        if (e.target.closest(".node")) return;

        this.app.actionMenu.show(e.clientX, e.clientY);
    }

    /**
     * Handle key down
     */
    onKeyDown(e) {
        // Don't handle if in input
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        // Delete
        if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            this.graph.deleteSelected();
        }

        // Ctrl shortcuts
        if (e.ctrlKey) {
            if (e.key === "z" || e.key === "Z") {
                e.preventDefault();
                // TODO: Undo
            }
            if (e.key === "y" || e.key === "Y") {
                e.preventDefault();
                // TODO: Redo
            }
            if (e.key === "s" || e.key === "S") {
                e.preventDefault();
                this.app.save();
            }
            if (e.key === "d" || e.key === "D") {
                e.preventDefault();
                this.graph.duplicateSelected();
            }
            if (e.key === "c" || e.key === "C") {
                e.preventDefault();
                this.graph.copySelected();
            }
            if (e.key === "v" || e.key === "V") {
                e.preventDefault();
                this.graph.pasteNodes();
            }
            if (e.key === "a" || e.key === "A") {
                e.preventDefault();
                this.graph.selectAll();
            }
        }

        // Shift+WASD - Node alignment shortcuts
        if (e.shiftKey && !e.ctrlKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case "w":
                    e.preventDefault();
                    this.graph.alignSelected("top");
                    break;
                case "a":
                    e.preventDefault();
                    this.graph.alignSelected("left");
                    break;
                case "s":
                    e.preventDefault();
                    this.graph.alignSelected("bottom");
                    break;
                case "d":
                    e.preventDefault();
                    this.graph.alignSelected("right");
                    break;
            }
        }

        // F - Focus on selected nodes
        if (e.key === "f" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            this.graph.focusSelected();
        }

        // Home - Focus on main material node
        if (e.key === "Home") {
            e.preventDefault();
            this.graph.focusMainNode();
        }
    }

    /**
     * Handle key up
     */
    onKeyUp(e) {
        // Nothing special needed
    }
}
