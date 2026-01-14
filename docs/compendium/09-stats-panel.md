# The Stats Panel: Performance and Budgeting

The Stats Panel provides the technical reality check for the artistic vision, displaying computational cost of the shader in real-time.

---

## Key Metrics

### Instruction Counts

| Metric | Description |
|--------|-------------|
| **Base Pass Shader** | Cost of shader logic alone |
| **Base Pass + Volumetric Lightmap** | Cost including lighting overhead |

### Shader Stage Costs

| Stage | Bottleneck Area |
|-------|-----------------|
| **Vertex Shader Instructions** | Geometry processing (WPO, UV math) |
| **Pixel Shader Instructions** | GPU fill rate (most common bottleneck) |

> [!WARNING]
> High pixel shader instruction counts bottleneck fill rate—the most common performance issue for materials.

---

## Texture Samplers

| Metric | Value |
|--------|-------|
| **Standard Limit** | 16 unique texture slots |
| **Extended Limit** | 128 (with Shared: Wrap) |

### Exceeding Sampler Limits

If you exceed 16 samplers:

1. Shader fails to compile
2. **Fix**: Set `Sampler Source` on texture nodes to "Shared: Wrap"
3. Uses virtual texture array logic to extend limit to 128

---

## Platform Budgets

### Mobile (ARM Mali/Adreno)

| Budget | Vertex | Pixel |
|--------|--------|-------|
| Low | < 50 | < 100 |
| Medium | 50-100 | 100-200 |
| High | 100+ | 200+ (problematic) |

### Console/PC

| Budget | Vertex | Pixel |
|--------|--------|-------|
| Low | < 100 | < 200 |
| Medium | 100-200 | 200-400 |
| High | 200+ | 400+ |

---

## Platform Stats Window

Unlike the basic Stats panel, **Platform Stats** shows metrics for multiple platforms simultaneously:

| Platform | API |
|----------|-----|
| Windows PC | D3D SM5 |
| Android | Vulkan / OpenGL ES 3.1 |
| iOS | Metal |
| PlayStation | GNM |
| Xbox | D3D12 |

> [!IMPORTANT]
> Essential for multi-platform development to ensure materials don't break mobile budgets.

---

## Mali Offline Compiler Integration

For accurate ARM Mali GPU cycle counts:

1. Install Mali Offline Compiler
2. Configure path in **Edit → Editor Preferences**
3. Platform Stats will show accurate Mali metrics

---

## Optimization Strategies

### Reduce Instruction Count

| Strategy | Savings |
|----------|---------|
| Precompute constants | Removes runtime math |
| Use lookup textures | Replaces complex math |
| Simplify branches | Reduces divergence |
| Lower texture resolution | Reduces bandwidth |

### Reduce Texture Samples

| Strategy | Method |
|----------|--------|
| Channel packing | RGB roughness/metal/AO |
| Texture atlases | Combine multiple textures |
| Virtual textures | Streaming optimization |

---

## Next Steps

Continue to [The Substrate Framework](./10-substrate-framework.md) to learn about UE5's experimental layered material system.
