import { omdBinaryExpressionNode } from "../nodes/omdBinaryExpressionNode.js";
import { omdParenthesisNode } from "../nodes/omdParenthesisNode.js";
import { omdPowerNode } from "../nodes/omdPowerNode.js";
import { omdRationalNode } from "../nodes/omdRationalNode.js";
import { omdNode } from "../nodes/omdNode.js";
import { omdFunctionNode } from "../nodes/omdFunctionNode.js";
import { omdSqrtNode } from "../nodes/omdSqrtNode.js";
import { omdLeafNode } from "../nodes/omdLeafNode.js";
import { omdConstantNode } from "../nodes/omdConstantNode.js";
import { omdVariableNode } from "../nodes/omdVariableNode.js";
import { omdEquationNode } from "../nodes/omdEquationNode.js";
import { omdUnaryExpressionNode } from "../nodes/omdUnaryExpressionNode.js";

/**
 * Maps an AST node type to its corresponding OMD node class
 * @param {string} type - The type of the AST node (e.g., "OperatorNode", "ParenthesisNode")
 * @param {Object} ast - The AST node data containing additional context
 * @returns {class} The appropriate OMD node class for the given AST node type
 */
export function astToOmdType(type, ast) {
    switch (type) {
        case "AssignmentNode":
            return omdEquationNode;
        case "OperatorNode":
            // Check for unary minus: op is '-' and there's only one argument.
            if (ast?.op === '-' && ast.args.length === 1 && !ast.implicit) {
                return omdUnaryExpressionNode;
            }
            if (ast?.op === '=') return omdEquationNode;
            if (ast?.op === '^') return omdPowerNode;
            if (ast?.op === '/') {
                return omdRationalNode;
            }
            return omdBinaryExpressionNode;
        case "ParenthesisNode": 
            return omdParenthesisNode;
        case "ConstantNode": 
            return omdConstantNode;
        case "SymbolNode": 
            return omdVariableNode;
        case "FunctionNode":
            // Handle implicit multiplication from math.js AST
            if ((ast?.fn?.name === 'multiply' || ast?.name === 'multiply') && ast.implicit) {
                return omdBinaryExpressionNode;
            }
            // Check if this is a sqrt function
            if (ast?.fn?.name === 'sqrt' || ast?.name === 'sqrt') {
                return omdSqrtNode;
            }
            return omdFunctionNode;
        default:
            return omdNode;
    }
}

/**
 * Determines whether a division operation should be rendered as a fraction
 * @param {Object} ast - The AST node representing a division operation
 * @returns {boolean} True if the division should be rendered as a fraction, false otherwise
 */
function shouldUseFractionNotation(ast) {
    const numeratorComplex = isComplexExpression(ast.args[0]);
    const denominatorComplex = isComplexExpression(ast.args[1]);
    return !(numeratorComplex || denominatorComplex);
}

/**
 * Checks if an AST node represents a complex expression
 * @param {Object} ast - The AST node to check
 * @returns {boolean} True if the expression is complex (contains multiple operations), false otherwise
 */
function isComplexExpression(ast) {
    if (!ast) return false;
    // A binary plus/minus is complex. A unary minus is not.
    if (ast.type === "OperatorNode" && (ast.op === "+" || ast.op === "-") && ast.args.length === 2) return true;
    return ast.args?.some(arg => isComplexExpression(arg)) || false;
}

/**
 * Gets the appropriate OMD node class for an AST node
 * @param {Object} ast - The AST node to get the class for
 * @returns {class} The appropriate OMD node class for the given AST node
 */
export function getNodeForAST(ast) {
    let nodeType = ast.type;
    if (ast.mathjs) {
        nodeType = ast.mathjs;
    }
    return astToOmdType(nodeType, ast);
}

/* Gerard - Added utility function */
export function getTextBounds(text, fontSize) {
    // Create a temporary span element
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'nowrap';
    span.style.fontFamily = "Albert Sans";
    span.style.fontSize = `${fontSize || 16}px`;
    span.textContent = text;

    // Append to the body to measure
    document.body.appendChild(span);

    // Measure dimensions using DOM
    const width = span.offsetWidth;
    const height = span.offsetHeight;

    // Clean up DOM element
    document.body.removeChild(span);

    return {width: width, height: height};
}