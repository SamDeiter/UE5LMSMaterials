# Substrate Material Framework: Overview

> **UE5.1+ Feature** — Substrate replaces the legacy Shading Model system with a modular, physics-based material composition framework.

---

## Executive Summary

The transition to Physically Based Rendering (PBR) in the early 2010s standardized light-matter interaction through energy-conserving bidirectional scattering distribution functions (BSDFs). For over a decade, Unreal Engine 4 relied on a **Shading Model** paradigm—a rigid system where surfaces were categorized into discrete, mutually exclusive mathematical models such as "Default Lit," "Clear Coat," or "Subsurface."

**Substrate** (formerly known as *Strata*) is a ground-up reimagining of this pipeline. It abandons the monolithic "Uber-Shader" approach in favor of a **modular, graph-based framework** where materials are composed of "Slabs of Matter."

---

## The Legacy Problem: Why Change Was Needed

### The G-Buffer Bottleneck

In traditional deferred rendering, the **G-Buffer** (Geometric Buffer) stores surface attributes in screen-space textures—typically 4-5 RGBA textures with a fixed memory footprint (128-160 bits per pixel).

| Shading Model | G-Buffer Usage |
|---------------|----------------|
| Default Lit | Standard packing for dielectric/metallic surfaces |
| Clear Coat | Requires second normal + second roughness (repurposes other channels) |
| Subsurface | Reallocates Opacity channel for Subsurface Color |

**The Problem:** Shading Models were **mutually exclusive** because they competed for the same memory bits.

> **Example:** If you needed both anisotropic metal properties (requires tangent vector storage) AND a clear coat (requires second normal), the legacy G-Buffer simply ran out of channels.

This forced artists to:

- Choose between optical phenomena rather than combining them
- Modify engine source code for custom shading models
- Resort to visual hacks that broke physical energy conservation

---

## The Substrate Solution: Three Pillars

### 1. Modularity

A material is not a single equation selected from a dropdown—it's a **graph of elemental building blocks** called **Slabs**.

```
Varnished Wood = 
    Diffuse Slab (wood texture)
    + Vertical Layer →
    Dielectric Interface Slab (varnish coating)
```

### 2. Expressiveness

By removing hard-coded shading model limits, Substrate enables:

- Accurate blending between discrete surface types within a single pixel
- Transitions from rough porous stone to smooth metallic liquid without artifacts
- Gonio-chromatic materials (color shift at grazing angles) like iridescent paint

### 3. Unified Lighting Pipeline

All material graphs compile to a stream of **Closures** (rendering operations). This unifies:

- **Rasterization** (standard deferred/forward rendering)
- **Hardware Ray Tracing** (Lumen reflections/GI)
- **Path Tracing** (cinematic offline rendering)

A material looks visually consistent regardless of the rendering method.

---

## Key Terminology

| Term | Definition |
|------|------------|
| **Slab** | The atomic unit of Substrate—a physical layer with Interface and Medium properties |
| **Interface** | The surface boundary where light reflects/refracts (governed by Fresnel equations) |
| **Medium** | The volumetric interior where light scatters/absorbs (governed by Mean Free Path) |
| **Closure** | A compiled data structure representing a single light interaction element |
| **Vertical Layer** | Operator that stacks Slabs (coating on top of substrate) |
| **Horizontal Blend** | Operator that mixes Slabs side-by-side (partitions pixel area) |

---

## Prerequisites

Before studying Substrate, ensure familiarity with:

- [ ] Physically Based Rendering (PBR) fundamentals
- [ ] Energy conservation in shading
- [ ] Fresnel effect and microfacet theory
- [ ] Legacy UE5 shading models (Default Lit, Clear Coat, Subsurface)
- [ ] G-Buffer architecture in deferred rendering

---

## Next Steps

| Document | Topic |
|----------|-------|
| [02-slab-architecture.md](./02-slab-architecture.md) | Deep dive into Slab BSDF anatomy |
| [03-graph-topology.md](./03-graph-topology.md) | Vertical and Horizontal operators |
| [04-gbuffer-closures.md](./04-gbuffer-closures.md) | Adaptive rendering and memory management |
| [05-production-workflows.md](./05-production-workflows.md) | Migration and authoring guide |
| [06-advanced-features.md](./06-advanced-features.md) | Glints, Fuzz, mobile scaling |
| [07-quick-reference.md](./07-quick-reference.md) | Tables and CVar reference |
