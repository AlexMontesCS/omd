# Expression Nodes

Expression nodes are the building blocks of mathematical expressions and equations in OMD. They form a tree structure that represents the mathematical content.

## Overview

OMD uses a node-based system where every mathematical element is represented as a node in an expression tree. This allows for powerful manipulation, simplification, and visualization of mathematical expressions.

## Core Node Classes

### omdNode

The abstract base class for all nodes in the expression tree.

**See**: [omdNode API Documentation](./omdNode.md)

### omdEquationNode

Represents a complete mathematical equation with left side, right side, and equals sign.

**Class**: `omdEquationNode extends omdNode`

#### Static Methods

**`fromString(equationString)`**

Creates an equation node from a string representation.

```javascript
import { omdEquationNode } from '@teachinglab/omd';

const equation = omdEquationNode.fromString('2x + 3 = 11');
```

- **Parameters**: 
  - `equationString` (string): The equation string (e.g., `"2x + 4 = 10"`)
- **Returns**: `omdEquationNode`
- **Throws**: Error if string is not a valid equation

#### Properties

- **`left`** (omdNode): The left side of the equation
- **`right`** (omdNode): The right side of the equation
- **`equalsSign`** (omdOperatorNode): The equals sign operator

#### Manipulation Methods

**`addToBothSides(value)`**

Returns a new equation with a value added to both sides.

```javascript
const newEq = equation.addToBothSides(5);
```

- **Parameters**: 
  - `value` (number | object): Value to add
- **Returns**: `omdEquationNode`

**`subtractFromBothSides(value)`**

Returns a new equation with a value subtracted from both sides.

```javascript
const newEq = equation.subtractFromBothSides(3);
```

- **Parameters**: 
  - `value` (number | object): Value to subtract
- **Returns**: `omdEquationNode`

**`multiplyBothSides(value)`**

Returns a new equation with both sides multiplied by a value.

```javascript
const newEq = equation.multiplyBothSides(2);
```

- **Parameters**: 
  - `value` (number | object): Value to multiply by
- **Returns**: `omdEquationNode`

**`divideBothSides(value)`**

Returns a new equation with both sides divided by a value.

```javascript
const newEq = equation.divideBothSides(2);
```

- **Parameters**: 
  - `value` (number | object): Value to divide by
- **Returns**: `omdEquationNode`

**`applyFunction(functionName)`**

Applies a function (e.g., sqrt, log) to both sides.

```javascript
const newEq = equation.applyFunction('sqrt');
```

- **Parameters**: 
  - `functionName` (string): Name of function to apply
- **Returns**: `omdEquationNode`

**`applyOperation(value, operation, side = 'both')`**

Applies an arithmetic operation to one or both sides.

```javascript
const newEq = equation.applyOperation(5, 'add', 'left');
```

- **Parameters**: 
  - `value` (number | omdNode): Value to apply
  - `operation` (string): Operation type: `'add'`, `'subtract'`, `'multiply'`, or `'divide'`
  - `side` (string): Side to apply to: `'left'`, `'right'`, or `'both'` (default: `'both'`)
- **Returns**: `omdEquationNode`

**`swapSides()`**

Swaps the left and right sides of the equation.

```javascript
const swapped = equation.swapSides();
```

- **Returns**: `omdEquationNode`

**`simplify()`**

Simplifies both sides using the simplification engine.

```javascript
const result = equation.simplify();
// Returns: { success: boolean, newRoot: omdEquationNode, message: string }
```

- **Returns**: Object with `success`, `newRoot`, and `message` properties

#### Utility Methods

**`clone()`**

Creates a deep clone of the equation node.

```javascript
const copy = equation.clone();
```

- **Returns**: `omdEquationNode`

**`toString()`**

Converts the equation to its string representation.

```javascript
const str = equation.toString();
// Returns: "2x + 3 = 11"
```

- **Returns**: `string`

**`evaluate(variables)`**

Evaluates both sides with given variable values.

```javascript
const result = equation.evaluate({ x: 4 });
// Returns: { left: 11, right: 11 }
```

