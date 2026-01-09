/**
 * Coordinate System Nodes Test Suite
 * ====================================
 * Tests for UV and space transformation nodes based on UE5 Materials Spec Section 3
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getRegistry, createNode, getDefinition } from "../setup.js";

describe("Coordinate System Nodes", () => {
  beforeAll(() => {
    getRegistry();
  });

  // =========================================================================
  // TEXTURE COORDINATE NODE
  // =========================================================================
  describe("TextureCoordinate Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("TextureCoordinate")).toBeDefined();
    });

    it("should output float2 UV coordinates", () => {
      const def = getDefinition("TextureCoordinate");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float2");
    });

    it("should have UTiling and VTiling properties", () => {
      // From spec: "Modifying UTiling/VTiling in node detail panel is more efficient"
      const def = getDefinition("TextureCoordinate");
      expect(def.properties).toHaveProperty("UTiling");
      expect(def.properties).toHaveProperty("VTiling");
    });

    it("should support CoordinateIndex for multi-UV channels", () => {
      // From spec: "Modern game assets often use multiple UV channels (UV0 for albedo, UV1 for lightmaps)"
      const def = getDefinition("TextureCoordinate");
      expect(def.properties).toHaveProperty("CoordinateIndex");
    });

    it("should produce HLSL referencing GetTextureCoordinates", () => {
      const hlsl = createNode("TextureCoordinate").getShaderSnippet();
      expect(hlsl).toContain("GetTextureCoordinates");
    });

    it("should apply tiling multiplication in HLSL", () => {
      const hlsl = createNode("TextureCoordinate").getShaderSnippet();
      expect(hlsl).toContain("*");
      expect(hlsl).toContain("float2(");
    });
  });

  // =========================================================================
  // PANNER NODE
  // =========================================================================
  describe("Panner Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Panner")).toBeDefined();
    });

    it("should have Coordinate input (float2)", () => {
      const def = getDefinition("Panner");
      const coordPin = def.pins.find((p) => p.id === "coordinate");
      expect(coordPin).toBeDefined();
      expect(coordPin.type).toBe("float2");
    });

    it("should have optional Time input override", () => {
      // From spec: "Time input pin allows for custom synchronization"
      const def = getDefinition("Panner");
      const timePin = def.pins.find((p) => p.id === "time");
      expect(timePin).toBeDefined();
      expect(timePin.dir).toBe("in");
    });

    it("should have SpeedX and SpeedY properties", () => {
      const def = getDefinition("Panner");
      expect(def.properties).toHaveProperty("SpeedX");
      expect(def.properties).toHaveProperty("SpeedY");
    });

    it("should produce HLSL: Coordinate + (Time * Speed)", () => {
      // From spec: "Result = Coordinate + (Time * Speed)"
      const hlsl = createNode("Panner").getShaderSnippet();
      expect(hlsl).toContain("+");
      expect(hlsl).toContain("*");
    });

    it("should output float2", () => {
      const def = getDefinition("Panner");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float2");
    });
  });

  // =========================================================================
  // WORLD POSITION NODE
  // =========================================================================
  describe("WorldPosition Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("WorldPosition")).toBeDefined();
    });

    it("should output float3 world coordinates", () => {
      // From spec: "Essential for World Aligned Mapping (Triplanar)"
      const def = getDefinition("WorldPosition");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float3");
    });

    it("should produce HLSL referencing WorldPositionWS", () => {
      const hlsl = createNode("WorldPosition").getShaderSnippet();
      expect(hlsl).toContain("WorldPositionWS");
    });
  });

  // =========================================================================
  // CAMERA VECTOR NODE
  // =========================================================================
  describe("CameraVector Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("CameraVector")).toBeDefined();
    });

    it("should output float3", () => {
      // From spec: "normalize(CameraPosition - WorldPosition)"
      const def = getDefinition("CameraVector");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float3");
    });

    it("should produce HLSL referencing CameraVectorWS", () => {
      const hlsl = createNode("CameraVector").getShaderSnippet();
      expect(hlsl).toContain("CameraVectorWS");
    });
  });

  // =========================================================================
  // PIXEL NORMAL WS NODE
  // =========================================================================
  describe("PixelNormalWS Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("PixelNormalWS")).toBeDefined();
    });

    it("should output float3 normal vector", () => {
      const def = getDefinition("PixelNormalWS");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float3");
    });

    it("should produce HLSL referencing PixelNormalWS", () => {
      // From spec: "Parameters.WorldNormal"
      const hlsl = createNode("PixelNormalWS").getShaderSnippet();
      expect(hlsl).toContain("PixelNormalWS");
    });
  });

  // =========================================================================
  // TIME NODE
  // =========================================================================
  describe("Time Node", () => {
    it("should exist in registry", () => {
      expect(getDefinition("Time")).toBeDefined();
    });

    it("should output float", () => {
      const def = getDefinition("Time");
      const outPin = def.pins.find((p) => p.dir === "out");
      expect(outPin.type).toBe("float");
    });

    it("should produce HLSL referencing Time uniform", () => {
      const hlsl = createNode("Time").getShaderSnippet();
      expect(hlsl).toContain("Time");
    });
  });
});
