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
} from "./MaterialNodeFramework.js";
import { MaterialExpressionDefinitions } from "./data/MaterialExpressionDefinitions.js";
import { HotkeyManager } from "./ui/HotkeyManager.js";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(prefix = "node") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for performance
 */
function debounce(fn, ms) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ============================================================================
// TEXTURE MANAGER - Handles loading and managing textures
// ============================================================================
class TextureManager {
  constructor() {
    this.textures = new Map(); // id -> { name, dataUrl, image }
    this.defaultTextures = [
      {
        id: "checkerboard",
        name: "Checkerboard",
        generator: this.generateCheckerboard.bind(this),
      },
      { id: "noise", name: "Noise", generator: this.generateNoise.bind(this) },
      {
        id: "gradient",
        name: "Gradient (V)",
        generator: this.generateGradient.bind(this),
      },
      {
        id: "normal_flat",
        name: "Flat Normal",
        generator: this.generateFlatNormal.bind(this),
      },
    ];
    this.initDefaultTextures();
  }

  /**
   * Initialize built-in default textures
   */
  initDefaultTextures() {
    // Load generated textures
    this.defaultTextures.forEach(({ id, name, generator }) => {
      const dataUrl = generator(256, 256);
      const img = new Image();
      img.src = dataUrl;
      this.textures.set(id, { name, dataUrl, image: img, isDefault: true });
    });

    // Load file-based default textures
    const fileTextures = [
      {
        id: "base_texture",
        name: "Base Texture",
        path: "assets/T_Base_Texture_00.png",
      },
    ];

    fileTextures.forEach(({ id, name, path }) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Create canvas to get dataUrl
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        this.textures.set(id, { name, dataUrl, image: img, isDefault: true });
      };
      img.src = path;
    });
  }

  /**
   * Load texture from file
   * @returns {Promise<{id: string, name: string, dataUrl: string}>}
   */
  loadFromFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png, image/jpeg, image/webp, image/gif";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }
        this.processFile(file).then(resolve).catch(reject);
      };
      input.click();
    });
  }

  /**
   * Process an uploaded file
   */
  processFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const id = `tex_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

        const img = new Image();
        img.onload = () => {
          this.textures.set(id, {
            name,
            dataUrl,
            image: img,
            isDefault: false,
          });
          resolve({ id, name, dataUrl, width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load texture from URL
   */
  async loadFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL("image/png");
        const id = `tex_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const name =
          url
            .split("/")
            .pop()
            .replace(/\.[^/.]+$/, "") || "Loaded Texture";

        this.textures.set(id, { name, dataUrl, image: img, isDefault: false });
        resolve({ id, name, dataUrl, width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error("Failed to load image from URL"));
      img.src = url;
    });
  }

  /**
   * Get a texture by ID
   */
  get(id) {
    return this.textures.get(id);
  }

  /**
   * Get all available textures
   */
  getAll() {
    return Array.from(this.textures.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  /**
   * Remove a texture
   */
  remove(id) {
    const tex = this.textures.get(id);
    if (tex && !tex.isDefault) {
      this.textures.delete(id);
      return true;
    }
    return false;
  }

  // =========================================================================
  // PROCEDURAL TEXTURE GENERATORS
  // =========================================================================
  generateCheckerboard(width, height, checkSize = 32) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    for (let y = 0; y < height; y += checkSize) {
      for (let x = 0; x < width; x += checkSize) {
        const isWhite = (x / checkSize + y / checkSize) % 2 === 0;
        ctx.fillStyle = isWhite ? "#ffffff" : "#808080";
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }
    return canvas.toDataURL("image/png");
  }

  generateNoise(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  generateGradient(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(1, "#ffffff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png");
  }

  generateFlatNormal(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    // Flat normal = (0.5, 0.5, 1.0) in RGB = points straight up
    ctx.fillStyle = "#8080FF";
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png");
  }
}

// Global texture manager instance
const textureManager = new TextureManager();

// ============================================================================
// GRAPH CONTROLLER
// ============================================================================
class MaterialGraphController {
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
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.fillStyle = this.gridColor;
    ctx.fillRect(0, 0, width, height);

    const scaledGridSize = this.gridSize * this.zoom;
    const offsetX = this.panX % scaledGridSize;
    const offsetY = this.panY % scaledGridSize;

    ctx.strokeStyle = this.gridLineColor;
    ctx.lineWidth = 1;

    // Vertical lines
    ctx.beginPath();
    for (let x = offsetX; x < width; x += scaledGridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = offsetY; y < height; y += scaledGridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Major grid lines (every 5)
    const majorGridSize = scaledGridSize * 5;
    const majorOffsetX = this.panX % majorGridSize;
    const majorOffsetY = this.panY % majorGridSize;

    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = majorOffsetX; x < width; x += majorGridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = majorOffsetY; y < height; y += majorGridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
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

    // Create bezier curve
    const dx = Math.abs(endX - startX);
    const tension = Math.min(dx * 0.5, 100);

    let path;
    if (pin.dir === "out") {
      path = `M ${startX} ${startY} C ${startX + tension} ${startY}, ${
        endX - tension
      } ${endY}, ${endX} ${endY}`;
    } else {
      path = `M ${startX} ${startY} C ${startX - tension} ${startY}, ${
        endX + tension
      } ${endY}, ${endX} ${endY}`;
    }

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

    const dx = Math.abs(endX - startX);
    const tension = Math.min(dx * 0.5, 100);

    const path = `M ${startX} ${startY} C ${startX + tension} ${startY}, ${
      endX - tension
    } ${endY}, ${endX} ${endY}`;

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

// ============================================================================
// PALETTE CONTROLLER
// ============================================================================
class PaletteController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("palette-content");
    this.filterInput = document.getElementById("palette-filter");

    this.filterInput.addEventListener(
      "input",
      debounce(() => this.render(), 150)
    );
    this.render();
  }

  render() {
    const filter = this.filterInput.value.toLowerCase();
    const categories = materialNodeRegistry.getAllCategories();

    let html = "";
    categories.forEach((category) => {
      if (category === "Output") return; // Don't show main node in palette

      const nodes = materialNodeRegistry.getByCategory(category);
      const filteredNodes = filter
        ? nodes.filter(
            (n) =>
              n.title.toLowerCase().includes(filter) ||
              n.key.toLowerCase().includes(filter)
          )
        : nodes;

      if (filteredNodes.length === 0) return;

      const isCollapsed = filter ? "" : "collapsed";
      html += `
                <div class="tree-category ${isCollapsed}">
                    <div class="tree-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
                        <i class="fas fa-chevron-down"></i>
                        <span>${category}</span>
                    </div>
                    <div class="tree-category-content">
                        ${filteredNodes
                          .map(
                            (node) => `
                            <div class="tree-item" data-node-key="${
                              node.key
                            }" draggable="true">
                                <span class="tree-item-icon">${
                                  node.icon || "●"
                                }</span>
                                <span>${node.title}</span>
                                ${
                                  node.hotkey
                                    ? `<span style="margin-left:auto;color:#666;font-size:9px;">${node.hotkey.toUpperCase()}</span>`
                                    : ""
                                }
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `;
    });

    this.container.innerHTML = html;

    // Bind click events
    this.container.querySelectorAll(".tree-item").forEach((item) => {
      item.addEventListener("dblclick", () => {
        const nodeKey = item.dataset.nodeKey;
        const rect = this.app.graph.graphPanel.getBoundingClientRect();
        const x = (rect.width / 2 - this.app.graph.panX) / this.app.graph.zoom;
        const y = (rect.height / 2 - this.app.graph.panY) / this.app.graph.zoom;
        this.app.graph.addNode(nodeKey, x, y);
      });

      // Drag and drop
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.nodeKey);
      });
    });
  }
}

// ============================================================================
// DETAILS CONTROLLER
// ============================================================================
class DetailsController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("details-content");
    this.materialProps = document.getElementById("material-properties");
    this.nodeProps = document.getElementById("node-properties");
    this.currentNode = null;

    this.bindMaterialPropertyEvents();
  }

  bindMaterialPropertyEvents() {
    // Blend mode changes affect main node pins
    const blendMode = document.getElementById("blend-mode");
    if (blendMode) {
      blendMode.addEventListener("change", () => this.updateMainNodePins());
    }

    const shadingModel = document.getElementById("shading-model");
    if (shadingModel) {
      shadingModel.addEventListener("change", () => this.updateMainNodePins());
    }
  }

  updateMainNodePins() {
    // TODO: Gray out pins based on blend mode
    const blendMode = document.getElementById("blend-mode").value;
    const mainNode = [...this.app.graph.nodes.values()].find(
      (n) => n.type === "main-output"
    );

    if (!mainNode) return;

    // Update opacity/mask visibility based on blend mode
    mainNode.inputs.forEach((pin) => {
      if (pin.element) {
        const isActive =
          !pin.conditionalOn || pin.conditionalOn.includes(blendMode);
        pin.element.classList.toggle("inactive", !isActive);
      }
    });
  }

  showMaterialProperties() {
    this.materialProps.style.display = "block";
    this.nodeProps.style.display = "none";
    this.currentNode = null;
  }

  showNodeProperties(node) {
    this.currentNode = node;
    this.materialProps.style.display = "none";
    this.nodeProps.style.display = "block";

    let html = `
            <div class="property-category">
                <div class="category-header">
                    <i class="fas fa-chevron-down"></i>
                    <span>${node.title}</span>
                </div>
                <div class="category-content">
        `;

    // Render properties
    Object.entries(node.properties).forEach(([key, value]) => {
      html += this.renderProperty(key, value, node);
    });

    html += "</div></div>";
    this.nodeProps.innerHTML = html;

    // Bind property change events
    this.nodeProps.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", (e) => {
        const propKey = e.target.dataset.property;
        let newValue =
          e.target.type === "checkbox" ? e.target.checked : e.target.value;

        // Parse numbers
        if (e.target.type === "number") {
          newValue = parseFloat(newValue);
        }

        node.properties[propKey] = newValue;
        node.updatePreview(node.element.querySelector(".node-preview"));
        this.app.graph.updateAllWires();
      });
    });

    // Bind texture-specific events (file load, URL load, select)
    this.bindTextureEvents(node);
  }

  renderProperty(key, value, node) {
    if (typeof value === "boolean") {
      return `
                <div class="property-row">
                    <label>${key}</label>
                    <input type="checkbox" class="ue5-checkbox" data-property="${key}" ${
        value ? "checked" : ""
      }>
                </div>
            `;
    }

    if (typeof value === "number") {
      return `
                <div class="property-row">
                    <label>${key}</label>
                    <input type="number" data-property="${key}" value="${value}" step="0.01">
                </div>
            `;
    }

    if (typeof value === "object" && value !== null) {
      // Color/Vector value
      if ("R" in value) {
        return `
                    <div class="property-row">
                        <label>${key}</label>
                        <div style="display:flex;gap:4px;flex:1;">
                            <input type="number" data-property="${key}.R" value="${value.R}" step="0.01" style="width:50px;">
                            <input type="number" data-property="${key}.G" value="${value.G}" step="0.01" style="width:50px;">
                            <input type="number" data-property="${key}.B" value="${value.B}" step="0.01" style="width:50px;">
                        </div>
                    </div>
                `;
      }
      return "";
    }

    // Special handling for TextureAsset properties
    if (key === "TextureAsset") {
      const textures = textureManager.getAll();
      const currentTexId = value;
      const currentTex = currentTexId ? textureManager.get(currentTexId) : null;
      const previewUrl = currentTex ? currentTex.dataUrl : "";
      const texName = currentTex ? currentTex.name : "None";

      return `
        <div class="property-row texture-property">
          <label>${key}</label>
          <div class="texture-picker" data-property="${key}" data-node-id="${
        node.id
      }">
            <div class="texture-preview-container">
              ${
                previewUrl
                  ? `<img src="${previewUrl}" class="texture-preview-img" alt="${texName}">`
                  : `<div class="texture-preview-placeholder">No Texture</div>`
              }
            </div>
            <div class="texture-controls">
              <select class="texture-select" data-property="${key}">
                <option value="">None</option>
                ${textures
                  .map(
                    (t) => `
                  <option value="${t.id}" ${
                      t.id === currentTexId ? "selected" : ""
                    }>${t.name}${t.isDefault ? " (Built-in)" : ""}</option>
                `
                  )
                  .join("")}
              </select>
              <button class="texture-load-btn ue5-btn" data-property="${key}" title="Load Texture from File">
                <i class="fas fa-folder-open"></i> Load
              </button>
              <button class="texture-url-btn ue5-btn" data-property="${key}" title="Load from URL">
                <i class="fas fa-link"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return `
            <div class="property-row">
                <label>${key}</label>
                <input type="text" data-property="${key}" value="${
      value || ""
    }">
            </div>
        `;
  }

  /**
   * Bind texture-specific event handlers after rendering
   */
  bindTextureEvents(node) {
    // Texture select dropdowns
    this.nodeProps.querySelectorAll(".texture-select").forEach((select) => {
      select.addEventListener("change", (e) => {
        const propKey = e.target.dataset.property;
        node.properties[propKey] = e.target.value || null;
        this.updateTexturePreview(node, propKey);
        this.updateNodePreview(node);
      });
    });

    // Load from file buttons
    this.nodeProps.querySelectorAll(".texture-load-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const propKey = e.target.closest("button").dataset.property;
        try {
          const result = await textureManager.loadFromFile();
          node.properties[propKey] = result.id;
          this.app.updateStatus(
            `Loaded texture: ${result.name} (${result.width}x${result.height})`
          );
          this.showNodeProperties(node); // Re-render to update dropdown & preview
        } catch (err) {
          this.app.updateStatus("Texture load cancelled or failed");
        }
      });
    });

    // Load from URL buttons
    this.nodeProps.querySelectorAll(".texture-url-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const propKey = e.target.closest("button").dataset.property;
        const url = prompt("Enter image URL:", "https://");
        if (!url || url === "https://") return;

        try {
          this.app.updateStatus("Loading texture from URL...");
          const result = await textureManager.loadFromUrl(url);
          node.properties[propKey] = result.id;
          this.app.updateStatus(`Loaded texture: ${result.name}`);
          this.showNodeProperties(node); // Re-render
        } catch (err) {
          this.app.updateStatus("Failed to load texture from URL");
        }
      });
    });
  }

  /**
   * Update texture preview in the details panel
   */
  updateTexturePreview(node, propKey) {
    const texId = node.properties[propKey];
    const tex = texId ? textureManager.get(texId) : null;
    const container = this.nodeProps.querySelector(
      `.texture-picker[data-property="${propKey}"] .texture-preview-container`
    );

    if (container) {
      if (tex) {
        container.innerHTML = `<img src="${tex.dataUrl}" class="texture-preview-img" alt="${tex.name}">`;
      } else {
        container.innerHTML = `<div class="texture-preview-placeholder">No Texture</div>`;
      }
    }
  }

  /**
   * Update node preview thumbnail
   */
  updateNodePreview(node) {
    const previewEl = node.element?.querySelector(".node-preview");
    if (previewEl) {
      // For texture nodes, show the texture in the preview
      if (node.properties.TextureAsset) {
        const tex = textureManager.get(node.properties.TextureAsset);
        if (tex) {
          previewEl.style.backgroundImage = `url(${tex.dataUrl})`;
          previewEl.style.backgroundSize = "cover";
          previewEl.style.backgroundColor = "transparent";
          return;
        }
      }
      // Default preview
      node.updatePreview(previewEl);
    }
  }
}

