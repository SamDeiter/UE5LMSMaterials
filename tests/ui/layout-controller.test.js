/**
 * tests/ui/layout-controller.test.js
 * 
 * Tests for LayoutController - handles resizable panels.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LayoutController } from "../../material/ui/LayoutController.js";

// Mock DOM
function setupMockDOM() {
  const elements = {
    'main-content': { style: { display: '', gridTemplateColumns: '' } },
    'left-column': { style: { display: '' } },
    'right-column': { style: { display: '' } },
    'resizer-left': { addEventListener: vi.fn(), style: { display: '' } },
    'resizer-right': { addEventListener: vi.fn(), style: { display: '' } },
    'resizer-viewport': { addEventListener: vi.fn(), style: { display: '' } },
    'resizer-stats': { addEventListener: vi.fn(), style: { display: '' } },
    'viewport-panel': { style: { height: '' } },
    'stats-panel': { style: { height: '' } },
    'details-panel': { style: { flex: '' } }
  };

  global.document = {
    getElementById: vi.fn((id) => elements[id] || null),
    addEventListener: vi.fn(),
    body: { style: { cursor: '', userSelect: '' } }
  };

  global.window = {
    addEventListener: vi.fn()
  };

  // Mock requestAnimationFrame for headless testing
  global.requestAnimationFrame = vi.fn((cb) => {
    cb();
    return 1;
  });

  return elements;
}

describe("LayoutController", () => {
  let controller;
  let mockApp;
  let elements;

  beforeEach(() => {
    elements = setupMockDOM();
    mockApp = {
      graph: { resize: vi.fn() },
      viewport: { resize: vi.fn() },
      updateStatus: vi.fn()
    };
    controller = new LayoutController(mockApp);
  });

  describe("Initialization", () => {
    it("should initialize with default panel widths", () => {
      expect(controller.leftWidth).toBeGreaterThan(0);
      expect(controller.rightWidth).toBeGreaterThan(0);
    });

    it("should initialize with default viewport height", () => {
      expect(controller.viewportHeight).toBe(400);
    });

    it("should initialize both panels as visible", () => {
      expect(controller.panels.left).toBe(true);
      expect(controller.panels.right).toBe(true);
    });

    it("should attach resize listeners to resizers", () => {
      expect(elements['resizer-left'].addEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );
      expect(elements['resizer-right'].addEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );
    });
  });

  describe("Panel Visibility", () => {
    it("should toggle left panel visibility", () => {
      controller.togglePanel('left-panel');
      expect(controller.panels.left).toBe(false);

      controller.togglePanel('left-panel');
      expect(controller.panels.left).toBe(true);
    });

    it("should toggle right panel visibility", () => {
      controller.togglePanel('right-panel');
      expect(controller.panels.right).toBe(false);
    });

    it("should support palette-panel alias for left", () => {
      controller.togglePanel('palette-panel');
      expect(controller.panels.left).toBe(false);
    });

    it("should support details-panel alias for right", () => {
      controller.togglePanel('details-panel');
      expect(controller.panels.right).toBe(false);
    });

    it("should update status after toggle", () => {
      controller.togglePanel('left-panel');
      expect(mockApp.updateStatus).toHaveBeenCalledWith('Toggled left-panel');
    });
  });

  describe("Resize Handling", () => {
    it("should not be resizing initially", () => {
      expect(controller.isResizing).toBe(false);
    });

    it("should track left panel width changes", () => {
      controller.leftWidth = 250;
      controller.updateLayout();

      expect(elements['main-content'].style.gridTemplateColumns).toContain('250px');
    });

    it("should track right panel width changes", () => {
      controller.rightWidth = 280;
      controller.updateLayout();

      expect(elements['main-content'].style.gridTemplateColumns).toContain('280px');
    });

    it("should set viewport panel height", () => {
      controller.viewportHeight = 500;
      controller.updateLayout();

      expect(elements['viewport-panel'].style.height).toBe('500px');
    });

    it("should set stats panel height", () => {
      controller.statsHeight = 120;
      controller.updateLayout();

      expect(elements['stats-panel'].style.height).toBe('120px');
    });
  });

  describe("Mouse Handling", () => {
    it("should handle left resizer mouse move", () => {
      controller.isResizing = true;
      controller.currentResizer = 'left';
      controller.startX = 200;
      controller.startSize = 250;

      controller.handleMouseMove({ clientX: 250, clientY: 0 });

      expect(controller.leftWidth).toBe(300); // 250 + (250-200)
    });

    it("should handle right resizer mouse move", () => {
      controller.isResizing = true;
      controller.currentResizer = 'right';
      controller.startX = 800;
      controller.startSize = 250;

      controller.handleMouseMove({ clientX: 750, clientY: 0 });

      expect(controller.rightWidth).toBe(300); // 250 + (800-750)
    });

    it("should handle viewport resizer mouse move", () => {
      controller.isResizing = true;
      controller.currentResizer = 'viewport';
      controller.startY = 400;
      controller.startSize = 400;

      controller.handleMouseMove({ clientX: 0, clientY: 450 });

      expect(controller.viewportHeight).toBe(450); // 400 + (450-400)
    });

    it("should enforce minimum panel width", () => {
      controller.isResizing = true;
      controller.currentResizer = 'left';
      controller.startX = 200;
      controller.startSize = 250;

      controller.handleMouseMove({ clientX: 0, clientY: 0 }); // Move far left

      expect(controller.leftWidth).toBeGreaterThanOrEqual(150); // MIN_PANEL_WIDTH
    });

    it("should enforce minimum viewport height", () => {
      controller.isResizing = true;
      controller.currentResizer = 'viewport';
      controller.startY = 400;
      controller.startSize = 400;

      controller.handleMouseMove({ clientX: 0, clientY: 0 }); // Move to top

      expect(controller.viewportHeight).toBeGreaterThanOrEqual(100);
    });

    it("should reset resize state on mouse up", () => {
      controller.isResizing = true;
      controller.currentResizer = 'left';

      controller.handleMouseUp();

      expect(controller.isResizing).toBe(false);
      expect(controller.currentResizer).toBeNull();
    });
  });

  describe("Layout Update", () => {
    it("should hide left column when panel is hidden", () => {
      controller.panels.left = false;
      controller.updateLayout();

      expect(elements['left-column'].style.display).toBe('none');
    });

    it("should hide right column when panel is hidden", () => {
      controller.panels.right = false;
      controller.updateLayout();

      expect(elements['right-column'].style.display).toBe('none');
    });

    it("should hide resizerswhen panel is hidden", () => {
      controller.panels.left = false;
      controller.updateLayout();

      expect(elements['resizer-left'].style.display).toBe('none');
    });

    it("should use flex grid template", () => {
      controller.updateLayout();

      expect(elements['main-content'].style.display).toBe('grid');
    });
  });
});
