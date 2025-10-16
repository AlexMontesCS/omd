import { omdRationalNode } from "../nodes/omdRationalNode.js";
import { omdBinaryExpressionNode } from "../nodes/omdBinaryExpressionNode.js";
import { omdUnaryExpressionNode } from "../nodes/omdUnaryExpressionNode.js";
import { omdVariableNode } from "../nodes/omdVariableNode.js";
import { omdPowerNode } from "../nodes/omdPowerNode.js";
import { omdConstantNode } from "../nodes/omdConstantNode.js";
import { createConstantNode, applyProvenance } from './simplificationUtils.js';
import * as utils from './simplificationUtils.js';
import { useImplicitMultiplication, getMultiplicationSymbol } from "../config/omdConfigManager.js";

/**
 * @class SimplificationEngine
 * @classdesc Provides a collection of static methods for creating, matching, and transforming
 * mathematical expression nodes for simplification purposes.
 * This class serves as the core logic for applying simplification rules within the OMD system.
 */
export class SimplificationEngine {

    /**
     * ===== SIMPLIFIED NODE CREATION HELPERS =====
     * These functions provide an easy way to create various types of AST nodes
     * without directly dealing with the complexities of the Math.js AST structure.
     */

    /**
     * Creates a new constant node.
     * @param {number} value - The numeric value of the constant.
     * @param {number} [fontSize=16] - The font size for the node.
     * @param {...omdNode} sourceNodes - Source nodes for automatic provenance tracking.
     * @returns {Object} A new constant node.
     */
    static createConstant(value, fontSize = 16, ...sourceNodes) {
        const node = createConstantNode(value, fontSize);
        
        // Apply manual provenance tracking if source nodes provided
        if (sourceNodes.length > 0) {
            applyProvenance(node, ...sourceNodes);
        }
        
        return node;
    }

    /**
     * Creates a new binary expression node.
     * @param {Object} left - The left-hand side operand node.
     * @param {string} operator - The operator (e.g., '+', '-', '*', '/').
     * @param {Object} right - The right-hand side operand node.
     * @param {number} [fontSize=16] - The font size for the node.
     * @param {Array|null} [provenance=null] - The provenance array for the node (deprecated - use ...sourceNodes instead).
     * @param {omdNode|null} [operatorNode=null] - The original operator node for provenance (deprecated - use ...sourceNodes instead).
     * @param {...omdNode} sourceNodes - Additional source nodes for automatic provenance tracking.
     * @returns {Object} A new binary expression node.
     * @throws {Error} If an unknown operator is provided.
     */
    static createBinaryOp(left, operator, right, fontSize = 16, provenance = null, operatorNode = null, ...sourceNodes) {
        const opMap = {
            'add': { op: '+', fn: 'add' },
            'subtract': { op: '−', fn: 'subtract' },
            'multiply': { op: getMultiplicationSymbol(), fn: 'multiply' },
            'divide': { op: '÷', fn: 'divide' }
        };
        
        const opInfo = opMap[operator];
        if (!opInfo) throw new Error(`Unknown operator: ${operator}`);
        
        // For multiplication, reorder operands if needed (e.g., x*2 -> 2*x)
        let leftOperand = left;
        let rightOperand = right;
        
        if (operator === 'multiply') {
            const leftIsConstant = (left instanceof omdConstantNode && left.isConstant());
            const rightIsConstant = (right instanceof omdConstantNode && right.isConstant());
            
            // If left is non-constant and right is constant, swap them
            if (!leftIsConstant && rightIsConstant) {
                leftOperand = right;
                rightOperand = left;
            }
        }
        
        const ast = {
            type: 'OperatorNode',
            op: opInfo.op,
            fn: opInfo.fn,
            args: [leftOperand.toMathJSNode(), rightOperand.toMathJSNode()],
            clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
        };
        
        // Pass operator provenance into the constructor via the AST
        if (operatorNode) {
            ast.operatorProvenance = [operatorNode.id];
        }

        const node = new omdBinaryExpressionNode(ast);
        node.setFontSize(fontSize);
        
        // Use manual provenance tracking
        if (provenance) {
            // Legacy support: apply manual provenance
            node.provenance = provenance;
        } else {
            // Manual provenance tracking for binary operations
            const allSources = [leftOperand, rightOperand];
            if (operatorNode) allSources.push(operatorNode);
            allSources.push(...sourceNodes);
            applyProvenance(node, ...allSources);
        }
        
        node.initialize();
        return node;
    }

