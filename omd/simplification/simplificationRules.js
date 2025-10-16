// Import rules progressively to identify the problematic one
import { unaryRules } from './rules/unaryRules.js';
import { parenthesisRules } from './rules/parenthesisRules.js';
import { sqrtRules } from './rules/sqrtRules.js';
import { powerRules } from './rules/powerRules.js';
import { functionRules } from './rules/functionRules.js';
import { rationalRules } from './rules/rationalRules.js';
import { binaryRules } from './rules/binaryRules.js';

export const rules = {
    binary: binaryRules,
    rational: rationalRules,
    parenthesis: parenthesisRules,
    unary: unaryRules,
    power: powerRules,
    sqrt: sqrtRules,
    function: functionRules
};

export const ruleMap = {
    'omdBinaryExpressionNode': rules.binary,
    'omdRationalNode': rules.rational,
    'omdParenthesisNode': rules.parenthesis,
    'omdUnaryExpressionNode': rules.unary,
    'omdPowerNode': rules.power,
    'omdSqrtNode': rules.sqrt,
    'omdFunctionNode': rules.function
};

export function getRulesForNode(node) {
    return ruleMap[node.type] || [];
}