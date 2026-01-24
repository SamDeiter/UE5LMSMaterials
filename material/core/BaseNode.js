/**
 * BaseNode.js
 *
 * Core node base class handling common rendering and property logic.
 */

import { MaterialPin } from "./MaterialPin.js";
import { materialNodeRegistry } from "./NodeRegistry.js";
import { nodePreviewRenderer } from "../engine/NodePreviewRenderer.js";

export class MaterialNode {
  constructor(id, definition, x, y, app) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.app = app;

    // Copy definition properties
    this.nodeKey = definition.key;
    this.title = definition.title;
    this.type = definition.type || "material-expression";
    this.category = definition.category || "Uncategorized";
    this.icon = definition.icon || "";
    this.headerColor = definition.headerColor || null;
    this.shaderCode = definition.shaderCode || "";

    // Initialize pins from definition
    this.inputs = [];
    this.outputs = [];
    this.initPins(definition.pins || []);

    // Copy default properties
    this.properties = { ...(definition.properties || {}) };

    // UI state
    this.element = null;
    this.selected = false;
    this.collapsed = false;
    this.showPreview = definition.showPreview !== false;

    // Error state (Phase 8: Node Error Handling)
    this.hasError = false;
    this.errorMessage = null;
    this.hasWarning = false;
    this.warningMessage = null;
  }

  /**
   * Set error state on node
   * @param {string} message - Error message to display
   */
  setError(message) {
    this.hasError = true;
    this.errorMessage = message;
    this.updateErrorDisplay();

    // Report to stats panel
    if (this.app && this.app.stats) {
      this.app.stats.addError(`[${this.nodeKey}] ${message}`);
    }
  }

  /**
   * Set warning state on node
   * @param {string} message - Warning message to display
   */
  setWarning(message) {
    this.hasWarning = true;
    this.warningMessage = message;
    this.updateErrorDisplay();

    if (this.app && this.app.stats) {
      this.app.stats.addWarning(`[${this.nodeKey}] ${message}`);
    }
  }

  /**
   * Clear error and warning states
   */
  clearErrors() {
    this.hasError = false;
    this.errorMessage = null;
    this.hasWarning = false;
    this.warningMessage = null;
    this.updateErrorDisplay();
  }

  /**
   * Update the error/warning display on the node element
   */
  updateErrorDisplay() {
    if (!this.element) return;

    // Remove existing error banner
    const existingBanner = this.element.querySelector(".node-error-banner");
    if (existingBanner) existingBanner.remove();

    // Update node class for styling
    this.element.classList.toggle("node-has-error", this.hasError);
    this.element.classList.toggle(
      "node-has-warning",
      this.hasWarning && !this.hasError,
    );

    // Add error banner if needed
    if (this.hasError || this.hasWarning) {
      const banner = document.createElement("div");
      banner.className = `node-error-banner ${this.hasError ? "error" : "warning"}`;
      banner.textContent = this.hasError ? "❌ ERROR!" : "⚠️ WARNING";
      banner.title = this.hasError ? this.errorMessage : this.warningMessage;

      // Insert after header
      const header = this.element.querySelector(".node-header");
      if (header && header.nextSibling) {
        this.element.insertBefore(banner, header.nextSibling);
      } else {
        this.element.appendChild(banner);
      }
    }
  }

  /**
   * Check if node has required inputs connected
   * @returns {Array} List of missing required input names
   */
  getMissingRequiredInputs() {
    const missing = [];
    this.inputs.forEach((pin) => {
      // Inputs without defaults that aren't connected are "required"
      if (
        pin.required &&
        !pin.isConnected() &&
        pin.defaultValue === undefined
      ) {
        missing.push(pin.name);
      }
    });
    return missing;
  }

  /**
   * Initialize pins from definition array
   */
  initPins(pinDefs) {
    pinDefs.forEach((pinDef) => {
      const pin = new MaterialPin(this, pinDef);
      if (pinDef.dir === "in") {
        this.inputs.push(pin);
      } else {
        this.outputs.push(pin);
      }
    });
  }

  /**
   * Get the shader code for this node, with variable substitution
   */
  getShaderSnippet() {
    let code = this.shaderCode;

    // Substitute property values into shader code
    // Supports nested paths like {Color.R} for objects
    // e.g., "float3 result = float3({Color.R}, {Color.G}, {Color.B});"
    const propPattern = /\{([\w.]+)\}/g;
    code = code.replace(propPattern, (match, path) => {
      const parts = path.split(".");
      let value = this.properties;
      for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
          value = value[part];
        } else {
          // Fall back to literal path if not found
          return match;
        }
      }
      return value;
    });

    // Substitute pin references
    this.inputs.forEach((pin) => {
      const inputVar = pin.isConnected()
        ? pin.getConnectedOutputVar()
        : pin.getDefaultValue();
      code = code.replace(new RegExp(`\\{${pin.name}\\}`, "g"), inputVar);
    });

    return code;
  }

  /**
   * Render the node to a DOM element
   */
  render() {
    // Special rendering for reroute nodes
    if (this.type === "reroute-node") {
      return this.renderRerouteNode();
    }

    // Special rendering for comment nodes
    if (this.type === "comment-node") {
      return this.renderCommentNode();
    }

    // Standard node rendering
    return this.renderStandardNode();
  }

  /**
   * Render a standard material expression node
   */
  renderStandardNode() {
    const el = document.createElement("div");
    el.className = `node ${this.type}`;
    el.id = `node-${this.id}`;
    el.dataset.nodeId = this.id;
    el.dataset.category = this.category;
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;

    // Header with title, subtitle, and collapse button
    const header = document.createElement("div");
    header.className = "node-header";
    if (this.headerColor) {
      header.style.background = this.headerColor;
    }

    // Title row (title + collapse arrow)
    const titleRow = document.createElement("div");
    titleRow.className = "node-title-row";

    const titleWrap = document.createElement("div");
    titleWrap.style.display = "flex";
    titleWrap.style.alignItems = "center";

    if (this.icon) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "node-icon";
      iconSpan.textContent = this.icon;
      titleWrap.appendChild(iconSpan);
    }

    const titleSpan = document.createElement("span");
    titleSpan.className = "node-title";
    titleSpan.textContent = this.title;
    titleWrap.appendChild(titleSpan);

    titleRow.appendChild(titleWrap);

    // Collapse button
    const collapseBtn = document.createElement("span");
    collapseBtn.className = "node-collapse-btn";
    collapseBtn.innerHTML = "▼";
    collapseBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Don't trigger node selection
      this.collapsed = !this.collapsed;
      el.classList.toggle("collapsed", this.collapsed);
      collapseBtn.innerHTML = this.collapsed ? "▶" : "▼";

      // Update wire positions after collapse/expand (fixes wires pointing to old positions)
      if (this.app?.graph?.wiring) {
        // Small delay to allow CSS transition to complete
        requestAnimationFrame(() => {
          this.app.graph.wiring.updateAllWires();
        });
      }
    });
    titleRow.appendChild(collapseBtn);

    header.appendChild(titleRow);

    // Subtitle showing node type/category
    const subtitle = document.createElement("div");
    subtitle.className = "node-subtitle";
    subtitle.textContent = this.category || this.type;
    header.appendChild(subtitle);

    el.appendChild(header);

    // Content area with pins
    const content = document.createElement("div");
    content.className = "node-content";

    // Render input pins on the left
    const inputsDiv = document.createElement("div");
    inputsDiv.className = "node-inputs";
    this.inputs.forEach((pin) => {
      inputsDiv.appendChild(pin.render());
    });
    content.appendChild(inputsDiv);

    // Preview thumbnail - show on all expression nodes (UE5 parity)
    if (this.showPreview && this.type === "material-expression") {
      const preview = document.createElement("div");
      preview.className = "node-preview";
      preview.id = `preview-${this.id}`;
      this.updatePreview(preview);
      content.appendChild(preview);
    }

    // Render output pins on the right
    const outputsDiv = document.createElement("div");
    outputsDiv.className = "node-outputs";
    this.outputs.forEach((pin) => {
      outputsDiv.appendChild(pin.render());
    });
    content.appendChild(outputsDiv);

    el.appendChild(content);

    this.element = el;
    return el;
  }

  /**
   * Render a reroute node (compact connection point)
   */
  renderRerouteNode() {
    const el = document.createElement("div");
    el.className = "node reroute-node";
    el.id = `node-${this.id}`;
    el.dataset.nodeId = this.id;
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;

    // Single diamond-shaped connector
    const connector = document.createElement("div");
    connector.className = "reroute-connector";

    // Create both input and output pins on the same element
    const inputPin = this.inputs[0];
    const outputPin = this.outputs[0];

    if (inputPin) {
      const inDot = document.createElement("div");
      inDot.className = "pin-dot reroute-in";
      inDot.style.backgroundColor = inputPin.color;
      inDot.style.borderColor = inputPin.color;
      inDot.dataset.pinId = inputPin.id;
      if (!inputPin.isConnected()) inDot.classList.add("hollow");
      connector.appendChild(inDot);
      inputPin.element = inDot.parentElement || connector;
    }

    if (outputPin) {
      const outDot = document.createElement("div");
      outDot.className = "pin-dot reroute-out";
      outDot.style.backgroundColor = outputPin.color;
      outDot.style.borderColor = outputPin.color;
      outDot.dataset.pinId = outputPin.id;
      if (!outputPin.isConnected()) outDot.classList.add("hollow");
      connector.appendChild(outDot);
      outputPin.element = outDot.parentElement || connector;
    }

    el.appendChild(connector);
    this.element = el;
    return el;
  }

  /**
   * Render a comment node (expandable text box)
   */
  renderCommentNode() {
    const el = document.createElement("div");
    el.className = "node comment-node";
    el.id = `node-${this.id}`;
    el.dataset.nodeId = this.id;
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;
    el.style.width = `${this.properties.Width || 200}px`;
    el.style.height = `${this.properties.Height || 100}px`;

    // Apply comment color
    if (this.properties.CommentColor) {
      const c = this.properties.CommentColor;
      el.style.borderColor = `rgb(${Math.round(c.R * 255)}, ${Math.round(
        c.G * 255,
      )}, ${Math.round(c.B * 255)})`;
    }

    // Header with editable title
    const header = document.createElement("div");
    header.className = "node-header comment-header";
    if (this.headerColor) {
      header.style.background = this.headerColor;
    } else if (this.properties.CommentColor) {
      const c = this.properties.CommentColor;
      header.style.background = `rgb(${Math.round(c.R * 255)}, ${Math.round(
        c.G * 255,
      )}, ${Math.round(c.B * 255)})`;
    }

    const titleInput = document.createElement("input");
    titleInput.className = "comment-title-input";
    titleInput.type = "text";
    titleInput.value = this.properties.CommentText || "Comment";
    titleInput.placeholder = "Comment";
    titleInput.addEventListener("change", (e) => {
      this.properties.CommentText = e.target.value;
      if (this.bubble) this.bubble.textContent = e.target.value;
    });
    titleInput.addEventListener("click", (e) => e.stopPropagation());
    header.appendChild(titleInput);

    // Optional Bubble (UE5 Feature: show text even when zoomed out)
    if (this.properties.ShowBubble) {
      const bubble = document.createElement("div");
      bubble.className = "comment-bubble";
      bubble.textContent = this.properties.CommentText || "Comment";
      el.appendChild(bubble);
      this.bubble = bubble;
    }

    el.appendChild(header);

    // Content area (for grouping other nodes visually)
    const content = document.createElement("div");
    content.className = "node-content comment-body";
    el.appendChild(content);

    // Resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "comment-resize-handle";
    resizeHandle.innerHTML = "⋱";
    resizeHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      this.startResize(e);
    });
    el.appendChild(resizeHandle);

    this.element = el;
    return el;
  }

  /**
   * Start resizing comment node
   */
  startResize(e) {
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = this.properties.Width || 200;
    const startHeight = this.properties.Height || 100;

    const onMouseMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.properties.Width = Math.max(100, startWidth + dx);
      this.properties.Height = Math.max(50, startHeight + dy);
      this.element.style.width = `${this.properties.Width}px`;
      this.element.style.height = `${this.properties.Height}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  /**
   * Update the preview thumbnail (override in subclasses)
   * Uses WebGL-based NodePreviewRenderer when available for live 3D previews
   */
  updatePreview(previewEl) {
    // Try WebGL-based preview first
    if (nodePreviewRenderer && nodePreviewRenderer.initialized) {
      const previewResult = this.renderWebGLPreview(previewEl);
      if (previewResult) return;
    }

    // Fallback to CSS-based preview
    this.renderCSSPreview(previewEl);
  }

  /**
   * Render a WebGL-based 3D preview using NodePreviewRenderer
   */
  renderWebGLPreview(previewEl) {
    if (!nodePreviewRenderer || !this.app) return false;

    try {
      // Evaluate the node output
      let evaluatedValue = null;
      let previewType = "sphere";

      // Try to get evaluated output from the node
      if (this.outputs.length > 0 && this.app.evaluatePin) {
        const mainOutput = this.outputs[0];
        evaluatedValue = this.app.evaluatePin(mainOutput);

        // Determine preview type based on output type
        if (mainOutput.type === "float") {
          previewType = "mask";
        } else if (
          mainOutput.type === "float3" &&
          this.category?.includes("Normal")
        ) {
          previewType = "normal";
        } else if (
          mainOutput.type === "texture" ||
          mainOutput.type === "texture2d"
        ) {
          // Textures use their own preview
          return false;
        }
      }

      // Use properties if no evaluated value
      if (evaluatedValue === null) {
        if (this.properties.Color) {
          evaluatedValue = this.properties.Color;
        } else if (this.properties.R !== undefined) {
          evaluatedValue = {
            R: this.properties.R || 0,
            G: this.properties.G || 0,
            B: this.properties.B || 0,
          };
        } else if (this.properties.Value !== undefined) {
          evaluatedValue = this.properties.Value;
          previewType = "mask";
        }
      }

      if (evaluatedValue === null) return false;

      // Render the preview
      const dataUrl = nodePreviewRenderer.renderPreview(
        this,
        evaluatedValue,
        previewType,
      );
      if (dataUrl) {
        previewEl.style.backgroundImage = `url(${dataUrl})`;
        previewEl.style.backgroundSize = "cover";
        previewEl.style.backgroundPosition = "center";
        previewEl.style.backgroundColor = "transparent";
        previewEl.classList.add("webgl-preview");
        return true;
      }
    } catch (e) {
      console.debug("WebGL preview fallback:", e.message);
    }

    return false;
  }

  /**
   * Render a CSS-based preview (fallback when WebGL not available)
   */
  renderCSSPreview(previewEl) {
    // Check for texture-based preview (TextureSample nodes)
    if (
      this.properties.TextureAsset &&
      this.properties.TextureAsset !== "None"
    ) {
      // Find the texture URL from the TextureManager
      const textureUrl = this.getTextureUrl(this.properties.TextureAsset);
      if (textureUrl) {
        previewEl.style.backgroundImage = `url(${textureUrl})`;
        previewEl.style.backgroundSize = "cover";
        previewEl.style.backgroundPosition = "center";
        previewEl.style.backgroundColor = "transparent";
        return;
      }
    }

    // Substrate BSDF preview - show diffuse albedo with specular highlight indicator
    if (this.type === "substrate-expression" && this.app && this.app.graph) {
      // Try to evaluate the node to get BSDF properties
      const outputPin = this.outputs.find(
        (p) => p.type === "substrate" || p.localId === "out",
      );
      if (outputPin && this.app.evaluatePin) {
        try {
          const bsdf = this.app.evaluatePin(outputPin);
          if (bsdf && bsdf.type === "substrate_bsdf") {
            // Show diffuse albedo as base color
            const diffuse = bsdf.diffuseAlbedo || [0.5, 0.5, 0.5];
            const r = Math.round(Math.min(1, diffuse[0]) * 255);
            const g = Math.round(Math.min(1, diffuse[1]) * 255);
            const b = Math.round(Math.min(1, diffuse[2]) * 255);

            // Create gradient to show specular highlight (F0 influence)
            const f0 = bsdf.f0 || [0.04, 0.04, 0.04];
            const specR = Math.round(Math.min(1, f0[0]) * 255);
            const specG = Math.round(Math.min(1, f0[1]) * 255);
            const specB = Math.round(Math.min(1, f0[2]) * 255);

            // Radial gradient simulating sphere lighting
            previewEl.style.background = `radial-gradient(circle at 35% 35%, 
              rgb(${specR}, ${specG}, ${specB}) 0%, 
              rgb(${r}, ${g}, ${b}) 50%, 
              rgb(${Math.round(r * 0.3)}, ${Math.round(g * 0.3)}, ${Math.round(b * 0.3)}) 100%)`;
            previewEl.style.backgroundImage = "none";
            previewEl.style.backgroundSize = "";
            previewEl.style.backgroundPosition = "";
            return;
          }
        } catch (e) {
          // Fallback if evaluation fails
          console.debug("Substrate preview evaluation skipped:", e.message);
        }
      }

      // Fallback for Substrate nodes without evaluation - show default purple
      previewEl.style.background =
        "linear-gradient(135deg, #A30FF5 0%, #5a0a8a 100%)";
      return;
    }

    // Default: show a color based on properties
    // Support both nested Color object and individual R,G,B properties
    let r = 0,
      g = 0,
      b = 0;

    if (this.properties.Color && typeof this.properties.Color === "object") {
      // New style: Color object with R, G, B
      r = Math.round((this.properties.Color.R || 0) * 255);
      g = Math.round((this.properties.Color.G || 0) * 255);
      b = Math.round((this.properties.Color.B || 0) * 255);
      previewEl.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      previewEl.style.backgroundImage = "none";
    } else if (this.properties.R !== undefined) {
      // Old style: individual R, G, B properties
      r = Math.round((this.properties.R || 0) * 255);
      g = Math.round((this.properties.G || 0) * 255);
      b = Math.round((this.properties.B || 0) * 255);
      previewEl.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      previewEl.style.backgroundImage = "none";
    }
  }

  /**
   * Get texture URL from asset ID
   */
  getTextureUrl(assetId) {
    if (this.app && this.app.textureManager) {
      const texture = this.app.textureManager.get(assetId);
      if (texture && texture.dataUrl) {
        return texture.dataUrl;
      }
    }
    if (typeof window !== "undefined" && window.textureManager) {
      const texture = window.textureManager.get(assetId);
      if (texture && texture.dataUrl) {
        return texture.dataUrl;
      }
    }
    return null;
  }

  /**
   * Find a pin by ID
   */
  findPin(pinId) {
    return [...this.inputs, ...this.outputs].find((p) => p.id === pinId);
  }

  /**
   * Serialize node state for persistence
   */
  serialize() {
    return {
      id: this.id,
      nodeKey: this.nodeKey,
      x: this.x,
      y: this.y,
      properties: JSON.parse(JSON.stringify(this.properties)),
    };
  }
}

// Associate class with registry to resolve circular dependency
materialNodeRegistry.nodeClass = MaterialNode;
