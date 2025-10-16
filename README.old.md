# OMD (On-screen Math Display)

OMD is a JavaScript library for creating interactive mathematical interfaces in web applications. Build everything from simple equation displays to complex step-by-step solution systems with rich visual feedback and user interaction.

![OMD Demo](https://i.imgur.com/CdtEi33.png)

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

## Installation

### npm
```bash
npm install @teachinglab/omd
```

## Basic Usage
```javascript
import { omdDisplay } from '@teachinglab/omd';

// Create a math display
const container = document.getElementById('math-container');
const display = new omdDisplay(container);

// Render an equation
display.render('2x + 3 = 11');
```

### Step-by-Step Solutions
```javascript
import { omdEquationStack, omdEquationNode } from '@teachinglab/omd';

// Create solution steps
const steps = [
    omdEquationNode.fromString('2x + 3 = 11'),
    omdEquationNode.fromString('2x = 8'),
    omdEquationNode.fromString('x = 4')
];

// Create interactive equation stack
const stack = new omdEquationStack(steps, {
    toolbar: true,
    stepVisualizer: true
});

display.render(stack);
```

## Core Concepts

### **Nodes** - Building Blocks
Every mathematical element is a node in an expression tree:
- `omdEquationNode` - Complete equations (e.g., `2x + 3 = 11`)
- `omdConstantNode` - Numbers (e.g., `5`, `3.14`)
- `omdVariableNode` - Variables (e.g., `x`, `y`)
- `omdBinaryExpressionNode` - Operations (e.g., `+`, `-`, `*`, `/`)

### **Sequences** - Solution Steps
Group related equations for step-by-step solving:
```javascript
const sequence = new omdEquationSequenceNode([
    equation1, equation2, equation3
]);
```

### **Display** - Rendering Engine
Handles layout, centering, and visualization:
```javascript
const display = new omdDisplay(container, {
    fontSize: 36,
    centerContent: true
});
```

## Interactive Examples

Explore OMD's capabilities with our comprehensive examples:

| Category | Example | Description |
|----------|---------|-------------|
| **Getting Started** | [Minimal](examples/minimal.html) | Basic equation rendering |
| | [Simple Usage](examples/simple-usage.html) | Interactive features |
| **Advanced** | [Expression Playground](examples/expression-playground.html) | Full manipulation interface |
| | [Drag & Drop](examples/drag-and-drop-playground.html) | Intuitive interaction |
| **Educational** | [Worked Solutions](examples/worked-solution.html) | Step-by-step solving |
| | [Kids Interactive](examples/kids-interactive.html) | Child-friendly interface |
| **Components** | [Equation Stack](examples/equation-stack-test.html) | Stacked equations |
| | [Canvas Demo](examples/canvas-multiple-nodes.html) | Multi-expression layouts |

**[Browse All Examples](examples/index.html)**

## Documentation

| Resource | Description |
|----------|-------------|
| **[API Reference](docs/api-reference.md)** | Complete component documentation |
| **[User Guide](docs/user-guide.md)** | Getting started and tutorials |


## Architecture

```
OMD Library Structure
├── Display Layer (omdDisplay)
├── Node System (Expression tree components)
├── UI Components (Toolbar, Step visualizer)
├── Core Systems (Simplification, Layout)
└── Utilities (Configuration, Helpers)
```

## Dependencies

- **JSVG** - High-performance SVG rendering
- **math.js** - Mathematical expression parsing
- **Modern Browser** - ES6 modules, SVG support

---

**Ready to get started?** Check out our [examples](examples/index.html) or dive into the [documentation](docs/api-reference.md)!