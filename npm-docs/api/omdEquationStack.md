# omdEquationStack

A renderable component that bundles a sequence of mathematical equations with optional UI controls (toolbar). It extends `jsvgGroup` and acts as a node that can be rendered by an `omdDisplay`.

## Class Definition

```js
import { omdEquationStack } from './omd/core/omdEquationStack.js';
```

## Constructor

### `new omdEquationStack(steps, options)`

Creates a new `omdEquationStack` instance.

-   **`steps`** (`Array<omdNode>`, optional): An initial array of equation steps. Default: empty array.
-   **`options`** (`object`, optional): Configuration options:
    -   **`toolbar`** (`boolean` | `object`): If `true`, creates a toolbar for equation operations. Can also be an object for more granular control:
        -   `enabled` (`boolean`): Whether the toolbar is enabled. Default: `false`.
        -   `position` (`string`): Where the toolbar should be positioned (`'bottom'`, `'overlay-bottom'`). Default: `'bottom'`.
        -   `showUndoButton` (`boolean`): Whether to show an undo button. Default: `false`.
        -   `onUndo` (`function`): Custom undo handler. If not provided, it attempts to call `window.onOMDToolbarUndo`.
        -   `overlayPadding` (`number`): Padding from the bottom edge when `position` is `'overlay-bottom'`. Default: `34`.
    -   **`stepVisualizer`** (`boolean`): If `true`, the underlying sequence will be an `omdStepVisualizer` instead of a plain `omdEquationSequenceNode`. Default: `false`.
    -   **`styling`** (`object`): Styling options for the equation stack:
        -   `equationBackground` (`object`): Default background style for equation steps (e.g., `{ backgroundColor: '#f0f0f0', cornerRadius: 8, pill: true }`).

## Public Properties

-   **`sequence`** (`omdEquationSequenceNode` | `omdStepVisualizer`): The underlying sequence component that manages the equation steps.
-   **`toolbar`** (`omdToolbar` | `undefined`): The toolbar component instance, if enabled.
-   **`layoutGroup`** (`jsvgLayoutGroup`): The internal layout container that arranges the sequence and toolbar vertically.
-   **`options`** (`object`): The merged configuration options passed to the constructor.
-   **`overlayPadding`** (`number`): The calculated padding for the toolbar when it's in an overlay position.

## Public Methods

### `updateLayout()`

Updates the layout and positioning of internal components. This method ensures the sequence and toolbar are correctly arranged and that the toolbar is horizontally centered if it's in-flow.

### `getSequence()`

Returns the underlying sequence instance (either `omdEquationSequenceNode` or `omdStepVisualizer`).

-   **Returns**: `omdEquationSequenceNode` | `omdStepVisualizer`.

### `getToolbar()`

Returns the toolbar instance, if one was created during construction.

-   **Returns**: `omdToolbar` | `undefined`.

### `getOverlayPadding()`

Returns the padding value used for positioning the toolbar when it's in an overlay mode.

-   **Returns**: `number`.

### `getToolbarVisualHeight()`

Returns the unscaled visual height of the toolbar's background element, if the toolbar is present.

-   **Returns**: `number`.

### `isToolbarOverlay()`

Checks if the toolbar is configured to be overlaid at the bottom of the container.

-   **Returns**: `boolean`.

### `positionToolbarOverlay(containerWidth, containerHeight, padding)`

Positions the toolbar overlay at the bottom center of the container. This method is typically called by the `omdDisplay` to ensure the toolbar remains visible and correctly placed even when the main content scales.

-   **`containerWidth`** (`number`): The width of the parent container.
-   **`containerHeight`** (`number`): The height of the parent container.
-   **`padding`** (`number`, optional): Padding from the bottom edge. Default: `16`.

### `undoLastOperation()`

Removes the last equation step and any preceding operation display node from the sequence. This method also triggers a re-layout and updates any associated step visualizer.

-   **Returns**: `boolean` - `true` if an operation was successfully undone, `false` otherwise.

## Usage

The `omdEquationStack` component is a complete equation solving interface that combines an equation sequence with an optional toolbar. It automatically handles layout and positioning.

```javascript
import { omdDisplay } from 'omd';
import { omdEquationStack } from 'omd';
import { omdEquationNode } from 'omd';

// Create display
const container = document.getElementById('math-display');
const display = new omdDisplay(container);

// Create equation steps
const steps = [
    omdEquationNode.fromString('2x + 3 = 11'),
    omdEquationNode.fromString('2x = 8'),
    omdEquationNode.fromString('x = 4')
];

// Basic equation stack with toolbar
const stack = new omdEquationStack(steps, {
    toolbar: true
});

// Render the stack
display.render(stack);

// Alternative: Create with step visualizer and custom toolbar options
const stackWithVisualizer = new omdEquationStack(steps, {
    toolbar: {
        enabled: true,
        showUndoButton: true,
        position: 'overlay-bottom'
    },
    stepVisualizer: true,
    styling: {
        equationBackground: {
            backgroundColor: '#e0f7fa',
            cornerRadius: 10,
            pill: true
        }
    }
});

display.render(stackWithVisualizer);
```

## Integration

The equation stack integrates seamlessly with the step visualizer:

```javascript
import { omdEquationStack } from 'omd';
import { omdEquationNode } from 'omd';
import { omdDisplay } from 'omd';

// Create steps for a more complex equation
const steps = [
    omdEquationNode.fromString('x/2 + 3 = 7'),
    omdEquationNode.fromString('x/2 = 4'),
    omdEquationNode.fromString('x = 8')
];

// Enable step visualizer with highlighting
const stack = new omdEquationStack(steps, {
    toolbar: true,
    stepVisualizer: true
});

// Render in display
const container = document.getElementById('equation-display');
const display = new omdDisplay(container);
display.render(stack);

// Access the visualizer for programmatic control
const visualizer = stack.getSequence();
// visualizer.nextStep(); // Progress through solution steps if interactive
```

## Layout Behavior

The equation stack automatically manages its internal layout:
- The sequence is positioned at the top
- The toolbar (if present) is centered below the sequence
- Layout updates automatically when content changes

```javascript
// Create a stack and let it handle layout automatically
const stack = new omdEquationStack(steps, { toolbar: true });

// Manual layout update (rarely needed)
stack.updateLayout();

// Access components
const sequence = stack.getSequence();
const toolbar = stack.getToolbar();
```

---

### See Also

- [`omdEquationSequenceNode`](./omdEquationSequenceNode.md)
- [`omdStepVisualizer`](./omdStepVisualizer.md)
- [`omdToolbar`](./omdToolbar.md)
- [`jsvgGroup`](../../jsvg/jsvg.js)