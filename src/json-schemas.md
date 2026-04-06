# Unified Schemas and Examples for `loadFromJSON`

This document provides schemas and examples for the `loadFromJSON` method used in various visual components. Each section includes a brief explanation of the component, its schema, and an example JSON object.

## 1. `omdVariable`

`omdVariable` represents a single variable, such as "x" or "y", used in mathematical expressions.

### Schema
```json
{
  "name": "string"
}
```

### Example
```json
{
  "name": "VariableName"
}
```

---

## 2. `omdTileEquation`

`omdTileEquation` is used to represent equations visually with tiles, such as "x + y = z".

### Schema
```json
{
  "left": ["array"],
  "right": ["array"],
  "equation": "string | object",
  "tileSize": "number",
  "tileGap": "number",
  "equalGap": "number",
  "tileRadius": "number",
  "showLabels": "boolean",
  "fontFamily": "string",
  "fontSize": "number",
  "plusColor": "string",
  "equalsColor": "string",
  "xPillColor": "string",
  "numberTileDefaults": {
    "backgroundColor": "string",
    "dotColor": "string"
  }
}
```

### Example
```json
{
  "left": ["x", "y"],
  "right": ["z"],
  "equation": "x + y = z",
  "tileSize": 28,
  "tileGap": 6,
  "equalGap": 24,
  "tileRadius": 6,
  "showLabels": true,
  "fontFamily": "Albert Sans",
  "fontSize": 16,
  "plusColor": "#79BBFD",
  "equalsColor": "#FF6B6B",
  "xPillColor": "#CCCCCC",
  "numberTileDefaults": {
    "backgroundColor": "#FFFFFF",
    "dotColor": "#000000"
  }
}
```

---

## 3. `omdTerm`

`omdTerm` represents a single term in a mathematical expression, such as "2x" or "3y^2".

### Schema
```json
{
  "coefficient": "number",
  "variable": "string",
  "exponent": "number"
}
```

### Example
```json
{
  "coefficient": 2,
  "variable": "x",
  "exponent": 3
}
```

---

## 4. `omdTapeDiagram`

`omdTapeDiagram` is used to represent proportional relationships or part-whole relationships visually.

### Schema
```json
{
  "title": "string (optional)",
  "values": ["array (required) - can be strings or objects with {value, showLabel, color}"],
  "labelSet": ["array (optional) - objects with {startIndex, endIndex, label, showBelow}"],
  "totalWidth": "number (optional, default: 300)"
}
```

### Example with Simple Values
```json
{
  "title": "Distance",
  "totalWidth": 300,
  "values": ["2x", "3", "x"],
  "labelSet": [
    { "startIndex": 0, "endIndex": 3, "label": "Total: 3x + 3", "showBelow": true },
    { "startIndex": 0, "endIndex": 1, "label": "2x", "showBelow": false }
  ]
}
```

### Example with Value Objects
```json
{
  "title": "Pencils",
  "totalWidth": 320,
  "values": [
    { "value": "5", "showLabel": true, "color": "#93c5fd" },
    { "value": "5", "showLabel": true, "color": "#93c5fd" },
    { "value": "5", "showLabel": false, "color": "#fca5a5" }
  ],
  "labelSet": [
    { "startIndex": 0, "endIndex": 3, "label": "15 total", "showBelow": true }
  ]
}
```

---

## 4b. `omdDoubleTapeDiagram`

`omdDoubleTapeDiagram` represents two tape diagrams aligned by their start points.

### Schema
```json
{
  "topTapeDiagram": "object (omdTapeDiagram)",
  "bottomTapeDiagram": "object (omdTapeDiagram)",
  "spacing": "number (optional, default: 10)"
}
```

