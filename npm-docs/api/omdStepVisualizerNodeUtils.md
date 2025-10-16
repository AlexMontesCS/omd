# omdStepVisualizerNodeUtils

This module provides a collection of utility functions specifically designed to assist with node operations and analysis within the context of step visualizations, particularly for identifying and extracting information from `omdNode` instances.

## Class: `omdStepVisualizerNodeUtils`

This class is not meant to be instantiated. All its methods are static.

### Static Methods

#### `isLeafNode(node)`

Checks if a given `omdNode` is a leaf node (e.g., `omdConstantNode`, `omdVariableNode`, `omdOperatorNode`).

- **Parameters:**
  - `node` {omdNode} - The node to check.
- **Returns:** {boolean} `true` if the node is a leaf node, `false` otherwise.

---

#### `isBinaryNode(node)`

Checks if a given `omdNode` is an `omdBinaryExpressionNode` and has both `left` and `right` children.

- **Parameters:**
  - `node` {omdNode} - The node to check.
- **Returns:** {boolean} `true` if it's a binary node, `false` otherwise.

---

#### `isUnaryNode(node)`

Checks if a given `omdNode` is an `omdUnaryExpressionNode` and has an `argument` child.

- **Parameters:**
  - `node` {omdNode} - The node to check.
- **Returns:** {boolean} `true` if it's a unary node, `false` otherwise.

---

#### `hasExpression(node)`

Checks if a given `omdNode` has an `expression` property (common in nodes like `omdParenthesisNode`).

- **Parameters:**
  - `node` {omdNode} - The node to check.
- **Returns:** {boolean} `true` if it has an expression property, `false` otherwise.

---

#### `getNodeValue(node)`

Attempts to retrieve a string representation of the node's value. This is particularly useful for leaf nodes (constants, variables) but can also provide a string for more complex nodes.

- **Parameters:**
  - `node` {omdNode} - The node to get the value from.
- **Returns:** {string} The string representation of the node's value.

---

#### `findLeafNodes(node)`

Recursively finds all leaf nodes within the subtree rooted at the given node.

- **Parameters:**
  - `node` {omdNode} - The root node to start the search from.
- **Returns:** {Array<omdNode>} An array of `omdNode` instances that are leaf nodes.

---

#### `findVariableNodes(node)`

Finds all `omdVariableNode` instances within the subtree rooted at the given node.

- **Parameters:**
  - `node` {omdNode} - The root node to start the search from.
- **Returns:** {Array<omdVariableNode>} An array of `omdVariableNode` instances.

---

#### `findConstantNodes(node)`

Finds all `omdConstantNode` instances within the subtree rooted at the given node.

- **Parameters:**
  - `node` {omdNode} - The root node to start the search from.
- **Returns:** {Array<omdConstantNode>} An array of `omdConstantNode` instances.

---

#### `findLeafNodesWithValue(node, value)`

Finds leaf nodes within a subtree that match a specific string `value`. It performs exact matches first, then numeric matches for constants, and finally partial string matches.

- **Parameters:**
  - `node` {omdNode} - The root node to start the search from.
  - `value` {string} - The value to search for.
- **Returns:** {Array<omdNode>} An array of matching leaf nodes.

---

#### `findAllNodes(node)`

Recursively finds all `omdNode` instances (including non-leaf nodes) within the subtree rooted at the given node.

- **Parameters:**
  - `node` {omdNode} - The root node to start the search from.
- **Returns:** {Array<omdNode>} An array of all `omdNode` instances in the tree.

---

#### `findRightmostNodeWithValue(node, value)`

Finds the rightmost leaf node within a subtree that matches a specific `value`. It has special handling for nodes that are the right operand of a subtraction.

- **Parameters:**
  - `node` {omdNode} - The root node to start the search from.
  - `value` {string} - The value to search for.
- **Returns:** {omdNode | null} The rightmost matching leaf node, or `null` if not found.

### Example

```javascript
import { omdStepVisualizerNodeUtils } from './omd/utils/omdStepVisualizerNodeUtils.js';
import { omdEquationNode } from './omd/nodes/omdEquationNode.js';

const equation = omdEquationNode.fromString('2x + 3 = 7');

// Find all leaf nodes
const leafNodes = omdStepVisualizerNodeUtils.findLeafNodes(equation);
console.log(leafNodes.map(node => node.toString())); // Output: ['2', 'x', '3', '7']

// Find all constant nodes
const constantNodes = omdStepVisualizerNodeUtils.findConstantNodes(equation);
console.log(constantNodes.map(node => node.getValue())); // Output: [2, 3, 7]

// Get the value of a specific node
const firstLeaf = leafNodes[0];
console.log(omdStepVisualizerNodeUtils.getNodeValue(firstLeaf)); // Output: '2'
```
