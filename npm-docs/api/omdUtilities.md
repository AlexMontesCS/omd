# omdUtilities

This module provides a collection of utility functions primarily used for mapping math.js AST nodes to OMD node classes, determining rendering behavior, and calculating text dimensions. These functions are internal helpers that support the core OMD node system.

## Functions

### `astToOmdType(type, ast)`

Maps a math.js AST node type to its corresponding OMD node class. This function is crucial for dynamically creating the correct `omdNode` subclass based on the parsed expression.

-   **`type`** (`string`): The `type` property of the AST node (e.g., `"OperatorNode"`, `"ParenthesisNode"`).
-   **`ast`** (`object`): The full AST node object, which may contain additional context (e.g., `op` for `OperatorNode`, `fn` for `FunctionNode`).
-   **Returns**: `class` - The appropriate `omdNode` class constructor.

**Detailed Logic:**

-   **`AssignmentNode`**: Returns `omdEquationNode`.
-   **`OperatorNode`**: 
    -   If `op` is `'-'` and `args.length` is `1` (unary minus), returns `omdUnaryExpressionNode`.
    -   If `op` is `'='`, returns `omdEquationNode`.
    -   If `op` is `'^'`, returns `omdPowerNode`.
    -   If `op` is `'/'`, returns `omdRationalNode`.
    -   Otherwise (binary operator), returns `omdBinaryExpressionNode`.
-   **`ParenthesisNode`**: Returns `omdParenthesisNode`.
-   **`ConstantNode`**: Returns `omdConstantNode`.
-   **`SymbolNode`**: Returns `omdVariableNode`.
-   **`FunctionNode`**: 
    -   If `fn.name` or `name` is `'multiply'` and `ast.implicit` is `true` (implicit multiplication), returns `omdBinaryExpressionNode`.
    -   If `fn.name` or `name` is `'sqrt'`, returns `omdSqrtNode`.
    -   Otherwise, returns `omdFunctionNode`.
-   **Default**: Returns `omdNode`.

### `getNodeForAST(ast)`

A wrapper function that takes a complete math.js AST node and returns the corresponding OMD node class. It uses `astToOmdType` internally, handling cases where the AST might have a `mathjs` property indicating its type.

-   **`ast`** (`object`): The math.js AST node.
-   **Returns**: `class` - The appropriate `omdNode` class constructor.

### `getTextBounds(text, fontSize)`

Calculates the rendered width and height of a given text string at a specific font size. This is achieved by creating a temporary, hidden `<span>` element in the DOM, applying the text and styling, measuring its dimensions, and then removing it.

-   **`text`** (`string`): The text content to measure.
-   **`fontSize`** (`number`): The font size in pixels.
-   **Returns**: `object` - An object with `width` and `height` properties.

### `shouldUseFractionNotation(ast)`

Determines whether a division operation (represented by an AST node) should be rendered as a fraction (stacked numerator over denominator) or as a linear division (e.g., `a / b`). This decision is based on the complexity of the numerator and denominator.

-   **`ast`** (`object`): The AST node representing a division operation.
-   **Returns**: `boolean` - `true` if the division should be rendered as a fraction, `false` otherwise.

### `isComplexExpression(ast)`

Checks if an AST node represents a "complex" expression, typically one that contains multiple operations or nested structures. This function is used by `shouldUseFractionNotation` to decide on the appropriate rendering style for fractions.

-   **`ast`** (`object`): The AST node to check.
-   **Returns**: `boolean` - `true` if the expression is considered complex, `false` otherwise.

## Example

```javascript
import { getNodeForAST, getTextBounds } from '@teachinglab/omd'; // Assuming @teachinglab/omd exports these
import * as math from 'mathjs';

// Example of getting a node class for an expression
const astExpression = math.parse('x + 2');
const NodeClassExpression = getNodeForAST(astExpression);
const nodeExpression = new NodeClassExpression(astExpression);
console.log(nodeExpression.type); // e.g., "omdBinaryExpressionNode"

// Example of getting a node class for an equation
const astEquation = math.parse('y = 2x');
const NodeClassEquation = getNodeForAST(astEquation);
const nodeEquation = new NodeClassEquation(astEquation);
console.log(nodeEquation.type); // "omdEquationNode"

// Example of getting text bounds
const bounds = getTextBounds('Hello World', 24);
console.log(`Text width: ${bounds.width}, height: ${bounds.height}`);
```