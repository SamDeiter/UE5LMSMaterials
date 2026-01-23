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

  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      if (this.controls) this.controls.update();
      if (this.renderer && (this.needsRender || this.isRealtime)) {
        this.renderer.render(this.scene, this.camera);
        this.needsRender = false;
      }
    };
    animate();
  }

  resize() {
    if (!this.initialized) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.needsRender = true;
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
}
