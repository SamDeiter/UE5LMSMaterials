/**
 * StatsController.js
 *
 * Displays shader performance metrics: node count, texture samplers,
 * instruction estimate, and budget level.
 */

export class StatsController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("stats-content");
    this.stats = {
      nodeCount: 0,
      textureSamplers: 0,
      instructionEstimate: 0,
      budgetLevel: "Low"
    };
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
    graph.nodes.forEach((node) => {
      // Check nodeKey which stores the actual node type like "TextureSample"
      const nodeKey = (node.nodeKey || "").toLowerCase();
      if (nodeKey.includes("texturesample") || nodeKey.includes("textureparam")) {
        samplerCount++;
      }
    });
    this.stats.textureSamplers = samplerCount;

    // Instruction estimate - based on node types AND connections
    let instructions = 0;
    graph.nodes.forEach((node) => {
      const nodeKey = (node.nodeKey || "").toLowerCase();
      
      // Base cost per node type
      if (nodeKey.includes("main") || nodeKey.includes("output")) {
        // Main output - count connected inputs as blend/output instructions
        const connectedInputs = node.inputs?.filter(p => p.connectedTo)?.length || 0;
        instructions += connectedInputs * 2; // Each PBR input blend
      } else if (nodeKey.includes("texture")) {
        instructions += 8; // Texture samples are expensive (sample + filter)
      } else if (nodeKey.includes("constant3") || nodeKey.includes("vectorparameter")) {
        instructions += 3; // Vector constant (3 components)
      } else if (nodeKey.includes("constant") || nodeKey.includes("scalarparameter")) {
        instructions += 1;
      } else if (nodeKey.includes("multiply") || nodeKey.includes("add") || nodeKey.includes("subtract")) {
        instructions += 2;
      } else if (nodeKey.includes("lerp")) {
        instructions += 4; // Lerp is multiple ops
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

    const { nodeCount, textureSamplers, instructionEstimate, budgetLevel } = this.stats;
    
    const samplerWarning = textureSamplers > 16 ? " ⚠️" : "";
    const samplerClass = textureSamplers > 16 ? "warning" : "";
    
    const budgetClass = budgetLevel.toLowerCase();
    const budgetIcon = budgetLevel === "Low" ? "🟢" : budgetLevel === "Medium" ? "🟡" : "🔴";

    this.container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-row">
          <span class="stat-label">Nodes</span>
          <span class="stat-value">${nodeCount}</span>
        </div>
        <div class="stat-row ${samplerClass}">
          <span class="stat-label">Texture Samplers</span>
          <span class="stat-value">${textureSamplers} / 16${samplerWarning}</span>
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
    `;
  }
}
