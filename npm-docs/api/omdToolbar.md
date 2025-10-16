# omdToolbar

Provides a visual toolbar UI for applying mathematical operations and functions to an `omdEquationSequenceNode` in the OMD system. The toolbar is rendered as an SVG group and supports operations like add, subtract, multiply, divide, and function application (e.g., sqrt, cos, etc.). It features dynamic popups for selecting operations and inputting values.

## Class Definition

```javascript
export class omdToolbar
```

## Constructor

### `new omdToolbar(parentContainer, sequence, [options])`

Creates an instance of the `omdToolbar`.

-   **`parentContainer`** (`jsvgGroup`): The parent SVG group where the toolbar will be rendered.
-   **`sequence`** (`omdEquationSequenceNode`): The sequence node to which operations will be applied.
-   **`options`** (`object`, optional): Toolbar configuration options:
    -   `height` (`number`): Toolbar height. Default: `60`.
    -   `padding` (`number`): Padding around elements. Default: `6`.
    -   `spacing` (`number`): Spacing between elements. Default: `8`.
    -   `borderRadius` (`number`): Corner radius for background. Default: `30`.
    -   `fontFamily` (`string`): Font family. Default: `'Albert Sans', sans-serif`.
    -   `fontWeight` (`string`): Font weight. Default: `'500'`.
    -   `colors` (`object`): Color scheme:
        -   `background` (`string`): Toolbar background. Default: `omdColor.mediumGray`.
        -   `button` (`string`): Button background. Default: `'white'`.
        -   `popup` (`string`): Popup menu background. Default: `omdColor.lightGray`.
        -   `undo` (`string`): Undo button background. Default: `#87D143`.
    -   `buttonSize` (`number`): Button size. Default: `48`.
    -   `checkMarkSize` (`number`): Checkmark SVG size. Default: `24`.
    -   `mainFontSize` (`number`): Main button font size. Default: `32`.
    -   `inputFontSize` (`number`): Input text font size. Default: `28`.
    -   `menuFontSize` (`number`): Menu item font size. Default: `24`.
    -   `inputWidth` (`number`): Input button width. Default: `120`.
    -   `popupDirection` (`string`): Direction for popups (`'below'` or `'above'`). Default: `'below'`.
    -   `showUndoButton` (`boolean`): Whether to display an undo button. Default: `false`.
    -   `undoIconUrl` (`string`): Data URL for the undo button icon. Default: a base64 encoded SVG.
    -   `onUndo` (`function`): Custom callback function for the undo action. If not provided, it attempts to call `window.onOMDToolbarUndo`.
    -   `x`, `y` (`number`): Optional position of the toolbar in the parent container.
    -   `styles` (`object`): An object to provide structured styling options (e.g., `backgroundColor`, `buttonColor`, `popupBackgroundColor`, `borderRadius`, `buttonSize`, `mainFontSize`, `inputFontSize`, `menuFontSize`, `inputWidth`, `padding`, `spacing`). These override individual options.

## Public Properties

-   **`parentContainer`** (`jsvgGroup`): The SVG group where the toolbar is rendered.
-   **`sequence`** (`omdEquationSequenceNode`): The sequence node the toolbar interacts with.
-   **`config`** (`object`): The merged configuration options for the toolbar, including defaults and overrides.
-   **`state`** (`object`): Internal state of the toolbar, including:
    -   `activePopup` (`object` | `null`): Tracks the currently active popup (`type`, `group`).
    -   `selectedOperation` (`string`): The currently selected operation (e.g., `'+'`, `'f'`).
    -   `inputValue` (`string`): The current value in the input field.
-   **`elements`** (`object`): An object containing references to the various `jsvg` elements that make up the toolbar UI:
    -   `toolbarGroup` (`jsvgGroup`): The main SVG group for the entire toolbar.
    -   `background` (`jsvgRect`): The background rectangle of the toolbar.
    -   `leftButton` (`jsvgButton`): The button for selecting operations.
    -   `middleInputButton` (`jsvgButton`): The button for displaying and inputting values.
    -   `rightButton` (`jsvgButton`): The button for applying the operation.
    -   `undoButton` (`jsvgButton`): The optional undo button.

## Public Methods

### `setInputText(text)`

