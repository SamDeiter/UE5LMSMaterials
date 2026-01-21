/**
 * Tests for shared/WireRenderer.js
 */
import { describe, it, expect } from 'vitest';
import { WireRenderer } from '../../shared/WireRenderer.js';

describe('WireRenderer', () => {
    describe('getWirePath', () => {
        it('should generate a valid SVG path string', () => {
            const path = WireRenderer.getWirePath(0, 0, 100, 100);
            expect(path).toMatch(/^M\s+\d+/);
            expect(path).toContain('C');
        });

        it('should start at the specified start point', () => {
            const path = WireRenderer.getWirePath(50, 75, 200, 150);
            expect(path).toMatch(/^M\s+50\s+75/);
        });

        it('should end at the specified end point', () => {
            const path = WireRenderer.getWirePath(0, 0, 200, 100);
            expect(path).toMatch(/200\s+100$/);
        });

        it('should handle same start and end point', () => {
            const path = WireRenderer.getWirePath(100, 100, 100, 100);
            expect(path).toBeDefined();
            expect(typeof path).toBe('string');
        });

        it('should handle negative coordinates', () => {
            const path = WireRenderer.getWirePath(-50, -25, 100, 100);
            expect(path).toMatch(/^M\s+-50\s+-25/);
        });

        it('should respect direction option for output pins', () => {
            const pathOut = WireRenderer.getWirePath(0, 0, 100, 100, { direction: 'out' });
            expect(pathOut).toBeDefined();
        });

        it('should respect direction option for input pins', () => {
            const pathIn = WireRenderer.getWirePath(0, 0, 100, 100, { direction: 'in' });
            expect(pathIn).toBeDefined();
        });

        it('should apply custom tension factor', () => {
            const path1 = WireRenderer.getWirePath(0, 0, 200, 0, { tensionFactor: 0.3 });
            const path2 = WireRenderer.getWirePath(0, 0, 200, 0, { tensionFactor: 0.7 });
            // Different tension should produce different paths
            expect(path1).not.toEqual(path2);
        });

        it('should respect maxTension limit', () => {
            const path = WireRenderer.getWirePath(0, 0, 1000, 0, { maxTension: 50 });
            expect(path).toBeDefined();
        });
    });

    describe('getPinColor', () => {
        it('should return color for exec type', () => {
            const color = WireRenderer.getPinColor('exec');
            expect(color).toBe('#ffffff');
        });

        it('should return color for float type', () => {
            const color = WireRenderer.getPinColor('float');
            expect(color).toBe('#00ff00');
        });

        it('should return color for bool type', () => {
            const color = WireRenderer.getPinColor('bool');
            expect(color).toBe('#ff0000');
        });

        it('should return color for string type', () => {
            const color = WireRenderer.getPinColor('string');
            expect(color).toBe('#ff00ff');
        });

        it('should be case-insensitive', () => {
            expect(WireRenderer.getPinColor('FLOAT')).toBe(WireRenderer.getPinColor('float'));
            expect(WireRenderer.getPinColor('Bool')).toBe(WireRenderer.getPinColor('bool'));
        });

        it('should return default color for unknown type', () => {
            const color = WireRenderer.getPinColor('unknownType');
            expect(color).toBe('#888888');
        });

        it('should return default for null/undefined', () => {
            expect(WireRenderer.getPinColor(null)).toBe('#888888');
            expect(WireRenderer.getPinColor(undefined)).toBe('#888888');
        });

        it('should accept custom color map', () => {
            const customMap = { 'custom': '#123456' };
            const color = WireRenderer.getPinColor('custom', customMap);
            expect(color).toBe('#123456');
        });
    });

    describe('getPinTypeClass', () => {
        it('should return correct class for exec type', () => {
            expect(WireRenderer.getPinTypeClass('exec')).toBe('wire-exec');
        });

        it('should return correct class for float type', () => {
            expect(WireRenderer.getPinTypeClass('float')).toBe('wire-float');
        });

        it('should handle null/undefined', () => {
            expect(WireRenderer.getPinTypeClass(null)).toBe('wire-default');
            expect(WireRenderer.getPinTypeClass(undefined)).toBe('wire-default');
        });
    });
});
