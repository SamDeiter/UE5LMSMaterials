/**
 * NodeRegistry.js
 *
 * Manages all node definitions and pin type metadata.
 */

// ============================================================================
// PIN TYPE DEFINITIONS
// ============================================================================
// Colors sourced from UE5.6:
// - Engine/Source/Editor/GraphEditor/Private/GraphEditorSettings.cpp
// - Engine/Source/Editor/UnrealEd/Private/MaterialGraphSchema.cpp
// - Engine/Source/Editor/MaterialEditor/Private/MaterialNodes/SGraphSubstrateMaterial.cpp
// ============================================================================

export const PinTypes = {
  // Scalar Types (from GraphEditorSettings.cpp:45)
  FLOAT: { name: "float", components: 1, color: "#FFFFFF" }, // White - UE5 active pin style
  FLOAT2: { name: "float2", components: 2, color: "#FFFFFF" }, // White - UE5 active pin style
  FLOAT3: { name: "float3", components: 3, color: "#FFFFFF" }, // White - UE5 active pin style
  FLOAT4: { name: "float4", components: 4, color: "#FFFFFF" }, // White - UE5 active pin style

  // Integer Types (from GraphEditorSettings.cpp:43-44)
  INT: { name: "int", components: 1, color: "#03C46D" }, // Green-blue (0.013575, 0.77, 0.429609)
  INT64: { name: "int64", components: 1, color: "#69C46D" }, // Lighter green-blue
  BYTE: { name: "byte", components: 1, color: "#002921" }, // Dark green (0.0, 0.16, 0.131270)

  // Bool Type (from GraphEditorSettings.cpp:40)
  BOOL: { name: "bool", components: 1, color: "#4C0000" }, // Maroon (0.3, 0.0, 0.0)
  STATICBOOL: { name: "staticbool", components: 1, color: "#4C0000" },

  // Double/Real Types (from GraphEditorSettings.cpp:46-47)
  DOUBLE: { name: "double", components: 1, color: "#0AA900" }, // Darker green (0.039216, 0.666667, 0.0)
  REAL: { name: "real", components: 1, color: "#0AA900" },

  // Texture/Object Types (from GraphEditorSettings.cpp:50-52)
  TEXTURE: { name: "texture", components: 0, color: "#0066E8" }, // Sharp blue (0.0, 0.4, 0.91)
  TEXTURE2D: { name: "texture2d", components: 0, color: "#0066E8" },
  TEXTURECUBE: { name: "texturecube", components: 0, color: "#0066E8" },
  TEXTURE2DARRAY: { name: "texture2darray", components: 0, color: "#0066E8" },
  VOLUMETEXTURE: { name: "volumetexture", components: 0, color: "#0066E8" },
  TEXTUREEXTERNAL: { name: "textureexternal", components: 0, color: "#0066E8" },
  OBJECT: { name: "object", components: 0, color: "#0066E8" }, // Sharp blue for objects
  SOFTOBJECT: { name: "softobject", components: 0, color: "#4CFFFF" }, // Cyan (0.3, 1.0, 1.0)

  // String Types (from GraphEditorSettings.cpp:54-55)
  STRING: { name: "string", components: 0, color: "#FF00A8" }, // Bright pink (1.0, 0.0, 0.660537)
  TEXT: { name: "text", components: 0, color: "#CC3366" }, // Salmon (0.8, 0.2, 0.4)
  NAME: { name: "name", components: 0, color: "#9B39FF" }, // Lilac (0.607717, 0.224984, 1.0)

  // Struct/Class Types (from GraphEditorSettings.cpp:42, 56)
  STRUCT: { name: "struct", components: 0, color: "#001A99" }, // Deep blue (0.0, 0.1, 0.6)
  CLASS: { name: "class", components: 0, color: "#1A0080" }, // Deep purple/violet (0.1, 0.0, 0.5)
  SOFTCLASS: { name: "softclass", components: 0, color: "#FF4CFF" }, // Light purple (1.0, 0.3, 1.0)
  INTERFACE: { name: "interface", components: 0, color: "#E0FF66" }, // Pale green (0.8784, 1.0, 0.4)

  // Transform Types (from GraphEditorSettings.cpp:59-60)
  VECTOR: { name: "vector", components: 3, color: "#FF9702" }, // Yellow (1.0, 0.591255, 0.016512)
  ROTATOR: { name: "rotator", components: 3, color: "#5A74FF" }, // Periwinkle (0.353393, 0.454175, 1.0)
  TRANSFORM: { name: "transform", components: 0, color: "#FF2C00" }, // Orange (1.0, 0.172585, 0.0)

  // Delegate Type (from GraphEditorSettings.cpp:49)
  DELEGATE: { name: "delegate", components: 0, color: "#FF0A0A" }, // Bright red (1.0, 0.04, 0.04)

  // Execution Type (from GraphEditorSettings.cpp:39)
  EXEC: { name: "exec", components: 0, color: "#FFFFFF" }, // White (1.0, 1.0, 1.0)

  // Wildcard/Any Type (from GraphEditorSettings.cpp:57)
  WILDCARD: { name: "wildcard", components: 0, color: "#383232" }, // Dark gray (0.22, 0.1958, 0.1958)

  // Material Editor Specific (from MaterialGraphSchema.cpp:285-287)
  MATERIALINPUT: { name: "materialinput", components: 0, color: "#FFFFFF" }, // ActivePinColor = White
  MATERIALOPTIONAL: {
    name: "materialoptional",
    components: 0,
    color: "#0D0D0D",
  }, // InactivePinColor

  // Mask Pins (from MaterialGraphSchema.cpp:660-675)
  MASK_R: { name: "mask_r", components: 1, color: "#FF0000" }, // Red
  MASK_G: { name: "mask_g", components: 1, color: "#00FF00" }, // Green
  MASK_B: { name: "mask_b", components: 1, color: "#0000FF" }, // Blue
  MASK_A: { name: "mask_a", components: 1, color: "#808080" }, // AlphaPinColor = Gray (0.5, 0.5, 0.5)

  // Substrate Material Type (from SGraphSubstrateMaterial.cpp:31)
  // ConnectionColor = FLinearColor(0.16f, 0.015f, 0.24f) * 4.f = (0.64, 0.06, 0.96)
  SUBSTRATE: { name: "substrate", components: 0, color: "#A30FF5" }, // Purple/Magenta

  // Material Attributes
  MATERIALATTRIBUTES: {
    name: "materialattributes",
    components: 0,
    color: "#A30FF5",
  },

  // Default fallback (from GraphEditorSettings.cpp:38)
  DEFAULT: { name: "default", components: 0, color: "#BF9966" }, // Light brown (0.75, 0.6, 0.4)
};