    /**
     * Creates a multiplication expression where the left operand is a constant value.
     * @param {Object} leftConstantNode - The constant node for the left operand.
     * @param {Object} rightNode - The node for the right operand.
     * @param {number} [fontSize=16] - The font size for the node.
     * @param {Array|null} [provenance=null] - The provenance array for the node.
     * @returns {Object} A new binary expression node representing multiplication.
     */
    static createMultiplication(leftConstantNode, rightNode, fontSize = 16, provenance = null) {
        // Clone the constant to create a new instance for the new expression,
        // but ensure its provenance points back to the original constant.
        const newLeftConstant = leftConstantNode.clone();
        newLeftConstant.provenance = [leftConstantNode.id];

        const rightClone = rightNode.clone(); // Clone the other node to ensure we don't modify the original
        
        // Safely get the operator node for provenance, handling cases where parent might be null
        const operatorNode = leftConstantNode.parent?.op || null;
        
        return SimplificationEngine.createBinaryOp(newLeftConstant, 'multiply', rightClone, fontSize, provenance, operatorNode);
    }

    /**
     * Creates a rational node (fraction).
     * @param {number} numerator - The numerator value.
     * @param {number} denominator - The denominator value.
     * @param {number} [fontSize=16] - The font size for the node.
     * @param {...omdNode} sourceNodes - Source nodes for automatic provenance tracking.
     * @returns {Object} A new rational node, or a constant node if the denominator is 1.
     */
    static createRational(numerator, denominator, fontSize = 16, ...sourceNodes) {
        if (denominator === 1) {
            return SimplificationEngine.createConstant(numerator, fontSize, ...sourceNodes);
        }
        
        const ast = {
            type: 'OperatorNode', op: '/', fn: 'divide',
            args: [
                { type: 'ConstantNode', value: Math.abs(numerator) },
                { type: 'ConstantNode', value: denominator }
            ],
            clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
        };
        
        let node = new omdRationalNode(ast);
        
        // Handle negative fractions by wrapping in a unary minus node
        if (numerator < 0) {
            const unaryAST = {
                type: 'OperatorNode', op: '-', fn: 'unaryMinus',
                args: [node.toMathJSNode()],
                clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
            };
            node = new omdUnaryExpressionNode(unaryAST);
        }
        
        node.setFontSize(fontSize);
        
        // Apply manual provenance tracking if source nodes provided
        if (sourceNodes.length > 0) {
            applyProvenance(node, ...sourceNodes);
        }
        
        node.initialize();
        return node;
    }

    /**
     * ===== SIMPLIFIED PATTERN MATCHING HELPERS =====
     * These functions provide convenient ways to check common patterns in AST nodes.
     */

    /**
     * Checks if a node is of a specific type.
     * @param {Object} node - The node to check.
     * @param {string} typeName - The name of the constructor type (e.g., 'omdConstantNode').
     * @returns {boolean} True if the node matches the type, false otherwise.
     */
    static isType(node, typeName) {
    if (!node) return false;
    return node.type === typeName;
    }

    /**
     * Checks if a node is a binary operation, optionally with a specific operator.
     * @param {Object} node - The node to check.
     * @param {string} [operator=null] - The specific operator to check for (e.g., 'add', 'multiply').
     * @returns {boolean} True if the node is a binary operation (and matches operator if provided), false otherwise.
     */
    static isBinaryOp(node, operator = null) {
        if (!SimplificationEngine.isType(node, 'omdBinaryExpressionNode')) return false;
        
        if (!operator) return true;
        
        // Handle both string operations and object operations (from Math.js AST)
        let nodeOp = node.operation;
        if (typeof nodeOp === 'object' && nodeOp.name) {
            nodeOp = nodeOp.name;
        }
        
        return nodeOp === operator;
    }

