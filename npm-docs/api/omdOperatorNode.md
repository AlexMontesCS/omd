# omdOperatorNode

Represents an operator symbol (e.g., `+`, `-`, `*`, `÷`) as a leaf node in the expression tree. This node handles the visual representation of operators, including mapping common operation names to their appropriate symbols and applying styling.

## Class Definition

```javascript
export class omdOperatorNode extends omdLeafNode
```

## Constructor

### `new omdOperatorNode(nodeData)`

Creates a new `omdOperatorNode` instance.

-   **`nodeData`** (`object` | `string`): The AST node data (from math.js) or the operator symbol as a string (e.g., `"+"`, `"*"`). The constructor maps common operation names (like `"multiply"`) to their display symbols (like `"×"`), respecting the configured multiplication symbol.

## Public Properties

-   **`opName`** (`string`): The internal name of the operator (e.g., `"*"`, `"+"`). This might differ from the displayed symbol for multiplication.
-   **`type`** (`string`): Always `"omdOperatorNode"`.
-   **`textElement`** (`jsvgTextLine`): The internal `jsvgTextLine` instance that displays the operator symbol.

## Public Methods

### `computeDimensions()`

Calculates the dimensions of the node based on its text content, adding a small amount of padding around the operator symbol to improve visual spacing.

-   **Overrides**: `omdLeafNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the node. This method primarily calls the superclass's `updateLayout`.

-   **Overrides**: `omdLeafNode.updateLayout()`.

### `toMathJSNode()`

Converts the `omdOperatorNode` to a math.js-compatible AST format. It creates a minimal `OperatorNode` AST object.

-   **Returns**: `object` - A math.js-compatible AST node with `type: "OperatorNode"`, `op` (operator symbol), `fn` (function name, typically same as `op`), and an empty `args` array. The returned object also includes a `clone` method for compatibility.

### `toString()`

Converts the operator node to its string representation, which is simply its `opName`.

-   **Returns**: `string` - The operator symbol (e.g., `"+"`, `"*"`).

### `highlight(color)`

Applies a highlight to the node's background and sets the operator's text color to white for better contrast. This method respects the `isExplainHighlighted` lock.

-   **`color`** (`string`): The color of the highlight.

### `clearProvenanceHighlights()`

Clears any provenance-related highlights from the node and resets the operator's text color to its default (black).

## Internal Methods

-   **`parseOpName(nodeData)`**: Extracts the operator's internal name from the constructor's `nodeData`. It handles mapping from math.js function names (e.g., `"multiply"`) to display symbols (e.g., `"×"`), using the configured multiplication symbol.
-   **`parseType()`**: Sets the node's type. Always returns `"operator"`.

## Example

```javascript
import { omdOperatorNode } from '@teachinglab/omd';

// Create operator nodes from strings
const plus = new omdOperatorNode('+');
const times = new omdOperatorNode('*'); // Displays as × (configurable via omdConfigManager)

// Create operator node from AST data (e.g., from math.js parse result)
const minus = new omdOperatorNode({
  type: 'OperatorNode',
  op: '-',
  fn: 'subtract'
}); // Displays as −

// To render, typically add to a parent node or an omdDisplay
// node.setFontSize(24);
// node.initialize(); // Computes dimensions and layout
```

## See Also

-   [`omdLeafNode`](./omdLeafNode.md) - The parent class for all leaf nodes.
-   [`omdNode`](./omdNode.md) - The base class for all OMD nodes.
-   [`omdBinaryExpressionNode`](./omdBinaryExpressionNode.md) - A common consumer of operator nodes.
-   [`omdUnaryExpressionNode`](./omdUnaryExpressionNode.md) - Another consumer of operator nodes (e.g., for unary minus).