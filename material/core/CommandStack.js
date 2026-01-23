/**
 * CommandStack.js
 * 
 * Manages the undo/redo history for the Material Editor.
 */

import { COMMAND_STACK } from "../../src/constants/EditorConstants.js";

export class CommandStack {
    constructor(app, maxHistory = COMMAND_STACK.MAX_HISTORY) {
        this.app = app;
        this.maxHistory = maxHistory;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Execute a command and add it to the undo stack
     * @param {Object} command - Command object with execute() and undo() methods
     */
    execute(command) {
        if (!command || typeof command.execute !== 'function') {
            console.error('Invalid command passed to CommandStack');
            return;
        }

        try {
            command.execute();
            this.undoStack.push(command);
            
            // Limit history
            if (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }

            // Clear redo stack on new action
            this.redoStack = [];
            
            this.updateUI();
        } catch (error) {
            console.error('Failed to execute command:', error);
        }
    }

    /**
     * Undo the last command
     */
    undo() {
        if (this.undoStack.length === 0) return;

        const command = this.undoStack.pop();
        try {
            command.undo();
            this.redoStack.push(command);
            this.updateUI();
        } catch (error) {
            console.error('Failed to undo command:', error);
        }
    }

    /**
     * Redo the last undone command
     */
    redo() {
        if (this.redoStack.length === 0) return;

        const command = this.redoStack.pop();
        try {
            command.execute();
            this.undoStack.push(command);
            this.updateUI();
        } catch (error) {
            console.error('Failed to redo command:', error);
        }
    }

    /**
     * Update toolbar button states
     */
    updateUI() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.classList.toggle('disabled', this.undoStack.length === 0);
            undoBtn.style.opacity = this.undoStack.length === 0 ? '0.5' : '1';
        }
        if (redoBtn) {
            redoBtn.classList.toggle('disabled', this.redoStack.length === 0);
            redoBtn.style.opacity = this.redoStack.length === 0 ? '0.5' : '1';
        }
    }

    /**
     * Clear the stacks (e.g., on loading a new project)
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUI();
    }
}
