/**
 * Control Flow Node Definitions
 * Contains StaticSwitch, If, Comment
 */

export const ControlFlowNodes = {
  StaticSwitch: {
    title: "StaticSwitch",
    type: "material-expression",
    category: "Utility",
    icon: "⇄",
    pins: [
      { id: "true_in", name: "True", type: "float", dir: "in" },
      { id: "false_in", name: "False", type: "float", dir: "in" },
      { id: "value", name: "Value", type: "bool", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      DefaultValue: true,
    },
    shaderCode: `float {OUTPUT} = {value} ? {true_in} : {false_in};`,
  },

  If: {
    title: "If",
    type: "material-expression",
    category: "Utility",
    icon: "?",
    pins: [
      { id: "a", name: "A", type: "float", dir: "in" },
      { id: "b", name: "B", type: "float", dir: "in", defaultValue: 0.0 },
      { id: "a_greater", name: "A > B", type: "float", dir: "in" },
      { id: "a_equal", name: "A = B", type: "float", dir: "in" },
      { id: "a_less", name: "A < B", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = {a} > {b} ? {a_greater} : ({a} < {b} ? {a_less} : {a_equal});`,
  },

  Comment: {
    title: "Comment",
    type: "comment-node",
    category: "Utility",
    icon: "💬",
    hotkey: "C",
    headerColor: "#2E7D32",
    pins: [],
    properties: {
      CommentText: "New Comment",
      Width: 200,
      Height: 100,
      CommentColor: { R: 0.18, G: 0.49, B: 0.2 },
    },
  },

  RerouteNode: {
    title: "",
    type: "reroute-node",
    category: "Utility",
    icon: "",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `{OUTPUT} = {in};`,
  },

  NamedRerouteDeclaration: {
    title: "Named Reroute",
    type: "named-reroute",
    category: "Utility",
    icon: "◉",
    pins: [{ id: "in", name: "", type: "float", dir: "in" }],
    properties: {
      Name: "RerouteName",
    },
    shaderCode: `// Named reroute: {Name} = {in};`,
  },

  NamedRerouteUsage: {
    title: "Named Reroute Usage",
    type: "named-reroute-usage",
    category: "Utility",
    icon: "○",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    properties: {
      Declaration: null, // Reference to NamedRerouteDeclaration
    },
    shaderCode: `{OUTPUT} = NamedReroute_{Name};`,
  },
};
