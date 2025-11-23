import re

# Read graph.js
with open('graph.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Input Click (Stop Propagation)
# Find createInputWidget and the inputEl creation
if "inputEl.addEventListener('change', updateLiteral);" in content:
    content = content.replace(
        "inputEl.addEventListener('change', updateLiteral);",
        "inputEl.addEventListener('change', updateLiteral);\n        inputEl.addEventListener('mousedown', (e) => e.stopPropagation());"
    )
    print("Fixed Input Click (added stopPropagation)")

# 2. Mark Dirty on Add Node
# Look for the end of addNode function
if "this.nodesContainer.appendChild(nodeEl);\n    return node;" in content:
    content = content.replace(
        "this.nodesContainer.appendChild(nodeEl);\n    return node;",
        "this.nodesContainer.appendChild(nodeEl);\n    this.app.compiler.markDirty();\n    return node;"
    )
    print("Added markDirty to addNode")

# 3. Mark Dirty on Delete Node
# Look for autoSave in deleteSelectedNodes
if "this.app.persistence.autoSave();\n}" in content:
    # Be careful not to replace other autoSave calls if they look identical at end of function
    # We can target the specific context of deleteSelectedNodes
    # Let's use a more specific replacement for deleteSelectedNodes
    content = content.replace(
        "this.app.details.clear();\n    this.app.persistence.autoSave();\n}",
        "this.app.details.clear();\n    this.app.persistence.autoSave();\n    this.app.compiler.markDirty();\n}"
    )
    print("Added markDirty to deleteSelectedNodes")

# 4. Mark Dirty on Connect
# In WiringController.createConnection

# Conversion node block
content = content.replace(
    "this.app.persistence.autoSave();\n                    return;",
    "this.app.persistence.autoSave();\n                    this.app.compiler.markDirty();\n                    return;"
)

# End of createConnection
content = content.replace(
    "this.app.graph.redrawNodeWires(startPin.node.id);\n    });\n    this.app.persistence.autoSave();",
    "this.app.graph.redrawNodeWires(startPin.node.id);\n    });\n    this.app.persistence.autoSave();\n    this.app.compiler.markDirty();"
)
print("Added markDirty to createConnection")


# 5. Mark Dirty on Break Link
# breakLinkById has autoSave inside requestAnimationFrame
content = content.replace(
    "this.app.persistence.autoSave();\n    });",
    "this.app.persistence.autoSave();\n        this.app.compiler.markDirty();\n    });"
)
print("Added markDirty to breakLinkById")

# Write back
with open('graph.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated graph.js with dirty state tracking and input fix")
