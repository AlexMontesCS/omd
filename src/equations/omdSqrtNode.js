import { omdNode } from "./omdNode.js";
import { getNodeForAST } from "./omdUtilities.js";
import { omdConstantNode } from "./omdConstantNode.js";
import { omdPowerNode } from "./omdPowerNode.js";
import { omdBinaryExpressionNode } from "./omdBinaryExpressionNode.js";
import { jsvgPath, jsvgLine } from '@teachinglab/jsvg';
/**
 * Represents a square root node in the mathematical expression tree
 * Handles rendering of radical symbol and expression under the root
 * @extends omdNode
 */
export class omdSqrtNode extends omdNode {
    /**
     * Creates a square root node from AST data
     * @param {Object} astNodeData - The AST node containing sqrt function information
     */
    constructor(astNodeData) {
        super(astNodeData);
        this.type = "omdSqrtNode";
        this.args = astNodeData.args || [];
        
        this.value = this.parseValue();
        this.argument = this.createArgumentNode();
        
        // Populate the argumentNodeList for the mathematical child node
        if (this.argument) {
            this.argumentNodeList.argument = this.argument;
        }

        [ this.radicalPath, this.radicalLine ] = this.createRadicalElements();
    }
    
    parseValue() {
        return "sqrt";
    }
    
    /**
     * Creates node for the expression under the radical
     * @private
     */
    createArgumentNode() {
        if (this.args.length === 0) return null;

        const argAst = this.args[0];
        const ArgNodeType = getNodeForAST(argAst);
        let child = new ArgNodeType(argAst);
        this.addChild(child);

        return child;
    }
    
    /**
     * Creates radical symbol and line for sqrt
     * @private
     */
    createRadicalElements() {
        // Create custom radical symbol using SVG path
        let radicalPath = new jsvgPath();
        radicalPath.setStrokeColor('black');
        radicalPath.setStrokeWidth(2);
        radicalPath.setFillColor('none');
        this.addChild(radicalPath);
        
        // Create the horizontal line over the expression
        let radicalLine = new jsvgLine();
        radicalLine.setStrokeColor('black');
        radicalLine.setStrokeWidth(2);
        this.addChild(radicalLine);

        return [radicalPath, radicalLine];
    }

    /**
     * Calculates the dimensions of the sqrt node and its children
     * @override
     */
    computeDimensions() {
        if (!this.argument) return;
        
        const fontSize = this.getFontSize();
        const argFontSize = fontSize * 5/6;  // Match rational node scaling
        
        // Set font size for argument and compute its dimensions
        this.argument.setFontSize(argFontSize);
        this.argument.computeDimensions();
        
        // Calculate dimensions using the expression height to size the radical
        const ratio = fontSize / this.getRootFontSize();
        const spacing = 4 * ratio;
        
        const argWidth = this.argument.width;
        const argHeight = this.argument.height;
        
        // Radical width is proportional to expression height
        const radicalWidth = Math.max(12 * ratio, argHeight * 0.3);
        
        const totalWidth = radicalWidth + spacing + argWidth + spacing;
        const totalHeight = argHeight + 8 * ratio; // Extra height for the radical top
        
        this.setWidthAndHeight(totalWidth, totalHeight);
    }
    
    /**
     * Updates the layout of the sqrt node and its children
     * @override
     */
    updateLayout() {
        if (!this.argument) return;
        
        const fontSize = this.getFontSize();
        const ratio = fontSize / this.getRootFontSize();
        const spacing = 4 * ratio;
        
        let currentX = 0;
        
        // Calculate radical dimensions based on expression
        const expressionHeight = this.argument.height;
        const radicalWidth = Math.max(12 * ratio, expressionHeight * 0.3);
        
        // Position the expression first to get its exact position
        const expressionX = currentX + radicalWidth + spacing;
        const expressionY = (this.height - expressionHeight) / 2;
        
        this.argument.setPosition(expressionX, expressionY);
        this.argument.updateLayout();
        
        // Draw the radical path using addPoint method
        const radicalBottom = expressionY + expressionHeight - 2 * ratio;
        const radicalTop = expressionY - 4 * ratio;
        const radicalMid = expressionY + expressionHeight * 0.7;
        
        // Clear previous points and create radical path: short diagonal down, long diagonal up
        this.radicalPath.clearPoints();
        this.radicalPath.addPoint(currentX + radicalWidth * 0.3, radicalMid);
        this.radicalPath.addPoint(currentX + radicalWidth * 0.6, radicalBottom);
        this.radicalPath.addPoint(currentX + radicalWidth, radicalTop);
        this.radicalPath.updatePath();
        
        // Position horizontal line above the expression
        const lineY = expressionY - 2 * ratio;
        const lineStartX = currentX + radicalWidth;
        const lineEndX = expressionX + this.argument.width + spacing / 2;
        this.radicalLine.setEndpoints(lineStartX, lineY, lineEndX, lineY);
    }
    
