/**
 * ActionMenuController.js
 * 
 * Manages the right-click action menu for spawning nodes.
 * Extracted from material-app.js for modularity.
 */

import { materialNodeRegistry } from './MaterialNodeFramework.js';
import { debounce } from './utils.js';

export class ActionMenuController {
  constructor(app) {
    this.app = app;
    this.menu = document.getElementById("action-menu");
    this.searchInput = document.getElementById("action-menu-search");
    this.list = document.getElementById("action-menu-list");
    this.spawnX = 0;
    this.spawnY = 0;
    this.selectedIndex = 0;

    this.searchInput.addEventListener(
      "input",
      debounce(() => this.render(), 100)
    );
    this.searchInput.addEventListener("keydown", (e) => this.handleKeyDown(e));

    document.addEventListener("click", (e) => {
      if (!this.menu.contains(e.target)) {
        this.hide();
      }
    });
  }

  show(x, y) {
    this.spawnX = x;
    this.spawnY = y;

    this.menu.style.display = "flex";
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;

    this.searchInput.value = "";
    this.searchInput.focus();
    this.selectedIndex = 0;
    this.render();
  }

  hide() {
    this.menu.style.display = "none";
  }

  render() {
    const filter = this.searchInput.value.toLowerCase();
    let results = [];

    if (filter) {
      results = materialNodeRegistry.search(filter);
    } else {
      // Show commonly used nodes
      const common = [
        "Constant3Vector",
        "TextureSample",
        "Multiply",
        "Add",
        "Lerp",
        "ScalarParameter",
        "VectorParameter",
      ];
      results = common
        .map((k) => ({ key: k, ...materialNodeRegistry.get(k) }))
        .filter(Boolean);
    }

    results = results.filter((r) => r.category !== "Output").slice(0, 15);

    let html = "";
    let currentCategory = "";

    results.forEach((node, idx) => {
      if (node.category !== currentCategory) {
        currentCategory = node.category;
        html += `<div class="action-menu-category">${currentCategory}</div>`;
      }

      html += `
                <div class="action-menu-item ${
                  idx === this.selectedIndex ? "selected" : ""
                }" data-node-key="${node.key}" data-index="${idx}">
                    <span class="action-menu-item-icon">${
                      node.icon || "●"
                    }</span>
                    <span>${node.title}</span>
                    ${
                      node.hotkey
                        ? `<span class="action-menu-item-hotkey">${node.hotkey.toUpperCase()}</span>`
                        : ""
                    }
                </div>
            `;
    });

    this.list.innerHTML =
      html || '<div style="padding:12px;color:#666;">No results found</div>';

    // Bind click events
    this.list.querySelectorAll(".action-menu-item").forEach((item) => {
      item.addEventListener("click", () =>
        this.spawnNode(item.dataset.nodeKey)
      );
      item.addEventListener("mouseenter", () => {
        this.selectedIndex = parseInt(item.dataset.index);
        this.updateSelection();
      });
    });
  }

  handleKeyDown(e) {
    const items = this.list.querySelectorAll(".action-menu-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
      this.updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.updateSelection();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = items[this.selectedIndex];
      if (selected) {
        this.spawnNode(selected.dataset.nodeKey);
      }
    } else if (e.key === "Escape") {
      this.hide();
    }
  }

  updateSelection() {
    this.list.querySelectorAll(".action-menu-item").forEach((item, idx) => {
      item.classList.toggle("selected", idx === this.selectedIndex);
    });
  }

  spawnNode(nodeKey) {
    const graphRect = this.app.graph.graphPanel.getBoundingClientRect();
    const x =
      (this.spawnX - graphRect.left - this.app.graph.panX) /
      this.app.graph.zoom;
    const y =
      (this.spawnY - graphRect.top - this.app.graph.panY) / this.app.graph.zoom;

    this.app.graph.addNode(nodeKey, x, y);
    this.hide();
  }
}

