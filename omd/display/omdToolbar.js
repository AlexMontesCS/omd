import { omdEquationSequenceNode } from '../nodes/omdEquationSequenceNode.js';
import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdColor } from '../../src/omdColor.js';
import { jsvgGroup, jsvgRect, jsvgLayoutGroup, jsvgButton } from '@teachinglab/jsvg';

/**
 * A toolbar component for applying mathematical operations to an omdEquationSequenceNode.
 */
export class omdToolbar {
    /**
     * Creates an instance of the omdToolbar.
     * @param {jsvgGroup} parentContainer - The parent SVG group to render the toolbar into.
     * @param {omdEquationSequenceNode} sequence - The sequence node to apply operations to.
     * @param {object} [options={}] - Configuration options for the toolbar.
     */
    constructor(parentContainer, sequence, options = {}) {
        this.parentContainer = parentContainer;
        this.sequence = sequence;

        this.config = {
            height: 60, padding: 6, spacing: 8, borderRadius: 30,
            fontFamily: "'Albert Sans', sans-serif", fontWeight: '500',
            colors: { background: omdColor.mediumGray, button: 'white', popup: omdColor.lightGray, undo: '#87D143' },
            buttonSize: 48, checkMarkSize: 24, mainFontSize: 32,
            inputFontSize: 28, menuFontSize: 24, inputWidth: 120,
            popupDirection: 'below',
            showUndoButton: false,
            undoIconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzciIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCAzNyA0NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGQ9Ik0xOC4zNjc2IDQzLjgzMDFDMTMuNTkxMyA0My44MjM3IDkuMDEyNTYgNDEuOTIzNCA1LjYzNTI1IDM4LjU0NTlDMi4yNTc5MiAzNS4xNjg1IDAuMzU3NjYgMzAuNTg5OSAwLjM1MTA3NCAyNS44MTM2QzAuMzUxMDc0IDI1LjMxOTQgMC41NDc0NDEgMjQuODQ1MiAwLjg5Njk2MSAyNC40OTU4QzEuMjQ2NDggMjQuMTQ2MiAxLjcyMDU1IDIzLjk0OTggMi4yMTQ4NSAyMy45NDk4QzIuNzA5MTUgMjMuOTQ5OCAzLjE4MzIyIDI0LjE0NjIgMy41MzI3NCAyNC40OTU4QzMuODgyMjYgMjQuODQ1MiA0LjA3ODYzIDI1LjMxOTQgNC4wNzg2MyAyNS44MTM2QzQuMDc4NjMgMjguNjM5NiA0LjkxNjY2IDMxLjQwMjIgNi40ODY3NSAzMy43NTIxQzguMDU2ODUgMzYuMTAxOSAxMC4yODg1IDM3LjkzMzQgMTIuODk5NCAzOS4wMTQ5QzE1LjUxMDMgNDAuMDk2NCAxOC4zODM1IDQwLjM3OTQgMjEuMTU1MyAzOS44MjhDMjMuOTI3MSAzOS4yNzY4IDI2LjQ3MyAzNy45MTU3IDI4LjQ3MTUgMzUuOTE3NUMzMC40Njk3IDMzLjkxOTEgMzEuODMwOCAzMS4zNzMxIDMyLjM4MTkgMjguNjAxM0MzMi45MzM0IDI1LjgyOTUgMzIuNjUwMyAyMi45NTYzIDMxLjU2ODggMjAuMzQ1NkMzMC40ODczIDE3LjczNDUgMjguNjU1OSAxNS41MDI5IDI2LjMwNiAxMy45MzI4QzIzLjk1NjIgMTIuMzYyNyAyMS4xOTM2IDExLjUyNDcgMTguMzY3NiAxMS41MjQ3SDEyLjE1NUMxMS42NjA3IDExLjUyNDcgMTEuMTg2NiAxMS4zMjgzIDEwLjgzNzEgMTAuOTc4OEMxMC40ODc2IDEwLjYyOTMgMTAuMjkxMiAxMC4xNTUyIDEwLjI5MTIgOS42NjA5QzEwLjI5MTIgOS4xNjY2IDEwLjQ4NzYgOC42OTI1MyAxMC44MzcxIDguMzQzMDFDMTEuMTg2NiA3Ljk5MzQ5IDExLjY2MDcgNy43OTcxMiAxMi4xNTUgNy43OTcxMkgxOC4zNjc2QzIzLjE0NTggNy43OTcxMiAyNy43Mjg1IDkuNjk1MjkgMzEuMTA3MSAxMy4wNzRDMzQuNDg2IDE2LjQ1MjggMzYuMzg0MSAyMS4wMzU0IDM2LjM4NDEgMjUuODEzNkMzNi4zODQxIDMwLjU5MTkgMzQuNDg2IDM1LjE3NDUgMzEuMTA3MSAzOC41NTMyQzI3LjcyODUgNDEuOTMyMSAyMy4xNDU4IDQzLjgzMDEgMTguMzY3NiA0My44MzAxWiIgZmlsbD0id2hpdGUiLz4NCjxwYXRoIGQ9Ik0xOC4zNjc1IDE4Ljk3OThDMTguMTIyNyAxOC45ODEgMTcuODc5OSAxOC45MzMzIDE3LjY1MzggMTguODM5NEMxNy40Mjc3IDE4Ljc0NTQgMTcuMjIyNyAxOC42MDczIDE3LjA1MDQgMTguNDMzMUw5LjU5NTM2IDEwLjk3OEM5LjI0NjM0IDEwLjYyODYgOS4wNTAyOSAxMC4xNTQ5IDkuMDUwMjkgOS42NjA5NkM5LjA1MDI5IDkuMTY3MDYgOS4yNDYzNCA4LjY5MzM2IDkuNTk1MzYgOC4zNDM4OUwxNy4wNTA0IDAuODg4Nzg5QzE3LjIyMTIgMC43MDU2NjcgMTcuNDI2OSAwLjU1ODgwMSAxNy42NTU1IDAuNDU2OTM5QzE3Ljg4NDIgMC4zNTUwNzggMTguMTMwOSAwLjMwMDMwOCAxOC4zODEyIDAuMjk1ODg0QzE4LjYzMTQgMC4yOTE0NjEgMTguODc5OSAwLjMzNzUwOCAxOS4xMTIgMC40MzEyNDRDMTkuMzQ0MSAwLjUyNDk3OSAxOS41NTQ5IDAuNjY0NDg5IDE5LjczMTggMC44NDE0NzNDMTkuOTA5IDEuMDE4NDYgMjAuMDQ4NCAxLjIyOTI5IDIwLjE0MjEgMS40NjEzNEMyMC4yMzYgMS42OTM0MiAyMC4yODIgMS45NDIgMjAuMjc3NSAyLjE5MjI0QzIwLjI3MyAyLjQ0MjUxIDIwLjIxODQgMi42ODkzIDIwLjExNjUgMi45MTc5MkMyMC4wMTQ2IDMuMTQ2NTQgMTkuODY3NyAzLjM1MjMgMTkuNjg0NiAzLjUyMjkzTDEzLjU0NjUgOS42NjA5NkwxOS42ODQ2IDE1Ljc5OUMyMC4wMzM3IDE2LjE0ODUgMjAuMjI5OCAxNi42MjIyIDIwLjIyOTggMTcuMTE2QzIwLjIyOTggMTcuNjEgMjAuMDMzNyAxOC4wODM3IDE5LjY4NDYgMTguNDMzMUMxOS41MTI2IDE4LjYwNzMgMTkuMzA3MyAxOC43NDU0IDE5LjA4MTIgMTguODM5NEMxOC44NTUxIDE4LjkzMzMgMTguNjEyNSAxOC45ODEgMTguMzY3NSAxOC45Nzk4WiIgZmlsbD0id2hpdGUiLz4NCjwvc3ZnPg0K',
            onUndo: null,
            ...options
        };

        // Support structured styles from equation stack toolbar options
        if (options.styles && typeof options.styles === 'object') {
            const s = options.styles;
            if (s.backgroundColor) this.config.colors.background = s.backgroundColor;
            if (s.buttonColor) this.config.colors.button = s.buttonColor;
            if (s.popupBackgroundColor) this.config.colors.popup = s.popupBackgroundColor;
            if (typeof s.borderRadius === 'number') this.config.borderRadius = s.borderRadius;
            if (typeof s.buttonSize === 'number') this.config.buttonSize = s.buttonSize;
            if (typeof s.mainFontSize === 'number') this.config.mainFontSize = s.mainFontSize;
            if (typeof s.inputFontSize === 'number') this.config.inputFontSize = s.inputFontSize;
            if (typeof s.menuFontSize === 'number') this.config.menuFontSize = s.menuFontSize;
            if (typeof s.inputWidth === 'number') this.config.inputWidth = s.inputWidth;
            if (typeof s.padding === 'number') this.config.padding = s.padding;
            if (typeof s.spacing === 'number') this.config.spacing = s.spacing;
        }

        // Simple aliases remain supported
        if (options.backgroundColor) this.config.colors.background = options.backgroundColor;
        if (options.popupBackgroundColor) this.config.colors.popup = options.popupBackgroundColor;

        // If no explicit popup color was provided, default it to the toolbar background color
        const popupProvided = !!(options.popupBackgroundColor || (options.styles && options.styles.popupBackgroundColor));
        if (!popupProvided) {
            this.config.colors.popup = this.config.colors.background;
        }

        this.state = {
            activePopup: null,
            selectedOperation: '+',
            inputValue: ''
        };

        this.elements = {};
        this._render();
        this._updateApplyButtonState();
    }

