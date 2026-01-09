/**
 * Material Studio - Preview Renderer
 * Three.js-based 3D material preview with lazy loading.
 */

import { CONFIG } from "./config.js";

/**
 * PreviewRenderer - Manages the 3D preview scene
 */
export class PreviewRenderer {
  constructor(container) {
    this.container = container;
    this.initialized = false;
    this.animationId = null;

    // Three.js objects (loaded lazily)
    this.THREE = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mesh = null;
    this.material = null;
    this.geometries = {};
    this.textures = {};

    // Current geometry type
    this.currentGeo = "sphere";
  }

  /**
   * Initialize the renderer (lazy load Three.js)
   */
  async init() {
    if (this.initialized) return;

    try {
      // Dynamic import of Three.js (uses import map from HTML)
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
      this.camera = new THREE.PerspectiveCamera(
        45,
        CONFIG.PREVIEW.WIDTH / CONFIG.PREVIEW.HEIGHT,
        0.1,
        100
      );
      this.camera.position.set(2.5, 2, 4);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(CONFIG.PREVIEW.WIDTH, CONFIG.PREVIEW.HEIGHT);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.container.appendChild(this.renderer.domElement);

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;

      // Lighting
      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(3, 10, 5);
      this.scene.add(dirLight);

      const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambLight);

      // Create geometries
      this.geometries = {
        sphere: new THREE.SphereGeometry(1, 64, 64),
        cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
        cylinder: new THREE.CylinderGeometry(1, 1, 2, 32),
        plane: new THREE.PlaneGeometry(3, 3),
      };

      // Create procedural textures
      this.textures = {
        checker: this.createCheckerTexture(),
        noise: this.createNoiseTexture(),
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

      // Start render loop
      this.startRenderLoop();
    } catch (error) {
      console.error("Failed to initialize Three.js preview:", error);
    }
  }

  /**
   * Create checkerboard texture
   */
  createCheckerTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ccc";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#444";
    for (let y = 0; y < 64; y += 8) {
      for (let x = 0; x < 64; x += 8) {
        if ((x / 8 + y / 8) % 2 === 0) {
          ctx.fillRect(x, y, 8, 8);
        }
      }
    }
    const tex = new this.THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = this.THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Create noise texture
   */
  createNoiseTexture() {
    const data = new Uint8Array(64 * 64 * 4);
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    const tex = new this.THREE.DataTexture(data, 64, 64, this.THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = this.THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Create texture from Image
   */
  createTextureFromImage(image) {
    const tex = new this.THREE.Texture(image);
    tex.wrapS = tex.wrapT = this.THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update geometry type
   */
  setGeometry(type) {
    if (!this.initialized || !this.geometries[type]) return;

    this.currentGeo = type;
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

  /**
   * Update material from graph evaluation result
   */
  updateMaterial(result) {
    if (!this.initialized || !result) return;

    const THREE = this.THREE;

    if (result.mode === "substrate") {
      // Substrate mode
      if (result.diffuse) {
        this.setColorFromVec(this.material.color, result.diffuse);
      }

      this.material.roughness = result.roughness ?? 0.5;

      if (result.f0) {
        this.setColorFromVec(this.material.specularColor, result.f0);
      }

      this.material.anisotropy = result.anisotropy ?? 0;

      if (result.emissive) {
        this.setColorFromVec(this.material.emissive, result.emissive);
      }

      this.material.metalness = 0;
    } else {
      // Legacy mode
      if (result.baseColor) {
        this.setColorFromVec(this.material.color, result.baseColor);
      } else {
        this.material.color.setRGB(0.5, 0.5, 0.5);
      }

      this.material.metalness = result.metallic ?? 0;
      this.material.roughness = result.roughness ?? 0.5;
      this.material.specularIntensity = result.specular ?? 0.5;
      this.material.specularColor.setHex(0xffffff);

      if (result.emissive) {
        this.setColorFromVec(this.material.emissive, result.emissive);
      } else {
        this.material.emissive.setHex(0x000000);
      }

      this.material.anisotropy = 0;
    }

    // Handle texture
    if (result.texture) {
      if (result.texture.type === "custom" && result.texture.customImage) {
        this.material.map = this.createTextureFromImage(
          result.texture.customImage
        );
      } else if (result.texture.type && this.textures[result.texture.type]) {
        this.material.map = this.textures[result.texture.type];
      } else {
        this.material.map = null;
      }
    } else {
      this.material.map = null;
    }

    this.material.needsUpdate = true;
  }

  /**
   * Set Three.js Color from Vec3
   */
  setColorFromVec(color, vec) {
    if (vec && vec.isVector3) {
      color.setRGB(vec.x, vec.y, vec.z);
    } else if (vec && typeof vec === "object" && "x" in vec) {
      color.setRGB(vec.x, vec.y, vec.z);
    } else if (typeof vec === "string") {
      color.set(vec);
    }
  }

  /**
   * Resize renderer
   */
  resize(width, height) {
    if (!this.initialized) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.stopRenderLoop();

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }

    Object.values(this.geometries).forEach((geo) => geo.dispose());
    Object.values(this.textures).forEach((tex) => tex.dispose());
  }
}

export default PreviewRenderer;
