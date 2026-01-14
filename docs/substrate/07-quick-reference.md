# Substrate Quick Reference

> Quick lookup tables for legacy-to-Substrate conversion, G-Buffer formats, and console variables.

---

## Table 1: Legacy Shading Model → Substrate Equivalent

| Legacy Shading Model | Substrate Implementation | Key Differences |
|----------------------|--------------------------|-----------------|
| **Default Lit** | Slab BSDF | F0/F90 exposed explicitly; no hidden "Metalness" logic unless helper node is used |
| **Clear Coat** | Vertical Layer Operator | Can layer *any* two materials, not just "Clear Coat" over "Standard." Top layer has independent roughness |
| **Subsurface** | Slab (SS Type: Wrap/Diffusion) | Controlled via MFP (Mean Free Path) inputs rather than "Opacity" slot. Supports wavelength-dependent scattering |
| **Pre-Integrated Skin** | Slab (SS Type: Diffusion) | Uses screen-space or ray-traced diffusion profile |
| **Subsurface Profile** | Slab (SS Type: Diffusion) | Same diffusion system, but per-Slab configuration |
| **Two-Sided Foliage** | Slab (SS Type: Two-Sided Wrap) | Thin surface light bleeding without depth calculation |
| **Hair** | Slab + Anisotropy | Any Slab can use Anisotropy; strand-specific rendering separate |
| **Cloth** | Slab + Fuzz | Use Fuzz Amount for fabric sheen without full cloth model overhead |
| **Eye** | Slab + custom setup | Requires specific IOR and medium configuration |
| **Unlit** | Unlit BSDF | Supports colored transmittance; can be layered vertically or mixed horizontally |
| **Thin Translucent** | Slab + Transmittance | Requires explicit MFP handling for volume; "Thin Film" assumption by default |
| **From Material Expression** | Substrate graph | Full flexibility; no fixed shading model |
| **SingleLayerWater** | Slab + appropriate SS Type | Water-specific optimizations may require custom setup |

---

## Table 2: G-Buffer Format Comparison

| Format | Pros | Cons | Use Case |
|--------|------|------|----------|
| **Blendable** | Fast, fixed memory footprint, predictable performance | Lower fidelity, simplifies complex graphs automatically (parameter blending) | 60fps games, mobile, competitive multiplayer |
| **Adaptive** | High fidelity, supports deep layering | Variable performance cost, high memory bandwidth, ~15% longer shader cook time | Cinematics, automotive visualization, high-end single-player |

### Selection Guide

| Question | If Yes → | If No → |
|----------|----------|---------|
| Do you need 60fps+ consistent? | Blendable | Consider Adaptive |
| Target includes mobile/Switch? | Blendable | Either |
| Is this for cinematics/film? | Adaptive | Either |
| Do materials need 5+ layers? | Adaptive | Blendable |
| Target is SM6+ only? | Either | Blendable |

---

## Table 3: Console Variables (CVars)

### Core Substrate CVars

| CVar | Default | Range/Values | Function |
|------|---------|--------------|----------|
| `r.Substrate` | 1 | 0, 1 | Master enable/disable for Substrate system. **Requires editor restart.** |
| `r.Substrate.BytesPerPixel` | 80 | 40-256 | G-Buffer memory budget per pixel. Increase to 96/128 if seeing overflow artifacts. |
| `r.Substrate.BlendableGBuffer` | 1 | 0, 1 | Force Blendable G-Buffer mode. Set to 0 for Adaptive mode. |

### Debug and Visualization CVars

| CVar | Default | Function |
|------|---------|----------|
| `r.Substrate.Debug.ClosureCount` | 0 | Overlay showing closure count per pixel |
| `r.Substrate.Debug.MaterialComplexity` | 0 | Material complexity heat map |
| `ShowFlag.VisualizeSubstrateClosureCount` | - | Viewport visualization mode |
| `ShowFlag.VisualizeGBuffer` | - | G-Buffer data visualization |

### Advanced CVars

| CVar | Default | Function | Warning |
|------|---------|----------|---------|
| `r.Substrate.Glints` | 0 | Enable high-quality glint rendering | Expensive; high-end GPU required |
| `r.Substrate.OpacityOverride` | 0 | Force opacity values for debugging | Debug only |
| `r.Substrate.BypassCompression` | 0 | Disable closure quantization | Massive VRAM increase |

---

