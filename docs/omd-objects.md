# OMD Objects Reference (Verified)


This file documents the high-level JSON shapes accepted by the OMD classes and the low-level `Class().loadFromJSON(data)` APIs for each OMD visual. All shapes were verified against the code in `src/`.

Usage
- Instantiate the appropriate OMD class and call `loadFromJSON(...)` with the JSON object below.
- Many classes also accept a plain string where documented (e.g., expression/equation strings).

Notes
- Some components accept multiple, backward-compatible shapes (string, legacy fields, or structured objects). Where a field can be a string or structured object the docs indicate both.
- Field names shown are exactly as used by the source files.

----------------------------------------------------------------
COMMON: Expression / Terms / Number / Variable / Operator
----------------------------------------------------------------
Expression objects appear in several places; there are two common forms used across the codebase:

1) Compact expression string
- Example: `"2x + 5"`
- Many components accept a simple string which will be parsed (e.g., `omdExpression.loadFromJSON("2x+5")`).

2) Structured expression (preferred for programmatic usage)
- `expression` / `termsAndOpers` object form used by `omdExpression` and others:

{
  // either a high-level expression object (terms) or the parsed low-level form
  // Low-level parser output used in the codebase is `termsAndOpers`
  "termsAndOpers": [
    { "omdType": "term", "coefficient": number, "variable"?: string, "exponent"?: number },
    { "omdType": "number", "value": number },
    { "omdType": "variable", "name": string },
    { "omdType": "operator", "operator": "+"|"-"|"/"|"÷"|"x"|"*"|"•"|"×"|"=" }
  ]
}

Legacy/alternate simple structured form used in some places (terms array):
{
  "terms": [ { "coefficient"?: number, "variable"?: string, "value"?: number } ]
}

Primitive pieces
- number: `{ omdType: "number", value: number }` (low-level `omdNumber.loadFromJSON({ value })` accepts `{ value }`)
- variable: `{ omdType: "variable", name: string }` (low-level `omdVariable.loadFromJSON({ name })`)
- operator: `{ omdType: "operator", operator: "+"|"-"|"/"|"÷"|"x"|"*"|"•"|"×"|"=" }` (low-level `omdOperator.loadFromJSON({ operator })`)
- term: `{ omdType: "term", coefficient: number, variable?: string, exponent?: number }` (low-level `omdTerm.loadFromJSON` accepts `{ coefficient, variable?, exponent? }`)

Examples
- Number: `{ "omdType": "number", "value": 42 }`
- Term: `{ "omdType": "term", "coefficient": 3, "variable": "x", "exponent": 2 }`
- Expression string: `"2x + 3"`
- Expression structured: `{ "termsAndOpers": [ { "omdType": "term", "coefficient": 2, "variable": "x" }, { "omdType": "operator", "operator": "+" }, { "omdType": "number", "value": 3 } ] }`

----------------------------------------------------------------
SPECIFIC OBJECTS (by `omdType` / class)
----------------------------------------------------------------
-- omd (root container)
- The `omd` container class exists as a convenience to hold child visuals. To configure visuals, instantiate the specific class and call `loadFromJSON` on it.

- equation / `omdEquation`
  High-level:
  { "omdType": "equation", "equation": string }
  - `equation` string parsed if provided (preferred for simple cases).

  Legacy / structured:
  { "omdType": "equation", "leftExpression": ExpressionObject, "rightExpression": ExpressionObject }
  - Either side may be an `expression` string/structured object or a primitive `{ omdType: 'number'|... }`.
  - `omdEquation.loadFromJSON` also accepts an `equation` string and will attempt to parse it into left/right.

- expression / `omdExpression`
  - Accepts either a string (e.g., `"2x+5"`) or a structured object with `termsAndOpers` as shown above.
  - Example: `{ "omdType": "expression", "termsAndOpers": [...] }` or simply `"2x + 5"`.

- number / `omdNumber`
  - High-level: `{ "omdType": "number", "value": number }`
  - Low-level: `loadFromJSON({ value: number })`

- variable / `omdVariable`
  - `{ "omdType": "variable", "name": string }`
  - `loadFromJSON({ name: string })`

- operator / `omdOperator`
  - `{ "omdType": "operator", "operator": "+"|"-"|"/"|"÷"|"x"|"*"|"•"|"×"|"=" }`
  - `loadFromJSON({ operator: "..." })` — note several symbols are normalized in code (e.g., `'*'` => `×`, `'-'` mapped to Unicode minus for display).

