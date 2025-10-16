# Simplification Utilities

This module provides a collection of helper functions that are used throughout the simplification engine and rules. These utilities handle common tasks like creating nodes, manipulating expression trees, and formatting output.

## Core Functions

#### `gcd(a, b)`
- Calculates the greatest common divisor of two numbers.

#### `createConstantNode(value, fontSize)`
- Creates a new, fully initialized `omdConstantNode`.

#### `createRationalNode(numerator, denominator, fontSize)`
- Creates a new, fully initialized `omdRationalNode`, handling negative numerators and cases where the denominator is 1.

#### `nodeToString(node)`
- A robust function that converts any `omdNode` into a human-readable string, handling different node types and formatting them correctly.

## Expression Tree Manipulation

#### `flattenSum(node, terms)`
- A key utility that takes a nested tree of additions and subtractions (e.g., `a - (b + c)`) and flattens it into a linear list of terms, each with an associated sign.
- **Parameters:**
  - `node`: The root of the expression to flatten.
  - `terms`: An array that will be populated with the term objects (`{ node, sign }`).

#### `buildSumTree(terms, fontSize)`
- The counterpart to `flattenSum`. It takes a list of terms (like the one produced by `flattenSum`) and reconstructs a valid, balanced `omdBinaryExpressionNode` tree from them.

#### `_replaceNodeInTree(oldNode, newNode, currentRoot)`
- An internal helper that safely replaces a node within the larger expression tree, handling parent-child connections and ensuring the tree remains valid.

## Polynomial and Monomial Helpers

#### `expandPolynomialPower(terms, exponent, fontSize)`
- Expands a polynomial raised to a power (e.g., `(a+b)^2`). It uses more specific helpers for common cases.

#### `expandBinomialSquare(terms, fontSize)`
- Expands `(a+b+...)^2`.

#### `expandBinomialCube(terms, fontSize)`
- Expands `(a+b)^3`.

#### `expandBinomialFourth(terms, fontSize)`
- Expands `(a+b)^4`.

#### `multiplyTermArrays(terms1, terms2, fontSize)`
- Performs polynomial multiplication by multiplying each term from the first array by each term from the second.

## Provenance Helpers

#### `extractLeafNodes(node)`
- Traverses an expression and returns an array of all its leaf nodes (constants and variables). This is used for detailed provenance tracking.

#### `extractMonomialProvenance(termNode)`
- A specialized function that separates the leaf nodes of a monomial into `coefficientNodes` and `variableNodes` for highly granular highlighting.

#### `createMonomialWithGranularProvenance(...)`
- Creates a monomial while assigning separate provenance chains to its coefficient and variable parts.

### See Also

- [`omdSimplification`](./omdSimplification.md)
- [`simplificationRules`](./simplificationRules.md)
