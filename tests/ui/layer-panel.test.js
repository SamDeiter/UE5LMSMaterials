/**
 * LayerPanel Tests
 *
 * Tests for the Material Layers UI panel.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { LayerPanel } from "../../material/ui/LayerPanel.js";

describe("LayerPanel", () => {
  let layerPanel;
  let mockApp;

  beforeEach(() => {
    mockApp = {
      triggerLiveUpdate: vi.fn(),
      updateStatus: vi.fn(),
    };
    layerPanel = new LayerPanel(mockApp);
  });

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  describe("Initialization", () => {
    it("should create a new instance", () => {
      expect(layerPanel).toBeDefined();
      expect(layerPanel.layers).toEqual([]);
      expect(layerPanel.selectedLayerIndex).toBe(-1);
    });

    it("should store app reference", () => {
      expect(layerPanel.app).toBe(mockApp);
    });

    it("should not be initialized by default", () => {
      expect(layerPanel.initialized).toBe(false);
    });
  });

  // =========================================================================
  // LAYER MANAGEMENT
  // =========================================================================
  describe("Layer Management", () => {
    it("should add a new layer", () => {
      const layer = layerPanel.addLayer("Test Layer");
      expect(layerPanel.layers.length).toBe(1);
      expect(layer.name).toBe("Test Layer");
      expect(layer.visible).toBe(true);
      expect(layer.weight).toBe(1.0);
    });

    it("should auto-name layers when name not provided", () => {
      layerPanel.addLayer();
      expect(layerPanel.layers[0].name).toBe("Layer 1");
    });

    it("should select newly added layer", () => {
      layerPanel.addLayer("Layer 1");
      layerPanel.addLayer("Layer 2");
      expect(layerPanel.selectedLayerIndex).toBe(1);
    });

    it("should trigger live update when adding layer", () => {
      layerPanel.addLayer("Test");
      expect(mockApp.triggerLiveUpdate).toHaveBeenCalled();
    });

    it("should remove a layer by index", () => {
      layerPanel.addLayer("Layer 1");
      layerPanel.addLayer("Layer 2");
      layerPanel.removeLayer(0);
      expect(layerPanel.layers.length).toBe(1);
      expect(layerPanel.layers[0].name).toBe("Layer 2");
    });

    it("should not remove the last layer", () => {
      layerPanel.addLayer("Only Layer");
      layerPanel.removeLayer(0);
      expect(layerPanel.layers.length).toBe(1);
      expect(mockApp.updateStatus).toHaveBeenCalledWith(
        "Cannot remove last layer",
      );
    });

    it("should adjust selection when removing selected layer", () => {
      layerPanel.addLayer("Layer 1");
      layerPanel.addLayer("Layer 2");
      layerPanel.addLayer("Layer 3");
      layerPanel.selectedLayerIndex = 2;
      layerPanel.removeLayer(2);
      expect(layerPanel.selectedLayerIndex).toBe(1);
    });
  });

  // =========================================================================
  // LAYER REORDERING
  // =========================================================================
  describe("Layer Reordering", () => {
    beforeEach(() => {
      layerPanel.addLayer("Layer 1");
      layerPanel.addLayer("Layer 2");
      layerPanel.addLayer("Layer 3");
    });

    it("should move layer up", () => {
      layerPanel.moveLayerUp(1);
      expect(layerPanel.layers[0].name).toBe("Layer 2");
      expect(layerPanel.layers[1].name).toBe("Layer 1");
    });

    it("should not move first layer up", () => {
      layerPanel.moveLayerUp(0);
      expect(layerPanel.layers[0].name).toBe("Layer 1");
    });

    it("should move layer down", () => {
      layerPanel.moveLayerDown(0);
      expect(layerPanel.layers[0].name).toBe("Layer 2");
      expect(layerPanel.layers[1].name).toBe("Layer 1");
    });

    it("should not move last layer down", () => {
      layerPanel.moveLayerDown(2);
      expect(layerPanel.layers[2].name).toBe("Layer 3");
    });

    it("should update selection when moving selected layer up", () => {
      layerPanel.selectedLayerIndex = 1;
      layerPanel.moveLayerUp(1);
      expect(layerPanel.selectedLayerIndex).toBe(0);
    });

    it("should update selection when moving selected layer down", () => {
      layerPanel.selectedLayerIndex = 0;
      layerPanel.moveLayerDown(0);
      expect(layerPanel.selectedLayerIndex).toBe(1);
    });
  });

  // =========================================================================
  // VISIBILITY AND SOLO
  // =========================================================================
  describe("Visibility and Solo", () => {
    beforeEach(() => {
      layerPanel.addLayer("Layer 1");
      layerPanel.addLayer("Layer 2");
    });

    it("should toggle layer visibility", () => {
      expect(layerPanel.layers[0].visible).toBe(true);
      layerPanel.toggleVisibility(0);
      expect(layerPanel.layers[0].visible).toBe(false);
      layerPanel.toggleVisibility(0);
      expect(layerPanel.layers[0].visible).toBe(true);
    });

    it("should toggle layer solo", () => {
      expect(layerPanel.layers[0].solo).toBe(false);
      layerPanel.toggleSolo(0);
      expect(layerPanel.layers[0].solo).toBe(true);
    });

    it("should turn off other solos when soloing a layer", () => {
      layerPanel.toggleSolo(0);
      layerPanel.toggleSolo(1);
      expect(layerPanel.layers[0].solo).toBe(false);
      expect(layerPanel.layers[1].solo).toBe(true);
    });

    it("should toggle solo off when clicking same layer", () => {
      layerPanel.toggleSolo(0);
      layerPanel.toggleSolo(0);
      expect(layerPanel.layers[0].solo).toBe(false);
    });
  });

  // =========================================================================
  // LAYER PROPERTIES
  // =========================================================================
  describe("Layer Properties", () => {
    beforeEach(() => {
      layerPanel.addLayer("Test Layer");
    });

    it("should set layer weight", () => {
      layerPanel.setLayerWeight(0, 0.5);
      expect(layerPanel.layers[0].weight).toBe(0.5);
    });

    it("should clamp weight to 0-1 range", () => {
      layerPanel.setLayerWeight(0, -0.5);
      expect(layerPanel.layers[0].weight).toBe(0);

      layerPanel.setLayerWeight(0, 1.5);
      expect(layerPanel.layers[0].weight).toBe(1);
    });

    it("should set layer blend mode", () => {
      layerPanel.setLayerBlendMode(0, "Height");
      expect(layerPanel.layers[0].blendMode).toBe("Height");
    });

    it("should trigger live update when changing properties", () => {
      mockApp.triggerLiveUpdate.mockClear();
      layerPanel.setLayerWeight(0, 0.5);
      expect(mockApp.triggerLiveUpdate).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SELECTION
  // =========================================================================
  describe("Selection", () => {
    beforeEach(() => {
      layerPanel.addLayer("Layer 1");
      layerPanel.addLayer("Layer 2");
    });

    it("should select a layer by index", () => {
      layerPanel.selectLayer(0);
      expect(layerPanel.selectedLayerIndex).toBe(0);
    });

    it("should get selected layer", () => {
      layerPanel.selectLayer(0);
      const layer = layerPanel.getSelectedLayer();
      expect(layer.name).toBe("Layer 1");
    });

    it("should return null when no layer selected", () => {
      layerPanel.selectedLayerIndex = -1;
      expect(layerPanel.getSelectedLayer()).toBeNull();
    });
  });

  // =========================================================================
  // SERIALIZATION
  // =========================================================================
  describe("Serialization", () => {
    beforeEach(() => {
      layerPanel.addLayer("Layer 1", { weight: 0.8, blendMode: "Height" });
      layerPanel.addLayer("Layer 2", { weight: 0.5 });
      layerPanel.selectLayer(1);
    });

    it("should serialize layer state", () => {
      const data = layerPanel.serialize();
      expect(data.layers.length).toBe(2);
      expect(data.selectedLayerIndex).toBe(1);
    });

    it("should deserialize layer state", () => {
      const data = layerPanel.serialize();

      const newPanel = new LayerPanel(mockApp);
      newPanel.deserialize(data);

      expect(newPanel.layers.length).toBe(2);
      expect(newPanel.layers[0].name).toBe("Layer 1");
      expect(newPanel.layers[0].weight).toBe(0.8);
      expect(newPanel.selectedLayerIndex).toBe(1);
    });

    it("should handle null deserialization", () => {
      const newPanel = new LayerPanel(mockApp);
      newPanel.deserialize(null);
      expect(newPanel.layers.length).toBe(0);
    });
  });
});
