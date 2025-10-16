# OMD (Open Math Display)

> A JavaScript library for creating interactive mathematical interfaces in web applications

[![npm version](https://img.shields.io/npm/v/@teachinglab/omd.svg)](https://www.npmjs.com/package/@teachinglab/omd)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OMD is a comprehensive JavaScript library for building rich, interactive mathematical experiences in the browser. From simple equation displays to complex step-by-step solution systems with full visual feedback and user interaction.

![OMD Demo](https://i.imgur.com/CdtEi33.png)

## Quick Start

### Installation

```bash
npm install @teachinglab/omd
```

### Basic Usage

```javascript
import { omdDisplay } from '@teachinglab/omd';

// Create a math display
const container = document.getElementById('math-container');
const display = new omdDisplay(container);

// Render an equation
display.render('2x + 3 = 11');
```

## Documentation

### Getting Started
- **[Installation & Setup](./guides/getting-started.md)** - Get up and running with OMD
- **[Quick Examples](./guides/quick-examples.md)** - Common use cases and code snippets
- **[Factory Functions](./guides/factory-functions.md)** - Creating objects from JSON (AI-friendly)

### Core Concepts

#### 1. Global Context & Configuration
Learn about the foundational systems that power OMD:

- **[Configuration Manager](./api/omdConfigManager.md)** - Library-wide settings and theming
- **[Configuration Options](./api/configuration-options.md)** - Complete list of available settings
- **[Display System](./api/omdDisplay.md)** - Main rendering engine
- **[Canvas System](./api/omdCanvas.md)** - Multi-expression layout manager
- **[Event Manager](./api/eventManager.md)** - Event handling and coordination
- **[Helpers & Utilities](./api/omdHelpers.md)** - Utility functions for common tasks

#### 2. Visualizations
Interactive visual components for teaching and learning:

##### Number & Ratio Visualizations
- **[Number Line](./guides/visualizations.md#number-line)** - `omdNumberLine` - Interactive number lines with dots and labels
- **[Number Tiles](./guides/visualizations.md#number-tiles)** - `omdNumberTile` - Visual counting tiles with dots
- **[Tape Diagrams](./guides/visualizations.md#tape-diagrams)** - `omdTapeDiagram` - Part-whole relationship diagrams
- **[Ratio Charts](./guides/visualizations.md#ratio-charts)** - `omdRatioChart` - Pie and bar chart ratio visualizations
- **[Balance Hanger](./guides/visualizations.md#balance-hanger)** - `omdBalanceHanger` - Balance scale visualizations

##### Graphing & Geometry
- **[Coordinate Plane](./guides/visualizations.md#coordinate-plane)** - `omdCoordinatePlane` - 2D graphing with functions and shapes
- **[Shapes](./guides/visualizations.md#shapes)** - `omdShapes` - Geometric shapes (circles, rectangles, polygons, triangles)
- **[Spinner](./guides/visualizations.md#spinner)** - `omdSpinner` - Interactive circular spinners

##### Data Display
- **[Tables](./guides/visualizations.md#tables)** - `omdTable` - Data tables with customizable styling
- **[Function Graphs](./guides/visualizations.md#function-graphs)** - Plotting mathematical functions

#### 3. Equations & Expressions
The heart of mathematical notation and manipulation:

##### Core Expression Components
- **[Expression Nodes](./api/expression-nodes.md)** - Understanding the node tree structure and omdEquationNode class
- **[omdEquationNode](./api/omdEquationNode.md)** - Complete equations with manipulation methods (e.g., `2x + 3 = 11`)
- **[omdExpression](./guides/equations.md#expressions)** - Mathematical expressions (e.g., `3x² + 5`)
- **[omdTerm](./guides/equations.md#terms)** - Individual terms (e.g., `3x²`)
- **[omdNumber](./guides/equations.md#numbers)** - Numeric constants
- **[omdVariable](./guides/equations.md#variables)** - Variables (e.g., `x`, `y`)
- **[omdOperator](./guides/equations.md#operators)** - Mathematical operators (+, -, ×, ÷)

##### Advanced Expression Types
- **[omdPowerExpression](./guides/equations.md#power-expressions)** - Exponentiation (e.g., `(x+1)²`)
- **[omdRationalExpression](./guides/equations.md#rational-expressions)** - Fractions (e.g., `(x+1)/(x-1)`)
- **[omdFunction](./guides/equations.md#functions)** - Mathematical functions (e.g., `f(x) = 2x + 1`)
- **[omdTileEquation](./guides/equations.md#tile-equations)** - Visual tile-based equations

##### Step-by-Step Solutions
- **[Equation Stack](./api/omdEquationStack.md)** - Sequenced solution steps
- **[Step Visualizer](./api/omdStepVisualizer.md)** - Interactive step visualization
- **[Simplification Engine](./api/omdSimplification.md)** - Rule-based expression simplification
- **[Simplification Rules](./api/simplificationRules.md)** - Available transformation rules

### Complete API Reference
- **[Full API Documentation](./api/api-reference.md)** - Complete reference for all components
- **[JSON Schemas](./json-schemas.md)** - Detailed JSON structure for all components

## Features

### **Interactive Math Rendering**
- High-quality SVG-based mathematical notation
- Real-time expression manipulation and visualization
- Automatic layout and alignment for complex equations

### **Step-by-Step Solutions**
- Visual step tracking with detailed explanations
- Simplification engine with rule-based transformations
- Provenance tracking for highlighting related elements

### **Rich UI Components**
- Built-in toolbar for common mathematical operations
- Drag & drop interface for intuitive manipulation
- Customizable canvas for multi-expression layouts

### **Educational Features**
- Interactive learning experiences
- Progressive step revelation
- Visual operation feedback and highlighting

## Guides

### By Use Case
- **[Creating Equations](./guides/equations.md)** - Work with equations and expressions
- **[Visualizations Guide](./guides/visualizations.md)** - All visualization components
- **[Step-by-Step Solutions](./guides/step-by-step.md)** - Building interactive solutions
- **[Interactive Features](./guides/interactive-features.md)** - Drag & drop, toolbars, and more

### Advanced Topics
- **[Expression Tree Structure](./guides/expression-tree.md)** - Understanding the AST
- **[Custom Simplification Rules](./guides/custom-rules.md)** - Extending the simplification engine
- **[Theming & Styling](./guides/theming.md)** - Customizing appearance
- **[Performance Optimization](./guides/performance.md)** - Best practices for large applications

## Architecture

```
OMD Library Structure
├── Core Systems
│   ├── Configuration Manager (Global settings)
│   ├── Display System (Rendering engine)
│   └── Event Manager (Coordination)
│
├── Visualizations
│   ├── Number Visualizations (Number line, tiles, tape diagrams)
│   ├── Graphing (Coordinate plane, functions)
│   └── Data Display (Tables, charts)
│
└── Equations & Expressions
    ├── Node System (Expression tree)
    ├── Equation Components (Equations, terms, operators)
    ├── Advanced Expressions (Powers, rationals, functions)
    └── Step-by-Step System (Simplification, visualization)
```

## Examples

### Creating Objects from JSON (Factory Method)

```javascript
import { createFromJSON } from '@teachinglab/omd';

// AI-generated or dynamic JSON data
const jsonData = {
    omdType: 'numberLine',
    min: 0,
    max: 10,
    dotValues: [2, 5, 8]
};

// Create the object - no switch statement needed!
const numberLine = createFromJSON(jsonData);
```

### Basic Equation
```javascript
import { omdDisplay, omdEquationNode } from '@teachinglab/omd';

const display = new omdDisplay(document.getElementById('container'));
const equation = omdEquationNode.fromString('2x + 3 = 11');
display.render(equation);
```

### Step-by-Step Solution
```javascript
import { omdEquationStack } from '@teachinglab/omd';

const steps = [
    '2x + 3 = 11',
    '2x = 8',
    'x = 4'
];

const stack = new omdEquationStack(steps.map(s => 
    omdEquationNode.fromString(s)
), {
    toolbar: true,
    stepVisualizer: true
});

display.render(stack);
```

### Coordinate Plane with Function
```javascript
import { omdCoordinatePlane } from '@teachinglab/omd';

const plane = new omdCoordinatePlane();
plane.loadFromJSON({
    xMin: -10, xMax: 10,
    yMin: -10, yMax: 10,
    graphEquations: [
        { equation: 'y = x^2 - 4', color: '#e11d48', strokeWidth: 2 }
    ]
});

display.render(plane);
```

### Number Line Visualization
```javascript
import { omdNumberLine } from '@teachinglab/omd';

const numberLine = new omdNumberLine();
numberLine.loadFromJSON({
    min: 0,
    max: 10,
    dotValues: [2, 5, 8],
    label: 'Number Line Example'
});

display.render(numberLine);
```

## Dependencies

- **JSVG** (`@teachinglab/jsvg`) - High-performance SVG rendering
- **math.js** - Mathematical expression parsing
- **Modern Browser** - ES6 modules, SVG support required

## License

MIT License - see [LICENSE](../LICENSE) for details

## Contributing

We welcome contributions! See our [contributing guidelines](../CONTRIBUTING.md) for more information.

---

**Ready to get started?** Check out the [Getting Started Guide](./guides/getting-started.md) or explore the [JSON Schemas](./json-schemas.md) for detailed component configurations.
