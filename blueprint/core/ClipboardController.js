/**
 * ClipboardController.js
 * 
 * Manages copy, paste, and duplicate operations for Blueprint nodes.
 * Extracted from graph.js for modularity.
 */
import { Utils } from '../../shared/utils.js';
import { Node } from './Node.js';
import { nodeRegistry } from '../registries/NodeRegistry.js';

export class ClipboardController {
  constructor(graph) {
    this.graph = graph;
    this.clipboard = null;
  }

  /**
   * Copies the currently selected nodes to the internal clipboard.
   */
  copy() {
    const selectedNodes = this.graph.selection.selectedNodes;
    if (selectedNodes.size === 0) return;

    const exportData = {
      nodes: [],
      links: []
    };

    const nodeIds = Array.from(selectedNodes);
    nodeIds.forEach(id => {
      const node = this.graph.nodes.get(id);
      if (node) {
        exportData.nodes.push({
          id: node.id,
          nodeKey: node.nodeKey,
          x: node.x,
          y: node.y,
          title: node.title,
          customData: { ...node.customData },
          pins: node.getPinsData()
        });
      }
    });

    // Copy links only if BOTH start and end nodes are selected
    for (const link of this.graph.app.wiring.links.values()) {
      if (selectedNodes.has(link.startPin.node.id) && selectedNodes.has(link.endPin.node.id)) {
        exportData.links.push({
          startPinId: link.startPin.id,
          endPinId: link.endPin.id
        });
      }
    }

    this.clipboard = JSON.stringify(exportData);
    console.log(`Copied ${exportData.nodes.length} nodes and ${exportData.links.length} links`);
  }

  /**
   * Pastes nodes from the internal clipboard into the graph.
   * Offsets the positions to avoid exact overlap.
   */
  paste(offsetX = 20, offsetY = 20) {
    if (!this.clipboard) return;

    try {
      const data = JSON.parse(this.clipboard);
      const oldToNewPinIds = new Map();
      const newSelection = [];

      // 1. Create new nodes
      data.nodes.forEach(nodeData => {
        const template = nodeRegistry.get(nodeData.nodeKey);
        if (!template) return;

        const newId = Utils.uniqueId('node');
        const newNode = new Node(newId, { ...template, ...nodeData }, nodeData.x + offsetX, nodeData.y + offsetY, nodeData.nodeKey, this.graph.app);
        
        // Restore literal values
        if (nodeData.pins) {
            nodeData.pins.forEach(p => {
                const fullId = p.id.includes(newNode.id) ? p.id : `${newNode.id}-${p.id}`;
                if (p.literalValue !== undefined) {
                    newNode.pinLiterals.set(fullId, p.literalValue);
                }
            });
        }

        this.graph.nodes.set(newId, newNode);
        this.graph.nodesContainer.appendChild(newNode.render());
        newSelection.push(newId);

        // Map old pin IDs to new ones for link restoration
        nodeData.pins.forEach(oldPin => {
          const oldFullId = oldPin.id.includes(nodeData.id) ? oldPin.id : `${nodeData.id}-${oldPin.id}`;
          const newPin = newNode.pins.find(p => p.name === oldPin.name && p.dir === oldPin.dir);
          if (newPin) {
            oldToNewPinIds.set(oldFullId, newPin.id);
          }
        });
      });

      // 2. Restore internal links
      data.links.forEach(linkData => {
        const newStartPinId = oldToNewPinIds.get(linkData.startPinId);
        const newEndPinId = oldToNewPinIds.get(linkData.endPinId);

        if (newStartPinId && newEndPinId) {
          const startPin = this.graph.findPinById(newStartPinId);
          const endPin = this.graph.findPinById(newEndPinId);
          if (startPin && endPin) {
            this.graph.app.wiring.createConnection(startPin, endPin);
          }
        }
      });

      // 3. Update selection
      this.graph.deselectAll();
      newSelection.forEach(id => this.graph.selectNode(id, true, 'add'));
      
      this.graph.app.persistence.autoSave();
      this.graph.app.compiler.markDirty();

    } catch (err) {
      console.error("Paste failed:", err);
    }
  }

  /**
   * Duplicates selected nodes immediately.
   */
  duplicate() {
    this.copy();
    this.paste(20, 20);
  }
}
