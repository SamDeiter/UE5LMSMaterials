# Testing Conventions for UE5LMSMaterials

## Overview

This project uses an **in-browser test runner** for SCORM 1.2 LMS compatibility. No external build tools (Vite, Jest, Vitest) are required.

## Running Tests

Open the browser console and run:

```javascript
// Run all tests
runTests()

// Run only Material Editor tests
runTests('[Material]')

// Run only Blueprint tests (filter by name)
runTests('Variable')
```

## Test File Structure

```
tests/
├── material-tests.js    # Material Editor tests
├── fixtures/            # Test data and mock objects
└── (future test modules)
```

Main test file: `tests.js` (registers core Blueprint tests)

## Writing Tests

### Test Naming Convention

Tests are prefixed with their category:

- `[Material]` - Material Editor tests
- `[Blueprint]` - Blueprint Editor tests
- `[Wiring]` - Connection/wiring tests
- `[Validator]` - Task validation tests

### Test Structure

```javascript
runner.register('[Category] Test Name', async (app) => {
    // Arrange
    const thing = await setup();
    
    // Act
    const result = thing.doSomething();
    
    // Assert
    assert(result === expected, "Error message if failed");
});
```

### Assertion Helper

```javascript
assert(condition, message)  // Throws Error if condition is false
```

## Test Categories

### Material Editor Tests (`tests/material-tests.js`)

- Node creation and registry
- Pin type validation
- Shader code generation
- Expression definitions

### Blueprint Editor Tests (`tests.js`)

- Variable CRUD operations
- Node creation/deletion
- Graph manipulation
- Persistence

## Adding New Tests

1. Create test in appropriate module
2. Use `runner.register()` with descriptive name
3. Use `async` if importing modules dynamically
4. Run full suite to verify no regressions

## Best Practices

1. **Isolate tests** - Clean up after creating nodes/variables
2. **Use dynamic imports** - `await import()` for module loading
3. **Descriptive assertions** - Include helpful failure messages
4. **Test one thing** - Each test should verify one behavior
