# The Main Material Node: Physically Based Rendering Inputs

The Main Material Node is the terminus of the material graph. In Legacy workflow, it contains all potential inputs. Input availability (active white pins vs. disabled grey pins) is determined by Blend Mode and Shading Model in the Details Panel.

---

## Standard Surface Inputs

### Base Color (Vector3)

**Defines the Diffuse Albedo of the surface.**

| Aspect | Description |
|--------|-------------|
| **Physics** | Wavelengths of light reflected diffusely |
| **For Dielectrics** | The actual color of the object |
| **For Metals** | The tint of specular reflection |
| **Value Range** | Strictly 0.0 – 1.0 |

> [!WARNING]
> Values below 0.02 are unrealistic (vanta black). Values of 1.0 are physically impossible—no surface reflects 100% of light.

---

### Metallic (Scalar)

**Defines surface conductivity as a binary switch.**

| Value | Behavior | Diffuse | Specular |
|-------|----------|---------|----------|
| **0.0** | Dielectric (plastic, wood) | Full color | ~4% white |
| **1.0** | Conductor (metal) | None (black) | High, tinted by Base Color |

> [!IMPORTANT]
> Gray values between 0 and 1 are generally physically invalid except for transitions (corroded metal) or anti-aliasing.

---

### Specular (Scalar)

**Controls Fresnel Reflectance at Normal Incidence (F0) for non-metals.**

| Property | Value |
|----------|-------|
| **Default** | 0.5 |
| **Mapping** | 0.5 → 4% reflectance |

**Specular Values for Common Materials:**

| Material | Value |
|----------|-------|
| Most surfaces (plastic, glass, water) | 0.5 |
| Gemstones | 0.8 |
| Ice | 0.3 |

> [!TIP]
> This slot should rarely be textured—mainly used for micro-occlusion (cavity maps) or non-standard refraction indices. Has no effect on metals.

---

### Roughness (Scalar)

**The most critical input for surface definition—describes microscopic irregularity.**

| Value | Effect |
|-------|--------|
| **0.0** | Smooth → Mirror-like reflection |
| **1.0** | Rough → Matte, blurry reflection |

> [!NOTE]
> Roughness is perceptually linear but mathematically non-linear in scattering. Use roughness maps to tell the story of wear and use.

---

### Emissive Color (Vector3)

**Defines light emitted by the surface.**

| Property | Description |
|----------|-------------|
| **HDR Support** | Accepts values > 1.0 |
| **Bloom Trigger** | Values > 1.0 create glow halos |
| **Lumen GI** | High emissive can bounce light to static objects |

---

### Normal (Vector3)

**Tangent-space normal map for per-pixel surface perturbation.**

| Channel | Purpose |
|---------|---------|
| **R (Red)** | X-axis slope |
| **G (Green)** | Y-axis slope |
| **B (Blue)** | Z-up vector |

> [!NOTE]
> The engine expects Tangent Space normals (blue-purple appearance). Creates illusion of bumps and grooves without geometry changes.

---

## Advanced and Model-Specific Inputs

### World Position Offset (WPO)

**Manipulates vertex positions in World Space via Vertex Shader.**

| Usage | Examples |
|-------|----------|
| Vertex animation | Grass swaying, pulsating matter |
| Inflation effects | Object scaling per-vertex |

> [!CAUTION]
> Moving vertices outside original bounding box can cause culling issues. Increase **Bounds Scale** on the mesh to fix.

---

### Ambient Occlusion (Scalar)

**Simulates large-scale occlusion in crevices.**

With Lumen, mainly serves as a **Specular Occluder**—dims reflections in cracks to prevent unrealistic shine.

---

### Pixel Depth Offset (PDO)

**Artificially pushes pixel deeper into Depth Buffer.**

Used for **soft blending**—rocks blending into landscape terrain without harsh intersection lines.

---

### Anisotropy and Tangent

**For brushed metal effects (frying pan bottom, brushed aluminum).**

| Input | Purpose |
|-------|---------|
| **Anisotropy** | Range -1.0 to 1.0, stretches specular highlight |
| **Tangent** | Direction vector of the brushing |

---

### Opacity Inputs

| Input | Blend Mode | Behavior |
|-------|------------|----------|
| **Opacity** | Translucent | 0.0 = Invisible, 1.0 = Opaque |
| **Opacity Mask** | Masked | Binary clip against threshold |

---

### Refraction

**Bends light rays through Translucent materials.**

| Material | Index |
|----------|-------|
| Air | 1.0 (no bending) |
| Water | 1.33 |
| Glass | 1.52 |
| Diamond | 2.42 |

---

## Next Steps

Continue to [The Material Graph Panel](./07-material-graph-panel.md) to learn about visual scripting and node connections.
