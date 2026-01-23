/**
 * MaterialInputController - Manages all mouse and keyboard input for the Material Editor graph.
 * Extracted from MaterialGraphController.js for code complexity reduction.
 *
 * Handles: mouse down/move/up, zoom, context menus, keyboard shortcuts.
 */

import { MoveNodeCommand } from "./GraphCommands.js";
import { GRAPH } from "../../src/constants/EditorConstants.js";

export class MaterialInputController {
  constructor(graphController) {
    this.graph = graphController;
    this.app = graphController.app;
    this.graphPanel = graphController.graphPanel;

    // Drag helper state
    this.dragStartPositions = null;

    // Alt+drag duplication tracking
    this.altDragDuplicated = false;

    // Marquee selection state
    this.isMarquee = false;
    this.marqueeStart = { x: 0, y: 0 };
    this.marqueeEl = document.getElementById("selection-marquee");
  }

  /**
   * Handle mouse down
   */
  onMouseDown(e) {
    // Middle mouse or right mouse for panning
    if (e.button === 1 || (e.button === 2 && !e.target.closest(".node"))) {
      this.graph.isPanning = true;
      this.graph.dragStartX = e.clientX - this.graph.panX;
      this.graph.dragStartY = e.clientY - this.graph.panY;
      e.preventDefault();
      return;
    }

    // Store initial positions for move command
    if (e.target.closest(".node")) {
      this.dragStartPositions = new Map();
      this.graph.selection.selectedNodes.forEach((id) => {
        const node = this.graph.nodes.get(id);
        if (node) {
          this.dragStartPositions.set(id, { x: node.x, y: node.y });
        }
      });
    }

    // Left click on empty space - start marquee selection
    // Check if clicking on canvas, SVG, or nodes-container (not on a node)
    const isGraphArea =
      e.target.id === "graph-canvas" ||
      e.target.id === "graph-svg" ||
      e.target.id === "nodes-container" ||
      e.target.closest("#graph-panel") === this.graphPanel;
    const isOnNode = e.target.closest(".node");

    if (e.button === 0 && isGraphArea && !isOnNode) {
      this.isMarquee = true;
      const rect = this.graphPanel.getBoundingClientRect();
      this.marqueeStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      if (this.marqueeEl) {
        this.marqueeEl.style.left = `${this.marqueeStart.x}px`;
        this.marqueeEl.style.top = `${this.marqueeStart.y}px`;
        this.marqueeEl.style.width = "0px";
        this.marqueeEl.style.height = "0px";
        this.marqueeEl.style.display = "block";
      }

      // Clear selection unless Ctrl is held
      if (!e.ctrlKey && !e.metaKey) {
        this.graph.deselectAll();
      }
    }
  }

  /**
   * Handle mouse move
   */
  onMouseMove(e) {
    if (this.graph.isPanning) {
      this.handlePanning(e);
    }

    if (this.graph.isDragging && this.graph.dragOffsets) {
      this.handleDragging(e);
    }

    if (this.graph.isWiring) {
      this.handleWiring(e);
    }

    if (this.isMarquee) {
      this.handleMarquee(e);
    }
  }

  /**
   * Handle graph panning
   */
  handlePanning(e) {
    this.graph.panX = e.clientX - this.graph.dragStartX;
    this.graph.panY = e.clientY - this.graph.dragStartY;
    this.graph.drawGrid();

    // Throttle lazy rendering during pan (update every 100ms instead of every frame)
    const now = performance.now();
    if (!this._lastLazyUpdate || now - this._lastLazyUpdate > 100) {
      this.graph.updateLazyRendering();
      this._lastLazyUpdate = now;
    }

    this.graph.nodes.forEach((node) => this.graph.updateNodePosition(node));
    this.graph.wiring.updateAllWires();
  }

