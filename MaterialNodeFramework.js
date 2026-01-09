/**
 * MaterialNodeFramework.js
 *
 * MODULAR NODE FRAMEWORK
 * ======================
 * This architecture mirrors UE5's approach where shader code snippets are
 * injected into a base node framework. Each node type only needs to define:
 *   1. Its metadata (title, category, icon)
 *   2. Its pins (inputs/outputs with types)
 *   3. Its shader code snippet (HLSL-like pseudocode)
 *
 * The framework handles all common functionality:
 *   - Node rendering (DOM creation, styling)
 *   - Pin rendering and type color-coding
 *   - Wire connection validation
 *   - Shader compilation/concatenation
 */

// ============================================================================
// PIN TYPE DEFINITIONS
// ============================================================================
export const PinTypes = {
  FLOAT: { name: "float", components: 1, color: "#9E9E9E" }, // Grey
  FLOAT2: { name: "float2", components: 2, color: "#4CAF50" }, // Green (UVs)
  FLOAT3: { name: "float3", components: 3, color: "#FFC107" }, // Yellow (RGB/Position)
  FLOAT4: { name: "float4", components: 4, color: "#E91E63" }, // Pink (RGBA)
  TEXTURE: { name: "texture", components: 0, color: "#2196F3" }, // Blue
  BOOL: { name: "bool", components: 1, color: "#F44336" }, // Red
};

// Type compatibility matrix - which types can connect to which
export const TypeCompatibility = {
  // Target type: [allowed source types]
  float: ["float"],
  float2: ["float2", "float"], // float broadcasts to float2
  float3: ["float3", "float"], // float broadcasts to float3
  float4: ["float4", "float3", "float"],
  texture: ["texture"],
  bool: ["bool"],
};

// ============================================================================
// BASE MATERIAL NODE CLASS
// ============================================================================
export class MaterialNode {
  constructor(id, definition, x, y, app) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.app = app;

    // Copy definition properties
    this.nodeKey = definition.key;
    this.title = definition.title;
    this.type = definition.type || "material-expression";
    this.category = definition.category || "Uncategorized";
    this.icon = definition.icon || "";
    this.headerColor = definition.headerColor || null;
    this.shaderCode = definition.shaderCode || "";

    // Initialize pins from definition
    this.inputs = [];
    this.outputs = [];
    this.initPins(definition.pins || []);

    // Copy default properties
    this.properties = { ...(definition.properties || {}) };

    // UI state
    this.element = null;
    this.selected = false;
    this.showPreview = definition.showPreview !== false;
  }

  /**
   * Initialize pins from definition array
   */
  initPins(pinDefs) {
    pinDefs.forEach((pinDef) => {
      const pin = new MaterialPin(this, pinDef);
      if (pinDef.dir === "in") {
        this.inputs.push(pin);
      } else {
        this.outputs.push(pin);
      }
    });
  }

  /**
   * Get the shader code for this node, with variable substitution
   */
  getShaderSnippet() {
    let code = this.shaderCode;

    // Substitute property values into shader code
    // e.g., "float result = {A} * {B};" becomes "float result = input_a * input_b;"
    Object.keys(this.properties).forEach((key) => {
      code = code.replace(
        new RegExp(`\\{${key}\\}`, "g"),
        this.properties[key]
      );
    });

    // Substitute pin references
    this.inputs.forEach((pin) => {
      const inputVar = pin.isConnected()
        ? pin.getConnectedOutputVar()
        : pin.getDefaultValue();
      code = code.replace(new RegExp(`\\{${pin.name}\\}`, "g"), inputVar);
    });

    return code;
  }

  /**
   * Render the node to a DOM element
   */
  render() {
    const el = document.createElement("div");
    el.className = `node ${this.type}`;
    el.id = `node-${this.id}`;
    el.dataset.nodeId = this.id;
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;

    // Header
    const header = document.createElement("div");
    header.className = "node-header";
    if (this.headerColor) {
      header.style.background = this.headerColor;
    }

    if (this.icon) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "node-icon";
      iconSpan.textContent = this.icon;
      header.appendChild(iconSpan);
    }

    const titleSpan = document.createElement("span");
    titleSpan.className = "node-title";
    titleSpan.textContent = this.title;
    header.appendChild(titleSpan);

    el.appendChild(header);

    // Content area with pins
    const content = document.createElement("div");
    content.className = "node-content";

    // Render input pins on the left
    const inputsDiv = document.createElement("div");
    inputsDiv.className = "node-inputs";
    this.inputs.forEach((pin) => {
      inputsDiv.appendChild(pin.render());
    });
    content.appendChild(inputsDiv);

    // Preview thumbnail (if applicable)
    if (
      this.showPreview &&
      (this.type === "material-expression" || this.properties.showColorPreview)
    ) {
      const preview = document.createElement("div");
      preview.className = "node-preview";
      preview.id = `preview-${this.id}`;
      this.updatePreview(preview);
      content.appendChild(preview);
    }

    // Render output pins on the right
    const outputsDiv = document.createElement("div");
    outputsDiv.className = "node-outputs";
    this.outputs.forEach((pin) => {
      outputsDiv.appendChild(pin.render());
    });
    content.appendChild(outputsDiv);

    el.appendChild(content);

    this.element = el;
    return el;
  }

  /**
   * Update the preview thumbnail (override in subclasses)
   */
  updatePreview(previewEl) {
    // Default: show a gradient based on properties
    if (this.properties.R !== undefined) {
      const r = Math.round((this.properties.R || 0) * 255);
      const g = Math.round((this.properties.G || 0) * 255);
      const b = Math.round((this.properties.B || 0) * 255);
      previewEl.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
  }

  /**
   * Find a pin by ID
   */
  findPin(pinId) {
    return [...this.inputs, ...this.outputs].find((p) => p.id === pinId);
  }

  /**
   * Serialize node state for persistence
   */
  serialize() {
    return {
      id: this.id,
      nodeKey: this.nodeKey,
      x: this.x,
      y: this.y,
      properties: { ...this.properties },
    };
  }
}

