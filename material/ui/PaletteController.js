/**
 * PaletteController.js
 *
 * Manages the node palette/library panel with search and filtering.
 * Extracted from material-app.js for modularity.
 */

import { materialNodeRegistry } from "../core/MaterialNodeFramework.js";
import { debounce } from "../../shared/utils.js";

export class PaletteController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("palette-content");
    this.filterInput = document.getElementById("palette-filter");
    
    // Favorites stored in localStorage
    this.favorites = this.loadFavorites();

    this.filterInput.addEventListener(
      "input",
      debounce(() => this.render(), 150)
    );
    
    // Enter key to place first search result
    this.filterInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.placeFirstResult();
      }
    });
    
    this.render();
  }

  /**
   * Load favorites from localStorage
   */
  loadFavorites() {
    try {
      return new Set(JSON.parse(localStorage.getItem("palette-favorites") || "[]"));
    } catch {
      return new Set();
    }
  }

  /**
   * Save favorites to localStorage
   */
  saveFavorites() {
    localStorage.setItem("palette-favorites", JSON.stringify([...this.favorites]));
  }

  /**
   * Add node to favorites
   */
  addToFavorites(nodeKey) {
    this.favorites.add(nodeKey);
    this.saveFavorites();
    this.render();
    this.app.updateStatus(`Added ${nodeKey} to Favorites`);
  }

  /**
   * Remove node from favorites
   */
  removeFromFavorites(nodeKey) {
    this.favorites.delete(nodeKey);
    this.saveFavorites();
    this.render();
    this.app.updateStatus(`Removed ${nodeKey} from Favorites`);
  }

  /**
   * Place first search result on graph
   */
  placeFirstResult() {
    const filter = this.filterInput.value.toLowerCase();
    if (!filter) return;

    const categories = materialNodeRegistry.getAllCategories();
    for (const category of categories) {
      if (category === "Output") continue;
      const nodes = materialNodeRegistry.getByCategory(category);
      const match = nodes.find(
        (n) =>
          n.title.toLowerCase().includes(filter) ||
          n.key.toLowerCase().includes(filter)
      );
      if (match) {
        const rect = this.app.graph.graphPanel.getBoundingClientRect();
        const x = (rect.width / 2 - this.app.graph.panX) / this.app.graph.zoom;
        const y = (rect.height / 2 - this.app.graph.panY) / this.app.graph.zoom;
        this.app.graph.addNode(match.key, x, y);
        this.filterInput.value = "";
        this.render();
        this.app.updateStatus(`Added ${match.title}`);
        return;
      }
    }
  }

  render() {
    const filter = this.filterInput.value.toLowerCase();
    const categories = materialNodeRegistry.getAllCategories();

    let html = "";
    
    // Favorites category first (if any exist)
    if (this.favorites.size > 0 && !filter) {
      const favNodes = [...this.favorites]
        .map(key => materialNodeRegistry.get(key))
        .filter(Boolean);
      
      if (favNodes.length > 0) {
        html += `
          <div class="tree-category">
            <div class="tree-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
              <i class="fas fa-chevron-down"></i>
              <span>⭐ Favorites</span>
            </div>
            <div class="tree-category-content">
              ${favNodes.map((node) => this.renderNodeItem(node, true)).join("")}
            </div>
          </div>
        `;
      }
    }
    
    // Regular categories
    categories.forEach((category) => {
      if (category === "Output") return;

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
            ${filteredNodes.map((node) => this.renderNodeItem(node, false)).join("")}
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
    this.bindEvents();
  }

  renderNodeItem(node, isFavorite) {
    return `
      <div class="tree-item" data-node-key="${node.key}" draggable="true">
        <span class="tree-item-icon">${node.icon || "●"}</span>
        <span>${node.title}</span>
        ${node.hotkey ? `<span style="margin-left:auto;color:#666;font-size:9px;">${node.hotkey.toUpperCase()}</span>` : ""}
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll(".tree-item").forEach((item) => {
      const nodeKey = item.dataset.nodeKey;
      
      // Double-click to add node
      item.addEventListener("dblclick", () => {
        const rect = this.app.graph.graphPanel.getBoundingClientRect();
        const x = (rect.width / 2 - this.app.graph.panX) / this.app.graph.zoom;
        const y = (rect.height / 2 - this.app.graph.panY) / this.app.graph.zoom;
        this.app.graph.addNode(nodeKey, x, y);
      });

      // Drag and drop
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", nodeKey);
      });
      
      // Right-click context menu for favorites
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.showContextMenu(e, nodeKey);
      });
    });
  }

  showContextMenu(e, nodeKey) {
    // Remove existing context menu
    const existing = document.getElementById("palette-context-menu");
    if (existing) existing.remove();

    const isFavorite = this.favorites.has(nodeKey);
    const menu = document.createElement("div");
    menu.id = "palette-context-menu";
    menu.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 4px 0;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;

    menu.innerHTML = `
      <div class="context-menu-item" style="padding:6px 12px;cursor:pointer;font-size:12px;color:#ccc;">
        ${isFavorite ? "⭐ Remove from Favorites" : "⭐ Add to Favorites"}
      </div>
    `;

    menu.querySelector(".context-menu-item").addEventListener("click", () => {
      if (isFavorite) {
        this.removeFromFavorites(nodeKey);
      } else {
        this.addToFavorites(nodeKey);
      }
      menu.remove();
    });

    menu.querySelector(".context-menu-item").addEventListener("mouseenter", (e) => {
      e.target.style.background = "#3a3a3a";
    });
    menu.querySelector(".context-menu-item").addEventListener("mouseleave", (e) => {
      e.target.style.background = "transparent";
    });

    document.body.appendChild(menu);

    // Close on click outside
    const closeMenu = () => {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
  }
}

// ============================================================================
// DETAILS CONTROLLER