    /**
     * Renders the initial toolbar UI components.
     * @private
     */
    _render() {
        this.elements.toolbarGroup = new jsvgGroup();
        this.parentContainer.addChild(this.elements.toolbarGroup);
        if (this.config.x || this.config.y) {
            this.elements.toolbarGroup.setPosition(this.config.x || 0, this.config.y || 0);
        }
        this.elements.toolbarGroup.svgObject.style.userSelect = 'none';

        this.elements.background = new jsvgRect();
        this.elements.background.setWidthAndHeight(362, this.config.height);
        this.elements.background.setCornerRadius(this.config.borderRadius);
        this.elements.background.setFillColor(this.config.colors.background);
        this.elements.toolbarGroup.addChild(this.elements.background);

        this.elements.leftButton = this._createButton({
            text: this.state.selectedOperation,
            callback: () => this._togglePopup('operations')
        });
        this.elements.toolbarGroup.addChild(this.elements.leftButton);

        this.elements.middleInputButton = this._createButton({
            width: this.config.inputWidth,
            text: this.state.inputValue,
            fontSize: this.config.inputFontSize,
            cornerRadius: 10,
            callback: () => this._togglePopup('input')
        });
        this.elements.toolbarGroup.addChild(this.elements.middleInputButton);

        const checkmarkSVG = `<svg width="43" height="33" viewBox="0 0 43 33" xmlns="http://www.w3.org/2000/svg"><rect x="9.86" y="28.63" width="40.04" height="5.74" transform="rotate(-45 9.86 28.63)" fill="black"/><rect x="13.9" y="32.69" width="19.64" height="5.74" transform="rotate(-135 13.9 32.69)" fill="black"/></svg>`;
        this.elements.rightButton = this._createButton({
            svg: checkmarkSVG,
            callback: () => this._applyOperation()
        });
        this.elements.toolbarGroup.addChild(this.elements.rightButton);
        
        if (this.config.showUndoButton) {
            this.elements.undoButton = this._createButton({
                size: this.config.buttonSize,
                iconUrl: this.config.undoIconUrl,
                callback: () => this._handleUndo()
            });
            // Set the circular fill color to requested green
            this.elements.undoButton.setFillColor(this.config.colors.undo || '#87D143');
            this.elements.toolbarGroup.addChild(this.elements.undoButton);
        }
        
        this._updateToolbarLayout();
    }

