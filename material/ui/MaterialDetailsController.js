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
    this.bindCategoryToggles();
    this.bindSearchFilter();
  }

  /**
   * Bind click handlers for collapsible category headers
   */
  bindCategoryToggles() {
    document.querySelectorAll('#material-properties .category-header').forEach(header => {
      header.addEventListener('click', () => {
        const category = header.parentElement;
        category.classList.toggle('collapsed');
        // Update chevron icon direction
        const icon = header.querySelector('i');
        if (icon) {
          icon.className = category.classList.contains('collapsed') 
            ? 'fas fa-chevron-right' 
            : 'fas fa-chevron-down';
        }
      });
    });
  }

  /**
   * Bind search filter input for property filtering
   */
  bindSearchFilter() {
    const input = document.getElementById('details-filter');
    if (!input) return;
    
    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      this.filterProperties(query);
    });
  }

  /**
   * Filter properties by search query
   */
  filterProperties(query) {
    // Filter property rows
    document.querySelectorAll('#details-content .property-row').forEach(row => {
      const label = row.querySelector('label')?.textContent.toLowerCase() || '';
      row.style.display = !query || label.includes(query) ? '' : 'none';
    });
    
    // Show/hide categories based on whether they have visible children
    document.querySelectorAll('#details-content .property-category').forEach(category => {
      const hasVisibleRows = category.querySelector('.property-row:not([style*="display: none"])');
      category.style.display = hasVisibleRows ? '' : 'none';
      
      // Auto-expand categories when searching
      if (query && hasVisibleRows) {
        category.classList.remove('collapsed');
        const icon = category.querySelector('.category-header i');
        if (icon) icon.className = 'fas fa-chevron-down';
      }
    });
  }


  bindMaterialPropertyEvents() {
    // Blend mode changes affect main node pins and conditional sections
    const blendMode = document.getElementById("blend-mode");
    if (blendMode) {
      blendMode.addEventListener("change", (e) => {
        this.updateMainNodePins();
        this.updateConditionalSections(e.target.value);
      });
      // Initialize on load
      this.updateConditionalSections(blendMode.value);
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

  /**
   * Update visibility of conditional sections based on Blend Mode
   */
  updateConditionalSections(blendMode) {
    // Opacity Mask Clip Value - only show for Masked blend mode
    const opacityClipRow = document.getElementById("opacity-clip-row");
    if (opacityClipRow) {
      opacityClipRow.style.display = blendMode === "Masked" ? "flex" : "none";
    }

    // Translucency section - only show for Translucent blend mode
    const translucencyCategory = document.querySelector('.property-category:has(#translucency-lighting)');
    if (translucencyCategory) {
      translucencyCategory.style.display = blendMode === "Translucent" ? "block" : "none";
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
    // Main material node should show Material Properties panel, not node properties
    if (node.type === "main-output") {
      this.showMaterialProperties();
      return;
    }
    
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

    // Render unconnected input pins with default values
    // Skip for main-output node - it should show Material Properties instead
    if (node.inputs && node.inputs.length > 0 && node.type !== "main-output") {
      const unconnectedInputs = node.inputs.filter(pin => !pin.connectedTo);
      if (unconnectedInputs.length > 0) {
        html += `<div class="input-defaults-section"><div class="section-label">Input Defaults</div>`;
        unconnectedInputs.forEach(pin => {
          const defaultValue = pin.defaultValue ?? 0;
          html += this.renderInputPin(pin, defaultValue, node);
        });
        html += `</div>`;
      }
    }

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

    // Bind color picker events
    this.nodeProps.querySelectorAll(".color-picker").forEach((picker) => {
      const handleColorChange = (e) => {
        const propKey = e.target.dataset.property;
        const hex = e.target.value;
        
        // Convert hex to RGB (0-1)
        const r = parseInt(hex.substr(1, 2), 16) / 255;
        const g = parseInt(hex.substr(3, 2), 16) / 255;
        const b = parseInt(hex.substr(5, 2), 16) / 255;
        
        // Update node properties
        node.properties[propKey] = { R: r, G: g, B: b };
        
        // Sync with number inputs
        const group = e.target.closest(".color-input-group");
        if (group) {
          const rInput = group.querySelector(`input[data-property="${propKey}.R"]`);
          const gInput = group.querySelector(`input[data-property="${propKey}.G"]`);
          const bInput = group.querySelector(`input[data-property="${propKey}.B"]`);
          if (rInput) rInput.value = r.toFixed(2);
          if (gInput) gInput.value = g.toFixed(2);
          if (bInput) bInput.value = b.toFixed(2);
        }
        
        node.updatePreview(node.element.querySelector(".node-preview"));
        if (this.app && this.app.triggerLiveUpdate) {
          this.app.triggerLiveUpdate();
        }
      };
      
      picker.addEventListener("input", handleColorChange);
      picker.addEventListener("change", handleColorChange);
    });

    // Bind RGB component inputs to sync back to color picker
    this.nodeProps.querySelectorAll(".color-component").forEach((input) => {
      const handleComponentChange = (e) => {
        const propKey = e.target.dataset.property;
        const [baseKey, component] = propKey.split(".");
        const newValue = parseFloat(e.target.value);
        
        // Ensure valid value
        if (isNaN(newValue)) return;
        
        // Update color object
        if (!node.properties[baseKey]) {
          node.properties[baseKey] = { R: 0, G: 0, B: 0 };
        }
        node.properties[baseKey][component] = Math.max(0, Math.min(1, newValue));
        
        // Sync color picker
        const group = e.target.closest(".color-input-group");
        if (group) {
          const picker = group.querySelector(".color-picker");
          if (picker) {
            const color = node.properties[baseKey];
            const toHex = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
            picker.value = `#${toHex(color.R)}${toHex(color.G)}${toHex(color.B)}`;
          }
        }
        
        node.updatePreview(node.element.querySelector(".node-preview"));
        if (this.app && this.app.triggerLiveUpdate) {
          this.app.triggerLiveUpdate();
        }
      };
      
      input.addEventListener("input", handleComponentChange);
      input.addEventListener("change", handleComponentChange);
    });

    // Bind input pin default value changes (number inputs)
    this.nodeProps.querySelectorAll(".pin-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const pinId = e.target.dataset.pinId;
        const component = e.target.dataset.component;
        const newValue = parseFloat(e.target.value);
        
        this.updatePinValue(node, pinId, component, newValue);
        
        // Sync with corresponding slider
        const combo = e.target.closest(".slider-number-combo");
        if (combo) {
          const slider = combo.querySelector(".pin-slider");
          if (slider) slider.value = Math.max(0, Math.min(1, newValue));
        }
      });
    });

    // Bind input pin slider changes (live updates)
    this.nodeProps.querySelectorAll(".pin-slider").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const pinId = e.target.dataset.pinId;
        const component = e.target.dataset.component;
        const newValue = parseFloat(e.target.value);
        
        this.updatePinValue(node, pinId, component, newValue);
        
        // Sync with corresponding number input
        const combo = e.target.closest(".slider-number-combo");
        if (combo) {
          const numberInput = combo.querySelector(".pin-input");
          if (numberInput) numberInput.value = newValue;
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
      let useSlider = true;
      const keyLower = key.toLowerCase();
      
      // Tiling, index, and coordinate properties: number-only (no slider)
      if (keyLower.includes("tiling") || keyLower.includes("index") || 
          keyLower.includes("coord") || keyLower.includes("channel")) {
        useSlider = false;
        min = 0; max = 100; step = 1;
      } else if (keyLower.includes("speed") || keyLower.includes("scale")) {
        min = -10; max = 10; step = 0.1;
      } else if (keyLower.includes("angle") || keyLower.includes("rotation")) {
        min = -360; max = 360; step = 1;
      } else if (keyLower.includes("power") || keyLower.includes("exponent")) {
        min = 0; max = 10; step = 0.1;
      }
      
      // Simple number input (no slider) for tiling/index properties
      if (!useSlider) {
        return `
                <div class="property-row">
                    <label>${key}</label>
                    <input type="number" class="ue5-number-input" data-property="${key}" 
                           value="${value}" step="${step}">
                </div>
            `;
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
        // Convert RGB (0-1) to hex for color picker
        const toHex = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
        const hexColor = `#${toHex(value.R)}${toHex(value.G)}${toHex(value.B)}`;
        
        return `
          <div class="property-row color-row">
            <label>${key}</label>
            <div class="color-input-group">
              <input type="color" class="color-picker" data-property="${key}" value="${hexColor}" title="Click to pick color">
              <input type="number" class="color-component" data-property="${key}.R" value="${value.R}" step="0.01" min="0" max="1" title="Red">
              <input type="number" class="color-component" data-property="${key}.G" value="${value.G}" step="0.01" min="0" max="1" title="Green">
              <input type="number" class="color-component" data-property="${key}.B" value="${value.B}" step="0.01" min="0" max="1" title="Blue">
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
   * Render an input pin with its default value
   */
  renderInputPin(pin, defaultValue, node) {
    const pinName = pin.name || pin.localId || "Input";
    const pinType = pin.type || "float";
    
    // Different rendering based on expected type
    if (pinType === "float3" || pinType === "color") {
      // Vector3: three number inputs with sliders
      const v0 = defaultValue[0] ?? 0;
      const v1 = defaultValue[1] ?? 0;
      const v2 = defaultValue[2] ?? 0;
      return `
        <div class="property-row input-pin-row">
          <label>${pinName}</label>
          <div class="vec3-input-group">
            <div class="slider-number-combo">
              <input type="range" class="pin-slider" data-pin-id="${pin.localId}" data-component="0" value="${v0}" min="0" max="1" step="0.01">
              <input type="number" class="pin-input" data-pin-id="${pin.localId}" data-component="0" value="${v0}" step="0.01">
            </div>
            <div class="slider-number-combo">
              <input type="range" class="pin-slider" data-pin-id="${pin.localId}" data-component="1" value="${v1}" min="0" max="1" step="0.01">
              <input type="number" class="pin-input" data-pin-id="${pin.localId}" data-component="1" value="${v1}" step="0.01">
            </div>
            <div class="slider-number-combo">
              <input type="range" class="pin-slider" data-pin-id="${pin.localId}" data-component="2" value="${v2}" min="0" max="1" step="0.01">
              <input type="number" class="pin-input" data-pin-id="${pin.localId}" data-component="2" value="${v2}" step="0.01">
            </div>
          </div>
        </div>
      `;
    }
    
    // Default: scalar input with slider
    const val = typeof defaultValue === 'number' ? defaultValue : 0;
    return `
      <div class="property-row input-pin-row">
        <label>${pinName}</label>
        <div class="slider-number-combo">
          <input type="range" class="pin-slider" data-pin-id="${pin.localId}" value="${val}" min="0" max="1" step="0.01">
          <input type="number" class="pin-input" data-pin-id="${pin.localId}" value="${val}" step="0.01">
        </div>
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

  /**
   * Update a pin's default value
   */
  updatePinValue(node, pinId, component, newValue) {
    const pin = node.inputs.find(p => p.localId === pinId);
    if (!pin) return;

    if (component !== undefined) {
      // Vector component
      if (!Array.isArray(pin.defaultValue)) {
        pin.defaultValue = [0, 0, 0];
      }
      pin.defaultValue[parseInt(component)] = newValue;
    } else {
      // Scalar value
      pin.defaultValue = newValue;
    }
    
    // Trigger live update
    if (this.app && this.app.triggerLiveUpdate) {
      this.app.triggerLiveUpdate();
    }
  }
}
