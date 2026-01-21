/**
 * MaterialDetailsController.js
 *
 * Manages the details panel for node and material property editing.
 * Extracted from material-app.js for modularity.
 */

import { textureManager } from "../engine/TextureManager.js";

export class DetailsController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("details-content");
    this.materialProps = document.getElementById("material-properties");
    this.nodeProps = document.getElementById("node-properties");
    this.currentNode = null;

    this.bindMaterialPropertyEvents();
  }

  bindMaterialPropertyEvents() {
    // Blend mode changes affect main node pins
    const blendMode = document.getElementById("blend-mode");
    if (blendMode) {
      blendMode.addEventListener("change", () => this.updateMainNodePins());
    }

    const shadingModel = document.getElementById("shading-model");
    if (shadingModel) {
      shadingModel.addEventListener("change", () => this.updateMainNodePins());
    }

    const materialDomain = document.getElementById("material-domain");
    if (materialDomain) {
      materialDomain.addEventListener("change", () => this.updateMainNodePins());
    }
  }

  updateMainNodePins() {
    const blendModeEl = document.getElementById("blend-mode");
    const shadingModelEl = document.getElementById("shading-model");
    const blendMode = blendModeEl ? blendModeEl.value : "Opaque";
    const shadingModel = shadingModelEl ? shadingModelEl.value : "Default Lit";
    
    const mainNode = [...this.app.graph.nodes.values()].find(
      (n) => n.type === "main-output"
    );

    if (!mainNode) return;

    // Update pin visibility based on blend mode AND shading model
    mainNode.inputs.forEach((pin) => {
      if (pin.element) {
        // Pin is active if:
        // 1. No conditionalOn (always active), OR
        // 2. conditionalOn includes either current blend mode OR shading model
        const isActive = !pin.conditionalOn || 
          pin.conditionalOn.includes(blendMode) || 
          pin.conditionalOn.includes(shadingModel);
        pin.element.classList.toggle("inactive", !isActive);
      }
    });
  }

  showMaterialProperties() {
    this.materialProps.style.display = "block";
    this.nodeProps.style.display = "none";
    this.currentNode = null;
  }

  showNodeProperties(node) {
    this.currentNode = node;
    this.materialProps.style.display = "none";
    this.nodeProps.style.display = "block";

    let html = `
            <div class="property-category">
                <div class="category-header">
                    <i class="fas fa-chevron-down"></i>
                    <span>${node.title}</span>
                </div>
                <div class="category-content">
        `;

    // Render properties
    Object.entries(node.properties).forEach(([key, value]) => {
      html += this.renderProperty(key, value, node);
    });

    html += "</div></div>";
    this.nodeProps.innerHTML = html;

    // Bind property change events
    this.nodeProps.querySelectorAll("input, select").forEach((input) => {
      // Use 'input' event for sliders for live updates
      const eventType = input.type === "range" ? "input" : "change";
      
      input.addEventListener(eventType, (e) => {
        const propKey = e.target.dataset.property;
        let newValue =
          e.target.type === "checkbox" ? e.target.checked : e.target.value;

        // Parse numbers for range and number inputs
        if (e.target.type === "number" || e.target.type === "range") {
          newValue = parseFloat(newValue);
        }

        node.properties[propKey] = newValue;
        
        // Sync slider and number inputs
        const container = e.target.closest(".slider-input-group");
        if (container) {
          container.querySelectorAll(`input[data-property="${propKey}"]`).forEach(inp => {
            if (inp !== e.target) inp.value = newValue;
          });
        }
        
        node.updatePreview(node.element.querySelector(".node-preview"));

        // Trigger live update if enabled
        if (this.app && this.app.triggerLiveUpdate) {
          this.app.triggerLiveUpdate();
        }
      });
    });

    // Bind texture-specific events (file load, URL load, select)
    this.bindTextureEvents(node);
  }

  renderProperty(key, value, node) {
    if (typeof value === "boolean") {
      return `
                <div class="property-row">
                    <label>${key}</label>
                    <input type="checkbox" class="ue5-checkbox" data-property="${key}" ${
        value ? "checked" : ""
      }>
                </div>
            `;
    }

    if (typeof value === "number") {
      // Determine sensible min/max/step based on property name
      let min = 0, max = 1, step = 0.01;
      const keyLower = key.toLowerCase();
      if (keyLower.includes("speed") || keyLower.includes("scale")) {
        min = -10; max = 10; step = 0.1;
      } else if (keyLower.includes("angle") || keyLower.includes("rotation")) {
        min = -360; max = 360; step = 1;
      } else if (keyLower.includes("power") || keyLower.includes("exponent")) {
        min = 0; max = 10; step = 0.1;
      }
      
      return `
                <div class="property-row slider-row">
                    <label>${key}</label>
                    <div class="slider-input-group">
                        <input type="range" class="ue5-slider" data-property="${key}" 
                               value="${value}" min="${min}" max="${max}" step="${step}">
                        <input type="number" class="slider-number" data-property="${key}" 
                               value="${value}" step="${step}" min="${min}" max="${max}">
                    </div>
                </div>
            `;
    }

    if (typeof value === "object" && value !== null) {
      // Color/Vector value
      if ("R" in value) {
        return `
                    <div class="property-row">
                        <label>${key}</label>
                        <div style="display:flex;gap:4px;flex:1;">
                            <input type="number" data-property="${key}.R" value="${value.R}" step="0.01" style="width:50px;">
                            <input type="number" data-property="${key}.G" value="${value.G}" step="0.01" style="width:50px;">
                            <input type="number" data-property="${key}.B" value="${value.B}" step="0.01" style="width:50px;">
                        </div>
                    </div>
                `;
      }
      return "";
    }

    // Special handling for TextureAsset properties
    if (key === "TextureAsset") {
      const textures = textureManager.getAll();
      const currentTexId = value;
      const currentTex = currentTexId ? textureManager.get(currentTexId) : null;
      const previewUrl = currentTex ? currentTex.dataUrl : "";
      const texName = currentTex ? currentTex.name : "None";

      return `
        <div class="property-row texture-property">
          <label>${key}</label>
          <div class="texture-picker" data-property="${key}" data-node-id="${
        node.id
      }">
            <div class="texture-preview-container">
              ${
                previewUrl
                  ? `<img src="${previewUrl}" class="texture-preview-img" alt="${texName}">`
                  : `<div class="texture-preview-placeholder">No Texture</div>`
              }
            </div>
            <div class="texture-controls">
              <select class="texture-select" data-property="${key}">
                <option value="">None</option>
                ${textures
                  .map(
                    (t) => `
                  <option value="${t.id}" ${
                      t.id === currentTexId ? "selected" : ""
                    }>${t.name}${t.isDefault ? " (Built-in)" : ""}</option>
                `
                  )
                  .join("")}
              </select>
              <button class="texture-load-btn ue5-btn" data-property="${key}" title="Load Texture from File">
                <i class="fas fa-folder-open"></i> Load
              </button>
              <button class="texture-url-btn ue5-btn" data-property="${key}" title="Load from URL">
                <i class="fas fa-link"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return `
            <div class="property-row">
                <label>${key}</label>
                <input type="text" data-property="${key}" value="${
      value || ""
    }">
            </div>
        `;
  }

  /**
   * Bind texture-specific event handlers after rendering
   */
  bindTextureEvents(node) {
    // Texture select dropdowns
    this.nodeProps.querySelectorAll(".texture-select").forEach((select) => {
      select.addEventListener("change", (e) => {
        const propKey = e.target.dataset.property;
        node.properties[propKey] = e.target.value || null;
        this.updateTexturePreview(node, propKey);
        this.updateNodePreview(node);
      });
    });

    // Load from file buttons
    this.nodeProps.querySelectorAll(".texture-load-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const propKey = e.target.closest("button").dataset.property;
        try {
          const result = await textureManager.loadFromFile();
          node.properties[propKey] = result.id;
          this.app.updateStatus(
            `Loaded texture: ${result.name} (${result.width}x${result.height})`
          );
          this.showNodeProperties(node); // Re-render to update dropdown & preview
        } catch (err) {
          this.app.updateStatus("Texture load cancelled or failed");
        }
      });
    });

    // Load from URL buttons
    this.nodeProps.querySelectorAll(".texture-url-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const propKey = e.target.closest("button").dataset.property;
        const url = prompt("Enter image URL:", "https://");
        if (!url || url === "https://") return;

        try {
          this.app.updateStatus("Loading texture from URL...");
          const result = await textureManager.loadFromUrl(url);
          node.properties[propKey] = result.id;
          this.app.updateStatus(`Loaded texture: ${result.name}`);
          this.showNodeProperties(node); // Re-render
        } catch (err) {
          this.app.updateStatus("Failed to load texture from URL");
        }
      });
    });
  }

  /**
   * Update texture preview in the details panel
   */
  updateTexturePreview(node, propKey) {
    const texId = node.properties[propKey];
    const tex = texId ? textureManager.get(texId) : null;
    const container = this.nodeProps.querySelector(
      `.texture-picker[data-property="${propKey}"] .texture-preview-container`
    );

    if (container) {
      if (tex) {
        container.innerHTML = `<img src="${tex.dataUrl}" class="texture-preview-img" alt="${tex.name}">`;
      } else {
        container.innerHTML = `<div class="texture-preview-placeholder">No Texture</div>`;
      }
    }
  }

  /**
   * Update node preview thumbnail after property change
   */
  updateNodePreview(node) {
    if (node && node.element) {
      node.updatePreview(node.element.querySelector(".node-preview"));
    }
  }
}
