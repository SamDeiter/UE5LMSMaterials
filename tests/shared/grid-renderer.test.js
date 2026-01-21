/**
 * Tests for shared/GridRenderer.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GridRenderer } from '../../shared/GridRenderer.js';

describe('GridRenderer', () => {
    let mockCtx;

    beforeEach(() => {
        // Create a mock canvas context
        mockCtx = {
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn()
        };
    });

    describe('draw', () => {
        it('should fill background with backgroundColor', () => {
            GridRenderer.draw(mockCtx, 800, 600, {}, { backgroundColor: '#222222' });
            expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
        });

        it('should draw with default options when none provided', () => {
            GridRenderer.draw(mockCtx, 800, 600);
            expect(mockCtx.fillRect).toHaveBeenCalled();
            expect(mockCtx.stroke).toHaveBeenCalled();
        });

        it('should draw grid lines', () => {
            GridRenderer.draw(mockCtx, 800, 600);
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.moveTo).toHaveBeenCalled();
            expect(mockCtx.lineTo).toHaveBeenCalled();
        });

        it('should respect pan transform', () => {
            GridRenderer.draw(mockCtx, 800, 600, { panX: 100, panY: 50 });
            expect(mockCtx.stroke).toHaveBeenCalled();
        });

        it('should respect zoom transform', () => {
            GridRenderer.draw(mockCtx, 800, 600, { zoom: 2.0 });
            expect(mockCtx.stroke).toHaveBeenCalled();
        });

        it('should apply custom grid colors', () => {
            GridRenderer.draw(mockCtx, 800, 600, {}, {
                minorGridColor: '#333333',
                majorGridColor: '#444444'
            });
            expect(mockCtx.stroke).toHaveBeenCalled();
        });

        it('should apply custom grid size', () => {
            GridRenderer.draw(mockCtx, 800, 600, {}, {
                minorGridSize: 20,
                majorGridMultiplier: 5
            });
            expect(mockCtx.stroke).toHaveBeenCalled();
        });
    });

    describe('drawFallback', () => {
        it('should fill background only', () => {
            GridRenderer.drawFallback(mockCtx, 800, 600);
            expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
        });

        it('should use default background color', () => {
            GridRenderer.drawFallback(mockCtx, 800, 600);
            expect(mockCtx.fillStyle).toBe('#222222');
        });

        it('should use custom background color when provided', () => {
            GridRenderer.drawFallback(mockCtx, 800, 600, '#111111');
            expect(mockCtx.fillStyle).toBe('#111111');
        });

        it('should not draw any lines', () => {
            GridRenderer.drawFallback(mockCtx, 800, 600);
            expect(mockCtx.beginPath).not.toHaveBeenCalled();
            expect(mockCtx.stroke).not.toHaveBeenCalled();
        });
    });
});