- **Parameters**: 
  - `variables` (object): Map of variable names to values
- **Returns**: Object with `left` and `right` evaluated values

**`getLeft()`**

Returns the node representing the left side.

```javascript
const leftSide = equation.getLeft();
```

- **Returns**: `omdNode`

**`getRight()`**

Returns the node representing the right side.

```javascript
const rightSide = equation.getRight();
```

- **Returns**: `omdNode`

#### Styling Methods

**`setBackgroundStyle(style)`**

Configures background styling for the equation node.

```javascript
equation.setBackgroundStyle({
    backgroundColor: '#E3F2FD',
    cornerRadius: 8,
    pill: true
});
```

- **Parameters**: 
  - `style` (object): Style properties (`backgroundColor`, `cornerRadius`, `pill`)

**`getEqualsAnchorX()`**

Returns the X-coordinate of the equals sign center (for alignment).

```javascript
const anchorX = equation.getEqualsAnchorX();
```

- **Returns**: `number`

**`getBackgroundPaddingX()`**

Returns the horizontal padding applied by background style.

```javascript
const padding = equation.getBackgroundPaddingX();
```

- **Returns**: `number`

#### Visualization Methods

**`renderTo(visualizationType, options)`**

Renders the equation to different visualization formats.

```javascript
// Render to coordinate plane
const graphJSON = equation.renderTo('graph', {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
});

// Render to table
const tableJSON = equation.renderTo('table', {
    xMin: -5,
    xMax: 5,
    stepSize: 1
});

// Render to balance hanger
const hangerJSON = equation.renderTo('hanger');

// Render to tile equation
const tileJSON = equation.renderTo('tileequation');
```

- **Parameters**: 
  - `visualizationType` (string): Type of visualization: `'graph'`, `'table'`, `'hanger'`, or `'tileequation'`
  - `options` (object): Configuration options specific to visualization type
- **Returns**: JSON object for the visualization

**See**: [omdEquationNode Full API Documentation](./omdEquationNode.md)

---

### Expression Component Nodes

#### omdConstantNode

Represents numeric constants.

```javascript
import { omdConstantNode } from '@teachinglab/omd';

const constant = new omdConstantNode(ast);
```

**See**: [omdConstantNode API Documentation](./omdConstantNode.md)

---

#### omdVariableNode

Represents algebraic variables.

```javascript
import { omdVariableNode } from '@teachinglab/omd';

const variable = new omdVariableNode(ast);
```

**See**: [omdVariableNode API Documentation](./omdVariableNode.md)

---

#### omdOperatorNode

Represents mathematical operators (+, -, ×, ÷, =).

```javascript
import { omdOperatorNode } from '@teachinglab/omd';

const operator = new omdOperatorNode(ast);
```

**See**: [omdOperatorNode API Documentation](./omdOperatorNode.md)

---

#### omdBinaryExpressionNode

Represents binary operations (addition, subtraction, multiplication, division).

```javascript
import { omdBinaryExpressionNode } from '@teachinglab/omd';

const binaryExpr = new omdBinaryExpressionNode(ast);
```

**See**: [omdBinaryExpressionNode API Documentation](./omdBinaryExpressionNode.md)

---

#### omdUnaryExpressionNode

Represents unary operations (negation).

```javascript
import { omdUnaryExpressionNode } from '@teachinglab/omd';

const unaryExpr = new omdUnaryExpressionNode(ast);
```

**See**: [omdUnaryExpressionNode API Documentation](./omdUnaryExpressionNode.md)

---

#### omdPowerNode

Represents exponentiation (x²).

```javascript
import { omdPowerNode } from '@teachinglab/omd';

const power = new omdPowerNode(ast);
```

**See**: [omdPowerNode API Documentation](./omdPowerNode.md)

---

#### omdRationalNode

Represents fractions and rational numbers.

```javascript
import { omdRationalNode } from '@teachinglab/omd';

const rational = new omdRationalNode(ast);
```

**See**: [omdRationalNode API Documentation](./omdRationalNode.md)

