/**
 * UI Panel Logic: VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController.
 * This file handles all side panel and menu interactions.
 */
import { Utils, NodeLibrary } from './utils.js';
import { Pin } from './graph.js';

// Added LayoutController for resizable panels
class LayoutController {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('app-container');
        this.resizerLeft = document.getElementById('resizer-left');
        this.resizerRight = document.getElementById('resizer-right');
        this.resizerBottom = document.getElementById('resizer-bottom');

        // Initial sizes (matching CSS defaults)
        this.leftWidth = 280;
        this.rightWidth = 300;
        this.bottomHeight = 200;

        this.isResizing = false;
        this.currentResizer = null;
        this.startX = 0;
        this.startY = 0;
        this.startSize = 0;

        this.initResizers();
    }

    initResizers() {
        const attach = (resizer, type) => {
            resizer.addEventListener('mousedown', (e) => {
                this.isResizing = true;
                this.currentResizer = type;
                this.startX = e.clientX;
                this.startY = e.clientY;

                if (type === 'left') this.startSize = this.leftWidth;
                if (type === 'right') this.startSize = this.rightWidth;
                if (type === 'bottom') this.startSize = this.bottomHeight;

                document.body.style.cursor = type === 'bottom' ? 'row-resize' : 'col-resize';
                e.preventDefault();
            });
        };

        attach(this.resizerLeft, 'left');
        attach(this.resizerRight, 'right');
        attach(this.resizerBottom, 'bottom');

        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;

        if (this.currentResizer === 'left') {
            const delta = e.clientX - this.startX;
            this.leftWidth = Math.max(150, this.startSize + delta); // Min width 150
        }
        else if (this.currentResizer === 'right') {
            const delta = this.startX - e.clientX; // Drag left increases width
            this.rightWidth = Math.max(150, this.startSize + delta);
        }
        else if (this.currentResizer === 'bottom') {
            const delta = this.startY - e.clientY; // Drag up increases height
            this.bottomHeight = Math.max(100, this.startSize + delta);
        }

        this.updateLayout();
    }

    handleMouseUp() {
        this.isResizing = false;
        this.currentResizer = null;
        document.body.style.cursor = '';
        // Optional: Trigger canvas resize on graph grid
        if (this.app.grid) this.app.grid.resize();
    }

    updateLayout() {
        // Update CSS Grid Template Columns and Rows based on new pixel values
        // Columns: Left | Resizer | Graph | Resizer | Right
        this.container.style.gridTemplateColumns = `${this.leftWidth}px 4px 1fr 4px ${this.rightWidth}px`;

        // Rows: Toolbar | Graph | Resizer | Bottom
        this.container.style.gridTemplateRows = `32px 1fr 4px ${this.bottomHeight}px`;
    }
}

