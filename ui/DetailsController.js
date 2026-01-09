/**
 * DetailsController - Manages the details panel for nodes and variables
 */
import { Utils } from '../utils.js';
import { Pin } from '../graph.js';
import { setupToggle } from '../ui-helpers.js';
import { DetailsRenderer } from './DetailsRenderer.js';

export class DetailsController {
    constructor(app) {
        this.app = app;
        this.panel = document.getElementById('details-panel');
        this.currentVariable = null;
        this.typeMenu = null;
        this.containerMenu = null; // Track container menu
        this.clear();
        this.createTypeMenu();
    }

    createTypeMenu() {
        // Note: This logic is superseded by showTypeMenu dynamically recreating the menu content
        // But we keep the container for safety
        this.typeMenu = document.createElement('div');
        this.typeMenu.id = 'type-selector-menu';
        document.body.appendChild(this.typeMenu);

        // Removed persistent document listener to avoid immediate closing issues
        // Listener will be added temporarily in showTypeMenu
    }

    showTypeMenu(x, y, callback) {
        const menu = this.typeMenu;

        // 1. Reset Content
        menu.innerHTML = '';
        menu.style.display = 'flex';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // Close handler
        const closeHandler = (e) => {
            if (menu.style.display !== 'none' && !menu.contains(e.target)) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeHandler);
            }
        };
        // Add listener with delay to avoid catching the trigger click
        setTimeout(() => document.addEventListener('click', closeHandler), 0);

        // 2. Search Header
        const searchHeader = document.createElement('div');
        searchHeader.className = 'type-selector-header';
        const icon = document.createElement('i');
        icon.className = 'fas fa-search';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search';
        searchInput.className = 'type-selector-search-input';

        searchHeader.appendChild(icon);
        searchHeader.appendChild(searchInput);
        menu.appendChild(searchHeader);

        // 3. Scrollable List Container
        const listContainer = document.createElement('div');
        listContainer.className = 'type-selector-list';
        menu.appendChild(listContainer);

        // Define Types with correct display names and icon colors
        const commonTypes = [
            { id: 'bool', label: 'Boolean', color: '#8C0202' },       // Red
            { id: 'byte', label: 'Byte', color: '#00665E' },          // Teal
            { id: 'int', label: 'Integer', color: '#28E897' },        // Cyan/Green
            { id: 'int64', label: 'Integer64', color: '#76D37E' },    // Pale Green
            { id: 'float', label: 'Float', color: '#96EE35' },        // Lime
            { id: 'name', label: 'Name', color: '#CC99FF' },          // Purple
            { id: 'string', label: 'String', color: '#FF00FF' },      // Magenta
            { id: 'text', label: 'Text', color: '#E27696' },          // Pink
            { id: 'vector', label: 'Vector', color: '#FFC700' },      // Gold
            { id: 'rotator', label: 'Rotator', color: '#99CCFF' },    // Blue
            { id: 'transform', label: 'Transform', color: '#FF7300' },// Orange
            { id: 'object', label: 'Object', color: '#00A2E8' }       // Blue
        ];

        // Render Function
        const renderItems = (filterText = '') => {
            listContainer.innerHTML = '';
            const lowerFilter = filterText.toLowerCase();

            // A) Render Common Types (Primitives)
            commonTypes.forEach(type => {
                if (type.label.toLowerCase().includes(lowerFilter)) {
                    const row = document.createElement('div');
                    row.className = 'type-option';

                    const pill = document.createElement('span');
                    pill.className = 'param-color-dot'; // Reusing pill style
                    pill.style.backgroundColor = type.color;
                    pill.style.width = '12px'; // Wider pill per image
                    pill.style.borderRadius = '4px';

                    const text = document.createElement('span');
                    text.textContent = type.label;

                    row.appendChild(pill);
                    row.appendChild(text);

                    row.addEventListener('click', () => {
                        callback(type.id);
                        menu.style.display = 'none';
                        // Clean up listener if we can (though it removes itself on next click usually, better to be clean)
                        // But closeHandler is local... it will clean up on next document click or we can leave it.
                        // For now, just hide.
                    });

                    listContainer.appendChild(row);
                }
            });

            // B) Render Collapsible Categories (Visual Only for now, as per request focus)
            const categories = ['Structure', 'Interface', 'Object Types', 'Enum'];
            categories.forEach(cat => {
                if (cat.toLowerCase().includes(lowerFilter) || filterText === '') {
                    const catRow = document.createElement('div');
                    catRow.className = 'type-selector-section';
                    catRow.innerHTML = `<i class="fas fa-caret-right"></i> <span>${cat}</span>`;
                    listContainer.appendChild(catRow);
                }
            });
        };

        renderItems();

        // Bind Search
        searchInput.addEventListener('click', e => e.stopPropagation());
        searchInput.addEventListener('input', (e) => renderItems(e.target.value));

        // Auto-focus search
        setTimeout(() => searchInput.focus(), 0);

        // 4. Footer
        const footer = document.createElement('div');
        footer.className = 'type-selector-footer';

        const countSpan = document.createElement('span');
        countSpan.textContent = `${commonTypes.length + 4} items`; // Mock count

        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.display = 'flex';
        checkboxContainer.style.alignItems = 'center';
        checkboxContainer.style.gap = '4px';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'ue5-checkbox';
        chk.checked = true;

        const chkLabel = document.createElement('span');
        chkLabel.textContent = 'Hide Non-Imported Types';

        checkboxContainer.appendChild(chk);
        checkboxContainer.appendChild(chkLabel);

        footer.appendChild(countSpan);
        footer.appendChild(checkboxContainer);
        menu.appendChild(footer);
    }

    // NEW: Show Container Type Menu (Single, Array, Set, Map)
    showContainerTypeMenu(x, y, variableType, callback) {
        // Remove existing if present
        if (this.containerMenu) this.containerMenu.remove();

        const color = Utils.getPinColor(variableType);

        const menu = document.createElement('div');
        menu.id = 'container-type-menu';
        menu.className = 'type-selector-menu'; // Reuse basic styling structure or create new
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background-color: #1a1a1a;
            border: 1px solid #444;
            border-radius: 4px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            width: 120px;
            z-index: 6001;
            display: flex;
            flex-direction: column;
            padding: 4px 0;
        `;

        const options = [
            { id: 'single', label: 'Single', iconHTML: `<span class="param-color-dot" style="background-color: ${color};"></span>` },
            { id: 'array', label: 'Array', iconHTML: `<i class="fas fa-th" style="color: ${color}; font-size: 10px;"></i>` },
            { id: 'set', label: 'Set', iconHTML: `<span style="color: ${color}; font-weight: bold; font-size: 10px;">{ }</span>` },
            { id: 'map', label: 'Map', iconHTML: `<i class="fas fa-list-ul" style="color: ${color}; font-size: 10px;"></i>` }
        ];

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'type-option';
            item.style.padding = '4px 12px 4px 12px'; // Increased padding

            // Disable Set and Map for Boolean type
            const isDisabled = variableType === 'bool' && (opt.id === 'set' || opt.id === 'map');

            if (isDisabled) {
                item.style.opacity = '0.3';
                item.style.cursor = 'not-allowed';
                item.title = 'Not available for Boolean type';
            }

            item.innerHTML = `
                <div style="width: 20px; display: flex; justify-content: center;">
                    ${DetailsRenderer.getContainerIcon(opt.id, variableType)}
                </div>
                <span>${opt.label}</span>
            `;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isDisabled) return;
                callback(opt.id);
                menu.remove();
                this.containerMenu = null;
            });
            menu.appendChild(item);
        });

        document.body.appendChild(menu);
        this.containerMenu = menu;

        // Check bounds and adjust if off-screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${x - rect.width} px`; // Shift to left of cursor
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${y - rect.height} px`; // Shift up
        }

        // Close on click outside
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                this.containerMenu = null;
                document.removeEventListener('click', closeHandler);
            }
        };
        // Delay binding to prevent immediate close
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    clear() {
        this.panel.innerHTML = '<p style="color: #aaa; padding: 15px;">Select a node or variable to see details.</p>';
        this.currentVariable = null;
    }

    // UPDATED: Variable and Default Value sections are now collapsible (default: Expanded)
    showVariableDetails(variable, isPrimarySelection = false) {
        if (isPrimarySelection) {
            this.app.graph.clearSelection();
            this.currentVariable = variable;
        }

        this.app.wiring.clearLinkSelection();

        // --- NEW: UE5-Style Panel Layout ---
        this.panel.innerHTML = ''; // Force DOM clear for refresh

        // Generate property flags HTML before template
        const propertyFlagsHTML = `
            ${DetailsRenderer.renderPropertyFlag('CPF_Edit', variable.cpfEdit)}
            ${DetailsRenderer.renderPropertyFlag('CPF_BlueprintVisible', variable.cpfBlueprintVisible)}
            ${DetailsRenderer.renderPropertyFlag('CPF_ZeroConstructor', variable.cpfZeroConstructor)}
            ${DetailsRenderer.renderPropertyFlag('CPF_DisableEditOnInstance', variable.cpfDisableEditOnInstance)}
            ${DetailsRenderer.renderPropertyFlag('CPF_IsPlainOldData', variable.cpfIsPlainOldData)}
            ${DetailsRenderer.renderPropertyFlag('CPF_NoDestructor', variable.cpfNoDestructor)}
            ${DetailsRenderer.renderPropertyFlag('CPF_HasGetValueTypeHash', variable.cpfHasGetValueTypeHash)}
        `;

        // Compose the full panel using helper methods
        const defaultValueHTML = DetailsRenderer.renderDefaultValueInput(variable);

        this.panel.innerHTML = `
            ${DetailsRenderer.renderVariableSection(variable)}
            ${DetailsRenderer.renderAdvancedSection(variable, propertyFlagsHTML)}
            ${DetailsRenderer.renderDefaultValueSection(variable, defaultValueHTML)}
        `;

        // Setup Toggles using shared helper
        setupToggle('variable-toggle', 'variable-content', 'variable-icon', true, this.panel); // Variable: Expanded
        setupToggle('advanced-toggle', 'advanced-content', 'advanced-icon', false, this.panel); // Advanced: Collapsed
        setupToggle('default-toggle', 'default-content', 'default-icon', true, this.panel); // Default Value: Expanded

        // Bind Custom Dropdown Triggers
        const typeTrigger = this.panel.querySelector('#var-type-trigger');
        if (typeTrigger) {
            typeTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = typeTrigger.getBoundingClientRect();
                this.showTypeMenu(rect.left, rect.bottom + 5, (newType) => {
                    this.app.variables.updateVariableProperty(variable, 'type', newType);
                });
            });
        }

        const containerTrigger = this.panel.querySelector('#var-container-trigger');
        if (containerTrigger) {
            containerTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = containerTrigger.getBoundingClientRect();
                this.showContainerTypeMenu(rect.left, rect.bottom + 5, variable.type, (newContainerType) => {
                    console.log('[Container Type Menu] Callback triggered with newContainerType:', newContainerType);
                    this.app.variables.updateVariableProperty(variable, 'containerType', newContainerType);
                });
            });
        }

        // Bind generic handlers (for inputs and standard selects)
        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            input.addEventListener('change', (e) => {
                const prop = e.target.dataset.prop;
                const arrayIndex = e.target.dataset.arrayIndex;
                const mapIndex = e.target.dataset.mapIndex;
                const mapField = e.target.dataset.mapField;

                let value;
                if (e.target.type === 'checkbox') {
                    value = e.target.checked;
                    // If deprecated flag changes, enable/disable the message input
                    if (prop === 'deprecated') {
                        const msgInput = this.panel.querySelector('[data-prop="deprecationMessage"]');
                        if (msgInput) {
                            msgInput.disabled = !value;
                            msgInput.style.opacity = value ? '1' : '0.3';
                        }
                    }
                } else if (e.target.type === 'number') {
                    value = parseFloat(e.target.value);
                } else {
                    value = e.target.value;
                }

                const vectorComponent = e.target.dataset.vectorComponent;
                const transformComponent = e.target.dataset.transformComponent;

                if (vectorComponent) {
                    // Handle Vector/Rotator component update
                    const parsed = DetailsRenderer.parseVectorValue(variable.defaultValue);
                    parsed[vectorComponent] = parseFloat(e.target.value) || 0;
                    const newValue = `(${parsed.x},${parsed.y},${parsed.z})`;
                    this.app.variables.updateVariableProperty(variable, 'defaultValue', newValue);
                } else if (transformComponent) {
                    // Handle Transform component update (e.g., "location-x", "rotation-y", "scale-z")
                    const [section, axis] = transformComponent.split('-');
                    const parsed = DetailsRenderer.parseTransformValue(variable.defaultValue);
                    parsed[section][axis] = parseFloat(e.target.value) || 0;
                    const newValue = `(${parsed.location.x},${parsed.location.y},${parsed.location.z}|${parsed.rotation.x},${parsed.rotation.y},${parsed.rotation.z}|${parsed.scale.x},${parsed.scale.y},${parsed.scale.z})`;
                    this.app.variables.updateVariableProperty(variable, 'defaultValue', newValue);
                } else if (mapIndex !== undefined && mapField !== undefined) {
                    // Handle Map Update
                    const index = parseInt(mapIndex);
                    const newMap = [...variable.defaultValue];
                    if (!newMap[index]) newMap[index] = {};
                    newMap[index][mapField] = value;
                    this.app.variables.updateVariableProperty(variable, 'defaultValue', newMap);
                } else if (arrayIndex !== undefined) {
                    // Handle Array Update
                    const index = parseInt(arrayIndex);
                    const newArray = [...variable.defaultValue];
                    newArray[index] = value;
                    this.app.variables.updateVariableProperty(variable, 'defaultValue', newArray);
                } else {
                    this.app.variables.updateVariableProperty(variable, prop, value);
                }
            });

            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.addEventListener('input', (e) => {
                    const prop = e.target.dataset.prop;

                    // Skip live updates for Variable Name to prevent focus loss (update on blur/enter instead)
                    if (prop === 'name') return;

                    const arrayIndex = e.target.dataset.arrayIndex;
                    const mapIndex = e.target.dataset.mapIndex;
                    const mapField = e.target.dataset.mapField;

                    let value = e.target.value;
                    if (e.target.type === 'number') {
                        value = parseFloat(e.target.value);
                    }

                    const vectorComponent = e.target.dataset.vectorComponent;
                    const transformComponent = e.target.dataset.transformComponent;

                    if (vectorComponent) {
                        // Handle Vector/Rotator component update
                        const parsed = DetailsRenderer.parseVectorValue(variable.defaultValue);
                        parsed[vectorComponent] = parseFloat(e.target.value) || 0;
                        const newValue = `(${parsed.x},${parsed.y},${parsed.z})`;
                        this.app.variables.updateVariableProperty(variable, 'defaultValue', newValue);
                    } else if (transformComponent) {
                        // Handle Transform component update
                        const [section, axis] = transformComponent.split('-');
                        const parsed = DetailsRenderer.parseTransformValue(variable.defaultValue);
                        parsed[section][axis] = parseFloat(e.target.value) || 0;
                        const newValue = `(${parsed.location.x},${parsed.location.y},${parsed.location.z}|${parsed.rotation.x},${parsed.rotation.y},${parsed.rotation.z}|${parsed.scale.x},${parsed.scale.y},${parsed.scale.z})`;
                        this.app.variables.updateVariableProperty(variable, 'defaultValue', newValue);
                    } else if (mapIndex !== undefined && mapField !== undefined) {
                        // Handle Map Update
                        const index = parseInt(mapIndex);
                        const newMap = [...variable.defaultValue];
                        if (!newMap[index]) newMap[index] = {};
                        newMap[index][mapField] = value;
                        this.app.variables.updateVariableProperty(variable, 'defaultValue', newMap);
                    } else if (arrayIndex !== undefined) {
                        // Handle Array Update (Debounced or immediate? Immediate for now)
                        const index = parseInt(arrayIndex);
                        const newArray = [...variable.defaultValue];
                        newArray[index] = value;
                        this.app.variables.updateVariableProperty(variable, 'defaultValue', newArray);
                    } else {
                        this.app.variables.updateVariableProperty(variable, prop, value);
                    }
                });
            }
        });

        if (isPrimarySelection) {
            setTimeout(() => {
                const varEl = document.querySelector(`.tree-item[data-var-id="${variable.id}"]`);
                if (varEl) {
                    varEl.focus();
                }
            }, 0);
        }
    }

    addArrayElement(varId) {
        console.log('[addArrayElement] Called with varId:', varId);
        // Try currentVariable first, then search by ID
        let variable = this.currentVariable && this.currentVariable.id === varId ? this.currentVariable : null;

        // If not found, search through all variables by ID
        if (!variable) {
            variable = [...this.app.variables.variables.values()].find(v => v.id === varId);
        }

        console.log('[addArrayElement] Variable found:', variable ? variable.name : 'null');
        if (!variable) return;

        if (!Array.isArray(variable.defaultValue)) {
            variable.defaultValue = [];
        }

        // Add default value based on type
        const type = variable.type;
        let newVal = '';
        if (type === 'bool') newVal = false;
        else if (type === 'int' || type === 'int64' || type === 'byte' || type === 'float') newVal = 0;
        else if (type === 'vector') newVal = '(0,0,0)';
        else if (type === 'rotator') newVal = '(0,0,0)';
        else if (type === 'transform') newVal = '(0,0,0|0,0,0|1,1,1)';

        const newArray = [...variable.defaultValue, newVal];
        console.log('[addArrayElement] Adding element. Old length:', variable.defaultValue.length, 'New length:', newArray.length);
        this.app.variables.updateVariableProperty(variable, 'defaultValue', newArray);
    }

    removeArrayElement(varId, index) {
        let variable = this.currentVariable && this.currentVariable.id === varId ? this.currentVariable : null;
        if (!variable) variable = [...this.app.variables.variables.values()].find(v => v.id === varId);
        if (!variable) return;

        if (Array.isArray(variable.defaultValue)) {
            const newArray = [...variable.defaultValue];
            newArray.splice(index, 1);
            this.app.variables.updateVariableProperty(variable, 'defaultValue', newArray);
        }
    }

    clearArrayElements(varId) {
        let variable = this.currentVariable && this.currentVariable.id === varId ? this.currentVariable : null;
        if (!variable) variable = [...this.app.variables.variables.values()].find(v => v.id === varId);
        if (!variable) return;

        this.app.variables.updateVariableProperty(variable, 'defaultValue', []);
    }

    addMapElement(varId) {
        console.log('[addMapElement] Called with varId:', varId);
        let variable = this.currentVariable && this.currentVariable.id === varId ? this.currentVariable : null;
        if (!variable) variable = [...this.app.variables.variables.values()].find(v => v.id === varId);
        console.log('[addMapElement] Variable found:', variable ? variable.name : 'null');
        if (!variable) return;

        if (!Array.isArray(variable.defaultValue)) {
            variable.defaultValue = [];
        }

        // Add default key-value pair based on type
        const type = variable.type;
        let newVal = '';
        if (type === 'bool') newVal = false;
        else if (type === 'int' || type === 'int64' || type === 'byte' || type === 'float') newVal = 0;
        else if (type === 'vector') newVal = '(0,0,0)';
        else if (type === 'rotator') newVal = '(0,0,0)';
        else if (type === 'transform') newVal = '(0,0,0|0,0,0|1,1,1)';

        const newEntry = { key: '', value: newVal };
        const newMap = [...variable.defaultValue, newEntry];
        console.log('[addMapElement] Adding map entry. Old length:', variable.defaultValue.length, 'New length:', newMap.length);
        this.app.variables.updateVariableProperty(variable, 'defaultValue', newMap);
    }

    removeMapElement(varId, index) {
        let variable = this.currentVariable && this.currentVariable.id === varId ? this.currentVariable : null;
        if (!variable) variable = [...this.app.variables.variables.values()].find(v => v.id === varId);
        if (!variable) return;

        if (Array.isArray(variable.defaultValue)) {
            const newMap = [...variable.defaultValue];
            newMap.splice(index, 1);
            this.app.variables.updateVariableProperty(variable, 'defaultValue', newMap);
        }
    }

    clearMapElements(varId) {
        let variable = this.currentVariable && this.currentVariable.id === varId ? this.currentVariable : null;
        if (!variable) variable = [...this.app.variables.variables.values()].find(v => v.id === varId);
        if (!variable) return;

        this.app.variables.updateVariableProperty(variable, 'defaultValue', []);
    }

    showNodeDetails(node) {
        this.currentVariable = null;
        this.app.wiring.clearLinkSelection();

        if (node.nodeKey.startsWith('Get_') || node.nodeKey.startsWith('Set_')) {
            const key = node.nodeKey;
            const underscoreIndex = key.indexOf('_');
            if (underscoreIndex !== -1) {
                const varName = key.substring(underscoreIndex + 1);
                // Attempt exact match first
                let variable = this.app.variables.variables.get(varName);

                if (!variable) {
                    // Fallback: Iterate values to check for ID match if name match fails
                    // This catches cases where nodeKey is stale but variableId is correct
                    variable = [...this.app.variables.variables.values()].find(v => v.id === node.variableId);
                }

                if (variable) {
                    this.showVariableDetails(variable, false);
                    return;
                }
            }
        }

        if (node.nodeKey === 'CustomEvent') {
            this.showCustomEventDetails(node);
            return;
        }

        this.panel.innerHTML = `
            <div class="details-group">
                <h4>Node Details</h4>
                <div class="detail-row">
                    <label>Title</label>
                    <span class="detail-value-static">${node.title || node.nodeKey}</span>
                </div>
                 <div class="detail-row">
                    <label>Type</label>
                    <span class="detail-value-static">${node.type}</span>
                </div>
                <div class="detail-row">
                    <label>Class</label>
                    <span class="detail-value-static">${node.nodeKey}</span>
                </div>
            </div>
            <div class="details-group">
                <p style="color: #aaa;">This is a basic inspector. Full configuration options would appear here.</p>
            </div>
        `;
    }

    showCustomEventDetails(node) {
        const updateReliableState = () => {
            const isReplicated = (node.customData.replicates || 'NotReplicated') !== 'NotReplicated';
            const reliableCheckbox = this.panel.querySelector('#reliable-checkbox');
            const reliableLabel = this.panel.querySelector('#reliable-label');

            if (reliableCheckbox) {
                reliableCheckbox.disabled = !isReplicated;
                reliableCheckbox.style.opacity = isReplicated ? '1' : '0.5';
                if (!isReplicated) reliableCheckbox.checked = false;
            }

            if (reliableLabel) {
                reliableLabel.style.color = isReplicated ? '#ffffff' : '#666666';
            }
        };

        this.panel.innerHTML = `
            <div class="details-group">
                <h4 style="color: #ddd; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">
                    <i class="fas fa-caret-down"></i> Graph Node
                </h4>
                <div class="detail-row">
                    <label>Name</label>
                    <input type="text" id="node-title-input" class="details-input" value="${node.title}" style="width: 60%;">
                </div>
            </div>

            <div class="details-group">
                <h4 style="color: #ddd; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">
                     <i class="fas fa-caret-down"></i> Graph
                </h4>
                <div class="detail-row">
                    <label>Keywords</label>
                    <input type="text" id="keywords-input" class="details-input" placeholder="" value="${node.customData.keywords || ''}" style="width: 60%;">
                </div>
                 <div class="detail-row">
                    <label>Replicates</label>
                    <select id="replicates-select" class="details-select" style="width: 60%;">
                        <option value="NotReplicated" ${node.customData.replicates === 'NotReplicated' ? 'selected' : ''}>Not Replicated</option>
                        <option value="Multicast" ${node.customData.replicates === 'Multicast' ? 'selected' : ''}>Multicast</option>
                        <option value="RunOnServer" ${node.customData.replicates === 'RunOnServer' ? 'selected' : ''}>Run on Server</option>
                        <option value="RunOnOwningClient" ${node.customData.replicates === 'RunOnOwningClient' ? 'selected' : ''}>Run on Owning Client</option>
                    </select>
                </div>
                 <div class="detail-row" style="justify-content: flex-end;">
                    <div style="width: 60%; display: flex; align-items: center;">
                        <input type="checkbox" id="reliable-checkbox" class="ue5-checkbox" ${node.customData.reliable ? 'checked' : ''}>
                        <span id="reliable-label" style="margin-left: 8px; color: #666;">Reliable</span>
                    </div>
                </div>
                 <div class="detail-row">
                    <label>Call In Editor</label>
                    <div style="width: 60%;">
                        <input type="checkbox" id="call-in-editor-checkbox" class="ue5-checkbox" ${node.customData.callInEditor ? 'checked' : ''}>
                    </div>
                </div>
                 <div class="detail-row">
                    <label>Access Specifier</label>
                     <select id="access-specifier-select" class="details-select" style="width: 60%;">
                        <option value="Public" ${node.customData.accessSpecifier === 'Public' ? 'selected' : ''}>Public</option>
                        <option value="Private" ${node.customData.accessSpecifier === 'Private' ? 'selected' : ''}>Private</option>
                        <option value="Protected" ${node.customData.accessSpecifier === 'Protected' ? 'selected' : ''}>Protected</option>
                    </select>
                </div>
            </div>

            <div class="details-group">
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <h4 style="color: #ddd; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0;">
                        <i class="fas fa-caret-down"></i> Inputs
                    </h4>
                    <i class="fas fa-plus-circle" id="add-input-param-btn" style="color: #ccc; cursor: pointer;"></i>
                </div>
                <div id="custom-inputs-list"></div>
            </div>
        `;

        updateReliableState();

        const titleInput = this.panel.querySelector('#node-title-input');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                node.title = e.target.value;
                const titleEl = node.element.querySelector('.node-title span:last-child');
                if (titleEl) {
                    titleEl.textContent = node.title;
                }
                this.app.persistence.autoSave();
            });
        }

        const bindProperty = (selector, propName, isCheckbox = false) => {
            const el = this.panel.querySelector(selector);
            if (el) {
                el.addEventListener('change', (e) => {
                    node.customData[propName] = isCheckbox ? e.target.checked : e.target.value;
                    this.app.persistence.autoSave();
                    if (propName === 'replicates') {
                        updateReliableState();
                    }
                });
            }
        };

        bindProperty('#keywords-input', 'keywords');
        bindProperty('#replicates-select', 'replicates');
        bindProperty('#reliable-checkbox', 'reliable', true);
        bindProperty('#call-in-editor-checkbox', 'callInEditor', true);
        bindProperty('#access-specifier-select', 'accessSpecifier');


        const addBtn = this.panel.querySelector('#add-input-param-btn');
        addBtn.addEventListener('click', () => {
            this.addCustomParameter(node);
        });

        this.renderCustomParameters(node);
    }

    addCustomParameter(node) {
        const id = Utils.uniqueId('pin');
        const newPinData = {
            id: id,
            name: "NewParam",
            type: "bool",
            dir: "out",
            isCustom: true
        };

        const pin = new Pin(node, newPinData);
        node.pins.push(pin);
        node.refreshPinCache();

        this.app.wiring.updateVisuals(node);
        this.renderCustomParameters(node);
        this.app.persistence.autoSave();
    }

    removeCustomParameter(node, pinId) {
        this.app.wiring.breakPinLinks(pinId);

        node.pins = node.pins.filter(p => p.id !== pinId);
        node.refreshPinCache();

        this.app.wiring.updateVisuals(node);
        this.renderCustomParameters(node);
        this.app.persistence.autoSave();
    }

    renderCustomParameters(node) {
        const list = this.panel.querySelector('#custom-inputs-list');
        if (!list) return;
        list.innerHTML = '';

        const customPins = node.pins.filter(p => p.isCustom);

        if (customPins.length === 0) {
            list.innerHTML = `<div style="background-color: #111; padding: 8px; color: #888; font-style: italic; font-size: 10px; border: 1px solid #333;">
            Please press the + icon above to add parameters
            </div>`;
            return;
        }

        customPins.forEach(pin => {
            const row = document.createElement('div');
            row.className = 'param-row';

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = pin.name;
            nameInput.className = 'details-input';
            nameInput.style.width = '100%';
            nameInput.addEventListener('change', (e) => {
                pin.name = e.target.value;
                this.app.wiring.updateVisuals(node);
                this.app.persistence.autoSave();
            });

            const typeTrigger = document.createElement('div');
            typeTrigger.className = 'param-type-trigger';

            const colorDot = document.createElement('span');
            colorDot.className = 'param-color-dot';
            colorDot.style.backgroundColor = Utils.getPinColor(pin.type);

            const typeLabel = document.createElement('span');
            typeLabel.textContent = pin.type.charAt(0).toUpperCase() + pin.type.slice(1);

            const downArrow = document.createElement('i');
            downArrow.className = 'fas fa-caret-down';

            typeTrigger.appendChild(colorDot);
            typeTrigger.appendChild(typeLabel);
            typeTrigger.appendChild(downArrow);

            typeTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = typeTrigger.getBoundingClientRect();
                this.showTypeMenu(rect.left, rect.bottom + 5, (newType) => {
                    pin.type = newType.toLowerCase();
                    this.app.wiring.updateVisuals(node);
                    this.app.graph.redrawNodeWires(node.id);
                    this.renderCustomParameters(node);
                    this.app.persistence.autoSave();
                });
            });

            const delBtn = document.createElement('i');
            delBtn.className = 'fas fa-times param-delete-btn';
            delBtn.addEventListener('click', () => this.removeCustomParameter(node, pin.id));

            row.appendChild(nameInput);
            row.appendChild(typeTrigger);
            row.appendChild(delBtn);
            list.appendChild(row);
        });
    }
}
