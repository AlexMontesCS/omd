# omdHelpers

`omdHelpers` is a collection of convenience functions designed to simplify common tasks when working with the OMD library. These helpers abstract away underlying complexities, making it easier to create and manipulate mathematical expressions and visualizations.

## Overview

The `omdHelpers` object is exported from the main `omd/core/index.js` entry point, making its functions readily available for use in your project.

## Functions

### `createNodeFromExpression(expression, mathInstance)`

Creates an `omdNode` instance from a string representation of a mathematical expression. This function parses the expression using the provided math.js instance and instantiates the appropriate `omdNode` subclass.

-   **`expression`** (`string`): The mathematical expression as a string (e.g., `"x^2 + 2x + 1"`).
-   **`mathInstance`** (`object`): The math.js instance to use for parsing the expression (e.g., `window.math`).
-   **Returns**: `omdNode` - The root `omdNode` of the created expression tree.

```javascript
import { omdHelpers } from '@teachinglab/omd';
// Assuming math.js is loaded globally as window.math

const expressionNode = omdHelpers.createNodeFromExpression('2x + 5', window.math);
// expressionNode will be an instance of omdBinaryExpressionNode or another omdNode subclass
```

### `createEquation(equationString)`

Creates an `omdEquationNode` instance from a string representation of an equation. This is a specialized helper for equations, ensuring proper parsing and node creation.

-   **`equationString`** (`string`): The equation as a string (e.g., `"x + 2 = 5"`).
-   **Returns**: `omdEquationNode` - The created `omdEquationNode`.

```javascript
import { omdHelpers } from '@teachinglab/omd';

const equation = omdHelpers.createEquation('3y - 7 = 14');
// equation will be an instance of omdEquationNode
```

### `createStepVisualizer(equationStrings)`

Creates an `omdStepVisualizer` instance from an array of equation strings. This is useful for quickly setting up a step-by-step solution display.

-   **`equationStrings`** (`Array<string>`): An array of strings, where each string represents an equation step (e.g., `["2x = 10", "x = 5"]`).
-   **Returns**: `omdStepVisualizer` - The created `omdStepVisualizer` instance.

```javascript
import { omdHelpers } from '@teachinglab/omd';

const steps = [
    '4x + 8 = 20',
    '4x = 12',
    'x = 3'
];
const visualizer = omdHelpers.createStepVisualizer(steps);
// visualizer will be an instance of omdStepVisualizer
```

## Example Usage

```javascript
import { omdDisplay, omdHelpers } from '@teachinglab/omd';
// Assuming math.js is loaded globally as window.math

// Get a container element (assuming it exists in your HTML)
const container = document.getElementById('math-display-area');

// Create an expression node using a helper
const expression = omdHelpers.createNodeFromExpression('a^2 + b^2', window.math);

// Create an equation using a helper
const equation = omdHelpers.createEquation('E = mc^2');

// Create a step visualizer using a helper
const solutionSteps = [
    'x + 5 = 10',
    'x = 5'
];
const stepVisualizer = omdHelpers.createStepVisualizer(solutionSteps);

// You can then render these nodes using omdDisplay or omdCanvas
const display = new omdDisplay(container);
display.render(expression);

// Or for the step visualizer
// display.render(stepVisualizer);
```