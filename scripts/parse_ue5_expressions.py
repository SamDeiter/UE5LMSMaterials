#!/usr/bin/env python3
"""
UE5 Material Expression Parser
==============================
Extracts node definitions from Unreal Engine 5 MaterialExpression*.h headers.

Usage:
    python parse_ue5_expressions.py [--source-dir PATH] [--output PATH]

Default source: D:/Fortnite/UE_5.6/Engine/Source/Runtime/Engine/Public/Materials
Default output: ../data/MaterialExpressionDefinitions_generated.js
"""

import os
import re
import json
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional, Dict

# =============================================================================
# DATA STRUCTURES
# =============================================================================

@dataclass
class PinDefinition:
    """Represents an input or output pin on a material node."""
    id: str
    name: str
    pin_type: str = "float"
    required: bool = True
    default_value: Optional[float] = None
    tooltip: str = ""

@dataclass
class ExpressionDefinition:
    """Represents a complete material expression node definition."""
    key: str
    title: str
    category: str = "Misc"
    inputs: List[PinDefinition] = field(default_factory=list)
    outputs: List[PinDefinition] = field(default_factory=list)
    keywords: str = ""
    tooltip: str = ""
    hotkey: str = ""
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "key": self.key,
            "title": self.title,
            "category": self.category,
            "inputs": [
                {
                    "id": p.id,
                    "name": p.name,
                    "type": p.pin_type,
                    "required": p.required,
                    **({"defaultValue": p.default_value} if p.default_value is not None else {}),
                    **({"tooltip": p.tooltip} if p.tooltip else {})
                }
                for p in self.inputs
            ],
            "outputs": [
                {"id": p.id, "name": p.name, "type": p.pin_type}
                for p in self.outputs
            ],
            **({"keywords": self.keywords} if self.keywords else {}),
            **({"hotkey": self.hotkey} if self.hotkey else {})
        }

# =============================================================================
# CATEGORY MAPPING
# =============================================================================

CATEGORY_MAP = {
    # Math operations
    "Add": "Math", "Subtract": "Math", "Multiply": "Math", "Divide": "Math",
    "Abs": "Math", "Ceil": "Math", "Floor": "Math", "Frac": "Math", "Fmod": "Math",
    "Power": "Math", "SquareRoot": "Math", "Sine": "Math", "Cosine": "Math",
    "Tangent": "Math", "Arcsine": "Math", "Arccosine": "Math", "Arctangent": "Math",
    "Arctangent2": "Math", "Min": "Math", "Max": "Math", "Clamp": "Math",
    "Saturate": "Math", "OneMinus": "Math", "Lerp": "Math", "LinearInterpolate": "Math",
    "Normalize": "Math", "DotProduct": "Math", "CrossProduct": "Math",
    "Distance": "Math", "Length": "Math", "Round": "Math", "Truncate": "Math",
    "Sign": "Math", "Step": "Math", "SmoothStep": "Math",
    
    # Constants
    "Constant": "Constants", "Constant2Vector": "Constants", "Constant3Vector": "Constants",
    "Constant4Vector": "Constants", "ConstantBiasScale": "Constants", "Time": "Constants",
    "DeltaTime": "Constants", "Pi": "Constants",
    
    # Parameters
    "ScalarParameter": "Parameters", "VectorParameter": "Parameters",
    "TextureObjectParameter": "Parameters", "StaticSwitchParameter": "Parameters",
    "StaticBoolParameter": "Parameters", "StaticComponentMaskParameter": "Parameters",
    "CollectionParameter": "Parameters",
    
    # Texture
    "TextureSample": "Texture", "TextureObject": "Texture", "TextureCoordinate": "Texture",
    "Panner": "Texture", "Rotator": "Texture", "TextureSampleParameter2D": "Texture",
    "TextureSampleParameterCube": "Texture", "TextureSampleParameterVolume": "Texture",
    "TextureSampleParameterSubUV": "Texture", "ParticleSubUV": "Texture",
    
    # Utility
    "ComponentMask": "Utility", "AppendVector": "Utility", "BreakMaterialAttributes": "Utility",
    "MakeMaterialAttributes": "Utility", "If": "Utility", "StaticSwitch": "Utility",
    "SpeedTree": "Utility", "FeatureLevelSwitch": "Utility", "QualitySwitch": "Utility",
    "Reroute": "Utility", "NamedReroute": "Utility",
    
    # Coordinates
    "WorldPosition": "Coordinates", "ObjectPosition": "Coordinates", "ActorPosition": "Coordinates",
    "CameraPosition": "Coordinates", "ViewSize": "Coordinates", "ScreenPosition": "Coordinates",
    "PixelDepth": "Coordinates", "SceneDepth": "Coordinates", "VertexNormal": "Coordinates",
    "PixelNormal": "Coordinates", "CameraVector": "Coordinates", "ReflectionVector": "Coordinates",
    "ObjectRadius": "Coordinates", "ObjectBounds": "Coordinates",
    
    # Color
    "Desaturation": "Color", "HueSaturationValue": "Color", "RGBToHSV": "Color",
    "HSVToRGB": "Color", "LinearToSRGB": "Color", "SRGBToLinear": "Color",
    
    # Noise
    "Noise": "Procedural", "VectorNoise": "Procedural", "BlackBody": "Procedural",
    
    # Landscape
    "LandscapeLayerBlend": "Landscape", "LandscapeLayerCoords": "Landscape",
    "LandscapeLayerSample": "Landscape", "LandscapeLayerWeight": "Landscape",
    
    # Particles
    "ParticleColor": "Particles", "ParticleDirection": "Particles",
    "ParticleSpeed": "Particles", "ParticleSize": "Particles",
    "ParticleRelativeTime": "Particles", "ParticleRandom": "Particles",
    
    # Custom
    "Custom": "Custom", "CustomOutput": "Custom",
    
    # Material Attributes
    "SetMaterialAttributes": "Material Attributes", "GetMaterialAttributes": "Material Attributes",
    "BlendMaterialAttributes": "Material Attributes",
}