### Example
```json
{
  "topTapeDiagram": {
    "title": "Pencils",
    "totalWidth": 320,
    "values": [
      { "value": "5", "color": "#93c5fd" },
      { "value": "5", "color": "#93c5fd" },
      { "value": "5", "color": "#93c5fd" }
    ],
    "labelSet": [
      { "startIndex": 0, "endIndex": 3, "label": "15 total", "showBelow": true }
    ]
  },
  "bottomTapeDiagram": {
    "title": "Cost",
    "totalWidth": 320,
    "values": [
      { "value": "$2", "color": "#fca5a5" },
      { "value": "$2", "color": "#fca5a5" },
      { "value": "$2", "color": "#fca5a5" }
    ],
    "labelSet": [
      { "startIndex": 0, "endIndex": 3, "label": "$6 total", "showBelow": true }
    ]
  },
  "spacing": 80
}
```

---

## 5. `omdTable`

`omdTable` is used to display tabular data, often generated from equations or datasets.

### Schema
```json
{
  "equation": "string",
  "data": ["array"],
  "headers": ["array"],
  "xMin": "number",
  "xMax": "number",
  "stepSize": "number",
  "title": "string",
  "fontSize": "number",
  "headerFontSize": "number",
  "fontFamily": "string",
  "headerFontFamily": "string",
  "cellHeight": "number",
  "headerHeight": "number",
  "minCellWidth": "number",
  "maxCellWidth": "number",
  "padding": "number",
  "backgroundColor": "string",
  "backgroundCornerRadius": "number",
  "backgroundOpacity": "number",
  "showBackground": "boolean",
  "alternatingRowColors": ["array - e.g. ['#EEEEEE', '#FFFFFF']; index 0 used for header row"],
  "headerBackgroundColor": "string (used when alternatingRowColors is not set)",
  "cellBackgroundColor": "string (used when alternatingRowColors is not set)",
  "evenRowColor": "string (legacy)",
  "oddRowColor": "string (legacy)",
  "alternatingRowOpacity": "number (legacy)"
}
```

### Example
```json
{
  "equation": "y = x^2",
  "data": [[-1, 1], [0, 0], [1, 1]],
  "headers": ["x", "y"],
  "xMin": -5,
  "xMax": 5,
  "stepSize": 1,
  "title": "Quadratic Table",
  "fontSize": 14,
  "headerFontSize": 16,
  "fontFamily": "Albert Sans",
  "headerFontFamily": "Albert Sans",
  "cellHeight": 35,
  "headerHeight": 40,
  "minCellWidth": 80,
  "maxCellWidth": 300,
  "padding": 10,
  "backgroundColor": "#FFFFFF",
  "backgroundCornerRadius": 15,
  "backgroundOpacity": 1.0,
  "showBackground": true,
  "alternatingRowColors": ["#EEEEEE", "#FFFFFF"]
}
```

---

## 6. `omdString`

`omdString` represents a simple string value, often used as labels or annotations.

### Schema
```json
{
  "name": "string"
}
```

### Example
```json
{
  "name": "Example String"
}
```

---

## 7. `omdSpinner`

`omdSpinner` is a circular spinner used to represent divisions or selections visually.

### Schema
```json
{
  "divisions": "number",
  "arrowPosition": "number",
  "size": "string"
}
```

### Example
```json
{
  "divisions": 8,
  "arrowPosition": 3,
  "size": "medium"
}
```

---

## 8. `omdShapes`

`omdShapes` is a module containing several individual geometric shape classes. Each is used by `omdCoordinatePlane`'s `shapeSet` array (via the `omdType` field) and can also be instantiated independently.

---

### 8a. `omdRightTriangle`

#### Schema
```json
{
  "horizontalLeg": "number (default: 5)",
  "verticalLeg": "number (default: 10)",
  "angleA": "number (optional) - angle in degrees; used with hypotenuse to compute legs",
  "hypotenuse": "number (optional)",
  "unitScale": "number (default: 10) - pixels per unit",
  "showLabels": "boolean (default: false)"
}
```

#### Example
```json
{
  "omdType": "rightTriangle",
  "horizontalLeg": 3,
  "verticalLeg": 4,
  "unitScale": 20,
  "showLabels": true
}
```

---

### 8b. `omdIsoscelesTriangle`

