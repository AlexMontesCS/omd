# SimplificationEngine

The `SimplificationEngine` is a static class that provides a collection of helper methods for creating, matching, and transforming expression nodes. It forms the backbone of the simplification rule system.

## Overview

The engine is not instantiated. Instead, its static methods are used directly by the simplification rules to perform their logic. The methods can be grouped into several categories:

- **Node Creation:** Helpers to build new `omdNode` instances (e.g., `createConstant`, `createBinaryOp`).
- **Pattern Matching:** Helpers to check if a node matches a specific structure or value (e.g., `isBinaryOp`, `isConstantValue`).
- **Monomial Helpers:** Specialized functions for working with monomials (terms like `2x^2`), which are essential for rules like combining like terms.
- **Rule Definition:** The `SimplificationRule` inner class, which defines the structure for all simplification rules.

## Node Creation Helpers

These methods simplify the process of creating new nodes, often by abstracting away the underlying AST structure.

#### `createConstant(value, fontSize)`
- Creates an `omdConstantNode`.

#### `createBinaryOp(left, operator, right, ...)`
- Creates an `omdBinaryExpressionNode` for operations like 'add', 'subtract', etc.

#### `createMultiplication(leftConstantNode, rightNode, ...)`
- A specialized version of `createBinaryOp` for multiplication.

#### `createRational(numerator, denominator, fontSize)`
- Creates an `omdRationalNode` (a fraction).

#### `createMonomial(coefficient, variable, power, ...)`
- Constructs a complete monomial term (e.g., `2x^3`) from its constituent parts.

## Pattern Matching Helpers

These methods are used within the `match` function of a simplification rule to determine if the rule applies to a given node.

#### `isType(node, typeName)`
- Checks if a node is an instance of a specific class (e.g., `'omdConstantNode'`).

#### `isBinaryOp(node, operator)`
- Checks if a node is a binary operation, optionally matching a specific operator (e.g., `'add'`).

#### `isConstantValue(node, value)`
- Checks if a node is a constant, optionally matching a specific value.

#### `hasConstantOperand(node)`
- For a binary operation, checks if one of its operands is a constant and returns both the constant and the other operand.

#### `unwrapParentheses(node)`
- If the given node is an `omdParenthesisNode`, it returns the inner expression; otherwise, it returns the node itself.

## Monomial and Like Terms Helpers

#### `isMonomial(node)`
- A powerful helper that checks if a node represents a monomial (e.g., `x`, `2x`, `-5x^2`).
- **Returns:** An object with `{ coefficient, variable, power, ... }` if it is a monomial, otherwise `null`.

#### `areLikeTerms(monomial1, monomial2)`
- Compares the output of two `isMonomial` calls to see if they have the same variable and power.

## `SimplificationRule` Class

This is an inner class of `SimplificationEngine` that provides the blueprint for all simplification rules.

### Constructor

`new SimplificationRule(name, matchFn, transformFn, messageFn, type)`

- `name` {string}: The name of the rule (e.g., "Combine Constants").
- `matchFn` {function}: A function that takes a node and returns `true` or a data object if the rule applies, `false` otherwise.
- `transformFn` {function}: A function that takes the matched node and the data from `matchFn` and returns a new, transformed node.
- `messageFn` {function} (optional): A function to generate a user-friendly description of the change.

### Key Methods

- `canApply(node)`: Executes the `matchFn`.
- `apply(node, ruleData, currentRoot)`: Executes the `transformFn` and handles replacing the old node with the new one in the expression tree.

## Rule Factory Functions

These are static methods on `SimplificationEngine` that create common types of rules.

#### `createRule(...)`
- The base factory function for creating a `SimplificationRule` instance.

#### `createConstantFoldRule(name, operator)`
- Creates a rule that evaluates binary operations on two constants (e.g., `2 + 3` -> `5`).

#### `createIdentityRule(name, operator, identityValue, side)`
- Creates a rule for identity operations (e.g., `x + 0` -> `x` or `y * 1` -> `y`).

#### `createZeroMultiplicationRule()`
- Creates the rule for `x * 0` -> `0`.

### See Also

- [`omdSimplification`](./omdSimplification.md): The top-level module that uses the engine.
- [`simplificationRules`](./simplificationRules.md): The module where specific rules are defined using the engine's helpers.