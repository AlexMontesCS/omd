# omdRationalNode

Represents a fraction, with a numerator and a denominator, such as `1/2` or `(x+1)/(x-1)`. It handles the distinct visual layout of a fraction, with the numerator positioned above the denominator, separated by a horizontal line.

## Class Definition

```javascript
export class omdRationalNode extends omdNode
```

## Constructor

### `new omdRationalNode(astNodeData)`

Creates a new `omdRationalNode` instance.

-   **`astNodeData`** (`object`): The math.js AST for the division operation. It must be an `OperatorNode` with `op: '/'` and an `args` array containing two elements: the numerator and the denominator. The constructor also creates and initializes the visual `fractionLine`.

## Static Methods

### `fromString(expressionString)`

Creates an `omdRationalNode` from a string containing a division. Requires `window.math` (math.js) to be available globally for parsing.

-   **`expressionString`** (`string`): The fractional expression as a string (e.g., `"x / 2"`, `"(a+b)/(a-b)"`).
-   **Returns**: `omdRationalNode` - A new instance.
-   **Throws**: `Error` if `math.js` is not available, if the string cannot be parsed, or if it does not represent a valid division expression.

## Public Properties

-   **`numerator`** (`omdNode`): The node representing the top part of the fraction.
-   **`denominator`** (`omdNode`): The node representing the bottom part of the fraction.
-   **`fractionLine`** (`jsvgLine`): The visual horizontal line separating the numerator and denominator.

## Public Methods

### `computeDimensions()`

Calculates the dimensions of the rational node. It scales down the font size of the numerator and denominator, computes their individual dimensions, and then determines the total width (maximum of numerator/denominator width plus spacing) and total height (sum of numerator, denominator, and padding for the fraction line).

-   **Overrides**: `omdNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the rational node. It positions the `numerator` at the top, the `fractionLine` in the middle, and the `denominator` at the bottom, ensuring they are horizontally centered and have appropriate vertical spacing.

-   **Overrides**: `omdNode.updateLayout()`.

### `getAlignmentBaseline()`

Calculates the vertical alignment point for the node. For a rational node, this is the y-position of the fraction bar, which serves as the visual baseline.

-   **Overrides**: `omdNode.getAlignmentBaseline()`.

### `isConstant()`

Checks if both the numerator and the denominator are constant numerical values.

-   **Returns**: `boolean`.

### `getRationalValue()`

Retrieves the rational value of the node as a numerator/denominator pair. This method only works if the fraction is constant.

-   **Returns**: `{ num: number, den: number }`.
-   **Throws**: `Error` if the rational node is not constant.

### `getValue()`

Retrieves the numerical value of the rational node by dividing the numerator's value by the denominator's value. This method only works if the fraction is constant.

-   **Returns**: `number`.
-   **Throws**: `Error` if the rational node is not constant or if division by zero occurs.

### `clone()`

Creates a deep, structural clone of the rational node, including its `numerator` and `denominator` nodes. The `fractionLine` is also recreated. The cloned node's `provenance` array is updated to include the original node's ID.

-   **Returns**: `omdRationalNode` - A new, identical instance of the rational node.

### `toMathJSNode()`

Converts the `omdRationalNode` back into its math.js AST representation. It creates an `OperatorNode` with `op: '/'` and `fn: 'divide'`, containing the converted numerator and denominator ASTs.

-   **Returns**: `object` - A math.js `OperatorNode` for division. The returned object also includes a `clone` method for compatibility.

### `toString()`

Converts the node to its string representation, adding parentheses around the numerator and/or denominator if they are complex expressions (e.g., binary expressions) to maintain correct order of operations.

-   **Returns**: `string` - e.g., `"(x + 1) / (x - 1)"`.

### `evaluate(variables)`

Evaluates the rational expression by evaluating the numerator and denominator and then performing the division.

-   **`variables`** (`object`): A map of variable names to their values.
-   **Returns**: `number` - The result of the division.
-   **Throws**: `Error` if the denominator evaluates to zero.

### `reduce()`

If the fraction is constant, this method reduces it to its lowest terms (e.g., `4/8` becomes `1/2`). If the reduced denominator is `1`, it returns an `omdConstantNode` representing the integer value. It uses a `gcd` (greatest common divisor) helper function internally.

-   **Returns**: `omdRationalNode` | `omdConstantNode` - The reduced fraction node, or an `omdConstantNode` if it simplifies to an integer.

### `isProper()`

Checks if the fraction is proper (the absolute value of the numerator is less than the absolute value of the denominator). This check only applies to constant fractions.

-   **Returns**: `boolean` | `null` - `true` if proper, `false` if improper, `null` if the fraction is not constant.

## Internal Methods

-   **`parseValue()`**: Sets the `value` property to `"/"`.
-   **`createOperand(ast)`**: Creates an `omdNode` instance for the numerator or denominator from its AST, attempting to preserve provenance.

## Example

```javascript
import { omdRationalNode } from '@teachinglab/omd';
import * as math from 'mathjs';

// Create a fraction from a string
const fraction = omdRationalNode.fromString('(a+b)/(a-b)');

// Set font size and render
fraction.setFontSize(28);
fraction.initialize();

// Evaluate with given variables
const result = fraction.evaluate({ a: 3, b: 1 });
console.log(result); // Output: 2 (since (3+1)/(3-1) = 4/2 = 2)

// Add to an SVG container to display
// const svgContainer = new jsvgContainer();
// svgContainer.addChild(fraction);
// document.body.appendChild(svgContainer.svgObject);
```

## See Also

-   [`omdNode`](./omdNode.md) - The base class.
-   [`omdConstantNode`](./omdConstantNode.md) - For constant numerators/denominators.
-   [`omdBinaryExpressionNode`](./omdBinaryExpressionNode.md) - For complex numerators/denominators.