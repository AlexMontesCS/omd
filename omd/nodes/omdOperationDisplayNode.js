import { omdNode } from "./omdNode.js";
import { omdVariableNode } from "./omdVariableNode.js";
import { getNodeForAST } from "../core/omdUtilities.js";
import { getMultiplicationSymbol } from "../config/omdConfigManager.js";

/**
 * Represents a visual node for displaying an operation applied to both sides of an equation.
 * Shows both operations with appropriate spacing between them.
 * Example: -3   -3
 */
export class omdOperationDisplayNode extends omdNode {
    static OPERATOR_SYMBOLS = {
        'add': '+',
        'subtract': '-',
        'multiply': '×',
        'divide': '÷'
    };

    /**
     * Creates an operation display node.
     * @param {string} operation - The type of operation (e.g., 'add', 'subtract', 'multiply', 'divide').
     * @param {number|string|omdNode} value - The value being applied. Can be a number, variable name, or an omdNode.
     */
    constructor(operation, value) {
        super({});
        this.operation = operation;
        this.value = value;
        this.type = "omdOperationDisplayNode";

        this._initializeDisplay();
        this._createOperationElements();
        this._disableAllInteractions();
        this._addChildElements();
    }

    /**
     * @private
     */
    _initializeDisplay() {
        this.hideBackgroundByDefault();
        if (this.backRect) {
            this.backRect.setOpacity(0);
            this.backRect.setFillColor("transparent");
        }
        // Ensure this node never highlights
        this._makeNodeNonHighlightable();
    }

    /**
     * @private
     */
    _createOperationElements() {
        const symbol = this._getOperatorSymbol(this.operation);
        // Render each side as a single node token: "(op+value)" e.g., "(-5)"
        const tokenText = `${symbol}${this._valueToString(this.value)}`;
        this.leftToken = new omdVariableNode(tokenText);
        this.rightToken = new omdVariableNode(tokenText);
        // Ensure tokens are fully initialized and sized
        if (typeof this.leftToken.initialize === 'function') this.leftToken.initialize();
        if (typeof this.rightToken.initialize === 'function') this.rightToken.initialize();
        // Propagate font size if available
        const fs = (typeof this.getFontSize === 'function') ? this.getFontSize() : null;
        if (fs && typeof this.leftToken.setFontSize === 'function') this.leftToken.setFontSize(fs);
        if (fs && typeof this.rightToken.setFontSize === 'function') this.rightToken.setFontSize(fs);
        
        // Immediately disable highlighting for created elements
        [this.leftToken, this.rightToken].forEach(element => {
            this._disableHighlighting(element);
        });
    }

    /**
     * @private
     */
    _disableAllInteractions() {
        [this.leftToken, this.rightToken].forEach(element => {
            this._disableElement(element);
        });
    }

    /**
     * @private
     */
    _addChildElements() {
        this.addChild(this.leftToken);
        this.addChild(this.rightToken);
    }

    /**
     * Converts the operation string to its display symbol.
     * @param {string} operation
     * @returns {string} The symbol.
     * @private
     */
    _getOperatorSymbol(operation) {
        return omdOperationDisplayNode.OPERATOR_SYMBOLS[operation] || '';
    }

    /**
     * Creates an appropriate omdNode for the value.
     * @param {number|string|omdNode} value
     * @returns {omdNode}
     * @private
     */
    _createValueElement(value) {
        // Not used in combined-token approach, retained for compatibility
        return new omdVariableNode(this._valueToString(value));
    }

    _valueToString(value) {
        if (value instanceof omdNode) {
            return value.toString();
        }
        if (typeof value === 'object' && value !== null) {
            try {
                const NodeClass = getNodeForAST(value);
                const node = new NodeClass(value);
                if (typeof node.initialize === 'function') node.initialize();
                return node.toString();
            } catch {
                return String(value ?? '');
            }
        }
        return String(value ?? '');
    }

    /**
     * Disables background and interactions for an element and all its children
     * @param {omdNode} element - The element to disable
     * @private
     */
    _disableElement(element) {
        if (!element) return;

        this._hideElementBackground(element);
        this._disableMouseInteractions(element);
        this._disableHighlighting(element);
        this._disableChildElements(element);
    }

    /**
     * @private
     */
    _hideElementBackground(element) {
        if (element.backRect) {
            element.hideBackgroundByDefault();
            element.backRect.setOpacity(0);
        }
    }

    /**
     * @private
     */
    _disableMouseInteractions(element) {
        if (element.svgObject) {
            element.svgObject.onmouseenter = null;
            element.svgObject.onmouseleave = null;
            element.svgObject.style.cursor = "default";
        }
    }

