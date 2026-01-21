/**
 * MaterialValidator.js
 *
 * Provides a robust validation system for Material Editor graphs.
 * Adapted from UE5LMSBlueprint GraphValidator for Material-specific checks.
 *
 * Supports validation types:
 * - NODE_EXISTS: Check if a specific node type exists in the graph
 * - PIN_CONNECTED: Check if a pin on a node is connected
 * - MATERIAL_OUTPUT: Check if main material output has required connections
 * - SUBSTRATE_MODE: Check if graph uses Substrate workflow
 */

export const MaterialValidatorTypes = {
  NODE_EXISTS: "NODE_EXISTS",
  PIN_CONNECTED: "PIN_CONNECTED",
  MATERIAL_OUTPUT: "MATERIAL_OUTPUT",
  SUBSTRATE_MODE: "SUBSTRATE_MODE",
  NODE_PROPERTY: "NODE_PROPERTY",
  LINK_EXISTS: "LINK_EXISTS",
};

export class MaterialValidator {
  constructor(app) {
    this.app = app;
  }

  /**
   * Validates a list of criteria against the current material graph state.
   * @param {Array} criteria - List of criteria objects { type, params, description }
   * @returns {Array} - List of results with { passed: boolean, ...criterion }
   */
  validate(criteria) {
    if (!criteria || !Array.isArray(criteria)) return [];

    return criteria.map((criterion) => {
      const passed = this.checkCriterion(criterion);
      return { ...criterion, passed };
    });
  }

  /**
   * Validates a task and returns detailed results
   * @param {Object} task - Task object with requirements array
   * @returns {Object} - { success: boolean, results: Array }
   */
  validateTask(task) {
    if (!task || !task.requirements) {
      return { success: false, results: [] };
    }

    const results = this.validate(task.requirements);
    const allPassed = results.every((r) => r.passed);

    return {
      success: allPassed,
      results,
      passedCount: results.filter((r) => r.passed).length,
      totalCount: results.length,
    };
  }

  /**
   * Checks a single criterion.
   * @param {Object} criterion
   * @returns {boolean}
   */
  checkCriterion(criterion) {
    try {
      switch (criterion.type) {
        case MaterialValidatorTypes.NODE_EXISTS:
          return this.checkNodeExists(criterion.params);
        case MaterialValidatorTypes.PIN_CONNECTED:
          return this.checkPinConnected(criterion.params);
        case MaterialValidatorTypes.MATERIAL_OUTPUT:
          return this.checkMaterialOutput(criterion.params);
        case MaterialValidatorTypes.SUBSTRATE_MODE:
          return this.checkSubstrateMode(criterion.params);
        case MaterialValidatorTypes.NODE_PROPERTY:
          return this.checkNodeProperty(criterion.params);
        case MaterialValidatorTypes.LINK_EXISTS:
          return this.checkLinkExists(criterion.params);
        default:
          console.warn(
            `[MaterialValidator] Unknown validator type: ${criterion.type}`
          );
          return false;
      }
    } catch (e) {
      console.error(`[MaterialValidator] Error checking criterion:`, e);
      return false;
    }
  }

  // ============================================================================
  // SPECIFIC CHECKS
  // ============================================================================

  /**
   * Check if a node of a specific type exists
   * @param {Object} params - { nodeKey: string, count?: number }
   */
  checkNodeExists(params) {
    if (!params || !params.nodeKey) return false;
    const { nodeKey, count = 1 } = params;

    const graph = this.getGraph();
    if (!graph || !graph.nodes) return false;

    const nodes = [...graph.nodes.values()].filter(
      (n) => n.nodeKey === nodeKey
    );
    return nodes.length >= count;
  }

