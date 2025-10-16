import { omdSqrtNode } from '../../nodes/omdSqrtNode.js';
import { SimplificationEngine } from '../omdSimplificationEngine.js';
import * as utils from '../simplificationUtils.js';

// ===== FUNCTION INVERSE PAIRS =====
// Bidirectional inverse function pairs - each pair only needs to be defined once
const FUNCTION_INVERSE_PAIRS = [
    // Trigonometric functions
    ['sin', 'arcsin'],
    ['cos', 'arccos'], 
    ['tan', 'arctan'],
    
    // Logarithmic/exponential functions
    ['ln', 'exp'],
    ['log', 'pow10'], // log base 10 and 10^x
    
    // Square root and square (for function nodes, not sqrt/power nodes)
    ['sqrt', 'square'],
    
    // Hyperbolic functions
    ['sinh', 'asinh'],
    ['cosh', 'acosh'], 
    ['tanh', 'atanh'],
];

/**
 * Gets the inverse of a function (works bidirectionally)
 * @param {string} functionName - The function name to find the inverse for
 * @returns {string|null} The inverse function name, or null if not found
 */
function getInverse(functionName) {
    for (const [func1, func2] of FUNCTION_INVERSE_PAIRS) {
        if (func1 === functionName) return func2;
        if (func2 === functionName) return func1;
    }
    return null;
}

// ===== FUNCTION NODE RULES =====
export const functionRules = [
    // General inverse function rule - handles all f(g(x)) = x where f and g are inverses
    SimplificationEngine.createRule("Function Inverse Simplification",
        (node) => {
            // Check if this is a function node with exactly one argument
            if (node.type !== 'omdFunctionNode' || !node.functionName || !node.argNodes || node.argNodes.length !== 1) {
                return false;
            }
            
            const outerFunction = node.functionName;
            const arg = node.argNodes[0];
            
            // Check if the argument is also a function node with one argument
            if (arg.type !== 'omdFunctionNode' || !arg.functionName || !arg.argNodes || arg.argNodes.length !== 1) {
                return false;
            }
            
            const innerFunction = arg.functionName;
            
            // Check if these are inverse functions
            const expectedInverse = getInverse(outerFunction);
            if (expectedInverse === innerFunction) {
                return { 
                    outerFunction,
                    innerFunction, 
                    innerArg: arg.argNodes[0]
                };
            }
            
            return false;
        },
        (node, data) => {
            const newNode = data.innerArg.clone();
            newNode.provenance.push(node.id, node.argNodes[0].id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { outerFunction, innerFunction } = ruleData;
            const argStr = utils.nodeToString(ruleData.innerArg);
            return `Simplified inverse functions: ${outerFunction}(${innerFunction}(${argStr})) = ${argStr}`;
        }
    ),

    // Square root function to sqrt node conversion: sqrt(x) → √x
    SimplificationEngine.createRule("Function to Sqrt Node",
        (node) => {
            if (node.type !== 'omdFunctionNode' || node.functionName !== 'sqrt' || !node.argNodes || node.argNodes.length !== 1) {
                return false;
            }
            
            return { argument: node.argNodes[0] };
        },
        (node, data) => {
            // Create sqrt AST
            const sqrtAst = {
                type: 'FunctionNode',
                fn: { type: 'SymbolNode', name: 'sqrt' },
                args: [data.argument.toMathJSNode()]
            };
            
            const newNode = new omdSqrtNode(sqrtAst);
            newNode.setFontSize(node.getFontSize());
            newNode.initialize();
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const argStr = utils.nodeToString(ruleData.argument);
            return `Converted function to sqrt node: sqrt(${argStr}) = √${argStr}`;
        }
    )
];
