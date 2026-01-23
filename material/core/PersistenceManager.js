/**
 * PersistenceManager.js
 * 
 * Handles serialization and persistence of material graphs.
 */

export class PersistenceManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'ue5_material_graph_data';
        this.currentAssetId = 'NewMaterial';
        this.dirtyAssets = new Set();
    }

    /**
     * Mark an asset as having unsaved changes
     */
    markDirty(assetId = this.currentAssetId) {
        if (!this.dirtyAssets.has(assetId)) {
            this.dirtyAssets.add(assetId);
            this.app.updateStatus(`Asset ${assetId} marked dirty`);
            // Trigger UI update (e.g., adding asterisk to title)
            this.updateTitleUI();
        }
    }

    /**
     * Clear dirty flag for an asset
     */
    clearDirty(assetId = this.currentAssetId) {
        if (this.dirtyAssets.has(assetId)) {
            this.dirtyAssets.delete(assetId);
            this.updateTitleUI();
        }
    }

    /**
     * Check if an asset is dirty
     */
    isDirty(assetId = this.currentAssetId) {
        return this.dirtyAssets.has(assetId);
    }

    /**
     * Update the window title or tab UI to reflect dirty state
     */
    updateTitleUI() {
        const title = this.isDirty() ? `${this.currentAssetId}*` : this.currentAssetId;
        // In a real UE5 editor this would update the tab title
        console.log(`Editor Title: ${title}`);
    }

    /**
     * Save the current graph to local storage
     * @param {Object} graphData - Serialized graph data
     * @param {string} assetId - ID of the asset to save
     */
    save(graphData, assetId = this.currentAssetId) {
        try {
            const dataString = JSON.stringify(graphData);
            localStorage.setItem(`${this.storageKey}_${assetId}`, dataString);
            this.clearDirty(assetId);
            console.log(`Asset ${assetId} saved to local storage`);
            return true;
        } catch (error) {
            console.error('Failed to save asset:', error);
            return false;
        }
    }

    /**
     * Load the graph from local storage
     * @param {string} assetId - ID of the asset to load
     * @returns {Object|null} Serialized graph data or null
     */
    load(assetId = this.currentAssetId) {
        try {
            const dataString = localStorage.getItem(`${this.storageKey}_${assetId}`);
            if (!dataString) return null;
            this.currentAssetId = assetId;
            this.clearDirty(assetId);
            return JSON.parse(dataString);
        } catch (error) {
            console.error('Failed to load asset:', error);
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
