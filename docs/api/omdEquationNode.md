# omdEquationNode

Represents a mathematical equation, consisting of a left side, a right side, and an equals sign. This class provides extensive functionality for manipulating the equation, such as applying operations to both sides, swapping sides, simplification, and rendering to various visualization formats.

## Class Definition

```javascript
export class omdEquationNode extends omdNode
```

## Constructor

### `new omdEquationNode(ast)`

Creates a new `omdEquationNode` instance.

-   **`ast`** (`object`): The math.js Abstract Syntax Tree (AST) for the equation. It typically expects an `AssignmentNode` (with `object` for the left side and `value` for the right side) or an `OperatorNode` (with `op: '='` and two arguments).

## Static Methods

### `fromString(equationString)`

Creates an `omdEquationNode` instance from a string representation of an equation.

-   **`equationString`** (`string`): The string to parse (e.g., `"2x + 4 = 10"`).
-   **Returns**: `omdEquationNode` - A new instance of `omdEquationNode`.
-   **Throws**: `Error` if the string is not a valid equation (must contain exactly one `'='` and both sides must be non-empty).

## Public Properties

-   **`left`** ([`omdNode`](./omdNode.md)): The node representing the left side of the equation.
-   **`right`** ([`omdNode`](./omdNode.md)): The node representing the right side of the equation.
-   **`equalsSign`** ([`omdOperatorNode`](./omdOperatorNode.md)): The node for the equals sign.

## Public Methods

### `addToBothSides(value)`

Returns a new equation with a value added to both sides.

-   **`value`** (`number` | `object`): The value (number or math.js AST) to add.
-   **Returns**: `omdEquationNode` - A new equation node with the operation applied.

### `subtractFromBothSides(value)`

Returns a new equation with a value subtracted from both sides.

-   **`value`** (`number` | `object`): The value (number or math.js AST) to subtract.
-   **Returns**: `omdEquationNode` - A new equation node.

### `multiplyBothSides(value)`

Returns a new equation with both sides multiplied by a value.

-   **`value`** (`number` | `object`): The value (number or math.js AST) to multiply by.
-   **Returns**: `omdEquationNode` - A new equation node.

### `divideBothSides(value)`

Returns a new equation with both sides divided by a value.

-   **`value`** (`number` | `object`): The value (number or math.js AST) to divide by.
-   **Returns**: `omdEquationNode` - A new equation node.

### `applyFunction(functionName)`

Applies a function (e.g., `sqrt`, `log`) to both sides of the equation.

-   **`functionName`** (`string`): The name of the function to apply.
-   **Returns**: `omdEquationNode` - A new equation with the function applied to both sides.

### `applyOperation(value, operation, side = 'both')`

Applies an arithmetic operation to one or both sides of the equation.

-   **`value`** (`number` | `omdNode`): The value to apply.
-   **`operation`** (`string`): The operation to perform: `'add'`, `'subtract'`, `'multiply'`, or `'divide'`.
-   **`side`** (`string`): The side to apply the operation to: `'left'`, `'right'`, or `'both'`. Defaults to `'both'`.
-   **Returns**: `omdEquationNode` - A new equation node with the operation applied.

### `swapSides()`

Swaps the left and right sides of the equation.

-   **Returns**: `omdEquationNode` - A new equation node with the sides swapped.

### `simplify()`

Simplifies both sides of the equation using the simplification engine.

-   **Returns**: `object` - An object containing `{ success, newRoot, message }`.

### `clone()`

Creates a deep clone of the equation node, preserving its structure and provenance.

-   **Returns**: `omdEquationNode` - A new, identical instance of the equation node.

### `toString()`

Converts the equation to its string representation.

-   **Returns**: `string` - The equation as a string (e.g., `"x + 1 = 5"`).

### `evaluate(variables)`

Evaluates both sides of the equation with a given set of variables.

-   **`variables`** (`object`): A map of variable names to their numeric values (e.g., `{ x: 2 }`).
-   **Returns**: `object` - An object with the evaluated `left` and `right` side values.

### `setBackgroundStyle(style)`

Configures the background styling for the equation node. This can include `backgroundColor`, `cornerRadius`, and `pill` (for a pill-shaped background).

-   **`style`** (`object`): An object containing style properties.

### `getEqualsAnchorX()`

Returns the horizontal X-coordinate of the center of the equals sign relative to this node's origin. Useful for aligning equations in a sequence.

-   **Returns**: `number`.

### `getBackgroundPaddingX()`

Returns the horizontal padding applied by the background style.

-   **Returns**: `number`.

### `getEffectiveBackgroundPaddingX()`

Returns the effective horizontal padding used in layout, accounting for factors like pill clamping.

-   **Returns**: `number`.

### `renderTo(visualizationType, options)`

Renders the equation to different visualization formats (e.g., graph, table, balance hanger, tile equation).

-   **`visualizationType`** (`string`): The type of visualization (`"graph"`, `"table"`, `"hanger"`, `"tileequation"`).
-   **`options`** (`object`, optional): Configuration options specific to the visualization type.
-   **Returns**: `object` - A JSON object conforming to the schemas defined in `src/json-schemas.md`.

### `getLeft()`

Returns the `omdNode` representing the left side of the equation.

-   **Returns**: `omdNode`.

### `getRight()`

Returns the `omdNode` representing the right side of the equation.

-   **Returns**: `omdNode`.

## Internal Methods

-   **`_applyOperation(value, op, fn)`**: Internal helper for applying arithmetic operations to both sides.
-   **`_needsParenthesesForOperation(node, operation)`**: Determines if a child node needs parentheses when an operation is applied, based on operator precedence.
-   **`_createNodeFromValue(value)`**: Converts a number or math.js AST into an appropriate `omdNode`.
-   **`_establishGranularProvenance(newNode, originalNode, operationValue, operation)`**: Manages provenance tracking for equation operations, linking new nodes to their origins.
-   **`_isMultiplicationOperation(node)`**: Checks if a given node represents a multiplication operation.
-   **`_copyProvenanceStructure(target, source)`**: Recursively copies provenance information from a source node to a target node.
-   **`_createFunctionNode(functionName, argument)`**: Creates an `omdFunctionNode` wrapping a given argument.
-   **`_createNewEquation(left, right)`**: Creates a new `omdEquationNode` from two `omdNode` instances.
-   **`_getEffectivePadding(contentHeight)`**: Computes effective padding for background styling, considering pill radius clamping.
-   **`_applyPillToDescendants()`**: Applies pill-shaped corner radius to all descendant nodes' backgrounds when the parent equation uses a pill style.
-   **`_matchChildBackgrounds(color)`**: Hides child node backgrounds by setting their color to match the parent equation's background.
-   **`_renderToGraph(options)`**: Generates JSON for a coordinate plane graph visualization.
-   **`_renderToTable(options)`**: Generates JSON for a table visualization.
-   **`_renderSingleSideTable(side, title, options)`**: Helper for generating tables for a single side of the equation.
-   **`_renderToHanger()`**: Generates JSON for a balance hanger visualization.
-   **`_normalizeExpressionString(expr)`**: Normalizes expression strings for evaluation/graphing (e.g., inserts `*` for implicit multiplication).
-   **`_convertToHangerValues(node)`**: Converts an equation side into values suitable for a balance hanger visualization.