## Table 4: Slab Input Reference

### Interface Inputs (Surface Reflection)

| Pin Name | Type | Default | Description |
|----------|------|---------|-------------|
| Diffuse Albedo | Vector3 | [0,0,0] | Base diffuse color (non-metals) |
| F0 | Vector3 | [0.04,0.04,0.04] | Fresnel reflectance at 0° (perpendicular) |
| F90 | Vector3 | [1,1,1] | Fresnel reflectance at 90° (grazing) |
| Roughness | Float | 0.5 | Microfacet variance (0=mirror, 1=matte) |
| Anisotropy | Float | 0.0 | Specular stretch (-1 to 1) |
| Normal | Vector3 | Surface normal | Custom normal map |
| Tangent | Vector3 | Auto-calculated | Direction for anisotropy |

### Medium Inputs (Volumetric Transmission)

| Pin Name | Type | Default | Description |
|----------|------|---------|-------------|
| Mean Free Path | Vector3 | [0,0,0] | RGB subsurface scattering depth |
| Transmittance | Vector3 | [0,0,0] | Optical transparency color |
| Coverage | Float | 1.0 | Physical presence (0=hole, 1=solid) |
| Fuzz Amount | Float | 0.0 | Grazing-angle sheen intensity |
| Fuzz Color | Vector3 | [1,1,1] | Color of fuzz layer |

### Sub-Surface Type Options

| Type | Performance | Use Case |
|------|-------------|----------|
| Wrap | Cheap | Foliage, canvas, paper |
| Two-Sided Wrap | Cheap | Thin translucent sheets |
| Diffusion | Expensive | High-fidelity skin rendering |
| Simple Volume | Medium | Colored glass, liquids |

---

## Table 5: Operator Reference

### Vertical Layer

| Pin | Type | Description |
|-----|------|-------------|
| Top | Substrate | Coating layer (closer to viewer) |
| Bottom | Substrate | Substrate layer (underneath) |
| Thickness | Float | Optical depth of top layer |
| Output | Substrate | Combined layered material |

### Horizontal Blend

| Pin | Type | Description |
|-----|------|-------------|
| Background | Substrate | First material (Mix=0) |
| Foreground | Substrate | Second material (Mix=1) |
| Mix | Float | Blend weight (0.0-1.0) |
| Output | Substrate | Blended material |

---

## Table 6: Platform Support Matrix

| Feature | PC DX12 | PC DX11 | PS5 | Xbox Series | PS4/XB1 | Switch | Mobile |
|---------|---------|---------|-----|-------------|---------|--------|--------|
| Substrate Basic | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Blendable Mode | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Adaptive Mode | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Glints | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Diffusion SSS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Deep Layering | ✓* | ✗ | ✓* | ✓* | ✗ | ✗ | ✗ |

*Requires Adaptive mode and sufficient BytesPerPixel budget

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Magenta/black checkerboard | G-Buffer overflow | Increase `r.Substrate.BytesPerPixel` or simplify material |
| Layers look averaged/flat | Blendable mode simplification | Switch to Adaptive mode (SM6 platforms) |
| F90 color not appearing | Missing F90 connection | Verify F90 pin is connected |
| Anisotropy not stretching | Missing Tangent | Connect Tangent input |
| SSS not visible | Wrong Sub-Surface Type | Use Diffusion instead of Wrap for skin |
| Fuzz has no effect | Fuzz Amount too low | Increase Fuzz Amount value |
| Material renders black | Conversion failure | Check for Legacy Conversion node issues |

---

## Material Hotkeys Reference

| Key + Click | Node Spawned |
|-------------|--------------|
| 1 | Constant (Scalar) |
| 3 | Constant3Vector (RGB) |
| T | TextureSample |
| M | Multiply |
| A | Add |
| L | Lerp |
| S | ScalarParameter |
| V | VectorParameter |

---

## See Also

- [01-overview.md](./01-overview.md) - Introduction and paradigm shift
- [02-slab-architecture.md](./02-slab-architecture.md) - Slab BSDF anatomy
- [03-graph-topology.md](./03-graph-topology.md) - Layering and blending operators
- [04-gbuffer-closures.md](./04-gbuffer-closures.md) - Memory management
- [05-production-workflows.md](./05-production-workflows.md) - Migration guide
- [06-advanced-features.md](./06-advanced-features.md) - Glints, Fuzz, mobile
