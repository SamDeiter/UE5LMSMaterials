/**
 * AlignmentGuides.js
 * 
 * Provides visual alignment guides when dragging nodes.
 * Shows horizontal and vertical lines when node edges align with other nodes.
 * UE5-style alignment feedback.
 */

export class AlignmentGuides {
  constructor(graphController) {
    this.graph = graphController;
    this.svg = graphController.svg;
    
    // Guide lines container
    this.guidesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.guidesGroup.setAttribute("id", "alignment-guides");
    this.svg.appendChild(this.guidesGroup);
    
    // Active guide lines
    this.hGuides = [];
    this.vGuides = [];
    
    // Configuration
    this.snapThreshold = 5; // Pixels to trigger alignment snap
    this.guideColor = "#FF6B00"; // UE5 orange
    this.guideOpacity = 0.8;
    
    // Set to true to show visual guide lines during drag
    this.showGuides = false;
  }
  
  /**
   * Update guides while dragging nodes
   * @param {Set<string>} draggedNodeIds - IDs of nodes being dragged
   */
  update(draggedNodeIds) {
    this.clear();
    
    if (!draggedNodeIds || draggedNodeIds.size === 0) return;
    
    const draggedNodes = [...draggedNodeIds]
      .map(id => this.graph.nodes.get(id))
      .filter(Boolean);
    
    // Get all non-dragged nodes for comparison
    const staticNodes = [...this.graph.nodes.values()]
      .filter(n => !draggedNodeIds.has(n.id));
    
    if (staticNodes.length === 0) return;
    
    // Collect edges of dragged nodes
    const draggedEdges = this.getNodeEdges(draggedNodes);
    
    // Find alignments with static nodes
    const alignments = [];
    
    staticNodes.forEach(staticNode => {
      const nodeEl = staticNode.element;
      const width = nodeEl?.offsetWidth || 150;
      const height = nodeEl?.offsetHeight || 100;
      
      const staticEdges = {
        left: staticNode.x,
        right: staticNode.x + width,
        top: staticNode.y,
        bottom: staticNode.y + height,
        centerX: staticNode.x + width / 2,
        centerY: staticNode.y + height / 2
      };
      
      // Check horizontal alignments (top, center, bottom)
      if (this.isClose(draggedEdges.top, staticEdges.top)) {
        alignments.push({ type: 'h', y: staticEdges.top, staticEdge: 'top' });
      }
      if (this.isClose(draggedEdges.bottom, staticEdges.bottom)) {
        alignments.push({ type: 'h', y: staticEdges.bottom, staticEdge: 'bottom' });
      }
      if (this.isClose(draggedEdges.centerY, staticEdges.centerY)) {
        alignments.push({ type: 'h', y: staticEdges.centerY, staticEdge: 'centerY' });
      }
      if (this.isClose(draggedEdges.top, staticEdges.bottom)) {
        alignments.push({ type: 'h', y: staticEdges.bottom, staticEdge: 'bottom-top' });
      }
      if (this.isClose(draggedEdges.bottom, staticEdges.top)) {
        alignments.push({ type: 'h', y: staticEdges.top, staticEdge: 'top-bottom' });
      }
      
      // Check vertical alignments (left, center, right)
      if (this.isClose(draggedEdges.left, staticEdges.left)) {
        alignments.push({ type: 'v', x: staticEdges.left, staticEdge: 'left' });
      }
      if (this.isClose(draggedEdges.right, staticEdges.right)) {
        alignments.push({ type: 'v', x: staticEdges.right, staticEdge: 'right' });
      }
      if (this.isClose(draggedEdges.centerX, staticEdges.centerX)) {
        alignments.push({ type: 'v', x: staticEdges.centerX, staticEdge: 'centerX' });
      }
      if (this.isClose(draggedEdges.left, staticEdges.right)) {
        alignments.push({ type: 'v', x: staticEdges.right, staticEdge: 'right-left' });
      }
      if (this.isClose(draggedEdges.right, staticEdges.left)) {
        alignments.push({ type: 'v', x: staticEdges.left, staticEdge: 'left-right' });
      }
    });
    
    // Draw unique guides only if visual guides are enabled
    if (this.showGuides) {
      const drawnH = new Set();
      const drawnV = new Set();
      
      alignments.forEach(align => {
        if (align.type === 'h' && !drawnH.has(Math.round(align.y))) {
          this.drawHorizontalGuide(align.y);
          drawnH.add(Math.round(align.y));
        } else if (align.type === 'v' && !drawnV.has(Math.round(align.x))) {
          this.drawVerticalGuide(align.x);
          drawnV.add(Math.round(align.x));
        }
      });
    }
    
    return alignments;
  }
  
