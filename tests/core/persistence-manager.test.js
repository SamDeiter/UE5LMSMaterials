/**
 * tests/core/persistence-manager.test.js
 * 
 * Tests for PersistenceManager - handles save/load of material graphs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersistenceManager } from "../../material/core/PersistenceManager.js";

// Mock localStorage
function setupMockStorage() {
  const storage = new Map();
  
  global.localStorage = {
    getItem: vi.fn((key) => storage.get(key) || null),
    setItem: vi.fn((key, value) => storage.set(key, value)),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear())
  };
  
  return storage;
}

describe("PersistenceManager", () => {
  let manager;
  let mockApp;
  let storage;

  beforeEach(() => {
    storage = setupMockStorage();
    mockApp = {
      updateStatus: vi.fn()
    };
    manager = new PersistenceManager(mockApp);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default asset ID", () => {
      expect(manager.currentAssetId).toBe("NewMaterial");
    });

    it("should start with no dirty assets", () => {
      expect(manager.dirtyAssets.size).toBe(0);
    });

    it("should have correct storage key prefix", () => {
      expect(manager.storageKey).toBe("ue5_material_graph_data");
    });
  });

  describe("Dirty State", () => {
    it("should mark asset as dirty", () => {
      manager.markDirty("TestAsset");
      expect(manager.isDirty("TestAsset")).toBe(true);
    });

    it("should use default asset ID when marking dirty", () => {
      manager.markDirty();
      expect(manager.isDirty("NewMaterial")).toBe(true);
    });

    it("should update status when marking dirty", () => {
      manager.markDirty("MyMaterial");
      expect(mockApp.updateStatus).toHaveBeenCalledWith("Asset MyMaterial marked dirty");
    });

    it("should not re-mark already dirty assets", () => {
      manager.markDirty("TestAsset");
      manager.markDirty("TestAsset");
      
      // Should only be called once
      expect(mockApp.updateStatus).toHaveBeenCalledTimes(1);
    });

    it("should clear dirty flag", () => {
      manager.markDirty("TestAsset");
      manager.clearDirty("TestAsset");
      
      expect(manager.isDirty("TestAsset")).toBe(false);
    });

    it("should report not dirty for untracked assets", () => {
      expect(manager.isDirty("UnknownAsset")).toBe(false);
    });

    it("should track multiple dirty assets independently", () => {
      manager.markDirty("Asset1");
      manager.markDirty("Asset2");
      
      expect(manager.isDirty("Asset1")).toBe(true);
      expect(manager.isDirty("Asset2")).toBe(true);
      
      manager.clearDirty("Asset1");
      
      expect(manager.isDirty("Asset1")).toBe(false);
      expect(manager.isDirty("Asset2")).toBe(true);
    });
  });

  describe("Save", () => {
    it("should save graph data to localStorage", () => {
      const graphData = {
        nodes: [{ id: "node-1", x: 100, y: 200 }],
        connections: []
      };

      manager.save(graphData, "TestMaterial");

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "ue5_material_graph_data_TestMaterial",
        JSON.stringify(graphData)
      );
    });

    it("should return true on successful save", () => {
      const result = manager.save({ nodes: [] }, "TestMaterial");
      expect(result).toBe(true);
    });

    it("should clear dirty flag after save", () => {
      manager.markDirty("TestMaterial");
      manager.save({ nodes: [] }, "TestMaterial");
      
      expect(manager.isDirty("TestMaterial")).toBe(false);
    });

    it("should use default asset ID when saving", () => {
      manager.save({ nodes: [] });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "ue5_material_graph_data_NewMaterial",
        expect.any(String)
      );
    });

    it("should return false on save error", () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error("Storage full");
      });

      const result = manager.save({ nodes: [] });
      expect(result).toBe(false);
    });
  });

  describe("Load", () => {
    it("should load graph data from localStorage", () => {
      const graphData = { nodes: [{ id: "node-1" }], connections: [] };
      storage.set("ue5_material_graph_data_TestMaterial", JSON.stringify(graphData));

      const result = manager.load("TestMaterial");

      expect(result).toEqual(graphData);
    });

    it("should return null if no data exists", () => {
      const result = manager.load("NonExistent");
      expect(result).toBeNull();
    });

    it("should update current asset ID on load", () => {
      storage.set("ue5_material_graph_data_LoadedAsset", JSON.stringify({ nodes: [] }));
      
      manager.load("LoadedAsset");
      
      expect(manager.currentAssetId).toBe("LoadedAsset");
    });

    it("should clear dirty flag on load", () => {
      manager.markDirty("TestMaterial");
      storage.set("ue5_material_graph_data_TestMaterial", JSON.stringify({ nodes: [] }));
      
      manager.load("TestMaterial");
      
      expect(manager.isDirty("TestMaterial")).toBe(false);
    });

    it("should return null on parse error", () => {
      storage.set("ue5_material_graph_data_BadData", "not valid json{");
      localStorage.getItem.mockReturnValue("not valid json{");

      const result = manager.load("BadData");
      expect(result).toBeNull();
    });
  });

  describe("Clear", () => {
    it("should remove data from localStorage", () => {
      manager.clear();
      expect(localStorage.removeItem).toHaveBeenCalledWith("ue5_material_graph_data");
    });
  });

  describe("Has Data", () => {
    it("should return true when data exists", () => {
      storage.set("ue5_material_graph_data", JSON.stringify({ nodes: [] }));
      localStorage.getItem.mockReturnValue(JSON.stringify({ nodes: [] }));

      expect(manager.hasData()).toBe(true);
    });

    it("should return false when no data exists", () => {
      expect(manager.hasData()).toBe(false);
    });
  });

  describe("Title UI", () => {
    it("should log dirty title with asterisk", () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      manager.markDirty();
      
      expect(consoleSpy).toHaveBeenCalledWith("Editor Title: NewMaterial*");
      consoleSpy.mockRestore();
    });

    it("should log clean title without asterisk", () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      manager.markDirty();
      manager.clearDirty();
      
      expect(consoleSpy).toHaveBeenLastCalledWith("Editor Title: NewMaterial");
      consoleSpy.mockRestore();
    });
  });
});
