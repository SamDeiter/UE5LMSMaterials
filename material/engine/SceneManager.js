/**
 * SceneManager.js
 * 
 * Manages the Three.js scene, camera, renderer, and lighting.
 * Extracted from ViewportController.js for modularity.
 */

export class SceneManager {
  constructor(canvas, container) {
    this.canvas = canvas;
    this.container = container;
    
    this.THREE = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    this.mesh = null;
    this.material = null;
    this.geometries = {};
    this.envMap = null;
    
    this.initialized = false;
    this.animationId = null;
    this.needsRender = true;
    
    // Default Materials
    this.originalMaterial = null;
    this.wireframeMaterial = null;
    this.unlitMaterial = null;

    // Post-processing
    this.composer = null;
    this.bloomPass = null;
    this.postProcessingEnabled = true;
    this.bloomSettings = {
      strength: 0.5,    // Bloom intensity (UE5 default ~0.5)
      radius: 0.4,      // Bloom falloff radius
      threshold: 0.8    // HDR threshold for bloom (values > this glow)
    };
  }

  async init() {
    try {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      this.THREE = THREE;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a0a0a);

      // Grid helper
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
      this.renderer.setSize(this.canvas.clientWidth || 300, this.canvas.clientHeight || 300);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace; // sRGB gamma correction

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.target.set(0, 1, 0);

      // Lighting
      this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      this.directionalLight.position.set(3, 10, 5);
      this.scene.add(this.directionalLight);

      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      this.scene.add(this.ambientLight);

      // Environment
      await this.setupEnvironment();

      // Geometries
      this.geometries = {
        sphere: new THREE.SphereGeometry(1, 64, 64),
        cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
        cylinder: new THREE.CylinderGeometry(1, 1, 2, 32),
        plane: new THREE.PlaneGeometry(3, 3),
      };

      // Materials
      this.setupMaterials();

      // Initial Mesh
      this.mesh = new THREE.Mesh(this.geometries.sphere, this.material);
      this.mesh.position.y = 1;
      this.scene.add(this.mesh);

      // Setup post-processing
      await this.setupPostProcessing();

      this.initialized = true;
      this.startRenderLoop();
    } catch (e) {
      console.error("SceneManager init failed:", e);
    }
  }

  async setupEnvironment() {
    const THREE = this.THREE;
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    const envScene = new THREE.Scene();
    const envGeo = new THREE.SphereGeometry(50, 32, 32);
    const envMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
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
      `
    });
    envScene.add(new THREE.Mesh(envGeo, envMat));
    this.envMap = pmremGenerator.fromScene(envScene, 0, 0.1, 1000).texture;
    this.scene.environment = this.envMap;
    pmremGenerator.dispose();
  }

  setupMaterials() {
    const THREE = this.THREE;
    this.material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.5,
      side: THREE.DoubleSide,
      envMapIntensity: 0.5,
      specularIntensity: 0.5,
      reflectivity: 0.5,
      ior: 1.5,
    });
    this.originalMaterial = this.material;
    
    this.wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      side: THREE.DoubleSide,
    });

    this.unlitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Setup post-processing effects matching UE5 Material Editor preview
   * - Bloom: Glow for emissive/HDR bright areas
   * - Vignette: Edge darkening
   * - Film Grain: Subtle noise
   */
  async setupPostProcessing() {
    try {
      const THREE = this.THREE;
      
      // Import post-processing modules
      const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
      const { ShaderPass } = await import('three/addons/postprocessing/ShaderPass.js');
      const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');

      // Create composer
      this.composer = new EffectComposer(this.renderer);

      // Scene render pass
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      // Bloom pass (for emissive glow - key UE5 feature)
      const resolution = new THREE.Vector2(
        this.canvas.clientWidth || 800,
        this.canvas.clientHeight || 600
      );
      this.bloomPass = new UnrealBloomPass(
        resolution,
        this.bloomSettings.strength,
        this.bloomSettings.radius,
        this.bloomSettings.threshold
      );
      this.composer.addPass(this.bloomPass);

      // Vignette + Film Grain shader pass
      const vignetteFilmGrainShader = {
        uniforms: {
          tDiffuse: { value: null },
          vignetteIntensity: { value: 0.3 },
          vignetteRadius: { value: 0.8 },
          filmGrainIntensity: { value: 0.003 },
          time: { value: 0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float vignetteIntensity;
          uniform float vignetteRadius;
          uniform float filmGrainIntensity;
          uniform float time;
          varying vec2 vUv;
          
          // Simple noise function
          float rand(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Vignette
            vec2 center = vUv - 0.5;
            float dist = length(center);
            float vignette = smoothstep(vignetteRadius, vignetteRadius - 0.3, dist);
            color.rgb *= mix(1.0 - vignetteIntensity, 1.0, vignette);
            
            // Film grain
            float grain = rand(vUv * time) * 2.0 - 1.0;
            color.rgb += grain * filmGrainIntensity;
            
            gl_FragColor = color;
          }
        `
      };
      
      this.vignettePass = new ShaderPass(vignetteFilmGrainShader);
      this.composer.addPass(this.vignettePass);

      // Output pass (for proper color space)
      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);

      console.log('Post-processing initialized: Bloom, Vignette, Film Grain');
    } catch (e) {
      console.warn('Post-processing setup failed, using standard rendering:', e);
      this.postProcessingEnabled = false;
    }
  }

  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      if (this.controls) this.controls.update();

      // Handle keyboard navigation if a controller is providing key state
      if (this.keyStateProvider && this.keyStateProvider.keysPressed) {
        this.updateCameraFromKeys(this.keyStateProvider.keysPressed);
      }

      if (this.renderer && (this.needsRender || this.isRealtime)) {
        // Update film grain time
        if (this.vignettePass) {
          this.vignettePass.uniforms.time.value = performance.now() * 0.001;
        }
        
        // Use post-processing composer or standard renderer
        if (this.postProcessingEnabled && this.composer) {
          this.composer.render();
        } else {
          this.renderer.render(this.scene, this.camera);
        }
        this.needsRender = false;
      }
    };
    animate();
  }

  updateCameraFromKeys(keys) {
    const moveSpeed = 0.05;
    if (keys['w']) this.camera.translateZ(-moveSpeed);
    if (keys['s']) this.camera.translateZ(moveSpeed);
    if (keys['a']) this.camera.translateX(-moveSpeed);
    if (keys['d']) this.camera.translateX(moveSpeed);
    
    if (keys['w'] || keys['s'] || keys['a'] || keys['d']) {
      this.needsRender = true;
    }
  }

  resize() {
    if (!this.initialized || !this.container || !this.renderer) return;
    
    // Get actual dimensions
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    
    // Set pixel ratio for sharp rendering on high-DPI screens
    const pixelRatio = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(pixelRatio);
    
    // Update camera
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    
    // Update renderer
    this.renderer.setSize(width, height, true); // true to update style

    // Update post-processing composer
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
    
    // Update controls if they exist (OrbitControls needs to know new size for interaction)
    if (this.controls && typeof this.controls.handleResize === 'function') {
      this.controls.handleResize();
    }
    
    this.needsRender = true;
  }

  /**
   * Set post-processing mode
   * @param {string} mode - 'all', 'bloom', or 'none'
   */
  setPostProcessing(mode) {
    switch (mode) {
      case 'all':
        this.postProcessingEnabled = true;
        if (this.bloomPass) this.bloomPass.enabled = true;
        if (this.vignettePass) this.vignettePass.enabled = true;
        break;
      case 'bloom':
        this.postProcessingEnabled = true;
        if (this.bloomPass) this.bloomPass.enabled = true;
        if (this.vignettePass) this.vignettePass.enabled = false;
        break;
      case 'none':
        this.postProcessingEnabled = false;
        break;
    }
    this.needsRender = true;
    console.log(`Post-processing mode: ${mode}`);
  }

  setGeometry(type) {
    if (!this.initialized || !this.geometries[type]) return;
    this.scene.remove(this.mesh);
    this.mesh = new this.THREE.Mesh(this.geometries[type], this.mesh.material);
    this.mesh.position.y = type === "plane" ? 1.5 : 1;
    if (type === "plane") this.mesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.mesh);
    this.needsRender = true;
  }

  setViewMode(mode) {
    if (!this.initialized) return;
    switch (mode) {
      case 'lit':
        this.directionalLight.intensity = 2.5;
        this.ambientLight.intensity = 0.2;
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
   * Set environment preset (studio, outdoor, night)
   * Studio preset now uses Epic Courtyard HDRI for authentic UE5 lighting
   */
  async setEnvironment(preset) {
    if (!this.initialized) return;
    
    const THREE = this.THREE;
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Try to load HDRI for studio preset
    if (preset === 'studio') {
      try {
        const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
        const loader = new RGBELoader();
        
        const texture = await new Promise((resolve, reject) => {
          loader.load(
            '/public/HDRI_Epic_Courtyard_Daylight.HDR',
            (tex) => resolve(tex),
            undefined,
            (err) => reject(err)
          );
        });
        
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        if (this.envMap) this.envMap.dispose();
        this.envMap = pmremGenerator.fromEquirectangular(texture).texture;
        this.scene.environment = this.envMap;
        texture.dispose();
        pmremGenerator.dispose();
        this.needsRender = true;
        console.log('Loaded Epic Courtyard HDRI environment');
        return;
      } catch (err) {
        console.warn('Failed to load HDRI, falling back to procedural:', err);
        // Fall through to procedural environment
      }
    }
    
    // Procedural environment fallback
    const envScene = new THREE.Scene();
    const envGeo = new THREE.SphereGeometry(50, 32, 32);
    
    let fragmentShader;
    
    switch (preset) {
      case 'outdoor':
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
            float sunDot = max(0.0, dot(dir, normalize(vec3(0.5, 0.7, 0.3))));
            color += sunColor * pow(sunDot, 64.0);
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      case 'night':
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
            float rim = smoothstep(0.7, 1.0, abs(dir.x)) * step(0.0, y) * 0.1;
            color += vec3(0.1, 0.15, 0.3) * rim;
            gl_FragColor = vec4(color, 1.0);
          }
        `;
        break;
      default: // studio fallback (if HDRI failed)
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
    
    const envMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
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
    
    envScene.add(new THREE.Mesh(envGeo, envMat));
    
    if (this.envMap) this.envMap.dispose();
    this.envMap = pmremGenerator.fromScene(envScene, 0, 0.1, 1000).texture;
    this.scene.environment = this.envMap;
    pmremGenerator.dispose();
    this.needsRender = true;
  }

  toggleFloor() {
    if (!this.initialized) return;
    
    if (!this.floorPlane) {
      const THREE = this.THREE;
      const floorGeo = new THREE.PlaneGeometry(20, 20);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0,
      });
      this.floorPlane = new THREE.Mesh(floorGeo, floorMat);
      this.floorPlane.rotation.x = -Math.PI / 2;
      this.floorPlane.receiveShadow = true;
      this.scene.add(this.floorPlane);
    } else {
      this.floorPlane.visible = !this.floorPlane.visible;
    }
    this.needsRender = true;
  }
}
