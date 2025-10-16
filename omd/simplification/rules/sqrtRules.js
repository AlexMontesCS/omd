import { SimplificationEngine } from '../omdSimplificationEngine.js';
import * as utils from '../simplificationUtils.js';

// ===== SQRT NODE RULES =====
export const sqrtRules = [
    // Simplify square root of perfect squares (sqrt(9) → 3)
    SimplificationEngine.createRule("Simplify Square Root of Constant",
        (node) => {
            if (!node.argument.isConstant()) return false;
            const value = node.argument.getValue();
            if (value < 0) return false;

            const sqrt = Math.sqrt(value);
            return Number.isInteger(sqrt) ? { value: sqrt } : false;
        },
        (node, data) => {
            const newNode = SimplificationEngine.createConstant(data.value, node.getFontSize());
            newNode.provenance.push(node.id, node.argument.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const value = originalNode.argument.getValue();
            const result = ruleData.value;
            return `Calculated square root: √${value} = ${result}`;
        }
    ),

    // Simplify sqrt(x^2) → x (assuming x ≥ 0 for simplicity)
    SimplificationEngine.createRule("Square Root of Square",
        (node) => {
            if (!node.argument || node.argument.type !== 'omdPowerNode') return false;
            
            const powerNode = node.argument;
            if (!powerNode.exponent.isConstant() || powerNode.exponent.getValue() !== 2) return false;
            
            return { base: powerNode.base };
        },
        (node, data) => {
            const newNode = data.base.clone();
            newNode.provenance.push(node.id, node.argument.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const baseStr = utils.nodeToString(ruleData.base);
            return `Simplified square root of square: √(${baseStr}²) = ${baseStr}`;
        }
    )
];
