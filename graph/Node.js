/**
 * Node and Pin classes for Blueprint graph visual scripting.
 * Extracted from graph.js for modularity.
 */
import { Utils } from '../utils.js';

// --- CORE DATA MODEL CLASSES ---

/**
 * Represents a single data pin on a node.
 */
export class Pin {
    constructor(node, pinData) {
        this.id = pinData.id.includes(node.id) ? pinData.id : `${node.id}-${pinData.id}`;
        this.node = node;
        this.name = pinData.name;
        this.type = (pinData.type || '').toLowerCase(); // Safe lowercasing
        this.dir = pinData.dir;
        this.element = null;
        this.links = [];
        this.containerType = pinData.containerType || 'single';
        this.defaultValue = pinData.defaultValue !== undefined ? pinData.defaultValue : this.getDefaultValue();
        this.isCustom = pinData.isCustom || false;
    }

    getDefaultValue() {
        switch (this.type) {
            case 'bool': return false;
            case 'int':
            case 'int64':
            case 'byte': return 0;
            case 'float': return 0.0;
            default: return '';
        }
    }

    isConnected() { return this.links.length > 0; }

    getMaxLinks() {
        if (this.dir === 'in' && this.type !== 'exec') {
            return 1;
        }
        return Infinity;
    }
}

/**
 * Represents a single node in the graph canvas.
 */
export class Node {
    constructor(id, nodeData, x, y, nodeKey, app) {
        this.id = id;
        this.title = nodeData.title || "Unknown Node";
        this.type = nodeData.type || "pure-node";
        this.icon = nodeData.icon;
        this.devWarning = nodeData.devWarning;
        this.variableType = nodeData.variableType;
        this.variableId = nodeData.variableId;
        this.app = app;
        this.nodeKey = nodeKey;
        this.x = x;
        this.y = y;
        this.element = null;

        this.customData = nodeData.customData || {};

        const pinDataArray = nodeData.pins || [];
        this.pins = pinDataArray.map(p => new Pin(this, p));
        this.refreshPinCache();

        this.pinLiterals = new Map();
        this.pins.forEach(p => {
            // Use the pin's default value or the loaded default value if present.
            // When loading, pinData.defaultValue holds the literal value saved.
            const literalValue = pinDataArray.find(pd => pd.id === p.id.replace(`${this.id}-`, ''))?.literalValue;
            this.pinLiterals.set(p.id, literalValue !== undefined ? literalValue : p.defaultValue);
        });
    }

    refreshPinCache() {
        if (!this.pins) this.pins = [];
        this.pinsIn = this.pins.filter(p => p.dir === 'in');
        this.pinsOut = this.pins.filter(p => p.dir === 'out');
    }

    /**
     * Finds a pin by its full ID (format: nodeId-pinName).
     * @param {string} pinId - The full pin identifier.
     * @returns {Pin|null} The found pin, or null.
     */
    findPinById(pinId) {
        return this.pins.find(p => p.id === pinId);
    }

