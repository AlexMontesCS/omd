# omdBinaryExpressionNode

Represents a binary operation in a mathematical expression, such as addition (`a + b`), subtraction, multiplication, or division. This node is a cornerstone of the expression tree, containing a left operand, a right operand, and an operator.

## Class Definition

```javascript
export class omdBinaryExpressionNode extends omdNode
```

## Constructor

### `new omdBinaryExpressionNode(ast)`

Creates a new `omdBinaryExpressionNode` instance.

-   **`ast`** (`object`): The abstract syntax tree (AST) node from a parser like math.js. It must contain:
    -   `args`: An array with at least two operand nodes.
    -   `op`: The operator symbol (e.g., `+`, `*`).
    -   `fn`: The function name for the operation (e.g., `add`, `multiply`).
    -   `implicit` (`boolean`, optional): `true` if the multiplication is implicit (e.g., `2x`).

During construction, the node automatically handles a critical piece of mathematical convention: **implicit multiplication**. Based on the configuration in `omdConfigManager`, it will:

1.  **Reorder Operands**: If it encounters an expression like `x * 2`, it will automatically reorder it to the conventional `2 * x` by swapping the left and right child nodes.
2.  **Determine Implicit Form**: It checks if the combination of operands (e.g., a constant and a variable) should be represented implicitly. If so, it removes the visible operator (`*`) and marks the node as implicit.

## Public Properties

-   **`left`** ([`omdNode`](./omdNode.md)): The node representing the left-hand side of the operation.
-   **`right`** ([`omdNode`](./omdNode.md)): The node representing the right-hand side of the operation.
-   **`op`** ([`omdOperatorNode`](./omdOperatorNode.md) | `null`): The node for the operator. This is `null` for implicit multiplication.
-   **`operation`** (`string`): The name of the mathematical function (e.g., `'add'`, `'multiply'`).
-   **`isImplicit`** (`boolean`): `true` if the node represents implicit multiplication.

## Public Methods

### `clone()`

Creates a deep, recursive clone of the node, including its children (`left`, `right`, `op`). The new node's `provenance` property will link back to the ID of this original node.

-   **Returns**: A new `omdBinaryExpressionNode` instance.

### `evaluate(variables)`

Recursively evaluates the expression and returns the numerical result.

-   **`variables`** (`object`, optional): A map of variable names to their numeric values (e.g., `{ x: 5 }`).
-   **Returns**: `number` - The result of the calculation.
-   **Throws**: An `Error` for unsupported operations or division by zero.

### `needsParentheses()`

Determines if this expression needs to be wrapped in parentheses to maintain the correct order of operations when it is a child of another binary expression.

-   **Returns**: `boolean` - `true` if parentheses are required.

### `setHighlight(highlightOn, color)`

Applies or removes a highlight from the node and all of its children (left, right, and operator).

-   **`highlightOn`** (`boolean`): `true` to highlight, `false` to remove.
-   **`color`** (`string`, optional): The color of the highlight.

### `clearProvenanceHighlights()`

Recursively clears all provenance-related highlights from this node and its children.

### `toMathJSNode()`

Converts the node back into a math.js-compatible AST format.

-   **Returns**: `object` - A math.js OperatorNode.

### `toString()`

Converts the node into a human-readable string, automatically handling parentheses for precedence.

-   **Returns**: `string` - The string representation of the expression.

## Internal Methods

-   **`_shouldUseImplicitMultiplication(left, right)`**: Checks the configuration to decide if implicit multiplication is appropriate for the given operand types.
-   **`_shouldReorderMultiplication(left, right)`**: Determines if operands should be swapped to follow convention (e.g., `variable * constant` -> `constant * variable`).
-   **`computeDimensions()`**: Calculates the bounding box of the expression.
-   **`updateLayout()`**: Positions the left operand, operator, and right operand correctly, aligning them along their baseline.
