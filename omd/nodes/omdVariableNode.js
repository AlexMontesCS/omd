import { omdLeafNode } from "./omdLeafNode.js";
import { omdColor } from "../../src/omdColor.js";
import { jsvgTextLine } from '@teachinglab/jsvg';
/**
 * Leaf node that represents a variable.
 * @extends omdLeafNode
 */
export class omdVariableNode extends omdLeafNode {
    /**
     * Creates a leaf node from the AST data.
     * @param {Object} astNodeData - The AST node containing leaf information.
     */
    constructor(nodeData) {
        super(nodeData);
        this.type = "omdVariableNode";

        this.name = this.parseName(nodeData);
        
        this.textElement = super.createTextElement(this.name);
    }

    parseName(nodeData) {
        if (typeof nodeData === "string")
            return nodeData;

        return nodeData.name;
    }

    parseType() {
        return "variable";
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
     * Converts the omdVariableNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = { 
            type: 'SymbolNode', 
            name: this.name,
            id: this.id,
            provenance: this.provenance
        };
        astNode.clone = function() {
            return { ...this };
        };
        return astNode;
    }

    highlight(color) {
        super.highlight(color);
        if (this.textElement) {
            this.textElement.setFillColor(omdColor.white);
        }
    }

    clearProvenanceHighlights() {
        super.clearProvenanceHighlights();
        if (this.textElement) {
            this.textElement.setFillColor(omdColor.text);
        }
    }

    /**
     * Converts the variable node to a string.
     * @returns {string} The name of the variable.
     */
    toString() {
        return this.name;
    }

    /**
     * Evaluates the variable by looking up its value in a map.
     * @param {Object} variables - A map of variable names to their numeric values.
     * @returns {number} The value of the variable.
     */
    evaluate(variables = {}) {
        if (Object.prototype.hasOwnProperty.call(variables, this.name)) {
            return variables[this.name];
        }
        throw new Error(`Variable '${this.name}' is not defined.`);
    }
    
    /**
    
    /**
     * Create a variable node from a name.
     * @param {string} name - The variable name
     * @returns {omdVariableNode}
     * @static
     */
    static fromName(name) {
        // Create a minimal AST-like object for the constructor
        const astNodeData = {
            type: 'SymbolNode',
            name: name
        };
        return new omdVariableNode(astNodeData);
    }
}