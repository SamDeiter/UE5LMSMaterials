/**
 * BaseNode.js
 * 
 * Core node base class handling common rendering and property logic.
 */

import { MaterialPin } from "./MaterialPin.js";
import { materialNodeRegistry } from "./NodeRegistry.js";

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
    this.showPreview = definition.showPreview !== false;
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
      const parts = path.split('.');
      let value = this.properties;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
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

    // Preview thumbnail (if applicable)
    if (
      this.showPreview &&
      (this.type === "material-expression" || this.properties.showColorPreview)
    ) {
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
        c.G * 255
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
        c.G * 255
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
   */
  updatePreview(previewEl) {
    // Check for texture-based preview (TextureSample nodes)
    if (this.properties.TextureAsset && this.properties.TextureAsset !== 'None') {
      // Find the texture URL from the TextureManager
      const textureUrl = this.getTextureUrl(this.properties.TextureAsset);
      if (textureUrl) {
        previewEl.style.backgroundImage = `url(${textureUrl})`;
        previewEl.style.backgroundSize = 'cover';
        previewEl.style.backgroundPosition = 'center';
        previewEl.style.backgroundColor = 'transparent';
        return;
      }
    }
    
    // Default: show a color based on properties
    // Support both nested Color object and individual R,G,B properties
    let r = 0, g = 0, b = 0;
    
    if (this.properties.Color && typeof this.properties.Color === 'object') {
      // New style: Color object with R, G, B
      r = Math.round((this.properties.Color.R || 0) * 255);
      g = Math.round((this.properties.Color.G || 0) * 255);
      b = Math.round((this.properties.Color.B || 0) * 255);
      previewEl.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      previewEl.style.backgroundImage = 'none';
    } else if (this.properties.R !== undefined) {
      // Old style: individual R, G, B properties
      r = Math.round((this.properties.R || 0) * 255);
      g = Math.round((this.properties.G || 0) * 255);
      b = Math.round((this.properties.B || 0) * 255);
      previewEl.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      previewEl.style.backgroundImage = 'none';
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
    if (typeof window !== 'undefined' && window.textureManager) {
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
      properties: { ...this.properties },
    };
  }
}

// Associate class with registry to resolve circular dependency
materialNodeRegistry.nodeClass = MaterialNode;
