/**
 * ClipboardController.js
 * 
 * Manages copy, paste, and duplication operations for the Material Editor.
 */

export class ClipboardController {
    constructor(app, graph) {
        this.app = app;
        this.graph = graph;
        this.clipboard = [];
    }

    /**
     * Copy selected nodes to clipboard
     */
    copySelected() {
        const selectedNodes = this.graph.selection.getSelectedNodes();
        if (selectedNodes.length === 0) {
            this.app.updateStatus("No nodes selected to copy");
            return;
        }

        this.clipboard = [];
        
        selectedNodes.forEach((node) => {
            if (node.type === "main-output") return;
            this.clipboard.push({
                nodeKey: node.nodeKey,
                x: node.x,
                y: node.y,
                properties: { ...node.properties }
            });
        });

        this.app.updateStatus(`Copied ${this.clipboard.length} node(s)`);
    }

    /**
     * Paste nodes from clipboard
     */
    pasteNodes() {
        if (this.clipboard.length === 0) {
            this.app.updateStatus("Clipboard is empty");
            return;
        }

        const offset = 50;
        const newNodes = [];

        // Find the bounding box of copied nodes to calculate relative positions
        const minX = Math.min(...this.clipboard.map(n => n.x));
        const minY = Math.min(...this.clipboard.map(n => n.y));

        const rect = this.graph.graphPanel.getBoundingClientRect();
        const pasteX = (rect.width / 2 - this.graph.panX) / this.graph.zoom;
        const pasteY = (rect.height / 2 - this.graph.panY) / this.graph.zoom;

        this.clipboard.forEach((nodeData) => {
            const relX = nodeData.x - minX;
            const relY = nodeData.y - minY;

            const newNode = this.graph.addNode(
                nodeData.nodeKey,
                pasteX + relX,
                pasteY + relY
            );

            if (newNode) {
                newNode.properties = { ...nodeData.properties };
                newNodes.push(newNode);
            }
        });

        this.graph.selection.deselectAll();
        newNodes.forEach((node) => this.graph.selection.selectNode(node, true));

        this.app.updateStatus(`Pasted ${newNodes.length} node(s)`);
    }

    /**
     * Duplicate selected nodes
     */
    duplicateSelected() {
        const offset = 50;
        const newNodes = [];
        const selectedNodes = this.graph.selection.getSelectedNodes();

        selectedNodes.forEach((node) => {
            if (node.type === "main-output") return;

            const newNode = this.graph.addNode(
                node.nodeKey,
                node.x + offset,
                node.y + offset
            );
            if (newNode) {
                newNode.properties = { ...node.properties };
                newNodes.push(newNode);
            }
        });

        this.graph.selection.deselectAll();
        newNodes.forEach((node) => this.graph.selection.selectNode(node, true));
    }
}