    /**
     * Checks if a node is a constant, optionally with a specific value.
     * @param {Object} node - The node to check.
     * @param {number} [value=null] - The specific constant value to check for.
     * @returns {boolean} True if the node is a constant (and matches value if provided), false otherwise.
     */
    static isConstantValue(node, value = null) {
        if (!node.isConstant()) return false;
        return value !== null ? node.getValue() === value : true;
    }

    /**
     * Checks if a binary operation node has a constant operand and returns it along with the other operand.
     * @param {Object} node - The binary expression node to check.
     * @returns {Object|null} An object containing the constant and other operand, or null if no constant operand is found.
     */
    static hasConstantOperand(node) {
        if (!SimplificationEngine.isBinaryOp(node)) return null;
        
        if (node.left.isConstant()) return { constant: node.left, other: node.right };
        if (node.right.isConstant()) return { constant: node.right, other: node.left };
        return null;
    }

    /**
     * Unwraps a parenthesis node, returning its inner expression. If the node is not a parenthesis node, it returns the node itself.
     * @param {Object} node - The node to unwrap.
     * @returns {Object} The inner expression if the node is a parenthesis node, otherwise the original node.
     */
    static unwrapParentheses(node) {
        return SimplificationEngine.isType(node, 'omdParenthesisNode') ? node.expression : node;
    }

    /**
     * ===== MONOMIAL AND LIKE TERMS HELPERS =====
     * These functions help identify and work with monomials and like terms.
     */

    /**
     * Checks if a node represents a monomial (a term of the form coefficient * variable^power).
     * Examples: x, 2x, 3y, -5z, x^2, 2x^3
     * @param {Object} node - The node to check.
     * @returns {Object|null} An object with coefficient, variable, and power if it's a monomial, null otherwise.
     */
    static isMonomial(node) {
        let coefficientMultiplier = 1;

        // Unwrap parentheses first, as they can contain a unary minus
        node = SimplificationEngine.unwrapParentheses(node);
        
        // Handle any number of nested unary minuses by repeatedly unwrapping them
        // and flipping the coefficient multiplier.
        while (SimplificationEngine.isType(node, 'omdUnaryExpressionNode') && node.operation === 'unaryMinus') {
            node = node.argument;
            coefficientMultiplier *= -1;
            // The argument of the unary minus could also be in parentheses
            node = SimplificationEngine.unwrapParentheses(node);
        }
        
        // Case 1: Just a variable (e.g., x)
        if (SimplificationEngine.isType(node, 'omdVariableNode')) {
            return {
                coefficient: 1 * coefficientMultiplier,
                variable: node.name,
                power: 1,
                variableNode: node
            };
        }
        
        // Case 2: Constant * Variable (e.g., 2x, 3y)
        if (SimplificationEngine.isBinaryOp(node, 'multiply')) {
            const constOp = SimplificationEngine.hasConstantOperand(node);
            if (constOp && SimplificationEngine.isType(constOp.other, 'omdVariableNode')) {
                return {
                    coefficient: constOp.constant.getValue() * coefficientMultiplier,
                    variable: constOp.other.name,
                    power: 1,
                    variableNode: constOp.other,
                    coefficientNode: constOp.constant
                };
            }
            
            // Case 3: Variable * Constant (e.g., x*2, y*3) - less common but possible
            if (constOp && SimplificationEngine.isType(constOp.constant, 'omdVariableNode') && constOp.other.isConstant()) {
                return {
                    coefficient: constOp.other.getValue() * coefficientMultiplier,
                    variable: constOp.constant.name,
                    power: 1,
                    variableNode: constOp.constant,
                    coefficientNode: constOp.other
                };
            }
            
            // Case 4: Constant * Power (e.g., 2*x^3)
            const constPowerOp = SimplificationEngine.hasConstantOperand(node);
            if (constPowerOp && SimplificationEngine.isType(constPowerOp.other, 'omdPowerNode')) {
                const powerNode = constPowerOp.other;
                if (SimplificationEngine.isType(powerNode.base, 'omdVariableNode') && powerNode.exponent.isConstant()) {
                    return {
                        coefficient: constPowerOp.constant.getValue() * coefficientMultiplier,
                        variable: powerNode.base.name,
                        power: powerNode.exponent.getValue(),
                        variableNode: powerNode.base,
                        coefficientNode: constPowerOp.constant,
                        powerNode: powerNode
                    };
                }
            }
        }
        
        // Case 5: Just a power (e.g., x^2)
        if (SimplificationEngine.isType(node, 'omdPowerNode')) {
            if (SimplificationEngine.isType(node.base, 'omdVariableNode') && node.exponent.isConstant()) {
                return {
                    coefficient: 1 * coefficientMultiplier,
                    variable: node.base.name,
                    power: node.exponent.getValue(),
                    variableNode: node.base,
                    powerNode: node
                };
            }
        }
        
        return null;
    }

