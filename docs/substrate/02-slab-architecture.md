# Substrate Slab Architecture

> The **Substrate Slab BSDF** is the fundamental atomic unit of Substrate materials. Unlike the legacy "Main Node" which served as a catch-all input collector, the Slab is designed around a strictly physical model of light interaction.

---

## Two Domains of Light Interaction

A Slab separates behavior into two distinct physical domains:

```
┌─────────────────────────────────────────┐
│              INTERFACE                  │  ← Surface boundary
│  (Fresnel reflection/refraction)        │     Light enters or reflects here
├─────────────────────────────────────────┤
│               MEDIUM                    │  ← Volumetric interior
│  (Scattering & absorption)              │     Light travels through matter
└─────────────────────────────────────────┘
```

---

## Part 1: The Interface (Surface Reflection)

The Interface represents the boundary where light transitions from the exterior environment (typically air) into the material. Physics at this boundary are governed by the **Fresnel equations** and **microfacet theory**.

### 1.1 Explicit Fresnel Controls: F0 and F90

In the legacy "Metalness" workflow, the Fresnel effect was largely automated. Substrate exposes the raw terms:

| Parameter | Description | Typical Values |
|-----------|-------------|----------------|
| **F0** | Reflectance at 0° (perpendicular view) | Dielectrics: 0.02-0.05 (grey)<br>Metals: 0.5-1.0 (colored) |
| **F90** | Reflectance at 90° (grazing angle) | Legacy: locked to 1.0<br>Substrate: fully controllable |

#### Why F90 Matters

**Legacy Behavior:** The Schlick approximation assumed F90 = 1.0 (pure white) for all surfaces—100% reflection at the horizon.

**Substrate Capability:** Artists can now:

- Create **gonio-chromatic materials** (color shifts at grazing angles) like iridescent automotive paints or beetle shells
- Simulate "dusty" or "oxidized" surfaces where grazing reflection is dulled

```javascript
// Iridescent paint example
F0: [0.04, 0.06, 0.08]   // Slight blue tint at perpendicular
F90: [1.0, 0.7, 0.4]     // Shifts to warm orange at grazing
```

### 1.2 Roughness and Anisotropy

| Parameter | Range | Description |
|-----------|-------|-------------|
| **Roughness** | 0.0 - 1.0 | 0.0 = perfect mirror, 1.0 = fully matte |
| **Anisotropy** | -1.0 to 1.0 | Stretches specular highlight along tangent direction |

> **Key Change:** In legacy UE, Anisotropy was a special shading model. In Substrate, **any Slab can be anisotropic** without restrictions.

**Anisotropy Use Cases:**

- Brushed aluminum (directional polish marks)
- Hair and fur
- Woven fabric
- Carbon fiber

### 1.3 The Metalness Helper Node

For artists accustomed to the single "Metallic" slider, Substrate provides:

**`Substrate Metalness-To-DiffuseAlbedo-F0`**

| Input | Description |
|-------|-------------|
| Base Color | Legacy combined color |
| Metallic | 0.0 - 1.0 slider |
| Specular | 0.0 - 1.0 slider |

| Output | When Metallic = 0 | When Metallic = 1 |
|--------|-------------------|-------------------|
| **Diffuse Albedo** | Base Color | Black (metals have no diffuse) |
| **F0** | Derived dielectric value | Base Color (metals have colored specular) |

> **Insight:** This reveals that "Metalness" was never a physical property—it was a **data compression workflow** designed to save G-Buffer channels by packing diffuse and specular color into one texture.

---

## Part 2: The Medium (Volumetric Transmission)

Once light passes through the Interface (refraction), it enters the Medium. In legacy UE, volumetric behavior was split across disjointed implementations. Substrate unifies everything under **Mean Free Path (MFP)** logic.

### 2.1 Mean Free Path (MFP)

MFP is the average distance a photon travels through a medium before interacting with a particle.

| MFP Value | Visual Result | Examples |
|-----------|---------------|----------|
| **High** | Translucent, waxy appearance | Jade, Skin, Wax, Milk |
| **Low** | Solid, opaque appearance | Stone, Plastic, Wood |

#### MFP Color: Wavelength-Dependent Scattering

The MFP input is a **Vector3 (RGB)**. Different wavelengths can have different mean free paths:

```javascript
// Human skin example
MFP_Color: {
  R: 3.0,   // Red light penetrates deepest
  G: 1.5,   // Green scatters sooner
  B: 0.5    // Blue scatters almost immediately
}
```

This creates the characteristic **reddish subsurface glow** of skin without needing a separate "Subsurface Color" texture.

### 2.2 Transmittance vs Coverage

Substrate decouples what legacy "Alpha/Opacity" conflated:

| Property | Definition | Example |
|----------|------------|---------|
| **Coverage** | Physical presence of matter | Ghost: 0.5 (partially there) |
| | 0.0 = hole in geometry | Foliage: masked alpha |
| | 1.0 = solid surface | |
| **Transmittance** | Optical transparency | Glass: 1.0 (light passes through) |
| | 0.0 = light blocked | Window: clear or tinted |
| | 1.0 = light passes | |

> **Why This Matters:** A ghost character (Coverage 0.5) and a glass window (Coverage 1.0, Transmittance 1.0) now sort and render correctly for depth, motion vectors, and post-processing.

### 2.3 Sub-Surface Types

Full volumetric path tracing is expensive. The Slab offers approximation techniques:

| Type | Performance | Use Case |
|------|-------------|----------|
| **Wrap** | Cheap | Foliage, canvas, paper |
| **Two-Sided Wrap** | Cheap | Thin translucent sheets |
| **Diffusion** | Expensive | High-fidelity skin rendering |
| **Simple Volume** | Medium | Colored glass, liquids (Beer-Lambert law) |

---

## Complete Slab Pin Reference

### Interface Inputs

| Pin | Type | Required | Description |
|-----|------|----------|-------------|
| Diffuse Albedo | Vector3 | No | Base diffuse color |
| F0 | Vector3 | No | Fresnel at 0° |
| F90 | Vector3 | No | Fresnel at 90° |
| Roughness | Float | No | Microfacet variance (default: 0.5) |
| Anisotropy | Float | No | Highlight stretch (-1 to 1, default: 0) |
| Normal | Vector3 | No | Custom normal map |
| Tangent | Vector3 | No | Required for Anisotropy |

### Medium Inputs

| Pin | Type | Required | Description |
|-----|------|----------|-------------|
| Mean Free Path | Vector3 | No | RGB subsurface depth |
| Transmittance | Vector3 | No | Optical transparency |
| Coverage | Float | No | Physical presence (default: 1.0) |
| Fuzz Amount | Float | No | Grazing-angle sheen |

### Output

| Pin | Type | Description |
|-----|------|-------------|
| Output | Substrate | Compiled Slab closure |

---

## Next: Graph Topology

Learn how to combine Slabs using [Vertical Layering and Horizontal Blending](./03-graph-topology.md).
