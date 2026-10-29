# Visualization Components

This document covers OMD's SVG visualization components. Each component is instantiated and loaded via `loadFromJSON`, then passed to `omdDisplay` or `omdCanvas` for rendering.

```js
import { omdNumberLine, omdDisplay } from '@teachinglab/omd';

const display = new omdDisplay(document.getElementById('container'));
const line = new omdNumberLine();
line.loadFromJSON({ min: 0, max: 10, increment: 1, dotValues: [3, 7] });
display.load(line);
```

---

## numberLine

Renders a horizontal number line with optional dots, labels, and arrows.

**Example JSON**
```json
{ "omdType": "numberLine", "min": 0, "max": 20, "increment": 2, "dotValues": [6, 14], "title": "Miles walked" }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `min` | number | Yes | — | Left bound of the number line |
| `max` | number | Yes | — | Right bound of the number line |
| `increment` | number | Yes | — | Spacing between tick marks |
| `dotValues` | number[] or object[] | No | `[]` | Values at which to place dots; objects can include `{value, label, color, locked}` |
| `title` | string | No | `""` | Title text rendered above the line |
| `label` | string | No | `""` | Label rendered beside the line |
| `units` | string | No | `""` | Unit label appended to tick numbers |
| `showLeftArrow` | boolean | No | `false` | Show an arrow on the left end |
| `showRightArrow` | boolean | No | `false` | Show an arrow on the right end |
| `hideDefaultNumbers` | boolean | No | `false` | Hide the default tick number labels |
| `specialNumbers` | object[] | No | `[]` | Custom labels at specific positions: `{value, label}` |
| `totalWidth` | number | No | auto | Total SVG width in px |
| `interactive` | boolean | No | `false` | Enable draggable/clickable dots and optional range handles |
| `allowAddDots` | boolean | No | `true` | Click the line to add dots when interactive |
| `allowDragDots` | boolean | No | `true` | Drag dots when interactive |
| `allowRemoveDots` | boolean | No | `true` | Double-click dots or press Delete to remove |
| `allowKeyboard` | boolean | No | `true` | Use arrow keys, Shift+arrow, Home, and End on focused dots/handles |
| `snapStep` | number | No | `increment` | Snapping interval for interactive movement |
| `showValueLabels` | boolean | No | `true` | Show live labels above interactive dots |
| `showHoverValue` | boolean | No | `true` | Preview snapped values while hovering |
| `interactiveRange` | boolean | No | `false` | Enable a textbook-style draggable interval for `rangeValues` |
| `rangeValues` | number[] | No | — | Two values defining the selected interval |
| `rangeStartClosed` | boolean | No | `true` | Use a filled start endpoint circle when true, open circle when false |
| `rangeEndClosed` | boolean | No | `true` | Use a filled end endpoint circle when true, open circle when false |
| `rangeStartStyle` | string | No | `"closed"` | Start endpoint style: `"closed"`, `"open"`, or `"arrow"` |
| `rangeEndStyle` | string | No | `"closed"` | End endpoint style: `"closed"`, `"open"`, or `"arrow"` |
| `maxInteractiveDots` | number | No | — | Cap on how many dots the student may add; omit for unlimited |
| `interactiveDotColor` | string | No | `'black'` | Fill of student-added dots |
| `selectedDotColor` | string | No | `'#2386DB'` | Fill of the focused/dragged dot |
| `rangeColor` | string | No | `'#2386DB'` | Colour of the selected interval bar and its handles |

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
display.load(line);
```

### Interactive Example

```js
line.loadFromJSON({
  min: -10,
  max: 10,
  increment: 1,
  dotValues: [{ value: -3, color: '#2386DB' }, { value: 4, color: 'black' }],
  interactive: true,
  interactiveRange: true,
  rangeValues: [-2, 6],
  rangeStartStyle: 'closed',
  rangeEndStyle: 'arrow',
  snapStep: 0.5
});

line.svgObject.addEventListener('omd-numberline-change', (event) => {
  console.log(event.detail.dotValues, event.detail.rangeValues);
});
```

---

## doubleNumberLine

Renders two aligned number lines stacked vertically, useful for ratio and rate comparisons.

**Example JSON**
```json
{ "omdType": "doubleNumberLine", "topNumberLine": { "min": 0, "max": 5, "increment": 1, "title": "Hours" }, "bottomNumberLine": { "min": 0, "max": 60, "increment": 12, "title": "Minutes" } }
```

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
display.load(dbl);
```

---

## balanceHanger

Renders a balance scale hanger. Variables (e.g. `'x'`) are drawn as pill shapes; numbers as rectangles.

**Example JSON**
```json
{ "omdType": "balanceHanger", "leftValues": ["x", "x", "x"], "rightValues": ["1", "1", "1", "1", "1", "1"], "tilt": "none" }
```

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
display.load(hanger);
```

---

## tapeDiagram

Renders a horizontal segmented tape diagram. Each segment can be a plain value or a full object controlling color, label, and weight. Bare fractions in segment and brace text (`"3/10"`, `"4 1/2"`) are typeset stacked, the same way as table cells, shape labels and area models.