  /**
   * Check if a specific pin on a node is connected
   * @param {Object} params - { nodeKey: string, pinId: string }
   */
  checkPinConnected(params) {
    if (!params || !params.nodeKey || !params.pinId) return false;
    const { nodeKey, pinId } = params;

    const graph = this.getGraph();
    if (!graph || !graph.nodes) return false;

    const nodes = [...graph.nodes.values()].filter(
      (n) => n.nodeKey === nodeKey
    );

    return nodes.some((node) => {
      // Check both input and output pins
      const allPins = [...(node.pinsIn || []), ...(node.pinsOut || [])];
      const pin = allPins.find(
        (p) => p.id.endsWith(`-${pinId}`) || p.id === pinId
      );
      return pin && pin.isConnected && pin.isConnected();
    });
  }

  /**
   * Check if the main material output node has required connections
   * @param {Object} params - { requiredInputs?: string[] }
   */
  checkMaterialOutput(params = {}) {
    const { requiredInputs = ["basecolor"] } = params;

    const graph = this.getGraph();
    if (!graph || !graph.nodes) return false;

    // Find the main material output node
    const outputNode = [...graph.nodes.values()].find(
      (n) =>
        n.nodeKey === "MainMaterialNode" ||
        n.nodeKey === "MaterialOutput" ||
        n.isMainNode
    );

    if (!outputNode) return false;

    // Check if required inputs are connected
    return requiredInputs.every((inputId) => {
      const pin = outputNode.pinsIn?.find((p) =>
        p.id.toLowerCase().includes(inputId.toLowerCase())
      );
      return pin && pin.isConnected && pin.isConnected();
    });
  }

  /**
   * Check if the graph uses Substrate workflow
   * @param {Object} params - { required: boolean }
   */
  checkSubstrateMode(params = {}) {
    const { required = true } = params;

    const graph = this.getGraph();
    if (!graph || !graph.nodes) return !required;

    // Check for Substrate-specific nodes
    const hasSubstrateNodes = [...graph.nodes.values()].some(
      (n) => n.nodeKey?.includes("Substrate") || n.category === "Substrate"
    );

    return required ? hasSubstrateNodes : !hasSubstrateNodes;
  }

  /**
   * Check a property value on a node's pin
   * @param {Object} params - { nodeKey: string, pinId: string, value: any }
   */
  checkNodeProperty(params) {
    if (!params || !params.nodeKey || !params.pinId) return false;
    const { nodeKey, pinId, value } = params;

    const graph = this.getGraph();
    if (!graph || !graph.nodes) return false;

    const nodes = [...graph.nodes.values()].filter(
      (n) => n.nodeKey === nodeKey
    );

    return nodes.some((node) => {
      const allPins = [...(node.pinsIn || []), ...(node.pinsOut || [])];
      const pin = allPins.find(
        (p) => p.id.endsWith(`-${pinId}`) || p.id === pinId
      );

      if (!pin) return false;

      // If pin is connected, skip literal value check
      if (pin.isConnected && pin.isConnected()) return false;

      return String(pin.defaultValue) === String(value);
    });
  }

  /**
   * Check if a specific link exists between two nodes
   * @param {Object} params - { sourceNode, sourcePin, targetNode, targetPin }
   */
  checkLinkExists(params) {
    if (!params || !params.sourceNode || !params.targetNode) return false;
    const { sourceNode, sourcePin, targetNode, targetPin } = params;

    const graph = this.getGraph();
    if (!graph || !graph.nodes) return false;

    const sources = [...graph.nodes.values()].filter(
      (n) => n.nodeKey === sourceNode
    );

    return sources.some((src) => {
      const outPin = src.pinsOut?.find(
        (p) => p.id.endsWith(`-${sourcePin}`) || p.id === sourcePin
      );

      if (!outPin || !outPin.connections?.length) return false;

      return outPin.connections.some((conn) => {
        const targetNodeObj = conn.node;
        if (targetNodeObj.nodeKey !== targetNode) return false;

        if (targetPin) {
          return conn.id.endsWith(`-${targetPin}`);
        }
        return true;
      });
    });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get the graph reference from the app
   */
  getGraph() {
    // Support multiple app structures
    return this.app?.graph || this.app?.graphManager?.graph || null;
  }
}
