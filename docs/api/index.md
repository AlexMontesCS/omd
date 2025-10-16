# OMD Library Entry Point

This module (`omd/core/index.js`) serves as the main entry point for the OMD (Open Math Display) library. It re-exports all core classes, visualization components, and utility functions, making them easily accessible from a single import.

## Overview

When you import from `@teachinglab/omd` (or directly from `omd/core/index.js`), you gain access to a comprehensive set of tools for building and manipulating mathematical expressions and their visual representations.

## Named Exports

The primary way to use the library is through its named exports.

### Core Node Classes

All classes extending `omdNode` are re-exported, allowing you to construct and work with various types of mathematical expressions:

- [`omdNode`](./omdNode.md)
- [`omdBinaryExpressionNode`](./omdBinaryExpressionNode.md)
- [`omdConstantNode`](./omdConstantNode.md)
- [`omdEquationNode`](./omdEquationNode.md)
- [`omdEquationSequenceNode`](./omdEquationSequenceNode.md)
- [`omdEquationStack`](./omdEquationStack.md)
- [`omdFunctionNode`](./omdFunctionNode.md)
- [`omdGroupNode`](./omdGroupNode.md)
- [`omdLeafNode`](./omdLeafNode.md)
- [`omdOperationDisplayNode`](./omdOperationDisplayNode.md)
- [`omdOperatorNode`](./omdOperatorNode.md)
- [`omdParenthesisNode`](./omdParenthesisNode.md)
- [`omdPowerNode`](./omdPowerNode.md)
- [`omdRationalNode`](./omdRationalNode.md)
- [`omdSqrtNode`](./omdSqrtNode.md)
- [`omdUnaryExpressionNode`](./omdUnaryExpressionNode.md)
- [`omdVariableNode`](./omdVariableNode.md)

### Visualization Components

These classes provide high-level components for rendering and interacting with mathematical expressions:

- [`omdStepVisualizer`](./omdStepVisualizer.md)
- [`omdDisplay`](./omdDisplay.md)
- [`omdToolbar`](./omdToolbar.md)

### Utilities

Essential utility functions and classes for parsing, simplification, and configuration management:

- `getNodeForAST`: A factory function to get the correct `omdNode` class for a given math.js AST.
- `simplifyStep`: Applies a single simplification step to an expression.
- `initializeConfig`: Initializes the OMD configuration.
- `setConfig`: Sets the OMD configuration.
- `getDefaultConfig`: Retrieves the default OMD configuration.
- `omdExpression`: A base class for expressions.
- `omdColor`: A utility class for working with colors.

### `omdHelpers`

A collection of convenience functions for common operations:

#### `createNodeFromExpression(expression, mathjs)`
- Creates an `omdNode` instance from a string expression using a provided math.js instance.

#### `createEquation(equationString)`
- Creates an `omdEquationNode` from a string representation of an equation.

#### `createStepVisualizer(equationStrings)`
- Creates an `omdStepVisualizer` instance from an array of equation strings.

## Re-Exports

The index also re-exports all named exports from the following modules:

-   `../step-visualizer/omdStepVisualizer.js`
-   `./omdUtilities.js`
-   `../display/omdToolbar.js`

This means you can import their functions directly from the main entry point.

## Default Export

The module also provides a default export, which is an object containing all the re-exported classes and functions, organized into logical groups (`nodes`, `helpers`, etc.). This allows for a more structured import if preferred.

```javascript
import OMD from '@teachinglab/omd';

const equation = new OMD.nodes.omdEquationNode(...);
const display = new OMD.omdDisplay(...);
const helpers = OMD.helpers;
```

## Example Usage

```javascript
import { omdDisplay, omdEquationNode, omdHelpers } from '@teachinglab/omd';

// Create an equation using a helper
const equation = omdHelpers.createEquation('2x + 5 = 15');

// Create a display and render the equation
const displayContainer = document.getElementById('math-container');
const display = new omdDisplay(displayContainer);

display.render(equation);

// You can also directly access node classes
const constant = new omdConstantNode({ value: 10 });
```