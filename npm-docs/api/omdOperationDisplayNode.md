# omdOperationDisplayNode

Represents a visual node for displaying an operation applied to both sides of an equation. This node is designed to show the operation (e.g., `+5` or `×2`) on both the left and right sides of an equation, typically used in step-by-step solution visualizers. It is non-interactive and non-highlightable by design.

## Class Definition

```javascript
export class omdOperationDisplayNode extends omdNode
```

## Static Properties

### `OPERATOR_SYMBOLS`

A static map that defines the display symbols for various operations.

```javascript
static OPERATOR_SYMBOLS = {
    'add': '+',
    'subtract': '-',
    'multiply': '×',
    'divide': '÷'
};
```

## Constructor

### `new omdOperationDisplayNode(operation, value)`

Creates a new `omdOperationDisplayNode` instance.

-   **`operation`** (`string`): The type of operation (e.g., `'add'`, `'subtract'`, `'multiply'`, `'divide'`).
-   **`value`** (`number` | `string` | `omdNode`): The value being applied in the operation. Can be a number, a variable name string, or an `omdNode` instance.

During construction, the node initializes its display, creates the visual elements for the operation, disables all user interactions and highlighting, and adds the elements as children.

## Public Properties

-   **`operation`** (`string`): The type of operation (e.g., `'add'`, `'subtract'`).
-   **`value`** (`number` | `string` | `omdNode`): The value used in the operation.
-   **`type`** (`string`): Always `"omdOperationDisplayNode"`.
-   **`leftToken`** (`omdVariableNode`): The `omdVariableNode` representing the operation and value on the left side.
-   **`rightToken`** (`omdVariableNode`): The `omdVariableNode` representing the operation and value on the right side.
-   **`gap`** (`number`): The horizontal spacing between the left and right operation tokens.
-   **`leftClusterWidth`** (`number`): The calculated width of the left operation token, used for alignment in equation sequences.

## Public Methods

### `computeDimensions()`

Calculates the dimensions (width and height) of the operation display node. It determines the total width by summing the widths of the left and right tokens and the `gap` between them. The height is based on the tallest token with some vertical padding.

### `updateLayout()`

Updates the layout of the operation display node. It positions the `leftToken` at the beginning and the `rightToken` after the calculated `gap`, ensuring they are vertically centered within the node's height.

### `getLeftWidthForAlignment()`

Returns the effective width of the left operation cluster. This is used by `omdEquationSequenceNode` to align the equals signs of equations with the center of the gap in the operation display.

-   **Returns**: `number`.

### `showLeftOnly()`

Hides the right operation token and recalculates the dimensions and layout to display only the left operation. This is useful for scenarios where only one side of the operation needs to be shown.

### `clone()`

Creates a deep clone of the `omdOperationDisplayNode`. The cloned node will have the same operation and value, and its provenance will link back to the original node. The cloned node is also made non-highlightable.

-   **Returns**: `omdOperationDisplayNode` - A new, identical instance.

## Internal Methods

-   **`_initializeDisplay()`**: Sets up the initial display properties, making the background transparent and ensuring the node is non-highlightable.
-   **`_createOperationElements()`**: Creates the `leftToken` and `rightToken` `omdVariableNode` instances based on the operation and value, and immediately disables their highlighting.
-   **`_disableAllInteractions()`**: Calls helper methods to disable mouse interactions and highlighting for both operation tokens.
-   **`_addChildElements()`**: Adds the `leftToken` and `rightToken` as children of this node.
-   **`_getOperatorSymbol(operation)`**: Converts the operation name (e.g., `'add'`) to its corresponding display symbol (e.g., `'+'`).
-   **`_valueToString(value)`**: Converts the input `value` (number, string, or `omdNode`) into a string representation for display.
-   **`_disableElement(element)`**: Recursively disables background, mouse interactions, and highlighting for a given `omdNode` and its children.
-   **`_hideElementBackground(element)`**: Sets the background of an element to transparent.
-   **`_disableMouseInteractions(element)`**: Removes mouse event listeners and sets the cursor to `'default'`.
-   **`_disableHighlighting(element)`**: Overrides highlighting methods (`setHighlight`, `lowlight`, `setFillColor`) on an element to prevent it from being highlighted.
-   **`_makeNodeNonHighlightable()`**: Applies the `_disableHighlighting` logic to the `omdOperationDisplayNode` itself.
-   **`_disableChildElements(element)`**: Recursively calls `_disableElement` on all children of a given element.

## Example

```javascript
// Create operation display for subtracting 3
const subtractNode = new omdOperationDisplayNode('subtract', 3);

// Create operation display for multiplying by 'x'
const multiplyNode = new omdOperationDisplayNode('multiply', 'x');

// Create operation display for dividing by a complex expression
const complexDivideNode = new omdOperationDisplayNode('divide', {
  type: 'OperatorNode',
  op: '+',
  args: [
    { type: 'ConstantNode', value: 1 },
    { type: 'SymbolNode', name: 'x' }
  ]
});

// To render these, you would typically add them to an omdEquationSequenceNode
// or an omdDisplay.
// For example:
// const display = new omdDisplay(document.getElementById('container'));
// display.render(subtractNode);
```

## See Also

-   [`omdNode`](./omdNode.md) - The base class for all OMD nodes.
-   [`omdEquationNode`](./omdEquationNode.md) - For representing mathematical equations.
-   [`omdEquationSequenceNode`](./omdEquationSequenceNode.md) - For managing sequences of equation steps.