  /**
   * Handle node dragging
   */
  handleDragging(e) {
    // Alt+drag duplication: duplicate on first move while Alt is held
    if (
      e.altKey &&
      !this.altDragDuplicated &&
      this.graph.selection.selectedNodes.size > 0
    ) {
      this.graph.duplicateSelected();
      this.altDragDuplicated = true;
      // Reset drag offsets for new duplicated nodes
      this.graph.dragStartX = e.clientX;
      this.graph.dragStartY = e.clientY;
      this.graph.dragOffsets = new Map();
      this.graph.selection.selectedNodes.forEach((nodeId) => {
        const n = this.graph.nodes.get(nodeId);
        if (n) this.graph.dragOffsets.set(nodeId, { x: n.x, y: n.y });
      });
      this.app.updateStatus("Duplicated (Alt+drag)");
    }

    const dx = (e.clientX - this.graph.dragStartX) / this.graph.zoom;
    const dy = (e.clientY - this.graph.dragStartY) / this.graph.zoom;

    this.graph.selection.selectedNodes.forEach((nodeId) => {
      const node = this.graph.nodes.get(nodeId);
      const offset = this.graph.dragOffsets.get(nodeId);
      if (node && offset) {
        node.x = offset.x + dx;
        node.y = offset.y + dy;
        // Apply snap-to-grid if enabled
        this.graph.updateNodePositionWithSnap(node, true);
      }
    });

    // Show alignment guides during drag
    if (this.graph.alignmentGuides) {
      const alignments = this.graph.alignmentGuides.update(
        this.graph.selection.selectedNodes,
      );

      // Apply magnetic snap if not using grid snap
      if (!this.graph.snapToGrid && alignments && alignments.length > 0) {
        const snapOffset = this.graph.alignmentGuides.getSnapOffset(
          this.graph.selection.selectedNodes,
        );
        if (snapOffset.dx !== 0 || snapOffset.dy !== 0) {
          this.graph.selection.selectedNodes.forEach((nodeId) => {
            const node = this.graph.nodes.get(nodeId);
            if (node) {
              node.x += snapOffset.dx;
              node.y += snapOffset.dy;
              this.graph.updateNodePosition(node);
            }
          });
        }
      }
    }

    this.graph.wiring.updateAllWires();
  }

  /**
   * Handle wiring interaction
   */
  handleWiring(e) {
    this.graph.wiring.updateGhostWire(e);
  }

  /**
   * Handle marquee selection drag
   */
  handleMarquee(e) {
    if (!this.marqueeEl) return;

    const rect = this.graphPanel.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Calculate marquee bounds
    const x = Math.min(this.marqueeStart.x, currentX);
    const y = Math.min(this.marqueeStart.y, currentY);
    const width = Math.abs(currentX - this.marqueeStart.x);
    const height = Math.abs(currentY - this.marqueeStart.y);

    // Update marquee element
    this.marqueeEl.style.left = `${x}px`;
    this.marqueeEl.style.top = `${y}px`;
    this.marqueeEl.style.width = `${width}px`;
    this.marqueeEl.style.height = `${height}px`;

    // Convert to graph coordinates for node intersection
    const graphX = (x - this.graph.panX) / this.graph.zoom;
    const graphY = (y - this.graph.panY) / this.graph.zoom;
    const graphW = width / this.graph.zoom;
    const graphH = height / this.graph.zoom;

    // Check which nodes intersect the marquee
    this.graph.nodes.forEach((node, id) => {
      const nodeEl = node.element;
      if (!nodeEl) return;

      const nodeW = nodeEl.offsetWidth;
      const nodeH = nodeEl.offsetHeight;

      // Check intersection
      const intersects =
        node.x < graphX + graphW &&
        node.x + nodeW > graphX &&
        node.y < graphY + graphH &&
        node.y + nodeH > graphY;

      if (intersects) {
        this.graph.selectNode(node, true); // Additive selection
      }
    });
  }

  /**
   * Handle mouse up
   */
  onMouseUp(e) {
    if (this.graph.isPanning) {
      this.graph.isPanning = false;
      // Force full lazy rendering update after pan ends
      this.graph.updateLazyRendering();
    }

    if (this.graph.isDragging) {
      this.graph.isDragging = false;

      // Execute move commands if nodes actually moved
      if (this.dragStartPositions) {
        this.dragStartPositions.forEach((startPos, id) => {
          const node = this.graph.nodes.get(id);
          if (node && (node.x !== startPos.x || node.y !== startPos.y)) {
            this.graph.commands.execute(
              new MoveNodeCommand(this.graph, id, startPos, {
                x: node.x,
                y: node.y,
              }),
            );
          }
        });
        this.dragStartPositions = null;
      }

      this.graph.dragOffsets = null;
      this.altDragDuplicated = false; // Reset alt+drag state

      // Clear alignment guides
      if (this.graph.alignmentGuides) {
        this.graph.alignmentGuides.clear();
      }
    }

    if (this.graph.isWiring) {
      // Check if we're over a valid target pin
      // Allow connection when hovering over the entire pin row (dot OR label)
      const target = document.elementFromPoint(e.clientX, e.clientY);
      let pinEl = null;
      let pinId = null;

      // Check if clicked on pin-dot directly
      if (target && target.classList.contains("pin-dot")) {
        pinEl = target.parentElement;
        pinId = pinEl?.dataset.pinId;
      }
      // Check if clicked on pin row (includes label)
      else if (target) {
        const closestPin = target.closest(".pin");
        if (closestPin) {
          pinEl = closestPin;
          pinId = closestPin.dataset.pinId;
        }
      }

      if (pinId) {
        // Find the target node and pin
        for (const [id, node] of this.graph.nodes) {
          const pin = node.findPin(pinId);
          if (pin && pin !== this.graph.wiringStartPin) {
            this.graph.wiring.endWiring(pin);
            return;
          }
        }
      }

      this.graph.wiring.endWiring();
    }

    // End marquee selection
    if (this.isMarquee) {
      this.isMarquee = false;
      if (this.marqueeEl) {
        this.marqueeEl.style.display = "none";
      }
    }
  }

