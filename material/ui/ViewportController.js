/**
 * ViewportController.js
 * 
 * Manages the 3D viewport with Three.js for material preview.
 * Extracted from material-app.js for modularity.
 */

import { debounce } from '../../shared/utils.js';

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

      // Lighting - enhanced for better roughness visibility
      this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      this.directionalLight.position.set(3, 10, 5);
      this.scene.add(this.directionalLight);

      // Add a second light for rim lighting
      const rimLight = new THREE.DirectionalLight(0xaaccff, 1.0);
      rimLight.position.set(-3, 5, -5);
      this.scene.add(rimLight);

      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
      this.scene.add(this.ambientLight);

      // Create procedural environment map for PBR reflections  
      // Using high contrast for clear roughness visualization
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      
      // Create a studio-style environment with distinct bright/dark areas
      const envScene = new THREE.Scene();
      const envGeo = new THREE.SphereGeometry(50, 32, 32);
      const envMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {},
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec3 dir = normalize(vWorldPosition);
            float y = dir.y;
            float x = dir.x;
            
            // Studio lighting setup - bright top area, dark sides
            vec3 topColor = vec3(2.0, 1.9, 1.8);      // Bright warm top light
            vec3 bottomColor = vec3(0.05, 0.05, 0.08); // Dark floor
            vec3 sideColor = vec3(0.1, 0.12, 0.15);    // Dark gray sides
            
            // Create distinct light source regions
            float topLight = smoothstep(0.3, 0.9, y);
            float rimLight = smoothstep(0.6, 1.0, abs(x)) * step(0.0, y) * 0.5;
            
            vec3 color = mix(sideColor, topColor, topLight);
            color = mix(color, bottomColor, smoothstep(-0.2, -0.8, y));
            color += vec3(0.8, 0.9, 1.0) * rimLight; // Blue rim
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
      const envMesh = new THREE.Mesh(envGeo, envMat);
      envScene.add(envMesh);
      
      this.envMap = pmremGenerator.fromScene(envScene, 0, 0.1, 1000).texture;
      this.scene.environment = this.envMap;
      pmremGenerator.dispose();

      // Create geometries
      this.geometries = {
        sphere: new THREE.SphereGeometry(1, 64, 64),
        cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
        cylinder: new THREE.CylinderGeometry(1, 1, 2, 32),
        plane: new THREE.PlaneGeometry(3, 3),
      };

      // Create material with proper PBR settings matching UE5 defaults
      this.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // Default white to match UE5
        metalness: 0,
        roughness: 0.5,
        side: THREE.DoubleSide,
        envMapIntensity: 1.5, // Boost environment reflections
        specularIntensity: 0.5, // UE5 default specular = 0.5
        specularColor: new THREE.Color(0xffffff),
        reflectivity: 0.5, // Matches UE5 specular default
        ior: 1.5, // Standard glass IOR
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

    // Light rotation controls (L + mouse drag)
    this.isLightDragging = false;
    this.lightAngleX = 0.3; // Initial angle (radians)
    this.lightAngleY = 0.8;
    this.lightDistance = 12;

    this.canvas?.addEventListener("mousedown", (e) => {
      if (e.shiftKey || this.isLKeyDown) {
        this.isLightDragging = true;
        this.controls.enabled = false;
        e.preventDefault();
      }
    });

    this.canvas?.addEventListener("mousemove", (e) => {
      if (this.isLightDragging) {
        this.lightAngleX += e.movementX * 0.01;
        this.lightAngleY = Math.max(-1.5, Math.min(1.5, this.lightAngleY - e.movementY * 0.01));
        this.updateLightPosition();
      }
    });

    this.canvas?.addEventListener("mouseup", () => {
      if (this.isLightDragging) {
        this.isLightDragging = false;
        this.controls.enabled = true;
      }
    });

    this.canvas?.addEventListener("mouseleave", () => {
      if (this.isLightDragging) {
        this.isLightDragging = false;
        this.controls.enabled = true;
      }
    });

    // Track L key state
    this.isLKeyDown = false;
    document.addEventListener("keydown", (e) => {
      if (e.key === "l" || e.key === "L") {
        this.isLKeyDown = true;
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.key === "l" || e.key === "L") {
        this.isLKeyDown = false;
      }
    });
  }

  updateLightPosition() {
    if (!this.directionalLight) return;
    
    const x = Math.cos(this.lightAngleX) * Math.cos(this.lightAngleY) * this.lightDistance;
    const y = Math.sin(this.lightAngleY) * this.lightDistance;
    const z = Math.sin(this.lightAngleX) * Math.cos(this.lightAngleY) * this.lightDistance;
    
    this.directionalLight.position.set(x, y, z);
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
      this.material.color.setRGB(1, 1, 1); // Default white
    }

    // Use slight metalness if nothing connected to make roughness more visible
    this.material.metalness = result.metallic ?? 0.3;
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

    // Handle opacity/transparency
    if (result.opacity !== undefined && result.opacity < 1.0) {
      this.material.transparent = true;
      this.material.opacity = result.opacity;
    } else {
      this.material.transparent = false;
      this.material.opacity = 1.0;
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

    // Handle roughness texture
    if (result.roughnessTexture) {
      this.loadTexture(result.roughnessTexture, (texture) => {
        this.material.roughnessMap = texture;
        this.material.roughness = 1.0; // Use full range with texture
        this.material.needsUpdate = true;
      });
    } else {
      if (this.material.roughnessMap) {
        this.material.roughnessMap = null;
      }
    }

    // Handle metallic texture
    if (result.metallicTexture) {
      this.loadTexture(result.metallicTexture, (texture) => {
        this.material.metalnessMap = texture;
        this.material.metalness = 1.0; // Use full range with texture
        this.material.needsUpdate = true;
      });
    } else {
      if (this.material.metalnessMap) {
        this.material.metalnessMap = null;
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

