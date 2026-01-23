/**
 * LayoutController.js
 * 
 * Handles resizable panels for the Material Editor.
 * Enables dragging the blue resizer bars between panels.
 */

import { LAYOUT } from '../../src/constants/EditorConstants.js';

export class LayoutController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('main-content'); // Correct container for grid column adjustment
    this.resizerLeft = document.getElementById('resizer-left');
    this.resizerRight = document.getElementById('resizer-right');
    this.resizerViewport = document.getElementById('resizer-viewport');
    this.resizerStats = document.getElementById('resizer-stats');

    this.leftWidth = LAYOUT.DEFAULT_SIDEBAR_WIDTH;
    this.rightWidth = LAYOUT.DEFAULT_DETAILS_WIDTH;
    
    // Horizontal sizes for left column panels
    this.viewportHeight = 400; // Default height for viewport
    this.statsHeight = 100;    // Default height for stats (compact)

    this.isResizing = false;
    this.currentResizer = null;
    this.startX = 0;
    this.startSize = 0;

    this.panels = {
      left: true,
      right: true
    };

    this.initResizers();
    
    // Initial layout application
    this.updateLayout();
    
    // Bind to window resize to ensure grid 1fr stays in sync
    window.addEventListener('resize', () => {
      this.updateLayout();
    });
  }

  initResizers() {
    const attach = (resizer, type) => {
      if (!resizer) return;
      
      resizer.addEventListener('mousedown', (e) => {
        this.isResizing = true;
        this.currentResizer = type;
        this.startX = e.clientX;

        if (type === 'left') this.startSize = this.leftWidth;
        if (type === 'right') this.startSize = this.rightWidth;
        if (type === 'viewport') {
          this.startSize = this.viewportHeight;
          this.startY = e.clientY;
        }
        if (type === 'stats') {
          this.startSize = this.statsHeight;
          this.startY = e.clientY;
        }

        document.body.style.cursor = type === 'left' || type === 'right' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });
    };

    if (this.resizerLeft) attach(this.resizerLeft, 'left');
    if (this.resizerRight) attach(this.resizerRight, 'right');
    if (this.resizerViewport) attach(this.resizerViewport, 'viewport');
    if (this.resizerStats) attach(this.resizerStats, 'stats');

    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  handleMouseMove(e) {
    if (!this.isResizing) return;

    if (this.currentResizer === 'left') {
      const delta = e.clientX - this.startX;
      this.leftWidth = Math.max(LAYOUT.MIN_PANEL_WIDTH, Math.min(LAYOUT.MAX_PANEL_WIDTH, this.startSize + delta));
    } else if (this.currentResizer === 'right') {
      const delta = this.startX - e.clientX; 
      this.rightWidth = Math.max(LAYOUT.MIN_PANEL_WIDTH, Math.min(LAYOUT.MAX_PANEL_WIDTH, this.startSize + delta));
    } else if (this.currentResizer === 'viewport') {
      const delta = e.clientY - this.startY;
      this.viewportHeight = Math.max(100, this.startSize + delta);
    } else if (this.currentResizer === 'stats') {
      const delta = e.clientY - this.startY;
      this.statsHeight = Math.max(50, this.startSize + delta);
    }

    this.requestUpdate();
  }

  handleMouseUp() {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    this.currentResizer = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Final high-fidelity resize
    this.resizeAll(true);
  }

  /**
   * Throttled update using requestAnimationFrame
   */
  requestUpdate() {
    if (this._animationFrame) return;
    this._animationFrame = requestAnimationFrame(() => {
      this.updateLayout();
      this._animationFrame = null;
    });
  }

  /**
   * Resizes all components.
   * @param {boolean} full - If true, performs expensive 3D resize; otherwise just sets CSS.
   */
  resizeAll(full = false) {
    // Graph resize is relatively cheap (canvas redraw)
    if (this.app.graph && typeof this.app.graph.resize === 'function') {
      this.app.graph.resize();
    }
    
    // Viewport resize is expensive (Three.js buffer allocation)
    if (this.app.viewport && full) {
      this.app.viewport.resize();
    }
  }

  updateLayout() {
    const leftCol = document.getElementById('left-column');
    const rightCol = document.getElementById('right-column');
    const resizerL = this.resizerLeft;
    const resizerR = this.resizerRight;

    if (!this.container) return;

    const lWidth = this.panels.left ? `${this.leftWidth}px` : "0px";
    const lResizer = this.panels.left ? "4px" : "0px";
    const rWidth = this.panels.right ? `${this.rightWidth}px` : "0px";
    const rResizer = this.panels.right ? "4px" : "0px";

    // Dynamic grid template based on active panels
    // We assume 5 children in order: Left, ResizerL, Center(Graph), ResizerR, Right
    this.container.style.display = 'grid';
    this.container.style.gridTemplateColumns = `${lWidth} ${lResizer} 1fr ${rResizer} ${rWidth}`;

    if (leftCol) leftCol.style.display = this.panels.left ? 'flex' : 'none';
    if (rightCol) rightCol.style.display = this.panels.right ? 'flex' : 'none';
    
    if (resizerL) resizerL.style.display = this.panels.left ? 'block' : 'none';
    if (resizerR) resizerR.style.display = this.panels.right ? 'block' : 'none';

    // Apply horizontal heights to left column panels
    const viewportPanel = document.getElementById('viewport-panel');
    const statsPanel = document.getElementById('stats-panel');
    const detailsPanel = document.getElementById('details-panel');

    if (viewportPanel) viewportPanel.style.height = `${this.viewportHeight}px`;
    if (statsPanel) statsPanel.style.height = `${this.statsHeight}px`;
    if (detailsPanel) detailsPanel.style.flex = "1"; // Details takes remaining space

    // During drag, we only want to update the graph canvas (cheap)
    // But if resizing viewport, we need to update the 3D canvas too
    const resizeViewport = this.currentResizer === 'viewport' || this.currentResizer === 'stats';
    this.resizeAll(resizeViewport);
  }

  /**
   * Toggle a panel's visibility
   */
  togglePanel(panelId) {
    if (panelId === 'palette-panel' || panelId === 'left-panel') {
      this.panels.left = !this.panels.left;
    } else if (panelId === 'details-panel' || panelId === 'right-panel') {
      this.panels.right = !this.panels.right;
    } else if (panelId === 'bottom-strip') {
      this.panels.bottom = !this.panels.bottom;
    }
    
    this.updateLayout();
    this.app.updateStatus(`Toggled ${panelId}`);
  }
}
