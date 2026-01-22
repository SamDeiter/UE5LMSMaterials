/**
 * ShaderEvaluator.js
 *
 * Canvas-based shader evaluation for Material Editor viewport preview.
 * Evaluates material graphs and produces texture results for 3D preview.
 *
 * Based on UE5 MaterialExpressions.cpp patterns.
 */

export class ShaderEvaluator {
  constructor() {
    this.cache = new Map(); // Cache processed textures by operation+inputs hash
    this.pendingOperations = new Map(); // Track in-flight async operations
  }

  /**
   * Clear the evaluation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Normalize any value to a [R, G, B] array
   * Implements UE5 type coercion: float → float3
   */
  normalizeToVector3(value) {
    if (Array.isArray(value)) {
      return value.slice(0, 3);
    }
    if (typeof value === "number") {
      return [value, value, value]; // float → float3
    }
    if (value && typeof value === "object" && value.type === "texture") {
      return value; // Pass through texture objects
    }
    return [0.5, 0.5, 0.5]; // Default mid-gray
  }

  /**
   * Normalize any value to a scalar
   */
  normalizeToScalar(value) {
    if (typeof value === "number") {
      return value;
    }
    if (Array.isArray(value)) {
      return value[0] ?? 0; // Take first component
    }
    return 0;
  }

  /**
   * Check if a value is a texture object
   */
  isTexture(value) {
    return value && typeof value === "object" && value.type === "texture";
  }

  /**
   * Multiply a texture by a color using canvas pixel manipulation
   * @param {Object} textureObj - Texture object with .url property
   * @param {Array|number} color - RGB array or scalar to multiply by
   * @returns {Promise<Object>} - New texture object with tinted result
   */
  async multiplyTextureByColor(textureObj, color) {
    const colorVec = this.normalizeToVector3(color);

    // Generate cache key
    const cacheKey = `mul_${textureObj.url}_${colorVec.join(",")}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // If already processing this operation, wait for it
    if (this.pendingOperations.has(cacheKey)) {
      return this.pendingOperations.get(cacheKey);
    }

    const operation = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const r = colorVec[0] ?? 1;
        const g = colorVec[1] ?? 1;
        const b = colorVec[2] ?? 1;

        // Multiply each pixel by the color
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * r); // R
          data[i + 1] = Math.min(255, data[i + 1] * g); // G
          data[i + 2] = Math.min(255, data[i + 2] * b); // B
          // Alpha stays the same
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const result = { type: "texture", url: dataUrl };

        this.cache.set(cacheKey, result);
        this.pendingOperations.delete(cacheKey);
        resolve(result);
      };
      img.onerror = () => {
        this.pendingOperations.delete(cacheKey);
        resolve(textureObj); // Fallback to original on error
      };
      img.src = textureObj.url;
    });

    this.pendingOperations.set(cacheKey, operation);
    return operation;
  }

  /**
   * Add a color to a texture
   * @param {Object} textureObj - Texture object with .url property
   * @param {Array|number} color - RGB array or scalar to add
   * @returns {Promise<Object>} - New texture object with brightened result
   */
  async addTextureAndColor(textureObj, color) {
    const colorVec = this.normalizeToVector3(color);

    const cacheKey = `add_${textureObj.url}_${colorVec.join(",")}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingOperations.has(cacheKey)) {
      return this.pendingOperations.get(cacheKey);
    }

