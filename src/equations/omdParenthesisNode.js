import { omdGroupNode } from "./omdGroupNode.js";
import { omdNode } from "./omdNode.js";
import { getNodeForAST } from "./omdUtilities.js";

/**
 * Represents a parenthesized expression node in the mathematical expression tree
 * Handles rendering of parentheses and their contained expression
 * @extends omdNode
 */
export class omdParenthesisNode extends omdNode {
    /**
     * Creates a parenthesis node from AST data
     * @param {Object} astNodeData - The AST node containing parenthesis information
     */
    constructor(astNodeData) {
        super(astNodeData);
        this.type = "omdParenthesisNode";

        const innerContent = astNodeData.content || (astNodeData.args && astNodeData.args[0]);
        if (!innerContent) {
            console.error("omdParenthesisNode requires inner content", astNodeData);
            return;
        }
        
        this.open = this.createParenthesis("(");
        this.expression = this.createExpression(innerContent);
        this.closed = this.createParenthesis(")");

        // Populate the argumentNodeList for the mathematical child node
        this.argumentNodeList.expression = this.expression;
    }
    
    createParenthesis(parenthesis) {
        let child = new omdGroupNode(parenthesis);
        this.addChild(child);

        return child;
    }

    createExpression(ast) {
        let ExpressionType = getNodeForAST(ast);
        let child = new ExpressionType(ast);
        this.addChild(child);

        return child;
    }

    /**
     * Calculates the dimensions of the parenthesis node and its children
     * @override
     */
    computeDimensions() {
        this.open.computeDimensions();
        this.expression.computeDimensions();
        this.closed.computeDimensions();

        // Gerard: Calculate dimensions and padding
        let padding = 4 * this.getFontSize() / this.getRootFontSize(); // Gerard: Padding should scale with font size
        let sumWidth = this.open.width + this.expression.width + this.closed.width;
        let maxHeight = Math.max(this.expression.height, this.closed.height, this.open.height);

        this.setWidthAndHeight(sumWidth, maxHeight + padding);
    }
    
    /**
     * Updates the layout of the parenthesis node and its children
     * @override
     */
    updateLayout() {
        let xCurrent = 0;

        // For proper mathematical typesetting, parentheses should be centered
        // relative to the baseline of the mathematical content, properly accounting
        // for power nodes and their baseline positioning
        
        // First, position the expression based on its alignment baseline
        this.expression.updateLayout();
        const expressionBaseline = this.expression.getAlignmentBaseline();
        const totalBaseline = this.getAlignmentBaseline();
        const expressionY = totalBaseline - expressionBaseline;
        this.expression.setPosition(this.open.width, expressionY);
        
        // Position parentheses centered around the mathematical baseline
        // This ensures proper centering for power nodes where the baseline
        // represents the position of the base (e.g., 'x' in 'x²')
        const mathematicalBaseline = expressionY + expressionBaseline;
        const parenY = mathematicalBaseline - (this.open.height / 2);
        
        this.open.updateLayout();
        this.open.setPosition(0, parenY);
        
        this.closed.updateLayout();
        this.closed.setPosition(this.open.width + this.expression.width, parenY);
    }

    /**
     * For parenthesis nodes, the alignment baseline is the baseline of the inner expression.
     * @override
     * @returns {number} The y-coordinate for alignment.
     */
    getAlignmentBaseline() {
        // The baseline is the y-position of the expression node plus its own baseline.
        const childY = (this.height - this.expression.height) / 2;
        return childY + this.expression.getAlignmentBaseline();
    }

    clone() {
        // Create a new node. The constructor will add a backRect and temporary children.
        const tempAst = { type: 'ParenthesisNode', content: {type: 'ConstantNode', value: 1} };
        const clone = new omdParenthesisNode(tempAst);

        // Keep the backRect, but get rid of the temporary children.
        const backRect = clone.backRect;
        clone.removeAllChildren();
        clone.addChild(backRect);
        
        // Manually clone the real children to ensure the entire tree has correct provenance.
        clone.open = this.open.clone();
        clone.addChild(clone.open);

        clone.expression = this.expression.clone();
        clone.addChild(clone.expression);

        clone.closed = this.closed.clone();
        clone.addChild(clone.closed);
        
        // Rebuild the argument list
        clone.argumentNodeList = { expression: clone.expression };
        
        // Regenerate AST data from the cloned structure instead of copying it
        // This ensures the AST properly reflects the cloned nodes
        clone.astNodeData = clone.toMathJSNode();

        // The crucial step: link the clone to its origin.
        clone.provenance.push(this.id);

        return clone;
    }

