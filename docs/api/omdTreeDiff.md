# omdTreeDiff

Implements a robust tree differencing algorithm to identify changes between two `omdNode` expression trees. This module is crucial for `omdStepVisualizerHighlighting`, providing precise visual feedback on how mathematical expressions transform from one step to the next.

## Algorithm Overview

`omdTreeDiff` uses a multi-stage approach to compare two expression trees (`oldEquation` and `newEquation`):

1.  **Special Cases**: It first attempts to identify common pedagogical patterns (like adding/subtracting the same value from both sides, or simple identity/double negative simplifications). If found, these specific changes are highlighted directly.
2.  **Optimal Subtree Matching**: If no special cases apply, it proceeds to find the largest, non-overlapping set of matched subtrees between the old and new expressions. A match can be either structurally identical or semantically equivalent (e.g., `2+3` and `5`).
3.  **Identify Changes**: Any parts of the `newEquation` that are *not* part of these optimal matches are considered the actual changes and are returned for highlighting.
4.  **Educational Mode**: When enabled, the algorithm includes additional heuristics to highlight subtle simplifications that might not involve a direct structural change but are important for understanding the transformation (e.g., removing `+ 0`).

## Class Definition

```javascript
export class omdTreeDiff
```

This class is not meant to be instantiated. All its methods are static.

## Static Methods

### `findChangedNodes(oldEquation, newEquation, options)`

Main entry point for the tree differencing algorithm. Compares two `omdEquationNode` instances (or any `omdNode` subtrees) and returns a list of nodes in the `newEquation` that have changed or are new.

-   **`oldEquation`** (`omdNode`): The root node of the previous expression tree.
-   **`newEquation`** (`omdNode`): The root node of the current expression tree.
-   **`options`** (`object`, optional): Configuration options:
    -   `educationalMode` (`boolean`): If `true`, the diff algorithm will also highlight mathematically neutral changes that are pedagogically significant (e.g., removing `+ 0`). Default: `false`.
-   **Returns**: `Array<omdNode>` - An array of `omdNode` instances from `newEquation` that should be highlighted.

### `findEquationSpecialCases(oldEquation, newEquation)`

Identifies specific equation-level transformation patterns, such as adding/subtracting the same operation to both sides of an equation. This allows for more intuitive highlighting in common step-by-step solution scenarios.

-   **`oldEquation`** (`omdEquationNode`): The previous equation.
-   **`newEquation`** (`omdEquationNode`): The current equation.
-   **Returns**: `Array<omdNode>` - An array of nodes to highlight for these special cases, or an empty array if no such pattern is found.

### `diffSubtrees(oldTree, newTree, educationalMode)`

Core recursive differencing method. It first checks for various pedagogical highlighting patterns (common prefix, variable preservation, type differences, subtraction patterns). If none apply, it falls back to finding an optimal matching between subtrees of the `oldTree` and `newTree`. Nodes in `newTree` that do not have a match in `oldTree` are considered changed.

-   **`oldTree`** (`omdNode`): The root of the old subtree.
-   **`newTree`** (`omdNode`): The root of the new subtree.
-   **`educationalMode`** (`boolean`): Same as in `findChangedNodes`.
-   **Returns**: `Array<omdNode>` - An array of unmatched leaf nodes in `newTree`.

### `findEducationalHighlights(oldTree, newTree, optimalMatches)`

When `educationalMode` is enabled, this method identifies additional nodes to highlight for pedagogical reasons, even if they don't represent a structural change. This includes cases like the removal of additive/multiplicative identities or double negations.

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **`optimalMatches`** (`Array`): The list of optimally matched subtrees.
-   **Returns**: `Array<omdNode>` - Additional nodes to highlight.

### `findAdditiveIdentityChanges(oldTree, newTree)`

Identifies changes related to the removal of additive identities (e.g., `+ 0` or `- 0`).

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<omdNode>` - Nodes to highlight for additive identity changes.

### `findMultiplicativeIdentityChanges(oldTree, newTree)`

Identifies changes related to the removal of multiplicative identities (e.g., `* 1` or `/ 1`).

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<omdNode>` - Nodes to highlight for multiplicative identity changes.

### `findDoubleNegativeChanges(oldTree, newTree)`