  /**
   * Get bounding edges of a group of nodes
   */
  getNodeEdges(nodes) {
    if (nodes.length === 0) return null;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const width = node.element?.offsetWidth || 150;
      const height = node.element?.offsetHeight || 100;
      
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + height);
    });
    
    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }
  
  /**
   * Check if two values are close enough for alignment
   */
  isClose(a, b) {
    return Math.abs(a - b) <= this.snapThreshold;
  }
  
  /**
   * Draw a horizontal guide line
   */
  drawHorizontalGuide(y) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const screenY = y * this.graph.zoom + this.graph.panY;
    
    line.setAttribute("x1", "0");
    line.setAttribute("x2", this.svg.getAttribute("width"));
    line.setAttribute("y1", screenY);
    line.setAttribute("y2", screenY);
    line.setAttribute("stroke", this.guideColor);
    line.setAttribute("stroke-opacity", this.guideOpacity);
    line.setAttribute("stroke-width", "1");
    line.setAttribute("stroke-dasharray", "4,2");
    line.classList.add("alignment-guide", "horizontal");
    
    this.guidesGroup.appendChild(line);
    this.hGuides.push(line);
  }
  
  /**
   * Draw a vertical guide line
   */
  drawVerticalGuide(x) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const screenX = x * this.graph.zoom + this.graph.panX;
    
    line.setAttribute("y1", "0");
    line.setAttribute("y2", this.svg.getAttribute("height"));
    line.setAttribute("x1", screenX);
    line.setAttribute("x2", screenX);
    line.setAttribute("stroke", this.guideColor);
    line.setAttribute("stroke-opacity", this.guideOpacity);
    line.setAttribute("stroke-width", "1");
    line.setAttribute("stroke-dasharray", "4,2");
    line.classList.add("alignment-guide", "vertical");
    
    this.guidesGroup.appendChild(line);
    this.vGuides.push(line);
  }
  
  /**
   * Clear all guide lines
   */
  clear() {
    this.hGuides.forEach(line => line.remove());
    this.vGuides.forEach(line => line.remove());
    this.hGuides = [];
    this.vGuides = [];
  }
  
  /**
   * Get snap offsets for magnetic snapping
   * @param {Set<string>} draggedNodeIds - IDs of nodes being dragged
   * @returns {{ dx: number, dy: number }} Offset to apply for snapping
   */
  getSnapOffset(draggedNodeIds) {
    const draggedNodes = [...draggedNodeIds]
      .map(id => this.graph.nodes.get(id))
      .filter(Boolean);
    
    const staticNodes = [...this.graph.nodes.values()]
      .filter(n => !draggedNodeIds.has(n.id));
    
    if (staticNodes.length === 0 || draggedNodes.length === 0) {
      return { dx: 0, dy: 0 };
    }
    
    const draggedEdges = this.getNodeEdges(draggedNodes);
    let dx = 0, dy = 0;
    let foundX = false, foundY = false;
    
    staticNodes.forEach(staticNode => {
      if (foundX && foundY) return;
      
      const width = staticNode.element?.offsetWidth || 150;
      const height = staticNode.element?.offsetHeight || 100;
      
      const staticEdges = {
        left: staticNode.x,
        right: staticNode.x + width,
        top: staticNode.y,
        bottom: staticNode.y + height,
        centerX: staticNode.x + width / 2,
        centerY: staticNode.y + height / 2
      };
      
      // Check Y snapping
      if (!foundY) {
        const yEdges = [
          { dragged: draggedEdges.top, static: staticEdges.top },
          { dragged: draggedEdges.bottom, static: staticEdges.bottom },
          { dragged: draggedEdges.centerY, static: staticEdges.centerY },
          { dragged: draggedEdges.top, static: staticEdges.bottom },
          { dragged: draggedEdges.bottom, static: staticEdges.top }
        ];
        
        for (const edge of yEdges) {
          if (this.isClose(edge.dragged, edge.static)) {
            dy = edge.static - edge.dragged;
            foundY = true;
            break;
          }
        }
      }
      
      // Check X snapping
      if (!foundX) {
        const xEdges = [
          { dragged: draggedEdges.left, static: staticEdges.left },
          { dragged: draggedEdges.right, static: staticEdges.right },
          { dragged: draggedEdges.centerX, static: staticEdges.centerX },
          { dragged: draggedEdges.left, static: staticEdges.right },
          { dragged: draggedEdges.right, static: staticEdges.left }
        ];
        
        for (const edge of xEdges) {
          if (this.isClose(edge.dragged, edge.static)) {
            dx = edge.static - edge.dragged;
            foundX = true;
            break;
          }
        }
      }
    });
    
    return { dx, dy };
  }
}