  /**
   * Handle mouse wheel (zoom)
   */
  onWheel(e) {
    e.preventDefault();

    const rect = this.graphPanel.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom
    const zoomFactor =
      e.deltaY > 0 ? GRAPH.ZOOM_OUT_FACTOR : GRAPH.ZOOM_IN_FACTOR;
    const newZoom = Math.max(
      GRAPH.ZOOM_MIN,
      Math.min(GRAPH.ZOOM_MAX, this.graph.zoom * zoomFactor),
    );

    // Zoom toward mouse position
    const zoomRatio = newZoom / this.graph.zoom;
    this.graph.panX = mouseX - (mouseX - this.graph.panX) * zoomRatio;
    this.graph.panY = mouseY - (mouseY - this.graph.panY) * zoomRatio;
    this.graph.zoom = newZoom;

    // Update display
    document.getElementById("zoom-readout").textContent = `${Math.round(
      this.graph.zoom * 100,
    )}%`;

    this.graph.drawGrid();
    this.graph.updateLazyRendering();
    this.graph.nodes.forEach((node) => this.graph.updateNodePosition(node));
    this.graph.wiring.updateAllWires();
  }

  /**
   * Handle context menu (right-click)
   */
  onContextMenu(e) {
    e.preventDefault();

    // Don't show menu if over a node
    if (e.target.closest(".node")) return;

    this.app.actionMenu.show(e.clientX, e.clientY);
  }

  /**
   * Handle key down
   */
  onKeyDown(e) {
    // Don't handle if in input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    // Delete
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.graph.deleteSelected();
    }

    // Ctrl shortcuts
    if (e.ctrlKey) {
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        this.graph.commands.undo();
      }
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        this.graph.commands.redo();
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        this.app.save();
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        this.graph.duplicateSelected();
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        this.graph.copySelected();
      }
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        this.graph.pasteNodes();
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (this.app.findResults) {
          this.app.findResults.show();
        }
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        this.graph.selectAll();
      }
    }

    // Shift+WASD - Node alignment shortcuts
    if (e.shiftKey && !e.ctrlKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case "w":
          e.preventDefault();
          this.graph.alignSelected("top");
          break;
        case "a":
          e.preventDefault();
          this.graph.alignSelected("left");
          break;
        case "s":
          e.preventDefault();
          this.graph.alignSelected("bottom");
          break;
        case "d":
          e.preventDefault();
          this.graph.alignSelected("right");
          break;
      }
    }

    // F - Focus on selected nodes
    if (e.key === "f" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.graph.focusSelected();
    }

    // Home - Focus on main material node
    if (e.key === "Home") {
      e.preventDefault();
      this.graph.focusMainNode();
    }

    // G - Toggle snap-to-grid
    if (e.key === "g" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.graph.toggleSnapToGrid();
    }

    // Tab - Quick search popup (UE5 style)
    if (e.key === "Tab" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      // Get center of graph panel for spawn position
      const rect = this.graphPanel.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.app.actionMenu.show(centerX, centerY);
    }

    // Space - Force update previews (UE5 behavior)
    if (e.key === " " && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.app.evaluateGraphAndUpdatePreview();
      this.app.updateStatus("Preview Updated");
    }

    // Enter - Apply changes (compile and apply material)
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.app.apply();
    }
  }

  /**
   * Handle key up
   */
  onKeyUp(e) {
    // Nothing special needed
  }
}
