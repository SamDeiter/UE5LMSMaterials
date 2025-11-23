/**
 * Defines the static library of all available nodes that can be spawned.
 * Includes detailed pin definitions to ensure proper rendering.
 */
export const NodeDefinitions = {
    // --- CONVERSION NODES (Compact Style) ---
    "Conv_FloatToString": {
        title: "To String (Float)",
        type: "pure-node",
        category: "String",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "float", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_IntToString": {
        title: "To String (Int)",
        type: "pure-node",
        category: "String",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "int", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_BoolToString": {
        title: "To String (Bool)",
        type: "pure-node",
        category: "String",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "bool", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_ByteToString": {
        title: "To String (Byte)",
        type: "pure-node",
        category: "String",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "byte", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_NameToString": {
        title: "To String (Name)",
        type: "pure-node",
        category: "String",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "name", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_TextToString": {
        title: "To String (Text)",
        type: "pure-node",
        category: "String",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "text", dir: "in" },
            { id: "val_out", name: "", type: "string", dir: "out" }
        ]
    },
    "Conv_IntToFloat": {
        title: "To Float (Int)",
        type: "pure-node",
        category: "Math|Float",
        icon: "●",
        pins: [
            { id: "val_in", name: "", type: "int", dir: "in" },
            { id: "val_out", name: "", type: "float", dir: "out" }
        ]
    },
    "Conv_ByteToInt": {
        title: "To Int (Byte)",
        type: "pure-node",
        category: "Math|Integer",
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
        category: "Events",
        icon: "fa-play",
        isSingleton: true, // Marks this node as unique in the graph
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" }
        ]
    },
    "EventTick": {
        title: "Event Tick",
        type: "event-node",
        category: "Events",
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
        category: "Events",
        icon: "fa-bolt",
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" }
            // Removed delegate_out
        ]
    },
    "EventActorBeginOverlap": {
        title: "Event ActorBeginOverlap",
        type: "event-node",
        category: "Events",
        icon: "fa-door-open",
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
            { id: "other_actor_out", name: "Other Actor", type: "object", dir: "out" }
        ]
    },
    "EventOnClicked": {
        title: "Event OnClicked",
        type: "event-node",
        category: "Events",
        icon: "fa-mouse-pointer",
        pins: [
            { id: "exec_out", name: "Exec", type: "exec", dir: "out" }
        ]
    },
    // --- FLOW CONTROL ---
    "Branch": {
        title: "Branch",
        type: "flow-node",
        category: "Flow Control",
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
        category: "Flow Control",
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
        category: "Flow Control",
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
        category: "Flow Control",
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
        category: "Flow Control",
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
        category: "Flow Control",
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
        category: "Flow Control",
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
        category: "Flow Control",
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
        category: "String",
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
        category: "Math|Integer",
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
        category: "Math|Float",
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
        category: "Math|Float",
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
        category: "Math|Float",
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
        category: "Math|Float",
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
        category: "Math|Boolean",
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
        category: "Math|Boolean",
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
        category: "Math|Boolean",
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
        category: "Development",
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