    render() {

        if (!this.nodeKey) {
            console.error(`Node ${this.id} missing nodeKey.`);
            this.nodeKey = 'INVALID_NODE';
        }

        if (this.nodeKey.startsWith('Get_') || this.nodeKey.startsWith('Conv_')) {
            return this.renderCompactNode();
        }
        if (this.nodeKey.startsWith('Set_')) {
            return this.renderSetNode();
        }


        const element = document.createElement('div');
        element.id = this.id;
        element.className = `node ${this.type}`;
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;

        const header = document.createElement('div');
        header.className = 'node-title';

        if (this.variableType) {
            const gradient = Utils.getVariableHeaderColor(this.variableType);
            header.style.background = `linear-gradient(to bottom, ${gradient.start}, ${gradient.end})`;
            header.style.borderBottomColor = 'rgba(0,0,0,0.5)';
        }

        if (this.icon) {
            const iconEl = document.createElement('span');
            if (this.icon.startsWith('fa-')) {
                iconEl.className = `fas ${this.icon}`;
            } else if (this.type === 'function-node' && this.icon === 'f') {
                iconEl.style.fontWeight = 'bold';
                iconEl.style.fontStyle = 'italic';
                iconEl.style.color = 'white';
                iconEl.textContent = 'f';
            } else {
                iconEl.textContent = this.icon;
            }
            header.appendChild(iconEl);
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = this.title;
        header.appendChild(titleSpan);

        if (this.type === 'event-node') {
            const delegateIcon = document.createElement('div');
            delegateIcon.className = 'event-delegate-icon';
            delegateIcon.title = "Output Delegate";
            header.appendChild(delegateIcon);
        }

        if (this.type === 'comment-node' || this.nodeKey === 'CustomEvent') {
            header.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                header.contentEditable = true;
                header.focus();
                document.execCommand('selectAll', false, null);
                header.classList.add('editing-title');
            });

            const finishEditing = () => {
                header.contentEditable = false;
                this.title = header.textContent;
                header.classList.remove('editing-title');
                if (this.app.details && this.app.graph.selectedNodes.has(this.id)) {
                    if (this.nodeKey === 'CustomEvent') {
                        this.app.details.showNodeDetails(this);
                    }
                }
                this.app.persistence.autoSave();
            };

            header.addEventListener('blur', finishEditing);
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    header.blur();
                }
            });
            header.addEventListener('mousedown', (e) => {
                if (header.isContentEditable) {
                    e.stopPropagation();
                }
            });
        }

        element.appendChild(header);

        const content = document.createElement('div');
        content.className = 'node-content';

        if (this.type === 'pure-node') {
            content.classList.add('pure-node-content');
            const inCol = document.createElement('div');
            inCol.className = 'pin-column in';
            this.pinsIn.forEach(pinIn => inCol.appendChild(this.renderPin(pinIn)));
            content.appendChild(inCol);

            const outCol = document.createElement('div');
            outCol.className = 'pin-column out';
            this.pinsOut.forEach(pinOut => outCol.appendChild(this.renderPin(pinOut)));
            content.appendChild(outCol);
        } else {
            // SAFEGUARD: Ensure pins arrays exist and have length before checking
            const inLen = this.pinsIn ? this.pinsIn.length : 0;
            const outLen = this.pinsOut ? this.pinsOut.length : 0;
            const maxRows = Math.max(inLen, outLen);

            for (let i = 0; i < maxRows; i++) {
                const row = document.createElement('div');
                row.className = 'pin-row';

                const pinIn = this.pinsIn[i];
                const pinOut = this.pinsOut[i];

                if (pinIn) {
                    row.appendChild(this.renderPin(pinIn));
                } else {
                    const spacer = document.createElement('div');
                    spacer.style.minWidth = '10px';
                    row.appendChild(spacer);
                }

                if (pinOut) {
                    row.appendChild(this.renderPin(pinOut));
                } else {
                    const spacer = document.createElement('div');
                    spacer.minWidth = '10px';
                    row.appendChild(spacer);
                }
                content.appendChild(row);
            }
        }

        element.appendChild(content);

        if (this.devWarning) {
            const devBar = document.createElement('div');
            devBar.className = 'development-bar';
            const textSpan = document.createElement('span');
            textSpan.textContent = this.devWarning.toUpperCase();
            devBar.appendChild(textSpan);
            const arrowIcon = document.createElement('i');
            arrowIcon.className = 'fas fa-chevron-down';
            arrowIcon.style.marginLeft = '5px';
            arrowIcon.style.fontSize = '8px';
            arrowIcon.style.color = 'rgba(255,255,255,0.7)';
            arrowIcon.style.position = 'relative';
            arrowIcon.style.zIndex = '2';
            devBar.appendChild(arrowIcon);
            element.appendChild(devBar);
        }

        this.element = element;
        return element;
    }

    renderSetNode() {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = `node ${this.type} set-node`;
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;

        const header = document.createElement('div');
        header.className = 'node-title';
        if (this.variableType) {
            const gradient = Utils.getVariableHeaderColor(this.variableType);
            header.style.background = `linear-gradient(to bottom, ${gradient.start}, ${gradient.end})`;
            header.style.borderBottomColor = 'rgba(0,0,0,0.5)';
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = "SET";
        header.appendChild(titleSpan);
        element.appendChild(header);

        const content = document.createElement('div');
        content.className = 'node-content';

        // Defensive check: ensure pin arrays exist
        if (!this.pinsIn || !this.pinsOut) {
            this.refreshPinCache();
        }

        const execIn = this.pinsIn ? this.pinsIn.find(p => p.type === 'exec') : null;
        const execOut = this.pinsOut ? this.pinsOut.find(p => p.type === 'exec') : null;
        const dataIn = this.pinsIn ? this.pinsIn.find(p => p.type !== 'exec') : null;
        const dataOut = this.pinsOut ? this.pinsOut.find(p => p.type !== 'exec') : null;

        const execRow = document.createElement('div');
        execRow.className = 'pin-row';
        if (execIn) execRow.appendChild(this.renderPin(execIn, true));
        else execRow.appendChild(document.createElement('div'));

        if (execOut) execRow.appendChild(this.renderPin(execOut, true));
        else execRow.appendChild(document.createElement('div'));
        content.appendChild(execRow);

        const dataRow = document.createElement('div');
        dataRow.className = 'pin-row';

        if (dataIn) {
            dataRow.appendChild(this.renderPin(dataIn));
        } else {
            dataRow.appendChild(document.createElement('div'));
        }

        if (dataOut) {
            dataRow.appendChild(this.renderPin(dataOut, true));
        } else {
            dataRow.appendChild(document.createElement('div'));
        }
        content.appendChild(dataRow);

        element.appendChild(content);
        this.element = element;
        return element;
    }

    renderCompactNode() {
        const element = document.createElement('div');
        element.id = this.id;
        element.className = `node compact-node ${this.type}`;
        element.style.left = `${this.x}px`;
        element.style.top = `${this.y}px`;

        const container = document.createElement('div');
        container.className = 'compact-node-container';

        // Ensure pins are correctly cached before accessing
        if (!this.pinsIn || !this.pinsOut) {
            this.refreshPinCache();
        }

        const pinIn = this.pinsIn[0];
        const pinOut = this.pinsOut[0];

        // 1. Left Pin (Input)
        if (pinIn) {
            const pinContainer = document.createElement('div');
            pinContainer.className = `pin-container in ${Utils.getPinTypeClass(pinIn.type)}`;
            pinContainer.dataset.pinId = pinIn.id;

            const pinDot = this.createPinDot(pinIn);
            pinIn.element = pinDot;
            pinContainer.appendChild(pinDot);

            // If unconnected, show the input widget (pill-box style)
            if (!pinIn.isConnected()) {
                const inputWidget = this.createInputWidget(pinIn);
                if (inputWidget) {
                    inputWidget.classList.add('compact-input-widget');
                    pinContainer.appendChild(inputWidget);
                }
            }

            container.appendChild(pinContainer);
        }

        // --- INSERT LABEL ---
        const labelSpan = document.createElement('span');
        labelSpan.className = 'compact-node-label';
        // Clean up "Get_" prefix for display to match standard UI
        if (this.nodeKey.startsWith('Get_')) {
            labelSpan.textContent = this.nodeKey.substring(4);
        } else {
            labelSpan.textContent = this.title;
        }
        container.appendChild(labelSpan);

        // 3. Right Pin (Output)
        if (pinOut) {
            const pinContainer = document.createElement('div');
            pinContainer.className = `pin-container out ${Utils.getPinTypeClass(pinOut.type)}`;
            pinContainer.dataset.pinId = pinOut.id;

            const pinDot = this.createPinDot(pinOut);
            pinOut.element = pinDot;
            pinContainer.appendChild(pinDot);

            container.appendChild(pinContainer);
        }

        element.appendChild(container);
        this.element = element;
        return element;
    }

    createPinDot(pin, forceHollow = false) {
        const typeClass = Utils.getPinTypeClass(pin.type);
        const pinDot = document.createElement('div');
        let dotClasses = `pin-dot ${typeClass}`;
        const isConnected = pin.links.length > 0;
        if (forceHollow || !isConnected) {
            dotClasses += ' hollow';
        }
        pinDot.className = dotClasses;
        pinDot.title = `${pin.name} (${pin.type})`;

        // Handle container types with proper icons
        // Only add container styling if it's not a single value
        if (pin.containerType && pin.containerType !== 'single') {
            pinDot.classList.add('container-pin'); // Remove default circle styling

            if (pin.containerType === 'array') {
                pinDot.classList.add('array-pin');
                const icon = document.createElement('i');
                icon.className = 'fas fa-th';
                icon.style.fontSize = '8px';
                icon.style.color = Utils.getPinColor(pin.type);
                pinDot.appendChild(icon);
            } else if (pin.containerType === 'set') {
                pinDot.classList.add('set-pin');
                const icon = document.createElement('span');
                icon.textContent = '{}';
                icon.style.fontSize = '8px';
                icon.style.fontWeight = 'bold';
                icon.style.color = Utils.getPinColor(pin.type);
                pinDot.appendChild(icon);
            } else if (pin.containerType === 'map') {
                pinDot.classList.add('map-pin');
                const icon = document.createElement('i');
                icon.className = 'fas fa-list-ul';
                icon.style.fontSize = '8px';
                icon.style.color = Utils.getPinColor(pin.type);
                pinDot.appendChild(icon);
            }
        }

        return pinDot;
    }

    renderPin(pin, hideLabel = false) {
        const pinContainer = document.createElement('div');
        const typeClass = Utils.getPinTypeClass(pin.type);
        pinContainer.className = `pin-container ${pin.dir} ${typeClass}`;
        pinContainer.dataset.pinId = pin.id;

        const pinDot = this.createPinDot(pin);
        pin.element = pinDot;

        let effectiveHideLabel = hideLabel;
        if (this.type === 'function-node' && pin.type === 'exec') {
            effectiveHideLabel = true;
        }

        const pinLabel = document.createElement('span');
        pinLabel.className = `pin-label-${pin.dir}`;
        pinLabel.textContent = pin.name;
        if (effectiveHideLabel) {
            pinLabel.style.display = 'none';
        }

        let inputWidget = null;
        const isDataPin = pin.type !== 'exec';
        const isConnected = pin.links.length > 0;

        if (pin.dir === 'in' && isDataPin && !isConnected) {
            inputWidget = this.createInputWidget(pin);
        }

        if (pin.dir === 'in') {
            pinContainer.appendChild(pinDot);
            // UPDATED: Added 'pin-wrapper' class for easier styling access
            const wrapper = document.createElement('div');
            wrapper.className = 'pin-wrapper'; // Class added here
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '5px'; // Added gap for spacing label and widget

            if (!effectiveHideLabel) wrapper.appendChild(pinLabel);
            if (inputWidget) wrapper.appendChild(inputWidget);
            pinContainer.appendChild(wrapper);
        } else {
            if (!effectiveHideLabel) pinContainer.appendChild(pinLabel);
            pinContainer.appendChild(pinDot);
        }
        return pinContainer;
    }

    createInputWidget(pin) {
        let inputEl;
        const pinValue = this.pinLiterals.get(pin.id);
        const updateLiteral = (e) => {
            let newValue = e.target.value;
            if (['int', 'int64', 'byte'].includes(pin.type)) {
                newValue = parseInt(newValue) || 0;
            } else if (pin.type === 'float') {
                newValue = parseFloat(newValue) || 0.0;
            } else if (pin.type === 'bool') {
                newValue = e.target.checked;
            }
            this.pinLiterals.set(pin.id, newValue);
            this.app.persistence.autoSave();
        };

        if (pin.type === 'bool') {
            inputEl = document.createElement('input');
            inputEl.type = 'checkbox';
            inputEl.className = 'ue5-checkbox';
            inputEl.checked = pinValue;
            inputEl.addEventListener('change', updateLiteral);
            inputEl.addEventListener('mousedown', (e) => e.stopPropagation());
        } else {
            inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.value = pinValue;
            inputEl.className = 'node-literal-input';
            const wideTypes = ['string', 'text', 'name'];
            inputEl.style.width = wideTypes.includes(pin.type) ? '80px' : '40px';
            inputEl.style.backgroundColor = '#111';
            inputEl.style.color = 'white';
            inputEl.style.border = '1px solid #444';
            inputEl.style.borderRadius = '2px';
            inputEl.style.marginLeft = '5px';
            inputEl.addEventListener('change', updateLiteral);
            inputEl.addEventListener('mousedown', (e) => e.stopPropagation());

            // Add focus/blur listeners to prevent graph interaction while editing
            inputEl.addEventListener('focus', () => this.app.graph.isEditingLiteral = true);
            inputEl.addEventListener('blur', () => this.app.graph.isEditingLiteral = false);
        }
        return inputEl;
    }

    getPinsData() {
        return this.pins.map(p => ({
            id: p.id ? p.id.replace(`${this.id}-`, '') : 'CORRUPTED',
            name: p.name,
            type: p.type,
            dir: p.dir,
            containerType: p.containerType,
            // Only save literal value if it's the default or it's not connected
            literalValue: this.pinLiterals.get(p.id),
            isCustom: p.isCustom
        }));
    }
}
