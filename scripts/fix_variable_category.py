import re

# Read the file
with open('ui/VariableController.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add category: 'Variables' to both Get and Set node registrations
# First, Get node
content = content.replace(
    '''        nodeRegistry.register(`Get_${variable.name}`, {
            title: `Get ${variable.name}`,
            type: "pure-node",''',
    '''        nodeRegistry.register(`Get_${variable.name}`, {
            title: `Get ${variable.name}`,
            category: 'Variables',
            type: "pure-node",'''
)

# Then, Set node
content = content.replace(
    '''        nodeRegistry.register(`Set_${variable.name}`, {
            title: `Set ${variable.name}`,
            type: "variable-node",''',
    '''        nodeRegistry.register(`Set_${variable.name}`, {
            title: `Set ${variable.name}`,
            category: 'Variables',
            type: "variable-node",'''
)

# Write back
with open('ui/VariableController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed VariableController.js - added 'Variables' category to Get/Set nodes!")
