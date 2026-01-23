/**
 * MenuManager.js
 * 
 * Handles top-level menu dropdowns and window panel toggles.
 */

export class MenuManager {
  constructor(app) {
    this.app = app;
  }

  /**
   * Bind menu dropdown events
   */
  bind() {
    this.bindFileMenu();
    this.bindAssetMenu();
    this.bindWindowMenu();
  }

  /**
   * Bind the "File" menu dropdown
   */
  bindFileMenu() {
    const fileMenuItem = document.querySelector('[data-menu="file"]');
    if (!fileMenuItem) return;

    let dropdown = fileMenuItem.querySelector(".dropdown-menu");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "dropdown-menu";
      dropdown.innerHTML = `
        <div class="dropdown-item" data-action="save">
          <span><i class="fas fa-save"></i> Save</span>
          <span class="shortcut">Ctrl+S</span>
        </div>
        <div class="dropdown-item" data-action="choose-files-save">
          <span><i class="fas fa-list-check"></i> Choose Files to Save...</span>
        </div>
      `;
      fileMenuItem.style.position = "relative";
      fileMenuItem.appendChild(dropdown);
    }

    this.setupDropdownToggle(fileMenuItem, dropdown);
  }

  /**
   * Bind the "Asset" menu dropdown
   */
  bindAssetMenu() {
    const assetMenuItem = document.querySelector('[data-menu="asset"]');
    if (!assetMenuItem) return;

    let dropdown = assetMenuItem.querySelector(".dropdown-menu");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "dropdown-menu";
      dropdown.innerHTML = `
        <div class="dropdown-item" data-action="find-content-browser">
          <span><i class="fas fa-folder-open"></i> Find in Content Browser</span>
        </div>
        <div class="dropdown-item" data-action="reference-viewer">
          <span><i class="fas fa-network-wired"></i> Reference Viewer</span>
        </div>
      `;
      assetMenuItem.style.position = "relative";
      assetMenuItem.appendChild(dropdown);
    }

    this.setupDropdownToggle(assetMenuItem, dropdown);
  }

  /**
   * Helper to setup standard dropdown behavior
   */
  setupDropdownToggle(menuItem, dropdown) {
    menuItem.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll(".dropdown-menu.show").forEach(d => {
        if (d !== dropdown) d.classList.remove("show");
      });
      dropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdown.classList.remove("show");
    });

    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".dropdown-item");
      if (!item) return;

      const action = item.dataset.action;
      this.handleMenuAction(action);
      dropdown.classList.remove("show");
    });
  }

  /**
   * Bind the "Window" menu dropdown
   */
  bindWindowMenu() {
    const windowMenuItem = document.querySelector('[data-menu="window"]');
    if (!windowMenuItem) return;

    // Create dropdown if it doesn't exist
    let dropdown = windowMenuItem.querySelector(".dropdown-menu");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "dropdown-menu";
      dropdown.innerHTML = `
        <div class="dropdown-item" data-action="find-results">
          <span><i class="fas fa-search"></i> Find Results</span>
          <span class="shortcut">Ctrl+F</span>
        </div>
        <div class="dropdown-item" data-action="hlsl-code">
          <span><i class="fas fa-code"></i> HLSL Code</span>
        </div>
        <div class="dropdown-item" data-action="stats">
          <span><i class="fas fa-chart-bar"></i> Stats</span>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item checked" data-action="palette" id="menu-item-palette">
          <span><i class="fas fa-palette"></i> Palette</span>
        </div>
        <div class="dropdown-item checked" data-action="details" id="menu-item-details">
          <span><i class="fas fa-info-circle"></i> Details</span>
        </div>
        <div class="dropdown-item checked" data-action="viewport" id="menu-item-viewport">
          <span><i class="fas fa-cube"></i> Viewport</span>
        </div>
      `;
      windowMenuItem.style.position = "relative";
      windowMenuItem.appendChild(dropdown);
    }

    this.setupDropdownToggle(windowMenuItem, dropdown);
  }

  /**
   * Handle specific menu actions
   */
  handleMenuAction(action) {
    const item = document.querySelector(`[data-action="${action}"]`);
    
    switch (action) {
      case "save":
        this.app.save();
        break;
      case "choose-files-save":
        if (this.app.persistence.showSaveDialog) {
          this.app.persistence.showSaveDialog();
        }
        break;
      case "find-content-browser":
        this.app.updateStatus("Locating asset in Content Browser...");
        break;
      case "reference-viewer":
        if (this.app.referenceViewer) {
          this.app.referenceViewer.show();
        }
        break;
      case "find-results":
        if (this.app.findResults) {
          this.app.findResults.show();
        }
        break;
      case "hlsl-code":
        if (this.app.hlslPanel) {
          this.app.hlslPanel.toggle();
        }
        break;
      case "stats":
        this.togglePanel("stats-panel");
        item?.classList.toggle("checked");
        break;
      case "palette":
        this.app.layout.togglePanel("left-panel");
        item?.classList.toggle("checked");
        break;
      case "details":
        this.app.layout.togglePanel("right-panel");
        item?.classList.toggle("checked");
        break;
      case "viewport":
        this.app.layout.togglePanel("viewport-panel"); // Note: Viewport is center, but may toggle overlays
        item?.classList.toggle("checked");
        break;
    }
  }

  /**
   * Toggle a UI panel's visibility
   */
  togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.toggle("hidden");
    }
  }
}
