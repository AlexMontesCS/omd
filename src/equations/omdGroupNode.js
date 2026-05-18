import { omdLeafNode } from "./omdLeafNode.js";

/**
 * Leaf node that represents a variable.
 * @extends omdLeafNode
 */
export class omdGroupNode extends omdLeafNode {
    /**
     * Creates a leaf node from the AST data.
     * @param {Object} astNodeData - The AST node containing leaf information.
     * @param {String} groupingSymbol - A character representing the grouping symbol, e.g. ( or )
     */
    constructor(nodeData) {
        super(nodeData);
        this.type = "omdGroupNode";

        this.symbol = this.parseSymbol(nodeData);
        
        this.textElement = super.createTextElement(this.symbol);
    }

    parseSymbol(nodeData) {
        return nodeData;
    }
    
    parseType() {
        return "parenthesis";
    }

    clone() {
        const clone = new omdGroupNode(this.text);
        
        // The crucial step: link the clone to its origin
        clone.provenance.push(this.id);
        
        return clone;
    }

    /**
     * Calculates the dimensions of the node.
     * Does NOT add padding, unlike other leaf nodes.
     * @override
     */
    computeDimensions() {
        super.computeDimensions();
    }

    /**
     * Updates the layout of the node.
     * @override
     */
    updateLayout() {
        super.updateLayout();
    }

    /**
     * Converts the omdGroupNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        // This node is purely visual (like parentheses); it's represented by its symbol.
        const astNode = { type: 'SymbolNode', name: this.symbol };
        astNode.clone = function() {
            return { ...this };
        };
        return astNode;
    }
}