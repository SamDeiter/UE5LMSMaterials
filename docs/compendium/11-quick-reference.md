# Quick Reference

Comprehensive reference tables for the UE5 Material Editor.

---

## Table 1: Toolbar Button Reference

| Icon | Button | Function | Shortcut |
|------|--------|----------|----------|
| 💾 | Save | Write asset to disk (.uasset) | `Ctrl+S` |
| 📁🔍 | Browse | Locate asset in Content Browser | `Ctrl+B` |
| ✓ | Apply | Compile shader & update level | `Enter` |
| 🔍 | Search | Find nodes/text in graph | `Ctrl+F` |
| 🏠 | Home | Center graph on Main Node | `H` |
| 📊 | Hierarchy | Show Master/Instance chain | — |
| 🧹 | Clean Graph | Delete unconnected nodes | — |
| 👁️ | Hide Unrelated | Dim unused nodes | — |
| 📈 | Stats | Toggle Stats Panel | — |
| 📱💻 | Platform Stats | Cross-platform profiling | — |

---

## Table 2: Standard PBR Input Definitions

| Input | Data Type | Physics Description | Typical Range |
|-------|-----------|---------------------|---------------|
| **Base Color** | Vector3 | Diffuse Albedo / Specular Tint (Metal) | 0.0 – 1.0 |
| **Metallic** | Scalar | Conductor (1) vs Dielectric (0) | 0 or 1 (Binary) |
| **Specular** | Scalar | F0 Reflectance for Dielectrics | 0.5 (Default) |
| **Roughness** | Scalar | Microfacet Surface Irregularity | 0.0 (Mirror) – 1.0 (Matte) |
| **Emissive** | Vector3 | Light Emission (Self-Illumination) | 0.0 – 100+ (HDR) |
| **Normal** | Vector3 | Tangent Space Surface Perturbation | -1 to 1 (Encoded 0–1) |
| **Opacity** | Scalar | Transparency (Translucent Mode) | 0.0 (Clear) – 1.0 (Solid) |

---

## Table 3: Pin Color Legend

| Color | Type | Example Use |
|-------|------|-------------|
| ⚪ White | Execution | Flow control |
| 🟢 Light Green | Scalar (float) | Roughness, Metallic |
| 🟢 Green | Vector2 (float2) | UV Coordinates |
| 🟡 Yellow | Vector3 (float3) | Base Color, Normal |
| 🔴 Pink | Vector4 (float4) | RGBA Color |
| 🔴 Red | Bool | Static Switch |
| 🔵 Blue | Texture Object | Texture Sample |

---

## Table 4: Spawnable Hotkeys

| Key | Node Type |
|-----|-----------|
| `1` | Constant (Scalar) |
| `2` | Constant2Vector |
| `3` | Constant3Vector (Color) |
| `T` | Texture Sample |
| `L` | Lerp (Linear Interpolate) |
| `M` | Multiply |
| `A` | Add |
| `D` | Divide |
| `S` | Scalar Parameter |
| `V` | Vector Parameter |
| `C` | Comment |

---

## Table 5: Material Domains

| Domain | Use Case |
|--------|----------|
| Surface | Physical objects |
| Deferred Decal | Projection onto other surfaces |
| Light Function | Light masking |
| Volume | Volumetric fog/clouds |
| Post Process | Screen-space effects |
| User Interface | Slate/UMG |
| Virtual Texture | Landscape optimization |

---

## Table 6: Blend Modes

| Mode | Depth Write | Transparency | Performance |
|------|-------------|--------------|-------------|
| Opaque | Yes | None | Best |
| Masked | Yes | Binary | Good |
| Translucent | Limited | Continuous | Expensive |
| Additive | No | Additive | Moderate |
| Modulate | No | Multiplicative | Moderate |

---

## Table 7: Shading Models

| Model | Primary Use | Special Inputs |
|-------|-------------|----------------|
| Default Lit | Standard PBR | — |
| Unlit | No lighting | Emissive only |
| Subsurface | Wax, jade | Subsurface Color |
| Clear Coat | Car paint | Clear Coat, CC Roughness |
| Hair | Hair strands | Tangent, Backlit |
| Cloth | Fabric | Fuzz Color |
| Eye | Eyeballs | — |
| Single Layer Water | Opaque water | — |

---

## Compendium Index

1. [Introduction](./01-introduction.md)
2. [Menu Bar](./02-menu-bar.md)
3. [Toolbar](./03-toolbar.md)
4. [Viewport Panel](./04-viewport-panel.md)
5. [Details Panel](./05-details-panel.md)
6. [Main Material Node](./06-main-material-node.md)
7. [Material Graph Panel](./07-material-graph-panel.md)
8. [Palette Panel](./08-palette-panel.md)
9. [Stats Panel](./09-stats-panel.md)
10. [Substrate Framework](./10-substrate-framework.md)
11. Quick Reference (this document)
