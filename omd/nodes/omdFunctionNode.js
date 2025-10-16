import { omdNode } from "./omdNode.js";
import { getNodeForAST, getTextBounds } from "../core/omdUtilities.js";
import { omdConstantNode } from "./omdConstantNode.js";
import { jsvgTextLine } from '@teachinglab/jsvg';
/**
 * Represents a function call node in the mathematical expression tree
 * Handles rendering of function names, arguments, and parentheses
 * @extends omdNode
 */
export class omdFunctionNode extends omdNode {
    /**
     * Creates a function node from AST data
     * @param {Object} astNodeData - The AST node containing function information
     */
    constructor(astNodeData) {
        super(astNodeData);
        this.type = "omdFunctionNode";
        this.functionName = astNodeData.fn?.name || astNodeData.name || 'f';
        this.args = astNodeData.args || [];
        
        this.createTextElements();
        this.createArgumentNodes();
        this.computeDimensions();
        this.updateLayout();
    }
    
    /**
     * Creates text elements for function name and parentheses
     * @private
     */
    createTextElements() {
        const createText = (text) => {
            const element = new jsvgTextLine();
            element.setText(text);
            element.setTextAnchor('start');
            // Note: dominant-baseline doesn't have a jsvg method, keeping setAttribute for now
            element.svgObject.setAttribute('dominant-baseline', 'middle');
            this.addChild(element);
            return element;
        };

        this.functionNameElement = createText(this.functionName);
        this.openParenElement = createText('(');
        this.closeParenElement = createText(')');
    }
    
    /**
     * Creates nodes for function arguments and comma separators
     * @private
     */
    createArgumentNodes() {
        this.argNodes = [];
        this.commaElements = [];
        
        this.argumentNodeList.args = [];

        this.args.forEach((argAst, index) => {
            const ArgNodeType = getNodeForAST(argAst);
            const argNode = new ArgNodeType(argAst);
            this.argNodes.push(argNode);
            this.addChild(argNode);
            
            this.argumentNodeList.args.push(argNode);

            if (index < this.args.length - 1) {
                const commaElement = new jsvgTextLine();
                commaElement.setText(', ');
                commaElement.setTextAnchor('start');
                commaElement.svgObject.setAttribute('dominant-baseline', 'middle');
                this.commaElements.push(commaElement);
                this.addChild(commaElement);
            }
        });
    }
    
    /**
     * Calculates the dimensions of the function node and its children
     * @override
     */
    computeDimensions() {
        const fontSize = this.getFontSize();
        const argFontSize = fontSize * 5/6;  // Match rational node scaling
        
        // Set font sizes for text elements
        this.functionNameElement.setFontSize(fontSize);
        this.openParenElement.setFontSize(fontSize);
        this.closeParenElement.setFontSize(fontSize);
        
        // Set font sizes for arguments and compute their dimensions
        this.argNodes.forEach(argNode => {
            argNode.setFontSize(argFontSize);
            argNode.computeDimensions();
        });
        
        // Set font sizes for commas
        this.commaElements.forEach(comma => {
            comma.setFontSize(argFontSize);
        });
        
        // Calculate dimensions using getTextBounds for consistency
        const ratio = fontSize / this.getRootFontSize();
        const spacing = 2 * ratio;
        
        const functionNameBounds = getTextBounds(this.functionName, fontSize);
        const openParenBounds = getTextBounds('(', fontSize);
        const closeParenBounds = getTextBounds(')', fontSize);
        const commaBounds = getTextBounds(', ', argFontSize);
        
        let totalArgWidth = 0;
        let maxArgHeight = 0;
        
        this.argNodes.forEach((argNode, index) => {
            totalArgWidth += argNode.width;
            maxArgHeight = Math.max(maxArgHeight, argNode.height);
            if (index < this.commaElements.length) {
                totalArgWidth += commaBounds.width + spacing;
            }
        });
        
        const totalWidth = functionNameBounds.width + openParenBounds.width + totalArgWidth + closeParenBounds.width + (spacing * 2);
        const totalHeight = Math.max(maxArgHeight, functionNameBounds.height, openParenBounds.height, closeParenBounds.height) + 4 * ratio;
        
        this.setWidthAndHeight(totalWidth, totalHeight);
    }
    
