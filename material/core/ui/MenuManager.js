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
    this.bindWindowMenu();
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

    // Toggle dropdown on click
    windowMenuItem.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener("click", () => {
      dropdown.classList.remove("show");
    });

    // Handle dropdown item clicks
    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".dropdown-item");
      if (!item) return;

      const action = item.dataset.action;
      this.handleMenuAction(action);
      dropdown.classList.remove("show");
    });
  }

  /**
   * Handle specific menu actions
   */
  handleMenuAction(action) {
    const item = document.querySelector(`[data-action="${action}"]`);
    
    switch (action) {
      case "hlsl-code":
        const hlslModal = document.getElementById("hlsl-modal");
        if (hlslModal) hlslModal.style.display = "flex";
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
