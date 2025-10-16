/**
 * omdNode - Base class for mathematical expression nodes
 * 
 * This class serves as the foundation for all mathematical expression nodes.
 * It handles basic tree structure, layout calculations, and visual properties.
 * Built on top of omdMetaExpression which provides SVG rendering capabilities.
 */

import { omdMetaExpression } from "../../src/omdMetaExpression.js";
/**
 * Base class for mathematical expression nodes
 * Handles basic tree structure, layout calculations, and visual properties
 * @extends omdMetaExpression
 */
let _simplifyStep = null;
export function setSimplifyStep(fn) { _simplifyStep = fn; }

export class omdNode extends omdMetaExpression {
    static nextId = 1;
    /**
     * Creates a tree node from math.js AST data
     * @param {Object} astNodeData - The AST node from math.js parser
     */
    constructor(astNodeData) {
        super();
        
        this.astNodeData = astNodeData; // The AST node from math.js

        this.type = "omdNode";
        this.id = omdNode.nextId++;
        this.argumentNodeList = {};
        
        // Preserve provenance from AST if it exists, otherwise initialize empty array
        this.provenance = astNodeData && astNodeData.provenance ? [...astNodeData.provenance] : [];
        this.isExplainHighlighted = false; // Initialize the lock
        
        this.parent = null;
        this.svgElement = null;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.fontSize = 32;
    }

    /**
     * Creates a deep clone of this node.
     * @returns {omdNode} A new node that is a deep clone of this one.
     */
    clone() {
        // A more robust deep clone for astNodeData might be needed if it contains complex objects.
        const newAstNodeData = JSON.parse(JSON.stringify(this.astNodeData));
        const clone = new this.constructor(newAstNodeData);
        // A clone gets a new ID, but its provenance points back to the node it was cloned from.
        // This is the crucial link for tracking history across simplification steps.
        clone.provenance.push(this.id);
        return clone;
    }

    /**
     * Recursively walks a cloned node tree and sets the provenance of each node
     * to point back to the corresponding node in the original tree.
     * @param {omdNode} originalNode - The corresponding node from the original tree.
     * @private
     */
    _syncProvenanceFrom(originalNode) {
        // This function is called on a node in a CLONED tree.
        // `originalNode` is the corresponding node from the ORIGINAL tree.
        if (!originalNode) return;

        // Base case: Add the original's ID to this cloned node's provenance.
        // The clone gets its own unique ID from the constructor, so this creates the link.
        // Don't replace existing provenance, just add to it.
        if (!this.provenance.includes(originalNode.id)) {
            this.provenance.push(originalNode.id);
        }

        // Recursive step: Recurse into all meaningful children.
        // We use `argumentNodeList` as the source of truth for children that
        // are part of the expression's structure (e.g., left/right, args).
        if (originalNode.argumentNodeList && this.argumentNodeList) {
            // Iterate over the original's keys. Using Object.keys() is safer than a
            // for...in loop as it only includes own properties.
            for (const key of Object.keys(originalNode.argumentNodeList)) {
                const originalChild = originalNode.argumentNodeList[key];
                const cloneChild = this.argumentNodeList[key];

                // Ensure the corresponding child exists on the clone before recursing.
                if (originalChild && cloneChild) {
                    if (Array.isArray(originalChild) && Array.isArray(cloneChild)) {
                        for (let i = 0; i < originalChild.length; i++) {
                            // The optional chain `?` handles cases where an item in the array might be null/undefined.
                            cloneChild[i]?._syncProvenanceFrom(originalChild[i]);
                        }
                    } else {
                        // Handle children that are single nodes.
                        cloneChild._syncProvenanceFrom(originalChild);
                    }
                }
            }
        }
    }

    /**
     * Overridable method used to determine value of omdNode
     */
    parseValue() {
    }

    parseType() {
    }

    /**
     * Gerard: Uses this method to initiate the layout of all elements in tree
     */
    initialize() {
        this.computeDimensions();
        this.updateLayout();
    }
    
    /**
     * Calculates dimensions for this node and its children
     * Override in subclasses for specific dimension calculations
     */
    computeDimensions() {
    }

    /**
     * Updates the layout/positioning of child nodes
     * Override in subclasses for specific layout behavior
     */
    updateLayout() {
    }

    /**
     * Gets the vertical position that should be used for alignment with other nodes.
     * By default, this is the vertical center. Subclasses can override this.
     * @returns {number} The y-coordinate for alignment.
     */
    getAlignmentBaseline() {
        return this.height / 2;
    }

