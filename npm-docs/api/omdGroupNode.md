# omdGroupNode

Represents a single grouping symbol, such as `(` or `)`, as a leaf node in the expression tree. This node is primarily used for visual representation and layout, rather than mathematical operations.

## Class Definition

```javascript
export class omdGroupNode extends omdLeafNode
```

## Constructor

### `new omdGroupNode(nodeData)`

Creates a new `omdGroupNode` instance.

-   **`nodeData`** (`string`): The single character string representing the grouping symbol (e.g., `'('`, `')'`, `'['`, `']'`).

## Public Properties

-   **`symbol`** (`string`): The grouping symbol character (e.g., `'('`).
-   **`type`** (`string`): Always `"parenthesis"` for this node type.
-   **`textElement`** (`jsvgTextLine`): The internal `jsvgTextLine` instance responsible for rendering the symbol.

## Public Methods

### `clone()`

Creates a deep clone of the group node. The new node's `provenance` array is updated to include the original node's ID.

-   **Returns**: `omdGroupNode` - A new, identical instance of the group node.

### `computeDimensions()`

Calculates the dimensions of the node based on its text content. Unlike other leaf nodes, `omdGroupNode` does *not* add extra padding around the symbol, allowing for tighter visual integration.

-   **Overrides**: `omdLeafNode.computeDimensions()`.

### `updateLayout()`

Updates the position of the node's internal text element. This method primarily calls the superclass's `updateLayout`.

-   **Overrides**: `omdLeafNode.updateLayout()`.

### `toMathJSNode()`

Converts the `omdGroupNode` to a math.js-compatible AST format. It represents the grouping symbol as a `SymbolNode`.

-   **Returns**: `object` - A math.js-compatible AST node with `type: "SymbolNode"` and `name` set to the grouping symbol. The returned object also includes a `clone` method for compatibility.

## Internal Methods

-   **`parseSymbol(nodeData)`**: Extracts the symbol from the constructor's `nodeData`. Returns the input string unchanged.
-   **`parseType()`**: Sets the node's type. Always returns `"parenthesis"`.

## Example

```javascript
// Create grouping symbols
const leftParen = new omdGroupNode('(');
const rightParen = new omdGroupNode(')');
const leftBracket = new omdGroupNode('[');

// Render a symbol
const node = new omdGroupNode('(');
node.setFontSize(24);
node.initialize(); // Computes dimensions and layout

// Add to an SVG container to display
// const svgContainer = new jsvgContainer();
// svgContainer.addChild(node);
// document.body.appendChild(svgContainer.svgObject);
```

## See Also

-   [`omdLeafNode`](./omdLeafNode.md) - The parent class for all leaf nodes.
-   [`omdNode`](./omdNode.md) - The base class for all OMD nodes.
-   [`omdParenthesisNode`](./omdParenthesisNode.md) - For complete parenthetical expressions that contain other nodes.