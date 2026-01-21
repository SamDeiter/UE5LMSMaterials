/**
 * MaterialGraphController.js
 *
 * Manages the graph canvas, node rendering, and core operations.
 * InputController has been extracted to MaterialInputController.js
 * WiringController has been extracted to MaterialWiringController.js
 * Extracted from material-app.js for modularity.
 */

import { HotkeyManager } from "../../blueprint/ui/HotkeyManager.js";
import {
  materialNodeRegistry,
  MaterialNode,
  PinTypes,
} from "./MaterialNodeFramework.js";
import { debounce, generateId } from "../../shared/utils.js";
import { WireRenderer } from "../../shared/WireRenderer.js";
import { GridRenderer } from "../../shared/GridRenderer.js";
import { MaterialInputController } from "./MaterialInputController.js";
import { MaterialWiringController } from "./MaterialWiringController.js";


export class MaterialGraphController {
  constructor(app) {
    this.app = app;
    this.graphPanel = document.getElementById("graph-panel");
    this.canvas = document.getElementById("graph-canvas");
    this.svg = document.getElementById("graph-svg");
    this.nodesContainer = document.getElementById("nodes-container");
    this.wireGroup = document.getElementById("wire-group");

    this.ctx = this.canvas.getContext("2d");

    // Graph state
    this.nodes = new Map();
    this.links = new Map();
    this.selectedNodes = new Set();
    this.selectedLinks = new Set();

    // Transform state
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;

    // Interaction state
    this.isPanning = false;
    this.isDragging = false;
    this.isWiring = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.wiringStartPin = null;

    // Grid settings
    this.gridSize = 20;
    this.gridColor = "#1a1a1a";
    this.gridLineColor = "#222222";

    // Hotkey manager for "Hold key + Click" node spawning
    this.hotkeyManager = new HotkeyManager(this, materialNodeRegistry);

    // Delegate input handling to InputController
    this.input = new MaterialInputController(this);

    // Delegate wiring operations to WiringController
    this.wiring = new MaterialWiringController(this);

    // Pin marking for Shift+Click long-distance connections
    this.markedPin = null;

    this.initEvents();
    this.resize();

    // Defer main node creation until after app is fully initialized
    // This will be called by MaterialEditorApp.init()
  }

  /**
   * Initialize event listeners
   */
  initEvents() {
    // Resize handler
    window.addEventListener(
      "resize",
      debounce(() => this.resize(), 100)
    );

    // Mouse events - delegate to InputController
    this.graphPanel.addEventListener("mousedown", (e) => this.input.onMouseDown(e));
    this.graphPanel.addEventListener("mousemove", (e) => this.input.onMouseMove(e));
    this.graphPanel.addEventListener("mouseup", (e) => this.input.onMouseUp(e));
    this.graphPanel.addEventListener("wheel", (e) => this.input.onWheel(e));
    this.graphPanel.addEventListener("contextmenu", (e) => this.input.onContextMenu(e));

    // Drag and drop from palette
    this.graphPanel.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    this.graphPanel.addEventListener("drop", (e) => {
      e.preventDefault();
      let nodeKey = e.dataTransfer.getData("text/plain");
      // Handle palette prefix (PALETTE_NODE:NodeKey)
      if (nodeKey.startsWith("PALETTE_NODE:")) {
        nodeKey = nodeKey.replace("PALETTE_NODE:", "");
      }
      if (nodeKey && materialNodeRegistry.get(nodeKey)) {
        const rect = this.graphPanel.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panX) / this.zoom;
        const y = (e.clientY - rect.top - this.panY) / this.zoom;
        this.addNode(nodeKey, x, y);
      }
    });

    // Keyboard events - delegate to InputController
    document.addEventListener("keydown", (e) => this.input.onKeyDown(e));
    document.addEventListener("keyup", (e) => this.input.onKeyUp(e));

