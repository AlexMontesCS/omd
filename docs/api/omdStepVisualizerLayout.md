# omdStepVisualizerLayout

Manages the visual layout, positioning, and visibility of elements within the `omdStepVisualizer`. It ensures that step dots, connecting lines, and associated text boxes are correctly positioned relative to the mathematical equations, maintaining a clean and interactive display.

## Class Definition

```javascript
export class omdStepVisualizerLayout
```

## Constructor

### `new omdStepVisualizerLayout(stepVisualizer)`

Creates a new `omdStepVisualizerLayout` instance.

-   **`stepVisualizer`** (`omdStepVisualizer`): A reference to the `omdStepVisualizer` instance this layout manager will control.

## Public Properties

-   **`stepVisualizer`** (`omdStepVisualizer`): The associated `omdStepVisualizer` instance.

## Public Methods

### `updateVisualLayout()`

Calculates and applies the positions of all visual elements (dots, lines, text boxes) relative to the mathematical equations in the sequence. It ensures proper alignment and spacing, accounting for factors like equation background padding and the dynamic size of text boxes.

### `findDotIndexForEquation(equation)`

Finds the index of the step dot associated with a given `omdEquationNode` within the `stepVisualizer.stepDots` array.

-   **`equation`** (`omdEquationNode`): The equation node to find the corresponding dot for.
-   **Returns**: `number` - The 0-based index of the dot, or `-1` if not found.

### `updateVisualZOrder()`

Manages the z-order (stacking order) of the visual elements to ensure they are rendered correctly. Lines are placed behind dots, and text boxes are placed on top of everything else.

### `updateAllLinePositions()`

Recalculates and updates the start and end points of all connecting lines between the step dots. This ensures lines accurately connect the centers of the dots, even after layout changes.

### `updateVisualVisibility()`

Adjusts the visibility of the step dots and lines based on the visibility of their corresponding equations. It also dynamically re-creates line segments only between currently visible dots, ensuring no lines are drawn to hidden steps.

### `updateDotClickability(dot)`

Enables or disables the click functionality for a specific step dot. It sets the cursor style to `"pointer"` when clickable and `"default"` otherwise, and attaches/detaches the `onclick` event handler.

-   **`dot`** (`jsvgEllipse`): The `jsvgEllipse` element representing the dot.

## Internal Methods

-   **`_getMaxEquationEffectivePaddingX()`**: Computes the maximum effective horizontal padding (x) among all visible `omdEquationNode` steps. This value is used to offset the visual tracker, preventing overlap with equation backgrounds.

## How it Works

This class works in conjunction with `omdStepVisualizer` to dynamically arrange the visual components. When the sequence of equations changes (e.g., steps are added or hidden), `omdStepVisualizer` calls methods on this layout manager to re-calculate and apply the new visual arrangement.

## Example

This class is primarily used internally by `omdStepVisualizer`:

```javascript
// Inside omdStepVisualizer's updateLayout method:
this.layoutManager.updateVisualLayout();
this.layoutManager.updateVisualVisibility();
this.layoutManager.updateAllLinePositions();
```