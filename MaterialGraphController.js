/**
 * MaterialGraphController.js
 *
 * Manages the graph canvas, node rendering, wire connections, and user interactions.
 * Extracted from material-app.js for modularity.
 */

import { HotkeyManager } from "./ui/HotkeyManager.js";
import {
  materialNodeRegistry,
  MaterialNode,
  PinTypes,
} from "./MaterialNodeFramework.js";
import { debounce, generateId } from "./utils.js";
import { WireRenderer } from "./shared/WireRenderer.js";
import { GridRenderer } from "./shared/GridRenderer.js";

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

    // Mouse events
    this.graphPanel.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.graphPanel.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.graphPanel.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.graphPanel.addEventListener("wheel", (e) => this.onWheel(e));
    this.graphPanel.addEventListener("contextmenu", (e) =>
      this.onContextMenu(e)
    );

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

    // Keyboard events
    document.addEventListener("keydown", (e) => this.onKeyDown(e));
    document.addEventListener("keyup", (e) => this.onKeyUp(e));

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
    this.updateAllWires();
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
    const mainNode = this.addNode("MainMaterialNode", 600, 200);
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
            this.breakLink(pin.connectedTo);
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
        this.startWiring(pin, e);
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
   * Start wiring from a pin
   */
  startWiring(pin, e) {
    this.isWiring = true;
    this.wiringStartPin = pin;

    const ghostWire = document.getElementById("ghost-wire");
    ghostWire.style.display = "block";
    ghostWire.setAttribute("data-type", pin.type);
    ghostWire.style.stroke = pin.color;

    this.updateGhostWire(e);
  }

  /**
   * Update ghost wire position
   */
  updateGhostWire(e) {
    if (!this.isWiring || !this.wiringStartPin) return;

    const pin = this.wiringStartPin;
    const pinDot = pin.element.querySelector(".pin-dot");
    const rect = pinDot.getBoundingClientRect();
    const graphRect = this.graphPanel.getBoundingClientRect();

    const startX = rect.left + rect.width / 2 - graphRect.left;
    const startY = rect.top + rect.height / 2 - graphRect.top;
    const endX = e.clientX - graphRect.left;
    const endY = e.clientY - graphRect.top;

    const path = WireRenderer.getWirePath(startX, startY, endX, endY, {
      direction: pin.dir
    });

    const ghostWire = document.getElementById("ghost-wire");
    ghostWire.setAttribute("d", path);
  }

  /**
   * End wiring
   */
  endWiring(targetPin = null) {
    if (!this.isWiring) return;

    const ghostWire = document.getElementById("ghost-wire");
    ghostWire.style.display = "none";

    if (targetPin && this.wiringStartPin) {
      this.createConnection(this.wiringStartPin, targetPin);
    }

    this.isWiring = false;
    this.wiringStartPin = null;
  }

  /**
   * Create a connection between two pins
   */
  createConnection(pinA, pinB) {
    // Ensure correct direction (output -> input)
    const outputPin = pinA.dir === "out" ? pinA : pinB;
    const inputPin = pinA.dir === "in" ? pinA : pinB;

    // Validate connection
    if (!outputPin.canConnectTo(inputPin)) {
      this.app.updateStatus("Cannot connect: incompatible types");
      return false;
    }

    // Check if input already has a connection
    if (inputPin.connectedTo) {
      this.breakLink(inputPin.connectedTo);
    }

    // Create link
    const linkId = generateId("link");
    const link = {
      id: linkId,
      outputPin: outputPin,
      inputPin: inputPin,
      type: outputPin.type,
      element: null,
    };

    // Update pin states
    outputPin.connectedTo = linkId;
    inputPin.connectedTo = linkId;

    // Update pin visuals
    outputPin.element.querySelector(".pin-dot").classList.remove("hollow");
    inputPin.element.querySelector(".pin-dot").classList.remove("hollow");

    this.links.set(linkId, link);
    this.drawWire(link);

    this.app.updateStatus("Connected");
    this.app.updateCounts();
    this.app.triggerLiveUpdate();

    return true;
  }

  /**
   * Draw a wire for a connection
   */
  drawWire(link) {
    const outputDot = link.outputPin.element.querySelector(".pin-dot");
    const inputDot = link.inputPin.element.querySelector(".pin-dot");

    if (!outputDot || !inputDot) return;

    const graphRect = this.graphPanel.getBoundingClientRect();
    const outRect = outputDot.getBoundingClientRect();
    const inRect = inputDot.getBoundingClientRect();

    const startX = outRect.left + outRect.width / 2 - graphRect.left;
    const startY = outRect.top + outRect.height / 2 - graphRect.top;
    const endX = inRect.left + inRect.width / 2 - graphRect.left;
    const endY = inRect.top + inRect.height / 2 - graphRect.top;

    const path = WireRenderer.getWirePath(startX, startY, endX, endY);

    if (!link.element) {
      const wire = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      wire.classList.add("wire");
      wire.setAttribute("data-type", link.type);
      wire.setAttribute("data-link-id", link.id);
      wire.style.stroke = PinTypes[link.type.toUpperCase()]?.color || "#888";

      wire.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectLink(link);
      });

      this.wireGroup.appendChild(wire);
      link.element = wire;
    }

    link.element.setAttribute("d", path);
  }

  /**
   * Update all wire positions
   */
  updateAllWires() {
    this.links.forEach((link) => this.drawWire(link));
  }

  /**
   * Select a link
   */
  selectLink(link) {
    this.deselectAll();
    this.selectedLinks.add(link.id);
    link.element.classList.add("selected");
  }

  /**
   * Break a link by ID
   */
  breakLink(linkId) {
    const link = this.links.get(linkId);
    if (!link) return;

    // Reset pin states
    link.outputPin.connectedTo = null;
    link.inputPin.connectedTo = null;

    // Update visuals
    if (link.outputPin.element) {
      link.outputPin.element.querySelector(".pin-dot").classList.add("hollow");
    }
    if (link.inputPin.element) {
      link.inputPin.element.querySelector(".pin-dot").classList.add("hollow");
    }

    // Remove wire element
    if (link.element) {
      link.element.remove();
    }

    this.links.delete(linkId);
    this.selectedLinks.delete(linkId);

    this.app.updateCounts();
    this.app.triggerLiveUpdate();
  }

  /**
   * Delete selected nodes and links
   */
  deleteSelected() {
    // Delete selected links first
    this.selectedLinks.forEach((linkId) => {
      this.breakLink(linkId);
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
          this.breakLink(pin.connectedTo);
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
   * Handle mouse down
   */
  onMouseDown(e) {
    // Middle mouse or right mouse for panning
    if (e.button === 1 || (e.button === 2 && !e.target.closest(".node"))) {
      this.isPanning = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      e.preventDefault();
    }
  }

  /**
   * Handle mouse move
   */
  onMouseMove(e) {
    if (this.isPanning) {
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      this.drawGrid();
      this.nodes.forEach((node) => this.updateNodePosition(node));
      this.updateAllWires();
    }

    if (this.isDragging && this.dragOffsets) {
      const dx = (e.clientX - this.dragStartX) / this.zoom;
      const dy = (e.clientY - this.dragStartY) / this.zoom;

      this.selectedNodes.forEach((nodeId) => {
        const node = this.nodes.get(nodeId);
        const offset = this.dragOffsets.get(nodeId);
        if (node && offset) {
          node.x = offset.x + dx;
          node.y = offset.y + dy;
          this.updateNodePosition(node);
        }
      });

      this.updateAllWires();
    }

    if (this.isWiring) {
      this.updateGhostWire(e);
    }
  }

  /**
   * Handle mouse up
   */
  onMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.dragOffsets = null;
    }

    if (this.isWiring) {
      // Check if we're over a valid target pin
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target.classList.contains("pin-dot")) {
        const pinEl = target.parentElement;
        const pinId = pinEl.dataset.pinId;

        // Find the target node and pin
        for (const [id, node] of this.nodes) {
          const pin = node.findPin(pinId);
          if (pin && pin !== this.wiringStartPin) {
            this.endWiring(pin);
            return;
          }
        }
      }

      this.endWiring();
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
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.25, Math.min(2, this.zoom * zoomFactor));

    // Zoom toward mouse position
    const zoomRatio = newZoom / this.zoom;
    this.panX = mouseX - (mouseX - this.panX) * zoomRatio;
    this.panY = mouseY - (mouseY - this.panY) * zoomRatio;
    this.zoom = newZoom;

    // Update display
    document.getElementById("zoom-readout").textContent = `${Math.round(
      this.zoom * 100
    )}%`;

    this.drawGrid();
    this.nodes.forEach((node) => this.updateNodePosition(node));
    this.updateAllWires();
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
      this.deleteSelected();
    }

    // Ctrl shortcuts
    if (e.ctrlKey) {
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        // TODO: Undo
      }
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        // TODO: Redo
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        this.app.save();
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        this.duplicateSelected();
      }
    }

    // Shift+WASD - Node alignment shortcuts
    if (e.shiftKey && !e.ctrlKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case "w":
          e.preventDefault();
          this.alignSelected("top");
          break;
        case "a":
          e.preventDefault();
          this.alignSelected("left");
          break;
        case "s":
          e.preventDefault();
          this.alignSelected("bottom");
          break;
        case "d":
          e.preventDefault();
          this.alignSelected("right");
          break;
      }
    }

    // F - Focus on selected nodes
    if (e.key === "f" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.focusSelected();
    }

    // Home - Focus on main material node
    if (e.key === "Home") {
      e.preventDefault();
      this.focusMainNode();
    }

    // Hotkey spawning is now handled by HotkeyManager via "Hold key + Click"
    // The HotkeyManager is wired up in the constructor and graph click handler
  }

  /**
   * Handle key up
   */
  onKeyUp(e) {
    // Nothing special needed
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

    this.updateAllWires();
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
    this.updateAllWires();

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
    this.updateAllWires();
  }
}
