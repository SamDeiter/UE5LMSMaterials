# UE5 LMS Materials

Web-based Blueprint and Material editors with 100% visual parity to Unreal Engine 5.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start dev server
python -m http.server 8080
# Then open: http://localhost:8080/public/material-editor.html
```

## Directory Structure

```
├── blueprint/          # Blueprint Editor
│   ├── core/           # GraphController, Node, WiringController, etc.
│   ├── services/       # Compiler, Persistence, HistoryManager
│   ├── registries/     # NodeRegistry
│   └── ui/             # HotkeyManager, ContextMenu, etc.
│
├── material/           # Material Editor
│   ├── core/           # MaterialGraphController, MaterialNodeFramework
│   ├── engine/         # ShaderEvaluator, TextureManager
│   └── ui/             # PaletteController, ViewportController
│
├── shared/             # Common utilities
│   ├── utils.js        # Debounce, generateId, etc.
│   ├── WireRenderer.js # Shared wire rendering
│   └── GridRenderer.js # Shared grid rendering
│
├── public/             # Static assets
│   ├── material-editor.html
│   ├── material-editor.css
│   └── assets/
│
└── tests/              # Test suites (328 tests)
```

## Architecture

Both editors use a modular controller pattern:

| Module | Purpose |
|--------|---------|
| **GraphController** | Core graph state and operations |
| **InputController** | Mouse/keyboard handling |
| **WiringController** | Wire connections |
| **SelectionController** | Node selection |

## Testing

```bash
npm test           # Run all tests
npm test -- --run  # Run once without watch
```

## License

MIT
