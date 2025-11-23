/**
 * DetailsRenderer - Handles HTML generation for the Details Panel
 */
import { Utils } from '../utils.js';

export class DetailsRenderer {
    static renderPropertyFlag(name, isSet) {
        return `
            <div class="property-flag-item" style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #aaa; margin-bottom: 2px;">
                <span>${name}</span>
                ${isSet ? '<i class="fas fa-check" style="color: #007bff;"></i>' : ''}
            </div>
        `;
    }

    static getContainerIcon(containerType, variableType) {
        const color = Utils.getPinColor(variableType);
        switch (containerType) {
            case 'array': return `<i class="fas fa-th" style="color: ${color};"></i>`;
            case 'set': return `<span style="color: ${color}; font-weight: bold; font-size: 10px;">{}</span>`;
            case 'map': return `<i class="fas fa-list-ul" style="color: ${color};"></i>`;
            default: return `<span class="param-color-dot" style="background-color: ${color};"></span>`; // Single
        }
    }

    static renderVariableFields(variable) {
        const color = Utils.getPinColor(variable.type);
        return `
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
                        <span class="param-color-dot" style="background-color: ${color}"></span>
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
                <input type="text" class="details-input" value="${variable.description || ''}" data-prop="description" placeholder="Tooltip">
            </div>

            <!-- Instance Editable -->
            <div class="detail-checkbox-row">
                <label>Instance Editable</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="isInstanceEditable" ${variable.isInstanceEditable ? 'checked' : ''}>
            </div>

            <!-- Blueprint Read Only -->
            <div class="detail-checkbox-row">
                <label>Blueprint Read Only</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="blueprintReadOnly" ${variable.blueprintReadOnly ? 'checked' : ''}>
            </div>

            <!-- Expose on Spawn -->
            <div class="detail-checkbox-row">
                <label>Expose on Spawn</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="exposeOnSpawn" ${variable.exposeOnSpawn ? 'checked' : ''}>
            </div>

            <!-- Private -->
            <div class="detail-checkbox-row">
                <label>Private</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="private" ${variable.private ? 'checked' : ''}>
            </div>

            <!-- Expose to Cinematics -->
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

            <!-- Replication -->
            <div class="detail-row">
                <label>Replication</label>
                <select class="details-select" data-prop="replication" style="flex-grow: 1;">
                    <option value="None" ${variable.replication === 'None' ? 'selected' : ''}>None</option>
                    <option value="Replicated" ${variable.replication === 'Replicated' ? 'selected' : ''}>Replicated</option>
                    <option value="RepNotify" ${variable.replication === 'RepNotify' ? 'selected' : ''}>RepNotify</option>
                </select>
            </div>

            <!-- Replication Condition -->
            <div class="detail-row" ${variable.replication === 'None' ? 'style="opacity: 0.5;"' : ''}>
                <label>Replication Condition</label>
                <select class="details-select" data-prop="replicationCondition" style="flex-grow: 1;" ${variable.replication === 'None' ? 'disabled' : ''}>
                    <option value="None" ${variable.replicationCondition === 'None' ? 'selected' : ''}>None</option>
                    <option value="InitialOnly" ${variable.replicationCondition === 'InitialOnly' ? 'selected' : ''}>Initial Only</option>
                    <option value="OwnerOnly" ${variable.replicationCondition === 'OwnerOnly' ? 'selected' : ''}>Owner Only</option>
                    <option value="SkipOwner" ${variable.replicationCondition === 'SkipOwner' ? 'selected' : ''}>Skip Owner</option>
                    <option value="SimulatedOnly" ${variable.replicationCondition === 'SimulatedOnly' ? 'selected' : ''}>Simulated Only</option>
                    <option value="AutonomousOnly" ${variable.replicationCondition === 'AutonomousOnly' ? 'selected' : ''}>Autonomous Only</option>
                    <option value="SimulatedOrPhysics" ${variable.replicationCondition === 'SimulatedOrPhysics' ? 'selected' : ''}>Simulated Or Physics</option>
                    <option value="InitialOrOwner" ${variable.replicationCondition === 'InitialOrOwner' ? 'selected' : ''}>Initial Or Owner</option>
                    <option value="Custom" ${variable.replicationCondition === 'Custom' ? 'selected' : ''}>Custom</option>
                    <option value="ReplayOrOwner" ${variable.replicationCondition === 'ReplayOrOwner' ? 'selected' : ''}>Replay Or Owner</option>
                    <option value="ReplayOnly" ${variable.replicationCondition === 'ReplayOnly' ? 'selected' : ''}>Replay Only</option>
                    <option value="SimulatedOnlyNoReplay" ${variable.replicationCondition === 'SimulatedOnlyNoReplay' ? 'selected' : ''}>Simulated Only No Replay</option>
                    <option value="SimulatedOrPhysicsNoReplay" ${variable.replicationCondition === 'SimulatedOrPhysicsNoReplay' ? 'selected' : ''}>Simulated Or Physics No Replay</option>
                    <option value="SkipReplay" ${variable.replicationCondition === 'SkipReplay' ? 'selected' : ''}>Skip Replay</option>
                </select>
            </div>
        `;
    }