    /**
     * Checks if two monomials are like terms (same variable and power).
     * @param {Object} monomial1 - First monomial info from isMonomial().
     * @param {Object} monomial2 - Second monomial info from isMonomial().
     * @returns {boolean} True if they are like terms, false otherwise.
     */
    static areLikeTerms(monomial1, monomial2) {
        return monomial1.variable === monomial2.variable && monomial1.power === monomial2.power;
    }

    /**
     * Creates a monomial node from coefficient, variable, and power.
     * @param {number} coefficient - The coefficient of the monomial.
     * @param {string} variable - The variable name.
     * @param {number} power - The power of the variable.
     * @param {number} fontSize - The font size for the node.
     * @param {Array} [provenance=[]] - The provenance array to preserve lineage.
     * @returns {Object} A new monomial node.
     */
    static createMonomial(coefficient, variable, power, fontSize, provenance = []) {
        // Create variable node
        const variableAST = { type: 'SymbolNode', name: variable, clone: function() { return {...this}; } };
        const variableNode = new (SimplificationEngine.getNodeClass('omdVariableNode'))(variableAST);
        variableNode.setFontSize(fontSize);
        variableNode.initialize();
        
        // CRITICAL: Set provenance on the variable node
        if (provenance && provenance.length > 0) {
            variableNode.provenance = [...provenance];
        }
        
        let termNode = variableNode;
        
        // Add power if not 1
        if (power !== 1) {
            const powerAST = {
                type: 'OperatorNode',
                op: '^',
                fn: 'pow',
                args: [variableAST, { type: 'ConstantNode', value: power, clone: function() { return {...this}; } }],
                clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
            };
            termNode = new (SimplificationEngine.getNodeClass('omdPowerNode'))(powerAST);
            termNode.setFontSize(fontSize);
            termNode.initialize();
            
            // CRITICAL: Set provenance on the power node and its components
            if (provenance && provenance.length > 0) {
                termNode.provenance = [...provenance];
                // Set provenance on the base (variable) and exponent
                if (termNode.base) {
                    termNode.base.provenance = [...provenance];
                }
                if (termNode.exponent) {
                    termNode.exponent.provenance = [...provenance];
                }
            }
        }
        
        let result;
        if (coefficient === 1) {
            result = termNode;
        } else if (coefficient === -1) {
            // Create unary minus
            const unaryAST = {
                type: 'OperatorNode',
                op: '-',
                fn: 'unaryMinus',
                args: [termNode.toMathJSNode()],
                clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
            };
            result = new omdUnaryExpressionNode(unaryAST);
            result.setFontSize(fontSize);
            result.initialize();
            
            // CRITICAL: Set provenance on unary minus and its argument
            if (provenance && provenance.length > 0) {
                result.provenance = [...provenance];
                if (result.argument) {
                    result.argument.provenance = [...provenance];
                }
            }
        } else {
            // Create coefficient * term
            const coeffNode = SimplificationEngine.createConstant(Math.abs(coefficient), fontSize);
            
            // CRITICAL: Set provenance on the coefficient node
            if (provenance && provenance.length > 0) {
                coeffNode.provenance = [...provenance];
            }
            
            const multiplicationNode = SimplificationEngine.createBinaryOp(coeffNode, 'multiply', termNode, fontSize);
            
            // CRITICAL: Set provenance on the multiplication node
            if (provenance && provenance.length > 0) {
                multiplicationNode.provenance = [...provenance];
                // Ensure left (coefficient) and right (variable/power) have provenance
                if (multiplicationNode.left) {
                    multiplicationNode.left.provenance = [...provenance];
                }
                if (multiplicationNode.right) {
                    multiplicationNode.right.provenance = [...provenance];
                }
            }
            
            // Wrap in unary minus if coefficient is negative
            if (coefficient < 0) {
                const unaryAST = {
                    type: 'OperatorNode',
                    op: '-',
                    fn: 'unaryMinus',
                    args: [multiplicationNode.toMathJSNode()],
                    clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
                };
                result = new omdUnaryExpressionNode(unaryAST);
                result.setFontSize(fontSize);
                result.initialize();
                
                // CRITICAL: Set provenance on negative wrapper and all its components
                if (provenance && provenance.length > 0) {
                    result.provenance = [...provenance];
                    if (result.argument) {
                        result.argument.provenance = [...provenance];
                        // Also set on the multiplication components within the unary minus
                        if (result.argument.left) {
                            result.argument.left.provenance = [...provenance];
                        }
                        if (result.argument.right) {
                            result.argument.right.provenance = [...provenance];
                        }
                    }
                }
            } else {
                result = multiplicationNode;
            }
        }
        
        // Preserve provenance from the original terms that were combined
        if (provenance && provenance.length > 0) {
            provenance.forEach(id => {
                if (!result.provenance.includes(id)) {
                    result.provenance.push(id);
                }
            });
        }
        
        return result;
    }

