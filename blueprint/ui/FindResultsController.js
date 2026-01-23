/**
 * FindResultsController.js
 * 
 * Manages the "Find Results" search functionality for the Blueprint Editor.
 * Replicates the UE5 search panel for locating nodes in the graph.
 */

export class FindResultsController {
  constructor(app) {
    this.app = app;
    this.modal = null;
    this.searchInput = null;
    this.resultsList = null;
  }

  /**
   * Create and show the Find Results modal
   */
  show() {
    if (!this.modal) {
      this.createModal();
    }
    this.modal.style.display = 'flex';
    this.searchInput.focus();
    this.updateResults('');
  }

  /**
   * Hide the modal
   */
  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Create the modal DOM structure
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'find-results-modal';
    this.modal.className = 'modal secondary-modal';
    this.modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fas fa-search"></i> Find Results
          </div>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="search-container">
            <input type="text" id="find-search-input" placeholder="Enter node name, type, or variable..." autocomplete="off">
          </div>
          <div id="find-results-list" class="find-results-list">
            <!-- Results populated here -->
          </div>
        </div>
        <div class="modal-footer">
          <div class="find-status">Searching all graph nodes...</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    this.searchInput = this.modal.querySelector('#find-search-input');
    this.resultsList = this.modal.querySelector('#find-results-list');

    // Events
    this.modal.querySelector('.close-modal').addEventListener('click', () => this.hide());
    
    this.searchInput.addEventListener('input', (e) => {
      this.updateResults(e.target.value);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  /**
   * Filter nodes and update the list
   */
  updateResults(query) {
    if (!this.resultsList) return;
    this.resultsList.innerHTML = '';
    
    const lowQuery = query.toLowerCase();
    // In Blueprint, nodes are in app.graph.nodes (Map)
    const nodes = Array.from(this.app.graph.nodes.values());
    
    const filtered = nodes.filter(node => {
      if (!query) return true;
      return (
        node.title.toLowerCase().includes(lowQuery) ||
        (node.nodeKey && node.nodeKey.toLowerCase().includes(lowQuery)) ||
        (node.variableId && node.variableId.toLowerCase().includes(lowQuery))
      );
    });

    if (filtered.length === 0) {
      this.resultsList.innerHTML = '<div class="no-results">No nodes found matching your search.</div>';
      return;
    }

    filtered.forEach(node => {
      const item = document.createElement('div');
      item.className = 'find-result-item';
      
      const icon = this.getNodeIcon(node);
      
      item.innerHTML = `
        <div class="result-icon">
          <i class="${icon}"></i>
        </div>
        <div class="result-info">
          <div class="result-title">${node.title}</div>
          <div class="result-meta">${node.nodeKey || node.type}</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        this.app.graph.deselectAll();
        this.app.graph.selectNode(node.id);
        this.app.graph.focusOnNode(node.id);
      });

      this.resultsList.appendChild(item);
    });
  }

  getNodeIcon(node) {
    if (node.icon) {
        if (node.icon.startsWith('fa-')) return `fas ${node.icon}`;
        return 'fas fa-square';
    }
    
    if (node.type === 'event-node') return 'fas fa-bolt';
    if (node.type === 'function-node') return 'fas fa-fx';
    return 'fas fa-square';
  }
}
