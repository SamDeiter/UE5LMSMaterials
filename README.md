# UE5 Material Editor

Web-based Material Editor with 100% visual parity to Unreal Engine 5.

## Quick Start

```bash
npm install
npm run dev
# Open: http://localhost:5173/public/material-editor.html
```

## Features

- **Real-time 3D Preview** with Three.js MeshPhysicalMaterial
- **Post-Processing Effects** (Bloom, Vignette, Film Grain) matching UE5
- **PBR Properties**: Base Color, Metallic, Roughness, Normal, AO, Emissive
- **Node Graph Editor** with snap-to-grid and magnetic alignment
- **Resizable Panels** with drag handles
- **ACES Filmic Tone Mapping** with sRGB gamma correction

## Configuration

All settings centralized in `src/constants/EditorConstants.js`:

| Category | Constants |
|----------|-----------|
| **POST_PROCESSING** | Bloom, Vignette, Film Grain |
| **RENDERING** | Camera, Lighting |
| **MATERIAL_DEFAULTS** | Roughness, IOR, Reflectivity |

## Testing

```bash
npm test           # Run 400+ tests
npm test -- --run  # Run once
```

## License

MIT
