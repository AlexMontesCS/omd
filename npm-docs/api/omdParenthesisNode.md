# omdParenthesisNode

Represents a parenthetical grouping in a mathematical expression, such as `(x + 2)`. This node is crucial for enforcing the correct order of operations and visually grouping parts of an expression.

## Class Definition

```javascript
export class omdParenthesisNode extends omdNode
```

## Constructor

### `new omdParenthesisNode(astNodeData)`

Creates a new `omdParenthesisNode` instance.

-   **`astNodeData`** (`object`): The math.js AST node for the parenthesized expression. It must contain a `content` property (or `args[0]`) which is the AST for the inner expression.

During construction, it creates `omdGroupNode` instances for the opening and closing parentheses and an `omdNode` for the inner expression.

## Static Methods

### `fromString(expressionString)`

Creates an `omdParenthesisNode` from a string representation of a parenthesized expression. The input string must start and end with parentheses.

-   **`expressionString`** (`string`): The expression, which must be enclosed in parentheses (e.g., `"(2 * x)"`).
-   **Returns**: `omdParenthesisNode` - A new instance.
-   **Throws**: `Error` if `math.js` is not available, if the string is not properly enclosed in parentheses, or if it's not a valid parenthesized expression.

## Public Properties

-   **`expression`** (`omdNode`): The node representing the mathematical expression inside the parentheses.
-   **`open`** (`omdGroupNode`): The `omdGroupNode` for the opening parenthesis `(`. 
-   **`closed`** (`omdGroupNode`): The `omdGroupNode` for the closing parenthesis `)`. 

## Public Methods

### `computeDimensions()`

Calculates the dimensions of the parenthesis node. It sums the widths of the opening parenthesis, the inner expression, and the closing parenthesis. The height is determined by the maximum height of these components plus a small amount of padding that scales with font size.

-   **Overrides**: `omdNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the parenthesis node and its children. It positions the inner `expression` and then centers the `open` and `closed` parentheses vertically around the mathematical baseline of the inner expression. This ensures proper visual alignment, especially for expressions containing superscripts or subscripts.

-   **Overrides**: `omdNode.updateLayout()`.

### `getAlignmentBaseline()`

Returns the vertical y-coordinate for alignment. For a parenthesis node, this is the baseline of its inner expression.

-   **Overrides**: `omdNode.getAlignmentBaseline()`.

### `clone()`

Creates a deep, structural clone of the parenthesis node, including its inner `expression` and `omdGroupNode` children. The cloned node's `provenance` array is updated to include the original node's ID.

-   **Returns**: `omdParenthesisNode` - A new, identical instance of the parenthesis node.

### `isConstant()`

Checks if the inner expression is a constant value.

-   **Returns**: `boolean` - `true` if `this.expression.isConstant()` is `true`, `false` otherwise.

### `getValue()`

Returns the numerical value of the inner expression, if it is constant.

-   **Returns**: `number`.
-   **Throws**: `Error` if the inner expression is not constant or cannot be evaluated.

### `toMathJSNode()`

Converts the `omdParenthesisNode` back into its math.js AST representation. It creates a `ParenthesisNode` AST object with the converted inner expression.

-   **Returns**: `object` - A math.js `ParenthesisNode` AST object. The returned object also includes a `clone` method for compatibility.

### `toString()`

Converts the node to its string representation, including the parentheses.

-   **Returns**: `string` - e.g., `"(x + 2)"`.

### `evaluate(variables)`

Evaluates the inner expression of the parenthesis node.

-   **`variables`** (`object`): A map of variable names to their numeric values.
-   **Returns**: `number` - The result of the inner expression's evaluation.
-   **Throws**: `Error` if the inner expression cannot be evaluated.

### `isNecessary()`

Checks if the parentheses are mathematically necessary to maintain the correct order of operations, based on the parent node's context and the type of the inner expression. For example, parentheses around a simple constant or variable are generally not necessary, but they are often required around complex expressions within a power or binary operation.

-   **Returns**: `boolean` - `true` if the parentheses are required, `false` otherwise.

## Internal Methods

-   **`createParenthesis(symbol)`**: Creates an `omdGroupNode` for an opening or closing parenthesis.
-   **`createExpression(ast)`**: Creates an `omdNode` instance for the inner expression from its AST.

## Example

```javascript
import { omdParenthesisNode } from '@teachinglab/omd';
import * as math from 'mathjs';

// Create a node representing (x + 2)
const innerExpressionAst = math.parse('x + 2');
const parenNode = new omdParenthesisNode({ content: innerExpressionAst });

// Set font size and render
parenNode.setFontSize(28);
parenNode.initialize();

// The simplification engine might remove these parentheses if they are not necessary
// const simplified = parenNode.simplify();

// Add to an SVG container to display
// const svgContainer = new jsvgContainer();
// svgContainer.addChild(parenNode);
// document.body.appendChild(svgContainer.svgObject);
```

## See Also

-   [`omdNode`](./omdNode.md) - The base class for all OMD nodes.
-   [`omdGroupNode`](./omdGroupNode.md) - The class used to render the individual `(` and `)` symbols.
-   [`omdBinaryExpressionNode`](./omdBinaryExpressionNode.md) - A common type for the inner expression within parentheses.