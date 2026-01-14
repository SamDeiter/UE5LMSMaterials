# Advanced Substrate Features

> Substrate unlocks a tier of shading features previously reserved for offline rendering or custom HLSL hacks.

---

## Glints: Micro-Facet Discrete Reflection

Standard PBR assumes microfacets are **statistically distributed** (smooth gradients). However, real materials have **discrete, sparkling facets**:

- Metallic car paint flakes
- Snow and ice crystals
- Sand grains
- Glitter and sequins

### Enabling Glints

```
Console: r.Substrate.Glints=1
```

When enabled, the Slab node accepts additional inputs:

| Input | Type | Description |
|-------|------|-------------|
| Glint Density | Float | Concentration of sparkling facets |
| Glint UV | Vector2 | UV coordinates for glint distribution |

### How Glints Work

Substrate uses a **logarithmic representation of micro-facet density** to:

1. Render high-frequency sparkles that alias correctly
2. React dynamically to light direction
3. Maintain physical energy conservation

### Performance Note

> ⚠️ Glints are computationally expensive. Reserve for:
>
> - High-end PC/console
> - Hero assets in close-up
> - Cinematic sequences

Consider using texture-based "fake glints" for distant LODs.

---

## Fuzz: Grazing-Angle Sheen

The **Fuzz Amount** input adds a grazing-angle sheen layer **without** the full cost of a vertical cloth layer.

### Use Cases

| Material | Fuzz Description |
|----------|------------------|
| Peach skin | Soft fine hairs barely visible |
| Velvet/velour | Directional fiber sheen |
| Dusty surfaces | Accumulated particles |
| Aged leather | Worn surface patina |

### How Fuzz Works

Fuzz operates as a **simplified, integrated coating** on the base interface:

```
┌────────────────────────────┐
│      Fuzz Layer            │  ← Grazing angle sheen only
│  (cheap approximation)     │     No full recursive bounce
├────────────────────────────┤
│      Base Slab             │  ← Standard interface + medium
│                            │
└────────────────────────────┘
```

### Properties

| Input | Range | Default | Description |
|-------|-------|---------|-------------|
| Fuzz Amount | 0.0 - 1.0 | 0.0 | Intensity of the sheen effect |
| Fuzz Color | Vector3 | White | Color of the fuzz layer |

---

## Anisotropy Enhancements

### Universal Anisotropy

In legacy UE, anisotropy required selecting a specific shading model. In Substrate:

> **Any Slab can be anisotropic** without restrictions.

### Required Inputs

| Input | Type | Description |
|-------|------|-------------|
| Anisotropy | Float (-1 to 1) | Stretch direction and amount |
| Tangent | Vector3 | Direction of the brushing/grain |

### Anisotropy Values

| Value | Effect |
|-------|--------|
| 0.0 | Isotropic (circular highlight) |
| 0.5 | Stretched along tangent |
| -0.5 | Stretched perpendicular to tangent |
| 1.0 / -1.0 | Maximum stretch |

### Known Limitations

> ⚠️ **Rect Light Issue:** Rectangular Area Lights currently have known issues rendering anisotropic specular highlights correctly. The expected "stretched" reflection may not appear properly.

This is an **active development area** in current UE5 builds.

---

## Mobile Platform Scaling

Mobile platforms (Android/iOS) operate under a **"Substrate Lite"** regime due to:

- Tile-based rendering architectures
- Limited memory bandwidth
- No UAV support on most mobile GPUs

### Mobile Limitations

| Feature | Desktop/Console | Mobile |
|---------|-----------------|--------|
| G-Buffer Mode | Blendable or Adaptive | **Blendable only** |
| Max Closures | 4-8+ | **1 (enforced)** |
| Diffusion SSS | Supported | **Disabled** |
| Glints | Optional | **Disabled** |
| Vertical Layers | Multiple | **Parameter blending** |

### Mobile Material Strategy