// ============================================================================
// ACTION MENU CONTROLLER
// ============================================================================
class ActionMenuController {
  constructor(app) {
    this.app = app;
    this.menu = document.getElementById("action-menu");
    this.searchInput = document.getElementById("action-menu-search");
    this.list = document.getElementById("action-menu-list");
    this.spawnX = 0;
    this.spawnY = 0;
    this.selectedIndex = 0;

    this.searchInput.addEventListener(
      "input",
      debounce(() => this.render(), 100)
    );
    this.searchInput.addEventListener("keydown", (e) => this.handleKeyDown(e));

    document.addEventListener("click", (e) => {
      if (!this.menu.contains(e.target)) {
        this.hide();
      }
    });
  }

  show(x, y) {
    this.spawnX = x;
    this.spawnY = y;

    this.menu.style.display = "flex";
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;

    this.searchInput.value = "";
    this.searchInput.focus();
    this.selectedIndex = 0;
    this.render();
  }

  hide() {
    this.menu.style.display = "none";
  }

  render() {
    const filter = this.searchInput.value.toLowerCase();
    let results = [];

    if (filter) {
      results = materialNodeRegistry.search(filter);
    } else {
      // Show commonly used nodes
      const common = [
        "Constant3Vector",
        "TextureSample",
        "Multiply",
        "Add",
        "Lerp",
        "ScalarParameter",
        "VectorParameter",
      ];
      results = common
        .map((k) => ({ key: k, ...materialNodeRegistry.get(k) }))
        .filter(Boolean);
    }

    results = results.filter((r) => r.category !== "Output").slice(0, 15);

    let html = "";
    let currentCategory = "";

    results.forEach((node, idx) => {
      if (node.category !== currentCategory) {
        currentCategory = node.category;
        html += `<div class="action-menu-category">${currentCategory}</div>`;
      }

      html += `
                <div class="action-menu-item ${
                  idx === this.selectedIndex ? "selected" : ""
                }" data-node-key="${node.key}" data-index="${idx}">
                    <span class="action-menu-item-icon">${
                      node.icon || "●"
                    }</span>
                    <span>${node.title}</span>
                    ${
                      node.hotkey
                        ? `<span class="action-menu-item-hotkey">${node.hotkey.toUpperCase()}</span>`
                        : ""
                    }
                </div>
            `;
    });

    this.list.innerHTML =
      html || '<div style="padding:12px;color:#666;">No results found</div>';

    // Bind click events
    this.list.querySelectorAll(".action-menu-item").forEach((item) => {
      item.addEventListener("click", () =>
        this.spawnNode(item.dataset.nodeKey)
      );
      item.addEventListener("mouseenter", () => {
        this.selectedIndex = parseInt(item.dataset.index);
        this.updateSelection();
      });
    });
  }

