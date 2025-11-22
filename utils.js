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
    static uniqueId(prefix = 'id') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Maps a logical type (e.g., 'float') to its CSS class name (e.g., 'float-pin').
     * @param {string} type - The logical pin type.
     * @returns {string} The corresponding CSS class.
     */
    static getPinTypeClass(type) {
        const typeMap = {
            'exec': 'exec-pin',
            'bool': 'bool-pin',
            'byte': 'byte-pin',
            'int': 'int-pin',
            'int64': 'int64-pin',
            'float': 'float-pin',
            'name': 'name-pin',
            'string': 'string-pin',
            'text': 'text-pin',
            'vector': 'vector-pin',
            'rotator': 'rotator-pin',
            'transform': 'transform-pin',
            'object': 'object-pin',
        };
        return typeMap[type.toLowerCase()] || 'default-pin';
    }

    /**
     * Gets the CSS variable color for a given pin type.
     * @param {string} type - The logical pin type.
     * @returns {string} The CSS color variable string.
     */
    static getPinColor(type) {
        const colorMap = {
            'exec': 'var(--color-exec)',
            'bool': 'var(--color-bool)',
            'byte': 'var(--color-byte)',
            'int': 'var(--color-int)',
            'int64': 'var(--color-int64)',
            'float': 'var(--color-float)',
            'name': 'var(--color-name)',
            'string': 'var(--color-string)',
            'text': 'var(--color-text)',
            'vector': 'var(--color-vector)',
            'rotator': 'var(--color-rotator)',
            'transform': 'var(--color-transform)',
            'object': 'var(--color-object)',
        };
        return colorMap[type.toLowerCase()] || '#888888';
    }

    /**
     * Gets the UE5 style header gradient for a specific variable type.
     * @param {string} type - The variable type (e.g., 'bool', 'int').
     * @returns {{start: string, end: string}} The gradient start and end colors.
     */
    static getVariableHeaderColor(type) {
        const colors = {
            'bool': { start: '#8F0000', end: '#450000' },
            'byte': { start: '#00525E', end: '#002B30' },
            'int': { start: '#1E855E', end: '#0F422F' },
            'int64': { start: '#668044', end: '#334022' },
            'float': { start: '#6AA826', end: '#355413' },
            'name': { start: '#8F5E99', end: '#472F4C' },
            'string': { start: '#BF00BF', end: '#600060' },
            'text': { start: '#BF7885', end: '#603C42' },
            'vector': { start: '#BF9800', end: '#604C00' },
            'rotator': { start: '#5E7AA8', end: '#2F3D54' },
            'transform': { start: '#BF6600', end: '#603300' },
            'object': { start: '#005580', end: '#002A40' },
        };
        return colors[type.toLowerCase()] || { start: '#303030', end: '#151515' };
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
            'float->string': 'Conv_FloatToString',
            'int->string': 'Conv_IntToString',
            'bool->string': 'Conv_BoolToString',
            'byte->string': 'Conv_ByteToString',
            'name->string': 'Conv_NameToString',
            'text->string': 'Conv_TextToString',
            'int->float': 'Conv_IntToFloat',
            'byte->int': 'Conv_ByteToInt',
        };
        return conversions[key] || null;
    }
}

/**
 * Defines the static library of all available nodes that can be spawned.
 * Includes detailed pin definitions to ensure proper rendering.
 */
