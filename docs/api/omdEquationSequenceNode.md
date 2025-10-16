# omdEquationSequenceNode

Represents a sequence of equations or mathematical expressions, designed for step-by-step calculations and visual problem-solving. This node manages the vertical layout of multiple steps, ensuring elements like equals signs are vertically aligned for readability. It also provides robust provenance tracking, simplification capabilities, and filtering options for displaying different levels of detail.

## Class Definition

```javascript
export class omdEquationSequenceNode extends omdNode
```

## Constructor

### `new omdEquationSequenceNode(steps)`

Creates a new `omdEquationSequenceNode` instance.

-   **`steps`** (`Array<omdNode>`): An initial array of `omdNode` objects (typically `omdEquationNode` or `omdOperationDisplayNode`) representing the sequence of steps.

Upon construction, the sequence initializes its internal state, sets up layout helpers, and builds a comprehensive node map for provenance tracking across all steps.

## Static Properties

### `OPERATION_MAP`

A static map that links common operation names (e.g., `'add'`) to the corresponding method names on `omdEquationNode` (e.g., `'addToBothSides'`).

```javascript
{
    'add': 'addToBothSides',
    'subtract': 'subtractFromBothSides',
    'multiply': 'multiplyBothSides',
    'divide': 'divideBothSides',
}
```

## Static Methods

### `fromStringArray(stepStrings)`

Creates an `omdEquationSequenceNode` instance from an array of equation strings. Each string must contain an equals sign (`=`).

-   **`stepStrings`** (`Array<string>`): An array of strings, each representing an equation step.
-   **Returns**: `omdEquationSequenceNode` - A new instance.
-   **Throws**: `Error` if any string is not a valid equation (e.g., missing `=` or invalid format).

### `fromSteps(stepsArray)`

Creates an `omdEquationSequenceNode` instance from an array of expression strings. This method is more flexible than `fromStringArray` as it can parse both full equations (containing `=`) and general mathematical expressions.

-   **`stepsArray`** (`Array<string>`): An array of expression strings.
-   **Returns**: `omdEquationSequenceNode` - A new sequence node.

## Public Properties

-   **`steps`** (`Array<omdNode>`): An array of `omdNode` objects representing each step in the sequence.
-   **`currentStepIndex`** (`number`): The 0-based index of the currently active step. Default: `0`.
-   **`stepDescriptions`** (`Array<string>`): An array storing optional human-readable descriptions for each step.
-   **`importanceLevels`** (`Array<number>`): An array storing the importance level (0, 1, or 2) for each step, used for filtering.
-   **`currentFilterLevels`** (`Array<number>`): An array of numbers representing the currently active importance levels for step visibility. Default: `[0]`.
-   **`defaultEquationBackground`** (`object` | `null`): An object defining a default background style to be applied to all `omdEquationNode` steps added to the sequence.

## Public Methods

### `getCurrentEquation()`

Retrieves the last `omdEquationNode` in the sequence, which typically represents the current working equation.

-   **Returns**: `omdEquationNode` | `null` - The last equation, or `null` if no equations exist.

### `getCurrentStep()`

Retrieves the currently active step node based on `currentStepIndex` and visibility. It prioritizes visible equation nodes.

-   **Returns**: `omdNode` | `null` - The current step node.

### `addStep(step, descriptionOrOptions, importance)`

Adds a new step to the sequence. This method supports multiple signatures:

-   `addStep(omdNode, optionsObject)`
-   `addStep(omdNode, descriptionString, importanceNumber)`
-   `addStep(expressionString, optionsObject)`
-   `addStep(expressionString, descriptionString, importanceNumber)`

-   **`step`** (`omdNode` | `string`): The `omdNode` object or an expression string for the step.
-   **`descriptionOrOptions`** (`object` | `string`, optional): An options object (e.g., `{ description: '...', stepMark: 0 }`) or a description string.
-   **`importance`** (`number`, optional): The importance level (0, 1, or 2) if `descriptionOrOptions` is a string.
-   **Returns**: `number` - The index of the added step.

### `setDefaultEquationBackground(style)`

