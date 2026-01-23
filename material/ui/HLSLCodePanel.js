/**
 * HLSLCodePanel.js
 *
 * HLSL Shader Code Viewer
 * ========================
 * Displays generated HLSL/GLSL shader code from the material graph.
 * Useful for debugging shader math and verifying PBR implementation.
 */

export class HLSLCodePanel {
  constructor(app) {
    this.app = app;
    this.panel = null;
    this.codeArea = null;
    this.visible = false;
  }

  /**
   * Initialize the HLSL code panel
   */
  init() {
    // Create panel container
    this.panel = document.createElement("div");
    this.panel.id = "hlsl-code-panel";
    this.panel.className = "hlsl-code-panel";
    this.panel.style.display = "none";

    // Header with platform selector
    const header = document.createElement("div");
    header.className = "hlsl-panel-header";
    header.innerHTML = `
      <span class="hlsl-panel-title">HLSL Generated Code</span>
      <select class="hlsl-platform-select" title="Target Platform">
        <option value="SM5">DirectX SM5 (DX11)</option>
        <option value="SM6">DirectX SM6 (DX12)</option>
        <option value="Vulkan">Vulkan (SPIR-V)</option>
        <option value="OpenGL">OpenGL ES 3.1</option>
        <option value="Metal">Metal (iOS/macOS)</option>
      </select>
      <button class="hlsl-close-btn" title="Close">×</button>
    `;
    this.panel.appendChild(header);

    // Platform selector change handler
    this.platformSelect = header.querySelector(".hlsl-platform-select");
    this.platformSelect.addEventListener("change", () => this.updateCode());
    this.currentPlatform = "SM5";

    // Code area
    this.codeArea = document.createElement("pre");
    this.codeArea.className = "hlsl-code-area";
    this.codeArea.textContent = "// Click Apply to generate shader code";
    this.panel.appendChild(this.codeArea);

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.className = "hlsl-copy-btn";
    copyBtn.textContent = "Copy to Clipboard";
    copyBtn.addEventListener("click", () => this.copyToClipboard());
    this.panel.appendChild(copyBtn);

    // Add to document
    document.body.appendChild(this.panel);

    // Bind close button
    header
      .querySelector(".hlsl-close-btn")
      .addEventListener("click", () => this.hide());

    // Make panel draggable
    this.makeDraggable(header);
  }

  /**
   * Show the panel
   */
  show() {
    if (!this.panel) this.init();
    this.panel.style.display = "flex";
    this.visible = true;
    this.updateCode();
  }

