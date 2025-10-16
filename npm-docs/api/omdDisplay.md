# omdDisplay

A high-level component for displaying mathematical expressions or a series of equation steps. It handles rendering, automatic centering, scaling, and layout management within a given HTML container.

## Class Definition

```javascript
export class omdDisplay
```

## Constructor

### `new omdDisplay(container, [options])`

Creates a new `omdDisplay` instance.

-   **`container`** (`HTMLElement`): The DOM element where the expression will be rendered.
-   **`options`** (`object`, optional): Configuration options:
    -   `fontSize` (`number`): The base font size in pixels for the expression. Default: `32`.
    -   `centerContent` (`boolean`): If `true`, the content is automatically centered within the container. Default: `true`.
    -   `topMargin` (`number`): The top margin in pixels, used when centering content. Default: `40`.
    -   `bottomMargin` (`number`): The bottom margin in pixels. Default: `16`.
    -   `fitToContent` (`boolean`): If `true`, the SVG container will resize to tightly fit the content. Default: `false`.
    -   `autoScale` (`boolean`): If `true`, content will automatically scale down to fit the container. Default: `true`.
    -   `maxScale` (`number`): Maximum scale factor for `autoScale`. Default: `1` (no upscaling).
    -   `edgePadding` (`number`): Horizontal padding from edges when `autoScale` is enabled. Default: `16`.

## Public Methods

### `render(expression)`

Renders a mathematical expression or equation within the display. It intelligently handles different input types:

-   If `expression` is a string containing semicolons (`;`), it's treated as a sequence of equations and rendered as an `omdStepVisualizer`.
-   If `expression` is a string containing an equals sign (`=`), it's treated as a single equation and wrapped in an `omdStepVisualizer`.
-   Otherwise, if `expression` is a string, it's parsed as a single mathematical expression.
-   If `expression` is already an `omdNode` instance, it's rendered directly.

-   **`expression`** (`string` | `omdNode`): The mathematical expression string or a pre-existing `omdNode` instance.
-   **Returns**: `omdNode` - The root node of the rendered content (often an `omdStepVisualizer`).

### `update(newNode)`

Replaces the currently displayed node with a new one, applying the current font size and centering if enabled. The new node is initialized before being added to the display.

-   **`newNode`** (`omdNode`): The new node to display.

### `getCurrentNode()`

Returns the node currently being displayed.

-   **Returns**: `omdNode` | `null` - The current root node, or `null` if nothing is displayed.

### `centerNode()`

Manually triggers the centering and scaling logic for the current node. This is particularly useful for `omdEquationSequenceNode` instances to align them by their equals signs, and for ensuring content fits within the container based on `autoScale` and `maxScale` options.

### `fitToContent()`

Adjusts the SVG container's dimensions to tightly fit the rendered content, adding a small padding. This is useful for generating images or when the display needs to precisely match the content size.

### `setFontSize(size)`

Updates the base font size for the currently displayed node and for any future content rendered. This will trigger a re-layout and re-centering.

-   **`size`** (`number`): The new font size in pixels.

### `setFont(fontFamily, fontWeight)`

Applies a specific font family and weight to all text elements within the rendered SVG. This setting is also stored for future content.

-   **`fontFamily`** (`string`): CSS `font-family` string (e.g., `'"Shantell Sans", cursive'`).
-   **`fontWeight`** (`string`, optional): CSS `font-weight` (e.g., `'400'`, `'bold'`). Default: `'400'`.

### `clear()`

Removes the current expression from the display.

### `destroy()`

Cleans up the component, removing all DOM elements and detaching the resize observer.

## Internal Methods

-   **`_setupSVG()`**: Initializes the main SVG element, sets its viewBox, and attaches a `ResizeObserver` to the container.
-   **`_handleResize()`**: Callback for the `ResizeObserver` that updates the SVG viewBox and re-centers the content on container resize.
-   **`_repositionOverlayToolbar()`**: Positions any overlay toolbars associated with the current node (e.g., for interactive step visualizers).
