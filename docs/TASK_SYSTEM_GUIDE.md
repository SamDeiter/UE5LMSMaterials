# Task System - Quick Start Guide

## 1. Overview
We have implemented a Task System that guides users through learning Blueprint concepts.
Users can select tasks, see requirements, and validate their solutions.

## 2. How to Use the Task System (UI)

### Step 1: Select a Task
1.  Look at the **Top Toolbar**.
2.  Find the **Task Selector** dropdown (next to the Undo/Redo buttons).
3.  Select a task (e.g., **"Level 1: Health Initialization"**).

### Step 2: View Requirements
1.  Once a task is selected, the **Bottom Panel** will automatically switch to the **"Task Status"** tab.
2.  You will see a list of requirements (e.g., "Create a Float variable named 'Health'").
3.  Uncompleted requirements are shown with a generic circle icon.

### Step 3: Build the Solution
1.  Follow the instructions in the Task Status panel.
2.  Add nodes, create variables, and connect pins in the Graph Editor.

### Step 4: Validate
1.  Click the **"Compile"** or **"Play"** button in the toolbar.
2.  The **Task Status** panel will update:
    *   **Green Checks**: Passed requirements.
    *   **Gray Circles**: Pending requirements.
3.  If all requirements are met, you will see a **"Task Complete!"** message.

---

## 3. Console Commands (Advanced/Debugging)

You can still use the console for debugging if needed:

- `app.taskManager.getAllTasks()`: List all available tasks.
- `setTask('taskId')`: Manually set a task by ID.
- `validateTask()`: Trigger validation manually.
- `clearTask()`: Clear the current task.
- `app.taskManager.getSummary()`: Get a JSON object with current progress.

## 4. Current Tasks

- `task_01_health`: Sample Task (Health System)
- `level1_task1`: Level 1 - Health Initialization
- `level1_task2`: Level 1 - Print Message
