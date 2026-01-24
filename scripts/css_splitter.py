"""
CSS Splitter Script
Splits material-editor.css into modular CSS files based on section headers.
"""

import re
from pathlib import Path

def split_css():
    source_path = Path("public/material-editor.css")
    output_dir = Path("public/css")
    output_dir.mkdir(exist_ok=True)
    
    content = source_path.read_text(encoding='utf-8')
    
    # Define section mappings
    sections = {
        'variables.css': (1, 71),      # CSS Variables
        'base.css': (72, 141),         # Reset, scrollbars
        'layout.css': (142, 409),      # Menu, tabs, toolbar
        'panels.css': (410, 957),      # Main content, palette, panels
        'graph.css': (958, 1561),      # Graph, nodes, pins, wires
        'details.css': (1562, 1904),   # Details panel
        'menus.css': (1905, 2280),     # Action menu, context menu, comments
        'modals.css': (2281, 2427),    # Modals, code viewer
        'components.css': (2428, 2707), # Buttons, status, texture picker
        'stats.css': (2708, 2745),     # Stats strip
        'layers.css': (2746, 3100),    # Layer panel
    }
    
    lines = content.split('\n')
    
    # Write each section to its own file
    created_files = []
    for filename, (start, end) in sections.items():
        section_lines = lines[start-1:end]
        section_content = '\n'.join(section_lines)
        
        output_path = output_dir / filename
        output_path.write_text(section_content, encoding='utf-8')
        created_files.append(filename)
        print(f"Created {output_path} ({len(section_lines)} lines)")
    
    # Create main import file
    import_file = output_dir / "main.css"
    imports = [f'@import url("./{f}");' for f in created_files]
    import_file.write_text('\n'.join(imports), encoding='utf-8')
    print(f"\nCreated {import_file} with {len(imports)} imports")
    
    print(f"\nTotal files created: {len(created_files) + 1}")

if __name__ == "__main__":
    split_css()