#### Schema
```json
{
  "base": "number (default: 5)",
  "height": "number (default: 10)",
  "unitScale": "number (default: 10)",
  "showLabels": "boolean (default: false)"
}
```

#### Example
```json
{
  "omdType": "isoscelesTriangle",
  "base": 6,
  "height": 8,
  "unitScale": 15
}
```

---

### 8c. `omdRectangle`

#### Schema
```json
{
  "width": "number (default: 10)",
  "height": "number (default: 10)",
  "unitScale": "number (default: 10)",
  "showLabels": "boolean (default: false)"
}
```

#### Example
```json
{
  "omdType": "rectangle",
  "width": 5,
  "height": 3,
  "unitScale": 20,
  "showLabels": true
}
```

---

### 8d. `omdEllipse`

#### Schema
```json
{
  "width": "number (default: 10)",
  "height": "number (default: 5)",
  "unitScale": "number (default: 10)"
}
```

#### Example
```json
{
  "omdType": "ellipse",
  "width": 8,
  "height": 4,
  "unitScale": 12
}
```

---

### 8e. `omdCircle`

#### Schema
```json
{
  "radius": "number (default: 5)",
  "unitScale": "number (default: 10)"
}
```

#### Example
```json
{
  "omdType": "circle",
  "radius": 4,
  "unitScale": 15
}
```

---

### 8f. `omdRegularPolygon`

#### Schema
```json
{
  "radius": "number (default: 5)",
  "numberOfSides": "number (default: 5)",
  "unitScale": "number (default: 10)",
  "showLabels": "boolean (default: false)"
}
```

#### Example
```json
{
  "omdType": "regularPolygon",
  "radius": 5,
  "numberOfSides": 6,
  "unitScale": 18
}
```

---

## 9. `omdRationalExpression`

`omdRationalExpression` represents a fraction or rational expression, such as "(x+1)/(x-1)".

### Schema
```json
{
  "numeratorExpression": "object",
  "denominatorExpression": "object"
}
```

### Example
```json
{
  "numeratorExpression": { "omdType": "number", "value": 3 },
  "denominatorExpression": { "omdType": "variable", "name": "x" }
}
```

---

## 10. `omdRatioChart`

`omdRatioChart` is used to represent ratios visually, such as pie charts or bar charts.

### Schema
```json
{
  "valueA": "number - filled/first portion (alias: numerator)",
  "valueB": "number - unfilled/second portion",
  "numerator": "number (optional alias for valueA)",
  "denominator": "number (optional) - when provided with numerator, sets valueA=numerator and valueB=denominator-numerator",
  "renderType": "string - 'pie' | 'dots' | 'dot' | 'tile' | 'bar' (default: 'pie')",
  "size": "string - 'small' | 'medium' | 'large' (default: 'large')"
}
```

### Example (basic)
```json
{
  "valueA": 3,
  "valueB": 2,
  "renderType": "pie",
  "size": "large"
}
```

### Example (fraction form)
```json
{
  "numerator": 2,
  "denominator": 5,
  "renderType": "dots",
  "size": "medium"
}
```

---

## 11. `omdProblem`

`omdProblem` represents a problem statement, often with an associated visualization.

### Schema
```json
{
  "problemText": "string",
  "visualization": "object"
}
```

### Example
```json
{
  "problemText": "Solve for x",
  "visualization": { "type": "omdEquation", "data": { "left": "x+2", "right": "5" } }
}
```

---

## 12. `omdPowerExpression`

`omdPowerExpression` represents an expression raised to a power, such as "(x+1)^2".

### Schema
```json
{
  "baseExpression": "object",
  "exponentExpression": "object"
}
```

### Example
```json
{
  "baseExpression": { "omdType": "variable", "name": "x" },
  "exponentExpression": { "omdType": "number", "value": 2 }
}
```

---

## 13. `omdOperator`

`omdOperator` represents a mathematical operator, such as "+", "-", "*", or "/".

### Schema
```json
{
  "operator": "string"
}
```

### Example
```json
{
  "operator": "+"
}
```

---

## 14. `omdNumberTile`

