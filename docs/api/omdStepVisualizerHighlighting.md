# omdStepVisualizerHighlighting

Manages the highlighting of nodes within mathematical expressions displayed by the `omdStepVisualizer`. It uses a robust tree differencing algorithm to identify changes between consecutive steps and highlights affected nodes, providing visual feedback on transformations.

## Class Definition

```javascript
export class omdStepVisualizerHighlighting
```

## Constructor

### `new omdStepVisualizerHighlighting(stepVisualizer)`

Creates a new `omdStepVisualizerHighlighting` instance.

-   **`stepVisualizer`** (`omdStepVisualizer`): The step visualizer instance this highlighting manager is associated with.

During construction, it initializes a `Set` to track `highlightedNodes` and sets `educationalMode` to `true` by default.

## Public Properties

-   **`stepVisualizer`** (`omdStepVisualizer`): The associated step visualizer instance.
-   **`highlightedNodes`** (`Set<omdNode>`): A set of `omdNode` instances that are currently highlighted by this manager.
-   **`educationalMode`** (`boolean`): If `true`, enables highlighting of pedagogical simplifications (e.g., intermediate steps that might be skipped in a final solution). Default: `true`.

## Public Methods

### `highlightAffectedNodes(dotIndex, isOperation = false)`

This is the main method to trigger highlighting. It compares the equation at `dotIndex` with the previous visible equation in the sequence to identify changes and then applies appropriate highlighting.

-   **`dotIndex`** (`number`): The index of the dot (step) for which to highlight affected nodes.
-   **`isOperation`** (`boolean`, optional): If `true`, indicates that the step is an operation (e.g., adding to both sides), which affects how provenance is highlighted. Default: `false`.

**How it Works:**

1.  **Clear Existing Highlights**: First, any previously active highlights are cleared.
2.  **Identify Equations**: It determines the `currentEquation` (associated with `dotIndex`) and finds the `previousEquation` (the nearest visible equation before the current one).
3.  **Tree Differencing**: It uses `omdTreeDiff.findChangedNodes` to perform a robust comparison between the `previousEquation` and `currentEquation`. This algorithm identifies nodes that have been added, removed, or modified.
4.  **Direct Highlighting**: Nodes identified as directly changed by the diff algorithm are highlighted with a primary explanation color (`omdColor.explainColor`).
5.  **Provenance Highlighting**: For non-operation steps, the system traces the `provenance` (history) of the directly changed nodes back to their origins in the `previousEquation`. These originating nodes are then highlighted with a secondary provenance color (`omdColor.provenanceColor`), visually connecting the transformation.

### `clearHighlights()`

Removes all active highlights managed by this class from the expression tree. It iterates through all `highlightedNodes` and calls `setExplainHighlight(false)` on them, then clears its internal `highlightedNodes` set.

## Internal Methods

-   **`_highlightNode(node)`**: Applies the standard explanation highlight color (`omdColor.explainColor`) to a single `omdNode` by calling its `setExplainHighlight(true)` method and adds the node to `highlightedNodes`.
-   **`_findNearestVisibleEquationAbove(currentIndex)`**: Searches backward from `currentIndex` in the `stepVisualizer.steps` array to find the closest `omdEquationNode` that is currently visible.
-   **`_highlightProvenanceNodes(changedNodes, previousEquation)`**: Iterates through `changedNodes` and their `provenance` chains to identify and highlight corresponding nodes in the `previousEquation` with `omdColor.provenanceColor`. It uses `rootNode.nodeMap` for efficient node lookup and a `visited` set to prevent redundant processing.
-   **`_belongsToEquation(node, targetEquation)`**: Checks if a given `omdNode` is part of the subtree of a `targetEquation` by traversing up its parent chain.
-   **`_highlightProvenanceNode(node)`**: Applies the secondary provenance highlighting style (`omdColor.provenanceColor`) to a single `omdNode` by calling its `setExplainHighlight(true, omdColor.provenanceColor)` method.

## Example

This class is typically used internally by `omdStepVisualizer` when a step dot is clicked:

```javascript
// Inside omdStepVisualizer's _handleDotClick method:
this.highlighting.highlightAffectedNodes(dotIndex, isOperation);

// Inside omdStepVisualizer's _clearActiveDot method:
this.highlighting.clearHighlights();
```