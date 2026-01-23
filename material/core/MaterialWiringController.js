/**
 * MaterialWiringController - Manages wire connections in the Material Editor.
 * Extracted from MaterialGraphController.js for code complexity reduction.
 * 
 * Handles: ghostwire preview, connection creation, wire drawing, link breaking.
 */

import { WireRenderer } from '../../shared/WireRenderer.js';
import { PinTypes } from './MaterialNodeFramework.js';
import { generateId } from '../../shared/utils.js';
import { CreateLinkCommand, BreakLinkCommand } from './GraphCommands.js';

export class MaterialWiringController {
    constructor(graphController) {
        this.graph = graphController;
        this.app = graphController.app;
        this.graphPanel = graphController.graphPanel;
        this.wireGroup = graphController.wireGroup;
    }

    /**
     * Start wiring from a pin
     */
    startWiring(pin, e) {
        this.graph.isWiring = true;
        this.graph.wiringStartPin = pin;

        const ghostWire = document.getElementById("ghost-wire");
        ghostWire.style.display = "block";
        ghostWire.setAttribute("data-type", pin.type);
        ghostWire.style.stroke = pin.color;

        this.updateGhostWire(e);
    }

    /**
     * Update ghost wire position
     */
    updateGhostWire(e) {
        if (!this.graph.isWiring || !this.graph.wiringStartPin) return;

        const pin = this.graph.wiringStartPin;
        const pinDot = pin.element.querySelector(".pin-dot") || pin.element;
        const rect = pinDot.getBoundingClientRect();
        const graphRect = this.graphPanel.getBoundingClientRect();

        const startX = rect.left + rect.width / 2 - graphRect.left;
        const startY = rect.top + rect.height / 2 - graphRect.top;
        const endX = e.clientX - graphRect.left;
        const endY = e.clientY - graphRect.top;

        // Account for zoom in path calculation if needed, 
        // but startX/startY/endX/endY are already in panel pixels.
        const path = WireRenderer.getWirePath(startX, startY, endX, endY, {
            direction: pin.dir
        });

        const ghostWire = document.getElementById("ghost-wire");
        if (ghostWire) {
            ghostWire.setAttribute("d", path);
        }
    }

    /**
     * End wiring
     */
    endWiring(targetPin = null) {
        if (!this.graph.isWiring) return;

        const ghostWire = document.getElementById("ghost-wire");
        ghostWire.style.display = "none";

        if (targetPin && this.graph.wiringStartPin) {
            // Use command for creation
            this.graph.commands.execute(new CreateLinkCommand(
                this.graph, 
                this.graph.wiringStartPin.id, 
                targetPin.id
            ));
        }

        this.graph.isWiring = false;
        this.graph.wiringStartPin = null;
    }


    /**
     * Create a connection between two pins
     */
    createConnection(pinA, pinB, explicitId = null) {
        // Ensure correct direction (output -> input)
        const outputPin = pinA.dir === "out" ? pinA : pinB;
        const inputPin = pinA.dir === "in" ? pinA : pinB;

        // Validate connection
        if (!outputPin.canConnectTo(inputPin)) {
            this.app.updateStatus("Cannot connect: incompatible types");
            return false;
        }

        // Check if input already has a connection
        if (inputPin.connectedTo) {
            this.breakLink(inputPin.connectedTo);
        }

        // Create link
        const linkId = explicitId || generateId("link");
        const link = {
            id: linkId,
            sourcePin: outputPin,
            targetPin: inputPin,
            type: outputPin.type,
            element: null,
        };

        // Update pin states
        outputPin.connectedTo = linkId;
        inputPin.connectedTo = linkId;

        // Update pin visuals
        outputPin.element.querySelector(".pin-dot").classList.remove("hollow");
        inputPin.element.querySelector(".pin-dot").classList.remove("hollow");

        this.graph.links.set(linkId, link);
        this.drawWire(link);

        this.app.updateCounts();
        this.app.triggerLiveUpdate();

        return link;
    }


    /**
     * Draw a wire for a connection
     */
    drawWire(link) {
        const outputDot = link.sourcePin.element.querySelector(".pin-dot") || link.sourcePin.element;
        const inputDot = link.targetPin.element.querySelector(".pin-dot") || link.targetPin.element;

        if (!outputDot || !inputDot) return;

        const graphRect = this.graphPanel.getBoundingClientRect();
        const outRect = outputDot.getBoundingClientRect();
        const inRect = inputDot.getBoundingClientRect();

        const startX = outRect.left + outRect.width / 2 - graphRect.left;
        const startY = outRect.top + outRect.height / 2 - graphRect.top;
        const endX = inRect.left + inRect.width / 2 - graphRect.left;
        const endY = inRect.top + inRect.height / 2 - graphRect.top;

        const path = WireRenderer.getWirePath(startX, startY, endX, endY);

        if (!link.element) {
            const wire = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            wire.classList.add("wire");
            wire.setAttribute("data-type", link.type);
            wire.setAttribute("data-link-id", link.id);
            wire.style.stroke = PinTypes[link.type.toUpperCase()]?.color || "#888";

            wire.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectLink(link);
            });
            wire.id = `wire-${link.id}`; // Add ID for renderer lookup

            this.wireGroup.appendChild(wire);
            link.element = wire;
        }

        link.element.setAttribute("d", path);
    }

    /**
     * Update all wire positions
     */
    updateAllWires() {
        this.graph.links.forEach((link) => this.drawWire(link));
    }

    /**
     * Select a link
     */
    selectLink(link) {
        this.graph.selection.selectLink(link);
    }

    /**
     * Break a link by ID
     */
    breakLink(linkId) {
        const link = this.graph.links.get(linkId);
        if (!link) return;

        // Reset pin states
        link.sourcePin.connectedTo = null;
        link.targetPin.connectedTo = null;

        // Update visuals
        if (link.sourcePin.element) {
            const dot = link.sourcePin.element.querySelector(".pin-dot") || link.sourcePin.element;
            dot.classList.add("hollow");
        }
        if (link.targetPin.element) {
            const dot = link.targetPin.element.querySelector(".pin-dot") || link.targetPin.element;
            dot.classList.add("hollow");
        }

        // Remove wire element
        if (link.element) {
            link.element.remove();
        }

        this.graph.links.delete(linkId);
        this.graph.selection.selectedLinks.delete(linkId);

        this.app.updateCounts();
        this.app.triggerLiveUpdate();
    }
}
