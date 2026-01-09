/**
 * Material Studio - UI Controller
 * Handles palette, details panel, and UI interactions.
 */

import { CONFIG, CATEGORY_COLORS } from "./config.js";
import {
  getNodesByCategory,
  CATEGORY_ORDER,
  getNodeType,
} from "./NodeRegistry.js";
import { createFragment } from "./utils.js";

/**
 * UIController - Manages all UI elements
 */
export class UIController {
  constructor(options) {
    this.paletteContainer = options.paletteContainer;
    this.detailsContainer = options.detailsContainer;
    this.previewToolbar = options.previewToolbar;
    this.graphManager = options.graphManager;
    this.previewRenderer = options.previewRenderer;

    this.init();
  }

  /**
   * Initialize UI
   */
  init() {
    this.renderPalette();
    this.setupPreviewToolbar();
    this.setupDragDrop();

    // Connect to graph manager
    if (this.graphManager) {
      this.graphManager.onNodeSelect = (node) => this.updateDetails(node);
    }
  }

  /**
   * Render the node palette
   */
  renderPalette() {
    const categories = getNodesByCategory();
    let html = "";

    CATEGORY_ORDER.forEach((cat) => {
      if (!categories[cat]) return;

      const colorClass = this.getCategoryColorClass(cat);
      html += `<div class="category-header">${cat}</div>`;

      categories[cat].forEach((n) => {
        const bgColor = CATEGORY_COLORS[cat] || "#555";
        html += `
                    <div class="palette-item" draggable="true" data-node-type="${n.type}">
                        <div class="palette-icon" style="background-color: ${bgColor}"></div>
                        <span class="palette-label">${n.title}</span>
                    </div>`;
      });
    });

    // Add delete button
    html += `
            <div class="palette-divider"></div>
            <div class="palette-item palette-delete" id="delete-selected-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete Selected</span>
            </div>`;

    this.paletteContainer.innerHTML = html;

    // Setup delete button
    const deleteBtn = document.getElementById("delete-selected-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        if (this.graphManager?.selectedNodeId) {
          this.graphManager.deleteNode(this.graphManager.selectedNodeId);
        }
      });
    }
  }

  /**
   * Get category color class
   */
  getCategoryColorClass(category) {
    const map = {
      Math: "bg-green",
      Color: "bg-purple",
      VectorOps: "bg-yellow",
      "Data Types": "bg-yellow",
      Utility: "bg-blue",
      Texture: "bg-red",
      Substrate: "bg-cyan",
      "Material Attributes": "bg-blue-dark",
      Logic: "bg-gray",
    };
    return map[category] || "bg-gray";
  }

  /**
   * Setup drag and drop for palette items
   */
  setupDragDrop() {
    // Drag start on palette items
    this.paletteContainer.addEventListener("dragstart", (e) => {
      const item = e.target.closest(".palette-item");
      if (item && item.dataset.nodeType) {
        e.dataTransfer.setData("nodeType", item.dataset.nodeType);
        e.dataTransfer.effectAllowed = "copy";
      }
    });

    // Drag over graph container
    if (this.graphManager?.container) {
      this.graphManager.container.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      });

      // Drop on graph container
      this.graphManager.container.addEventListener("drop", (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("nodeType");
        if (type) {
          const rect = this.graphManager.container.getBoundingClientRect();
          const x = e.clientX - rect.left - this.graphManager.pan.x;
          const y = e.clientY - rect.top - this.graphManager.pan.y;
          this.graphManager.createNode(type, x, y);
        }
      });
    }
  }

  /**
   * Setup preview toolbar buttons
   */
  setupPreviewToolbar() {
    if (!this.previewToolbar) return;

    const buttons = [
      { type: "sphere", icon: "circle", title: "Sphere" },
      { type: "cube", icon: "box", title: "Cube" },
      { type: "cylinder", icon: "cylinder", title: "Cylinder" },
      { type: "plane", icon: "square", title: "Plane" },
    ];

    let html = "";
    buttons.forEach((btn, i) => {
      html += `
                <button class="geo-btn ${i === 0 ? "active" : ""}" data-geo="${
        btn.type
      }" title="${btn.title}">
                    ${this.getGeoIcon(btn.icon)}
                </button>`;
    });

    this.previewToolbar.innerHTML = html;

    // Button click handler
    this.previewToolbar.addEventListener("click", (e) => {
      const btn = e.target.closest(".geo-btn");
      if (!btn) return;

      // Update active state
      this.previewToolbar
        .querySelectorAll(".geo-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update geometry
      if (this.previewRenderer) {
        this.previewRenderer.setGeometry(btn.dataset.geo);
      }
    });
  }

  /**
   * Get SVG icon for geometry button
   */
  getGeoIcon(type) {
    const icons = {
      circle:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>',
      box: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>',
      cylinder:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
      square:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
    };
    return icons[type] || icons.circle;
  }

  /**
   * Update details panel with node info
   */
  updateDetails(nodeData) {
    if (!nodeData) {
      this.detailsContainer.innerHTML = `
                <div class="details-empty">Select a node to edit properties.</div>`;
      return;
    }

    const def = getNodeType(nodeData.type);
    if (!def) return;

    let html = `
            <div class="details-header">${def.title}</div>
            <div class="details-section">
                <div class="details-row">
                    <span class="details-label">Type:</span>
                    <span class="details-value">${nodeData.type}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">ID:</span>
                    <span class="details-value">${nodeData.id}</span>
                </div>
            </div>`;

    // Show editable data if available
    if (def.data && Object.keys(nodeData.data).length > 0) {
      html += `<div class="details-section"><div class="details-section-title">Properties</div>`;

      for (const [key, value] of Object.entries(nodeData.data)) {
        // Skip internal properties
        if (key.startsWith("_") || key === "customImage" || key === "customTex")
          continue;

        html += `
                    <div class="details-row">
                        <span class="details-label">${key}:</span>
                        <span class="details-value">${this.formatValue(
                          value
                        )}</span>
                    </div>`;
      }

      html += `</div>`;
    }

    // Show connections
    const inputs =
      this.graphManager?.connections.filter(
        (c) => c.toNodeId === nodeData.id
      ) || [];
    const outputs =
      this.graphManager?.connections.filter(
        (c) => c.fromNodeId === nodeData.id
      ) || [];

    if (inputs.length > 0 || outputs.length > 0) {
      html += `<div class="details-section"><div class="details-section-title">Connections</div>`;

      if (inputs.length > 0) {
        html += `<div class="details-row"><span class="details-label">Inputs:</span><span class="details-value">${inputs.length}</span></div>`;
      }
      if (outputs.length > 0) {
        html += `<div class="details-row"><span class="details-label">Outputs:</span><span class="details-value">${outputs.length}</span></div>`;
      }

      html += `</div>`;
    }

    this.detailsContainer.innerHTML = html;
  }

  /**
   * Format value for display
   */
  formatValue(value) {
    if (typeof value === "boolean") {
      return value ? "True" : "False";
    }
    if (typeof value === "number") {
      return value.toFixed(2);
    }
    if (typeof value === "string" && value.startsWith("#")) {
      return `<span class="color-swatch" style="background:${value}"></span> ${value}`;
    }
    return String(value);
  }
}

export default UIController;
