import { omdNode } from "./omdNode.js";
import { getNodeForAST } from "../core/omdUtilities.js";
import { omdOperatorNode } from "./omdOperatorNode.js";
import { omdBinaryExpressionNode } from "./omdBinaryExpressionNode.js";
import { omdConstantNode } from "./omdConstantNode.js";
import { omdParenthesisNode } from "./omdParenthesisNode.js";
import { omdRationalNode } from "./omdRationalNode.js";
import { omdFunctionNode } from "./omdFunctionNode.js";
import { omdUnaryExpressionNode } from './omdUnaryExpressionNode.js';

/**
 * @global {math} math - The global math.js instance.
 */

export class omdEquationNode extends omdNode {
    constructor(ast) {
        super(ast);
        this.type = "omdEquationNode";

        const type = ast.type || ast.mathjs;

        if (type === "AssignmentNode") {
            const LeftNodeType = getNodeForAST(ast.object);
            this.left = new LeftNodeType(ast.object);

            const RightNodeType = getNodeForAST(ast.value);
            this.right = new RightNodeType(ast.value);

            this.argumentNodeList.left = this.left;
            this.argumentNodeList.right = this.right;

        } else if (ast.args && ast.args.length === 2) { // Fallback for other potential structures
            const LeftNodeType = getNodeForAST(ast.args[0]);
            this.left = new LeftNodeType(ast.args[0]);

            const RightNodeType = getNodeForAST(ast.args[1]);
            this.right = new RightNodeType(ast.args[1]);

            // Ensure argumentNodeList is populated for replacement machinery
            this.argumentNodeList.left = this.left;
            this.argumentNodeList.right = this.right;
        } else {
            // Create dummy nodes to prevent further errors
            this.left = new omdNode({ type: 'SymbolNode', name: 'error' });
            this.right = new omdNode({ type: 'SymbolNode', name: 'error' });
            this.argumentNodeList.left = this.left;
            this.argumentNodeList.right = this.right;
        }

        this.equalsSign = new omdOperatorNode({ type: "OperatorNode", op: "=" });

        this.addChild(this.left);
        this.addChild(this.equalsSign);
        this.addChild(this.right);

        // Optional background style configuration
        this._backgroundStyle = null; // { backgroundColor, cornerRadius, pill }
        this._propagateBackgroundStyle(this._backgroundStyle);
    }

    computeDimensions() {
        this.left.computeDimensions();
        this.equalsSign.computeDimensions();
        this.right.computeDimensions();

        const spacing = 8 * this.getFontSize() / this.getRootFontSize();
        let totalWidth = this.left.width + this.equalsSign.width + this.right.width + (spacing * 2);
        const contentHeight = Math.max(this.left.height, this.equalsSign.height, this.right.height);
        const { padX, padY } = this._getEffectivePadding(contentHeight);
        const maxHeight = contentHeight + (padY * 2);
        totalWidth += (padX * 2);

        this.setWidthAndHeight(totalWidth, maxHeight);
    }

    updateLayout() {
        // Keep argumentNodeList synchronized for replacement machinery
        this.argumentNodeList = { left: this.left, right: this.right };

        const spacing = 8 * this.getFontSize() / this.getRootFontSize();

        const maxBaseline = Math.max(
            this.left.getAlignmentBaseline(),
            this.equalsSign.getAlignmentBaseline(),
            this.right.getAlignmentBaseline()
        );

        // Optional background padding offset (reuse effective padding)
        const contentHeight2 = Math.max(this.left.height, this.equalsSign.height, this.right.height);
        let { padX, padY } = this._getEffectivePadding(contentHeight2);

        let x = padX;

        // Position left node
        this.left.updateLayout();
        this.left.setPosition(x, padY + (maxBaseline - this.left.getAlignmentBaseline()));
        x += this.left.width + spacing;

        // Position equals sign
        this.equalsSign.updateLayout();
        this.equalsSign.setPosition(x, padY + (maxBaseline - this.equalsSign.getAlignmentBaseline()));
        x += this.equalsSign.width + spacing;

        // Position right node
        this.right.updateLayout();
        this.right.setPosition(x, padY + (maxBaseline - this.right.getAlignmentBaseline()));

        // Recompute overall dimensions now that children are positioned (handles tall nodes like rationals)
        this.computeDimensions();

        // Apply configured background styling after layout to ensure correct dimensions
        if (this._backgroundStyle) {
            const { backgroundColor, cornerRadius, pill } = this._backgroundStyle;
            if (backgroundColor) {
                this.backRect.setFillColor(backgroundColor);
                this.backRect.setOpacity(1.0);
                this.defaultOpaqueBack = true;
            }
            if (pill === true) {
                // Pill shape: half the height
                const radius = Math.max(0, Math.floor(this.height / 2));
                this.backRect.setCornerRadius(radius);
                // Also apply pill corners to all descendant nodes so their backgrounds don't show square edges
                this._applyPillToDescendants();
            } else if (typeof cornerRadius === 'number') {
                this.backRect.setCornerRadius(cornerRadius);
            }

            // Make all descendant backgrounds match the equation background color
            if (backgroundColor) {
                this._matchChildBackgrounds(backgroundColor);
            }
        }

        // Ensure the background rectangle always matches the current equation size
        if (this.backRect && (this.width || this.height)) {
            this.backRect.setWidthAndHeight(this.width, this.height);
        }

        // Final pass: center content visually within backRect
        const minTop2 = Math.min(this.left.ypos, this.equalsSign.ypos, this.right.ypos);
        const maxBottom2 = Math.max(
            this.left.ypos + this.left.height,
            this.equalsSign.ypos + this.equalsSign.height,
            this.right.ypos + this.right.height
        );
        const topPad = minTop2;
        const bottomPad = Math.max(0, (this.height || 0) - maxBottom2);
        let deltaY2 = (topPad - bottomPad) / 2 - (0.06 * this.getFontSize());
        if (Math.abs(deltaY2) > 0.01) {
            this.left.setPosition(this.left.xpos, this.left.ypos - deltaY2);
            this.equalsSign.setPosition(this.equalsSign.xpos, this.equalsSign.ypos - deltaY2);
            this.right.setPosition(this.right.xpos, this.right.ypos - deltaY2);
        }
    }