    /**
     * A parenthesis node is constant if its inner expression is constant.
     * @returns {boolean}
     */
    isConstant() {
        return this.expression ? this.expression.isConstant() : false;
    }

    /**
     * The value of a parenthesis node is the value of its inner expression.
     * @returns {number}
     */
    getValue() {
        if (!this.expression) {
            throw new Error("Parenthesis node has no expression from which to get a value.");
        }
        return this.expression.getValue();
    }

    /**
     * Converts the omdParenthesisNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = { 
            type: 'ParenthesisNode', 
            content: this.expression.toMathJSNode(),
            id: this.id,
            provenance: this.provenance
        };
        // Add a clone method to maintain compatibility with math.js's expectations.
        astNode.clone = function() {
            const clonedNode = { ...this };
            if (this.content) {
                clonedNode.content = this.content.clone();
            }
            return clonedNode;
        };
        return astNode;
    }

    /**
     * Converts the parenthesis node to a string.
     * @returns {string} The string representation of the parenthesized expression.
     */
    toString() {
        const innerExpr = this.expression.toString();
        return `(${innerExpr})`;
    }

    /**
     * Evaluate the content within parentheses
     * @param {Object} variables - Variable name to value mapping
     * @returns {number} The evaluated result
     */
    evaluate(variables = {}) {
        if (!this.expression) {
            throw new Error("Parenthesis node has no expression to evaluate");
        }
        
        // Evaluate the inner expression
        if (this.expression.evaluate) {
            return this.expression.evaluate(variables);
        } else if (this.expression.isConstant()) {
            return this.expression.getValue();
        } else {
            throw new Error("Cannot evaluate parenthesis content");
        }
    }

    /**
     * Check if parentheses are necessary based on context
     * @returns {boolean} Whether parentheses affect evaluation order
     */
    isNecessary() {
        // If there's no parent, parentheses at the top level are not necessary
        if (!this.parent) {
            return false;
        }
        
        // Check for single constants or variables - parentheses not needed
        if (this.expression.type === 'omdConstantNode' ||
            this.expression.type === 'omdVariableNode') {
            return false;
        }
        
        // Check parent context
        const parent = this.parent;
        
        // If parent is a function, parentheses are part of function syntax
        if (parent.type === 'omdFunctionNode') {
            return true;
        }
        
        // If parent is a power node and this is the base or exponent
        if (parent.type === 'omdPowerNode') {
            // Check if we're the base
            if (parent.base === this) {
                // Base needs parentheses if it's a complex expression
                return this.expression.type === 'omdBinaryExpressionNode';
            }
            // Check if we're the exponent
            if (parent.exponent === this) {
                // Exponent needs parentheses if it's not a simple value
                return !(this.expression.type === 'omdConstantNode' ||
                        this.expression.type === 'omdVariableNode');
            }
        }
        
        // If parent is a binary expression, check operator precedence
        if (parent.type === 'omdBinaryExpressionNode') {
            // If the inner expression is also a binary expression,
            // parentheses might be needed based on precedence
            if (this.expression.type === 'omdBinaryExpressionNode') {
                return true; // Conservative approach - keep parentheses
            }
        }
        
        // Default: parentheses are not necessary
        return false;
    }

    /**
     * Create a parenthesis node from a string
     * @param {string} expressionString - Expression with parentheses
     * @returns {omdParenthesisNode} The created parenthesis node
     * @static
     */
    static fromString(expressionString) {
        if (!window.math) {
            throw new Error("Math.js is required for parsing expressions");
        }
        
        const trimmed = expressionString.trim();
        
        // Ensure the string starts and ends with parentheses
        if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
            throw new Error("Expression must be enclosed in parentheses");
        }
        
        try {
            const ast = window.math.parse(trimmed);
            
            // Verify it's a parenthesis node
            if (ast.type !== 'ParenthesisNode') {
                throw new Error("Parsed expression is not a parenthesis node");
            }
            
            return new omdParenthesisNode(ast);
        } catch (error) {
            throw new Error(`Failed to parse parenthesis expression: ${error.message}`);
        }
    }
}