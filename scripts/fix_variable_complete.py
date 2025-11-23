import re

# Read the file
with open('ui/VariableController.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the import statement
content = content.replace(
    "import { Utils, NodeLibrary } from '../utils.js';",
    "import { Utils } from '../utils.js';\nimport { nodeRegistry } from '../registries/NodeRegistry.js';"
)

# Replace delete NodeLibrary[key] with nodeRegistry.unregister(key)
content = content.replace(
    "delete NodeLibrary[getKey];",
    "nodeRegistry.unregister(getKey);"
)
content = content.replace(
    "delete NodeLibrary[setKey];",
    "nodeRegistry.unregister(setKey);"
)

# Replace the entire updateNodeLibrary method
old_method = '''    updateNodeLibrary() {
        for (const key of Object.keys(NodeLibrary)) {
            if (key.startsWith('Get_') || key.startsWith('Set_')) {
                delete NodeLibrary[key];
            }
        }
        for (const variable of this.variables.values()) {
            const pinDefault = { defaultValue: variable.defaultValue };
            NodeLibrary[`Get_${variable.name}`] = {
                title: `Get ${variable.name}`,
                type: "pure-node",
                variableType: variable.type,
                variableId: variable.id,
                icon: "fa-arrow-down",
                pins: [
                    { id: "val_out", name: variable.name, type: variable.type, dir: "out", containerType: variable.containerType, ...pinDefault }
                ]
            };
            NodeLibrary[`Set_${variable.name}`] = {
                title: `Set ${variable.name}`,
                type: "variable-node",
                variableType: variable.type,
                variableId: variable.id,
                icon: "fa-arrow-up",
                pins: [
                    { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
                    { id: "val_in", name: variable.name, type: variable.type, dir: "in", containerType: variable.containerType, ...pinDefault },
                    { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
                    { id: "val_out", name: variable.name, type: variable.type, dir: "out", containerType: variable.containerType }
                ]
            };
        }
        this.app.palette.populateList();
    }'''

new_method = '''    updateNodeLibrary() {
        const allKeys = Object.keys(nodeRegistry.getAll());
        for (const key of allKeys) {
            if (key.startsWith('Get_') || key.startsWith('Set_')) {
                nodeRegistry.unregister(key);
            }
        }
        for (const variable of this.variables.values()) {
            const pinDefault = { defaultValue: variable.defaultValue };
            nodeRegistry.register(`Get_${variable.name}`, {
                title: `Get ${variable.name}`,
                category: 'Variables',
                type: "pure-node",
                variableType: variable.type,
                variableId: variable.id,
                icon: "fa-arrow-down",
                pins: [
                    { id: "val_out", name: variable.name, type: variable.type, dir: "out", containerType: variable.containerType, ...pinDefault }
                ]
            });
            nodeRegistry.register(`Set_${variable.name}`, {
                title: `Set ${variable.name}`,
                category: 'Variables',
                type: "variable-node",
                variableType: variable.type,
                variableId: variable.id,
                icon: "fa-arrow-up",
                pins: [
                    { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
                    { id: "val_in", name: variable.name, type: variable.type, dir: "in", containerType: variable.containerType, ...pinDefault },
                    { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
                    { id: "val_out", name: variable.name, type: variable.type, dir: "out", containerType: variable.containerType }
                ]
            });
        }
        this.app.palette.populateList();
    }'''

content = content.replace(old_method, new_method)

# Write back
with open('ui/VariableController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed VariableController.js completely!")
