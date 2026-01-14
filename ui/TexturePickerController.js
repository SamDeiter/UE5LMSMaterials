/**
 * TexturePickerController.js
 *
 * Manages texture selection for TextureSample nodes.
 * Supports built-in textures, file upload, and URL loading.
 */

export class TexturePickerController {
  constructor(app) {
    this.app = app;
    this.builtInTextures = this.getBuiltInTextures();
    this.loadedTextures = new Map();

    this.init();
  }

  /**
   * Get list of built-in textures
   */
  getBuiltInTextures() {
    return [
      { id: "white", name: "White", url: null, color: "#ffffff" },
      { id: "black", name: "Black", url: null, color: "#000000" },
      { id: "gray50", name: "Gray 50%", url: null, color: "#808080" },
      { id: "normal_flat", name: "Flat Normal", url: null, color: "#8080ff" },
      {
        id: "checkerboard",
        name: "Checkerboard",
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect fill='%23fff' width='16' height='16'/%3E%3Crect fill='%23888' x='16' width='16' height='16'/%3E%3Crect fill='%23888' y='16' width='16' height='16'/%3E%3Crect fill='%23fff' x='16' y='16' width='16' height='16'/%3E%3C/svg%3E",
      },
      {
        id: "gradient_h",
        name: "Horizontal Gradient",
        url: null,
        gradient: "linear-gradient(to right, #000, #fff)",
      },
      {
        id: "gradient_v",
        name: "Vertical Gradient",
        url: null,
        gradient: "linear-gradient(to bottom, #000, #fff)",
      },
      {
        id: "uv_grid",
        name: "UV Test Grid",
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%230af' width='32' height='32'/%3E%3Crect fill='%23f0a' x='32' width='32' height='32'/%3E%3Crect fill='%23af0' y='32' width='32' height='32'/%3E%3Crect fill='%23fa0' x='32' y='32' width='32' height='32'/%3E%3C/svg%3E",
      },
    ];
  }

  /**
   * Initialize controller
   */
  init() {
    // Create file input for texture loading
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.style.display = "none";
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    document.body.appendChild(this.fileInput);
  }

  /**
   * Render texture picker UI for a node
   */
  renderTexturePicker(node, container) {
    const currentTexture = node.getPropertyValue("texture") || "white";

    const pickerHtml = `
      <div class="texture-picker" data-node-id="${node.id}">
        <div class="texture-preview-container">
          ${this.renderTexturePreview(currentTexture)}
        </div>
        <div class="texture-controls">
          <select class="texture-select">
            ${this.builtInTextures
              .map(
                (t) =>
                  `<option value="${t.id}" ${
                    t.id === currentTexture ? "selected" : ""
                  }>${t.name}</option>`
              )
              .join("")}
            <option value="custom" ${
              !this.builtInTextures.find((t) => t.id === currentTexture)
                ? "selected"
                : ""
            }>Custom...</option>
          </select>
          <button class="texture-load-btn" title="Load from file">
            <i class="fas fa-folder-open"></i>
          </button>
          <button class="texture-url-btn" title="Load from URL">
            <i class="fas fa-link"></i>
          </button>
        </div>
      </div>
    `;

    container.innerHTML = pickerHtml;
    this.bindPickerEvents(container, node);
  }

  /**
   * Render texture preview element
   */
  renderTexturePreview(textureId) {
    const texture = this.builtInTextures.find((t) => t.id === textureId);

    if (texture) {
      if (texture.url) {
        return `<img src="${texture.url}" class="texture-preview-img" alt="${texture.name}">`;
      } else if (texture.gradient) {
        return `<div class="texture-preview-img" style="width:100%; height:100%; background:${texture.gradient}"></div>`;
      } else if (texture.color) {
        return `<div class="texture-preview-img" style="width:100%; height:100%; background:${texture.color}"></div>`;
      }
    }

    // Check loaded textures
    if (this.loadedTextures.has(textureId)) {
      const url = this.loadedTextures.get(textureId);
      return `<img src="${url}" class="texture-preview-img" alt="Custom Texture">`;
    }

    return `<span class="texture-preview-placeholder">No texture</span>`;
  }

  /**
   * Bind events to picker controls
   */
  bindPickerEvents(container, node) {
    const picker = container.querySelector(".texture-picker");
    const select = picker.querySelector(".texture-select");
    const loadBtn = picker.querySelector(".texture-load-btn");
    const urlBtn = picker.querySelector(".texture-url-btn");

    // Texture select change
    select.addEventListener("change", (e) => {
      const value = e.target.value;
      if (value === "custom") {
        this.fileInput.click();
        this.pendingNode = node;
        this.pendingContainer = container;
      } else {
        this.setNodeTexture(node, value);
        this.updatePreview(container, value);
      }
    });

    // Load from file button
    loadBtn.addEventListener("click", () => {
      this.fileInput.click();
      this.pendingNode = node;
      this.pendingContainer = container;
    });

    // Load from URL button
    urlBtn.addEventListener("click", () => {
      const url = prompt("Enter image URL:");
      if (url) {
        this.loadTextureFromUrl(node, container, url);
      }
    });
  }

  /**
   * Handle file selection
   */
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file || !this.pendingNode) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const textureId = `custom_${Date.now()}`;

      this.loadedTextures.set(textureId, dataUrl);
      this.setNodeTexture(this.pendingNode, textureId);
      this.updatePreview(this.pendingContainer, textureId);

      this.pendingNode = null;
      this.pendingContainer = null;
    };
    reader.readAsDataURL(file);

    // Reset file input
    e.target.value = "";
  }

  /**
   * Load texture from URL
   */
  loadTextureFromUrl(node, container, url) {
    const textureId = `url_${Date.now()}`;

    // Test URL by loading image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.loadedTextures.set(textureId, url);
      this.setNodeTexture(node, textureId);
      this.updatePreview(container, textureId);
    };
    img.onerror = () => {
      alert("Failed to load image from URL. Check that CORS is enabled.");
    };
    img.src = url;
  }

  /**
   * Set texture on node
   */
  setNodeTexture(node, textureId) {
    node.setPropertyValue("texture", textureId);

    // Get the actual image data for material preview
    let imageData = null;
    const builtIn = this.builtInTextures.find((t) => t.id === textureId);
    if (builtIn) {
      imageData = builtIn.url || builtIn.color || null;
    } else if (this.loadedTextures.has(textureId)) {
      imageData = this.loadedTextures.get(textureId);
    }

    // Trigger material re-evaluation
    if (this.app && this.app.evaluateGraphAndUpdatePreview) {
      this.app.evaluateGraphAndUpdatePreview();
    }
  }

  /**
   * Update preview in container
   */
  updatePreview(container, textureId) {
    const previewContainer = container.querySelector(
      ".texture-preview-container"
    );
    if (previewContainer) {
      previewContainer.innerHTML = this.renderTexturePreview(textureId);
    }
  }

  /**
   * Get texture data by ID
   */
  getTextureData(textureId) {
    const builtIn = this.builtInTextures.find((t) => t.id === textureId);
    if (builtIn) {
      return builtIn;
    }
    if (this.loadedTextures.has(textureId)) {
      return { url: this.loadedTextures.get(textureId) };
    }
    return null;
  }
}

export default TexturePickerController;