    /**
     * Computes effective padding taking into account defaults, user overrides, and pill radius clamping.
     * @param {number} contentHeight
     * @returns {{padX:number,padY:number}}
     */
    _getEffectivePadding(contentHeight) {
        const ratio = this.getFontSize() / this.getRootFontSize();
        const baseX = 2 * ratio;
        const baseY = 2 * ratio;
        const pad = this._backgroundStyle?.padding;
        let padX = (typeof pad === 'number' ? pad : pad?.x) ?? baseX;
        let padY = (typeof pad === 'number' ? pad : pad?.y) ?? baseY;
        if (this._backgroundStyle?.pill === true) {
            const radius = Math.ceil((contentHeight + 2 * padY) / 2);
            if (padX < radius) padX = radius;
        }
        return { padX, padY };
    }

_propagateBackgroundStyle(style, visited = new Set()) {
    if (visited.has(this)) return;
    visited.add(this);
    this._backgroundStyle = style;

    // Helper to recursively walk any object that might be a node
    function walkNode(node, style, visited) {
        if (!node || visited.has(node)) return;
        visited.add(node);
        if (node._propagateBackgroundStyle) {
            node._propagateBackgroundStyle(style, visited);
            return;
        }

        node._backgroundStyle = style;
        if (Array.isArray(node.childList)) {
            for (const c of node.childList) walkNode(c, style, visited);
        }
        if (node.argumentNodeList) {
            for (const val of Object.values(node.argumentNodeList)) {
                if (Array.isArray(val)) {
                    for (const v of val) walkNode(v, style, visited);
                } else {
                    walkNode(val, style, visited);
                }
            }
        }
    }

    // Propagate to childList
    if (Array.isArray(this.childList)) {
        for (const child of this.childList) {
            walkNode(child, style, visited);
        }
    }

    // Propagate to argumentNodeList (recursively, including arrays)
    if (this.argumentNodeList && typeof this.argumentNodeList === 'object') {
        for (const val of Object.values(this.argumentNodeList)) {
            if (Array.isArray(val)) {
                for (const v of val) {
                    walkNode(v, style, visited);
                }
            } else {
                walkNode(val, style, visited);
            }
        }
    }
}

    /**
     * Applies pill-shaped corner radius to all descendant nodes' backgrounds.
     * Ensures child nodes don't show square corners when the parent equation uses a pill.
     * @private
     */
    _applyPillToDescendants() {
        const visited = new Set();
        const stack = Array.isArray(this.childList) ? [...this.childList] : [];
        while (stack.length) {
            const node = stack.pop();
            if (!node || visited.has(node)) continue;
            visited.add(node);

            if (node !== this && node.backRect && typeof node.backRect.setCornerRadius === 'function') {
                const h = typeof node.height === 'number' && node.height > 0 ? node.height : 0;
                const r = Math.max(0, Math.floor(h / 2));
                node.backRect.setCornerRadius(r);
            }

            if (Array.isArray(node.childList)) {
                for (const c of node.childList) stack.push(c);
            }
            if (node.argumentNodeList && typeof node.argumentNodeList === 'object') {
                for (const val of Object.values(node.argumentNodeList)) {
                    if (Array.isArray(val)) {
                        val.forEach(v => v && stack.push(v));
                    } else if (val) {
                        stack.push(val);
                    }
                }
            }
        }
    }

    /**
     * Creates a value node from a number or a Math.js AST object.
     * @param {number|object} value - The value to convert.
     * @returns {omdNode} The corresponding OMD node.
     * @private
     */
    _createNodeFromValue(value) {
        if (typeof value === 'number') {
            const node = new omdConstantNode({ value });
            node.initialize(); // Constants need initialization to compute dimensions
            return node;
        }
        if (typeof value === 'object' && value !== null) { // It's a mathjs AST
            const NodeClass = getNodeForAST(value);
            const node = new NodeClass(value);
            // Most non-leaf nodes have initialize, but we call it just in case
            if (typeof node.initialize === 'function') {
                node.initialize();
            }
            return node;
        }
        return null;
    }

    /**
     * Applies an operation to both sides of the equation.
     * @param {number|object} value - The value to apply.
     * @param {string} op - The operator symbol (e.g., '+', '-', '*', '/').
     * @param {string} fn - The function name for the AST (e.g., 'add', 'subtract').
     * @returns {omdEquationNode} A new equation node with the operation applied.
     * @private
     */
    _applyOperation(value, op, fn) {
        const valueNode = this._createNodeFromValue(value);
        if (!valueNode) return this; // Return original if value is invalid

        // Determine if we need to wrap sides in parentheses for correct precedence
        const leftSideNeedsParens = this._needsParenthesesForOperation(this.left, op);
        const rightSideNeedsParens = this._needsParenthesesForOperation(this.right, op);

        // Wrap sides in parentheses if needed
        const leftOperand = leftSideNeedsParens ? 
            { type: 'ParenthesisNode', content: this.left.toMathJSNode() } : 
            this.left.toMathJSNode();
        const rightOperand = rightSideNeedsParens ? 
            { type: 'ParenthesisNode', content: this.right.toMathJSNode() } : 
            this.right.toMathJSNode();

        const newLeftAst = { type: 'OperatorNode', op, fn, args: [leftOperand, valueNode.toMathJSNode()] };
        const newRightAst = { type: 'OperatorNode', op, fn, args: [rightOperand, valueNode.toMathJSNode()] };
        
        let newLeft, newRight;

        if (op === '/') {
            newLeft = new omdRationalNode(newLeftAst);
            newRight = new omdRationalNode(newRightAst);
        } else {
            newLeft = new omdBinaryExpressionNode(newLeftAst);
            newRight = new omdBinaryExpressionNode(newRightAst);
        }
        
        const newEquationAst = {
            type: 'AssignmentNode',
            object: newLeft.toMathJSNode(),
            index: null,
            value: newRight.toMathJSNode()
        };

        const newEquation = new omdEquationNode(newEquationAst);
        newEquation.setFontSize(this.getFontSize());
        
        // Establish provenance tracking from original equation to new equation
        newEquation.provenance.push(this.id);
        
        // Establish granular provenance: left side to left side, right side to right side
        if (newEquation.left && this.left) {
            this._establishGranularProvenance(newEquation.left, this.left, value, fn);
        }
        if (newEquation.right && this.right) {
            this._establishGranularProvenance(newEquation.right, this.right, value, fn);
        }
        
        newEquation.initialize();
        return newEquation;
    }