const NodeLibrary = {
    // --- CONVERSION NODES (Compact Style) ---
    "Conv_FloatToString": {
        title: "To String (Float)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "float", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_IntToString": {
        title: "To String (Int)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "int", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_BoolToString": {
        title: "To String (Bool)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "bool", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_ByteToString": {
        title: "To String (Byte)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "byte", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_NameToString": {
        title: "To String (Name)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "name", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_TextToString": {
        title: "To String (Text)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "text", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_IntToFloat": {
        title: "To Float (Int)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "int", dir: "in" },
            { id: "val_out", name: "", type: "float", dir: "out" }
        ]
    },
    "Conv_ByteToInt": {
        title: "To Int (Byte)",
        type: "pure-node",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "byte", dir: "in" },
            { id: "val_out", name: "", type: "int", dir: "out" }
        ]
    },

    // --- EVENTS ---
    "EventBeginPlay": {
        title: "Event BeginPlay",
        type: "event-node",
        icon: "fa-play",
        isSingleton: true, // Marks this node as unique in the graph
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" }
        ]
    },
    "EventTick": {
        title: "Event Tick",
        type: "event-node",
        icon: "fa-clock",
        isSingleton: true, // Marks this node as unique in the graph
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "delta_seconds_out", name: "Delta Seconds", type: "float", dir: "out" }
        ]
    },
    "CustomEvent": {
        title: "Custom Event",
        type: "event-node",
        icon: "fa-bolt",
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" }
            // Removed delegate_out
        ]
    },
    "EventActorBeginOverlap": {
        title: "Event ActorBeginOverlap",
        type: "event-node",
        icon: "fa-door-open",
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "other_actor_out", name: "Other Actor", type: "object", dir: "out" }
        ]
    },
    "EventOnClicked": {
        title: "Event OnClicked",
        type: "event-node",
        icon: "fa-mouse-pointer",
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" }
        ]
    },
    // --- FLOW CONTROL ---
    "Branch": {
        title: "Branch",
        type: "flow-node",
        icon: "fa-code-branch",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "cond_in", name: "Condition", type: "bool", dir: "in", defaultValue: true },
            { id: "exec_true", name: "True", type: "exec", dir: "out" },
            { id: "exec_false", name: "False", type: "exec", dir: "out" }
        ]
    },
    "Sequence": {
        title: "Sequence",
        type: "flow-node",
        icon: "fa-list-ol",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "exec_0", name: "Then 0", type: "exec", dir: "out" },
            { id: "exec_1", name: "Then 1", type: "exec", dir: "out" }
        ]
    },
    "DoOnce": {
        title: "DoOnce",
        type: "flow-node",
        icon: "fa-step-forward",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "reset_in", name: "Reset", type: "exec", dir: "in" },
            { id: "exec_completed", name: "Completed", type: "exec", dir: "out" }
        ]
    },
    "DoN": {
        title: "Do N",
        type: "flow-node",
        icon: "fa-redo-alt",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "reset_in", name: "Reset", type: "exec", dir: "in" },
            { id: "n_in", name: "N", type: "int", dir: "in" },
            { id: "exec_counter", name: "Counter", type: "exec", dir: "out" },
            { id: "exit_int", name: "Count", type: "int", dir: "out" }
        ]
    },
    "FlipFlop": {
        title: "FlipFlop",
        type: "flow-node",
        icon: "fa-toggle-on",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "exec_a", name: "A", type: "exec", dir: "out" },
            { id: "exec_b", name: "B", type: "exec", dir: "out" },
            { id: "is_a_bool", name: "Is A", type: "bool", dir: "out" }
        ]
    },
    "ForLoop": {
        title: "ForLoop",
        type: "flow-node",
        icon: "fa-sync-alt",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "first_index_in", name: "First Index", type: "int", dir: "in" },
            { id: "last_index_in", name: "Last Index", type: "int", dir: "in" },
            { id: "exec_loop_body", name: "Loop Body", type: "exec", dir: "out" },
            { id: "index_out", name: "Index", type: "int", dir: "out" },
            { id: "exec_completed", name: "Completed", type: "exec", dir: "out" }
        ]
    },
    "ForEachLoop": {
        title: "ForEachLoop",
        type: "flow-node",
        icon: "fa-sync-alt",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "array_in", name: "Array", type: "object", dir: "in", containerType: "array" },
            { id: "exec_loop_body", name: "Loop Body", type: "exec", dir: "out" },
            { id: "array_element_out", name: "Array Element", type: "object", dir: "out" },
            { id: "array_index_out", name: "Array Index", type: "int", dir: "out" },
            { id: "exec_completed", name: "Completed", type: "exec", dir: "out" }
        ]
    },
    "Gate": {
        title: "Gate",
        type: "flow-node",
        icon: "fa-dungeon",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "enter_in", name: "Enter", type: "exec", dir: "in" },
            { id: "open_in", name: "Open", type: "exec", dir: "in" },
            { id: "close_in", name: "Close", type: "exec", dir: "in" },
            { id: "toggle_in", name: "Toggle", type: "exec", dir: "in" },
            { id: "exec_exit", name: "Exit", type: "exec", dir: "out" }
        ]
    },
    // --- FUNCTIONS ---
    "PrintString": {
        title: "Print String",
        type: "function-node",
        icon: "f",
        devWarning: "Development Only",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "str_in", name: "In String", type: "string", dir: "in", defaultValue: "Hello" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" }
        ]
    },
    // --- MATH (PURE) ---
    "AddInt": {
        title: "Add (Integer)",
        type: "pure-node",
        icon: "fa-plus",
        pins: [
            { id: "a_in", name: "A", type: "int", dir: "in" },
            { id: "b_in", name: "B", type: "int", dir: "in" },
            { id: "ret_out", name: "Return Value", type: "int", dir: "out" }
        ]
    },
    "AddFloat": {
        title: "Add (Float)",
        type: "pure-node",
        icon: "+",
        pins: [
            { id: "a_in", name: "A", type: "float", dir: "in", defaultValue: 0.0 },
            { id: "b_in", name: "B", type: "float", dir: "in", defaultValue: 0.0 },
            { id: "ret_out", name: "Return Value", type: "float", dir: "out" }
        ]
    },
    "SubtractFloat": {
        title: "Subtract (Float)",
        type: "pure-node",
        icon: "-",
        pins: [
            { id: "a_in", name: "A", type: "float", dir: "in", defaultValue: 0.0 },
            { id: "b_in", name: "B", type: "float", dir: "in", defaultValue: 1.0 },
            { id: "ret_out", name: "Return Value", type: "float", dir: "out" }
        ]
    },
    "MultiplyFloat": {
        title: "Multiply (Float)",
        type: "pure-node",
        icon: "×",
        pins: [
            { id: "a_in", name: "A", type: "float", dir: "in", defaultValue: 1.0 },
            { id: "b_in", name: "B", type: "float", dir: "in", defaultValue: 1.0 },
            { id: "ret_out", name: "Return Value", type: "float", dir: "out" }
        ]
    },
    "DivideFloat": {
        title: "Divide (Float)",
        type: "pure-node",
        icon: "÷",
        pins: [
            { id: "a_in", name: "A", type: "float", dir: "in", defaultValue: 1.0 },
            { id: "b_in", name: "B", type: "float", dir: "in", defaultValue: 1.0 },
            { id: "ret_out", name: "Return Value", type: "float", dir: "out" }
        ]
    },
    // --- BOOLEAN LOGIC ---
    "OR": {
        title: "OR",
        type: "pure-node",
        icon: "∨",
        pins: [
            { id: "a_in", name: "A", type: "bool", dir: "in", defaultValue: false },
            { id: "b_in", name: "B", type: "bool", dir: "in", defaultValue: false },
            { id: "ret_out", name: "Return Value", type: "bool", dir: "out" }
        ]
    },
    "AND": {
        title: "AND",
        type: "pure-node",
        icon: "∧",
        pins: [
            { id: "a_in", name: "A", type: "bool", dir: "in", defaultValue: false },
            { id: "b_in", name: "B", type: "bool", dir: "in", defaultValue: false },
            { id: "ret_out", name: "Return Value", type: "bool", dir: "out" }
        ]
    },
    "NOT": {
        title: "NOT",
        type: "pure-node",
        icon: "¬",
        pins: [
            { id: "a_in", name: "A", type: "bool", dir: "in", defaultValue: false },
            { id: "ret_out", name: "Return Value", type: "bool", dir: "out" }
        ]
    },
    // --- UTILITY ---
    "Comment": {
        title: "New Comment",
        type: "comment-node",
        icon: "fa-comment-dots",
        pins: []
    },
    // --- GENERIC SET NODES (Templates) ---
    "Set_bool": {
        title: "Set (Boolean)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "bool", dir: "in", defaultValue: false },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "bool", dir: "out" }
        ]
    },
    "Set_byte": {
        title: "Set (Byte)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "byte", dir: "in", defaultValue: 0 },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "byte", dir: "out" }
        ]
    },
    "Set_int": {
        title: "Set (Integer)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "int", dir: "in", defaultValue: 0 },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "int", dir: "out" }
        ]
    },
    "Set_int64": {
        title: "Set (Integer64)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "int64", dir: "in", defaultValue: 0 },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "int64", dir: "out" }
        ]
    },
    "Set_float": {
        title: "Set (Float)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "float", dir: "in", defaultValue: 0.0 },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "float", dir: "out" }
        ]
    },
    "Set_name": {
        title: "Set (Name)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "name", dir: "in", defaultValue: "None" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "name", dir: "out" }
        ]
    },
    "Set_string": {
        title: "Set (String)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "string", dir: "in", defaultValue: "" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "string", dir: "out" }
        ]
    },
    "Set_text": {
        title: "Set (Text)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "text", dir: "in", defaultValue: "" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "text", dir: "out" }
        ]
    },
    "Set_vector": {
        title: "Set (Vector)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "vector", dir: "in" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "vector", dir: "out" }
        ]
    },
    "Set_rotator": {
        title: "Set (Rotator)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "rotator", dir: "in" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "rotator", dir: "out" }
        ]
    },
    "Set_transform": {
        title: "Set (Transform)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "transform", dir: "in" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "transform", dir: "out" }
        ]
    },
    "Set_object": {
        title: "Set (Object)",
        type: "variable-node",
        icon: "fa-arrow-circle-up",
        pins: [
            { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
            { id: "val_in", name: "Value", type: "object", dir: "in" },
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "val_out", name: "Output", type: "object", dir: "out" }
        ]
    }
};

export { Utils, NodeLibrary };