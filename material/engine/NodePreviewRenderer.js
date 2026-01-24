/**
 * NodePreviewRenderer.js
 *
 * WebGL-based mini-renderer for live node preview thumbnails.
 * Creates small 64x64 preview images showing the node's output.
 */

export class NodePreviewRenderer {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.THREE = null;
    this.initialized = false;
    this.previewSize = 64;

    // Shared resources for all previews
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.sphere = null;
    this.plane = null;

    // Cache for rendered preview data URLs
    this.previewCache = new Map();

    // Pending render queue
    this.renderQueue = [];
    this.isRendering = false;
  }

  /**
   * Initialize the preview renderer
   */
  async init() {
    if (this.initialized) return;

    // Wait for Three.js to be available
    if (!this.sceneManager.THREE) {
      console.warn("NodePreviewRenderer: THREE not available yet");
      return false;
    }

    this.THREE = this.sceneManager.THREE;

    // Create offscreen canvas for rendering
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.previewSize;
    this.canvas.height = this.previewSize;

    // Create dedicated renderer for previews
    this.renderer = new this.THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(this.previewSize, this.previewSize);
    this.renderer.setClearColor(0x1a1a1a, 1);

    // Create scene
    this.scene = new this.THREE.Scene();
    this.scene.background = new this.THREE.Color(0x1a1a1a);

    // Create orthographic camera for consistent preview sizing
    this.camera = new this.THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    // Create preview geometries
    const sphereGeometry = new this.THREE.SphereGeometry(1, 32, 32);
    const planeGeometry = new this.THREE.PlaneGeometry(2, 2);

    // Default material
    const defaultMaterial = new this.THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.0,
    });

    this.sphere = new this.THREE.Mesh(sphereGeometry, defaultMaterial.clone());
    this.plane = new this.THREE.Mesh(planeGeometry, defaultMaterial.clone());

    // Add lighting
    const ambientLight = new this.THREE.AmbientLight(0x404040, 0.5);
    const directionalLight = new this.THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(2, 2, 2);

    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
    this.scene.add(this.sphere);

    this.initialized = true;
    console.log("NodePreviewRenderer initialized");
    return true;
  }

  /**
   * Render a preview for a node
   * @param {Object} node - The node to render preview for
   * @param {Object} evaluatedValue - The evaluated output value
   * @param {string} previewType - Type of preview: 'color', 'normal', 'mask', 'sphere'
   * @returns {string|null} Data URL of the preview image
   */
  renderPreview(node, evaluatedValue, previewType = "sphere") {
    if (!this.initialized) {
      this.init();
      return null;
    }

    const cacheKey = `${node.id}-${JSON.stringify(evaluatedValue)}-${previewType}`;

    // Check cache
    if (this.previewCache.has(cacheKey)) {
      return this.previewCache.get(cacheKey);
    }

    try {
      let dataUrl;

      switch (previewType) {
        case "color":
          dataUrl = this.renderColorPreview(evaluatedValue);
          break;
        case "normal":
          dataUrl = this.renderNormalPreview(evaluatedValue);
          break;
        case "mask":
          dataUrl = this.renderMaskPreview(evaluatedValue);
          break;
        case "sphere":
        default:
          dataUrl = this.renderSpherePreview(evaluatedValue);
          break;
      }

      // Cache the result
      this.previewCache.set(cacheKey, dataUrl);

      return dataUrl;
    } catch (error) {
      console.error("Preview render error:", error);
      return null;
    }
  }

  /**
   * Render a flat color preview
   */
  renderColorPreview(value) {
    const color = this.valueToColor(value);

    // Use plane for flat color display
    this.scene.remove(this.sphere);
    this.scene.remove(this.plane);
    this.scene.add(this.plane);

    const material = new this.THREE.MeshBasicMaterial({ color });
    this.plane.material = material;

    // Position camera for plane view
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL("image/png");
  }

  /**
   * Render a sphere preview with material properties
   */
  renderSpherePreview(value) {
    // Use sphere for 3D preview
    this.scene.remove(this.sphere);
    this.scene.remove(this.plane);
    this.scene.add(this.sphere);

    let material;

    if (typeof value === "object" && value !== null) {
      // Complex material properties
      material = new this.THREE.MeshStandardMaterial({
        color: this.valueToColor(value.color || value.baseColor || value),
        roughness: value.roughness !== undefined ? value.roughness : 0.5,
        metalness: value.metallic !== undefined ? value.metallic : 0.0,
        emissive: value.emissive ? this.valueToColor(value.emissive) : 0x000000,
        emissiveIntensity: value.emissiveIntensity || 1.0,
      });
    } else {
      // Simple color value
      material = new this.THREE.MeshStandardMaterial({
        color: this.valueToColor(value),
        roughness: 0.5,
        metalness: 0.0,
      });
    }

    this.sphere.material = material;

    // Position camera for sphere view
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL("image/png");
  }

  /**
   * Render a normal map preview (special visualization)
   */
  renderNormalPreview(value) {
    this.scene.remove(this.sphere);
    this.scene.remove(this.plane);
    this.scene.add(this.sphere);

    // For normal maps, show the raw normal colors
    const normalColor = this.normalToColor(value);

    const material = new this.THREE.MeshBasicMaterial({
      color: normalColor,
    });

    this.sphere.material = material;
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL("image/png");
  }

  /**
   * Render a grayscale mask preview
   */
  renderMaskPreview(value) {
    this.scene.remove(this.sphere);
    this.scene.remove(this.plane);
    this.scene.add(this.plane);

    // Convert single value to grayscale
    const grayValue = typeof value === "number" ? value : 0.5;
    const grayInt = Math.round(grayValue * 255);
    const grayColor = (grayInt << 16) | (grayInt << 8) | grayInt;

    const material = new this.THREE.MeshBasicMaterial({
      color: grayColor,
    });

    this.plane.material = material;
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL("image/png");
  }

  /**
   * Convert a value to a Three.js color
   */
  valueToColor(value) {
    if (value === null || value === undefined) {
      return 0x808080;
    }

    // Array [r, g, b] with values 0-1
    if (Array.isArray(value)) {
      const r = Math.round((value[0] || 0) * 255);
      const g = Math.round((value[1] || 0) * 255);
      const b = Math.round((value[2] || 0) * 255);
      return (r << 16) | (g << 8) | b;
    }

    // Object { R, G, B } with values 0-1
    if (typeof value === "object") {
      const r = Math.round((value.R || value.r || 0) * 255);
      const g = Math.round((value.G || value.g || 0) * 255);
      const b = Math.round((value.B || value.b || 0) * 255);
      return (r << 16) | (g << 8) | b;
    }

    // Single number (grayscale)
    if (typeof value === "number") {
      const gray = Math.round(value * 255);
      return (gray << 16) | (gray << 8) | gray;
    }

    // String (hex color)
    if (typeof value === "string" && value.startsWith("#")) {
      return parseInt(value.slice(1), 16);
    }

    return 0x808080;
  }

  /**
   * Convert normal vector to visible color
   */
  normalToColor(value) {
    // Normal maps use 0.5, 0.5, 1.0 as "flat" (no normal offset)
    // We visualize this by mapping -1..1 to 0..1 for display
    let x = 0,
      y = 0,
      z = 1;

    if (Array.isArray(value)) {
      x = value[0] || 0;
      y = value[1] || 0;
      z = value[2] || 1;
    } else if (typeof value === "object") {
      x = value.x || value.X || 0;
      y = value.y || value.Y || 0;
      z = value.z || value.Z || 1;
    }

    // Map from -1..1 to 0..255
    const r = Math.round((x * 0.5 + 0.5) * 255);
    const g = Math.round((y * 0.5 + 0.5) * 255);
    const b = Math.round((z * 0.5 + 0.5) * 255);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Invalidate cache for a specific node
   */
  invalidateNode(nodeId) {
    for (const key of this.previewCache.keys()) {
      if (key.startsWith(`${nodeId}-`)) {
        this.previewCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached previews
   */
  clearCache() {
    this.previewCache.clear();
  }

  /**
   * Dispose of renderer resources
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.sphere) {
      this.sphere.geometry.dispose();
      this.sphere.material.dispose();
    }
    if (this.plane) {
      this.plane.geometry.dispose();
      this.plane.material.dispose();
    }
    this.previewCache.clear();
    this.initialized = false;
  }
}

// Singleton instance - will be created when SceneManager is available
export let nodePreviewRenderer = null;

export function initNodePreviewRenderer(sceneManager) {
  if (!nodePreviewRenderer) {
    nodePreviewRenderer = new NodePreviewRenderer(sceneManager);
  }
  return nodePreviewRenderer;
}
