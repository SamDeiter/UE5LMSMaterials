# UE5 Material Knowledge Testing Plan

This plan outlines a series of interactive tasks designed to test a user's understanding of Unreal Engine 5 Materials using the Material Editor Replica tool.

## Level 1: PBR Fundamentals

**Objective:** Verify understanding of Physically Based Rendering inputs and basic material setup.

### Task 1.1: Solid Color Material
*   **Description:** Create a simple red material using PBR principles.
*   **Requirements:**
    1.  Add a `Constant3Vector` node.
    2.  Set the color to red (1.0, 0.0, 0.0).
    3.  Connect it to the `Base Color` input on the Main Material Node.
*   **Validation:** Check for Constant3Vector node presence and connection to Base Color.

### Task 1.2: Metal Surface
*   **Description:** Create a polished gold metal material.
*   **Requirements:**
    1.  Add a `Constant3Vector` node with gold color (1.0, 0.84, 0.0).
    2.  Connect it to `Base Color`.
    3.  Add a `Constant` node set to `1.0`.
    4.  Connect it to `Metallic`.
    5.  Add another `Constant` node set to `0.2` (smooth surface).
    6.  Connect it to `Roughness`.
*   **Validation:** Check for correct values and connections to Base Color, Metallic, and Roughness.

### Task 1.3: Rough Plastic
*   **Description:** Create a matte blue plastic material.
*   **Requirements:**
    1.  Set `Base Color` to blue (0.1, 0.2, 0.8).
    2.  Set `Metallic` to `0.0` (non-metal).
    3.  Set `Roughness` to `0.8` (rough surface).
*   **Validation:** Check for correct PBR values for a dielectric surface.

---

## Level 2: Texture Sampling

**Objective:** Test knowledge of texture sampling and UV coordinates.

### Task 2.1: Basic Texture Application
*   **Description:** Apply a texture to a material's Base Color.
*   **Requirements:**
    1.  Add a `TextureSample` node.
    2.  Connect the `RGB` output to `Base Color`.
*   **Validation:** Check for TextureSample connected to Base Color.

### Task 2.2: UV Tiling
*   **Description:** Tile a texture to repeat 4 times across the surface.
*   **Requirements:**
    1.  Add a `TextureCoordinate` node.
    2.  Add a `Multiply` node.
    3.  Connect `TextureCoordinate` to `Multiply` input A.
    4.  Add a `Constant` node with value `4.0` to `Multiply` input B.
    5.  Connect `Multiply` output to the `UVs` input of a `TextureSample` node.
*   **Validation:** Check for Multiply node between TextureCoordinate and TextureSample UV input.

### Task 2.3: Normal Map Setup
*   **Description:** Apply a normal map to add surface detail.
*   **Requirements:**
    1.  Add a `TextureSample` node (for normal map).
    2.  Connect the `RGB` output to the `Normal` input on the Main Material Node.
*   **Validation:** Check for TextureSample connected to Normal input.

---

## Level 3: Math Operations

**Objective:** Test arithmetic operations and value manipulation.

### Task 3.1: Lerp Between Colors
*   **Description:** Blend between two colors using Linear Interpolate.
*   **Requirements:**
    1.  Add two `Constant3Vector` nodes (red and blue).
    2.  Add a `Lerp` node.
    3.  Connect red to `A` input.
    4.  Connect blue to `B` input.
    5.  Add a `Constant` node with value `0.5` to `Alpha`.
    6.  Connect `Lerp` output to `Base Color`.
*   **Validation:** Check for Lerp node with correct inputs connected to Base Color.

### Task 3.2: Brightness Adjustment
*   **Description:** Multiply a texture's brightness by a scalar value.
*   **Requirements:**
    1.  Add a `TextureSample` node.
    2.  Add a `Multiply` node.
    3.  Connect texture `RGB` to `Multiply` input A.
    4.  Add a `Constant` node with value `2.0` to `Multiply` input B.
    5.  Connect `Multiply` output to `Base Color`.
*   **Validation:** Check for Multiply node between TextureSample and Base Color.

### Task 3.3: Power (Gamma) Adjustment
*   **Description:** Adjust the contrast of a texture using Power.
*   **Requirements:**
    1.  Add a `TextureSample` node.
    2.  Add a `Power` node.
    3.  Connect texture `RGB` to `Power` Base input.
    4.  Set exponent to `2.2` (gamma correction).
    5.  Connect `Power` output to `Base Color`.
*   **Validation:** Check for Power node in the chain.

---

## Level 4: Parameters

**Objective:** Test understanding of material parameters for runtime modification.

### Task 4.1: Scalar Parameter
*   **Description:** Create a material with an adjustable roughness parameter.
*   **Requirements:**
    1.  Add a `ScalarParameter` node.
    2.  Name it "Roughness".
    3.  Set default value to `0.5`.
    4.  Connect it to the `Roughness` input.
*   **Validation:** Check for ScalarParameter named "Roughness" connected to Roughness input.

### Task 4.2: Vector Parameter
*   **Description:** Create a material with an adjustable base color parameter.
*   **Requirements:**
    1.  Add a `VectorParameter` node.
    2.  Name it "BaseColor".
    3.  Set default to white (1.0, 1.0, 1.0).
    4.  Connect it to the `Base Color` input.
*   **Validation:** Check for VectorParameter connected to Base Color.

