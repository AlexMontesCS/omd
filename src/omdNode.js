import { omdMetaExpression } from "../src/omdMetaExpression.js";
import { jsvgTextLine, jsvgLine } from "@teachinglab/jsvg";

/**
 * omdNode - A minimal class representing a node in the expression tree
 * Focuses purely on tree structure and layout, delegates visuals to superclasses
 * Uses math.js AST format
 */
export class omdNode extends omdMetaExpression {
    /**
     * Constructor - Creates a tree node from math.js AST data
     * @param {Object} nodeData - The AST node from math.js parser
     */
    constructor(nodeData) {
        super();
        
        this.type = "omdNode";
        this.nodeData = nodeData; // The AST node from math.js
        this.childNodes = []; // Array of child omdNodes
        this.edgeLines = []; // Array of edge lines
        this.zoomLevel = 1.0; // Current zoom level
        
        // Initialize the tree structure
        this.initializeNode();
    }

    /**
     * Sets zoom level for this node and all children recursively
     * @param {number} zoom - The zoom level (1.0 = 100%, 2.0 = 200%, etc.)
     */
    setZoomLevel(zoom) {
        this.zoomLevel = zoom;
        // Apply to all child nodes
        this.childNodes.forEach(child => child.setZoomLevel(zoom));
        // Invalidate cached dimensions
        this.invalidateCache();
    }

    /**
     * Gets the width of this node, scaled by zoom level
     * @returns {number} The node width in pixels
     */
    get nodeWidth() {
        if (!this._cachedWidth) {
            // Use superclass text measurement if available, otherwise estimate
            const label = this.getNodeLabel();
            const baseWidth = Math.max(label.length * 12 + 20, 60);
            this._cachedWidth = baseWidth * this.zoomLevel;
        }
        return this._cachedWidth;
    }

    /**
     * Gets the height of this node, scaled by zoom level
     * @returns {number} The node height in pixels
     */
    get nodeHeight() {
        return 50 * this.zoomLevel;
    }

    /**
     * Gets the total width needed for this entire subtree
     * @returns {number} The subtree width in pixels
     */
    get subtreeWidth() {
        if (this.childNodes.length === 0) {
            return this.nodeWidth;
        }
        
        const childSubtreeWidths = this.childNodes.map(child => child.subtreeWidth);
        const totalChildWidth = childSubtreeWidths.reduce((sum, width) => sum + width, 0);
        const spacing = (this.childNodes.length - 1) * this.nodeSpacing;
        
        return Math.max(this.nodeWidth, totalChildWidth + spacing);
    }

    /**
     * Gets the horizontal spacing between child nodes, scaled by zoom level
     * @returns {number} The spacing in pixels
     */
    get nodeSpacing() {
        return 100 * this.zoomLevel;
    }

    /**
     * Gets the vertical spacing between tree levels, scaled by zoom level
     * @returns {number} The level height in pixels
     */
    get levelHeight() {
        return 120 * this.zoomLevel;
    }

    /**
     * Invalidates cached dimension calculations when content changes
     */
    invalidateCache() {
        this._cachedWidth = null;
        if (this.parent && this.parent.invalidateCache) {
            this.parent.invalidateCache();
        }
    }

    /**
     * Main initialization method - sets up visuals, creates children, and layouts tree
     */
    initializeNode() {
        this.setupVisuals();
        this.createChildNodes();
        this.layoutTree();
    }

    /**
     * Creates the visual elements for this node (text label and background)
     */
    setupVisuals() {
        // Create text label using jsvg
        this.nodeLabel = new jsvgTextLine();
        this.nodeLabel.setText(this.getNodeLabel());
        this.nodeLabel.setFontSize(24 * this.zoomLevel);
        this.nodeLabel.setAlignment('center');

        // Update superclass background size
        this.updateSize();
        
        // Position text at center
        this.nodeLabel.setPosition(this.nodeWidth/2, this.nodeHeight/2);
        this.addChild(this.nodeLabel);
    }

