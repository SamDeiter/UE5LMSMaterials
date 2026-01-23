/**
 * GraphCommands.js
 * 
 * Concrete command implementations for graph operations.
 */

/**
 * Base Command Class
 */
export class Command {
    execute() { throw new Error('Not implemented'); }
    undo() { throw new Error('Not implemented'); }
}

/**
 * Add Node Command
 */
export class AddNodeCommand extends Command {
    constructor(graph, nodeKey, x, y, properties = null, explicitId = null) {
        super();
        this.graph = graph;
        this.nodeKey = nodeKey;
        this.x = x;
        this.y = y;
        this.properties = properties;
        this.explicitId = explicitId;
        this.nodeId = null;
    }

    execute() {
        const node = this.graph.addNode(this.nodeKey, this.x, this.y, this.explicitId);
        if (node) {
            this.nodeId = node.id;
            if (this.properties) {
                node.properties = { ...this.properties };
                node.updatePreview(node.element.querySelector('.node-preview'));
            }
        }
    }

    undo() {
        if (!this.nodeId) return;
        const node = this.graph.nodes.get(this.nodeId);
        if (node) {
            // Force delete even if it's a main node? 
            // Better to just not allow undoing main node creation if it's the only one.
            node.element.remove();
            this.graph.nodes.delete(this.nodeId);
            this.graph.app.updateCounts();
        }
    }
}

/**
 * Delete Selected Nodes Command
 */
export class DeleteNodesCommand extends Command {
    constructor(graph, nodes, links) {
        super();
        this.graph = graph;
        this.nodesData = nodes.map(n => ({
            id: n.id,
            nodeKey: n.nodeKey,
            x: n.x,
            y: n.y,
            properties: { ...n.properties }
        }));
        
        // Capture links connected to these nodes
        this.linksData = links.map(l => ({
            id: l.id,
            sourceNodeId: l.outputPin.node.id,
            sourcePinId: l.outputPin.localId,
            targetNodeId: l.inputPin.node.id,
            targetPinId: l.inputPin.localId,
            type: l.type
        }));
    }

    execute() {
        this.nodesData.forEach(data => {
            const node = this.graph.nodes.get(data.id);
            if (node) {
                node.element.remove();
                this.graph.nodes.delete(data.id);
            }
        });

        this.linksData.forEach(data => {
            if (this.graph.links.has(data.id)) {
                this.graph.wiring.breakLink(data.id);
            }
        });

        this.graph.app.updateCounts();
    }

    undo() {
        // Restore nodes
        this.nodesData.forEach(data => {
            const node = this.graph.addNode(data.nodeKey, data.x, data.y, data.id);
            if (node) {
                node.properties = { ...data.properties };
                node.updatePreview(node.element.querySelector('.node-preview'));
            }
        });

        // Restore links
        this.linksData.forEach(data => {
            const sourceNode = this.graph.nodes.get(data.sourceNodeId);
            const targetNode = this.graph.nodes.get(data.targetNodeId);
            if (sourceNode && targetNode) {
                const sourcePin = sourceNode.findPin(`${data.sourceNodeId}-${data.sourcePinId}`);
                const targetPin = targetNode.findPin(`${data.targetNodeId}-${data.targetPinId}`);
                if (sourcePin && targetPin) {
                    this.graph.wiring.createConnection(sourcePin, targetPin, data.id);
                }
            }
        });

        this.graph.app.updateCounts();
    }
}

/**
 * Move Node Command
 */
export class MoveNodeCommand extends Command {
    constructor(graph, nodeId, startPos, endPos) {
        super();
        this.graph = graph;
        this.nodeId = nodeId;
        this.startPos = startPos;
        this.endPos = endPos;
    }

    execute() {
        const node = this.graph.nodes.get(this.nodeId);
        if (node) {
            node.x = this.endPos.x;
            node.y = this.endPos.y;
            this.graph.updateNodePosition(node);
            this.graph.wiring.updateAllWires();
        }
    }

    undo() {
        const node = this.graph.nodes.get(this.nodeId);
        if (node) {
            node.x = this.startPos.x;
            node.y = this.startPos.y;
            this.graph.updateNodePosition(node);
            this.graph.wiring.updateAllWires();
        }
    }
}

/**
 * Create Link Command
 */
export class CreateLinkCommand extends Command {
    constructor(graph, sourcePinId, targetPinId, linkId = null) {
        super();
        this.graph = graph;
        this.sourcePinId = sourcePinId;
        this.targetPinId = targetPinId;
        this.linkId = linkId;
    }

    execute() {
        const sourcePin = this.findPin(this.sourcePinId);
        const targetPin = this.findPin(this.targetPinId);
        if (sourcePin && targetPin) {
            const link = this.graph.wiring.createConnection(sourcePin, targetPin, this.linkId);
            if (link) this.linkId = link.id;
        }
    }

    undo() {
        if (this.linkId) {
            this.graph.wiring.breakLink(this.linkId);
        }
    }

    findPin(fullId) {
        const parts = fullId.split('-');
        const nodeId = parts[0] + '-' + parts[1]; // Handle generateId format node-xxxx
        const node = this.graph.nodes.get(nodeId);
        return node ? node.findPin(fullId) : null;
    }
}

/**
 * Break Link Command
 */
export class BreakLinkCommand extends Command {
    constructor(graph, linkId) {
        super();
        this.graph = graph;
        this.linkId = linkId;
        const link = graph.links.get(linkId);
        if (link) {
            this.sourcePinId = link.outputPin.id;
            this.targetPinId = link.inputPin.id;
            this.type = link.type;
        }
    }

    execute() {
        this.graph.wiring.breakLink(this.linkId);
    }

    undo() {
        const sourcePin = this.findPin(this.sourcePinId);
        const targetPin = this.findPin(this.targetPinId);
        if (sourcePin && targetPin) {
            this.graph.wiring.createConnection(sourcePin, targetPin, this.linkId);
        }
    }

    findPin(fullId) {
        const parts = fullId.split('-');
        const nodeId = parts[0] + '-' + parts[1];
        const node = this.graph.nodes.get(nodeId);
        return node ? node.findPin(fullId) : null;
    }
}

/**
 * Property Change Command
 */
export class PropertyChangeCommand extends Command {
    constructor(node, propertyKey, oldValue, newValue) {
        super();
        this.node = node;
        this.propertyKey = propertyKey;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    execute() {
        this.node.properties[this.propertyKey] = this.newValue;
        this.node.updatePreview(this.node.element.querySelector('.node-preview'));
        if (this.node.app && this.node.app.details) {
            this.node.app.details.showNodeProperties(this.node);
        }
    }

    undo() {
        this.node.properties[this.propertyKey] = this.oldValue;
        this.node.updatePreview(this.node.element.querySelector('.node-preview'));
        if (this.node.app && this.node.app.details) {
            this.node.app.details.showNodeProperties(this.node);
        }
    }
}
