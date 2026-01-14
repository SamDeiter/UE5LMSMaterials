/**
 * PaletteController.js
 * 
 * Manages the node palette/library panel with search and filtering.
 * Extracted from material-app.js for modularity.
 */

import { materialNodeRegistry } from './MaterialNodeFramework.js';

export class PaletteController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("palette-content");
    this.filterInput = document.getElementById("palette-filter");

    this.filterInput.addEventListener(
      "input",
      debounce(() => this.render(), 150)
    );
    this.render();
  }

  render() {
    const filter = this.filterInput.value.toLowerCase();
    const categories = materialNodeRegistry.getAllCategories();

    let html = "";
    categories.forEach((category) => {
      if (category === "Output") return; // Don't show main node in palette

      const nodes = materialNodeRegistry.getByCategory(category);
      const filteredNodes = filter
        ? nodes.filter(
            (n) =>
              n.title.toLowerCase().includes(filter) ||
              n.key.toLowerCase().includes(filter)
          )
        : nodes;

      if (filteredNodes.length === 0) return;

      const isCollapsed = filter ? "" : "collapsed";
      html += `
                <div class="tree-category ${isCollapsed}">
                    <div class="tree-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
                        <i class="fas fa-chevron-down"></i>
                        <span>${category}</span>
                    </div>
                    <div class="tree-category-content">
                        ${filteredNodes
                          .map(
                            (node) => `
                            <div class="tree-item" data-node-key="${
                              node.key
                            }" draggable="true">
                                <span class="tree-item-icon">${
                                  node.icon || "●"
                                }</span>
                                <span>${node.title}</span>
                                ${
                                  node.hotkey
                                    ? `<span style="margin-left:auto;color:#666;font-size:9px;">${node.hotkey.toUpperCase()}</span>`
                                    : ""
                                }
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `;
    });

    this.container.innerHTML = html;

    // Bind click events
    this.container.querySelectorAll(".tree-item").forEach((item) => {
      item.addEventListener("dblclick", () => {
        const nodeKey = item.dataset.nodeKey;
        const rect = this.app.graph.graphPanel.getBoundingClientRect();
        const x = (rect.width / 2 - this.app.graph.panX) / this.app.graph.zoom;
        const y = (rect.height / 2 - this.app.graph.panY) / this.app.graph.zoom;
        this.app.graph.addNode(nodeKey, x, y);
      });

      // Drag and drop
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.nodeKey);
      });
    });
  }
}

// ============================================================================
// DETAILS CONTROLLER

