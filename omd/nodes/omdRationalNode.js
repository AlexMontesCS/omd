import { omdNode } from "./omdNode.js";
import { astToOmdType, getNodeForAST } from "../core/omdUtilities.js";
import { omdConstantNode } from "./omdConstantNode.js";
import { simplifyStep } from "../simplification/omdSimplification.js";
import { jsvgLine } from '@teachinglab/jsvg';
// Helper function for GCD
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

export class omdRationalNode extends omdNode {
    constructor(astNodeData) {
        super(astNodeData);
        this.type = "omdRationalNode";
        
        if (!astNodeData.args || astNodeData.args.length < 2) {
            console.error("omdRationalNode requires numerator and denominator");
            return;
        }
        
        this.value = this.parseValue();
        this.numerator = this.createOperand(astNodeData.args[0]);
        this.denominator = this.createOperand(astNodeData.args[1]);

        // Populate the argumentNodeList for mathematical child nodes
        this.argumentNodeList.numerator = this.numerator;
        this.argumentNodeList.denominator = this.denominator;

        // Gerard: Create purely aesthetic fraction line
        this.fractionLine = new jsvgLine();
        this.fractionLine.setStrokeColor('black');
        this.fractionLine.setStrokeWidth(2);
        this.addChild(this.fractionLine);
    }
    
    parseValue() {
        return "/";
    }

    createOperand(ast) {
        let OperandType = getNodeForAST(ast);
        let child = new OperandType(ast);
        this.addChild(child);

        // Preserve lineage from the original AST node if it exists
        // Note: The child constructor should already handle provenance from the AST
        // This is just a safety check for cases where AST has explicit provenance
        try {
            if (ast.id && ast.provenance && ast.provenance.length > 0) {
                // Only override if the child doesn't already have provenance
                if (!child.provenance || child.provenance.length === 0) {
                    child.provenance = [...ast.provenance];
                }
            }
        } catch (error) {
            // If lineage preservation fails, continue without it
            console.debug('Failed to preserve lineage in createOperand:', error.message);
        }

        return child;
    }

    computeDimensions() {
        // Gerard: Shrink font size of numerator and denominator
        this.numerator.setFontSize(this.getFontSize() * 5 / 6);
        this.denominator.setFontSize(this.getFontSize() * 5 / 6);

        this.numerator.computeDimensions();
        this.denominator.computeDimensions();
        
        // Extra horizontal spacing and vertical padding
        const ratio = this.getFontSize() / this.getRootFontSize();
        const spacing = 8 * ratio;
        const padding = 8 * ratio;
        
        let spacedWidth = Math.max(this.numerator.width, this.denominator.width) + spacing;
        let spacedHeight = this.numerator.height + this.denominator.height + padding; 

        this.setWidthAndHeight(spacedWidth, spacedHeight);
    }
    
    updateLayout() {
        const fractionSpacing = 2;
        
        // Gerard: Check math
        // Position numerator (top, centered)
        const numX = (this.width - this.numerator.width) / 2;
        this.numerator.updateLayout();
        this.numerator.setPosition(numX, fractionSpacing);
        
        // Position fraction line (middle)
        const lineY = this.numerator.height + fractionSpacing * 2;
        this.fractionLine.setEndpoints(0, lineY, this.width, lineY);
        
        // Position denominator (bottom, centered)
        const denX = (this.width - this.denominator.width) / 2;
        const denY = lineY + fractionSpacing;
        this.denominator.updateLayout();
        this.denominator.setPosition(denX, denY);
    }

    /**
     * For rational nodes, the alignment baseline is the fraction bar itself.
     * @override
     * @returns {number} The y-coordinate for alignment.
     */
    getAlignmentBaseline() {
        // Corresponds to the 'lineY' calculation in updateLayout.
        const fractionSpacing = 2;
        return this.numerator.height + fractionSpacing * 2;
    }

    isConstant() {
        return this.numerator.isConstant() && this.denominator.isConstant();
    }

    /**
     * Retrieves the rational value of the node as a numerator/denominator pair.
     * @returns {{num: number, den: number}}
     */
    getRationalValue() {
        if (this.isConstant()) {
            return { num: this.numerator.getValue(), den: this.denominator.getValue() };
        }
        throw new Error('Rational node is not constant');
    }

    getValue() {
        if (this.isConstant()) {
            const { num, den } = this.getRationalValue();
            if (den === 0) return NaN;
            return num / den;
        }
        throw new Error("Node is not a constant expression");
    }

