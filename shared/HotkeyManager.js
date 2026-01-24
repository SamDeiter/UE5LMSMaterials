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

// Core hotkey-to-node mappings (matches UE5 defaults)
export const MATERIAL_HOTKEYS = {
  // Numeric keys - Constants (must be quoted strings for e.key lookup)
  1: "Constant",
  2: "Constant2Vector",
  3: "Constant3Vector",
  4: "Constant4Vector",

  // Arithmetic Core
  A: "Add",
  D: "Divide",
  E: "Power", // 'E' for Exponent
  // L: Reserved for L+drag light rotation in viewport
  M: "Multiply",
  O: "OneMinus",

  // Parameters
  S: "ScalarParameter",
  V: "VectorParameter",

  // Texture & Coordinates
  T: "TextureSample",
  U: "TextureCoordinate",
  P: "Panner",

  // Vectors & Utility
  B: "BumpOffset",
  F: "Fresnel",
  I: "Lerp", // I for Interpolate (moved from L to avoid conflict with light rotation)
  N: "Normalize",
  R: "ReflectionVector",

  // Graph Organization
  C: "Comment",
};

// Modifier key hotkeys (require Shift/Ctrl + key)
export const MODIFIER_HOTKEYS = {
  "Shift+C": "ComponentMask",
  "Shift+I": "If", // If node moved to Shift+I
  "Shift+L": "Lerp", // Alternative LERP shortcut for users who prefer L
};

// Extended hotkeys for common operations (can be remapped)
export const EXTENDED_HOTKEYS = {
  K: "Clamp", // 'K' for Klamp
  W: "WorldPosition",
  X: "CrossProduct",
  ".": "DotProduct",

  // Additional common nodes
  // Note: G is reserved for snap-to-grid toggle
  H: "Time", // H for Hour/Time
  J: "Saturate", // J for saturation clamping
  Y: "Reroute", // Y for redirecting wires
  Z: "Abs", // Z for absolute value
  Q: "SphereMask", // Q for radial masking
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
    this.heldKeys = new Set();

    // Combine all hotkey maps
    this.hotkeyMap = { ...MATERIAL_HOTKEYS, ...EXTENDED_HOTKEYS };
    this.modifierMap = { ...MODIFIER_HOTKEYS };

    this._bindEvents();
  }

  /**
   * Bind keyboard and mouse events
   */
  _bindEvents() {
    this._onKeyDownBound = this._onKeyDown.bind(this);
    this._onKeyUpBound = this._onKeyUp.bind(this);

    document.addEventListener("keydown", this._onKeyDownBound);
    document.addEventListener("keyup", this._onKeyUpBound);
  }

  /**
   * Build composite key string including modifiers
   */
  _buildKeyString(e) {
    const parts = [];
    if (e.shiftKey) parts.push("Shift");
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    parts.push(e.key.toUpperCase());
    return parts.join("+");
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
    this.heldKeys.add(key);

    // Check for modifier combinations first
    const compositeKey = this._buildKeyString(e);
    if (this.modifierMap[compositeKey]) {
      this.activeHotkey = compositeKey;
      this.activeNodeKey = this.modifierMap[compositeKey];
      e.preventDefault();
      this._showHotkeyIndicator(this.activeNodeKey, compositeKey);
      return;
    }

    // Check for simple key (without Ctrl/Alt to allow cut/paste)
    if (!e.ctrlKey && !e.altKey && this.hotkeyMap[key]) {
      this.activeHotkey = key;
      this.activeNodeKey = this.hotkeyMap[key];
      e.preventDefault();
      this._showHotkeyIndicator(this.activeNodeKey, key);
    }
  }

  /**
   * Handle key up - clear active hotkey
   */
  _onKeyUp(e) {
    const key = e.key.toUpperCase();
    this.heldKeys.delete(key);

    // Clear if main key released or if it was a modifier combo
    if (
      key === this.activeHotkey ||
      (this.activeHotkey && this.activeHotkey.includes(key))
    ) {
      this.activeHotkey = null;
      this.activeNodeKey = null;
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
    if (!this.activeNodeKey || !this.isEnabled) return false;

    // Check if node exists in registry
    const definition = this.nodeRegistry?.get?.(this.activeNodeKey);
    if (!definition) {
      console.warn(
        `Hotkey ${this.activeHotkey}: Node '${this.activeNodeKey}' not found in registry`,
      );
      return false;
    }

    // Spawn the node - use addNode if available, otherwise createNode
    if (this.graphController.addNode) {
      this.graphController.addNode(this.activeNodeKey, x, y);
    } else if (this.graphController.createNode) {
      this.graphController.createNode(this.activeNodeKey, x, y);
    }

    // Clear hotkey after spawn
    this.activeHotkey = null;
    this.activeNodeKey = null;
    this._hideHotkeyIndicator();

    return true;
  }

  /**
   * Check if a spawn hotkey is currently active
   */
  isHotkeyActive() {
    return this.activeNodeKey !== null;
  }

  /**
   * Show visual indicator of active hotkey
   */
  _showHotkeyIndicator(nodeName, shortcut) {
    let indicator = document.getElementById("hotkey-indicator");

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "hotkey-indicator";
      indicator.style.cssText = `
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #00ff88;
        padding: 10px 20px;
        border-radius: 6px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
        border: 1px solid #00ff88;
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
      `;
      document.body.appendChild(indicator);
    }

    indicator.innerHTML = `
      <div style="font-size:11px;color:#888;margin-bottom:4px;">Hold <span style="color:#00ff88;">${shortcut}</span> + Click</div>
      <div style="font-weight:600;">📦 ${nodeName}</div>
    `;
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
      this.activeNodeKey = null;
      this.heldKeys.clear();
      this._hideHotkeyIndicator();
    }
  }

  /**
   * Get all available hotkeys for help display
   */
  getHotkeyList() {
    const list = [];

    // Regular hotkeys
    Object.entries(this.hotkeyMap).forEach(([key, node]) => {
      list.push({
        key,
        node,
        description: `${key} + Click → ${node}`,
        hasModifier: false,
      });
    });

    // Modifier hotkeys
    Object.entries(this.modifierMap).forEach(([key, node]) => {
      list.push({
        key,
        node,
        description: `${key} + Click → ${node}`,
        hasModifier: true,
      });
    });

    return list;
  }

  /**
   * Cleanup
   */
  destroy() {
    document.removeEventListener("keydown", this._onKeyDownBound);
    document.removeEventListener("keyup", this._onKeyUpBound);
    this._hideHotkeyIndicator();
    this.heldKeys.clear();
  }
}
