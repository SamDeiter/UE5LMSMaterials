/**
 * MaterialPin.js
 * 
 * Manages individual connection points on nodes.
 */

import { PinTypes, TypeCompatibility } from "./NodeRegistry.js";

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
   * Supports UE5-style scalar broadcasting (float -> float3)
   */
  canConnectTo(otherPin) {
    // Must be opposite directions
    if (this.dir === otherPin.dir) return false;

    // Determine which is output and which is input
    const outputPin = this.dir === "out" ? this : otherPin;
    const inputPin = this.dir === "in" ? this : otherPin;

    const sourceType = outputPin.type.toLowerCase();
    const targetType = inputPin.type.toLowerCase();

    // Same type always connects
    if (sourceType === targetType) return true;

    // Check if target accepts source (e.g., float3 input accepts float output)
    const allowedByTarget = TypeCompatibility[targetType];
    if (allowedByTarget && allowedByTarget.includes(sourceType)) {
      return true;
    }

    // Check reverse - if source can be accepted by target type
    // This handles cases where input types are flexible
    const allowedBySource = TypeCompatibility[sourceType];
    if (allowedBySource && allowedBySource.includes(targetType)) {
      return true;
    }

    return false;
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
    el.dataset.type = this.type;
    
    // Add channel attribute for RGBA color coding
    const pinIdLower = this.localId.toLowerCase();
    if (pinIdLower === 'r' || pinIdLower === 'red') {
      el.dataset.channel = 'r';
    } else if (pinIdLower === 'g' || pinIdLower === 'green') {
      el.dataset.channel = 'g';
    } else if (pinIdLower === 'b' || pinIdLower === 'blue') {
      el.dataset.channel = 'b';
    } else if (pinIdLower === 'a' || pinIdLower === 'alpha') {
      el.dataset.channel = 'a';
    } else if (pinIdLower === 'rgb') {
      el.dataset.channel = 'rgb';
    } else if (pinIdLower === 'rgba' || pinIdLower === 'out' && this.type === 'float4') {
      el.dataset.channel = 'rgba';
    }

    // Pin connector dot
    const dot = document.createElement("div");
    dot.className = "pin-dot";
    dot.style.color = this.color;
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