**Example JSON**
```json
{ "omdType": "tapeDiagram", "title": "Parts of 24", "values": [{ "value": 8, "color": "#4A90D9" }, { "value": 8, "color": "#7ED321" }, { "value": 8, "color": "#F5A623" }], "labelSet": [{ "startIndex": 0, "endIndex": 3, "label": "24", "showBelow": true }] }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `values` | array | Yes | — | Segments. Each entry is a string/number or `{value, weight, showLabel, color, textColor, strokeColor, strokeWidth, parts}` |
| `totalWidth` | number | No | `300` | Total width of the tape in px |
| `title` | string | No | `""` | Title to the left of the tape |
| `titleFontSize` | number | No | `12` | Font size for the title |
| `titleColor` | string | No | `"black"` | Color for the title text |
| `segmentHeight` | number | No | `30` | Height of each segment in px; grows to fit stacked fractions |
| `segmentCornerRadius` | number | No | `5` | Corner radius of segments |
| `segmentStrokeColor` | string | No | `"white"` | Stroke color for segment borders |
| `segmentStrokeWidth` | number | No | `1` | Stroke width for segment borders |
| `labelFontSize` | number | No | `18` | Font size for segment labels |
| `segmentTextColor` | string | No | `"black"` | Default text color for segment labels |
| `braceLabelFontSize` | number | No | `14` | Font size for brace labels |
| `braceColor` | string | No | `"black"` | Color for brace strokes |
| `partDash` | string | No | `"4 4"` | Dash pattern for the lines a segment's `parts` draws; `"none"` draws them solid |
| `labelSet` | array | No | `[]` | Brace annotations — a plain array, not `{ braces: [...] }`: `[{startIndex, endIndex, label, showBelow, color, fontSize, strokeWidth}]`. `endIndex` is one past the last segment covered, so `{ startIndex: 0, endIndex: 1 }` spans the first segment |

A segment's `parts` splits it into equal parts ruled dashed, so its solid edges still read as
the unit: `{ value: "", parts: 6 }` is one whole cut into dashed sixths.

### Example

```js
const tape = new omdTapeDiagram();
tape.loadFromJSON({
  title: 'Parts of 24',
  values: [
    { value: 8, color: '#4A90D9' },
    { value: 8, color: '#7ED321' },
    { value: 8, color: '#F5A623' }
  ],
  labelSet: [
    { startIndex: 0, endIndex: 1, label: '8' },
    { startIndex: 0, endIndex: 3, label: '24', showBelow: true }
  ]
});
display.load(tape);
```

---

## doubleTapeDiagram

Renders two tape diagrams stacked vertically, useful for part-to-part or part-to-whole comparisons.

**Example JSON**
```json
{ "omdType": "doubleTapeDiagram", "topTapeDiagram": { "values": [{ "value": 3, "color": "#4A90D9" }, { "value": 3, "color": "#4A90D9" }, { "value": 3, "color": "#4A90D9" }], "title": "Miles" }, "bottomTapeDiagram": { "values": [{ "value": 15, "color": "#F5A623" }], "title": "Total" } }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `topTapeDiagram` | object | Yes | — | Config for the top tape (same fields as `tapeDiagram`) |
| `bottomTapeDiagram` | object | Yes | — | Config for the bottom tape |
| `spacing` | number | No | `30` | Vertical gap in px between the two tapes |
| `totalWidth` | number | No | widest tape `totalWidth`, else `300` | Width of the longer tape in px. Both tapes share one unit width, so this (or a `totalWidth` set on either tape) widens both |

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
display.load(dbl);
```

---

## coordinatePlane

Renders a Cartesian coordinate plane. Supports graphing equations, line segments, points, and interactive sliders.

**Example JSON**
```json
{ "omdType": "coordinatePlane", "xMin": -5, "xMax": 5, "yMin": -5, "yMax": 5, "graphEquations": [{ "equation": "y = 2x + 1", "color": "#E74C3C", "strokeWidth": 2 }], "dotValues": [[0, 1, "#E74C3C"]] }
```

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
| `plotMode` | boolean | No | `false` | Enable click-to-add/remove student points and hover previews |
| `plottedPoints` | `[number, number][]` | No | `[]` | Initial student-created points |
| `plotSnap` | number | No | `1` | Grid increment used to snap points |
| `maxPlottedPoints` | number | No | unlimited | Optional point limit |
| `plotPointColor` | string | No | `"#2563eb"` | Student point color |

### Plot mode

Clicking a snapped location adds a point; clicking an existing point removes it.
Hovering previews the landing spot with a dashed ghost, dashed guides running out
to both axes, and a coordinate pill — the pill and ring turn red over a point that
a click would remove. Plot mode also swaps the default grey card for white paper
with a hairline edge, unless you set `backgroundColor` yourself.

Changes are available through `omdDisplay`'s `onChange` option and the bubbling
`omd-coordinateplane-change` event.

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
display.load(plane);
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

**Example JSON**
```json
{ "omdType": "tileEquation", "left": ["x", "x", "1", "1", "1"], "right": ["1", "1", "1", "1", "1", "1", "1"], "tileSize": 40 }
```

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
display.load(tiles);
```