    /**
     * @param {omdNode} newNode - The new node that will take this node's place.
     * @param {object} options - Configuration for the replacement.
     * @param {boolean} [options.updateLayout=true] - If true, the layout of the entire
     *   tree will be recalculated upwards from the point of replacement. This can be
     *   set to false for batch operations to improve performance.
     * @returns {boolean} - True if the replacement was successful, false otherwise.
     */
    replaceWith(newNode, options = { updateLayout: true }) {
        if (!this.parent) {
            console.error("Cannot replace a node with no parent.");
            return false;
        }

        const parent = this.parent;
        const childIndex = parent.childList.indexOf(this);

        const revertChanges = () => {
            parent.childList[childIndex] = this;
            newNode.parent = null;
            this.parent = parent;
        };

        if (childIndex === -1) {
            console.error("Node not found in parent's childList.", this);
            return false;
        }

        parent.childList[childIndex] = newNode;
        newNode.parent = parent;
        this.parent = null;

        if (!this.replaceNodeInParent(newNode)) {
            revertChanges();
            console.error("Failed to replace specific references. Reverting changes.");
            return false;
        }

        if (options.updateLayout) {
            this.updateSvg(newNode);
            newNode.updateLayoutUpwards();
        }

        return true;
    }

    /**
     * Helper method to replace this node with a new node in the parent's specific properties.
     * @param {omdNode} newNode - The new node.
     * @returns {boolean} - True if successful.
     * @private
     */
    replaceNodeInParent(newNode) {
        const parent = newNode.parent;
        if (!parent || !parent.argumentNodeList) return false;

        for (const key in parent.argumentNodeList) {
            const property = parent.argumentNodeList[key];
            if (property === this) {
                parent.argumentNodeList[key] = newNode;
                if (Object.prototype.hasOwnProperty.call(parent, key)) {
                    parent[key] = newNode;
                }
                return true;
            }
            if (Array.isArray(property) && property.includes(this)) {
                const index = property.indexOf(this);
                property[index] = newNode;
                if (parent[key] === property) {
                    parent[key][index] = newNode;
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Helper method to update the SVG representation in the DOM.
     * @param {omdNode} newNode - The new node.
     * @private
     */
    updateSvg(newNode) {
        const parent = newNode.parent;
        if (parent && parent.svgObject && this.svgObject && newNode.svgObject) {
            try {
                parent.svgObject.replaceChild(newNode.svgObject, this.svgObject);
            } catch (e) {
                console.error("SVG replacement failed, attempting fallback.", e);
                try {
                    parent.svgObject.removeChild(this.svgObject);
                    parent.svgObject.appendChild(newNode.svgObject);
                } catch (fallbackError) {
                    console.error("SVG fallback replacement also failed:", fallbackError);
                }
            }
        }
    }

    /**
     * Traverses up the tree from this node's parent to re-calculate dimensions and layouts.
     */
    updateLayoutUpwards() {
        const ancestors = [];
        let current = this.parent;
        while (current) {
            ancestors.push(current);
            current = current.parent;
        }
        for (const ancestor of ancestors) {
            if (typeof ancestor.computeDimensions === 'function') ancestor.computeDimensions();
        }
        for (let i = ancestors.length - 1; i >= 0; i--) {
            if (typeof ancestors[i].updateLayout === 'function') ancestors[i].updateLayout();
        }
    }

    /**
     * Determines if the node represents a constant numerical value.
     * @returns {boolean}
     */
    isConstant() {
        return false;
    }

    /**
     * Retrieves the numerical value of a constant node.
     * Throws an error if the node is not constant.
     * @returns {number}
     */
    getValue() {
        throw new Error("Node is not a constant expression");
    }

    /**
     * Retrieves the rational value of a constant node as a numerator/denominator pair.
     * Throws an error if the node is not constant.
     * @returns {{num: number, den: number}}
     */
    getRationalValue() {
        throw new Error("Node is not a constant rational expression");
    }

    /**
     * Simplifies this standalone node if it's not part of a sequence
     * @returns {Promise<Object>} Result with {success: boolean, foldedCount: number, newRoot: omdNode|null, message: string}
     */
    simplify() {
        if (!_simplifyStep) throw new Error("simplifyStep not set");
        try {
            const { foldedCount, newRoot } = _simplifyStep(this);
            if (foldedCount > 0) {
                return {
                    success: true,
                    foldedCount,
                    newRoot,
                    message: `Simplified! Applied ${foldedCount} simplification step(s)`
                };
            } else {
                return {
                    success: false,
                    foldedCount: 0,
                    newRoot: null,
                    message: 'No simplifications available'
                };
            }
        } catch (error) {
            return {
                success: false,
                foldedCount: 0,
                newRoot: null,
                message: `Simplification error: ${error.message}`
            };
        }
    }

    /**
     * Converts the omdNode and its children back into a math.js AST node.
     * This method must be implemented by all subclasses.
     * @returns {Object} A math.js-compatible AST node.
     */
    toMathJSNode() {
        throw new Error(`toMathJSNode() must be implemented by ${this.type}`);
    }

    /**
     * @returns {string} A string representation of the node.
     */
    toString() {
        try {
            // Use toMathJSNode to get math.js compatible AST, then convert to string
            const mathJSNode = this.toMathJSNode();
            return mathJSNode.toString();
        } catch (error) {
            // Fallback to simple class name if conversion fails
            return `[${this.type}]`;
        }
    }
    
    /**
     * Render the node to SVG.
     * @returns {SVGElement} The rendered SVG element
     */
    render() {
        if (!this.svgElement) {
            this.svgElement = this.renderSelf();
        }
        return this.svgElement;
    }
    
    /**
     * Abstract method - Must be implemented by subclasses.
     * Creates the specific SVG representation for this node type.
     * @returns {SVGElement}
     */
    renderSelf() {
        throw new Error(`renderSelf() must be implemented by ${this.type}`);
    }
    
    /**
     * Set the font size for rendering.
     * @param {number} size - The font size in pixels
     */
    setFontSize(size) {
        this.fontSize = size;
        // Update all children
        if (this.childList) {
            this.childList.forEach(child => {
                if (child && typeof child.setFontSize === 'function') {
                    child.setFontSize(size);
                }
            });
        }
    }
    
    /**
     * Move the node to a specific position.
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     */
    moveTo(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        
        this.x = x;
        this.y = y;
        
        // Update SVG position if rendered
        if (this.svgElement) {
            this.svgElement.setAttribute('transform', `translate(${this.x}, ${this.y})`);
        }
        
        // Move all children relatively
        if (this.childList) {
            this.childList.forEach(child => {
                if (child && typeof child.moveTo === 'function') {
                    child.moveTo(child.x + dx, child.y + dy);
                }
            });
        }
    }
    
    /**
     * Make the node visible.
     */
    show() {
        this.visible = true;
        if (this.svgElement) {
            this.svgElement.style.display = 'block';
        }
        if (this.svgObject) {
            this.svgObject.style.display = 'block';
        }
    }
    
    /**
     * Hide the node.
     */
    hide() {
        this.visible = false;
        if (this.svgElement) {
            this.svgElement.style.display = 'none';
        }
        if (this.svgObject) {
            this.svgObject.style.display = 'none';
        }
    }
    
    /**
     * Get the depth of the node in the tree.
     * @returns {number} The depth (0 for root)
     */
    getDepth() {
        let depth = 0;
        let current = this.parent;
        while (current) {
            depth++;
            current = current.parent;
        }
        return depth;
    }
    
    /**
     * Find the nearest parent node of a specific type.
     * @param {string} type - The node type to search for
     * @returns {omdNode|null} The parent node or null if not found
     */
    findParentOfType(type) {
        let current = this.parent;
        while (current) {
            if (current.type === type || current.type === type) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }
    
    /**
     * Create a node from a math.js AST.
     * Factory method that creates the appropriate node subclass based on the AST type.
     * @param {Object} ast - The math.js AST object
     * @returns {omdNode} The appropriate node subclass instance
     * @static
     */
    static fromAST(ast) {
        // This should ideally be implemented to use the node factory
        // For now, throw an error indicating it should use the helper
        throw new Error('Use omdHelpers.createNodeFromAST() instead');
    }

    /**
     * Validates the provenance integrity of this node and its descendants
     * @param {Map} [nodeMap] - Optional map of all known nodes for validation
     * @returns {Array} Array of validation issues found
     */
    validateProvenance(nodeMap = null) {
        const issues = [];
        const allNodes = this.findAllNodes();
        
        // Create a set of all valid node IDs if nodeMap not provided
        const validIds = nodeMap ? 
            new Set(nodeMap.keys()) : 
            new Set(allNodes.map(n => n.id));
        
        allNodes.forEach(node => {
            // Check for duplicate IDs in provenance
            if (node.provenance && node.provenance.length > 0) {
                const uniqueProvenance = new Set(node.provenance);
                if (uniqueProvenance.size !== node.provenance.length) {
                    issues.push({
                        type: 'duplicate_provenance',
                        nodeId: node.id,
                        nodeType: node.type,
                        provenance: node.provenance
                    });
                }
                
                // Check for invalid provenance references
                node.provenance.forEach(id => {
                    if (!validIds.has(id)) {
                        issues.push({
                            type: 'invalid_provenance_reference',
                            nodeId: node.id,
                            nodeType: node.type,
                            invalidId: id
                        });
                    }
                });
                
                // Check for self-reference in provenance
                if (node.provenance.includes(node.id)) {
                    issues.push({
                        type: 'self_reference_provenance',
                        nodeId: node.id,
                        nodeType: node.type
                    });
                }
            }
        });
        
        return issues;
    }

    setHighlight(highlightOn = true, color = omdColor.highlightColor) {
        // If this node is already highlighted for explanation, keep that color
        if (this.backRect && this.backRect.fillColor === omdColor.explainColor) {
            return;
        }
        
        // Otherwise proceed with normal highlighting
        if (this.isExplainHighlighted) return; // Respect the lock
        
        if (this.backRect) {
            this.backRect.setFillColor(highlightOn ? color : omdColor.lightGray);
            this.backRect.setOpacity(1.0);
        }
    }

    lowlight() {
        // If this node is highlighted for explanation, keep that color
        if (this.backRect && this.backRect.fillColor === omdColor.explainColor) {
            return;
        }
        
        if (this.isExplainHighlighted) return; // Respect the lock
        super.lowlight();
    }

    setFillColor(color) {
        if (this.isExplainHighlighted) return; // Respect the lock
        // ... (rest of the method) ...
    }
}