    /**
     * Determines if a node needs parentheses when used as an operand with the given operation.
     * This ensures correct operator precedence.
     * @param {omdNode} node - The node to check
     * @param {string} operation - The operation that will be applied ('*', '/', '+', '-')
     * @returns {boolean} True if parentheses are needed
     * @private
     */
    _needsParenthesesForOperation(node, operation) {
        // If the node is not a binary expression, no parentheses needed
        if (!node || node.type !== 'omdBinaryExpressionNode') {
            return false;
        }

        // Define operator precedence (higher number = higher precedence)
        const precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2,
            '^': 3
        };

        // Get the operation of the existing node
        let existingOp = node.operation;
        if (typeof existingOp === 'object' && existingOp && existingOp.name) {
            existingOp = existingOp.name;
        }
        if (node.astNodeData && node.astNodeData.op) {
            existingOp = node.astNodeData.op;
        }

        // Convert operation names to symbols if needed
        const opMap = {
            'add': '+',
            'subtract': '-',
            'multiply': '*',
            'divide': '/',
            'pow': '^'
        };
        
        const currentOpSymbol = opMap[existingOp] || existingOp;
        const newOpSymbol = opMap[operation] || operation;

        // If we can't determine the precedence, be safe and add parentheses
        if (!precedence[currentOpSymbol] || !precedence[newOpSymbol]) {
            return true;
        }