class VariableController {
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
            private: !isPublic,
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
        // Default promoted variables to Public (Instance Editable)
        const variable = this.createVariableObject(id, name, pin.type, pin.containerType, true);
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
        // Default to boolean, single, private
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
        delete NodeLibrary[getKey];
        delete NodeLibrary[setKey];

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
        } else if (property === 'isInstanceEditable') {
            variable[property] = newValue;
            // Sync private flag logic
            variable.private = !newValue;
            needsFullRender = true;
        } else {
            variable[property] = newValue;
        }

        // Update NodeLibrary if type, containerType, or name changed
        if (needsNodeLibraryUpdate) {
            this.updateNodeLibrary();

            // UPDATE GRAPH NODES
            // Track nodes that need wire redraw
            const affectedNodes = [];
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

        // Helper to create collapsible sections
        const createSection = (title, id, onAdd) => {
            const section = document.createElement('div');
            section.className = 'sidebar-section';

            // Header
            const header = document.createElement('div');
            header.className = 'sidebar-section-header';

            const titleGroup = document.createElement('div');
            titleGroup.className = 'title-group';
            const arrow = document.createElement('i');
            arrow.className = 'fas fa-caret-down'; // Expanded by default
            const text = document.createElement('span');
            text.textContent = title;
            titleGroup.appendChild(arrow);
            titleGroup.appendChild(text);

            const actionGroup = document.createElement('div');
            actionGroup.className = 'action-group';
            // UPDATED: Use generic fa-plus but we'll style it to look like the circle icon in CSS
            const addBtn = document.createElement('i');
            addBtn.className = 'fas fa-plus section-add-icon';
            if (onAdd) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onAdd();
                });
            }
            actionGroup.appendChild(addBtn);

            header.appendChild(titleGroup);
            header.appendChild(actionGroup);

            const content = document.createElement('div');
            content.id = id;
            content.style.display = 'block';

            header.addEventListener('click', () => {
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                arrow.className = isHidden ? 'fas fa-caret-down' : 'fas fa-caret-right';
            });

            section.appendChild(header);
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
            el.className = 'tree-item my-blueprint-variable-row';
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

            // --- CONTENT GENERATION (New Layout) ---

            // LEFT: Name (or Input if renaming)
            const leftGroup = document.createElement('div');
            leftGroup.className = 'var-left';

            if (this.renamingVarId === variable.id) {
                // RENDER INPUT
                const input = document.createElement('input');
                input.type = 'text';
                input.value = variable.name;
                input.className = 'var-name-edit'; // Special style for blue background

                // Events to commit rename
                const commit = () => this.finishRenaming(variable, input.value.trim());

                input.addEventListener('blur', commit);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        input.blur(); // triggers commit
                    }
                });

                leftGroup.appendChild(input);

                // Auto-focus
                requestAnimationFrame(() => {
                    input.focus();
                    input.select();
                });
            } else {
                // RENDER TEXT
                const nameSpan = document.createElement('span');
                nameSpan.textContent = variable.name;
                // Allow double click to rename
                nameSpan.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    this.renamingVarId = variable.id;
                    this.renderPanel();
                });
                leftGroup.appendChild(nameSpan);
            }

            // RIGHT: Pill + Type + Eye
            const rightGroup = document.createElement('div');
            rightGroup.className = 'var-right';

            // 1. Variable Type Icon (Pill, Grid, Set, Map)
            const typeIconContainer = document.createElement('div');
            const color = Utils.getPinColor(variable.type);

            // Dynamic rendering based on container type
            if (variable.containerType === 'array') {
                typeIconContainer.innerHTML = `<i class="fas fa-th" style="color:${color}; font-size:10px; margin-right: 2px;"></i>`;
            } else if (variable.containerType === 'set') {
                typeIconContainer.innerHTML = `<span style="color:${color}; font-weight:bold; font-size:10px; margin-right: 2px;">{ }</span>`;
            } else if (variable.containerType === 'map') {
                typeIconContainer.innerHTML = `<i class="fas fa-list-ul" style="color:${color}; font-size:10px; margin-right: 2px;"></i>`;
            } else {
                // Default Single Pill
                const pill = document.createElement('span');
                pill.className = 'var-color-pill';
                pill.style.backgroundColor = color;
                typeIconContainer.appendChild(pill);
            }

            // 2. Type Name (Clickable)
            const typeName = document.createElement('span');
            typeName.className = 'var-type-tag';
            typeName.textContent = variable.type.charAt(0).toUpperCase() + variable.type.slice(1);
            typeName.style.cursor = 'pointer';
            typeName.addEventListener('click', (e) => {
                e.stopPropagation();
                // Use DetailsController's type menu logic
                const rect = typeName.getBoundingClientRect();
                this.app.details.showTypeMenu(rect.left, rect.bottom + 5, (newType) => {
                    this.updateVariableProperty(variable, 'type', newType);
                });
            });

            // 3. Eye Icon (Public/Private Toggle)
            const eyeIcon = document.createElement('i');
            // UE5 style: "closed eye" is typical for private, open for public
            // Added 'var-eye-icon' class for specific styling
            eyeIcon.className = (variable.isInstanceEditable ? 'fas fa-eye' : 'fas fa-eye-slash') + ' var-eye-icon';

            // UPDATED: Correct tooltip text based on visibility state
            eyeIcon.title = variable.isInstanceEditable
                ? 'Variable is public and is editable on each instance of this Blueprint.'
                : 'Variable is not public and will not be editable on an instance of this Blueprint.';

            if (!variable.isInstanceEditable) {
                eyeIcon.style.opacity = '0.5';
            }

            eyeIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.updateVariableProperty(variable, 'isInstanceEditable', !variable.isInstanceEditable);
            });

            rightGroup.appendChild(typeIconContainer);
            rightGroup.appendChild(typeName);
            rightGroup.appendChild(eyeIcon);

            el.appendChild(leftGroup);
            el.appendChild(rightGroup);

            varSection.content.appendChild(el);
        }

        // 5. EVENT DISPATCHERS
        const eventSection = createSection('Event Dispatchers', 'section-events', () => { /* TODO: Add Event Dispatcher */ });
        this.listContainer.appendChild(eventSection.section);
    }

    updateNodeLibrary() {
        for (const key of Object.keys(NodeLibrary)) {
            if (key.startsWith('Get_') || key.startsWith('Set_')) {
                delete NodeLibrary[key];
            }
        }
        for (const variable of this.variables.values()) {
            const pinDefault = { defaultValue: variable.defaultValue };
            NodeLibrary[`Get_${variable.name}`] = {
                title: `Get ${variable.name}`,
                type: "pure-node",
                variableType: variable.type,
                variableId: variable.id,
                icon: "fa-arrow-down",
                pins: [
                    { id: "val_out", name: variable.name, type: variable.type, dir: "out", containerType: variable.containerType, ...pinDefault }
                ]
            };
            NodeLibrary[`Set_${variable.name}`] = {
                title: `Set ${variable.name}`,
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
            };
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

                this.variables.set(v.name, v)
            });
        }
        this.renderPanel();
        this.updateNodeLibrary();
    }
}

