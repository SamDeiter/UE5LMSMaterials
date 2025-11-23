import re

# Read the file
with open('utils.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Define category mappings based on node names
category_map = {
    # String conversions
    'Conv_FloatToString': 'String',
    'Conv_IntToString': 'String',
    'Conv_BoolToString': 'String',
    'Conv_ByteToString': 'String',
    'Conv_NameToString': 'String',
    'Conv_TextToString': 'String',
    
    # Math conversions
    'Conv_IntToFloat': 'Math|Float',
    'Conv_ByteToInt': 'Math|Integer',
    
    # Events
    'EventBeginPlay': 'Events',
    'EventTick': 'Events',
    'CustomEvent': 'Events',
    'EventActorBeginOverlap': 'Events',
    'EventOnClicked': 'Events',
    
    # Flow Control
    'Branch': 'Flow Control',
    'Sequence': 'Flow Control',
    'DoOnce': 'Flow Control',
    'DoN': 'Flow Control',
    'FlipFlop': 'Flow Control',
    'ForLoop': 'Flow Control',
    'ForEachLoop': 'Flow Control',
    'Gate': 'Flow Control',
    
    # Functions
    'PrintString': 'String',
    
    # Math
    'AddInt': 'Math|Integer',
    'AddFloat': 'Math|Float',
    'SubtractFloat': 'Math|Float',
    'MultiplyFloat': 'Math|Float',
    'DivideFloat': 'Math|Float',
    
    # Boolean
    'OR': 'Math|Boolean',
    'AND': 'Math|Boolean',
    'NOT': 'Math|Boolean',
    
    # Utility
    'Comment': 'Development',
}

# For each node in the category map, add the category property
for node_name, category in category_map.items():
    # Pattern to match the node definition
    pattern = rf'("{node_name}":\s*\{{\s*title:\s*"[^"]+",\s*type:\s*"[^"]+")'
    
    # Replacement with category added
    replacement = rf'\1,\n        category: "{category}"'
    
    content = re.sub(pattern, replacement, content)

# Write the modified content back
with open('utils.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Categories added successfully!")
