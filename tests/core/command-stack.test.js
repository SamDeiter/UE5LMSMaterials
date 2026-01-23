/**
 * tests/core/command-stack.test.js
 * 
 * Tests for CommandStack - manages undo/redo history.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandStack } from "../../material/core/CommandStack.js";

// Mock DOM
function setupMockDOM() {
  global.document = {
    getElementById: vi.fn().mockReturnValue({
      classList: { toggle: vi.fn() },
      style: { opacity: '1' }
    })
  };
}

// Mock command
function createMockCommand() {
  return {
    execute: vi.fn(),
    undo: vi.fn()
  };
}

describe("CommandStack", () => {
  let stack;
  let mockApp;

  beforeEach(() => {
    setupMockDOM();
    mockApp = {
      updateStatus: vi.fn()
    };
    stack = new CommandStack(mockApp, 50);
  });

  describe("Initialization", () => {
    it("should start with empty undo stack", () => {
      expect(stack.undoStack).toEqual([]);
    });

    it("should start with empty redo stack", () => {
      expect(stack.redoStack).toEqual([]);
    });

    it("should use provided max history", () => {
      expect(stack.maxHistory).toBe(50);
    });
  });

  describe("Execute", () => {
    it("should execute command", () => {
      const command = createMockCommand();
      stack.execute(command);
      expect(command.execute).toHaveBeenCalled();
    });

    it("should add command to undo stack", () => {
      const command = createMockCommand();
      stack.execute(command);
      expect(stack.undoStack).toHaveLength(1);
    });

    it("should clear redo stack on new command", () => {
      const cmd1 = createMockCommand();
      const cmd2 = createMockCommand();
      
      stack.execute(cmd1);
      stack.undo();
      expect(stack.redoStack).toHaveLength(1);
      
      stack.execute(cmd2);
      expect(stack.redoStack).toHaveLength(0);
    });

    it("should reject invalid commands", () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      stack.execute(null);
      stack.execute({});
      stack.execute({ execute: 'not a function' });
      
      expect(stack.undoStack).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it("should limit history to max", () => {
      const smallStack = new CommandStack(mockApp, 3);
      
      smallStack.execute(createMockCommand());
      smallStack.execute(createMockCommand());
      smallStack.execute(createMockCommand());
      smallStack.execute(createMockCommand());
      
      expect(smallStack.undoStack).toHaveLength(3);
    });

    it("should handle command execution errors", () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingCommand = {
        execute: vi.fn().mockImplementation(() => { throw new Error('fail'); }),
        undo: vi.fn()
      };
      
      stack.execute(failingCommand);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Undo", () => {
    it("should call undo on command", () => {
      const command = createMockCommand();
      stack.execute(command);
      stack.undo();
      
      expect(command.undo).toHaveBeenCalled();
    });

    it("should move command to redo stack", () => {
      const command = createMockCommand();
      stack.execute(command);
      stack.undo();
      
      expect(stack.undoStack).toHaveLength(0);
      expect(stack.redoStack).toHaveLength(1);
    });

    it("should do nothing when undo stack is empty", () => {
      stack.undo();
      expect(stack.redoStack).toHaveLength(0);
    });

    it("should undo multiple commands in reverse order", () => {
      const order = [];
      const cmd1 = {
        execute: vi.fn(),
        undo: vi.fn(() => order.push('cmd1'))
      };
      const cmd2 = {
        execute: vi.fn(),
        undo: vi.fn(() => order.push('cmd2'))
      };
      
      stack.execute(cmd1);
      stack.execute(cmd2);
      stack.undo();
      stack.undo();
      
      expect(order).toEqual(['cmd2', 'cmd1']);
    });
  });

  describe("Redo", () => {
    it("should re-execute command", () => {
      const command = createMockCommand();
      stack.execute(command);
      stack.undo();
      stack.redo();
      
      expect(command.execute).toHaveBeenCalledTimes(2);
    });

    it("should move command back to undo stack", () => {
      const command = createMockCommand();
      stack.execute(command);
      stack.undo();
      stack.redo();
      
      expect(stack.undoStack).toHaveLength(1);
      expect(stack.redoStack).toHaveLength(0);
    });

    it("should do nothing when redo stack is empty", () => {
      stack.redo();
      expect(stack.undoStack).toHaveLength(0);
    });

    it("should redo multiple commands in order", () => {
      const order = [];
      const cmd1 = {
        execute: vi.fn(() => order.push('cmd1')),
        undo: vi.fn()
      };
      const cmd2 = {
        execute: vi.fn(() => order.push('cmd2')),
        undo: vi.fn()
      };
      
      stack.execute(cmd1);
      stack.execute(cmd2);
      stack.undo();
      stack.undo();
      order.length = 0; // Clear initial executions
      
      stack.redo();
      stack.redo();
      
      expect(order).toEqual(['cmd1', 'cmd2']);
    });
  });

  describe("Clear", () => {
    it("should clear both stacks", () => {
      stack.execute(createMockCommand());
      stack.execute(createMockCommand());
      stack.undo();
      
      stack.clear();
      
      expect(stack.undoStack).toHaveLength(0);
      expect(stack.redoStack).toHaveLength(0);
    });
  });

  describe("UI Updates", () => {
    it("should update UI after execute", () => {
      stack.execute(createMockCommand());
      expect(document.getElementById).toHaveBeenCalledWith('undo-btn');
      expect(document.getElementById).toHaveBeenCalledWith('redo-btn');
    });

    it("should update UI after undo", () => {
      stack.execute(createMockCommand());
      vi.clearAllMocks();
      setupMockDOM();
      
      stack.undo();
      expect(document.getElementById).toHaveBeenCalled();
    });

    it("should update UI after redo", () => {
      stack.execute(createMockCommand());
      stack.undo();
      vi.clearAllMocks();
      setupMockDOM();
      
      stack.redo();
      expect(document.getElementById).toHaveBeenCalled();
    });

    it("should update UI after clear", () => {
      stack.execute(createMockCommand());
      vi.clearAllMocks();
      setupMockDOM();
      
      stack.clear();
      expect(document.getElementById).toHaveBeenCalled();
    });
  });
});