# Hotkey assignments from UE5
HOTKEY_MAP = {
    "Constant": "1",
    "Constant2Vector": "2",
    "Constant3Vector": "3",
    "Constant4Vector": "4",
    "TextureSample": "T",
    "TextureSampleParameter2D": "T",
    "Multiply": "M",
    "Add": "A",
    "Lerp": "L",
    "LinearInterpolate": "L",
    "ScalarParameter": "S",
    "VectorParameter": "V",
    "Time": "I",
    "ComponentMask": "O",
    "Panner": "P",
    "Normalize": "N",
    "Clamp": "C",
    "DotProduct": "D",
    "Power": "E",
    "Fresnel": "F",
}

# =============================================================================
# PARSER LOGIC
# =============================================================================

class MaterialExpressionParser:
    """Parses UE5 MaterialExpression header files."""
    
    # Regex patterns
    RE_CLASS = re.compile(
        r'class\s+(?:ENGINE_API\s+)?U(MaterialExpression\w+)\s*:\s*public\s+(\w+)',
        re.MULTILINE
    )
    
    RE_INPUT = re.compile(
        r'UPROPERTY\s*\(\s*meta\s*=\s*\(\s*'
        r'(?:RequiredInput\s*=\s*"(\w+)"\s*,?\s*)?'
        r'(?:ToolTip\s*=\s*"([^"]+)"\s*,?\s*)?'
        r'[^)]*\)\s*\)\s*\n\s*FExpressionInput\s+(\w+)\s*;',
        re.MULTILINE | re.DOTALL
    )
    
    RE_INPUT_SIMPLE = re.compile(
        r'FExpressionInput\s+(\w+)\s*;',
        re.MULTILINE
    )
    
    RE_CONST_DEFAULT = re.compile(
        r'UPROPERTY\s*\([^)]*OverridingInputProperty\s*=\s*"(\w+)"[^)]*\)\s*\n\s*'
        r'(?:float|int32|uint8)\s+(\w+)\s*=\s*([\d.f-]+)\s*;',
        re.MULTILINE | re.DOTALL
    )
    
    RE_KEYWORDS = re.compile(
        r'virtual\s+FText\s+GetKeywords\s*\([^)]*\)\s*const[^{]*\{\s*return\s+FText::FromString\s*\(\s*TEXT\s*\(\s*"([^"]+)"',
        re.MULTILINE | re.DOTALL
    )
    
    RE_CREATION_NAME = re.compile(
        r'virtual\s+FText\s+GetCreationName\s*\([^)]*\)\s*const[^{]*\{\s*return\s+FText::FromString\s*\(\s*TEXT\s*\(\s*"([^"]+)"',
        re.MULTILINE | re.DOTALL
    )
    
    def __init__(self, source_dir: Path):
        self.source_dir = source_dir
        self.definitions: List[ExpressionDefinition] = []
        
    def parse_all(self) -> List[ExpressionDefinition]:
        """Parse all MaterialExpression*.h files in the source directory."""
        pattern = self.source_dir / "MaterialExpression*.h"
        files = list(self.source_dir.glob("MaterialExpression*.h"))
        
        print(f"Found {len(files)} MaterialExpression header files")
        
        for file_path in sorted(files):
            try:
                self.parse_file(file_path)
            except Exception as e:
                print(f"  Error parsing {file_path.name}: {e}")
        
        print(f"Successfully parsed {len(self.definitions)} expression definitions")
        return self.definitions
    
    def parse_file(self, file_path: Path) -> Optional[ExpressionDefinition]:
        """Parse a single header file."""
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Find the class declaration
        class_match = self.RE_CLASS.search(content)
        if not class_match:
            return None
        
        full_class_name = class_match.group(1)
        base_class = class_match.group(2)
        
        # Extract clean name (remove "MaterialExpression" prefix)
        key = full_class_name.replace("MaterialExpression", "")
        if not key:
            return None
        
        # Skip abstract/base classes
        if key in ["", "Base", "Parameter", "TextureBase", "Custom"]:
            return None
        
        definition = ExpressionDefinition(
            key=key,
            title=self._format_title(key),
            category=CATEGORY_MAP.get(key, "Misc"),
            hotkey=HOTKEY_MAP.get(key, "")
        )
        
        # Parse inputs
        inputs_found = set()
        
        # First, try to find inputs with metadata
        for match in self.RE_INPUT.finditer(content):
            required_str, tooltip, pin_name = match.groups()
            required = required_str != "false" if required_str else True
            
            if pin_name not in inputs_found:
                definition.inputs.append(PinDefinition(
                    id=pin_name,
                    name=pin_name,
                    pin_type=self._guess_pin_type(pin_name),
                    required=required,
                    tooltip=tooltip or ""
                ))
                inputs_found.add(pin_name)
        
        # Also find simple FExpressionInput declarations
        for match in self.RE_INPUT_SIMPLE.finditer(content):
            pin_name = match.group(1)
            if pin_name not in inputs_found:
                definition.inputs.append(PinDefinition(
                    id=pin_name,
                    name=pin_name,
                    pin_type=self._guess_pin_type(pin_name),
                    required=True
                ))
                inputs_found.add(pin_name)
        
        # Parse default constant values
        for match in self.RE_CONST_DEFAULT.finditer(content):
            overriding_prop, const_name, value_str = match.groups()
            value = self._parse_float(value_str)
            
            # Find the matching input and set its default
            for inp in definition.inputs:
                if inp.id == overriding_prop:
                    inp.default_value = value
                    inp.required = False
                    break
        
        # Parse keywords
        keywords_match = self.RE_KEYWORDS.search(content)
        if keywords_match:
            definition.keywords = keywords_match.group(1)
        
        # Parse creation name (display title)
        creation_name_match = self.RE_CREATION_NAME.search(content)
        if creation_name_match:
            definition.title = creation_name_match.group(1)
        
        # Add default output if no inputs suggest otherwise
        if not definition.outputs:
            definition.outputs.append(PinDefinition(
                id="Output",
                name="",
                pin_type=self._guess_output_type(key, definition.inputs)
            ))
        
        self.definitions.append(definition)
        print(f"  Parsed: {key} ({len(definition.inputs)} inputs)")
        return definition
    
    def _format_title(self, key: str) -> str:
        """Convert PascalCase to Title Case with spaces."""
        # Insert space before uppercase letters
        result = re.sub(r'([A-Z])', r' \1', key).strip()
        return result
    
    def _guess_pin_type(self, name: str) -> str:
        """Guess pin type from name."""
        name_lower = name.lower()
        
        if any(x in name_lower for x in ['coord', 'uv', 'position2d']):
            return "float2"
        if any(x in name_lower for x in ['color', 'rgb', 'normal', 'position', 'vector', 'direction']):
            return "float3"
        if 'rgba' in name_lower or 'color4' in name_lower:
            return "float4"
        if any(x in name_lower for x in ['texture', 'tex']):
            return "texture"
        if any(x in name_lower for x in ['bool', 'switch', 'condition']):
            return "bool"
        
        return "float"
    
    def _guess_output_type(self, key: str, inputs: List[PinDefinition]) -> str:
        """Guess output type based on node key and inputs."""
        key_lower = key.lower()
        
        if 'texture' in key_lower:
            return "float4"
        if 'normal' in key_lower:
            return "float3"
        if any(x in key_lower for x in ['vector', 'position', 'color', 'rgb']):
            return "float3"
        if 'mask' in key_lower:
            return "float"
        
        # Default to float for math operations
        return "float"
    
    def _parse_float(self, value_str: str) -> float:
        """Parse a float value from C++ notation."""
        value_str = value_str.strip().rstrip('f')
        try:
            return float(value_str)
        except ValueError:
            return 0.0

