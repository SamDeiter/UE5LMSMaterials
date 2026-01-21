/**
 * GridRenderer - Shared canvas grid drawing for node graph editors.
 * Used by both Blueprint and Material editors.
 */

/**
 * Renders background grids on canvas elements.
 */
export class GridRenderer {
    /**
     * Draws a background grid on a canvas.
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} transform - Pan/zoom transform { panX, panY, zoom }
     * @param {Object} options - Optional configuration
     */
    static draw(ctx, width, height, transform = {}, options = {}) {
        const {
            panX = 0,
            panY = 0,
            zoom = 1
        } = transform;

        const {
            backgroundColor = '#222222',
            minorGridColor = '#333333',
            majorGridColor = '#404040',
            minorGridSize = 10,
            majorGridMultiplier = 10,
            minorLineWidth = 1,
            majorLineWidth = 2
        } = options;

        // Draw background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        const scaledMinor = minorGridSize * zoom;
        const scaledMajor = scaledMinor * majorGridMultiplier;

        // Calculate offsets for seamless scrolling
        const minorOffsetX = panX % scaledMinor;
        const minorOffsetY = panY % scaledMinor;
        const majorOffsetX = panX % scaledMajor;
        const majorOffsetY = panY % scaledMajor;

        // Draw minor grid lines
        ctx.strokeStyle = minorGridColor;
        ctx.lineWidth = minorLineWidth;

        ctx.beginPath();
        for (let x = minorOffsetX; x < width; x += scaledMinor) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = minorOffsetY; y < height; y += scaledMinor) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Draw major grid lines
        ctx.strokeStyle = majorGridColor;
        ctx.lineWidth = majorLineWidth;

        ctx.beginPath();
        for (let x = majorOffsetX; x < width; x += scaledMajor) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = majorOffsetY; y < height; y += scaledMajor) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    /**
     * Draws a simple fallback grid (for when transform is not ready).
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} backgroundColor - Background color
     */
    static drawFallback(ctx, width, height, backgroundColor = '#222222') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }
}
