/**
 * ViewportController.js
 *
 * Manages the 3D viewport with Three.js for material preview.
 * Extracted from material-app.js for modularity.
 */

import { debounce } from "../../shared/utils.js";
import { SceneManager } from "../engine/SceneManager.js";
import { VIEWPORT } from "../../src/constants/EditorConstants.js";

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
    // === DROPDOWN CLICK-TOGGLE SETUP ===
    // Make dropdowns toggle on click instead of hover-only
    document
      .querySelectorAll(".viewport-tab.dropdown-trigger")
      .forEach((tab) => {
        tab.addEventListener("click", (e) => {
          // Don't toggle if clicking on a dropdown item
          if (e.target.closest(".viewport-dropdown")) return;

          // Close all other dropdowns first
          document.querySelectorAll(".viewport-tab.open").forEach((t) => {
            if (t !== tab) t.classList.remove("open");
          });

          // Toggle this dropdown
          tab.classList.toggle("open");
          e.stopPropagation();
        });
      });

    // Close dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".viewport-tab")) {
        document.querySelectorAll(".viewport-tab.open").forEach((t) => {
          t.classList.remove("open");
        });
      }
    });

    // Close dropdown after selecting an item
    document
      .querySelectorAll(".viewport-dropdown .dropdown-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          document.querySelectorAll(".viewport-tab.open").forEach((t) => {
            t.classList.remove("open");
          });
        });
      });

    // === UE5-STYLE DROPDOWN TABS ===

    // Lit dropdown (view modes)
    const litDropdown = document.getElementById("lit-dropdown");
    const litTab = document.getElementById("lit-tab");
    litDropdown?.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const mode = e.target.dataset.value;
        this.setViewMode(mode);
        // Update tab label and active states
        litTab.querySelector("span").textContent = e.target.textContent;
        litDropdown
          .querySelectorAll(".dropdown-item")
          .forEach((i) => i.classList.remove("active"));
        e.target.classList.add("active");
      });
    });

    // Perspective dropdown (camera presets)
    const perspectiveDropdown = document.getElementById("perspective-dropdown");
    const perspectiveTab = document.getElementById("perspective-tab");
    perspectiveDropdown?.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const preset = e.target.dataset.value;
        this.setCameraPreset(preset);
        // Update tab label and active states
        perspectiveTab.querySelector("span").textContent = e.target.textContent;
        perspectiveDropdown
          .querySelectorAll(".dropdown-item")
          .forEach((i) => i.classList.remove("active"));
        e.target.classList.add("active");
      });
    });

    // Show dropdown checkboxes
    document.getElementById("show-grid")?.addEventListener("change", (e) => {
      this.gridVisible = e.target.checked;
      if (this.sceneManager?.gridHelper) {
        this.sceneManager.gridHelper.visible = this.gridVisible;
        this.sceneManager.needsRender = true;
      }
    });

    document.getElementById("show-floor")?.addEventListener("change", (e) => {
      if (e.target.checked) {
        this.sceneManager?.toggleFloor();
      } else if (this.sceneManager?.floorPlane) {
        this.sceneManager.floorPlane.visible = false;
        this.sceneManager.needsRender = true;
      }
    });

    document
      .getElementById("show-background")
      ?.addEventListener("change", (e) => {
        if (e.target.checked && !this.sceneManager?.showHDRIBackground) {
          this.sceneManager?.toggleBackground();
        } else if (!e.target.checked && this.sceneManager?.showHDRIBackground) {
          this.sceneManager?.toggleBackground();
        }
      });

    document
      .getElementById("show-postprocess")
      ?.addEventListener("change", (e) => {
        this.setPostProcessing(e.target.checked ? "all" : "none");
      });

    document.getElementById("show-bloom")?.addEventListener("change", (e) => {
      if (this.sceneManager?.bloomPass) {
        this.sceneManager.bloomPass.enabled = e.target.checked;
        this.sceneManager.needsRender = true;
      }
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

    // Exposure slider and number input (synced)
    const exposureSlider = document.getElementById("viewport-exposure");
    const exposureInput = document.getElementById("viewport-exposure-value");

    exposureSlider?.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      if (exposureInput) exposureInput.value = value.toFixed(1);
      this.setExposure(value);
    });

    exposureInput?.addEventListener("input", (e) => {
      let value = parseFloat(e.target.value) || 0;
      value = Math.max(-3, Math.min(3, value)); // Clamp to valid range
      if (exposureSlider) exposureSlider.value = value;
      this.setExposure(value);
    });

    // Post-processing dropdown
    const ppSelect = document.getElementById("viewport-pp-select");
    ppSelect?.addEventListener("change", (e) => {
      this.setPostProcessing(e.target.value);
    });

    // Background toggle (HDRI skybox vs solid color)
    const bgBtn = document.getElementById("viewport-bg-btn");
    bgBtn?.addEventListener("click", async () => {
      // If HDRI not loaded yet and we're turning it on, load it first
      if (
        !this.sceneManager.hdriTexture &&
        !this.sceneManager.showHDRIBackground
      ) {
        this.app.updateStatus("Loading HDRI background...");
        await this.sceneManager.setEnvironment("studio");
      }

      const showingHDRI = this.sceneManager.toggleBackground();
      bgBtn.classList.toggle("active", showingHDRI);
      this.app.updateStatus(
        showingHDRI ? "HDRI Background Enabled" : "Solid Background",
      );
    });

    // Background color picker
    const bgColorPicker = document.getElementById("viewport-bg-color");
    bgColorPicker?.addEventListener("input", (e) => {
      this.sceneManager.setBackgroundColor(e.target.value);
    });
  }

  /**
   * Bind keyboard controls for WASD navigation and L+drag light rotation
   */
  bindKeyboardControls() {
    this.canvas.tabIndex = 0;

    // Track L key state for light rotation - use document listener for better coverage
    this.isLightDragging = false;
    this.lastMousePos = { x: 0, y: 0 };

    // IMPORTANT: Listen on document for L key to work even when canvas doesn't have focus
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      this.keysPressed[key] = true;

      // If L is pressed, disable OrbitControls to prevent camera movement
      if (key === "l" && this.sceneManager?.controls) {
        this.sceneManager.controls.enabled = false;
      }
    });

    document.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      this.keysPressed[key] = false;

      // Re-enable OrbitControls when L is released
      if (key === "l" && this.sceneManager?.controls) {
        this.sceneManager.controls.enabled = true;
        // Also end any light dragging
        if (this.isLightDragging) {
          this.isLightDragging = false;
          this.sceneManager.showLightHelper?.(false);
        }
      }
    });

    // L + Left Click + Drag to rotate light (UE5 style)
    this.canvas?.addEventListener("mousedown", (e) => {
      if (this.keysPressed["l"] && e.button === 0) {
        this.isLightDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        // Show light helper while dragging
        this.sceneManager.showLightHelper?.(true);
      }
    });

    this.canvas?.addEventListener("mousemove", (e) => {
      if (this.isLightDragging && this.keysPressed["l"]) {
        const deltaX = e.clientX - this.lastMousePos.x;
        const deltaY = e.clientY - this.lastMousePos.y;
        this.lastMousePos = { x: e.clientX, y: e.clientY };

        // Rotate light based on mouse movement
        this.rotateLightByDelta(deltaX, deltaY);
      }
    });

    this.canvas?.addEventListener("mouseup", (e) => {
      if (this.isLightDragging) {
        this.isLightDragging = false;
        // Hide light helper after dragging
        this.sceneManager.showLightHelper?.(false);
      }
    });

    // Also stop dragging if mouse leaves canvas
    this.canvas?.addEventListener("mouseleave", () => {
      if (this.isLightDragging) {
        this.isLightDragging = false;
        this.sceneManager.showLightHelper?.(false);
      }
    });
  }

  /**
   * Rotate the directional light based on mouse delta
   * @param {number} deltaX - Horizontal mouse movement
   * @param {number} deltaY - Vertical mouse movement
   */
  rotateLightByDelta(deltaX, deltaY) {
    if (!this.sceneManager.directionalLight) return;

    const light = this.sceneManager.directionalLight;
    const sensitivity = 0.01;

    // Get current light direction as spherical coordinates
    const pos = light.position.clone();
    const radius = pos.length();

    // Calculate current angles
    let theta = Math.atan2(pos.x, pos.z); // Horizontal angle
    let phi = Math.acos(pos.y / radius); // Vertical angle

    // Apply rotation based on mouse movement
    theta -= deltaX * sensitivity;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * sensitivity));

    // Convert back to Cartesian coordinates
    light.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta),
    );

    // Light always points at origin
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();

    // Update the light helper to show new direction
    if (this.sceneManager.lightHelper) {
      this.sceneManager.lightHelper.update();
    }

    this.sceneManager.needsRender = true;
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
   * Set camera to a preset position/angle
   * @param {string} preset - 'perspective', 'front', 'back', 'top', 'bottom', 'left', 'right'
   */
  setCameraPreset(preset) {
    if (!this.sceneManager?.camera || !this.sceneManager?.controls) return;

    const camera = this.sceneManager.camera;
    const controls = this.sceneManager.controls;
    const distance = 5;
    const targetY = 1; // Object center height

    const presets = {
      perspective: { pos: [3, 4, 5], target: [0, targetY, 0] },
      front: { pos: [0, targetY, distance], target: [0, targetY, 0] },
      back: { pos: [0, targetY, -distance], target: [0, targetY, 0] },
      top: { pos: [0, distance + targetY, 0.01], target: [0, targetY, 0] },
      bottom: { pos: [0, -distance + targetY, 0.01], target: [0, targetY, 0] },
      left: { pos: [-distance, targetY, 0], target: [0, targetY, 0] },
      right: { pos: [distance, targetY, 0], target: [0, targetY, 0] },
    };

    const config = presets[preset] || presets.perspective;
    camera.position.set(...config.pos);
    controls.target.set(...config.target);
    controls.update();
    this.sceneManager.needsRender = true;
  }

  /**
   * Toggle grid visibility
   */
  toggleGrid() {
    if (!this.sceneManager.gridHelper) return;
    this.sceneManager.gridHelper.visible =
      !this.sceneManager.gridHelper.visible;
    this.sceneManager.needsRender = true;
  }

  /**
   * Toggle tone mapping (ACES Filmic vs None)
   */
  toggleToneMapping() {
    if (!this.sceneManager.renderer) return;
    const current = this.sceneManager.renderer.toneMapping;
    this.sceneManager.renderer.toneMapping =
      current === this.sceneManager.THREE.NoToneMapping
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
      mat.color.setRGB(
        result.baseColor[0],
        result.baseColor[1],
        result.baseColor[2],
      );
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
      mat.emissive.setRGB(
        result.emissive[0],
        result.emissive[1],
        result.emissive[2],
      );
      mat.emissiveIntensity = result.emissiveIntensity ?? 1.0;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }

    mat.transparent = result.opacity < 1.0;
    mat.opacity = result.opacity ?? 1.0;

    // Base Color
    if (result.baseColorTexture) {
      this.applyTextureMap(
        mat,
        "map",
        result.baseColorTexture,
        result.baseColorUTiling,
        result.baseColorVTiling,
        true,
      );
    } else {
      mat.map = null;
    }

    // Normal Map
    if (result.normalTexture) {
      this.applyTextureMap(
        mat,
        "normalMap",
        result.normalTexture,
        result.normalUTiling,
        result.normalVTiling,
        false,
      );
      mat.normalScale.set(1, 1);
    } else {
      mat.normalMap = null;
    }

    // Roughness Map
    if (result.roughnessTexture) {
      this.applyTextureMap(
        mat,
        "roughnessMap",
        result.roughnessTexture,
        result.roughnessUTiling,
        result.roughnessVTiling,
        false,
      );
    } else {
      mat.roughnessMap = null;
    }

    // Metallic Map
    if (result.metallicTexture) {
      this.applyTextureMap(
        mat,
        "metalnessMap",
        result.metallicTexture,
        result.metallicUTiling,
        result.metallicVTiling,
        false,
      );
    } else {
      mat.metalnessMap = null;
    }

    // Ambient Occlusion
    if (result.aoTexture) {
      this.applyTextureMap(
        mat,
        "aoMap",
        result.aoTexture,
        result.aoUTiling,
        result.aoVTiling,
        false,
      );
      mat.aoMapIntensity = result.ao ?? 1.0;
    } else {
      mat.aoMap = null;
    }

    // Emissive Map
    if (result.emissiveTexture) {
      this.applyTextureMap(
        mat,
        "emissiveMap",
        result.emissiveTexture,
        result.emissiveUTiling,
        result.emissiveVTiling,
        true,
      );
    } else {
      mat.emissiveMap = null;
    }

    mat.needsUpdate = true;
    this.sceneManager.needsRender = true;
  }

  /**
   * Helper to load and apply a texture map to a material property
   */
  applyTextureMap(
    mat,
    property,
    url,
    uTiling = 1,
    vTiling = 1,
    isSRGB = false,
  ) {
    this.loadTexture(
      url,
      (tex) => {
        tex.repeat.set(uTiling, vTiling);
        mat[property] = tex;
        mat.needsUpdate = true;
        this.sceneManager.needsRender = true;
      },
      isSRGB,
    );
  }

  /**
   * Load a texture from URL/data URL with caching
   */
  loadTexture(url, callback, isSRGB = false) {
    if (!url || !this.initialized) return;

    if (!this.textureCache) {
      this.textureCache = new Map();
    }

    const cacheKey = `${url}_${isSRGB ? "srgb" : "linear"}`;
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
      },
    );
  }
}
