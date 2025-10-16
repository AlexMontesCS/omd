# omdPopup

The `omdPopup` class handles the creation and management of interactive popups for node overlays. These popups can be used for text input or for drawing with a pen tool, often integrated with a transcription service for converting handwriting to text.

## Class Definition

```javascript
export class omdPopup
```

## Constructor

### `new omdPopup(targetNode, parentElement, [options])`

Creates a new `omdPopup` instance.

-   **`targetNode`** (`omdNode`): The OMD node to which the popup is logically attached. Its dimensions can influence the popup's size.
-   **`parentElement`** (`jsvgElement`): The parent `jsvgElement` (or `jsvgGroup`) to which the popup's SVG elements will be added.
-   **`options`** (`object`, optional): Configuration options for the popup:
    -   `editable` (`boolean`): Whether the popup's input area is editable. Default: `true`.
    -   `animationDuration` (`number`): The duration of the show/hide animation in milliseconds. Default: `200`.

## Public Properties

-   **`popup`** (`jsvgLayoutGroup`): The main SVG group element that contains all popup components.
-   **`popupBackground`** (`jsvgRect`): The background rectangle of the popup.
-   **`popupTextInput`** (`jsvgTextInput`): The text input field element (active in `'text'` mode).
-   **`penCanvas`** (`omdCanvas`): The drawing canvas instance (active in `'pen'` mode).
-   **`penCanvasCleanup`** (`function`): A cleanup function for the `penCanvas`.
-   **`currentMode`** (`string`): The current mode of the popup (`'text'` or `'pen'`).
-   **`popupAnimationId`** (`number`): The ID of the current animation frame request.
-   **`penButton`** (`jsvgButton`): The button to switch to `'pen'` mode.
-   **`textButton`** (`jsvgButton`): The button to switch to `'text'` mode.
-   **`clearButton`** (`jsvgButton`): The button to clear the current input.
-   **`submitButton`** (`jsvgButton`): The button to submit the input.
-   **`onValidateCallback`** (`function`): The callback function to execute when the user submits input.
-   **`onClearCallback`** (`function`): The callback function to execute when the user clears input.
-   **`popupWidth`** (`number`): The fixed width of the popup.
-   **`buttonSize`** (`number`): The size (width and height) of the control buttons.
-   **`margin`** (`number`): General margin/padding value used for layout.
-   **`buttonSpacing`** (`number`): Spacing between buttons.
-   **`canvasMinWidth`** (`number`): Minimum width for the pen canvas.
-   **`canvasMinHeight`** (`number`): Minimum height for the pen canvas.
-   **`popupHeightMultiplier`** (`number`): Multiplier for the target node's height to determine popup height.
-   **`targetNodeDefaultHeight`** (`number`): Default height for the target node if not available.
-   **`canvasTopOffset`** (`number`): Vertical offset for the pen canvas within the popup.
-   **`canvasLeftOffset`** (`number`): Horizontal offset for the pen canvas within the popup.
-   **`transcribedText`** (`string` | `null`): Stores the text result from pen-to-text transcription.

## Public Methods

### `show(x, y)`

Creates and displays the popup at the specified coordinates with an animation.

-   **`x`** (`number`): The x-coordinate for the popup's top-left corner.
-   **`y`** (`number`): The y-coordinate for the popup's top-left corner.
-   **Returns**: `Promise` - A promise that resolves when the show animation is complete.

### `hide()`

Hides the popup with an animation and performs cleanup.

-   **Returns**: `Promise` - A promise that resolves when the hide animation is complete.

### `toggle(x, y)`

Toggles the visibility of the popup. If visible, it hides; otherwise, it shows.

-   **`x`** (`number`): The x-coordinate for showing the popup.
-   **`y`** (`number`): The y-coordinate for showing the popup.
-   **Returns**: `Promise` - A promise that resolves when the animation is complete.

### `setValidationCallback(callback)`

Sets the callback function to be invoked when the user submits their input (e.g., by clicking the submit button).

-   **`callback`** (`Function`): The function to call for validation.

### `setClearCallback(callback)`

Sets the callback function to be invoked when the user clears the input (e.g., by clicking the clear button).

-   **`callback`** (`Function`): The function to call when clearing.

### `getValue()`

Retrieves the current input value from the popup. If in pen mode, it returns the last transcribed text and then clears it.

-   **Returns**: `string` - The current input value.

### `setValue(value)`

Sets the input value of the popup's text field.

-   **`value`** (`string`): The value to set.

### `switchToMode(mode)`

Switches the popup between `'text'` and `'pen'` input modes. This updates the visible input area and button states.

-   **`mode`** (`string`): The mode to switch to. Can be `'text'` or `'pen'`.

### `flashValidation(isValid)`

Flashes the popup background (and associated elements) to visually indicate whether the user's input was valid or invalid.

