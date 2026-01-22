/**
 * LayoutController.js
 * 
 * Handles resizable panels for the Material Editor.
 * Enables dragging the blue resizer bars between panels.
 */

export class LayoutController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('main-content');
    this.resizerLeft = document.getElementById('resizer-left');
    this.resizerRight = document.getElementById('resizer-right');

    // Initial sizes (matching CSS defaults)
    this.leftWidth = 320; // var(--sidebar-width)
    this.rightWidth = 250; // From #right-column width

    this.isResizing = false;
    this.currentResizer = null;
    this.startX = 0;
    this.startSize = 0;

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
      this.leftWidth = Math.max(200, Math.min(500, this.startSize + delta));
    } else if (this.currentResizer === 'right') {
      const delta = this.startX - e.clientX; // Drag left increases width
      this.rightWidth = Math.max(200, Math.min(500, this.startSize + delta));
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
    const leftCol = document.getElementById('left-column');
    const rightCol = document.getElementById('right-column');

    if (leftCol) {
      leftCol.style.width = `${this.leftWidth}px`;
    }
    if (rightCol) {
      rightCol.style.width = `${this.rightWidth}px`;
    }
  }
}
