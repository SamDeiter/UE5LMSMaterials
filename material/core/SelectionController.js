/**
 * SelectionController.js
 * 
 * Manages selection state for nodes and links in the Material Editor.
 */

export class SelectionController {
  constructor(app, graph) {
    this.app = app;
    this.graph = graph;
    this.selectedNodes = new Set();
    this.selectedLinks = new Set();
  }

  /**
   * Select a node
   */
  selectNode(node, additive = false) {
    if (!additive) {
      this.deselectAll();
    }

    this.selectedNodes.add(node.id);
    node.element.classList.add("selected");
    
    // In UE5, selecting a node often updates the details panel
    if (this.app.details) {
      this.app.details.showNodeProperties(node);
    }
  }

  /**
   * Deselect a node
   */
  deselectNode(node) {
    this.selectedNodes.delete(node.id);
    node.element.classList.remove("selected");
  }

  /**
   * Select a link
   */
  selectLink(link, additive = false) {
      if (!additive) {
          this.deselectAll();
      }
      this.selectedLinks.add(link.id);
      if (link.element) link.element.classList.add("selected");
  }

  /**
   * Deselect all nodes and links
   */
  deselectAll() {
    this.selectedNodes.forEach((id) => {
      const node = this.graph.nodes.get(id);
      if (node) node.element.classList.remove("selected");
    });
    this.selectedNodes.clear();

    this.selectedLinks.forEach((id) => {
      const link = this.graph.links.get(id);
      if (link && link.element) {
        link.element.classList.remove("selected");
      }
    });
    this.selectedLinks.clear();

    if (this.app.details) {
      this.app.details.showMaterialProperties();
    }
  }

  /**
   * Get selected nodes as an array of objects
   */
  getSelectedNodes() {
    return Array.from(this.selectedNodes)
      .map(id => this.graph.nodes.get(id))
      .filter(Boolean);
  }

  /**
   * Get selected links as an array of objects
   */
  getSelectedLinks() {
    return Array.from(this.selectedLinks)
      .map(id => this.graph.links.get(id))
      .filter(Boolean);
  }

  /**
   * Check if anything is selected
   */
  hasSelection() {
    return this.selectedNodes.size > 0 || this.selectedLinks.size > 0;
  }
}
