import { SimplificationEngine } from '../omdSimplificationEngine.js';
import * as utils from '../simplificationUtils.js';

// ===== UNARY EXPRESSION RULES =====
export const unaryRules = [
    // Simplify double negation (-(-x) → x)
    SimplificationEngine.createRule("Simplify Double Negation",
        (node) => {
            return node.operation === 'unaryMinus' && 
                   SimplificationEngine.isType(node.argument, 'omdUnaryExpressionNode') &&
                   node.argument.operation === 'unaryMinus';
        },
        (node) => {
            const newNode = node.argument.argument.clone();
            newNode.provenance.push(node.id, node.argument.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const childStr = utils.nodeToString(originalNode.argument.argument);
            return `Simplified double negation: -(-${childStr}) = ${childStr}`;
        }
    ),

    // Remove unary plus (+x → x)
    SimplificationEngine.createRule("Remove Unary Plus",
        (node) => node.operation === 'unaryPlus',
        (node) => {
            const newNode = node.argument.clone();
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const childStr = utils.nodeToString(originalNode.argument);
            return `Removed unary plus from "${childStr}"`;
        }
    )
];
