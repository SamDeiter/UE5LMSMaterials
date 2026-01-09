/**
 * VariableController - Manages variable creation, deletion, and list rendering
 */
import { Utils } from '../utils.js';
import { nodeRegistry } from '../registries/NodeRegistry.js';
import { createCollapsibleHeader } from '../ui-helpers.js';

export class VariableController {
    constructor(app) {
        this.app = app;
        this.listContainer = document.getElementById('my-blueprint-content');
        // Bind input elements for creation (can be triggered from new Add button)
        this.nameInput = document.getElementById('new-var-name');
        this.typeSelect = document.getElementById('new-var-type');
        this.createBtn = document.getElementById('create-var-btn');
        this.inputContainer = document.getElementById('new-var-input-container');

        this.variables = new Map();
        this.renamingVarId = null; // Track which variable is currently being renamed

        // Bind create events
        if (this.createBtn) {
            this.createBtn.addEventListener('click', this.addVariable.bind(this));
        }
        if (this.nameInput) {
            this.nameInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') this.addVariable();
            });
        }
    }

    getVariableTypes() {
        return ['bool', 'byte', 'int', 'int64', 'float', 'name', 'string', 'text', 'vector', 'rotator', 'transform', 'object'];
    }

    getDefaultValueForType(type) {
        switch (type) {
            case 'bool': return false;
            case 'int':
            case 'int64':
            case 'byte': return 0;
            case 'float': return 0.0;
            default: return '';
        }
    }

    isNameTaken(name, currentId = null) {
        for (const variable of this.variables.values()) {
            if (variable.name === name && variable.id !== currentId) {
                return true;
            }
        }
        return false;
    }

    generateUniqueVarName(baseName = 'NewVar') {
        let index = 0;
        let name = baseName;
        while (this.isNameTaken(name)) {
            name = `${baseName}_${index}`;
            index++;
        }
        return name;
    }

    // Helper to create the standard variable object structure with all UE5 properties
    createVariableObject(id, name, type, containerType, isPublic) {
        return {
            id,
            name,
            type,
            containerType,
            defaultValue: this.getDefaultValueForType(type),
            description: '',
            // UE5 Standard Properties
            isInstanceEditable: isPublic,
            blueprintReadOnly: false,
            exposeOnSpawn: false,
            // Default to NOT private so variables are visible/editable in blueprint
            private: false,
            exposeToCinematics: false,
            category: 'Default',
            replication: 'None',
            replicationCondition: 'None',
            // UE5 Advanced Properties
            configVariable: false,
            transient: false,
            saveGame: false,
            advancedDisplay: false,
            deprecated: false,
            deprecationMessage: "",
            // Property Flags
            cpfEdit: true,
            cpfBlueprintVisible: true,
            cpfZeroConstructor: true,
            cpfDisableEditOnInstance: true,
            cpfIsPlainOldData: true,
            cpfNoDestructor: true,
            cpfHasGetValueTypeHash: true
        };
    }

    createVariableFromPin(pin) {
        const name = this.generateUniqueVarName(pin.name.replace(/\s+/g, '').replace(/\(.+\)/, ''));
        const id = Utils.uniqueId('var');
        // Default promoted variables to NOT instance-editable
        const variable = this.createVariableObject(id, name, pin.type, pin.containerType, false);
        variable.description = `Promoted from pin ${pin.name}`;

        this.variables.set(name, variable);
        this.renderPanel();
        this.updateNodeLibrary();
        this.app.palette.populateList();
        return variable;
    }

    toggleNewVarInput() {
        // For legacy support, though we mainly use inline renaming now
        if (this.inputContainer) {
            const isVisible = this.inputContainer.style.display === 'grid';
            this.inputContainer.style.display = isVisible ? 'none' : 'grid';
            if (!isVisible) {
                this.nameInput.value = this.generateUniqueVarName('NewVar');
                this.nameInput.focus();
            }
        } else {
            this.addVariable();
        }
    }

    // Called when the (+) button is clicked
    addVariable() {
        const name = this.generateUniqueVarName('NewVar');
        const id = Utils.uniqueId('var');
        // Default to boolean, single, public (private unchecked)
        // Default to boolean, single, NOT instance-editable
        const variable = this.createVariableObject(id, name, 'bool', 'single', false);

        this.variables.set(name, variable);

        // Immediately trigger rename mode
        this.renamingVarId = id;

        this.renderPanel();
        this.updateNodeLibrary();
        this.app.palette.populateList();
        this.app.persistence.autoSave();
    }

    deleteVariable(variable) {
        const modal = document.getElementById('confirmation-modal');
        const msg = document.getElementById('confirmation-msg');
        const yesBtn = document.getElementById('confirm-yes-btn');
        const noBtn = document.getElementById('confirm-no-btn');
        if (!modal) return;
        msg.textContent = `Are you sure you want to delete variable '${variable.name}'?`;
        modal.style.display = 'flex';

        // Clone buttons to remove old listeners
        const newYes = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYes, yesBtn);
        const newNo = noBtn.cloneNode(true);
        noBtn.parentNode.replaceChild(newNo, noBtn);

        newYes.addEventListener('click', () => {
            this.executeVariableDeletion(variable);
            modal.style.display = 'none';
        });
        newNo.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    executeVariableDeletion(variable) {
        const name = variable.name;
        const getKey = `Get_${name}`;
        const setKey = `Set_${name}`;

        // Remove nodes from graph
        const nodesToDelete = [...this.app.graph.nodes.values()].filter(node =>
            node.nodeKey === getKey || node.nodeKey === setKey
        );
        nodesToDelete.forEach(node => {
            this.app.wiring.findLinksByNodeId(node.id).forEach(link => this.app.wiring.breakLinkById(link.id));
            if (node.element) node.element.remove();
            this.app.graph.nodes.delete(node.id);
        });

        this.variables.delete(name);
        nodeRegistry.unregister(getKey);
        nodeRegistry.unregister(setKey);

        if (this.app.details.currentVariable && this.app.details.currentVariable.id === variable.id) {
            this.app.details.clear();
        }

        this.renderPanel();
        this.app.palette.populateList();
        this.app.persistence.autoSave();
        this.app.compiler.log(`Variable '${name}' deleted.`);
    }

    updateVariableProperty(variable, property, newValue) {
        const oldValue = variable[property];
        let needsFullRender = false;
        let needsNodeLibraryUpdate = false;
        const affectedNodes = []; // Track nodes that need wire redraw

        if (property === 'type' && oldValue !== newValue) {
            variable.type = newValue;
            variable.defaultValue = this.getDefaultValueForType(newValue);
            needsFullRender = true;
            needsNodeLibraryUpdate = true; // Type changes affect Get/Set nodes
        } else if (property === 'containerType' && oldValue !== newValue) {
            variable.containerType = newValue;
            needsFullRender = true;
            needsNodeLibraryUpdate = true; // Container type changes affect Get/Set nodes
        } else if (property === 'name') {
            const oldName = oldValue;
            const newName = newValue;

            // Basic validation
            if (!newName || (this.isNameTaken(newName, variable.id))) {
                // If invalid, just revert visually in renderPanel or ignore
                return;
            }

            this.variables.delete(oldName);
            variable.name = newName;
            this.variables.set(newName, variable);

            needsNodeLibraryUpdate = true;
            this.app.compiler.registerRename(oldName, newName);

            needsFullRender = true;
        } else if (property === 'isInstanceEditable' || property === 'replication') {
            variable[property] = newValue;
            // Reset Replication Condition if Replication is None
            if (property === 'replication' && newValue === 'None') {
                variable.replicationCondition = 'None';
            }
            needsFullRender = true;
        } else if (property === 'defaultValue') {
            variable[property] = newValue;
            // Re-render the details panel to show updated array/map elements
            needsFullRender = true;
        } else {
            variable[property] = newValue;
        }

        // Update NodeLibrary if type, containerType, or name changed
        if (needsNodeLibraryUpdate) {
            this.updateNodeLibrary();

            // UPDATE GRAPH NODES
            for (const node of this.app.graph.nodes.values()) {
                let isMatch = false;
                if (property === 'name' && (node.nodeKey === `Get_${oldValue}` || node.nodeKey === `Set_${oldValue}`)) {
                    isMatch = true;
                } else if (node.nodeKey === `Get_${variable.name}` || node.nodeKey === `Set_${variable.name}`) {
                    isMatch = true;
                }

                if (isMatch) {
                    // Update Node Properties
                    node.variableType = variable.type;

                    // Update Pins
                    if (node.pins) {
                        node.pins.forEach(pin => {
                            // For Get/Set nodes, the data pin usually matches the variable type
                            // Exec pins should remain 'exec'
                            if (pin.type !== 'exec') {
                                pin.type = variable.type;
                                pin.containerType = variable.containerType;
                                // Reset default value if type changed to avoid type mismatch
                                if (property === 'type') {
                                    pin.defaultValue = pin.getDefaultValue();
                                }
                            }
                        });
                    }

                    // Force Re-render
                    this.app.wiring.updateVisuals(node);

                    // Track this node for wire redraw
                    affectedNodes.push(node);
                }
            }
        }

        // Persist
        this.app.persistence.autoSave();

        // Refresh UI
        if (needsFullRender || property === 'name') {
            this.renderPanel();

            // Optimized: Only redraw wires for affected nodes instead of all wires
            if (affectedNodes.length > 0) {
                // Redraw wires for affected nodes
                requestAnimationFrame(() => {
                    affectedNodes.forEach(node => {
                        this.app.graph.redrawNodeWires(node.id);
                    });
                });
            }

            this.app.palette.populateList();

            // If details panel is showing this variable, refresh it
            // Check by looking for the variable name input in the details panel
            const varNameInput = document.querySelector('#variable-name-input');
            if (varNameInput && varNameInput.value === variable.name) {
                // Get the fresh variable reference from the map
                const freshVariable = this.variables.get(variable.name);
                if (freshVariable) {
                    this.app.details.showVariableDetails(freshVariable, true); // true = force refresh and keep selection
                }
            }
        }
    }


    finishRenaming(variable, newName) {
        this.renamingVarId = null;
        if (newName && newName !== variable.name) {
            this.updateVariableProperty(variable, 'name', newName);
        } else {
            this.renderPanel(); // Just exit rename mode
        }
    }

    renderPanel() {
        this.listContainer.innerHTML = '';

        // Helper to create collapsible sections - REFACTORED to use ui-helpers
        const createSection = (title, id, onAdd) => {
            const section = document.createElement('div');
            section.className = 'sidebar-section';

            const content = document.createElement('div');
            content.id = id;
            content.style.display = 'block';

            createCollapsibleHeader(section, title, content, {
                onAdd: onAdd,
                isExpanded: true,
                iconClass: 'fas fa-caret-down'
            });

            section.appendChild(content);
            return { section, content };
        };

        // 1. GRAPHS
        const graphsSection = createSection('Graphs', 'section-graphs', () => { /* TODO: Add Graph */ });
        this.listContainer.appendChild(graphsSection.section);
        const eventGraphItem = document.createElement('div');
        eventGraphItem.className = 'tree-item';
        eventGraphItem.innerHTML = '<i class="fas fa-project-diagram" style="margin-right:6px; font-size:10px;"></i> EventGraph';
        graphsSection.content.appendChild(eventGraphItem);

        // 2. FUNCTIONS
        const funcSection = createSection('Functions', 'section-functions', () => { /* TODO: Add Function */ });
        this.listContainer.appendChild(funcSection.section);

        // 3. MACROS
        const macroSection = createSection('Macros', 'section-macros', () => { /* TODO: Add Macro */ });
        this.listContainer.appendChild(macroSection.section);

        // 4. VARIABLES
        const varSection = createSection('Variables', 'section-variables', () => this.addVariable());
        this.listContainer.appendChild(varSection.section);

        for (const variable of this.variables.values()) {
            const el = document.createElement('div');
            el.className = 'ue5-variable-item';
            el.dataset.varId = variable.id;
            el.setAttribute('tabindex', '0');

            if (this.app.details.currentVariable && this.app.details.currentVariable.id === variable.id) {
                el.classList.add('selected');
            }

            // Drag Logic
            el.draggable = true;
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', `VARIABLE:${variable.name}`);
                e.dataTransfer.effectAllowed = 'copy';
            });

            // Click Logic
            el.addEventListener('click', (e) => {
                this.app.details.currentVariable = variable;
                this.app.details.showVariableDetails(variable, true);
                this.renderPanel();
            });

            // Variable name (left side)
            if (this.renamingVarId === variable.id) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = variable.name;
                input.className = 'ue5-variable-rename-input';

                const commit = () => this.finishRenaming(variable, input.value.trim());
                input.addEventListener('blur', commit);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        input.blur();
                    }
                });

                el.appendChild(input);
                requestAnimationFrame(() => {
                    input.focus();
                    input.select();
                });
            } else {
                const nameSpan = document.createElement('span');
                nameSpan.className = 'ue5-variable-name-text';
                nameSpan.textContent = variable.name;

                // Double click to rename
                nameSpan.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    this.renamingVarId = variable.id;
                    this.renderPanel();
                });

                el.appendChild(nameSpan);
            }

            // Right group: container icon + type name + menu
            const rightGroup = document.createElement('div');
            rightGroup.className = 'ue5-variable-type-group';

            // Container type icon
            const color = Utils.getPinColor(variable.type);
            const iconSpan = document.createElement('span');
            iconSpan.className = 'ue5-variable-type-icon';
            iconSpan.style.display = 'flex';
            iconSpan.style.alignItems = 'center';
            iconSpan.style.justifyContent = 'center';
            iconSpan.style.width = '16px';

            if (variable.containerType === 'array') {
                // Array: 3x3 grid, colored
                iconSpan.innerHTML = `<i class="fas fa-th" style="color: ${color}; font-size: 10px;"></i>`;
            } else if (variable.containerType === 'set') {
                // Set: Curly braces, colored
                iconSpan.innerHTML = `<span style="color: ${color}; font-size: 10px; font-weight: bold;">{ }</span>`;
            } else if (variable.containerType === 'map') {
                // Map: List icon, colored
                iconSpan.innerHTML = `<i class="fas fa-list-ul" style="color: ${color}; font-size: 10px;"></i>`;
            } else {
                // Single: Pill shape, colored
                iconSpan.innerHTML = `<span style="background-color: ${color}; width: 8px; height: 4px; border-radius: 2px; display: inline-block;"></span>`;
            }

            // Type name
            const typeName = document.createElement('span');
            typeName.className = 'ue5-variable-type-name';
            typeName.textContent = variable.type.charAt(0).toUpperCase() + variable.type.slice(1);
            typeName.style.color = color;
            // Inline styles removed in favor of CSS class .ue5-variable-type-name

            // Eye icon (Instance Editable indicator)
            const eyeIcon = document.createElement('i');
            // Use specific classes for styling
            eyeIcon.className = `fas ${variable.isInstanceEditable ? 'fa-eye active' : 'fa-eye-slash'} var-eye-icon`;
            eyeIcon.title = variable.isInstanceEditable ? 'Public (Instance Editable)' : 'Private';
            eyeIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.updateVariableProperty(variable, 'isInstanceEditable', !variable.isInstanceEditable);
            });

            // Menu icon (3 dots) - Optional, but present in current UI
            // const menuIcon = document.createElement('i');
            // menuIcon.className = 'fas fa-ellipsis-v ue5-variable-menu-icon';
            // ...

            rightGroup.appendChild(iconSpan);
            rightGroup.appendChild(typeName);
            rightGroup.appendChild(eyeIcon);
            // rightGroup.appendChild(menuIcon); // Removed to match cleaner look if desired, or keep if needed. Reference 1 is clean.

            el.appendChild(rightGroup);

            varSection.content.appendChild(el);
        }

        // 5. EVENT DISPATCHERS
        const eventSection = createSection('Event Dispatchers', 'section-events', () => { /* TODO: Add Event Dispatcher */ });
        this.listContainer.appendChild(eventSection.section);
    }

    updateNodeLibrary() {
        const allKeys = Object.keys(nodeRegistry.getAll());
        for (const key of allKeys) {
            if (key.startsWith('Get_') || key.startsWith('Set_')) {
                nodeRegistry.unregister(key);
            }
        }
        for (const variable of this.variables.values()) {
            const pinDefault = { defaultValue: variable.defaultValue };
            nodeRegistry.register(`Get_${variable.name}`, {
                title: `Get ${variable.name}`,
                category: 'Variables',
                type: "pure-node",
                variableType: variable.type,
                variableId: variable.id,
                icon: "fa-arrow-down",
                pins: [
                    { id: "val_out", name: variable.name, type: variable.type, dir: "out", containerType: variable.containerType, ...pinDefault }
                ]
            });
            nodeRegistry.register(`Set_${variable.name}`, {
                title: `Set ${variable.name}`,
                category: 'Variables',
                type: "variable-node",
                variableType: variable.type,
                variableId: variable.id,
                icon: "fa-arrow-up",
                pins: [
                    { id: "exec_in", name: "Exec", type: "exec", dir: "in" },
                    { id: "val_in", name: variable.name, type: variable.type, dir: "in", containerType: variable.containerType, ...pinDefault },
                    { id: "exec_out", name: "Exec", type: "exec", dir: "out" },
                    { id: "val_out", name: variable.name, type: variable.type, dir: "out", containerType: variable.containerType }
                ]
            });
        }
        this.app.palette.populateList();
    }

    loadState(state) {
        this.variables.clear();
        if (state.variables) {
            state.variables.forEach(v => {
                // Migration logic ensures all new fields are present
                if (v.configVariable === undefined) v.configVariable = false;
                if (v.transient === undefined) v.transient = false;
                if (v.saveGame === undefined) v.saveGame = false;
                if (v.advancedDisplay === undefined) v.advancedDisplay = false;
                if (v.deprecated === undefined) v.deprecated = false;
                if (v.deprecationMessage === undefined) v.deprecationMessage = "";
                if (v.cpfEdit === undefined) v.cpfEdit = true;
                if (v.cpfBlueprintVisible === undefined) v.cpfBlueprintVisible = true;
                if (v.cpfZeroConstructor === undefined) v.cpfZeroConstructor = true;
                if (v.cpfDisableEditOnInstance === undefined) v.cpfDisableEditOnInstance = true;
                if (v.cpfIsPlainOldData === undefined) v.cpfIsPlainOldData = true;
                if (v.cpfNoDestructor === undefined) v.cpfNoDestructor = true;
                if (v.cpfHasGetValueTypeHash === undefined) v.cpfHasGetValueTypeHash = true;
                if (v.blueprintReadOnly === undefined) v.blueprintReadOnly = false;
                if (v.exposeOnSpawn === undefined) v.exposeOnSpawn = false;
                if (v.private === undefined) v.private = false;
                if (v.exposeToCinematics === undefined) v.exposeToCinematics = false;
                if (v.category === undefined) v.category = 'Default';
                if (v.replication === undefined) v.replication = 'None';
                if (v.replicationCondition === undefined) v.replicationCondition = 'None';

                this.variables.set(v.name, v);
            });
        }
        this.renderPanel();
        this.updateNodeLibrary();
    }
}
