/**
 * HotkeyManager.js
 *
 * UE5 MATERIAL EDITOR HOTKEY SYSTEM
 * =================================
 * Implements the "Key + Click" pattern for rapid node spawning.
 * When a hotkey is held and the user clicks on the graph,
 * the corresponding node is spawned at the cursor position.
 *
 * Based on UE5 Material Editor Interface Specification.
 */

// Hotkey-to-node mappings (matches UE5 defaults)
export const MATERIAL_HOTKEYS = {
  1: "Constant",
  2: "Constant2Vector",
  3: "Constant3Vector",
  4: "Constant4Vector",
  T: "TextureSample",
  M: "Multiply",
  A: "Add",
  L: "Lerp",
  S: "ScalarParameter",
  V: "VectorParameter",
  U: "TextureCoordinate",
  O: "OneMinus",
  N: "Normalize",
  F: "Fresnel",
  C: "Comment",
  P: "Panner",
  E: "Power", // 'E' for Exponent
};

// Extended hotkeys for common operations
export const EXTENDED_HOTKEYS = {
  D: "Divide",
  R: "Rotator",
  I: "If",
  B: "BreakOutFloat3Components",
  K: "Clamp", // 'K' for Klamp
  W: "WorldPosition",
  X: "CrossProduct",
  ".": "DotProduct",
};

/**
 * HotkeyManager class - tracks key states and spawns nodes
 */
export class HotkeyManager {
  constructor(graphController, nodeRegistry) {
    this.graphController = graphController;
    this.nodeRegistry = nodeRegistry;
    this.activeHotkey = null;
    this.isEnabled = true;

    // Combine hotkey maps
    this.hotkeyMap = { ...MATERIAL_HOTKEYS, ...EXTENDED_HOTKEYS };

    this._bindEvents();
  }

  /**
   * Bind keyboard and mouse events
   */
  _bindEvents() {
    document.addEventListener("keydown", this._onKeyDown.bind(this));
    document.addEventListener("keyup", this._onKeyUp.bind(this));
  }

  /**
   * Handle key down - track active hotkey
   */
  _onKeyDown(e) {
    if (!this.isEnabled) return;

    // Ignore if typing in an input
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    const key = e.key.toUpperCase();

    if (this.hotkeyMap[key]) {
      this.activeHotkey = key;
      e.preventDefault();

      // Visual feedback - show tooltip with node name
      this._showHotkeyIndicator(this.hotkeyMap[key]);
    }
  }

  /**
   * Handle key up - clear active hotkey
   */
  _onKeyUp(e) {
    const key = e.key.toUpperCase();

    if (key === this.activeHotkey) {
      this.activeHotkey = null;
      this._hideHotkeyIndicator();
    }
  }

  /**
   * Called by graph when click occurs - spawns node if hotkey active
   * @param {number} x - Graph X coordinate
   * @param {number} y - Graph Y coordinate
   * @returns {boolean} True if node was spawned
   */
  handleGraphClick(x, y) {
    if (!this.activeHotkey || !this.isEnabled) return false;

    const nodeKey = this.hotkeyMap[this.activeHotkey];
    if (!nodeKey) return false;

    // Check if node exists in registry
    const definition = this.nodeRegistry.get(nodeKey);
    if (!definition) {
      console.warn(
        `Hotkey ${this.activeHotkey}: Node '${nodeKey}' not found in registry`
      );
      return false;
    }

    // Spawn the node
    this.graphController.createNode(nodeKey, x, y);

    // Clear hotkey after spawn
    this.activeHotkey = null;
    this._hideHotkeyIndicator();

    return true;
  }

  /**
   * Show visual indicator of active hotkey
   */
  _showHotkeyIndicator(nodeName) {
    let indicator = document.getElementById("hotkey-indicator");

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "hotkey-indicator";
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #00ff88;
        padding: 8px 16px;
        border-radius: 4px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
        border: 1px solid #00ff88;
      `;
      document.body.appendChild(indicator);
    }

    indicator.textContent = `Click to spawn: ${nodeName}`;
    indicator.style.display = "block";
  }

  /**
   * Hide the hotkey indicator
   */
  _hideHotkeyIndicator() {
    const indicator = document.getElementById("hotkey-indicator");
    if (indicator) {
      indicator.style.display = "none";
    }
  }

  /**
   * Enable/disable hotkey system
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.activeHotkey = null;
      this._hideHotkeyIndicator();
    }
  }

  /**
   * Get all available hotkeys for help display
   */
  getHotkeyList() {
    return Object.entries(this.hotkeyMap).map(([key, node]) => ({
      key,
      node,
      description: `${key} + Click → ${node}`,
    }));
  }

  /**
   * Cleanup
   */
  destroy() {
    document.removeEventListener("keydown", this._onKeyDown.bind(this));
    document.removeEventListener("keyup", this._onKeyUp.bind(this));
    this._hideHotkeyIndicator();
  }
}
