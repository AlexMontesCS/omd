// Core node classes
import { omdNode } from '../nodes/omdNode.js';
import { omdBinaryExpressionNode } from '../nodes/omdBinaryExpressionNode.js';
import { omdConstantNode } from '../nodes/omdConstantNode.js';
import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdFunctionNode } from '../nodes/omdFunctionNode.js';
import { omdGroupNode } from '../nodes/omdGroupNode.js';
import { omdLeafNode } from '../nodes/omdLeafNode.js';
import { omdOperationDisplayNode } from '../nodes/omdOperationDisplayNode.js';
import { omdOperatorNode } from '../nodes/omdOperatorNode.js';
import { omdParenthesisNode } from '../nodes/omdParenthesisNode.js';
import { omdPowerNode } from '../nodes/omdPowerNode.js';
import { omdRationalNode } from '../nodes/omdRationalNode.js';
import { omdEquationSequenceNode } from '../nodes/omdEquationSequenceNode.js';
import { omdSqrtNode } from '../nodes/omdSqrtNode.js';
import { omdUnaryExpressionNode } from '../nodes/omdUnaryExpressionNode.js';
import { omdVariableNode } from '../nodes/omdVariableNode.js';
import { omdEquationStack } from './omdEquationStack.js';

// Visualization components
import { omdStepVisualizer } from '../step-visualizer/omdStepVisualizer.js';
import { omdDisplay } from '../display/omdDisplay.js';
import { omdToolbar } from '../display/omdToolbar.js';
import { omdNodeOverlay, omdNodeOverlayPresets } from '../utils/omdNodeOverlay.js';

// Utilities
import { getNodeForAST } from './omdUtilities.js';
import { simplifyStep } from '../simplification/omdSimplification.js';
import {
    initializeConfig,
    setConfig,
    getDefaultConfig
} from '../config/omdConfigManager.js';
import { aiNextEquationStep } from '../utils/aiNextEquationStep.js';

// Expression handling
import { omdExpression } from '../../src/omdExpression.js';
import { omdColor } from '../../src/omdColor.js';

// Re-export all imports
export {
    // Core node classes
    omdNode,
    omdBinaryExpressionNode,
    omdConstantNode,
    omdEquationNode,
    omdFunctionNode,
    omdGroupNode,
    omdLeafNode,
    omdOperationDisplayNode,
    omdOperatorNode,
    omdParenthesisNode,
    omdPowerNode,
    omdRationalNode,
    omdEquationSequenceNode,
    omdSqrtNode,
    omdUnaryExpressionNode,
    omdVariableNode,
    omdEquationStack,
    
    // Visualization
    omdStepVisualizer,
    omdDisplay,
    omdToolbar,
    omdNodeOverlay,
    omdNodeOverlayPresets,
    
    // Utilities
    getNodeForAST,
    simplifyStep,
    initializeConfig,
    setConfig,
    getDefaultConfig,
    omdExpression,
    omdColor
    ,
    aiNextEquationStep
};

// Helper utilities for common operations
export const omdHelpers = {
    /**
     * Creates a node from a text expression
     * @param {string} expression - The expression string
     * @param {object} mathjs - The math.js instance
     * @returns {omdNode} The created node
     */
    createNodeFromExpression(expression, mathjs) {
        const parsedAST = mathjs.parse(expression);
        const NodeClass = getNodeForAST(parsedAST);
        return new NodeClass(parsedAST);
    },
    
    /**
     * Creates an equation node from a string
     * @param {string} equationString - The equation string (e.g., "x+2=5")
     * @returns {omdEquationNode} The equation node
     */
    createEquation(equationString) {
        return omdEquationNode.fromString(equationString);
    },
    
    /**
     * Creates a step visualizer from multiple equation strings
     * @param {string[]} equationStrings - Array of equation strings
     * @returns {omdStepVisualizer} The step visualizer
     */
    createStepVisualizer(equationStrings) {
        const steps = equationStrings.map(str => omdEquationNode.fromString(str));
        return new omdStepVisualizer(steps);
    }
};

// Default export for convenience
export default {
    // All node classes
    nodes: {
        omdNode,
        omdBinaryExpressionNode,
        omdConstantNode,
        omdEquationNode,
        omdFunctionNode,
        omdGroupNode,
        omdLeafNode,
        omdOperationDisplayNode,
        omdOperatorNode,
        omdParenthesisNode,
        omdPowerNode,
        omdRationalNode,
        omdEquationSequenceNode,
        omdSqrtNode,
        omdUnaryExpressionNode,
        omdVariableNode
    },
    
    // Visualization
    omdStepVisualizer,
    omdDisplay,
    omdToolbar,
    omdNodeOverlay,
    omdNodeOverlayPresets,
    
    // Utilities
    getNodeForAST,
    simplifyStep,
    initializeConfig,
    setConfig,
    getDefaultConfig,
    omdExpression,
    omdColor,
    aiNextEquationStep,
    
    // Helper functions
    helpers: omdHelpers
};

export * from '../step-visualizer/omdStepVisualizer.js';
export * from './omdUtilities.js';
export * from '../display/omdToolbar.js';