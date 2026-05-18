# Visualization Components

This document covers OMD's SVG visualization components. Each component is instantiated and loaded via `loadFromJSON`, then passed to `omdDisplay` or `omdCanvas` for rendering.

```js
import { omdNumberLine, omdDisplay } from '@teachinglab/omd';

const display = new omdDisplay(document.getElementById('container'));
const line = new omdNumberLine();
line.loadFromJSON({ min: 0, max: 10, increment: 1, dotValues: [3, 7] });
display.render(line);
```

---

## numberLine

Renders a horizontal number line with optional dots, labels, and arrows.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `min` | number | Yes | — | Left bound of the number line |
| `max` | number | Yes | — | Right bound of the number line |
| `increment` | number | Yes | — | Spacing between tick marks |
| `dotValues` | number[] | No | `[]` | Values at which to place dots |
| `title` | string | No | `""` | Title text rendered above the line |
| `label` | string | No | `""` | Label rendered beside the line |
| `units` | string | No | `""` | Unit label appended to tick numbers |
| `showLeftArrow` | boolean | No | `false` | Show an arrow on the left end |
| `showRightArrow` | boolean | No | `false` | Show an arrow on the right end |
| `hideDefaultNumbers` | boolean | No | `false` | Hide the default tick number labels |
| `specialNumbers` | object[] | No | `[]` | Custom labels at specific positions: `{value, label}` |
| `totalWidth` | number | No | auto | Total SVG width in px |

### Example

```js
const line = new omdNumberLine();
line.loadFromJSON({
  min: 0,
  max: 20,
  increment: 2,
  dotValues: [6, 14],
  showRightArrow: true,
  title: 'Temperature (°C)',
  specialNumbers: [{ value: 6, label: 'low' }, { value: 14, label: 'high' }]
});
display.render(line);
```

---

## doubleNumberLine

Renders two aligned number lines stacked vertically, useful for ratio and rate comparisons.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `topNumberLine` | object | Yes | — | Config for the top number line (same fields as `numberLine`) |
| `bottomNumberLine` | object | Yes | — | Config for the bottom number line |
| `spacing` | number | No | auto | Vertical gap in px between the two lines |

### Example

```js
const dbl = new omdDoubleNumberLine();
dbl.loadFromJSON({
  topNumberLine: { min: 0, max: 5, increment: 1, title: 'Hours' },
  bottomNumberLine: { min: 0, max: 60, increment: 12, title: 'Minutes' },
  spacing: 20
});
display.render(dbl);
```

---

## balanceHanger

Renders a balance scale hanger. Variables (e.g. `'x'`) are drawn as pill shapes; numbers as rectangles.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `leftValues` | string[] | Yes | — | Tokens on the left side, e.g. `['x', 'x', '3']` |
| `rightValues` | string[] | Yes | — | Tokens on the right side |
| `tilt` | `'none'`\|`'left'`\|`'right'` | No | `'none'` | Direction the beam tilts |
| `fontFamily` | string | No | system | Font for tile labels |
| `fontSize` | number | No | auto | Font size in px |
| `backgroundColor` | string | No | `""` | Background fill color |
| `backgroundCornerRadius` | number | No | `0` | Corner radius of the background rect |
| `backgroundOpacity` | number | No | `1` | Opacity of the background rect |
| `showBackground` | boolean | No | `false` | Whether to render a background rect |

### Example

```js
const hanger = new omdBalanceHanger();
hanger.loadFromJSON({
  leftValues: ['x', 'x', 'x'],
  rightValues: ['1', '1', '1', '1', '1', '1'],
  tilt: 'none'
});
display.render(hanger);
```

---

## tapeDiagram

Renders a horizontal segmented tape diagram. Each segment can be a plain value or a full object controlling color, label, and weight.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `values` | array | Yes | — | Segments. Each entry is a string/number or `{value, weight, showLabel, color, textColor, label}` |
| `totalWidth` | number | No | auto | Total width of the tape in px |
| `title` | string | No | `""` | Title above the tape |
| `titleFontSize` | number | No | auto | Font size for the title |
| `titleColor` | string | No | `""` | Color for the title text |
| `segmentHeight` | number | No | auto | Height of each segment in px |
| `segmentCornerRadius` | number | No | `0` | Corner radius of segments |
| `segmentStrokeColor` | string | No | `""` | Stroke color for segment borders |
| `segmentStrokeWidth` | number | No | `1` | Stroke width for segment borders |
| `labelFontSize` | number | No | auto | Font size for segment labels |
| `segmentTextColor` | string | No | `""` | Default text color for segment labels |
| `braceLabelFontSize` | number | No | auto | Font size for brace labels |
| `braceColor` | string | No | `""` | Color for brace strokes |
| `labelSet` | object | No | `{}` | Brace annotations: `{ braces: [{startIndex, endIndex, label, showBelow, color, fontSize, strokeWidth}] }` |

