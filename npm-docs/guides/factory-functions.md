# Factory Functions

OMD provides factory functions to simplify creating objects from JSON data. This eliminates the need for large switch statements when working with dynamic data or AI-generated JSON.

## createFromJSON

The main factory function that creates OMD objects from JSON data.

### Usage

```javascript
import { createFromJSON } from '@teachinglab/omd';

const jsonData = {
    omdType: 'numberLine',
    min: 0,
    max: 10,
    dotValues: [2, 5, 8]
};

const omdObject = createFromJSON(jsonData);
```

### Parameters

- **jsonData** (object): JSON object with an `omdType` field and component-specific properties

### Returns

- **object**: The created OMD object with data already loaded via `loadFromJSON()`

### Throws

- **Error**: If `omdType` is missing or unsupported

### Supported Types

The factory supports all OMD visualization and mathematical components:

**Visualizations:**
- `balanceHanger`
- `table`
- `tapeDiagram`
- `coordinatePlane`
- `numberLine`
- `numberTile`
- `ratioChart`
- `tileEquation`
- `spinner`

**Mathematical Components:**
- `equation`
- `expression`
- `term`
- `number`
- `variable`
- `powerExpression`
- `rationalExpression`
- `function`

**Geometric Shapes:**
- `rightTriangle`
- `isoscelesTriangle`
- `rectangle`
- `ellipse`
- `circle`
- `regularPolygon`

## Examples

### Creating a Number Line

```javascript
import { createFromJSON } from '@teachinglab/omd';

const numberLine = createFromJSON({
    omdType: 'numberLine',
    min: 0,
    max: 20,
    dotValues: [5, 10, 15],
    label: 'Skip Counting by 5'
});

// Add to SVG
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", numberLine.width);
svg.setAttribute("height", numberLine.height);
svg.appendChild(numberLine.svgObject);
document.body.appendChild(svg);
```

### Creating a Coordinate Plane

```javascript
const plane = createFromJSON({
    omdType: 'coordinatePlane',
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    graphEquations: [
        { equation: 'y = x^2 - 4', color: '#e11d48', strokeWidth: 2 }
    ]
});
```

### Creating an Equation

```javascript
const equation = createFromJSON({
    omdType: 'equation',
    equation: '2x + 3 = 11'
});
```

### Working with AI-Generated JSON

The factory function is especially useful when working with AI-generated content:

```javascript
import { createFromJSON } from '@teachinglab/omd';

async function generateVisualization(userRequest) {
    // Call AI API
    const response = await fetch(
        `https://your-api.com/generate?topic=${encodeURIComponent(userRequest)}`
    );
    const jsonData = await response.json();
    
    // Create OMD object - no switch statement needed!
    const omdObject = createFromJSON(jsonData);
    
    // Render to SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", omdObject.width || 400);
    svg.setAttribute("height", omdObject.height || 500);
    svg.setAttribute("viewBox", omdObject.svgObject.getAttribute("viewBox"));
    svg.appendChild(omdObject.svgObject);
    
    return svg;
}

// Usage
const svg = await generateVisualization("number line from 0 to 10");
document.getElementById('container').appendChild(svg);
```

## Helper Functions

### getSupportedTypes

Returns an array of all supported OMD types.

```javascript
import { getSupportedTypes } from '@teachinglab/omd';

const types = getSupportedTypes();
console.log(types);
// ['balanceHanger', 'table', 'coordinatePlane', 'numberLine', ...]
```

### isTypeSupported

Checks if a given type is supported.

```javascript
import { isTypeSupported } from '@teachinglab/omd';

if (isTypeSupported('numberLine')) {
    console.log('Number lines are supported!');
}

if (!isTypeSupported('customType')) {
    console.log('This type is not supported');
}
```

## Before and After

### Before (Without Factory)

```javascript
import { 
    omdBalanceHanger,
    omdTable,
    omdNumberLine,
    // ... 20+ more imports
} from '@teachinglab/omd';

