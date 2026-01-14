# The Material Graph Panel: Visual Scripting Logic

The Material Graph is the canvas where shader logic is constructed—a node-based flow chart where data flows from left (inputs) to right (outputs).

---

## Visual Coding Standards

The editor uses strict color-coding for connector pins to denote data types, **preventing invalid mathematical operations**.

### Pin Color Legend

| Color | Type | Description | Example |
|-------|------|-------------|---------|
| ⚪ **White** | Execution | Flow control | Rare in materials |
| 🟢 **Light Green** | Scalar (float) | Single number | Roughness, Opacity |
| 🟢 **Green** | Vector2 (float2) | Two numbers | UV Coordinates |
| 🟡 **Yellow** | Vector3 (float3) | Three numbers | RGB Color, Normal |
| 🔴 **Pink/Red** | Vector4 (float4) | Four numbers | RGBA Color |
| 🔴 **Red** | Bool | True/False | Static Switch |
| 🔵 **Blue** | Texture Object | Texture asset | Texture Sample input |

> [!IMPORTANT]
> You cannot connect incompatible types directly. Use conversion nodes (Append, ComponentMask) to transform data.

---

## Automatic Type Coercion

Some connections handle implicit conversion:

| Source | Target | Behavior |
|--------|--------|----------|
| float | float3 | Value copied to all channels (X,X,X) |
| float3 | float4 | Alpha set to 1.0 |
| float4 | float3 | Alpha channel discarded |

---

## Navigation Hotkeys

Speed is essential in shader authoring. The editor supports **"spawn on click"** hotkeys.

### Spawnable Hotkeys

Hold key + Left-Click to spawn node:

| Key | Node Type |
|-----|-----------|
| `1` | Scalar Constant (Float) |
| `2` | Constant2Vector |
| `3` | Constant3Vector (Color) |
| `T` | Texture Sample |
| `L` | Linear Interpolate (Lerp) |
| `M` | Multiply |
| `A` | Add |
| `D` | Divide |
| `S` | Scalar Parameter |
| `V` | Vector Parameter |
| `C` | Comment |

---

## General Navigation

| Action | Control |
|--------|---------|
| **Pan** | Middle Mouse / Right Mouse + Drag |
| **Zoom** | Mouse Wheel |
| **Select** | Left-Click |
| **Multi-Select** | Ctrl + Click / Marquee Drag |
| **Delete** | Delete or Backspace |
| **Duplicate** | Ctrl + W |
| **Copy** | Ctrl + C |
| **Paste** | Ctrl + V |

---

## Wire Management

| Action | Control |
|--------|---------|
| **Connect** | Drag from output pin to input pin |
| **Break Link** | Alt + Click on pin |
| **Reroute** | Double-click on wire |
| **Move Connection** | Ctrl + Drag on connected pin |

---

## Best Practices

### Organization

1. **Comment nodes** group related logic (Ctrl + C while selecting nodes)
2. **Reroute nodes** keep wires clean and readable
3. **Consistent flow** left-to-right improves readability

### Performance

1. **Avoid texture sample** in branches
2. **Pre-compute constants** where possible
3. **Use parameters** instead of duplicating constant nodes

---

## Next Steps

Continue to [The Palette Panel](./08-palette-panel.md) to learn about the node repository and discovery.
