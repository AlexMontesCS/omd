# Visualizations Guide

OMD provides a comprehensive set of visualization components for teaching and learning mathematics. This guide covers all visualization components organized by category.

## Table of Contents

1. [Number & Ratio Visualizations](#number--ratio-visualizations)
2. [Graphing & Geometry](#graphing--geometry)
3. [Data Display](#data-display)

---

## Number & Ratio Visualizations

### Number Line

`omdNumberLine` creates interactive number lines with labeled ticks and optional dots to mark values.

#### Basic Usage

```javascript
import { omdNumberLine } from '@teachinglab/omd';

const numberLine = new omdNumberLine();
numberLine.loadFromJSON({
    min: 0,
    max: 10,
    dotValues: [2, 5, 8],
    label: "Number Line"
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `min` | number | 0 | Minimum value on the line |
| `max` | number | 10 | Maximum value on the line |
| `dotValues` | number[] | [] | Array of values to mark with dots |
| `label` | string | "" | Optional label for the number line |

#### Examples

**Simple number line (0-20):**
```javascript
numberLine.loadFromJSON({
    min: 0,
    max: 20
});
```

**Marking fractions:**
```javascript
numberLine.loadFromJSON({
    min: 0,
    max: 1,
    dotValues: [0.25, 0.5, 0.75],
    label: "Fractions"
});
```

**Negative numbers:**
```javascript
numberLine.loadFromJSON({
    min: -10,
    max: 10,
    dotValues: [-5, 0, 5]
});
```

---

### Number Tiles

`omdNumberTile` creates visual tiles with dots for counting and grouping activities.

#### Basic Usage

```javascript
import { omdNumberTile } from '@teachinglab/omd';

const tile = new omdNumberTile();
tile.loadFromJSON({
    value: 10,
    size: "medium",
    dotsPerColumn: 5
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | number | required | Number of dots to display |
| `size` | "small" \| "medium" \| "large" | "medium" | Size of the tile |
| `dotsPerColumn` | number | 5 | How many dots per column |
| `backgroundColor` | string | "#FFFFFF" | Background color of tile |
| `dotColor` | string | "#000000" | Color of the dots |

#### Examples

**Small tile:**
```javascript
tile.loadFromJSON({
    value: 5,
    size: "small",
    backgroundColor: "#E8F4FD",
    dotColor: "#1976D2"
});
```

**Custom arrangement:**
```javascript
tile.loadFromJSON({
    value: 15,
    dotsPerColumn: 3,  // 5 columns x 3 rows
    size: "large"
});
```

---

### Tape Diagrams

`omdTapeDiagram` creates part-whole relationship diagrams with labeled sections.

#### Basic Usage

```javascript
import { omdTapeDiagram } from '@teachinglab/omd';

const tape = new omdTapeDiagram();
tape.loadFromJSON({
    values: [3, 5, 2],
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
    labelSet: [
        {
            startIndex: 0,
            endIndex: 2,
            label: "Total: 10",
            showBelow: true
        }
    ]
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `values` | number[] | required | Array of segment values |
| `showValues` | boolean | true | Show values in each segment |
| `colors` | string[] | auto | Colors for each segment |
| `labelSet` | TapeLabel[] | [] | Labels spanning segments |
| `unitWidth` | number | 30 | Width per unit value |

#### Label Structure

```typescript
{
    startIndex: number,    // First segment index
    endIndex: number,      // Last segment index
    label: string,         // Label text
    showBelow?: boolean    // Show below the tape
}
```

#### Examples

**Simple ratio:**
```javascript
tape.loadFromJSON({
    values: [2, 3],
    colors: ["#FF6B6B", "#4ECDC4"],
    labelSet: [
        { startIndex: 0, endIndex: 1, label: "2:3", showBelow: true }
    ]
});
```

**Multi-part problem:**
```javascript
tape.loadFromJSON({
    values: [4, 4, 4, 6],
    showValues: true,
    labelSet: [
        { startIndex: 0, endIndex: 2, label: "3 equal parts" },
        { startIndex: 3, endIndex: 3, label: "remainder" }
    ],
    unitWidth: 25
});
```

---

### Ratio Charts

`omdRatioChart` creates pie and bar chart visualizations for ratios.

#### Basic Usage

```javascript
import { omdRatioChart } from '@teachinglab/omd';

const chart = new omdRatioChart();
chart.loadFromJSON({
    valueA: 3,
    valueB: 2,
    renderType: "pie",
    size: "medium"
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `valueA` | number | required | First ratio value |
| `valueB` | number | required | Second ratio value |
| `renderType` | "pie" \| "bar" | "pie" | Chart type |
| `size` | "small" \| "medium" \| "large" | "medium" | Chart size |

#### Examples

**Pie chart:**
```javascript
chart.loadFromJSON({
    valueA: 3,
    valueB: 5,
    renderType: "pie"
});
```

**Bar chart:**
```javascript
chart.loadFromJSON({
    valueA: 7,
    valueB: 3,
    renderType: "bar",
    size: "large"
});
```

---

### Balance Hanger

`omdBalanceHanger` creates balance scale visualizations for equations and equality.

#### Basic Usage

```javascript
import { omdBalanceHanger } from '@teachinglab/omd';

const balance = new omdBalanceHanger();
balance.loadFromJSON({
    leftValues: [5, 3],
    rightValues: [4, 4],
    tilt: "balanced"
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `leftValues` | number[] | required | Values on left side |
| `rightValues` | number[] | required | Values on right side |
| `tilt` | "left" \| "right" \| "balanced" | auto | Balance state |

#### Examples

**Balanced equation:**
```javascript
balance.loadFromJSON({
    leftValues: [10],
    rightValues: [7, 3],
    tilt: "balanced"
});
```

**Unbalanced:**
```javascript
balance.loadFromJSON({
    leftValues: [8, 3],
    rightValues: [5, 2],
    tilt: "left"
});
```

---

## Graphing & Geometry

### Coordinate Plane

`omdCoordinatePlane` creates a 2D coordinate system with full graphing capabilities.

#### Basic Usage

```javascript
import { omdCoordinatePlane } from '@teachinglab/omd';

const plane = new omdCoordinatePlane();
plane.loadFromJSON({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    graphEquations: [
        { equation: 'y = x^2', color: '#e11d48', strokeWidth: 2 }
    ]
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `xMin` | number | -5 | Minimum x value |
| `xMax` | number | 5 | Maximum x value |
| `yMin` | number | -5 | Minimum y value |
| `yMax` | number | 5 | Maximum y value |
| `xLabel` | string | "" | X-axis label |
| `yLabel` | string | "" | Y-axis label |
| `tickInterval` | number | 1 | Spacing between ticks |
| `graphEquations` | Equation[] | [] | Functions to graph |
| `lineSegments` | LineSegment[] | [] | Line segments to draw |
| `dotValues` | Dot[] | [] | Points to plot |
| `shapeSet` | Shape[] | [] | Shapes to display |
| `showTickLabels` | boolean | true | Show numeric labels |
| `backgroundColor` | string | lightGray | Background color |
| `showBackground` | boolean | true | Show background |

#### Equation Structure

```typescript
{
    equation: string,      // e.g., "y = 2x + 1"
    color?: string,        // Line color
    strokeWidth?: number,  // Line width
    domain?: {             // Optional domain restriction
        min: number,
        max: number
    }
}
```

#### Examples

**Linear function:**
```javascript
plane.loadFromJSON({
    xMin: -5,
    xMax: 5,
    yMin: -5,
    yMax: 5,
    graphEquations: [
        { equation: 'y = 2x + 1', color: '#3B82F6', strokeWidth: 2 }
    ],
    xLabel: "x",
    yLabel: "y"
});
```

**Multiple functions:**
```javascript
plane.loadFromJSON({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    graphEquations: [
        { equation: 'y = x^2', color: '#e11d48', strokeWidth: 2 },
        { equation: 'y = 2x + 1', color: '#3B82F6', strokeWidth: 2 },
        { equation: 'y = -x^2 + 5', color: '#10B981', strokeWidth: 2 }
    ]
});
```

**With points and shapes:**
```javascript
plane.loadFromJSON({
    xMin: -5,
    xMax: 5,
    yMin: -5,
    yMax: 5,
    graphEquations: [
        { equation: 'y = x^2 - 4', color: '#e11d48' }
    ],
    dotValues: [
        [-2, 0, "blue"],  // [x, y, color]
        [2, 0, "blue"],
        [0, -4, "red"]
    ],
    lineSegments: [
        {
            point1: [-2, 0],
            point2: [2, 0],
            color: "green",
            strokeWidth: 1
        }
    ]
});
```

---

### Shapes

OMD provides several geometric shapes that can be used standalone or within a coordinate plane.

#### Circle

```javascript
import { omdCircle } from '@teachinglab/omd';

const circle = new omdCircle();
circle.loadFromJSON({
    radius: 10,
    color: "#FF0000"
});
```

#### Rectangle

```javascript
import { omdRectangle } from '@teachinglab/omd';

const rect = new omdRectangle();
rect.loadFromJSON({
    width: 20,
    height: 10,
    color: "#00FF00"
});
```

#### Regular Polygon

```javascript
import { omdRegularPolygon } from '@teachinglab/omd';

const polygon = new omdRegularPolygon();
polygon.loadFromJSON({
    sides: 6,      // Hexagon
    radius: 15,
    color: "#0000FF"
});
```

#### Ellipse

```javascript
import { omdEllipse } from '@teachinglab/omd';

const ellipse = new omdEllipse();
ellipse.loadFromJSON({
    radiusX: 20,
    radiusY: 10,
    color: "#FFFF00"
});
```

#### Right Triangle

```javascript
import { omdRightTriangle } from '@teachinglab/omd';

const triangle = new omdRightTriangle();
triangle.loadFromJSON({
    base: 10,
    height: 15,
    color: "#FF00FF"
});
```

#### Isosceles Triangle

```javascript
import { omdIsoscelesTriangle } from '@teachinglab/omd';

const triangle = new omdIsoscelesTriangle();
triangle.loadFromJSON({
    base: 10,
    height: 15,
    color: "#00FFFF"
});
```

#### Using Shapes in Coordinate Plane

```javascript
plane.loadFromJSON({
    xMin: -5,
    xMax: 5,
    yMin: -5,
    yMax: 5,
    shapeSet: [
        { omdType: 'circle', radius: 2, color: '#FF6B6B' },
        { omdType: 'rectangle', width: 3, height: 2, color: '#4ECDC4' },
        { omdType: 'regularPolygon', sides: 6, radius: 1.5, color: '#45B7D1' }
    ]
});
```

---

### Spinner

`omdSpinner` creates circular spinners for probability and division activities.

#### Basic Usage

```javascript
import { omdSpinner } from '@teachinglab/omd';

const spinner = new omdSpinner();
spinner.loadFromJSON({
    divisions: 8,
    arrowPosition: 3,
    size: "medium"
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `divisions` | number | required | Number of spinner divisions |
| `arrowPosition` | number | 0 | Initial arrow position |
| `size` | "small" \| "medium" \| "large" | "medium" | Spinner size |

#### Examples

**Four equal parts:**
```javascript
spinner.loadFromJSON({
    divisions: 4,
    arrowPosition: 0
});
```

**Probability spinner:**
```javascript
spinner.loadFromJSON({
    divisions: 10,
    arrowPosition: 5,
    size: "large"
});
```

---

## Data Display

### Tables

`omdTable` creates data tables with customizable styling.

#### Basic Usage

```javascript
import { omdTable } from '@teachinglab/omd';

const table = new omdTable();
table.loadFromJSON({
    equation: "y = x^2",
    headers: ["x", "y"],
    xMin: -5,
    xMax: 5,
    stepSize: 1,
    title: "Quadratic Function"
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `equation` | string | "" | Equation to generate data |
| `data` | [number, number][] | [] | Manual data input |
| `headers` | string[] | ['x', 'y'] | Column headers |
| `xMin` | number | -5 | Minimum x value |
| `xMax` | number | 5 | Maximum x value |
| `stepSize` | number | 1 | Increment between x values |
| `title` | string | "" | Table title |
| `fontSize` | number | 14 | Cell font size |
| `headerFontSize` | number | 16 | Header font size |
| `fontFamily` | string | "Albert Sans" | Font family |
| `cellHeight` | number | 35 | Cell height in pixels |
| `backgroundColor` | string | lightGray | Background color |
| `alternatingRowColors` | string[] | null | Alternating row colors |

#### Examples

**From equation:**
```javascript
table.loadFromJSON({
    equation: "y = 2x + 1",
    headers: ["x", "y"],
    xMin: -3,
    xMax: 3,
    stepSize: 1,
    title: "Linear Function",
    alternatingRowColors: ["#F0F0F0", "#FFFFFF"]
});
```

**Manual data:**
```javascript
table.loadFromJSON({
    data: [
        [0, 0],
        [1, 1],
        [2, 4],
        [3, 9]
    ],
    headers: ["x", "x²"],
    title: "Squares",
    fontSize: 16,
    cellHeight: 40
});
```

**Styled table:**
```javascript
table.loadFromJSON({
    equation: "y = x^3",
    xMin: -2,
    xMax: 2,
    stepSize: 0.5,
    title: "Cubic Function",
    fontFamily: "Georgia",
    fontSize: 14,
    headerFontSize: 18,
    backgroundColor: "#E3F2FD",
    alternatingRowColors: ["#BBDEFB", "#E3F2FD"]
});
```

---

## Best Practices

### Sizing

Most visualization components support size options:
- `"small"` - Compact display
- `"medium"` - Standard size (default)
- `"large"` - Expanded display

### Colors

OMD uses a consistent color system:
- Use hex colors for consistency: `#FF6B6B`
- Access built-in colors: `omdColor.lightGray`
- Ensure sufficient contrast for accessibility

### Performance

For coordinate planes with many equations:
- Limit the number of simultaneous graphs
- Use domain restrictions when possible
- Consider the viewport size (xMin/xMax, yMin/yMax)

### Responsive Design

Set appropriate container dimensions:
```css
#math-container {
    width: 100%;
    max-width: 800px;
    height: 400px;
}
```

## Next Steps

- **[Equations Guide](./equations.md)** - Learn about equation components
- **[JSON Schemas](../json-schemas.md)** - Complete reference
- **[API Reference](../api/api-reference.md)** - Detailed documentation
- **[Examples](./quick-examples.md)** - More code samples
