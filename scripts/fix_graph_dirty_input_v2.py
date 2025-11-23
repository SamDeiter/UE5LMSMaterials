import re

# Read graph.js
with open('graph.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Input Click (Stop Propagation) - Already applied?
# Let's check if it's already there
if "inputEl.addEventListener('mousedown', (e) => e.stopPropagation());" not in content:
    if "inputEl.addEventListener('change', updateLiteral);" in content:
        content = content.replace(
            "inputEl.addEventListener('change', updateLiteral);",
            "inputEl.addEventListener('change', updateLiteral);\n        inputEl.addEventListener('mousedown', (e) => e.stopPropagation());"
        )
        print("Fixed Input Click (added stopPropagation)")
else:
    print("Input Click fix already present")

# 2. Mark Dirty on Add Node
# Target: this.nodesContainer.appendChild(nodeEl);
#         return node;
if "this.nodesContainer.appendChild(nodeEl);\n        return node;" in content:
    content = content.replace(
        "this.nodesContainer.appendChild(nodeEl);\n        return node;",
        "this.nodesContainer.appendChild(nodeEl);\n        this.app.compiler.markDirty();\n        return node;"
    )
    print("Added markDirty to addNode")
else:
    # Try looser match
    content = content.replace(
        "this.nodesContainer.appendChild(nodeEl);\r\n        return node;",
        "this.nodesContainer.appendChild(nodeEl);\r\n        this.app.compiler.markDirty();\r\n        return node;"
    )
    if "this.app.compiler.markDirty();\n        return node;" in content or "this.app.compiler.markDirty();\r\n        return node;" in content:
         print("Added markDirty to addNode (CRLF)")
    else:
         print("WARNING: Could not match addNode end block")

# 3. Mark Dirty on Delete Node
# Target: this.app.persistence.autoSave();
#     }
# inside deleteSelectedNodes
# We can search for the end of the function
if "this.app.details.clear();\n        this.app.persistence.autoSave();\n    }" in content:
    content = content.replace(
        "this.app.details.clear();\n        this.app.persistence.autoSave();\n    }",
        "this.app.details.clear();\n        this.app.persistence.autoSave();\n        this.app.compiler.markDirty();\n    }"
    )
    print("Added markDirty to deleteSelectedNodes")
else:
    # Try looser match
    content = content.replace(
        "this.app.details.clear();\r\n        this.app.persistence.autoSave();\r\n    }",
        "this.app.details.clear();\r\n        this.app.persistence.autoSave();\r\n        this.app.compiler.markDirty();\r\n    }"
    )
    if "this.app.compiler.markDirty();\n    }" in content or "this.app.compiler.markDirty();\r\n    }" in content:
        print("Added markDirty to deleteSelectedNodes (CRLF)")
    else:
        print("WARNING: Could not match deleteSelectedNodes end block")

# 4. Mark Dirty on Connect - Already applied?
if "this.app.compiler.markDirty();\n                    return;" in content:
    print("markDirty on Connect (conversion) already present")
else:
    print("WARNING: markDirty on Connect (conversion) NOT found")

if "this.app.compiler.markDirty();" in content and "redrawNodeWires(startPin.node.id)" in content:
     # Hard to verify exact location with simple check, but previous script said it succeeded
     pass

# Write back
with open('graph.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated graph.js")
