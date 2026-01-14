# The Viewport Panel: Visual Validation and Previewing

The Viewport Panel acts as the artist's immediate feedback mechanism, rendering the compiled shader on a preview mesh within a controlled lighting environment. It is fully interactive, allowing rotation, panning, and zooming to inspect surface response from all angles.

---

## Preview Mesh Selection

The toolbar within the Viewport allows selection of the geometric primitive used for previewing. **Choice of mesh is critical for validating specific material properties.**

| Mesh | Best For |
|------|----------|
| **Sphere** | Checking highlight continuity, reflections |
| **Plane** | Tiling patterns, UV alignment |
| **Cube** | UV wrapping at hard 90° edges |
| **Cylinder** | Cylindrical mapping, wrap-around effects |
| **Custom Mesh** 🫖 | Specific topology (characters, weapons, architecture) |

> [!TIP]
> Use Custom Mesh when designing materials for specific topology—UV-unwrapped character faces, architectural trim sheets, or weapon models.

---

## Viewport Control Options

| Option | Function |
|--------|----------|
| **Realtime** ⏱️ | Toggle continuous rendering |
| **Field of View** | Adjust camera focal length |
| **Post Processing** | Toggle Bloom, Tone Mapping, TAA |

### Realtime Toggle

When disabled, the viewport only updates when the mouse moves or properties change. Useful for saving GPU resources.

### Field of View (FOV)

Adjust for wide-angle or telephoto inspection of surface details:

- **Low FOV (30°)**: Telephoto, minimal distortion
- **High FOV (90°)**: Wide-angle, shows more context

### Post Processing Toggle

> [!TIP]
> Disable the **Tone Mapper** to see raw linear shader values without the ACES filmic curve compressing dynamic range. Essential for technical validation.

---

## View Modes

These modes change how the material is rendered, facilitating debugging and performance analysis.

| Mode | Description |
|------|-------------|
| **Lit** | Standard rendering with full lighting and shading |
| **Unlit** | Base Color + Emissive only, no lighting |
| **Wireframe** | Mesh topology visualization |
| **Shader Complexity** | Performance heat-map |

### Shader Complexity

A critical optimization view using a heat-map color spectrum:

```
🟢 Green   → Low instruction count (highly performant)
🟡 Yellow  → Moderate cost
🔴 Red     → High instruction count (expensive)
⚪ White   → Extremely expensive (potential bottleneck)
```

> [!WARNING]
> White areas indicate excessive overdraw or heavy math operations requiring immediate optimization.

---

## Show Flags

Control visibility of auxiliary viewport elements.

| Flag | Description |
|------|-------------|
| **Grid** | Toggle floor grid |
| **Background** | Toggle skybox/environment |
| **Instruction Count** | Overlay showing vertex/pixel shader instruction counts |

---

## Viewport Interactions

| Action | Controls |
|--------|----------|
| **Rotate Camera** | Left Mouse Button + Drag |
| **Pan** | Middle Mouse Button + Drag |
| **Zoom** | Mouse Wheel |
| **Rotate Light** | `L` + Left Mouse Drag |

> [!TIP]
> Hold `L` and drag to rotate the lighting environment independently—test how your material responds to different light angles.

---

## Next Steps

Continue to [The Details Panel](./05-details-panel.md) to learn about compilation configuration and material properties.