---

## table

Renders a value table. Can auto-generate rows from an equation or use manually provided data.

**Example JSON**
```json
{ "omdType": "table", "equation": "y=3x+2", "xMin": 0, "xMax": 5, "stepSize": 1, "headers": ["x", "y"], "alternatingRowColors": true }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `equation` | string | No\* | `""` | Equation to generate rows (e.g. `'y=2x'`). Required unless `data` is provided. |
| `data` | array[][] | No\* | `[]` | Manual rows as `[[x, y], ...]`. Used when `equation` is not set. |
| `headers` | string[] | No | `['x', 'y']` | Column header labels. `""` leaves a header blank — e.g. the corner of a multiplication table; only a missing (`null`) header shows a `Col n` placeholder |
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
| `editable` | boolean | No | `false` | Render editable cells as inputs inside the table |
| `editableCells` | `[number, number][]` | No | blank cells | Explicit zero-based row/column pairs to edit |
| `editableToken` | primitive | No | `null` | Value that marks a cell as editable |
| `editableValues` | object | No | `{}` | Initial values keyed by `"row,column"` |

\* Either `equation` or `data` must be provided.

Bare fractions in headers and cells (`"2/3"`, `"1 1/4"`) are typeset stacked.

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
display.load(table);
```

Editable cells render as inputs in place. Entered values are emitted without
rebuilding the table or losing input focus:

```js
const display = new omdDisplay(container, {
  onChange: ({ editableValues }) => console.log(editableValues),
});

display.loadFromJSON({
  omdType: 'table',
  headers: ['Number', 'Cost'],
  data: [[0, null], [1, null], [2, null]],
  editable: true,
});
```

---

## ratioChart

Renders a ratio or fraction visualization in one of several styles.

**Example JSON**
```json
{ "omdType": "ratioChart", "valueA": 3, "valueB": 5, "renderType": "tile", "size": "medium" }
```

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
display.load(chart);
```

---

## spinner

Renders a circular spinner divided into equal sections with an arrow.

**Example JSON**
```json
{ "omdType": "spinner", "divisions": 6, "arrowPosition": 90, "size": "large" }
```

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
display.load(spinner);
```

---

## areaDiagram

Rectangular area model with fractional side lengths — the Grade 5 fraction-multiplication
visual. Whole unit squares are ruled solid, each unit square is partitioned into equal
strips ruled dashed, and a shaded sub-rectangle carries the product.

Every length accepts a number, a fraction string (`'2/3'`) or a mixed number (`'3 1/4'`)
and is held as an exact rational, so a 3 1/4 by 4 rectangle reports an area of 13 rather
than 12.999999999999998.

**Example JSON**
```json
{ "omdType": "areaDiagram", "columns": 4, "rows": 1, "rowParts": 3, "shadeHeight": "2/3",
  "topBrace": { "scope": "grid", "label": "4" }, "leftBrace": { "scope": "shaded" },
  "expressionLine": true }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `columns` | number\|string | No | `4` | Drawn width in whole units; a fraction gives a partial last column |
| `rows` | number\|string | No | `1` | Drawn height in whole units |
| `columnParts` | number | No | `1` | Dashed vertical partitions per unit square |
| `rowParts` | number | No | `1` | Dashed horizontal partitions per unit square |
| `unitScale` | number | No | `64` | Pixels per unit |
| `shadeWidth` | number\|string | No | `columns` | Shaded width in units |
| `shadeHeight` | number\|string | No | `rows` | Shaded height in units |
| `shadedCells` | `[col,row][]` | No | — | Explicit partition cells; overrides the shaded rectangle |
| `shadeColor` | string | No | `#7FCFEA` | Fill of the shaded region |
| `showPartitions` | boolean | No | `true` | Draw the dashed partition rules |
| `showUnitLines` | boolean | No | `true` | Draw the solid unit-square rules |
| `partitionScope` | `'all'`\|`'last'`\|`{from,to}` | No | `'all'` | Which units carry partition rules. `'last'` subdivides only the unit the shading ends inside — the convention for mixed numbers |
| `columnPartitionScope` / `rowPartitionScope` | same | No | `'all'` | Per-axis override |
| `topBrace` / `leftBrace` / `bottomBrace` / `rightBrace` | `'unit'`\|`'shaded'`\|`'grid'`\|`false`\|object | No | — | Dimension annotation on that side. Object form is `{ from, to, label, style }` in units |
| `topBraces` / `leftBraces` / `bottomBraces` / `rightBraces` | array | No | `[]` | Several spans per side — used for the whole and fractional parts of a mixed number, or a brace under one part of a bar |
| `showLabels` | boolean | No | `false` | Shorthand for braces on the shaded extent on both axes |
| `braceStyle` | `'brace'`\|`'arrow'` | No | `'brace'` | Curly brace or double-headed measurement arrow |
| `title` | string | No | `''` | omdMathText markup above the figure |
| `expressionLine` | boolean | No | `false` | Print the live `w × h = area` line under the figure |
| `expressionSuffix` | string | No | `'square units'` | Unit phrase for area readouts |
| `showAreaLabel` | boolean | No | `false` | Print the area centred under the figure |
| `decompose` | boolean | No | `false` | Tint the fractional part(s), rule the split(s), print the partial products |
| `decomposeAxis` | `'auto'`\|`'x'`\|`'y'`\|`'both'` | No | `'auto'` | Axis to decompose along. `'both'` splits each mixed side into whole + fraction: 2 1/4 × 3 2/3 becomes four partial products |
| `readout` | `'full'`\|`'partials'`\|`'none'` | No | `'full'` | The decomposition line: `'full'` is `(2 × 3) + (2 × 2/5) = 6 + 4/5 = 6 4/5`, `'partials'` stops at `(2 × 3) + (2 × 2/5)` so the total is left to the student, `'none'` hides it |
| `decomposeColor` | string | No | `'#F6C177'` | Tint of the fractional columns (or rows, when only rows split) |
| `decomposeRowColor` | string | No | `'#BFE3B4'` | Tint of the fractional rows when both sides split |
| `decomposeCornerColor` | string | No | `'#F2B8B5'` | Tint of the fraction × fraction piece when both sides split |
| `interactive` | boolean | No | `false` | Enable student input |
| `allowPaint` | boolean | No | `true` | Press and drag to shade or unshade partition cells |
| `allowResize` | boolean | No | `false` | Drag handles that set the side lengths, snapped to partitions |
| `inputs` | object[] | No | `[]` | Answer fields or live readouts under the figure |
| `checkAnswers` | boolean | No | `false` | Grade answer fields as they are typed |