    /**
     * Updates the layout of the function node and its children
     * @override
     */
    updateLayout() {
        const fontSize = this.getFontSize();
        const argFontSize = fontSize * 5/6;
        const ratio = fontSize / this.getRootFontSize();
        const spacing = 2 * ratio;
        
        let currentX = 0;
        const textY = this.height / 2;
        
        // Position function name using setPosition where possible
        this.functionNameElement.setPosition(currentX, textY);
        currentX += getTextBounds(this.functionName, fontSize).width;
        
        // Position opening parenthesis
        this.openParenElement.setPosition(currentX, textY);
        currentX += getTextBounds('(', fontSize).width;
        
        // Position arguments and commas
        this.argNodes.forEach((argNode, index) => {
            argNode.setPosition(currentX, (this.height - argNode.height) / 2);
            argNode.updateLayout();
            currentX += argNode.width;
            
            if (index < this.commaElements.length) {
                currentX += spacing;
                this.commaElements[index].setPosition(currentX, textY);
                currentX += getTextBounds(', ', argFontSize).width + spacing;
            }
        });
        
        // Position closing parenthesis
        this.closeParenElement.setPosition(currentX, textY);
    }
    
    /**
     * Highlights the function node and all its arguments
     */
    highlightAll() {
        this.select();
        
        this.argNodes.forEach(argNode => {
            if (argNode.highlightAll) {
                argNode.highlightAll();
            }
        });
    }
    
    /**
     * Unhighlights the function node and all its arguments
     */
    unhighlightAll() {
        this.deselect();
        
        this.argNodes.forEach(argNode => {
            if (argNode.unhighlightAll) {
                argNode.unhighlightAll();
            }
        });
    }

    clone() {
        let newAstData;
        if (typeof this.astNodeData.clone === 'function') {
            newAstData = this.astNodeData.clone();
        } else {
            newAstData = JSON.parse(JSON.stringify(this.astNodeData));
        }
        const clone = new omdFunctionNode(newAstData);

        // Preserve the background rectangle.
        const backRect = clone.backRect;
        clone.removeAllChildren();
        clone.addChild(backRect);
        
        // Manually clone properties
        clone.functionName = this.functionName;
        clone.args = JSON.parse(JSON.stringify(this.args));

        // Re-create text elements using the existing method
        clone.createTextElements();

        // Re-create argument nodes using the existing method, ensuring they are cloned properly
        // The createArgumentNodes method already handles adding children and populating argumentNodeList.
        clone.argNodes = this.argNodes.map(argNode => argNode.clone());
        // Manually set parents and add to childList, as createArgumentNodes might re-parse AST if not careful
        clone.argNodes.forEach(arg => {
            arg.parent = clone;
            clone.addChild(arg);
        });
        clone.argumentNodeList.args = clone.argNodes;

        // Ensure commas are also cloned and added
        clone.commaElements = this.commaElements.map(c => {
            const newComma = new jsvgTextLine();
            newComma.setText(c.text);
            newComma.setTextAnchor(c.textAnchor);
            newComma.svgObject.setAttribute('dominant-baseline', c.svgObject.getAttribute('dominant-baseline'));
            newComma.parent = clone;
            clone.addChild(newComma);
            return newComma;
        });

        // Now ensure correct order of children, if not already handled by createTextElements and createArgumentNodes
        // The constructor already calls computeDimensions and updateLayout, which will handle final layout.
        clone.addChild(clone.closedParen);
        
        // Explicitly update the argumentNodeList in the cloned node
        clone.argumentNodeList.args = clone.args;
        
        // The crucial step: link the clone to its origin
        clone.provenance.push(this.id);

        return clone;
    }

