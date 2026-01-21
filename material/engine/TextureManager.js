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
}

// Create singleton instance
export const textureManager = new TextureManager();
