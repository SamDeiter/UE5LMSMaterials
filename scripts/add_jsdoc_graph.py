"""
Phase 1.1 - Add JSDoc to GraphController Public Methods
Safely adds JSDoc documentation without modifying existing code logic.
"""

import re

def add_jsdoc_before_method(content, method_signature, jsdoc):
    """
    Adds JSDoc comment before a method signature.
    Only adds if JSDoc doesn't already exist.
    """
    # Check if method already has JSDoc (/** ... */ directly before it)
    pattern_with_jsdoc = re.compile(
        r'/\*\*[\s\S]*?\*/\s*\n\s*' + re.escape(method_signature),
        re.MULTILINE
    )
    
    if pattern_with_jsdoc.search(content):
        print(f"  [SKIP] {method_signature[:40]}... - Already has JSDoc")
        return content, False
    
    # Find the method and add JSDoc before it
    pattern = re.compile(r'(\n)(    ' + re.escape(method_signature) + ')')
    
    if pattern.search(content):
        replacement = r'\1' + jsdoc + r'\n\2'
        content = pattern.sub(replacement, content, count=1)
        print(f"  [ADD]  {method_signature[:40]}...")
        return content, True
    else:
        print(f"  [MISS] {method_signature[:40]}... - Not found")
        return content, False


# Read the file
filepath = r'c:\Users\Sam Deiter\Documents\GitHub\UE5LMSMaterials\graph.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

print("=" * 60)
print("Adding JSDoc to GraphController Public Methods")
print("=" * 60)

# Define JSDoc comments for key methods
jsdoc_additions = [
    (
        "initEvents() {",
        """    /**
     * Initializes all event listeners for the graph editor.
     * Binds mouse, wheel, drag, and keyboard events.
     */"""
    ),
    (
        "addNode(nodeKey, x, y) {",
        """    /**
     * Creates and adds a new node to the graph.
     * @param {string} nodeKey - The node type key from NodeRegistry.
     * @param {number} x - X position in graph coordinates.
     * @param {number} y - Y position in graph coordinates.
     * @returns {Node|null} The created node, or null if failed.
     */"""
    ),
    (
        "duplicateSelectedNodes() {",
        """    /**
     * Duplicates all currently selected nodes.
     * Preserves internal connections between duplicated nodes.
     */"""
    ),
    (
        "findPinById(pinId) {",
        """    /**
     * Finds a pin by its full ID (format: nodeId-pinName).
     * @param {string} pinId - The full pin identifier.
     * @returns {Pin|null} The found pin, or null.
     */"""
    ),
    (
        "canConnect(pinA, pinB) {",
        """    /**
     * Checks if two pins can be connected.
     * Validates direction, type compatibility, and max links.
     * @param {Pin} pinA - First pin.
     * @param {Pin} pinB - Second pin.
     * @returns {boolean} True if connection is valid.
     */"""
    ),
    (
        "selectNode(nodeId, addToSelection = false, mode = 'toggle') {",
        """    /**
     * Selects or deselects a node based on the mode.
     * @param {string} nodeId - The node ID to select.
     * @param {boolean} addToSelection - If true, adds to current selection.
     * @param {string} mode - Selection mode: 'add', 'remove', 'toggle', 'new'.
     */"""
    ),
    (
        "clearSelection() {",
        """    /**
     * Clears all selected nodes.
     */"""
    ),
    (
        "deleteSelectedNodes() {",
        """    /**
     * Deletes all currently selected nodes and their connections.
     */"""
    ),
    (
        "renderAllNodes() {",
        """    /**
     * Renders all nodes in the graph to the DOM.
     */"""
    ),
    (
        "drawAllWires() {",
        """    /**
     * Redraws all wire connections in the graph.
     */"""
    ),
    (
        "redrawNodeWires(nodeId) {",
        """    /**
     * Redraws all wires connected to a specific node.
     * @param {string} nodeId - The node ID whose wires to redraw.
     */"""
    ),
    (
        "getGraphCoords(clientX, clientY) {",
        """    /**
     * Converts screen coordinates to graph coordinates.
     * @param {number} clientX - Screen X position.
     * @param {number} clientY - Screen Y position.
     * @returns {{x: number, y: number}} Graph coordinates.
     */"""
    ),
    (
        "updateTransform() {",
        """    /**
     * Updates the CSS transform for pan and zoom.
     */"""
    ),
]

added_count = 0
for method_sig, jsdoc in jsdoc_additions:
    content, added = add_jsdoc_before_method(content, method_sig, jsdoc)
    if added:
        added_count += 1

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("=" * 60)
print(f"Added {added_count} JSDoc comments to GraphController")
print("=" * 60)