  handleKeyDown(e) {
    const items = this.list.querySelectorAll(".action-menu-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
      this.updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.updateSelection();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = items[this.selectedIndex];
      if (selected) {
        this.spawnNode(selected.dataset.nodeKey);
      }
    } else if (e.key === "Escape") {
      this.hide();
    }
  }

  updateSelection() {
    this.list.querySelectorAll(".action-menu-item").forEach((item, idx) => {
      item.classList.toggle("selected", idx === this.selectedIndex);
    });
  }

  spawnNode(nodeKey) {
    const graphRect = this.app.graph.graphPanel.getBoundingClientRect();
    const x =
      (this.spawnX - graphRect.left - this.app.graph.panX) /
      this.app.graph.zoom;
    const y =
      (this.spawnY - graphRect.top - this.app.graph.panY) / this.app.graph.zoom;

    this.app.graph.addNode(nodeKey, x, y);
    this.hide();
  }
}

// ============================================================================
// VIEWPORT CONTROLLER (3D Preview)
// ============================================================================
class ViewportController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("viewport-container");
    this.canvas = document.getElementById("viewport-canvas");

    this.THREE = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mesh = null;
    this.material = null;
    this.geometries = {};
    this.initialized = false;
    this.animationId = null;
    this.isLit = true;
    this.currentGeoType = "sphere";

    // Lights
    this.ambientLight = null;
    this.directionalLight = null;

    // Initialize Three.js
    this.init();

    // Bind UI controls
    this.bindControls();
  }

  async init() {
    try {
      // Dynamic import of Three.js
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/addons/controls/OrbitControls.js"
      );

      this.THREE = THREE;

      // Scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a0a0a);

      // Grid helper
      const gridHelper = new THREE.GridHelper(10, 10, 0x333333, 0x111111);
      this.scene.add(gridHelper);

      // Camera
      const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
      this.camera.position.set(2.5, 2, 4);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
      });
      this.renderer.setSize(
        this.canvas.clientWidth || 300,
        this.canvas.clientHeight || 300
      );
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.target.set(0, 1, 0);

      // Lighting
      this.directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      this.directionalLight.position.set(3, 10, 5);
      this.scene.add(this.directionalLight);

      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(this.ambientLight);

      // Create geometries
      this.geometries = {
        sphere: new THREE.SphereGeometry(1, 64, 64),
        cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
        cylinder: new THREE.CylinderGeometry(1, 1, 2, 32),
        plane: new THREE.PlaneGeometry(3, 3),
      };

      // Create material
      this.material = new THREE.MeshPhysicalMaterial({
        color: 0x808080,
        metalness: 0,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });

      // Create initial mesh
      this.mesh = new THREE.Mesh(this.geometries.sphere, this.material);
      this.mesh.position.y = 1;
      this.scene.add(this.mesh);

      this.initialized = true;

      // Handle resize
      window.addEventListener("resize", () => this.resize());
      this.resize();

      // Start render loop
      this.startRenderLoop();

      console.log("ViewportController: Three.js initialized");
    } catch (error) {
      console.error("Failed to initialize Three.js viewport:", error);
    }
  }

  bindControls() {
    // Lit/Unlit buttons
    const litBtn = document.getElementById("viewport-lit-btn");
    const unlitBtn = document.getElementById("viewport-unlit-btn");

    litBtn?.addEventListener("click", () => {
      this.isLit = true;
      litBtn.classList.add("active");
      unlitBtn?.classList.remove("active");
      this.updateLighting();
    });

    unlitBtn?.addEventListener("click", () => {
      this.isLit = false;
      unlitBtn.classList.add("active");
      litBtn?.classList.remove("active");
      this.updateLighting();
    });

    // Mesh select
    const meshSelect = document.getElementById("viewport-mesh-select");
    meshSelect?.addEventListener("change", (e) => {
      this.setGeometry(e.target.value);
    });
  }

  updateLighting() {
    if (!this.initialized) return;

    if (this.isLit) {
      this.directionalLight.intensity = 3;
      this.ambientLight.intensity = 0.5;
    } else {
      // Unlit mode - flat lighting
      this.directionalLight.intensity = 0;
      this.ambientLight.intensity = 2;
    }
  }

  setGeometry(type) {
    if (!this.initialized || !this.geometries[type]) return;

    this.currentGeoType = type;
    this.scene.remove(this.mesh);
    this.mesh = new this.THREE.Mesh(this.geometries[type], this.material);
    this.mesh.position.y = type === "plane" ? 1.5 : 1;
    if (type === "plane") {
      this.mesh.rotation.x = -Math.PI / 2;
    } else {
      this.mesh.rotation.x = 0;
    }
    this.scene.add(this.mesh);
  }

  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  resize() {
    if (!this.initialized || !this.container) return;

    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 300;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Update material from graph evaluation result
   */
  updateMaterial(result) {
    if (!this.initialized || !result) return;

    const THREE = this.THREE;

    if (result.baseColor) {
      if (Array.isArray(result.baseColor)) {
        this.material.color.setRGB(
          result.baseColor[0],
          result.baseColor[1],
          result.baseColor[2]
        );
      } else if (typeof result.baseColor === "object") {
        this.material.color.setRGB(
          result.baseColor.r || 0,
          result.baseColor.g || 0,
          result.baseColor.b || 0
        );
      }
    } else {
      this.material.color.setRGB(0.5, 0.5, 0.5);
    }

    this.material.metalness = result.metallic ?? 0;
    this.material.roughness = result.roughness ?? 0.5;

    if (result.emissive) {
      if (Array.isArray(result.emissive)) {
        this.material.emissive.setRGB(
          result.emissive[0],
          result.emissive[1],
          result.emissive[2]
        );
      } else {
        this.material.emissive.setHex(0x000000);
      }
    } else {
      this.material.emissive.setHex(0x000000);
    }

    // Handle base color texture
    if (result.baseColorTexture) {
      this.loadTexture(result.baseColorTexture, (texture) => {
        this.material.map = texture;
        this.material.color.setRGB(1, 1, 1); // Reset color when using texture
        this.material.needsUpdate = true;
      });
    } else {
      // Clear texture if no texture connected
      if (this.material.map) {
        this.material.map = null;
      }
    }

    this.material.needsUpdate = true;
  }

  /**
   * Load a texture from URL/data URL with caching
   */
  loadTexture(url, callback) {
    if (!url || !this.initialized) return;

    // Cache textures to avoid reloading
    if (!this.textureCache) {
      this.textureCache = new Map();
    }

    if (this.textureCache.has(url)) {
      callback(this.textureCache.get(url));
      return;
    }

    const loader = new this.THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.wrapS = this.THREE.RepeatWrapping;
        texture.wrapT = this.THREE.RepeatWrapping;
        this.textureCache.set(url, texture);
        callback(texture);
      },
      undefined,
      (error) => {
        console.warn("Failed to load texture:", error);
      }
    );
  }
}

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

      // Multiply node - multiply inputs
      if (nodeKey === "Multiply") {
        const pinA = node.inputs.find(
          (p) => p.localId === "a" || p.name === "A"
        );
        const pinB = node.inputs.find(
          (p) => p.localId === "b" || p.name === "B"
        );
        const valA = evaluatePin(pinA, new Set(visited)) ?? 1;
        const valB = evaluatePin(pinB, new Set(visited)) ?? 1;
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

      const pinName = pin.name.toLowerCase();

      if (pinName.includes("base color") || pinName.includes("basecolor")) {
        // Check if value is a texture object
        if (value && typeof value === "object" && value.type === "texture") {
          result.baseColorTexture = value.url;
          result.baseColor = [1, 1, 1]; // White to show texture properly
        } else if (Array.isArray(value)) {
          result.baseColor = value.slice(0, 3);
        } else if (typeof value === "number") {
          result.baseColor = [value, value, value];
        }
      } else if (pinName.includes("metallic")) {
        result.metallic =
          typeof value === "number"
            ? value
            : Array.isArray(value)
            ? value[0]
            : 0;
      } else if (pinName.includes("roughness")) {
        result.roughness =
          typeof value === "number"
            ? value
            : Array.isArray(value)
            ? value[0]
            : 0.5;
      } else if (pinName.includes("emissive")) {
        if (Array.isArray(value)) {
          result.emissive = value.slice(0, 3);
        }
      }
    });

    // Update the viewport with the result
    if (this.viewport) {
      this.viewport.updateMaterial(result);
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
