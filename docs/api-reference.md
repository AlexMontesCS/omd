# OMD Library API Reference

> This is the complete API reference for the OMD (On-screen Math Display) library. Use the table of contents below to navigate to the detailed documentation for each module and class.

---

## Table of Contents

The API is organized into the following categories for clarity:

| Category                | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| **[Core Components](#core-components)**    | The main entry points for rendering and managing expressions.                     |
| **[Node Types](#node-types)**              | The building blocks of all mathematical expressions.                              |
| **[UI Components](#ui-components)**        | Interactive components for user interfaces.                                       |
| **[Helper Utilities](#helper-utilities)**  | Utility functions for common tasks like node creation and visualization.          |
| **[Configuration](#configuration)**        | Modules for managing the library's settings and behavior.                         |
| **[Simplification](#simplification)**      | The expression simplification engine and its components.                          |

---


### Core Components

The foundational classes for interacting with the OMD library.

- **[`omdNode`](./api/omdNode.md)**: The abstract base class for all mathematical nodes in the expression tree.
- **[`omdDisplay`](./api/omdDisplay.md)**: A component for rendering a single, auto-centered mathematical expression.
- **[`omdEquationStack`](./api/omdEquationStack.md)**: A component for managing and displaying a sequence of equation steps.

### Node Types

These classes represent the different parts of a mathematical expression.

- **[`omdConstantNode`](./api/omdConstantNode.md)**: Represents numeric constants (e.g., `5`, `3.14`).
- **[`omdVariableNode`](./api/omdVariableNode.md)**: Represents variables (e.g., `x`, `y`).
- **[`omdBinaryExpressionNode`](./api/omdBinaryExpressionNode.md)**: Represents binary operations (`+`, `-`, `*`, `/`).
- **[`omdUnaryExpressionNode`](./api/omdUnaryExpressionNode.md)**: Represents unary operations (e.g., negation `-x`).
- **[`omdPowerNode`](./api/omdPowerNode.md)**: Represents exponentiation (`x^2`).
- **[`omdSqrtNode`](./api/omdSqrtNode.md)**: Represents square roots (`√x`).
- **[`omdRationalNode`](./api/omdRationalNode.md)**: Represents fractions and rational numbers (`x/y`).
- **[`omdEquationNode`](./api/omdEquationNode.md)**: Represents equations with a left and right side.
- **[`omdFunctionNode`](./api/omdFunctionNode.md)**: Represents mathematical functions (e.g., `sin(x)`).
- **[`omdParenthesisNode`](./api/omdParenthesisNode.md)**: Represents expressions enclosed in parentheses.
- **[`omdEquationSequenceNode`](./api/omdEquationSequenceNode.md)**: A container for displaying step-by-step solutions.
- **[`omdOperationDisplayNode`](./api/omdOperationDisplayNode.md)**: Represents visual operation hints.
- **[`omdGroupNode`](./api/omdGroupNode.md)**: A container for grouping related nodes.

### UI Components

Interactive components for building math interfaces.

- **[`omdToolbar`](./api/omdToolbar.md)**: A customizable toolbar for mathematical operations.
- **[`omdStepVisualizer`](./api/omdStepVisualizer.md)**: Component for visualizing step-by-step solutions.
- **[`omdStepVisualizerHighlighting`](./api/omdStepVisualizerHighlighting.md)**: Manages highlighting of nodes in step visualizations.
- **[`omdStepVisualizerLayout`](./api/omdStepVisualizerLayout.md)**: Handles layout and positioning of step visualizer elements.
- **[`omdStepVisualizerTextBoxes`](./api/omdStepVisualizerTextBoxes.md)**: Manages interactive text boxes for step explanations.
- **[`omdStepVisualizerInteractiveSteps`](./api/omdStepVisualizerInteractiveSteps.md)**: Creates interactive step elements for explanations.

### Helper Utilities

- **[`omdHelpers`](./api/omdHelpers.md)**: Utility functions for node creation.
- **[`omdUtilities`](./api/omdUtilities.md)**: General utilities for AST mapping and text bounds.
- **[`omdStepVisualizerNodeUtils`](./api/omdStepVisualizerNodeUtils.md)**: Utilities for node operations in step visualizations.
- **[`omdTreeDiff`](./api/omdTreeDiff.md)**: Utilities for comparing expression trees.

### Configuration

- **[`omdConfigManager`](./api/omdConfigManager.md)**: The main object for managing library configuration.
- **[`Configuration Options`](./api/configuration-options.md)**: A detailed list of all available configuration settings.

### Simplification

- **[`omdSimplification`](./api/omdSimplification.md)**: The main simplification module.
- **[`omdSimplificationEngine`](./api/simplificationEngine.md)**: Core simplification engine.
- **[`Simplification Rules`](./api/simplificationRules.md)**: Available simplification rules.
- **[`Simplification Utilities`](./api/simplificationUtils.md)**: Helper functions for simplification rules.


---


## See Also
- **[User Guide](user-guide.md)**: Getting started, usage, and tutorials (in progress)
- **[Examples](../examples/)**: A directory of live, interactive examples.