    // Click outside to deselect AND handle hotkey spawning
    this.graphPanel.addEventListener("click", (e) => {
      if (e.target === this.graphPanel || e.target === this.canvas) {
        // Check if hotkey spawning should happen
        const graphRect = this.graphPanel.getBoundingClientRect();
        const clickX = (e.clientX - graphRect.left - this.panX) / this.zoom;
        const clickY = (e.clientY - graphRect.top - this.panY) / this.zoom;

        if (
          this.hotkeyManager &&
          this.hotkeyManager.handleGraphClick(clickX, clickY)
        ) {
          // Node was spawned, don't deselect
          return;
        }

        this.deselectAll();
      }
    });
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
    this.wiring.updateAllWires();
  }

  /**
   * Draw the background grid
   */
  drawGrid() {
    const { width, height } = this.canvas;
    
    GridRenderer.draw(this.ctx, width, height, {
      panX: this.panX,
      panY: this.panY,
      zoom: this.zoom
    }, {
      backgroundColor: this.gridColor,
      minorGridColor: this.gridLineColor,
      majorGridColor: '#2a2a2a',
      minorGridSize: this.gridSize,
      majorGridMultiplier: 5
    });
  }

  /**
   * Create the main material output node
   */
  createMainNode() {
    const mainNode = this.addNode("MainMaterialNode", 400, 200);
    if (mainNode) {
      mainNode.element.classList.add("main-output");
    }
  }

  /**
   * Add a node to the graph
   */
  addNode(nodeKey, x, y) {
    const id = generateId("node");
    const node = materialNodeRegistry.createNode(nodeKey, id, x, y, this.app);

    if (!node) {
      console.error(`Failed to create node: ${nodeKey}`);
      return null;
    }

    this.nodes.set(id, node);

    // Render and add to DOM
    const element = node.render();
    this.nodesContainer.appendChild(element);

    // Bind node events
    this.bindNodeEvents(node);

    // Update position with transform
    this.updateNodePosition(node);

    // Update status (safely - may not be initialized yet)
    if (this.app && this.app.updateStatus) {
      this.app.updateStatus(`Added ${node.title}`);
    }
    if (this.app && this.app.updateCounts) {
      this.app.updateCounts();
    }

    return node;
  }

  /**
   * Bind event listeners to a node element
   */
  bindNodeEvents(node) {
    const el = node.element;

    // Node selection
    el.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("pin-dot")) return;

      e.stopPropagation();

      if (e.ctrlKey) {
        // Toggle selection
        if (this.selectedNodes.has(node.id)) {
          this.deselectNode(node);
        } else {
          this.selectNode(node, true);
        }
      } else if (!this.selectedNodes.has(node.id)) {
        // Single selection
        this.deselectAll();
        this.selectNode(node);
      }

      // Start dragging
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragOffsets = new Map();

      this.selectedNodes.forEach((nodeId) => {
        const n = this.nodes.get(nodeId);
        this.dragOffsets.set(nodeId, { x: n.x, y: n.y });
      });
    });

    // Pin wiring events with Alt+Click break and Shift+Click marking
    el.querySelectorAll(".pin-dot").forEach((dot) => {
      dot.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        // For reroute nodes, pinId is on the dot itself; for regular nodes, it's on the parent
        const pinId = dot.dataset.pinId || dot.parentElement?.dataset?.pinId;
        const pin = node.findPin(pinId);
        if (!pin) return;

        // Alt+Click: Break all connections to this pin
        if (e.altKey) {
          if (pin.connectedTo) {
            this.wiring.breakLink(pin.connectedTo);
            this.app.updateStatus("Connection broken (Alt+Click)");
          }
          return;
        }

        // Shift+Click: Mark pin for long-distance connection
        if (e.shiftKey) {
          if (!this.markedPin) {
            // First click - mark the source pin
            this.markedPin = { pin, element: dot.parentElement, dot };
            dot.classList.add("marked");
            this.app.updateStatus("Pin marked - Shift+Click target to connect");
          } else {
            // Second click - create connection
            if (this.markedPin.pin !== pin) {
              this.createConnection(this.markedPin.pin, pin);
            }
            // Clear marking
            this.markedPin.dot.classList.remove("marked");
            this.markedPin = null;
          }
          return;
        }

        // Normal click - start wiring
        this.wiring.startWiring(pin, e);
      });
    });

    // Show details on click
    el.addEventListener("click", (e) => {
      if (!e.target.classList.contains("pin-dot")) {
        if (this.app && this.app.details) {
          this.app.details.showNodeProperties(node);
        }
      }
    });
  }

  /**
   * Select a node
   */
  selectNode(node, additive = false) {
    if (!additive) {
      this.selectedNodes.forEach((id) => {
        const n = this.nodes.get(id);
        if (n) n.element.classList.remove("selected");
      });
      this.selectedNodes.clear();
    }

    this.selectedNodes.add(node.id);
    node.element.classList.add("selected");
  }

  /**
   * Deselect a node
   */
  deselectNode(node) {
    this.selectedNodes.delete(node.id);
    node.element.classList.remove("selected");
  }

  /**
   * Deselect all nodes and links
   */
  deselectAll() {
    this.selectedNodes.forEach((id) => {
      const node = this.nodes.get(id);
      if (node) node.element.classList.remove("selected");
    });
    this.selectedNodes.clear();

    this.selectedLinks.forEach((id) => {
      const link = this.links.get(id);
      if (link && link.element) {
        link.element.classList.remove("selected");
      }
    });
    this.selectedLinks.clear();

    if (this.app && this.app.details) {
      this.app.details.showMaterialProperties();
    }
  }

  /**
   * Update node position with current transform
   */
  updateNodePosition(node) {
    const screenX = node.x * this.zoom + this.panX;
    const screenY = node.y * this.zoom + this.panY;
    node.element.style.left = `${screenX}px`;
    node.element.style.top = `${screenY}px`;
    node.element.style.transform = `scale(${this.zoom})`;
    node.element.style.transformOrigin = "top left";
  }



  /**
   * Delete selected nodes and links
   */
  deleteSelected() {
    // Delete selected links first
    this.selectedLinks.forEach((linkId) => {
      this.wiring.breakLink(linkId);
    });

    // Delete selected nodes
    this.selectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;

      // Don't delete main node
      if (node.type === "main-output") {
        this.app.updateStatus("Cannot delete main material node");
        return;
      }

      // Break all connections to this node
      [...node.inputs, ...node.outputs].forEach((pin) => {
        if (pin.connectedTo) {
          this.wiring.breakLink(pin.connectedTo);
        }
      });

      // Remove from DOM
      node.element.remove();
      this.nodes.delete(nodeId);
    });

    this.selectedNodes.clear();
    this.app.updateCounts();
    this.app.details.showMaterialProperties();
  }



  /**
   * Duplicate selected nodes
   */
  duplicateSelected() {
    const offset = 50;
    const newNodes = [];

    this.selectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (!node || node.type === "main-output") return;

      const newNode = this.addNode(
        node.nodeKey,
        node.x + offset,
        node.y + offset
      );
      if (newNode) {
        // Copy properties
        newNode.properties = { ...node.properties };
        newNodes.push(newNode);
      }
    });

    // Select the new nodes
    this.deselectAll();
    newNodes.forEach((node) => this.selectNode(node, true));
  }

  /**
   * Align selected nodes to a specific edge
   * @param {string} edge - 'top', 'bottom', 'left', 'right'
   */
  alignSelected(edge) {
    if (this.selectedNodes.size < 2) {
      this.app.updateStatus("Select 2+ nodes to align");
      return;
    }

    const nodes = [...this.selectedNodes]
      .map((id) => this.nodes.get(id))
      .filter(Boolean);

    switch (edge) {
      case "top": {
        const minY = Math.min(...nodes.map((n) => n.y));
        nodes.forEach((n) => {
          n.y = minY;
          this.updateNodePosition(n);
        });
        this.app.updateStatus(`Aligned ${nodes.length} nodes to top`);
        break;
      }
      case "bottom": {
        const maxY = Math.max(
          ...nodes.map((n) => n.y + (n.element?.offsetHeight || 100))
        );
        nodes.forEach((n) => {
          n.y = maxY - (n.element?.offsetHeight || 100);
          this.updateNodePosition(n);
        });
        this.app.updateStatus(`Aligned ${nodes.length} nodes to bottom`);
        break;
      }
      case "left": {
        const minX = Math.min(...nodes.map((n) => n.x));
        nodes.forEach((n) => {
          n.x = minX;
          this.updateNodePosition(n);
        });
        this.app.updateStatus(`Aligned ${nodes.length} nodes to left`);
        break;
      }
      case "right": {
        const maxX = Math.max(
          ...nodes.map((n) => n.x + (n.element?.offsetWidth || 150))
        );
        nodes.forEach((n) => {
          n.x = maxX - (n.element?.offsetWidth || 150);
          this.updateNodePosition(n);
        });
        this.app.updateStatus(`Aligned ${nodes.length} nodes to right`);
        break;
      }
    }

    this.wiring.updateAllWires();
  }

  /**
   * Focus view on selected nodes
   */
  focusSelected() {
    if (this.selectedNodes.size === 0) {
      this.focusMainNode();
      return;
    }

    const nodes = [...this.selectedNodes]
      .map((id) => this.nodes.get(id))
      .filter(Boolean);

    // Calculate bounding box of selected nodes
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(
      ...nodes.map((n) => n.x + (n.element?.offsetWidth || 150))
    );
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(
      ...nodes.map((n) => n.y + (n.element?.offsetHeight || 100))
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const rect = this.graphPanel.getBoundingClientRect();
    this.panX = rect.width / 2 - centerX * this.zoom;
    this.panY = rect.height / 2 - centerY * this.zoom;

    this.drawGrid();
    this.nodes.forEach((node) => this.updateNodePosition(node));
    this.wiring.updateAllWires();

    this.app.updateStatus(`Focused on ${nodes.length} selected node(s)`);
  }

  /**
   * Focus on main material node
   */
  focusMainNode() {
    const mainNode = [...this.nodes.values()].find(
      (n) => n.type === "main-output"
    );
    if (!mainNode) return;

    const rect = this.graphPanel.getBoundingClientRect();
    this.panX = rect.width / 2 - mainNode.x * this.zoom - 100;
    this.panY = rect.height / 2 - mainNode.y * this.zoom - 100;

    this.drawGrid();
    this.nodes.forEach((node) => this.updateNodePosition(node));
    this.wiring.updateAllWires();
  }
}
