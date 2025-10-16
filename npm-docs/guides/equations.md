# Equations & Expressions Guide

This guide covers all equation and expression components in OMD, from basic numbers and variables to complex step-by-step solutions.

## Table of Contents

1. [Core Components](#core-components)
2. [Advanced Expressions](#advanced-expressions)
3. [Step-by-Step Solutions](#step-by-step-solutions)
4. [Expression Parsing](#expression-parsing)

---

## Core Components

### Numbers

`omdNumber` represents numeric constants.

#### Basic Usage

```javascript
import { omdNumber } from '@teachinglab/omd';

const num = new omdNumber();
num.loadFromJSON({ value: 42 });
```

#### JSON Format

```json
{
  "omdType": "number",
  "value": 42
}
```

---

### Variables

`omdVariable` represents algebraic variables.

#### Basic Usage

```javascript
import { omdVariable } from '@teachinglab/omd';

const variable = new omdVariable();
variable.loadFromJSON({ name: "x" });
```

#### JSON Format

```json
{
  "omdType": "variable",
  "name": "x"
}
```

---

### Operators

`omdOperator` represents mathematical operators.

#### Basic Usage

```javascript
import { omdOperator } from '@teachinglab/omd';

const operator = new omdOperator();
operator.loadFromJSON({ operator: "+" });
```

#### Supported Operators

- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`, `×`, `•`, `x`
- Division: `/`, `÷`
- Equals: `=`

#### JSON Format

```json
{
  "omdType": "operator",
  "operator": "+"
}
```

---

### Terms

`omdTerm` represents algebraic terms like `3x²`.

#### Basic Usage

```javascript
import { omdTerm } from '@teachinglab/omd';

const term = new omdTerm();
term.loadFromJSON({
    coefficient: 3,
    variable: "x",
    exponent: 2
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `coefficient` | number | required | Numeric coefficient |
| `variable` | string | optional | Variable letter |
| `exponent` | number | 1 | Power of the variable |

#### Examples

**Constant term:**
```json
{
  "omdType": "term",
  "coefficient": 5
}
```

**Linear term:**
```json
{
  "omdType": "term",
  "coefficient": 3,
  "variable": "x"
}
```

**Quadratic term:**
```json
{
  "omdType": "term",
  "coefficient": 2,
  "variable": "x",
  "exponent": 2
}
```

---

### Expressions

`omdExpression` represents mathematical expressions composed of terms and operators.

#### Basic Usage

```javascript
import { omdExpression } from '@teachinglab/omd';

// String form (simplest)
const expr = new omdExpression();
expr.loadFromJSON("3x^2 + 5x - 2");

// Structured form (programmatic)
expr.loadFromJSON({
    termsAndOpers: [
        { omdType: "term", coefficient: 3, variable: "x", exponent: 2 },
        { omdType: "operator", operator: "+" },
        { omdType: "term", coefficient: 5, variable: "x" },
        { omdType: "operator", operator: "-" },
        { omdType: "number", value: 2 }
    ]
});
```

#### String Parsing

OMD automatically parses mathematical expressions:

```javascript
expr.loadFromJSON("2x + 3");           // Linear
expr.loadFromJSON("x^2 - 4x + 4");     // Quadratic
expr.loadFromJSON("3x^3 + 2x^2 - x");  // Cubic
```

#### Structured Format

For programmatic creation:

```json
{
  "termsAndOpers": [
    { "omdType": "term", "coefficient": 2, "variable": "x" },
    { "omdType": "operator", "operator": "+" },
    { "omdType": "number", "value": 3 }
  ]
}
```

#### Examples

**Simple polynomial:**
```javascript
expr.loadFromJSON("x^2 + 2x + 1");
```

**Multi-variable:**
```javascript
expr.loadFromJSON("3x + 2y - 5");
```

**Complex expression:**
```javascript
expr.loadFromJSON({
    termsAndOpers: [
        { omdType: "term", coefficient: 1, variable: "x", exponent: 3 },
        { omdType: "operator", operator: "-" },
        { omdType: "term", coefficient: 4, variable: "x", exponent: 2 },
        { omdType: "operator", operator: "+" },
        { omdType: "term", coefficient: 5, variable: "x" },
        { omdType: "operator", operator: "-" },
        { omdType: "number", value: 6 }
    ]
});
```

---

### Equations

`omdEquation` represents complete equations with left and right sides.

#### Basic Usage

```javascript
import { omdEquation, omdEquationNode } from '@teachinglab/omd';

// Simple string form
const eq = new omdEquation();
eq.loadFromJSON({ equation: "2x + 3 = 11" });

// Or using static method
const eqNode = omdEquationNode.fromString("2x + 3 = 11");
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `equation` | string | String representation of equation |
| `leftExpression` | Expression | Left side expression |
| `rightExpression` | Expression | Right side expression |

#### Examples

**Linear equation:**
```javascript
eq.loadFromJSON({ equation: "2x + 3 = 11" });
```

**Quadratic equation:**
```javascript
eq.loadFromJSON({ equation: "x^2 - 5x + 6 = 0" });
```

**Structured form:**
```javascript
eq.loadFromJSON({
    leftExpression: {
        termsAndOpers: [
            { omdType: "term", coefficient: 2, variable: "x" },
            { omdType: "operator", operator: "+" },
            { omdType: "number", value: 3 }
        ]
    },
    rightExpression: {
        omdType: "number",
        value: 11
    }
});
```

**Multi-step:**
```javascript
// Step 1
eq.loadFromJSON({ equation: "2x + 3 = 11" });

// Step 2
eq.loadFromJSON({ equation: "2x = 8" });

// Step 3
eq.loadFromJSON({ equation: "x = 4" });
```

---

## Advanced Expressions

### Power Expressions

`omdPowerExpression` represents expressions raised to a power.

#### Basic Usage

```javascript
import { omdPowerExpression } from '@teachinglab/omd';

const power = new omdPowerExpression();
power.loadFromJSON({
    baseExpression: "x + 1",
    exponentExpression: "2"
});
```

#### Examples

**Simple power:**
```json
{
  "baseExpression": { "omdType": "variable", "name": "x" },
  "exponentExpression": { "omdType": "number", "value": 2 }
}
```
Renders as: `x²`

**Complex base:**
```json
{
  "baseExpression": {
    "termsAndOpers": [
      { "omdType": "variable", "name": "x" },
      { "omdType": "operator", "operator": "+" },
      { "omdType": "number", "value": 1 }
    ]
  },
  "exponentExpression": { "omdType": "number", "value": 2 }
}
```
Renders as: `(x + 1)²`

**Variable exponent:**
```json
{
  "baseExpression": { "omdType": "number", "value": 2 },
  "exponentExpression": { "omdType": "variable", "name": "n" }
}
```
Renders as: `2ⁿ`

---

### Rational Expressions

`omdRationalExpression` represents fractions and rational expressions.

#### Basic Usage

```javascript
import { omdRationalExpression } from '@teachinglab/omd';

const rational = new omdRationalExpression();
rational.loadFromJSON({
    numeratorExpression: "x + 1",
    denominatorExpression: "x - 1"
});
```

#### Examples

**Simple fraction:**
```json
{
  "numeratorExpression": { "omdType": "number", "value": 3 },
  "denominatorExpression": { "omdType": "number", "value": 4 }
}
```
Renders as: `¾`

**Algebraic fraction:**
```json
{
  "numeratorExpression": { "omdType": "variable", "name": "x" },
  "denominatorExpression": { "omdType": "number", "value": 2 }
}
```
Renders as: `x/2`

**Complex rational expression:**
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
      { "omdType": "term", "coefficient": 1, "variable": "x", "exponent": 2 },
      { "omdType": "operator", "operator": "-" },
      { "omdType": "number", "value": 1 }
    ]
  }
}
```
Renders as: `(x + 1)/(x² - 1)`

---

### Functions

`omdFunction` represents mathematical functions.

#### Basic Usage

```javascript
import { omdFunction } from '@teachinglab/omd';

const func = new omdFunction();
func.loadFromJSON({
    name: "f",
    inputVariables: ["x"],
    expression: "2x + 1"
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Function name (e.g., "f", "g", "h") |
| `inputVariables` | string[] | Input variable names |
| `expression` | Expression | Function definition |

#### Examples

**Linear function:**
```json
{
  "name": "f",
  "inputVariables": ["x"],
  "expression": "2x + 1"
}
```
Renders as: `f(x) = 2x + 1`

**Quadratic function:**
```json
{
  "name": "g",
  "inputVariables": ["x"],
  "expression": "x^2 - 4"
}
```
Renders as: `g(x) = x² - 4`

**Multi-variable function:**
```json
{
  "name": "h",
  "inputVariables": ["x", "y"],
  "expression": "x + 2y"
}
```
Renders as: `h(x, y) = x + 2y`

**Structured expression:**
```json
{
  "name": "f",
  "inputVariables": ["x"],
  "expression": {
    "termsAndOpers": [
      { "omdType": "term", "coefficient": 3, "variable": "x", "exponent": 2 },
      { "omdType": "operator", "operator": "-" },
      { "omdType": "term", "coefficient": 2, "variable": "x" },
      { "omdType": "operator", "operator": "+" },
      { "omdType": "number", "value": 5 }
    ]
  }
}
```

---

### Tile Equations

`omdTileEquation` provides visual tile-based representations of equations.

#### Basic Usage

```javascript
import { omdTileEquation } from '@teachinglab/omd';

const tileEq = new omdTileEquation();
tileEq.loadFromJSON({
    left: ["x", "x", 3],
    right: [11],
    equation: "2x + 3 = 11"
});
```

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `left` | Array | required | Left side tiles |
| `right` | Array | required | Right side tiles |
| `equation` | string | optional | Equation string |
| `tileSize` | number | 28 | Tile size in pixels |
| `tileGap` | number | 6 | Gap between tiles |
| `showLabels` | boolean | true | Show tile labels |
| `fontSize` | number | 16 | Label font size |

#### Examples

**Simple equation:**
```json
{
  "left": ["x", 5],
  "right": [10],
  "equation": "x + 5 = 10"
}
```

**Multiple variables:**
```json
{
  "left": ["x", "x", "y", 3],
  "right": ["x", "y", "y", 8],
  "tileSize": 30,
  "showLabels": true
}
```

**Custom styling:**
```json
{
  "left": ["x", "x", 4],
  "right": [12],
  "tileSize": 32,
  "tileGap": 8,
  "fontSize": 18,
  "fontFamily": "Georgia",
  "xPillColor": "#4ECDC4"
}
```

---

## Step-by-Step Solutions

### Equation Stack

`omdEquationStack` manages sequences of equation steps.

#### Basic Usage

```javascript
import { omdEquationStack, omdEquationNode } from '@teachinglab/omd';

const steps = [
    omdEquationNode.fromString('2x + 3 = 11'),
    omdEquationNode.fromString('2x = 8'),
    omdEquationNode.fromString('x = 4')
];

const stack = new omdEquationStack(steps, {
    toolbar: true,
    stepVisualizer: true
});

display.render(stack);
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `toolbar` | boolean | false | Show editing toolbar |
| `stepVisualizer` | boolean | false | Enable step visualization |
| `interactive` | boolean | true | Allow user interaction |

#### Examples

**Linear equation solution:**
```javascript
const linearSteps = [
    omdEquationNode.fromString('3x + 5 = 20'),
    omdEquationNode.fromString('3x = 15'),
    omdEquationNode.fromString('x = 5')
];

const stack = new omdEquationStack(linearSteps);
```

**Quadratic factoring:**
```javascript
const quadraticSteps = [
    omdEquationNode.fromString('x^2 + 5x + 6 = 0'),
    omdEquationNode.fromString('(x + 2)(x + 3) = 0'),
    omdEquationNode.fromString('x = -2 or x = -3')
];

const stack = new omdEquationStack(quadraticSteps, {
    stepVisualizer: true
});
```

**With explanations:**
```javascript
const stepsWithExplanations = [
    {
        equation: omdEquationNode.fromString('2x + 3 = 11'),
        explanation: 'Original equation'
    },
    {
        equation: omdEquationNode.fromString('2x = 8'),
        explanation: 'Subtract 3 from both sides'
    },
    {
        equation: omdEquationNode.fromString('x = 4'),
        explanation: 'Divide both sides by 2'
    }
];
```

---

### Step Visualizer

`omdStepVisualizer` provides interactive step-by-step visualization.

#### Basic Usage

```javascript
import { omdStepVisualizer } from '@teachinglab/omd';

const visualizer = new omdStepVisualizer();
visualizer.setSteps([
    { equation: '2x + 3 = 11', explanation: 'Start' },
    { equation: '2x = 8', explanation: 'Subtract 3' },
    { equation: 'x = 4', explanation: 'Divide by 2' }
]);
```

#### Features

- **Highlighting**: Automatically highlights changed elements
- **Explanations**: Text boxes for step explanations
- **Navigation**: Step forward/backward controls
- **Provenance**: Visual tracking of element relationships

#### Example with highlighting:

```javascript
visualizer.setSteps([
    {
        equation: omdEquationNode.fromString('2x + 3 = 11'),
        explanation: 'Original equation',
        highlights: []
    },
    {
        equation: omdEquationNode.fromString('2x = 8'),
        explanation: 'Subtract 3 from both sides',
        highlights: ['3', '11', '8']  // Highlight changed terms
    },
    {
        equation: omdEquationNode.fromString('x = 4'),
        explanation: 'Divide both sides by 2',
        highlights: ['2x', 'x', '8', '4']
    }
]);
```

---

### Simplification Engine

`omdSimplification` provides rule-based expression simplification.

#### Basic Usage

```javascript
import { omdSimplification } from '@teachinglab/omd';

const simplifier = new omdSimplification();
const result = simplifier.simplify('2x + 3x');
// Returns: '5x'
```

#### Available Rules

- **Combine like terms**: `2x + 3x` → `5x`
- **Add constants**: `3 + 5` → `8`
- **Multiply constants**: `2 * 3` → `6`
- **Distribute**: `2(x + 3)` → `2x + 6`
- **Factor**: `x^2 + 5x + 6` → `(x + 2)(x + 3)`

#### Examples

**Combine like terms:**
```javascript
simplifier.simplify('3x + 2x + 5');
// '5x + 5'
```

**Distribute:**
```javascript
simplifier.simplify('3(x + 2)');
// '3x + 6'
```

**Multi-step:**
```javascript
const steps = simplifier.simplifyWithSteps('2(x + 3) + 4x');
// Returns array of intermediate steps
```

---

## Expression Parsing

OMD includes a powerful expression parser that handles various mathematical notations.

### Supported Formats

#### Exponents
- Caret notation: `x^2`
- Superscript: `x²`

#### Multiplication
- Asterisk: `2*x`
- Times symbol: `2×x`
- Dot: `2•x`
- Implicit: `2x`

#### Division
- Slash: `x/2`
- Division symbol: `x÷2`

#### Parentheses
- Standard: `(x + 1)`
- Nested: `((x + 1) * 2)`

### Parsing Examples

```javascript
import { omdExpression } from '@teachinglab/omd';

const expr = new omdExpression();

// All of these are parsed correctly
expr.loadFromJSON("x^2 + 2x + 1");
expr.loadFromJSON("x² + 2x + 1");
expr.loadFromJSON("2*x*3");
expr.loadFromJSON("2×x×3");
expr.loadFromJSON("x/2 + 3");
expr.loadFromJSON("(x+1)(x-1)");
```

### Custom Parsing

For complex expressions, use the structured format:

```javascript
expr.loadFromJSON({
    termsAndOpers: [
        // Build expression programmatically
    ]
});
```

---

## Best Practices

### Use String Format When Possible

For simple expressions, string format is clearest:

```javascript
// Good
eq.loadFromJSON({ equation: "2x + 3 = 11" });

// Also works, but more verbose
eq.loadFromJSON({
    leftExpression: { termsAndOpers: [...] },
    rightExpression: { omdType: "number", value: 11 }
});
```

### Programmatic Generation

Use structured format for dynamic expression building:

```javascript
function createPolynomial(coefficients) {
    const termsAndOpers = [];
    
    coefficients.forEach((coef, index) => {
        const exponent = coefficients.length - index - 1;
        
        if (index > 0) {
            termsAndOpers.push({ omdType: "operator", operator: "+" });
        }
        
        termsAndOpers.push({
            omdType: "term",
            coefficient: coef,
            variable: "x",
            exponent: exponent
        });
    });
    
    return { termsAndOpers };
}

// Usage
const quadratic = createPolynomial([1, -5, 6]);
// Generates: x² - 5x + 6
```

### Step-by-Step Solutions

Always provide clear explanations:

```javascript
const steps = [
    {
        equation: omdEquationNode.fromString('2x + 3 = 11'),
        explanation: 'Given equation'
    },
    {
        equation: omdEquationNode.fromString('2x = 8'),
        explanation: 'Subtract 3 from both sides'
    },
    {
        equation: omdEquationNode.fromString('x = 4'),
        explanation: 'Divide both sides by 2'
    }
];
```

---

## Next Steps

- **[Visualizations Guide](./visualizations.md)** - Explore visual components
- **[JSON Schemas](../json-schemas.md)** - Complete reference
- **[API Reference](../api/api-reference.md)** - Detailed documentation
- **[Simplification Rules](../api/simplificationRules.md)** - Learn about available rules
