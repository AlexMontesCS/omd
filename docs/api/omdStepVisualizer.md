# omdStepVisualizer

Visualizes a sequence of mathematical steps (typically equations) and provides interactive explanations for how one step transforms into the next. It extends `omdEquationSequenceNode` by adding a visual track of dots and lines to the right of the steps, which can be clicked to reveal details about the simplification or operation applied.

## Class Hierarchy

```
omdNode
  └─ omdEquationSequenceNode
       └─ omdStepVisualizer
```

See: [`omdEquationSequenceNode`](./omdEquationSequenceNode.md) for base sequence functionality.

## Constructor

### `new omdStepVisualizer(steps)`

Creates a new `omdStepVisualizer` instance.

-   **`steps`** (`Array<omdNode>`): An array of nodes (usually `omdEquationNode`) representing the initial steps in the sequence.

During construction, it initializes internal arrays for `stepDots` and `stepLines`, creates a `visualContainer` for these elements, and sets up managers for `highlighting`, `textBoxes`, and `layout`. It also populates `nodeToStepMap` for efficient lookup.

## Public Properties

-   **`stepDots`** (`Array<jsvgEllipse>`): An array of `jsvgEllipse` objects representing the clickable dots for each equation step.
-   **`stepLines`** (`Array<jsvgLine>`): An array of `jsvgLine` objects connecting the step dots.
-   **`visualContainer`** (`jsvgLayoutGroup`): The `jsvgLayoutGroup` that holds the `stepDots` and `stepLines`.
-   **`dotRadius`** (`number`): The radius of the step dots, determined by `omdConfigManager`.
-   **`lineWidth`** (`number`): The stroke width of the connecting lines.
-   **`visualSpacing`** (`number`): The horizontal spacing between the equation sequence and the visual tracker.
-   **`activeDotIndex`** (`number`): The 0-based index of the currently active (clicked) dot. `-1` if none.
-   **`dotsClickable`** (`boolean`): Controls whether the step dots can be clicked to show explanations. Default: `true`.
-   **`nodeToStepMap`** (`Map<string, number>`): A map from `omdNode` IDs to their corresponding step index in the sequence.
-   **`stepVisualizerHighlights`** (`Set<string>`): A set of node IDs that are currently highlighted by the visualizer.
-   **`highlighting`** ([`omdStepVisualizerHighlighting`](./omdStepVisualizerHighlighting.md)): The manager responsible for all highlighting logic.
-   **`textBoxManager`** ([`omdStepVisualizerTextBoxes`](./omdStepVisualizerTextBoxes.md)): The manager responsible for creating, positioning, and removing the explanation text boxes.
-   **`layoutManager`** ([`omdStepVisualizerLayout`](./omdStepVisualizerLayout.md)): The manager responsible for layout and z-ordering of all visual elements.

## Public Methods

### `rebuildVisualizer()`

Forces a complete rebuild of the visual elements (dots and lines) from scratch. This is useful after significant changes to the underlying `steps` array.

### `addStep(step, options)`

Adds a new step to the sequence. This method overrides the base `omdEquationSequenceNode.addStep` to also create and manage the corresponding visual dot and connecting line for the new step.

-   **`step`** (`omdNode` | `string`): The node object or expression string for the step.
-   **`options`** (`object`): Options for the step, such as `description` and `stepMark` (importance level).

### `getNodeStepNumber(nodeId)`

Retrieves the step number (index) associated with a given `omdNode` ID within the sequence.

-   **`nodeId`** (`string`): The ID of the node to look up.
-   **Returns**: `number` | `undefined` - The 0-based step index, or `undefined` if the node is not found within a step.

### `computeDimensions()`

Calculates the overall dimensions of the visualizer, accounting for the width and height of the equation sequence and the additional space required for the visual tracker (dots and lines).

