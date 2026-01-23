/**
 * ReferenceViewerController.js
 * 
 * Manages the visual dependency graph showing relationships 
 * between the material and its assets (e.g. textures).
 */

export class ReferenceViewerController {
  constructor(app) {
    this.app = app;
    this.modal = null;
    this.canvas = null;
    this.ctx = null;
    
    // UI state
    this.width = 800;
    this.height = 600;
  }

  /**
   * Create the reference viewer modal
   */
  createModal() {
    if (this.modal) return;

    this.modal = document.createElement("div");
    this.modal.id = "reference-viewer-modal";
    this.modal.className = "modal";
    this.modal.innerHTML = `
      <div class="modal-content reference-viewer-content">
        <div class="modal-header">
          <span><i class="fas fa-network-wired"></i> Reference Viewer</span>
          <span class="modal-close">&times;</span>
        </div>
        <div class="modal-body">
          <canvas id="reference-canvas"></canvas>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" id="ref-viewer-refresh">Refresh</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Event listeners
    this.modal.querySelector(".modal-close").addEventListener("click", () => this.hide());
    this.modal.querySelector("#ref-viewer-refresh").addEventListener("click", () => this.render());
    
    this.canvas = this.modal.querySelector("#reference-canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
  }

  /**
   * Show the reference viewer
   */
  show() {
    this.createModal();
    this.modal.style.display = "flex";
    this.render();
  }

  /**
   * Hide the reference viewer
   */
  hide() {
    if (this.modal) {
      this.modal.style.display = "none";
    }
  }

  /**
   * Parse the graph for dependencies (e.g. textures)
   */
  getDependencies() {
    const dependencies = {
      upstream: [], // Stuff the material uses
      asset: this.app.persistence.currentAssetId,
      downstream: [] // Stuff that uses the material (placeholder)
    };

    if (this.app.graph && this.app.graph.nodes) {
      this.app.graph.nodes.forEach(node => {
        if (node.properties && node.properties.TextureAsset && node.properties.TextureAsset !== 'None') {
          const tex = this.app.textureManager.get(node.properties.TextureAsset);
          if (tex && !dependencies.upstream.some(d => d.id === node.properties.TextureAsset)) {
            dependencies.upstream.push({
              id: node.properties.TextureAsset,
              name: tex.name,
              type: 'Texture2D'
            });
          }
        }
      });
    }

    return dependencies;
  }

  /**
   * Render the dependency graph to the canvas
   */
  render() {
    if (!this.ctx) return;

    const deps = this.getDependencies();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const nodeWidth = 120;
    const nodeHeight = 40;

    // Draw lines first
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;

    // Center Node (Current Material)
    this.drawNode(centerX - nodeWidth / 2, centerY - nodeHeight / 2, deps.asset, 'Material', '#0077d8');

    // Upstream Nodes (Textures)
    deps.upstream.forEach((dep, i) => {
      const x = centerX - 250;
      const y = centerY - (deps.upstream.length * 60 / 2) + (i * 60);
      
      // Draw connection
      ctx.beginPath();
      ctx.moveTo(x + nodeWidth, y + nodeHeight / 2);
      ctx.bezierCurveTo(x + nodeWidth + 50, y + nodeHeight / 2, centerX - nodeWidth - 50, centerY, centerX - nodeWidth / 2, centerY);
      ctx.stroke();
      
      this.drawNode(x, y, dep.name, dep.type, '#8c0202');
    });

    // Downstream placeholder
    const xDown = centerX + 130;
    const yDown = centerY - nodeHeight / 2;
    this.drawNode(xDown, yDown, 'None', 'Referenced By', '#444');
  }

  /**
   * Draw a node on the reference canvas
   */
  drawNode(x, y, name, type, color) {
    const ctx = this.ctx;
    const w = 120;
    const h = 40;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 4, y + 4, w, h);

    // Body
    ctx.fillStyle = "#222";
    ctx.fillRect(x, y, w, h);
    
    // Left edge accent
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 4, h);

    // Text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px Inter";
    ctx.fillText(name, x + 10, y + 15);
    
    ctx.fillStyle = "#888";
    ctx.font = "9px Inter";
    ctx.fillText(type, x + 10, y + 30);
  }
}
