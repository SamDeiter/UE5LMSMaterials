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