### Task 4.3: Texture Parameter
*   **Description:** Create a material with a swappable texture.
*   **Requirements:**
    1.  Add a `TextureSampleParameter` node.
    2.  Name it "DiffuseMap".
    3.  Connect `RGB` output to `Base Color`.
*   **Validation:** Check for TextureSampleParameter connected to Base Color.

---

## Level 5: Advanced Techniques

**Objective:** Test advanced material concepts including emissive, opacity, and world position offset.

### Task 5.1: Emissive Glow
*   **Description:** Create a glowing material using Emissive Color.
*   **Requirements:**
    1.  Add a `Constant3Vector` with a bright color (e.g., cyan: 0, 1, 1).
    2.  Add a `Multiply` node.
    3.  Multiply the color by a `Constant` value of `10.0` (HDR intensity).
    4.  Connect to `Emissive Color` input.
*   **Validation:** Check for value > 1.0 going into Emissive Color.

### Task 5.2: Simple Opacity Mask
*   **Description:** Create a masked material using a texture's alpha channel.
*   **Requirements:**
    1.  Set Blend Mode to `Masked` in Details Panel.
    2.  Add a `TextureSample` node.
    3.  Connect texture `Alpha` output to `Opacity Mask` input.
    4.  Set `Opacity Mask Clip Value` to `0.5`.
*   **Validation:** Check for Blend Mode = Masked and texture alpha connected to Opacity Mask.

### Task 5.3: Fresnel Effect
*   **Description:** Add rim lighting using the Fresnel node.
*   **Requirements:**
    1.  Add a `Fresnel` node.
    2.  Add a `Lerp` node.
    3.  Connect a base color to `A`.
    4.  Connect a rim color to `B`.
    5.  Connect `Fresnel` output to `Alpha`.
    6.  Connect `Lerp` output to `Base Color`.
*   **Validation:** Check for Fresnel node connected to Lerp Alpha.

---

## Implementation Notes

*   **Validator:** Extend the existing validation system to support material-specific tasks.
*   **Task Selector:** Use the same UI pattern as the Blueprint editor task dropdown.
*   **Feedback:** Provide real-time feedback on which requirements are met.
*   **3D Preview:** The viewport should update live as students complete tasks.

## Task JSON Schema

Tasks can be defined in JSON format for programmatic validation:

```json
{
  "taskId": "material_01_solid_color",
  "title": "Solid Color Material",
  "description": "Create a simple red material using PBR principles.",
  "requirements": [
    {
      "type": "node_exists",
      "nodeType": "Constant3Vector",
      "count": 1
    },
    {
      "type": "connection",
      "from": { "nodeType": "Constant3Vector", "pin": "out" },
      "to": { "nodeType": "MainMaterialNode", "pin": "base_color" }
    }
  ]
}
```

## Automated Testing Plan

To ensure the task validation system works correctly, we need both unit tests and integration tests.

### Unit Tests for MaterialValidator

Create `tests/material-validation/validator.test.js`:

```javascript
// Test: Node existence check
runner.register("[Validator] findNodeByType returns correct node", async () => {
  // Setup: Add a Constant3Vector node to graph
  // Assert: validator.findNodeByType('Constant3Vector') returns the node
});

// Test: Connection validation
runner.register("[Validator] checkConnection validates pin connections", async () => {
  // Setup: Create Constant3Vector -> MainMaterialNode (base_color) connection
  // Assert: validator.checkConnection('Constant3Vector', 'MainMaterialNode', 'base_color') returns true
});

// Test: Pin value validation
runner.register("[Validator] checkPinValue validates literal values", async () => {
  // Setup: Add Constant node with value 0.5
  // Assert: validator.checkPinValue('Constant', 'value', 0.5) returns true
});
```

### Integration Tests for Tasks

Create `tests/material-validation/tasks.test.js`:

```javascript
// Test: Task 1.1 - Solid Color Material
runner.register("[Task] 1.1 Solid Color validates correctly", async () => {
  // Setup: Programmatically create the correct graph structure
  // Assert: taskValidator.validate('material_01_solid_color') returns { passed: true }
});

// Test: Task 1.2 - Metal Surface
runner.register("[Task] 1.2 Metal Surface requires Metallic = 1.0", async () => {
  // Setup: Create gold material but with Metallic = 0.5
  // Assert: taskValidator.validate(...) returns { passed: false, failedRequirements: ['metallic_value'] }
});
```

### Test Coverage Goals

| Component | Tests | Coverage Target |
|-----------|-------|-----------------|
| MaterialValidator.findNodeByType | 5 | Node types: Constant, Constant3Vector, TextureSample, Lerp, Multiply |
| MaterialValidator.checkConnection | 8 | All Main Material Node input pins |
| MaterialValidator.checkPinValue | 6 | Scalar, Vector, Boolean, String values |
| Task Validation (per level) | 3 | Pass, partial, fail states per task |

### Test File Structure

```
tests/
├── material-validation/
│   ├── validator.test.js      # Unit tests for MaterialValidator
│   ├── tasks.test.js          # Integration tests for educational tasks
│   └── fixtures/
│       └── sample-graphs.js   # Pre-built graph states for testing
```

---

## Next Steps

1.  **Implement MaterialValidator** class with `findNodeByType`, `checkConnection`, `checkPinValue` methods.
2.  **Create Task Selector UI** in the Material Editor toolbar.
3.  **Write unit tests** for MaterialValidator (target: 20 tests).
4.  **Write integration tests** for each educational task (target: 15 tests).
5.  **Add Task Status Panel** to show real-time progress checklist.
