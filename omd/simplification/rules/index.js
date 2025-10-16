// Import all rule categories
import { binaryRules } from './binaryRules.js';
import { rationalRules } from './rationalRules.js';
import { parenthesisRules } from './parenthesisRules.js';
import { unaryRules } from './unaryRules.js';
import { powerRules } from './powerRules.js';
import { sqrtRules } from './sqrtRules.js';
import { functionRules } from './functionRules.js';

// ===== RULES ORGANIZED BY NODE TYPE =====
export const rules = {
    // ===== BINARY EXPRESSION RULES =====
    binary: binaryRules,

    // ===== RATIONAL NODE RULES =====
    rational: rationalRules,

    // ===== PARENTHESIS NODE RULES =====
    parenthesis: parenthesisRules,

    // ===== UNARY EXPRESSION RULES =====
    unary: unaryRules,

    // ===== POWER NODE RULES =====
    power: powerRules,

    // ===== SQRT NODE RULES =====
    sqrt: sqrtRules,

    // ===== FUNCTION NODE RULES =====
    function: functionRules
};

// ===== RULE LOOKUP MAP =====
export const ruleMap = {
    'omdBinaryExpressionNode': rules.binary,
    'omdRationalNode': rules.rational,
    'omdParenthesisNode': rules.parenthesis,
    'omdUnaryExpressionNode': rules.unary,
    'omdPowerNode': rules.power,
    'omdSqrtNode': rules.sqrt,
    'omdFunctionNode': rules.function
};

// ===== HELPER FUNCTION =====
export function getRulesForNode(node) {
    return ruleMap[node.type] || [];
}