    /**
     * @private
     */
    _disableHighlighting(element) {
        // Override highlighting methods to prevent highlighting
        element.setHighlight = () => {};
        element.lowlight = () => {};
        element.setFillColor = () => {};
        
        // Force background to be transparent and stay that way
        if (element.backRect) {
            element.backRect.setOpacity(0);
            element.backRect.setFillColor("transparent");
            // Override the backRect methods too
            element.backRect.setFillColor = () => {};
            element.backRect.setOpacity = () => {};
        }
    }

    /**
     * Makes this node completely non-highlightable
     * @private
     */
    _makeNodeNonHighlightable() {
        // Override all highlighting methods on this node
        this.setHighlight = () => {};
        this.lowlight = () => {};
        this.setFillColor = () => {};
        
        // Force background to be transparent and keep it that way
        if (this.backRect) {
            this.backRect.setOpacity(0);
            this.backRect.setFillColor("transparent");
            // Override backRect methods to prevent any changes
            this.backRect.setFillColor = () => {};
            this.backRect.setOpacity = () => {};
        }
    }

    /**
     * @private
     */
    _disableChildElements(element) {
        if (element.childList) {
            element.childList.forEach(child => this._disableElement(child));
        }
        
        const childProperties = ['left', 'right', 'base', 'exponent', 'argument', 'expression', 'numerator', 'denominator'];
        childProperties.forEach(prop => {
            if (element[prop]) this._disableElement(element[prop]);
        });
    }

    /**
     * Computes the dimensions for the operation display node.
     * Calculates the total width including both operations and the gap.
     */
    computeDimensions() {
        // Ensure children are laid out before measuring
        if (this.leftToken && typeof this.leftToken.updateLayout === 'function') this.leftToken.updateLayout();
        if (this.rightToken && typeof this.rightToken.updateLayout === 'function') this.rightToken.updateLayout();

        const leftWidth = this.leftToken ? this.leftToken.width : 0;
        const rightWidth = this.rightToken ? this.rightToken.width : 0;

        // Simple, fixed gap (keeps equals-centering predictable)
        const gap = typeof this.gap === 'number' ? this.gap : 45;
        this.gap = gap;

        // For sequence alignment
        this.leftClusterWidth = leftWidth;

        const tallest = Math.max(this.leftToken ? this.leftToken.height : 0, this.rightToken ? this.rightToken.height : 0);
        const verticalPadding = 6; // small, constant padding

        const width = leftWidth + gap + rightWidth;
        const height = tallest + verticalPadding * 2;
        this.setWidthAndHeight(width, height);

        
    }

    /**
     * Updates the layout of the operation display node.
     * Positions both operations with appropriate spacing.
     */
    updateLayout() {
        // Update children layouts first
        [this.leftToken, this.rightToken].forEach(element => {
            element.updateLayout();
        });

        this.computeDimensions();

        const padding = 6;
        const gap = this.gap || 30;

        // Calculate positions for both operations using single tokens
        const leftWidthNow = this.leftToken.width;
        
        // Position left token
        let x = 0;
        this.leftToken.setPosition(x, (this.height - this.leftToken.height) / 2);
        
        // Position right token
        x = leftWidthNow + gap;
        this.rightToken.setPosition(x, (this.height - this.rightToken.height) / 2);

        // Show both operations
        this.rightToken.show();

        // Ensure this node remains non-highlightable after layout updates
        this._makeNodeNonHighlightable();

        super.updateLayout();
    }

    /**
     * Returns the effective width of the left operation cluster for equals alignment
     * Used by omdEquationSequenceNode to align like equations
     * @returns {number}
     */
    getLeftWidthForAlignment() {
        // Ensure dimensions are up to date
        if (typeof this.leftClusterWidth !== 'number') {
            this.computeDimensions();
        }
        return this.leftClusterWidth || 0;
    }

    /**
     * Shows only the left operation (hides the right side)
     */
    showLeftOnly() {
        this.rightToken.hide();
        
        // Recalculate dimensions for left side only
        const padding = 6;
        const leftWidth = this.leftToken.width;
        const fs2 = (typeof this.getFontSize === 'function') ? this.getFontSize() : 32;
        const tallest = this.leftToken.height;
        const verticalPadding = Math.ceil(fs2 * 0.35);
        this.setWidthAndHeight(leftWidth, tallest + verticalPadding * 2);
        
        // Reposition with only left side
        let x = 0;
        this.leftToken.setPosition(x, (this.height - this.leftToken.height) / 2);
    }

    



    clone() {
        const clone = new omdOperationDisplayNode(this.operation, this.value);
        clone.provenance.push(this.id);
        // Ensure cloned node is also non-highlightable
        clone._makeNodeNonHighlightable();
        return clone;
    }
}