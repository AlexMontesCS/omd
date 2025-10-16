# omdLeafNode

Represents a base class for all leaf nodes in the OMD expression tree, such as constants, variables, operators, and grouping symbols. This class provides fundamental functionalities for handling text content, computing dimensions, and managing layout for single-element nodes.

## Class Definition

```javascript
export class omdLeafNode extends omdNode
```

## Constructor

### `new omdLeafNode(astNodeData)`

Creates a new `omdLeafNode` instance. This is an abstract base class; you should use its concrete subclasses (e.g., `omdConstantNode`, `omdVariableNode`) instead.

-   **`astNodeData`** (`object`): The abstract syntax tree (AST) node data from a parser like math.js, containing information relevant to the leaf node.

## Public Properties

-   **`textElement`** (`jsvgTextLine`): The internal `jsvgTextLine` instance that renders the text content of the leaf node.

## Public Methods

### `clone()`

Creates a deep clone of the leaf node. This method uses the original node's constructor to create a new instance, ensuring that the correct subclass is instantiated. The clone's `provenance` array is updated to include the original node's ID.

-   **Returns**: `omdLeafNode` - A new instance of the specific leaf node subclass.

### `updateTextElement(text)`

Updates the text content displayed by the node's `textElement`. After updating the text, you typically need to call `computeDimensions()` and `updateLayout()` to reflect the change visually.

-   **`text`** (`string` | `number`): The new text content to display.

### `computeDimensions()`

Calculates the dimensions (width and height) of the node based on its text content and current font size. It uses the `getTextBounds` utility function to accurately measure the text. This method also updates the font size of the internal `textElement`.

-   **Overrides**: `omdNode.computeDimensions()`.

### `updateLayout()`

Updates the position of the node's internal text element to center it within the node's bounding box. This method primarily calls the internal `updateTextPosition()`.

-   **Overrides**: `omdNode.updateLayout()`.

## Internal Methods

-   **`createTextElement(text)`**: Creates and initializes a `jsvgTextLine` element with the given text. It sets the text anchor to `'middle'` and dominant baseline to `'middle'` for proper centering, and adds it as a child of this node.
    -   **Returns**: `jsvgTextLine` - The created text element.
-   **`updateTextPosition()`**: Positions the `textElement` at the center of the node's calculated width and height.

## Example

```javascript
// omdLeafNode is an abstract class—use concrete subclasses
import { omdConstantNode } from './omdConstantNode.js';
import { omdVariableNode } from './omdVariableNode.js';
import { omdOperatorNode } from './omdOperatorNode.js';

const constant = new omdConstantNode({ value: 5 });
const variable = new omdVariableNode({ name: 'x' });
const operator = new omdOperatorNode({ op: '+' });

// All leaf nodes handle text rendering and layout similarly
constant.initialize(); // Computes dimensions and layout
variable.initialize();
operator.initialize();

// You can then add these to an omdDisplay or other container
```

## See Also

Concrete implementations:

-   [`omdConstantNode`](./omdConstantNode.md) - For numeric values.
-   [`omdVariableNode`](./omdVariableNode.md) - For variables.
-   [`omdOperatorNode`](./omdOperatorNode.md) - For operators.
-   [`omdGroupNode`](./omdGroupNode.md) - For grouping symbols.

Base class:

-   [`omdNode`](./omdNode.md) - The fundamental base class for all OMD nodes.