import { SimplificationEngine } from '../omdSimplificationEngine.js';
import * as utils from '../simplificationUtils.js';
import { omdRationalNode } from '../../nodes/omdRationalNode.js';

// ===== RATIONAL NODE RULES =====
export const rationalRules = [
    // Simplify when both numerator and denominator are unary negatives: (-a)/(-b) -> a/b
    SimplificationEngine.createRule("Unary Minus Cancellation",
        (node) => {
            if (node.type !== 'omdRationalNode') return false;

            const num = SimplificationEngine.unwrapParentheses(node.numerator);
            const den = SimplificationEngine.unwrapParentheses(node.denominator);

            if (SimplificationEngine.isType(num, 'omdUnaryExpressionNode') &&
                SimplificationEngine.isType(den, 'omdUnaryExpressionNode')) {
                // Both sides are unary; cancel the unary minus operators
                return {
                    numeratorArg: num.argument || num.operand,
                    denominatorArg: den.argument || den.operand,
                    numeratorNode: num,
                    denominatorNode: den
                };
            }

            return false;
        },
        (node, data) => {
            // Create a new rational node with arguments unwrapped
            const fontSize = node.getFontSize();
            const numArg = data.numeratorArg;
            const denArg = data.denominatorArg;

            // If the denominator argument is a constant 1, return the numerator directly (e.g., x/1 -> x)
            if (denArg && typeof denArg.isConstant === 'function' && denArg.isConstant() && denArg.getValue() === 1) {
                const result = numArg.clone();
                // Preserve provenance from original nodes and the rational node
                try { utils.applyProvenance(result, node.numerator, node.denominator, node); } catch (e) {
                    // Fallback to manual pushes if applyProvenance fails
                    result.provenance = result.provenance || [];
                    if (data.numeratorNode) result.provenance.push(data.numeratorNode.id);
                    if (data.denominatorNode) result.provenance.push(data.denominatorNode.id);
                    result.provenance.push(node.id);
                }
                return result;
            }

            const newNum = numArg.clone();
            const newDen = denArg.clone();

            const ast = {
                type: 'OperatorNode', op: '/', fn: 'divide',
                args: [newNum.toMathJSNode(), newDen.toMathJSNode()],
                clone: function() { return { ...this, args: this.args.map(a => a.clone()) }; }
            };

            const rational = new omdRationalNode(ast);
            rational.setFontSize(fontSize);
            rational.initialize();

            // Give granular provenance to numerator and denominator children
            try {
                // Attach provenance to the child numerator and denominator specifically
                if (rational.numerator) utils.applyProvenance(rational.numerator, node.numerator);
                if (rational.denominator) utils.applyProvenance(rational.denominator, node.denominator);
                // Also attach provenance to the rational node itself
                utils.applyProvenance(rational, node.numerator, node.denominator, node);
            } catch (e) {
                _preserveComponentProvenance(rational, data.numeratorNode.argument || data.numeratorNode.operand, data.denominatorNode.argument || data.denominatorNode.operand);
                if (!rational.provenance.includes(node.id)) rational.provenance.push(node.id);
            }

            return rational;
        },
        (originalNode, ruleData, newNode) => {
            return `Canceled unary negatives in fraction`;
        },
        'rational'
    ),

    // Simplify when numerator is unary minus and denominator is constant -1: (-x)/-1 -> x
    SimplificationEngine.createRule("Unary Numerator Divide By -1",
        (node) => {
            if (node.type !== 'omdRationalNode') return false;
            const num = SimplificationEngine.unwrapParentheses(node.numerator);
            const den = SimplificationEngine.unwrapParentheses(node.denominator);

            if (SimplificationEngine.isType(num, 'omdUnaryExpressionNode') && den.isConstant && den.isConstant() && den.getValue() === -1) {
                return { numeratorArg: num.argument || num.operand, numeratorNode: num, denominatorNode: den };
            }

            return false;
        },
        (node, data) => {
            const newNode = data.numeratorArg.clone();
            // Preserve granular provenance: numerator argument's provenance and the denominator and whole node
            try {
                // If the result is a leaf (variable/constant), ensure it gets provenance from numerator/denominator
                utils.applyProvenance(newNode, node.numerator, node.denominator, node);
            } catch (e) {
                newNode.provenance = newNode.provenance || [];
                if (data.numeratorNode) newNode.provenance.push(data.numeratorNode.id);
                if (data.denominatorNode) newNode.provenance.push(data.denominatorNode.id);
                newNode.provenance.push(node.id);
            }
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            return `Divided by -1 cancels unary minus in numerator`;
        },
        'rational'
    ),
    // Simplify x/x = 1 (variable divided by itself)
    SimplificationEngine.createRule("Variable Self Division",
        (node) => {
            if (node.type !== 'omdRationalNode') {
                return false;
            }

            const numerator = SimplificationEngine.unwrapParentheses(node.numerator);
            const denominator = SimplificationEngine.unwrapParentheses(node.denominator);

            // Check if both numerator and denominator are the same variable
            if (SimplificationEngine.isType(numerator, 'omdVariableNode') && 
                SimplificationEngine.isType(denominator, 'omdVariableNode') &&
                numerator.name === denominator.name) {
                return {
                    variable: numerator.name,
                    numeratorNode: numerator,
                    denominatorNode: denominator
                };
            }

            return false;
        },
        (node, data) => {
            const newNode = SimplificationEngine.createConstant(1, node.getFontSize());
            newNode.provenance.push(data.numeratorNode.id);
            newNode.provenance.push(data.denominatorNode.id);
            newNode.provenance.push(node.id);
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { variable } = ruleData;
            return `Simplified variable self-division: ${variable}/${variable} = 1`;
        }
    ),

    // Simplify x^n/x = x^(n-1) (power divided by base)
    SimplificationEngine.createRule("Power Base Division",
        (node) => {
            if (node.type !== 'omdRationalNode') {
                return false;
            }

            const numerator = SimplificationEngine.unwrapParentheses(node.numerator);
            const denominator = SimplificationEngine.unwrapParentheses(node.denominator);

            // Check if numerator is a power and denominator is the same variable
            if (SimplificationEngine.isType(numerator, 'omdPowerNode') &&
                SimplificationEngine.isType(denominator, 'omdVariableNode') &&
                SimplificationEngine.isType(numerator.base, 'omdVariableNode') &&
                numerator.base.name === denominator.name &&
                numerator.exponent.isConstant()) {
                
                const exponent = numerator.exponent.getValue();
                const newExponent = exponent - 1;
                
                return {
                    variable: numerator.base.name,
                    originalExponent: exponent,
                    newExponent: newExponent,
                    baseNode: numerator.base,
                    powerNode: numerator,
                    denominatorNode: denominator
                };
            }

            return false;
        },
        (node, data) => {
            const { variable, newExponent, baseNode, powerNode, denominatorNode } = data;
            const fontSize = node.getFontSize();

            let newNode;
            if (newExponent === 0) {
                // x^1/x = x^0 = 1
                newNode = SimplificationEngine.createConstant(1, fontSize);
            } else if (newExponent === 1) {
                // x^2/x = x^1 = x
                newNode = baseNode.clone();
            } else {
                // x^n/x = x^(n-1)
                newNode = utils.createPowerTerm(baseNode.clone(), newExponent, fontSize);
            }

            // Preserve provenance
            newNode.provenance.push(powerNode.id);
            newNode.provenance.push(denominatorNode.id);
            newNode.provenance.push(node.id);
            
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { variable, originalExponent, newExponent } = ruleData;
            
            if (newExponent === 0) {
                return `Simplified power division: ${variable}^${originalExponent}/${variable} = 1`;
            } else if (newExponent === 1) {
                return `Simplified power division: ${variable}^${originalExponent}/${variable} = ${variable}`;
            } else {
                return `Simplified power division: ${variable}^${originalExponent}/${variable} = ${variable}^${newExponent}`;
            }
        }
    ),

    // Simplify cx/x = c (monomial divided by its variable)
    SimplificationEngine.createRule("Monomial Variable Division",
        (node) => {
            if (node.type !== 'omdRationalNode') {
                return false;
            }

            const numerator = SimplificationEngine.unwrapParentheses(node.numerator);
            const denominator = SimplificationEngine.unwrapParentheses(node.denominator);

            // Check if numerator is a monomial and denominator is the same variable
            const monomialInfo = SimplificationEngine.isMonomial(numerator);
            if (monomialInfo && 
                SimplificationEngine.isType(denominator, 'omdVariableNode') &&
                monomialInfo.variable === denominator.name &&
                monomialInfo.power === 1) {
                
                return {
                    coefficient: monomialInfo.coefficient,
                    variable: monomialInfo.variable,
                    numeratorNode: numerator,
                    denominatorNode: denominator
                };
            }

            return false;
        },
        (node, data) => {
            const { coefficient } = data;
            const fontSize = node.getFontSize();
            
            const newNode = SimplificationEngine.createConstant(coefficient, fontSize);
            newNode.provenance.push(data.numeratorNode.id);
            newNode.provenance.push(data.denominatorNode.id);
            newNode.provenance.push(node.id);
            
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { coefficient, variable } = ruleData;
            return `Simplified monomial division: ${coefficient}${variable}/${variable} = ${coefficient}`;
        }
    ),

    // Simplify fractions (e.g., 6/8 → 3/4, 4/2 → 2)
    SimplificationEngine.createRule("Simplify Fraction",
        (node) => {
            if (node.type !== 'omdRationalNode') {
                return false;
            }

            const numerator = node.numerator;
            const denominator = node.denominator;

            if (!numerator.isConstant() || !denominator.isConstant()) {
                return false;
            }

            const num = numerator.getValue();
            const den = denominator.getValue();

            if (den === 0) return false;

            const gcd = utils.gcd(Math.abs(num), Math.abs(den));
            
            // Check if we can simplify
            if (gcd > 1 || den < 0) {
                return {
                    originalNum: num,
                    originalDen: den,
                    gcd: gcd,
                    simplifiedNum: den < 0 ? -num / gcd : num / gcd,
                    simplifiedDen: Math.abs(den) / gcd
                };
            }

            return false;
        },
        (node, data) => {
            const { simplifiedNum, simplifiedDen } = data;
            
            if (simplifiedDen === 1) {
                // Fraction reduces to whole number
                const newNode = SimplificationEngine.createConstant(simplifiedNum, node.getFontSize(), node.numerator, node.denominator);
                newNode.provenance.push(node.id);
                return newNode;
            } else {
                // Create simplified fraction
                const newNode = SimplificationEngine.rational(simplifiedNum, simplifiedDen, node.getFontSize());
                _preserveComponentProvenance(newNode, node.numerator, node.denominator);
                newNode.provenance.push(node.id);
                return newNode;
            }
        },
        (originalNode, ruleData, newNode) => {
            const { originalNum, originalDen, simplifiedNum, simplifiedDen, gcd } = ruleData;
            
            if (originalDen < 0 && gcd > 1) {
                return `Simplified fraction: ${originalNum}/${originalDen} = ${simplifiedNum}/${simplifiedDen} (corrected sign and reduced by GCD ${gcd})`;
            } else if (simplifiedDen === 1) {
                return `Simplified fraction to whole number: ${originalNum}/${originalDen} = ${simplifiedNum}`;
            } else if (gcd > 1) {
                return `Simplified fraction: ${originalNum}/${originalDen} = ${simplifiedNum}/${simplifiedDen} (reduced by GCD ${gcd})`;
            } else {
                return `Corrected fraction sign: ${originalNum}/${originalDen} = ${simplifiedNum}/${simplifiedDen}`;
            }
        }
    ),

    // Multiplication in numerator over constant denominator ((4x)/3 → 4/3*x)
    SimplificationEngine.createRule("Simplify Multiplication in Rational",
        (node) => {
            let numerator = node.numerator;
            if (!node.denominator.isConstant()) return false;
            const denominator = node.denominator.getValue();

            if (denominator === 0) return false;

            // Unwrap parentheses and check for multiplication
            numerator = SimplificationEngine.unwrapParentheses(numerator);
            if (!SimplificationEngine.isBinaryOp(numerator, 'multiply')) return false;

            const constOp = SimplificationEngine.hasConstantOperand(numerator);
            if (!constOp) return false;

            const numeratorCoeff = constOp.constant.getValue();
            return { 
                numeratorCoeff: numeratorCoeff, 
                denominator: denominator,
                expression: constOp.other 
            };
        },
        (node, data) => {
            const { numeratorCoeff, denominator, expression } = data;
            
            // Create rational coefficient: numeratorCoeff/denominator
            const rationalCoeff = SimplificationEngine.rational(numeratorCoeff, denominator, node.getFontSize());
            
            // Preserve lineage from the multiplication components
            _preserveMultiplicationProvenance(rationalCoeff, node);
                            
            // Create multiplication: (numeratorCoeff/denominator) * expression
            const newNode = SimplificationEngine.createBinaryOp(rationalCoeff, 'multiply', expression.clone(), node.getFontSize());
            
            // The new expression node inherits from its direct components.
            if (newNode.right) {
                newNode.right.provenance.push(expression.id);
            }
            
            // Preserve lineage from the overall rational node
            newNode.provenance.push(node.id);

            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { numeratorCoeff, denominator } = ruleData;
        
            const commonDivisor = utils.gcd(Math.abs(numeratorCoeff), Math.abs(denominator));
        
            if (commonDivisor === 1) {
                // This case is more about restructuring (e.g., (2x)/3 -> 2/3 * x), not cancellation.
                return `Separated the coefficient from the variable, changing the fraction into a multiplication.`;
            }
        
            const simplifiedNum = numeratorCoeff / commonDivisor;
            const simplifiedDen = denominator / commonDivisor;
        
            let message = `The numerator and denominator share a common factor of ${commonDivisor}. `;
            message += `Dividing both by ${commonDivisor} (${numeratorCoeff} ÷ ${commonDivisor} = ${simplifiedNum}, and ${denominator} ÷ ${commonDivisor} = ${simplifiedDen}) simplifies the fraction.`;
            
            return message;
        },
        'rational'
    ),

    // Cancel numeric coefficient when numerator is unary-negative monomial and denominator is negative constant
    SimplificationEngine.createRule("Cancel Negative Coefficient",
        (node) => {
            if (node.type !== 'omdRationalNode') return false;

            const numerator = SimplificationEngine.unwrapParentheses(node.numerator);
            const denominator = SimplificationEngine.unwrapParentheses(node.denominator);

            // We expect numerator to be unary minus wrapping a multiplication (e.g., -(2*x) )
            if (!SimplificationEngine.isType(numerator, 'omdUnaryExpressionNode')) return false;
            const inner = numerator.argument || numerator.operand;
            if (!SimplificationEngine.isBinaryOp(inner, 'multiply')) return false;

            // Find the constant operand inside the multiplication
            const constOp = SimplificationEngine.hasConstantOperand(inner);
            if (!constOp || !constOp.constant.isConstant()) return false;

            // Denominator should be a constant and negative
            if (!denominator.isConstant()) return false;
            const denVal = denominator.getValue();
            if (denVal >= 0) return false;

            const coeffVal = constOp.constant.getValue();

            // If absolute values match, we can cancel the coefficient
            if (Math.abs(coeffVal) === Math.abs(denVal)) {
                return {
                    innerMultiplication: inner,
                    otherFactor: constOp.other,
                    numeratorUnary: numerator,
                    denominatorNode: denominator
                };
            }

            return false;
        },
        (node, data) => {
            // Return the other factor (e.g., x) possibly adjusting sign if needed
            const newNode = data.otherFactor.clone();
            // Preserve granular provenance from the multiplication and the rational node
            try { utils.applyProvenance(newNode, data.innerMultiplication || node.numerator, node.denominator, node); }
            catch (e) {
                newNode.provenance = newNode.provenance || [];
                newNode.provenance.push(data.numeratorUnary.id);
                newNode.provenance.push(data.denominatorNode.id);
                newNode.provenance.push(node.id);
            }
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            return `Canceled matching numeric factors between numerator and denominator`;
        },
        'rational'
    ),

    // Handle negative constant numerator over multiplication with negative constant in denominator: (-a)/(-b * rest) -> a/(b * rest)
    SimplificationEngine.createRule("Negative Constant Over Negative Product",
        (node) => {
            if (node.type !== 'omdRationalNode') return false;

            const numerator = SimplificationEngine.unwrapParentheses(node.numerator);
            const denominator = SimplificationEngine.unwrapParentheses(node.denominator);

            if (!numerator.isConstant || !numerator.isConstant()) return false;
            const numVal = numerator.getValue();
            if (numVal >= 0) return false;

            // Denominator must be a multiplication with a constant operand that's negative
            if (!SimplificationEngine.isBinaryOp(denominator, 'multiply')) return false;
            const constOp = SimplificationEngine.hasConstantOperand(denominator);
            if (!constOp || !constOp.constant.isConstant()) return false;
            const denConstVal = constOp.constant.getValue();
            if (denConstVal >= 0) return false;

            return {
                numeratorNode: numerator,
                denominatorNode: denominator,
                denominatorConst: constOp.constant,
                denominatorOther: constOp.other
            };
        },
        (node, data) => {
            const fontSize = node.getFontSize();

            // Build new numerator absolute value
            const newNumConst = SimplificationEngine.createConstant(Math.abs(data.numeratorNode.getValue()), fontSize);

            // Build new denominator as (abs(denConst) * other)
            const newDenConst = SimplificationEngine.createConstant(Math.abs(data.denominatorConst.getValue()), fontSize);
            const newDenProduct = SimplificationEngine.createBinaryOp(newDenConst, 'multiply', data.denominatorOther.clone(), fontSize);

            // Construct rational AST
            const ast = {
                type: 'OperatorNode', op: '/', fn: 'divide',
                args: [newNumConst.toMathJSNode(), newDenProduct.toMathJSNode()],
                clone: function() { return { ...this, args: this.args.map(a => a.clone()) }; }
            };

            const rational = new omdRationalNode(ast);
            rational.setFontSize(fontSize);
            rational.initialize();

            // Debug: show matching components and their provenance

            // Preserve provenance from original components and whole node.
            // Attach granular provenance to numerator and denominator children as well as the rational node.
            try {
                // Numerator: if original numerator was a unary expression, use its inner operand (the constant '1')
                const numeratorSource = (data && data.numeratorNode && (data.numeratorNode.argument || data.numeratorNode.operand)) || node.numerator;
                if (rational.numerator && numeratorSource) {
                    utils.applyProvenance(rational.numerator, numeratorSource);
                }

                // Denominator: if original denominator was a multiplication, attach provenance to the left/right children
                const denomSourceBinary = (data && data.denominatorNode) || node.denominator;
                if (rational.denominator && SimplificationEngine.isBinaryOp(denomSourceBinary, 'multiply') && SimplificationEngine.isBinaryOp(rational.denominator, 'multiply')) {
                    // Attempt to map original const -> left, other -> right
                    const leftSource = (data && data.denominatorConst) || (denomSourceBinary.left || denomSourceBinary.right);
                    const rightSource = (data && data.denominatorOther) || ((denomSourceBinary.left === leftSource) ? denomSourceBinary.right : denomSourceBinary.left);

                    if (rational.denominator.left && leftSource) utils.applyProvenance(rational.denominator.left, leftSource);
                    if (rational.denominator.right && rightSource) utils.applyProvenance(rational.denominator.right, rightSource);
                } else if (rational.denominator) {
                    // Fallback: attach provenance to the whole denominator
                    utils.applyProvenance(rational.denominator, node.denominator);
                }

                // Finally, attach provenance to the rational node itself
                utils.applyProvenance(rational, node.numerator, node.denominator, node);
            } catch (e) {
                // Fallback to copying provenance arrays/ids
                _preserveComponentProvenance(rational, node.numerator, node.denominator);
                if (!rational.provenance.includes(node.id)) rational.provenance.push(node.id);
            }

            // (debug logs removed)

            return rational;
        },
        (originalNode, ruleData, newNode) => `Canceled matching negative factors: simplified sign and magnitude`,
        'rational'
    ),

    // Distribute division over addition/subtraction ((4*x+6)/3 → 4/3*x + 2)
    SimplificationEngine.createRule("Simplify Rational Division",
        (node) => {
            if (node.type !== 'omdRationalNode') {
                return false;
            }

            let numerator = node.numerator;
            const denominator = node.denominator;

            if (!denominator.isConstant()) {
                return false;
            }

            // Unwrap parentheses to check the underlying structure
            const originalNumerator = numerator;
            numerator = SimplificationEngine.unwrapParentheses(numerator);

            if (!SimplificationEngine.isBinaryOp(numerator, 'add') && 
                !SimplificationEngine.isBinaryOp(numerator, 'subtract')) {
                return false;
            }

            // Flatten the sum in the numerator
            const terms = [];
            utils.flattenSum(numerator, terms);

            return {
                terms: terms,
                denominator: denominator.getValue()
            };
        },
        (node, data) => {
            const { terms, denominator } = data;
            const fontSize = node.getFontSize();

            const distributedTerms = terms.map(term => {
                const termValue = term.node.isConstant() ? term.node.getValue() : 1;
                const numeratorValue = termValue * term.sign;
                
                if (term.node.isConstant()) {
                    // For constants, create a simplified fraction or integer
                    const gcd = utils.gcd(Math.abs(numeratorValue), Math.abs(denominator));
                    const simplifiedNum = numeratorValue / gcd;
                    const simplifiedDen = denominator / gcd;
                    
                    if (simplifiedDen === 1) {
                        const constantNode = SimplificationEngine.createConstant(simplifiedNum, fontSize);
                        _preserveDistributionProvenance(constantNode, term.node, node.denominator);
                        return { node: constantNode, sign: 1 };
                    } else {
                        const rationalNode = SimplificationEngine.rational(Math.abs(simplifiedNum), simplifiedDen, fontSize);
                        _preserveDistributionProvenance(rationalNode, term.node, node.denominator);
                        return { node: rationalNode, sign: simplifiedNum >= 0 ? 1 : -1 };
                    }
                } else {
                    // For non-constants, create coefficient * term / denominator
                    if (numeratorValue === denominator) {
                        // Coefficient cancels with denominator
                        const newNode = term.node.clone();
                        newNode.provenance.push(term.node.id);
                        return { node: newNode, sign: 1 };
                    } else {
                        const rationalCoeff = SimplificationEngine.rational(Math.abs(numeratorValue), denominator, fontSize);
                        const multiplicationNode = SimplificationEngine.createBinaryOp(rationalCoeff, 'multiply', term.node.clone(), fontSize);
                        
                        _preserveDistributionProvenance(rationalCoeff, term.node, node.denominator);
                        multiplicationNode.provenance.push(node.id);
                        
                        return { node: multiplicationNode, sign: numeratorValue >= 0 ? 1 : -1 };
                    }
                }
            });

            return utils.buildSumTree(distributedTerms, fontSize);
        },
        (originalNode, ruleData, newNode) => {
            const { terms, denominator } = ruleData;
            const numeratorStr = utils.nodeToString(originalNode.numerator);
            const simplifiedTerms = terms.map(term => {
                const coeff = (term.node.isConstant() ? term.node.getValue() : 1) * term.sign;
                const gcd = utils.gcd(Math.abs(coeff), Math.abs(denominator));
                const newNum = coeff / gcd;
                const newDen = denominator / gcd;
                const variablePart = term.node.isConstant() ? '' : utils.nodeToString(term.node);
                if (newDen === 1) return `${newNum}${variablePart}`;
                return `(${newNum}/${newDen})${variablePart}`;
            }).join(' + ');

            // Don't add extra parentheses if numerator already has them
            const displayNumerator = numeratorStr.startsWith('(') && numeratorStr.endsWith(')') ? 
                numeratorStr : `(${numeratorStr})`;
            return `Distributed division: ${displayNumerator}/${denominator} = ${simplifiedTerms}`;
        },
        'rational'
    )
];

