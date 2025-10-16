
# SelectTool

The `SelectTool` is a tool for selecting, moving, and deleting stroke segments on the canvas. It extends the `Tool` class.

## Class Definition

```javascript
export class SelectTool extends Tool {
    // ...
}
```

## Constructor

### `new SelectTool(canvas, [options])`

Creates a new `SelectTool` instance.

*   **canvas** (`OMDCanvas`): The canvas instance.
*   **[options]** (`object`, optional): Configuration options for the tool.
    *   **selectionColor** (`string`, optional): The color of the selection box. Defaults to `'#007bff'`.
    *   **selectionOpacity** (`number`, optional): The opacity of the selection box. Defaults to `0.3`.

## Public Methods

### `onPointerDown(event)`

Handles the pointer down event to start a selection.

*   **event** (`PointerEvent`): The pointer event.

### `onPointerMove(event)`

Handles the pointer move event to update the selection box.

*   **event** (`PointerEvent`): The pointer event.

### `onPointerUp(event)`

Handles the pointer up event to complete the selection.

*   **event** (`PointerEvent`): The pointer event.

### `onCancel()`

Cancels the current selection operation.

### `onKeyboardShortcut(key, event)`

Handles keyboard shortcuts for selection-related actions.

*   **key** (`string`): The key that was pressed.
*   **event** (`KeyboardEvent`): The keyboard event.
*   **Returns**: `boolean` - True if the shortcut was handled, false otherwise.

### `getCursor()`

Gets the cursor for the tool.

*   **Returns**: `string` - The CSS cursor name.

### `clearSelection()`

Clears the current selection.

## Properties

*   **displayName** (`string`): The display name of the tool.
*   **description** (`string`): A description of the tool.
*   **icon** (`string`): The icon for the tool.
*   **shortcut** (`string`): The keyboard shortcut for the tool.
*   **category** (`string`): The category of the tool.
*   **selectedSegments** (`Map<string, Set<number>>`): A map of selected segments, where the key is the stroke ID and the value is a set of segment indices.
