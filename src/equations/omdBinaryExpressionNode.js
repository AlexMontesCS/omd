import { omdNode } from "./omdNode.js";
import { getNodeForAST } from "./omdUtilities.js";
import { omdOperatorNode } from "./omdOperatorNode.js";
import { omdConstantNode } from "./omdConstantNode.js";
import { omdVariableNode } from "./omdVariableNode.js";
import { omdPowerNode } from "./omdPowerNode.js";
import { omdParenthesisNode } from "./omdParenthesisNode.js";
import { IMPLICIT_MULTIPLICATION } from "../omdConstants.js";

/**
 * Represents a binary expression node in the mathematical expression tree
 * Handles rendering of expressions with two operands and an operator
 * @extends omdNode
 */
export class omdBinaryExpressionNode extends omdNode {
    /**
     * Creates a binary expression node from AST data
     * @param {Object} ast - The AST node containing binary expression information
     */
    constructor(ast) {
        super(ast);
        this.type = "omdBinaryExpressionNode";
        if (!ast.args?.length || ast.args.length < 2) {
            throw new Error(`omdBinaryExpressionNode requires an AST node with at least 2 arguments. Received: ${JSON.stringify(ast)}`);
        }

        this.left = this.createExpressionNode(ast.args[0]); 
        this.argumentNodeList.left = this.left;

        this.operation = this.parseOperation();
        this.op = !ast.implicit ? this.createOperatorNode(ast) : null; // Gerard: Implicit multiplication does not include operator node
        this.isImplicit = ast.implicit || false;

        this.right = this.createExpressionNode(ast.args[1]);
        this.argumentNodeList.right = this.right;

        // Convert explicit multiplication to implicit based on configuration
        if (this.op && (ast.op === '*' || ast.op === '×' || ast.fn === 'multiply')) {
            // Check if we should reorder operands (e.g., x*2 -> 2x)
            if (this._shouldReorderMultiplication(this.left, this.right)) {
                // Swap left and right operands
                const temp = this.left;
                this.left = this.right;
                this.right = temp;
                
                // Update argument list
                this.argumentNodeList.left = this.left;
                this.argumentNodeList.right = this.right;
                
                // Update AST args as well for consistency
                const tempArg = this.astNodeData.args[0];
                this.astNodeData.args[0] = this.astNodeData.args[1];
                this.astNodeData.args[1] = tempArg;
            }
            
            if (this._shouldUseImplicitMultiplication(this.left, this.right)) {
                // Remove the operator node to treat as implicit multiplication
                this.removeChild(this.op);
                this.op = null;

                // Mark AST as implicit for cloning/mathjs compatibility
                this.astNodeData.implicit = true;
            }
        }
    }

    parseOperation() {
        return this.astNodeData.fn;
    }

    createExpressionNode(ast) {
        let NodeType = getNodeForAST(ast);
        let child = new NodeType(ast);
        this.addChild(child);
        
        return child;
    }

    createOperatorNode(ast) {
        let opAst = { type: "OperatorNode", op: ast.op };
        if (ast.operatorProvenance) {
            opAst.provenance = ast.operatorProvenance;
        }
        let op = new omdOperatorNode(opAst);
        this.addChild(op);

        return op;
    }

    computeDimensions() {
        // Compute dimensions for all children first
        this.left.computeDimensions();
        this.op?.computeDimensions();
        this.right.computeDimensions();

        // Gerard: Calculate dimensions based on child dimensions
        let sumChildrenWidth = this.left.width + this.right.width + (this.op !== null ? this.op.width : 0);
        let maxChildrenHeight = Math.max(this.left.height, this.right.height);

        // Gerard: Add spacing between op and operands, if there is an op (not implicit)          
        let padding = 0 * this.getFontSize() / this.getRootFontSize(); // Gerard: Vertical padding, should scale with fontSize
        let spacedWidth = sumChildrenWidth + this.getSpacing() * 2;
        let spacedHeight = maxChildrenHeight + padding;

        this.setWidthAndHeight(spacedWidth, spacedHeight);
    }
    
    updateLayout() {
        const spacing = this.getSpacing();
        const maxBaseline = Math.max(this.left.getAlignmentBaseline(), this.right.getAlignmentBaseline());
        let xOffset = 0;

        // Position children so their baselines align.
        this.left.updateLayout();
        this.left.setPosition(xOffset, maxBaseline - this.left.getAlignmentBaseline());
        xOffset += this.left.width + spacing;

        if (this.op !== null) {
            // Center the operator on the max baseline.
            const opBaseline = this.op.getAlignmentBaseline();
            this.op.updateLayout();
            this.op.setPosition(xOffset, maxBaseline - opBaseline);
            xOffset += this.op.width + spacing;
        }

        this.right.updateLayout();
        this.right.setPosition(xOffset, maxBaseline - this.right.getAlignmentBaseline());
    }