class PaletteController {
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
        const filtered = nodeNames.filter(name =>
            name.toLowerCase().includes(filter) ||
            (NodeLibrary[name].title && NodeLibrary[name].title.toLowerCase().includes(filter))
        );
        filtered.forEach(name => {
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
            this.container.appendChild(el);
        });
    }
}

class ActionMenu {
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
        let needsSeparatorBeforeNodes = hasVariableAccess || contextHeader;
        const nodeNames = Object.keys(NodeLibrary);
        let filtered = nodeNames.filter(name => {
            const isVariableNode = name.startsWith('Get_');
            const nodeData = NodeLibrary[name];
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
        filtered.sort((a, b) => {
            const typeA = NodeLibrary[a].type;
            const typeB = NodeLibrary[b].type;
            const order = { 'event-node': 1, 'flow-node': 2, 'function-node': 3, 'pure-node': 4, 'comment-node': 6 };
            return (order[typeA] || 99) - (order[typeB] || 99);
        });
        if (filtered.length > 0 && needsSeparatorBeforeNodes) {
            const sep = document.createElement('div');
            sep.className = 'menu-separator';
            this.list.appendChild(sep);
        }
        filtered.forEach(name => {
            const nodeData = NodeLibrary[name];
            const li = document.createElement('div');
            li.className = 'menu-item';
            li.textContent = nodeData.title || name;
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
            this.list.appendChild(li);
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

class ContextMenu {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('context-menu');
        this.element.addEventListener('click', e => e.stopPropagation());
        document.addEventListener('click', () => this.hide());
    }
    show(x, y, items) {
        this.element.innerHTML = '';
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'menu-separator';
                this.element.appendChild(sep);
            } else {
                const div = document.createElement('div');
                div.className = 'menu-item';
                div.textContent = item.label;
                div.onclick = () => {
                    item.callback();
                    this.hide();
                };
                this.element.appendChild(div);
            }
        });
        this.element.style.display = 'block';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.app.actionMenu.hide();
    }
    hide() {
        this.element.style.display = 'none';
    }
}

class DetailsController {
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
            item.className = 'type-option'; // Reuse style
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '8px';
            item.innerHTML = `${opt.iconHTML} <span>${opt.label}</span>`;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                callback(opt.id);
                menu.remove();
                this.containerMenu = null;
            });
            menu.appendChild(item);
        });

        document.body.appendChild(menu);
        this.containerMenu = menu;

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

    // Helper to get the HTML icon for the container pill
    getContainerIcon(containerType, variableType) {
        const color = Utils.getPinColor(variableType);
        switch (containerType) {
            case 'array': return `<i class="fas fa-th" style="color: ${color};"></i>`;
            case 'set': return `<span style="color: ${color}; font-weight: bold; font-size: 10px;">{ }</span>`;
            case 'map': return `<i class="fas fa-list-ul" style="color: ${color};"></i>`;
            default: return `<span class="param-color-dot" style="background-color: ${color};"></span>`; // Single
        }
    }

    // UPDATED: Variable and Default Value sections are now collapsible (default: Expanded)
    showVariableDetails(variable, isPrimarySelection = false) {
        if (isPrimarySelection) {
            this.currentVariable = variable;
            this.app.graph.clearSelection();
        }

        this.app.wiring.clearLinkSelection();

        // --- NEW: UE5-Style Panel Layout ---
        this.panel.innerHTML = ''; // Force DOM clear for refresh
        this.panel.innerHTML = `
            <!-- Variable Section -->
            <div class="details-group">
                <div id="variable-toggle" style="display: flex; align-items: center; color: #ddd; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase; margin-bottom: 10px;">
                    <i id="variable-icon" class="fas fa-caret-down" style="width: 15px;"></i> <span>VARIABLE</span>
                </div>
                
                <div id="variable-content">
                    <!-- Variable Name -->
                    <div class="detail-row">
                        <label>Variable Name</label>
                        <input type="text" id="variable-name-input" class="details-input" value="${variable.name}" data-prop="name">
                    </div>

                    <!-- Variable Type (Custom Pill Selectors) -->
                    <div class="detail-row">
                        <label>Variable Type</label>
                        <div style="display: flex; gap: 5px; align-items: center; flex-grow: 1;">
                            
                            <!-- Type Trigger Pill -->
                            <div id="var-type-trigger" class="ue5-dropdown-pill" style="flex-grow: 1; margin-right: 2px;">
                                <span class="param-color-dot" style="background-color: ${Utils.getPinColor(variable.type)}"></span>
                                <span style="margin-left: 8px; flex-grow: 1; text-align: left;">${variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}</span>
                                <i class="fas fa-chevron-down" style="font-size: 8px; margin-left: 4px;"></i>
                            </div>

                            <!-- Container Trigger Pill -->
                            <div id="var-container-trigger" class="ue5-dropdown-pill" style="width: 40px; justify-content: center;">
                                ${this.getContainerIcon(variable.containerType, variable.type)}
                                <i class="fas fa-chevron-down" style="margin-left: 4px; font-size: 8px;"></i>
                            </div>

                        </div>
                    </div>

                    <!-- Description -->
                    <div class="detail-row">
                        <label>Description</label>
                        <input type="text" id="variable-description-input" class="details-input" value="${variable.description || ''}" data-prop="description" placeholder="Tooltip">
                    </div>

                    <!-- Flags Section (Right Aligned Checkboxes) -->
                    <div class="detail-checkbox-row">
                        <label>Instance Editable</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="isInstanceEditable" ${variable.isInstanceEditable ? 'checked' : ''}>
                    </div>

                    <div class="detail-checkbox-row">
                        <label>Blueprint Read Only</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="blueprintReadOnly" ${variable.blueprintReadOnly ? 'checked' : ''}>
                    </div>

                    <div class="detail-checkbox-row">
                        <label>Expose on Spawn</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="exposeOnSpawn" ${variable.exposeOnSpawn ? 'checked' : ''}>
                    </div>

                    <div class="detail-checkbox-row">
                        <label>Private</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="private" ${variable.private ? 'checked' : ''}>
                    </div>

                    <div class="detail-checkbox-row">
                        <label>Expose to Cinematics</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="exposeToCinematics" ${variable.exposeToCinematics ? 'checked' : ''}>
                    </div>

                    <!-- Category -->
                    <div class="detail-row">
                        <label>Category</label>
                        <select class="details-select" data-prop="category" style="flex-grow: 1;">
                            <option value="Default" ${variable.category === 'Default' ? 'selected' : ''}>Default</option>
                            <option value="Config" ${variable.category === 'Config' ? 'selected' : ''}>Config</option>
                        </select>
                    </div>
                    
                    <!-- Replication (Dropdowns) -->
                    <div class="detail-row">
                        <label>Replication</label>
                        <select class="details-select" data-prop="replication" style="flex-grow: 1;">
                            <option value="None" ${variable.replication === 'None' ? 'selected' : ''}>None</option>
                            <option value="Replicated" ${variable.replication === 'Replicated' ? 'selected' : ''}>Replicated</option>
                            <option value="RepNotify" ${variable.replication === 'RepNotify' ? 'selected' : ''}>RepNotify</option>
                        </select>
                    </div>

                    <div class="detail-row">
                        <label>Replication Condition</label>
                        <select class="details-select" data-prop="replicationCondition" style="flex-grow: 1;">
                            <option value="None" ${variable.replicationCondition === 'None' ? 'selected' : ''}>None</option>
                            <option value="InitialOnly" ${variable.replicationCondition === 'InitialOnly' ? 'selected' : ''}>Initial Only</option>
                            <option value="OwnerOnly" ${variable.replicationCondition === 'OwnerOnly' ? 'selected' : ''}>Owner Only</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Collapsible Advanced Section -->
            <div class="details-group" style="border-bottom: none; padding-bottom: 0;">
                <div id="advanced-toggle" style="display: flex; align-items: center; color: #ddd; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                     <i id="advanced-icon" class="fas fa-caret-right" style="width: 15px;"></i> <span>Advanced</span>
                </div>
            </div>

            <div id="advanced-content" class="advanced-details-content">
                <div class="details-group" style="padding-top: 5px;">
                    <!-- Config Variable -->
                    <div class="detail-checkbox-row">
                        <label>Config Variable</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="configVariable" ${variable.configVariable ? 'checked' : ''}>
                    </div>
                    <!-- Transient -->
                    <div class="detail-checkbox-row">
                        <label>Transient</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="transient" ${variable.transient ? 'checked' : ''}>
                    </div>
                    <!-- SaveGame -->
                    <div class="detail-checkbox-row">
                        <label>SaveGame</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="saveGame" ${variable.saveGame ? 'checked' : ''}>
                    </div>
                     <!-- Advanced Display -->
                    <div class="detail-checkbox-row">
                        <label>Advanced Display</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="advancedDisplay" ${variable.advancedDisplay ? 'checked' : ''}>
                    </div>
                    <!-- Deprecated -->
                    <div class="detail-checkbox-row">
                        <label>Deprecated</label>
                        <input type="checkbox" class="ue5-checkbox" data-prop="deprecated" ${variable.deprecated ? 'checked' : ''}>
                    </div>
                    <!-- Deprecation Message -->
                    <div class="detail-row">
                        <label>Deprecation Message</label>
                        <input type="text" class="details-input" data-prop="deprecationMessage" value="${variable.deprecationMessage || ''}" style="opacity: ${variable.deprecated ? '1' : '0.3'}" ${variable.deprecated ? '' : 'disabled'}>
                    </div>
                </div>
            </div>

            <!-- Collapsible Default Value Section -->
            <div class="details-group">
                <div id="default-toggle" style="display: flex; align-items: center; color: #ddd; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase; margin-bottom: 10px;">
                     <i id="default-icon" class="fas fa-caret-down" style="width: 15px;"></i> <span>Default Value</span>
                </div>
                <div id="default-content">
                    ${this.renderDefaultValueInput(variable)}
                </div>
            </div>
        `;

        // Reusable function to attach toggle behavior
        const setupToggle = (toggleId, contentId, iconId, isExpanded = true) => {
            const toggle = this.panel.querySelector(`#${toggleId}`);
            const content = this.panel.querySelector(`#${contentId}`);
            const icon = this.panel.querySelector(`#${iconId}`);

            if (toggle && content && icon) {
                // Set initial state
                content.style.display = isExpanded ? 'block' : 'none';
                icon.className = isExpanded ? 'fas fa-caret-down' : 'fas fa-caret-right';

                toggle.addEventListener('click', () => {
                    const isHidden = content.style.display === 'none' || content.style.display === '';
                    content.style.display = isHidden ? 'block' : 'none';
                    icon.className = isHidden ? 'fas fa-caret-down' : 'fas fa-caret-right';
                });
            }
        }

        // Initialize toggles with specific default states
        setupToggle('variable-toggle', 'variable-content', 'variable-icon', true); // Variable: Expanded
        setupToggle('advanced-toggle', 'advanced-content', 'advanced-icon', false); // Advanced: Collapsed
        setupToggle('default-toggle', 'default-content', 'default-icon', true); // Default Value: Expanded

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
                    this.app.variables.updateVariableProperty(variable, 'containerType', newContainerType);
                });
            });
        }

        // Bind generic handlers (for inputs and standard selects)
        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            input.addEventListener('change', (e) => {
                const prop = e.target.dataset.prop;
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
                this.app.variables.updateVariableProperty(variable, prop, value);
            });
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.addEventListener('input', (e) => {
                    const prop = e.target.dataset.prop;
                    let value = e.target.value;
                    if (e.target.type === 'number') {
                        value = parseFloat(e.target.value);
                    }
                    this.app.variables.updateVariableProperty(variable, prop, value);
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

    renderDefaultValueInput(variable) {
        const type = variable.type;
        const value = variable.defaultValue;
        const label = variable.name;

        if (type === 'bool') {
            return `
                <div class="detail-row">
                    <label>${label}</label>
                    <input type="checkbox" id="default-value-input" class="ue5-checkbox" data-prop="defaultValue" ${value ? 'checked' : ''}>
                </div>
            `;
        }
        if (type === 'int' || type === 'int64' || type === 'byte' || type === 'float') {
            const step = (type === 'float') ? '0.01' : '1';
            return `
                <div class="detail-row">
                    <label>${label}</label>
                    <input type="number" id="default-value-input" class="details-input" value="${value}" step="${step}" data-prop="defaultValue">
                </div>
            `;
        }
        if (type === 'string' || type === 'name' || type === 'text') {
            return `
                <div class="detail-row">
                    <label>${label}</label>
                    <input type="text" id="default-value-input" class="details-input" value="${value}" data-prop="defaultValue">
                </div>
            `;
        }
        if (type === 'vector' || type === 'rotator' || type === 'transform') {
            return `
                <div class="detail-row-column">
                    <label>Value (X, Y, Z)</label>
                    <input type="text" id="default-value-input" class="details-input" value="${value}" data-prop="defaultValue" style="width: 100%;">
                </div>
            `;
        }

        return `<p class="detail-value-static">No editor available for type: ${type}</p>`;
    }

    showNodeDetails(node) {
        this.currentVariable = null;
        this.app.wiring.clearLinkSelection();

        if (node.nodeKey.startsWith('Get_') || node.nodeKey.startsWith('Set_')) {
            const key = node.nodeKey;
            const underscoreIndex = key.indexOf('_');
            if (underscoreIndex !== -1) {
                let varName = key.substring(underscoreIndex + 1);
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

export { VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController, LayoutController };