---

#### omdSqrtNode

Represents square root expressions.

```javascript
import { omdSqrtNode } from '@teachinglab/omd';

const sqrt = new omdSqrtNode(ast);
```

**See**: [omdSqrtNode API Documentation](./omdSqrtNode.md)

---

#### omdFunctionNode

Represents mathematical functions (sin, cos, log, etc.).

```javascript
import { omdFunctionNode } from '@teachinglab/omd';

const func = new omdFunctionNode(ast);
```

**See**: [omdFunctionNode API Documentation](./omdFunctionNode.md)

---

#### omdParenthesisNode

Represents expressions enclosed in parentheses.

```javascript
import { omdParenthesisNode } from '@teachinglab/omd';

const paren = new omdParenthesisNode(ast);
```

**See**: [omdParenthesisNode API Documentation](./omdParenthesisNode.md)

---

### Container Nodes

#### omdGroupNode

A container for grouping related nodes.

```javascript
import { omdGroupNode } from '@teachinglab/omd';

const group = new omdGroupNode(ast);
```

**See**: [omdGroupNode API Documentation](./omdGroupNode.md)

---

#### omdEquationSequenceNode

A container for displaying step-by-step equation solutions.

```javascript
import { omdEquationSequenceNode } from '@teachinglab/omd';

const sequence = new omdEquationSequenceNode();
sequence.addChild(equation1);
sequence.addChild(equation2);
```

**See**: [omdEquationSequenceNode API Documentation](./omdEquationSequenceNode.md)

---

## Node Tree Structure

Nodes are organized in a tree structure:

```
omdEquationNode
├── left (omdNode)
│   └── omdBinaryExpressionNode
│       ├── left (omdConstantNode: 2)
│       ├── operator (omdOperatorNode: +)
│       └── right (omdConstantNode: 3)
├── equalsSign (omdOperatorNode: =)
└── right (omdNode)
    └── omdConstantNode: 11
```

## Working with Expression Trees

### Creating Nodes from Strings

The simplest way to create nodes is from strings:

```javascript
import { omdEquationNode } from '@teachinglab/omd';

const equation = omdEquationNode.fromString('2x + 3 = 11');
```

### Manipulating Nodes

Nodes can be manipulated to perform mathematical operations:

```javascript
// Start with: 2x + 3 = 11
const step1 = equation.subtractFromBothSides(3);
// Result: 2x = 8

const step2 = step1.divideBothSides(2);
// Result: x = 4
```

### Traversing the Tree

Nodes can be traversed to analyze structure:

```javascript
const leftSide = equation.getLeft();
const rightSide = equation.getRight();

console.log(equation.toString()); // "2x + 3 = 11"
```

### Evaluating Expressions

Nodes can be evaluated with variable values:

```javascript
const result = equation.evaluate({ x: 4 });
console.log(result); // { left: 11, right: 11 }
```

## Common Patterns

### Creating a Step-by-Step Solution

```javascript
import { omdEquationNode, omdEquationStack } from '@teachinglab/omd';

const original = omdEquationNode.fromString('2x + 3 = 11');
const step1 = original.subtractFromBothSides(3);
const step2 = step1.divideBothSides(2);

const steps = [original, step1, step2];
const stack = new omdEquationStack(steps);
```

### Simplifying Expressions

```javascript
const equation = omdEquationNode.fromString('2x + 3x = 10');
const result = equation.simplify();

if (result.success) {
    console.log(result.newRoot.toString()); // "5x = 10"
}
```

### Rendering to Visualizations

```javascript
const equation = omdEquationNode.fromString('y = x^2 - 4');

// Render to graph
const graphData = equation.renderTo('graph', {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
});

// Render to table
const tableData = equation.renderTo('table', {
    xMin: -5,
    xMax: 5,
    stepSize: 1
});
```

## See Also

- [omdNode Base Class](./omdNode.md)
- [omdEquationNode Full Documentation](./omdEquationNode.md)
- [Equations Guide](../guides/equations.md)
- [JSON Schemas](../json-schemas.md)
