import re

# Step 1: Add task selector to index.html toolbar
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find the toolbar and add task selector after the help button
toolbar_addition = '''                <button id="help-btn" title="Help (F1)"><i class="fas fa-question-circle"></i> Help</button>
            </div>
            <div class="group">
                <label for="task-selector" style="color: #ccc; margin-right: 8px; font-size: 12px;">Task:</label>
                <select id="task-selector" style="background: #2a2a2a; color: #ccc; border: 1px solid #444; padding: 4px 8px; border-radius: 2px; min-width: 200px;">
                    <option value="">Select Task...</option>
                </select>
            </div>'''

html = html.replace(
    '                <button id="help-btn" title="Help (F1)"><i class="fas fa-question-circle"></i> Help</button>\r\n            </div>',
    toolbar_addition
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Added task-selector to index.html toolbar")

# Step 2: Update app.js to import and initialize TaskController
with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

# Add TaskController to imports if not present
if 'TaskController' not in app:
    app = app.replace(
        "import { VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController, LayoutController } from './ui.js';",
        "import { VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController, LayoutController, TaskController } from './ui.js';"
    )
    print("Added TaskController import")

# Add TaskManager import
if 'TaskManager' not in app:
    app = app.replace(
        "import { BlueprintValidator, SAMPLE_TASK } from './validator.js';",
        "import { BlueprintValidator, SAMPLE_TASK } from './validator.js';\nimport { TaskManager } from './TaskManager.js';"
    )
    print("Added TaskManager import")

# Add TaskManager and TaskController initialization before test runner
task_manager_init = '''
        // 6. Task Manager
        BlueprintApp.taskManager = new TaskManager(BlueprintApp);
        window.setTask = (taskId) => BlueprintApp.taskManager.setCurrentTask(taskId);
        window.validateTask = () => BlueprintApp.taskManager.validateCurrentTask();
        window.clearTask = () => BlueprintApp.taskManager.clearTask();

        // 7. Task UI Controller
        BlueprintApp.taskUI = new TaskController(BlueprintApp);

        // 4. Test Runner'''

app = app.replace(
    '        // 4. Test Runner',
    task_manager_init
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)

print("Added TaskManager and TaskController initialization to app.js")
print("\nTask UI system re-enabled! Refresh your browser.")
