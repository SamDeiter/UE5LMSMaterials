/**
 * StatsController.js
 *
 * Displays shader performance metrics matching UE5 Material Editor:
 * - Texture Samplers: X/16
 * - Texture Lookups (Est.): VS(X), PS(X)
 * - User Interpolators: X/4 Scalars
 * - Shader Count: X
 * - Node count, instruction estimate, budget level
 * - Error/Warning messages with yellow styling
 */

export class StatsController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("stats-content");
    this.stats = {
      nodeCount: 0,
      textureSamplers: 0,
      textureLookups: { vs: 0, ps: 0 },
      userInterpolators: 0,
      shaderCount: 1,
      instructionEstimate: 0,
      budgetLevel: "Low",
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Add an error message to display
   */
  addError(message) {
    this.errors.push(message);
    this.render();
  }

  /**
   * Add a warning message to display
   */
  addWarning(message) {
    this.warnings.push(message);
    this.render();
  }

  /**
   * Clear all error and warning messages
   */
  clearMessages() {
    this.errors = [];
    this.warnings = [];
    this.render();
  }

  /**
   * Calculate stats from current graph state
   */
  calculateStats() {
    const graph = this.app.graph;
    if (!graph) return;

    // Node count (exclude main output)
    this.stats.nodeCount = graph.nodes.size;

    // Texture samplers - count TextureSample nodes by nodeKey
    let samplerCount = 0;
    const textureLookups = { vs: 0, ps: 0 };
    let userInterpolators = 0;

    graph.nodes.forEach((node) => {
      const nodeKey = (node.nodeKey || "").toLowerCase();

      // Texture samplers and lookups
      if (
        nodeKey.includes("texturesample") ||
        nodeKey.includes("textureparam")
      ) {
        samplerCount++;
        // Each texture sample ~1 VS lookup (for UV), ~1 PS lookup (for sample)
        textureLookups.vs += 1;
        textureLookups.ps += 1;
      }

      // User interpolators - parameters that pass data from VS to PS
      if (
        nodeKey.includes("parameter") ||
        nodeKey.includes("texturecoordinate")
      ) {
        userInterpolators += 1;
      }

      // Panner/Rotator add additional lookups
      if (nodeKey.includes("panner") || nodeKey.includes("rotator")) {
        textureLookups.vs += 1;
      }
    });

    this.stats.textureSamplers = samplerCount;
    this.stats.textureLookups = textureLookups;
    this.stats.userInterpolators = Math.min(userInterpolators, 16); // Max 16 interpolators
    this.stats.shaderCount = Math.max(1, Math.ceil(samplerCount / 4)); // Rough estimate

    // Instruction estimate - based on node types AND connections
    let instructions = 0;
    graph.nodes.forEach((node) => {
      const nodeKey = (node.nodeKey || "").toLowerCase();

      // Base cost per node type
      if (nodeKey.includes("main") || nodeKey.includes("output")) {
        const connectedInputs =
          node.inputs?.filter((p) => p.connectedTo)?.length || 0;
        instructions += connectedInputs * 2;
      } else if (nodeKey.includes("texture")) {
        instructions += 8;
      } else if (
        nodeKey.includes("constant3") ||
        nodeKey.includes("vectorparameter")
      ) {
        instructions += 3;
      } else if (
        nodeKey.includes("constant") ||
        nodeKey.includes("scalarparameter")
      ) {
        instructions += 1;
      } else if (
        nodeKey.includes("multiply") ||
        nodeKey.includes("add") ||
        nodeKey.includes("subtract")
      ) {
        instructions += 2;
      } else if (nodeKey.includes("lerp")) {
        instructions += 4;
      } else if (nodeKey.includes("power") || nodeKey.includes("clamp")) {
        instructions += 3;
      } else if (nodeKey.includes("fresnel") || nodeKey.includes("normalize")) {
        instructions += 5;
      } else if (nodeKey.includes("if") || nodeKey.includes("switch")) {
        instructions += 8;
      } else {
        instructions += 2;
      }
    });
    this.stats.instructionEstimate = instructions;

    // Budget level
    this.stats.budgetLevel = this.getBudgetLevel(instructions);

    // Check for potential issues and add warnings
    this.errors = [];
    this.warnings = [];

    if (samplerCount > 16) {
      this.errors.push(
        `[SM5] Texture sampler limit exceeded (${samplerCount}/16)`,
      );
    }
    if (userInterpolators > 8) {
      this.warnings.push(
        `High interpolator usage (${userInterpolators}/16 scalars)`,
      );
    }
    if (instructions > 200) {
      this.warnings.push(
        `High instruction count may impact mobile performance`,
      );
    }

    this.render();
  }

  /**
   * Get budget level based on instruction count
   */
  getBudgetLevel(instructions) {
    if (instructions < 50) return "Low";
    if (instructions < 150) return "Medium";
    return "High";
  }

  /**
   * Render stats to the panel
   */
  render() {
    if (!this.container) return;

    const {
      nodeCount,
      textureSamplers,
      textureLookups,
      userInterpolators,
      shaderCount,
      instructionEstimate,
      budgetLevel,
    } = this.stats;

    const samplerWarning = textureSamplers > 16 ? " ⚠️" : "";
    const samplerClass = textureSamplers > 16 ? "warning" : "";

    const budgetClass = budgetLevel.toLowerCase();
    const budgetIcon =
      budgetLevel === "Low" ? "🟢" : budgetLevel === "Medium" ? "🟡" : "🔴";

    // Build error/warning HTML
    let messagesHtml = "";
    if (this.errors.length > 0 || this.warnings.length > 0) {
      messagesHtml = `<div class="stats-messages">`;
      this.errors.forEach((err) => {
        messagesHtml += `<div class="stats-error">❌ ${err}</div>`;
      });
      this.warnings.forEach((warn) => {
        messagesHtml += `<div class="stats-warning">⚠️ ${warn}</div>`;
      });
      messagesHtml += `</div>`;
    }

    this.container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-row ${samplerClass}">
          <span class="stat-label">Texture Samplers</span>
          <span class="stat-value">${textureSamplers} / 16${samplerWarning}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Texture Lookups (Est.)</span>
          <span class="stat-value">VS(${textureLookups.vs}), PS(${textureLookups.ps})</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">User Interpolators</span>
          <span class="stat-value">${userInterpolators} / 16 Scalars</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Shader Count</span>
          <span class="stat-value">${shaderCount}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Nodes</span>
          <span class="stat-value">${nodeCount}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Est. Instructions</span>
          <span class="stat-value">~${instructionEstimate}</span>
        </div>
        <div class="stat-row budget-${budgetClass}">
          <span class="stat-label">Budget</span>
          <span class="stat-value">${budgetIcon} ${budgetLevel}</span>
        </div>
      </div>
      ${messagesHtml}
    `;
  }
}
