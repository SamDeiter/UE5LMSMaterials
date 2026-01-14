/* global crypto */
/**
 * GUID generation utility
 * Uses crypto.randomUUID if available, otherwise falls back to a simple random string.
 *
 * Migrated from UE5LMSBlueprint - shared utility.
 */
export function generateGUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: generate a UUID v4-like string
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
