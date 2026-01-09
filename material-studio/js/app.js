/**
 * Material Studio - Main Application Entry Point
 * Initializes all controllers and wires up the application.
 */

import { GraphManager } from "./GraphManager.js";
import { PreviewRenderer } from "./PreviewRenderer.js";
import { UIController } from "./UIController.js";

/**
 * MaterialStudioApp - Main application class
 */
class MaterialStudioApp {
  constructor() {
    this.graphManager = null;
    this.previewRenderer = null;
    this.uiController = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log("Material Studio v3.0 - Initializing...");

    // Get DOM elements
    const graphContainer = document.getElementById("graph-container");
    const graphSvg = document.getElementById("connections");
    const nodesLayer = document.getElementById("nodes-layer");
    const previewContainer = document.getElementById("canvas-container");
    const previewToolbar = document.querySelector(".preview-toolbar");
    const paletteContainer = document.getElementById("palette-content");
    const detailsContainer = document.getElementById("details-content");

    // Initialize Graph Manager
    this.graphManager = new GraphManager(graphContainer, graphSvg, nodesLayer);

    // Initialize Preview Renderer (lazy loads Three.js)
    this.previewRenderer = new PreviewRenderer(previewContainer);
    await this.previewRenderer.init();

    // Connect graph evaluation to preview updates
    this.graphManager.onGraphEvaluate = (result) => {
      this.previewRenderer.updateMaterial(result);
    };

    // Initialize UI Controller
    this.uiController = new UIController({
      paletteContainer,
      detailsContainer,
      previewToolbar,
      graphManager: this.graphManager,
      previewRenderer: this.previewRenderer,
    });

    // Create initial nodes
    this.createInitialGraph();

    // Expose for debugging
    window.graph = this.graphManager;
    window.preview = this.previewRenderer;

    console.log("Material Studio initialized successfully.");
  }

  /**
   * Create the initial graph with result and slab nodes
   */
  createInitialGraph() {
    // Create result node
    const resultNode = this.graphManager.createNode("result", 500, 150);

    // Create substrate slab node
    const slabNode = this.graphManager.createNode("substrate_slab", 200, 150);

    // Connect slab to result
    if (resultNode && slabNode) {
      this.graphManager.addConnection(
        slabNode.id,
        "Out",
        resultNode.id,
        "FrontMaterial"
      );
    }
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  const app = new MaterialStudioApp();
  await app.init();
});

// Export for debugging
window.MaterialStudioApp = MaterialStudioApp;