- term / `omdTerm`
  - High-level: `{ "omdType": "term", "coefficient": number, "variable"?: string, "exponent"?: number }
  - `loadFromJSON` accepts `{ coefficient, variable?, exponent? }`.

- powerExpression / `omdPowerExpression`
  - Structured:
    {
      "omdType": "powerExpression",
      "baseExpression": ExpressionObject,     // object with omdType 'expression'|'number'|'variable'|'term' (or a string for expression)
      "exponentExpression": ExpressionObject  // same shape
    }
  - Note: `loadFromJSON` expects `baseExpression` and `exponentExpression` named fields (the code uses these names).

- rationalExpression / `omdRationalExpression`
  - Structured:
    {
      "omdType": "rationalExpression",
      "numeratorExpression": ExpressionObject,
      "denominatorExpression": ExpressionObject
    }
  - Note: `loadFromJSON` expects `numeratorExpression` / `denominatorExpression` fields.

- function / `omdFunction`
  - Structured:
    {
      "omdType": "function",
      "name": string,
      "inputVariables": [ string, ... ],
      "expression": ExpressionObject
    }
  - Note: `inputVariables` is an array of variable names (strings).

- numberLine / `omdNumberLine`
  - Structured:
    {
      "omdType": "numberLine",
      "min": number,
      "max": number,
      "dotValues": [ number, ... ],
      "label"?: string
    }
  - Note: `dotValues` is an array of positions for dots on the line.

- balanceHanger / `omdBalanceHanger`
  - Structured:
    {
      "omdType": "balanceHanger",
      "leftValues": [ number, ... ],
      "rightValues": [ number, ... ],
      "tilt"?: "left"|"right"
    }
  - Note: `leftValues`/`rightValues` are arrays of value numbers.

- tapeDiagram / `omdTapeDiagram` and `omdTapeLabel`
  - Structured:
    {
      "omdType": "tapeDiagram",
      "values": [ number, ... ],
      "unitWidth": number,
      "labelSet": [ { "omdType": "omdTapeLabel", "startIndex": number, "endIndex": number, "label": string, "showBelow"?: boolean } ]
    }
  - Note: `values` is an array of tape segment values.

- tileEquation / `omdTileEquation`
  - Structured:
    {
      "omdType": "tileEquation",
      "left": [ /* tileSpec */ ],
      "right": [ /* tileSpec */ ]
    }
  - Note: `left`/`right` are arrays of tile specifications.

- numberTile / `omdNumberTile`
  - Structured:
    {
      "omdType": "numberTile",
      "value": number,
      "size"?: "small"|"medium"|"large",
      "dotsPerColumn"?: number
    }
  - Note: `size` and `dotsPerColumn` are optional.

- ratioChart / `omdRatioChart`
  - Structured:
    {
      "omdType": "ratioChart",
      "numerator": number,
      "denominator": number,
      "renderType"?: "pie"|"bar"
    }
  - Note: `renderType` specifies how to render the ratio.

- coordinatePlane / `omdCoordinatePlane`
  - Structured:
    {
      "omdType": "coordinatePlane",
      "xMin": number, "xMax": number,
      "yMin": number, "yMax": number,
      "graphEquations": [ { "equation": string, "color"?: string, "strokeWidth"?: number } ]
    }
  - Note: `graphEquations` is an array of equations to graph.

shapes (in `omdShapes.js`)
- rectangle, circle, ellipse, regularPolygon, rightTriangle, isoscelesTriangle — load shapes via their respective classes and `loadFromJSON` with the fields shown above.

spinner / `omdSpinner`
- Structured:
  {
    "omdType": "spinner",
    "divisions": number,
    "arrowPosition": number
  }
- Note: `divisions` is the number of divisions on the spinner, `arrowPosition` is the initial position of the arrow.

table / `omdTable`
- See `omdTable` for fields like `headers`, `data`, `fontSize`, `cellHeight`, `backgroundColor`.

problem / `omdProblem`
- Structured:
  {
    "omdType": "problem",
    "problemText": string,
    "visualization": { /* forwarded object */ }
  }
  - Note: `visualization` forwards to the specific visualization object.

----------------------------------------------------------------
Examples (call `loadFromJSON` on instances)
----------------------------------------------------------------

1) Equation (string form)

```js
const eq = new omdEquation();
eq.loadFromJSON({ omdType: 'equation', equation: '2x + 3 = 11' });
```

2) Coordinate plane with a function

```js
const plane = new omdCoordinatePlane();
plane.loadFromJSON({
  omdType: 'coordinatePlane',
  xMin: -10, xMax: 10,
  yMin: -10, yMax: 10,
  graphEquations: [{ equation: 'y = x^2 - 4', color: '#e11d48', strokeWidth: 2 }]
});
```

3) Tape diagram (values)

```js
const tape = new omdTapeDiagram();
tape.loadFromJSON({ omdType: 'tapeDiagram', values: [1,2,3], unitWidth: 30, labelSet: [{ omdType: 'omdTapeLabel', startIndex: 0, endIndex: 3, label: '6', showBelow: true }] });
```

4) Number tile

```js
const tile = new omdNumberTile();
tile.loadFromJSON({ omdType: 'numberTile', value: 8, size: 'medium', dotsPerColumn: 10 });
```

----------------------------------------------------------------
Appendix / Implementation notes
- Parsers in `src/omdUtils.js` accept and normalize expression/equation strings into `termsAndOpers` arrays used by `omdExpression`.
- The codebase supports some legacy field names for backward compatibility; prefer the modern names documented here.

If you want, I can:
- Generate a one-line `loadFromJSON` example for every class in `src/` and insert them into this doc.
- Or run a script that extracts `loadFromJSON` parameter names from the source files to produce machine-readable JSON schema files.
Which would you like next?

