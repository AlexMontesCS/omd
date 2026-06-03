import { omdNode } from "./omdNode.js";
import { getTextBounds } from "./omdTextMetrics.js";
import { OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { jsvgTextLine } from '@teachinglab/jsvg';

/**
 * Represents a leaf in the AST tree, such as an operator, constant, variable, or grouping symbol.
 * @extends omdNode
 */
export class omdLeafNode extends omdNode {
    /**
     * Creates a leaf node from the AST data.
     * @param {Object} astNodeData - The AST node containing leaf information.
     */
    constructor(nodeData) {
        super(nodeData);
        this.type = "omdLeafNode";
    }

    /**
     * Creates and positions the text element for the constant
     * @param {string|number} text - The text content to display.
     */
    createTextElement(text) {
        let textElement = new jsvgTextLine();
        textElement.setText(text);
        textElement.setFontFamily(OMD_MATH_FONT_FAMILY);

        textElement.setTextAnchor('middle');
        textElement.svgObject.setAttribute('dominant-baseline', 'middle');
        
        this.addChild(textElement);

        return textElement;
    }

    clone() {
        const clone = new this.constructor(this.astNodeData);
        
        // The crucial step: link the clone to its origin
        clone.provenance.push(this.id);
        
        return clone;
    }

    updateTextElement(text) {
        this.textElement.setText(text);
    }

    /**
     * Calculates the dimensions of the node
     * @override
     */
    computeDimensions() {
        // Gerard: Checks for parent fontSize property and updates size accordingly
        let fontSize = this.getFontSize();
        this.textElement.setFontSize(fontSize);

        // Gerard: Gets text bounds based on fontSize using temporary span element
        const fontFamily = this.textElement.svgObject?.style?.fontFamily || OMD_MATH_FONT_FAMILY;
        let bounds = getTextBounds(this.textElement.getText(), fontSize, fontFamily);
        this.setWidthAndHeight(bounds.width, bounds.height);
    }

    /**
     * Updates the position of the node
     * @override
     */
    updateLayout() {
        this.updateTextPosition();
    }

    /**
     * Updates the position of the text
     * @private
     */
    updateTextPosition() {
        this.textElement.setPosition(this.width / 2, this.height / 2);
    }
}
