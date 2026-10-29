# OMD Shape Components

SVG geometry shapes rendered via the OMD library. All shapes are loaded with `loadFromJSON()` and passed to `omdDisplay` or `omdCanvas`.

```js
import { omdRectangle } from '@teachinglab/omd';
const shape = new omdRectangle();
shape.loadFromJSON({ width: 5, height: 3, unitScale: 40, showLabels: true });
```

`unitScale` (pixels per unit) controls the rendered size. `showLabels` enables automatic dimension labels on all shapes.

---

## rightTriangle

A right triangle with the right angle at the bottom-right vertex.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `horizontalLeg` | number | yes* | `5` | Length of the bottom (horizontal) leg in units |
| `verticalLeg` | number | yes* | `10` | Length of the right (vertical) leg in units |
| `unitScale` | number | no | `10` | Pixels per unit |
| `showLabels` | boolean | no | `false` | Show leg length labels |
| `angleA` | number | no | — | Angle A in degrees. If provided with `hypotenuse`, overrides `horizontalLeg` and `verticalLeg` |
| `angleB` | number | no | — | Angle B in degrees (stored but not used for leg calculation) |
| `hypotenuse` | number | no | — | Hypotenuse length. Used with `angleA` to derive leg lengths |

\* `horizontalLeg` and `verticalLeg` are required unless `angleA` + `hypotenuse` are provided instead.

Do not use `width`, `height`, or `color` fields.

```js
import { omdRightTriangle } from '@teachinglab/omd';
const tri = new omdRightTriangle();
tri.loadFromJSON({ horizontalLeg: 6, verticalLeg: 8, unitScale: 30, showLabels: true });
```

---

## isoscelesTriangle

An isosceles triangle with the apex centered above the base.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `base` | number | yes | `5` | Length of the base in units |
| `height` | number | yes | `10` | Height of the triangle in units |
| `unitScale` | number | no | `10` | Pixels per unit |
| `showLabels` | boolean | no | `false` | Show side length labels |

```js
import { omdIsoscelesTriangle } from '@teachinglab/omd';
const tri = new omdIsoscelesTriangle();
tri.loadFromJSON({ base: 4, height: 6, unitScale: 40 });
```

---

## rectangle

A rectangle with optional side labels, center label, and outside labels.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `width` | number | yes | `10` | Width in units |
| `height` | number | yes | `10` | Height in units |
| `unitScale` | number | no | `10` | Pixels per unit |
| `showLabels` | boolean | no | `false` | Auto-label top and right sides with dimension values |
| `labelMode` | `'edge'` \| `'side'` | no | `'edge'` | `'edge'` labels top + right; `'side'` labels all four sides |
| `sideLabels` | object | no | — | Override individual side labels: `{ top, right, bottom, left }` |
| `centerLabel` | string | no | `''` | Text rendered at the center of the rectangle |
| `outsideTopLabel` | string | no | `''` | Text above the top edge (further out than the dimension label) |
| `outsideBottomLabel` | string | no | `''` | Text below the bottom edge |
| `outsideLeftLabel` | string | no | `''` | Text to the left of the left edge |
| `outsideRightLabel` | string | no | `''` | Text to the right of the right edge |
| `labelFontSize` | number | no | `12` | Font size in pixels for all labels |

Do not use a top-level `color` field. Bare fractions in labels (`'2 1/4 ft'`, `'3/4'`) are typeset stacked, matching tape diagrams, tables and area models.

```js
import { omdRectangle } from '@teachinglab/omd';
const rect = new omdRectangle();
rect.loadFromJSON({
  width: 5,
  height: 3,
  unitScale: 40,
  showLabels: true,
  labelMode: 'side',
  centerLabel: 'A = 15',
  outsideTopLabel: 'base'
});
```

---

## rectangularPrism

