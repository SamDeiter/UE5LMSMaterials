#!/usr/bin/env python3
"""
CSS Cleanup Script for material-editor.css
Consolidates duplicate selectors and organizes the file.
"""

import re
from collections import OrderedDict

def parse_css_blocks(content):
    """Parse CSS into blocks, preserving comments and structure."""
    blocks = []
    current_pos = 0
    
    # Pattern to match CSS rules (selector { properties })
    # Also captures preceding comments
    pattern = r'(/\*[\s\S]*?\*/\s*)?([^{}/]+)\{([^{}]*)\}'
    
    for match in re.finditer(pattern, content):
        comment = match.group(1) or ''
        selector = match.group(2).strip()
        properties = match.group(3).strip()
        
        blocks.append({
            'comment': comment.strip(),
            'selector': selector,
            'properties': properties,
            'original': match.group(0)
        })
    
    return blocks

def merge_properties(props1, props2):
    """Merge two property strings, with props2 taking precedence."""
    prop_dict = OrderedDict()
    
    for props in [props1, props2]:
        for line in props.split(';'):
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                prop_dict[key.strip()] = value.strip()
    
    return ';\n    '.join(f'{k}: {v}' for k, v in prop_dict.items())

def consolidate_duplicates(blocks):
    """Consolidate duplicate selectors."""
    seen = OrderedDict()
    
    for block in blocks:
        selector = block['selector']
        if selector in seen:
            # Merge properties
            existing = seen[selector]
            merged_props = merge_properties(existing['properties'], block['properties'])
            existing['properties'] = merged_props
            if block['comment'] and not existing['comment']:
                existing['comment'] = block['comment']
        else:
            seen[selector] = block.copy()
    
    return list(seen.values())

def format_css_block(block):
    """Format a CSS block nicely."""
    output = ''
    if block['comment']:
        output += block['comment'] + '\n'
    
    props = block['properties']
    if props:
        # Format properties nicely
        prop_lines = []
        for prop in props.split(';'):
            prop = prop.strip()
            if prop:
                prop_lines.append(f'    {prop};')
        props_formatted = '\n'.join(prop_lines)
        output += f"{block['selector']} {{\n{props_formatted}\n}}"
    else:
        output += f"{block['selector']} {{\n}}"
    
    return output

def main():
    input_file = 'public/material-editor.css'
    backup_file = 'public/material-editor.css.backup'
    
    # Read the file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create backup
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created backup: {backup_file}")
    
    # Parse CSS blocks
    blocks = parse_css_blocks(content)
    print(f"Found {len(blocks)} CSS blocks")
    
    # Find duplicates before consolidation
    selector_counts = {}
    for block in blocks:
        sel = block['selector']
        selector_counts[sel] = selector_counts.get(sel, 0) + 1
    
    duplicates = {k: v for k, v in selector_counts.items() if v > 1}
    print(f"Found {len(duplicates)} duplicate selectors:")
    for sel, count in duplicates.items():
        print(f"  {count}x {sel[:50]}")
    
    # Consolidate duplicates
    consolidated = consolidate_duplicates(blocks)
    print(f"After consolidation: {len(consolidated)} blocks")
    
    # Extract section comments and organize
    # Keep original file structure mostly, just merge duplicates
    
    # Build new CSS file
    output_lines = []
    output_lines.append("/* ============================================")
    output_lines.append("   UE5 Material Editor Styles")
    output_lines.append("   Auto-cleaned by css_cleanup.py")
    output_lines.append("   ============================================ */")
    output_lines.append("")
    
    # Group by category (based on selector patterns)
    categories = {
        'Variables': [],
        'Base Layout': [],
        'Toolbar': [],
        'Panels': [],
        'Graph Canvas': [],
        'Nodes': [],
        'Pins & Connections': [],
        'Context Menu': [],
        'Modals': [],
        'Viewport': [],
        'Status Bar': [],
        'Misc': []
    }
    
    for block in consolidated:
        sel = block['selector']
        
        if sel.startswith(':root') or sel.startswith('*'):
            categories['Variables'].append(block)
        elif any(x in sel for x in ['toolbar', '.toolbar']):
            categories['Toolbar'].append(block)
        elif any(x in sel for x in ['panel', '.panel', '#details', '#stats', '#palette']):
            categories['Panels'].append(block)
        elif any(x in sel for x in ['#graph', '.graph', '#minimap', '.minimap']):
            categories['Graph Canvas'].append(block)
        elif any(x in sel for x in ['.node', '#node', '.pin-', '.input-pin', '.output-pin']):
            categories['Nodes'].append(block)
        elif any(x in sel for x in ['.connection', 'svg', 'path']):
            categories['Pins & Connections'].append(block)
        elif any(x in sel for x in ['context-menu', '.context']):
            categories['Context Menu'].append(block)
        elif any(x in sel for x in ['.modal', '#modal']):
            categories['Modals'].append(block)
        elif any(x in sel for x in ['viewport', '#viewport']):
            categories['Viewport'].append(block)
        elif any(x in sel for x in ['status', '.status']):
            categories['Status Bar'].append(block)
        elif any(x in sel for x in ['body', 'html', '.container', '#app', '.main']):
            categories['Base Layout'].append(block)
        else:
            categories['Misc'].append(block)
    
    # Write organized CSS
    for category, cat_blocks in categories.items():
        if cat_blocks:
            output_lines.append(f"/* ===== {category} ===== */")
            output_lines.append("")
            for block in cat_blocks:
                output_lines.append(format_css_block(block))
                output_lines.append("")
    
    # Write output
    output_content = '\n'.join(output_lines)
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(output_content)
    
    print(f"Written cleaned CSS to {input_file}")
    print(f"Reduced from {len(content)} to {len(output_content)} characters")

if __name__ == '__main__':
    main()
