# omdUnaryExpressionNode

Represents unary operations (like negation) in mathematical expressions (e.g., `-x`, `-(a + b)`). This node handles rendering, layout, evaluation, and conversion to math.js AST for expressions with a single operand.

## Class Definition

```javascript
export class omdUnaryExpressionNode extends omdNode
```

## Constructor

### `new omdUnaryExpressionNode(ast)`

Creates a new `omdUnaryExpressionNode` instance.

-   **`ast`** (`object`): The math.js AST node for the unary operation. It must contain:
    -   `args`: An array with exactly one operand AST node.
    -   `op`: The operator symbol (e.g., `'-'`, `'+'`).
    -   `fn`: The operation name (e.g., `'unaryMinus'`, `'unaryPlus'`).

During construction, it creates an `omdOperatorNode` for the unary operator and an `omdNode` for the operand. It throws an error if the AST does not have exactly one argument.

## Static Methods

### `fromString(expressionString)`

Creates an `omdUnaryExpressionNode` from a string representation of a unary expression. Requires `window.math` (math.js) to be available globally for parsing.

-   **`expressionString`** (`string`): The unary expression as a string (e.g., `"-x"`, `"-(a+b)"`).
-   **Returns**: `omdUnaryExpressionNode` - A new instance.
-   **Throws**: `Error` if `math.js` is not available, if the string cannot be parsed, or if it does not represent a valid unary minus operation.

## Public Properties

-   **`op`** (`omdOperatorNode`): The `omdOperatorNode` representing the unary operator (e.g., `-`).
-   **`operand`** (`omdNode`): The `omdNode` representing the expression being operated on.
-   **`operation`** (`string`): The name of the operation (e.g., `'unaryMinus'`).

## Public Methods

### `computeDimensions()`

Calculates the dimensions of the unary expression node. It sums the widths of the operator and the operand to get the total width. The height is the maximum of the operator's and operand's heights. No extra spacing is added between the unary operator and its operand.

-   **Overrides**: `omdNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the unary expression node. It positions the operator to the left and the operand to its right, both vertically centered within the node's total height.

-   **Overrides**: `omdNode.updateLayout()`.

### `clone()`

Creates a deep, structural clone of the unary expression node, including its `op` and `operand` nodes. The cloned node's `provenance` array is updated to include the original node's ID.

-   **Returns**: `omdUnaryExpressionNode` - A new, identical instance of the unary expression node.

### `toMathJSNode()`

Converts the `omdUnaryExpressionNode` back into its math.js AST representation. It creates an `OperatorNode` with the unary operator and the converted operand AST.

-   **Returns**: `object` - A math.js `OperatorNode` for the unary operation. The returned object also includes a `clone` method for compatibility.

### `toString()`

Converts the unary expression node to its string representation. It adds parentheses around the operand if `needsParentheses()` returns `true` (e.g., for binary expressions).

-   **Returns**: `string` - Format: `"-operand"` or `"-(operand)"`.

### `needsParentheses()`

Checks if the operand needs to be wrapped in parentheses when converted to a string. This is typically `true` if the operand is a binary expression, to maintain correct order of operations.

-   **Returns**: `boolean` - `true` if parentheses are required around the operand.

### `evaluate(variables)`

Evaluates the unary expression. It evaluates the `operand` and then applies the unary operation (e.g., negation for `'-'`).

-   **`variables`** (`object`): A map of variable names to their numeric values.
-   **Returns**: `number` - The result of the unary operation, or `NaN` if the operand cannot be evaluated to a number.

## Internal Methods

-   **`createOperatorNode(ast)`**: Creates an `omdOperatorNode` for the unary operator from its AST, setting its parent to this node.
-   **`createExpressionNode(ast)`**: Creates an `omdNode` instance for the operand from its AST, setting its parent to this node.

## Example

```javascript
import { omdUnaryExpressionNode } from '@teachinglab/omd';
import * as math from 'mathjs';

// Create from AST: -x
const node = new omdUnaryExpressionNode({
  type: 'OperatorNode',
  op: '-',
  fn: 'unaryMinus',
  args: [
    { type: 'SymbolNode', name: 'x' }
  ]
});

// Create from AST: -(x + 1)
const complex = new omdUnaryExpressionNode({
  type: 'OperatorNode',
  op: '-',
  fn: 'unaryMinus',
  args: [{
    type: 'OperatorNode',
    op: '+',
    fn: 'add',
    args: [
      { type: 'SymbolNode', name: 'x' },
      { type: 'ConstantNode', value: 1 }
    ]
  }]
});

// Render and layout
node.setFontSize(24);
node.initialize();

// Add to an SVG container to display
// const svgContainer = new jsvgContainer();
// svgContainer.addChild(node);
// document.body.appendChild(svgContainer.svgObject);
```

## See Also

-   [`omdNode`](./omdNode.md) - Parent class.
-   [`omdOperatorNode`](./omdOperatorNode.md) - For the operator symbol.
-   [`omdBinaryExpressionNode`](./omdBinaryExpressionNode.md) - Often used for complex operands within a unary expression.
-   [`omdConstantNode`](./omdConstantNode.md) - For numeric operands.