### Example

```js
const tape = new omdTapeDiagram();
tape.loadFromJSON({
  title: 'Parts of 24',
  values: [
    { value: 8, color: '#4A90D9', label: 'A' },
    { value: 8, color: '#7ED321', label: 'B' },
    { value: 8, color: '#F5A623', label: 'C' }
  ],
  labelSet: {
    braces: [{ startIndex: 0, endIndex: 2, label: '24', showBelow: true }]
  }
});
display.render(tape);
```

---

## doubleTapeDiagram

Renders two tape diagrams stacked vertically, useful for part-to-part or part-to-whole comparisons.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `topTapeDiagram` | object | Yes | — | Config for the top tape (same fields as `tapeDiagram`) |
| `bottomTapeDiagram` | object | Yes | — | Config for the bottom tape |
| `spacing` | number | No | auto | Vertical gap in px between the two tapes |

### Example

```js
const dbl = new omdDoubleTapeDiagram();
dbl.loadFromJSON({
  topTapeDiagram: {
    values: [{ value: 3, color: '#4A90D9' }, { value: 3, color: '#4A90D9' }, { value: 3, color: '#4A90D9' }],
    title: 'Miles'
  },
  bottomTapeDiagram: {
    values: [{ value: 15, color: '#F5A623' }],
    title: 'Total'
  },
  spacing: 16
});
display.render(dbl);
```

---

## coordinatePlane

Renders a Cartesian coordinate plane. Supports graphing equations, line segments, points, and interactive sliders.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `xMin` | number | Yes | — | Left bound of the x-axis |
| `xMax` | number | Yes | — | Right bound of the x-axis |
| `yMin` | number | Yes | — | Bottom bound of the y-axis |
| `yMax` | number | Yes | — | Top bound of the y-axis |
| `xLabel` | string | No | `"x"` | Label for the x-axis |
| `yLabel` | string | No | `"y"` | Label for the y-axis |
| `tickInterval` | number | No | `1` | Spacing between tick marks |
| `showTickLabels` | boolean | No | `true` | Show numeric tick labels |
| `showBackground` | boolean | No | `false` | Render a background rect |
| `interactive` | boolean | No | `false` | Render variable sliders when `true` |
| `size` | `'small'`\|`'medium'`\|`'large'` | No | `'medium'` | Preset size of the plane |
| `graphEquations` | object[] | No | `[]` | Equations to plot: `{equation, color, strokeWidth}` |
| `lineSegments` | object[] | No | `[]` | Segments to draw: `{point1: [x,y], point2: [x,y], color}` |
| `dotValues` | array[] | No | `[]` | Points to mark: each entry is `[x, y, 'color']` |
| `variables` | object[] | No | `[]` | Interactive slider definitions: `{name, value, min, max, step}` |
| `shapeSet` | object | No | `{}` | Additional shapes to overlay |
| `graphPadding` | number | No | auto | Internal padding around the graphing area |
| `backgroundColor` | string | No | `""` | Background fill color |
| `backgroundCornerRadius` | number | No | `0` | Corner radius of the background rect |
| `backgroundOpacity` | number | No | `1` | Opacity of the background rect |

### Example

```js
const plane = new omdCoordinatePlane();
plane.loadFromJSON({
  xMin: -5, xMax: 5,
  yMin: -5, yMax: 5,
  graphEquations: [
    { equation: 'y = 2x + 1', color: '#E74C3C', strokeWidth: 2 }
  ],
  dotValues: [[0, 1, '#E74C3C'], [2, 5, '#3498DB']],
  size: 'medium'
});
display.render(plane);
```

**Interactive example (with sliders):**

```js
plane.loadFromJSON({
  xMin: -10, xMax: 10,
  yMin: -10, yMax: 10,
  interactive: true,
  variables: [{ name: 'm', value: 1, min: -5, max: 5, step: 0.5 }],
  graphEquations: [{ equation: 'y = m*x', color: '#2ECC71' }]
});
```

---

## tileEquation

