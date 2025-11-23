
import os

file_path = r'c:\Users\Sam Deiter\Desktop\UE5LMSBlueprint-main\graph.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the start of the corrupted section
start_marker = "    updateVariableNodes(oldName, newName) {"
# Define the end of the corrupted section (start of the next method)
end_marker = "selectNode(nodeId, addToSelection = false, mode = 'toggle') {"

# Find indices
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers.")
    print(f"Start found: {start_idx != -1}")
    print(f"End found: {end_idx != -1}")
    exit(1)

# The correct code to insert
correct_code = """    updateVariableNodes(oldName, newName) {
        const getKey = `Get_${oldName}`;
        const setKey = `Set_${oldName}`;
        for (const node of this.nodes.values()) {
            if (node.nodeKey === getKey || node.nodeKey === setKey) {
                const newKey = node.nodeKey === getKey ? `Get_${newName}` : `Set_${newName}`;
                node.nodeKey = newKey;

                // Use the robust sync method to update visual and data state
                this.synchronizeNodeWithTemplate(node);
            }
        }
    }

    /**
     * Synchronizes a node instance with its template definition from the NodeRegistry.
     * Updates the node's title, pins, and preserves existing connections and literal values.
     * @param {Node} node - The node instance to synchronize.
     */
    synchronizeNodeWithTemplate(node) {
        const template = nodeRegistry.get(node.nodeKey);
        if (!template) return;

        node.title = template.title;

        // Preserve old pins to keep connections valid
        const oldPinsMap = new Map(node.pins.map(p => [p.id, p]));

        node.pins = template.pins.map(p => {
            const newPin = new Pin(node, p);
            const fullPinId = `${node.id}-${p.id}`;
            const oldPin = oldPinsMap.get(fullPinId);
            if (oldPin) {
                newPin.links = oldPin.links;
                newPin.defaultValue = oldPin.defaultValue;
                node.pinLiterals.set(newPin.id, node.pinLiterals.get(oldPin.id));
                newPin.links.forEach(linkId => {
                    const link = this.app.wiring.links.get(linkId);
                    if (link) {
                        if (link.startPin === oldPin) link.startPin = newPin;
                        if (link.endPin === oldPin) link.endPin = newPin;
                    }
                });
            }
            return newPin;
        });

        node.refreshPinCache();
        this.app.wiring.updateVisuals(node);
        this.redrawNodeWires(node.id);
    }

    """

# Construct new content
# We need to be careful about indentation of selectNode. 
# The end_marker matches "selectNode...", but we need to ensure we keep the indentation correct for it.
# In the file, it seems to be indented. We should probably just replace up to the line before it.

# Let's find the last closing brace before selectNode in the corrupted text? 
# No, the corrupted text is missing braces.

# We will replace from start_idx to end_idx.
# But we need to check what is exactly before end_marker in the file.
# The end_marker search string doesn't include indentation.
# Let's adjust end_idx to include the indentation before it if possible, or just append the correct indentation.

# Actually, let's look at the file content around end_idx to see indentation.
subset = content[end_idx-20:end_idx+20]
print(f"Context around end match: {repr(subset)}")

# The replacement should end with indentation for selectNode.
# selectNode is a method of GraphController, so it should be indented by 4 spaces.

new_content = content[:start_idx] + correct_code + "    " + content[end_idx:].lstrip()

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully fixed graph.js corruption.")
