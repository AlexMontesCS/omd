# omdConstantNode

Represents a numeric constant in a mathematical expression. This node is a leaf node in the expression tree, meaning it does not have any children.

## Class Definition

```javascript
export class omdConstantNode extends omdLeafNode
```

## Constructor

### `new omdConstantNode(ast)`

Creates a new `omdConstantNode` instance.

-   **`ast`** (`object`): The abstract syntax tree (AST) node from a parser like math.js. It must contain:
    -   `value`: The numeric value of the constant.

## Public Properties

-   **`value`** (`number`): The numeric value of the constant.

## Public Methods

### `isConstant()`

Checks if the node represents a constant value.

-   **Returns**: `boolean` - Always `true` for `omdConstantNode`.

### `evaluate()`

Evaluates the constant node. Since it's a constant, it simply returns its value.

-   **Returns**: `number` - The numeric value of the constant.

### `toMathJSNode()`

Converts the node back into a math.js-compatible AST format.

-   **Returns**: `object` - A math.js ConstantNode.

### `toString()`

Converts the constant node into its string representation.

-   **Returns**: `string` - The string representation of the constant.

## Internal Methods

-   **`computeDimensions()`**: Calculates the bounding box of the constant.
-   **`updateLayout()`**: Positions the constant within its bounding box.