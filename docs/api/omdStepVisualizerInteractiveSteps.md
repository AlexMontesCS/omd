# omdStepVisualizerInteractiveSteps

This class creates and manages the interactive text boxes that display detailed explanations for simplification steps within the `omdStepVisualizer`. It formats the messages, handles styling, and sets up hover and click interactions, allowing users to explore the mathematical transformations.

## Class Definition

```javascript
export class omdStepVisualizerInteractiveSteps
```

## Constructor

### `new omdStepVisualizerInteractiveSteps(stepVisualizer, simplificationData)`

Creates a new `omdStepVisualizerInteractiveSteps` instance.

-   **`stepVisualizer`** (`omdStepVisualizer`): A reference to the `omdStepVisualizer` instance this component is associated with.
-   **`simplificationData`** (`object`): An object containing the simplification details for the step, typically including `message`, `rawMessages`, `ruleNames`, and potentially `operationValueNode`.

During construction, it extracts and cleans messages and rule names from the `simplificationData`, initializes layout properties (like `stepWidth`, `fontSize`), sets up the main `layoutGroup`, and creates the individual step elements.

## Public Properties

-   **`stepVisualizer`** (`omdStepVisualizer`): A reference to the associated `omdStepVisualizer` instance.
-   **`simplificationData`** (`object`): The raw data describing the simplification step.
-   **`messages`** (`Array<string>`): Cleaned and extracted messages for each sub-step.
-   **`ruleNames`** (`Array<string>`): Extracted names of the simplification rules applied.
-   **`stepElements`** (`Array<jsvgTextBox>`): An array of `jsvgTextBox` instances, each representing a line of explanation.
-   **`layoutGroup`** (`jsvgLayoutGroup`): The main `jsvgLayoutGroup` that contains all the visual elements of the interactive steps, including the background and individual step messages.
-   **`stepWidth`** (`number`): The fixed width for each step explanation box.
-   **`baseStepHeight`** (`number`): The minimum height for a single step explanation box.
-   **`headerHeight`** (`number`): The height reserved for the header text box.
-   **`fontSize`** (`number`): The base font size for the explanation text.
-   **`smallFontSize`** (`number`): A smaller font size used for secondary text (e.g., step numbers).
-   **`backgroundRect`** (`jsvgRect`): The background rectangle for the entire group of interactive steps.
-   **`contentGroup`** (`jsvgLayoutGroup`): An internal layout group that holds the header and individual step messages.
-   **`onStepHover`** (`Function`): Callback function for hover events on step explanations.
-   **`onStepClick`** (`Function`): Callback function for click events on step explanations.

## Public Methods

### `setOnStepHover(callback)`

Sets a callback function to be executed when the user hovers over a step explanation.

-   **`callback`** (`Function`): A function that receives `(stepIndex, message, isEntering)` as arguments.

### `setOnStepClick(callback)`

Sets a callback function to be executed when the user clicks on a step explanation.

-   **`callback`** (`Function`): A function that receives `(stepIndex, message)` as arguments.

### `getLayoutGroup()`

Returns the main `jsvgLayoutGroup` containing all the interactive step elements. This group should be added to the parent container (e.g., `omdStepVisualizer`'s `visualContainer`).

-   **Returns**: `jsvgLayoutGroup`.

### `setPosition(x, y)`

Sets the position of the entire interactive step group within its parent container.

-   **`x`** (`number`): The X-coordinate.
-   **`y`** (`number`): The Y-coordinate.

### `getDimensions()`

Returns the calculated width and height of the interactive step group, including its background.

-   **Returns**: `object` - An object with `width` and `height` properties.

### `destroy()`

Cleans up the component by removing all its children, clearing references, and unsetting callbacks.

## Internal Methods

-   **`_extractMessages(data)`**: Extracts and cleans messages from the `simplificationData`, removing HTML tags and bullet points.
-   **`_extractRuleNames(data)`**: Extracts rule names from the `simplificationData`, providing default values if not present.
-   **`setupLayoutGroup()`**: Initializes the main `layoutGroup` and creates its `backgroundRect`, setting initial styling.
-   **`createStepElements()`**: Orchestrates the creation of individual step explanation elements. It decides whether to create a single step element or multiple, based on the number of messages.
-   **`createSingleStepElement(message, index)`**: Creates a header and a single `jsvgTextBox` for a step explanation when there's only one message.
-   **`createMultipleStepElements()`**: Creates a header and multiple `jsvgTextBox` elements for step explanations when there are multiple messages, optionally including step numbers.
-   **`createHeaderBox(headerText)`**: Creates a styled `jsvgTextBox` to serve as a header for the explanation group.
-   **`createStepTextBox(message, index, isMultiple)`**: Creates an individual styled `jsvgTextBox` for a step message, calculates its height, and stores relevant step data.
-   **`formatStepContent(message, index, isMultiple)`**: Formats the raw message content into HTML, adding styling for step numbers, bullets, and highlighting operation details (action, value).
-   **`applyStepStyling(stepBox, content, isMultiple)`**: Applies CSS styling to the `jsvgTextBox`'s underlying DOM element and sets its `innerHTML` with the formatted content.
-   **`setupStepInteractions(stepBox)`**: Sets up `mouseenter`, `mouseleave`, and `click` event listeners for a step box, triggering hover and click callbacks.
-   **`calculateStepHeight(message)`**: Dynamically calculates the required height for a step box based on its content, using a temporary DOM element for accurate measurement.
-   **`updateBackgroundSize()`**: Adjusts the size of the `backgroundRect` to fit the dynamically calculated content height and width.
-   **`isOperationMessage(message)`**: Checks if a message string indicates an operation (e.g., "Added X to both sides").
-   **`extractOperationAction(message)`**: Extracts the action verb (e.g., "Added", "Subtracted") from an operation message.
-   **`extractOperationValue(message)`**: Extracts the value (e.g., "3", "x") from an operation message.
-   **`extractOperationValueNode(message)`**: Attempts to extract the `omdNode` representing the value from an operation message, if available in the `simplificationData`.

## How it Works

This class takes simplification data and renders it as a series of interactive text boxes. Each box represents a sub-step or a part of the explanation. It dynamically calculates sizes and positions to ensure the text boxes are readable and visually appealing. Hover and click events on these boxes can be used to trigger further actions, such as highlighting specific nodes in the main equation display.

## Example

This class is typically used internally by `omdStepVisualizerTextBoxes`.

```javascript
// Example of internal usage within omdStepVisualizerTextBoxes:
// const interactiveSteps = new omdStepVisualizerInteractiveSteps(this.stepVisualizer, simplificationData);
// this.stepVisualizer.visualContainer.addChild(interactiveSteps.getLayoutGroup());
```