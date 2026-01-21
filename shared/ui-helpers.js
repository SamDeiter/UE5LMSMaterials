/**
 * Reusable UI Component Helpers
 * Extracted to reduce duplication across UI controllers
 */

/**
 * Creates and appends a collapsible section header with toggle functionality
 * @param {HTMLElement} container - Parent container
 * @param {string} title - Section title
 * @param {HTMLElement} content - Content element to toggle
 * @param {object} options - Optional configuration
 * @returns {HTMLElement} The created header element
 */
export function createCollapsibleHeader(container, title, content, options = {}) {
    const {
        className = 'sidebar-section-header',
        depth = 0,
        isExpanded = false,
        onAdd = null,
        iconClass = 'fas fa-caret-right',
        style = {}
    } = options;

    const header = document.createElement('div');
    header.className = className;

    if (depth > 0) {
        header.style.paddingLeft = `${4 + depth * 12}px`;
    }

    // Apply any custom styles
    Object.assign(header.style, style);

    const titleGroup = document.createElement('div');
    titleGroup.className = 'title-group';

    const arrow = document.createElement('i');
    arrow.className = isExpanded ? 'fas fa-caret-down' : iconClass;
    arrow.style.marginRight = '5px';
    arrow.style.width = '10px';

    const text = document.createElement('span');
    text.textContent = title;

    titleGroup.appendChild(arrow);
    titleGroup.appendChild(text);
    header.appendChild(titleGroup);

    // Optional add button
    if (onAdd) {
        const actionGroup = document.createElement('div');
        actionGroup.className = 'action-group';
        const addBtn = document.createElement('i');
        addBtn.className = 'fas fa-plus add-btn';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onAdd();
        });
        actionGroup.appendChild(addBtn);
        header.appendChild(actionGroup);
    }

    // Set initial content state
    content.style.display = isExpanded ? 'block' : 'none';

    // Toggle functionality
    header.addEventListener('click', () => {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        arrow.className = isHidden ? 'fas fa-caret-down' : iconClass;
    });

    container.appendChild(header);
    return header;
}

/**
 * Builds a category tree from flat list of items with "Parent|Child" category strings
 * @param {Array} items - Array of items (can be item keys or objects)
 * @param {Function} getCategoryFn - Function to extract category from item
 * @returns {Object} Tree structure {name, children: {}, items: []}
 */
export function buildCategoryTree(items, getCategoryFn) {
    const root = { name: 'root', children: {}, items: [] };

    items.forEach(item => {
        const categoryStr = getCategoryFn(item);
        const parts = categoryStr.split('|').filter(p => p);

        let current = root;
        parts.forEach(part => {
            if (!current.children[part]) {
                current.children[part] = { name: part, children: {}, items: [] };
            }
            current = current.children[part];
        });

        current.items.push(item);
    });

    return root;
}

/**
 * Renders a category tree recursively with collapsible sections
 * @param {Object} node - Tree node from buildCategoryTree
 * @param {HTMLElement} container - Container to render into
 * @param {Function} renderItemFn - Function to render individual items (receives item, returns HTMLElement)
 * @param {object} options - Rendering options
 */
export function renderCategoryTree(node, container, renderItemFn, options = {}) {
    const {
        depth = 0,
        sectionClass = 'sidebar-section',
        headerClass = 'sidebar-section-header',
        itemIndent = 20,
        sortCategories = true,
        menuStyle = false,  // Use menu-item style instead of sidebar style
        headerStyle = {}
    } = options;

    // Render subcategories
    const categoryNames = sortCategories ? Object.keys(node.children).sort() : Object.keys(node.children);

    categoryNames.forEach(childName => {
        const childNode = node.children[childName];

        const section = document.createElement('div');
        section.className = sectionClass;

        const content = document.createElement('div');
        content.style.display = 'none'; // Collapsed by default

        // Create collapsible header with appropriate styling
        const headerOpts = {
            className: menuStyle ? 'menu-item menu-header-toggle' : headerClass,
            depth,
            isExpanded: false,
            style: menuStyle ? {
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: `${8 + depth * 12}px`,
                cursor: 'pointer',
                ...headerStyle
            } : headerStyle
        };

        createCollapsibleHeader(section, childName, content, headerOpts);

        section.appendChild(content);
        container.appendChild(section);

        // Recurse
        renderCategoryTree(childNode, content, renderItemFn, { ...options, depth: depth + 1 });
    });

    // Render items in this node
    node.items.forEach(item => {
        const itemEl = renderItemFn(item);
        if (itemEl) {  // renderItemFn might return null for filtered items
            itemEl.style.paddingLeft = `${itemIndent + depth * 12}px`;
            container.appendChild(itemEl);
        }
    });
}

/**
 * Helper to create a simple toggle for any content element
 * @param {string} toggleId - ID of toggle element
 * @param {string} contentId - ID of content element
 * @param {string} iconId - ID of icon element
 * @param {boolean} isExpanded - Initial state
 * @param {HTMLElement} parent - Parent element to search within
 */
export function setupToggle(toggleId, contentId, iconId, isExpanded = true, parent = document) {
    const toggle = parent.querySelector(`#${toggleId}`);
    const content = parent.querySelector(`#${contentId}`);
    const icon = parent.querySelector(`#${iconId}`);

    if (toggle && content && icon) {
        // Set initial state
        content.style.display = isExpanded ? 'block' : 'none';
        icon.className = isExpanded ? 'fas fa-caret-down' : 'fas fa-caret-right';

        toggle.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            icon.className = isHidden ? 'fas fa-caret-down' : 'fas fa-caret-right';
        });
    }
}