    /**
     * Moves an SVG element to the top of its parent's stacking order.
     * @param {jsvgObject|undefined} node
     * @private
     */
    _bringToFront(node) {
        try {
            const el = node?.svgObject;
            const parent = el?.parentNode;
            if (el && parent) {
                parent.appendChild(el);
            }
        } catch (_) { /* no-op */ }
    }

    /**
     * Toggles the visibility of a popup menu (operations or input).
     * Ensures only one popup is visible at a time.
     * @param {string} popupType - The type of popup to toggle ('operations' or 'input').
     * @private
     */
    _togglePopup(popupType) {
        if (this.state.activePopup && this.state.activePopup.type === popupType) {
            // Remove from toolbar group to keep transform context consistent
            this.elements.toolbarGroup.removeChild(this.state.activePopup.group);
            this.state.activePopup = null;
            return;
        }

        if (this.state.activePopup) {
            this.elements.toolbarGroup.removeChild(this.state.activePopup.group);
            this.state.activePopup = null;
        }

        let popupGroup;
        if (popupType === 'operations') {
            popupGroup = this._renderOperationsMenu();
        } else if (popupType === 'input') {
            popupGroup = this.state.selectedOperation === 'f'
                ? this._renderFunctionMenu()
                : this._renderDigitGrid();
        }

        if (popupGroup) {
            // Attach to toolbar group so it inherits toolbar counter-scaling (keeps constant on-screen size)
            this.elements.toolbarGroup.addChild(popupGroup);
            this.state.activePopup = { type: popupType, group: popupGroup };
            // Ensure the toolbar and popup are on top of all siblings inside the SVG
            this._bringToFront(this.elements.toolbarGroup);
            this._bringToFront(popupGroup);
        }
    }

