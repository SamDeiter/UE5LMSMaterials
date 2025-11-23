/**
 * LayoutController - Handles resizable panels
 */

export class LayoutController {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('app-container');
        this.resizerLeft = document.getElementById('resizer-left');
        this.resizerRight = document.getElementById('resizer-right');
        this.resizerBottom = document.getElementById('resizer-bottom');

        // Initial sizes (matching CSS defaults)
        this.leftWidth = 280;
        this.rightWidth = 400;
        this.bottomHeight = 200;

        this.isResizing = false;
        this.currentResizer = null;
        this.startX = 0;
        this.startY = 0;
        this.startSize = 0;

        this.initResizers();
        this.initDetailsResizer();
    }

    initResizers() {
        const attach = (resizer, type) => {
            resizer.addEventListener('mousedown', (e) => {
                this.isResizing = true;
                this.currentResizer = type;
                this.startX = e.clientX;
                this.startY = e.clientY;

                if (type === 'left') this.startSize = this.leftWidth;
                if (type === 'right') this.startSize = this.rightWidth;
                if (type === 'bottom') this.startSize = this.bottomHeight;

                document.body.style.cursor = type === 'bottom' ? 'row-resize' : 'col-resize';
                e.preventDefault();
            });
        };

        attach(this.resizerLeft, 'left');
        attach(this.resizerRight, 'right');
        attach(this.resizerBottom, 'bottom');

        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;

        if (this.currentResizer === 'left') {
            const delta = e.clientX - this.startX;
            this.leftWidth = Math.max(150, this.startSize + delta); // Min width 150
        }
        else if (this.currentResizer === 'right') {
            const delta = this.startX - e.clientX; // Drag left increases width
            this.rightWidth = Math.max(150, this.startSize + delta);
        }
        else if (this.currentResizer === 'bottom') {
            const delta = this.startY - e.clientY; // Drag up increases height
            this.bottomHeight = Math.max(100, this.startSize + delta);
        }

        this.updateLayout();
    }

    handleMouseUp() {
        this.isResizing = false;
        this.currentResizer = null;
        document.body.style.cursor = '';
        // Optional: Trigger canvas resize on graph grid
        if (this.app.grid) this.app.grid.resize();
    }

    updateLayout() {
        // Update CSS Grid Template Columns and Rows based on new pixel values
        // Columns: Left | Resizer | Graph | Resizer | Right
        this.container.style.gridTemplateColumns = `${this.leftWidth}px 4px 1fr 4px ${this.rightWidth}px`;

        // Rows: Menu | Tab | Toolbar | Graph | Resizer | Bottom
        this.container.style.gridTemplateRows = `32px 28px 44px 1fr 4px ${this.bottomHeight}px`;
    }

    initDetailsResizer() {
        const panel = document.getElementById('details-panel');
        let isResizing = false;
        let startX = 0;
        let startWidth = 140;

        // We'll attach the event listener to the panel itself to catch events on the labels
        panel.addEventListener('mousedown', (e) => {
            // Check if we are clicking near the border of a label
            // The label is the first child of .detail-row or .detail-checkbox-row
            const row = e.target.closest('.detail-row, .detail-checkbox-row');
            if (!row) return;

            const label = row.querySelector('label');
            if (!label) return;

            const rect = label.getBoundingClientRect();
            // Check if click is within 15px of the right edge for easier grabbing
            if (Math.abs(e.clientX - rect.right) < 15) {
                isResizing = true;
                startX = e.clientX;
                // Get current width from CSS variable or computed style
                const rootStyle = getComputedStyle(document.documentElement);
                const currentVal = rootStyle.getPropertyValue('--details-label-width').trim();
                startWidth = parseInt(currentVal, 10) || 140;

                document.body.style.cursor = 'col-resize';
                e.preventDefault();
                e.stopPropagation(); // Prevent text selection
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const delta = e.clientX - startX;
            const newWidth = Math.max(140, Math.min(300, startWidth + delta)); // Clamp width between 140px and 300px

            document.documentElement.style.setProperty('--details-label-width', `${newWidth}px`);
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    }
}
