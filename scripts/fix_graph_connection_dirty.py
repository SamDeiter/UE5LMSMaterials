import re

# Read graph.js
with open('graph.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add markDirty to conversion block
if "this.app.persistence.autoSave();\n                    return;" in content:
    content = content.replace(
        "this.app.persistence.autoSave();\n                    return;",
        "this.app.persistence.autoSave();\n                    this.app.compiler.markDirty();\n                    return;"
    )
    print("Added markDirty to conversion block")
elif "this.app.persistence.autoSave();\r\n                    return;" in content:
    content = content.replace(
        "this.app.persistence.autoSave();\r\n                    return;",
        "this.app.persistence.autoSave();\r\n                    this.app.compiler.markDirty();\r\n                    return;"
    )
    print("Added markDirty to conversion block (CRLF)")
else:
    print("WARNING: Could not find conversion block end")

# 2. Add markDirty to end of createConnection
# It ends with:
#     this.app.persistence.autoSave();
# }
# But this pattern appears multiple times.
# We know it follows:
#     requestAnimationFrame(() => {
#         this.app.graph.redrawNodeWires(endPin.node.id);
#         this.app.graph.redrawNodeWires(startPin.node.id);
#     });

search_block = """    requestAnimationFrame(() => {
        this.app.graph.redrawNodeWires(endPin.node.id);
        this.app.graph.redrawNodeWires(startPin.node.id);
    });
    this.app.persistence.autoSave();"""

replace_block = """    requestAnimationFrame(() => {
        this.app.graph.redrawNodeWires(endPin.node.id);
        this.app.graph.redrawNodeWires(startPin.node.id);
    });
    this.app.persistence.autoSave();
    this.app.compiler.markDirty();"""

if search_block in content:
    content = content.replace(search_block, replace_block)
    print("Added markDirty to end of createConnection")
else:
    # Try CRLF
    search_block_crlf = search_block.replace('\n', '\r\n')
    replace_block_crlf = replace_block.replace('\n', '\r\n')
    if search_block_crlf in content:
        content = content.replace(search_block_crlf, replace_block_crlf)
        print("Added markDirty to end of createConnection (CRLF)")
    else:
        print("WARNING: Could not find end of createConnection")

# Write back
with open('graph.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated graph.js (Connection Dirty Fix)")
