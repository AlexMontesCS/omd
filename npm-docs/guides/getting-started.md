# Getting Started with OMD

This guide will help you install and start using OMD (On-screen Math Display) in your project.

## Installation

### Using npm

```bash
npm install @teachinglab/omd
```

### Using yarn

```bash
yarn add @teachinglab/omd
```

## Basic Setup

### 1. Import OMD

```javascript
import { omdDisplay } from '@teachinglab/omd';
```

### 2. Create a Container

Add a container element to your HTML:

```html
<div id="math-container"></div>
```

### 3. Initialize and Render

```javascript
// Get the container element
const container = document.getElementById('math-container');

// Create a display instance
const display = new omdDisplay(container);

// Render an equation
display.render('2x + 3 = 11');
```

## Complete Example

Here's a complete HTML file with OMD:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OMD Example</title>
    <style>
        body {
            font-family: 'Albert Sans', sans-serif;
            padding: 20px;
        }
        #math-container {
            width: 100%;
            height: 400px;
            border: 1px solid #ccc;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <h1>My First OMD App</h1>
    <div id="math-container"></div>
    
    <script type="module">
        import { omdDisplay, omdEquationNode } from '@teachinglab/omd';
        
        const container = document.getElementById('math-container');
        const display = new omdDisplay(container);
        
        // Create and render an equation
        const equation = omdEquationNode.fromString('2x + 3 = 11');
        display.render(equation);
    </script>
</body>
</html>
```

## Common Use Cases

### Rendering Different Components

#### 1. Simple Equation

```javascript
import { omdDisplay } from '@teachinglab/omd';

const display = new omdDisplay(container);
display.render('x + 5 = 10');
```

#### 2. Expression

```javascript
import { omdExpression } from '@teachinglab/omd';

const expr = new omdExpression();
expr.loadFromJSON("3x^2 + 5x - 2");
display.render(expr);
```

#### 3. Number Line

```javascript
import { omdNumberLine } from '@teachinglab/omd';

const numberLine = new omdNumberLine();
numberLine.loadFromJSON({
    min: 0,
    max: 10,
    dotValues: [2, 5, 8],
    label: "Number Line"
});
display.render(numberLine);
```

#### 4. Coordinate Plane

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
display.render(plane);
```

#### 5. Step-by-Step Solution

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

## Configuration

### Display Options

You can configure the display when creating it:

```javascript
const display = new omdDisplay(container, {
    fontSize: 36,
    centerContent: true,
    fontFamily: 'Albert Sans'
});
```

### Global Configuration

OMD uses a global configuration manager:

```javascript
import { omdConfigManager } from '@teachinglab/omd';

// Update global settings
omdConfigManager.setConfig({
    defaultFontSize: 32,
    defaultColor: '#333333',
    highlightColor: '#FFD700'
});
```

## Loading from JSON

Most OMD components can be loaded from JSON:

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

display.render(table);
```

See the [JSON Schemas documentation](../json-schemas.md) for complete JSON specifications.

## Using with Build Tools

### Vite

OMD works seamlessly with Vite:

```javascript
// main.js
import { omdDisplay } from '@teachinglab/omd';

const display = new omdDisplay(document.getElementById('app'));
display.render('2x + 3 = 11');
```

### Webpack

Configure Webpack to handle ES modules:

```javascript
// webpack.config.js
module.exports = {
    // ... other config
    resolve: {
        extensions: ['.js']
    }
};
```

### React

OMD can be used with React using refs:

```jsx
import React, { useEffect, useRef } from 'react';
import { omdDisplay } from '@teachinglab/omd';

function MathComponent() {
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (containerRef.current) {
            const display = new omdDisplay(containerRef.current);
            display.render('2x + 3 = 11');
        }
    }, []);
    
    return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
}

export default MathComponent;
```

## Next Steps

Now that you have OMD installed and working, explore these resources:

1. **[Visualizations Guide](./visualizations.md)** - Learn about all visual components
2. **[Equations Guide](./equations.md)** - Master equations and expressions
3. **[JSON Schemas](../json-schemas.md)** - Complete component reference
4. **[API Reference](../api/api-reference.md)** - Detailed API documentation
5. **[Examples](./quick-examples.md)** - More code examples

## Troubleshooting

### Module not found

If you get "Module not found" errors, ensure:
- OMD is installed: `npm install @teachinglab/omd`
- Your bundler supports ES modules
- Import paths are correct

### Display not rendering

If the display doesn't appear:
- Check that the container element exists in the DOM
- Ensure the container has width and height
- Check browser console for errors

### Style issues

For best results:
- Use `Albert Sans` font family
- Ensure adequate container dimensions
- Check that SVG rendering is supported in your browser

## Browser Support

OMD requires:
- Modern browser with ES6 support
- SVG rendering capabilities
- Native ES modules or a bundler

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Browse the complete [API Reference](../api/api-reference.md)
- **Examples**: Check the repository's `/examples` directory
