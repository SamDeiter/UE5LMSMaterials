/**
 * GraphRenderer.js
 * 
 * Handles all canvas-based rendering, grid drawing, and viewport culling.
 */

import { GridRenderer } from "../../shared/GridRenderer.js";
import { GRAPH } from "../../src/constants/EditorConstants.js";

export class GraphRenderer {
  constructor(controller) {
    this.controller = controller;
    this.canvas = controller.canvas;
    this.ctx = controller.ctx;
    this.graphPanel = controller.graphPanel;
    this.svg = controller.svg;
    
    this.gridColor = controller.gridColor || "#1a1a1a";
    this.gridLineColor = controller.gridLineColor || "#222222";
    this.gridSize = controller.gridSize || 20;
  }

  /**
   * Handle window resize
   */
  resize() {
    const rect = this.graphPanel.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.svg.setAttribute("width", rect.width);
    this.svg.setAttribute("height", rect.height);
    this.drawGrid();
    this.updateLazyRendering();
    
    if (this.controller.wiring) {
        this.controller.wiring.updateAllWires();
    }
  }

  /**
   * Draw the background grid
   */
  drawGrid() {
    const { width, height } = this.canvas;
    
    GridRenderer.draw(this.ctx, width, height, {
      panX: this.controller.panX,
      panY: this.controller.panY,
      zoom: this.controller.zoom
    }, {
      backgroundColor: this.gridColor,
      minorGridColor: this.gridLineColor,
      majorGridColor: '#2a2a2a',
      minorGridSize: this.gridSize,
      majorGridMultiplier: 5
    });
  }

  /**
   * Calculate current viewport bounds in graph-space coordinates.
   */
  getViewportBounds() {
    const rect = this.graphPanel.getBoundingClientRect();
    const padding = GRAPH.VIEWPORT_CULLING_PADDING;

    return {
      left: (-this.controller.panX - padding) / this.controller.zoom,
      top: (-this.controller.panY - padding) / this.controller.zoom,
      right: (-this.controller.panX + rect.width + padding) / this.controller.zoom,
      bottom: (-this.controller.panY + rect.height + padding) / this.controller.zoom,
    };
  }

  /**
   * Orchestrate lazy rendering by culling off-screen nodes and wires.
   */
  updateLazyRendering() {
    const bounds = this.getViewportBounds();

    // Cull Nodes
    this.controller.nodes.forEach((node) => {
      if (!node.element) return;

      const nodeRect = {
        left: node.x,
        top: node.y,
        right: node.x + (node.element.offsetWidth || 200),
        bottom: node.y + (node.element.offsetHeight || 150),
      };

      const isVisible =
        nodeRect.right >= bounds.left &&
        nodeRect.left <= bounds.right &&
        nodeRect.bottom >= bounds.top &&
        nodeRect.top <= bounds.bottom;

      node.element.classList.toggle("culled", !isVisible);
    });

    // Cull Wires (Only if both ends are off-screen)
    this.controller.links.forEach((link, id) => {
      const wirePath = document.getElementById(`wire-${id}`);
      if (!wirePath) return;

      const sourceNode = link.sourcePin.node;
      const targetNode = link.targetPin.node;

      const isSourceCulled = sourceNode.element?.classList.contains("culled");
      const isTargetCulled = targetNode.element?.classList.contains("culled");

      wirePath.classList.toggle("culled", !!(isSourceCulled && isTargetCulled));
    });
  }
}
