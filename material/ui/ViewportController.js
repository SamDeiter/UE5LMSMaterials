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
    this.currentGeoType = "sphere";

    // View mode: 'lit', 'unlit', 'wireframe'
    this.viewMode = 'lit';
    
    // Realtime rendering toggle
    this.isRealtime = true;
    this.needsRender = true;
    
    // Show flags
    this.gridVisible = true;
    this.gridHelper = null;
    this.floorVisible = false;
    this.floorPlane = null;
    
    // Tone mapping toggle
    this.toneMappingEnabled = true;
    this.exposure = 0; // EV value (-3 to +3)
    
    // Environment preset
    this.currentEnvironment = 'studio';

    // Lights
    this.ambientLight = null;
    this.directionalLight = null;
    
    // Store original material for wireframe toggle
    this.originalMaterial = null;
    this.wireframeMaterial = null;

    // WASD navigation state
    this.keysPressed = {};
    this.moveSpeed = 0.05;

    // Initialize Three.js
    this.init();

    // Bind UI controls
    this.bindControls();
    
    // Bind keyboard controls
    this.bindKeyboardControls();
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

      // Grid helper (store reference for visibility toggle)
      this.gridHelper = new THREE.GridHelper(10, 10, 0x333333, 0x111111);
      this.scene.add(this.gridHelper);

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

      // Lighting - single directional light for clean appearance
      this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      this.directionalLight.position.set(3, 10, 5);
      this.scene.add(this.directionalLight);

      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
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
        envMapIntensity: 0.5, // Reduced to prevent color washout
        specularIntensity: 0.5, // UE5 default specular = 0.5
        specularColor: new THREE.Color(0xffffff),
        reflectivity: 0.5,
        ior: 1.5,
      });
      this.originalMaterial = this.material;
      
      // Create wireframe material for wireframe view mode
      this.wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        side: THREE.DoubleSide,
      });

      // Create unlit material for Unlit shading model
      this.unlitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });

      // Track current shading model
      this.currentShadingModel = "DefaultLit";

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
      this.setEnvironment(e.target.value);
    });

    // Floor toggle
    const floorBtn = document.getElementById("viewport-floor-btn");
    floorBtn?.addEventListener("click", () => {
      this.toggleFloor();
      floorBtn.classList.toggle("active", this.floorVisible);
    });

    // Exposure slider
    const exposureSlider = document.getElementById("viewport-exposure");
    exposureSlider?.addEventListener("input", (e) => {
      this.setExposure(parseFloat(e.target.value));
    });

    // Light rotation controls (Shift + mouse drag)
    this.isLightDragging = false;
    this.lightAngleX = 0.3; // Initial angle (radians)
    this.lightAngleY = 0.8;
    this.lightDistance = 12;

    this.canvas?.addEventListener("mousedown", (e) => {
      if (e.shiftKey) {
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
        this.needsRender = true;
      }
      // Mark for render on any mouse movement (for non-realtime mode)
      if (!this.isRealtime) {
        this.needsRender = true;
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
  }

  updateLightPosition() {
    if (!this.directionalLight) return;
    
    const x = Math.cos(this.lightAngleX) * Math.cos(this.lightAngleY) * this.lightDistance;
    const y = Math.sin(this.lightAngleY) * this.lightDistance;
    const z = Math.sin(this.lightAngleX) * Math.cos(this.lightAngleY) * this.lightDistance;
    
    this.directionalLight.position.set(x, y, z);
  }

  /**
   * Bind keyboard controls for WASD navigation
   */
  bindKeyboardControls() {
    // Make canvas focusable
    this.canvas.tabIndex = 0;
    
    this.canvas?.addEventListener("keydown", (e) => {
      this.keysPressed[e.key.toLowerCase()] = true;
    });
    
    this.canvas?.addEventListener("keyup", (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
    
    // Clear keys when canvas loses focus
    this.canvas?.addEventListener("blur", () => {
      this.keysPressed = {};
    });
  }

  /**
   * Update camera position based on pressed keys
   * Called during the render loop
   */
  updateCameraFromKeys() {
    if (!this.camera || Object.keys(this.keysPressed).length === 0) return;
    
    const forward = new this.THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0; // Keep movement horizontal
    forward.normalize();
    
    const right = new this.THREE.Vector3();
    right.crossVectors(forward, new this.THREE.Vector3(0, 1, 0)).normalize();
    
    let moved = false;
    
    // W - Forward
    if (this.keysPressed['w']) {
      this.camera.position.addScaledVector(forward, this.moveSpeed);
      this.controls.target.addScaledVector(forward, this.moveSpeed);
      moved = true;
    }
    // S - Backward
    if (this.keysPressed['s']) {
      this.camera.position.addScaledVector(forward, -this.moveSpeed);
      this.controls.target.addScaledVector(forward, -this.moveSpeed);
      moved = true;
    }
    // A - Left
    if (this.keysPressed['a']) {
      this.camera.position.addScaledVector(right, -this.moveSpeed);
      this.controls.target.addScaledVector(right, -this.moveSpeed);
      moved = true;
    }
    // D - Right
    if (this.keysPressed['d']) {
      this.camera.position.addScaledVector(right, this.moveSpeed);
      this.controls.target.addScaledVector(right, this.moveSpeed);
      moved = true;
    }
    // Q - Down
    if (this.keysPressed['q']) {
      this.camera.position.y -= this.moveSpeed;
      this.controls.target.y -= this.moveSpeed;
      moved = true;
    }
    // E - Up
    if (this.keysPressed['e']) {
      this.camera.position.y += this.moveSpeed;
      this.controls.target.y += this.moveSpeed;
      moved = true;
    }
    
    if (moved) {
      this.needsRender = true;
    }
  }

  /**
   * Set the view mode: 'lit', 'unlit', or 'wireframe'
   */
  setViewMode(mode) {
    if (!this.initialized) return;
    
    this.viewMode = mode;
    
    switch (mode) {
      case 'lit':
        this.directionalLight.intensity = 3;
        this.ambientLight.intensity = 0.5;
        this.mesh.material = this.originalMaterial;
        break;
        
      case 'unlit':
        this.directionalLight.intensity = 0;
        this.ambientLight.intensity = 2;
        this.mesh.material = this.originalMaterial;
        break;
        
      case 'wireframe':
        this.directionalLight.intensity = 0;
        this.ambientLight.intensity = 2;
        this.mesh.material = this.wireframeMaterial;
        break;
    }
    
    this.needsRender = true;
  }

  /**
   * Set camera field of view (30-90 degrees)
   */
  setFOV(degrees) {
    if (!this.initialized || !this.camera) return;
    
    this.camera.fov = degrees;
    this.camera.updateProjectionMatrix();
    this.needsRender = true;
  }

  /**
   * Toggle grid visibility
   */
  toggleGrid() {
    if (!this.initialized || !this.gridHelper) return;
    
    this.gridVisible = !this.gridVisible;
    this.gridHelper.visible = this.gridVisible;
    this.needsRender = true;
  }

  /**
   * Toggle tone mapping (ACES Filmic vs None)
   */
  toggleToneMapping() {
    if (!this.initialized || !this.renderer) return;
    
    this.toneMappingEnabled = !this.toneMappingEnabled;
    this.renderer.toneMapping = this.toneMappingEnabled 
      ? this.THREE.ACESFilmicToneMapping 
      : this.THREE.NoToneMapping;
    this.needsRender = true;
  }

  /**
   * Set exposure (EV value from -3 to +3)
   */
  setExposure(ev) {
    if (!this.initialized || !this.renderer) return;
    
    this.exposure = ev;
    // Convert EV to exposure multiplier: 2^EV
    this.renderer.toneMappingExposure = Math.pow(2, ev);
    this.needsRender = true;
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
    if (!this.initialized || !this.geometries[type]) return;

    this.currentGeoType = type;
    this.scene.remove(this.mesh);
    
    // Use current material based on view mode
    const materialToUse = this.viewMode === 'wireframe' 
      ? this.wireframeMaterial 
      : this.originalMaterial;
    
    this.mesh = new this.THREE.Mesh(this.geometries[type], materialToUse);
    this.mesh.position.y = type === "plane" ? 1.5 : 1;
    if (type === "plane") {
      this.mesh.rotation.x = -Math.PI / 2;
    } else {
      this.mesh.rotation.x = 0;
    }
    this.scene.add(this.mesh);
    this.needsRender = true;
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
      const uTiling = result.baseColorUTiling ?? 1;
      const vTiling = result.baseColorVTiling ?? 1;
      this.loadTexture(result.baseColorTexture, (texture) => {
        // Apply UV tiling from TextureCoordinate node
        texture.repeat.set(uTiling, vTiling);
        this.material.map = texture;
        this.material.color.setRGB(1, 1, 1); // Reset color when using texture
        this.material.needsUpdate = true;
        this.needsRender = true;
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

    // Handle normal map texture
    if (result.normalTexture) {
      this.loadTexture(result.normalTexture, (texture) => {
        // Note: Three.js expects normal maps in tangent space
        this.material.normalMap = texture;
        this.material.normalScale = new this.THREE.Vector2(1, 1);
        this.material.needsUpdate = true;
        this.needsRender = true;
      });
    } else {
      if (this.material.normalMap) {
        this.material.normalMap = null;
        this.material.needsUpdate = true;
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

