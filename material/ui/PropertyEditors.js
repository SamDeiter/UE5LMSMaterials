/**
 * PropertyEditors.js
 * 
 * Modular rendering functions for different property types in the details panel.
 */

import { textureManager } from "../engine/TextureManager.js";

export class PropertyEditors {
  /**
   * Render a boolean (checkbox) property
   */
  static renderBoolean(key, value) {
    return `
      <div class="property-row">
        <label>${key}</label>
        <input type="checkbox" class="ue5-checkbox" data-property="${key}" ${value ? "checked" : ""}>
      </div>
    `;
  }

  /**
   * Render a numeric property (with optional slider)
   */
  static renderNumber(key, value) {
    const keyLower = key.toLowerCase();
    let min = 0, max = 1, step = 0.01;
    let useSlider = true;
    
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

  /**
   * Render a color picker property
   */
  static renderColor(key, value) {
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

  /**
   * Render a texture picker property
   */
  static renderTexture(key, value, nodeId) {
    const textures = textureManager.getAll();
    const currentTexId = value;
    const currentTex = currentTexId ? textureManager.get(currentTexId) : null;
    const previewUrl = currentTex ? currentTex.dataUrl : "";
    const texName = currentTex ? currentTex.name : "None";

    return `
      <div class="property-row texture-property">
        <label>${key}</label>
        <div class="texture-picker" data-property="${key}" data-node-id="${nodeId}">
          <div class="texture-preview-container">
            ${previewUrl
              ? `<img src="${previewUrl}" class="texture-preview-img" alt="${texName}">`
              : `<div class="texture-preview-placeholder">No Texture</div>`
            }
          </div>
          <div class="texture-controls">
            <select class="texture-select" data-property="${key}">
              <option value="">None</option>
              ${textures.map(t => `<option value="${t.id}" ${t.id === currentTexId ? "selected" : ""}>${t.name}${t.isDefault ? " (Built-in)" : ""}</option>`).join("")}
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

  /**
   * Render an input pin default value editor
   */
  static renderInputPin(pin, defaultValue) {
    const pinName = pin.name || pin.localId || "Input";
    const pinType = pin.type || "float";
    
    if (pinType === "float3" || pinType === "color") {
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
}