Identifies changes related to the simplification of double negatives (e.g., `--x` to `x`).

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<omdNode>` - Nodes to highlight for double negative removal.

### `findCommonPrefixHighlights(oldTree, newTree)`

Identifies highlighting patterns based on common prefixes between the string representations of the old and new trees. For example, if `"2x + 4"` becomes `"2x + 4 - 4"`, it highlights only the `"- 4"` part.

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<omdNode>` - Nodes to highlight for common prefix patterns.

### `findVariablePreservationHighlights(oldTree, newTree)`

Identifies highlighting patterns where a variable term remains the same but associated constants change. For example, `"2x + 4"` becoming `"2x + 2"` should highlight only the changed constant.

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<omdNode>` - Nodes to highlight for variable preservation patterns.

### `findTypeDifferenceHighlights(oldTree, newTree)`

Identifies highlighting patterns where the type of an expression changes significantly (e.g., a constant becoming a binary expression). In such cases, it highlights the new expression.

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<omdNode>` - Nodes to highlight for type difference patterns.

### `findSubtractionPatternHighlights(oldTree, newTree)`

Identifies highlighting patterns specific to subtraction, where the old tree matches the left side of a new subtraction. For example, `"x + 2"` becoming `"x + 2 - 2"` should highlight only the `"- 2"` part.

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<omdNode>` - Nodes to highlight for subtraction patterns.

### `findAllSubtreeMatches(oldTree, newTree)`

Generates all possible subtree matches between two expression trees. A match is determined by structural or string equivalence.

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`newTree`** (`omdNode`): The new expression tree.
-   **Returns**: `Array<object>` - An array of match objects, each containing `oldNode`, `newNode`, `size`, `score`, and `type` of match.

### `selectOptimalMatching(matches)`

Given a list of all possible subtree matches, this method selects the optimal, non-overlapping set of matches. It uses a greedy approach, prioritizing larger and higher-scoring matches.

-   **`matches`** (`Array<object>`): The array of potential matches from `findAllSubtreeMatches`.
-   **Returns**: `Array<object>` - The selected optimal matches.

### `findUnmatchedLeafNodes(newTree, matches)`

Identifies all leaf nodes in the `newTree` that are not covered by any of the `optimalMatches`. These are the nodes that represent the actual changes.

-   **`newTree`** (`omdNode`): The new expression tree.
-   **`matches`** (`Array<object>`): The array of selected optimal matches.
-   **Returns**: `Array<omdNode>` - An array of unmatched leaf nodes.

### `findUnmatchedOldNodes(oldTree, matches)`

Finds leaf nodes in the `oldTree` that are not covered by any match. These represent nodes that were removed or transformed.

-   **`oldTree`** (`omdNode`): The old expression tree.
-   **`matches`** (`Array<object>`): The array of selected optimal matches.
-   **Returns**: `Array<omdNode>` - An array of unmatched leaf nodes from the old tree.

## Internal Helper Methods

-   **`_findCommonPrefix(str1, str2)`**: Finds the longest common string prefix between two strings.
-   **`getAllSubtrees(root)`**: Recursively collects all subtrees from a given root node.
-   **`calculateSimilarity(tree1, tree2)`**: Determines the similarity score between two subtrees, considering structural and string equivalence.
-   **`treesStructurallyEqual(tree1, tree2)`**: Checks for exact structural equality between two subtrees.
-   **`getSubtreeSize(root)`**: Calculates the number of nodes in a subtree.
-   **`hasNodeOverlap(node, usedNodes)`**: Checks if a node or any of its descendants overlap with a set of already used nodes.
-   **`markSubtreeAsUsed(root, usedNodes)`**: Marks all nodes in a subtree as used by adding them to a `Set`.
-   **`debugPrintTree(node, depth)`**: A utility function for debugging that prints the structure of an `omdNode` tree to the console.

## How it Works

See the Algorithm Overview above for a summary of the process. The class is designed for internal use by step visualizer components.

### Example

This class is typically used internally by `omdStepVisualizerHighlighting`:

```javascript
// Example of internal usage within omdStepVisualizerHighlighting:
// const changedNodes = omdTreeDiff.findChangedNodes(previousEquation, currentEquation, { educationalMode: true });
// changedNodes.forEach(node => node.setExplainHighlight(true));
```