Sets a default background style that will be applied to all new `omdEquationNode` steps added to the sequence. It also applies the style to existing `omdEquationNode` steps immediately.

-   **`style`** (`object`): An object defining the background style (e.g., `{ backgroundColor: '#f0f0f0', cornerRadius: 8, pill: true }`).

### `rebuildNodeMap()`

Rebuilds the internal `nodeMap`, which is a comprehensive map of all `omdNode` instances within the entire sequence, including historical nodes referenced in provenance chains. This is crucial for accurate highlighting and provenance tracking.

### `recordSimplificationHistory(name, affectedNodes, message, metadata)`

Records a simplification step in the sequence's history.

-   **`name`** (`string`): The name of the simplification rule applied.
-   **`affectedNodes`** (`Array<string>`): An array of node IDs that were affected by the simplification.
-   **`message`** (`string`): A human-readable description of the simplification.
-   **`metadata`** (`object`, optional): Additional metadata about the simplification.

### `getSimplificationHistory()`

Retrieves the complete simplification history for this sequence.

-   **Returns**: `Array<object>` - An array of simplification history entries.

### `clearSimplificationHistory()`

Clears all recorded simplification history entries.

### `setFontSize(fontSize)`

Sets the font size for the entire sequence and propagates this setting to all individual steps. This triggers a re-computation of dimensions and layout.

-   **`fontSize`** (`number`): The new font size in pixels.

### `applyEquationOperation(value, operation)`

Applies a specified arithmetic operation to the current equation in the sequence and adds the result as a new step. This method also adds an `omdOperationDisplayNode` to visually represent the operation.

-   **`value`** (`number` | `string`): The constant value or expression string to apply.
-   **`operation`** (`string`): The operation name (`'add'`, `'subtract'`, `'multiply'`, `'divide'`).
-   **Returns**: `omdEquationSequenceNode` - Returns this sequence instance for chaining.

### `applyEquationFunction(functionName)`

Applies a mathematical function (e.g., `'sqrt'`, `'log'`) to both sides of the current equation in the sequence and adds the result as a new step.

-   **`functionName`** (`string`): The name of the function to apply.
-   **Returns**: `omdEquationSequenceNode` - Returns this sequence instance for chaining.

### `simplify()`

Applies one round of simplification rules to the last step in the sequence. If simplifications are applied, a new step is added to the sequence.

-   **Returns**: `object` - A result object containing `success` (boolean), `foldedCount` (number of operations applied), `isFinalSimplification` (boolean), and `message` (string).

### `simplifyAll(maxIterations)`

Repeatedly calls `simplify()` until no more simplifications can be applied or `maxIterations` is reached. This adds multiple simplification steps to the sequence.

-   **`maxIterations`** (`number`, optional): Maximum number of iterations to prevent infinite loops. Default: `50`.
-   **Returns**: `object` - A result object containing `success`, `totalSteps`, `iterations`, and `message`.

### `evaluate(variables)`

Evaluates the current step in the sequence with the given variables and logs the result to the console.

-   **`variables`** (`object`): A map of variable names to their numeric values.

### `validateSequenceProvenance()`

Validates the integrity of provenance tracking across all steps in the sequence.

-   **Returns**: `Array<object>` - An array of validation issues found.

### `select()` / `deselect()` / `highlight(color)` / `clearProvenanceHighlights()`

These methods override the default `omdNode` behavior. The `omdEquationSequenceNode` itself does not highlight or respond to selection events directly. Instead, these methods propagate the calls to their child steps, allowing individual steps to be highlighted or selected.

### `computeDimensions()`

Calculates the overall dimensions (width and height) of the entire sequence, determining the correct alignment point for all equals signs.

### `updateLayout()`

Positions each step vertically and aligns their equals signs to the calculated alignment point, ensuring a clean, readable layout.

### `toMathJSNode()`

Converts the sequence to a math.js-compatible AST node. Currently, this returns the AST of the last step in the sequence.

-   **Returns**: `object` - A math.js AST node.

### `navigateToStep(index)`

Navigates to a specific step in the sequence by setting `currentStepIndex`.

-   **`index`** (`number`): The 0-based index of the step to navigate to.
-   **Returns**: `boolean` - `true` if navigation was successful.

