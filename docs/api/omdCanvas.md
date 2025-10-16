# omdCanvas

The `omdCanvas` class is the core component for creating and managing an interactive 2D drawing surface. It provides the primary API for all canvas operations, including drawing and managing strokes, handling user input, and orchestrating various features like tools, a toolbar, and focus frames.

## Class Definition

```javascript
export class omdCanvas
```

## Constructor

### `new omdCanvas(container, [options])`

Creates a new `omdCanvas` instance within a specified container element.

-   **`container`** (`HTMLElement` | `string`): The HTML element or a CSS selector string for the container where the canvas will be rendered. Throws an error if the container is not found.
-   **`options`** (`object`, optional): Configuration options for the canvas. These are passed to the `CanvasConfig` class. See the [Configuration Options](./configuration-options.md) for details.

## Properties

-   **`container`** (`HTMLElement`): The HTML container element for the canvas.
-   **`config`** (`CanvasConfig`): The configuration object for the canvas.
-   **`svg`** (`SVGElement`): The main `<svg>` element that serves as the drawing surface.
-   **`backgroundLayer`** (`SVGGElement`): An SVG group (`<g>`) for background elements like the grid.
-   **`drawingLayer`** (`SVGGElement`): The SVG group where all drawing strokes are rendered.
-   **`uiLayer`** (`SVGGElement`): The SVG group for UI elements that overlay the drawing, such as selection boxes.
-   **`focusFrameLayer`** (`SVGGElement`): The SVG group dedicated to holding `FocusFrame` elements.
-   **`strokes`** (`Map<string, Stroke>`): A map of all stroke objects on the canvas, with their unique IDs as keys.
-   **`selectedStrokes`** (`Set<string>`): A set of the IDs of all currently selected strokes.
-   **`toolManager`** (`ToolManager`): The instance managing the active drawing tools (Pencil, Eraser, etc.).
-   **`eventManager`** (`EventManager`): The instance managing all user input events.
-   **`cursor`** (`Cursor`): The instance that manages the custom cursor's appearance and behavior.
-   **`toolbar`** (`Toolbar`): The UI toolbar for tool selection (if enabled in config).
-   **`focusFrameManager`** (`FocusFrameManager`): The instance managing focus frames (if enabled in config).

## Public Methods

### Stroke Management

-   **`addStroke(stroke)`**: Adds a `Stroke` object to the canvas and renders it. Emits `strokeAdded`.
-   **`removeStroke(strokeId)`**: Removes a stroke from the canvas by its ID. Emits `strokeRemoved`.
-   **`clear()`**: Removes all strokes from the canvas. Emits `cleared`.

### Selection

-   **`selectStrokes(strokeIds)`**: Programmatically selects a set of strokes by their IDs. Emits `selectionChanged`.

### Coordinate Conversion

-   **`clientToSVG(clientX, clientY)`**: Converts screen coordinates (e.g., from a mouse event) to the canvas's local SVG coordinate system.
    -   **Returns**: `{ x, y }` object.

### Exporting

-   **`exportSVG()`**: Exports the canvas drawing as a clean SVG string. UI layers (`uiLayer`, `focusFrameLayer`) are excluded.
-   **`async exportImage([format], [quality])`**: Exports the canvas as a bitmap image.
    -   **`format`** (`string`): `'png'`, `'jpeg'`, or `'webp'`. Default: `'png'`.
    -   **`quality`** (`number`): For JPEG/WebP, a value from 0 to 1. Default: `1`.
    -   **Returns**: `Promise<Blob>` that resolves with the image data.

### Canvas Management

-   **`resize(width, height)`**: Resizes the canvas. Emits `resized`.
-   **`toggleGrid()`**: Toggles the visibility of the background grid.
-   **`getInfo()`**: Returns an object with status information (dimensions, stroke count, active tool, etc.).
-   **`destroy()`**: Completely removes the canvas and all associated managers, event listeners, and DOM elements. Emits `destroyed`.

### Event Handling (Pub/Sub)

-   **`on(event, callback)`**: Registers a listener for a custom canvas event.
-   **`off(event, callback)`**: Removes a previously registered event listener.
-   **`emit(event, [data])`**: Dispatches a custom event to all registered listeners.

## Emitted Events

The `omdCanvas` is an event emitter. You can listen for these events using the `on()` method.

-   `strokeAdded`, `strokeRemoved`, `cleared`: Fired for stroke operations.
-   `selectionChanged`: Fired when the set of selected strokes changes.
-   `resized`: Fired when the canvas dimensions change.
-   `pointerDown`, `pointerMove`, `pointerUp`, etc.: Raw input events, normalized by the `EventManager`.
-   `focusFrameCreated`, `focusFrameRemoved`, etc.: Events from the `FocusFrameManager`.
-   `destroyed`: Fired when the `destroy()` method has completed.