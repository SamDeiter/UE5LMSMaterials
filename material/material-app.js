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
import { HotkeyManager } from "../shared/HotkeyManager.js";

// Engine modules
import { MaterialEvaluator } from "./engine/MaterialEvaluator.js";
import { TextureManager, textureManager } from "./engine/TextureManager.js";
import { initNodePreviewRenderer } from "./engine/NodePreviewRenderer.js";

// UI Controllers
import { MaterialGraphController } from "./core/MaterialGraphController.js";
import { PaletteController } from "./ui/PaletteController.js";
import { DetailsController } from "./ui/MaterialDetailsController.js";
import { ViewportController } from "./ui/ViewportController.js";
import { ActionMenuController } from "../shared/ActionMenuController.js";
import { StatsController } from "./ui/StatsController.js";
import { LayoutController } from "./ui/LayoutController.js";
import { LayerPanel } from "./ui/LayerPanel.js";

import { ToolbarManager } from "./core/ui/ToolbarManager.js";
import { MenuManager } from "./core/ui/MenuManager.js";
import { ModalManager } from "./core/ui/ModalManager.js";

import { debounce, generateId } from "../shared/utils.js";
import { PersistenceManager } from "./core/PersistenceManager.js";
import { ReferenceViewerController } from "./ui/ReferenceViewerController.js";
import { SaveAssetsModal } from "./ui/SaveAssetsModal.js";
import { FindResultsController } from "./ui/FindResultsController.js";
import { HLSLCodePanel } from "./ui/HLSLCodePanel.js";
import { UI_TIMINGS } from "../src/constants/EditorConstants.js";

// ============================================================================
// MAIN APPLICATION
// ============================================================================
class MaterialEditorApp {
  constructor() {
    console.log("Initializing Material Editor...");

    // Register all node definitions
    materialNodeRegistry.registerBatch(MaterialExpressionDefinitions);
    console.log(
      `Registered ${materialNodeRegistry.definitions.size} node types`,
    );

    // Initialize UI Managers
    this.toolbar = new ToolbarManager(this);
    this.menu = new MenuManager(this);
    this.modals = new ModalManager(this);

    // Initialize controllers
    this.graph = new MaterialGraphController(this);
    this.palette = new PaletteController(this);
    this.details = new DetailsController(this);
    this.viewport = new ViewportController(this);
    this.actionMenu = new ActionMenuController(this, materialNodeRegistry);
    this.stats = new StatsController(this);
    this.layout = new LayoutController(this);

    // Initialize evaluator (uses graph for node access)
    this.evaluator = new MaterialEvaluator(this.graph);

    // Store textureManager reference for node access
    this.textureManager = textureManager;

    // Initialize Persistence
    this.persistence = new PersistenceManager(this);
    this.referenceViewer = new ReferenceViewerController(this);
    this.saveAssetsModal = new SaveAssetsModal(this);
    this.findResults = new FindResultsController(this);
    this.hlslPanel = new HLSLCodePanel(this);
    this.hlslPanel.init();

    // Initialize Layer Panel (Material Layers feature)
    this.layerPanel = new LayerPanel(this);
    this.layerPanel.init();
    // Add a default base layer
    this.layerPanel.addLayer("Base Layer", {
      weight: 1.0,
      blendMode: "Normal",
    });

    // Bind persistence dialog
    this.persistence.showSaveDialog = () => this.saveAssetsModal.show();

    // Bind UI elements through managers
    this.toolbar.bind();
    this.menu.bind();
    this.modals.bind();

    // Bind shared handlers
    this.bindBlendModeHandler();

    // Create main material node (after all controllers are ready)
    this.graph.createMainNode();

    // Initialize main node pins based on default blend mode
    // Must be called after main node is created
    this.details.updateMainNodePins();

    // Initial state
    this.updateStatus("Ready");
    this.updateCounts();

    // Load saved graph if it exists
    this.load();

    // Initialize NodePreviewRenderer after viewport is ready (async)
    this.initNodePreviews();

    console.log("Material Editor initialized");
  }

  /**
   * Initialize the NodePreviewRenderer for WebGL-based node thumbnails
   */
  async initNodePreviews() {
    // Wait for the viewport/scene to be ready
    if (this.viewport && this.viewport.sceneManager) {
      const renderer = initNodePreviewRenderer(this.viewport.sceneManager);
      await renderer.init();
      console.log("NodePreviewRenderer initialized for live node previews");
    }
  }

  // ==========================================================================
  // SHARED HANDLERS
  // ==========================================================================

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
    const graphData = this.graph.serialize();
    if (this.persistence.save(graphData)) {
      this.updateStatus("Saved to local storage");
      console.log("Material saved");
    }
  }

  load() {
    if (this.persistence.hasData()) {
      const data = this.persistence.load();
      if (data) {
        this.graph.deserialize(data);
        this.updateStatus("Restored from local storage");
        console.log("Material graph restored");
      }
    }
  }

  /**
   * Apply button handler - compiles material and updates preview
   * Matches UE5 behavior: shows "Compiling Shaders..." then "Applied"
   */
  apply() {
    // Show compiling status (like UE5's shader compilation)
    this.updateStatus("⏳ Compiling Shaders...");

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        // Evaluate graph and update viewport
        this.evaluateGraphAndUpdatePreview();

        // Mark material as successfully compiled
        this.materialCompiled = true;
        this.materialDirty = false;

        // Update status to show success
        this.updateStatus("✅ Applied");

        // Clear success message after 2 seconds
        setTimeout(() => {
          if (this.statusMessage === "✅ Applied") {
            this.updateStatus("Ready");
          }
        }, 2000);

        console.log("Material compiled and applied successfully");
      } catch (e) {
        this.updateStatus("❌ Compilation Failed");
        console.error("Material compilation failed:", e);
      }
    }, 50);
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
    this.graph.commands.undo();
    this.updateStatus("Undo");
    this.triggerAutoSave();
  }

  redo() {
    this.graph.commands.redo();
    this.updateStatus("Redo");
    this.triggerAutoSave();
  }

  triggerAutoSave() {
    // Debounce auto-save to avoid excessive writes
    if (!this._debouncedSave) {
      this._debouncedSave = debounce(() => {
        const graphData = this.graph.serialize();
        this.persistence.save(graphData);
        console.log("Auto-saved");
      }, UI_TIMINGS.AUTO_SAVE);
    }

    this.persistence.markDirty();
    this._debouncedSave();
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
