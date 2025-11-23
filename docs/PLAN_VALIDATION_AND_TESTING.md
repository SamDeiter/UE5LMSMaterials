# Plan: Regression Prevention & Blueprint Validation

## 1. Preventing Regressions (Automated Testing)

To ensure new features don't break existing functionality without building a heavy CI/CD pipeline, we can implement a lightweight **In-Browser Test Runner**.

### Strategy: "Scripted User Actions"
Since your application is entirely client-side JavaScript, we can write test scripts that run directly in the browser console or a special "Test Mode". These scripts will simulate user actions via the `app` API and assert the final state.

### Implementation Steps:
1.  **Create a `tests/` directory** (or just a `tests.js` file).
2.  **Build a simple Test Runner:** A class that registers test functions and runs them sequentially.
3.  **Write Key Test Cases:**
    *   **Variable Management:** Create a variable, change its type, ensure default value updates.
    *   **Graph Manipulation:** Add nodes, move them, delete them.
    *   **Wiring:** Connect two compatible pins, ensure link is created. Attempt incompatible connection, ensure link is rejected.
    *   **UI State:** Verify the Details Panel updates when a node is selected.

### Example Test Code Structure:
```javascript
const runTests = async () => {
    console.log("Running Tests...");
    
    // Test 1: Create Variable
    app.variables.addVariable();
    const newVar = [...app.variables.variables.values()].pop();
    assert(newVar.type === 'bool', "New variable should be bool");
    
    // Test 2: Change Variable Type
    app.variables.updateVariableProperty(newVar, 'type', 'vector');
    assert(newVar.defaultValue === '(0,0,0)', "Vector default value incorrect");
    
    console.log("All Tests Passed!");
};
```

---

## 2. Testing Blueprint Knowledge (Validation System)

To check if a student's blueprint is "correct" without building a complex execution engine (VM), we can use **Structural Pattern Matching** and **Constraint Checking**.

### Core Concept: "Task Definitions"
Instead of running the code, we check if the *structure* of the graph matches the requirements of the assignment. We define a "Task" as a set of rules the graph must satisfy.

### Validation Strategies:

#### A. Existence Checks
*   **Rule:** "Graph must contain a `Event BeginPlay` node."
*   **Rule:** "Graph must contain a variable named `Health` of type `Float`."

#### B. Connection/Topology Checks
*   **Rule:** "The `Exec` output of `Event BeginPlay` must be connected to the `Exec` input of a `Set Variable` node."
*   **Rule:** "The `Health` variable getter must be connected to the `Value` input of the `Print String` node."

#### C. Property Checks
*   **Rule:** "The `Set Variable` node must be targeting the `Health` variable."
*   **Rule:** "The `Print String` node must have `Print to Screen` checked."

### Proposed "Task JSON" Schema
We can define tasks in a JSON format that the validator reads:

```json
{
  "taskId": "task_01_health",
  "title": "Initialize Health",
  "description": "Create a float variable named 'Health' and set it to 100 on BeginPlay.",
  "requirements": [
    {
      "type": "variable_exists",
      "name": "Health",
      "varType": "float"
    },
    {
      "type": "node_exists",
      "nodeType": "Event_BeginPlay",
      "count": 1
    },
    {
      "type": "connection",
      "from": { "nodeType": "Event_BeginPlay", "pin": "exec_out" },
      "to": { "nodeType": "Set_Health", "pin": "exec_in" }
    },
    {
      "type": "node_property",
      "nodeType": "Set_Health",
      "property": "defaultValue", // Checking the input pin value if not connected
      "value": 100
    }
  ]
}
```

### The Validator Logic
We will build a `BlueprintValidator` class with methods like:
*   `checkVariable(name, type)`
*   `findNodeByType(type)`
*   `checkConnection(sourceNode, targetNode)`

### Advantages of this Approach:
1.  **Lightweight:** No need to write a compiler or interpreter.
2.  **Flexible:** You can allow for some variation (e.g., "Find *any* node that sets Health", not just a specific one).
3.  **Instant Feedback:** You can run this validation every time the user makes a change and show a checklist of "Objectives Completed".

## Next Steps
1.  **Build the Test Runner** to lock in current stability.
2.  **Prototype the Validator** with a simple "Hello World" task (e.g., "Connect BeginPlay to PrintString").
