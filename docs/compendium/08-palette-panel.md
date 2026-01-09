# The Palette Panel: The Node Repository

The Palette Panel serves as the comprehensive library of all HLSL functions and expressions available to the material author.

---

## Organization

Nodes are organized into categories representing their mathematical or functional utility:

### Category Reference

| Category | Examples |
|----------|----------|
| **Atmosphere** | Sky atmosphere, cloud rendering |
| **Color** | Desaturation, vector math |
| **Constants** | Constant, Constant2Vector, Constant3Vector |
| **Coordinates** | TextureCoordinate (UVs), Panner, Rotator |
| **Depth** | PixelDepth, SceneDepth |
| **Math** | Add, Multiply, Sine, Cosine, Power, Clamp, Abs |
| **Parameters** | ScalarParameter, VectorParameter, StaticSwitchParameter |
| **Texture** | TextureSample, TextureObject, TextureProperty |
| **Utility** | Fresnel, Time, If, StaticSwitch |
| **Gradient** | LinearGradient, RadialGradient |
| **Landscape** | Landscape Layer Blend, Layer Sample |
| **Material Attributes** | Break/Make Material Attributes |
| **Particle** | Particle Position, Particle Color |
| **Vector Ops** | DotProduct, CrossProduct, Normalize, Transform |
| **World** | World Position, Camera Position, Actor Position |

---

## Using the Palette

### Drag and Drop

1. Locate desired node in category tree
2. Click and drag node onto the graph
3. Release to place at cursor position

### Search

The search bar at the top filters nodes by name:

- Type partial name to filter
- Results update in real-time
- Press Enter to place first result

---

## Favorites

Frequently used nodes can be added to a **Favorites** category for rapid access:

1. Right-click any node in the palette
2. Select "Add to Favorites"
3. Access from Favorites category at top of list

---

## Common Node Categories

### Constants

| Node | Output | Description |
|------|--------|-------------|
| Constant | float | Single value |
| Constant2Vector | float2 | Two values (UV-like) |
| Constant3Vector | float3 | Three values (Color) |
| Constant4Vector | float4 | Four values (RGBA) |

### Parameters

| Node | Type | Description |
|------|------|-------------|
| ScalarParameter | float | Exposed single value |
| VectorParameter | float4 | Exposed color value |
| TextureParameter | Texture | Exposed texture slot |
| StaticBoolParameter | bool | Compile-time switch |
| StaticSwitchParameter | bool | Branch shader logic |

### Math

| Node | Operation |
|------|-----------|
| Add | A + B |
| Subtract | A - B |
| Multiply | A × B |
| Divide | A ÷ B |
| Power | A^B |
| Clamp | min ≤ A ≤ max |
| Lerp | Linear interpolation |

---

## Next Steps

Continue to [The Stats Panel](./09-stats-panel.md) to learn about performance budgeting and profiling.
