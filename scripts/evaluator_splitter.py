"""
NodeEvaluators Splitter Script
Splits NodeEvaluators.js into modular evaluator files by category.
"""

from pathlib import Path

def split_evaluators():
    source_path = Path("material/engine/NodeEvaluators.js")
    output_dir = Path("material/engine/evaluators")
    output_dir.mkdir(exist_ok=True)
    
    content = source_path.read_text(encoding='utf-8')
    lines = content.split('\n')
    
    # Find section boundaries by looking for comments
    sections = {
        'ConstantEvaluators.js': {'start': 'CONSTANT NODE EVALUATORS', 'end': 'MATH NODE EVALUATORS'},
        'MathEvaluators.js': {'start': 'MATH NODE EVALUATORS', 'end': 'TEXTURE NODE EVALUATORS'},
        'TextureEvaluators.js': {'start': 'TEXTURE NODE EVALUATORS', 'end': 'UTILITY NODE EVALUATORS'},
        'UtilityEvaluators.js': {'start': 'UTILITY NODE EVALUATORS', 'end': 'SUBSTRATE NODE EVALUATORS'},
        'SubstrateEvaluators.js': {'start': 'SUBSTRATE NODE EVALUATORS', 'end': 'NODE DISPATCHER'},
        'NodeDispatcher.js': {'start': 'NODE DISPATCHER', 'end': None},
    }
    
    # Find line numbers for each section
    section_lines = {}
    for filename, markers in sections.items():
        start_line = None
        end_line = None
        for i, line in enumerate(lines):
            if markers['start'] in line:
                start_line = i
            if markers['end'] and markers['end'] in line:
                end_line = i
                break
        if end_line is None:
            end_line = len(lines)
        section_lines[filename] = (start_line, end_line)
    
    # Write each section
    imports_header = '''/**
 * {name}
 * 
 * Extracted from NodeEvaluators.js for modularity.
 */

import {{ textureManager }} from "../TextureManager.js";
import {{
  multiplyValues,
  addValues,
  subtractValues,
  divideValues,
  lerpValues,
  applyUnary,
  applyBinary,
}} from "../MathUtils.js";

'''

    for filename, (start, end) in section_lines.items():
        if start is None:
            print(f"Warning: Could not find start marker for {filename}")
            continue
            
        section_content = '\n'.join(lines[start:end])
        
        # Add imports header
        name = filename.replace('.js', '')
        full_content = imports_header.format(name=name) + section_content
        
        output_path = output_dir / filename
        output_path.write_text(full_content, encoding='utf-8')
        print(f"Created {output_path} ({end - start} lines)")
    
    # Create index file for barrel export
    index_content = '''/**
 * Node Evaluators - Barrel Export
 * 
 * Re-exports all evaluator modules for backward compatibility.
 */

export * from "./ConstantEvaluators.js";
export * from "./MathEvaluators.js";
export * from "./TextureEvaluators.js";
export * from "./UtilityEvaluators.js";
export * from "./SubstrateEvaluators.js";
export * from "./NodeDispatcher.js";
'''
    
    index_path = output_dir / "index.js"
    index_path.write_text(index_content, encoding='utf-8')
    print(f"\nCreated {index_path} (barrel export)")
    
    print(f"\nTotal files created: {len(section_lines) + 1}")

if __name__ == "__main__":
    split_evaluators()
