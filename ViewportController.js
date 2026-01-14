/**
 * ViewportController.js
 * 
 * Manages the 3D viewport with Three.js for material preview.
 * Extracted from material-app.js for modularity.
 */

import { debounce } from './utils.js';

export class ViewportController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("viewport-container");
    this.canvas = document.getElementById("viewport-canvas");

    this.THREE = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mesh = null;
    this.material = null;
    this.geometries = {};
    this.initialized = false;
    this.animationId = null;
    this.isLit = true;
    this.currentGeoType = "sphere";

    // Lights
    this.ambientLight = null;
    this.directionalLight = null;

    // Initialize Three.js
    this.init();

    // Bind UI controls
    this.bindControls();
  }

  async init() {
    try {
      // Dynamic import of Three.js
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/addons/controls/OrbitControls.js"
      );

      this.THREE = THREE;

      // Scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a0a0a);

      // Grid helper
      const gridHelper = new THREE.GridHelper(10, 10, 0x333333, 0x111111);
      this.scene.add(gridHelper);

      // Camera
      const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
      this.camera.position.set(2.5, 2, 4);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
      });
      this.renderer.setSize(
        this.canvas.clientWidth || 300,
        this.canvas.clientHeight || 300
      );
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.target.set(0, 1, 0);

      // Lighting
      this.directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      this.directionalLight.position.set(3, 10, 5);
      this.scene.add(this.directionalLight);

      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(this.ambientLight);

      // Create geometries
      this.geometries = {
        sphere: new THREE.SphereGeometry(1, 64, 64),
        cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
        cylinder: new THREE.CylinderGeometry(1, 1, 2, 32),
        plane: new THREE.PlaneGeometry(3, 3),
      };

      // Create material
      this.material = new THREE.MeshPhysicalMaterial({
        color: 0x808080,
        metalness: 0,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });

      // Create initial mesh
      this.mesh = new THREE.Mesh(this.geometries.sphere, this.material);
      this.mesh.position.y = 1;
      this.scene.add(this.mesh);

      this.initialized = true;

      // Handle resize
      window.addEventListener("resize", () => this.resize());
      this.resize();

      // Start render loop
      this.startRenderLoop();

      console.log("ViewportController: Three.js initialized");
    } catch (error) {
      console.error("Failed to initialize Three.js viewport:", error);
    }
  }

  bindControls() {
    // Lit/Unlit buttons
    const litBtn = document.getElementById("viewport-lit-btn");
    const unlitBtn = document.getElementById("viewport-unlit-btn");

    litBtn?.addEventListener("click", () => {
      this.isLit = true;
      litBtn.classList.add("active");
      unlitBtn?.classList.remove("active");
      this.updateLighting();
    });

    unlitBtn?.addEventListener("click", () => {
      this.isLit = false;
      unlitBtn.classList.add("active");
      litBtn?.classList.remove("active");
      this.updateLighting();
    });

    // Mesh select
    const meshSelect = document.getElementById("viewport-mesh-select");
    meshSelect?.addEventListener("change", (e) => {
      this.setGeometry(e.target.value);
    });
  }

  updateLighting() {
    if (!this.initialized) return;

    if (this.isLit) {
      this.directionalLight.intensity = 3;
      this.ambientLight.intensity = 0.5;
    } else {
      // Unlit mode - flat lighting
      this.directionalLight.intensity = 0;
      this.ambientLight.intensity = 2;
    }
  }

  setGeometry(type) {
    if (!this.initialized || !this.geometries[type]) return;

    this.currentGeoType = type;
    this.scene.remove(this.mesh);
    this.mesh = new this.THREE.Mesh(this.geometries[type], this.material);
    this.mesh.position.y = type === "plane" ? 1.5 : 1;
    if (type === "plane") {
      this.mesh.rotation.x = -Math.PI / 2;
    } else {
      this.mesh.rotation.x = 0;
    }
    this.scene.add(this.mesh);
  }

  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
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

    const THREE = this.THREE;

    if (result.baseColor) {
      if (Array.isArray(result.baseColor)) {
        this.material.color.setRGB(
          result.baseColor[0],
          result.baseColor[1],
          result.baseColor[2]
        );
      } else if (typeof result.baseColor === "object") {
        this.material.color.setRGB(
          result.baseColor.r || 0,
          result.baseColor.g || 0,
          result.baseColor.b || 0
        );
      }
    } else {
      this.material.color.setRGB(0.5, 0.5, 0.5);
    }

    this.material.metalness = result.metallic ?? 0;
    this.material.roughness = result.roughness ?? 0.5;

    if (result.emissive) {
      if (Array.isArray(result.emissive)) {
        this.material.emissive.setRGB(
          result.emissive[0],
          result.emissive[1],
          result.emissive[2]
        );
      } else {
        this.material.emissive.setHex(0x000000);
      }
    } else {
      this.material.emissive.setHex(0x000000);
    }

    // Handle base color texture
    if (result.baseColorTexture) {
      this.loadTexture(result.baseColorTexture, (texture) => {
        this.material.map = texture;
        this.material.color.setRGB(1, 1, 1); // Reset color when using texture
        this.material.needsUpdate = true;
      });
    } else {
      // Clear texture if no texture connected
      if (this.material.map) {
        this.material.map = null;
      }
    }

    this.material.needsUpdate = true;
  }

  /**
   * Load a texture from URL/data URL with caching
   */
  loadTexture(url, callback) {
    if (!url || !this.initialized) return;

    // Cache textures to avoid reloading
    if (!this.textureCache) {
      this.textureCache = new Map();
    }

    if (this.textureCache.has(url)) {
      callback(this.textureCache.get(url));
      return;
    }

    const loader = new this.THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.wrapS = this.THREE.RepeatWrapping;
        texture.wrapT = this.THREE.RepeatWrapping;
        this.textureCache.set(url, texture);
        callback(texture);
      },
      undefined,
      (error) => {
        console.warn("Failed to load texture:", error);
      }
    );
  }
}

