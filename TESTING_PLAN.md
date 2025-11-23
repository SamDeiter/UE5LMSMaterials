# UE5 Blueprint Knowledge Testing Plan

This plan outlines a series of interactive tasks designed to test a user's understanding of Unreal Engine 5 Blueprints using the Blueprint Replica tool.

## Level 1: Fundamentals

**Objective:** Verify understanding of variables, events, and basic execution flow.

### Task 1.1: Health Initialization
*   **Description:** Create a system to initialize a player's health when the game starts.
*   **Requirements:**
    1.  Create a `Float` variable named `Health`.
    2.  Set its default value to `100.0`.
    3.  Add an `Event BeginPlay` node.
    4.  Add a `Set Health` node.
    5.  Connect `BeginPlay` to `Set Health`.
    6.  Set the `Health` value to `100.0` in the Set node (or ensure default is used).
*   **Validation:** Check for variable existence, node presence, and correct wiring.

### Task 1.2: Simple Logic
*   **Description:** Print a message to the screen.
*   **Requirements:**
    1.  Add an `Event BeginPlay` node.
    2.  Add a `Print String` node.
    3.  Connect them.
    4.  Set the string to "Hello Unreal".
*   **Validation:** Check for `Print String` node and connection.

## Level 2: Flow Control

**Objective:** Test knowledge of branching and loops.

### Task 2.1: Health Check
*   **Description:** Check if health is low and print a warning.
*   **Requirements:**
    1.  Create a `Float` variable `Health`.
    2.  Add `Event Tick`.
    3.  Add a `Branch` node.
    4.  Add a `Float < Float` node.
    5.  Connect `Health` to the top pin of `<`.
    6.  Set the bottom pin of `<` to `20.0`.
    7.  Connect the boolean output to the `Branch` condition.
    8.  Connect `Event Tick` to `Branch`.
    9.  Connect `Branch` True pin to a `Print String` node saying "Low Health!".
*   **Validation:** Check for Branch, comparison logic, and correct wiring.

### Task 2.2: Loop Execution
*   **Description:** Execute an action 5 times.
*   **Requirements:**
    1.  Add `Event BeginPlay`.
    2.  Add a `For Loop` node.
    3.  Set `First Index` to 1 and `Last Index` to 5.
    4.  Connect `BeginPlay` to `For Loop`.
    5.  Connect `Loop Body` to a `Print String`.
*   **Validation:** Check for For Loop and index values.

## Level 3: Math and Data

**Objective:** Test arithmetic operations and data manipulation.

### Task 3.1: Damage Calculation
*   **Description:** Calculate damage based on base damage and a multiplier.
*   **Requirements:**
    1.  Create `Float` variables: `BaseDamage` (10.0) and `Multiplier` (2.5).
    2.  Add a `Get BaseDamage` and `Get Multiplier` node.
    3.  Add a `Multiply (Float)` node.
    4.  Connect variables to the multiply node.
    5.  Add a `Print String` node.
    6.  Connect the multiply output to the `Print String` input (auto-conversion check).
*   **Validation:** Check for math nodes and correct inputs.

## Level 4: Advanced / Custom Events

**Objective:** Test organizational skills and custom logic.

### Task 4.1: Custom Event Trigger
*   **Description:** Create a custom event to handle player death.
*   **Requirements:**
    1.  Add a `Custom Event` node named `OnDeath`.
    2.  Add a `Print String` node saying "Player Died".
    3.  Connect `OnDeath` to `Print String`.
    4.  Add `Event BeginPlay`.
    5.  Add a call to function `OnDeath` (Call Function node).
    6.  Connect `BeginPlay` to the call node.
*   **Validation:** Check for Custom Event definition and the function call node.

## Implementation Notes

*   **Validator:** The existing `validator.js` can be extended to support these tasks.
*   **Task Selector:** A UI dropdown can be added to switch between these active tasks.
*   **Feedback:** The system should provide real-time feedback on which requirements are met.

## Level 5: Blueprint Communication

**Objective:** Test understanding of how Blueprints interact and communicate.

### Task 5.1: Event Dispatcher
*   **Description:** Create a door that notifies a light when it opens.
*   **Requirements:**
    1.  Create a Blueprint Actor named `BP_Door`.
    2.  In `BP_Door`, create an Event Dispatcher named `OnOpened`.
    3.  Add logic to `BP_Door` to call `OnOpened` when it opens (e.g., after a delay on `BeginPlay` for simplicity).
    4.  Create another Blueprint Actor named `BP_Light`.
    5.  In `BP_Light`, get a reference to `BP_Door` (e.g., using `Get Actor Of Class`).
    6.  Bind an event to `BP_Door`'s `OnOpened` dispatcher.
    7.  When `OnOpened` fires, have `BP_Light` print "Light On".
*   **Validation:** Check for Event Dispatcher, Call node, Get Actor of Class, Bind Event, and the custom event in `BP_Light`.

### Task 5.2: Blueprint Interface
*   **Description:** Create an interaction system using an Interface.
*   **Requirements:**
    1.  Create a Blueprint Interface named `BPI_Interact` with a function `Interact`.
    2.  Create two Blueprint Actors, `BP_Button` and `BP_Lever`.
    3.  Implement `BPI_Interact` in both `BP_Button` and `BP_Lever`.
    4.  In `BP_Button`'s `Interact` event, print "Button Pressed".
    5.  In `BP_Lever`'s `Interact` event, print "Lever Pulled".
    6.  On `BeginPlay` in the Level Blueprint, get references to `BP_Button` and `BP_Lever`.
    7.  Call the `Interact` message (interface call) on both references.
*   **Validation:** Check for Interface, implementation, `Interact` events, and interface calls.

## Level 6: Components

**Objective:** Test understanding of Actor Components and their usage.

### Task 6.1: Rotating Movement
*   **Description:** Make an actor rotate continuously.
*   **Requirements:**
    1.  Create a Blueprint Actor named `BP_Fan`.
    2.  Add a `Static Mesh Component` (e.g., a cube or fan mesh).
    3.  Add a `Rotating Movement Component`.
    4.  Set the `Rotation Rate` Z to `180.0`.
*   **Validation:** Check for Rotating Movement Component and its properties.

### Task 6.2: Trigger Volume
*   **Description:** Detect when the player enters an area.
*   **Requirements:**
    1.  Create a Blueprint Actor named `BP_Trap`.
    2.  Add a `Box Collision` component.
    3.  Add the `On Component Begin Overlap` event for the Box Collision.
    4.  Connect it to a `Print String` saying "Trap Triggered!".
*   **Validation:** Check for Box Collision, Overlap Event, and wiring.
