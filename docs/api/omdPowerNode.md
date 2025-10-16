# omdPowerNode

Represents an exponentiation in a mathematical expression, such as `x^2` or `(a+b)^c`. This node handles the specific layout requirements of a base and a superscripted exponent, ensuring correct visual hierarchy and alignment.

## Class Definition

```javascript
export class omdPowerNode extends omdNode
```

## Constructor

### `new omdPowerNode(ast)`

Creates a new `omdPowerNode` instance.

-   **`ast`** (`object`): The math.js AST for the power operation. It must be an `OperatorNode` with `op: '^'` and an `args` array containing exactly two elements: the base and the exponent. Throws an error if the AST is invalid.

## Static Methods

### `fromString(expressionString)`

Creates an `omdPowerNode` from a string representation of a power expression. Requires `window.math` (math.js) to be available globally for parsing.

-   **`expressionString`** (`string`): The power expression as a string (e.g., `"x^2"`, `"(a+b)^c"`).
-   **Returns**: `omdPowerNode` - A new instance.
-   **Throws**: `Error` if `math.js` is not available, if the string cannot be parsed, or if it does not represent a valid power expression.

## Public Properties

-   **`base`** (`omdNode`): The node representing the base of the power operation.
-   **`exponent`** (`omdNode`): The node representing the exponent.
-   **`value`** (`string`): The operator symbol for power, which is `"^"`.

## Public Methods

### `computeDimensions()`

Calculates the dimensions of the power node. It computes the dimensions of the base and exponent (scaling the exponent's font size down). The total width is the sum of their widths, and the total height accounts for the base's height plus the vertical offset needed for the superscripted exponent.

-   **Overrides**: `omdNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the power node. It positions the `base` at the bottom of the node's bounding box to ensure space for the exponent above it. The `exponent` is then positioned to the right of the base and shifted upwards by a calculated superscript offset.

-   **Overrides**: `omdNode.updateLayout()`.

### `getSuperscriptOffset()`

Calculates the vertical offset (in pixels) by which the exponent should be raised above the base. This offset is a proportion of the current font size to ensure consistent scaling.

-   **Returns**: `number` - The vertical offset.

### `getAlignmentBaseline()`

Calculates the vertical alignment point for the node. For a power node, the baseline is determined by the baseline of its `base` expression, ensuring proper alignment with other mathematical elements.

-   **Overrides**: `omdNode.getAlignmentBaseline()`.

### `clone()`

Creates a deep, structural clone of the power node, including its `base` and `exponent` nodes. The cloned node's `provenance` array is updated to include the original node's ID.

-   **Returns**: `omdPowerNode` - A new, identical instance of the power node.

### `toMathJSNode()`

Converts the `omdPowerNode` back into its math.js AST representation. It creates an `OperatorNode` with `op: '^'` and `fn: 'pow'`, containing the converted base and exponent ASTs.

-   **Returns**: `object` - A math.js `OperatorNode` for the power operation. The returned object also includes a `clone` method for compatibility.

### `toString()`

Converts the node to its string representation, adding parentheses where necessary to preserve the correct order of operations for both the base and the exponent.

-   **Returns**: `string` - e.g., `"(x+1)^2"`.

### `evaluate(variables)`

Evaluates the power expression by raising the evaluated base to the power of the evaluated exponent. It handles cases where base or exponent might not be numerical.

-   **`variables`** (`object`): A map of variable names to their numeric values.
-   **Returns**: `number` - The result of the exponentiation, or `NaN` if base or exponent cannot be evaluated to a number.

### `isSquare()`

Checks if the exponent of the power node is the constant value `2`.

-   **Returns**: `boolean`.

### `isCube()`

Checks if the exponent of the power node is the constant value `3`.

-   **Returns**: `boolean`.

## Internal Methods

-   **`parseValue()`**: Sets the `value` property to `"^"`.
-   **`createOperand(ast)`**: Creates an `omdNode` instance for the base or exponent from its AST.

## Example

```javascript
import { omdPowerNode } from '@teachinglab/omd';
import * as math from 'mathjs';

// Create a node representing x^2
const ast = math.parse('x^2');
const powerNode = new omdPowerNode(ast);

// Set font size and render
powerNode.setFontSize(32);
powerNode.initialize();

// Check properties
console.log(powerNode.isSquare()); // true

// Evaluate
console.log(powerNode.evaluate({ x: 5 })); // 25

// Add to an SVG container to display
// const svgContainer = new jsvgContainer();
// svgContainer.addChild(powerNode);
// document.body.appendChild(svgContainer.svgObject);
```

## See Also

-   [`omdNode`](./omdNode.md) - The base class for all OMD nodes.
-   [`omdBinaryExpressionNode`](./omdBinaryExpressionNode.md) - Can be used for complex bases or exponents.