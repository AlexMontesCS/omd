# omdNode

The abstract base class for all nodes in the mathematical expression tree. It provides the core functionality for tree structure (parent-child relationships), layout calculations, rendering, and provenance tracking. All specific mathematical elements (constants, variables, operators, functions, equations) extend this class.

## Class Definition

```javascript
export class omdNode extends omdMetaExpression
```

This class is not meant to be instantiated directly. Instead, you should use one of its concrete subclasses (e.g., `omdConstantNode`, `omdBinaryExpressionNode`).

### Key Concepts

-   **AST (Abstract Syntax Tree):** Each `omdNode` is typically created from a node in the math.js AST, providing a structured representation of the mathematical expression.
-   **Tree Structure:** Nodes are organized in a hierarchical tree with `parent` and `childList` properties, enabling traversal and manipulation of the expression.
-   **Layout:** The `computeDimensions()` and `updateLayout()` methods are fundamental for determining the size and position of a node and its children, ensuring correct visual rendering.
-   **Provenance:** The `provenance` array on each node tracks its history. When a node is cloned (e.g., during a simplification step), the new node's provenance array will contain the ID of the original node, creating a traceable link back to its predecessor. This is crucial for features like step-by-step explanations and highlighting.

## Public Properties

-   **`id`** (`number`): A unique identifier for each node instance, automatically assigned upon creation.
-   **`type`** (`string`): A string indicating the specific type of the OMD node (e.g., `"omdConstantNode"`, `"omdBinaryExpressionNode"`).
-   **`parent`** (`omdNode` | `null`): A reference to the parent node in the expression tree. `null` for the root node.
-   **`astNodeData`** (`object`): The original math.js AST node from which this `omdNode` was created. This preserves the raw parsed data.
-   **`provenance`** (`Array<number>`): An array of IDs from which this node was derived. This forms a historical chain, linking a node back through transformations or simplifications.
-   **`argumentNodeList`** (`object`): A map (or object) containing references to the node's structurally significant children (e.g., `left`, `right` for binary expressions, `args` for functions). This is used for recursive operations and provenance tracking.
-   **`isExplainHighlighted`** (`boolean`): A flag indicating if the node is currently highlighted for explanation purposes. This acts as a lock, preventing other highlights from overriding it.
-   **`x`** (`number`): The x-coordinate of the node's top-left corner relative to its parent.
-   **`y`** (`number`): The y-coordinate of the node's top-left corner relative to its parent.
-   **`width`** (`number`): The calculated width of the node's bounding box.
-   **`height`** (`number`): The calculated height of the node's bounding box.
-   **`fontSize`** (`number`): The base font size applied to this node and its children.
-   **`svgElement`** (`SVGElement`): The root SVG element that represents this node visually.

## Public Methods

### `initialize()`

Initializes the node by recursively computing its dimensions and updating its layout. This method should be called after a node and its children have been fully constructed to ensure proper sizing and positioning.

### `clone()`

Creates a deep, structural clone of the node. The new node will have a new `id`, and its `provenance` will link back to the original node's `id`, establishing a historical connection.

-   **Returns**: `omdNode` - A new instance of the same type as the original, with all children also cloned.

### `replaceWith(newNode, options)`

Replaces this node with a `newNode` in the expression tree. This updates all parent and child references and triggers a re-layout and re-rendering of the affected parts of the SVG.

-   **`newNode`** (`omdNode`): The node to substitute in.
-   **`options`** (`object`, optional): Configuration for the replacement.
    -   `updateLayout` (`boolean`): If `true` (default), the layout of the entire tree will be recalculated upwards from the point of replacement.
-   **Returns**: `boolean` - `true` if the replacement was successful.

### `simplify()`

Asynchronously attempts to simplify the expression rooted at this node by invoking the central simplification engine (`simplifyStep`).

-   **Returns**: `Promise<object>` - A promise that resolves to an object like `{ success, foldedCount, newRoot, message }`. Throws an error if the `simplifyStep` function is not set.

### `toMathJSNode()`

Converts the `omdNode` and its children back into a math.js-compatible AST object. This method must be implemented by all concrete subclasses.

-   **Returns**: `object` - The math.js AST node.
-   **Throws**: `Error` if not implemented by the subclass.

### `toString()`

Converts the node into a human-readable string representation. It typically uses the `toMathJSNode()` method internally to leverage math.js's string conversion capabilities.

-   **Returns**: `string`.

### `render()`

Generates or retrieves the SVG representation of the node. This method calls `renderSelf()` if the SVG element has not been created yet.

-   **Returns**: `SVGElement` - The root SVG element representing this node.

### `renderSelf()`

Abstract method that must be implemented by subclasses. This method is responsible for creating the specific SVG elements and structure for the node's visual representation.

-   **Returns**: `SVGElement` - The SVG element created for this node.
-   **Throws**: `Error` if not implemented by the subclass.

### `setFontSize(size)`

Sets the base font size for this node and recursively propagates the new font size to all its children.

-   **`size`** (`number`): The font size in pixels.

### `moveTo(x, y)`

Moves the node to a new absolute position (`x`, `y`) relative to its parent. It also recursively moves all children by the same delta.

-   **`x`** (`number`): The new x-coordinate.
-   **`y`** (`number`): The new y-coordinate.

### `show()`

Makes the node and its SVG representation visible.

### `hide()`

