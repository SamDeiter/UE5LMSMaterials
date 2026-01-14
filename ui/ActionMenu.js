/**
 * ActionMenu - Handles the right-click action menu
 */
import { Utils } from '../utils.js';
import { nodeRegistry } from '../registries/NodeRegistry.js';
import { Pin } from '../graph.js';
import { buildCategoryTree, renderCategoryTree } from '../ui-helpers.js';

export class ActionMenu {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('action-menu');
        this.searchInput = document.getElementById('action-menu-search');
        this.list = document.getElementById('action-menu-list');
        this.graphPos = { x: 0, y: 0 };
        this.sourcePin = null;
        this.droppedVarName = null;
        this.isContextSensitive = true;
        this.isHideDelayActive = false;
        this.element.addEventListener('click', e => e.stopPropagation());
        this.searchInput.addEventListener('input', this.filter.bind(this));
        document.addEventListener('click', (e) => {
            if (!this.isHideDelayActive) {
                if (this.element.style.display !== 'none' && !this.element.contains(e.target)) {
                    this.hide();
                }
            }
        });
    }
    show(clientX, clientY, sourcePin = null, droppedVarName = null) {
        this.element.style.display = 'none';
        this.graphPos = this.app.graph.getGraphCoords(clientX, clientY);
        this.sourcePin = sourcePin;
        this.droppedVarName = droppedVarName;
        this.app.contextMenu.hide();
        this.isHideDelayActive = true;
        setTimeout(() => {
            this.isHideDelayActive = false;
        }, 100);
        this.element.style.display = 'block';
        this.element.style.left = `${clientX}px`;
        this.element.style.top = `${clientY}px`;
        this.searchInput.value = '';
        if (droppedVarName) {
            this.searchInput.style.display = 'none';
        } else {
            this.searchInput.style.display = 'block';
        }
        this.populateList();
        this.searchInput.focus();
    }
    showVariableAccess(filter = '') {
        if (filter.length > 0) { return false; }
        const varAccessContainer = document.createElement('div');
        varAccessContainer.className = 'variable-access-group';
        const rootHeader = document.createElement('div');
        rootHeader.className = 'menu-item menu-header-toggle';
        rootHeader.style.fontWeight = 'bold';
        rootHeader.style.display = 'flex';
        rootHeader.style.alignItems = 'center';
        rootHeader.style.paddingLeft = '8px';
        const rootIcon = document.createElement('i');
        rootIcon.className = 'fas fa-caret-right';
        rootIcon.style.marginRight = '5px';
        rootHeader.appendChild(rootIcon);
        rootHeader.appendChild(document.createTextNode('Variables'));
        varAccessContainer.appendChild(rootHeader);
        const variableGroupsContainer = document.createElement('div');
        variableGroupsContainer.style.display = 'none';
        varAccessContainer.appendChild(variableGroupsContainer);
        const subHeader = document.createElement('div');
        subHeader.className = 'menu-item menu-header-toggle';
        subHeader.style.fontWeight = 'bold';
        subHeader.style.color = '#ccc';
        subHeader.style.display = 'flex';
        subHeader.style.alignItems = 'center';
        subHeader.style.paddingLeft = '20px';
        const subIcon = document.createElement('i');
        subIcon.className = 'fas fa-caret-right';
        subIcon.style.marginRight = '5px';
        subHeader.appendChild(subIcon);
        subHeader.appendChild(document.createTextNode('Default'));
        variableGroupsContainer.appendChild(subHeader);
        const itemsListContainer = document.createElement('div');
        itemsListContainer.style.display = 'none';
        variableGroupsContainer.appendChild(itemsListContainer);
        let hasRelevantVariables = false;
        for (const variable of this.app.variables.variables.values()) {
            const varName = variable.name;
            hasRelevantVariables = true;
            const color = Utils.getPinColor(variable.type);
            const pillStyle = `display:inline-block; width:8px; height:4px; background-color:${color}; border-radius:2px; margin-right:6px; vertical-align:middle;`;
            const paddingLeft = '35px';
            const varItemContainer = document.createElement('div');
            varItemContainer.style.marginBottom = '2px';
            const getItem = document.createElement('div');
            getItem.className = 'menu-item';
            getItem.innerHTML = `<span style="${pillStyle}"></span>Get ${varName}`;
            getItem.style.paddingLeft = paddingLeft;
            getItem.addEventListener('click', () => {
                const nodeKey = `Get_${varName}`;
                this.app.graph.addNode(nodeKey, this.graphPos.x, this.graphPos.y);
                this.app.persistence.autoSave();
                this.hide();
            });
            varItemContainer.appendChild(getItem);
            const setItem = document.createElement('div');
            setItem.className = 'menu-item';
            setItem.innerHTML = `<span style="${pillStyle}"></span>Set ${varName}`;
            setItem.style.paddingLeft = paddingLeft;
            setItem.addEventListener('click', () => {
                const nodeKey = `Set_${varName}`;
                this.app.graph.addNode(nodeKey, this.graphPos.x, this.graphPos.y);
                this.app.persistence.autoSave();
                this.hide();
            });
            varItemContainer.appendChild(setItem);
            itemsListContainer.appendChild(varItemContainer);
        }
        rootHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = variableGroupsContainer.style.display === 'none';
            variableGroupsContainer.style.display = isCollapsed ? 'block' : 'none';
            rootIcon.className = isCollapsed ? 'fas fa-caret-down' : 'fas fa-caret-right';
            if (isCollapsed) subHeader.dispatchEvent(new Event('click'));
        });
        subHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = itemsListContainer.style.display === 'none';
            itemsListContainer.style.display = isCollapsed ? 'block' : 'none';
            subIcon.className = isCollapsed ? 'fas fa-caret-down' : 'fas fa-caret-right';
        });
        if (hasRelevantVariables) {
            this.list.appendChild(varAccessContainer);
            return true;
        }
        return false;
    }
    showPromoteOption(pin) {
        if (pin.node.nodeKey.startsWith('Get_') || pin.node.nodeKey.startsWith('Set_')) return;
        if (pin.isConnected()) return;
        const pinContextItem = document.createElement('div');
        pinContextItem.className = 'pin-context-item';
        const promoteItem = document.createElement('div');
        promoteItem.className = 'menu-item';
        promoteItem.textContent = `Promote to variable`;
        promoteItem.addEventListener('click', () => {
            this.app.graph.promotePinToVariable(pin);
            this.hide();
        });
        pinContextItem.appendChild(promoteItem);
        const separator = document.createElement('div');
        separator.className = 'menu-separator';
        pinContextItem.appendChild(separator);
        this.list.appendChild(pinContextItem);
    }
    hide() {
        this.element.style.display = 'none';
        if (this.app.graph.activePin) {
            this.app.graph.activePin = null;
            this.app.wiring.updateGhostWire(null, null);
        }
        this.sourcePin = null;
        this.droppedVarName = null;
    }
    filter() {
        this.populateList(this.searchInput.value.toLowerCase());
    }
    populateList(filter = '') {
        this.list.innerHTML = '';
        let contextHeader = false;
        if (this.sourcePin) {
            const header = document.createElement('div');
            header.className = 'action-header';
            const titleRow = document.createElement('div');
            titleRow.className = 'action-header-row';
            const pinColor = this.sourcePin.type === 'exec' ? 'var(--color-exec)' : Utils.getPinColor(this.sourcePin.type);
            const redDot = document.createElement('span');
            redDot.style.cssText = `display:inline-block; width:8px; height:8px; background-color:${pinColor}; border-radius:50%; margin-right:8px; border:1px solid black;`;
            const typeName = this.sourcePin.type.charAt(0).toUpperCase() + this.sourcePin.type.slice(1);
            const titleText = document.createElement('span');
            const titleTextContent = this.sourcePin.type === 'exec' ? 'Executable actions' : `Actions taking a(n) ${typeName}`;
            titleText.textContent = titleTextContent;
            titleText.style.fontWeight = 'bold';
            titleText.style.color = '#ccc';
            titleRow.appendChild(redDot);
            titleRow.appendChild(titleText);
            header.appendChild(titleRow);
            const contextRow = document.createElement('div');
            contextRow.className = 'action-header-row';
            contextRow.style.justifyContent = 'flex-end';
            contextRow.style.fontSize = '10px';
            contextRow.style.color = '#aaa';
            contextRow.style.marginTop = '4px';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'context-sensitive-check';
            checkbox.checked = this.isContextSensitive;
            checkbox.style.marginRight = '4px';
            const checkboxLabel = document.createTextNode('Context Sensitive');
            checkbox.addEventListener('change', (e) => {
                this.isContextSensitive = e.target.checked;
                this.populateList(this.searchInput.value.toLowerCase());
            });
            contextRow.appendChild(checkbox);
            contextRow.appendChild(checkboxLabel);
            header.appendChild(contextRow);
            this.list.appendChild(header);
            const sep = document.createElement('div');
            sep.className = 'menu-separator';
            this.list.appendChild(sep);
            const placeholder = document.createElement('div');
            placeholder.textContent = "Select a Component to see available Events & Functions";
            placeholder.style.padding = "4px 8px";
            placeholder.style.color = "#666";
            placeholder.style.fontStyle = "italic";
            placeholder.style.fontSize = "10px";
            this.list.appendChild(placeholder);
            const sep2 = document.createElement('div');
            sep2.className = 'menu-separator';
            this.list.appendChild(sep2);
            if (this.sourcePin.type !== 'exec') {
                this.showPromoteOption(this.sourcePin);
                const sep3 = document.createElement('div');
                sep3.className = 'menu-separator';
                this.list.appendChild(sep3);
            }
            contextHeader = true;
        }
        const isGeneralClick = !this.sourcePin && !this.droppedVarName;
        const hasVariableAccess = isGeneralClick && filter.length === 0 ? this.showVariableAccess(filter) : false;
        if (this.droppedVarName) {
            this.showVariableDropOptions(this.droppedVarName);
            return;
        }
        const needsSeparatorBeforeNodes = hasVariableAccess || contextHeader;
        const nodeNames = Object.keys(nodeRegistry.getAll());
        const filtered = nodeNames.filter(name => {
            const isVariableNode = name.startsWith('Get_');
            const nodeData = nodeRegistry.get(name);
            const title = nodeData.title || name;
            const matchesFilter = title.toLowerCase().includes(filter) || name.toLowerCase().includes(filter);
            if (isVariableNode) return false;
            if (this.sourcePin) {
                if (!matchesFilter) return false;
                if (this.isContextSensitive) {
                    if (nodeData.pins && nodeData.pins.length > 0) {
                        const tempNode = { id: 'temp-action-menu-node', app: this.app };
                        const isConnectable = nodeData.pins.some(p => {
                            if (!p.type || !p.dir) return false;
                            const actualTempPin = new Pin(tempNode, p);
                            return this.app.graph.canConnect(this.sourcePin, actualTempPin);
                        });
                        return isConnectable;
                    }
                    return false;
                }
                return true;
            }
            return matchesFilter;
        });

        // Sort uncategorized items by type/priority
        // Note: buildCategoryTree handles categorization, but we sort items within categories
        // The renderCategoryTree helper sorts categories alphabetically.
        // We might want to pass a custom sort function if needed, but for now default is fine.

        // 2. Build Tree using shared helper
        const root = buildCategoryTree(filtered, (name) => nodeRegistry.get(name).category || '');

        if (filtered.length > 0 && needsSeparatorBeforeNodes) {
            const sep = document.createElement('div');
            sep.className = 'menu-separator';
            this.list.appendChild(sep);
        }

        const createMenuItem = (name) => {
            const nodeData = nodeRegistry.get(name);
            const li = document.createElement('div');
            li.className = 'menu-item';
            li.textContent = nodeData.title || name;
            li.style.paddingLeft = '20px'; // Base indent, will be overridden
            li.addEventListener('click', () => {
                const newNode = this.app.graph.addNode(name, this.graphPos.x, this.graphPos.y);
                if (this.sourcePin && newNode) {
                    const targetPin = newNode.pins.find(p => this.app.graph.canConnect(this.sourcePin, p));
                    if (targetPin) {
                        this.app.wiring.createConnection(this.sourcePin, targetPin);
                    }
                }
                this.app.persistence.autoSave();
                this.hide();
            });
            return li;
        };

        // 3. Render tree using shared helper
        renderCategoryTree(root, this.list, createMenuItem, {
            menuStyle: true, // Use menu styling
            sortCategories: true
        });

        if (this.list.children.length === 0) {
            if (isGeneralClick && filter.length === 0) {
                const placeholder = document.createElement('div');
                placeholder.textContent = "No actions available.";
                placeholder.style.padding = "4px 8px";
                placeholder.style.color = "#666";
                placeholder.style.fontStyle = "italic";
                placeholder.style.fontSize = "10px";
                this.list.appendChild(placeholder);
            } else if (filter.length > 0) {
                const placeholder = document.createElement('div');
                placeholder.textContent = "No matching actions found.";
                placeholder.style.padding = "4px 8px";
                placeholder.style.color = "#666";
                placeholder.style.fontStyle = "italic";
                placeholder.style.fontSize = "10px";
                this.list.appendChild(placeholder);
            }
        }
    }
    showVariableDropOptions(specificVarName) {
        const itemsListContainer = document.createElement('div');
        itemsListContainer.style.paddingTop = '4px';
        const variable = this.app.variables.variables.get(specificVarName);
        if (!variable) return;
        ['Get', 'Set'].forEach(action => {
            const nodeKey = `${action}_${variable.name}`;
            const item = document.createElement('div');
            item.className = 'menu-item';
            const color = Utils.getPinColor(variable.type);
            const pillStyle = `display:inline-block; width:8px; height:4px; background-color:${color}; border-radius:2px; margin-right:6px; vertical-align:middle;`;
            item.innerHTML = `<span style="${pillStyle}"></span>${action} ${variable.name}`;
            item.addEventListener('click', () => {
                this.app.graph.addNode(nodeKey, this.graphPos.x, this.graphPos.y);
                this.app.persistence.autoSave();
                this.hide();
            });
            itemsListContainer.appendChild(item);
        });
        this.list.appendChild(itemsListContainer);
    }
}
