/**
 * Utility class for helper functions and constants.
 * Contains the NodeLibrary definition and styling helpers.
 */
class Utils {
  /**
   * Generates a unique ID string.
   * @param {string} [prefix='id'] - A prefix for the ID.
   * @returns {string} A unique ID.
   */
  static uniqueId(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Maps a logical type (e.g., 'float') to its CSS class name (e.g., 'float-pin').
   * @param {string} type - The logical pin type.
   * @returns {string} The corresponding CSS class.
   */
  static getPinTypeClass(type) {
    const typeMap = {
      exec: "exec-pin",
      bool: "bool-pin",
      byte: "byte-pin",
      int: "int-pin",
      int64: "int64-pin",
      float: "float-pin",
      name: "name-pin",
      string: "string-pin",
      text: "text-pin",
      vector: "vector-pin",
      rotator: "rotator-pin",
      transform: "transform-pin",
      object: "object-pin",
    };
    return typeMap[type.toLowerCase()] || "default-pin";
  }

  /**
   * Gets the CSS variable color for a given pin type.
   * @param {string} type - The logical pin type.
   * @returns {string} The CSS color variable string.
   */
  static getPinColor(type) {
    const colorMap = {
      exec: "var(--color-exec)",
      bool: "var(--color-bool)",
      byte: "var(--color-byte)",
      int: "var(--color-int)",
      int64: "var(--color-int64)",
      float: "var(--color-float)",
      name: "var(--color-name)",
      string: "var(--color-string)",
      text: "var(--color-text)",
      vector: "var(--color-vector)",
      rotator: "var(--color-rotator)",
      transform: "var(--color-transform)",
      object: "var(--color-object)",
    };
    return colorMap[type.toLowerCase()] || "#888888";
  }

  /**
   * Gets the UE5 style header gradient for a specific variable type.
   * @param {string} type - The variable type (e.g., 'bool', 'int').
   * @returns {{start: string, end: string}} The gradient start and end colors.
   */
  static getVariableHeaderColor(type) {
    const colors = {
      bool: { start: "#8F0000", end: "#450000" },
      byte: { start: "#00525E", end: "#002B30" },
      int: { start: "#1E855E", end: "#0F422F" },
      int64: { start: "#668044", end: "#334022" },
      float: { start: "#6AA826", end: "#355413" },
      name: { start: "#8F5E99", end: "#472F4C" },
      string: { start: "#BF00BF", end: "#600060" },
      text: { start: "#BF7885", end: "#603C42" },
      vector: { start: "#BF9800", end: "#604C00" },
      rotator: { start: "#5E7AA8", end: "#2F3D54" },
      transform: { start: "#BF6600", end: "#603300" },
      object: { start: "#005580", end: "#002A40" },
    };
    return colors[type.toLowerCase()] || { start: "#303030", end: "#151515" };
  }

  /**
   * Calculates the SVG 'd' attribute for a Bézier curve wire.
   * @param {number} x1 - Start X coordinate.
   * @param {number} y1 - Start Y coordinate.
   * @param {number} x2 - End X coordinate.
   * @param {number} y2 - End Y coordinate.
   * @returns {string} The SVG path data string.
   */
  static getWirePath(x1, y1, x2, y2) {
    const distanceX = x2 - x1;
    const absDx = Math.abs(distanceX);
    const dx = Math.max(absDx * 0.5, 50);

    const cp1x = x1 + dx;
    const cp1y = y1;
    const cp2x = x2 - dx;
    const cp2y = y2;

    return `M ${x1},${y1} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }

  /**
   * Gets the center position of a pin element in unscaled "world" coordinates.
   * @param {HTMLElement} pinElement - The .pin-dot DOM element.
   * @param {object} app - The main BlueprintApp object.
   * @returns {{x: number, y: number}} The world-space coordinates.
   */
  static getPinPosition(pinElement, app) {
    if (!pinElement) return { x: 0, y: 0 };

    const pinRect = pinElement.getBoundingClientRect();
    const graphRect = app.graph.editor.getBoundingClientRect();
    const zoom = app.graph.zoom;

    const cx = pinRect.left + pinRect.width / 2;
    const cy = pinRect.top + pinRect.height / 2;

    const worldX = (cx - graphRect.left - app.graph.pan.x) / zoom;
    const worldY = (cy - graphRect.top - app.graph.pan.y) / zoom;

    return { x: worldX, y: worldY };
  }

  /**
   * Returns the node key for an automatic conversion node between two types, if one exists.
   */
  static getConversionNodeKey(sourceType, targetType) {
    const key = `${sourceType}->${targetType}`;
    const conversions = {
      "float->string": "Conv_FloatToString",
      "int->string": "Conv_IntToString",
      "bool->string": "Conv_BoolToString",
      "byte->string": "Conv_ByteToString",
      "name->string": "Conv_NameToString",
      "text->string": "Conv_TextToString",
      "int->float": "Conv_IntToFloat",
      "byte->int": "Conv_ByteToInt",
    };
    return conversions[key] || null;
  }
}

/**
 * Debounce function for performance
 */
export function debounce(fn, ms) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Generate a unique ID (alternative to Utils.uniqueId)
 */
export function generateId(prefix = "node") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { Utils };
