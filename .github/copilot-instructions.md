<!-- Copilot / AI agent instructions for the UE5LMSBlueprint repo -->
# Copilot instructions for UE5LMSBlueprint

These instructions highlight the minimal, high-value knowledge an AI coding agent needs to be productive in this repository.

**Big Picture**
- **Purpose:** A browser-based UE5-style Blueprint editor implemented in vanilla ES modules. UI and data model live in the browser; state persists to `localStorage`.
- **Major components:**
  - `app.js` — application bootstrap and controller wiring (initialization order matters).
  - `graph.js` — core data model and canvas logic: `Pin`, `Node`, `WiringController`, `GraphController`.
  - `ui.js` — side panels and menus: `VariableController`, `PaletteController`, `DetailsController`, action/context menus.
  - `services.js` — `Compiler`, `Persistence`, `GridController`, `HistoryManager` (undo/redo and save integration).
  - `utils.js` — `Utils` helpers and the canonical `NodeLibrary` that defines spawnable node types.
  - `index.html` — DOM layout and the element IDs used throughout the codebase.

**Critical app patterns & conventions**
- The app uses ES module imports/exports and is run by loading `index.html` (`<script type="module" src="app.js">`). Don't convert to CommonJS.
- The initialization order in `BlueprintApp.init()` is important: Graph -> Grid -> Wiring -> Variable/Palette/Details -> History -> Persistence -> Compiler. Changing the order can produce runtime errors.
- `NodeLibrary` (in `utils.js`) is the authoritative list of node types. Dynamic nodes (Get/Set for variables) are added/removed by `VariableController.updateNodeLibrary()`.
- Variable objects are stored in `VariableController.variables` (a Map keyed by variable name). Many parts of the app depend on variable names matching NodeLibrary keys (`Get_<Name>`, `Set_<Name>`).
- Drag/drop payloads use `dataTransfer` strings with prefixes: `PALETTE_NODE:<nodeKey>` and `VARIABLE:<varName>` (see `PaletteController` and `VariableController` drag handlers).
- Undo/redo and saves: `HistoryManager.saveState()` serializes the state; `Persistence.autoSave()` calls `history.saveState()` after a 500ms debounce. Use `app.persistence.autoSave()` after mutating state if you need autosave behavior.
- Local storage key: `blueprintGraph_v3` (in `Persistence`); be careful when changing format.

**Common debug & developer workflows**
- Run the app: open `index.html` in a browser that supports ES modules. For a local server (recommended), from the project root run:
  - PowerShell / cmd: `python -m http.server 8000` (then open `http://localhost:8000/`).
- Inspect runtime behavior via browser DevTools console. The app logs to both `console` and the in-app compiler panel (`#compiler-results`).
- Trigger compile/validation via F7 or the `Compile` button (calls `Compiler.validate()`), check `#compiler-results` for messages.
- To reproduce persistence issues: clear the `blueprintGraph_v3` key in `localStorage` and reload.

**File/DOM conventions to reference in code changes**
- Important DOM IDs (used widely): `graph-editor`, `graph-svg`, `nodes-container`, `graph-canvas`, `palette-content`, `my-blueprint-content`, `details-panel`, `compile-btn`, `save-btn`, `undo-btn`, `redo-btn`, `compiler-results`, `confirmation-modal`.
- Node naming patterns in `NodeLibrary`: conversion nodes are `Conv_*`; variable nodes use `Get_<Name>` and `Set_<Name>`.

**Integration and leaky abstractions**
- Many controllers share a central `app` object (see `BlueprintApp` in `app.js`). Controllers access each other via `app.<controller>` (e.g., `app.graph`, `app.wiring`, `app.variables`). When adding a new controller, attach it to `BlueprintApp` and initialize before controllers that depend on it.
- `Utils.getPinPosition()` assumes `app.graph.pan` and `app.graph.zoom` exist — guard against null when refactoring the graph transform logic.

**Small examples (copyable snippets / patterns to follow)**
- Add a dynamic variable node to `NodeLibrary` (pattern used in `VariableController.updateNodeLibrary`):
  - `NodeLibrary[\`Get_${variable.name}\`] = { title: \`Get ${variable.name}\`, type: 'pure-node', pins: [...] }`
- Trigger an autosave after mutating state:
  - `app.persistence.autoSave('change')` or use `app.persistence.save()` for immediate save.

**What NOT to change lightly**
- Do not change the `localStorage` data shape without a migration strategy — the `HistoryManager`/`Persistence` code assumes a specific JSON schema.
- Avoid swapping the ES module approach or inlining large frameworks; the codebase favors small vanilla modules and direct DOM manipulation.

If anything above is unclear or you'd like examples added (e.g., common refactor patterns, tests, or a recommended dev server script), tell me which section to expand and I will iterate.