    /**
     * Updates the size of visual elements to match calculated dimensions
     */
    updateSize() {
        // Update the superclass background rectangle
        this.backRect.setWidthAndHeight(this.nodeWidth, this.nodeHeight);
        this.setWidthAndHeight(this.nodeWidth, this.nodeHeight);
    }

    /**
     * Creates child nodes from AST data and connecting edge lines
     */
    createChildNodes() {
        const childrenData = this.getNodeChildren();

        childrenData.forEach((childData, index) => {
            // Create child node
            const childNode = new omdNode(childData); 
            childNode.parent = this;
            this.childNodes.push(childNode); 
            this.addChild(childNode); 

            // Create edge line
            const edge = new jsvgLine();
            edge.setStrokeWidth(3);
            this.edgeLines.push(edge);
            this.addChild(edge); 
        });
    }

    /**
     * Recursively layouts the entire tree structure
     */
    layoutTree() {
        if (this.childNodes.length === 0) return;
        
        // Layout children first to get their final sizes
        this.childNodes.forEach(child => child.layoutTree());
        
        // Calculate positions
        this.positionChildren();
        this.updateEdges();
    }

    /**
     * Positions child nodes horizontally to center them under this node
     */
    positionChildren() {
        if (this.childNodes.length === 0) return;

        // Calculate starting position to center children
        const totalWidth = this.childNodes.reduce((sum, child) => sum + child.subtreeWidth, 0);
        const totalSpacing = (this.childNodes.length - 1) * this.nodeSpacing;
        const totalRequiredWidth = totalWidth + totalSpacing;
        
        const startX = -totalRequiredWidth / 2 + this.nodeWidth / 2;
        const childY = this.nodeHeight + this.levelHeight;
        
        let currentX = startX;
        
        this.childNodes.forEach((child, index) => {
            // Center child in its allocated subtree space
            const childX = currentX + child.subtreeWidth / 2 - child.nodeWidth / 2;
            
            // Position using jsvg method
            child.setPosition(childX, childY);
            
            // Move to next position
            currentX += child.subtreeWidth + this.nodeSpacing;
        });
    }

    /**
     * Updates the connecting edge lines between this node and its children
     */
    updateEdges() {
        this.childNodes.forEach((child, index) => {
            if (this.edgeLines[index]) {
                // Connect center-bottom of parent to center-top of child
                const parentCenterX = this.nodeWidth / 2;
                const parentBottomY = this.nodeHeight;
                
                const childCenterX = child.xpos + child.nodeWidth / 2;
                const childTopY = child.ypos;
                
                this.edgeLines[index].setEndpointA(parentCenterX, parentBottomY);
                this.edgeLines[index].setEndpointB(childCenterX, childTopY);
            }
        });
    }

    /**
     * Extracts child node data from the math.js AST based on node type
     * @returns {Array} Array of child AST nodes
     */
    getNodeChildren() {
        if (!this.nodeData) return [];
        
        const nodeType = this.detectNodeType();
        
        // Handle math.js node types
        switch (nodeType) {
            case 'FunctionNode':
                return this.nodeData.args || [];
            case 'MatrixNode':
                return this.nodeData.args || [];
            case 'OperatorNode':
                return this.nodeData.args || [];
            case 'ParenthesisNode':
                return [this.nodeData.content];
            case 'ArrayNode':
                return this.nodeData.items || [];
            case 'IndexNode':
                return [this.nodeData.object, this.nodeData.index];
            case 'AccessorNode':
                return [this.nodeData.object, this.nodeData.index];
            case 'AssignmentNode':
                return [this.nodeData.object, this.nodeData.value];
            case 'ConditionalNode':
                return [this.nodeData.condition, this.nodeData.trueExpr, this.nodeData.falseExpr];
            default:
                return [];
        }
    }

