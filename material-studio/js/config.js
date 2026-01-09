/**
 * Material Studio Configuration
 * Central constants and settings for the application.
 */

export const CONFIG = {
  // Preview panel dimensions
  PREVIEW: {
    WIDTH: 319,
    HEIGHT: 290,
  },

  // Grid settings
  GRID: {
    SIZE: 20,
    COLOR_MAJOR: "#1f1f1f",
    COLOR_MINOR: "#111111",
  },

  // Performance tuning
  PERFORMANCE: {
    DEBOUNCE_MS: 16, // ~60fps for graph evaluation
    THROTTLE_MS: 50, // For resize/scroll events
    ANIMATION_FRAME: true, // Use requestAnimationFrame
  },

  // Node appearance
  NODE: {
    MIN_WIDTH: 150,
    HEADER_HEIGHT: 24,
    PORT_SIZE: 14,
    PORT_MARGIN: 6,
  },

  // Wire appearance
  WIRE: {
    STROKE_WIDTH: 2,
    CURVE_TENSION: 0.5,
  },

  // Sidebar dimensions
  SIDEBAR: {
    WIDTH: 320,
    PREVIEW_HEIGHT: 320,
    DETAILS_HEIGHT: 200,
  },
};

// Data type colors for ports and wires
export const TYPE_COLORS = {
  float: "#4ade80",
  float2: "#f87171",
  float3: "#fcd34d",
  float4: "#f472b6",
  substrate: "#22d3ee",
  attributes: "#60a5fa",
  bool: "#880000",
  default: "#888888",
};

// Node category colors for headers
export const CATEGORY_COLORS = {
  "Data Types": "#403010",
  Substrate: "#005050",
  "Material Attributes": "#204060",
  Math: "#204020",
  Color: "#602060",
  VectorOps: "#403010",
  Texture: "#401010",
  Utility: "#202040",
  Logic: "#505050",
  Main: "#383838",
};

export default CONFIG;
