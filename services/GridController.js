/**
 * GridController - Draws the background grid.
 * Extracted from services.js for code complexity reduction.
 */

/**
 * Draws the background grid on the canvas.
 */
export class GridController {
    constructor(canvas, app) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.app = app;
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas.parentElement);
        this.resize();
    }

    /** Resizes the canvas to fill its parent container. */
    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.draw();
    }

    /** Draws the background grid, respecting pan and zoom. */
    draw() {
        if (!this.app.graph || !this.app.graph.pan) {
            this.ctx.fillStyle = '#222222';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        const { pan, zoom } = this.app.graph;
        const { width, height } = this.canvas;

        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(0, 0, width, height);

        const gridSizeSmall = 10 * zoom;
        const gridSizeLarge = 100 * zoom;

        const transX = pan.x % gridSizeSmall;
        const transY = pan.y % gridSizeSmall;
        const transXLarge = pan.x % gridSizeLarge;
        const transYLarge = pan.y % gridSizeLarge;

        // Draw small grid lines
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        for (let x = transX; x < width; x += gridSizeSmall) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
        }
        for (let y = transY; y < height; y += gridSizeSmall) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
        }

        // Draw large grid lines
        this.ctx.strokeStyle = '#404040';
        this.ctx.lineWidth = 2;
        for (let x = transXLarge; x < width; x += gridSizeLarge) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
        }
        for (let y = transYLarge; y < height; y += gridSizeLarge) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
        }
    }
}
