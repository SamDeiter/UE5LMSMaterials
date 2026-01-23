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
        this.needsRender = true;
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

  /**
   * Toggle floor plane visibility
   */
  toggleFloor() {
    if (!this.initialized) return;
    
    this.floorVisible = !this.floorVisible;
    
    if (this.floorVisible && !this.floorPlane) {
      // Create floor plane on first toggle
      const floorGeo = new this.THREE.PlaneGeometry(20, 20);
      const floorMat = new this.THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0,
      });
      this.floorPlane = new this.THREE.Mesh(floorGeo, floorMat);
      this.floorPlane.rotation.x = -Math.PI / 2;
      this.floorPlane.position.y = 0;
      this.floorPlane.receiveShadow = true;
      this.scene.add(this.floorPlane);
    } else if (this.floorPlane) {
      this.floorPlane.visible = this.floorVisible;
    }
    
    this.needsRender = true;
  }

  /**
   * Set environment preset (studio, outdoor, night)
   */
  setEnvironment(preset) {
    if (!this.initialized) return;
    
    this.currentEnvironment = preset;
    
    const pmremGenerator = new this.THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    const envScene = new this.THREE.Scene();
    const envGeo = new this.THREE.SphereGeometry(50, 32, 32);
    
    let fragmentShader;
    
    switch (preset) {
      case 'outdoor':
        // Blue sky with sun
        fragmentShader = `
          varying vec3 vWorldPosition;
          void main() {
            vec3 dir = normalize(vWorldPosition);
            float y = dir.y;
            
            vec3 skyColor = vec3(0.4, 0.6, 1.0);
            vec3 horizonColor = vec3(0.8, 0.85, 0.9);
            vec3 groundColor = vec3(0.2, 0.15, 0.1);
            vec3 sunColor = vec3(3.0, 2.8, 2.2);
            
            vec3 color = mix(horizonColor, skyColor, smoothstep(0.0, 0.5, y));
            color = mix(groundColor, color, smoothstep(-0.1, 0.1, y));
            
            // Sun
            float sunDot = max(0.0, dot(dir, normalize(vec3(0.5, 0.7, 0.3))));
            color += sunColor * pow(sunDot, 64.0);
            
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
        
      case 'night':
        // Dark blue night sky
        fragmentShader = `
          varying vec3 vWorldPosition;
          void main() {
            vec3 dir = normalize(vWorldPosition);
            float y = dir.y;
            
            vec3 skyColor = vec3(0.02, 0.03, 0.08);
            vec3 horizonColor = vec3(0.05, 0.05, 0.1);
            vec3 groundColor = vec3(0.01, 0.01, 0.02);
            
            vec3 color = mix(horizonColor, skyColor, smoothstep(0.0, 0.5, y));
            color = mix(groundColor, color, smoothstep(-0.1, 0.1, y));
            
            // Subtle rim light
            float rim = smoothstep(0.7, 1.0, abs(dir.x)) * step(0.0, y) * 0.1;
            color += vec3(0.1, 0.15, 0.3) * rim;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
        
      default: // studio
        fragmentShader = `
          varying vec3 vWorldPosition;
          void main() {
            vec3 dir = normalize(vWorldPosition);
            float y = dir.y;
            float x = dir.x;
            
            vec3 topColor = vec3(2.0, 1.9, 1.8);
            vec3 bottomColor = vec3(0.05, 0.05, 0.08);
            vec3 sideColor = vec3(0.1, 0.12, 0.15);
            
            float topLight = smoothstep(0.3, 0.9, y);
            float rimLight = smoothstep(0.6, 1.0, abs(x)) * step(0.0, y) * 0.5;
            
            vec3 color = mix(sideColor, topColor, topLight);
            color = mix(color, bottomColor, smoothstep(-0.2, -0.8, y));
            color += vec3(0.8, 0.9, 1.0) * rimLight;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `;
    }
    
    const envMat = new this.THREE.ShaderMaterial({
      side: this.THREE.BackSide,
      uniforms: {},
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: fragmentShader
    });
    
    const envMesh = new this.THREE.Mesh(envGeo, envMat);
    envScene.add(envMesh);
    
    // Dispose old env map
    if (this.envMap) {
      this.envMap.dispose();
    }
    
    this.envMap = pmremGenerator.fromScene(envScene, 0, 0.1, 1000).texture;
    this.scene.environment = this.envMap;
    pmremGenerator.dispose();
    
    this.needsRender = true;
  }

  setGeometry(type) {
    this.sceneManager.setGeometry(type);
  }

  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Update camera position from keyboard input
      this.updateCameraFromKeys();
      
      this.controls.update();
      
      // Only render if in realtime mode or if render is needed
      if (this.isRealtime || this.needsRender) {
        this.renderer.render(this.scene, this.camera);
        this.needsRender = false;
      }
    };
    animate();
  }

  resize() {
    if (!this.initialized || !this.container) return;

    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 300;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
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

    mat.metalness = result.metallic ?? 0;
    mat.roughness = result.roughness ?? 0.5;

    if (result.emissive) {
      mat.emissive.setRGB(result.emissive[0], result.emissive[1], result.emissive[2]);
    }

    mat.transparent = result.opacity < 1.0;
    mat.opacity = result.opacity ?? 1.0;

    if (result.baseColorTexture) {
      this.loadTexture(result.baseColorTexture, (tex) => {
        tex.repeat.set(result.baseColorUTiling ?? 1, result.baseColorVTiling ?? 1);
        mat.map = tex;
        mat.needsUpdate = true;
        this.sceneManager.needsRender = true;
      });
    } else {
      mat.map = null;
    }

    mat.needsUpdate = true;
    this.sceneManager.needsRender = true;
  }

  /**
   * Load a texture from URL/data URL with caching
   */
  loadTexture(url, callback) {
    if (!url || !this.initialized) return;

    if (!this.textureCache) {
      this.textureCache = new Map();
    }

    if (this.textureCache.has(url)) {
      callback(this.textureCache.get(url));
      return;
    }

    const loader = new this.sceneManager.THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        const THREE = this.sceneManager.THREE;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set(url, texture);
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

