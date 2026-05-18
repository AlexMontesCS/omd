import { omdNode } from "./omdNode.js";
import { getNodeForAST } from "./omdUtilities.js";
import { omdOperatorNode } from "./omdOperatorNode.js";
import { omdConstantNode } from "./omdConstantNode.js";
import { omdBinaryExpressionNode } from "./omdBinaryExpressionNode.js";

/**
 * Represents a unary expression, like negation (-(x+y)).
 * @extends omdNode
 */
export class omdUnaryExpressionNode extends omdNode {
    /**
     * @param {Object} ast - The AST node from math.js.
     */
    constructor(ast) {
        super(ast);
        this.type = "omdUnaryExpressionNode";
        if (!ast.args || ast.args.length !== 1) {
            console.error("omdUnaryExpressionNode requires an AST node with exactly 1 argument", ast);
            return;
        }

        this.op = this.createOperatorNode(ast);
        this.operand = this.createExpressionNode(ast.args[0]);
        
        // Set the operation property for compatibility with SimplificationEngine
        this.operation = ast.fn || ast.op;

        // Populate the argumentNodeList for mathematical child nodes
        this.operand = this.operand;
        this.argument = this.operand;
        this.argumentNodeList.operand = this.operand;
        this.argumentNodeList.argument = this.argument;

        this.addChild(this.op);
        this.addChild(this.operand);
    }

    createOperatorNode(ast) {
        const opNode = new omdOperatorNode({ op: ast.op, fn: ast.fn });
        opNode.parent = this;
        return opNode;
    }
    
    createExpressionNode(ast) {
        const NodeClass = getNodeForAST(ast);
        const node = new NodeClass(ast);
        node.parent = this;
        return node;
    }

    computeDimensions() {
        this.op.computeDimensions();
        this.operand.computeDimensions();

        const opWidth = this.op.width;
        // No extra spacing for unary minus.
        const argWidth = this.operand.width;
        
        const totalWidth = opWidth + argWidth;
        const totalHeight = Math.max(this.op.height, this.operand.height);

        this.setWidthAndHeight(totalWidth, totalHeight);
    }

    updateLayout() {
        this.op.updateLayout();
        this.operand.updateLayout();
        
        const opY = (this.height - this.op.height) / 2;
        const argY = (this.height - this.operand.height) / 2;

        this.op.setPosition(0, opY);
        this.operand.setPosition(this.op.width, argY);
    }

    clone() {
        // Create a new node. The constructor will add a backRect and temporary children.
        const tempAst = { type: 'OperatorNode', op: '-', args: [{type: 'ConstantNode', value: 1}] };
        const clone = new omdUnaryExpressionNode(tempAst);

        // Keep the backRect, but get rid of the temporary children.
        const backRect = clone.backRect;
        clone.removeAllChildren();
        clone.addChild(backRect);
        
        // Manually clone the real children to ensure the entire tree has correct provenance.
    clone.op = this.op.clone();
    clone.addChild(clone.op);

    clone.operand = this.operand.clone();
    clone.addChild(clone.operand);
        
    // Ensure `argument` alias exists on the clone for compatibility
    clone.argument = clone.operand;
        
    // Rebuild the argument list and copy AST data.
    clone.argumentNodeList = { operand: clone.operand, argument: clone.argument };
        clone.astNodeData = JSON.parse(JSON.stringify(this.astNodeData));

        // The crucial step: link the clone to its origin.
        clone.provenance.push(this.id);

        return clone;
    }

    /**
     * A unary expression is constant if its operand is constant.
     * @returns {boolean}
     */
    isConstant() {
        return !!(this.operand && typeof this.operand.isConstant === 'function' && this.operand.isConstant());
    }

    /**
     * Get numeric value for unary expression (handles unary minus)
     * @returns {number}
     */
    getValue() {
        if (!this.isConstant()) throw new Error('Node is not a constant expression');
        const val = this.operand.getValue();
        if (this.operation === 'unaryMinus' || (this.op && this.op.opName === '-')) {
            return -val;
        }
        return val;
    }

    /**
     * If the operand represents a rational constant, return its rational pair adjusted for sign.
     */
    getRationalValue() {
        if (!this.isConstant()) throw new Error('Node is not a constant expression');

        // If operand supports getRationalValue, use it and adjust sign
        if (typeof this.operand.getRationalValue === 'function') {
            const { num, den } = this.operand.getRationalValue();
            if (this.operation === 'unaryMinus' || (this.op && this.op.opName === '-')) {
                return { num: -num, den };
            }
            return { num, den };
        }

        // Fallback: treat operand as integer rational
        const raw = this.operand.getValue();
        if (this.operation === 'unaryMinus' || (this.op && this.op.opName === '-')) {
            return { num: -raw, den: 1 };
        }
        return { num: raw, den: 1 };
    }

    /**
     * Converts the omdUnaryExpressionNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = {
            type: 'OperatorNode',
            op: this.op.opName,
            fn: this.operation,
            args: [this.operand.toMathJSNode()],
            id: this.id,
            provenance: this.provenance
        };

        // Add a clone method to maintain compatibility with math.js's expectations.
        astNode.clone = function() {
            const clonedNode = { ...this };
            clonedNode.args = this.args.map(arg => arg.clone());
            return clonedNode;
        };
        return astNode;
    }

    /**
     * Converts the unary expression node to a string.
     * @returns {string} The string representation of the expression.
     */
    toString() {
        const operandStr = this.operand.toString();
        if (this.needsParentheses()) {
            return `${this.op.opName}(${operandStr})`;
        }
        return `${this.op.opName}${operandStr}`;
    }

    /**
     * Check if the operand needs parentheses.
     * @returns {boolean} Whether parentheses are required
     */
    needsParentheses() {
        // Parentheses are needed if the operand is a binary expression.
        return this.operand.type === 'omdBinaryExpressionNode';
    }

    /**
     * Evaluate the negation.
     * @param {Object} variables - Variable name to value mapping
     * @returns {number} The negated result
     */
    evaluate(variables = {}) {
        if (!this.operand.evaluate) return NaN;
        const value = this.operand.evaluate(variables);
        if (this.op.opName === '-') {
            return -value;
        }
        return value; // For other potential unary ops like '+'
    }

    /**
     * Create a negation node from a string.
     * @static
     * @param {string} expressionString - Expression with negation
     * @returns {omdUnaryExpressionNode}
     */
    static fromString(expressionString) {
        try {
            const ast = window.math.parse(expressionString);
            if (ast.type === 'OperatorNode' && ast.fn === 'unaryMinus') {
                return new omdUnaryExpressionNode(ast);
            }
            throw new Error("Expression is not a unary minus operation.");
        } catch (error) {
            console.error("Failed to create unary expression node from string:", error);
            throw error;
        }
    }
}