`inputs` entries are either an answer field —
`{ key, label, answer, suffix, width }` — or a live readout —
`{ label, readout: 'area' | 'expression' }`. Numeric answers compare as exact rationals,
so `15/4`, `3 3/4` and `3.75` all match; expressions compare as normalized text, so
`4 x 2/3`, `4 × 2/3` and `4*2/3` all match.

### Interaction

`onChange(payload)` fires on every gesture, and the same payload is dispatched as the DOM
event `omd-areadiagram-change`:

```js
{
  type: 'paint',          // paint | resize | cells | clear | input | check
  shadeWidth: '2 1/4',
  shadeHeight: '2',
  rectangular: true,      // false when the painted region is ragged
  area: '4 1/2',
  areaFraction: { n: 9, d: 2 },
  expression: '2 1/4 × 2',
  answers: { area: '4 1/2' },
  feedback: { area: 'correct' }
}
```

### Example

```js
import { omdAreaDiagram } from '@teachinglab/omd';

// 2 × 3 2/5 with the distributive decomposition drawn in
const model = new omdAreaDiagram();
model.loadFromJSON({
  columns: 4, rows: 2, columnParts: 5,
  shadeWidth: '3 2/5',
  partitionScope: 'last',
  topBraces: [ { from: 0, to: 3, label: '3' }, { from: 3, to: '3 2/5' } ],
  leftBrace: { scope: 'grid', label: '2' },
  decompose: true,
});
display.load(model);

model.getArea();          // { n: 34, d: 5 }
model.getState().area;    // '6 4/5'

// 2 1/4 × 3 2/3 split on both sides, readout stopping at the partial products
const mixed = new omdAreaDiagram();
mixed.loadFromJSON({
  columns: 4, rows: 3, columnParts: 3, rowParts: 4,
  shadeWidth: '3 2/3', shadeHeight: '2 1/4',
  partitionScope: 'last',
  topBraces: [ { from: 0, to: 3, label: '3' }, { from: 3, to: '3 2/3' } ],
  leftBraces: [ { from: 0, to: 2, label: '2' }, { from: 2, to: '2 1/4' } ],
  decompose: true, decomposeAxis: 'both', readout: 'partials',
});

// a bar of fifths with a brace under the first fifth
const bar = new omdAreaDiagram();
bar.loadFromJSON({
  columns: 5, rows: 1, columnParts: 3, shadeWidth: '1/3',
  columnPartitionScope: { from: 0, to: 1 },
  bottomBraces: [ { from: 0, to: 1, label: '[1/5]' } ],
});
```