    /**
     * The alignment baseline for a binary expression should be the baseline of its operator,
     * adjusted for its position within the expression's bounding box.
     * @override
     * @returns {number} The y-coordinate for alignment.
     */
    getAlignmentBaseline() {
        if (this.op) {
            // The true baseline is the baseline of the operator, plus the operator's y-offset.
            const maxChildBaseline = Math.max(this.left.getAlignmentBaseline(), this.right.getAlignmentBaseline());
            const op_yOffset = maxChildBaseline - this.op.getAlignmentBaseline();
            return op_yOffset + this.op.getAlignmentBaseline();
        }
        // If there's no operator (implicit multiplication), the expression's baseline
        // is the shared alignment baseline of its children.
        return Math.max(this.left.getAlignmentBaseline(), this.right.getAlignmentBaseline());
    }

    clone() {
        // Create a new node. The constructor will add a backRect and temporary children.
        const tempAst = { type: 'OperatorNode', op: '+', args: [{type: 'ConstantNode', value: 1}, {type: 'ConstantNode', value: 1}] };
        const clone = new omdBinaryExpressionNode(tempAst);

        // Keep the backRect, but get rid of the temporary children.
        const backRect = clone.backRect;
        clone.removeAllChildren();
        clone.addChild(backRect);
        
        // Manually clone the real children to ensure the entire tree has correct provenance.
        clone.left = this.left.clone();
        clone.addChild(clone.left);
        
        if (this.op) {
            clone.op = this.op.clone();
            clone.addChild(clone.op);
        } else {
            clone.op = null;
        }

        clone.right = this.right.clone();
        clone.addChild(clone.right);

        // Rebuild the argument list, operation, and copy AST data.
        clone.argumentNodeList = { left: clone.left, right: clone.right };
        clone.operation = this.operation;
        clone.astNodeData = JSON.parse(JSON.stringify(this.astNodeData));

        // The crucial step: link the clone to its origin.
        clone.provenance.push(this.id);
        
        return clone;
    }

    // Gerard: Calculator horizontal spacing depending on whether op is implicit and scaling with font size
    getSpacing() {
        if (this.op === null) return 0;

        return 6 * this.getFontSize() / this.getRootFontSize();
    }

    /**
     * Determines if implicit multiplication should be used based on configuration
     * @private
     * @param {omdNode} left - Left operand
     * @param {omdNode} right - Right operand
     * @returns {boolean}
     */
    _shouldUseImplicitMultiplication(left, right) {
        // If global implicit multiplication is disabled, use traditional logic
        if (!IMPLICIT_MULTIPLICATION.forceImplicit) {
            return this._isCoefficientMultiplication(left, right);
        }

        // Check specific combinations based on configuration
        const leftType = this._getNodeCategory(left);
        const rightType = this._getNodeCategory(right);
        
        const combinationKey = `${leftType}-${rightType}`;
        return this._getImplicitMultiplicationSetting(combinationKey);
    }

    /**
     * Gets the implicit multiplication setting for a given combination
     * Converts kebab-case combination keys to camelCase config keys
     * @private
     * @param {string} combinationKey - The combination key (e.g., 'constant-variable')
     * @returns {boolean} Whether implicit multiplication should be used
     */
    _getImplicitMultiplicationSetting(combinationKey) {
        // Handle special reordering cases that map to the same config setting
        const reorderingMappings = {
            'variable-constant': 'constant-variable',      // x*3 -> 3x (reordered)
            'parenthesis-constant': 'constant-parenthesis' // (x+1)*3 -> 3(x+1) (reordered)
        };
        
        // Use the mapping if it exists, otherwise use the original key
        const normalizedKey = reorderingMappings[combinationKey] || combinationKey;
        
        // Convert kebab-case to camelCase (e.g., 'constant-variable' -> 'constantVariable')
        const camelCaseKey = normalizedKey.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        
        return IMPLICIT_MULTIPLICATION[camelCaseKey] ?? false;
    }

    /**
     * Categorizes a node for implicit multiplication rules
     * @private
     * @param {omdNode} node - The node to categorize
     * @returns {string} The category name
     */
    _getNodeCategory(node) {
        if (node instanceof omdConstantNode && node.isConstant()) {
            return 'constant';
        }
        if (node instanceof omdVariableNode) {
            return 'variable';
        }
        if (node instanceof omdPowerNode) {
            return 'power';
        }
        if (node instanceof omdParenthesisNode) {
            return 'parenthesis';
        }
        return 'other';
    }

    /**
     * Determines if multiplication operands should be reordered for conventional display
     * (e.g., x*2 -> 2x, y*3 -> 3y)
     * @private
     * @param {omdNode} left - Left operand
     * @param {omdNode} right - Right operand
     * @returns {boolean} True if operands should be swapped
     */
    _shouldReorderMultiplication(left, right) {
        const leftType = this._getNodeCategory(left);
        const rightType = this._getNodeCategory(right);
        
        // Reorder if: left is non-constant and right is constant
        // Examples: x*2 -> 2x, y*3 -> 3y, (x+1)*5 -> 5(x+1)
        return (leftType !== 'constant' && rightType === 'constant');
    }

