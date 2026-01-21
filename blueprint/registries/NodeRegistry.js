/**
 * NodeRegistry - Manages the registration and retrieval of node definitions.
 */
export class NodeRegistry {
    constructor() {
        this.nodes = new Map();
    }

    /**
     * Registers a single node definition.
     * @param {string} nodeKey - The unique key for the node (e.g., "EventBeginPlay").
     * @param {object} definition - The node definition object.
     */
    register(nodeKey, definition) {
        if (this.nodes.has(nodeKey)) {
            console.warn(`NodeRegistry: Overwriting existing node definition for '${nodeKey}'`);
        }
        this.nodes.set(nodeKey, definition);
    }

    /**
     * Registers multiple node definitions at once.
     * @param {object} definitions - An object where keys are nodeKeys and values are definitions.
     */
    registerBatch(definitions) {
        for (const [key, def] of Object.entries(definitions)) {
            this.register(key, def);
        }
    }

    /**
     * Retrieves a node definition by key.
     * @param {string} nodeKey 
     * @returns {object|undefined}
     */
    get(nodeKey) {
        return this.nodes.get(nodeKey);
    }

    /**
     * Returns all registered node definitions as an object (for compatibility).
     * @returns {object}
     */
    getAll() {
        return Object.fromEntries(this.nodes);
    }

    /**
     * Unregisters a node definition.
     * @param {string} nodeKey 
     */
    unregister(nodeKey) {
        this.nodes.delete(nodeKey);
    }

    /**
     * Checks if a node definition exists.
     * @param {string} nodeKey 
     * @returns {boolean}
     */
    has(nodeKey) {
        return this.nodes.has(nodeKey);
    }
}

// Export a singleton instance
export const nodeRegistry = new NodeRegistry();
