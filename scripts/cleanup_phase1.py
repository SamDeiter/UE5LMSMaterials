"""
Phase 1.1 Code Cleanup Script
Removes debug console.log statements from UI controllers.
"""

import re

def remove_debug_logs(filepath, patterns_to_remove):
    """Remove specific console.log lines from a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    removed_count = 0
    new_lines = []
    
    for i, line in enumerate(lines):
        # Check if this line contains a debug console.log
        should_remove = False
        for pattern in patterns_to_remove:
            if pattern in line and 'console.log' in line:
                should_remove = True
                print(f"  Removing line {i+1}: {line.strip()[:60]}...")
                removed_count += 1
                break
        
        if not should_remove:
            new_lines.append(line)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    return removed_count

# Files and patterns to clean
cleanup_targets = [
    {
        'file': r'c:\Users\Sam Deiter\Documents\GitHub\UE5LMSMaterials\ui\VariableController.js',
        'patterns': ['[updateVariableProperty]']
    },
    {
        'file': r'c:\Users\Sam Deiter\Documents\GitHub\UE5LMSMaterials\ui\DetailsController.js',
        'patterns': [
            '[Container Type Menu]',
            '[addArrayElement]',
            '[addMapElement]'
        ]
    }
]

print("=" * 50)
print("Phase 1.1 Code Cleanup - Removing Debug Logs")
print("=" * 50)

total_removed = 0
for target in cleanup_targets:
    print(f"\nProcessing: {target['file'].split(chr(92))[-1]}")
    count = remove_debug_logs(target['file'], target['patterns'])
    total_removed += count

print(f"\n{'=' * 50}")
print(f"Cleanup complete. Removed {total_removed} debug log statements.")
print("=" * 50)
