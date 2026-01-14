/**
 * TooltipController.js
 *
 * Manages educational tooltips for material node pins.
 * Shows physics descriptions, value ranges, and tips on hover.
 */

import { PBRDescriptions } from "../data/PBRDescriptions.js";

export class TooltipController {
  constructor(app) {
    this.app = app;
    this.tooltip = null;
    this.hideTimeout = null;
    this.showDelay = 500; // ms before showing tooltip
    this.showTimeout = null;

    this.init();
  }

  /**
   * Initialize tooltip element and event handlers
   */
  init() {
    // Create tooltip element
    this.tooltip = document.createElement("div");
    this.tooltip.className = "pin-tooltip";
    this.tooltip.style.display = "none";
    document.body.appendChild(this.tooltip);

    // Bind global event listeners
    document.addEventListener("mouseover", (e) => this.handleMouseOver(e));
    document.addEventListener("mouseout", (e) => this.handleMouseOut(e));
  }

  /**
   * Handle mouse over on pins
   */
  handleMouseOver(e) {
    const pinElement = e.target.closest(".pin");
    if (!pinElement) return;

    // Clear any pending hide
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Delay showing tooltip
    this.showTimeout = setTimeout(() => {
      this.showTooltip(pinElement, e);
    }, this.showDelay);
  }

  /**
   * Handle mouse out from pins
   */
  handleMouseOut(e) {
    const pinElement = e.target.closest(".pin");
    if (!pinElement) return;

    // Clear pending show
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    // Delay hiding tooltip
    this.hideTimeout = setTimeout(() => {
      this.hideTooltip();
    }, 100);
  }

  /**
   * Show tooltip for a pin
   */
  showTooltip(pinElement, e) {
    const pinId = pinElement.dataset.pinId;
    if (!pinId) return;

    // Normalize pin ID for lookup (convert to snake_case)
    const normalizedId = pinId.toLowerCase().replace(/\s+/g, "_");

    // Get description from PBRDescriptions
    const description = PBRDescriptions[normalizedId];

    // Get basic info from pin element
    const pinLabel =
      pinElement.querySelector(".pin-label")?.textContent || pinId;
    const pinType = pinElement.dataset.type || "unknown";

    // Build tooltip content
    let content = `<div class="tooltip-header">
      <span class="tooltip-title">${pinLabel}</span>
      <span class="tooltip-type">${pinType}</span>
    </div>`;

    if (description) {
      content += `<div class="tooltip-physics">${description.physics}</div>`;

      if (description.range) {
        content += `<div class="tooltip-range">
          <strong>Range:</strong> ${description.range.min} - ${description.range.max} (${description.range.unit})
        </div>`;
      }

      if (description.pbrRules && description.pbrRules.length > 0) {
        content += `<div class="tooltip-rules">
          <strong>PBR Rules:</strong>
          <ul>${description.pbrRules.map((r) => `<li>${r}</li>`).join("")}</ul>
        </div>`;
      }

      if (description.commonMistakes && description.commonMistakes.length > 0) {
        content += `<div class="tooltip-mistakes">
          <strong>⚠️ Common Mistakes:</strong>
          <ul>${description.commonMistakes
            .map((m) => `<li>${m}</li>`)
            .join("")}</ul>
        </div>`;
      }
    } else {
      // Fallback for pins without PBR description
      const tooltip = pinElement.dataset.tooltip;
      if (tooltip) {
        content += `<div class="tooltip-basic">${tooltip}</div>`;
      }
    }

    this.tooltip.innerHTML = content;

    // Position tooltip
    const rect = pinElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    let left = rect.right + 10;
    let top = rect.top;

    // Keep on screen
    if (left + 300 > window.innerWidth) {
      left = rect.left - 310;
    }
    if (top + 200 > window.innerHeight) {
      top = window.innerHeight - 210;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.display = "block";
  }

  /**
   * Hide the tooltip
   */
  hideTooltip() {
    this.tooltip.style.display = "none";
  }

  /**
   * Destroy tooltip controller
   */
  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
    }
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }
}

export default TooltipController;