    static renderAdvancedFields(variable) {
        return `
            <div class="detail-checkbox-row">
                <label>Config Variable</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="configVariable" ${variable.configVariable ? 'checked' : ''}>
            </div>
            <div class="detail-checkbox-row">
                <label>Transient</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="transient" ${variable.transient ? 'checked' : ''}>
            </div>
            <div class="detail-checkbox-row">
                <label>SaveGame</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="saveGame" ${variable.saveGame ? 'checked' : ''}>
            </div>
            <div class="detail-checkbox-row">
                <label>Advanced Display</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="advancedDisplay" ${variable.advancedDisplay ? 'checked' : ''}>
            </div>
            <div class="detail-checkbox-row">
                <label>Multi line</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="multiLine" ${variable.multiLine ? 'checked' : ''}>
            </div>
            <div class="detail-checkbox-row">
                <label>Deprecated</label>
                <input type="checkbox" class="ue5-checkbox" data-prop="deprecated" ${variable.deprecated ? 'checked' : ''}>
            </div>
            <div class="detail-row">
                <label>Deprecation Message</label>
                <input type="text" class="details-input" data-prop="deprecationMessage" value="${variable.deprecationMessage || ''}">
            </div>
            <div class="detail-row">
                <label>Drop-down Options</label>
                <select class="details-select" style="flex-grow: 1;">
                    <option value="">None</option>
                </select>
            </div>
        `;
    }

    static renderVariableSection(variable) {
        return `
            <!--Variable Section-->
            <div class="details-group">
                <div id="variable-toggle" style="display: flex; align-items: center; color: #ddd; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase; margin-bottom: 10px;">
                    <i id="variable-icon" class="fas fa-caret-down" style="width: 15px;"></i> <span>VARIABLE</span>
                </div>
                <div id="variable-content">
                    ${this.renderVariableFields(variable)}
                </div>
            </div>
        `;
    }

    static renderAdvancedSection(variable, propertyFlagsHTML) {
        return `
            <!--Collapsible Advanced Section-->
            <div class="details-group" style="border-bottom: none; padding-bottom: 0;">
                <div id="advanced-toggle" style="display: flex; align-items: center; color: #ddd; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                    <i id="advanced-icon" class="fas fa-caret-right" style="width: 15px;"></i> <span>Advanced</span>
                </div>
                <div id="advanced-content" style="display: none; margin-top: 10px;">
                    ${this.renderAdvancedFields(variable)}
                    
                    <!-- Defined Property Flags (Inside Advanced) -->
                    <div style="color: #ddd; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; margin-top: 15px;">Defined Property Flags</div>
                    <div class="property-flags-list" style="background: #111; padding: 5px; border: 1px solid #333;">
                        ${propertyFlagsHTML}
                    </div>
                </div>
            </div>
        `;
    }

