import { omdNode } from "./omdNode.js";
import { getNodeForAST } from "../core/omdUtilities.js";
import { omdConstantNode } from "./omdConstantNode.js";
import { omdBinaryExpressionNode } from "./omdBinaryExpressionNode.js";
import { simplifyStep } from "../simplification/omdSimplification.js";

/**
 * Represents a power/exponentiation node in the mathematical expression tree
 * Handles rendering of expressions with a base and an exponent
 * @extends omdNode
 */
export class omdPowerNode extends omdNode {
    /**
     * Creates a power node from AST data
     * @param {Object} ast - The AST node containing power expression information
     */
    constructor(ast) {
        super(ast);
        this.type = "omdPowerNode";

        // Validate that this is actually a power expression
        if (!ast.args || ast.args.length !== 2) {
            console.error("omdPowerNode requires an AST node with exactly 2 args (base and exponent)", ast);
            return;
        }

        this.value = this.parseValue();
        this.base = this.createOperand(ast.args[0]);
        this.exponent = this.createOperand(ast.args[1]);

        // Populate the argumentNodeList for mathematical child nodes
        this.argumentNodeList.base = this.base;
        this.argumentNodeList.exponent = this.exponent;
    }

    parseValue() {
        return "^";
    }

    createOperand(ast) {
        let OperandType = getNodeForAST(ast);
        let child = new OperandType(ast);
        this.addChild(child);

        return child;
    }

    // Gerard - BUG: Sizing and layout of power nodes causes too much extra space in rational nodes.
    // Find a solution that doesn't also mess up layout in binary expressions
    computeDimensions() {
        this.base.computeDimensions();
        this.exponent.setFontSize(this.getFontSize() * 3 / 4);
        this.exponent.computeDimensions();

        const sumWidth = this.base.width + this.exponent.width;
        
        // The total height must include the exponent to reserve the correct space within containers.
        const totalHeight = this.base.height + this.getSuperscriptOffset();
        
        this.setWidthAndHeight(sumWidth, totalHeight);
    }

    updateLayout() {
        // Position the base at the bottom of the node's bounding box to ensure
        // there's room for the exponent above it
        const baseY = this.height - this.base.height;
        this.base.updateLayout();
        this.base.setPosition(0, baseY);

        // Position the exponent above the base
        const exponentY = baseY - this.getSuperscriptOffset();
        this.exponent.updateLayout();
        this.exponent.setPosition(this.base.width, exponentY);
    }

    /**
     * Calculates the vertical offset for the exponent based on the current font size.
     * @returns {number} The vertical offset in pixels.
     */
    getSuperscriptOffset() {
        // This factor determines how high the exponent is lifted.
        // It's a proportion of the main font size for consistent scaling.
        return this.getFontSize() * 0.4;
    }

    /**
     * For power nodes, the alignment baseline should match where the base's text baseline 
     * actually appears within the power node's coordinate system. This is more robust
     * and works for complex bases (e.g. groups) as well as simple variables.
     * @override
     * @returns {number} The y-coordinate for alignment.
     */
    getAlignmentBaseline() {
        // The base is positioned at a 'baseY' from the top of this node's bounding box.
        // Its true alignment baseline is that offset plus its own internal baseline.
        const baseY = this.height - this.base.height;
        return baseY + this.base.getAlignmentBaseline();
    }

    clone() {
        let newAstData;
        if (typeof this.astNodeData.clone === 'function') {
            newAstData = this.astNodeData.clone();
        } else {
            newAstData = JSON.parse(JSON.stringify(this.astNodeData));
        }
        const clone = new omdPowerNode(newAstData);

        // Keep the backRect from the clone, not from 'this'
        const backRect = clone.backRect;
        clone.removeAllChildren();
        clone.addChild(backRect);
        
        clone.base = this.base.clone();
        clone.exponent = this.exponent.clone();
        
        clone.addChild(clone.base);
        clone.addChild(clone.exponent);
        
        // Explicitly update the argumentNodeList in the cloned node
        clone.argumentNodeList.base = clone.base;
        clone.argumentNodeList.exponent = clone.exponent;
        
        // The crucial step: link the clone to its origin
        clone.provenance.push(this.id);

        return clone;
    }

    /**
     * Converts the omdPowerNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = {
            type: 'OperatorNode', op: '^', fn: 'pow',
            args: [this.base.toMathJSNode(), this.exponent.toMathJSNode()]
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
     * Returns a string representation of the power node.
     * @returns {string}
     */
    toString() {
        const baseExpr = this.base.toString();
        const expExpr = this.exponent.toString();
        
        // Add parentheses to base if it's a binary expression that needs them
        let baseStr = baseExpr;
        if (this.base.needsParentheses && this.base.needsParentheses()) {
            baseStr = `(${baseExpr})`;
        } else if (this.base.type === 'BinaryExpressionNode' ||
                   (this.base.constructor && this.base.type === 'omdBinaryExpressionNode')) {
            // Binary expressions in base always need parentheses
            baseStr = `(${baseExpr})`;
        }
        
        // Add parentheses to exponent if it's complex
        let expStr = expExpr;
        if (this.exponent.type === 'BinaryExpressionNode' ||
            (this.exponent.constructor && this.exponent.type === 'omdBinaryExpressionNode') ||
            (this.exponent.constructor && this.exponent.type === 'omdPowerNode')) {
            expStr = `(${expExpr})`;
        }
        
        return `${baseStr}^${expStr}`;
    }

    /**
     * Evaluate the power expression
     * @param {Object} variables - Variable name to value mapping
     * @returns {number} The result of base^exponent
     */
    evaluate(variables = {}) {
        const baseValue = this.base.evaluate ? this.base.evaluate(variables) :
                         (this.base.value !== undefined ? parseFloat(this.base.value) : NaN);
        const expValue = this.exponent.evaluate ? this.exponent.evaluate(variables) :
                        (this.exponent.value !== undefined ? parseFloat(this.exponent.value) : NaN);
        
        if (isNaN(baseValue) || isNaN(expValue)) {
            return NaN;
        }
        
        return Math.pow(baseValue, expValue);
    }

    /**
     * Check if this is a square (exponent = 2)
     * @returns {boolean}
     */
    isSquare() {
        return this.exponent.value === 2 ||
               (this.exponent.constructor && this.exponent.type === 'omdConstantNode' &&
                parseFloat(this.exponent.value) === 2);
    }

    /**
     * Check if this is a cube (exponent = 3)
     * @returns {boolean}
     */
    isCube() {
        return this.exponent.value === 3 ||
               (this.exponent.constructor && this.exponent.type === 'omdConstantNode' &&
                parseFloat(this.exponent.value) === 3);
    }

    /**
     * Create a power node from a string
     * @static
     * @param {string} expressionString - Expression with exponentiation
     * @returns {omdPowerNode}
     */
    static fromString(expressionString) {
        try {
            const ast = window.math.parse(expressionString);
            
            // Check if it's actually a power expression
            if (ast.type !== 'OperatorNode' || ast.op !== '^') {
                throw new Error("Expression is not a power operation");
            }
            
            return new omdPowerNode(ast);
        } catch (error) {
            console.error("Failed to create power node from string:", error);
            throw error;
        }
    }
}