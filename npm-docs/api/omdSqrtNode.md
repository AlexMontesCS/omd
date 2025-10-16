# omdSqrtNode

Represents a square root node in the mathematical expression tree. It handles the rendering of the radical symbol (√) and the expression under the root (radicand), ensuring correct visual layout and mathematical behavior.

## Class Definition

```javascript
export class omdSqrtNode extends omdNode
```

## Constructor

### `new omdSqrtNode(astNodeData)`

Creates a new `omdSqrtNode` instance.

-   **`astNodeData`** (`object`): The math.js AST node containing square root function information. It should have an `args` property, which is an array containing a single AST node for the radicand. The constructor also initializes the visual `radicalPath` and `radicalLine` elements.

## Static Methods

### `fromString(expressionString)`

Creates an `omdSqrtNode` from a string representation of a square root function. Requires `window.math` (math.js) to be available globally for parsing.

-   **`expressionString`** (`string`): The square root expression as a string (e.g., `"sqrt(x+1)"`).
-   **Returns**: `omdSqrtNode` - A new instance.
-   **Throws**: `Error` if `math.js` is not available, if the string cannot be parsed, or if it does not represent a valid `sqrt` function.

## Public Properties

-   **`argument`** (`omdNode`): The node representing the radicand (the expression under the root).
-   **`value`** (`string`): Always `"sqrt"` for this node type.
-   **`radicalPath`** (`jsvgPath`): The SVG path element that draws the radical symbol (√).
-   **`radicalLine`** (`jsvgLine`): The SVG line element that draws the horizontal line above the radicand.
-   **`args`** (`Array<object>`): The raw AST arguments passed to the constructor.

## Public Methods

### `computeDimensions()`

Calculates the dimensions of the square root node. It scales down the font size of the `argument`, computes its dimensions, and then determines the overall width (radical width + spacing + argument width) and height (argument height + extra height for the radical top).

-   **Overrides**: `omdNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the square root node. It positions the `argument` node, then draws and positions the `radicalPath` and `radicalLine` elements relative to the argument, ensuring the radical symbol correctly encloses the radicand.

-   **Overrides**: `omdNode.updateLayout()`.

### `clone()`

Creates a deep, structural clone of the square root node, including its `argument` node and visual elements. The cloned node's `provenance` array is updated to include the original node's ID.

-   **Returns**: `omdSqrtNode` - A new, identical instance of the square root node.

### `highlightAll()`

Applies a highlight to the square root node itself and recursively highlights its `argument` node.

### `unhighlightAll()`

Removes the highlight from the square root node and recursively unhighlights its `argument` node.

### `toMathJSNode()`

Converts the `omdSqrtNode` back into its math.js AST representation. It creates a `FunctionNode` with `fn: 'sqrt'` and the converted `argument` AST.

-   **Returns**: `object` - A math.js `FunctionNode` for the square root operation. The returned object also includes a `clone` method for compatibility.

### `toString()`

Converts the square root node to its string representation (e.g., `"sqrt(x+1)"`).

-   **Returns**: `string`.

### `evaluate(variables)`

Evaluates the square root expression. It evaluates the `argument` and then calculates its square root.

-   **`variables`** (`object`): A map of variable names to their numeric values.
-   **Returns**: `number` - The evaluated square root, or `NaN` if the radicand cannot be evaluated or is negative.

### `isSquareRoot()`

Checks if the node represents a square root. Always returns `true` for `omdSqrtNode`.

-   **Returns**: `boolean`.

### `isCubeRoot()`

Checks if the node represents a cube root. Always returns `false` for `omdSqrtNode`.

-   **Returns**: `boolean`.

### `toPowerForm()`

Converts the square root node into an equivalent `omdPowerNode` representation (e.g., `sqrt(x)` becomes `x^(0.5)`).

-   **Returns**: `omdPowerNode` - The equivalent power expression, or `null` if the `argument` is missing.

## Internal Methods

-   **`parseValue()`**: Sets the `value` property to `"sqrt"`.
-   **`createArgumentNode()`**: Creates an `omdNode` instance for the radicand from its AST, and adds it as a child.
-   **`createRadicalElements()`**: Creates and initializes the `jsvgPath` for the radical symbol and the `jsvgLine` for the horizontal bar, adding them as children.

## Example

```javascript
import { omdSqrtNode } from '@teachinglab/omd';
import * as math from 'mathjs';

// Create from AST
const node = new omdSqrtNode({
  type: 'FunctionNode',
  fn: { name: 'sqrt' },
  args: [ { type: 'SymbolNode', name: 'x' } ]
});

// Or from string
const node2 = omdSqrtNode.fromString('sqrt(x+1)');

// Render and layout
node.setFontSize(24);
node.initialize();

// Evaluate
const val = node.evaluate({ x: 9 }); // 3

// Convert to power form
const powerNode = node.toPowerForm(); // x^(1/2)

// Add to an SVG container to display
// const svgContainer = new jsvgContainer();
// svgContainer.addChild(node);
// document.body.appendChild(svgContainer.svgObject);
```

## See Also

-   [`omdNode`](./omdNode.md) - The base class.
-   [`omdPowerNode`](./omdPowerNode.md) - For power form (e.g., `x^(1/2)`).
-   [`omdFunctionNode`](./omdFunctionNode.md) - For other mathematical functions.