A 3D rectangular prism drawn in oblique projection with optional dimension annotations.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `length` | number | yes | `5` | Length (front face width) in units |
| `width` | number | yes | `3` | Depth (side face width) in units |
| `height` | number | yes | `4` | Height in units |
| `unitScale` | number | no | `18` | Pixels per unit |
| `showLabels` | boolean | no | `false` | Auto-label length, width, and height with dimension values |
| `sideLabels` | object | no | — | Override dimension labels: `{ length, width, height }` (also accepts `l`, `w`, `h` shorthand) |
| `lengthLabel` | string | no | `''` | Override the length dimension label text |
| `widthLabel` | string | no | `''` | Override the width dimension label text |
| `heightLabel` | string | no | `''` | Override the height dimension label text |
| `insideLabel` | string | no | `''` | Text rendered below the front face (useful for volume expressions) |
| `outsideTopLabel` | string | no | `''` | Text above the top face |
| `showHiddenEdges` | boolean | no | `true` | Render back edges as dashed lines (ignored when `showUnitCubes` is on) |
| `labelFontSize` | number | no | `12` | Font size in pixels for all labels |
| `showUnitCubes` | boolean | no | `false` | Render the prism as stacked unit cubes instead of smooth faces |
| `highlightLayer` | number | no | `-1` | 1-based layer counted from the bottom to recolor; `-1` highlights nothing |
| `layerColors` | object | no | — | Face color overrides for the unit cubes: `{ top, side, front }`, defaulting to `#e6edf7`, `#d5dfef` and the OMD light gray |
| `cubeGapRatio` | number | no | `0.08` | Gap between unit cubes as a fraction of one unit, clamped to 0–0.4 |

Unit-cube mode draws the outer shell only, so the solid still reads as solid, and dimension
labels compose over the cube grid unchanged. `length`, `width` and `height` are the cube
counts along each axis. Smooth-prism output is unchanged when `showUnitCubes` is `false`.

```js
import { omdRectangularPrism } from '@teachinglab/omd';
const prism = new omdRectangularPrism();
prism.loadFromJSON({
  length: 4,
  width: 2,
  height: 3,
  unitScale: 30,
  showLabels: true,
  insideLabel: 'V = 24 units³'
});
```

```js
// Grade 5 volume: 5 x 3 x 6 in unit cubes with the bottom layer picked out
const layered = new omdRectangularPrism();
layered.loadFromJSON({
  length: 5,
  width: 3,
  height: 6,
  unitScale: 20,
  showUnitCubes: true,
  highlightLayer: 1,
  sideLabels: { l: '5 ft', w: '3 ft', h: '6 ft' },
  insideLabel: 'V = 90 cubic feet'
});
```

---

## ellipse

An ellipse defined by horizontal and vertical radii.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `width` | number | yes | `10` | Horizontal radius in units |
| `height` | number | yes | `5` | Vertical radius in units |
| `unitScale` | number | no | `10` | Pixels per unit |
| `showLabels` | boolean | no | `false` | Show a center label with dimensions (e.g. `4 × 2`) |

```js
import { omdEllipse } from '@teachinglab/omd';
const ellipse = new omdEllipse();
ellipse.loadFromJSON({ width: 4, height: 2, unitScale: 35, showLabels: true });
```

---

## circle

A circle with optional annotated points and segments between points.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `radius` | number | yes | `5` | Radius in units |
| `unitScale` | number | no | `10` | Pixels per unit |
| `showLabels` | boolean | no | `false` | Show a labeled radius line when no `points` are defined |
| `points` | array | no | `[]` | Named points on the circle. Each item: `{ name, label, type: 'center' \| 'circumference', angle }` |
| `segments` | array | no | `[]` | Line segments between named points. Each item: `{ from, to, label, labelOffset, color }` |
| `pointRadius` | number | no | `4` | Radius of point dots in pixels |
| `annotationFontSize` | number | no | `16` | Font size for point and segment labels |

**Point fields:**

| Field | Description |
|---|---|
| `name` | Identifier used by `segments.from` / `segments.to` |
| `label` | Display text for the point (defaults to `name` if omitted) |
| `type` | `'center'` places the point at the origin; `'circumference'` places it on the circle edge |
| `angle` | Degrees from the positive x-axis (0 = right, 90 = up). Used when `type` is `'circumference'` |

Do not use a top-level `color` field.