# =============================================================================
# OUTPUT GENERATION
# =============================================================================

def generate_javascript(definitions: List[ExpressionDefinition], output_path: Path):
    """Generate JavaScript module from parsed definitions."""
    
    # Sort by category then key
    sorted_defs = sorted(definitions, key=lambda d: (d.category, d.key))
    
    # Group by category for organized output
    categories: Dict[str, list] = {}
    for d in sorted_defs:
        if d.category not in categories:
            categories[d.category] = []
        categories[d.category].append(d.to_dict())
    
    js_content = '''/**
 * MaterialExpressionDefinitions_generated.js
 * 
 * AUTO-GENERATED from UE5 Source Code
 * ====================================
 * This file was generated by parse_ue5_expressions.py
 * Source: D:\\Fortnite\\UE_5.6\\Engine\\Source\\Runtime\\Engine\\Public\\Materials
 * 
 * DO NOT EDIT MANUALLY - Re-run the parser to update.
 */

export const MaterialExpressionDefinitions = {
'''
    
    for category, nodes in categories.items():
        js_content += f'\n  // === {category.upper()} ===\n'
        for node in nodes:
            js_content += f'  "{node["key"]}": {json.dumps(node, indent=4).replace(chr(10), chr(10) + "  ")},\n'
    
    js_content += '''
};

// Export categories for palette organization
export const ExpressionCategories = '''
    js_content += json.dumps(list(categories.keys()), indent=2)
    js_content += ';\n'
    
    # Also export a flat array
    js_content += '''
// Flat array for easy iteration
export const AllExpressions = Object.values(MaterialExpressionDefinitions);
'''
    
    output_path.write_text(js_content, encoding='utf-8')
    print(f"\nGenerated: {output_path}")
    print(f"  - {len(definitions)} expressions")
    print(f"  - {len(categories)} categories")

# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Parse UE5 MaterialExpression headers")
    parser.add_argument(
        '--source-dir',
        type=Path,
        default=Path(r"D:\Fortnite\UE_5.6\Engine\Source\Runtime\Engine\Public\Materials"),
        help="Path to UE5 Materials source directory"
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=Path(__file__).parent.parent / "data" / "MaterialExpressionDefinitions_generated.js",
        help="Output JavaScript file path"
    )
    
    args = parser.parse_args()
    
    if not args.source_dir.exists():
        print(f"Error: Source directory not found: {args.source_dir}")
        return 1
    
    print(f"UE5 Material Expression Parser")
    print(f"=" * 50)
    print(f"Source: {args.source_dir}")
    print(f"Output: {args.output}")
    print()
    
    # Parse all expressions
    parser_instance = MaterialExpressionParser(args.source_dir)
    definitions = parser_instance.parse_all()
    
    # Generate output
    args.output.parent.mkdir(parents=True, exist_ok=True)
    generate_javascript(definitions, args.output)
    
    return 0

if __name__ == "__main__":
    exit(main())