1. **Create separate mobile materials** or use Material Quality switches
2. **Use Wrap SSS** instead of Diffusion for skin
3. **Flatten layers** using baked results where possible
4. **Test on target devices** early in development

---

## Ray Tracing Implications

Substrate supports hardware ray tracing (Lumen), but with considerations:

### How Ray Tracing Evaluates Materials

When a ray hits a surface, the **entire material graph** must be evaluated at the hit point to determine:

- Surface reflection properties
- Transmission/refraction direction
- Secondary ray generation

### Performance Impact

| Material Complexity | Ray Cost | Notes |
|---------------------|----------|-------|
| Simple (1-2 closures) | Baseline | Similar to legacy |
| Multi-layer (3-4 closures) | 1.5-2x baseline | Noticeable in reflection-heavy scenes |
| Complex (5+ closures) | 2-3x baseline | Consider LOD for ray-traced LODs |

### Lumen Considerations

For Lumen global illumination:

1. **Screen traces** use rasterized G-Buffer data (less impact)
2. **Hardware ray traces** evaluate full material at hit points
3. Complex materials in reflective surfaces cost more than direct view

### Optimization Strategies

| Strategy | Benefit |
|----------|---------|
| Ray tracing LOD materials | Simplified materials for secondary rays |
| Material caching | Reduce redundant evaluations |
| Hybrid Lumen settings | Balance screen traces vs hardware traces |

---

## Thin Film Interference

Substrate can simulate **thin film interference** effects (oil slicks, soap bubbles, coated lenses) through careful F0/F90 control:

### Physics Basis

When light reflects from multiple thin interfaces, wavelengths interfere constructively and destructively based on:

1. Film thickness
2. Viewing angle
3. Refractive index

### Implementation Approach

```javascript
// Simplified thin film approximation
// Drive F0 and F90 with iridescent gradients

// Example: Oil slick
F0: textureGradient(thickness, rainbowLUT)
F90: [1.0, 1.0, 1.0]  // Standard grazing

// Or for opposing color shift:
F0: coldColors
F90: warmColors
```

True thin film requires custom calculations, but Substrate's explicit F0/F90 enables approximations impossible in legacy workflows.

---

## Special Blend Modes

### Stacked Transparency

Substrate handles multiple transparent layers more accurately than legacy:

```
Glass Layer 1 (tinted red)
    └── Vertical Layer
Glass Layer 2 (tinted blue)
    └── Vertical Layer
Glass Layer 3 (clear)
```

Each layer's transmittance compounds correctly following Beer-Lambert law.

### Heterogeneous Volumes

Using **Simple Volume** sub-surface type with varying MFP:

| Application | MFP Configuration |
|-------------|-------------------|
| Colored liquids | Uniform MFP color |
| Murky water | Short MFP, neutral color |
| Stained glass | Color-dependent MFP |
| Jade/gem | Wavelength-dependent scattering |

---

## Experimental Features

These features may require engine modification or are in development:

| Feature | Status | Notes |
|---------|--------|-------|
| Glints | UE5.3+ | Requires explicit enable |
| Layered Hair | In development | Strand-based rendering integration |
| Volumetric Clouds integration | Partial | Cloud materials use separate system |
| Nanite material support | Full | Substrate works with Nanite geometry |

---

## Quick Reference: Feature Compatibility

| Feature | Blendable Mode | Adaptive Mode | Mobile |
|---------|----------------|---------------|--------|
| Basic Slab | ✓ | ✓ | ✓ |
| Vertical Layer | ✓ (simplified) | ✓ (full) | ✓ (simplified) |
| Horizontal Blend | ✓ | ✓ | ✓ (simplified) |
| Anisotropy | ✓ | ✓ | ✓ |
| Glints | ✓ | ✓ | ✗ |
| Fuzz | ✓ | ✓ | ✓ |
| Diffusion SSS | ✓ | ✓ | ✗ |
| Deep layering (5+) | ✗ | ✓ | ✗ |

---

## Next: Quick Reference Tables

See all conversion tables and CVars in [Quick Reference](./07-quick-reference.md).
