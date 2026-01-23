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
    this.container = document.getElementById('app-container'); // Correct container for grid
    this.resizerLeft = document.getElementById('resizer-left');
    this.resizerRight = document.getElementById('resizer-right');

    // Initial sizes from constants
    this.leftWidth = LAYOUT.DEFAULT_SIDEBAR_WIDTH;
    this.rightWidth = LAYOUT.DEFAULT_DETAILS_WIDTH;

    this.isResizing = false;
    this.currentResizer = null;
    this.startX = 0;
    this.startSize = 0;

    // Visibility state
    this.panels = {
      left: true,
      right: true,
      bottom: true
    };

    this.initResizers();
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

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });
    };

    if (this.resizerLeft) attach(this.resizerLeft, 'left');
    if (this.resizerRight) attach(this.resizerRight, 'right');

    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  handleMouseMove(e) {
    if (!this.isResizing) return;

    if (this.currentResizer === 'left') {
      const delta = e.clientX - this.startX;
      this.leftWidth = Math.max(LAYOUT.MIN_PANEL_WIDTH, Math.min(LAYOUT.MAX_PANEL_WIDTH, this.startSize + delta));
    } else if (this.currentResizer === 'right') {
      const delta = this.startX - e.clientX; // Drag left increases width
      this.rightWidth = Math.max(LAYOUT.MIN_PANEL_WIDTH, Math.min(LAYOUT.MAX_PANEL_WIDTH, this.startSize + delta));
    }

    this.updateLayout();
  }

  handleMouseUp() {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    this.currentResizer = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Trigger viewport resize
    if (this.app && this.app.viewport) {
      this.app.viewport.resize();
    }
  }

  updateLayout() {
    const leftCol = document.getElementById('left-panel');
    const rightCol = document.getElementById('right-panel');
    const bottomCol = document.getElementById('bottom-strip');
    const resizerL = this.resizerLeft;
    const resizerR = this.resizerRight;
    const resizerB = document.getElementById('resizer-bottom');

    // Update column grid template
    const lWidth = this.panels.left ? `${this.leftWidth}px` : "0px";
    const lResizer = this.panels.left ? "4px" : "0px";
    const rWidth = this.panels.right ? `${this.rightWidth}px` : "0px";
    const rResizer = this.panels.right ? "4px" : "0px";

    this.container.style.gridTemplateColumns = `${lWidth} ${lResizer} 1fr ${rResizer} ${rWidth}`;

    // Update visibility class for panels
    if (leftCol) leftCol.style.display = this.panels.left ? 'flex' : 'none';
    if (rightCol) rightCol.style.display = this.panels.right ? 'flex' : 'none';
    
    // Resizers visibility
    if (resizerL) resizerL.style.display = this.panels.left ? 'block' : 'none';
    if (resizerR) resizerR.style.display = this.panels.right ? 'block' : 'none';

    // Trigger viewport resize
    if (this.app && this.app.viewport) {
      this.app.viewport.resize();
    }
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
