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
  "values": ["array"],
  "showValues": "boolean",
  "colors": ["array"],
  "labelSet": ["array"],
  "unitWidth": "number"
}
```

### Example
```json
{
  "values": [1, 2, 3],
  "showValues": true,
  "colors": ["#FF0000", "#00FF00", "#0000FF"],
  "labelSet": [
    { "startIndex": 0, "endIndex": 2, "label": "Example Label", "showBelow": true }
  ],
  "unitWidth": 30
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
  "alternatingRowColors": ["array"]
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
  "alternatingRowColors": ["#F0F0F0", "#FFFFFF"]
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

`omdShapes` represents geometric shapes such as circles, rectangles, and polygons.

### Schema
```json
{
  "type": "string",
  "dimensions": "object",
  "color": "string"
}
```

### Example
```json
{
  "type": "circle",
  "dimensions": { "radius": 10 },
  "color": "#FF0000"
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
  "valueA": "number",
  "valueB": "number",
  "renderType": "string",
  "size": "string"
}
```

### Example
```json
{
  "valueA": 3,
  "valueB": 2,
  "renderType": "pie",
  "size": "large"
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

`omdNumberLine` represents a number line with labeled ticks and optional dots.

### Schema
```json
{
  "min": "number",
  "max": "number",
  "dotValues": ["array"],
  "label": "string"
}
```

### Example
```json
{
  "min": 0,
  "max": 10,
  "dotValues": [1, 5, 7],
  "label": "Number Line"
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
  "graphEquations": ["array"],
  "lineSegments": ["array"],
  "dotValues": ["array"],
  "shapeSet": ["array"],
  "xMin": "number",
  "xMax": "number",
  "yMin": "number",
  "yMax": "number",
  "xLabel": "string",
  "yLabel": "string",
  "axisLabelOffsetPx": "number",
  "size": "string",
  "tickInterval": "number",
  "forceAllTickLabels": "boolean",
  "tickLabelOffsetPx": "number",
  "showTickLabels": "boolean",
  "backgroundColor": "string",
  "backgroundCornerRadius": "number",
  "backgroundOpacity": "number",
  "showBackground": "boolean"
}
```

### Example
```json
{
  "graphEquations": [
    { "equation": "y = x^2", "color": "blue", "strokeWidth": 2, "domain": { "min": -5, "max": 5 } }
  ],
  "lineSegments": [
    { "point1": [0, 0], "point2": [1, 1], "color": "red", "strokeWidth": 2 }
  ],
  "dotValues": [[0, 0, "green"], [1, 1, "blue"]],
  "shapeSet": [
    { "omdType": "circle", "radius": 5, "color": "yellow" }
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

`omdEquation` represents a mathematical equation, such as "x + 2 = 5".

### Schema
```json
{
  "leftExpression": "object",
  "rightExpression": "object",
  "equation": "string"
}
```

### Example
```json
{
  "leftExpression": { "omdType": "term", "coefficient": 1, "variable": "x", "exponent": 1 },
  "rightExpression": { "omdType": "number", "value": 5 },
  "equation": "x + 2 = 5"
}
```