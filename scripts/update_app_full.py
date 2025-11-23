import re

# Read the file
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Imports
if "import { TaskManager }" not in content:
    content = content.replace(
        "import { BlueprintValidator, SAMPLE_TASK } from './validator.js';",
        "import { BlueprintValidator, SAMPLE_TASK } from './validator.js';\nimport { TaskManager } from './TaskManager.js';\nimport { nodeRegistry } from './registries/NodeRegistry.js';\nimport { NodeDefinitions } from './data/NodeDefinitions.js';"
    )

if "TaskController" not in content:
    content = content.replace(
        "import { VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController, LayoutController } from './ui.js';",
        "import { VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController, LayoutController, TaskController } from './ui.js';"
    )

# 2. Add Node Registration
if "nodeRegistry.registerBatch" not in content:
    content = content.replace(
        "        // Expose for inline events (onclick)\n        window.app = BlueprintApp;",
        "        // Expose for inline events (onclick)\n        window.app = BlueprintApp;\n\n        // Register Node Definitions\n        nodeRegistry.registerBatch(NodeDefinitions);"
    )

# 3. Add TaskManager and TaskUI Initialization
validator_block = """        // 5. Blueprint Validator
        BlueprintApp.validator = new BlueprintValidator(BlueprintApp);
        window.validateSampleTask = () => BlueprintApp.validator.validateTask(SAMPLE_TASK);"""

task_system_block = """        // 5. Blueprint Validator
        BlueprintApp.validator = new BlueprintValidator(BlueprintApp);
        window.validateSampleTask = () => BlueprintApp.validator.validateTask(SAMPLE_TASK);

        // 6. Task Manager
        BlueprintApp.taskManager = new TaskManager(BlueprintApp);
        window.setTask = (taskId) => BlueprintApp.taskManager.setCurrentTask(taskId);
        window.validateTask = () => BlueprintApp.taskManager.validateCurrentTask();
        window.clearTask = () => BlueprintApp.taskManager.clearTask();

        // 7. Task UI Controller
        BlueprintApp.taskUI = new TaskController(BlueprintApp);"""

if "BlueprintApp.taskManager" not in content:
    content = content.replace(validator_block, task_system_block)

# Write back
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated app.js with Task System!")
