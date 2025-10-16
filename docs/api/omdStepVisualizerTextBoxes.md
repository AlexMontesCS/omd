# omdStepVisualizerTextBoxes

Manages the interactive text boxes that appear when a step dot is clicked in the `omdStepVisualizer`. This class handles the creation, positioning, and removal of these explanation popups, and integrates with highlighting and layout managers for a cohesive user experience.

## Class Definition

```javascript
export class omdStepVisualizerTextBoxes
```

## Constructor

### `new omdStepVisualizerTextBoxes(stepVisualizer, highlighting)`

Creates a new `omdStepVisualizerTextBoxes` instance.

-   **`stepVisualizer`** (`omdStepVisualizer`): A reference to the `omdStepVisualizer` instance.
-   **`highlighting`** (`omdStepVisualizerHighlighting`): A reference to the highlighting manager.

During construction, it initializes the `stepTextBoxes` array, which will store references to active text boxes.

## Public Properties

-   **`stepVisualizer`** (`omdStepVisualizer`): The associated step visualizer instance.
-   **`highlighting`** (`omdStepVisualizerHighlighting`): The associated highlighting instance.
-   **`stepTextBoxes`** (`Array<object>`): An array of objects, each representing an active text box. Each object contains `dotIndex`, `interactiveSteps` (the `omdStepVisualizerInteractiveSteps` instance), and `layoutGroup` (its `jsvgLayoutGroup`).

## Public Methods

### `createTextBoxForDot(dotIndex)`

Creates and displays an interactive text box for the specified step dot. This involves retrieving simplification data, finding the appropriate positioning reference, and then creating and adding the `omdStepVisualizerInteractiveSteps` component to the visualizer's container.

-   **`dotIndex`** (`number`): The index of the dot for which to create the text box.

### `removeTextBoxForDot(dotIndex)`

Removes the text box associated with the specified step dot. It destroys the `omdStepVisualizerInteractiveSteps` instance and removes its `layoutGroup` from the visual container, then triggers a layout update.

-   **`dotIndex`** (`number`): The index of the dot whose text box should be removed.

### `clearAllTextBoxes()`

Removes all active text boxes from the visualizer. It iterates through all tracked text boxes, destroys their `interactiveSteps` instances, removes their `layoutGroup`s from the visual container, and then clears the `stepTextBoxes` array. A layout update is triggered afterwards.

### `getStepTextBoxes()`

Returns an array of all currently active text box objects managed by this class.

-   **Returns**: `Array<object>`.

## Internal Methods

-   **`_createInteractiveStepsForDot(dotIndex, targetDot, simplificationData)`**: Creates and configures an `omdStepVisualizerInteractiveSteps` instance. It positions the text box relative to the `targetDot`, sets up hover and click interactions, and adds the text box's `layoutGroup` to the `stepVisualizer.visualContainer`.
-   **`_findDotAboveForPositioning(dotIndex)`**: Determines the appropriate `omdEquationNode` (and its corresponding dot) to position the text box relative to. It searches for the nearest visible equation above the clicked dot, falling back to the clicked dot itself if no such equation is found.
-   **`_getSimplificationDataForDot(dotIndex)`**: Retrieves the simplification data for a given dot by delegating the call to the `stepVisualizer`'s internal method (`stepVisualizer._getSimplificationDataForDot`).

## How it Works

When a user clicks a step dot in the `omdStepVisualizer`, this class:

1.  **Fetches Data**: Requests simplification data from the step visualizer for the clicked step.
2.  **Creates UI**: Instantiates an `omdStepVisualizerInteractiveSteps` component, which renders the explanation text and interactive elements.
3.  **Positions**: Calculates the optimal position for the text box, usually to the right of the step dot, and ensures it doesn't overlap with other elements.
4.  **Highlighting Integration**: Works with `omdStepVisualizerHighlighting` to trigger visual feedback when the text box is displayed or interacted with.

## Example

This class is primarily used internally by `omdStepVisualizer`:

```javascript
// Inside omdStepVisualizer's _handleDotClick method:
this.textBoxManager.createTextBoxForDot(dotIndex);

// Inside omdStepVisualizer's _clearActiveDot method:
this.textBoxManager.removeTextBoxForDot(this.activeDotIndex);
```