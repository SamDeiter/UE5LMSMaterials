/**
 * PersistenceManager.js
 * 
 * Handles serialization and persistence of material graphs.
 */

export class PersistenceManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'ue5_material_graph_data';
    }

    /**
     * Save the current graph to local storage
     * @param {Object} graphData - Serialized graph data
     */
    save(graphData) {
        try {
            const dataString = JSON.stringify(graphData);
            localStorage.setItem(this.storageKey, dataString);
            console.log('Graph saved to local storage');
            return true;
        } catch (error) {
            console.error('Failed to save graph:', error);
            return false;
        }
    }

    /**
     * Load the graph from local storage
     * @returns {Object|null} Serialized graph data or null
     */
    load() {
        try {
            const dataString = localStorage.getItem(this.storageKey);
            if (!dataString) return null;
            return JSON.parse(dataString);
        } catch (error) {
            console.error('Failed to load graph:', error);
            return null;
        }
    }

    /**
     * Clear the stored graph
     */
    clear() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Check if a saved graph exists
     */
    hasData() {
        return localStorage.getItem(this.storageKey) !== null;
    }
}
