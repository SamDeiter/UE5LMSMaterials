/**
 * ToolbarManager.js
 * 
 * Manages toolbar button bindings and state.
 */

export class ToolbarManager {
  constructor(app) {
    this.app = app;
  }

  /**
   * Bind toolbar button events
   */
  bind() {
    // Save
    document
      .getElementById("save-btn")
      ?.addEventListener("click", () => this.app.save());

    // Apply
    document
      .getElementById("apply-btn")
      ?.addEventListener("click", () => this.app.apply());

    // Home
    document
      .getElementById("home-btn")
      ?.addEventListener("click", () => this.app.graph.focusMainNode());

    // Help
    document.getElementById("help-btn")?.addEventListener("click", () => {
      document.getElementById("help-modal").style.display = "flex";
    });

    document
      .getElementById("help-modal-close")
      ?.addEventListener("click", () => {
        document.getElementById("help-modal").style.display = "none";
      });

    // Undo/Redo
    document
      .getElementById("undo-btn")
      ?.addEventListener("click", () => this.app.undo());
    document
      .getElementById("redo-btn")
      ?.addEventListener("click", () => this.app.redo());

    // Live update toggle
    document
      .getElementById("live-update-btn")
      ?.addEventListener("click", (e) => {
        const btn = e.target.closest(".toolbar-btn");
        if (btn) {
           btn.classList.toggle("active");
           if (btn.classList.contains("active")) {
               this.app.apply();
           }
        }
      });
  }
}