For a not-to-scale sketch, or whole-number partial products, use [`areaModel`](#areamodel).

---

## areaModel

The partial-products area model teachers sketch: a rectangle cut into pieces, side lengths
written along the top and left, each piece holding its product, and an optional sum line.
It is not drawn on a unit grid, so it covers mixed × mixed (2 1/4 × 3 2/3) and multi-digit
whole numbers (222 × 14) alike. Pieces default to the product of their side lengths —
fractions improper (`4/3`), whole numbers with thousands separators (`2,000`) — and every
fraction is typeset stacked.

**Example JSON**
```json
{ "omdType": "areaModel", "columns": ["3", "2/3"], "rows": ["2", "1/4"], "showSum": true, "caption": "not to scale" }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `columns` | string[] | Yes | — | Side lengths across the top, one per column |
| `rows` | string[] | Yes | — | Side lengths down the left, one per row |
| `cells` | string[][] | No | computed | Text in each piece, row by row — e.g. `'2 × 3 = 6'` |
| `showSum` | boolean | No | `false` | Print the sum line: `6 + 4/3 + 3/4 + 1/6 = 8 1/4` |
| `sumBy` | `'cells'`\|`'rows'` | No | `'cells'` | `'rows'` adds each row first: `2,220 + 888 = 3,108` |
| `sum` | string | No | `''` | Explicit sum line; wins over the computed one |
| `toScale` | boolean | No | `false` | Size pieces by their side lengths instead of their text |
| `unitScale` | number | No | `0` | Px per unit when `toScale`; `0` fits the columns to `cellWidth` each |
| `cellWidth` / `cellHeight` | number | No | `190` / `90` | Size of the largest column / row when not to scale. Smaller side lengths get smaller pieces, stepping down like a hand sketch (3 : 2/3 draws about 1 : 0.63, 200 : 20 : 2 about 1 : 0.63 : 0.45), and every piece grows to fit its text |
| `cellColors` | string[][] | No | palette | Piece fills, row by row. Default: blue/yellow over green/pink for two columns; blue/yellow/green over purple/pink/cyan for wider models |
| `lineStyle` | `'solid'`\|`'dashed'` | No | `'solid'` | Lines between pieces |
| `lineDash` | string | No | `'7 6'` | Dash pattern when `lineStyle` is `'dashed'` |
| `strokeColor` / `strokeWidth` | string / number | No | `'#222222'` / `2.5` | Outline and divider style |
| `fontSize` / `labelFontSize` | number | No | `20` / `20` | Piece and side-length text size |
| `caption` | string | No | `''` | Small caption under the figure, e.g. `'not to scale'` |

### Example

```js
import { omdAreaModel } from '@teachinglab/omd';

// 222 × 14 as partial products, summed row by row
const model = new omdAreaModel();
model.loadFromJSON({
  columns: ['200', '20', '2'],
  rows: ['10', '4'],
  showSum: true,
  sumBy: 'rows',
});
display.load(model);

model.getCells();         // [['2,000', '200', '20'], ['800', '80', '8']]
model.getSumText();       // '2,220 + 888 = 3,108'
```

---

## fractionStrips

Equal-sharing strip diagram: one whole strip per object, each partitioned by the number of
sharers, with one share highlighted. Three sandwiches shared by four people is three strips
of fourths with one fourth shaded on each — 3 × 1/4 = 3/4 = 3 ÷ 4.

**Example JSON**
```json
{ "omdType": "fractionStrips", "strips": 3, "parts": 4, "shaded": 1, "brace": "1", "expressionLine": true }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `strips` | number | No | `3` | Number of whole strips |
| `parts` | number | No | `5` | Equal parts each whole is cut into |
| `subParts` | number | No | `1` | Cuts every part again. Part lines are then ruled solid and sub-part lines dashed, and `shaded` counts sub-parts |
| `shaded` | number | No | `1` | Shaded pieces per strip (sub-parts when `subParts` > 1) |
| `shadedList` | number[] | No | — | Per-strip shaded counts, overriding `shaded` |
| `shadedCells` | `[strip,part][]` | No | — | Explicit shaded cells |
| `orientation` | `'horizontal'`\|`'vertical'` | No | `'horizontal'` | Strip direction |
| `fillFrom` | `'start'`\|`'end'` | No | `'start'` | Which end the shading starts from |
| `stripLength` | number | No | `420` | Length in px along the partitioned axis |
| `stripThickness` | number | No | `46` | Thickness of each strip in px |
| `gap` | number | No | `14` | Gap between strips in px |
| `dividerDash` | string | No | `'6 5'` | Dash pattern for part dividers when `subParts` is 1; `'none'` draws them solid |
| `subPartDash` | string | No | `'6 5'` | Dash pattern for sub-part dividers |
| `brace` | string\|`false` | No | `'1'` | Label for the brace under the whole |
| `braceEvery` | boolean | No | `false` | Repeat the brace under every strip |
| `stripLabels` | string[] | No | `[]` | Caption under each strip |
| `separator` | string | No | `''` | Symbol between vertical strips, e.g. `'+'` |
| `expressionLine` | boolean | No | `false` | Print `strips × per-strip = total` under the figure |
| `interactive` | boolean | No | `false` | Click or drag parts to shade them |

### Example

```js
import { omdFractionStrips } from '@teachinglab/omd';

// four chocolate bars of fifths, three fifths eaten from each
const bars = new omdFractionStrips();
bars.loadFromJSON({
  strips: 4, parts: 5, shaded: 3,
  orientation: 'vertical', fillFrom: 'end',
  separator: '+', brace: false, dividerDash: 'none',
  stripLength: 210, expressionLine: true,
});
display.load(bars);

bars.getState().total;    // '2 2/5'

// solid thirds over dashed eighteenths, one eighteenth shaded
const strip = new omdFractionStrips();
strip.loadFromJSON({ strips: 1, parts: 3, subParts: 6, shaded: 1, brace: false });
```

---

## fractionCircle

One or more circles cut into equal wedges with some wedges shaded — the circle model for a
whole number times a non-unit fraction.

**Example JSON**
```json
{ "omdType": "fractionCircle", "count": 2, "parts": 6, "shaded": 5, "expressionLine": true }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `count` | number | No | `2` | Number of circles (`circles` is an accepted alias) |
| `parts` | number | No | `6` | Wedges per circle |
| `shaded` | number | No | `5` | Shaded wedges per circle |
| `shadedList` | number[] | No | — | Per-circle shaded counts |
| `shadedCells` | `[circle,wedge][]` | No | — | Explicit shaded wedges |
| `radius` | number | No | `74` | Circle radius in px |
| `gap` | number | No | `26` | Gap between circles in px |
| `startAngle` | number | No | `-90` | Angle of the first cut in degrees |
| `shadeColor` | string | No | `#FFD84D` | Fill of the shaded wedges |
| `circleLabels` | string[] | No | `[]` | Caption under each circle |
| `expressionLine` | boolean | No | `false` | Print `count × per-circle = total` under the figure |
| `interactive` | boolean | No | `false` | Click wedges to toggle them |

### Example

```js
import { omdFractionCircle } from '@teachinglab/omd';

const model = new omdFractionCircle();
model.loadFromJSON({ count: 2, parts: 6, shaded: 5, expressionLine: true });
display.load(model);

model.getState().total;   // '1 2/3'
```

---

## algorithmWork

The US standard algorithms — addition, subtraction, multiplication, long division — on a
place-value aligned digit grid. Rows and individual cells carry `step` numbers, so a single
JSON object drives a whole step-by-step reveal: anything tagged above `stepIndex` stays
hidden. For division, set `divisor` and the bracket is drawn automatically over the first
`given` row.

**Example JSON**
```json
{ "omdType": "algorithmWork", "operation": "addition", "columns": ["1000s", "100s", "10s", "1s"],
  "rows": [
    { "kind": "carry", "cells": ["1", "1", "1", ""] },
    { "kind": "given", "cells": ["", "3", "5", "7", "6"] },
    { "kind": "given", "cells": ["+", "2", "4", "8", "9"] },
    { "kind": "rule" },
    { "kind": "answer", "cells": ["", "6", "0", "6", "5"] }
  ] }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `operation` | `'addition'`\|`'subtraction'`\|`'multiplication'`\|`'division'` | No | `'addition'` | Algorithm being shown |
| `rows` | `Row[]` | Yes | `[]` | Rows top-to-bottom (see below) |
| `columns` | string[] | No | `[]` | Place-value headers across the top, e.g. `['100s','10s','1s']` |
| `divisor` | string | No | `''` | Division only: the divisor drawn outside the bracket |
| `steps` | `{ label, description }[]` | No | `[]` | Step descriptions for the optional steps list |
| `stepIndex` | number | No | — | How many steps are revealed; omit to reveal everything |
| `activeRow` | number | No | `-1` | Row index to highlight as the current step |
| `showStepsList` | boolean | No | `false` | Draw the numbered step list beside the grid (requires `steps`) |
| `fontSize` | number | No | `26` | Digit font size in px |
| `columnWidth` | number | No | `32` | Width of one place-value column in px |
| `rowGap` | number | No | `4` | Vertical gap between rows in px |

### Row shape

| Name | Type | Description |
|---|---|---|
| `kind` | `'given'`\|`'carry'`\|`'work'`\|`'answer'`\|`'rule'` | `given` is an operand digit, `carry` a small regrouped digit, `work` an intermediate line, `answer` the emphasized result, `rule` a horizontal line |
| `cells` | `(string \| Cell)[]` | One entry per column, right-aligned against `columns`; `''` leaves the cell blank |
| `step` | number | Row stays hidden until `stepIndex` reaches this value |
| `annotation` | string | Caption drawn to the right of the row |
| `color` | string | Overrides the palette colour for the row |
| `fontSize` | number | Overrides the digit size for the row |
| `gapAfter` | number | `rule` rows only: vertical space after the line, in px |

A cell may also be an object — `{ text, kind, color }` — to give one digit a different kind
or colour than its row, which is how crossed-out regrouping digits are drawn.

### Example

```js
import { omdAlgorithmWork } from '@teachinglab/omd';

// long division, revealed one step at a time
const work = new omdAlgorithmWork();
work.loadFromJSON({
  operation: 'division', divisor: '12',
  rows: [
    { kind: 'answer', cells: ['', '6', '8'], step: 3 },
    { kind: 'given',  cells: ['8', '1', '6'] },
    { kind: 'work',   cells: ['7', '2', ''], step: 1 },
    { kind: 'rule',   step: 1 },
    { kind: 'work',   cells: ['', '9', '6'], step: 2 },
  ],
  steps: [
    { label: 'Step 1', description: '12 x 6 = 72' },
    { label: 'Step 2', description: '81 - 72 = 9, bring down the 6' },
    { label: 'Step 3', description: '12 x 8 = 96, so the quotient is 68' },
  ],
  showStepsList: true,
  stepIndex: 2,        // steps 1-2 visible, step 3 still hidden
  activeRow: 4,
});
display.load(work);
```

---

## fractionWork

The standard fraction algorithms worked line by line. Unlike `algorithmWork`, the rows are
**derived from the problem** — give the operation and two operands, and every step is
computed exactly:

| Operation | Steps |
|---|---|
| `multiplication` | rename whole/mixed numbers → multiply across → products → divide by the GCF → simplify → mixed number |
| `division` | rename → keep, change, flip → then the multiplication steps |
| `addition` | rename → least common denominator → equivalent fractions → add numerators → sum → simplify → mixed number |
| `subtraction` | same as addition, subtracting numerators |

Steps that do nothing are skipped (no rename for plain fractions, no common-denominator step
when denominators already match, no GCF step when the result is in lowest terms). Mixed
numbers are renamed as fractions greater than 1 before every operation, so subtraction never
regroups. Lines align on `=`; the first step sits to the right of the problem, as on paper.
The part each step introduces — the reciprocal, the `× 4` that builds an equivalent fraction,
the `÷ GCF` — is drawn in the accent colour, and each line carries a note saying why.

**Example JSON**
```json
{ "omdType": "fractionWork", "operation": "division", "left": "3 1/2", "right": "1/4",
  "stepIndex": 2, "showStepsList": true }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `operation` | `'multiplication'`\|`'division'`\|`'addition'`\|`'subtraction'` | Yes | — | Operation to work |
| `left` | string \| number | Yes | — | Whole number (`4`), fraction (`'3/4'`) or mixed number (`'2 1/2'`); kept as written, so `6/8` is not pre-reduced |
| `right` | string \| number | Yes | — | Same forms as `left`; dividing by zero throws |
| `stepIndex` | number | No | — | Steps revealed (`0` = problem only). Setting it turns on the current-step band; omit for the finished work |
| `showStepsList` | boolean | No | `false` | Draw the numbered step list beside the work |
| `showAnnotations` | boolean | No | `true` | Draw the per-line note explaining each step |
| `fontSize` | number | No | `28` | Font size of the main work in px |

The layout is sized for the finished work at every `stepIndex`, so stepping never reflows the
figure. Each revealed line is a `<g data-step="n">`, and step-list entries carry
`data-step-index` for click-to-jump navigation. Invalid operands (negative, decimal, zero
denominator) throw with the offending value in the message.

### Example

```js
import { omdFractionWork } from '@teachinglab/omd';

const work = new omdFractionWork();
work.loadFromJSON({ operation: 'addition', left: '1/3', right: '1/4', stepIndex: 0 });
display.load(work);

work.getSteps().map(s => s.description);
// ['Find a common denominator', 'Write equivalent fractions', 'Add the numerators', 'Find the sum']
work.nextStep();   // 'Find a common denominator' — reveals line 1
```

---

## fractionAreaModel

“a/b of c/d” on a unit square, built up in three side-by-side panels — the model Grade 5
materials use to introduce fraction × fraction:

1. the whole cut into `d` rows with `c` of them shaded (`right`);
2. only the shaded part cut into `b` columns, `a` of them darkened (`left` of it);
3. the column cuts extended across the whole, so the dark part reads as `a×c` of `b×d` equal pieces.

Every panel has `1` braces on its top and left edges and a caption below. Default captions are
`[c/d] of the whole`, `[a/b] of [c/d]` and `[a/b] of [c/d] is [ac/bd]` (with `= simplified`
appended when the product reduces); `captions` overrides them, with `[3/4]`, `[2 1/2]` and `[6]`
typeset as stacked math. Everything is plain SVG — no `foreignObject` — so it exports cleanly.

**Example JSON**
```json
{ "omdType": "fractionAreaModel", "left": "1/4", "right": "1/3",
  "captions": ["pan with [1/3] left", "eat [1/4] of what's left", "[1/4] of [1/3] is [1/12]"] }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `left` | string | Yes | `'1/4'` | The “of” fraction `a/b` (columns), from 0 to 1 |
| `right` | string | Yes | `'1/3'` | The amount `c/d` it is taken of (rows), from 0 to 1 |
| `stepIndex` | `1`\|`2`\|`3` | No | `3` | Panels revealed; space for the rest stays reserved |
| `captions` | string[] | No | — | Per-panel caption overrides; `[3/4]`, `[2 1/2]`, `[6]` typeset as math |
| `unitScale` | number | No | `150` | Side of each unit square in px |
| `shadeColor` | string | No | `'#7FCFEA'` | Fill of the shaded amount |
| `overlapColor` | string | No | `'#0096C7'` | Fill of the part taken of it |
| `captionFontSize` | number | No | `17` | Caption font size in px |
| `labelFontSize` | number | No | `15` | Font size of the `1` brace labels in px |

---

## mathText

Prose with real typeset math inline — the component for word problems whose stems contain
fractions, expressions or equations. The prose is rendered as ordinary HTML text inside a
`<foreignObject>` rather than SVG `<text>`, so Chrome's page translator translates the
sentence while every math run is marked `translate="no"` and stays exactly as authored.
Text wraps at `width` and never splits a fraction, radical or script across lines.

**Example JSON** — legacy bracket markup
```json
{ "omdType": "mathText", "text": "**11** A baker has [3/4] of a box of muffin mix. He pours it equally into [6] bowls.",
  "fontSize": 18, "width": 460 }
```

**Example JSON** — inline LaTeX
```json
{ "omdType": "mathText", "text": "The area of the garden is \\( \\frac{1}{2}bh \\) and the fence is 2 5/8 meters long, so solve \\( 4x + 2 = 10 \\).",
  "fontSize": 18, "width": 460 }
```

### Markup

| Markup | Renders as |
|---|---|
| `\( ... \)`, `\[ ... \]` | LaTeX-subset math run (untranslated) |
| `\frac{a}{b}`, `\dfrac`, `\tfrac`, `a/b` | Stacked fraction |
| `x^2`, `x^{n+1}`, `a_1`, `a_{ij}` | Superscript / subscript |
| `\sqrt{x}`, `\sqrt[3]{x}` | Radical, with optional index |
| `( )`, `[ ]`, with optional `\left` / `\right` | Delimiters (inline size; `\left`/`\right` are accepted, not scaled) |
| `\text{...}` | Words inside math — stays translatable |
| `\times \div \cdot \pm \mp \le \leq \ge \geq \ne \neq \approx \equiv \to \rightarrow \infty \pi \theta \alpha \beta \degree \circ` | Symbol |
| `[3/4]`, `[2 3/4]`, `[6]` | Legacy bracket tokens; unrecognized bracket content stays literal text |
| `3/4`, `2 5/8` in running prose | Auto-detected fraction; `km/h`, `9/12/2025` and `1.5/2` are left alone |
| `**bold**` | Bold span |
| `\n` | Hard line break |

`2 1/2` and `2\frac{1}{2}` both render as a single mixed number, and a minus with no left
operand renders as a sign (`-5`, `10^{-2}`). `getPlainText()` returns the whole string in
linear form (`3/4`, `x^2`, `sqrt(16)`) for read-aloud, grading and alt text.

The grammar itself is also published on its own, free of SVG and jsvg, for React and other
DOM consumers: `import { parseInlineMath, renderInlineMathToHTML, INLINE_MATH_CSS } from
'@teachinglab/omd/text'`.

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | string | Yes | `''` | Prose with `\( ... \)` math, legacy `[n/d]` tokens, bare fractions, `**bold**` and `\n` |
| `fontSize` | number | No | `18` | Prose font size in px |
| `width` | number | No | `0` | Wrap width in px; `0` renders a single line |
| `lineHeight` | number | No | — | Line height in px; defaults to 1.85 × `fontSize` |
| `fontFamily` | string | No | `'Albert Sans, Arial, Helvetica, sans-serif'` | CSS font family for the prose |
| `fontColor` | string | No | `'#222222'` | CSS color for the prose and math |
| `fontWeight` | number \| string | No | `400` | CSS font weight for the prose |

### Example

```js
import { omdMathText } from '@teachinglab/omd';

const stem = new omdMathText();
stem.loadFromJSON({
  text: 'Each chocolate bar is cut into fifths. Noah eats \\( \\frac{3}{5} \\) of every bar, ' +
        'and there are [4] bars, so he eats 2 2/5 bars in all.',
  fontSize: 18, width: 420,
});
display.load(stem);
```

---

## linePlot

Dot/line plot in state-test style: stacked marks above a labeled axis. Ticks that land on
exact halves, thirds, quarters or eighths label themselves as fractions and mixed numbers
(`9`, `9 1/4`, `9 1/2`); other values fall back to decimals.

**Example JSON**
```json
{ "omdType": "linePlot", "min": 9, "max": 12, "step": 0.25,
  "values": [9, 9.5, 9.5, 9.75, 10, 10, 10.25, 10.5, 10.5, 10.5, 11, 11.25, 12],
  "title": "PAPER AIRPLANE FLIGHTS", "axisLabel": "Distance (yards)" }
```

### Fields

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `values` | number[] | Yes | `[]` | One entry per observation; entries stack on the nearest tick |
| `min` | number | No | `0` | Axis minimum |
| `max` | number | No | `10` | Axis maximum |
| `step` | number | No | `1` | Tick interval, e.g. `0.25` for quarters |
| `title` | string | No | `''` | Title drawn above the plot |
| `axisLabel` | string | No | `''` | Caption drawn under the axis, e.g. `'Distance (yards)'` |
| `marker` | `'x'`\|`'dot'` | No | `'x'` | Mark shape |
| `fontSize` | number | No | `15` | Tick label font size in px |
| `width` | number | No | `520` | Total width in px (minimum 200) |
| `dotRadius` | number | No | `6` | Half the mark size in px |

### Example

```js
import { omdLinePlot } from '@teachinglab/omd';

const plot = new omdLinePlot();
plot.loadFromJSON({
  min: 0, max: 2, step: 0.125,
  values: [0.25, 0.5, 0.5, 0.875, 1, 1, 1, 1.5],
  marker: 'dot', axisLabel: 'Length (inches)',
});
display.load(plot);
```
