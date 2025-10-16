# omdVariableNode

Represents a variable (like `x`, `y`, `a`, `b`) in mathematical expressions. This node handles the visual representation of variables, their evaluation, and conversion to math.js AST.

## Class Definition

```javascript
export class omdVariableNode extends omdLeafNode
```

## Constructor

### `new omdVariableNode(nodeData)`

Creates a new `omdVariableNode` instance.

-   **`nodeData`** (`object` | `string`): The AST node data (from math.js, typically a `SymbolNode` with a `name` property) or the variable name as a string (e.g., `"x"`). The constructor extracts the variable `name` and creates the `textElement` for display.

## Static Methods

### `fromName(name)`

Creates a variable node directly from a given name string. This is a convenience method for creating simple variable nodes without needing to construct a full AST object.

-   **`name`** (`string`): The variable name (e.g., `"x"`, `"theta"`).
-   **Returns**: `omdVariableNode` - A new instance of `omdVariableNode`.

## Public Properties

-   **`name`** (`string`): The name of the variable (e.g., `'x'`, `'y'`, `'theta'`).
-   **`type`** (`string`): Always `"omdVariableNode"`.
-   **`textElement`** (`jsvgTextLine`): The internal `jsvgTextLine` instance that displays the variable name.

## Public Methods

### `computeDimensions()`

Calculates the dimensions of the node based on its text content, adding a small amount of padding around the variable name to improve visual spacing.

-   **Overrides**: `omdLeafNode.computeDimensions()`.

### `updateLayout()`

Updates the layout of the node. This method primarily calls the superclass's `updateLayout`.

-   **Overrides**: `omdLeafNode.updateLayout()`.

### `toMathJSNode()`

Converts the `omdVariableNode` to a math.js-compatible AST format. It creates a `SymbolNode` with the variable's `name`, `id`, and `provenance`.

-   **Returns**: `object` - A math.js-compatible AST node with `type: "SymbolNode"` and `name` set to the variable name. The returned object also includes `id`, `provenance`, and a `clone` method for compatibility.

### `highlight(color)`

Applies a highlight to the node's background and sets the variable's text color to white for better contrast. This method respects the `isExplainHighlighted` lock.

-   **`color`** (`string`): The color of the highlight.

### `clearProvenanceHighlights()`

Clears any provenance-related highlights from the node and resets the variable's text color to its default (black).

### `toString()`

Converts the variable node to its string representation, which is simply its `name`.

-   **Returns**: `string` - The variable name.

### `evaluate(variables)`

Evaluates the variable by looking up its value in the provided `variables` map. If the variable is not defined in the map, it throws an error.

-   **`variables`** (`object`): A map of variable names to their numeric values.
-   **Returns**: `number` - The value of the variable.
-   **Throws**: `Error` if the variable is not defined in the map.

## Internal Methods

-   **`parseName(nodeData)`**: Extracts the variable name from the constructor's `nodeData`. It handles both string input and AST objects with a `name` property.
-   **`parseType()`**: Sets the node's type. Always returns `"variable"`.

## Examples

#### Creating Variables

```javascript
import { omdVariableNode } from '@teachinglab/omd';
import * as math from 'mathjs';

// From a name string
const nodeX = omdVariableNode.fromName('x');
const nodeTheta = omdVariableNode.fromName('θ');

// From AST data (e.g., from math.js parse result)
const astNode = math.parse('y');
const nodeY = new omdVariableNode(astNode);

// Direct string name (less common, but supported)
const nodeZ = new omdVariableNode('z');
```

#### Rendering Variables

```javascript
import { omdVariableNode } from '@teachinglab/omd';
// import { jsvgContainer } from '@teachinglab/jsvg'; // if rendering directly

const node = omdVariableNode.fromName('x');
node.setFontSize(24);
node.initialize(); // Computes dimensions and layout

// To render, typically add to a parent node or an omdDisplay
// const svgContainer = new jsvgContainer();
// svgContainer.addChild(node);
// document.body.appendChild(svgContainer.svgObject);
```

## See Also

-   [`omdLeafNode`](./omdLeafNode.md) - Parent class.
-   [`omdNode`](./omdNode.md) - Base class.
-   [`omdConstantNode`](./omdConstantNode.md) - For numeric values.