// ===== HELPER FUNCTIONS FOR PROVENANCE =====
// These helper functions consolidate the repetitive provenance logic

/**
 * Preserves provenance from numerator and denominator components
 */
function _preserveComponentProvenance(newNode, numerator, denominator) {
    if (numerator?.provenance) {
        numerator.provenance.forEach(id => {
            if (!newNode.provenance.includes(id)) newNode.provenance.push(id);
        });
    } else if (numerator) {
        newNode.provenance.push(numerator.id);
    }

    if (denominator?.provenance) {
        denominator.provenance.forEach(id => {
            if (!newNode.provenance.includes(id)) newNode.provenance.push(id);
        });
    } else if (denominator) {
        newNode.provenance.push(denominator.id);
    }
}

/**
 * Preserves provenance from multiplication components in rational nodes
 */
function _preserveMultiplicationProvenance(rationalCoeff, originalNode) {
    // Handle numerator constant provenance
    const numeratorConstant = originalNode.numerator?.left?.isConstant() ? 
        originalNode.numerator.left : originalNode.numerator?.right;
    
    if (numeratorConstant?.provenance) {
        numeratorConstant.provenance.forEach(id => {
            if (!rationalCoeff.provenance.includes(id)) {
                rationalCoeff.provenance.push(id);
            }
        });
    } else if (numeratorConstant) {
        rationalCoeff.provenance.push(numeratorConstant.id);
    }
    
    // Handle denominator provenance
    if (originalNode.denominator?.provenance) {
        originalNode.denominator.provenance.forEach(id => {
            if (!rationalCoeff.provenance.includes(id)) {
                rationalCoeff.provenance.push(id);
            }
        });
    } else if (originalNode.denominator) {
        rationalCoeff.provenance.push(originalNode.denominator.id);
    }
}

/**
 * Preserves provenance for distributed rational terms
 */
function _preserveDistributionProvenance(rationalNode, termNode, denominatorNode) {
    // Numerator should preserve lineage from the original term
    if (rationalNode.numerator && termNode) {
        rationalNode.numerator.provenance = [];
        
        if (termNode.provenance?.length > 0) {
            termNode.provenance.forEach(id => {
                rationalNode.numerator.provenance.push(id);
            });
        } else {
            rationalNode.numerator.provenance.push(termNode.id);
        }
    }
    
    // Denominator should preserve lineage from the original denominator
    if (rationalNode.denominator && denominatorNode) {
        rationalNode.denominator.provenance = [];
        
        if (denominatorNode.provenance?.length > 0) {
            denominatorNode.provenance.forEach(id => {
                rationalNode.denominator.provenance.push(id);
            });
        } else {
            rationalNode.denominator.provenance.push(denominatorNode.id);
        }
    }
    
    // Preserve term's provenance on the rational node itself
    if (termNode.provenance?.length > 0) {
        termNode.provenance.forEach(id => {
            if (!rationalNode.provenance.includes(id)) {
                rationalNode.provenance.push(id);
            }
        });
    }
}
