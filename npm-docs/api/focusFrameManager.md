# FocusFrameManager

The `FocusFrameManager` is a feature that allows you to define rectangular regions on the canvas called "focus frames." These frames can be used to highlight specific areas of interest, capture their contents as separate SVG or bitmap images, and manage them independently.

This is particularly useful for applications where you need to isolate and process or export specific parts of a larger drawing, such as individual mathematical problems on a worksheet or specific diagrams in a complex scene.

## Class Definition

```javascript
export class FocusFrameManager {
    // ...
}
```

## Constructor

### `new FocusFrameManager(canvas)`

Creates a new `FocusFrameManager` instance.

-   **`canvas`** (`OMDCanvas`): The main canvas instance.

## Public Methods

### `createFrame([options])`

Creates a new, independent focus frame on the canvas.

-   **`options`** (`object`, optional): Configuration for the new frame.
    -   `x` (`number`, optional): The x-coordinate of the top-left corner. Default: `0`.
    -   `y` (`number`, optional): The y-coordinate of the top-left corner. Default: `0`.
    -   `width` (`number`, optional): The width of the frame. Default: `200`.
    -   `height` (`number`, optional): The height of the frame. Default: `150`.
    -   `showOutline` (`boolean`, optional): Whether to display the frame's border. Default: `true`.
    -   `outlineColor` (`string`, optional): The color of the border. Default: `'#007bff'`.
    -   `outlineWidth` (`number`, optional): The thickness of the border. Default: `2`.
    -   `outlineDashed` (`boolean`, optional): Whether the border should be a dashed line. Default: `false`.
-   **Returns**: `object` - An object containing the `id` of the new frame and a reference to the `frame` instance (`{ id, frame }`).
-   **Emits**: `focusFrameCreated` with `{ id, frame }`.

### `removeFrame(frameId)`

Removes a specific focus frame from the canvas.

-   **`frameId`** (`string`): The unique ID of the frame to remove.
-   **Returns**: `boolean` - `true` if the frame was found and removed, `false` otherwise.
-   **Emits**: `focusFrameRemoved` with `{ frameId }`.

### `getFrame(frameId)`

Retrieves a focus frame instance by its ID.

-   **`frameId`** (`string`): The ID of the frame to retrieve.
-   **Returns**: `FocusFrame` or `undefined` - The frame instance, or `undefined` if no frame with that ID exists.

### `setActiveFrame(frameId)`

Sets a specific frame as the "active" one, which can be useful for highlighting or targeting operations.

-   **`frameId`** (`string`): The ID of the frame to activate.
-   **Returns**: `boolean` - `true` if the frame was successfully activated.
-   **Emits**: `focusFrameActivated` with `{ frameId, frame }`.

### `getActiveFrame()`

Gets the currently active focus frame.

-   **Returns**: `FocusFrame` or `null` - The active frame instance, or `null` if no frame is currently active.

### `captureActiveFrame()`

Captures the SVG content of the currently active focus frame.

-   **Returns**: `string` or `null` - A string of the SVG content within the active frame's bounds, or `null` if there is no active frame.

### `captureAllFrames()`

Captures the content of every focus frame on the canvas.

-   **Returns**: `Map<string, string>` - A Map where keys are frame IDs and values are the SVG content strings for each frame.

### `clearAllFrames()`

Removes all focus frames from the canvas.

-   **Emits**: `focusFramesCleared`.

### `getFrameIds()`

Gets the IDs of all current focus frames.

-   **Returns**: `Array<string>` - An array of all frame IDs.

### `destroy()`

Destroys the manager and removes all associated frames and event listeners.

---

## The `FocusFrame` Class (Internal)

The `FocusFrame` class represents a single rectangular frame. It is not exported directly but is returned by `FocusFrameManager` methods.

### `setActive(active)`

Sets the frame's visual state to active or inactive.

-   **`active`** (`boolean`): `true` to activate, `false` to deactivate.

### `capture()`

Captures the canvas content within the frame's bounds.

-   **Returns**: `string` - The SVG content of the frame as an XML string.

### `async toBitmap([format], [quality])`

Converts the frame's captured content into a bitmap image.

-   **`format`** (`string`, optional): The image format (e.g., `'png'`, `'jpeg'`). Default: `'png'`.
-   **`quality`** (`number`, optional): The image quality for formats that support it (0 to 1). Default: `1`.
-   **Returns**: `Promise<Blob>` - A promise that resolves with the image data as a `Blob`.

### `async downloadAsBitmap([filename], [format])`

Triggers a browser download of the frame's content as a bitmap image.

-   **`filename`** (`string`, optional): The desired filename. Default: `focus-frame-{id}.png`.
-   **`format`** (`string`, optional): The image format. Default: `'png'`.

### `updateBounds(bounds)`

Resizes and/or repositions the frame.

-   **`bounds`** (`object`): An object with the new dimensions and coordinates (`{ x, y, width, height }`).

### `getBounds()`

Gets the current position and size of the frame.

-   **Returns**: `object` - An object containing the frame's bounds (`{ x, y, width, height }`).

### `destroy()`

Removes the frame's visual element from the canvas.