// Type compatibility matrix - which types can connect to which
// Based on UE5 material connection validation logic
export const TypeCompatibility = {
  // Scalar Types - float broadcasts to all float vectors
  float: ["float", "double", "real", "int", "byte"],
  float2: ["float2", "float"],
  float3: ["float3", "float2", "float"],
  float4: ["float4", "float3", "float2", "float"],

  // Integer Types
  int: ["int", "byte"],
  int64: ["int64", "int", "byte"],
  byte: ["byte"],

  // Double/Real Types
  double: ["double", "float"],
  real: ["real", "double", "float"],

  // Bool Types
  bool: ["bool"],
  staticbool: ["staticbool", "bool"],

  // Texture Types - each only connects to same type
  texture: ["texture", "texture2d"],
  texture2d: ["texture2d", "texture"],
  texturecube: ["texturecube"],
  texture2darray: ["texture2darray"],
  volumetexture: ["volumetexture"],
  textureexternal: ["textureexternal"],

  // Object Types
  object: ["object", "softobject"],
  softobject: ["softobject", "object"],
  class: ["class", "softclass"],
  softclass: ["softclass", "class"],
  interface: ["interface"],

  // String Types
  string: ["string", "name", "text"],
  text: ["text", "string"],
  name: ["name", "string"],

  // Struct/Transform Types
  struct: ["struct"],
  vector: ["vector", "float3", "rotator"],
  rotator: ["rotator", "float3", "vector"],
  transform: ["transform"],

  // Delegate/Exec Types
  delegate: ["delegate"],
  exec: ["exec"],

  // Material Editor Specific
  materialinput: ["materialinput", "float", "float2", "float3", "float4"],
  materialoptional: ["materialoptional", "float", "float2", "float3", "float4"],
  mask_r: ["mask_r", "float"],
  mask_g: ["mask_g", "float"],
  mask_b: ["mask_b", "float"],
  mask_a: ["mask_a", "float"],

  // Substrate Types - only connect to matching types
  substrate: ["substrate", "materialattributes"],
  materialattributes: ["materialattributes", "substrate"],

  // Wildcard accepts all
  wildcard: [
    "wildcard",
    "float",
    "float2",
    "float3",
    "float4",
    "int",
    "bool",
    "struct",
    "object",
    "texture",
  ],

  // Default accepts basic types
  default: ["default", "float", "float2", "float3", "float4"],
};

// ============================================================================
// NODE REGISTRY - Manages all node definitions
// ============================================================================
export class MaterialNodeRegistry {
  constructor() {
    this.definitions = new Map();
    this.categories = new Map();
    this.nodeClass = null; // To be set externally to avoid circular deps
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
    if (!this.nodeClass) {
      console.error("Node registry has no MaterialNode class associated.");
      return null;
    }
    return new this.nodeClass(id, definition, x, y, app);
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
