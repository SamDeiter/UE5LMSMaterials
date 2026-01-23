/**
 * TextureManager.js
 *
 * Handles loading, managing, and generating textures for the Material Editor.
 * Extracted from material-app.js for modularity.
 */

export class TextureManager {
  constructor() {
    this.textures = new Map(); // id -> { name, dataUrl, image }
    this.defaultTextures = [
      {
        id: "checkerboard",
        name: "Checkerboard",
        generator: this.generateCheckerboard.bind(this),
      },
      { id: "noise", name: "Noise", generator: this.generateNoise.bind(this) },
      {
        id: "gradient",
        name: "Gradient (V)",
        generator: this.generateGradient.bind(this),
      },
      {
        id: "normal_flat",
        name: "Flat Normal",
        generator: this.generateFlatNormal.bind(this),
      },
      // PBR Test Textures
      {
        id: "albedo_test",
        name: "Albedo (Test)",
        generator: this.generateAlbedoTest.bind(this),
      },
      {
        id: "roughness_test",
        name: "Roughness (Test)",
        generator: this.generateRoughnessTest.bind(this),
      },
      {
        id: "metallic_test",
        name: "Metallic (Test)",
        generator: this.generateMetallicTest.bind(this),
      },
      {
        id: "normal_test",
        name: "Normal (Test)",
        generator: this.generateNormalTest.bind(this),
      },
      {
        id: "sss_test",
        name: "SSS (Test)",
        generator: this.generateSSSTest.bind(this),
      },
      {
        id: "ao_test",
        name: "Ambient Occlusion (Test)",
        generator: this.generateAOTest.bind(this),
      },
      {
        id: "emissive_test",
        name: "Emissive (Test)",
        generator: this.generateEmissiveTest.bind(this),
      },
      {
        id: "brick_albedo",
        name: "Brick Albedo",
        generator: this.generateBrickAlbedo.bind(this),
      },
      {
        id: "brick_normal",
        name: "Brick Normal",
        generator: this.generateBrickNormal.bind(this),
      },
      {
        id: "brick_roughness",
        name: "Brick Roughness",
        generator: this.generateBrickRoughness.bind(this),
      },
      {
        id: "brick_metallic",
        name: "Brick Metallic (Mixed)",
        generator: this.generateBrickMetallic.bind(this),
      },
      {
        id: "brick_ao",
        name: "Brick AO",
        generator: this.generateBrickAO.bind(this),
      },
    ];
    if (typeof document !== "undefined") {
      this.initDefaultTextures();
    }
  }

