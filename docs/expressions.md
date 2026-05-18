# Equation & Expression Display Components

These four components render mathematical notation as SVG. Each is instantiated with `new <ClassName>()` and populated via `loadFromJSON(...)`.

```js
import { omdEquation, omdExpression, omdEquationStack, omdEquationWork } from '@teachinglab/omd';
```

---

## Table of Contents

- [omdExpression](#omdexpression)
- [omdEquation](#omdequation)
- [omdEquationStack](#omdequationstack)
- [omdEquationWork](#omdequationwork)
- [Shared Background Methods](#shared-background-methods)

---

## omdExpression

Renders a single math expression (no equals sign).

### loadFromJSON

Accepts a **plain string** or a **JSON object**.

**String shorthand:**
```js
const expr = new omdExpression();
expr.loadFromJSON('3*x + 2');
```

**Object form:**
```js
expr.loadFromJSON({
  expression: '3*x + 2',
  fontSize: 24,
  backgroundColor: '#FFFFFF'
});
```

### Fields (object form)

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `expression` | `string` | Yes | — | The math expression to render. |
| `fontSize` | `number` | No | `20` | Font size in pixels. |
| `backgroundColor` | `string` | No | `#EEEEEE` | Background card color (hex or CSS color). |

---

## omdEquation

Renders a complete equation that includes an equals sign.

### loadFromJSON

Accepts a **plain string** or a **JSON object**.

**String shorthand:**
```js
const eq = new omdEquation();
eq.loadFromJSON('2*x + 3 = 7');
```

**Object form:**
```js
eq.loadFromJSON({
  equation: '2*x + 3 = 7',
  fontSize: 24,
  backgroundColor: '#FFFFFF'
});
```

### Fields (object form)

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `equation` | `string` | Yes | — | The full equation string, must contain `=`. |
| `fontSize` | `number` | No | `20` | Font size in pixels. |
| `backgroundColor` | `string` | No | `#EEEEEE` | Background card color (hex or CSS color). |

---

## omdEquationStack

Stacks multiple equations vertically, optionally aligned on the equals sign.

### loadFromJSON

```js
const stack = new omdEquationStack();
stack.loadFromJSON({
  equations: [
    '2*x + 3 = 7',
    '2*x = 4',
    'x = 2'
  ],
  alignmentMode: 'equals',
  fontSize: 22
});
```

### Fields

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `equations` | `string[]` | Yes | — | Ordered list of equation strings to render. |
| `alignmentMode` | `'equals' \| 'center'` | No | `'equals'` | Aligns rows on the `=` sign or centers each row independently. |
| `fontSize` | `number` | No | `20` | Font size in pixels. |

---

## omdEquationWork

Displays step-by-step equation solving work. Rows are rendered in order and can include equations, operation annotations, plain expressions, text labels, and divider lines.

### loadFromJSON

```js
const work = new omdEquationWork();
work.loadFromJSON({
  rows: [
    { kind: 'equation', left: '2*x + 3', right: '7' },
    { kind: 'operation', left: '+(-3)', right: '+(-3)' },
    { kind: 'line' },
    { kind: 'equation', left: '2*x', right: '4' },
    { kind: 'equation', left: 'x', right: '2' }
  ],
  fontSize: 20,
  rowGap: 8,
  equationColor: '#222222'
});
```

### Row Types

Each row object requires a `kind` field.

#### `equation`

Renders a full equation split into left, optional center, and right columns.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `kind` | `'equation'` | Yes | — | Row type identifier. |
| `left` | `string` | No | — | Expression left of the equals sign. |
| `right` | `string` | No | — | Expression right of the equals sign. |
| `center` | `string` | No | — | Center column content (e.g., the `=` or a connector). |
| `color` | `string` | No | — | Color applied to the entire row. |
| `leftColor` | `string` | No | — | Color applied to the left expression only. |
| `rightColor` | `string` | No | — | Color applied to the right expression only. |
| `drawLineBefore` | `boolean` | No | `false` | Draw a horizontal divider above this row. |
| `drawLineAfter` | `boolean` | No | `false` | Draw a horizontal divider below this row. |

#### `operation`

Renders an annotation row describing the operation applied to both sides (e.g., "+3 on both sides").

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `kind` | `'operation'` | Yes | — | Row type identifier. |
| `left` | `string` | No | — | Annotation for the left side. |
| `right` | `string` | No | — | Annotation for the right side. |
| `center` | `string` | No | — | Center column annotation. |

#### `expression`

Renders a standalone expression spanning all columns.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `kind` | `'expression'` | Yes | — | Row type identifier. |
| `text` | `string` | Yes | — | The expression string to render. |

#### `text`

Renders a plain text label spanning all columns.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `kind` | `'text'` | Yes | — | Row type identifier. |
| `text` | `string` | Yes | — | The text to display. |

#### `line`

Renders a horizontal divider line.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `kind` | `'line'` | Yes | — | Row type identifier. No other fields. |

### Style Options

These top-level fields in the `loadFromJSON` object control the overall layout and appearance.

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `fontSize` | `number` | No | `20` | Font size in pixels for all rows. |
| `fontFamily` | `string` | No | — | CSS font family string. |
| `fontWeight` | `string \| number` | No | — | CSS font weight. |
| `rowGap` | `number` | No | — | Vertical spacing between rows in pixels. |
| `columnGap` | `number` | No | — | Horizontal spacing between columns in pixels. |
| `paddingX` | `number` | No | — | Horizontal padding around the component. |
| `paddingY` | `number` | No | — | Vertical padding around the component. |
| `rowHeightMultiplier` | `number` | No | — | Scales row height relative to font size. |
| `lineColor` | `string` | No | — | Color of divider lines. |
| `lineStrokeWidth` | `number` | No | — | Stroke width of divider lines. |
| `equationColor` | `string` | No | — | Default color for `equation` rows. |
| `operationColor` | `string` | No | — | Default color for `operation` rows. |
| `textColor` | `string` | No | — | Default color for `text` rows. |
| `drawLineBeforeRows` | `number[]` | No | — | Array of row indexes that should have a divider drawn above them. |
| `drawLineAfterRows` | `number[]` | No | — | Array of row indexes that should have a divider drawn below them. |

---

## Shared Background Methods

All four components expose the same three background helper methods.

### `setBackgroundColor(color)`

Sets the background card color.

```js
eq.setBackgroundColor('#FFFFFF');
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `color` | `string` | Any valid CSS color or hex string. Default is `#EEEEEE`. |

### `hideBackgroundByDefault()`

Makes the background transparent so the component renders without a card.

```js
eq.hideBackgroundByDefault();
```

### `hideChildBackgrounds()`

Hides the individual term-level backgrounds so all terms share one unified card. This is called automatically on load and does not normally need to be called manually.

```js
eq.hideChildBackgrounds();
```