    /**
     * Helper to get node class by name (needed for dynamic instantiation).
     * @param {string} className - The class name.
     * @returns {Function} The class constructor.
     */
    static getNodeClass(className) {
        const classMap = {
            'omdVariableNode': omdVariableNode,
            'omdPowerNode': omdPowerNode,
            'omdUnaryExpressionNode': omdUnaryExpressionNode
        };
        return classMap[className];
    }

    /**
     * ===== SIMPLIFIED RULE ENGINE CLASS =====
     * Defines the structure and behavior of a simplification rule.
     */
    static SimplificationRule = class SimplificationRule {
        /**
         * Creates an instance of SimplificationRule.
         * @param {string} name - The name of the rule.
         * @param {function(Object): boolean|Object|null} matchFn - A function that attempts to match the rule against a node. Returns `false`, `null`, `undefined` for no match, `true` for a match with no additional data, or an object with data for a match.
         * @param {function(Object, Object): Object} transformFn - A function that transforms the matched node. Receives the node and data from `matchFn`.
         * @param {function(Object, Object, Object): string} [messageFn=null] - A function that generates a human-readable message for the transformation. Receives the original node, rule data, and the new node.
         * @param {string} [type=null] - The type/category of the rule (e.g., 'rational', 'arithmetic', 'algebraic').
         */
        constructor(name, matchFn, transformFn, messageFn = null, type = null) {
            this.name = name;
            this.type = type;
            this.match = matchFn;
            this.transform = transformFn;
            this.message = messageFn;
        }
        
        /**
         * Determines if the rule can be applied to a given node.
         * @param {Object} node - The node to check.
         * @returns {Object|null} An object containing rule data if the rule can be applied, otherwise null.
         */
        canApply(node) {
            const result = this.match(node);
            return result === false || result === null || result === undefined ? null :
                   result === true ? {} : result; // Normalize match results
        }
        
        /**
         * Applies the transformation defined by the rule to a node.
         * @param {Object} node - The node to transform.
         * @param {Object} ruleData - Data returned by the `matchFn`.
         * @param {Object} currentRoot - The current root of the expression tree.
         * @returns {Object} An object indicating success, the new root, and history information.
         */
        apply(node, ruleData, currentRoot) {
            try {
                // Ensure the transform function is valid
                if (typeof this.transform !== 'function') {
                    throw new Error(`Invalid transform function for rule: ${this.name}`);
                }

                const newNode = this.transform(node, ruleData, currentRoot);
                if (!newNode) {
                    throw new Error(`Transform function for rule '${this.name}' did not return a new node.`);
                }
                
                // Collect the IDs of all nodes that are about to be replaced.
                const affectedNodeIds = this._collectAffectedNodeIds(node);
        

                const { success, newRoot } = utils._replaceNodeInTree(node, newNode, currentRoot);
                
                if (success) {
                    // Use custom affected nodes if provided
                    const finalAffectedIds = newNode.__affectedNodeIds || affectedNodeIds;
                    const finalResultNodeId = newNode.__resultNodeId || newNode.id;


                    const historyEntry = {
                        name: this.name,
                        affectedNodes: finalAffectedIds,
                        resultNodeId: finalResultNodeId,
                        resultProvSources: newNode.provenance,
                        message: this.message(node, ruleData, newNode)
                    };
                    
            

                    return { success: true, newRoot, historyEntry };
                } else {
                    return { success: false, newRoot: currentRoot };
                }
            } catch (error) {
                console.error(`Error applying rule '${this.name}':`, error);
                return { success: false, newRoot: currentRoot };
            }
        }
        
        /**
         * Collects IDs of nodes directly affected by this rule application.
         * For rules that create new nodes with provenance, use that to determine affected nodes
         * Otherwise, use the direct node ID.
         * @param {Object} node - The original node that was transformed.
         * @returns {Array<string>} Array of node IDs that were affected.
         */
        _collectAffectedNodeIds(node) {
            // For simplification rules that set provenance, use that to determine affected nodes
            if (node && node.provenance && node.provenance.length > 0) {
                // Return the provenance IDs (excluding the original node ID which represents the transformation result)
                return node.provenance.filter(id => id !== node.id);
                    }
            
            // Fallback: return the direct node ID
            return node && node.id ? [node.id] : [];
        }
        
        /**
         * Generates a human-readable message for this rule application.
         * @param {Object} originalNode - The original node before transformation.
         * @param {Object} ruleData - Data from the match function.
         * @param {Object} newNode - The new node after transformation.
         * @returns {string} A human-readable message describing what happened.
         */
        _generateMessage(originalNode, ruleData, newNode) {
            if (this.message) {
                try {
                    return this.message(originalNode, ruleData, newNode);
                } catch (error) {
                    console.warn(`Error generating message for rule ${this.name}:`, error);
                }
            }
            
            // Default message if no custom message function is provided
            const originalValue = originalNode.toString ? originalNode.toString() : 'expression';
            const newValue = newNode.toString ? newNode.toString() : 'expression';
            return `Applied ${this.name}: "${originalValue}" → "${newValue}"`;
        }
    }