        // Need parentheses if the existing operation has lower precedence than the new operation
        // For example: (x + 2) * 3 needs parentheses, but x * 2 + 3 doesn't need them around x * 2
        return precedence[currentOpSymbol] < precedence[newOpSymbol];
    }

    /**
     * Returns a new equation with a value added to both sides.
     * @param {number|object} value - The value to add.
     */
    addToBothSides(value) {
        return this._applyOperation(value, '+', 'add');
    }

    /**
     * Returns a new equation with a value subtracted from both sides.
     * @param {number|object} value - The value to subtract.
     */
    subtractFromBothSides(value) {
        return this._applyOperation(value, '-', 'subtract');
    }

    /**
     * Returns a new equation with both sides multiplied by a value.
     * @param {number|object} value - The value to multiply by.
     * @param {string} [operationDisplayId] - Optional ID of the operation display for provenance tracking.
     */
    multiplyBothSides(value, operationDisplayId) {
        return this._applyOperation(value, '*', 'multiply', operationDisplayId);
    }

    /**
     * Returns a new equation with both sides divided by a value.
     * @param {number|object} value - The value to divide by.
     */
    divideBothSides(value) {
        return this._applyOperation(value, '/', 'divide');
    }



    /**
     * Establishes granular provenance tracking between new and original nodes
     * This handles equation operations like "multiply both sides" by linking the new expression to the original
     * @param {omdNode} newNode - The new node being created (the result of the operation)
     * @param {omdNode} originalNode - The original node being transformed
     * @param {number|Object} operationValue - The value used in the operation
     * @param {string} operation - The operation being performed ('add', 'subtract', 'multiply', 'divide')
     * @private
     */
    _establishGranularProvenance(newNode, originalNode, operationValue, operation) {
        if (!newNode || !originalNode) return;
        
        // Ensure newNode has a provenance array
        if (!newNode.provenance) {
            newNode.provenance = [];
        }
        
        // For equation operations, we want to establish provenance between corresponding parts
        if (operation === 'divide') {
            // For division operations like (2x)/2 = x, check if we can simplify
            if (originalNode.type === 'omdBinaryExpressionNode' && 
                this._isMultiplicationOperation(originalNode)) {
                
                // Check if the operation value matches one of the factors
                const leftIsConstant = originalNode.left.isConstant();
                const rightIsConstant = originalNode.right.isConstant();
                
                // Convert operationValue to number if it's an object
                const opValue = (typeof operationValue === 'object' && operationValue.getValue) ? 
                               operationValue.getValue() : operationValue;
                
                if (leftIsConstant && originalNode.left.getValue() === opValue) {
                    // Dividing by the left factor, so result should trace to right factor
                    this._copyProvenanceStructure(newNode, originalNode.right);
                } else if (rightIsConstant && originalNode.right.getValue() === opValue) {
                    // Dividing by the right factor, so result should trace to left factor
                    this._copyProvenanceStructure(newNode, originalNode.left);
                } else {
                    // Not a simple factor division, link to the whole expression
                    this._copyProvenanceStructure(newNode, originalNode);
                }
            } else {
                // Not a multiplication, link to the whole original
                this._copyProvenanceStructure(newNode, originalNode);
            }
        } 
        else if (operation === 'multiply') {
            // For multiplication operations like x * 2 = 2x
            // The new expression should trace back to the original expression
            this._copyProvenanceStructure(newNode, originalNode);
            
            // Also establish provenance for the binary expression structure
            if (newNode.type === 'omdBinaryExpressionNode') {
                // Link the left operand (which should be the original expression) to the original
                if (newNode.left) {
                    this._copyProvenanceStructure(newNode.left, originalNode);
                }
                // The right operand is the operation value, no additional provenance needed
            }
        }
        else if (operation === 'add' || operation === 'subtract') {
            // For addition/subtraction, the new binary expression's provenance should
            // link to the original expression, but we should handle operands separately
            // to avoid incorrect linking of the added/subtracted value.
            newNode.provenance.push(originalNode.id);

            if (newNode.type === 'omdBinaryExpressionNode') {
                // Link the left operand (the original side of the equation) to the original node structure.
                if (newNode.left) {
                    this._copyProvenanceStructure(newNode.left, originalNode);
                }
                // The right operand is the new value being added/subtracted - preserve its provenance
                // for proper highlighting when constants are combined later
                // (Don't clear provenance - let it maintain its own identity for combination rules)
            }
        }
        else {
            // For any other operations, link to the whole original expression
            this._copyProvenanceStructure(newNode, originalNode);
        }
    }

    /**
     * Helper method to check if a node represents a multiplication operation
     * @param {omdNode} node - The node to check
     * @returns {boolean} True if it's a multiplication operation
     * @private
     */
    _isMultiplicationOperation(node) {
        if (node.type !== 'omdBinaryExpressionNode') return false;
        
        const op = node.operation;
        return op === 'multiply' || 
               (typeof op === 'object' && op && op.name === 'multiply') ||
               (node.op && node.op.opName === '*');
    }

    /**
     * Copies the provenance structure from source to target, maintaining granularity
     * @param {omdNode} target - The node to set provenance on
     * @param {omdNode} source - The node to copy provenance from
     * @private
     */
    _copyProvenanceStructure(target, source) {
        if (!target || !source) return;
        
        // Initialize provenance array if it doesn't exist
        if (!target.provenance) {
            target.provenance = [];
        }
        
        // If the source has its own provenance, copy it
        if (source.provenance && source.provenance.length > 0) {
            // Create a Set to track unique IDs we've already processed
            const processedIds = new Set(target.provenance);
            
            // Process each provenance ID from source
            source.provenance.forEach(id => {
                if (!processedIds.has(id)) {
                    processedIds.add(id);
                    target.provenance.push(id);
                }
            });
        }
        
        // Add the source's own ID if not already present
        if (!target.provenance.includes(source.id)) {
            target.provenance.push(source.id);
        }
        
        // If both nodes have the same structure, recursively copy provenance
        if (target.type === source.type) {
            if (target.argumentNodeList && source.argumentNodeList) {
                for (const key of Object.keys(source.argumentNodeList)) {
                    const targetChild = target.argumentNodeList[key];
                    const sourceChild = source.argumentNodeList[key];
                    
                    if (targetChild && sourceChild) {
                        if (Array.isArray(targetChild) && Array.isArray(sourceChild)) {
                            // Handle array of children
                            for (let i = 0; i < Math.min(targetChild.length, sourceChild.length); i++) {
                                if (targetChild[i] && sourceChild[i]) {
                                    this._copyProvenanceStructure(targetChild[i], sourceChild[i]);
                                }
                            }
                        } else {
                            // Handle single child node
                            this._copyProvenanceStructure(targetChild, sourceChild);
                        }
                    }
                }
            }
        }
    }


    /**
     * Creates an omdEquationNode instance from a string.
     * @param {string} equationString - The string to parse (e.g., "2x+4=10").
     * @returns {omdEquationNode} A new instance of omdEquationNode.
     */
    static fromString(equationString) {
        if (!equationString.includes('=')) {
            throw new Error("Input string is not a valid equation.");
        }

        const parts = equationString.split('=');
        if (parts.length > 2) {
            throw new Error("Equation can only have one '=' sign.");
        }

        const left = parts[0].trim();
        const right = parts[1].trim();

        if (!left || !right) {
            throw new Error("Equation must have a left and a right side.");
        }

        // Manually construct an AST-like object that the constructor can understand.
        const ast = {
            type: "AssignmentNode",
            object: math.parse(left),
            value: math.parse(right),
            // Add a clone method so it behaves like a real math.js node for our system.
            clone: function () {
                return {
                    type: this.type,
                    object: this.object.clone(),
                    value: this.value.clone(),
                    clone: this.clone
                };
            }
        };

        return new omdEquationNode(ast);
    }

    clone() {
        // Create a clone from a deep-copied AST. This creates a node tree
        // with the exact structure needed for simplification.
        const newAstNodeData = JSON.parse(JSON.stringify(this.astNodeData));
        const clone = new omdEquationNode(newAstNodeData);

        // Recursively fix the provenance chain for the new clone.
        clone._syncProvenanceFrom(this);
        
        clone.setFontSize(this.getFontSize());

        // Ensure argumentNodeList exists on clone for replacement machinery
        clone.argumentNodeList = { left: clone.left, right: clone.right };

        return clone;
    }

    /**
     * Overrides default deselect behavior for equations inside a calculation.
     * @param {omdNode} root - The root of the deselection event.
     */
    deselect(root) {
        if (!(root instanceof omdNode)) root = this;

        if (this === root && this.parent instanceof omdNode) {
            this.parent.select(root);
        }

        this.backRect.setFillColor(omdColor.lightGray);
        if (this.defaultOpaqueBack == false) {
            this.backRect.setOpacity(0.01);
        }

        this.childList.forEach((child) => {
            if (child !== root && child instanceof omdNode) {
                child.deselect(root);
            }
        });
    }

    /**
     * Converts the omdEquationNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        let astNode;

        // Get fresh AST representations from children to ensure parentheses and other
        // structural elements are properly preserved
        if (this.astNodeData.type === "AssignmentNode") {
            astNode = {
                type: 'AssignmentNode',
                object: this.left.toMathJSNode(),
                value: this.right.toMathJSNode(),
                id: this.id,
                provenance: this.provenance
            };
        } else {
            astNode = {
                type: 'OperatorNode', op: '=', fn: 'equal',
                args: [this.left.toMathJSNode(), this.right.toMathJSNode()],
                id: this.id,
                provenance: this.provenance
            };
        }
        
        // Add a clone method to maintain compatibility with math.js's expectations.
        astNode.clone = function() {
            const clonedNode = { ...this };
            if (this.object) clonedNode.object = this.object.clone();
            if (this.value) clonedNode.value = this.value.clone();
            if (this.args) clonedNode.args = this.args.map(arg => arg.clone());
            return clonedNode;
        };
        return astNode;
    }

    /**
     * Applies a function to both sides of the equation
     * @param {string} functionName - The name of the function to apply
     * @returns {omdEquationNode} A new equation with the function applied to both sides
     */
    applyFunction(functionName) {
        const leftWithFunction = this._createFunctionNode(functionName, this.left);
        const rightWithFunction = this._createFunctionNode(functionName, this.right);
        
        const newEquation = this._createNewEquation(leftWithFunction, rightWithFunction);
        newEquation.provenance.push(this.id);
        
        return newEquation;
    }

    /**
     * Creates a function node wrapping the given argument
     * @param {string} functionName - The function name
     * @param {omdNode} argument - The argument to wrap
     * @returns {omdNode} The function node
     * @private
     */
    _createFunctionNode(functionName, argument) {
        // Create a math.js AST for the function
        const functionAst = {
            type: 'FunctionNode',
            fn: { type: 'SymbolNode', name: functionName },
            args: [argument.toMathJSNode()]
        };
        
        // Use the already imported getNodeForAST function
        const NodeClass = getNodeForAST(functionAst);
        const functionNode = new NodeClass(functionAst);
        functionNode.setFontSize(this.getFontSize());
        return functionNode;
    }

    /**
     * Creates a new equation from left and right sides
     * @param {omdNode} left - The left side
     * @param {omdNode} right - The right side
     * @returns {omdEquationNode} The new equation
     * @private
     */
    _createNewEquation(left, right) {
        const newAst = {
            type: "AssignmentNode",
            object: left.toMathJSNode(),
            value: right.toMathJSNode(),
            clone: function () {
                return {
                    type: this.type,
                    object: this.object.clone(),
                    value: this.value.clone(),
                    clone: this.clone
                };
            }
        };
        
        return new omdEquationNode(newAst);
    }

    /**
     * Apply an operation to one or both sides of the equation
     * @param {number|omdNode} value - The value to apply
     * @param {string} operation - 'add', 'subtract', 'multiply', or 'divide'
     * @param {string} side - 'left', 'right', or 'both' (default: 'both')
     * @returns {omdEquationNode} New equation with operation applied
     */
    applyOperation(value, operation, side = 'both') {
        // Map operation names to operators and function names
        const operationMap = {
            'add': { op: '+', fn: 'add' },
            'subtract': { op: '-', fn: 'subtract' },
            'multiply': { op: '*', fn: 'multiply' },
            'divide': { op: '/', fn: 'divide' }
        };
        
        const opInfo = operationMap[operation];
        if (!opInfo) {
            throw new Error(`Unknown operation: ${operation}`);
        }
        
        // Handle different side options
        if (side === 'both') {
            // Use existing methods for both sides
            return this._applyOperation(value, opInfo.op, opInfo.fn);
        }
        
        // For single side operations, we need to create the new equation manually
        const valueNode = this._createNodeFromValue(value);
        if (!valueNode) {
            throw new Error("Invalid value provided");
        }
        
        // Create new AST for the specified side
        let newLeftAst, newRightAst;
        
        if (side === 'left') {
            // Apply operation to left side only
            const leftNeedsParens = this._needsParenthesesForOperation(this.left, opInfo.op);
            const leftOperand = leftNeedsParens ?
                { type: 'ParenthesisNode', content: this.left.toMathJSNode() } :
                this.left.toMathJSNode();
                
            newLeftAst = { type: 'OperatorNode', op: opInfo.op, fn: opInfo.fn, args: [leftOperand, valueNode.toMathJSNode()] };
            newRightAst = this.right.toMathJSNode();
        } else if (side === 'right') {
            // Apply operation to right side only
            const rightNeedsParens = this._needsParenthesesForOperation(this.right, opInfo.op);
            const rightOperand = rightNeedsParens ?
                { type: 'ParenthesisNode', content: this.right.toMathJSNode() } :
                this.right.toMathJSNode();
                
            newLeftAst = this.left.toMathJSNode();
            newRightAst = { type: 'OperatorNode', op: opInfo.op, fn: opInfo.fn, args: [rightOperand, valueNode.toMathJSNode()] };
        } else {
            throw new Error(`Invalid side: ${side}. Must be 'left', 'right', or 'both'`);
        }
        
        // Create nodes from ASTs
        let newLeft, newRight;
        
        if (side === 'left' && opInfo.op === '/') {
            newLeft = new omdRationalNode(newLeftAst);
            newRight = getNodeForAST(newRightAst) === omdNode ? this.right : new (getNodeForAST(newRightAst))(newRightAst);
        } else if (side === 'right' && opInfo.op === '/') {
            newLeft = getNodeForAST(newLeftAst) === omdNode ? this.left : new (getNodeForAST(newLeftAst))(newLeftAst);
            newRight = new omdRationalNode(newRightAst);
        } else if (side === 'left') {
            newLeft = new omdBinaryExpressionNode(newLeftAst);
            newRight = getNodeForAST(newRightAst) === omdNode ? this.right : new (getNodeForAST(newRightAst))(newRightAst);
        } else {
            newLeft = getNodeForAST(newLeftAst) === omdNode ? this.left : new (getNodeForAST(newLeftAst))(newLeftAst);
            newRight = new omdBinaryExpressionNode(newRightAst);
        }
        
        // Create new equation
        const newEquationAst = {
            type: 'AssignmentNode',
            object: newLeft.toMathJSNode(),
            value: newRight.toMathJSNode()
        };
        
        const newEquation = new omdEquationNode(newEquationAst);
        newEquation.setFontSize(this.getFontSize());
        newEquation.provenance.push(this.id);
        
        // Initialize to compute dimensions
        newEquation.initialize();
        
        return newEquation;
    }

    /**
     * Swap left and right sides of the equation
     * @returns {omdEquationNode} New equation with sides swapped
     */
    swapSides() {
        const newEquation = this.clone();
        [newEquation.left, newEquation.right] = [newEquation.right, newEquation.left];
        
        // Update the AST for consistency
        [newEquation.astNodeData.object, newEquation.astNodeData.value] = 
        [newEquation.astNodeData.value, newEquation.astNodeData.object];
        
        newEquation.provenance.push(this.id);
        
        // This is a layout change, not a mathematical simplification, so no need for granular provenance
        newEquation.initialize();
        return newEquation;
    }

    /**
     * Returns a string representation of the equation
     * @returns {string} The equation as a string
     */
    toString() {
        return `${this.left.toString()} = ${this.right.toString()}`;
    }

    /**
     * Configure equation background styling. Defaults remain unchanged if not provided.
     * @param {{ backgroundColor?: string, cornerRadius?: number, pill?: boolean }} style
     */
    setBackgroundStyle(style = {}) {
        this._backgroundStyle = { ...(this._backgroundStyle || {}), ...style };
        this._propagateBackgroundStyle(this._backgroundStyle);
        if (this.backRect && (this.width || this.height)) {
            this.updateLayout();
        }
    }

    /**
     * Returns the horizontal anchor X for the equals sign center relative to this node's origin.
     * Accounts for background padding and internal spacing.
     * @returns {number}
     */
    getEqualsAnchorX() {
        const spacing = 8 * this.getFontSize() / this.getRootFontSize();
        // Use EFFECTIVE padding so pill clamping and tall nodes are accounted for
        const contentHeight = Math.max(this.left?.height || 0, this.equalsSign?.height || 0, this.right?.height || 0);
        const { padX } = this._getEffectivePadding(contentHeight);
        // Anchor at center of equals sign
        return padX + this.left.width + spacing + (this.equalsSign?.width || 0) / 2;
    }

    /**
     * Returns the X padding applied by background style
     * @returns {number}
     */
    getBackgroundPaddingX() {
        const pad = this._backgroundStyle?.padding;
        return pad == null ? 0 : (typeof pad === 'number' ? pad : (pad.x ?? 0));
    }

    /**
     * Returns the effective horizontal padding used in layout, including pill clamping
     * @returns {number}
     */
    getEffectiveBackgroundPaddingX() {
        const contentHeight = Math.max(this.left?.height || 0, this.equalsSign?.height || 0, this.right?.height || 0);
        const { padX } = this._getEffectivePadding(contentHeight);
        return padX;
    }

    /**
     * Hides the backgrounds of all child nodes (descendants), preserving only this node's background.
     * @private
     */
    _matchChildBackgrounds(color) {
        const visited = new Set();
        const stack = Array.isArray(this.childList) ? [...this.childList] : [];
        while (stack.length) {
            const node = stack.pop();
            if (!node || visited.has(node)) continue;
            visited.add(node);

            if (node !== this && node.backRect) {
                node.backRect.setFillColor(color);
                node.backRect.setOpacity(1.0);
            }

            if (Array.isArray(node.childList)) {
                for (const c of node.childList) stack.push(c);
            }
            if (node.argumentNodeList && typeof node.argumentNodeList === 'object') {
                for (const val of Object.values(node.argumentNodeList)) {
                    if (Array.isArray(val)) {
                        val.forEach(v => v && stack.push(v));
                    } else if (val) {
                        stack.push(val);
                    }
                }
            }
        }
    }

    /**
     * Evaluates the equation by evaluating both sides and checking for equality.
     * @param {Object} variables - A map of variable names to their numeric values.
     * @returns {Object} An object containing the evaluated left and right sides.
     */
    evaluate(variables = {}) {
        const leftValue = this.left.evaluate(variables);
        const rightValue = this.right.evaluate(variables);

        return { left: leftValue, right: rightValue };
    }
        /**
     * Renders the equation to different visualization formats
     * @param {string} visualizationType - "graph" | "table" | "hanger"
     * @param {Object} options - Optional configuration
     * @param {string} options.side - "both" (default), "left", or "right"
     * @param {number} options.xMin - Domain min for x (default: -10)
     * @param {number} options.xMax - Domain max for x (default: 10)
     * @param {number} options.yMin - Range min for y (graph only, default: -10)
     * @param {number} options.yMax - Range max for y (graph only, default: 10)
     * @param {number} options.stepSize - Step size for table (default: 1)
     * @returns {Object} JSON per schemas in src/json-schemas.md
     */
    renderTo(visualizationType, options = {}) {
        // Set default options
        const defaultOptions = {
            side: "both",
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
            stepSize: 1
        };
        const mergedOptions = { ...defaultOptions, ...options };

        switch (visualizationType.toLowerCase()) {
            case 'graph':
                return this._renderToGraph(mergedOptions);
            case 'table':
                return this._renderToTable(mergedOptions);
            case 'hanger':
                return this._renderToHanger(mergedOptions);
            case 'tileequation': {
                const leftExpr = this.getLeft().toString();
                const rightExpr = this.getRight().toString();
                const eqString = `${leftExpr}=${rightExpr}`;
                // Colors/options passthrough
                const plusColor = mergedOptions.plusColor || '#79BBFD';
                const equalsColor = mergedOptions.equalsColor || '#FF6B6B';
                const xPillColor = mergedOptions.xPillColor; // optional
                const tileBgColor = mergedOptions.tileBackgroundColor; // optional
                const dotColor = mergedOptions.dotColor; // optional
                const tileSize = mergedOptions.tileSize || 28;
                const dotsPerColumn = mergedOptions.dotsPerColumn || 10;
                return {
                    omdType: 'tileEquation',
                    equation: eqString,
                    tileSize,
                    dotsPerColumn,
                    plusColor,
                    equalsColor,
                    xPill: xPillColor ? { color: xPillColor } : undefined,
                    numberTileDefaults: {
                        backgroundColor: tileBgColor,
                        dotColor
                    }
                };
            }
            default:
                throw new Error(`Unknown visualization type: ${visualizationType}. Supported types are: graph, table, hanger`);
        }
    }

    /**
     * Gets the left side of the equation
     * @returns {omdNode} The left side node
     */
    getLeft() {
        return this.left;
    }

    /**
     * Gets the right side of the equation
     * @returns {omdNode} The right side node
     */
    getRight() {
        return this.right;
    }

    /**
     * Generates JSON configuration for coordinate plane graph visualization
     * @param {Object} options - Configuration options
     * @returns {Object} JSON configuration for omdCoordinatePlane
     * @private
     */
    _renderToGraph(options) {
        const leftExpr = this._normalizeExpressionString(this.getLeft().toString());
        const rightExpr = this._normalizeExpressionString(this.getRight().toString());

        let graphEquations = [];
        
        // Helper to check if expression is just 'y' (case-insensitive)
        const isY = (expr) => expr.trim().toLowerCase() === 'y';

        if (options.side === 'left') {
            if (!isY(leftExpr)) {
                graphEquations.push({ equation: `y = ${leftExpr}`, domain: { min: options.xMin, max: options.xMax }, color: 'blue', strokeWidth: 2 });
            }
        } else if (options.side === 'right') {
            if (!isY(rightExpr)) {
                graphEquations.push({ equation: `y = ${rightExpr}`, domain: { min: options.xMin, max: options.xMax }, color: 'red', strokeWidth: 2 });
            }
        } else {
            // both: plot left and right as two functions; intersection corresponds to equality
            // Skip 'y' sides to avoid plotting "y=y"
            if (!isY(leftExpr)) {
                graphEquations.push({ equation: `y = ${leftExpr}`, domain: { min: options.xMin, max: options.xMax }, color: 'blue', strokeWidth: 2 });
            }
            if (!isY(rightExpr)) {
                // If we skipped left because it was y, use blue for right side (primary function color)
                const color = isY(leftExpr) ? 'blue' : 'red';
                graphEquations.push({ equation: `y = ${rightExpr}`, domain: { min: options.xMin, max: options.xMax }, color: color, strokeWidth: 2 });
            }
        }

        return {
            omdType: "coordinatePlane",
            xMin: options.xMin,
            xMax: options.xMax,
            yMin: options.yMin,
            yMax: options.yMax,
            // Allow caller to override visual settings via options
            xLabel: (options.xLabel !== undefined) ? options.xLabel : "x",
            yLabel: (options.yLabel !== undefined) ? options.yLabel : "y",
            size: (options.size !== undefined) ? options.size : "medium",
            tickInterval: (options.tickInterval !== undefined) ? options.tickInterval : 1,
            forceAllTickLabels: (options.forceAllTickLabels !== undefined) ? options.forceAllTickLabels : true,
            showTickLabels: (options.showTickLabels !== undefined) ? options.showTickLabels : true,
            // Background customization options
            backgroundColor: (options.backgroundColor !== undefined) ? options.backgroundColor : undefined,
            backgroundCornerRadius: (options.backgroundCornerRadius !== undefined) ? options.backgroundCornerRadius : undefined,
            backgroundOpacity: (options.backgroundOpacity !== undefined) ? options.backgroundOpacity : undefined,
            showBackground: (options.showBackground !== undefined) ? options.showBackground : undefined,
            graphEquations,
            lineSegments: [],
            dotValues: [],
            shapeSet: []
        };
    }

    /**
     * Generates JSON configuration for table visualization
     * @param {Object} options - Configuration options
     * @returns {Object} JSON configuration for omdTable
     * @private
     */
    _renderToTable(options) {
        // Helper to format expression - if it already has "y =" or starts with variable, use as-is, else prepend "y ="
        const formatEquation = (expr) => {
            const normalized = this._normalizeExpressionString(expr);
            // Check if expression already has "y =" or other variable assignment
            if (/^[a-zA-Z]\s*=/.test(normalized)) {
                return normalized;
            }
            // Otherwise prepend "y ="
            return `y = ${normalized}`;
        };

        // Single side: let omdTable generate rows from equation
        if (options.side === 'left') {
            const expr = this._normalizeExpressionString(this.getLeft().toString());
            const equation = formatEquation(expr);
            return {
                omdType: "table",
                title: `Function Table: ${equation}`,
                headers: ["x", "y"],
                equation: equation,
                xMin: options.xMin,
                xMax: options.xMax,
                stepSize: options.stepSize,
                // Background customization options
                backgroundColor: (options.backgroundColor !== undefined) ? options.backgroundColor : undefined,
                backgroundCornerRadius: (options.backgroundCornerRadius !== undefined) ? options.backgroundCornerRadius : undefined,
                backgroundOpacity: (options.backgroundOpacity !== undefined) ? options.backgroundOpacity : undefined,
                showBackground: (options.showBackground !== undefined) ? options.showBackground : undefined,
                // Alternating row color options
                alternatingRowColors: (options.alternatingRowColors !== undefined) ? options.alternatingRowColors : undefined,
                evenRowColor: (options.evenRowColor !== undefined) ? options.evenRowColor : undefined,
                oddRowColor: (options.oddRowColor !== undefined) ? options.oddRowColor : undefined,
                alternatingRowOpacity: (options.alternatingRowOpacity !== undefined) ? options.alternatingRowOpacity : undefined
            };
        } else if (options.side === 'right') {
            const expr = this._normalizeExpressionString(this.getRight().toString());
            const equation = formatEquation(expr);
            return {
                omdType: "table",
                title: `Function Table: ${equation}`,
                headers: ["x", "y"],
                equation: equation,
                xMin: options.xMin,
                xMax: options.xMax,
                stepSize: options.stepSize,
                // Background customization options
                backgroundColor: (options.backgroundColor !== undefined) ? options.backgroundColor : undefined,
                backgroundCornerRadius: (options.backgroundCornerRadius !== undefined) ? options.backgroundCornerRadius : undefined,
                backgroundOpacity: (options.backgroundOpacity !== undefined) ? options.backgroundOpacity : undefined,
                showBackground: (options.showBackground !== undefined) ? options.showBackground : undefined,
                // Alternating row color options
                alternatingRowColors: (options.alternatingRowColors !== undefined) ? options.alternatingRowColors : undefined,
                evenRowColor: (options.evenRowColor !== undefined) ? options.evenRowColor : undefined,
                oddRowColor: (options.oddRowColor !== undefined) ? options.oddRowColor : undefined,
                alternatingRowOpacity: (options.alternatingRowOpacity !== undefined) ? options.alternatingRowOpacity : undefined
            };
        }

        // Both sides: use equation format for proper table generation
        // The omdTable class can handle this better than manually computing data
        const leftExpr = this._normalizeExpressionString(this.getLeft().toString());
        const rightExpr = this._normalizeExpressionString(this.getRight().toString());
        
        // If left side is just "y", use right side as the equation
        if (leftExpr.toLowerCase().trim() === 'y') {
            const equation = formatEquation(rightExpr);
            return {
                omdType: "table",
                title: `Function Table: ${equation}`,
                headers: ["x", "y"],
                equation: equation,
                xMin: options.xMin,
                xMax: options.xMax,
                stepSize: options.stepSize,
                // Background customization options
                backgroundColor: (options.backgroundColor !== undefined) ? options.backgroundColor : undefined,
                backgroundCornerRadius: (options.backgroundCornerRadius !== undefined) ? options.backgroundCornerRadius : undefined,
                backgroundOpacity: (options.backgroundOpacity !== undefined) ? options.backgroundOpacity : undefined,
                showBackground: (options.showBackground !== undefined) ? options.showBackground : undefined,
                // Alternating row color options
                alternatingRowColors: (options.alternatingRowColors !== undefined) ? options.alternatingRowColors : undefined,
                evenRowColor: (options.evenRowColor !== undefined) ? options.evenRowColor : undefined,
                oddRowColor: (options.oddRowColor !== undefined) ? options.oddRowColor : undefined,
                alternatingRowOpacity: (options.alternatingRowOpacity !== undefined) ? options.alternatingRowOpacity : undefined
            };
        }
        
        // If right side is just "y", use left side as the equation
        if (rightExpr.toLowerCase().trim() === 'y') {
            const equation = formatEquation(leftExpr);
            return {
                omdType: "table",
                title: `Function Table: ${equation}`,
                headers: ["x", "y"],
                equation: equation,
                xMin: options.xMin,
                xMax: options.xMax,
                stepSize: options.stepSize,
                // Background customization options
                backgroundColor: (options.backgroundColor !== undefined) ? options.backgroundColor : undefined,
                backgroundCornerRadius: (options.backgroundCornerRadius !== undefined) ? options.backgroundCornerRadius : undefined,
                backgroundOpacity: (options.backgroundOpacity !== undefined) ? options.backgroundOpacity : undefined,
                showBackground: (options.showBackground !== undefined) ? options.showBackground : undefined,
                // Alternating row color options
                alternatingRowColors: (options.alternatingRowColors !== undefined) ? options.alternatingRowColors : undefined,
                evenRowColor: (options.evenRowColor !== undefined) ? options.evenRowColor : undefined,
                oddRowColor: (options.oddRowColor !== undefined) ? options.oddRowColor : undefined,
                alternatingRowOpacity: (options.alternatingRowOpacity !== undefined) ? options.alternatingRowOpacity : undefined
            };
        }

        // Both sides have expressions: compute data for x, left(x), right(x)
        const leftSide = this.getLeft();
        const rightSide = this.getRight();
        const leftLabel = leftSide.toString();
        const rightLabel = rightSide.toString();

        const headers = ["x", leftLabel, rightLabel];
        const data = [];
        const start = options.xMin;
        const end = options.xMax;
        const step = options.stepSize || 1;
        for (let x = start; x <= end; x += step) {
            try {
                const l = leftSide.evaluate({ x });
                const r = rightSide.evaluate({ x });
                if (isFinite(l) && isFinite(r)) {
                    data.push([x, Number(l), Number(r)]);
                }
            } catch (_) {
                // Skip points that fail to evaluate
            }
        }

        return {
            omdType: "table",
            title: `Equation Table: ${this.toString()}`,
            headers,
            data,
            // Background customization options
            backgroundColor: (options.backgroundColor !== undefined) ? options.backgroundColor : undefined,
            backgroundCornerRadius: (options.backgroundCornerRadius !== undefined) ? options.backgroundCornerRadius : undefined,
            backgroundOpacity: (options.backgroundOpacity !== undefined) ? options.backgroundOpacity : undefined,
            showBackground: (options.showBackground !== undefined) ? options.showBackground : undefined,
            // Alternating row color options
            alternatingRowColors: (options.alternatingRowColors !== undefined) ? options.alternatingRowColors : undefined,
            evenRowColor: (options.evenRowColor !== undefined) ? options.evenRowColor : undefined,
            oddRowColor: (options.oddRowColor !== undefined) ? options.oddRowColor : undefined,
            alternatingRowOpacity: (options.alternatingRowOpacity !== undefined) ? options.alternatingRowOpacity : undefined
        };
    }

    /**
     * Generates table for a single side of the equation
     * @param {omdNode} side - The side to render
     * @param {string} title - Title for the table
     * @returns {Object} JSON configuration for omdTable
     * @private
     */
    _renderSingleSideTable(side, title, options = {}) {
        const expression = this._normalizeExpressionString(side.toString());
        return {
            omdType: "table",
            title: `${title}: ${expression}`,
            headers: ["x", "y"],
            equation: `y = ${expression}`,
            xMin: options.xMin ?? -5,
            xMax: options.xMax ?? 5,
            stepSize: options.stepSize ?? 1
        };
    }

    /**
     * Generates JSON configuration for balance hanger visualization
     * @returns {Object} JSON configuration for omdBalanceHanger
     * @private
     */
    _renderToHanger(options = {}) {
        // Convert equation sides to hanger representation
        const leftValues = this._convertToHangerValues(this.getLeft());
        const rightValues = this._convertToHangerValues(this.getRight());
        
        return {
            omdType: "balanceHanger",
            leftValues: leftValues,
            rightValues: rightValues,
            tilt: "none", // Equations should be balanced by definition
            // Background customization options
            backgroundColor: (options.backgroundColor !== undefined) ? options.backgroundColor : undefined,
            backgroundCornerRadius: (options.backgroundCornerRadius !== undefined) ? options.backgroundCornerRadius : undefined,
            backgroundOpacity: (options.backgroundOpacity !== undefined) ? options.backgroundOpacity : undefined,
            showBackground: (options.showBackground !== undefined) ? options.showBackground : undefined
        };
    }

    /**
     * Normalizes an expression string for evaluation/graphing
     * - Inserts '*' between number-variable and variable-number
     * @param {string} expr
     * @returns {string}
     * @private
     */
    _normalizeExpressionString(expr) {
        if (!expr || typeof expr !== 'string') return String(expr || '');
        return expr
            .replace(/(\d)([a-zA-Z])/g, '$1*$2')
            .replace(/([a-zA-Z])(\d)/g, '$1*$2');
    }

    /**
     * Converts an equation side to balance hanger values (simple array of values)
     * @param {omdNode} node - The node to convert
     * @returns {Array} Array of simple values for the hanger
     * @private
     */
    _convertToHangerValues(node) {
        const values = [];
        
        // Handle different node types
        if (node.type === 'omdConstantNode') {
            // Add the constant value
            const value = node.getValue();
            if (value !== 0) {
                values.push(value);
            }
        } else if (node.type === 'omdVariableNode') {
            // Add variable name
            values.push(node.name || "x");
        } else if (node.type === 'omdBinaryExpressionNode') {
            // Handle binary expressions by recursively processing operands
            const leftValues = this._convertToHangerValues(node.left);
            const rightValues = this._convertToHangerValues(node.right);
            
            // For addition, combine values
            if (node.operation === 'add' || node.operation === 'plus') {
                values.push(...leftValues, ...rightValues);
            } 
            // For subtraction, add left values and negate right values
            else if (node.operation === 'subtract' || node.operation === 'minus') {
                values.push(...leftValues);
                // For subtraction, we need to represent negative values
                for (const rightValue of rightValues) {
                    if (typeof rightValue === 'number') {
                        // Negate numeric values
                        values.push(-rightValue);
                    } else {
                        // For variables/expressions, prepend with negative sign
                        values.push(`-${rightValue}`);
                    }
                }
            }
            // For multiplication, handle special cases
            else if (node.operation === 'multiply') {
                // Check if one operand is a constant (coefficient)
                if (node.left.type === 'omdConstantNode' && node.right.type === 'omdVariableNode') {
                    const coefficient = Math.abs(node.left.getValue());
                    const varName = node.right.name || "x";
                    // Add multiple instances of the variable
                    for (let i = 0; i < coefficient; i++) {
                        values.push(varName);
                    }
                } else if (node.right.type === 'omdConstantNode' && node.left.type === 'omdVariableNode') {
                    const coefficient = Math.abs(node.right.getValue());
                    const varName = node.left.name || "x";
                    // Add multiple instances of the variable
                    for (let i = 0; i < coefficient; i++) {
                        values.push(varName);
                    }
                } else {
                    // For other multiplications, treat as a single expression
                    values.push(node.toString());
                }
            } else {
                // For other operations, treat as a single expression
                values.push(node.toString());
            }
        } else {
            // For any other node types, treat as expression string
            values.push(node.toString());
        }
        
        return values;
    }   
}