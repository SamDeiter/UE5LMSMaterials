import re

# Read the file
with open('graph.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace import statement
content = content.replace(
    "import { Utils, NodeLibrary } from './utils.js';",
    "import { Utils } from './utils.js';\nimport { nodeRegistry } from './registries/NodeRegistry.js';"
)

# Replace NodeLibrary[nodeData.nodeKey] with nodeRegistry.get(nodeData.nodeKey)
content = re.sub(r'NodeLibrary\[([^\]]+)\]', r'nodeRegistry.get(\1)', content)

# Replace the warning message
content = content.replace('not found in NodeLibrary', 'not found in NodeRegistry')

# Write back
with open('graph.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed graph.js!")
