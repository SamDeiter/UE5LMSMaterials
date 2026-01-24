/**
 * LayerPanel.js
 *
 * UI Panel for managing Material Layers.
 * Provides a layer stack interface similar to Photoshop/UE5.
 */

export class LayerPanel {
  constructor(app) {
    this.app = app;
    this.layers = [];
    this.selectedLayerIndex = -1;
    this.container = null;
    this.initialized = false;
  }

  /**
   * Initialize the layer panel
   */
  init() {
    this.container = document.getElementById("layers-content");
    if (!this.container) {
      console.warn("LayerPanel: layers-content container not found");
      return false;
    }

    this.render();
    this.bindKeyboardShortcuts();
    this.initialized = true;
    return true;
  }

  /**
   * Bind keyboard shortcuts for layer operations
   */
  bindKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Only handle if layers panel is focused or no input is active
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT";

      if (isInputActive) return;

      // Check if Ctrl key is held
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+N: Add new layer
      if (isCtrl && e.shiftKey && e.key === "N") {
        e.preventDefault();
        this.addLayer();
        this.app?.updateStatus("Layer added");
      }

      // Ctrl+Shift+D: Duplicate selected layer
      if (isCtrl && e.shiftKey && e.key === "D") {
        e.preventDefault();
        this.duplicateLayer(this.selectedLayerIndex);
      }

      // Delete: Remove selected layer
      if (e.key === "Delete" && this.layers.length > 1) {
        // Only if layer panel might be focused (not when graph is active)
        const layerPanel = document.getElementById("layers-panel");
        if (layerPanel && layerPanel.contains(activeEl)) {
          e.preventDefault();
          this.removeLayer(this.selectedLayerIndex);
        }
      }