Renders an algebra tile equation. Token values: `'x'`, `'-x'`, `'y'`, `'-y'`, `'1'`, `'-1'`.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `equation` | string | No | `""` | Equation string parsed into tiles (e.g. `'x + 1 = -x + 3'`) |
| `left` | string[] | No | `[]` | Explicit left-side token array |
| `right` | string[] | No | `[]` | Explicit right-side token array |
| `tileSize` | number | No | auto | Size of each tile in px |
| `tileGap` | number | No | auto | Gap between tiles in px |
| `equalGap` | number | No | auto | Gap around the equals sign |
| `tileRadius` | number | No | auto | Corner radius of tiles |
| `showLabels` | boolean | No | `true` | Show variable/number labels on tiles |
| `fontFamily` | string | No | system | Font for tile labels |
| `fontSize` | number | No | auto | Font size for tile labels |
| `plusColor` | string | No | `""` | Color for positive tiles |
| `equalsColor` | string | No | `""` | Color for the equals sign |
| `xPillColor` | string | No | `""` | Color for variable pill tiles |

### Example

```js
const tiles = new omdTileEquation();
tiles.loadFromJSON({
  left: ['x', 'x', '1', '1', '1'],
  right: ['1', '1', '1', '1', '1', '1', '1'],
  tileSize: 40
});
display.render(tiles);
```

---

## table

Renders a value table. Can auto-generate rows from an equation or use manually provided data.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `equation` | string | No\* | `""` | Equation to generate rows (e.g. `'y=2x'`). Required unless `data` is provided. |
| `data` | array[][] | No\* | `[]` | Manual rows as `[[x, y], ...]`. Used when `equation` is not set. |
| `headers` | string[] | No | auto | Column header labels |
| `xMin` | number | No | `0` | First x value (when using `equation`) |
| `xMax` | number | No | `5` | Last x value (when using `equation`) |
| `stepSize` | number | No | `1` | Step between x values |
| `title` | string | No | `""` | Title above the table |
| `alternatingRowColors` | boolean | No | `false` | Shade alternating rows |
| `fontSize` | number | No | auto | Font size for cell text |
| `headerFontSize` | number | No | auto | Font size for header text |
| `fontFamily` | string | No | system | Font for cell text |
| `headerFontFamily` | string | No | system | Font for header text |
| `cellHeight` | number | No | auto | Height of data rows in px |
| `headerHeight` | number | No | auto | Height of the header row in px |
| `minCellWidth` | number | No | auto | Minimum column width in px |
| `maxCellWidth` | number | No | auto | Maximum column width in px |
| `padding` | number | No | auto | Cell padding in px |
| `backgroundColor` | string | No | `""` | Background fill color |
| `backgroundCornerRadius` | number | No | `0` | Corner radius of the background rect |
| `backgroundOpacity` | number | No | `1` | Opacity of the background rect |
| `showBackground` | boolean | No | `false` | Whether to render a background rect |

\* Either `equation` or `data` must be provided.

### Example

```js
const table = new omdTable();
table.loadFromJSON({
  equation: 'y=3x+2',
  xMin: 0,
  xMax: 5,
  stepSize: 1,
  headers: ['x', 'y'],
  alternatingRowColors: true
});
display.render(table);
```

---

## ratioChart

Renders a ratio or fraction visualization in one of several styles.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `valueA` | number | Yes\* | — | First value (or use `numerator`) |
| `valueB` | number | Yes\* | — | Second value (or use `denominator`) |
| `numerator` | number | No\* | — | Alias for `valueA` |
| `denominator` | number | No\* | — | Alias for `valueB` |
| `renderType` | `'pie'`\|`'dots'`\|`'dot'`\|`'tile'`\|`'bar'` | No | `'pie'` | Visual style for the chart |
| `size` | `'small'`\|`'medium'`\|`'large'` | No | `'medium'` | Preset size of the visualization |

\* Either `valueA`/`valueB` or `numerator`/`denominator` must be provided.

### Example

```js
const chart = new omdRatioChart();
chart.loadFromJSON({
  valueA: 3,
  valueB: 5,
  renderType: 'tile',
  size: 'medium'
});
display.render(chart);
```

---

## spinner

Renders a circular spinner divided into equal sections with an arrow.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `divisions` | number | Yes | — | Number of equal sections on the spinner |
| `arrowPosition` | number | No | `0` | Arrow angle in degrees (0 = top) |
| `size` | `'small'`\|`'medium'`\|`'large'` | No | `'medium'` | Preset size of the spinner |

### Example

```js
const spinner = new omdSpinner();
spinner.loadFromJSON({
  divisions: 6,
  arrowPosition: 90,
  size: 'large'
});
display.render(spinner);
```