Sets the text displayed in the middle input button and updates the internal `inputValue` state. It also adjusts the font size of the button's text element for better centering.

-   **`text`** (`string`): The text to display.

### `destroy()`

Cleans up the toolbar component by removing its SVG elements from the DOM and clearing internal references.

## Internal Methods

-   **`_render()`**: Renders the initial toolbar UI components, including the background, operation button, input button, apply button, and optional undo button. It also sets up their initial positions and styling.
-   **`_bringToFront(node)`**: Moves a `jsvgObject` to the top of its parent's stacking order to ensure it's visible.
-   **`_togglePopup(popupType)`**: Toggles the visibility of a popup menu (either `'operations'` or `'input'`). It ensures only one popup is visible at a time and handles attaching/detaching the popup's SVG group to the toolbar's group.
-   **`_renderPopup(contentFactory, anchorButton)`**: A generic method to create and position a popup group. It takes a `contentFactory` function (which generates the popup's content) and an `anchorButton` to position the popup relative to.
-   **`_renderOperationsMenu()`**: Renders the operations menu popup, containing buttons for `'f'` (function), `'÷'`, `'×'`, `'–'`, and `'+'`.
-   **`_renderFunctionMenu()`**: Renders the function selection menu popup, containing buttons for common functions like `'sqrt'`, `'cos'`, `'sin'`, `'tan'`, and `'ln'`.
-   **`_renderDigitGrid()`**: Renders the digit grid (number pad) popup, including digits `0-9`, a backspace (`'←'`), and a variable (`'x'`).
-   **`_handleFunctionClick(func)`**: Handles clicks on the function menu buttons, setting the input text to the selected function name.
-   **`_handleDigitClick(digit)`**: Handles clicks on the digit grid buttons, updating the input value (appending digits or performing backspace).
-   **`_selectOperation(operation)`**: Handles the selection of a new operation from the menu, updating the left button's text and potentially clearing the input text if switching to/from function mode.
-   **`_applyOperation()`**: Applies the selected operation and value to the `sequence`. It parses the input value (as a number or math.js expression) and calls the appropriate method on the `sequence` (e.g., `applyEquationFunction`, `applyEquationOperation`). It also clears the input and notifies the host application to refresh the display.
-   **`_createButton(config)`**: A factory method for creating `jsvgButton` instances with common styling and behavior. It supports text labels, SVG icons, and custom sizes.
-   **`_updateApplyButtonState()`**: Updates the enabled/disabled state of the apply button based on whether there is an `inputValue`.
-   **`_updateToolbarLayout()`**: Updates the positions of all toolbar elements (buttons, background) to ensure correct spacing and alignment.
-   **`_handleUndo()`**: Handles the undo action, either by calling a custom `onUndo` callback or a global `window.onOMDToolbarUndo` hook.

## Example

```javascript
import { omdToolbar } from '@teachinglab/omd';
import { omdEquationSequenceNode } from '@teachinglab/omd';
import { omdEquationNode } from '@teachinglab/omd';

// Create an SVG container (e.g., from jsvgContainer)
// const svgContainer = new jsvgContainer();
// document.body.appendChild(svgContainer.svgObject);

// Create an initial sequence
const initialEquation = omdEquationNode.fromString('2x + 5 = 15');
const sequence = new omdEquationSequenceNode([initialEquation]);

// Create the toolbar and add it to the SVG container
const toolbar = new omdToolbar(svgContainer, sequence, {
  x: 50, // Position the toolbar
  y: 50,
  showUndoButton: true, // Enable the undo button
  styles: { // Example of structured styling
    backgroundColor: '#34495e',
    buttonColor: '#ecf0f1',
    popupBackgroundColor: '#bdc3c7',
    borderRadius: 10
  }
});

// Interact with the toolbar to apply operations to the sequence.
// For example, click the '-' button and enter '5' to subtract 5 from both sides.
```

## Notes

-   The toolbar can be styled via CSS for custom appearance.
-   Supports dynamic updates (e.g., adding/removing tools or buttons at runtime).

## See Also

-   [`omdEquationSequenceNode`](./omdEquationSequenceNode.md) - The sequence node the toolbar operates on.
-   [`omdEquationNode`](./omdEquationNode.md) - The type of nodes typically found in the sequence.