    /**
     * Determines the type of math.js AST node by examining its properties
     * @returns {string} The node type (e.g., 'OperatorNode', 'ConstantNode', etc.)
     */
    detectNodeType() {
        if (!this.nodeData) return 'Unknown';
        
        // Check for properties that uniquely identify each node type
        if (this.nodeData.hasOwnProperty('op') && this.nodeData.hasOwnProperty('args')) {
            return 'OperatorNode';
        } else if (this.nodeData.hasOwnProperty('fn') && this.nodeData.hasOwnProperty('args')) {
            if (this.nodeData.fn === 'matrix') {
                return 'MatrixNode';
            }
            return 'FunctionNode';
        } else if (this.nodeData.hasOwnProperty('value')) {
            return 'ConstantNode';
        } else if (this.nodeData.hasOwnProperty('name') && !this.nodeData.hasOwnProperty('args')) {
            return 'SymbolNode';
        } else if (this.nodeData.hasOwnProperty('content')) {
            return 'ParenthesisNode';
        } else if (this.nodeData.hasOwnProperty('items')) {
            return 'ArrayNode';
        } else if (this.nodeData.hasOwnProperty('object') && this.nodeData.hasOwnProperty('index')) {
            return 'IndexNode';
        } else if (this.nodeData.hasOwnProperty('condition')) {
            return 'ConditionalNode';
        }
        
        return 'Unknown';
    }

    /**
     * Generates the display label for this node based on its AST data
     * @returns {string} The text label to display in the node
     */
    getNodeLabel() {
        const nodeType = this.detectNodeType();
        
        switch (nodeType) {
            case 'ConstantNode':
                return this.nodeData.value.toString();
            case 'SymbolNode':
                return this.nodeData.name;
            case 'FunctionNode':
                return this.nodeData.fn.name || this.nodeData.fn;
            case 'MatrixNode':
                if (this.nodeData.args && this.nodeData.args.length > 0) {
                    const firstArg = this.nodeData.args[0];
                    if (firstArg && firstArg.items) {
                        const rows = firstArg.items.length;
                        const cols = firstArg.items[0] && firstArg.items[0].items ? firstArg.items[0].items.length : 1;
                        return `Matrix ${rows}×${cols}`;
                    }
                }
                return 'Matrix';
            case 'OperatorNode':
                const operatorMap = {
                    'add': '+',
                    'subtract': '-',
                    'multiply': '*',
                    'divide': '/',
                    'pow': '^',
                    'unaryMinus': '-',
                    'unaryPlus': '+'
                };
                return operatorMap[this.nodeData.fn] || this.nodeData.fn;
            case 'ParenthesisNode':
                return '( )';
            case 'ArrayNode':
                return '[ ]';
            case 'IndexNode':
                return '[]';
            case 'AccessorNode':
                return '.';
            case 'AssignmentNode':
                return '=';
            case 'ConditionalNode':
                return '?:';
            default:
                return nodeType || '?';
        }
    }

    /**
     * Calculates the bounding box of this entire subtree
     * @returns {Object} Object with left, right, top, bottom coordinates
     */
    getTreeBounds() {
        const myX = this.xpos || 0;
        const myY = this.ypos || 0;
        
        if (this.childNodes.length === 0) {
            return {
                left: myX,
                right: myX + this.nodeWidth,
                top: myY,
                bottom: myY + this.nodeHeight
            };
        }

        let left = myX;
        let right = myX + this.nodeWidth;
        let top = myY;
        let bottom = myY + this.nodeHeight;
        
        this.childNodes.forEach(child => {
            const childBounds = child.getTreeBounds();
            left = Math.min(left, childBounds.left);
            right = Math.max(right, childBounds.right);
            top = Math.min(top, childBounds.top);
            bottom = Math.max(bottom, childBounds.bottom);
        });

        return { left, right, top, bottom };
    }

    /**
     * Gets the total dimensions of this tree for layout purposes
     * @returns {Object} Object with width, height, and bounds
     */
    getTreeDimensions() {
        const bounds = this.getTreeBounds();
        return {
            width: bounds.right - bounds.left,
            height: bounds.bottom - bounds.top,
            bounds: bounds
        };
    }
} 