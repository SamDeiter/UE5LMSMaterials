/**
 * SelectionController - Handles node selection, marquee selection, and multi-select operations.
 * Extracted from GraphController for modularity.
 */

export class SelectionController {
    /**
     * @param {Object} graphController - Reference to the parent GraphController
     */
    constructor(graphController) {
        this.graph = graphController;
        this.selectedNodes = new Set();
    }

    /**
     * Selects or deselects a node based on the mode.
     * @param {string} nodeId - The node ID to select.
     * @param {boolean} addToSelection - If true, adds to current selection.
     * @param {string} mode - Selection mode: 'add', 'remove', 'toggle', 'new'.
     */
    selectNode(nodeId, addToSelection = false, mode = 'toggle') {
        const node = this.graph.nodes.get(nodeId);
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
            const selectedNode = this.graph.nodes.get([...this.selectedNodes][0]);
            this.graph.app.details.showNodeDetails(selectedNode);
        } else {
            this.graph.app.details.clear();
        }
    }

    /**
     * Clears all selected nodes.
     */
    clearSelection() {
        this.selectedNodes.forEach(nodeId => {
            const node = this.graph.nodes.get(nodeId);
            if (node) node.element.classList.remove('selected');
        });
        this.selectedNodes.clear();
        this.graph.app.details.clear();
    }

    /**
     * Selects nodes within a marquee rectangle.
     * @param {DOMRect} rect - The marquee rectangle in screen coordinates.
     * @param {string} mode - Selection mode: 'add', 'remove', 'toggle', 'new'.
     */
    selectNodesInRect(rect, mode) {
        for (const node of this.graph.nodes.values()) {
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
            this.graph.app.details.showNodeDetails(this.graph.nodes.get([...this.selectedNodes][0]));
        } else {
            this.graph.app.details.clear();
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
            const node = this.graph.nodes.get(nodeId);
            if (!node) continue;

            // 1. Break all associated wires
            node.pins.forEach(pin => {
                this.graph.app.wiring.breakPinLinks(pin.id);
            });

            // 2. Remove node element from DOM
            node.element.remove();

            // 3. Remove node from graph map
            this.graph.nodes.delete(nodeId);
        }

        this.selectedNodes.clear();
        this.graph.app.details.clear();
        this.graph.app.persistence.autoSave();
        this.graph.app.compiler.markDirty();
    }

    /**
     * Duplicates all currently selected nodes.
     * Preserves internal connections between duplicated nodes.
     * @param {Function} createNodeFn - Function to create a new node
     * @param {Object} nodeRegistry - The node registry for getting node templates
     * @param {Object} Utils - Utility functions
     * @param {Class} NodeClass - The Node class constructor
     */
    duplicateSelectedNodes(createNodeFn, nodeRegistry, Utils, NodeClass) {
        if (this.selectedNodes.size === 0) {
            this.graph.app.wiring.deleteSelectedLinks();
            return;
        }

        const oldToNewPinIds = new Map();
        const newSelection = [];
        const offset = 20;
        const originalNodes = Array.from(this.selectedNodes).map(id => this.graph.nodes.get(id)).filter(n => n);

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
            const newNode = new NodeClass(id, newNodeData, oldNode.x + offset, oldNode.y + offset, oldNode.nodeKey, this.graph.app);

            // Transfer pin literal values
            oldNode.pinLiterals.forEach((value, pinId) => {
                const oldPinIdRelative = pinId.replace(`${oldNode.id}-`, '');
                const newPin = newNode.pins.find(p => p.id.endsWith(oldPinIdRelative));
                if (newPin) {
                    newNode.pinLiterals.set(newPin.id, value);
                }
            });

            this.graph.nodes.set(id, newNode);
            this.graph.nodesContainer.appendChild(newNode.render());
            newSelection.push(newNode.id);

            oldNode.pins.forEach((oldPin, index) => {
                const newPin = newNode.pins.find(p => p.name === oldPin.name && p.dir === oldPin.dir);
                if (newPin) {
                    oldToNewPinIds.set(oldPin.id, newPin.id);
                }
            });
        }

        // Duplicate internal connections
        for (const link of this.graph.app.wiring.links.values()) {
            const startNodeIsSelected = this.selectedNodes.has(link.startPin.node.id);
            const endNodeIsSelected = this.selectedNodes.has(link.endPin.node.id);

            if (startNodeIsSelected && endNodeIsSelected) {
                const newStartPinId = oldToNewPinIds.get(link.startPin.id);
                const newEndPinId = oldToNewPinIds.get(link.endPin.id);

                if (newStartPinId && newEndPinId) {
                    const newStartPin = this.graph.findPinById(newStartPinId);
                    const newEndPin = this.graph.findPinById(newEndPinId);

                    if (newStartPin && newEndPin && this.graph.canConnect(newStartPin, newEndPin)) {
                        this.graph.app.wiring.createConnection(newStartPin, newEndPin);
                    }
                }
            }
        }

        this.graph.app.wiring.clearLinkSelection();
        this.clearSelection();
        newSelection.forEach(nodeId => this.selectNode(nodeId, true, 'add'));
        this.graph.app.persistence.autoSave();
        this.graph.app.compiler.markDirty();
    }

    /**
     * Snaps all selected nodes to the grid.
     * @param {number} gridSize - The grid size to snap to (default: 10)
     */
    snapSelectedNodesToGrid(gridSize = 10) {
        for (const nodeId of this.selectedNodes) {
            const node = this.graph.nodes.get(nodeId);
            if (node) {
                node.x = Math.round(node.x / gridSize) * gridSize;
                node.y = Math.round(node.y / gridSize) * gridSize;
                node.element.style.left = `${node.x}px`;
                node.element.style.top = `${node.y}px`;
                this.graph.redrawNodeWires(node.id);
            }
        }
    }

    /**
     * Gets the number of selected nodes.
     * @returns {number} Number of selected nodes
     */
    get size() {
        return this.selectedNodes.size;
    }

    /**
     * Checks if a node is selected.
     * @param {string} nodeId - The node ID to check
     * @returns {boolean} True if selected
     */
    has(nodeId) {
        return this.selectedNodes.has(nodeId);
    }

    /**
     * Iterator for selected node IDs.
     */
    [Symbol.iterator]() {
        return this.selectedNodes[Symbol.iterator]();
    }
}