      // Alt+Up: Move layer up
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        this.moveLayerUp(this.selectedLayerIndex);
      }

      // Alt+Down: Move layer down
      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        this.moveLayerDown(this.selectedLayerIndex);
      }
    });
  }

  /**
   * Duplicate a layer by index
   */
  duplicateLayer(index) {
    if (index < 0 || index >= this.layers.length) return null;

    const sourceLaye = this.layers[index];
    const newLayer = {
      ...sourceLaye,
      id: `layer_${Date.now()}_${this.layers.length}`,
      name: `${sourceLaye.name} Copy`,
    };

    // Insert after the source layer
    this.layers.splice(index + 1, 0, newLayer);
    this.selectedLayerIndex = index + 1;
    this.render();
    this.emitChange();
    this.app?.updateStatus(`Duplicated: ${sourceLaye.name}`);

    return newLayer;
  }

  /**
   * Rename a layer by index
   */
  renameLayer(index, newName) {
    if (index < 0 || index >= this.layers.length) return;
    if (!newName || newName.trim() === "") return;

    this.layers[index].name = newName.trim();
    this.render();
    this.emitChange();
  }

  /**
   * Add a new layer to the stack
   */
  addLayer(name = null, properties = {}) {
    const layerIndex = this.layers.length;
    const layer = {
      id: `layer_${Date.now()}_${layerIndex}`,
      name: name || `Layer ${layerIndex + 1}`,
      visible: true,
      solo: false,
      weight: 1.0,
      blendMode: "Normal",
      nodeId: null, // Reference to associated MaterialLayerBlend node
      ...properties,
    };

    this.layers.push(layer);
    this.selectedLayerIndex = this.layers.length - 1;
    this.render();
    this.emitChange();

    return layer;
  }

  /**
   * Remove a layer by index
   */
  removeLayer(index) {
    if (index < 0 || index >= this.layers.length) return;

    // Don't remove if it's the only layer
    if (this.layers.length <= 1) {
      this.app.updateStatus("Cannot remove last layer");
      return;
    }

    this.layers.splice(index, 1);

    // Adjust selection
    if (this.selectedLayerIndex >= this.layers.length) {
      this.selectedLayerIndex = this.layers.length - 1;
    }

    this.render();
    this.emitChange();
  }

  /**
   * Move a layer up in the stack
   */
  moveLayerUp(index) {
    if (index <= 0 || index >= this.layers.length) return;

    [this.layers[index], this.layers[index - 1]] = [
      this.layers[index - 1],
      this.layers[index],
    ];

    if (this.selectedLayerIndex === index) {
      this.selectedLayerIndex = index - 1;
    } else if (this.selectedLayerIndex === index - 1) {
      this.selectedLayerIndex = index;
    }

    this.render();
    this.emitChange();
  }

  /**
   * Move a layer down in the stack
   */
  moveLayerDown(index) {
    if (index < 0 || index >= this.layers.length - 1) return;

    [this.layers[index], this.layers[index + 1]] = [
      this.layers[index + 1],
      this.layers[index],
    ];

    if (this.selectedLayerIndex === index) {
      this.selectedLayerIndex = index + 1;
    } else if (this.selectedLayerIndex === index + 1) {
      this.selectedLayerIndex = index;
    }

    this.render();
    this.emitChange();
  }

  /**
   * Toggle layer visibility
   */
  toggleVisibility(index) {
    if (index < 0 || index >= this.layers.length) return;
    this.layers[index].visible = !this.layers[index].visible;
    this.render();
    this.emitChange();
  }

  /**
   * Toggle layer solo mode
   */
  toggleSolo(index) {
    if (index < 0 || index >= this.layers.length) return;

    // Toggle solo on this layer
    const wasOn = this.layers[index].solo;

    // Turn off solo on all other layers
    this.layers.forEach((layer, i) => {
      layer.solo = i === index && !wasOn;
    });

    this.render();
    this.emitChange();
  }

  /**
   * Set layer weight
   */
  setLayerWeight(index, weight) {
    if (index < 0 || index >= this.layers.length) return;
    this.layers[index].weight = Math.max(0, Math.min(1, weight));
    this.render();
    this.emitChange();
  }

  /**
   * Set layer blend mode
   */
  setLayerBlendMode(index, blendMode) {
    if (index < 0 || index >= this.layers.length) return;
    this.layers[index].blendMode = blendMode;
    this.render();
    this.emitChange();
  }

  /**
   * Select a layer
   */
  selectLayer(index) {
    if (index < 0 || index >= this.layers.length) return;
    this.selectedLayerIndex = index;
    this.render();
  }

  /**
   * Get currently selected layer
   */
  getSelectedLayer() {
    if (
      this.selectedLayerIndex < 0 ||
      this.selectedLayerIndex >= this.layers.length
    ) {
      return null;
    }
    return this.layers[this.selectedLayerIndex];
  }

  /**
   * Emit change event for graph updates
   */
  emitChange() {
    if (this.app && this.app.triggerLiveUpdate) {
      this.app.triggerLiveUpdate();
    }
  }

  /**
   * Render the layer panel UI
   */
  render() {
    if (!this.container) return;

    const blendModes = ["Normal", "Height", "Mask", "Angle", "Vertex Color"];

    let html = `
      <div class="layer-panel">
        <div class="layer-toolbar">
          <button class="layer-btn" id="add-layer-btn" title="Add Layer">
            <i class="fa-solid fa-plus"></i>
          </button>
          <button class="layer-btn" id="remove-layer-btn" title="Remove Layer">
            <i class="fa-solid fa-trash"></i>
          </button>
          <button class="layer-btn" id="move-layer-up-btn" title="Move Up">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button class="layer-btn" id="move-layer-down-btn" title="Move Down">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
        </div>
        <div class="layer-stack">
    `;

    // Render layers in reverse order (top layer first)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      const isSelected = i === this.selectedLayerIndex;
      const isSoloed = this.layers.some((l) => l.solo);
      const isVisible = layer.solo || (!isSoloed && layer.visible);

      html += `
        <div class="layer-item ${isSelected ? "selected" : ""} ${!isVisible ? "hidden-layer" : ""}" 
             data-index="${i}">
          <div class="layer-controls">
            <button class="layer-visibility-btn ${layer.visible ? "visible" : ""}" 
                    data-action="toggle-visibility" data-index="${i}" 
                    title="Toggle Visibility">
              <i class="fa-solid ${layer.visible ? "fa-eye" : "fa-eye-slash"}"></i>
            </button>
            <button class="layer-solo-btn ${layer.solo ? "active" : ""}" 
                    data-action="toggle-solo" data-index="${i}" 
                    title="Solo Layer">
              S
            </button>
          </div>
          <div class="layer-info" data-action="select" data-index="${i}">
            <div class="layer-name">${layer.name}</div>
            <div class="layer-blend-mode">${layer.blendMode}</div>
          </div>
          <div class="layer-weight-container">
            <input type="range" class="layer-weight-slider" 
                   data-action="set-weight" data-index="${i}"
                   min="0" max="100" value="${Math.round(layer.weight * 100)}"
                   title="Layer Weight: ${Math.round(layer.weight * 100)}%">
            <span class="layer-weight-value">${Math.round(layer.weight * 100)}%</span>
          </div>
        </div>
      `;
    }

    html += `
        </div>
        <div class="layer-blend-selector">
          <label>Blend Mode:</label>
          <select id="layer-blend-mode-select">
            ${blendModes
              .map(
                (mode) =>
                  `<option value="${mode}" ${this.getSelectedLayer()?.blendMode === mode ? "selected" : ""}>${mode}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  /**
   * Bind UI event handlers
   */
  bindEvents() {
    // Add layer button
    const addBtn = document.getElementById("add-layer-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => this.addLayer());
    }

    // Remove layer button
    const removeBtn = document.getElementById("remove-layer-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", () =>
        this.removeLayer(this.selectedLayerIndex),
      );
    }

    // Move up button
    const upBtn = document.getElementById("move-layer-up-btn");
    if (upBtn) {
      upBtn.addEventListener("click", () =>
        this.moveLayerUp(this.selectedLayerIndex),
      );
    }

    // Move down button
    const downBtn = document.getElementById("move-layer-down-btn");
    if (downBtn) {
      downBtn.addEventListener("click", () =>
        this.moveLayerDown(this.selectedLayerIndex),
      );
    }

    // Blend mode selector
    const blendSelect = document.getElementById("layer-blend-mode-select");
    if (blendSelect) {
      blendSelect.addEventListener("change", (e) => {
        this.setLayerBlendMode(this.selectedLayerIndex, e.target.value);
      });
    }

    // Layer item actions
    this.container.querySelectorAll("[data-action]").forEach((el) => {
      const action = el.dataset.action;
      const index = parseInt(el.dataset.index, 10);

      if (action === "toggle-visibility") {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleVisibility(index);
        });
      } else if (action === "toggle-solo") {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleSolo(index);
        });
      } else if (action === "select") {
        el.addEventListener("click", () => this.selectLayer(index));
        // Double-click to rename
        el.addEventListener("dblclick", () => this.startRename(index));
      } else if (action === "set-weight") {
        el.addEventListener("input", (e) => {
          this.setLayerWeight(index, parseInt(e.target.value, 10) / 100);
        });
      }
    });

    // Bind drag-and-drop for layer reordering
    this.bindDragAndDrop();
  }

  /**
   * Start inline rename for a layer
   */
  startRename(index) {
    if (index < 0 || index >= this.layers.length) return;

    const layer = this.layers[index];
    const layerItems = this.container.querySelectorAll(".layer-item");

    // Find the layer item (rendered in reverse order)
    const layerItem = Array.from(layerItems).find(
      (item) => parseInt(item.dataset.index, 10) === index,
    );
    if (!layerItem) return;

    const nameEl = layerItem.querySelector(".layer-name");
    if (!nameEl) return;

    // Replace text with input
    const input = document.createElement("input");
    input.type = "text";
    input.value = layer.name;
    input.className = "layer-rename-input";

    const finishRename = () => {
      const newName = input.value.trim();
      if (newName && newName !== layer.name) {
        this.renameLayer(index, newName);
      } else {
        this.render();
      }
    };

    input.addEventListener("blur", finishRename);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      } else if (e.key === "Escape") {
        input.value = layer.name;
        input.blur();
      }
    });

    nameEl.innerHTML = "";
    nameEl.appendChild(input);
    input.focus();
    input.select();
  }

  /**
   * Bind drag-and-drop for layer reordering
   */
  bindDragAndDrop() {
    const layerItems = this.container.querySelectorAll(".layer-item");

    layerItems.forEach((item) => {
      item.setAttribute("draggable", "true");

      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.index);
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        item.classList.add("drag-over");
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");

        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const toIndex = parseInt(item.dataset.index, 10);

        if (fromIndex !== toIndex) {
          this.moveLayerTo(fromIndex, toIndex);
        }
      });
    });
  }

  /**
   * Move a layer from one index to another
   */
  moveLayerTo(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.layers.length) return;
    if (toIndex < 0 || toIndex >= this.layers.length) return;
    if (fromIndex === toIndex) return;

    const layer = this.layers.splice(fromIndex, 1)[0];
    this.layers.splice(toIndex, 0, layer);

    // Update selection if needed
    if (this.selectedLayerIndex === fromIndex) {
      this.selectedLayerIndex = toIndex;
    } else if (
      fromIndex < toIndex &&
      this.selectedLayerIndex > fromIndex &&
      this.selectedLayerIndex <= toIndex
    ) {
      this.selectedLayerIndex--;
    } else if (
      fromIndex > toIndex &&
      this.selectedLayerIndex >= toIndex &&
      this.selectedLayerIndex < fromIndex
    ) {
      this.selectedLayerIndex++;
    }

    this.render();
    this.emitChange();
  }

  /**
   * Serialize layer state for persistence
   */
  serialize() {
    return {
      layers: this.layers.map((layer) => ({ ...layer })),
      selectedLayerIndex: this.selectedLayerIndex,
    };
  }

  /**
   * Deserialize and restore layer state
   */
  deserialize(data) {
    if (!data) return;

    this.layers = (data.layers || []).map((layer) => ({ ...layer }));
    this.selectedLayerIndex = data.selectedLayerIndex ?? -1;

    if (this.initialized) {
      this.render();
    }
  }
}
