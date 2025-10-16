# Quick Examples

A collection of ready-to-use code examples for common OMD use cases.

## Table of Contents

- [Basic Equations](#basic-equations)
- [Visualizations](#visualizations)
- [Step-by-Step Solutions](#step-by-step-solutions)
- [Advanced Features](#advanced-features)

---

## Basic Equations

### Simple Equation

```javascript
import { omdDisplay, omdEquationNode } from '@teachinglab/omd';

const container = document.getElementById('container');
const display = new omdDisplay(container);

const equation = omdEquationNode.fromString('2x + 3 = 11');
display.render(equation);
```

### Expression

```javascript
import { omdExpression } from '@teachinglab/omd';

const expr = new omdExpression();
expr.loadFromJSON("3x^2 + 5x - 2");
display.render(expr);
```

### Quadratic Equation

```javascript
const quadratic = omdEquationNode.fromString('x^2 - 5x + 6 = 0');
display.render(quadratic);
```

---

## Visualizations

### Number Line

```javascript
import { omdNumberLine } from '@teachinglab/omd';

const numberLine = new omdNumberLine();
numberLine.loadFromJSON({
    min: 0,
    max: 20,
    dotValues: [5, 10, 15],
    label: "Skip Counting by 5"
});
display.render(numberLine);
```

### Coordinate Plane with Function

```javascript
import { omdCoordinatePlane } from '@teachinglab/omd';

const plane = new omdCoordinatePlane();
plane.loadFromJSON({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    graphEquations: [
        { equation: 'y = x^2 - 4', color: '#e11d48', strokeWidth: 2 }
    ],
    xLabel: "x",
    yLabel: "y"
});
display.render(plane);
```

### Multiple Functions

```javascript
plane.loadFromJSON({
    xMin: -5,
    xMax: 5,
    yMin: -5,
    yMax: 5,
    graphEquations: [
        { equation: 'y = x^2', color: '#e11d48', strokeWidth: 2 },
        { equation: 'y = 2x + 1', color: '#3B82F6', strokeWidth: 2 },
        { equation: 'y = -x + 3', color: '#10B981', strokeWidth: 2 }
    ]
});
display.render(plane);
```

### Tape Diagram

```javascript
import { omdTapeDiagram } from '@teachinglab/omd';

const tape = new omdTapeDiagram();
tape.loadFromJSON({
    values: [4, 4, 4, 3],
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
    showValues: true,
    labelSet: [
        {
            startIndex: 0,
            endIndex: 2,
            label: "3 equal groups",
            showBelow: false
        },
        {
            startIndex: 0,
            endIndex: 3,
            label: "Total: 15",
            showBelow: true
        }
    ]
});
display.render(tape);
```

### Table from Equation

```javascript
import { omdTable } from '@teachinglab/omd';

const table = new omdTable();
table.loadFromJSON({
    equation: "y = 2x + 1",
    headers: ["x", "y"],
    xMin: -3,
    xMax: 3,
    stepSize: 1,
    title: "Linear Function Table",
    alternatingRowColors: ["#F0F0F0", "#FFFFFF"]
});
display.render(table);
```

---

## Step-by-Step Solutions

### Linear Equation Solution

```javascript
import { omdEquationStack, omdEquationNode } from '@teachinglab/omd';

const steps = [
    omdEquationNode.fromString('3x + 5 = 20'),
    omdEquationNode.fromString('3x = 15'),
    omdEquationNode.fromString('x = 5')
];

const stack = new omdEquationStack(steps, {
    toolbar: true,
    stepVisualizer: true
});

display.render(stack);
```

### Quadratic Factoring

```javascript
const quadraticSteps = [
    omdEquationNode.fromString('x^2 + 5x + 6 = 0'),
    omdEquationNode.fromString('(x + 2)(x + 3) = 0'),
    omdEquationNode.fromString('x = -2 or x = -3')
];

const stack = new omdEquationStack(quadraticSteps);
display.render(stack);
```

### With Explanations

```javascript
const stepsWithExplanations = [
    {
        node: omdEquationNode.fromString('2(x + 3) = 14'),
        explanation: 'Original equation'
    },
    {
        node: omdEquationNode.fromString('2x + 6 = 14'),
        explanation: 'Distribute the 2'
    },
    {
        node: omdEquationNode.fromString('2x = 8'),
        explanation: 'Subtract 6 from both sides'
    },
    {
        node: omdEquationNode.fromString('x = 4'),
        explanation: 'Divide both sides by 2'
    }
];
```

---

## Advanced Features

### Rational Expressions

```javascript
import { omdRationalExpression } from '@teachinglab/omd';

const rational = new omdRationalExpression();
rational.loadFromJSON({
    numeratorExpression: {
        termsAndOpers: [
            { omdType: "variable", name: "x" },
            { omdType: "operator", operator: "+" },
            { omdType: "number", value: 1 }
        ]
    },
    denominatorExpression: {
        termsAndOpers: [
            { omdType: "term", coefficient: 1, variable: "x", exponent: 2 },
            { omdType: "operator", operator: "-" },
            { omdType: "number", value: 1 }
        ]
    }
});
display.render(rational);
```

### Power Expressions

```javascript
import { omdPowerExpression } from '@teachinglab/omd';

const power = new omdPowerExpression();
power.loadFromJSON({
    baseExpression: {
        termsAndOpers: [
            { omdType: "variable", name: "x" },
            { omdType: "operator", operator: "+" },
            { omdType: "number", value: 1 }
        ]
    },
    exponentExpression: {
        omdType: "number",
        value: 2
    }
});
display.render(power);
```

### Function Definition

```javascript
import { omdFunction } from '@teachinglab/omd';

const func = new omdFunction();
func.loadFromJSON({
    name: "f",
    inputVariables: ["x"],
    expression: {
        termsAndOpers: [
            { omdType: "term", coefficient: 2, variable: "x", exponent: 2 },
            { omdType: "operator", operator: "-" },
            { omdType: "term", coefficient: 3, variable: "x" },
            { omdType: "operator", operator: "+" },
            { omdType: "number", value: 1 }
        ]
    }
});
display.render(func);
```

### Coordinate Plane with Shapes

```javascript
const planeWithShapes = new omdCoordinatePlane();
planeWithShapes.loadFromJSON({
    xMin: -5,
    xMax: 5,
    yMin: -5,
    yMax: 5,
    shapeSet: [
        {
            omdType: 'circle',
            radius: 2,
            color: '#FF6B6B'
        },
        {
            omdType: 'rectangle',
            width: 3,
            height: 2,
            color: '#4ECDC4'
        },
        {
            omdType: 'regularPolygon',
            sides: 6,
            radius: 1.5,
            color: '#45B7D1'
        }
    ],
    dotValues: [
        [0, 0, "red"],
        [2, 2, "blue"],
        [-2, -2, "green"]
    ]
});
display.render(planeWithShapes);
```

### Tile Equation

```javascript
import { omdTileEquation } from '@teachinglab/omd';

const tileEq = new omdTileEquation();
tileEq.loadFromJSON({
    left: ["x", "x", 3],
    right: [11],
    equation: "2x + 3 = 11",
    tileSize: 30,
    showLabels: true,
    fontFamily: "Albert Sans"
});
display.render(tileEq);
```

### Custom Configuration

```javascript
import { omdConfigManager, omdDisplay } from '@teachinglab/omd';

// Set global configuration
omdConfigManager.setConfig({
    defaultFontSize: 32,
    defaultColor: '#2C3E50',
    highlightColor: '#FFD700'
});

// Create display with custom options
const display = new omdDisplay(container, {
    fontSize: 36,
    centerContent: true,
    fontFamily: 'Georgia'
});
```

### Programmatic Expression Building

```javascript
function createPolynomial(coefficients) {
    const termsAndOpers = [];
    
    coefficients.forEach((coef, index) => {
        const exponent = coefficients.length - index - 1;
        
        if (index > 0 && coef >= 0) {
            termsAndOpers.push({ omdType: "operator", operator: "+" });
        } else if (coef < 0) {
            termsAndOpers.push({ omdType: "operator", operator: "-" });
            coef = Math.abs(coef);
        }
        
        if (exponent === 0) {
            termsAndOpers.push({ omdType: "number", value: coef });
        } else {
            termsAndOpers.push({
                omdType: "term",
                coefficient: coef,
                variable: "x",
                exponent: exponent
            });
        }
    });
    
    return { termsAndOpers };
}

// Create x² + 3x - 4
const expr = new omdExpression();
expr.loadFromJSON(createPolynomial([1, 3, -4]));
display.render(expr);
```

### Interactive Canvas

```javascript
import { omdCanvas } from '@teachinglab/omd';

const canvas = new omdCanvas(container);

// Add multiple components
const eq1 = omdEquationNode.fromString('y = x^2');
const eq2 = omdEquationNode.fromString('y = 2x + 1');

canvas.addNode(eq1);
canvas.addNode(eq2);

// Enable dragging
canvas.enableDragging();
```

---

## Complete Working Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OMD Complete Example</title>
    <style>
        body {
            font-family: 'Albert Sans', sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .container {
            width: 100%;
            height: 500px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin: 20px 0;
            padding: 20px;
            background: #fafafa;
        }
        h2 {
            color: #2C3E50;
        }
    </style>
</head>
<body>
    <h1>OMD Demonstration</h1>
    
    <h2>Equation with Steps</h2>
    <div id="equation-container" class="container"></div>
    
    <h2>Coordinate Plane</h2>
    <div id="plane-container" class="container"></div>
    
    <h2>Visualizations</h2>
    <div id="viz-container" class="container"></div>
    
    <script type="module">
        import {
            omdDisplay,
            omdEquationNode,
            omdEquationStack,
            omdCoordinatePlane,
            omdNumberLine
        } from '@teachinglab/omd';
        
        // 1. Equation with steps
        const eqDisplay = new omdDisplay(
            document.getElementById('equation-container')
        );
        
        const steps = [
            omdEquationNode.fromString('2x + 3 = 11'),
            omdEquationNode.fromString('2x = 8'),
            omdEquationNode.fromString('x = 4')
        ];
        
        const stack = new omdEquationStack(steps, {
            stepVisualizer: true
        });
        
        eqDisplay.render(stack);
        
        // 2. Coordinate plane
        const planeDisplay = new omdDisplay(
            document.getElementById('plane-container')
        );
        
        const plane = new omdCoordinatePlane();
        plane.loadFromJSON({
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
            graphEquations: [
                { equation: 'y = x^2 - 4', color: '#e11d48', strokeWidth: 2 },
                { equation: 'y = 2x + 1', color: '#3B82F6', strokeWidth: 2 }
            ],
            xLabel: "x",
            yLabel: "y"
        });
        
        planeDisplay.render(plane);
        
        // 3. Number line
        const vizDisplay = new omdDisplay(
            document.getElementById('viz-container')
        );
        
        const numberLine = new omdNumberLine();
        numberLine.loadFromJSON({
            min: 0,
            max: 10,
            dotValues: [2, 5, 8],
            label: "Number Line Example"
        });
        
        vizDisplay.render(numberLine);
    </script>
</body>
</html>
```

---

## Next Steps

- **[Getting Started](./getting-started.md)** - Installation and setup
- **[Visualizations Guide](./visualizations.md)** - All visual components
- **[Equations Guide](./equations.md)** - Equation and expression details
- **[JSON Schemas](../json-schemas.md)** - Complete reference