  /**
   * Initialize built-in default textures
   */
  initDefaultTextures() {
    // Load generated textures
    this.defaultTextures.forEach(({ id, name, generator }) => {
      const dataUrl = generator(256, 256);
      const img = new Image();
      img.src = dataUrl;
      this.textures.set(id, { name, dataUrl, image: img, isDefault: true });
    });

    // Load file-based default textures
    const fileTextures = [
      {
        id: "base_texture",
        name: "Base Texture",
        path: "assets/T_Base_Texture_00.png",
      },
      {
        id: "normal_brick",
        name: "Brick Normal Map",
        path: "assets/normal_map_brick.png",
      },
    ];

    fileTextures.forEach(({ id, name, path }) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Create canvas to get dataUrl
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        this.textures.set(id, { name, dataUrl, image: img, isDefault: true });
      };
      img.src = path;
    });
  }

  /**
   * Load texture from file
   * @returns {Promise<{id: string, name: string, dataUrl: string}>}
   */
  loadFromFile() {
    if (typeof document === "undefined") return Promise.reject("Document not available");
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png, image/jpeg, image/webp, image/gif";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }
        this.processFile(file).then(resolve).catch(reject);
      };
      input.click();
    });
  }

  /**
   * Process an uploaded file
   */
  processFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const id = `tex_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

        const img = new Image();
        img.onload = () => {
          this.textures.set(id, {
            name,
            dataUrl,
            image: img,
            isDefault: false,
          });
          resolve({ id, name, dataUrl, width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load texture from URL
   */
  async loadFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL("image/png");
        const id = `tex_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const name =
          url
            .split("/")
            .pop()
            .replace(/\.[^/.]+$/, "") || "Loaded Texture";

        this.textures.set(id, { name, dataUrl, image: img, isDefault: false });
        resolve({ id, name, dataUrl, width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error("Failed to load image from URL"));
      img.src = url;
    });
  }

  /**
   * Get a texture by ID
   */
  get(id) {
    return this.textures.get(id);
  }

  /**
   * Get all available textures
   */
  getAll() {
    return Array.from(this.textures.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  /**
   * Remove a texture
   */
  remove(id) {
    const tex = this.textures.get(id);
    if (tex && !tex.isDefault) {
      this.textures.delete(id);
      return true;
    }
    return false;
  }

  // =========================================================================
  // PROCEDURAL TEXTURE GENERATORS
  // =========================================================================
  generateCheckerboard(width, height, checkSize = 32) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    for (let y = 0; y < height; y += checkSize) {
      for (let x = 0; x < width; x += checkSize) {
        const isWhite = (x / checkSize + y / checkSize) % 2 === 0;
        ctx.fillStyle = isWhite ? "#ffffff" : "#808080";
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }
    return canvas.toDataURL("image/png");
  }

  generateNoise(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  generateGradient(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(1, "#ffffff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png");
  }

  generateFlatNormal(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    // Flat normal = (0.5, 0.5, 1.0) in RGB = points straight up
    ctx.fillStyle = "#8080FF";
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png");
  }

  // =========================================================================
  // ALIGNED PBR BRICK GENERATORS
  // =========================================================================
  
  /**
   * Universal brick parameters for alignment
   */
  getBrickParams() {
    return {
      brickWidth: 64,
      brickHeight: 32,
      mortarWidth: 4,
      rows: 8, // for 256x256
      cols: 4  // for 256x256
    };
  }

  generateBrickAlbedo(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const { brickWidth, brickHeight, mortarWidth } = this.getBrickParams();
    
    ctx.fillStyle = "#3D3D3D"; // Mortar
    ctx.fillRect(0, 0, width, height);
    
    for (let row = 0; row < height / brickHeight; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < width / brickWidth + 1; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        
        ctx.fillStyle = "#A34A33"; // Classic Brick Red
        ctx.fillRect(x + mortarWidth / 2, y + mortarWidth / 2, brickWidth - mortarWidth, brickHeight - mortarWidth);
      }
    }
    return canvas.toDataURL("image/png");
  }

  generateBrickNormal(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const { brickWidth, brickHeight, mortarWidth } = this.getBrickParams();
    
    // Flat normal base (0x8080FF)
    ctx.fillStyle = "#8080FF";
    ctx.fillRect(0, 0, width, height);
    
    for (let row = 0; row < height / brickHeight; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < width / brickWidth + 1; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        
        // Simple bevel effect for normal map
        // Top edge: more green (up), Bottom: less green (down)
        // Left: more red (right), Right: less red (left)
        
        const bx = x + mortarWidth / 2;
        const by = y + mortarWidth / 2;
        const bw = brickWidth - mortarWidth;
        const bh = brickHeight - mortarWidth;

        ctx.fillStyle = "#8080FF"; // Center is flat
        ctx.fillRect(bx, by, bw, bh);

        // Bevels
        ctx.fillStyle = "#80A0FF"; // Top (Y+)
        ctx.fillRect(bx, by, bw, 2);
        ctx.fillStyle = "#8060FF"; // Bottom (Y-)
        ctx.fillRect(bx, by + bh - 2, bw, 2);
        ctx.fillStyle = "#A080FF"; // Left (X+)
        ctx.fillRect(bx, by, 2, bh);
        ctx.fillStyle = "#6080FF"; // Right (X-)
        ctx.fillRect(bx + bw - 2, by, 2, bh);
      }
    }
    return canvas.toDataURL("image/png");
  }

  generateBrickRoughness(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const { brickWidth, brickHeight, mortarWidth } = this.getBrickParams();
    
    ctx.fillStyle = "#E0E0E0"; // Rough mortar
    ctx.fillRect(0, 0, width, height);
    
    for (let row = 0; row < height / brickHeight; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < width / brickWidth + 1; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        
        ctx.fillStyle = "#606060"; // Smoother brick
        ctx.fillRect(x + mortarWidth / 2, y + mortarWidth / 2, brickWidth - mortarWidth, brickHeight - mortarWidth);
      }
    }
    return canvas.toDataURL("image/png");
  }

  generateBrickMetallic(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const { brickWidth, brickHeight, mortarWidth } = this.getBrickParams();
    
    ctx.fillStyle = "#000000"; // Non-metallic
    ctx.fillRect(0, 0, width, height);
    
    for (let row = 0; row < height / brickHeight; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < width / brickWidth + 1; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        
        // Make every 5th brick metallic as requested ("metal in it")
        if ((row * 7 + col) % 5 === 0) {
          ctx.fillStyle = "#FFFFFF"; // Full metallic
          ctx.fillRect(x + mortarWidth / 2, y + mortarWidth / 2, brickWidth - mortarWidth, brickHeight - mortarWidth);
        }
      }
    }
    return canvas.toDataURL("image/png");
  }

  generateBrickAO(width, height) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const { brickWidth, brickHeight, mortarWidth } = this.getBrickParams();
    
    ctx.fillStyle = "#FFFFFF"; // Fully lit
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = "#404040"; // Dark mortar (occluded)
    for (let row = 0; row < height / brickHeight; row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < width / brickWidth + 1; col++) {
        // Draw slightly larger mortar lines
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        ctx.fillRect(x, y, brickWidth, mortarWidth);
        ctx.fillRect(x, y, mortarWidth, brickHeight);
      }
    }
    return canvas.toDataURL("image/png");
  }

  // =========================================================================
  // OLD PBR TEST TEXTURE GENERATORS (BACKUP)
  // =========================================================================
  
  /**
   * Generate an albedo/base color test texture
   * Creates a brick-like pattern with varied colors
   */
  generateAlbedoTest(width, height) { return this.generateBrickAlbedo(width, height); }
  generateRoughnessTest(width, height) { return this.generateBrickRoughness(width, height); }
  generateMetallicTest(width, height) { return this.generateBrickMetallic(width, height); }
  generateNormalTest(width, height) { return this.generateBrickNormal(width, height); }
  generateAOTest(width, height) { return this.generateBrickAO(width, height); }
  
  generateSSSTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#FF6B4A");
    gradient.addColorStop(1, "#FFE4D0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png");
  }

  generateEmissiveTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 10;
    ctx.strokeRect(50, 50, 156, 156);
    return canvas.toDataURL("image/png");
  }
}

// Create singleton instance
export const textureManager = new TextureManager();