-   **Overrides**: `omdEquationSequenceNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the visualizer, positioning both the equation sequence and the visual tracker elements. It delegates to the `layoutManager` for precise positioning of dots and lines.

-   **Overrides**: `omdEquationSequenceNode.updateLayout()`.

### `undoLastOperation()`

Removes the most recent operation and its resulting equation from the sequence. This method overrides the base `omdEquationSequenceNode.undoLastOperation` to also trigger a `rebuildVisualizer()` to ensure visual elements are synchronized.

-   **Returns**: `boolean` - `true` if an operation was undone, `false` otherwise.

### `setDotColor(dotIndex, color)`

Sets the fill and stroke color of a specific step dot.

-   **`dotIndex`** (`number`): The index of the dot to color.
-   **`color`** (`string`): The new color.

### `setLineAboveColor(dotIndex, color)`

Sets the stroke color of the line segment directly above a specific step dot.

-   **`dotIndex`** (`number`): The index of the dot whose preceding line should be colored.
-   **`color`** (`string`): The new color.

### `setDotsClickable(enabled)`

Enables or disables the ability for users to click on the step dots to reveal explanations.

-   **`enabled`** (`boolean`): `true` to enable clicking, `false` to disable.

### `getStepTextBoxes()`

Retrieves the array of currently visible explanation text box components managed by the `textBoxManager`.

-   **Returns**: `Array<omdStepVisualizerTextBox>` - The active text box instances.

## Internal Methods

-   **`_initializeVisualElements()`**: Creates and initializes the visual dots and lines for all existing equation steps, and populates the `nodeToStepMap`.
-   **`_createStepDot(equation, index)`**: Creates a single `jsvgEllipse` representing a step dot, associates it with an equation, and adds it to the `visualContainer`.
-   **`_createStepLine(fromIndex, toIndex)`**: Creates a `jsvgLine` connecting two step dots and adds it to the `visualContainer`.
-   **`_clearVisualElements()`**: Removes all existing dots, lines, and text boxes from the display and resets internal arrays.
-   **`_handleDotClick(dot, dotIndex)`**: Event handler for when a step dot is clicked. It manages the active dot state, triggers highlighting, and creates/removes explanation text boxes.
-   **`setActiveDot(dotIndex)`**: Sets a specific dot as the visually active one, changing its color and triggering the display of its explanation text box.
-   **`_clearActiveDot()`**: Clears the currently active dot, resetting its color, removing its text box, and clearing highlights.
-   **`_getSimplificationDataForDot(dotIndex)`**: Gathers and formats the simplification and operation data relevant to a specific step dot, used to populate the explanation text box.
-   **`_createDefaultSimplificationData(message)`**: Helper to create a default data object for step explanations.
-   **`_findPreviousVisibleEquationIndex(currentIndex)`**: Finds the index of the last visible equation step before the given `currentIndex`.
-   **`_getRelevantSimplifications(simplificationHistory, startIndex, endIndex)`**: Filters the full simplification history to find entries relevant to a specific range of steps.
-   **`_createMultipleSimplificationsData(simplifications)`**: Formats data for displaying multiple simplification events in a single text box.
-   **`_checkForOperationStep(equationIndex)`**: Checks if a step at a given index is an `omdOperationDisplayNode` and extracts its data.
-   **`_checkForSingleSimplification(simplificationHistory, equationIndex)`**: Checks for a single simplification entry relevant to a specific step.
-   **`_getFallbackSimplificationData(equationIndex)`**: Provides a default explanation if no specific simplification or operation data is found for a step.

## Example

```javascript
import { omdStepVisualizer } from '@teachinglab/omd';
import { omdEquationNode } from '@teachinglab/omd';
import { omdDisplay } from '@teachinglab/omd';

// 1. Define the steps of a solution (must be omdEquationNode for dots to appear)
const steps = [
  omdEquationNode.fromString('2x + 4 = 10'),
  omdEquationNode.fromString('2x = 6'),
  omdEquationNode.fromString('x = 3')
];

// 2. Create the visualizer
const visualizer = new omdStepVisualizer(steps);

// 3. Add it to a display container
const display = new omdDisplay(document.getElementById('container'));
display.render(visualizer);

// Now the steps will be displayed with interactive dots on the right.
// Only omdEquationNode steps are visualized with dots/lines.
// Clicking the dot next to "2x = 6" will explain that 4 was subtracted from both sides.
```