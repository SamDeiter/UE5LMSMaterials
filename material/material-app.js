/**
 * material-app.js
 *
 * Main Application Entry Point for UE5 Material Editor
 * =====================================================
 * Orchestrates all controllers and manages the application lifecycle.
 * Uses the modular MaterialNodeFramework for node creation and management.
 */

import {
  MaterialNode,
  MaterialPin,
  materialNodeRegistry,
  PinTypes,
  TypeCompatibility,
} from "./core/MaterialNodeFramework.js";
import { MaterialExpressionDefinitions } from "../data/MaterialExpressionDefinitions.js";
import { HotkeyManager } from "../blueprint/ui/HotkeyManager.js";

// Engine modules
import { MaterialEvaluator } from "./engine/MaterialEvaluator.js";
import { TextureManager, textureManager } from "./engine/TextureManager.js";

// UI Controllers
import { MaterialGraphController } from "./core/MaterialGraphController.js";
import { PaletteController } from "./ui/PaletteController.js";
import { DetailsController } from "./ui/MaterialDetailsController.js";
import { ViewportController } from "./ui/ViewportController.js";
import { ActionMenuController } from "../blueprint/core/ActionMenuController.js";
import { StatsController } from "./ui/StatsController.js";
import { LayoutController } from "./ui/LayoutController.js";

import { debounce, generateId } from "../shared/utils.js";

// ============================================================================
// MAIN APPLICATION
// ============================================================================
class MaterialEditorApp {
  constructor() {
    console.log("Initializing Material Editor...");

    // Register all node definitions
    materialNodeRegistry.registerBatch(MaterialExpressionDefinitions);
    console.log(
      `Registered ${materialNodeRegistry.definitions.size} node types`
    );

    // Initialize controllers
    this.graph = new MaterialGraphController(this);
    this.palette = new PaletteController(this);
    this.details = new DetailsController(this);
    this.viewport = new ViewportController(this);
    this.actionMenu = new ActionMenuController(this);
    this.stats = new StatsController(this);
    this.layout = new LayoutController(this);

    // Initialize evaluator (uses graph for node access)
    this.evaluator = new MaterialEvaluator(this.graph);

    // Bind toolbar buttons
    this.bindToolbar();

    // Create main material node (after all controllers are ready)
    this.graph.createMainNode();

    // Initialize main node pins based on default blend mode
    // Must be called after main node is created
    this.details.updateMainNodePins();

    // Initial state
    this.updateStatus("Ready");
    this.updateCounts();

    console.log("Material Editor initialized");
  }

  // ==========================================================================
  // TOOLBAR BINDINGS
  // ==========================================================================

  bindToolbar() {
    // Save
    document
      .getElementById("save-btn")
      ?.addEventListener("click", () => this.save());

    // Apply
    document
      .getElementById("apply-btn")
      ?.addEventListener("click", () => this.apply());

    // Home
    document
      .getElementById("home-btn")
      ?.addEventListener("click", () => this.graph.focusMainNode());

    // Help
    document.getElementById("help-btn")?.addEventListener("click", () => {
      document.getElementById("help-modal").style.display = "flex";
    });

    document
      .getElementById("help-modal-close")
      ?.addEventListener("click", () => {
        document.getElementById("help-modal").style.display = "none";
      });

    // Undo/Redo
    document
      .getElementById("undo-btn")
      ?.addEventListener("click", () => this.undo());
    document
      .getElementById("redo-btn")
      ?.addEventListener("click", () => this.redo());

    // Live update toggle
    document
      .getElementById("live-update-btn")
      ?.addEventListener("click", (e) => {
        e.target.closest(".toolbar-btn").classList.toggle("active");
      });

    // HLSL Code Modal handlers
    this.bindHLSLModal();

    // Window menu dropdown handlers
    this.bindMenuDropdowns();

    // Blend mode change handler (show/hide Opacity Mask Clip Value)
    this.bindBlendModeHandler();
  }

  // ==========================================================================
  // MODAL & MENU BINDINGS
  // ==========================================================================

