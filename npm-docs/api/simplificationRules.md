# Simplification Rules

This module defines the specific simplification rules used by the `SimplificationEngine`. The rules are organized into an object, keyed by the `omdNode` type they apply to.

## Rule Structure

Each rule is an instance of `SimplificationEngine.SimplificationRule` and has three main parts:

1.  **`match` function:** Determines if the rule can be applied to a given node.
2.  **`transform` function:** Executes the simplification and returns a new, transformed node.
3.  **`message` function:** Generates a human-readable description of the transformation.

## Available Rules

The `rules` object contains arrays of rules for each of the following node types:

### `binary` (for `omdBinaryExpressionNode`)

- **Same Term Cancellation:** `a - a` simplifies to `0`.
- **Opposite Term Cancellation:** `a + (-a)` simplifies to `0`.
- **Cancel Constants in Sums:** `x + 2 - 2` simplifies to `x + 0`.
- **Constant Folding:** Evaluates operations on constants (e.g., `2 + 3` -> `5`). Includes rules for `add`, `subtract`, `multiply`, and `divide`.
- **Identity Operations:** Simplifies operations with identity elements (e.g., `x + 0` -> `x`, `y * 1` -> `y`).
- **Zero Multiplication:** `x * 0` simplifies to `0`.
- **Combine Coefficients:** `2 * 3x` simplifies to `6x`.
- **Distributive Property:** `2 * (x + 3)` expands to `2x + 6`.
- **Expand Polynomial Multiplication:** `(x + 2)(x + 3)` expands to `x^2 + 5x + 6`.
- **Multiply Monomials:** `2x * 3x` simplifies to `6x^2`.
- **Combine Like Factors:** `x * x` simplifies to `x^2`.
- **Combine Multiple Constants in Sums:** `x + 2 + 3` simplifies to `x + 5`.
- **Combine Like Terms:** `2x + 3x` simplifies to `5x`.

### `rational` (for `omdRationalNode`)

- **Variable Self Division:** `x / x` simplifies to `1`.
- **Power Base Division:** `x^n / x` simplifies to `x^(n-1)`.
- **Monomial Variable Division:** `cx / x` simplifies to `c`.
- **Simplify Fraction:** Reduces constant fractions to their simplest form (e.g., `6/8` -> `3/4`).
- **Simplify Multiplication in Rational:** `(4x)/3` restructures to `(4/3) * x`.
- **Simplify Rational Division:** `(4x + 6) / 2` distributes the division to `2x + 3`.

### `parenthesis` (for `omdParenthesisNode`)

- **Remove Redundant Parentheses:** `((x))` simplifies to `(x)`.

### `unary` (for `omdUnaryExpressionNode`)

- **Simplify Double Negation:** `-(-x)` simplifies to `x`.
- **Remove Unary Plus:** `+x` simplifies to `x`.

### `power` (for `omdPowerNode`)

- **Calculate Powers:** Evaluates constant powers (e.g., `2^3` -> `8`).
- **Power of Zero:** `x^0` simplifies to `1`.
- **Power of One:** `x^1` simplifies to `x`.
- **Expand Polynomial Power:** `(x - 2)^2` expands to `x^2 - 4x + 4`.
- **Square of Square Root:** `(sqrt(x))^2` simplifies to `x`.
- **Fractional Exponent to Square Root:** `x^(1/2)` converts to `sqrt(x)`.

### `sqrt` (for `omdSqrtNode`)

- **Simplify Square Root of Constant:** `sqrt(9)` simplifies to `3`.
- **Square Root of Square:** `sqrt(x^2)` simplifies to `x` (assuming `x >= 0`).

### `function` (for `omdFunctionNode`)

- **Function Inverse Simplification:** `sin(arcsin(x))` simplifies to `x`.
- **Function to Sqrt Node:** Converts `sqrt(x)` from a function representation to the dedicated `omdSqrtNode`.

## Rule Lookup

The `getRulesForNode(node)` function is used by the simplification engine to retrieve the appropriate list of rules for a given node based on its type.

### See Also

- [`omdSimplification`](./omdSimplification.md): The top-level module that uses these rules.
- [`SimplificationEngine`](./simplificationEngine.md): The engine that provides the helpers to create and apply these rules.