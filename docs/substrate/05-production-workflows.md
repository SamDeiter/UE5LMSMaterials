# Production Workflows and Migration

> Adopting Substrate requires a shift in the mental model of Technical Artists and a careful migration strategy for existing projects.

---

## The Migration Path

### One-Way Conversion

When Substrate is enabled via **Project Settings > Rendering > Substrate**, the engine automatically converts all existing Materials to Substrate Materials.

> ⚠️ **Critical Warning:** This conversion is **irreversible** for asset files.

| Action | Result |
|--------|--------|
| Enable Substrate | All materials auto-convert |
| Save converted material | Cannot reopen in non-Substrate engine |
| Migrate to legacy project | Material fails to compile (renders black) |

**Recommendation:** Fork your project before testing Substrate if you need to maintain legacy compatibility.

### The Legacy Conversion Node

Converted materials are **not rewritten from scratch**. Instead, they're wrapped in a special node:

```
┌─────────────────────────────────────────┐
│     Substrate Legacy Conversion         │
├─────────────────────────────────────────┤
│ BaseColor ──────────────►               │
│ Metallic ───────────────►    [Internal  │
│ Specular ───────────────►     Slab      │
│ Roughness ──────────────►     Mapping]  │
│ Normal ─────────────────►               │
│ ... (all legacy inputs) ►               │
└─────────────────────────────────────────┘
                 │
                 ▼
           Substrate Output
```

This ensures **1:1 visual compatibility** for most existing assets without manual rework.

---

## Authoring Mindset: From Slots to Matter

The most significant change for artists is the loss of the "Shading Model" dropdown.

### Legacy Workflow

1. Open Details Panel
2. Select Shading Model: "Clear Coat"
3. New slots appear: Clear Coat, Clear Coat Roughness, etc.
4. Plug in textures

### Substrate Workflow

1. **Think about the physics first**
2. Build the material graph based on real-world matter

#### Example: Clear Coat

```
// Don't look for "Clear Coat" shading model
// Instead, BUILD the physics:

Base Slab ─────────────► Vertical Layer ──► Output
                              ▲
Coating Slab ─────────────────┘

// Base Slab properties:
   DiffuseAlbedo: car paint color
   Roughness: 0.4
   F0: paint reflectance

// Coating Slab properties:
   Roughness: 0.02 (very smooth)
   F0: [0.04, 0.04, 0.04] (dielectric)
   Transmittance: [1, 1, 1] (clear)
```

#### Example: Glass

```
// Not "Translucent" blend mode with tricks
// Just a Slab with the right properties:

Glass Slab:
   Coverage: 1.0        // Physical geometry exists
   Transmittance: 1.0   // Light passes through
   Roughness: 0.0       // Clear (or >0 for frosted)
   MFP Color: tint      // For colored glass
```

#### Example: Unlit Emissive

```
// Use Substrate Unlit BSDF instead of legacy Unlit

Unlit BSDF:
   EmissiveColor: glow color
   Transmittance: partial  // For stained-glass effect
   Coverage: 1.0
```

---

## Material Graph Comparison

### Legacy: Limited Combinations

```
┌──────────────┐        ┌──────────────┐
│ Shading      │        │ Main         │
│ Model:       │───────►│ Material     │
│ Clear Coat   │        │ Node         │
└──────────────┘        └──────────────┘
        │
        └── Can't combine with Subsurface
        └── Can't add Anisotropy
        └── Fixed second layer properties
```

### Substrate: Composable Physics

```
┌─────────────┐
│ Skin Slab   │──┐
│ (Diffusion) │  │
└─────────────┘  │     ┌────────────┐
                 ├────►│ Horizontal │
┌─────────────┐  │     │ Blend      │──────► Output
│ Metal Slab  │──┘     └────────────┘
│(Anisotropic)│              ▲
└─────────────┘              │
                             │
┌─────────────┐    ┌─────────────┐
│ Clear Coat  │───►│  Vertical   │
│ Slab        │    │  Layer      │
└─────────────┘    └─────────────┘
```

---

## Debugging and Profiling

### View Modes

| View Mode | Purpose | Console Command |
|-----------|---------|-----------------|
| Closure Count | Visualize closures per pixel | `ShowFlag.VisualizeSubstrateClosureCount 1` |
| Material Complexity | Updated for Substrate graphs | Standard view mode |
| G-Buffer Visualization | Show raw stored data | `ShowFlag.VisualizeGBuffer 1` |

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Magenta checkerboard | G-Buffer overflow | Increase `BytesPerPixel` or simplify material |
| Unexpected averaging | Blendable mode simplification | Switch to Adaptive (if platform supports) |
| Dark spots | Missing coverage/transmittance | Check Slab defaults |
| Wrong grazing reflection | F90 incorrectly set | Verify F90 values |

---

## LOD and Scalability

### Hero Asset Strategy

1. **LOD0 (Close-up):** Full Substrate complexity
   - Multiple vertical layers
   - High-resolution textures
   - Full MFP subsurface

2. **LOD1 (Medium):** Reduced layers
   - Merge similar Slabs
   - Parameter-blended approximations

3. **LOD2 (Distance):** Single Slab
   - Baked lighting approximation
   - Minimal closure count

### Mobile Scaling

Substrate on mobile operates under "Substrate Lite":

| Limitation | Reason |
|------------|--------|
| Single closure enforced | Tile memory constraints |
| No Diffusion SSS | Bandwidth cost too high |
| Blendable path only | No UAV support on most mobile GPUs |

---

## Migration Checklist

### Before Enabling Substrate

- [ ] Create project backup/fork
- [ ] Document custom shading models in use
- [ ] Identify hero materials requiring manual conversion
- [ ] Test on target platforms

### After Enabling

- [ ] Verify auto-converted materials visually match
- [ ] Convert hero materials to native Substrate graphs
- [ ] Profile with Closure Count view
- [ ] Test memory usage on min-spec hardware
- [ ] Update material documentation

### Rollback Plan

> You cannot roll back converted materials. Plan accordingly:

1. Maintain legacy branch of project
2. Export legacy materials before conversion (for reference)
3. Use source control to isolate Substrate work

---

## Best Practices Summary

| Practice | Benefit |
|----------|---------|
| Build materials from physics, not presets | Future-proof, accurate results |
| Use helper nodes for Metalness workflow | Easier artist transition |
| Profile closure count early | Avoid late-stage optimization |
| Create LOD material variants | Scalability across hardware |
| Document material intent | Team knowledge preservation |

---

## Next: Advanced Features

Explore cutting-edge capabilities in [Advanced Features](./06-advanced-features.md).
