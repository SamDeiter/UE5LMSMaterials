/**
 * GridController - Draws the background grid.
 * Uses shared GridRenderer for consistent rendering.
 */
import { GridRenderer } from '../../shared/GridRenderer.js';

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
        const { width, height } = this.canvas;

        if (!this.app.graph || !this.app.graph.pan) {
            GridRenderer.drawFallback(this.ctx, width, height);
            return;
        }

        const { pan, zoom } = this.app.graph;
        GridRenderer.draw(this.ctx, width, height, {
            panX: pan.x,
            panY: pan.y,
            zoom: zoom
        });
    }
}