`omdNumberTile` represents a visual tile with dots, often used in counting or grouping activities.

### Schema
```json
{
  "value": "number",
  "size": "string",
  "dotsPerColumn": "number",
  "backgroundColor": "string",
  "dotColor": "string"
}
```

### Example
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

## 15. `omdNumberLine`

`omdNumberLine` represents a number line with labeled ticks, optional title, custom increments, units, arrows, and special numbers.

### Schema
```json
{
  "title": "string (optional)",
  "label": "string (optional) - secondary label text",
  "min": "number (required)",
  "max": "number (required)",
  "increment": "number (optional, default: 1)",
  "showLeftArrow": "boolean (optional, default: false)",
  "showRightArrow": "boolean (optional, default: false)",
  "units": "string (optional)",
  "hideDefaultNumbers": "boolean (optional, default: false)",
  "specialNumbers": ["array (optional)"],
  "totalWidth": "number (optional, default: 320)",
  "dotValues": ["array (optional)"]
}
```

### Example
```json
{
  "title": "Distance",
  "min": 0,
  "max": 10,
  "increment": 1,
  "units": " cm",
  "dotValues": [1, 5, 7]
}
```

### Example with Special Numbers
```json
{
  "title": "Height",
  "min": 0,
  "max": 100,
  "increment": 10,
  "specialNumbers": [25, 75],
  "units": " m",
  "showRightArrow": true,
  "hideDefaultNumbers": false,
  "totalWidth": 400
}
```

---

## 15b. `omdDoubleNumberLine`

`omdDoubleNumberLine` represents two number lines aligned by their start points, useful for showing proportional relationships.

### Schema
```json
{
  "topNumberLine": "object (omdNumberLine)",
  "bottomNumberLine": "object (omdNumberLine)",
  "spacing": "number (optional, default: 10)"
}
```

### Example
```json
{
  "topNumberLine": {
    "title": "Hours",
    "min": 0,
    "max": 10,
    "showRightArrow": true,
    "increment": 1
  },
  "bottomNumberLine": {
    "showRightArrow": true,
    "title": "Miles",
    "min": 0,
    "max": 50,
    "increment": 10
  },
  "spacing": 15
}
```

---

## 16. `omdNumber`

`omdNumber` represents a single numeric value, such as "42".

### Schema
```json
{
  "value": "number"
}
```

### Example
```json
{
  "value": 42
}
```

---

## 17. `omdFunction`

`omdFunction` represents a mathematical function, such as "f(x) = 2x + 1".

### Schema
```json
{
  "name": "string",
  "inputVariables": ["array"],
  "expression": "object"
}
```

### Example
```json
{
  "name": "f",
  "inputVariables": ["x"],
  "expression": { "omdType": "term", "coefficient": 2, "variable": "x", "exponent": 1 }
}
```

---

## 18. `omdExpression`

`omdExpression` represents a mathematical expression, such as "3x^2 + 5".

### Schema
```json
{
  "termsAndOpers": ["array"]
}
```

### Example
```json
{
  "termsAndOpers": [
    { "omdType": "term", "coefficient": 3, "variable": "x", "exponent": 2 },
    { "omdType": "operator", "operator": "+" },
    { "omdType": "number", "value": 5 }
  ]
}
```

---

## 19. `omdCoordinatePlane`

`omdCoordinatePlane` represents a 2D coordinate plane with axes, gridlines, and optional shapes or plots.

### Schema
```json
{
  "graphEquations": [
    "array of objects: { equation, color, strokeWidth, domain: { min, max }, label, labelAtX, labelPosition: 'above'|'below'|'left'|'right' }"
  ],
  "lineSegments": [
    "array of objects: { point1: [x, y], point2: [x, y], color, strokeWidth }"
  ],
  "dotValues": ["array of [x, y] or [x, y, color] tuples"],
  "shapeSet": ["array of shape objects with omdType (see omdShapes)"],
  "xMin": "number",
  "xMax": "number",
  "yMin": "number",
  "yMax": "number",
  "xLabel": "string",
  "yLabel": "string",
  "axisLabelOffsetPx": "number",
  "size": "string - 'small' | 'medium' | 'large'",
  "tickInterval": "number",
  "forceAllTickLabels": "boolean",
  "tickLabelOffsetPx": "number",
  "showTickLabels": "boolean",
  "backgroundColor": "string",
  "backgroundCornerRadius": "number",
  "backgroundOpacity": "number",
  "showBackground": "boolean",
  "interactive": "boolean (optional) - when true, render sliders below the graph",
  "variables": [
    "array of strings or objects: { name, label, value, min, max, step, color, graphIndex }"
  ]
}
```

