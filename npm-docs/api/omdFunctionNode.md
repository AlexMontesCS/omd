# omdFunctionNode

Represents a mathematical function call, such as `sin(x)`, `sqrt(9)`, or `log(x, 10)`. This node handles the rendering of the function name, its arguments, and surrounding parentheses. It supports evaluation, simplification, and conversion to/from math.js AST.

## Class Definition

```javascript
export class omdFunctionNode extends omdNode
```

## Constructor

### `new omdFunctionNode(astNodeData)`

Creates a new `omdFunctionNode` instance.

-   **`astNodeData`** (`object`): The math.js AST node for the function. It should contain:
    -   `fn.name` or `name`: The name of the function (e.g., `"sin"`, `"log"`).
    -   `args`: An array of AST nodes for the function's arguments.

## Static Methods

### `fromString(functionString)`

Creates an `omdFunctionNode` from a string representation of a function call. This method requires `window.math` (math.js library) to be available globally for parsing.

-   **`functionString`** (`string`): The function call as a string (e.g., `"sqrt(16)"`, `"log(100, 10)"`).
-   **Returns**: `omdFunctionNode` - A new instance of `omdFunctionNode`.
-   **Throws**: `Error` if `math.js` is not available, if the string cannot be parsed, or if it does not represent a valid function call.

## Public Properties

-   **`functionName`** (`string`): The name of the function (e.g., `"sin"`, `"log"`).
-   **`args`** (`Array<omdNode>`): An array of `omdNode` instances representing the arguments of the function.

## Public Methods

### `computeDimensions()`

Calculates the bounding box of the function node, taking into account the dimensions of the function name, arguments, and parentheses. It also sets the font sizes for the function name and arguments (arguments are typically scaled down slightly).

### `updateLayout()`

Positions the function name, arguments, and parentheses within the node's bounding box. It ensures proper spacing and vertical alignment of all elements.

### `highlightAll()`

Applies a highlight to the function node itself (its background rectangle) and recursively highlights all of its argument nodes.

### `unhighlightAll()`

Removes the highlight from the function node and recursively unhighlights all of its argument nodes.

### `clone()`

Creates a deep, structural clone of the function node, including all its argument nodes and their associated SVG elements. The clone's provenance array is updated to include the original node's ID.

-   **Returns**: `omdFunctionNode` - A new, identical instance of the function node.

### `toMathJSNode()`

Converts the `omdFunctionNode` back into its math.js AST representation. This includes converting its function name and all argument nodes.

-   **Returns**: `object` - A math.js-compatible `FunctionNode` AST object.

### `toString()`

Converts the function node to its string representation (e.g., `"sqrt(x^2)"`, `"log(100, 10)"`).

-   **Returns**: `string` - The function as a string.

### `evaluate(variables)`

Evaluates the function by first evaluating its arguments and then applying the function to the results. It primarily uses `window.math` (math.js) for evaluation. If `math.js` is not available, it falls back to standard JavaScript `Math` functions for common cases (e.g., `sin`, `cos`, `sqrt`).

-   **`variables`** (`object`, optional): A map of variable names to their numeric values (e.g., `{ x: 2 }`).
-   **Returns**: `number` - The result of the function evaluation.
-   **Throws**: `Error` if the function is unknown or cannot be evaluated.

## Internal Methods

-   **`createTextElements()`**: Creates `jsvgTextLine` elements for the function name and parentheses.
-   **`createArgumentNodes()`**: Iterates through the AST arguments, creates corresponding `omdNode` instances for each, and adds them as children.