/**
 * ViewportController.js
 * 
 * Manages the 3D viewport with Three.js for material preview.
 * Extracted from material-app.js for modularity.
 */

import { debounce } from '../../shared/utils.js';
import { SceneManager } from '../engine/SceneManager.js';
import { VIEWPORT } from '../../src/constants/EditorConstants.js';

export class ViewportController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("viewport-container");
    this.canvas = document.getElementById("viewport-canvas");

    this.sceneManager = new SceneManager(this.canvas, this.container);
    this.initialized = false;
    
    // Realtime rendering toggle
    this.isRealtime = true;

    // WASD navigation state
    this.keysPressed = {};
    this.moveSpeed = VIEWPORT.MOVE_SPEED;

    // Initialize Scene
    this.init();

    // Bind UI controls
    this.bindControls();
    
    // Bind keyboard controls
    this.bindKeyboardControls();
  }

  async init() {
    await this.sceneManager.init();
    this.sceneManager.keyStateProvider = this;
    this.initialized = true;
    this.sceneManager.isRealtime = this.isRealtime;
    window.addEventListener("resize", () => this.sceneManager.resize());
    this.sceneManager.resize();
  }

  bindControls() {
    // View Mode dropdown (replaces old Lit/Unlit buttons)
    const viewModeSelect = document.getElementById("viewport-view-mode");
    viewModeSelect?.addEventListener("change", (e) => {
      this.setViewMode(e.target.value);
    });

    // Mesh select
    const meshSelect = document.getElementById("viewport-mesh-select");
    meshSelect?.addEventListener("change", (e) => {
      this.setGeometry(e.target.value);
    });

    // FOV slider
    const fovSlider = document.getElementById("viewport-fov");
    fovSlider?.addEventListener("input", (e) => {
      this.setFOV(parseFloat(e.target.value));
    });

    // Realtime toggle
    const realtimeBtn = document.getElementById("viewport-realtime-btn");
    realtimeBtn?.addEventListener("click", () => {
      this.isRealtime = !this.isRealtime;
      realtimeBtn.classList.toggle("active", this.isRealtime);
      if (this.isRealtime) {
        this.sceneManager.needsRender = true;
      }
    });

    // Grid toggle
    const gridBtn = document.getElementById("viewport-grid-btn");
    gridBtn?.addEventListener("click", () => {
      this.toggleGrid();
      gridBtn.classList.toggle("active", this.gridVisible);
    });

    // Tone Mapper toggle
    const tonemapperBtn = document.getElementById("viewport-tonemapper-btn");
    tonemapperBtn?.addEventListener("click", () => {
      this.toggleToneMapping();
      tonemapperBtn.classList.toggle("active", this.toneMappingEnabled);
    });

    // Environment preset dropdown
    const envSelect = document.getElementById("viewport-env-select");
    envSelect?.addEventListener("change", (e) => {
      this.sceneManager.setEnvironment(e.target.value);
    });

    // Floor toggle
    const floorBtn = document.getElementById("viewport-floor-btn");
    floorBtn?.addEventListener("click", () => {
      this.sceneManager.toggleFloor();
      floorBtn.classList.toggle("active");
    });

    // Exposure slider
    const exposureSlider = document.getElementById("viewport-exposure");
    exposureSlider?.addEventListener("input", (e) => {
      this.setExposure(parseFloat(e.target.value));
    });

    // Post-processing dropdown
    const ppSelect = document.getElementById("viewport-pp-select");
    ppSelect?.addEventListener("change", (e) => {
      this.setPostProcessing(e.target.value);
    });

    // Background toggle (HDRI skybox vs solid color)
    const bgBtn = document.getElementById("viewport-bg-btn");
    bgBtn?.addEventListener("click", () => {
      const showingHDRI = this.sceneManager.toggleBackground();
      bgBtn.classList.toggle("active", showingHDRI);
      this.app.updateStatus(showingHDRI ? "HDRI Background Enabled" : "Solid Background");
    });

    // Background color picker
    const bgColorPicker = document.getElementById("viewport-bg-color");
    bgColorPicker?.addEventListener("input", (e) => {
      this.sceneManager.setBackgroundColor(e.target.value);
    });
  }

  /**
   * Bind keyboard controls for WASD navigation
   */
  bindKeyboardControls() {
    this.canvas.tabIndex = 0;
    this.canvas?.addEventListener("keydown", (e) => {
      this.keysPressed[e.key.toLowerCase()] = true;
    });
    this.canvas?.addEventListener("keyup", (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
  }

  /**
   * Set the view mode: 'lit', 'unlit', or 'wireframe'
   */
  setViewMode(mode) {
    this.sceneManager.setViewMode(mode);
  }

  /**
   * Set camera field of view (30-90 degrees)
   */
  setFOV(degrees) {
    this.sceneManager.camera.fov = degrees;
    this.sceneManager.camera.updateProjectionMatrix();
    this.sceneManager.needsRender = true;
  }

  /**
   * Toggle grid visibility
   */
  toggleGrid() {
    if (!this.sceneManager.gridHelper) return;
    this.sceneManager.gridHelper.visible = !this.sceneManager.gridHelper.visible;
    this.sceneManager.needsRender = true;
  }

  /**
   * Toggle tone mapping (ACES Filmic vs None)
   */
  toggleToneMapping() {
    if (!this.sceneManager.renderer) return;
    const current = this.sceneManager.renderer.toneMapping;
    this.sceneManager.renderer.toneMapping = current === this.sceneManager.THREE.NoToneMapping 
      ? this.sceneManager.THREE.ACESFilmicToneMapping 
      : this.sceneManager.THREE.NoToneMapping;
    this.sceneManager.needsRender = true;
  }

  /**
   * Set exposure (EV value from -3 to +3)
   */
  setExposure(ev) {
    if (!this.sceneManager.renderer) return;
    this.sceneManager.renderer.toneMappingExposure = Math.pow(2, ev);
    this.sceneManager.needsRender = true;
  }

  toggleFloor() {
    this.sceneManager.toggleFloor();
  }

  setEnvironment(preset) {
    if (!this.initialized) return;
    this.sceneManager.setEnvironment(preset);
  }

  setGeometry(type) {
    this.sceneManager.setGeometry(type);
  }

  /**
   * Set post-processing mode: 'all', 'bloom', or 'none'
   */
  setPostProcessing(mode) {
    this.sceneManager.setPostProcessing(mode);
  }

  resize() {
    this.sceneManager.resize();
  }

  /**
   * Update material from graph evaluation result
   */
  updateMaterial(result) {
    if (!this.initialized || !result) return;
    
    const mat = this.sceneManager.material;
    if (!mat) return;

    if (result.baseColor) {
      mat.color.setRGB(result.baseColor[0], result.baseColor[1], result.baseColor[2]);
    }

    // PBR Properties (Multipliers for maps)
    mat.metalness = result.metallic ?? 0;
    mat.roughness = result.roughness ?? 0.5;

    // Advanced PBR
    mat.clearcoat = result.clearCoat ?? 0;
    mat.clearcoatRoughness = result.clearCoatRoughness ?? 0;
    mat.anisotropy = result.anisotropy ?? 0;

    // Emissive: if texture is connected, set color to white so texture shows
    if (result.emissiveTexture) {
      mat.emissive.setRGB(1, 1, 1); // White lets texture color through
      mat.emissiveIntensity = result.emissiveIntensity ?? 1.0;
    } else if (result.emissive) {
      mat.emissive.setRGB(result.emissive[0], result.emissive[1], result.emissive[2]);
      mat.emissiveIntensity = result.emissiveIntensity ?? 1.0;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }

    mat.transparent = result.opacity < 1.0;
    mat.opacity = result.opacity ?? 1.0;

    // Base Color
    if (result.baseColorTexture) {
      this.applyTextureMap(mat, 'map', result.baseColorTexture, result.baseColorUTiling, result.baseColorVTiling, true);
    } else {
      mat.map = null;
    }

    // Normal Map
    if (result.normalTexture) {
      this.applyTextureMap(mat, 'normalMap', result.normalTexture, result.normalUTiling, result.normalVTiling, false);
      mat.normalScale.set(1, 1);
    } else {
      mat.normalMap = null;
    }

    // Roughness Map
    if (result.roughnessTexture) {
      this.applyTextureMap(mat, 'roughnessMap', result.roughnessTexture, result.roughnessUTiling, result.roughnessVTiling, false);
    } else {
      mat.roughnessMap = null;
    }

    // Metallic Map
    if (result.metallicTexture) {
      this.applyTextureMap(mat, 'metalnessMap', result.metallicTexture, result.metallicUTiling, result.metallicVTiling, false);
    } else {
      mat.metalnessMap = null;
    }

    // Ambient Occlusion
    if (result.aoTexture) {
      this.applyTextureMap(mat, 'aoMap', result.aoTexture, result.aoUTiling, result.aoVTiling, false);
      mat.aoMapIntensity = result.ao ?? 1.0;
    } else {
      mat.aoMap = null;
    }

    // Emissive Map
    if (result.emissiveTexture) {
      this.applyTextureMap(mat, 'emissiveMap', result.emissiveTexture, result.emissiveUTiling, result.emissiveVTiling, true);
    } else {
      mat.emissiveMap = null;
    }

    mat.needsUpdate = true;
    this.sceneManager.needsRender = true;
  }

  /**
   * Helper to load and apply a texture map to a material property
   */
  applyTextureMap(mat, property, url, uTiling = 1, vTiling = 1, isSRGB = false) {
    this.loadTexture(url, (tex) => {
      tex.repeat.set(uTiling, vTiling);
      mat[property] = tex;
      mat.needsUpdate = true;
      this.sceneManager.needsRender = true;
    }, isSRGB);
  }

  /**
   * Load a texture from URL/data URL with caching
   */
  loadTexture(url, callback, isSRGB = false) {
    if (!url || !this.initialized) return;

    if (!this.textureCache) {
      this.textureCache = new Map();
    }

    const cacheKey = `${url}_${isSRGB ? 'srgb' : 'linear'}`;
    if (this.textureCache.has(cacheKey)) {
      callback(this.textureCache.get(cacheKey));
      return;
    }

    const loader = new this.sceneManager.THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        const THREE = this.sceneManager.THREE;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        // Colorspace correction
        texture.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        
        this.textureCache.set(cacheKey, texture);
        callback(texture);
        this.sceneManager.needsRender = true;
      },
      undefined,
      (error) => {
        console.warn("Failed to load texture:", error);
      }
    );
  }
}

