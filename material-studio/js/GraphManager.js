/**
 * Material Studio - Graph Manager
 * Core graph engine handling nodes, connections, and evaluation.
 */

import { CONFIG, TYPE_COLORS, CATEGORY_COLORS } from "./config.js";
import { NODE_TYPES, getNodeType } from "./NodeRegistry.js";
import {
  Vec3,
  toVec,
  toScalar,
  debounce,
  generateId,
  createFragment,
} from "./utils.js";

/**
 * GraphManager - Manages the node graph
 */
export class GraphManager {
  constructor(container, svg, nodesLayer) {
    this.container = container;
    this.svg = svg;
    this.nodesLayer = nodesLayer;

    // State
    this.nodes = new Map();
    this.connections = [];
    this.nodeIdCounter = 0;
    this.selectedNodeId = null;
    this.pan = { x: 0, y: 0 };

    // Drag state
    this.dragState = null;

    // Evaluation cache (for memoization)
    this.evalCache = new Map();

    // Debounced evaluation for performance
    this.debouncedEvaluate = debounce(
      () => this.evaluateGraph(),
      CONFIG.PERFORMANCE.DEBOUNCE_MS
    );

    // Callbacks
    this.onNodeSelect = null;
    this.onGraphEvaluate = null;

    // Setup event handlers
    this.setupEvents();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NODE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new node
   */
  createNode(type, x, y) {
    const def = getNodeType(type);
    if (!def) {
      console.warn(`Unknown node type: ${type}`);
      return null;
    }

    const id = `node_${this.nodeIdCounter++}`;
    const nodeData = {
      id,
      type,
      x,
      y,
      data: def.data ? JSON.parse(JSON.stringify(def.data)) : {},
    };

    this.nodes.set(id, nodeData);
    this.renderNode(nodeData);

    // Handle result node special case
    if (type === "result") {
      this.updateResultPorts(id);
    }

    this.debouncedEvaluate();
    return nodeData;
  }

  /**
   * Render a node to the DOM
   */
  renderNode(nodeData) {
    const def = getNodeType(nodeData.type);
    const el = document.createElement("div");

    // Determine category class
    const catClass = def.category.toLowerCase().replace(/\s+/g, "-");
    el.className = `node ${catClass}`;
    el.id = nodeData.id;
    el.style.transform = `translate(${nodeData.x}px, ${nodeData.y}px)`;
    el.dataset.x = nodeData.x;
    el.dataset.y = nodeData.y;

    // Build node HTML
    const headerColor =
      CATEGORY_COLORS[def.category] || CATEGORY_COLORS["Main"];

    let inputsHtml = "";
    def.inputs.forEach((p) => {
      const typeColor = TYPE_COLORS[p.type] || TYPE_COLORS.default;
      inputsHtml += `
                <div class="port input type-${p.type}" data-port="${p.id}">
                    <div class="port-connector" style="border-color: ${typeColor}"></div>
                    <span class="port-label">${p.id}</span>
                </div>`;
    });

    let outputsHtml = "";
    def.outputs.forEach((p) => {
      const typeColor = TYPE_COLORS[p.type] || TYPE_COLORS.default;
      outputsHtml += `
                <div class="port output type-${p.type}" data-port="${p.id}">
                    <span class="port-label">${p.id}</span>
                    <div class="port-connector" style="border-color: ${typeColor}"></div>
                </div>`;
    });

    // Custom UI
    let customUI = "";
    if (def.renderUI) {
      customUI = def.renderUI(nodeData.data, nodeData.id);
    }

    el.innerHTML = `
            <div class="node-header" style="background-color: ${headerColor}">
                ${def.title}
            </div>
            <div class="node-body">
                ${customUI}
                <div class="node-inputs">${inputsHtml}</div>
                <div class="node-outputs">${outputsHtml}</div>
            </div>
        `;

    this.nodesLayer.appendChild(el);
    nodeData.element = el;

    // Stop propagation on inputs to prevent node dragging
    el.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("mousedown", (e) => e.stopPropagation());
    });
  }

  /**
   * Delete a node
   */
  deleteNode(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return;

    // Don't delete result node
    if (nodeData.type === "result") return;

    // Remove connections
    this.connections = this.connections.filter(
      (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
    );

    // Remove element
    if (nodeData.element) {
      nodeData.element.remove();
    }

    // Remove from map
    this.nodes.delete(nodeId);

    // Clear selection
    if (this.selectedNodeId === nodeId) {
      this.selectedNodeId = null;
      if (this.onNodeSelect) this.onNodeSelect(null);
    }

    this.updateConnections();
    this.debouncedEvaluate();
  }

  /**
   * Update node data
   */
  updateNodeData(nodeId, key, value) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData) return;

    nodeData.data[key] = value;

    // Update value display if exists
    const valDisplay = document.getElementById(`val_${nodeId}`);
    if (valDisplay && typeof value === "number") {
      valDisplay.textContent = value.toFixed(2);
    }

    // Special handling for result node mode changes
    if (
      nodeData.type === "result" &&
      (key === "mode" || key === "useAttributes")
    ) {
      this.updateResultPorts(nodeId);
    }

    this.debouncedEvaluate();
  }

  /**
   * Handle texture file upload
   */
  handleTextureUpload(nodeId, file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Store image for preview renderer
        this.updateNodeData(nodeId, "type", "custom");
        this.updateNodeData(nodeId, "customImage", img);

        // Update select
        const sel = document.querySelector(`#${nodeId} select`);
        if (sel) sel.value = "custom";
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Update result node port visibility based on mode
   */
  updateResultPorts(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || nodeData.type !== "result") return;

    const mode = nodeData.data.mode;
    const useAttr = nodeData.data.useAttributes;
    const inputs = nodeData.element.querySelectorAll(".port.input");

    const legacy = [
      "BaseColor",
      "Metallic",
      "Specular",
      "Roughness",
      "Emissive",
      "Normal",
    ];
    const substrate = ["FrontMaterial"];
    const attrInput = ["MaterialAttributes"];

    inputs.forEach((p) => {
      const portName = p.dataset.port;
      let show = false;

      if (mode === "substrate") {
        if (substrate.includes(portName)) show = true;
      } else {
        if (useAttr) {
          if (attrInput.includes(portName)) show = true;
        } else {
          if (legacy.includes(portName)) show = true;
        }
      }

      p.classList.toggle("hidden", !show);
    });

    this.updateConnections();
    this.debouncedEvaluate();
  }

  /**
   * Select a node
   */
  selectNode(nodeId) {
    // Deselect previous
    if (this.selectedNodeId) {
      const prev = document.getElementById(this.selectedNodeId);
      if (prev) prev.classList.remove("selected");
    }

    this.selectedNodeId = nodeId;

    // Select new
    if (nodeId) {
      const el = document.getElementById(nodeId);
      if (el) el.classList.add("selected");
    }

    if (this.onNodeSelect) {
      this.onNodeSelect(nodeId ? this.nodes.get(nodeId) : null);
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectNode(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a connection between two ports
   */
  addConnection(fromNodeId, fromPort, toNodeId, toPort) {
    // Remove existing connection to this input
    this.connections = this.connections.filter(
      (c) => !(c.toNodeId === toNodeId && c.toPort === toPort)
    );

    // Add new connection
    this.connections.push({
      id: generateId("conn"),
      fromNodeId,
      fromPort,
      toNodeId,
      toPort,
    });

    this.updateConnections();
    this.debouncedEvaluate();
  }

  /**
   * Update visual connections (wires)
   */
  updateConnections() {
    // Clear existing wires
    this.svg.innerHTML = "";

    this.connections.forEach((conn) => {
      const fromNode = this.nodes.get(conn.fromNodeId);
      const toNode = this.nodes.get(conn.toNodeId);

      if (!fromNode || !toNode) return;

      const fromEl = fromNode.element?.querySelector(
        `.port[data-port="${conn.fromPort}"] .port-connector`
      );
      const toEl = toNode.element?.querySelector(
        `.port[data-port="${conn.toPort}"] .port-connector`
      );

      if (
        !fromEl ||
        !toEl ||
        fromEl.offsetParent === null ||
        toEl.offsetParent === null
      )
        return;

      // Get positions
      const r1 = fromEl.getBoundingClientRect();
      const r2 = toEl.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      const startX = r1.left + r1.width / 2 - containerRect.left;
      const startY = r1.top + r1.height / 2 - containerRect.top;
      const endX = r2.left + r2.width / 2 - containerRect.left;
      const endY = r2.top + r2.height / 2 - containerRect.top;

      // Create wire
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.classList.add("wire");

      // Get wire color from output type
      const def = getNodeType(fromNode.type);
      if (def) {
        const outputDef = def.outputs.find((o) => o.id === conn.fromPort);
        const type = outputDef ? outputDef.type : "float";
        path.style.stroke = TYPE_COLORS[type] || TYPE_COLORS.default;
      }

      // Draw bezier curve
      const dist = Math.abs(endX - startX) * 0.5;
      path.setAttribute(
        "d",
        `M ${startX} ${startY} C ${startX + dist} ${startY}, ${
          endX - dist
        } ${endY}, ${endX} ${endY}`
      );

      this.svg.appendChild(path);
    });
  }

  /**
   * Create temporary wire during drag
   */
  createTempWire() {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("wire", "temp-wire");
    path.style.opacity = "0.5";
    this.svg.appendChild(path);
    return path;
  }

  /**
   * Draw bezier curve on a path element
   */
  drawCurve(pathEl, x1, y1, x2, y2) {
    const dist = Math.abs(x2 - x1) * 0.5;
    pathEl.setAttribute(
      "d",
      `M ${x1} ${y1} C ${x1 + dist} ${y1}, ${x2 - dist} ${y2}, ${x2} ${y2}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GRAPH EVALUATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Evaluate the entire graph
   */
  evaluateGraph() {
    // Clear cache
    this.evalCache.clear();

    const resultNode = Array.from(this.nodes.values()).find(
      (n) => n.type === "result"
    );
    if (!resultNode) return null;

    const mode = resultNode.data.mode;
    const useAttr = resultNode.data.useAttributes;

    let result = null;

    if (mode === "substrate") {
      const frontMaterial = this.resolveInput(resultNode.id, "FrontMaterial");
      if (frontMaterial && frontMaterial.isSubstrate) {
        result = {
          mode: "substrate",
          diffuse: frontMaterial.diffuse,
          f0: frontMaterial.f0,
          roughness: frontMaterial.roughness,
          anisotropy: frontMaterial.anisotropy,
          emissive: frontMaterial.emissive,
        };
      }
    } else {
      if (useAttr) {
        const attrs = this.resolveInput(resultNode.id, "MaterialAttributes");
        if (attrs && attrs.isAttributes) {
          result = {
            mode: "legacy",
            baseColor: attrs.baseColor,
            metallic: attrs.metallic,
            roughness: attrs.roughness,
            specular: attrs.specular,
            emissive: attrs.emissive,
          };
        }
      } else {
        result = {
          mode: "legacy",
          baseColor: this.resolveInput(resultNode.id, "BaseColor"),
          metallic: toScalar(this.resolveInput(resultNode.id, "Metallic")),
          roughness: toScalar(
            this.resolveInput(resultNode.id, "Roughness") ?? 0.5
          ),
          specular: toScalar(
            this.resolveInput(resultNode.id, "Specular") ?? 0.5
          ),
          emissive: this.resolveInput(resultNode.id, "Emissive"),
        };
      }
    }

    // Find texture connections
    result = result || {};
    result.texture = this.findTextureForResult(resultNode.id);

    if (this.onGraphEvaluate) {
      this.onGraphEvaluate(result);
    }

    return result;
  }

  /**
   * Resolve input value by traversing connections
   */
  resolveInput(nodeId, portId, visited = new Set()) {
    // Check cache
    const cacheKey = `${nodeId}:${portId}`;
    if (this.evalCache.has(cacheKey)) {
      return this.evalCache.get(cacheKey);
    }

    // Prevent cycles
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    // Find connection to this port
    const conn = this.connections.find(
      (c) => c.toNodeId === nodeId && c.toPort === portId
    );
    if (!conn) return null;

    // Get source node
    const sourceNode = this.nodes.get(conn.fromNodeId);
    if (!sourceNode) return null;

    const def = getNodeType(sourceNode.type);
    if (!def) return null;

    // Resolve all inputs for source node
    const inputs = [];
    if (def.inputs) {
      for (const inputDef of def.inputs) {
        inputs.push(
          this.resolveInput(sourceNode.id, inputDef.id, new Set(visited))
        );
      }
    }

    // Evaluate node function
    let result = null;
    if (def.func) {
      result = def.func(inputs, sourceNode.data);
    }

    // Handle break_attributes output mapping
    if (
      sourceNode.type === "break_attributes" &&
      result &&
      result.isAttributes
    ) {
      const outputMap = {
        BaseColor: result.baseColor,
        Metallic: result.metallic,
        Specular: result.specular,
        Roughness: result.roughness,
        Emissive: result.emissive,
        Normal: result.normal,
      };
      if (outputMap[conn.fromPort] !== undefined) {
        result = outputMap[conn.fromPort];
      }
    }

    // Handle data type nodes without functions
    if (result === null) {
      if (sourceNode.type === "float3") result = toVec(sourceNode.data.value);
      if (sourceNode.type === "float") result = sourceNode.data.value;
      if (sourceNode.type === "float2")
        result = { x: sourceNode.data.x, y: sourceNode.data.y };
      if (sourceNode.type === "float4") result = sourceNode.data;
      if (sourceNode.type === "static_bool") result = sourceNode.data.value;
    }

    // Cache result
    this.evalCache.set(cacheKey, result);

    return result;
  }

  /**
   * Find texture node connected to result
   */
  findTextureForResult(resultNodeId) {
    const resultNode = this.nodes.get(resultNodeId);
    if (!resultNode) return null;

    const mode = resultNode.data.mode;
    const portToCheck = mode === "substrate" ? "FrontMaterial" : "BaseColor";

    // Check if there's a texture in the chain
    const checkForTexture = (nodeId, portId, visited = new Set()) => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);

      const conn = this.connections.find(
        (c) => c.toNodeId === nodeId && c.toPort === portId
      );
      if (!conn) return null;

      const sourceNode = this.nodes.get(conn.fromNodeId);
      if (!sourceNode) return null;

      if (sourceNode.type === "texture") {
        return sourceNode.data;
      }

      // Check inputs of source node
      const def = getNodeType(sourceNode.type);
      if (def && def.inputs) {
        for (const input of def.inputs) {
          const tex = checkForTexture(
            sourceNode.id,
            input.id,
            new Set(visited)
          );
          if (tex) return tex;
        }
      }

      return null;
    };

    if (mode === "substrate") {
      const slabConn = this.connections.find(
        (c) => c.toNodeId === resultNodeId && c.toPort === "FrontMaterial"
      );
      if (slabConn) {
        return checkForTexture(slabConn.fromNodeId, "DiffuseAlbedo");
      }
    } else {
      return checkForTexture(resultNodeId, "BaseColor");
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  setupEvents() {
    // Use event delegation for performance
    this.container.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    window.addEventListener("mousemove", this.handleMouseMove.bind(this));
    window.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // Input changes via delegation
    this.nodesLayer.addEventListener(
      "input",
      this.handleInputChange.bind(this)
    );
    this.nodesLayer.addEventListener(
      "change",
      this.handleInputChange.bind(this)
    );
  }

  handleMouseDown(e) {
    const containerRect = this.container.getBoundingClientRect();

    // Port connector click - start wiring
    if (e.target.classList.contains("port-connector")) {
      const port = e.target.closest(".port");
      const node = e.target.closest(".node");
      if (port?.classList.contains("output")) {
        this.dragState = {
          type: "wire",
          fromNode: node.id,
          fromPort: port.dataset.port,
          startX: e.clientX,
          startY: e.clientY,
          line: this.createTempWire(),
        };
      }
      return;
    }

    // Node header click - start dragging
    const nodeEl = e.target.closest(".node");
    if (nodeEl && e.target.closest(".node-header")) {
      this.dragState = {
        type: "node",
        el: nodeEl,
        startX: e.clientX,
        startY: e.clientY,
        initialX: parseFloat(nodeEl.dataset.x),
        initialY: parseFloat(nodeEl.dataset.y),
      };
      this.selectNode(nodeEl.id);
      return;
    }

    // Background click - start panning
    if (e.target === this.container || e.target === this.svg) {
      this.dragState = {
        type: "pan",
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: this.pan.x,
        initialPanY: this.pan.y,
      };
      this.container.style.cursor = "grabbing";
    }
  }

  handleMouseMove(e) {
    if (!this.dragState) return;

    if (this.dragState.type === "node") {
      const newX =
        this.dragState.initialX + (e.clientX - this.dragState.startX);
      const newY =
        this.dragState.initialY + (e.clientY - this.dragState.startY);
      this.dragState.el.style.transform = `translate(${newX}px, ${newY}px)`;
      this.dragState.el.dataset.x = newX;
      this.dragState.el.dataset.y = newY;

      // Update node data
      const nodeData = this.nodes.get(this.dragState.el.id);
      if (nodeData) {
        nodeData.x = newX;
        nodeData.y = newY;
      }

      this.updateConnections();
    } else if (this.dragState.type === "wire") {
      const startEl = document.querySelector(
        `#${this.dragState.fromNode} .port[data-port="${this.dragState.fromPort}"] .port-connector`
      );
      if (startEl) {
        const rect = startEl.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - containerRect.left;
        const centerY = rect.top + rect.height / 2 - containerRect.top;
        this.drawCurve(
          this.dragState.line,
          centerX,
          centerY,
          e.clientX - containerRect.left,
          e.clientY - containerRect.top
        );
      }
    } else if (this.dragState.type === "pan") {
      this.pan.x =
        this.dragState.initialPanX + (e.clientX - this.dragState.startX);
      this.pan.y =
        this.dragState.initialPanY + (e.clientY - this.dragState.startY);
      this.nodesLayer.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px)`;
      this.container.style.backgroundPosition = `${this.pan.x}px ${this.pan.y}px`;
      this.updateConnections();
    }
  }

  handleMouseUp(e) {
    if (!this.dragState) return;

    if (this.dragState.type === "wire") {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target?.classList.contains("port-connector")) {
        const port = target.closest(".port");
        const node = target.closest(".node");
        if (port?.classList.contains("input")) {
          this.addConnection(
            this.dragState.fromNode,
            this.dragState.fromPort,
            node.id,
            port.dataset.port
          );
        }
      }
      this.dragState.line.remove();
    }

    if (this.dragState.type === "pan") {
      this.container.style.cursor = "grab";
    }

    this.dragState = null;
  }

  handleInputChange(e) {
    const nodeId = e.target.dataset.node;
    const key = e.target.dataset.key;
    if (!nodeId || !key) return;

    let value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    } else if (e.target.type === "number" || e.target.type === "range") {
      value = parseFloat(e.target.value);
    } else if (e.target.type === "file") {
      this.handleTextureUpload(nodeId, e.target.files[0]);
      return;
    } else {
      value = e.target.value;
    }

    this.updateNodeData(nodeId, key, value);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Export graph to JSON
   */
  toJSON() {
    return {
      nodes: Array.from(this.nodes.values()).map((n) => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        data: n.data,
      })),
      connections: this.connections.map((c) => ({
        fromNodeId: c.fromNodeId,
        fromPort: c.fromPort,
        toNodeId: c.toNodeId,
        toPort: c.toPort,
      })),
    };
  }

  /**
   * Import graph from JSON
   */
  fromJSON(json) {
    // Clear existing
    this.nodes.clear();
    this.connections = [];
    this.nodesLayer.innerHTML = "";
    this.nodeIdCounter = 0;

    // Create nodes
    if (json.nodes) {
      for (const n of json.nodes) {
        const def = getNodeType(n.type);
        if (!def) continue;

        const nodeData = {
          id: n.id,
          type: n.type,
          x: n.x,
          y: n.y,
          data:
            n.data || (def.data ? JSON.parse(JSON.stringify(def.data)) : {}),
        };

        this.nodes.set(n.id, nodeData);
        this.renderNode(nodeData);

        // Update counter
        const num = parseInt(n.id.split("_")[1], 10);
        if (!isNaN(num) && num >= this.nodeIdCounter) {
          this.nodeIdCounter = num + 1;
        }
      }
    }

    // Create connections
    if (json.connections) {
      this.connections = json.connections.map((c) => ({
        id: generateId("conn"),
        ...c,
      }));
    }

    this.updateConnections();
    this.debouncedEvaluate();
  }
}

export default GraphManager;
