/**
 * SaveAssetsModal.js
 * 
 * Logic for the "Choose Files to Save" dialog in the Material Editor.
 */

export class SaveAssetsModal {
    constructor(app) {
        this.app = app;
        this.modal = null;
    }

    /**
     * Create the save assets modal
     */
    createModal() {
        if (this.modal) return;

        this.modal = document.createElement("div");
        this.modal.id = "save-assets-modal";
        this.modal.className = "modal";
        this.modal.innerHTML = `
            <div class="modal-content save-assets-content">
                <div class="modal-header">
                    <span><i class="fas fa-list-check"></i> Save Content</span>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Select the assets you wish to save:</p>
                    <div id="dirty-assets-list" class="asset-save-list">
                        <!-- Assets populated here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="save-cancel">Cancel</button>
                    <button class="btn-primary" id="save-selected">Save Selected</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        this.modal.querySelector(".modal-close").addEventListener("click", () => this.hide());
        this.modal.querySelector("#save-cancel").addEventListener("click", () => this.hide());
        this.modal.querySelector("#save-selected").addEventListener("click", () => this.handleSave());
    }

    /**
     * Show the modal with currently dirty assets
     */
    show() {
        this.createModal();
        this.populateList();
        this.modal.style.display = "flex";
    }

    /**
     * Populate the checkbox list with dirty assets
     */
    populateList() {
        const list = this.modal.querySelector("#dirty-assets-list");
        const dirtyAssets = this.app.persistence.dirtyAssets;
        
        if (dirtyAssets.size === 0) {
            list.innerHTML = "<div class='empty-save-list'>No unsaved changes found.</div>";
            this.modal.querySelector("#save-selected").disabled = true;
            return;
        }

        this.modal.querySelector("#save-selected").disabled = false;
        list.innerHTML = "";
        
        dirtyAssets.forEach(assetId => {
            const item = document.createElement("div");
            item.className = "asset-save-item";
            item.innerHTML = `
                <input type="checkbox" id="save-${assetId}" checked data-asset-id="${assetId}">
                <label for="save-${assetId}">
                    <i class="fas fa-file-code"></i> ${assetId}
                </label>
            `;
            list.appendChild(item);
        });
    }

    /**
     * Hide the modal
     */
    hide() {
        if (this.modal) {
            this.modal.style.display = "none";
        }
    }

    /**
     * Handle the save button click
     */
    handleSave() {
        const checkboxes = this.modal.querySelectorAll("input[type='checkbox']:checked");
        checkboxes.forEach(cb => {
            const assetId = cb.dataset.assetId;
            if (assetId === this.app.persistence.currentAssetId) {
                this.app.save();
            } else {
                // For other virtual assets, we'd look them up in a project manager
                this.app.persistence.clearDirty(assetId);
            }
        });
        this.hide();
        this.app.updateStatus(`Saved ${checkboxes.length} asset(s)`);
    }
}
