import { omdSqrtNode } from '../../nodes/omdSqrtNode.js';
import { SimplificationEngine } from '../omdSimplificationEngine.js';
import * as utils from '../simplificationUtils.js';

// ===== POWER NODE RULES =====
export const powerRules = [
    // Calculate constant powers (2^3 → 8)
    SimplificationEngine.createRule("Calculate Powers",
        (node) => {
            if (!node.base.isConstant() || !node.exponent.isConstant()) return false;
            const base = node.base.getValue();
            const exp = node.exponent.getValue();
            return { value: Math.pow(base, exp) };
        },
        (node, data) => {
            const newNode = SimplificationEngine.createConstant(data.value, node.getFontSize());
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { base, exponent } = originalNode;
            const result = ruleData.value;
            return `Calculated power: ${utils.nodeToString(base)}^${utils.nodeToString(exponent)} = ${result}`;
        }
    ),

    // Power of zero (x^0 → 1)
    SimplificationEngine.createRule("Power of Zero",
        (node) => node.exponent.isConstant() && node.exponent.getValue() === 0,
        (node) => {
            const newNode = SimplificationEngine.createConstant(1, node.getFontSize());
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { base } = originalNode;
            return `Simplified power of zero: ${utils.nodeToString(base)}^0 = 1`;
        }
    ),

    // Power of one (x^1 → x)
    SimplificationEngine.createRule("Power of One",
        (node) => node.exponent.isConstant() && node.exponent.getValue() === 1,
        (node) => {
            const newNode = node.base.clone();
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { base } = originalNode;
            return `Simplified power of one: ${utils.nodeToString(base)}^1 = ${utils.nodeToString(base)}`;
        }
    ),

    // Expand polynomial powers like (x-2)^2 or (a+b)^3
    SimplificationEngine.createRule("Expand Polynomial Power",
        (node) => {
            if (!node.exponent.isConstant()) return false;
            const exp = node.exponent.getValue();
            if (!Number.isInteger(exp) || exp < 2 || exp > 4) return false;

            let baseExpr = SimplificationEngine.unwrapParentheses(node.base);

            if (!SimplificationEngine.isBinaryOp(baseExpr, 'add') && 
                !SimplificationEngine.isBinaryOp(baseExpr, 'subtract')) {
                return false;
            }

            const terms = [];
            utils.flattenSum(baseExpr, terms);
            
            if (terms.length > 5) return false;

            return { baseExpression: baseExpr, terms, exponent: exp };
        },
        (node, data) => {
            const { terms, exponent } = data;
            const expandedTerms = utils.expandPolynomialPower(terms, exponent, node.getFontSize());
            const result = utils.buildSumTree(expandedTerms, node.getFontSize());
            
            if (result) {
                result.provenance.push(node.id);
            }
            
            return result;
        },
        (originalNode, ruleData, newNode) => {
            const { baseExpression, exponent } = ruleData;
            const baseStr = utils.nodeToString(baseExpression);
            return `Expanded polynomial power: (${baseStr})^${exponent}`;
        }
    ),

    // Simplify (√x)² → x
    SimplificationEngine.createRule("Square of Square Root",
        (node) => {
            if (!node.exponent.isConstant() || node.exponent.getValue() !== 2) return false;
            if (node.base.type !== 'omdSqrtNode') return false;
            
            return { innerArg: node.base.argument };
        },
        (node, data) => {
            const newNode = data.innerArg.clone();
            newNode.provenance.push(node.id, node.base.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const argStr = utils.nodeToString(ruleData.innerArg);
            return `Simplified square of square root: (√${argStr})² = ${argStr}`;
        }
    ),

    // Simplify x^(1/2) → √x
    SimplificationEngine.createRule("Fractional Exponent to Square Root",
        (node) => {
            if (!node.exponent.isConstant()) return false;
            
            // Check if exponent is 1/2 (0.5)
            const exp = node.exponent.getValue();
            if (Math.abs(exp - 0.5) > 0.0001) return false;
            
            return { base: node.base };
        },
        (node, data) => {
            // Create sqrt AST
            const sqrtAst = {
                type: 'FunctionNode',
                fn: { type: 'SymbolNode', name: 'sqrt' },
                args: [data.base.toMathJSNode()]
            };
            
            const newNode = new omdSqrtNode(sqrtAst);
            newNode.setFontSize(node.getFontSize());
            newNode.initialize();
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const baseStr = utils.nodeToString(ruleData.base);
            return `Converted fractional exponent to square root: ${baseStr}^(1/2) = √${baseStr}`;
        }
    )
];
