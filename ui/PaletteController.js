/**
 * PaletteController - Manages the node palette
 */
import { NodeLibrary } from '../utils.js';
import { buildCategoryTree, renderCategoryTree } from '../ui-helpers.js';

export class PaletteController {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('palette-content');
        this.filterInput = document.getElementById('palette-filter');
        this.filterInput.addEventListener('input', () => this.populateList());
    }

    populateList() {
        this.container.innerHTML = '';
        const filter = this.filterInput.value.toLowerCase();
        const nodeNames = Object.keys(NodeLibrary);

        // 1. Filter Nodes
        const filtered = nodeNames.filter(name =>
            name.toLowerCase().includes(filter) ||
            (NodeLibrary[name].title && NodeLibrary[name].title.toLowerCase().includes(filter))
        );

        // 2. Build Tree using shared helper
        const root = buildCategoryTree(filtered, (name) => NodeLibrary[name].category || '');

        // 3. Helper to create draggable items (Palette-specific)
        const createItem = (name) => {
            const nodeData = NodeLibrary[name];
            const el = document.createElement('div');
            el.className = 'tree-item';
            el.textContent = nodeData.title || name;
            el.dataset.nodeType = name;
            if (nodeData.icon) {
                const icon = document.createElement('span');
                if (nodeData.icon.startsWith('fa-')) {
                    const iconEl = document.createElement('i');
                    iconEl.className = `fas ${nodeData.icon}`;
                    icon.appendChild(iconEl);
                } else {
                    icon.textContent = nodeData.icon;
                }
                el.prepend(icon);
            }
            el.draggable = true;
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', `PALETTE_NODE:${name}`);
                e.dataTransfer.effectAllowed = 'copy';
            });
            return el;
        };

        // 4. Render tree using shared helper
        renderCategoryTree(root, this.container, createItem, {
            sectionClass: 'sidebar-section',
            headerClass: 'sidebar-section-header',
            itemIndent: 20,
            sortCategories: true
        });
    }
}