    /**
     * ===== HELPER FUNCTIONS FOR COMMON RULE PATTERNS =====
     * These functions create common types of simplification rules.
     */

    /**
     * Creates a rational number node, simplifying it by dividing by the greatest common divisor.
     * Handles negative numerators and denominators to ensure a positive denominator.
     * @param {number} numerator - The numerator of the rational number.
     * @param {number} denominator - The denominator of the rational number.
     * @param {number} fontSize - The font size for the resulting node.
     * @returns {Object} A new rational node or a constant node if the denominator simplifies to 1.
     */
    static rational(numerator, denominator, fontSize) {
        const gcd = utils.gcd(Math.abs(numerator), Math.abs(denominator));
        const simpleNum = numerator / gcd;
        const simpleDen = denominator / gcd;
        
        // Ensure denominator is positive
        if (simpleDen < 0) {
            return SimplificationEngine.#createRationalSafe(-simpleNum, -simpleDen, fontSize);
        }
        return SimplificationEngine.#createRationalSafe(simpleNum, simpleDen, fontSize);
    }

    /**
     * A safe internal function to create a rational node, handling simplification and negative signs.
     * @param {number} numerator - The numerator.
     * @param {number} denominator - The denominator.
     * @param {number} fontSize - The font size.
     * @returns {Object} The created omdRationalNode or omdConstantNode.
     */
    static #createRationalSafe(numerator, denominator, fontSize) {
        if (denominator === 1) {
            const result = SimplificationEngine.createConstant(numerator, fontSize);
            return result;
        }
        
        const ast = {
            type: 'OperatorNode', 
            op: '/', 
            fn: 'divide',
            args: [
                { type: 'ConstantNode', value: Math.abs(numerator), clone: function() { return {...this}; } },
                { type: 'ConstantNode', value: denominator, clone: function() { return {...this}; } }
            ],
            clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
        };
        
        let node = new omdRationalNode(ast);
        