-   **`isValid`** (`boolean`): `true` for a success flash (greenish), `false` for an error flash (reddish).

### `areExpressionsEquivalent(expr1, expr2)`

Compares two mathematical expressions for equivalence. It uses `math.js` to simplify and evaluate expressions with random variable assignments to robustly check for mathematical equality.

-   **`expr1`** (`string`): The first expression string.
-   **`expr2`** (`string`): The second expression string.
-   **Returns**: `boolean` - `true` if the expressions are mathematically equivalent, `false` otherwise.

### `destroy()`

Completely destroys the popup, removing all associated DOM elements, event listeners, and internal references. This method calls `hide()` internally to ensure a clean animated exit.

### `repositionCanvasRelativeToPopup()`

Manually triggers an update to the pen canvas's position to ensure it remains correctly aligned with the popup, especially after layout changes.

## Internal Methods

-   **`_createPopup()`**: Creates the main `jsvgLayoutGroup` for the popup, its background, and initializes buttons and input areas.
-   **`_createButtons(popupWidth, popupHeight, buttonSize, margin, buttonSpacing)`**: Creates and positions the clear, submit, pen, and text mode switch buttons.
-   **`_createTextInput(popupWidth, popupHeight, margin)`**: Creates and styles the `jsvgTextInput` element for text input mode.
-   **`_createPenCanvas()`**: Initializes the `omdCanvas` instance for drawing in pen mode. It handles embedding the HTML canvas within an SVG `foreignObject` if necessary.
-   **`_showPenMode()`**: Activates the pen drawing mode, hiding the text input and showing/creating the pen canvas.
-   **`_showTextMode()`**: Activates the text input mode, hiding the pen canvas and showing the text input.
-   **`_addCanvasToParent(element)`**: Adds the pen canvas's DOM element (or its `foreignObject` wrapper) to the appropriate parent, handling positioning.
-   **`_updateButtonStates()`**: Updates the visual appearance of the mode switch buttons to reflect the `currentMode`.
-   **`_positionPopup(x, y)`**: Sets the absolute position of the main popup SVG group.
-   **`_animateOpacity(fromOpacity, toOpacity, duration)`**: Handles the smooth opacity animation for showing and hiding the popup.
-   **`_flashAllElements(flashColor)`**: Applies a temporary background color flash to all relevant popup elements (background, canvas) to indicate validation feedback.
-   **`_downloadCanvasAsBitmap()`**: Converts the content of the pen canvas to a PNG bitmap and initiates the transcription process.
-   **`_transcribeCanvas(imageBlob)`**: Sends the pen canvas image data to the `omdTranscriptionService` for handwriting recognition.
-   **`_setSubmitButtonLoading(isLoading)`**: Controls the loading state of the submit button, including a blinking animation.
-   **`_startBlinkingAnimation()`**: Initiates the blinking animation for the submit button.
-   **`_stopBlinkingAnimation()`**: Stops the blinking animation for the submit button.
-   **`_setupResizeObserver()`**: Sets up a `ResizeObserver` to monitor changes in the popup's dimensions and reposition the pen canvas accordingly.
-   **`_updateCanvasPosition()`**: Recalculates and applies the correct position and size for the pen canvas within the popup's content area.
-   **`_cleanup()`**: Performs comprehensive cleanup of all popup-related DOM elements, event listeners, and internal references.

## Modes

The `omdPopup` has two primary interaction modes:

-   **Text Mode**: This is the default mode, providing a standard text input field (`jsvgTextInput`).
-   **Pen Mode**: This mode allows the user to draw directly inside the popup using an embedded `omdCanvas`. The drawing can then be transcribed to text using an external OCR service (via `omdTranscriptionService`).

Users can switch between modes using the `'T'` (Text) and `'P'` (Pen) buttons on the popup.

## Example Usage

```javascript
import { omdPopup } from '@teachinglab/omd';
import { omdNode } from '@teachinglab/omd'; // Assuming you have an omdNode instance
import { jsvgGroup } from '@teachinglab/jsvg'; // Assuming a parent jsvgElement

// Create a dummy node and parent element for demonstration
const targetNode = new omdNode({});
const parentElement = new jsvgGroup();

// Create a popup for a node
const popup = new omdPopup(targetNode, parentElement);

// Set a validation callback
popup.setValidationCallback(() => {
    const value = popup.getValue();
    if (popup.areExpressionsEquivalent(value, 'correct')) {
        popup.flashValidation(true);
        popup.hide();
    } else {
        popup.flashValidation(false);
    }
});

// Set a clear callback
popup.setClearCallback(() => {
    console.log('Popup input cleared!');
});

// Show the popup at a specific position
// popup.show(100, 100);

// To add the parentElement to the DOM for actual display:
// document.body.appendChild(parentElement.svgObject);
```