// ============================================================================
// MATERIAL PIN CLASS
// ============================================================================
export class MaterialPin {
  constructor(node, definition) {
    this.node = node;
    this.id = `${node.id}-${definition.id}`;
    this.localId = definition.id;
    this.name = definition.name;
    this.type = definition.type;
    this.dir = definition.dir;
    this.color =
      definition.color ||
      PinTypes[definition.type.toUpperCase()]?.color ||
      "#9E9E9E";
    this.defaultValue = definition.defaultValue;
    this.conditionalOn = definition.conditionalOn || null;

    // Connection state (managed by WiringController)
    this.connectedTo = null;
    this.element = null;
  }

  /**
   * Check if this pin type is compatible with another pin type
   */
  canConnectTo(otherPin) {
    // Must be opposite directions
    if (this.dir === otherPin.dir) return false;

    // Check type compatibility
    const sourceType = this.dir === "out" ? this.type : otherPin.type;
    const targetType = this.dir === "in" ? this.type : otherPin.type;

    const allowed = TypeCompatibility[targetType];
    return allowed && allowed.includes(sourceType);
  }

  /**
   * Check if this pin is currently connected
   */
  isConnected() {
    return this.connectedTo !== null;
  }

  /**
   * Get the variable name from connected output (for shader generation)
   */
  getConnectedOutputVar() {
    if (!this.connectedTo) return this.getDefaultValue();
    return `var_${this.connectedTo.replace(/-/g, "_")}`;
  }

  /**
   * Get default value as shader code
   */
  getDefaultValue() {
    if (this.defaultValue !== undefined) {
      if (typeof this.defaultValue === "object") {
        // Vector default
        return `float3(${this.defaultValue.R}, ${this.defaultValue.G}, ${this.defaultValue.B})`;
      }
      return String(this.defaultValue);
    }

    // Type-based defaults
    switch (this.type) {
      case "float":
        return "0.0";
      case "float2":
        return "float2(0.0, 0.0)";
      case "float3":
        return "float3(0.0, 0.0, 0.0)";
      case "float4":
        return "float4(0.0, 0.0, 0.0, 1.0)";
      case "bool":
        return "false";
      default:
        return "0";
    }
  }

  /**
   * Render the pin to a DOM element
   */
  render() {
    const el = document.createElement("div");
    el.className = `pin pin-${this.dir}`;
    el.dataset.pinId = this.id;

    // Pin connector dot
    const dot = document.createElement("div");
    dot.className = "pin-dot";
    dot.style.backgroundColor = this.color;
    dot.style.borderColor = this.color;
    if (!this.isConnected()) {
      dot.classList.add("hollow");
    }

    // Pin label
    const label = document.createElement("span");
    label.className = "pin-label";
    label.textContent = this.name;

    if (this.dir === "in") {
      el.appendChild(dot);
      el.appendChild(label);
    } else {
      el.appendChild(label);
      el.appendChild(dot);
    }

    this.element = el;
    return el;
  }
}

// ============================================================================
// NODE REGISTRY - Manages all node definitions
// ============================================================================
export class MaterialNodeRegistry {
  constructor() {
    this.definitions = new Map();
    this.categories = new Map();
  }

  /**
   * Register a node definition
   */
  register(key, definition) {
    definition.key = key;
    this.definitions.set(key, definition);

    // Track categories
    const category = definition.category || "Uncategorized";
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(key);
  }

  /**
   * Register multiple definitions at once
   */
  registerBatch(definitions) {
    Object.entries(definitions).forEach(([key, def]) => {
      this.register(key, def);
    });
  }

  /**
   * Get a definition by key
   */
  get(key) {
    return this.definitions.get(key);
  }

  /**
   * Create a node instance from a definition
   */
  createNode(key, id, x, y, app) {
    const definition = this.get(key);
    if (!definition) {
      console.error(`Unknown node type: ${key}`);
      return null;
    }
    return new MaterialNode(id, definition, x, y, app);
  }

  /**
   * Get all nodes in a category
   */
  getByCategory(category) {
    const keys = this.categories.get(category) || [];
    return keys.map((k) => ({ key: k, ...this.definitions.get(k) }));
  }

  /**
   * Get all categories
   */
  getAllCategories() {
    return Array.from(this.categories.keys()).sort();
  }

  /**
   * Search nodes by title
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];
    this.definitions.forEach((def, key) => {
      if (
        def.title.toLowerCase().includes(lowerQuery) ||
        key.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ key, ...def });
      }
    });
    return results;
  }
}

// Create singleton instance
export const materialNodeRegistry = new MaterialNodeRegistry();
