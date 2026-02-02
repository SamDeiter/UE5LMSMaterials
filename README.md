# UE5 Material Editor

Web-based Material Editor with 100% visual parity to Unreal Engine 5.

## Quick Start

```bash
npm install
npm run dev
# Open: http://localhost:5173/public/material-editor.html
```

## Features

### Viewport & Rendering

- **Real-time 3D Preview** with Three.js MeshPhysicalMaterial
- **L+Drag Light Rotation** with visual direction helper
- **Post-Processing Effects** (Bloom, Vignette, Film Grain) matching UE5
- **ACES Filmic Tone Mapping** with sRGB gamma correction
- **View Modes**: Lit, Unlit, Wireframe, Normal, AO

### Material Properties

- **Full PBR Support**: Base Color, Metallic, Roughness, Normal, AO, Emissive
- **Advanced Inputs**: Anisotropy, Tangent, World Position Offset, Refraction
- **Custom Data 0/1** for shading model-specific parameters
- **Subsurface Color** and **Clear Coat** support

### Node Graph Editor

- **Snap-to-Grid** with magnetic alignment (G to toggle)
- **Hotkey Node Spawning**: Hold key + click (1-4, A, M, L, S, V, T, etc.)
- **Full Keyboard Shortcuts**: Ctrl+S/C/V/Z/Y/D, Space, Enter, Tab
- **Node Error Handling**: Visual ERROR!/WARNING banners with red/yellow styling
- **Resizable Panels** with drag handles

### Developer Tools

- **Stats Panel**: Texture lookups, user interpolators, instruction estimates
- **HLSL Code Viewer**: Multi-platform (DirectX SM5/6, Vulkan, Metal, OpenGL)
- **Real-time Shader Metrics** with budget warnings

## Configuration

All settings centralized in `src/constants/EditorConstants.js`:

| Category | Constants |
|----------|-----------|
| **POST_PROCESSING** | Bloom, Vignette, Film Grain |
| **RENDERING** | Camera, Lighting, Shadow |
| **MATERIAL_DEFAULTS** | Roughness, IOR, Reflectivity |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| 1-4 | Spawn Constant nodes |
| M, A, L, D | Multiply, Add, Lerp, Divide |
| S, V | Scalar/Vector Parameters |
| T | Texture Sample |
| C | Comment Node |
| Space | Force update preview |
| Enter | Apply/Compile material |
| Ctrl+S | Save |
| Ctrl+Z/Y | Undo/Redo |
| Ctrl+D | Duplicate |
| F | Focus selection |
| G | Toggle snap-to-grid |
| Tab | Quick node search |

## Testing

```bash
npm test           # Run 596 tests in watch mode
npm test -- --run  # Run once
```

## HLSL Parity & Technical Approach

This project **simulates** UE5 material evaluation for educational purposes rather than compiling true HLSL shaders.

### How It Works

- Node graphs are evaluated in JavaScript to compute material properties
- Results are applied to Three.js `MeshPhysicalMaterial` for real-time preview
- Per-pixel operations (e.g., texture-based Lerp) use canvas blending

### Implemented Features

| Category | Coverage |
|----------|----------|
| **Math Nodes** | Add, Multiply, Lerp, Clamp, Power, Abs, Trig functions |
| **Textures** | TextureSample with channel swizzling, tiling support |
| **Utility** | Fresnel (Schlick), Noise, SphereMask, Distance, BumpOffset |
| **Substrate** | SlabBSDF, VerticalLayer, HorizontalBlend, LegacyConversion |
| **PBR** | Full attribute mapping (Base Color → Emissive) |

### Known Limitations

| Feature | Status |
|---------|--------|
| Custom HLSL expressions | ❌ Not supported |
| Masked blend mode | ✅ Implemented |
| Vertex displacement | ❌ Not supported |
| True GPU shaders | ❌ JS evaluation only |
| Perlin/Simplex noise | ✅ Implemented |

## License

MIT

