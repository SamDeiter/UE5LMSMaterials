/**
 * Coordinate Node Definitions
 * Contains world/object space coordinate accessors
 */

export const CoordinateNodes = {
  WorldPosition: {
    title: "WorldPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "W",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = WorldPositionWS;`,
  },

  ObjectPosition: {
    title: "ObjectPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "O",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = ObjectPositionWS;`,
  },

  CameraPosition: {
    title: "CameraPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "📍",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = CameraPositionWS;`,
  },

  VertexNormalWS: {
    title: "VertexNormalWS",
    type: "material-expression",
    category: "Coordinates",
    icon: "V",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = VertexNormalWS;`,
  },

  ScreenPosition: {
    title: "ScreenPosition",
    type: "material-expression",
    category: "Coordinates",
    icon: "⊡",
    pins: [{ id: "out", name: "", type: "float2", dir: "out" }],
    shaderCode: `float2 {OUTPUT} = ScreenUV;`,
  },

  ObjectScale: {
    title: "ObjectScale",
    type: "material-expression",
    category: "Coordinates",
    icon: "⇔",
    description: "Returns the scale of the object in world units (X, Y, Z)",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = ObjectScaleWS;`,
  },

  ObjectBounds: {
    title: "ObjectBounds",
    type: "material-expression",
    category: "Coordinates",
    icon: "□",
    description: "Returns the bounding box size of the object in local space",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = ObjectBoundsWS;`,
  },

  ObjectRadius: {
    title: "ObjectRadius",
    type: "material-expression",
    category: "Coordinates",
    icon: "◎",
    description: "Returns the bounding sphere radius of the object",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    shaderCode: `float {OUTPUT} = ObjectRadiusWS;`,
  },

  ActorPositionWS: {
    title: "ActorPositionWS",
    type: "material-expression",
    category: "Coordinates",
    icon: "A",
    description: "World space position of the actor pivot point",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = ActorPositionWS;`,
  },

  VertexColor: {
    title: "VertexColor",
    type: "material-expression",
    category: "Coordinates",
    icon: "🎨",
    description: "RGBA vertex color data painted on the mesh",
    pins: [
      { id: "rgb", name: "RGB", type: "float3", dir: "out" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
      { id: "b", name: "B", type: "float", dir: "out" },
      { id: "a", name: "A", type: "float", dir: "out" },
    ],
    shaderCode: `
            float4 {OUTPUT}_full = VertexColor;
            float3 {OUTPUT}_rgb = {OUTPUT}_full.rgb;
            float {OUTPUT}_r = {OUTPUT}_full.r;
            float {OUTPUT}_g = {OUTPUT}_full.g;
            float {OUTPUT}_b = {OUTPUT}_full.b;
            float {OUTPUT}_a = {OUTPUT}_full.a;
        `,
  },

  VertexTangentWS: {
    title: "VertexTangentWS",
    type: "material-expression",
    category: "Coordinates",
    icon: "→",
    description: "World space tangent vector for the vertex",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = VertexTangentWS;`,
  },

  TwoSidedSign: {
    title: "TwoSidedSign",
    type: "material-expression",
    category: "Coordinates",
    icon: "±",
    description: "Returns +1 for front faces, -1 for back faces. Essential for two-sided foliage.",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    shaderCode: `float {OUTPUT} = TwoSidedSign;`,
  },
};