    static renderDefaultValueSection(variable, contentHTML) {
        return `
            <!--Collapsible Default Value Section-->
            <div class="details-group">
                <div id="default-toggle" style="display: flex; align-items: center; color: #ddd; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase; margin-bottom: 10px;">
                    <i id="default-icon" class="fas fa-caret-down" style="width: 15px;"></i> <span>Default Value</span>
                </div>
                <div id="default-content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    static parseVectorValue(value) {
        const str = String(value).replace(/[()]/g, '').trim();
        const parts = str.split(',').map(p => parseFloat(p.trim()) || 0);
        return {
            x: parts[0] || 0,
            y: parts[1] || 0,
            z: parts[2] || 0
        };
    }

    static parseTransformValue(value) {
        const str = String(value).replace(/[()]/g, '').trim();
        const sections = str.split('|');

        const parseSection = (section) => {
            const parts = (section || '0,0,0').split(',').map(p => parseFloat(p.trim()) || 0);
            return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
        };

        return {
            location: parseSection(sections[0]),
            rotation: parseSection(sections[1]),
            scale: parseSection(sections[2])
        };
    }

    static renderSingleValueInput(type, value, extraAttrs = '') {
        if (type === 'bool') {
            return `<input type="checkbox" class="ue5-checkbox" data-prop="defaultValue" ${value ? 'checked' : ''} ${extraAttrs}>`;
        }
        if (type === 'int' || type === 'int64' || type === 'byte' || type === 'float') {
            const step = (type === 'float') ? '0.01' : '1';
            return `<input type="number" class="details-input" value="${value}" step="${step}" data-prop="defaultValue" ${extraAttrs}>`;
        }
        if (type === 'string' || type === 'name' || type === 'text') {
            return `<input type="text" class="details-input" value="${value}" data-prop="defaultValue" ${extraAttrs}>`;
        }
        if (type === 'vector' || type === 'rotator') {
            const parsed = this.parseVectorValue(value);
            return `
                <div style="display: flex; gap: 4px; width: 100%;">
                    <input type="number" class="details-input" value="${parsed.x}" step="0.01" data-prop="defaultValue" data-vector-component="x" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px;">
                    <input type="number" class="details-input" value="${parsed.y}" step="0.01" data-prop="defaultValue" data-vector-component="y" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px;">
                    <input type="number" class="details-input" value="${parsed.z}" step="0.01" data-prop="defaultValue" data-vector-component="z" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px;">
                </div>
            `;
        }
        if (type === 'transform') {
            const parsed = this.parseTransformValue(value);
            return `
                <div style="display: flex; flex-direction: column; gap: 2px; width: 100%;">
                    <div style="display: flex; gap: 4px;">
                        <span style="width: 70px; color: #888; font-size: 9px; display: flex; align-items: center;">Location</span>
                        <input type="number" class="details-input" value="${parsed.location.x}" step="0.1" data-prop="defaultValue" data-transform-component="location-x" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #d63031;">
                        <input type="number" class="details-input" value="${parsed.location.y}" step="0.1" data-prop="defaultValue" data-transform-component="location-y" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #00b894;">
                        <input type="number" class="details-input" value="${parsed.location.z}" step="0.1" data-prop="defaultValue" data-transform-component="location-z" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #0984e3;">
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <span style="width: 70px; color: #888; font-size: 9px; display: flex; align-items: center;">Rotation</span>
                        <input type="number" class="details-input" value="${parsed.rotation.x}" step="0.1" data-prop="defaultValue" data-transform-component="rotation-x" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #d63031;">
                        <input type="number" class="details-input" value="${parsed.rotation.y}" step="0.1" data-prop="defaultValue" data-transform-component="rotation-y" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #00b894;">
                        <input type="number" class="details-input" value="${parsed.rotation.z}" step="0.1" data-prop="defaultValue" data-transform-component="rotation-z" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #0984e3;">
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <span style="width: 70px; color: #888; font-size: 9px; display: flex; align-items: center;">Scale</span>
                        <input type="number" class="details-input" value="${parsed.scale.x}" step="0.1" data-prop="defaultValue" data-transform-component="scale-x" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #d63031;">
                        <input type="number" class="details-input" value="${parsed.scale.y}" step="0.1" data-prop="defaultValue" data-transform-component="scale-y" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #00b894;">
                        <input type="number" class="details-input" value="${parsed.scale.z}" step="0.1" data-prop="defaultValue" data-transform-component="scale-z" ${extraAttrs} style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #0984e3;">
                    </div>
                </div>
            `;
        }
        return `<p class="detail-value-static">No editor available</p>`;
    }

    static renderArrayDefaultValue(variable) {
        if (!Array.isArray(variable.defaultValue)) {
            variable.defaultValue = [];
        }

        const values = variable.defaultValue;
        const count = values.length;
        const type = variable.type;

        let html = `
            <div class="detail-row">
                <div style="display: flex; align-items: center; height: 100%;">
                    <i class="fas fa-caret-down" style="margin-right: 4px; color: #888; font-size: 10px;"></i>
                    <label style="margin: 0; cursor: pointer;">${variable.name}</label>
                </div>
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding-right: 8px; height: 100%;">
                    <span style="color: #888; font-size: 10px;">${count} Array element${count !== 1 ? 's' : ''}</span>
                    <i class="fas fa-plus-circle" style="cursor: pointer; color: #ccc;" onclick="window.app.details.addArrayElement('${variable.id}')" title="Add Element"></i>
                    <i class="fas fa-trash" style="cursor: pointer; color: #ccc; font-size: 10px;" onclick="window.app.details.clearArrayElements('${variable.id}')" title="Clear All"></i>
                </div>
            </div>
        `;

        values.forEach((val, index) => {
            html += `
                <div class="detail-row">
                    <label style="padding-left: 24px; color: #888; font-size: 11px;">Index [ ${index} ]</label>
                    <div style="display: flex; align-items: center; width: 100%; padding-right: 4px;">
                        <div style="flex-grow: 1; margin-right: 4px;">
                            ${this.renderSingleValueInput(type, val, `data-array-index="${index}"`)}
                        </div>
                        <i class="fas fa-trash-alt" style="cursor: pointer; color: #666; font-size: 10px;" onclick="window.app.details.removeArrayElement('${variable.id}', ${index})" title="Remove"></i>
                    </div>
                </div>
            `;
        });

        return html;
    }

    static renderMapDefaultValue(variable) {
        if (!Array.isArray(variable.defaultValue)) {
            variable.defaultValue = [];
        }

        const entries = variable.defaultValue;
        const count = entries.length;
        const type = variable.type;

        let html = `
            <div class="detail-row">
                <div style="display: flex; align-items: center; height: 100%;">
                    <i class="fas fa-caret-down" style="margin-right: 4px; color: #888; font-size: 10px;"></i>
                    <label style="margin: 0; cursor: pointer;">${variable.name}</label>
                </div>
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding-right: 8px; height: 100%;">
                    <span style="color: #888; font-size: 10px;">${count} Map element${count !== 1 ? 's' : ''}</span>
                    <i class="fas fa-plus-circle" style="cursor: pointer; color: #ccc;" onclick="window.app.details.addMapElement('${variable.id}')" title="Add Element"></i>
                    <i class="fas fa-trash" style="cursor: pointer; color: #ccc; font-size: 10px;" onclick="window.app.details.clearMapElements('${variable.id}')" title="Clear All"></i>
                </div>
            </div>
        `;

        entries.forEach((entry, index) => {
            const key = entry.key !== undefined ? entry.key : '';
            const value = entry.value !== undefined ? entry.value : '';

            html += `
                <div class="detail-row" style="flex-direction: column; align-items: stretch; padding: 4px 8px;">
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                        <label style="padding-left: 16px; color: #888; font-size: 11px; flex-shrink: 0; width: 80px;">Index [ ${index} ]</label>
                        <i class="fas fa-trash-alt" style="cursor: pointer; color: #666; font-size: 10px; margin-left: auto;" onclick="window.app.details.removeMapElement('${variable.id}', ${index})" title="Remove"></i>
                    </div>
                    <div style="display: flex; gap: 8px; padding-left: 16px;">
                        <div style="flex: 1;">
                            <label style="color: #888; font-size: 9px; display: block; margin-bottom: 2px;">Key</label>
                            ${this.renderSingleValueInput('string', key, `data-map-index="${index}" data-map-field="key"`)}
                        </div>
                        <div style="flex: 1;">
                            <label style="color: #888; font-size: 9px; display: block; margin-bottom: 2px;">Value</label>
                            ${this.renderSingleValueInput(type, value, `data-map-index="${index}" data-map-field="value"`)}
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    static renderDefaultValueInput(variable) {
        if (variable.containerType === 'array') {
            return this.renderArrayDefaultValue(variable);
        }

        if (variable.containerType === 'map') {
            return this.renderMapDefaultValue(variable);
        }

        const type = variable.type;
        const value = variable.defaultValue;
        const label = variable.name;
        const inputHTML = this.renderSingleValueInput(type, value);

        if (type === 'bool') {
            return `
                <div class="detail-checkbox-row">
                    <label>${label}</label>
                    ${inputHTML}
                </div>
            `;
        }
        if (type === 'int' || type === 'int64' || type === 'byte' || type === 'float' || type === 'string' || type === 'name' || type === 'text') {
            return `
                <div class="detail-row">
                    <label>${label}</label>
                    ${inputHTML}
                </div>
            `;
        }
        if (type === 'vector' || type === 'rotator') {
            const parsed = this.parseVectorValue(value);
            return `
                <div class="detail-row" style="flex-direction: column; align-items: stretch; padding: 0;">
                    <div style="display: flex; align-items: center; min-height: 24px; border-bottom: 1px solid #1a1a1a;">
                        <label style="width: var(--details-label-width); padding: 4px 16px 4px 0; border-right: 1px solid #333; color: #ccc;">${type === 'vector' ? 'Vector' : 'Rotator'}</label>
                    </div>
                    <div style="display: flex; gap: 4px; padding: 4px 8px; background: rgba(0,0,0,0.2);">
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                            <label style="color: #999; font-size: 9px;">X</label>
                            <input type="number" class="details-input" value="${parsed.x}" step="0.01" data-prop="defaultValue" data-vector-component="x" style="padding: 2px 4px; font-size: 10px;">
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                            <label style="color: #999; font-size: 9px;">Y</label>
                            <input type="number" class="details-input" value="${parsed.y}" step="0.01" data-prop="defaultValue" data-vector-component="y" style="padding: 2px 4px; font-size: 10px;">
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                            <label style="color: #999; font-size: 9px;">Z</label>
                            <input type="number" class="details-input" value="${parsed.z}" step="0.01" data-prop="defaultValue" data-vector-component="z" style="padding: 2px 4px; font-size: 10px;">
                        </div>
                    </div>
                </div>
            `;
        }
        if (type === 'transform') {
            const parsed = this.parseTransformValue(value);
            return `
                <div class="detail-row" style="flex-direction: column; align-items: stretch; padding: 0;">
                    <div style="display: flex; align-items: center; min-height: 24px; border-bottom: 1px solid #1a1a1a;">
                        <label style="width: var(--details-label-width); padding: 4px 16px 4px 0; border-right: 1px solid #333; color: #ccc;">${label}</label>
                    </div>
                    
                    <!-- Location Row -->
                    <div style="display: flex; border-bottom: 1px solid #1a1a1a;">
                        <span style="width: 80px; padding: 4px 8px; color: #888; font-size: 10px; border-right: 1px solid #1a1a1a; display: flex; align-items: center;">Location</span>
                        <div style="flex: 1; display: flex; gap: 4px; padding: 4px 8px;">
                            <input type="number" class="details-input" value="${parsed.location.x}" step="0.1" data-prop="defaultValue" data-transform-component="location-x" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #d63031;">
                            <input type="number" class="details-input" value="${parsed.location.y}" step="0.1" data-prop="defaultValue" data-transform-component="location-y" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #00b894;">
                            <input type="number" class="details-input" value="${parsed.location.z}" step="0.1" data-prop="defaultValue" data-transform-component="location-z" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #0984e3;">
                        </div>
                    </div>
                    
                    <!-- Rotation Row -->
                    <div style="display: flex; border-bottom: 1px solid #1a1a1a;">
                        <span style="width: 80px; padding: 4px 8px; color: #888; font-size: 10px; border-right: 1px solid #1a1a1a; display: flex; align-items: center;">Rotation</span>
                        <div style="flex: 1; display: flex; gap: 4px; padding: 4px 8px;">
                            <input type="number" class="details-input" value="${parsed.rotation.x}" step="0.1" data-prop="defaultValue" data-transform-component="rotation-x" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #d63031;">
                            <input type="number" class="details-input" value="${parsed.rotation.y}" step="0.1" data-prop="defaultValue" data-transform-component="rotation-y" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #00b894;">
                            <input type="number" class="details-input" value="${parsed.rotation.z}" step="0.1" data-prop="defaultValue" data-transform-component="rotation-z" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #0984e3;">
                        </div>
                    </div>
                    
                    <!-- Scale Row -->
                    <div style="display: flex;">
                        <span style="width: 80px; padding: 4px 8px; color: #888; font-size: 10px; border-right: 1px solid #1a1a1a; display: flex; align-items: center;">Scale</span>
                        <div style="flex: 1; display: flex; gap: 4px; padding: 4px 8px;">
                            <input type="number" class="details-input" value="${parsed.scale.x}" step="0.1" data-prop="defaultValue" data-transform-component="scale-x" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #d63031;">
                            <input type="number" class="details-input" value="${parsed.scale.y}" step="0.1" data-prop="defaultValue" data-transform-component="scale-y" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #00b894;">
                            <input type="number" class="details-input" value="${parsed.scale.z}" step="0.1" data-prop="defaultValue" data-transform-component="scale-z" style="flex: 1; padding: 2px 4px; font-size: 10px; border-left: 2px solid #0984e3;">
                        </div>
                    </div>
                </div>
            `;
        }
        return `<p class="detail-value-static">No editor available for type: ${type}</p>`;
    }
}