    const operation = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Color values are 0-1, convert to 0-255 for addition
        const r = (colorVec[0] ?? 0) * 255;
        const g = (colorVec[1] ?? 0) * 255;
        const b = (colorVec[2] ?? 0) * 255;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] + r);
          data[i + 1] = Math.min(255, data[i + 1] + g);
          data[i + 2] = Math.min(255, data[i + 2] + b);
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const result = { type: "texture", url: dataUrl };

        this.cache.set(cacheKey, result);
        this.pendingOperations.delete(cacheKey);
        resolve(result);
      };
      img.onerror = () => {
        this.pendingOperations.delete(cacheKey);
        resolve(textureObj);
      };
      img.src = textureObj.url;
    });

    this.pendingOperations.set(cacheKey, operation);
    return operation;
  }

  /**
   * Lerp between two values (textures, colors, or scalars)
   * @param {*} a - First value (texture or color)
   * @param {*} b - Second value (texture or color)
   * @param {number} alpha - Blend factor (0-1)
   * @returns {Promise<*>} - Blended result
   */
  async lerpValues(a, b, alpha) {
    const t = this.normalizeToScalar(alpha);

    // If both are colors/scalars, simple lerp
    if (!this.isTexture(a) && !this.isTexture(b)) {
      const vecA = this.normalizeToVector3(a);
      const vecB = this.normalizeToVector3(b);
      return [
        vecA[0] + (vecB[0] - vecA[0]) * t,
        vecA[1] + (vecB[1] - vecA[1]) * t,
        vecA[2] + (vecB[2] - vecA[2]) * t,
      ];
    }

    // If one is a texture, blend with color using canvas
    if (this.isTexture(a) && !this.isTexture(b)) {
      return this.lerpTextureWithColor(a, b, t);
    }
    if (!this.isTexture(a) && this.isTexture(b)) {
      return this.lerpTextureWithColor(b, a, 1 - t);
    }

    // Both textures - complex blend (for now, just return first)
    return a;
  }

  /**
   * Lerp a texture towards a color
   */
  async lerpTextureWithColor(textureObj, color, alpha) {
    const colorVec = this.normalizeToVector3(color);

    const cacheKey = `lerp_${textureObj.url}_${colorVec.join(",")}_${alpha}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingOperations.has(cacheKey)) {
      return this.pendingOperations.get(cacheKey);
    }

    const operation = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const r = (colorVec[0] ?? 0) * 255;
        const g = (colorVec[1] ?? 0) * 255;
        const b = (colorVec[2] ?? 0) * 255;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] + (r - data[i]) * alpha;
          data[i + 1] = data[i + 1] + (g - data[i + 1]) * alpha;
          data[i + 2] = data[i + 2] + (b - data[i + 2]) * alpha;
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const result = { type: "texture", url: dataUrl };

        this.cache.set(cacheKey, result);
        this.pendingOperations.delete(cacheKey);
        resolve(result);
      };
      img.onerror = () => {
        this.pendingOperations.delete(cacheKey);
        resolve(textureObj);
      };
      img.src = textureObj.url;
    });

    this.pendingOperations.set(cacheKey, operation);
    return operation;
  }

  /**
   * Lerp between two colors using a texture's grayscale as per-pixel alpha
   * @param {Array|number} colorA - First color (RGB array or scalar)
   * @param {Array|number} colorB - Second color (RGB array or scalar)
   * @param {Object} alphaTexture - Texture object with .url property
   * @returns {Promise<Object>} - New texture with per-pixel interpolated colors
   */
  async lerpColorsWithTextureAlpha(colorA, colorB, alphaTexture) {
    const vecA = this.normalizeToVector3(colorA);
    const vecB = this.normalizeToVector3(colorB);

    const cacheKey = `lerp_colors_${vecA.join(",")}_${vecB.join(",")}_${alphaTexture.url}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingOperations.has(cacheKey)) {
      return this.pendingOperations.get(cacheKey);
    }

    const operation = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Color A and B in 0-255 range
        const rA = (vecA[0] ?? 0) * 255;
        const gA = (vecA[1] ?? 0) * 255;
        const bA = (vecA[2] ?? 0) * 255;
        const rB = (vecB[0] ?? 1) * 255;
        const gB = (vecB[1] ?? 1) * 255;
        const bB = (vecB[2] ?? 1) * 255;

        for (let i = 0; i < data.length; i += 4) {
          // Use the texture's luminance as alpha (grayscale conversion)
          const texR = data[i];
          const texG = data[i + 1];
          const texB = data[i + 2];
          // Standard luminance formula
          const alpha = (texR * 0.299 + texG * 0.587 + texB * 0.114) / 255;
          
          // Lerp between color A and color B based on alpha
          data[i] = rA + (rB - rA) * alpha;       // R
          data[i + 1] = gA + (gB - gA) * alpha;   // G
          data[i + 2] = bA + (bB - bA) * alpha;   // B
          // Keep original alpha
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const result = { type: "texture", url: dataUrl };

        this.cache.set(cacheKey, result);
        this.pendingOperations.delete(cacheKey);
        resolve(result);
      };
      img.onerror = () => {
        this.pendingOperations.delete(cacheKey);
        // Fallback to colorB on error
        resolve({ type: "texture", url: alphaTexture.url });
      };
      img.src = alphaTexture.url;
    });

    this.pendingOperations.set(cacheKey, operation);
    return operation;
  }

  /**
   * Subtract a color from a texture
   */
  async subtractFromTexture(textureObj, color) {
    const colorVec = this.normalizeToVector3(color);

    const cacheKey = `sub_${textureObj.url}_${colorVec.join(",")}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingOperations.has(cacheKey)) {
      return this.pendingOperations.get(cacheKey);
    }

    const operation = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const r = (colorVec[0] ?? 0) * 255;
        const g = (colorVec[1] ?? 0) * 255;
        const b = (colorVec[2] ?? 0) * 255;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] - r);
          data[i + 1] = Math.max(0, data[i + 1] - g);
          data[i + 2] = Math.max(0, data[i + 2] - b);
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const result = { type: "texture", url: dataUrl };

        this.cache.set(cacheKey, result);
        this.pendingOperations.delete(cacheKey);
        resolve(result);
      };
      img.onerror = () => {
        this.pendingOperations.delete(cacheKey);
        resolve(textureObj);
      };
      img.src = textureObj.url;
    });

    this.pendingOperations.set(cacheKey, operation);
    return operation;
  }

  /**
   * Apply power function to a texture
   */
  async powerTexture(textureObj, exponent) {
    const exp = this.normalizeToScalar(exponent);

    const cacheKey = `pow_${textureObj.url}_${exp}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingOperations.has(cacheKey)) {
      return this.pendingOperations.get(cacheKey);
    }

    const operation = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Normalize to 0-1, apply power, denormalize
          data[i] = Math.pow(data[i] / 255, exp) * 255;
          data[i + 1] = Math.pow(data[i + 1] / 255, exp) * 255;
          data[i + 2] = Math.pow(data[i + 2] / 255, exp) * 255;
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const result = { type: "texture", url: dataUrl };

        this.cache.set(cacheKey, result);
        this.pendingOperations.delete(cacheKey);
        resolve(result);
      };
      img.onerror = () => {
        this.pendingOperations.delete(cacheKey);
        resolve(textureObj);
      };
      img.src = textureObj.url;
    });

    this.pendingOperations.set(cacheKey, operation);
    return operation;
  }
}

// Create singleton instance
export const shaderEvaluator = new ShaderEvaluator();
