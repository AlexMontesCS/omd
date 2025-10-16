import { SimplificationEngine } from '../omdSimplificationEngine.js';
import * as utils from '../simplificationUtils.js';
import { getMultiplicationSymbol } from '../../config/omdConfigManager.js';
import { omdRationalNode } from '../../nodes/omdRationalNode.js';

// ===== BINARY EXPRESSION RULES =====
export const binaryRules = [
    // Handle addition cases like a + (-a) = 0 
    SimplificationEngine.createRule("Opposite Term Cancellation",
        (node) => {
            // Only handle addition for now
            if (!SimplificationEngine.isBinaryOp(node, 'add')) {
                return false;
            }

            // Check for constant + (-constant) patterns (2 + (-2) = 0)
            if (node.left.isConstant()) {
                const leftVal = node.left.getValue();
                
                // Check if right side is a unary minus of a constant
                if (SimplificationEngine.isType(node.right, 'omdUnaryExpressionNode') && 
                    node.right.operation === 'unaryMinus' &&
                    node.right.argument.isConstant()) {
                    const rightVal = node.right.argument.getValue();
                    if (leftVal === rightVal) {
                        return {
                            leftTerm: node.left,
                            rightTerm: node.right,
                            termType: 'constant',
                            leftValue: leftVal,
                            rightValue: -rightVal,
                            isNegatedRight: true
                        };
                    }
                }
                
                // Check for direct opposite constants (rare case)
                if (node.right.isConstant()) {
                    const rightVal = node.right.getValue();
                    if (leftVal === -rightVal) {
                        return {
                            leftTerm: node.left,
                            rightTerm: node.right,
                            termType: 'constant',
                            leftValue: leftVal,
                            rightValue: rightVal,
                            isNegatedRight: false
                        };
                    }
                }
            }

            // Check if we have a + (-a) pattern for monomials
            const leftMonomial = SimplificationEngine.isMonomial(node.left);
            let rightMonomial = null;
            let isNegatedRight = false;

            // Check if right side is a unary minus
            if (SimplificationEngine.isType(node.right, 'omdUnaryExpressionNode') && 
                node.right.operation === 'unaryMinus') {
                rightMonomial = SimplificationEngine.isMonomial(node.right.argument);
                isNegatedRight = true;
            } else {
                rightMonomial = SimplificationEngine.isMonomial(node.right);
            }

            if (leftMonomial && rightMonomial) {
                // For a + (-a), check if left coefficient equals right coefficient 
                // For a + (-2a), check if left coefficient equals negative of right coefficient
                let leftCoeff = leftMonomial.coefficient;
                let rightCoeff = rightMonomial.coefficient;
                
                if (isNegatedRight) {
                    rightCoeff = -rightCoeff; // Since it's wrapped in unary minus
                }

                // Check if they are the same variable with same power and opposite coefficients
                if (leftMonomial.variable === rightMonomial.variable &&
                    leftMonomial.power === rightMonomial.power &&
                    leftCoeff === -rightCoeff) {
                    return {
                        leftTerm: node.left,
                        rightTerm: node.right,
                        termType: 'monomial',
                        variable: leftMonomial.variable,
                        power: leftMonomial.power,
                        leftCoeff: leftCoeff,
                        rightCoeff: rightCoeff,
                        isNegatedRight: isNegatedRight
                    };
                }
            }

            return false;
        },
        (node, data) => {
            const { leftTerm, rightTerm } = data;
            const zeroNode = SimplificationEngine.createConstant(0, node.getFontSize());
            
            // Preserve provenance from both terms
            zeroNode.provenance.push(leftTerm.id);
            zeroNode.provenance.push(rightTerm.id);
            zeroNode.provenance.push(node.id);
            
            return zeroNode;
        },
        (originalNode, ruleData, newNode) => {
            const { termType } = ruleData;
            
            if (termType === 'constant') {
                const { leftValue, rightValue, isNegatedRight } = ruleData;
                if (isNegatedRight) {
                    return `Cancelled opposite terms: ${leftValue} + (-${leftValue}) = 0`;
                } else {
                    return `Cancelled opposite terms: ${leftValue} + ${rightValue} = 0`;
                }
            } else {
                const { variable, power, leftCoeff, rightCoeff, isNegatedRight } = ruleData;
                const powerStr = power !== 1 ? `^${power}` : '';
                
                // Format the left term
                const leftCoeffStr = leftCoeff === 1 ? '' : leftCoeff === -1 ? '-' : `${leftCoeff}`;
                const leftTermStr = `${leftCoeffStr}${variable}${powerStr}`;
                
                // Format the right term 
                let rightTermStr;
                if (isNegatedRight) {
                    const innerCoeff = Math.abs(rightCoeff);
                    const innerCoeffStr = innerCoeff === 1 ? '' : `${innerCoeff}`;
                    rightTermStr = `(-${innerCoeffStr}${variable}${powerStr})`;
                } else {
                    const rightCoeffStr = rightCoeff === 1 ? '' : rightCoeff === -1 ? '-' : `${rightCoeff}`;
                    rightTermStr = `${rightCoeffStr}${variable}${powerStr}`;
                }
                
                return `Cancelled opposite terms: ${leftTermStr} + ${rightTermStr} = 0`;
            }
        }
    ),

    // Handle constant cancellation in multi-term sums (3x + 2 - 2 → 3x + 0)
    SimplificationEngine.createRule("Cancel Constants in Sums",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node) ||
                (node.operation !== 'add' && node.operation !== 'subtract')) return false;

            // Flatten the sum to get all terms
            const terms = [];
            utils.flattenSum(node, terms);

            // Only proceed if we have at least 3 terms (need non-constants + constants that cancel)
            if (terms.length < 3) return false;

            const constantTerms = terms.filter(t => t.node.isConstant());
            const nonConstantTerms = terms.filter(t => !t.node.isConstant());

            // Need at least one non-constant term and at least 2 constants
            if (nonConstantTerms.length === 0 || constantTerms.length < 2) return false;

            // Check if any constants cancel out exactly
            const cancellingPairs = [];
            const usedIndices = new Set();

            for (let i = 0; i < constantTerms.length; i++) {
                if (usedIndices.has(i)) continue;
                
                const term1 = constantTerms[i];
                const val1 = term1.node.getValue() * term1.sign;

                for (let j = i + 1; j < constantTerms.length; j++) {
                    if (usedIndices.has(j)) continue;
                    
                    const term2 = constantTerms[j];
                    const val2 = term2.node.getValue() * term2.sign;

                    // Check if they cancel exactly
                    if (val1 + val2 === 0) {
                        cancellingPairs.push([term1, term2]);
                        usedIndices.add(i);
                        usedIndices.add(j);
                        break;
                    }
                }
            }

            if (cancellingPairs.length > 0) {
                return {
                    terms: terms,
                    cancellingPairs: cancellingPairs,
                    constantTerms: constantTerms,
                    nonConstantTerms: nonConstantTerms
                };
            }

            return false;
        },
        (node, data) => {
            const { terms, cancellingPairs, constantTerms, nonConstantTerms } = data;

            // Start with non-constant terms
            const finalTerms = [...nonConstantTerms];

            // Keep track of which constant terms were cancelled
            const cancelledTerms = new Set();
            cancellingPairs.forEach(pair => {
                pair.forEach(term => cancelledTerms.add(term));
            });

            // Add back any constant terms that weren't cancelled
            constantTerms.forEach(term => {
                if (!cancelledTerms.has(term)) {
                    finalTerms.push(term);
                }
            });

            // Collect detailed provenance from all cancelled terms
            let cancelledNodeIds = [];
            if (cancellingPairs.length > 0) {
                const zeroNode = SimplificationEngine.createConstant(0, node.getFontSize());
                
                // Add provenance from all cancelled terms and their operators
                cancellingPairs.forEach(pair => {
                    // Find the operator node between the pair
                    const [term1, term2] = pair;
                    const parent = terms.find(t => 
                        t.node.type === 'omdBinaryExpressionNode' &&
                        ((t.node.left === term1.node && t.node.right === term2.node) ||
                         (t.node.left === term2.node && t.node.right === term1.node))
                    );

                    // Add provenance from the constants and the operator
                    pair.forEach(term => {
                        zeroNode.provenance.push(term.node.id);
                        cancelledNodeIds.push(term.node.id);
                        
                        // If this term has an operator (e.g. the minus sign), include it
                        if (term.node.operation) {
                            zeroNode.provenance.push(term.node.operation.id);
                            cancelledNodeIds.push(term.node.operation.id);
                        }
                    });

                    // Add provenance from the binary operation's operator
                    if (parent && parent.node.operation) {
                        zeroNode.provenance.push(parent.node.operation.id);
                        cancelledNodeIds.push(parent.node.operation.id);
                    }
                });
                
                finalTerms.push({ node: zeroNode, sign: 1 });
            }

            // Build the result tree
            const result = utils.buildSumTree(finalTerms, node.getFontSize());
            
            if (result) {
                // Only preserve provenance from the cancelled terms
                cancelledNodeIds.forEach(id => {
                    if (!result.provenance.includes(id)) {
                        result.provenance.push(id);
                    }
                });
            }

            return result;
        },
        (originalNode, ruleData, newNode) => {
            const { cancellingPairs } = ruleData;
            
            const cancellationDescriptions = cancellingPairs.map(pair => {
                const [term1, term2] = pair;
                const val1 = term1.node.getValue();
                const val2 = term2.node.getValue();
                const sign1 = term1.sign === 1 ? '+' : '-';
                const sign2 = term2.sign === 1 ? '+' : '-';
                
                return `${sign1} ${val1} ${sign2} ${val2} = 0`;
            });

            return `Cancelled constants in sum: ${cancellationDescriptions.join(', ')}`;
        }
    ),

    // Basic constant folding (works for both regular and rational constants)
    SimplificationEngine.createConstantFoldRule("Add Constants", "add"),
    SimplificationEngine.createConstantFoldRule("Subtract Constants", "subtract"), 
    SimplificationEngine.createConstantFoldRule("Multiply Constants", "multiply"),
    SimplificationEngine.createConstantFoldRule("Divide Constants", "divide"),

    // Identity operations
    SimplificationEngine.createIdentityRule("Add Zero", "add", 0),           // x + 0 → x, 0 + x → x
    SimplificationEngine.createIdentityRule("Subtract Zero", "subtract", 0, 'right'), // x - 0 → x
    SimplificationEngine.createIdentityRule("Multiply One", "multiply", 1),  // x * 1 → x, 1 * x → x  
    SimplificationEngine.createIdentityRule("Divide One", "divide", 1, 'right'),     // x / 1 → x

    // Zero multiplication (anything times zero equals zero)
    SimplificationEngine.createZeroMultiplicationRule(),

    // Coefficient multiplication (2 * 3x → 6x)
    SimplificationEngine.createRule("Combine Coefficients",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node, 'multiply')) return false;

            const constOp = SimplificationEngine.hasConstantOperand(node);
            if (!constOp) return false;

            const otherNode = constOp.other;
            if (!SimplificationEngine.isBinaryOp(otherNode, 'multiply')) return false;

            const innerConstOp = SimplificationEngine.hasConstantOperand(otherNode);
            if (!innerConstOp) return false;

            const outerConstant = constOp.constant.getValue();
            const innerConstant = innerConstOp.constant.getValue();
            const expression = innerConstOp.other;

            return {
                coefficient: outerConstant * innerConstant,
                expression
            };
        },
        (node, data) => {
            const { coefficient, expression } = data;
            const newNode = SimplificationEngine.createMultiplication(
                SimplificationEngine.createConstant(coefficient, node.getFontSize()),
                expression.clone(),
                node.getFontSize()
            );
            
            // Preserve provenance from both operands
            newNode.provenance.push(node.id);
            if (newNode.left) {
                newNode.left.provenance.push(node.left.id, node.right.id);
            }
            if (newNode.right) {
                newNode.right.provenance.push(expression.id);
            }
            
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { coefficient, expression } = ruleData;
            const constOp = SimplificationEngine.hasConstantOperand(originalNode);
            const innerConstOp = SimplificationEngine.hasConstantOperand(constOp.other);
            const outerVal = constOp.constant.getValue();
            const innerVal = innerConstOp.constant.getValue();
            
            return `Combined coefficients: ${outerVal} ${getMultiplicationSymbol()} ${innerVal} = ${coefficient}`;
        }
    ),

    // Distributive property (2*(x+3) → 2x + 6)
    SimplificationEngine.createRule("Distributive Property",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node, 'multiply')) return false;

            const constOp = SimplificationEngine.hasConstantOperand(node);
            if (!constOp) return false;

            const otherNode = constOp.other;
            
            // Check if the other operand is a parenthesized sum/difference
            let innerExpr = otherNode;
            if (SimplificationEngine.isType(otherNode, 'omdParenthesisNode')) {
                innerExpr = otherNode.expression;
            }

            if (!SimplificationEngine.isBinaryOp(innerExpr, 'add') && 
                !SimplificationEngine.isBinaryOp(innerExpr, 'subtract')) {
                return false;
            }

            return {
                constantNode: constOp.constant,
                innerExpr: innerExpr,
                originalInnerNode: otherNode
            };
        },
        (node, data) => {
            const { constantNode, innerExpr } = data;
            const multiplier = constantNode.getValue();
            const fontSize = node.getFontSize();

            // Distribute the constant across the terms
            const terms = [];
            utils.flattenSum(innerExpr, terms);

            const distributedTerms = terms.map(term => {
                const newCoeff = multiplier * term.sign;
                const distributedNode = SimplificationEngine.createBinaryOp(
                    SimplificationEngine.createConstant(Math.abs(newCoeff), fontSize),
                    'multiply',
                    term.node.clone(),
                    fontSize
                );
                
                // Preserve provenance
                distributedNode.provenance.push(node.id, constantNode.id, term.node.id);
                
                return {
                    node: distributedNode,
                    sign: newCoeff >= 0 ? 1 : -1
                };
            });

            return utils.buildSumTree(distributedTerms, fontSize);
        },
        (originalNode, ruleData, newNode) => {
            const { constantNode, innerExpr } = ruleData;
            const multiplierStr = constantNode.toString();
            const expressionStr = innerExpr.toString();

            return `Applied distributive property: ${multiplierStr} ${getMultiplicationSymbol()} (${expressionStr})`;
        }
    ),

    // Expand polynomial multiplication like (3x+3)(2x+2) using FOIL/distributive property
    SimplificationEngine.createRule("Expand Polynomial Multiplication",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node, 'multiply')) return false;

            // Both operands should be sums or differences (optionally parenthesized)
            let leftExpr = SimplificationEngine.unwrapParentheses(node.left);
            let rightExpr = SimplificationEngine.unwrapParentheses(node.right);

            // Check if both sides are sums or differences
            const leftIsSum = SimplificationEngine.isBinaryOp(leftExpr, 'add') || 
                              SimplificationEngine.isBinaryOp(leftExpr, 'subtract');
            const rightIsSum = SimplificationEngine.isBinaryOp(rightExpr, 'add') || 
                               SimplificationEngine.isBinaryOp(rightExpr, 'subtract');

            if (!leftIsSum || !rightIsSum) return false;

            // Extract terms from both expressions
            const leftTerms = [];
            const rightTerms = [];
            utils.flattenSum(leftExpr, leftTerms);
            utils.flattenSum(rightExpr, rightTerms);

            // Limit to reasonable number of terms to avoid explosion
            if (leftTerms.length > 4 || rightTerms.length > 4) return false;

            return {
                leftExpression: leftExpr,
                rightExpression: rightExpr,
                leftTerms: leftTerms,
                rightTerms: rightTerms
            };
        },
        (node, data) => {
            const { leftTerms, rightTerms } = data;
            const fontSize = node.getFontSize();

            // Apply distributive property: each term in left multiplied by each term in right
            const expandedTerms = [];
            
            for (const leftTerm of leftTerms) {
                for (const rightTerm of rightTerms) {
                    const productSign = leftTerm.sign * rightTerm.sign;
                    const productNode = SimplificationEngine.createBinaryOp(
                        leftTerm.node.clone(),
                        'multiply',
                        rightTerm.node.clone(),
                        fontSize
                    );
                    
                    // Use granular provenance
                    const allLeafNodes = [...(leftTerm.leafNodes || []), ...(rightTerm.leafNodes || [])];
                    allLeafNodes.forEach(leafNode => {
                        [productNode.left, productNode.right, productNode].forEach(part => {
                            if (part && !part.provenance.includes(leafNode.id)) {
                                part.provenance.push(leafNode.id);
                            }
                        });
                    });
                    
                    expandedTerms.push({
                        node: productNode,
                        sign: productSign,
                        leafNodes: allLeafNodes
                    });
                }
            }

            return utils.buildSumTree(expandedTerms, fontSize);
        },
        (originalNode, ruleData, newNode) => {
            const { leftExpression, rightExpression } = ruleData;
            const leftStr = utils.nodeToString(leftExpression);
            const rightStr = utils.nodeToString(rightExpression);
            return `Expanded polynomial multiplication: (${leftStr})(${rightStr})`;
        }
    ),

    // Multiply monomials (2x * 3x -> 6x^2, 3y^2 * 4y -> 12y^3)
    SimplificationEngine.createRule("Multiply Monomials",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node, 'multiply')) return false;

            // Check if both operands are monomials
            const leftMonomial = SimplificationEngine.isMonomial(node.left);
            const rightMonomial = SimplificationEngine.isMonomial(node.right);

            if (!leftMonomial || !rightMonomial) return false;

            // Check if they have the same variable
            if (leftMonomial.variable !== rightMonomial.variable) return false;

            return {
                variable: leftMonomial.variable,
                leftCoeff: leftMonomial.coefficient,
                rightCoeff: rightMonomial.coefficient,
                leftPower: leftMonomial.power,
                rightPower: rightMonomial.power,
                leftNode: node.left,
                rightNode: node.right
            };
        },
        (node, data) => {
            const { variable, leftCoeff, rightCoeff, leftPower, rightPower, leftNode, rightNode } = data;
            const fontSize = node.getFontSize();

            // Calculate new coefficient and power
            const newCoeff = leftCoeff * rightCoeff;
            const newPower = leftPower + rightPower;

            // Extract granular provenance
            const leftProvenance = utils.extractMonomialProvenance(leftNode);
            const rightProvenance = utils.extractMonomialProvenance(rightNode);
            
            const coefficientProvenance = [
                ...leftProvenance.coefficientNodes.map(n => n.id),
                ...rightProvenance.coefficientNodes.map(n => n.id)
            ];
            
            const variableProvenance = [
                ...leftProvenance.variableNodes.map(n => n.id),
                ...rightProvenance.variableNodes.map(n => n.id)
            ];

            // Create the result with granular provenance
            const result = utils.createMonomialWithGranularProvenance(
                newCoeff,
                variable,
                newPower,
                fontSize,
                coefficientProvenance,
                variableProvenance
            );

            result.provenance.push(node.id);

            return result;
        },
        (originalNode, ruleData, newNode) => {
            const { leftCoeff, rightCoeff, variable, leftPower, rightPower } = ruleData;
            const newCoeff = leftCoeff * rightCoeff;
            const newPower = leftPower + rightPower;
            const leftStr = utils.nodeToString(ruleData.leftNode);
            const rightStr = utils.nodeToString(ruleData.rightNode);
            
            return `Multiplied monomials: ${leftStr} ${getMultiplicationSymbol()} ${rightStr} = ${newCoeff}${variable}${newPower > 1 ? `^${newPower}` : ''}`;
        }
    ),

    // Combine identical terms in multiplication to create powers (x*x -> x^2, y*y*y -> y^3)
    SimplificationEngine.createRule("Combine Like Factors",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node, 'multiply')) return false;

            // Check if both operands are identical variables or simple expressions
            if (SimplificationEngine.isType(node.left, 'omdVariableNode') && 
                SimplificationEngine.isType(node.right, 'omdVariableNode') &&
                node.left.name === node.right.name) {
                return {
                    variable: node.left.name,
                    leftNode: node.left,
                    rightNode: node.right,
                    power: 2
                };
            }

            // Check for more complex patterns like x^2 * x -> x^3
            let baseVar = null;
            let leftPower = 1;
            let rightPower = 1;
            let leftNode = node.left;
            let rightNode = node.right;

            // Analyze left operand
            if (SimplificationEngine.isType(node.left, 'omdVariableNode')) {
                baseVar = node.left.name;
                leftPower = 1;
            } else if (SimplificationEngine.isType(node.left, 'omdPowerNode') &&
                      SimplificationEngine.isType(node.left.base, 'omdVariableNode') &&
                      node.left.exponent.isConstant()) {
                baseVar = node.left.base.name;
                leftPower = node.left.exponent.getValue();
            }

            // Analyze right operand
            if (SimplificationEngine.isType(node.right, 'omdVariableNode')) {
                if (baseVar === node.right.name) {
                    rightPower = 1;
                } else {
                    return false;
                }
            } else if (SimplificationEngine.isType(node.right, 'omdPowerNode') &&
                      SimplificationEngine.isType(node.right.base, 'omdVariableNode') &&
                      node.right.exponent.isConstant()) {
                if (baseVar === node.right.base.name) {
                    rightPower = node.right.exponent.getValue();
                } else {
                    return false;
                }
            } else {
                return false;
            }

            if (baseVar && Number.isInteger(leftPower) && Number.isInteger(rightPower)) {
                return {
                    variable: baseVar,
                    leftNode: leftNode,
                    rightNode: rightNode,
                    power: leftPower + rightPower
                };
            }

            return false;
        },
        (node, data) => {
            const { variable, power, leftNode, rightNode } = data;
            const fontSize = node.getFontSize();

            let result;
            if (power === 1) {
                result = SimplificationEngine.createMonomial(1, variable, 1, fontSize);
            } else {
                const variableNode = SimplificationEngine.createMonomial(1, variable, 1, fontSize);
                result = utils.createPowerTerm(variableNode, power, fontSize);
            }

            // Preserve provenance from both original factors
            result.provenance.push(leftNode.id, rightNode.id, node.id);
            
            return result;
        },
        (originalNode, ruleData, newNode) => {
            const { variable, power } = ruleData;
            const leftStr = utils.nodeToString(ruleData.leftNode);
            const rightStr = utils.nodeToString(ruleData.rightNode);
            
            return `Combined like factors: ${leftStr} ${getMultiplicationSymbol()} ${rightStr} = ${variable}${power > 1 ? `^${power}` : ''}`;
        }
    ),

    // Complex sum folding (x + 2 + 3 → x + 5)
    SimplificationEngine.createRule("Combine Multiple Constants in Sums",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node) ||
                (node.operation !== 'add' && node.operation !== 'subtract')) return false;

            // Flatten the sum
            const terms = [];
            utils.flattenSum(node, terms);

            const constantCount = terms.filter(t => t.node.isConstant()).length;
            if (constantCount <= 1) return false;

            // Calculate what the combined constant would be
            const constantTerms = terms.filter(t => t.node.isConstant());
            let totalNum = 0, totalDen = 1;
            for (const term of constantTerms) {
                const { num, den } = term.node.getRationalValue();
                const newTotalNum = (totalNum * den) + (num * term.sign * totalDen);
                const newTotalDen = totalDen * den;
                totalNum = newTotalNum;
                totalDen = newTotalDen;
                const commonDivisor = utils.gcd(Math.abs(totalNum), Math.abs(totalDen));
                totalNum /= commonDivisor;
                totalDen /= commonDivisor;
            }

            // Don't handle cases where the result would be zero - let cancellation rules handle those
            if (totalNum === 0) return false;

            return { terms };
        },
        (node, data) => {
            const { terms } = data;

            const constantTerms = terms.filter(t => t.node.isConstant());
            const otherTerms = terms.filter(t => !t.node.isConstant());

            // Get the actual constant nodes for provenance
            const constantNodes = constantTerms.map(t => t.node);

            // Combine all constants using rational arithmetic
            let totalNum = 0, totalDen = 1;
            for (const term of constantTerms) {
                const { num, den } = term.node.getRationalValue();
                const newTotalNum = (totalNum * den) + (num * term.sign * totalDen);
                const newTotalDen = totalDen * den;
                totalNum = newTotalNum;
                totalDen = newTotalDen;
                const commonDivisor = utils.gcd(Math.abs(totalNum), Math.abs(totalDen));
                totalNum /= commonDivisor;
                totalDen /= commonDivisor;
            }

            // Add combined constant back to terms if non-zero
            let finalTerms = [...otherTerms];

            if (totalNum !== 0 || finalTerms.length === 0) {
                if (totalDen < 0) { totalNum = -totalNum; totalDen = -totalDen; }
                const sign = totalNum >= 0 ? 1 : -1;
                const absNum = Math.abs(totalNum);

                let newNode;
                if (totalDen === 1) {
                    // Create a simple constant with automatic provenance tracking
                    newNode = SimplificationEngine.createConstant(absNum, node.getFontSize(), ...constantNodes);
                } else {
                    // Create a rational node
                    newNode = new omdRationalNode({
                        type: 'OperatorNode',
                        fn: 'divide',
                        args: [
                            { type: 'ConstantNode', value: absNum },
                            { type: 'ConstantNode', value: totalDen }
                        ]
                    });
                    newNode.setFontSize(node.getFontSize());
                    // Apply provenance for rational nodes manually using the same approach
                    constantNodes.forEach(sourceNode => {
                        if (sourceNode.id && !newNode.provenance.includes(sourceNode.id)) {
                            newNode.provenance.push(sourceNode.id);
                        }
                    });
                }

                finalTerms.push({ node: newNode, sign: sign });
            }

            if (finalTerms.length === 0) {
                const zeroNode = SimplificationEngine.createConstant(0, node.getFontSize(), ...constantNodes);
                return zeroNode;
            }

            const result = utils.buildSumTree(finalTerms, node.getFontSize());
            
            if(result) {
                constantNodes.forEach(sourceNode => {
                    if (sourceNode.id && !result.provenance.includes(sourceNode.id)) {
                        result.provenance.push(sourceNode.id);
                    }
                });
                result.provenance.push(node.id);
            }

            return result;
        },
        (originalNode, ruleData, newNode) => {
            const { terms } = ruleData;
            const constantTerms = terms.filter(t => t.node.isConstant());
        
            // Calculate the combined value
            let totalNum = 0, totalDen = 1;
            for (const term of constantTerms) {
                const { num, den } = term.node.getRationalValue();
                const newTotalNum = (totalNum * den) + (num * term.sign * totalDen);
                const newTotalDen = totalDen * den;
                totalNum = newTotalNum;
                totalDen = newTotalDen;
                const commonDivisor = utils.gcd(Math.abs(totalNum), Math.abs(totalDen));
                totalNum /= commonDivisor;
                totalDen /= commonDivisor;
            }
        
            const constantStrings = constantTerms.map(t => {
                const valueStr = utils.nodeToString(t.node);
                return t.sign === 1 ? `+ ${valueStr}` : `- ${valueStr}`;
            });
            // For the first term, if it's positive, remove the leading "+ ".
            if (constantStrings.length > 0 && constantStrings[0].startsWith('+ ')) {
                constantStrings[0] = constantStrings[0].substring(2);
            }
            
            const calculation = constantStrings.join(' ');
            const resultStr = totalDen === 1 ? `${totalNum}` : `${totalNum}/${totalDen}`;
        
            let message = `Combining the constant terms: ${calculation} = ${resultStr}. `;
            
            if (totalNum === 0) {
                message += `Since the constants sum to zero, they are replaced by 0.`;
            } else {
                message += `The constants are replaced by their sum.`;
            }
            
            return message;
        }
    ),

    // Combine like terms (monomials with same variable and power)
    SimplificationEngine.createRule("Combine Like Terms",
        (node) => {
            if (!SimplificationEngine.isBinaryOp(node, 'add') && !SimplificationEngine.isBinaryOp(node, 'subtract')) {
                return false;
            }

            const terms = [];
            utils.flattenSum(node, terms);

            const likeTermGroups = new Map();
            const otherTerms = [];
            
            for (const term of terms) {
                const monomialInfo = SimplificationEngine.isMonomial(term.node);
                
                if (monomialInfo) {
                    const key = `${monomialInfo.variable}^${monomialInfo.power}`;
                    if (!likeTermGroups.has(key)) {
                        likeTermGroups.set(key, []);
                    }
                    
                    likeTermGroups.get(key).push({
                        term,
                        monomialInfo,
                        originalNodeId: term.node.id
                    });
                } else {
                    otherTerms.push(term);
                }
            }

            // Check if we have like terms to combine
            const foundLikeTerms = Array.from(likeTermGroups.values()).some(group => group.length > 1);

            return foundLikeTerms ? { likeTermGroups, otherTerms } : false;
        },
        (node, data) => {
            const { likeTermGroups, otherTerms } = data;
            // Start with a copy of the original terms array (to preserve order)
            let allNewTerms = [...otherTerms];
            // We'll build a map from node id to its index in the original terms array
            const originalTerms = [];
            utils.flattenSum(node, originalTerms);

            // For each group of like terms
            for (const [key, termGroup] of likeTermGroups) {
                if (termGroup.length === 1) {
                    // Find the index of this term in the original terms array
                    const idx = originalTerms.findIndex(t => t.node.id === termGroup[0].term.node.id);
                    if (idx !== -1) {
                        allNewTerms.splice(idx, 0, termGroup[0].term);
                    } else {
                        allNewTerms.push(termGroup[0].term);
                    }
                } else {
                    // Combine multiple like terms
                    let totalCoeff = 0;
                    const coefficientProvenance = [];
                    const variableProvenance = [];
                    const likeTermIds = termGroup.map(t => t.term.node.id);
                    for (const termData of termGroup) {
                        const coeff = termData.monomialInfo.coefficient * termData.term.sign;
                        totalCoeff += coeff;
                        // Extract granular provenance
                        const monomialProvenance = utils.extractMonomialProvenance(termData.term.node);
                        monomialProvenance.coefficientNodes.forEach(coeffNode => {
                            if (!coefficientProvenance.includes(coeffNode.id)) {
                                coefficientProvenance.push(coeffNode.id);
                            }
                        });
                        monomialProvenance.variableNodes.forEach(varNode => {
                            if (!variableProvenance.includes(varNode.id)) {
                                variableProvenance.push(varNode.id);
                            }
                        });
                    }
                    // Create combined term if coefficient is non-zero
                    if (totalCoeff !== 0) {
                        const firstTerm = termGroup[0];
                        const newMonomial = utils.createMonomialWithGranularProvenance(
                            totalCoeff,
                            firstTerm.monomialInfo.variable,
                            firstTerm.monomialInfo.power,
                            node.getFontSize(),
                            coefficientProvenance,
                            variableProvenance
                        );
                        // Find the leftmost index of any like term in the original terms array
                        const leftmostIdx = originalTerms.findIndex(t => likeTermIds.includes(t.node.id));
                        // Remove all like terms from allNewTerms (by node id)
                        allNewTerms = allNewTerms.filter(t => !likeTermIds.includes(t.node.id));
                        // Insert the new combined term at the leftmost index
                        if (leftmostIdx !== -1) {
                            allNewTerms.splice(leftmostIdx, 0, { node: newMonomial, sign: 1 });
                        } else {
                            allNewTerms.push({ node: newMonomial, sign: 1 });
                        }
                    } else {
                        // If the sum is zero, just remove all like terms
                        allNewTerms = allNewTerms.filter(t => !likeTermIds.includes(t.node.id));
                    }
                }
            }

            // Handle zero case
            if (allNewTerms.length === 0) {
                return SimplificationEngine.createConstant(0, node.getFontSize());
            }

            return utils.buildSumTree(allNewTerms, node.getFontSize());
        },
        (originalNode, ruleData, newNode) => {
            const { likeTermGroups } = ruleData;
            const combinations = [];

            for (const [key, termGroup] of likeTermGroups) {
                if (termGroup.length > 1) {
                    let totalCoeff = 0;
                    const termDetails = [];
                    
                    for (const termData of termGroup) {
                        const coeff = termData.monomialInfo.coefficient * termData.term.sign;
                        totalCoeff += coeff;
                        
                        // Format individual terms for the explanation
                        const variable = termData.monomialInfo.variable;
                        const power = termData.monomialInfo.power;
                        const powerStr = power !== 1 ? `^${power}` : '';
                        
                        if (coeff === 1) {
                            termDetails.push(`${variable}${powerStr}`);
                        } else if (coeff === -1) {
                            termDetails.push(`-${variable}${powerStr}`);
                        } else {
                            termDetails.push(`${coeff}${variable}${powerStr}`);
                        }
                    }
                    
                    const variable = termGroup[0].monomialInfo.variable;
                    const power = termGroup[0].monomialInfo.power;
                    const powerStr = power !== 1 ? `^${power}` : '';
                    
                    if (totalCoeff === 0) {
                        combinations.push(`${termDetails.join(' + ').replace('+ -', '- ')} = 0 (like terms cancelled)`);
                    } else {
                        const resultStr = totalCoeff === 1 ? `${variable}${powerStr}` :
                                         totalCoeff === -1 ? `-${variable}${powerStr}` :
                                         `${totalCoeff}${variable}${powerStr}`;
                        combinations.push(`${termDetails.join(' + ').replace('+ -', '- ')} = ${resultStr}`);
                    }
                }
            }

            if (combinations.length === 0) {
                return "No like terms were found to combine";
            } else if (combinations.length === 1) {
                return `Combined like terms: ${combinations[0]}`;
            } else {
                return `Combined like terms: ${combinations.join('; ')}`;
            }
        }
    ),

    // Multiply then divide by same factor: (a*x)/a → x or a*(x/a) → x
    SimplificationEngine.createRule("Multiply Divide Same Factor",
        (node) => {
            // Check for (a*x)/a pattern (rational node with multiplication in numerator)
            if (SimplificationEngine.isType(node, 'omdRationalNode')) {
                const numerator = SimplificationEngine.unwrapParentheses(node.numerator);
                const denominator = SimplificationEngine.unwrapParentheses(node.denominator);
                
                if (SimplificationEngine.isBinaryOp(numerator, 'multiply') && 
                    SimplificationEngine.isType(denominator, 'omdConstantNode')) {
                    
                    const constOp = SimplificationEngine.hasConstantOperand(numerator);
                    if (constOp && constOp.constant.getValue() === denominator.getValue()) {
                        return {
                            pattern: 'rational',
                            factor: constOp.constant.getValue(),
                            expression: constOp.other,
                            factorNode: constOp.constant,
                            denominatorNode: denominator
                        };
                    }
                }
            }
            
            // Check for a*(x/a) pattern (multiplication with rational)
            if (SimplificationEngine.isBinaryOp(node, 'multiply')) {
                const constOp = SimplificationEngine.hasConstantOperand(node);
                if (!constOp) return false;
                
                const otherNode = constOp.other;
                if (SimplificationEngine.isType(otherNode, 'omdRationalNode')) {
                    const denominator = SimplificationEngine.unwrapParentheses(otherNode.denominator);
                    
                    if (SimplificationEngine.isType(denominator, 'omdConstantNode') &&
                        constOp.constant.getValue() === denominator.getValue()) {
                        
                        return {
                            pattern: 'multiply',
                            factor: constOp.constant.getValue(),
                            expression: SimplificationEngine.unwrapParentheses(otherNode.numerator),
                            factorNode: constOp.constant,
                            denominatorNode: denominator
                        };
                    }
                }
            }
            
            return false;
        },
        (node, data) => {
            const { expression, factorNode, denominatorNode } = data;
            const newNode = expression.clone();
            
            // Preserve provenance
            newNode.provenance.push(factorNode.id);
            newNode.provenance.push(denominatorNode.id);
            newNode.provenance.push(node.id);
            
            return newNode;
        },
        (originalNode, ruleData, newNode) => {
            const { pattern, factor } = ruleData;
            if (pattern === 'rational') {
                return `Simplified multiplication and division: (${factor} × expression)/${factor} = expression`;
            } else {
                return `Simplified multiplication and division: ${factor} × (expression/${factor}) = expression`;
            }
        }
    )
];
