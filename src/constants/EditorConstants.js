/**
 * EditorConstants.js
 * 
 * Centralized constants for the Material Editor to ensure consistency 
 * and eliminate magic numbers across the codebase.
 */

export const UI_TIMINGS = {
  DEBOUNCE_SEARCH: 150,
  DEBOUNCE_RENDER: 50,
  AUTO_SAVE: 1000,
};

export const VIEWPORT = {
  MOVE_SPEED: 0.05,
  DEFAULT_FOV: 75,
  MIN_FOV: 30,
  MAX_FOV: 90,
  EXPOSURE_RANGE: { min: -3, max: 3 },
};

export const LAYOUT = {
  MIN_PANEL_WIDTH: 200,
  MAX_PANEL_WIDTH: 500,
  DEFAULT_SIDEBAR_WIDTH: 320,
  DEFAULT_DETAILS_WIDTH: 250,
};

export const PIN_COLORS = {
  EXEC: "#ffffff",
  BOOL: "#8c0202",
  BYTE: "#00665e",
  INT: "#28e897",
  FLOAT: "#96ee35",
  NAME: "#cc99ff",
  STRING: "#ff00ff",
  TEXT: "#e27696",
  VECTOR: "#ffc700",
  ROTATOR: "#99ccff",
  TRANSFORM: "#ff7300",
  OBJECT: "#00a2e8",
};

/**
 * Post-processing effect settings matching UE5 Material Editor
 */
export const POST_PROCESSING = {
  BLOOM: {
    STRENGTH: 0.5,      // Bloom intensity
    RADIUS: 0.4,        // Bloom falloff radius
    THRESHOLD: 0.8,     // HDR threshold for glow
  },
  VIGNETTE: {
    INTENSITY: 0.3,     // Edge darkening amount
    RADIUS: 0.8,        // Vignette falloff radius
  },
  FILM_GRAIN: {
    INTENSITY: 0.003,   // Very subtle noise
  },
};

/**
 * Rendering and camera defaults
 */
export const RENDERING = {
  DEFAULT_CAMERA_POSITION: { x: 2.5, y: 2, z: 4 },
  DEFAULT_CAMERA_TARGET: { x: 0, y: 1, z: 0 },
  DEFAULT_CAMERA_FOV: 45,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 100,
  DIRECTIONAL_LIGHT_INTENSITY: 2.5,
  AMBIENT_LIGHT_INTENSITY: 0.2,
  DEFAULT_MESH_Y: 1,
  PLANE_MESH_Y: 1.5,
};

/**
 * Default Material Properties
 */
export const MATERIAL_DEFAULTS = {
  METALNESS: 0,
  ROUGHNESS: 0.5,
  ENV_MAP_INTENSITY: 0.5,
  SPECULAR_INTENSITY: 0.5,
  REFLECTIVITY: 0.5,
  IOR: 1.5,
};
