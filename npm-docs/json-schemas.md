# JSON Schemas for OMD Components

This document provides complete JSON schemas and examples for all OMD visual components. Use these with the `loadFromJSON()` method.

## Table of Contents

1. [Global Context & Configuration](#global-context--configuration)
2. [Visualizations](#visualizations)
   - [Number & Ratio Visualizations](#number--ratio-visualizations)
   - [Graphing & Geometry](#graphing--geometry)
   - [Data Display](#data-display)
3. [Equations & Expressions](#equations--expressions)
   - [Core Components](#core-components)
   - [Advanced Expressions](#advanced-expressions)

---

## Global Context & Configuration

### Common Expression Format

Many components accept expressions in multiple formats:

**String Format** (simplest):
```javascript
"2x + 3"
```

**Structured Format** (programmatic):
```json
{
  "termsAndOpers": [
    { "omdType": "term", "coefficient": 2, "variable": "x", "exponent": 1 },
    { "omdType": "operator", "operator": "+" },
    { "omdType": "number", "value": 3 }
  ]
}
```

### Primitive Types

#### `omdNumber`
```json
{
  "omdType": "number",
  "value": 42
}
```

#### `omdVariable`
```json
{
  "omdType": "variable",
  "name": "x"
}
```

#### `omdOperator`
```json
{
  "omdType": "operator",
  "operator": "+"
}
```
Supported operators: `+`, `-`, `/`, `÷`, `x`, `*`, `•`, `×`, `=`

#### `omdTerm`
```json
{
  "omdType": "term",
  "coefficient": 3,
  "variable": "x",
  "exponent": 2
}
```

---

## Visualizations

### Number & Ratio Visualizations

#### `omdNumberLine`

Interactive number line with labeled ticks and optional dots.

**Schema:**
```typescript
{
  min: number,
  max: number,
  dotValues?: number[],
  label?: string
}
```

**Example:**
```json
{
  "min": 0,
  "max": 10,
  "dotValues": [2, 5, 8],
  "label": "Number Line Example"
}
```

**Usage:**
```javascript
const numberLine = new omdNumberLine();
numberLine.loadFromJSON({
  min: 0,
  max: 10,
  dotValues: [2, 5, 8],
  label: "Number Line Example"
});
```

---

#### `omdNumberTile`

Visual tile with dots for counting and grouping activities.

**Schema:**
```typescript
{
  value: number,
  size?: "small" | "medium" | "large",
  dotsPerColumn?: number,
  backgroundColor?: string,
  dotColor?: string
}
```

**Example:**
```json
{
  "value": 10,
  "size": "medium",
  "dotsPerColumn": 5,
  "backgroundColor": "#FFFFFF",
  "dotColor": "#000000"
}
```

---

#### `omdTapeDiagram`

Part-whole relationship diagrams with labeled sections.

**Schema:**
```typescript
{
  values: number[],
  showValues?: boolean,
  colors?: string[],
  labelSet?: Array<{
    startIndex: number,
    endIndex: number,
    label: string,
    showBelow?: boolean
  }>,
  unitWidth?: number
}
```

**Example:**
```json
{
  "values": [1, 2, 3],
  "showValues": true,
  "colors": ["#FF0000", "#00FF00", "#0000FF"],
  "labelSet": [
    {
      "startIndex": 0,
      "endIndex": 2,
      "label": "Total: 6",
      "showBelow": true
    }
  ],
  "unitWidth": 30
}
```

---

#### `omdRatioChart`

Pie and bar chart ratio visualizations.

**Schema:**
```typescript
{
  valueA: number,
  valueB: number,
  renderType?: "pie" | "bar",
  size?: "small" | "medium" | "large"
}
```

**Example:**
```json
{
  "valueA": 3,
  "valueB": 2,
  "renderType": "pie",
  "size": "medium"
}
```

---

#### `omdBalanceHanger`

Balance scale visualizations.

**Schema:**
```typescript
{
  leftValues: number[],
  rightValues: number[],
  tilt?: "left" | "right" | "balanced"
}
```

**Example:**
```json
{
  "leftValues": [5, 3],
  "rightValues": [4, 4],
  "tilt": "balanced"
}
```

---

### Graphing & Geometry

#### `omdCoordinatePlane`

2D coordinate plane with axes, gridlines, functions, shapes, and plots.

**Schema:**
```typescript
{
  graphEquations?: Array<{
    equation: string,
    color?: string,
    strokeWidth?: number,
    domain?: { min: number, max: number }
  }>,
  lineSegments?: Array<{
    point1: [number, number],
    point2: [number, number],
    color?: string,
    strokeWidth?: number
  }>,
  dotValues?: Array<[number, number, string?]>,
  shapeSet?: Array<ShapeObject>,
  xMin?: number,
  xMax?: number,
  yMin?: number,
  yMax?: number,
  xLabel?: string,
  yLabel?: string,
  axisLabelOffsetPx?: number,
  size?: "small" | "medium" | "large",
  tickInterval?: number,
  forceAllTickLabels?: boolean,
  tickLabelOffsetPx?: number,
  showTickLabels?: boolean,
  backgroundColor?: string,
  backgroundCornerRadius?: number,
  backgroundOpacity?: number,
  showBackground?: boolean
}
```

**Example:**
```json
{
  "graphEquations": [
    {
      "equation": "y = x^2 - 4",
      "color": "#e11d48",
      "strokeWidth": 2,
      "domain": { "min": -5, "max": 5 }
    }
  ],
  "lineSegments": [
    {
      "point1": [0, 0],
      "point2": [1, 1],
      "color": "red",
      "strokeWidth": 2
    }
  ],
  "dotValues": [[0, 0, "green"], [1, 1, "blue"]],
  "xMin": -5,
  "xMax": 5,
  "yMin": -5,
  "yMax": 5,
  "xLabel": "X-Axis",
  "yLabel": "Y-Axis",
  "tickInterval": 1,
  "showTickLabels": true,
  "backgroundColor": "#FFFFFF",
  "showBackground": true
}
```

---

#### `omdShapes`

Geometric shapes for visualization.

**Circle:**
```json
{
  "omdType": "circle",
  "radius": 10,
  "color": "#FF0000"
}
```

**Rectangle:**
```json
{
  "omdType": "rectangle",
  "width": 20,
  "height": 10,
  "color": "#00FF00"
}
```

**Regular Polygon:**
```json
{
  "omdType": "regularPolygon",
  "sides": 6,
  "radius": 15,
  "color": "#0000FF"
}
```

**Ellipse:**
```json
{
  "omdType": "ellipse",
  "radiusX": 20,
  "radiusY": 10,
  "color": "#FFFF00"
}
```

**Right Triangle:**
```json
{
  "omdType": "rightTriangle",
  "base": 10,
  "height": 15,
  "color": "#FF00FF"
}
```

**Isosceles Triangle:**
```json
{
  "omdType": "isoscelesTriangle",
  "base": 10,
  "height": 15,
  "color": "#00FFFF"
}
```

---

#### `omdSpinner`

Circular spinner for divisions and selections.

**Schema:**
```typescript
{
  divisions: number,
  arrowPosition: number,
  size?: "small" | "medium" | "large"
}
```

**Example:**
```json
{
  "divisions": 8,
  "arrowPosition": 3,
  "size": "medium"
}
```

---

### Data Display

#### `omdTable`

Tabular data display with customizable styling.

**Schema:**
```typescript
{
  equation?: string,
  data?: Array<[number, number]>,
  headers?: string[],
  xMin?: number,
  xMax?: number,
  stepSize?: number,
  title?: string,
  fontSize?: number,
  headerFontSize?: number,
  fontFamily?: string,
  headerFontFamily?: string,
  cellHeight?: number,
  headerHeight?: number,
  minCellWidth?: number,
  maxCellWidth?: number,
  padding?: number,
  backgroundColor?: string,
  backgroundCornerRadius?: number,
  backgroundOpacity?: number,
  showBackground?: boolean,
  alternatingRowColors?: string[]
}
```

**Example:**
```json
{
  "equation": "y = x^2",
  "headers": ["x", "y"],
  "xMin": -5,
  "xMax": 5,
  "stepSize": 1,
  "title": "Quadratic Table",
  "fontSize": 14,
  "headerFontSize": 16,
  "fontFamily": "Albert Sans",
  "cellHeight": 35,
  "backgroundColor": "#FFFFFF",
  "alternatingRowColors": ["#F0F0F0", "#FFFFFF"]
}
```

---

## Equations & Expressions

### Core Components

#### `omdEquation`

Complete mathematical equations. The visual component now uses the same math.js-powered parser and renderer as the interactive core (functions, rationals, roots, etc.).

**Preferred schema (string form):**
```json
{
  "equation": "sin(x) + 2 = 3"
}
```

**Structured fallback (legacy):**
```typescript
{
  leftExpression?: Expression | string,
  rightExpression?: Expression | string,
  equation: string
}
```

**Examples:**
```json
{ "equation": "sin(x) + 2 = 3" }
```
```json
{ "equation": "(x^2 + 3x - 4)/(2x) = 5" }
```

**Usage:**
```javascript
// Preferred string form (math.js parsing)
const eq = new omdEquation();
eq.loadFromJSON({ equation: 'sqrt(x+1) = 4', fontSize: 32 });

// Legacy structured form (if you already have parsed pieces)
eq.loadFromJSON({
  leftExpression: { omdType: 'term', coefficient: 2, variable: 'x' },
  rightExpression: { omdType: 'number', value: 11 }
});
```

---

#### `omdExpression`

Mathematical expressions (terms and operators).

**Schema (String Form):**
```javascript
"3x^2 + 5x - 2"
```

**Schema (Structured Form):**
```typescript
{
  termsAndOpers: Array<Term | Number | Variable | Operator>
}
```

**Example:**
```json
{
  "termsAndOpers": [
    { "omdType": "term", "coefficient": 3, "variable": "x", "exponent": 2 },
    { "omdType": "operator", "operator": "+" },
    { "omdType": "term", "coefficient": 5, "variable": "x", "exponent": 1 },
    { "omdType": "operator", "operator": "-" },
    { "omdType": "number", "value": 2 }
  ]
}
```

---

#### `omdString`

Simple string value for labels or annotations.

**Schema:**
```typescript
{
  name: string
}
```

**Example:**
```json
{
  "name": "Example Label"
}
```

---

### Advanced Expressions

#### `omdPowerExpression`

Expressions raised to a power (exponentiation).

**Schema:**
```typescript
{
  baseExpression: Expression | string,
  exponentExpression: Expression | string
}
```

**Example:**
```json
{
  "baseExpression": {
    "termsAndOpers": [
      { "omdType": "variable", "name": "x" },
      { "omdType": "operator", "operator": "+" },
      { "omdType": "number", "value": 1 }
    ]
  },
  "exponentExpression": {
    "omdType": "number",
    "value": 2
  }
}
```

**Renders as:** `(x + 1)²`

---

#### `omdRationalExpression`

Fractions and rational expressions.

**Schema:**
```typescript
{
  numeratorExpression: Expression | string,
  denominatorExpression: Expression | string
}
```

**Example:**
```json
{
  "numeratorExpression": {
    "termsAndOpers": [
      { "omdType": "variable", "name": "x" },
      { "omdType": "operator", "operator": "+" },
      { "omdType": "number", "value": 1 }
    ]
  },
  "denominatorExpression": {
    "termsAndOpers": [
      { "omdType": "variable", "name": "x" },
      { "omdType": "operator", "operator": "-" },
      { "omdType": "number", "value": 1 }
    ]
  }
}
```

**Renders as:** `(x + 1)/(x - 1)`

---

#### `omdFunction`

Mathematical functions with named inputs.

**Schema:**
```typescript
{
  name: string,
  inputVariables: string[],
  expression: Expression | string
}
```

**Example:**
```json
{
  "name": "f",
  "inputVariables": ["x"],
  "expression": {
    "termsAndOpers": [
      { "omdType": "term", "coefficient": 2, "variable": "x" },
      { "omdType": "operator", "operator": "+" },
      { "omdType": "number", "value": 1 }
    ]
  }
}
```

**Renders as:** `f(x) = 2x + 1`

---

#### `omdTileEquation`

Visual tile-based equations.

**Schema:**
```typescript
{
  left: Array<TileSpec>,
  right: Array<TileSpec>,
  equation?: string,
  tileSize?: number,
  tileGap?: number,
  equalGap?: number,
  tileRadius?: number,
  showLabels?: boolean,
  fontFamily?: string,
  fontSize?: number,
  plusColor?: string,
  equalsColor?: string,
  xPillColor?: string,
  numberTileDefaults?: {
    backgroundColor?: string,
    dotColor?: string
  }
}
```

**Example:**
```json
{
  "left": ["x", "x", 3],
  "right": [11],
  "equation": "2x + 3 = 11",
  "tileSize": 28,
  "tileGap": 6,
  "showLabels": true,
  "fontFamily": "Albert Sans",
  "fontSize": 16
}
```

---

#### `omdProblem`

Problem statement with associated visualization.

**Schema:**
```typescript
{
  problemText: string,
  visualization: any
}
```

**Example:**
```json
{
  "problemText": "Solve for x:",
  "visualization": {
    "omdType": "equation",
    "equation": "2x + 3 = 11"
  }
}
```

---

## Usage Patterns

### Loading from JSON

All components follow the same pattern:

```javascript
const component = new ComponentClass();
component.loadFromJSON(jsonData);
```

### String vs. Structured

Many components accept both:

```javascript
// String form (simple)
equation.loadFromJSON({ equation: '2x + 3 = 11' });

// Structured form (programmatic)
equation.loadFromJSON({
  leftExpression: { termsAndOpers: [...] },
  rightExpression: { termsAndOpers: [...] }
});
```

### Nested Components

Components can be nested:

```javascript
const plane = new omdCoordinatePlane();
plane.loadFromJSON({
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  shapeSet: [
    { omdType: 'circle', radius: 5, color: 'blue' },
    { omdType: 'rectangle', width: 10, height: 5, color: 'red' }
  ]
});
```

---

## Type Definitions

For TypeScript users, the general pattern is:

```typescript
type Expression = string | {
  termsAndOpers: Array<Term | Number | Variable | Operator>
};

type Term = {
  omdType: 'term',
  coefficient: number,
  variable?: string,
  exponent?: number
};

type Number = {
  omdType: 'number',
  value: number
};

type Variable = {
  omdType: 'variable',
  name: string
};

type Operator = {
  omdType: 'operator',
  operator: '+' | '-' | '/' | '÷' | 'x' | '*' | '•' | '×' | '='
};
```

---

## See Also

- **[API Reference](./api/api-reference.md)** - Detailed API documentation
- **[Getting Started](./guides/getting-started.md)** - Installation and basic usage
- **[Visualizations Guide](./guides/visualizations.md)** - Visual component examples
- **[Equations Guide](./guides/equations.md)** - Equation and expression examples
