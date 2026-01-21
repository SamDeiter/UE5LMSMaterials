/**
 * Test Setup and Common Helpers
 * ==============================
 * Shared utilities for Material Editor test suite.
 */

import { MaterialNodeRegistry } from "../material/core/MaterialNodeFramework.js";
import { MaterialExpressionDefinitions } from "../data/MaterialExpressionDefinitions.js";

// Global registry instance for tests
let registry = null;

/**
 * Get the registry, initializing if needed
 */
export function getRegistry() {
  if (!registry) {
    registry = new MaterialNodeRegistry();
    registry.registerBatch(MaterialExpressionDefinitions);
  }
  return registry;
}

/**
 * Create a node instance for testing
 * @param {string} nodeKey - Key from MaterialExpressionDefinitions
 * @param {string} id - Optional node ID (defaults to nodeKey_test)
 */
export function createNode(nodeKey, id = `${nodeKey.toLowerCase()}_test`) {
  const reg = getRegistry();
  return reg.createNode(nodeKey, id, 0, 0, null);
}

/**
 * Get a node definition without instantiating
 */
export function getDefinition(nodeKey) {
  return getRegistry().get(nodeKey);
}

/**
 * Reset registry between test suites if needed
 */
export function resetRegistry() {
  registry = null;
}

/**
 * Helper to extract HLSL from node and validate it contains expected patterns
 */
export function validateHLSL(node, ...expectedPatterns) {
  const hlsl = node.getShaderSnippet();
  const results = expectedPatterns.map((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(hlsl);
    }
    return hlsl.includes(pattern);
  });
  return {
    hlsl,
    allMatch: results.every((r) => r),
    results,
  };
}