### `nextStep()`

Navigates to the next step in the sequence.

-   **Returns**: `boolean` - `true` if there was a next step.

### `previousStep()`

Navigates to the previous step in the sequence.

-   **Returns**: `boolean` - `true` if there was a previous step.

### `getFilteredSteps(maxImportance)`

Retrieves steps filtered by their importance level.

-   **`maxImportance`** (`number`): The maximum importance level to include (0, 1, or 2).
-   **Returns**: `Array<object>` - An array of objects, each containing `step`, `description`, `importance`, and `index`.

### `renderCurrentStep()`

Renders only the current step of the sequence.

-   **Returns**: `SVGElement` - The SVG representation of the current step.

### `toString()`

Converts the entire sequence to a multi-line string representation, including step descriptions.

-   **Returns**: `string` - Multi-line string of all steps.

### `clear()`

Removes all steps from the sequence, clears all associated data (descriptions, importance levels, history), and resets the sequence to its initial state.

### `show()` / `hide()`

Overrides `omdNode`'s `show()` and `hide()` to also update the visibility of the layout manager.

### `updateStepsVisibility(visibilityPredicate)`

Updates the visibility of multiple steps at once based on a provided predicate function. Also applies font weights based on `stepMark`.

-   **`visibilityPredicate`** (`Function`): A function that takes a step node and returns `true` if it should be visible, `false` otherwise.

## Internal Methods

-   **`_initializeState()`**: Initializes internal state variables like `currentStepIndex`, `stepDescriptions`, etc.
-   **`_initializeLayout()`**: Sets up the `jsvgLayoutGroup` for vertical arrangement.
-   **`_initializeNodeMap()`**: Initializes the `nodeMap` and calls `rebuildNodeMap()`.
-   **`_disableContainerInteractions()`**: Disables default mouse interactions on the sequence container.
-   **`_markInitialSteps()`**: Marks the initial steps with a default `stepMark` of 0.
-   **`_applyDefaultFilter()`**: Applies the default filter (showing only level 0 steps) upon initialization.
-   **`_reapplyCurrentFilter()`**: Reapplies the currently set filter levels to ensure consistent visibility.
-   **`_determineStepMark(step, options)`**: Determines the appropriate `stepMark` for a new step.
-   **`_isFullySimplified(step)`**: Heuristic to check if an equation step appears fully simplified.
-   **`_isSimpleExpression(node)`**: Heuristic to check if an expression is simple (constant, variable, or simple operations).
-   **`preserveProvenanceHistory(newNodeMap)`**: Ensures historical nodes referenced in provenance chains are preserved in the `nodeMap`.
-   **`_collectAllProvenanceIds(newNodeMap)`**: Collects all provenance IDs from nodes in the `newNodeMap`.
-   **`_collectNodeProvenanceIds(node, referencedIds, processedNodes)`**: Recursively collects provenance IDs for a given node.
-   **`_preserveReferencedNodes(referencedIds, newNodeMap)`**: Preserves nodes referenced by `referencedIds` in the `newNodeMap`.
-   **`_preserveNodeAndContext(id, newNodeMap, processedIds)`**: Preserves a node and its parent/sibling context.
-   **`_preserveParentContext(node, newNodeMap)`**: Preserves the parent context of a node.
-   **`_preserveSiblingContext(node, newNodeMap)`**: Preserves the sibling context of a node.
-   **`_handleSuccessfulSimplification(originalStep, simplificationResult)`**: Handles the result of a successful simplification, adding a new step and recording history.
-   **`_getOperationDescription(operation, value, isUnsimplified)`**: Generates a human-readable description for an equation operation.
-   **`_calculateAlignmentPoint(visibleSteps)`**: Calculates the optimal X-coordinate for aligning equals signs across all visible steps.
-   **`_calculateTotalDimensions(visibleSteps)`**: Calculates the total width and height of the sequence.
-   **`_computeStepXOffset(step)`**: Computes the horizontal offset needed to align a step within the sequence.
-   **`_stringToNode(str)`**: Converts an expression string into an `omdNode` (either `omdEquationNode` or a general expression node).