    /**
     * Creates and positions a generic popup group.
     * @param {Function} contentFactory - A function that returns the jsvgGroup content for the popup.
     * @param {jsvgGroup} anchorButton - The button to anchor the popup to.
     * @returns {jsvgGroup} The fully rendered and positioned popup group.
     * @private
     */
    _renderPopup(contentFactory, anchorButton) {
        const popupGroup = new jsvgGroup();
        // Ensure popup captures interactions and overlays content
        if (popupGroup.svgObject) {
            popupGroup.svgObject.style.pointerEvents = 'auto';
        }
        const content = contentFactory();
        
        const bgWidth = content.width + 16;
        const bgHeight = content.height + 16;

        const background = new jsvgRect();
        background.setWidthAndHeight(bgWidth, bgHeight);
        background.setCornerRadius(this.config.borderRadius);
        background.setFillColor(this.config.colors.popup);
        popupGroup.addChild(background);

        content.setPosition(8, 8);
        popupGroup.addChild(content);
        popupGroup.width = bgWidth;
        popupGroup.height = bgHeight;

        // Anchor centered horizontally on the button, in toolbar-local coordinates
        const popupX = anchorButton.xpos + (anchorButton.width / 2) - (bgWidth / 2);

        // Determine vertical placement based on configuration (toolbar-local coordinates)
        const placeAbove = String(this.config.popupDirection || 'below') === 'above';
        const popupY = placeAbove
            ? (anchorButton.ypos) - bgHeight - this.config.spacing
            : (anchorButton.ypos + anchorButton.height + this.config.spacing);
        popupGroup.setPosition(Math.round(popupX), Math.round(popupY));

        return popupGroup;
    }

    /**
     * Renders the operations menu popup ('f', '÷', '×', '–', '+').
     * @returns {jsvgGroup} The rendered operations menu group.
     * @private
     */
    _renderOperationsMenu() {
        const operations = ['f', '÷', '×', '–', '+'];
        return this._renderPopup(() => {
            const layout = new jsvgLayoutGroup({ spacer: this.config.spacing });
            operations.forEach(op => {
                const button = this._createButton({ text: op, fontSize: this.config.menuFontSize, callback: () => this._selectOperation(op) });
                layout.addChild(button);
            });
            layout.doVerticalLayout();
            return layout;
        }, this.elements.leftButton);
    }
    
