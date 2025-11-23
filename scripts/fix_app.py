import re

# Read the file
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports after the last import line
import_insert = """import { nodeRegistry } from './registries/NodeRegistry.js';
import { NodeDefinitions } from './data/NodeDefinitions.js';
"""

content = content.replace(
    "import { BlueprintValidator, SAMPLE_TASK } from './validator.js';",
    f"import {{ BlueprintValidator, SAMPLE_TASK }} from './validator.js';\n{import_insert}"
)

# Add registration after window.app = BlueprintApp;
registration = """
        // Register Node Definitions
        nodeRegistry.registerBatch(NodeDefinitions);
"""

content = content.replace(
    "window.app = BlueprintApp;\n\n        // --- Controller Initialization (Order is Crucial) ---",
    f"window.app = BlueprintApp;{registration}\n        // --- Controller Initialization (Order is Crucial) ---"
)

# Write back
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed app.js!")