    clone() {
        let newAstData;
        if (typeof this.astNodeData.clone === 'function') {
            newAstData = this.astNodeData.clone();
        } else {
            newAstData = JSON.parse(JSON.stringify(this.astNodeData));
        }
        const clone = new omdSqrtNode(newAstData);

        // Keep the backRect from the clone, not from 'this'
        const backRect = clone.backRect;
        clone.removeAllChildren();
        clone.addChild(backRect);
        
        // Create new jsvg elements for the clone
        clone.radicalPath = new jsvgPath();
        clone.radicalPath.setStrokeColor('black');
        clone.radicalPath.setStrokeWidth(2);
        clone.radicalPath.setFillColor('none');
        clone.addChild(clone.radicalPath);
        
        clone.radicalLine = new jsvgLine();
        clone.radicalLine.setStrokeColor('black');
        clone.radicalLine.setStrokeWidth(2);
        clone.addChild(clone.radicalLine);

        if (this.argument) {
            clone.argument = this.argument.clone();
            clone.addChild(clone.argument);
            
            // Explicitly update the argumentNodeList in the cloned node
            clone.argumentNodeList.argument = clone.argument;
            
            // The crucial step: link the clone to its origin
            clone.provenance.push(this.id);
        }
        
        return clone;
    }
    
    /**
     * Highlights the sqrt node and its argument
     */
    highlightAll() {
        this.select();
        
        if (this.argument && this.argument.highlightAll) {
            this.argument.highlightAll();
        }
    }
    
    /**
     * Unhighlights the sqrt node and its argument
     */
    unhighlightAll() {
        this.deselect();
        
        if (this.argument && this.argument.unhighlightAll) {
            this.argument.unhighlightAll();
        }
    }

    /**
     * Converts the omdSqrtNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = {
            type: 'FunctionNode',
            fn: { type: 'SymbolNode', name: 'sqrt', clone: function() { return {...this}; } },
            args: this.argument ? [this.argument.toMathJSNode()] : []
        };

        // Add a clone method to maintain compatibility with math.js's expectations.
        astNode.clone = function() {
            const clonedNode = { ...this };
            if (this.args) {
                clonedNode.args = this.args.map(arg => arg.clone());
            }
            if (this.fn && typeof this.fn.clone === 'function') {
                clonedNode.fn = this.fn.clone();
            }
            return clonedNode;
        };
        return astNode;
    }
    /**
     * Converts the square root node to a string representation.
     * @returns {string} The string representation.
     */
    toString() {
        return `sqrt(${this.argument ? this.argument.toString() : ''})`;
    }

    /**
     * Evaluate the root expression.
     * @param {Object} variables - Variable name to value mapping
     * @returns {number} The evaluated root
     */
    evaluate(variables = {}) {
        if (!this.argument || !this.argument.evaluate) {
            return NaN;
        }
        const radicandValue = this.argument.evaluate(variables);
        if (radicandValue < 0) {
            return NaN; // Or handle complex numbers if desired
        }
        return Math.sqrt(radicandValue);
    }

    /**
     * Check if this is a square root (index = 2).
     * @returns {boolean}
     */
    isSquareRoot() {
        return true;
    }

    /**
     * Check if this is a cube root (index = 3).
     * @returns {boolean}
     */
    isCubeRoot() {
        return false;
    }

    /**
     * Convert to equivalent power notation.
     * @returns {omdPowerNode} Equivalent power expression
     */
    toPowerForm() {
        if (!this.argument) return null;

        const powerAst = {
            type: 'OperatorNode', op: '^', fn: 'pow',
            args: [
                this.argument.toMathJSNode(),
                omdConstantNode.fromNumber(0.5).toMathJSNode()
            ]
        };
        return new omdPowerNode(powerAst);
    }

    /**
     * Create a root node from a string.
     * @static
     * @param {string} expressionString - Expression with root
     * @returns {omdSqrtNode}
     */
    static fromString(expressionString) {
        try {
            const ast = window.math.parse(expressionString);
            if (ast.type === 'FunctionNode' && ast.fn.name === 'sqrt') {
                return new omdSqrtNode(ast);
            }
            throw new Error("Expression is not a 'sqrt' function.");
        } catch (error) {
            console.error("Failed to create sqrt node from string:", error);
            throw error;
        }
    }
}