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
    ];
    this.initDefaultTextures();
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
  // PBR TEST TEXTURE GENERATORS
  // =========================================================================
  
  /**
   * Generate an albedo/base color test texture
   * Creates a brick-like pattern with varied colors
   */
  generateAlbedoTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    // Base brick color
    const brickWidth = 64;
    const brickHeight = 32;
    const mortarWidth = 4;
    
    // Fill with mortar color
    ctx.fillStyle = "#3D3D3D";
    ctx.fillRect(0, 0, width, height);
    
    // Draw bricks in a staggered pattern
    for (let row = 0; row < Math.ceil(height / brickHeight); row++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let col = -1; col < Math.ceil(width / brickWidth) + 1; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        
        // Vary brick color slightly
        const colorVar = Math.floor(Math.random() * 30) - 15;
        const r = Math.min(255, Math.max(0, 140 + colorVar));
        const g = Math.min(255, Math.max(0, 70 + colorVar));
        const b = Math.min(255, Math.max(0, 50 + colorVar));
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          x + mortarWidth / 2, 
          y + mortarWidth / 2, 
          brickWidth - mortarWidth, 
          brickHeight - mortarWidth
        );
      }
    }
    return canvas.toDataURL("image/png");
  }

  /**
   * Generate a roughness test texture
   * Creates a gradient pattern useful for testing roughness variation
   */
  generateRoughnessTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    // Create a gradient from smooth (black) to rough (white)
    // with some noise for realistic variation
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Base roughness varies by position (creates a visible gradient)
        const baseRoughness = (x / width) * 200 + 28; // 0.1 to 0.9 range
        
        // Add some noise
        const noise = Math.random() * 30 - 15;
        const value = Math.min(255, Math.max(0, baseRoughness + noise));
        
        imageData.data[i] = value;     // R
        imageData.data[i + 1] = value; // G
        imageData.data[i + 2] = value; // B
        imageData.data[i + 3] = 255;   // A
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  /**
   * Generate a metallic test texture
   * Creates a pattern with distinct metallic and non-metallic regions
   */
  generateMetallicTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    // Fill non-metallic base (black)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    
    // Create metallic circles/spots
    const spotCount = 8;
    const spotRadius = width / 6;
    
    for (let i = 0; i < spotCount; i++) {
      const x = ((i % 4) + 0.5) * (width / 4);
      const y = (Math.floor(i / 4) + 0.5) * (height / 2);
      
      // Alternate between full metallic and partial metallic
      const metallic = i % 2 === 0 ? 255 : 180;
      
      // Create radial gradient for soft edges
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, spotRadius);
      gradient.addColorStop(0, `rgb(${metallic}, ${metallic}, ${metallic})`);
      gradient.addColorStop(0.7, `rgb(${metallic}, ${metallic}, ${metallic})`);
      gradient.addColorStop(1, "rgb(0, 0, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, spotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas.toDataURL("image/png");
  }

  /**
   * Generate a normal map test texture
   * Creates a bump pattern that simulates surface detail
   */
  generateNormalTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    
    // Create a heightfield first
    const heights = new Float32Array(width * height);
    
    // Generate some simple sine wave bumps
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const fx = x / width * Math.PI * 4;
        const fy = y / height * Math.PI * 4;
        heights[y * width + x] = 
          Math.sin(fx) * Math.cos(fy) * 0.5 + 
          Math.sin(fx * 2) * Math.sin(fy * 2) * 0.25;
      }
    }
    
    // Convert heightfield to normal map
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Sample neighboring heights for gradient
        const xp = x < width - 1 ? x + 1 : x;
        const xm = x > 0 ? x - 1 : x;
        const yp = y < height - 1 ? y + 1 : y;
        const ym = y > 0 ? y - 1 : y;
        
        const dx = heights[y * width + xp] - heights[y * width + xm];
        const dy = heights[yp * width + x] - heights[ym * width + x];
        
        // Normalize and convert to RGB (-1 to 1 -> 0 to 255)
        const strength = 2.0;
        const nx = -dx * strength;
        const ny = -dy * strength;
        const nz = 1.0;
        
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        
        imageData.data[i] = Math.floor((nx / length + 1) * 127.5);     // R (X)
        imageData.data[i + 1] = Math.floor((ny / length + 1) * 127.5); // G (Y)
        imageData.data[i + 2] = Math.floor((nz / length + 1) * 127.5); // B (Z)
        imageData.data[i + 3] = 255;                                    // A
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  /**
   * Generate a subsurface scattering (SSS) color test texture
   * Creates a skin-like color gradient for testing SSS values
   */
  generateSSSTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    // Create a gradient simulating subsurface scatter color variations
    // Skin-like tones transitioning from red to pink/orange
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#FF6B4A");   // Deep red (blood-like SSS)
    gradient.addColorStop(0.3, "#FF8C69"); // Salmon
    gradient.addColorStop(0.5, "#FFAB7A"); // Light orange/peach
    gradient.addColorStop(0.7, "#FFD4B8"); // Light skin tone
    gradient.addColorStop(1, "#FFE4D0");   // Very light
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL("image/png");
  }

  /**
   * Generate an ambient occlusion test texture
   * Creates a pattern with crevices and exposed areas
   */
  generateAOTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    
    // Create AO pattern based on distance from edges and corners
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Calculate distance from center
        const dx = x - centerX;
        const dy = y - centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate distance from edges
        const distFromEdgeX = Math.min(x, width - x) / (width / 2);
        const distFromEdgeY = Math.min(y, height - y) / (height / 2);
        const edgeFactor = Math.min(distFromEdgeX, distFromEdgeY);
        
        // Combine center and edge factors for AO value
        // Darker near edges (occluded), brighter in center (exposed)
        const centerFactor = 1 - (distFromCenter / maxDist) * 0.3;
        const ao = Math.min(1, edgeFactor * centerFactor + 0.3);
        
        // Add some noise
        const noise = Math.random() * 0.1 - 0.05;
        const value = Math.min(255, Math.max(0, (ao + noise) * 255));
        
        imageData.data[i] = value;
        imageData.data[i + 1] = value;
        imageData.data[i + 2] = value;
        imageData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  /**
   * Generate an emissive test texture
   * Creates glowing patterns for testing emissive materials
   */
  generateEmissiveTest(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    // Black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    
    // Create glowing lines/circuit-like pattern
    const lineCount = 6;
    const lineWidth = 4;
    
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    
    // Horizontal glowing lines
    for (let i = 0; i < lineCount; i++) {
      const y = ((i + 0.5) / lineCount) * height;
      const hue = (i * 60) % 360; // Cycle through colors
      
      const gradient = ctx.createLinearGradient(0, y, width, y);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
      gradient.addColorStop(0.3, `hsla(${hue}, 100%, 50%, 1)`);
      gradient.addColorStop(0.7, `hsla(${hue}, 100%, 50%, 1)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Add some bright spots/nodes
    const spotCount = 5;
    for (let i = 0; i < spotCount; i++) {
      const x = (i + 0.5) * (width / spotCount);
      const y = height / 2 + Math.sin(i * 1.5) * 40;
      const hue = (i * 72) % 360;
      
      const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
      spotGradient.addColorStop(0, `hsla(${hue}, 100%, 100%, 1)`);
      spotGradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 0.8)`);
      spotGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = spotGradient;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return canvas.toDataURL("image/png");
  }
}

// Create singleton instance
export const textureManager = new TextureManager();
