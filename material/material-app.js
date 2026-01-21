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
import { shaderEvaluator } from "./engine/ShaderEvaluator.js";

// Extracted modules
import { TextureManager, textureManager } from "./engine/TextureManager.js";
import { MaterialGraphController } from "./core/MaterialGraphController.js";
import { PaletteController } from "./ui/PaletteController.js";
import { DetailsController } from "./ui/MaterialDetailsController.js";
import { debounce, generateId } from "../shared/utils.js";

// Classes extracted to separate modules:
// - TextureManager.js
// - MaterialGraphController.js
// - PaletteController.js
// - MaterialDetailsController.js (DetailsController)

import { ActionMenuController } from '../blueprint/core/ActionMenuController.js';
import { ViewportController } from './ui/ViewportController.js';


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

    // Bind toolbar buttons
    this.bindToolbar();

    // Create main material node (after all controllers are ready)
    this.graph.createMainNode();

    // Initial state
    this.updateStatus("Ready");
    this.updateCounts();

    console.log("Material Editor initialized");
  }

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

  /**
   * Bind HLSL Code Modal events
   */
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

  /**
   * Bind Window menu dropdown functionality
   */
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

  /**
   * Bind blend mode change handler to show/hide Opacity Mask Clip Value
   */
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

  updateStatus(message) {
    const el = document.getElementById("status-message");
    if (el) el.textContent = message;
  }

  updateCounts() {
    const nodeCount = document.getElementById("node-count");
    const connCount = document.getElementById("connection-count");

    // Safely access graph properties
    const nodesSize = this.graph?.nodes?.size || 0;
    const linksSize = this.graph?.links?.size || 0;

    if (nodeCount) nodeCount.textContent = `Nodes: ${nodesSize}`;
    if (connCount) connCount.textContent = `Connections: ${linksSize}`;
  }

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

  /**
   * Trigger live update if Live mode is enabled
   */
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
    const mainNode = [...this.graph.nodes.values()].find(
      (n) => n.type === "main-output"
    );
    if (!mainNode) return;

    const result = {
      baseColor: [0.5, 0.5, 0.5],
      metallic: 0,
      roughness: 0.5,
      emissive: null,
    };

    // Recursively evaluate a pin to get its value
    const evaluatePin = (pin, visited = new Set()) => {
      if (!pin || visited.has(pin.id)) return null;
      visited.add(pin.id);

      // If not connected, return default value from pin or node properties
      if (!pin.connectedTo) {
        if (pin.defaultValue !== undefined) {
          return pin.defaultValue;
        }
        return null;
      }

      // Get the link and source node
      const link = this.graph.links.get(pin.connectedTo);
      if (!link || !link.outputPin) return null;

      const sourceNode = [...this.graph.nodes.values()].find((n) =>
        n.outputs.some((p) => p.id === link.outputPin.id)
      );
      if (!sourceNode) return null;

      // Evaluate based on node type
      return evaluateNode(sourceNode, link.outputPin, visited);
    };

    // Evaluate a node's output
    const evaluateNode = (node, outputPin, visited) => {
      const nodeKey = node.nodeKey || node.type;

      // Constant nodes - return property value
      if (nodeKey === "Constant" || nodeKey === "ScalarParameter") {
        return node.properties.R ?? node.properties.DefaultValue ?? 0;
      }

      // Vector constants
      if (nodeKey === "Constant3Vector" || nodeKey === "VectorParameter") {
        return [
          node.properties.R ?? 1,
          node.properties.G ?? 1,
          node.properties.B ?? 1,
        ];
      }

      // Multiply node - multiply inputs (use ShaderEvaluator for texture×color)
      if (nodeKey === "Multiply") {
        const pinA = node.inputs.find(
          (p) => p.localId === "a" || p.name === "A"
        );
        const pinB = node.inputs.find(
          (p) => p.localId === "b" || p.name === "B"
        );
        const valA = evaluatePin(pinA, new Set(visited)) ?? 1;
        const valB = evaluatePin(pinB, new Set(visited)) ?? 1;

        const isTexA =
          valA && typeof valA === "object" && valA.type === "texture";
        const isTexB =
          valB && typeof valB === "object" && valB.type === "texture";

        // If one input is a texture, multiply with ShaderEvaluator
        if (isTexA && !isTexB) {
          // Return a pending operation marker - will be resolved in result processing
          return {
            type: "pending",
            operation: "multiply",
            texture: valA,
            color: valB,
          };
        }
        if (isTexB && !isTexA) {
          return {
            type: "pending",
            operation: "multiply",
            texture: valB,
            color: valA,
          };
        }
        if (isTexA && isTexB) {
          // Both textures - just return first for now
          return valA;
        }

        return multiplyValues(valA, valB);
      }

      // Add node - add inputs
      if (nodeKey === "Add") {
        const pinA = node.inputs.find(
          (p) => p.localId === "a" || p.name === "A"
        );
        const pinB = node.inputs.find(
          (p) => p.localId === "b" || p.name === "B"
        );
        const valA = evaluatePin(pinA, new Set(visited)) ?? 0;
        const valB = evaluatePin(pinB, new Set(visited)) ?? 0;
        return addValues(valA, valB);
      }

      // Lerp node
      if (nodeKey === "Lerp") {
        const pinA = node.inputs.find(
          (p) => p.localId === "a" || p.name === "A"
        );
        const pinB = node.inputs.find(
          (p) => p.localId === "b" || p.name === "B"
        );
        const pinAlpha = node.inputs.find(
          (p) => p.localId === "alpha" || p.name === "Alpha"
        );
        const valA = evaluatePin(pinA, new Set(visited)) ?? 0;
        const valB = evaluatePin(pinB, new Set(visited)) ?? 1;
        const alpha = evaluatePin(pinAlpha, new Set(visited)) ?? 0.5;
        return lerpValues(valA, valB, alpha);
      }

      // Texture sample - return texture info for viewport
      if (nodeKey === "TextureSample" || nodeKey === "TextureParameter") {
        // Get texture data from textureManager or node properties
        let textureId =
          node.properties?.TextureAsset || node.properties?.texture;

        // Fall back to checkerboard if no texture assigned
        if (!textureId && textureManager) {
          textureId = "checkerboard";
        }

        if (textureId && textureManager) {
          const texData = textureManager.get(textureId);
          if (texData && texData.dataUrl) {
            // Return special texture object
            return { type: "texture", url: texData.dataUrl };
          }
        }
        // Fallback to mid-gray if no texture loaded
        if (
          outputPin &&
          (outputPin.localId === "rgb" || outputPin.name === "RGB")
        ) {
          return [0.5, 0.5, 0.5];
        }
        return 0.5;
      }

      // Default: try to read properties
      if (node.properties.R !== undefined) {
        return [
          node.properties.R ?? 0,
          node.properties.G ?? 0,
          node.properties.B ?? 0,
        ];
      }
      if (node.properties.Value !== undefined) {
        return node.properties.Value;
      }

      return null;
    };

    // Helper: multiply two values (scalar or vector)
    const multiplyValues = (a, b) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.map((v, i) => v * (b[i] ?? 1));
      }
      if (Array.isArray(a)) {
        return a.map((v) => v * (typeof b === "number" ? b : 1));
      }
      if (Array.isArray(b)) {
        return b.map((v) => v * (typeof a === "number" ? a : 1));
      }
      return (typeof a === "number" ? a : 1) * (typeof b === "number" ? b : 1);
    };

    // Helper: add two values
    const addValues = (a, b) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.map((v, i) => v + (b[i] ?? 0));
      }
      if (Array.isArray(a)) {
        return a.map((v) => v + (typeof b === "number" ? b : 0));
      }
      if (Array.isArray(b)) {
        return b.map((v) => v + (typeof a === "number" ? a : 0));
      }
      return (typeof a === "number" ? a : 0) + (typeof b === "number" ? b : 0);
    };

    // Helper: lerp two values
    const lerpValues = (a, b, t) => {
      const alpha = typeof t === "number" ? t : 0.5;
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.map((v, i) => v + (b[i] - v) * alpha);
      }
      if (typeof a === "number" && typeof b === "number") {
        return a + (b - a) * alpha;
      }
      return a;
    };

    // Evaluate each main node input
    mainNode.inputs.forEach((pin) => {
      const value = evaluatePin(pin);
      if (value === null) return;

      // Use exact pin name matching to avoid collisions (e.g., "Roughness" vs "Clear Coat Roughness")
      const pinName = pin.name.toLowerCase().trim();

      // Base Color
      if (pinName === "base color") {
        // Check if value is a pending async operation
        if (value && typeof value === "object" && value.type === "pending") {
          if (value.operation === "multiply") {
            // Schedule async multiply operation
            result.pendingBaseColor = shaderEvaluator.multiplyTextureByColor(
              value.texture,
              value.color
            );
          }
          // Check if value is a texture object
        } else if (
          value &&
          typeof value === "object" &&
          value.type === "texture"
        ) {
          result.baseColorTexture = value.url;
          result.baseColor = [1, 1, 1]; // White to show texture properly
        } else if (Array.isArray(value)) {
          result.baseColor = value.slice(0, 3);
        } else if (typeof value === "number") {
          result.baseColor = [value, value, value];
        }
      } 
      // Metallic - exact match
      else if (pinName === "metallic") {
        result.metallic =
          typeof value === "number"
            ? value
            : Array.isArray(value)
            ? value[0]
            : 0;
      } 
      // Roughness - exact match only (not "Clear Coat Roughness")
      else if (pinName === "roughness") {
        result.roughness =
          typeof value === "number"
            ? value
            : Array.isArray(value)
            ? value[0]
            : 0.5;
      } 
      // Emissive Color
      else if (pinName === "emissive color") {
        if (Array.isArray(value)) {
          result.emissive = value.slice(0, 3);
        }
      }
    });

    // Handle pending async operations before updating viewport
    const finishUpdate = async () => {
      if (result.pendingBaseColor) {
        try {
          const texture = await result.pendingBaseColor;
          if (texture && texture.url) {
            result.baseColorTexture = texture.url;
            result.baseColor = [1, 1, 1]; // White to show texture properly
          }
        } catch (e) {
          console.warn("Failed to process texture operation:", e);
        }
        delete result.pendingBaseColor;
      }

      // Update the viewport with the result
      if (this.viewport) {
        this.viewport.updateMaterial(result);
      }
    };

    finishUpdate();
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
