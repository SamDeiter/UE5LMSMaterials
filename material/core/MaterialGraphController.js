/**
 * MaterialGraphController.js
 *
 * Manages the graph canvas, node rendering, and core operations.
 * InputController has been extracted to MaterialInputController.js
 * WiringController has been extracted to MaterialWiringController.js
 * Extracted from material-app.js for modularity.
 */

import { ActionMenuController } from "../../shared/ActionMenuController.js";
import { StatsController } from "../ui/StatsController.js";
import { LayoutController } from "../ui/LayoutController.js";

import { HotkeyManager } from "../../shared/HotkeyManager.js";
import {
  materialNodeRegistry,
  MaterialNode,
  PinTypes,
} from "./MaterialNodeFramework.js";
import { debounce, generateId } from "../../shared/utils.js";
import { WireRenderer } from "../../shared/WireRenderer.js";
import { GridRenderer } from "../../shared/GridRenderer.js";
import { GraphRenderer } from "./GraphRenderer.js";
import { MaterialInputController } from "./MaterialInputController.js";
import { MaterialWiringController } from "./MaterialWiringController.js";
import { AlignmentGuides } from "../ui/AlignmentGuides.js";

import { CommandStack } from "./CommandStack.js";
import { SelectionController } from "./SelectionController.js";
import { ClipboardController } from "./ClipboardController.js";
import { 
  DeleteNodesCommand, 
  MoveNodeCommand,
  CreateLinkCommand,
  BreakLinkCommand,
  PropertyChangeCommand
} from "./GraphCommands.js";


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
    
    // Subsystems
    this.selection = new SelectionController(this.app, this);
    this.clipboard = new ClipboardController(this.app, this);

    // Transform state
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;

    // Backwards compatibility getters
    Object.defineProperty(this, 'selectedNodes', {
        get: () => this.selection.selectedNodes,
        configurable: true
    });
    Object.defineProperty(this, 'selectedLinks', {
        get: () => this.selection.selectedLinks,
        configurable: true
    });

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

    // Snap-to-grid settings (UE5 feature)
    this.snapToGrid = false;
    this.snapGridSize = 20; // Snap increment when enabled

    // Hotkey manager for "Hold key + Click" node spawning
    this.hotkeyManager = new HotkeyManager(this, materialNodeRegistry);

    // Delegate input handling to InputController
    this.input = new MaterialInputController(this);

    // Delegate wiring operations to WiringController
    this.wiring = new MaterialWiringController(this);

    // Alignment guides for UE5-style visual feedback
    this.alignmentGuides = new AlignmentGuides(this);

    // Renderer subsystem
    this.renderer = new GraphRenderer(this);

    // Command Stack for Undo/Redo
    this.commands = new CommandStack(this.app);

    // Pin marking for Shift+Click long-distance connections
    this.markedPin = null;

    this.initEvents();
    this.resize();
  }

  /**
   * Resizes the graph canvas and renderer
   */
  resize() {
    if (this.renderer) {
      this.renderer.resize();
    }
  }

  /**
   * Initialize event listeners
   */
  initEvents() {
    // Resize handler
    window.addEventListener(
      "resize",
      debounce(() => this.renderer.resize(), 100)
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
   * Draw the background grid
   */
  drawGrid() {
      this.renderer.drawGrid();
  }

  /**
   * Update lazy rendering
   */
  updateLazyRendering() {
      this.renderer.updateLazyRendering();
  }

  /**
   * Create the main material output node
   */
  createMainNode() {
    // Position dynamically based on current graph panel size
    const panelWidth = this.graphPanel?.clientWidth || 800;
    const panelHeight = this.graphPanel?.clientHeight || 600;
    
    // Place node in right-center of visible area
    const x = Math.max(100, Math.min(panelWidth - 200, panelWidth * 0.6));
    const y = Math.max(100, panelHeight / 2 - 100);
    
    const mainNode = this.addNode("MainMaterialNode", x, y);
    if (mainNode) {
      mainNode.element.classList.add("main-output");
    }
  }

  /**
   * Add a node to the graph
   */
  addNode(nodeKey, x, y, explicitId = null) {
    const id = explicitId || generateId("node");
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
    this.updateLazyRendering();
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

        // Ctrl+Click on connected input: disconnect and start re-wiring
        if (e.ctrlKey && pin.dir === 'in' && pin.connectedTo) {
          const linkId = pin.connectedTo;
          const link = this.links.get(linkId);
          if (link) {
            const outputPin = link.outputPin;
            this.wiring.breakLink(linkId);
            this.wiring.startWiring(outputPin, e);
            this.app.updateStatus("Rewiring - drag to new target");
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

    // Double-click on Comment nodes for inline editing
    if (node.nodeKey === "Comment" || node.type === "comment") {
      el.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        this.startCommentEditing(node);
      });
    }
  }

  /**
   * Start inline editing for a Comment node
   */
  startCommentEditing(node) {
    const titleEl = node.element.querySelector(".node-title");
    if (!titleEl) return;

    const currentText = node.properties.CommentText || "Comment";
    
    // Create editable input
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.style.cssText = `
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #FF6B00;
      color: white;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 3px;
      outline: none;
    `;

    const originalText = titleEl.textContent;
    titleEl.textContent = "";
    titleEl.appendChild(input);
    input.focus();
    input.select();

    const finishEditing = () => {
      const newText = input.value.trim() || "Comment";
      node.properties.CommentText = newText;
      titleEl.textContent = newText;
      
      // Update details panel if showing this node
      if (this.app && this.app.details) {
        this.app.details.showNodeProperties(node);
      }
      
      this.app.updateStatus(`Updated comment: "${newText}"`);
    };

    input.addEventListener("blur", finishEditing);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        titleEl.textContent = originalText;
      }
      e.stopPropagation();
    });
  }

  /**
   * Select a node
   */
  selectNode(node, additive = false) {
    this.selection.selectNode(node, additive);
  }

  /**
   * Deselect a node
   */
  deselectNode(node) {
    this.selection.deselectNode(node);
  }

  /**
   * Deselect all nodes and links
   */
  deselectAll() {
    this.selection.deselectAll();
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
    const nodesToDelete = this.selection.getSelectedNodes().filter(n => n.type !== 'main-output');
    const linksToDelete = this.selection.getSelectedLinks();

    if (nodesToDelete.length > 0 || linksToDelete.length > 0) {
        this.commands.execute(new DeleteNodesCommand(this, nodesToDelete, linksToDelete));
    }
  }

  /**
   * Serialize the entire graph state
   */
  serialize() {
    const nodes = [];
    this.nodes.forEach(node => {
      nodes.push(node.serialize());
    });

    const links = [];
    this.links.forEach((link) => {
      links.push({
        id: link.id,
        sourceNodeId: link.sourcePin.node.id,
        sourcePinId: link.sourcePin.localId,
        targetNodeId: link.targetPin.node.id,
        targetPinId: link.targetPin.localId,
      });
    });

    return {
      nodes,
      links,
      panX: this.panX,
      panY: this.panY,
      zoom: this.zoom
    };
  }

  /**
   * Deserialize and rebuild the graph
   */
  deserialize(data) {
    if (!data) return;

    // Clear current graph
    this.nodes.forEach(node => node.element.remove());
    this.nodes.clear();
    this.links.forEach(link => {
      if (link.element) link.element.remove();
    });
    this.links.clear();

    // Restore transform
    this.panX = data.panX || 0;
    this.panY = data.panY || 0;
    this.zoom = data.zoom || 1.0;

    // Restore nodes
    if (data.nodes) {
      data.nodes.forEach(nodeData => {
        const node = this.addNode(nodeData.nodeKey, nodeData.x, nodeData.y, nodeData.id);
        if (node && nodeData.properties) {
          node.properties = { ...nodeData.properties };
          node.updatePreview(node.element.querySelector('.node-preview'));
        }
      });
    }

    // Restore links
    if (data.links) {
      data.links.forEach(linkData => {
        const sourceNode = this.nodes.get(linkData.sourceNodeId);
        const targetNode = this.nodes.get(linkData.targetNodeId);
        if (sourceNode && targetNode) {
          const sourcePin = sourceNode.findPin(`${linkData.sourceNodeId}-${linkData.sourcePinId}`);
          const targetPin = targetNode.findPin(`${linkData.targetNodeId}-${linkData.targetPinId}`);
          if (sourcePin && targetPin) {
            this.wiring.createConnection(sourcePin, targetPin, linkData.id);
          }
        }
      });
    }

    this.drawGrid();
    this.app.updateCounts();
    this.app.triggerLiveUpdate();
    this.updateLazyRendering();
  }




  /**
   * Duplicate selected nodes
   */
  duplicateSelected() {
    this.clipboard.duplicateSelected();
  }

  /**
   * Copy selected nodes to clipboard
   */
  copySelected() {
    this.clipboard.copySelected();
  }

  /**
   * Paste nodes from clipboard
   */
  pasteNodes() {
    this.clipboard.pasteNodes();
  }

  /**
   * Select all nodes in the graph
   */
  selectAll() {
    this.deselectAll();
    this.nodes.forEach((node) => {
      this.selection.selectNode(node, true);
    });

    if (this.app && this.app.updateStatus) {
      this.app.updateStatus(`Selected ${this.selection.selectedNodes.size} node(s)`);
    }
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
    if (this.selection.selectedNodes.size === 0) {
      this.focusMainNode();
      return;
    }

    const nodes = this.selection.getSelectedNodes();

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

  /**
   * Toggle snap-to-grid mode
   */
  toggleSnapToGrid() {
    this.snapToGrid = !this.snapToGrid;
    this.app.updateStatus(`Snap to grid: ${this.snapToGrid ? 'ON' : 'OFF'}`);
    
    // Update toolbar indicator if it exists
    const snapIndicator = document.getElementById('snap-indicator');
    if (snapIndicator) {
      snapIndicator.classList.toggle('active', this.snapToGrid);
    }
    
    return this.snapToGrid;
  }

  /**
   * Snap a coordinate to the grid
   * @param {number} value - Position to snap
   * @returns {number} Snapped position
   */
  snapPosition(value) {
    if (!this.snapToGrid) return value;
    return Math.round(value / this.snapGridSize) * this.snapGridSize;
  }

  /**
   * Update node position with optional grid snapping
   * @param {MaterialNode} node - The node to update
   * @param {boolean} applySnap - Whether to apply snap-to-grid
   */
  updateNodePositionWithSnap(node, applySnap = true) {
    if (applySnap && this.snapToGrid) {
      node.x = this.snapPosition(node.x);
      node.y = this.snapPosition(node.y);
    }
    this.updateNodePosition(node);
  }

  /**
   * Create a connection between two pins
   * @param {MaterialPin} sourcePin 
   * @param {MaterialPin} targetPin 
   */
  createConnection(sourcePin, targetPin) {
    // Delegate to wiring controller
    this.wiring.createConnection(sourcePin, targetPin);
  }
}