  bindHLSLModal() {
    const hlslModal = document.getElementById("hlsl-modal");
    const hlslClose = document.getElementById("hlsl-modal-close");
    const hlslCopy = document.getElementById("hlsl-copy-btn");
    const hlslTabs = document.querySelectorAll(".modal-tab");

    if (!hlslModal) return;

    // Close button
    hlslClose?.addEventListener("click", () => {
      hlslModal.style.display = "none";
    });

    // Click outside to close
    hlslModal.addEventListener("click", (e) => {
      if (e.target === hlslModal) {
        hlslModal.style.display = "none";
      }
    });

    // Copy to clipboard
    hlslCopy?.addEventListener("click", () => {
      const activeViewer = document.querySelector(
        ".code-viewer:not([style*='display: none'])"
      );
      if (activeViewer) {
        const code = activeViewer.querySelector("code")?.textContent || "";
        navigator.clipboard.writeText(code).then(() => {
          this.updateStatus("HLSL code copied to clipboard");
        });
      }
    });

    // Tab switching
    hlslTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.target;

        // Update active tab
        hlslTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Show/hide viewers
        document.querySelectorAll(".code-viewer").forEach((v) => {
          v.style.display = v.id === target ? "block" : "none";
        });
      });
    });
  }

  bindMenuDropdowns() {
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
        <div class="dropdown-item" data-action="palette">
          <span><i class="fas fa-palette"></i> Palette</span>
        </div>
        <div class="dropdown-item" data-action="details">
          <span><i class="fas fa-info-circle"></i> Details</span>
        </div>
        <div class="dropdown-item" data-action="viewport">
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
      switch (action) {
        case "hlsl-code":
          document.getElementById("hlsl-modal").style.display = "flex";
          break;
        case "stats":
          this.updateStatus("Stats panel toggled");
          break;
        case "palette":
          document.getElementById("palette-panel").classList.toggle("hidden");
          break;
        case "details":
          document.getElementById("details-panel").classList.toggle("hidden");
          break;
        case "viewport":
          document.getElementById("viewport-panel").classList.toggle("hidden");
          break;
      }

      dropdown.classList.remove("show");
    });
  }

  bindBlendModeHandler() {
    const blendModeSelect = document.getElementById("blend-mode");
    const opacityClipRow = document.getElementById("opacity-clip-row");

    if (!blendModeSelect || !opacityClipRow) return;

    const updateVisibility = () => {
      opacityClipRow.style.display =
        blendModeSelect.value === "Masked" ? "flex" : "none";
    };

    blendModeSelect.addEventListener("change", updateVisibility);
    updateVisibility(); // Initial state
  }

  // ==========================================================================
  // STATUS & COUNTS
  // ==========================================================================

  updateStatus(message) {
    const el = document.getElementById("status-message");
    if (el) el.textContent = message;
  }

  updateCounts() {
    const nodeCount = document.getElementById("node-count");
    const connCount = document.getElementById("connection-count");

    const nodesSize = this.graph?.nodes?.size || 0;
    const linksSize = this.graph?.links?.size || 0;

    if (nodeCount) nodeCount.textContent = `Nodes: ${nodesSize}`;
    if (connCount) connCount.textContent = `Connections: ${linksSize}`;

    // Update stats panel
    if (this.stats) {
      this.stats.calculateStats();
    }
  }

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  save() {
    this.updateStatus("Saved");
    console.log("Material saved");
    // TODO: Implement persistence
  }

  apply() {
    this.updateStatus("Applied");
    console.log("Material applied");

    // Evaluate graph and update viewport
    this.evaluateGraphAndUpdatePreview();
  }

  triggerLiveUpdate() {
    const liveBtn = document.getElementById("live-update-btn");
    if (liveBtn && liveBtn.classList.contains("active")) {
      this.apply();
    }
  }

  /**
   * Evaluate the material graph and update the 3D preview
   */
  evaluateGraphAndUpdatePreview() {
    const result = this.evaluator.evaluate();
    if (result) {
      this.evaluator.finalize(result, this.viewport);
    }
  }

  undo() {
    this.updateStatus("Undo");
    // TODO: Implement history
  }

  redo() {
    this.updateStatus("Redo");
    // TODO: Implement history
  }
}

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================
window.addEventListener("load", () => {
  try {
    window.materialEditor = new MaterialEditorApp();
  } catch (e) {
    console.error("Failed to initialize Material Editor:", e);
  }
});
