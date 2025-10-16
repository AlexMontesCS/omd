# EventManager

The `EventManager` class is the central hub for all user interactions with the OMD canvas. It is responsible for listening to raw browser events, normalizing them into a consistent format, and delegating them to the appropriate handlers, such as the active tool (`PencilTool`, `SelectTool`, etc.) or the `pointerEventHandler` for panning and zooming.

## Class Definition

```javascript
export class EventManager {
    // ...
}
```

## Constructor

### `new EventManager(canvas)`

Creates a new `EventManager` instance.

-   **`canvas`** (`OMDCanvas`): The main canvas instance to which this event manager is attached.

## Public Methods

### `initialize()`

Binds all necessary event listeners to the canvas's SVG element and the document. This includes listeners for pointer events, keyboard events, and the mouse wheel. It also sets the `touch-action: none;` style on the SVG element to prevent default touch behaviors like scrolling.

### `getPointerInfo()`

Retrieves the current state of the pointers.

-   **Returns**: `object` - An object containing:
    -   `activePointers` {number}: The number of currently active pointers.
    -   `isDrawing` {boolean}: Whether a drawing operation is in progress.
    -   `multiTouch` {boolean}: Whether a multi-touch interaction is occurring.

### `destroy()`

Removes all event listeners and cleans up the event manager. This should be called when the canvas is no longer in use.

## Event Handling Workflow

The `EventManager` follows a clear workflow for handling events:

1.  **Capture Raw Event**: Listens for native browser events (`pointerdown`, `keydown`, etc.).
2.  **Prevent Default**: Calls `event.preventDefault()` for most events to stop the browser's default behavior (e.g., text selection, page scrolling).
3.  **Normalize Event**: Converts the raw event object into a standardized format. For pointer events, this includes converting screen coordinates to SVG coordinates and normalizing pressure values (see `_normalizePointerEvent`).
4.  **Delegate to Handlers**: Passes the normalized event to the relevant handlers:
    -   **`pointerEventHandler`**: For core interactions like panning and zooming.
    -   **Active Tool**: The currently selected tool (e.g., `PencilTool`) receives the event to perform its specific function (e.g., drawing a line).
5.  **Emit Canvas Event**: Emits a high-level event on the canvas instance (e.g., `pointerDown`, `keyDown`) that other parts of the application can listen to.

## Pointer Event Handler

The `EventManager` uses an instance of `pointerEventHandler` to manage view transformations like panning and zooming, which are typically initiated with multi-touch gestures or mouse wheel interactions.

## Private Methods (Internal Logic)

The following methods handle the internal logic of the `EventManager`. While you won't call them directly, understanding their role can be helpful for debugging or extending the library.

-   **`_onPointerDown(event)`**: Handles the start of a pointer interaction. It tracks the active pointer, sets pointer capture, and delegates to the appropriate handlers.
-   **`_onPointerMove(event)`**: Handles pointer movement. It throttles events to maintain performance, updates the cursor position, and delegates to handlers if a drawing is in progress.
-   **`_onPointerUp(event)`**: Handles the end of a pointer interaction. It cleans up the active pointer and notifies the active tool that the stroke has finished.
-   **`_onPointerCancel(event)`**: Handles cases where a pointer interaction is unexpectedly terminated.
-   **`_onPointerEnter(event)` / `_onPointerLeave(event)`**: Manages the visibility of the custom cursor as the pointer enters and leaves the canvas.
-   **`_onKeyDown(event)` / `_onKeyUp(event)`**: Handles keyboard input, checking for global shortcuts (like switching tools) before delegating to the active tool.
-   **`_onWheel(event)`**: Handles mouse wheel events, typically for zooming.
-   **`_onContextMenu(event)`**: Prevents the browser's context menu from appearing over the canvas.
-   **`_normalizePointerEvent(event, canvasCoords)`**: Converts a raw pointer event into a normalized object with consistent properties (e.g., `x`, `y`, `pressure`).
-   **`_normalizePressure(pressure)`**: Clamps the pointer pressure value to a range between 0 and 1, providing a default value for devices without pressure sensitivity.

## Emitted Events

The `EventManager` emits the following events on the `OMDCanvas` instance, allowing other modules to react to user input:

-   `pointerDown`
-   `pointerMove`
-   `pointerUp`
-   `pointerCancel`
-   `pointerEnter`
-   `pointerLeave`
-   `keyDown`
-   `keyUp`
-   `wheel`