        // Wrap in unary minus if the numerator is negative
        if (numerator < 0) {
            const unaryAST = {
                type: 'OperatorNode', 
                op: '-', 
                fn: 'unaryMinus',
                args: [node.toMathJSNode()],
                clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
            };
            node = new omdUnaryExpressionNode(unaryAST);
        }
        
        node.setFontSize(fontSize);
        node.initialize();
        
        return node;
    }

    /**
     * Combines two constant nodes based on a given operator.
     * @param {Object} left - The left constant node.
     * @param {Object} right - The right constant node.
     * @param {string} operator - The operation to perform (add, subtract, multiply, divide).
     * @param {number} fontSize - The font size for the resulting node.
     * @returns {Object|null} A new constant or rational node representing the combined value, or null if division by zero occurs.
     */
    static combineConstants(left, right, operator, fontSize) {
        const leftVal = left.getValue();
        const rightVal = right.getValue();
        
        let resultNode = null;
        
        switch(operator) {
            case 'add': 
                resultNode = SimplificationEngine.createConstant(leftVal + rightVal, fontSize, left, right);
                break;
            case 'subtract': 
                resultNode = SimplificationEngine.createConstant(leftVal - rightVal, fontSize, left, right);
                break;
            case 'multiply': 
                resultNode = SimplificationEngine.createConstant(leftVal * rightVal, fontSize, left, right);
                break;
            case 'divide': 
                if (rightVal === 0) return null; // Avoid division by zero
                resultNode = SimplificationEngine.rational(leftVal, rightVal, fontSize, left, right);
                break;
            default: 
                return null;
        }
        
        // The automatic provenance tracking is now handled by the create methods above
        return resultNode;
    }

    /**
     * ===== RULE FACTORY FUNCTIONS =====
     * Functions to create instances of SimplificationRule for common simplification patterns.
     */

    /**
     * Creates a new SimplificationRule instance.
     * @param {string} name - The name of the rule.
     * @param {function(Object): boolean|Object|null} matchFn - The match function for the rule.
     * @param {function(Object, Object): Object} transformFn - The transform function for the rule.
     * @param {function(Object, Object, Object): string} [messageFn=null] - Optional function to generate human-readable messages.
     * @param {string} [type=null] - The type/category of the rule (e.g., 'rational', 'arithmetic', 'algebraic').
     * @returns {SimplificationEngine.SimplificationRule} A new SimplificationRule instance.
     */
    static createRule(name, matchFn, transformFn, messageFn = null, type = null) {
        return new SimplificationEngine.SimplificationRule(name, matchFn, transformFn, messageFn, type);
    }

    /**
     * Creates a rule for folding (simplifying) binary operations with two constant operands.
     * @param {string} name - The name of the constant fold rule.
     * @param {string} operator - The operator of the binary expression (e.g., 'add', 'subtract').
     * @returns {SimplificationEngine.SimplificationRule} A new SimplificationRule for constant folding.
     */
    static createConstantFoldRule(name, operator) {
        return SimplificationEngine.createRule(name,
            // Match: binary op with two constant or rational constant operands
            (node) => {
                if (!SimplificationEngine.isBinaryOp(node, operator)) return false;
                return node.left.isConstant() && node.right.isConstant();
            },
            // Transform: combine the constants
            (node) => {
                const newNode = SimplificationEngine.combineConstants(node.left, node.right, operator, node.getFontSize());
                // The combineConstants function now correctly handles its own provenance.
                // No need to manually add the parent node's id.
                return newNode;
            },
            // Message: describe the constant folding operation
            (originalNode, ruleData, newNode) => {
                const leftVal = originalNode.left.getValue();
                const rightVal = originalNode.right.getValue();
                const result = newNode.getValue ? newNode.getValue() : newNode.toString();
                
                const operatorSymbols = {
                    'add': '+',
                    'subtract': '-', 
                    'multiply': getMultiplicationSymbol(),
                    'divide': '÷'
                };
                
                const symbol = operatorSymbols[operator] || operator;
                return `Combined constants: ${leftVal} ${symbol} ${rightVal} = ${result}`;
            }
        );
    }

    /**
     * Creates an identity rule (e.g., x + 0 → x, x * 1 → x).
     * @param {string} name - The name of the identity rule.
     * @param {string} operator - The operator of the binary expression.
     * @param {number} identityValue - The identity value for the operation (e.g., 0 for addition, 1 for multiplication).
     * @param {'left'|'right'|'both'} [side='both'] - Specifies which side the identity value should be on ('left', 'right', or 'both').
     * @returns {SimplificationEngine.SimplificationRule} A new SimplificationRule for the identity operation.
     */
    static createIdentityRule(name, operator, identityValue, side = 'both') {
        return SimplificationEngine.createRule(name,
            // Match: binary op with one constant operand being the identity value
            (node) => {
                if (!SimplificationEngine.isBinaryOp(node, operator)) return false;

                const constOperandInfo = SimplificationEngine.hasConstantOperand(node);
                if (!constOperandInfo || !constOperandInfo.constant.isConstant() || constOperandInfo.constant.getValue() !== identityValue) {
                    return false;
                }

                if (side === 'left' && node.right.isConstant()) return false;
                if (side === 'right' && node.left.isConstant()) return false;
                
                return { other: constOperandInfo.other };
            },
            // Transform: return the other operand
            (node, data) => {
                const newNode = data.other.clone();
                
                // Use manual provenance tracking for substitution
                applyProvenance(newNode, node);
                
                // Add a flag to tell the highlighting engine that this was a simple identity transform.
                newNode.__isSimpleIdentity = true;
                
                return newNode;
            },
            // Message: describe the identity operation
            (originalNode, ruleData, newNode) => {
                const { other } = ruleData;
                const otherStr = other.toString ? other.toString() : 'expression';
                
                const operatorNames = {
                    'add': 'addition',
                    'subtract': 'subtraction',
                    'multiply': 'multiplication',
                    'divide': 'division'
                };
                
                const operatorSymbols = {
                    'add': '+',
                    'subtract': '-',
                    'multiply': getMultiplicationSymbol(),
                    'divide': '÷'
                };
                
                const opName = operatorNames[operator] || operator;
                const symbol = operatorSymbols[operator] || operator;
                
                const isLeftIdentity = originalNode.left.isConstant() && originalNode.left.getValue() === identityValue;
                const position = isLeftIdentity ? 'left' : 'right';
                
                if (operator === 'add' && identityValue === 0) {
                    return `Applied additive identity: "${otherStr} + 0" simplified to "${otherStr}" (adding 0 doesn't change the value)`;
                } else if (operator === 'subtract' && identityValue === 0) {
                    return `Applied subtraction identity: "${otherStr} - 0" simplified to "${otherStr}" (subtracting 0 doesn't change the value)`;
                } else if (operator === 'multiply' && identityValue === 1) {
                    return `Applied multiplicative identity: "${otherStr} ${getMultiplicationSymbol()} 1" simplified to "${otherStr}" (multiplying by 1 doesn't change the value)`;
                } else if (operator === 'divide' && identityValue === 1) {
                    return `Applied division identity: "${otherStr} ÷ 1" simplified to "${otherStr}" (dividing by 1 doesn't change the value)`;
                } else {
                    return `Applied ${opName} identity: removed ${identityValue} from ${position} side, leaving "${otherStr}"`;
                }
            }
        );
    }

    /**
     * Creates a rule for simplifying zero multiplication (e.g., x * 0 = 0).
     */
    static createZeroMultiplicationRule() {
        return SimplificationEngine.createRule("Zero Multiplication",
            (node) => {
                if (!SimplificationEngine.isBinaryOp(node, 'multiply')) return false;
                const constOp = SimplificationEngine.hasConstantOperand(node);
                return constOp && constOp.constant.getValue() === 0;
            },
            (node) => {
                const newNode = SimplificationEngine.createConstant(0, node.getFontSize(), node);
                return newNode;
            },
            (originalNode, ruleData, newNode) => {
                const constOp = SimplificationEngine.hasConstantOperand(originalNode);
                const otherOperand = constOp.other;
                return `Applied zero multiplication: ${utils.nodeToString(otherOperand)} ${getMultiplicationSymbol()} 0 = 0`;
            }
        );
    }
}