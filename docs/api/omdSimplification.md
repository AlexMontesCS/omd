# omdSimplification

This module provides the core logic for simplifying mathematical expression trees within the OMD library. It defines functions for applying simplification rules, finding opportunities for simplification, and managing the simplification process.

## Functions

### `simplifyExpression(rootNode)`

Simplifies an entire mathematical expression tree by repeatedly applying simplification rules until no further simplifications are possible or a maximum iteration limit is reached. This function ensures that the resulting expression is in its most simplified form.

-   **`rootNode`** (`omdNode`): The root node of the expression tree to simplify.
-   **Returns**: `{ foldedCount: number, newRoot: omdNode }`
    -   `foldedCount`: The total number of individual simplifications applied across all iterations.
    -   `newRoot`: The simplified expression tree. This is a fresh clone of the final simplified state, with its font size preserved from the original `rootNode`.

**Notes:**

-   A maximum of `50` iterations is performed to prevent potential infinite loops.
-   Handles errors gracefully; if an error occurs during simplification, the original node is returned.

### `simplifyStep(rootNode)`

Applies a single simplification step to the expression tree. This function finds the first applicable simplification rule and applies it, returning the result.

-   **`rootNode`** (`omdNode`): The root node of the expression to simplify.
-   **Returns**: `{ foldedCount: number, newRoot: omdNode, historyEntry: object | null }`
    -   `foldedCount`: `1` if a simplification was applied, `0` otherwise.
    -   `newRoot`: The expression tree after applying the single step. This will be a new `omdNode` instance if a simplification occurred.
    -   `historyEntry`: An object describing the applied simplification (e.g., rule name, affected nodes, message), or `null` if no simplification was applied.

**Notes:**

-   Only the first matching rule found is applied in a single step.
-   Preserves the font size from the original node.
-   Handles errors gracefully; if an error occurs during rule application, the original node is returned.

### `findSimplificationOpportunities(rootNode)`

Traverses the expression tree (depth-first) to find all possible simplification opportunities. It identifies nodes where a simplification rule can be applied.

-   **`rootNode`** (`omdNode`): The root node of the expression tree to search.
-   **Returns**: `Array<{ node: omdNode, rule: object, ruleData: object }>` - An array of objects, where each object represents a simplification opportunity:
    -   `node`: The `omdNode` instance where a rule can be applied.
    -   `rule`: The simplification rule object that can be applied.
    -   `ruleData`: Data needed by the rule's `apply` method.

**Notes:**

-   Uses a `visitedNodes` set to prevent infinite loops in cyclic graphs (though expression trees are typically acyclic).
-   Only checks rules relevant to each node type, optimizing performance.
-   For each node, it stops after finding the first applicable rule.

### `getAvailableRulesForNode(node)`

**Debug Function:** Lists all simplification rules that are potentially relevant to a given `omdNode`'s type, regardless of whether they can currently be applied.

-   **`node`** (`omdNode`): The node to check.
-   **Returns**: `Array<string>` - An array of rule names.

### `getApplicableRulesForNode(node)`

**Debug Function:** Lists simplification rules that can actually be applied to a given `omdNode` based on its current structure and values.

-   **`node`** (`omdNode`): The node to check.
-   **Returns**: `Array<string>` - An array of applicable rule names.

**Notes:**

-   Handles errors gracefully by skipping rule checks that might fail.

## Integration with `omdNode`

This module also sets the `simplifyStep` function as the global simplification handler for `omdNode` instances. This allows any `omdNode` to call its `simplify()` method, which will internally use the `simplifyStep` function defined here.

## See Also

-   [`Simplification Rules`](./simplificationRules.md) - Details the individual simplification rules.
-   [`Simplification Engine`](./simplificationEngine.md) - (If applicable, for higher-level orchestration).
-   [`Configuration Options`](./configuration-options.md) - For configuring simplification behavior.