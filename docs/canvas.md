# Canvas Classes

## omdDisplay

Renders a single OMD component into a DOM container. The SVG is sized to fit the content — not the container — and the container aligns it via flexbox.

### Constructor

```js
new omdDisplay(container, options)
```

| Parameter | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | DOM element to render into. Must support `appendChild`. |
| `options` | `object` | See options table below. |

**Options**

| Option | Type | Default | Description |
|---|---|---|---|
| `alignment` | `'center'`\|`'left'`\|`'right'` | `'center'` | Horizontal alignment of the SVG inside the container. Set to any other value to skip flex layout entirely. |
| `autoScale` | `boolean` | `true` | Scales the component to fit within the container, respecting `maxScale`. |
| `maxScale` | `number` | `1` | Upper bound on the scale factor. `1` means the content will never render larger than its natural size — only shrink to fit. Set higher (e.g. `2`) to allow upscaling. |
| `padding` | `number` | `8` | Pixel padding added around the content inside the SVG. |
| `onChange` | `(payload) => void` | `null` | Receives change payloads from interactive components such as editable tables and point-plotting coordinate planes. |

### Methods

#### `render(string)`

Parses and renders a math string. Clears any previously rendered content first. Auto-detects equations (strings containing `=`) vs expressions.

```js
display.render('3*x + 2');      // expression
display.render('2*x + 3 = 7'); // equation (detected by =)
```

#### `load(component)`

Renders a pre-built OMD component. Clears any previously rendered content first.

```js
const line = new omdNumberLine();
line.loadFromJSON({ min: 0, max: 10, dotValues: [6] });
display.load(line);
```

#### `loadFromJSON(json)`

Creates a component from a JSON object (using the factory) and renders it in one step.

```js
display.loadFromJSON({ omdType: 'numberLine', min: 0, max: 10, dotValues: [6] });
display.loadFromJSON({ omdType: 'coordinatePlane', xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
```

#### `clear()`

Removes the current component from the display.

#### `destroy()`

Removes the SVG from the DOM, disconnects the resize observer, and marks the instance as destroyed. Call this when removing the display from the page.

### Behavior

- The SVG element is sized to `(contentWidth × scale) + padding×2` — it wraps tightly around the content rather than filling the container.
- A `ResizeObserver` watches the container and re-runs layout when it changes size.
- After fonts load (`document.fonts.ready`), layout is refreshed to account for any text reflow.

### Example

```js
const display = new omdDisplay(document.getElementById('my-cell'), {
    alignment: 'center',
    autoScale: true,
    maxScale: 1,
    padding: 12,
});

// From a string
display.render('sqrt(x + 4)');

// From JSON — one line
display.loadFromJSON({ omdType: 'numberLine', min: 0, max: 20, dotValues: [6, 14] });

// From a pre-built component
const plane = new omdCoordinatePlane();
plane.loadFromJSON({ xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
display.load(plane);
```

---

## omdCanvas

A multi-object SVG stage. Components are added at explicit `(x, y)` positions and can be moved, scaled, or removed independently.

### Constructor

```js
new omdCanvas(container, options)
```

| Parameter | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | DOM element to render into. |
| `options` | `object` | See options table below. |

**Options**

| Option | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | `container.offsetWidth \|\| 800` | Canvas width in pixels. |
| `height` | `number` | `container.offsetHeight \|\| 600` | Canvas height in pixels. |

### Methods

#### `add(component, options)`

Adds a component to the canvas. Accepts an optional position and scale — or you can position the component beforehand with `setPosition` and call `add` with no options.

```js
// Position via add options
canvas.add(plane, { x: 30, y: 60, scale: 1.5 });

// Position beforehand — equivalent
plane.setPosition(30, 60);
canvas.add(plane);
```

| Option | Type | Default | Description |
|---|---|---|---|
| `x` | `number` | `0` | Left offset in pixels. |
| `y` | `number` | `0` | Top offset in pixels. |
| `scale` | `number` | — | Optional scale factor. If omitted, the component's current scale is unchanged. |

#### `move(component, x, y)`

Repositions a previously added component.

```js
canvas.move(plane, 100, 50);
```

#### `scale(component, s)`

Rescales a previously added component.

```js
canvas.scale(line, 0.8);
```

#### `remove(component)`

Removes a specific component from the canvas.

#### `clear()`

Removes all components from the canvas.

#### `resize(width, height)`

Resizes the canvas SVG.

```js
canvas.resize(1400, 600);
```

#### `items` _(getter)_

Returns a shallow copy of all added components.

```js
console.log(canvas.items.length);
```

### Example

```js
const canvas = new omdCanvas(document.getElementById('stage'), {
    width: 1100,
    height: 420,
});

const plane = new omdCoordinatePlane();
plane.loadFromJSON({ width: 280, height: 280, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
canvas.add(plane, { x: 30, y: 60 });

const line = new omdNumberLine();
line.loadFromJSON({ min: 0, max: 10, dotValues: [6] });
line.setPosition(350, 120);
canvas.add(line);

const eq = new omdEquation();
eq.loadFromJSON('2*x + 3 = 7');
canvas.add(eq, { x: 380, y: 340 });
```

---

## Difference between omdDisplay and omdCanvas

| | `omdDisplay` | `omdCanvas` |
|---|---|---|
| Content | Single component | Multiple components |
| Positioning | Automatic (aligned / scaled to fit) | Explicit `(x, y)` per component |
| SVG size | Fits content | Fixed at construction |
| Use case | Expression/equation cells, single visuals | Composed scenes, diagrams |