    clone() {
        let newAstData;
        if (typeof this.astNodeData.clone === 'function') {
            newAstData = this.astNodeData.clone();
        } else {
            newAstData = JSON.parse(JSON.stringify(this.astNodeData));
        }
        const clone = new omdRationalNode(newAstData);

        // Keep the backRect from the clone, not from 'this'
        const backRect = clone.backRect;
        clone.removeAllChildren();
        clone.addChild(backRect);
        
        clone.numerator = this.numerator.clone();
        clone.denominator = this.denominator.clone();
        
        // jsvgLine does not have a clone method, so we create a new one.
        clone.fractionLine = new jsvgLine();
        clone.fractionLine.setStrokeColor('black');
        clone.fractionLine.setStrokeWidth(2);
        
        clone.addChild(clone.numerator);
        clone.addChild(clone.fractionLine);
        clone.addChild(clone.denominator);
        
        // Explicitly update the argumentNodeList in the cloned node
        clone.argumentNodeList.numerator = clone.numerator;
        clone.argumentNodeList.denominator = clone.denominator;
        
        // The crucial step: link the clone to its origin
        clone.provenance.push(this.id);

        return clone;
    }

    /**
     * Converts the omdRationalNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = {
            type: 'OperatorNode', op: '/', fn: 'divide',
            args: [this.numerator.toMathJSNode(), this.denominator.toMathJSNode()],
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
     * Converts the rational node to a string representation.
     * Ensures that complex numerators/denominators are wrapped in parentheses
     * to maintain correct order of operations.
     * @returns {string} The string representation of the fraction.
     */
    toString() {
        const numStr = this.numerator.toString();
        const denStr = this.denominator.toString();

        // Check if the children are complex expressions that require parentheses
        const numNeedsParens = this.numerator.type === 'omdBinaryExpressionNode';
        const denNeedsParens = this.denominator.type === 'omdBinaryExpressionNode';

        const finalNumStr = numNeedsParens ? `(${numStr})` : numStr;
        const finalDenStr = denNeedsParens ? `(${denStr})` : denStr;

        return `${finalNumStr} / ${finalDenStr}`;
    }

    /**
     * Evaluates the rational expression.
     * @param {Object} variables - A map of variable names to their values.
     * @returns {number} The result of the division.
     */
    evaluate(variables = {}) {
        const numValue = this.numerator.evaluate(variables);
        const denValue = this.denominator.evaluate(variables);

        if (denValue === 0) {
            throw new Error("Division by zero in rational expression.");
        }

        return numValue / denValue;
    }

    /**
     * Reduce the fraction to lowest terms if it's constant.
     * @returns {omdRationalNode|omdNode} Reduced fraction or the original node.
     */
    reduce() {
        if (this.isConstant()) {
            let { num, den } = this.getRationalValue();
            if (den < 0) { // Keep denominator positive
                num = -num;
                den = -den;
            }
            const commonDivisor = gcd(Math.abs(num), Math.abs(den));
            const newNum = num / commonDivisor;
            const newDen = den / commonDivisor;

            if (newNum === this.numerator.getValue() && newDen === this.denominator.getValue()) {
                return this; // Already reduced
            }

            if (newDen === 1) {
                return omdConstantNode.fromNumber(newNum);
            }
            
            const newAst = {
                type: 'OperatorNode', op: '/', fn: 'divide',
                args: [
                    omdConstantNode.fromNumber(newNum).toMathJSNode(),
                    omdConstantNode.fromNumber(newDen).toMathJSNode()
                ]
            };
            return new omdRationalNode(newAst);
        }
        return this.clone(); // Return a clone if not constant
    }

    /**
     * Check if the fraction is proper (absolute value of numerator < absolute value of denominator).
     * Only works for constant fractions.
     * @returns {boolean|null} True if proper, false if improper, null if not constant.
     */
    isProper() {
        if (this.isConstant()) {
            const { num, den } = this.getRationalValue();
            return Math.abs(num) < Math.abs(den);
        }
        return null;
    }

    /**
     * Create a fraction node from a string.
     * @static
     * @param {string} expressionString - Expression with division
     * @returns {omdRationalNode}
     */
    static fromString(expressionString) {
        try {
            const ast = window.math.parse(expressionString);
            if (ast.type !== 'OperatorNode' || ast.op !== '/') {
                throw new Error("Expression is not a division operation");
            }
            return new omdRationalNode(ast);
        } catch (error) {
            console.error("Failed to create rational node from string:", error);
            throw error;
        }
    }
}
