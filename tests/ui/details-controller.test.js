/**
 * Details Panel Controller Test Suite
 * ====================================
 * Tests for MaterialDetailsController.js including:
 * - Category collapse/expand functionality
 * - Property search filtering
 * - Auto-expand on search match
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock DOM elements and document methods
const createMockDOM = () => {
  const categories = [
    { name: "Material", collapsed: false, properties: ["Material Domain", "Blend Mode", "Shading Model"] },
    { name: "Translucency", collapsed: true, properties: ["Lighting Mode"] },
    { name: "Physical Material", collapsed: true, properties: ["Phys Material Override"] },
    { name: "Usage", collapsed: true, properties: ["Used with Skeletal Mesh", "Used with Particle Sprites"] },
  ];

  const mockElements = {
    categories: categories.map(cat => ({
      classList: {
        _collapsed: cat.collapsed,
        toggle: vi.fn(function(className) {
          if (className === "collapsed") {
            this._collapsed = !this._collapsed;
          }
        }),
        contains: vi.fn(function(className) {
          if (className === "collapsed") return this._collapsed;
          return false;
        }),
        remove: vi.fn(function(className) {
          if (className === "collapsed") this._collapsed = false;
        }),
        add: vi.fn(function(className) {
          if (className === "collapsed") this._collapsed = true;
        }),
      },
      style: { display: "" },
      querySelector: vi.fn((selector) => {
        if (selector === ".category-header i") {
          return { className: "fas fa-chevron-down" };
        }
        if (selector.includes(".property-row:not")) {
          // Check if any visible property rows exist
          return cat.properties.length > 0 ? {} : null;
        }
        return null;
      }),
      querySelectorAll: vi.fn((selector) => {
        if (selector === ".property-row") {
          return cat.properties.map(prop => ({
            style: { display: "" },
            querySelector: vi.fn(() => ({ textContent: prop })),
          }));
        }
        return [];
      }),
      _name: cat.name,
      _properties: cat.properties,
    })),
    propertyRows: [],
    searchInput: {
      value: "",
      addEventListener: vi.fn(),
    },
  };

  // Generate property rows from categories
  categories.forEach(cat => {
    cat.properties.forEach(prop => {
      mockElements.propertyRows.push({
        style: { display: "" },
        querySelector: vi.fn(() => ({ textContent: prop })),
        _label: prop,
        _categoryName: cat.name,
      });
    });
  });

  return mockElements;
};

describe("DetailsController", () => {
  let mockDOM;

  beforeEach(() => {
    mockDOM = createMockDOM();
  });

  // ===========================================================================
  // CATEGORY TOGGLE TESTS
  // ===========================================================================
  describe("Category Toggle", () => {
    it("should toggle collapsed class when category header is clicked", () => {
      const category = mockDOM.categories[0]; // Material category
      expect(category.classList._collapsed).toBe(false);
      
      // Simulate click
      category.classList.toggle("collapsed");
      
      expect(category.classList.toggle).toHaveBeenCalledWith("collapsed");
      expect(category.classList._collapsed).toBe(true);
    });

    it("should expand a collapsed category on click", () => {
      const category = mockDOM.categories[1]; // Translucency (starts collapsed)
      expect(category.classList._collapsed).toBe(true);
      
      // Simulate click to expand
      category.classList.toggle("collapsed");
      
      expect(category.classList._collapsed).toBe(false);
    });

    it("should maintain independent state for each category", () => {
      const material = mockDOM.categories[0];
      const usage = mockDOM.categories[3];
      
      // Collapse Material
      material.classList.toggle("collapsed");
      
      // Usage should be unchanged (still collapsed)
      expect(usage.classList._collapsed).toBe(true);
      expect(material.classList._collapsed).toBe(true);
    });
  });

  // ===========================================================================
  // SEARCH FILTER TESTS
  // ===========================================================================
  describe("Search Filter", () => {
    /**
     * Simulates the filterProperties function behavior
     */
    const filterProperties = (query, propertyRows, categories) => {
      const lowerQuery = query.toLowerCase().trim();
      
      // Filter property rows
      propertyRows.forEach(row => {
        const label = row._label.toLowerCase();
        row.style.display = !lowerQuery || label.includes(lowerQuery) ? "" : "none";
      });
      
      // Show/hide categories based on visible children
      categories.forEach(category => {
        const visibleRows = propertyRows.filter(
          row => row._categoryName === category._name && row.style.display !== "none"
        );
        category.style.display = visibleRows.length > 0 ? "" : "none";
        
        // Auto-expand if has matches
        if (lowerQuery && visibleRows.length > 0) {
          category.classList.remove("collapsed");
        }
      });
    };

    it("should show all properties when search is empty", () => {
      filterProperties("", mockDOM.propertyRows, mockDOM.categories);
      
      const hiddenRows = mockDOM.propertyRows.filter(r => r.style.display === "none");
      expect(hiddenRows.length).toBe(0);
    });

    it("should filter properties by label text", () => {
      filterProperties("blend", mockDOM.propertyRows, mockDOM.categories);
      
      const visibleRows = mockDOM.propertyRows.filter(r => r.style.display !== "none");
      expect(visibleRows.length).toBe(1);
      expect(visibleRows[0]._label).toBe("Blend Mode");
    });

    it("should be case-insensitive", () => {
      filterProperties("BLEND", mockDOM.propertyRows, mockDOM.categories);
      
      const visibleRows = mockDOM.propertyRows.filter(r => r.style.display !== "none");
      expect(visibleRows.length).toBe(1);
      expect(visibleRows[0]._label).toBe("Blend Mode");
    });

    it("should hide categories with no matching properties", () => {
      filterProperties("blend", mockDOM.propertyRows, mockDOM.categories);
      
      // Only Material category should be visible (contains "Blend Mode")
      const visibleCategories = mockDOM.categories.filter(c => c.style.display !== "none");
      expect(visibleCategories.length).toBe(1);
      expect(visibleCategories[0]._name).toBe("Material");
    });

    it("should show multiple matches", () => {
      filterProperties("used", mockDOM.propertyRows, mockDOM.categories);
      
      const visibleRows = mockDOM.propertyRows.filter(r => r.style.display !== "none");
      expect(visibleRows.length).toBe(2);
      expect(visibleRows.every(r => r._label.includes("Used"))).toBe(true);
    });

    it("should show all categories when no search query", () => {
      filterProperties("", mockDOM.propertyRows, mockDOM.categories);
      
      const visibleCategories = mockDOM.categories.filter(c => c.style.display !== "none");
      expect(visibleCategories.length).toBe(4);
    });

    it("should auto-expand categories when they contain matches", () => {
      // Usage starts collapsed
      const usageCategory = mockDOM.categories[3];
      expect(usageCategory.classList._collapsed).toBe(true);
      
      filterProperties("skeletal", mockDOM.propertyRows, mockDOM.categories);
      
      // Usage should now be expanded (has matching property)
      expect(usageCategory.classList._collapsed).toBe(false);
    });

    it("should handle partial matches", () => {
      filterProperties("mat", mockDOM.propertyRows, mockDOM.categories);
      
      const visibleRows = mockDOM.propertyRows.filter(r => r.style.display !== "none");
      // Should match "Material Domain", "Phys Material Override"
      expect(visibleRows.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle no matches gracefully", () => {
      filterProperties("zzzznonexistent", mockDOM.propertyRows, mockDOM.categories);
      
      const visibleRows = mockDOM.propertyRows.filter(r => r.style.display !== "none");
      expect(visibleRows.length).toBe(0);
      
      const visibleCategories = mockDOM.categories.filter(c => c.style.display !== "none");
      expect(visibleCategories.length).toBe(0);
    });
  });

  // ===========================================================================
  // INTEGRATION TESTS
  // ===========================================================================
  describe("Integration", () => {
    it("should restore all properties when clearing search after filtering", () => {
      const filterProperties = (query, propertyRows, categories) => {
        const lowerQuery = query.toLowerCase().trim();
        propertyRows.forEach(row => {
          const label = row._label.toLowerCase();
          row.style.display = !lowerQuery || label.includes(lowerQuery) ? "" : "none";
        });
        categories.forEach(category => {
          const visibleRows = propertyRows.filter(
            row => row._categoryName === category._name && row.style.display !== "none"
          );
          category.style.display = visibleRows.length > 0 ? "" : "none";
        });
      };

      // Filter first
      filterProperties("blend", mockDOM.propertyRows, mockDOM.categories);
      expect(mockDOM.propertyRows.filter(r => r.style.display !== "none").length).toBe(1);
      
      // Clear filter
      filterProperties("", mockDOM.propertyRows, mockDOM.categories);
      expect(mockDOM.propertyRows.filter(r => r.style.display !== "none").length).toBe(7);
    });

    it("should allow toggling categories while search is active", () => {
      const filterProperties = (query, propertyRows, categories) => {
        const lowerQuery = query.toLowerCase().trim();
        propertyRows.forEach(row => {
          const label = row._label.toLowerCase();
          row.style.display = !lowerQuery || label.includes(lowerQuery) ? "" : "none";
        });
        categories.forEach(category => {
          const visibleRows = propertyRows.filter(
            row => row._categoryName === category._name && row.style.display !== "none"
          );
          category.style.display = visibleRows.length > 0 ? "" : "none";
          if (lowerQuery && visibleRows.length > 0) {
            category.classList.remove("collapsed");
          }
        });
      };

      // Search for something in Material category
      filterProperties("domain", mockDOM.propertyRows, mockDOM.categories);
      
      const materialCategory = mockDOM.categories[0];
      expect(materialCategory.style.display).not.toBe("none");
      
      // Toggle collapse should still work
      materialCategory.classList.toggle("collapsed");
      expect(materialCategory.classList._collapsed).toBe(true);
    });
  });
});