  /**
   * Hide the panel
   */
  hide() {
    if (this.panel) {
      this.panel.style.display = "none";
    }
    this.visible = false;
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update the generated code display
   */
  updateCode() {
    if (!this.codeArea || !this.app.material) return;

    const code = this.generateHLSL();
    this.codeArea.textContent = code;
  }

  /**
   * Generate HLSL code from material graph
   */
  generateHLSL() {
    const material = this.app.material;
    if (!material) {
      return "// No material loaded";
    }

    const platform = this.platformSelect?.value || "SM5";
    const platformInfo = this.getPlatformInfo(platform);

    let hlsl = "";
    hlsl += "// ============================================\n";
    hlsl += `// UE5 Material Editor - Generated ${platformInfo.language} Code\n`;
    hlsl += `// Target: ${platformInfo.name}\n`;
    hlsl += "// ============================================\n\n";

    // Material properties header
    hlsl += "// Material Properties\n";
    hlsl += "// ===================\n";
    hlsl += `// Material Domain: Surface\n`;
    hlsl += `// Blend Mode: Opaque\n`;
    hlsl += `// Shading Model: Default Lit\n`;
    hlsl += `// Platform: ${platformInfo.name}\n\n`;

    // Include standard UE5 headers
    hlsl += "// Standard Includes\n";
    hlsl += '#include "Common.ush"\n';
    hlsl += '#include "MaterialTemplate.ush"\n\n';

    // Generate node declarations
    hlsl += "// === Node Declarations ===\n\n";

    const nodes = [...material.nodes.values()].filter(
      (n) => n.type !== "main-output",
    );

    nodes.forEach((node) => {
      hlsl += this.generateNodeCode(node);
    });

    // Generate main material function
    hlsl += this.generateMainFunction(material);

    return hlsl;
  }

  /**
   * Generate HLSL for a single node
   */
  generateNodeCode(node) {
    let code = "";
    const varName = `node_${node.id.replace(/-/g, "_").substring(0, 20)}`;

    switch (node.nodeKey) {
      case "Constant":
        code += `// ${node.title}\n`;
        code += `float ${varName} = ${node.properties.R ?? 0};\n\n`;
        break;

      case "Constant3Vector":
        code += `// ${node.title}\n`;
        code += `float3 ${varName} = float3(${node.properties.R ?? 1}, ${node.properties.G ?? 1}, ${node.properties.B ?? 1});\n\n`;
        break;

      case "Lerp":
        code += `// ${node.title} (LinearInterpolate)\n`;
        code += `// lerp(A, B, Alpha) = A + Alpha * (B - A)\n`;
        code += `float3 ${varName} = lerp(input_A, input_B, alpha);\n\n`;
        break;

      case "Multiply":
        code += `// ${node.title}\n`;
        code += `auto ${varName} = input_A * input_B;\n\n`;
        break;

      case "Add":
        code += `// ${node.title}\n`;
        code += `auto ${varName} = input_A + input_B;\n\n`;
        break;

      case "TextureSample":
        code += `// ${node.title}\n`;
        code += `float4 ${varName} = Texture2DSample(Tex, TexSampler, UV);\n\n`;
        break;

      default:
        code += `// ${node.title} (${node.nodeKey})\n`;
        code += `// [Custom node - shader code not available]\n\n`;
    }

    return code;
  }

  /**
   * Generate the main CalcMaterialParameters function
   */
  generateMainFunction(material) {
    let code = "";
    code += "// === Main Material Function ===\n\n";
    code += "void CalcMaterialParameters(\n";
    code += "    FMaterialPixelParameters Parameters,\n";
    code += "    inout FPixelMaterialInputs PixelMaterialInputs)\n";
    code += "{\n";

    // Default values matching UE5 spec
    code += "    // PBR Outputs (UE5 Defaults)\n";
    code +=
      "    PixelMaterialInputs.BaseColor = float3(1.0, 1.0, 1.0);  // White\n";
    code +=
      "    PixelMaterialInputs.Metallic = 0.0;                      // Dielectric\n";
    code +=
      "    PixelMaterialInputs.Specular = 0.5;                      // 4% F0\n";
    code +=
      "    PixelMaterialInputs.Roughness = 0.5;                     // Mid-rough\n";
    code +=
      "    PixelMaterialInputs.EmissiveColor = float3(0, 0, 0);     // No emission\n";
    code +=
      "    PixelMaterialInputs.Opacity = 1.0;                       // Opaque\n";
    code +=
      "    PixelMaterialInputs.Normal = float3(0, 0, 1);            // Up\n";
    code +=
      "    PixelMaterialInputs.AmbientOcclusion = 1.0;              // No occlusion\n";
    code += "\n";

    // Add Cook-Torrance BRDF comment
    code += "    // Cook-Torrance Microfacet BRDF:\n";
    code +=
      "    // f_r(l, v) = D(h) * F(v,h) * G(l,v,h) / (4 * (N.L) * (N.V))\n";
    code += "    //\n";
    code +=
      "    // D = GGX/Trowbridge-Reitz: α² / (π * ((N.H)² * (α² - 1) + 1)²)\n";
    code += "    // F = Schlick: F0 + (1 - F0) * (1 - V.H)^5\n";
    code += "    // G = Smith-GGX: G1(V) * G1(L), k = (r+1)²/8\n";
    code += "    // α = Roughness²\n";
    code += "}\n";

    return code;
  }

  /**
   * Get platform-specific information for shader generation
   */
  getPlatformInfo(platform) {
    const platforms = {
      SM5: { name: "DirectX 11 (Shader Model 5)", language: "HLSL" },
      SM6: { name: "DirectX 12 (Shader Model 6)", language: "HLSL" },
      Vulkan: { name: "Vulkan (SPIR-V)", language: "GLSL/SPIR-V" },
      OpenGL: { name: "OpenGL ES 3.1", language: "GLSL" },
      Metal: { name: "Metal (iOS/macOS)", language: "Metal Shading Language" },
    };
    return platforms[platform] || platforms["SM5"];
  }

  /**
   * Copy code to clipboard
   */
  copyToClipboard() {
    if (!this.codeArea) return;
    navigator.clipboard.writeText(this.codeArea.textContent).then(() => {
      console.log("[HLSL] Code copied to clipboard");
    });
  }

  /**
   * Make the panel draggable
   */
  makeDraggable(handle) {
    let offsetX = 0,
      offsetY = 0;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const rect = this.panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      const onMove = (e) => {
        this.panel.style.left = `${e.clientX - offsetX}px`;
        this.panel.style.top = `${e.clientY - offsetY}px`;
        this.panel.style.right = "auto";
        this.panel.style.bottom = "auto";
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }
}