let omdObject;

switch (jsonData.omdType) {
    case 'balanceHanger':
        omdObject = new omdBalanceHanger();
        break;
    case 'table':
        omdObject = new omdTable();
        break;
    case 'numberLine':
        omdObject = new omdNumberLine();
        break;
    // ... 20+ more cases
    default:
        throw new Error(`Unsupported type: ${jsonData.omdType}`);
}

omdObject.loadFromJSON(jsonData);
```

### After (With Factory)

```javascript
import { createFromJSON } from '@teachinglab/omd';

const omdObject = createFromJSON(jsonData);
```

Much cleaner!

## Error Handling

The factory function provides clear error messages:

```javascript
import { createFromJSON } from '@teachinglab/omd';

try {
    // Missing omdType
    const obj1 = createFromJSON({ min: 0, max: 10 });
} catch (error) {
    console.error(error.message);
    // "JSON data must include an 'omdType' field"
}

try {
    // Unsupported type
    const obj2 = createFromJSON({ omdType: 'unknownType' });
} catch (error) {
    console.error(error.message);
    // "Unsupported omdType: 'unknownType'. Supported types: balanceHanger, table, ..."
}
```

## TypeScript Support

If using TypeScript, you can type the return value:

```typescript
import { createFromJSON } from '@teachinglab/omd';
import type { omdNumberLine } from '@teachinglab/omd';

const jsonData = {
    omdType: 'numberLine',
    min: 0,
    max: 10
};

const numberLine = createFromJSON(jsonData) as omdNumberLine;
```

## Best Practices

### 1. Always Include omdType

Ensure your JSON data includes the `omdType` field:

```javascript
const jsonData = {
    omdType: 'coordinatePlane',  // Required!
    xMin: -10,
    xMax: 10
};
```

### 2. Validate Types Before Creation

For dynamic data, validate the type first:

```javascript
import { isTypeSupported, createFromJSON } from '@teachinglab/omd';

if (isTypeSupported(jsonData.omdType)) {
    const omdObject = createFromJSON(jsonData);
} else {
    console.error(`Type ${jsonData.omdType} is not supported`);
}
```

### 3. Use with Display System

Combine with the display system for easy rendering:

```javascript
import { createFromJSON, omdDisplay } from '@teachinglab/omd';

const display = new omdDisplay(document.getElementById('container'));
const omdObject = createFromJSON(jsonData);
display.render(omdObject);
```

## Complete Example

Here's a complete example integrating the factory with an AI API:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OMD Factory Example</title>
</head>
<body>
    <input type="text" id="input" placeholder="Describe what to visualize" />
    <button id="generate">Generate</button>
    <div id="container"></div>

    <script type="module">
        import { createFromJSON } from '@teachinglab/omd';
        
        document.getElementById('generate').addEventListener('click', async () => {
            const request = document.getElementById('input').value;
            
            try {
                // Get JSON from AI API
                const response = await fetch(`/api/generate?q=${encodeURIComponent(request)}`);
                const jsonData = await response.json();
                
                // Create OMD object
                const omdObject = createFromJSON(jsonData);
                
                // Render to SVG
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", omdObject.width || 400);
                svg.setAttribute("height", omdObject.height || 500);
                svg.setAttribute("viewBox", omdObject.svgObject.getAttribute("viewBox"));
                svg.appendChild(omdObject.svgObject);
                
                // Add to page
                document.getElementById('container').innerHTML = '';
                document.getElementById('container').appendChild(svg);
            } catch (error) {
                console.error('Error:', error.message);
            }
        });
    </script>
</body>
</html>
```

## See Also

- [JSON Schemas](../json-schemas.md) - Complete JSON reference for all components
- [Getting Started](./getting-started.md) - Basic setup and usage
- [API Reference](../api/api-reference.md) - Detailed API documentation
