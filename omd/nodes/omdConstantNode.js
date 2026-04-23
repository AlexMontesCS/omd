import { omdLeafNode } from "./omdLeafNode.js";
import { omdColor } from "../../src/omdColor.js";

/**
 * Leaf node that represents a numerical constant.
 * @extends omdLeafNode
 */
export class omdConstantNode extends omdLeafNode {
    /**
     * Creates object from AST data.
     * @param {Object} astNodeData - The AST node containing leaf information.
     */
    constructor(nodeData) {
        super(nodeData);
        this.type = "omdConstantNode";

        this.number = this.parseNumber(nodeData);

        this.textElement = super.createTextElement(this.number);
    }

    parseNumber(nodeData) {
        if (typeof nodeData === "number")
            return nodeData;

        return nodeData.value;
    }
    
    parseType() {
        return "constant";
    }

    /**
     * Calculates the dimensions of the node.
     * Adds padding around the node.
     * @override
     */
    computeDimensions() {
        super.computeDimensions();

        const ratio = this.getFontSize() / this.getRootFontSize();
        const padding = 4 * ratio;
        let paddedWidth = this.width + padding;
        let paddedHeight = this.height + padding;
        this.setWidthAndHeight(paddedWidth, paddedHeight);
    }

    /**
     * Updates the layout of the node.
     * @override
     */
    updateLayout() {
        super.updateLayout();
    }

    /**
     * A constant node is constant if its value is a number.
     * @returns {boolean}
     */
    isConstant() {
        return typeof this.number === 'number';
    }

    /**
     * The value of a constant node is its own value.
     * @returns {number}
     */
    getValue() {
        return this.number;
    }

    /**
     * Converts the constant node to a string.
     * @returns {string} The string value of the constant.
     */
    toString() {
        return this.number.toString();
    }

    /**
     * Evaluates the constant node.
     * @returns {number} The numeric value of the constant.
     */
    evaluate() {
        return this.number;
    }

    /**
     * Retrieves the rational value of the node as a numerator/denominator pair.
     * @returns {{num: number, den: number}}
     */
    getRationalValue() {
        return { num: this.getValue(), den: 1 };
    }

    /**
     * Converts the omdConstantNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = { 
            type: 'ConstantNode', 
            value: this.number,
            id: this.id,
            provenance: this.provenance 
        };
        // Add a clone method to maintain compatibility with math.js's expectations.
        astNode.clone = function() {
            return { ...this };
        };
        return astNode;
    }

    highlight(color) {
        super.highlight(color);
        if (this.textElement) {
            this.setHighlightForeground(this.textElement, omdColor.white);
        }
    }

    clearProvenanceHighlights() {
        super.clearProvenanceHighlights();
        if (this.textElement) {
            this.restoreHighlightForeground(this.textElement, omdColor.text);
        }
    }
    
    /**
     * Create a constant node from a numeric value.
     * @param {number} value - The numeric value
     * @returns {omdConstantNode}
     * @static
     */
    static fromValue(value) {
        // Create a minimal AST-like object for the constructor
        const astNodeData = {
            type: 'ConstantNode',
            value: value
        };
        return new omdConstantNode(astNodeData);
    }
}