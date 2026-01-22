/**
 * WireRenderer - Shared bezier curve path generation for node graph wires.
 * Used by both Blueprint and Material editors.
 */

/**
 * Generates SVG bezier curve paths for node connections.
 */
export class WireRenderer {
    /**
     * Generates a bezier curve path string for a wire connection.
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate  
     * @param {number} endX - Ending X coordinate
     * @param {number} endY - Ending Y coordinate
     * @param {Object} options - Optional configuration
     * @param {string} options.direction - 'out' for output pin start (default), 'in' for input
     * @param {number} options.tensionFactor - Curve tension multiplier (default 0.5)
     * @param {number} options.maxTension - Maximum tension value (default 100)
     * @returns {string} SVG path string
     */
    static getWirePath(startX, startY, endX, endY, options = {}) {
        const {
            direction = 'out',
            tensionFactor = 0.5,
            maxTension = 100,
            minTension = 30
        } = options;

        const dx = endX - startX;
        const dy = Math.abs(endY - startY);
        const absDx = Math.abs(dx);
        
        // UE5-style tension: tighter curves for short horizontal distances
        // More relaxed curves for longer distances
        let tension = Math.min(absDx * tensionFactor, maxTension);
        tension = Math.max(tension, minTension);
        
        // For backwards connections (output to left of input), use S-curve
        if (dx < 0) {
            // Tighter S-curve for backwards wires
            const sCurveTension = Math.max(50, Math.min(dy * 0.5 + absDx * 0.3, 150));
            if (direction === 'out') {
                return `M ${startX} ${startY} C ${startX + sCurveTension} ${startY}, ${endX - sCurveTension} ${endY}, ${endX} ${endY}`;
            } else {
                return `M ${startX} ${startY} C ${startX - sCurveTension} ${startY}, ${endX + sCurveTension} ${endY}, ${endX} ${endY}`;
            }
        }

        // Standard forward bezier curve
        if (direction === 'out') {
            return `M ${startX} ${startY} C ${startX + tension} ${startY}, ${endX - tension} ${endY}, ${endX} ${endY}`;
        } else {
            return `M ${startX} ${startY} C ${startX - tension} ${startY}, ${endX + tension} ${endY}, ${endX} ${endY}`;
        }
    }

    /**
     * Gets the color for a pin type.
     * @param {string} type - Pin type (exec, bool, int, float, string, etc.)
     * @param {Object} colorMap - Optional custom color map
     * @returns {string} CSS color string
     */
    static getPinColor(type, colorMap = null) {
        const defaultColors = {
            'exec': '#ffffff',
            'bool': '#ff0000',
            'byte': '#00ff00',
            'int': '#00ffff',
            'int64': '#a5d6f7',
            'float': '#00ff00',
            'double': '#00ff00',
            'string': '#ff00ff',
            'name': '#c8a2c8',
            'text': '#ffc0cb',
            'vector': '#ffd700',
            'vector2d': '#ffa500',
            'vector4': '#ffd700',
            'rotator': '#9370db',
            'transform': '#ff8c00',
            'object': '#0000ff',
            'class': '#800080',
            'interface': '#b8860b',
            'struct': '#00008b',
            'enum': '#008000',
            'delegate': '#ff6347',
            'wildcard': '#808080',
            // Material-specific types
            'float1': '#00ff00',
            'float2': '#32cd32',
            'float3': '#ffd700',
            'float4': '#ff69b4',
            'texture2d': '#ff4500',
            'texturecube': '#ff6347',
            'material': '#4169e1'
        };

        const colors = colorMap || defaultColors;
        return colors[type?.toLowerCase()] || '#888888';
    }

    /**
     * Gets the CSS class for a pin type (for wire styling).
     * @param {string} type - Pin type
     * @returns {string} CSS class name
     */
    static getPinTypeClass(type) {
        return `wire-${type?.toLowerCase() || 'default'}`;
    }
}
