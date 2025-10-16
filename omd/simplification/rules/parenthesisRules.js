import { SimplificationEngine } from '../omdSimplificationEngine.js';
import * as utils from '../simplificationUtils.js';

// ===== PARENTHESIS NODE RULES =====
export const parenthesisRules = [
    // Remove redundant parentheses (e.g., ((x))) → (x)
    SimplificationEngine.createRule("Remove Redundant Parentheses",
        (node) => SimplificationEngine.isType(node.expression, 'omdParenthesisNode'),
        (node) => {
            const newNode = node.expression.clone();
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const childStr = utils.nodeToString(originalNode.content);
            return `Removed redundant parentheses around "${childStr}"`;
        }
    )
];