Hides the node and its SVG representation.

### `getDepth()`

Calculates the depth of the node in the expression tree (0 for the root node).

-   **Returns**: `number` - The depth of the node.

### `findParentOfType(type)`

Traverses up the tree to find the nearest parent node of a specific type.

-   **`type`** (`string`): The `type` property of the node to search for (e.g., `"omdEquationNode"`).
-   **Returns**: `omdNode` | `null` - The found parent node or `null` if not found.

### `validateProvenance(nodeMap)`

Validates the provenance integrity of this node and all its descendants. It checks for duplicate IDs, invalid references, and self-references in the `provenance` arrays.

-   **`nodeMap`** (`Map`, optional): An optional map of all known nodes in the system, used for cross-referencing provenance IDs.
-   **Returns**: `Array<object>` - An array of validation issues found, each describing the type of issue, the node involved, and relevant IDs.

### `setHighlight(highlightOn, color)`

Applies or removes a highlight from the node's background. If `isExplainHighlighted` is `true`, this method will not override the existing explanation highlight.

-   **`highlightOn`** (`boolean`): `true` to highlight, `false` to remove.
-   **`color`** (`string`, optional): The color of the highlight. Defaults to `omdColor.highlightColor`.

### `lowlight()`

Reduces the opacity of the node's background. Similar to `setHighlight`, it respects the `isExplainHighlighted` lock.

### `setFillColor(color)`

Sets the fill color of the node's background rectangle. This method also respects the `isExplainHighlighted` lock.

## Abstract Methods (to be implemented by subclasses)

-   **`computeDimensions()`**: Calculates the `width` and `height` of the node based on its content and children. Provides a default empty implementation.
-   **`updateLayout()`**: Positions the node's children relative to itself. Provides a default empty implementation.
-   **`getAlignmentBaseline()`**: Returns the vertical y-coordinate within the node's bounding box that should be used for alignment with its siblings. By default, this is the vertical center (`this.height / 2`).
-   **`isConstant()`**: Determines if the node represents a constant numerical value. Returns `false` by default.
-   **`getValue()`**: Retrieves the numerical value of a constant node. Throws an error if the node is not constant.
-   **`getRationalValue()`**: Retrieves the rational value of a constant node as a numerator/denominator pair. Throws an error if the node is not a constant rational expression.

## Internal Methods

-   **`_syncProvenanceFrom(originalNode)`**: Recursively walks a cloned node tree and sets the provenance of each node to point back to the corresponding node in the original tree. This is a crucial part of maintaining the provenance chain during cloning operations.
-   **`replaceNodeInParent(newNode)`**: Helper method used by `replaceWith` to update specific references to this node within its parent's `argumentNodeList` and other properties.
-   **`updateSvg(newNode)`**: Helper method used by `replaceWith` to perform the actual DOM manipulation (replacing SVG elements).
-   **`updateLayoutUpwards()`**: Traverses up the tree from this node's parent to re-calculate dimensions and layouts for all ancestors, ensuring the entire affected tree is correctly rendered after a change.
-   **`_validateStepsProvenance(issues)`**: Helper for `validateProvenance` to check provenance within steps.
-   **`_findOrphanedNodes(issues)`**: Helper for `validateProvenance` to find nodes in the `nodeMap` that are no longer part of the active tree.
-   **`_collectAllProvenanceIds(newNodeMap)`**: Collects all provenance IDs from nodes in a given map.
-   **`_collectNodeProvenanceIds(node, referencedIds, processedNodes)`**: Recursively collects provenance IDs for a single node.
-   **`_preserveReferencedNodes(referencedIds, newNodeMap)`**: Ensures that historical nodes referenced in provenance chains are kept in the `nodeMap`.
-   **`_preserveNodeAndContext(id, newNodeMap, processedIds)`**: Preserves a historical node and its relevant parent/sibling context.
-   **`_preserveParentContext(node, newNodeMap)`**: Preserves the parent nodes of a historical node.
-   **`_preserveSiblingContext(node, newNodeMap)`**: Preserves the sibling nodes of a historical node.

## Example

```javascript
// omdNode is an abstract class - use concrete subclasses
import { omdConstantNode } from './omdConstantNode.js';
import { omdBinaryExpressionNode } from './omdBinaryExpressionNode.js';
import { omdDisplay } from '../display/omdDisplay.js';

// Create a simple expression tree
const two = new omdConstantNode({ value: 2 });
const x = new omdVariableNode({ name: 'x' });
const twoX = new omdBinaryExpressionNode({
    type: 'OperatorNode', op: '*', fn: 'multiply',
    args: [two.astNodeData, x.astNodeData],
    implicit: true
});

// Initialize the root node (this will recursively initialize children)
twoX.initialize();

// Render it using omdDisplay
const container = document.getElementById('math-container');
const display = new omdDisplay(container);
display.render(twoX);

console.log(twoX.toString()); // Output: 2x
```

## See Also

-   [`omdLeafNode`](./omdLeafNode.md) - The base class for nodes with no children (constants, variables, operators).
-   [`omdBinaryExpressionNode`](./omdBinaryExpressionNode.md) - For nodes with two children (e.g., addition, subtraction, multiplication).
-   [`omdFunctionNode`](./omdFunctionNode.md) - For function calls (e.g., `sin(x)`).
-   [`omdEquationNode`](./omdEquationNode.md) - For representing mathematical equations.