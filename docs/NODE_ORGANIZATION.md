# Blueprint Node Organization

## Category Structure

The Blueprint Editor now uses UE5-style categorization for better organization and discoverability. All nodes are grouped into logical categories that match Unreal Engine 5's standard organization.

## Current Categories

### **Development**
Development and debugging tools.
- **Comment** - Add comments to your Blueprint

### **Events**
Event nodes that trigger execution.
- **Event BeginPlay** (Singleton) - Fires when the game starts
- **Event Tick** (Singleton) - Fires every frame
- **Custom Event** - User-defined events
- **Event ActorBeginOverlap** - Fires when another actor overlaps
- **Event OnClicked** - Fires when clicked

### **Flow Control**
Control the flow of execution.
- **Branch** - Conditional execution
- **Sequence** - Execute multiple pins in order
- **DoOnce** - Execute only once
- **Do N** - Execute N times
- **FlipFlop** - Alternate between two outputs
- **ForLoop** - Loop with index
- **ForEachLoop** - Loop over array elements
- **Gate** - Control execution flow with open/close

### **Math**
Mathematical operations, organized by data type.

#### **Math > Boolean**
- **AND** - Logical AND
- **OR** - Logical OR
- **NOT** - Logical NOT

#### **Math > Float**
- **Add (Float)** - Add two floats
- **Subtract (Float)** - Subtract floats
- **Multiply (Float)** - Multiply floats
- **Divide (Float)** - Divide floats
- **To Float (Int)** - Convert int to float

#### **Math > Integer**
- **Add (Integer)** - Add two integers
- **To Int (Byte)** - Convert byte to int

### **String**
String operations and conversions.
- **Print String** - Print text to screen (Development only)
- **To String (Float)** - Convert float to string
- **To String (Int)** - Convert int to string
- **To String (Bool)** - Convert bool to string
- **To String (Byte)** - Convert byte to string
- **To String (Name)** - Convert name to string
- **To String (Text)** - Convert text to string

## User Interface

### Palette Panel
The Palette panel shows all available nodes organized by category. Categories are:
- Displayed collapsed by default
- Can be expanded by clicking the category header
- Support unlimited nesting (e.g., Math > Float)
- Items are indented based on nesting level

### Action Menu (Right-Click)
The right-click context menu uses the same category organization:
- Appears when right-clicking on the graph
- Shows context-sensitive results when dragging from a pin
- Categories are collapsed by default
- Supports filtering via search box
- Respects the "Context Sensitive" toggle

## Adding New Categories

To add or modify categories, edit the `category` property in `utils.js` > `NodeLibrary`:

```javascript
"MyNode": {
    title: "My Custom Node",
    type: "function-node",
    category: "Custom|Subcategory", // Use "|" for nesting
    icon: "fa-star",
    pins: [...]
}
```

## Singleton Nodes

Some nodes are marked as singleton (only one instance allowed):
- **Event BeginPlay**
- **Event Tick**

Attempting to add a second instance will select the existing one instead.