    /**
     * Renders the function selection menu popup ('sqrt', 'cos', etc.).
     * @returns {jsvgGroup} The rendered function menu group.
     * @private
     */
    _renderFunctionMenu() {
        const functions = ['sqrt', 'cos', 'sin', 'tan', 'ln'];
        return this._renderPopup(() => {
            const layout = new jsvgLayoutGroup({ spacer: this.config.spacing });
            functions.forEach(func => {
                const button = this._createButton({
                    width: 80, height: 48, cornerRadius: 10, text: func,
                    fontSize: this.config.inputFontSize, callback: () => this._handleFunctionClick(func)
                });
                layout.addChild(button);
            });
            layout.doVerticalLayout();
            return layout;
        }, this.elements.middleInputButton);
    }

    /**
     * Renders the digit grid (number pad) popup.
     * @returns {jsvgGroup} The rendered digit grid group.
     * @private
     */
    _renderDigitGrid() {
        const digits = [ ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['←', '0', 'x'] ];
        return this._renderPopup(() => {
            const layout = new jsvgLayoutGroup({ spacer: this.config.spacing });
            digits.forEach(rowItems => {
                const rowGroup = new jsvgLayoutGroup({ spacer: this.config.spacing });
                rowItems.forEach(digit => {
                    const button = this._createButton({ text: digit, fontSize: this.config.inputFontSize, callback: () => this._handleDigitClick(digit) });
                    rowGroup.addChild(button);
                });
                rowGroup.doHorizontalLayout();
                layout.addChild(rowGroup);
            });
            layout.doVerticalLayout();
            return layout;
        }, this.elements.middleInputButton);
    }

    /**
     * Handles clicks on the function menu buttons.
     * @param {string} func - The name of the function that was clicked.
     * @private
     */
    _handleFunctionClick(func) {
        this.setInputText(func);
        this._togglePopup('input');
    }

    /**
     * Handles clicks on the digit grid buttons.
     * @param {string} digit - The digit or action ('←') that was clicked.
     * @private
     */
    _handleDigitClick(digit) {
        if (digit === '←') {
            this.state.inputValue = this.state.inputValue.slice(0, -1);
        } else {
            this.state.inputValue += digit;
        }
        this.setInputText(this.state.inputValue);
    }

    /**
     * Sets the text of the middle input button.
     * @param {string} text - The text to display.
     */
    setInputText(text) {
        this.state.inputValue = text;
        const button = this.elements.middleInputButton;
        button.setText(text);
        
        // Get the button's text element and set font size
        const textElement = button.buttonText;
        textElement.setFontSize(this.config.inputFontSize);
        
        this._updateApplyButtonState();
    }

    /**
     * Handles the selection of a new operation from the menu.
     * @param {string} operation - The selected operation symbol.
     * @private
     */
    _selectOperation(operation) {
        // Clear input text when switching to or from function mode.
        if (this.state.selectedOperation === 'f' || operation === 'f') {
            this.setInputText('');
        }

        this.state.selectedOperation = operation;
        this.elements.leftButton.setText(operation);
        this._togglePopup('operations');

        // If we switched to function mode and the input popup was open, refresh it.
        if (operation === 'f' && this.state.activePopup?.type === 'input') {
             this._togglePopup('input'); // Close number pad
             this._togglePopup('input'); // Open function menu
        }
    }

    /**
     * Applies the selected operation and value to the sequence.
     * @private
     */
    _applyOperation() {
        const op = this.state.selectedOperation;
        const val = this.state.inputValue;

        if (!this.sequence || val === '') return;

        if (op === 'f') {
            this.sequence.applyEquationFunction(val);
        } else {
            const operationMap = {
                '÷': 'divide',
                '×': 'multiply',
                '–': 'subtract',
                '+': 'add'
            };
            const operationName = operationMap[op];
            let valueToApply;
            let isValid = false;
            // Try to parse as number first
            const numericValue = parseFloat(val);
            if (!isNaN(numericValue) && String(numericValue) === val.trim()) {
                valueToApply = numericValue;
                isValid = true;
            } else if (typeof window.math !== 'undefined' && window.math.parse) {
                try {
                    valueToApply = window.math.parse(val);
                    isValid = true;
                } catch (e) {
                    isValid = false;
                }
            }
            if (operationName && isValid) {
                this.sequence.applyEquationOperation(valueToApply, operationName);
            }
        }

        // Clear the input after applying the operation
        this.setInputText('');

        if (this.state.activePopup) {
            // Remove from toolbar group where it was attached
            this.elements.toolbarGroup.removeChild(this.state.activePopup.group);
            this.state.activePopup = null;
        }

        // Notify host to refresh display and any active external visualizations
        try {
            if (typeof window !== 'undefined') {
                if (typeof window.refreshDisplayAndFilters === 'function') {
                    window.refreshDisplayAndFilters();
                }
                if (typeof window.onOMDOperationApplied === 'function') {
                    window.onOMDOperationApplied(this.sequence);
                }
            }
        } catch (_) { /* no-op */ }
    }