```js
import { omdCircle } from '@teachinglab/omd';
const circle = new omdCircle();
circle.loadFromJSON({
  radius: 4,
  unitScale: 35,
  points: [
    { name: 'O', type: 'center' },
    { name: 'A', type: 'circumference', angle: 0 },
    { name: 'B', type: 'circumference', angle: 90 }
  ],
  segments: [
    { from: 'O', to: 'A', label: 'r = 4' },
    { from: 'A', to: 'B', color: '#e03' }
  ]
});
```

---

## angle

One or more rays from a shared vertex with arc markers and angle labels.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `rays` | array | yes | `[{angle:0},{angle:55}]` | Array of ray objects. Each: `{ angle, length, label, labelDistance, color, strokeWidth }` |
| `angles` | array | no | `[{from:0,to:1,label:'a°'}]` | Arc markers between rays. Each: `{ from, to, label, marker }` |
| `vertexLabel` | string | no | `''` | Label at the vertex point |
| `rayLength` | number | no | `160` | Default ray length in pixels |
| `strokeColor` | string | no | `'black'` | Default stroke color for rays and arcs |
| `strokeWidth` | number | no | `2` | Default stroke width in pixels |
| `arcRadius` | number | no | `42` | Default arc marker radius in pixels |
| `showAngleTicks` | boolean | no | `true` | Use small tick marks on angle arcs to distinguish different angle measures |
| `angleTickGap` | number | no | `8` | Pixel spacing between multiple tick marks on one angle arc |
| `angleTickLength` | number | no | `12` | Length of each small tick mark in pixels |
| `angleTickTolerance` | number | no | `0.1` | Degree tolerance for deciding which angles are equal |
| `dotRadius` | number | no | `4` | Radius of the vertex dot in pixels |
| `fontSize` | number | no | `28` | Font size for angle and ray labels |

**Ray fields:**

| Field | Description |
|---|---|
| `angle` | Direction in degrees. `0` points right, `90` points up, `180` points left |
| `length` | Ray length in pixels (overrides `rayLength` for this ray) |
| `label` | Label rendered at the ray tip |
| `labelDistance` | Extra offset in pixels beyond the ray tip for the label |
| `color` | Stroke color for this ray |
| `strokeWidth` | Stroke width for this ray |

**Angle marker fields (`angles` array):**

| Field | Description |
|---|---|
| `from` | Ray index (number) or ray `name`/`label` string |
| `to` | Ray index (number) or ray `name`/`label` string |
| `label` | Text label for this angle |
| `marker` | `'arc'` (default), `'right'` for 90°, or `'full'` / `'circle'` |
| `tickCount` | Override the number of small tick marks for this angle |
| `tickLength` | Override tick mark length for this angle |
| `reflex` | Set true to draw the directed reflex angle instead of the smaller angle |

Do not use `width`, `height`, or top-level `color` fields.

Arc markers use the smaller angle between two rays by default, which matches most textbook diagrams. When `showAngleTicks` is true, angles with the same measure automatically receive the same number of small tick marks. Different measures are assigned one mark, then two, then three, and so on in the order they appear.

```js
import { omdAngle } from '@teachinglab/omd';
const angle = new omdAngle();
angle.loadFromJSON({
  rays: [
    { angle: 0, label: 'B' },
    { angle: 50, label: 'A' }
  ],
  angles: [
    { from: 0, to: 1, label: '50°', marker: 'arc' }
  ],
  vertexLabel: 'C',
  arcRadius: 50,
  showAngleTicks: true
});
```

---

## regularPolygon

A regular polygon centered in its viewbox, with an optional side-length label.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `numberOfSides` | number | yes | `5` | Number of sides (must be 3 or greater) |
| `radius` | number | yes | `5` | Circumradius in units (center to vertex) |
| `unitScale` | number | no | `10` | Pixels per unit |
| `showLabels` | boolean | no | `false` | Show the computed side length on one side |

Use `numberOfSides`, not `sides`.

```js
import { omdRegularPolygon } from '@teachinglab/omd';
const hex = new omdRegularPolygon();
hex.loadFromJSON({ numberOfSides: 6, radius: 4, unitScale: 30, showLabels: true });
```