    /**
     * Converts the omdFunctionNode to a math.js AST node.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        const astNode = {
            type: 'FunctionNode',
            fn: { type: 'SymbolNode', name: this.functionName, clone: function() { return {...this}; } },
            args: this.argNodes.map(arg => arg.toMathJSNode())
        };

        // Add a clone method to maintain compatibility with math.js's expectations.
        astNode.clone = function() {
            const clonedNode = { ...this };
            clonedNode.args = this.args.map(arg => arg.clone());
            if (this.fn && typeof this.fn.clone === 'function') {
                clonedNode.fn = this.fn.clone();
            }
            return clonedNode;
        };
        return astNode;
    }

    /**
     * Convert to string representation
     * @returns {string} The function as a string
     */
    toString() {
        const argStrings = this.argNodes.map(arg => arg.toString());
        return `${this.functionName}(${argStrings.join(', ')})`;
    }

    /**
     * Evaluate the function with given variable values
     * @param {Object} variables - Variable name to value mapping
     * @returns {number} The evaluated result
     */
    evaluate(variables = {}) {
        // First evaluate all arguments
        const evaluatedArgs = this.argNodes.map(arg => {
            if (arg.evaluate) {
                return arg.evaluate(variables);
            } else if (arg.type === 'omdConstantNode') {
                return parseFloat(arg.value);
            } else if (arg.type === 'omdVariableNode' && variables[arg.name] !== undefined) {
                return variables[arg.name];
            }
            throw new Error(`Cannot evaluate argument: ${arg.toString()}`);
        });
        
        // Use math.js to evaluate the function
        if (window.math && window.math[this.functionName]) {
            try {
                return window.math[this.functionName](...evaluatedArgs);
            } catch (error) {
                throw new Error(`Error evaluating ${this.functionName}: ${error.message}`);
            }
        }
        
        // Fallback for common functions if math.js is not available
        switch (this.functionName) {
            case 'sin': return Math.sin(evaluatedArgs[0]);
            case 'cos': return Math.cos(evaluatedArgs[0]);
            case 'tan': return Math.tan(evaluatedArgs[0]);
            case 'asin': return Math.asin(evaluatedArgs[0]);
            case 'acos': return Math.acos(evaluatedArgs[0]);
            case 'atan': return Math.atan(evaluatedArgs[0]);
            case 'sqrt': return Math.sqrt(evaluatedArgs[0]);
            case 'abs': return Math.abs(evaluatedArgs[0]);
            case 'log': return Math.log(evaluatedArgs[0]);
            case 'log10': return Math.log10(evaluatedArgs[0]);
            case 'exp': return Math.exp(evaluatedArgs[0]);
            case 'pow': return Math.pow(evaluatedArgs[0], evaluatedArgs[1]);
            case 'min': return Math.min(...evaluatedArgs);
            case 'max': return Math.max(...evaluatedArgs);
            case 'floor': return Math.floor(evaluatedArgs[0]);
            case 'ceil': return Math.ceil(evaluatedArgs[0]);
            case 'round': return Math.round(evaluatedArgs[0]);
            default:
                throw new Error(`Unknown function: ${this.functionName}`);
        }
    }

    /**
     * Create a function from a string
     * @param {string} functionString - The function as a string
     * @returns {omdFunctionNode} The created function node
     * @static
     */
    static fromString(functionString) {
        if (!window.math) {
            throw new Error("Math.js is required for parsing function strings");
        }
        
        try {
            const ast = window.math.parse(functionString);
            
            // Verify it's a function node
            if (ast.type !== 'FunctionNode') {
                throw new Error("String does not represent a function call");
            }
            
            return new omdFunctionNode(ast);
        } catch (error) {
            throw new Error(`Failed to parse function string: ${error.message}`);
        }
    }
}