### Example
```json
{
  "interactive": true,
  "variables": [
    { "name": "a", "label": "a", "value": 2, "min": -5, "max": 5, "step": 0.1 },
    { "name": "b", "label": "b", "value": 1, "min": -5, "max": 5, "step": 0.1 }
  ],
  "graphEquations": [
    {
      "equation": "y = a*x + b",
      "color": "#0f766e",
      "strokeWidth": 2,
      "domain": { "min": -5, "max": 5 },
      "label": "y = a*x + b",
      "labelAtX": 2,
      "labelPosition": "above"
    }
  ],
  "lineSegments": [
    { "point1": [0, 0], "point2": [1, 1], "color": "red", "strokeWidth": 2 }
  ],
  "dotValues": [[0, 0, "green"], [1, 1, "blue"]],
  "shapeSet": [
    { "omdType": "circle", "radius": 1, "unitScale": 15 }
  ],
  "xMin": -5,
  "xMax": 5,
  "yMin": -5,
  "yMax": 5,
  "xLabel": "X-Axis",
  "yLabel": "Y-Axis",
  "axisLabelOffsetPx": 20,
  "size": "medium",
  "tickInterval": 1,
  "forceAllTickLabels": true,
  "tickLabelOffsetPx": 5,
  "showTickLabels": true,
  "backgroundColor": "#FFFFFF",
  "backgroundCornerRadius": 15,
  "backgroundOpacity": 1.0,
  "showBackground": true
}
```

---

## 20. `omdEquation`

`omdEquation` represents a mathematical equation and now uses the same math.js-powered parser/renderer as the interactive core (functions, rationals, roots, etc.).

### Preferred schema (string form)
```json
{
  "equation": "sin(x) + 2 = 3",
  "fontSize": "number (optional) - font size for the rendered equation"
}
```

### Structured fallback (legacy)
```json
{
  "leftExpression": "object",
  "rightExpression": "object",
  "equation": "string"
}
```

### Examples
```json
{ "equation": "sin(x) + 2 = 3" }
```
```json
{ "equation": "(x^2 + 3x - 4)/(2x) = 5", "fontSize": 20 }
```

---

## 21. `omdBalanceHanger`

`omdBalanceHanger` is a visual balance/scale with values stacked on each arm. Variable values (strings) render as ellipse pills; numeric values render as rounded rectangles. The `tilt` property visually tips the beam left or right.

### Schema
```json
{
  "leftValues": ["array - strings or numbers to stack on the left arm (default: [])"],
  "rightValues": ["array - strings or numbers to stack on the right arm (default: [])"],
  "tilt": "string - 'none' | 'left' | 'right' (default: 'none')",
  "fontFamily": "string (default: 'Albert Sans')",
  "fontSize": "number (default: 18)",
  "backgroundColor": "string (default: lightGray)",
  "backgroundCornerRadius": "number (default: 5)",
  "backgroundOpacity": "number (default: 1.0)",
  "showBackground": "boolean (default: true)"
}
```

### Example
```json
{
  "leftValues": ["x", "x", "3"],
  "rightValues": ["9"],
  "tilt": "none",
  "fontFamily": "Albert Sans",
  "fontSize": 18
}
```

### Example (tilted)
```json
{
  "leftValues": [5, 3],
  "rightValues": [4],
  "tilt": "left",
  "backgroundColor": "#E0F0FF",
  "backgroundCornerRadius": 8
}
```