    /**
     * Determines if the multiplication represents a coefficient (e.g. 3*x -> 3x)
     * @private
     * @param {omdNode} left - Left operand
     * @param {omdNode} right - Right operand
     * @returns {boolean}
     */
    _isCoefficientMultiplication(left, right) {
        const leftIsNumericConstant = left instanceof omdConstantNode && left.isConstant();
        const rightIsVariableLike = (
            right instanceof omdVariableNode ||
            right instanceof omdPowerNode ||
            right instanceof omdParenthesisNode
        );
        return leftIsNumericConstant && rightIsVariableLike;
    }

    /**
     * Converts the omdBinaryExpressionNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = {
            type: 'OperatorNode',
            op: this.op ? this.op.opName : '*',
            fn: this.operation,
            args: [this.left.toMathJSNode(), this.right.toMathJSNode()],
            implicit: !this.op,
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
     * Converts the binary expression node to a string.
     * @returns {string} The string representation of the expression.
     */
    toString() {
        const leftStr = this.left.toString();
        const rightStr = this.right.toString();
        const opStr = this.op ? ` ${this.op.toString()} ` : '';

        // Handle implicit multiplication case (no operator)
        if (!this.op) {
            return `${leftStr}${rightStr}`;
        }

        // Wrap children in parentheses if their precedence is lower than this node's.
        const finalLeft = this.left.needsParentheses && this.left.needsParentheses(this.op.value) ? `(${leftStr})` : leftStr;
        const finalRight = this.right.needsParentheses && this.right.needsParentheses(this.op.value) ? `(${rightStr})` : rightStr;

        return `${finalLeft}${opStr}${finalRight}`;
    }

    /**
     * Evaluates the expression by recursively evaluating children.
     * @param {Object} variables - A map of variable names to their numeric values.
     * @returns {number} The result of the expression.
     */
    evaluate(variables = {}) {
        const operations = {
            'add': (a, b) => a + b,
            'subtract': (a, b) => a - b,
            'multiply': (a, b) => a * b,
            'divide': (a, b) => {
                if (b === 0) throw new Error("Division by zero.");
                return a / b;
            }
        };

        const leftVal = this.left.evaluate(variables);
        const rightVal = this.right.evaluate(variables);

        if (this.isImplicit) {
            return leftVal * rightVal;
        }
        
        const func = operations[this.operation];
        
        if (func) {
            return func(leftVal, rightVal);
        }

        throw new Error(`Unsupported operation for evaluation: ${this.operation}`);
    }

    /**
     * Determine if parentheses are needed based on parent operator
     * @returns {boolean} Whether parentheses are required
     */
    needsParentheses() {
        const parent = this.parent;
        if (!parent || !(parent instanceof omdBinaryExpressionNode)) {
            return false;
        }
        
        const thisOp = this.op ? this.op.opName : '*';
        const parentOp = parent.op ? parent.op.opName : '*';
        
        const precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '×': 2,
            '/': 2,
            '÷': 2,
            '^': 3
        };
        
        const thisPrecedence = precedence[thisOp] || 0;
        const parentPrecedence = precedence[parentOp] || 0;
        
        // Need parentheses if this operation has lower precedence than parent
        if (thisPrecedence < parentPrecedence) {
            return true;
        }
        
        // Special case: subtraction and division are left-associative
        // So (a - b) - c needs parentheses on the right: a - (b - c)
        if (thisPrecedence === parentPrecedence && parent.right === this) {
            if (thisOp === '-' || thisOp === '/' || thisOp === '÷') {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Helper method to get function name from operator
     * @private
     * @param {string} op - The operator symbol
     * @returns {string} The function name
     */
    getFunctionForOperator(op) {
        const opMap = {
            '+': 'add',
            '-': 'subtract',
            '*': 'multiply',
            '×': 'multiply',
            '/': 'divide',
            '÷': 'divide'
        };
        return opMap[op] || 'unknown';
    }

    setHighlight(highlightOn = true, color = omdColor.highlightColor) {
        if (this.isExplainHighlighted) return; // Respect the lock

        // Highlight/unhighlight the binary expression itself
        super.setHighlight(highlightOn, color);
        
        // Also highlight/unhighlight the children (left operand, operator, right operand)
        if (this.left && typeof this.left.setHighlight === 'function') {
            this.left.setHighlight(highlightOn, color);
        }
        if (this.op && typeof this.op.setHighlight === 'function') {
            this.op.setHighlight(highlightOn, color);
        }
        if (this.right && typeof this.right.setHighlight === 'function') {
            this.right.setHighlight(highlightOn, color);
        }
    }

    clearProvenanceHighlights() {
        super.clearProvenanceHighlights();
        
        // Also clear highlights from children
        if (this.left && typeof this.left.clearProvenanceHighlights === 'function') {
            this.left.clearProvenanceHighlights();
        }
        if (this.op && typeof this.op.clearProvenanceHighlights === 'function') {
            this.op.clearProvenanceHighlights();
        }
        if (this.right && typeof this.right.clearProvenanceHighlights === 'function') {
            this.right.clearProvenanceHighlights();
        }
    }
}