    /**
     * Creates a button component with the specified configuration.
     * @param {object} config - The button configuration.
     * @param {number} [config.width] - The width of the button.
     * @param {number} [config.height] - The height of the button.
     * @param {number} [config.size] - The size for both width and height.
     * @param {string} [config.text] - The text label for the button.
     * @param {string} [config.svg] - The SVG content for the button icon.
     * @param {number} [config.fontSize] - The font size for the text.
     * @param {number} [config.cornerRadius] - The corner radius of the button.
     * @param {Function} config.callback - The function to call on click.
     * @returns {jsvgButton} The created button.
     * @private
     */
    _createButton({ width, height, size, text, svg, iconUrl, fontSize, cornerRadius, callback }) {
        const button = new jsvgButton();
        const w = width || size || this.config.buttonSize;
        const h = height || size || this.config.buttonSize;
        button.setWidthAndHeight(w, h);
        button.setCornerRadius(cornerRadius !== undefined ? cornerRadius : w / 2);
        button.setFillColor(this.config.colors.button);
        button.setText(text || '');
        button.setFontSize(fontSize || this.config.mainFontSize);
        button.setFontFamily(this.config.fontFamily);
        button.buttonText.setFontWeight(this.config.fontWeight);
        
        // Adjust vertical position of text for better centering
        button.buttonText.setPosition(w/2, h/2 + (fontSize || this.config.mainFontSize)/3);

        if (svg) {
            const dataURI = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
            button.addImage(dataURI, this.config.checkMarkSize, this.config.checkMarkSize);
        } else if (iconUrl) {
            // Use default icon size (same as checkmark) centered inside the circular button
            const sz = this.config.checkMarkSize;
            button.addImage(iconUrl, sz, sz);
        }

        button.setClickCallback(callback);
        return button;
    }

    /**
     * Updates the enabled/disabled state of the apply button.
     * @private
     */
    _updateApplyButtonState() {
        const button = this.elements.rightButton;
        const hasValue = this.state.inputValue.length > 0;

        if (hasValue) {
            button.setOpacity(1.0);
            button.setClickCallback(() => this._applyOperation());
        } else {
            button.setOpacity(0.5);
            button.setClickCallback(null);
        }
    }

    /**
     * Updates the positions of the toolbar elements.
     * @private
     */
    _updateToolbarLayout() {
        const totalWidth = this.config.buttonSize * 2 + this.config.inputWidth + this.config.spacing * 2 + this.config.padding * 2;
        this.elements.background.setWidth(totalWidth);
        
        const yPos = this.config.padding;
        let xPos = this.config.padding;

        this.elements.leftButton.setPosition(xPos, yPos);
        xPos += this.elements.leftButton.width + this.config.spacing;

        this.elements.middleInputButton.setPosition(xPos, yPos);
        xPos += this.elements.middleInputButton.width + this.config.spacing;

        this.elements.rightButton.setPosition(xPos, yPos);

        // Position optional undo button directly to the right of the toolbar background
        if (this.elements.undoButton) {
            const undoX = this.elements.background.width + this.config.spacing;
            this.elements.undoButton.setPosition(undoX, yPos);
        }
    }

    _handleUndo() {
        if (typeof this.config.onUndo === 'function') {
            try { this.config.onUndo(this.sequence); } catch (_) {}
            return;
        }
        // Fallback: emit a global hook
        try {
            if (typeof window !== 'undefined' && typeof window.onOMDToolbarUndo === 'function') {
                window.onOMDToolbarUndo(this.sequence);
            }
        } catch (_) { /* no-op */ }
    }
} 