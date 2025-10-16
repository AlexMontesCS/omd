import { omdLeafNode } from "./omdLeafNode.js";
import { omdColor } from "../../src/omdColor.js";
import { getMultiplicationSymbol } from "../config/omdConfigManager.js";

/**
 * Leaf node that represents an operator symbol.
 * @extends omdLeafNode
 */
export class omdOperatorNode extends omdLeafNode {
    /**
     * Creates a leaf node from the AST data.
     * @param {Object} astNodeData - The AST node containing leaf information.
     */
    constructor(nodeData) {
        super(nodeData);
        this.type = "omdOperatorNode";

        this.opName = this.parseOpName(nodeData);

        // Use configured multiplication symbol for display while keeping internal opName as '*'
        const displaySymbol = this.opName === '*' ? getMultiplicationSymbol() : this.opName;
        this.textElement = super.createTextElement(displaySymbol);
    }

    parseOpName(nodeData) {
        if (typeof nodeData === "string")
            return nodeData;

        // Use a map for user-friendly display of operators
        const operatorMap = {
            'multiply': getMultiplicationSymbol(),
            'divide': '÷',
            'add': '+',
            'subtract': '−',
            'pow': '^',
            'unaryMinus': '-',
            'unaryPlus': '+'
        };

        const op = nodeData.op || nodeData.fn;
        return operatorMap[op] || op;
    }

    parseType() {
        return "operator";
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
     * Converts the omdOperatorNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        // This node is purely visual; its properties are used by its parent.
        // It reconstructs a minimal AST for cloning purposes.
        const astNode = {
            type: 'OperatorNode', 
            op: this.opName, 
            fn: this.opName, // Simplification, may need adjustment for complex ops
            args: []
        };
        astNode.clone = function() {
            const clone = { ...this };
            clone.argumentNodeList.argument = clone.argument;
            return clone;
        };
        return astNode;
    }

    toString() {
        return this.opName;
    }

    highlight(color) {
        super.highlight(color);
        if (this.opLabel) {
            this.opLabel.setFillColor(omdColor.white);
        }
    }

    clearProvenanceHighlights() {
        super.clearProvenanceHighlights();
        if (this.opLabel) {
            this.opLabel.setFillColor(omdColor.text);
        }
    }
}