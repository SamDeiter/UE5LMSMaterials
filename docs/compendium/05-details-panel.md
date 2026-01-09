# The Details Panel: Compilation Configuration Engine

The Details Panel is the command center for the material's compilation settings. While the Graph defines logic, the Details Panel defines the **rules under which that logic executes**.

---

## Material Domain

The highest-level filter for the compiler—dictates overall usage context.

| Domain | Usage |
|--------|-------|
| **Surface** | Physical objects (meshes, landscapes, characters) |
| **Deferred Decal** | Projection shader onto other surfaces |
| **Light Function** | Light masking (flashlight gobos, cloud shadows) |
| **Volume** | Volumetric rendering (fog, clouds) |
| **Post Process** | Screen-space effects (thermal vision, edge detection) |
| **User Interface** | Slate and UMG (2D graphics, no 3D lighting) |
| **Virtual Texture** | Baked into Runtime Virtual Texture for landscape optimization |

> [!NOTE]
> Post Process domain replaces PBR inputs with a single Emissive Color output representing screen pixel color.

---

## Blend Mode

Controls how material output combines with existing frame buffer pixels.

| Mode | Description | Performance | Depth Write |
|------|-------------|-------------|-------------|
| **Opaque** | Completely replaces background | Best ✓ | Yes |
| **Masked** | Binary visibility (clip threshold) | Good | Yes |
| **Translucent** | Partial transparency | Expensive | Limited |
| **Additive** | Color added to background (fire, lasers) | Moderate | No |
| **Modulate** | Color multiplied (stained glass shadows) | Moderate | No |
| **AlphaComposite** | Pre-multiplied alpha (UI, VFX) | Moderate | No |
| **AlphaHoldout** | Matte/punch-through effect | Special | No |

> [!WARNING]
> Translucent materials don't write to the Depth Buffer normally, causing potential sorting errors.

### Masked Mode Details

Uses the **Opacity Mask** input. Pixels below the **Opacity Mask Clip Value** are discarded.

```
Mask Value < Clip Value → Pixel Discarded
Mask Value ≥ Clip Value → Pixel Rendered
```

---

## Shading Model

Defines the Bidirectional Reflectance Distribution Function (BRDF) for lighting calculations.

| Model | Use Case | Special Inputs |
|-------|----------|----------------|
| **Default Lit** | Standard PBR surfaces | Base Color, Metallic, Roughness |
| **Unlit** | Self-illuminated, no lighting | Emissive only |
| **Subsurface** | Wax, jade, ice (light scattering) | Subsurface Color |
| **Preintegrated Skin** | Low-cost skin shader | — |
| **Subsurface Profile** | Realistic human skin | Subsurface Profile asset |
| **Clear Coat** | Car paint, carbon fiber | Clear Coat, Clear Coat Roughness |
| **Two Sided Foliage** | Leaves, petals (backlit) | Subsurface Color |
| **Hair** | Anisotropic hair strands | Tangent, Backlit |
| **Cloth** | Velvet, fabric sheen | Fuzz Color, Cloth |
| **Eye** | Cornea + iris refraction | — |
| **Single Layer Water** | Opaque water with refraction | — |
| **Thin Translucent** | Colored transparency + specular | — |

> [!TIP]
> Single Layer Water renders opaque water that appears transparent—handles refraction, absorption, and scattering in one pass.

---

## Translucency Properties

For Translucent blend mode materials.

### Lighting Mode

| Mode | Quality | Performance |
|------|---------|-------------|
| **Volumetric NonDirectional** | Lowest | Best |
| **Volumetric Directional** | Medium | Medium |
| **Surface Forward Shading** | Highest (specular reflections) | Most expensive |

---

## Advanced Properties

| Property | Description |
|----------|-------------|
| **Two Sided** | Render mesh front and back faces |
| **Dithered LOD Transition** | Stippled fade pattern for LOD switches |
| **Opacity Mask Clip Value** | Threshold for Masked mode (default 0.5) |

---

## Usage Flags

Checkboxes that force shader permutation generation for specific systems:

- Used with Skeletal Mesh
- Used with Niagara Particles
- Used with Spline Mesh
- Used with Geometry Cache
- Used with Virtual Heightfield Mesh

> [!CAUTION]
> Enabling unnecessary flags bloats shader cache and compile times. Only check what you actually need.

---

## Next Steps

Continue to [The Main Material Node](./06-main-material-node.md) to learn about PBR inputs and physics-based rendering.
