# omdEquationSequenceNode

Represents a sequence of mathematical steps, typically a series of equations that show the process of solving a problem. This node is a container that manages the layout, alignment, and simplification history of its steps.

## Class: `omdEquationSequenceNode extends omdNode`

```javascript
import { omdEquationSequenceNode } from './omd/nodes/omdEquationSequenceNode.js';
```

### Constructor

```javascript
new omdEquationSequenceNode(steps)
```

**Parameters:**
- `steps` {Array<[`omdNode`](./omdNode.md)>} - An array of nodes (usually `omdEquationNode` or `omdOperationDisplayNode`) that make up the sequence.


### Static Methods

#### `fromSteps(stepsArray)`
Creates an `omdEquationSequenceNode` from an array of expression strings.

```javascript
const sequence = omdEquationSequenceNode.fromSteps([
    '2x + 4 = 10',
    '2x = 6',
    'x = 3'
]);
```
- **Parameters:**
  - `stepsArray` {Array<string>} - An array of strings, where each string is a step (either an equation or an expression).
- **Returns:** `omdEquationSequenceNode` A new instance.
- **Throws:** Error if a string is not a valid equation or expression, or if math.js is not available.

### Core Methods


#### `addStep(step, options)`
Adds a new step to the end of the sequence.

- **Parameters:**
  - `step` {omdNode | string} - The node or expression string to add. If a string, it is parsed as an equation or expression.
  - `options` {Object|string} (optional) - Options for the step, such as `description` and `stepMark` (importance level), or a description string for backward compatibility.
  - `importance` {number} (optional) - Importance level (0, 1, or 2) if using legacy signature.
- **Returns:** `number` - The index of the newly added step.

---


#### `simplify()`
Applies one round of simplification to the **last step** in the sequence and adds the result as a new step.

- **Returns:** `Object` - An object detailing the result: `{ success, foldedCount, isFinalSimplification, message }`.

---


#### `simplifyAll(maxIterations)`
Repeatedly calls `simplify()` on the last step until no more simplifications can be applied or the iteration limit is reached.

- **Parameters:**
  - `maxIterations` {number} (optional) - A safeguard against infinite loops. Defaults to `50`.
- **Returns:** `Object` - An object summarizing the process: `{ success, totalSteps, iterations, message }`.

---


#### `applyEquationOperation(value, operation)`
Applies an operation (e.g., 'add', 'subtract', 'multiply', 'divide') to both sides of the last equation in the sequence. This typically adds two new steps: a visual display of the operation and the resulting new equation.

- **Parameters:**
  - `value` {number} - The value to apply.
  - `operation` {string} - The name of the operation ('add', 'subtract', 'multiply', 'divide').
- **Returns:** `omdEquationSequenceNode` The sequence instance, for chaining.

---


#### `applyEquationFunction(functionName)`
Applies a function (e.g., 'sqrt') to both sides of the last equation and adds the result as a new step.

- **Parameters:**
  - `functionName` {string} - The name of the function.
- **Returns:** `omdEquationSequenceNode` The sequence instance, for chaining.


### Other Key Methods

- `getCurrentEquation()`: Returns the last `omdEquationNode` in the sequence, or `null` if none.
- `getCurrentStep()`: Returns the current step node (may not be an equation).
- `getSimplificationHistory()`: Returns an array of all simplification events that have occurred.
- `rebuildNodeMap()`: Re-indexes all nodes within the sequence, which is crucial for provenance tracking and highlighting.
- `updateStepsVisibility(predicate)`: Shows or hides steps based on a provided function, useful for filtering and UI.
- `clear()`: Removes all steps and history from the sequence.
- `navigateToStep(index)`: Navigates to a specific step by index.
- `nextStep()`, `previousStep()`: Navigate forward/backward through steps.


### Layout and Provenance

The `omdEquationSequenceNode` automatically aligns all `omdEquationNode` steps by their equals signs, creating a clean, readable layout. It also tracks provenance for all nodes, supporting step-by-step highlighting and history.


### Example

```javascript
// Create a sequence with an initial equation
const sequence = omdEquationSequenceNode.fromSteps([
  '2 * (x + 1) = 10'
]);

// Apply operations and simplifications
sequence.applyEquationOperation(2, 'divide'); // Adds a step: (2*(x+1))/2 = 10/2
sequence.simplifyAll(); // Simplifies to x+1=5, then x=4

// Add the sequence to a display
const display = new omdDisplay(document.getElementById('container'));
display.render(sequence);
```

### See Also

- [`omdNode`](./omdNode.md) - The base class.
- [`omdEquationNode`](./omdEquationNode.md) - The primary type of node held within a sequence.
- [`omdStepVisualizer`](./omdStepVisualizer.md) - A subclass that adds interactive dots and explanations to the sequence.
