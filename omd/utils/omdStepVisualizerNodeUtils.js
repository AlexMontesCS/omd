/**
 * Utility functions for node operations in step visualizations
 */
export class omdStepVisualizerNodeUtils {
    /**
     * Checks if a node is a leaf node (constant, variable, etc.)
     * @param {omdNode} node - Node to check
     * @returns {boolean} True if it's a leaf node
     */
    static isLeafNode(node) {
        if (!node) return false;
        
        const leafTypes = [
            'omdConstantNode',
            'omdVariableNode',
            'omdOperatorNode'
        ];
        
        if (node.constructor && leafTypes.includes(node.type)) {
            return true;
        }
        
        if (node.type === 'constant' || node.type === 'variable' || node.type === 'operator') {
            return true;
        }
        
        if (!node.left && !node.right && !node.argument && !node.expression) {
            return true;
        }
        
        return false;
    }

    /**
     * Checks if a node is a binary operation node
     * @param {omdNode} node - Node to check
     * @returns {boolean} True if it's a binary node
     */
    static isBinaryNode(node) {
        if (!node) return false;
        return node.type === 'omdBinaryExpressionNode' && node.left && node.right;
    }

    /**
     * Checks if a node is a unary operation node
     * @param {omdNode} node - Node to check
     * @returns {boolean} True if it's a unary node
     */
    static isUnaryNode(node) {
        if (!node) return false;
        return node.type === 'omdUnaryExpressionNode' && node.argument;
    }

    /**
     * Checks if a node has an expression property
     * @param {omdNode} node - Node to check
     * @returns {boolean} True if it has an expression
     */
    static hasExpression(node) {
        if (!node) return false;
        return node.expression !== undefined;
    }

    /**
     * Gets the value of a leaf node for comparison
     * @param {omdNode} node - Node to get value from
     * @returns {string} String representation of the node's value
     */
    static getNodeValue(node) {
        if (!node) return 'undefined';
        
        try {
            if (node.constructor && node.type === 'omdVariableNode' && node.name !== undefined) {
                return String(node.name);
            }
            
            if (node.constructor && node.type === 'omdConstantNode' && typeof node.number === 'number') {
                return String(node.number);
            }
            
            if (node.isConstant && node.isConstant() && node.getValue && typeof node.getValue === 'function') {
                return String(node.getValue());
            }
            
            if (node.toString && typeof node.toString === 'function') {
                return node.toString();
            }
            
            if (node.value !== undefined) {
                return String(node.value);
            }
            
            if (node.number !== undefined) {
                return String(node.number);
            }
            
            return node.constructor ? node.type : 'unknown';
        } catch (err) {
            console.error('Error getting node value:', err);
            return 'error';
        }
    }

    /**
     * Finds all leaf nodes in a tree
     * @param {omdNode} node - Root node to search from
     * @returns {Array} Array of leaf nodes
     */
    static findLeafNodes(node) {
        if (!node) return [];

        if (this.isLeafNode(node)) {
            return [node];
        }

        const leafNodes = [];
        
        try {
            if (this.isBinaryNode(node)) {
                leafNodes.push(...this.findLeafNodes(node.left));
                leafNodes.push(...this.findLeafNodes(node.right));
            } else if (this.isUnaryNode(node)) {
                leafNodes.push(...this.findLeafNodes(node.argument));
            } else if (this.hasExpression(node)) {
                leafNodes.push(...this.findLeafNodes(node.expression));
            }
        } catch (err) {
            console.error('Error finding leaf nodes:', err, node);
        }

        return leafNodes;
    }

    /**
     * Finds all variable nodes in a tree
     * @param {omdNode} node - Root node to search from
     * @returns {Array} Array of variable nodes
     */
    static findVariableNodes(node) {
        const leaves = this.findLeafNodes(node);
        return leaves.filter(leaf => leaf.constructor && leaf.type === 'omdVariableNode');
    }

    /**
     * Finds all constant nodes in a tree
     * @param {omdNode} node - Root node to search from
     * @returns {Array} Array of constant nodes
     */
    static findConstantNodes(node) {
        const leaves = this.findLeafNodes(node);
        return leaves.filter(leaf => leaf.constructor && leaf.type === 'omdConstantNode');
    }

    /**
     * Finds leaf nodes with a specific value
     * @param {omdNode} node - Root node to search from
     * @param {string} value - Value to search for
     * @returns {Array} Array of matching leaf nodes
     */
    static findLeafNodesWithValue(node, value) {
        const leaves = this.findLeafNodes(node);
        
        const exactMatches = leaves.filter(leaf => leaf.toString() === value);
        if (exactMatches.length > 0) {
            return exactMatches;
        }
        
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const numericMatches = leaves.filter(leaf => {
                if (leaf.constructor && leaf.type === 'omdConstantNode') {
                    if (leaf.number !== undefined) {
                        return Math.abs(leaf.number - numValue) < 0.0001;
                    }
                }
                return false;
            });
            
            if (numericMatches.length > 0) {
                return numericMatches;
            }
        }
        
        return leaves.filter(leaf => {
            const leafStr = leaf.toString();
            return leafStr.includes(value) || value.includes(leafStr);
        });
    }

    /**
     * Finds all nodes in a tree (not just leaf nodes)
     * @param {omdNode} node - Root node to search from
     * @returns {Array} Array of all nodes in the tree
     */
    static findAllNodes(node) {
        if (!node) return [];
        
        const allNodes = [node];
        
        try {
            if (node.childList && Array.isArray(node.childList)) {
                node.childList.forEach(child => {
                    if (child && child !== node.backRect) {
                        allNodes.push(...this.findAllNodes(child));
                    }
                });
            }
            
            if (node.argumentNodeList) {
                Object.values(node.argumentNodeList).forEach(child => {
                    if (child && child !== node) {
                        if (Array.isArray(child)) {
                            child.forEach(item => {
                                if (item && item !== node) {
                                    allNodes.push(...this.findAllNodes(item));
                                }
                            });
                        } else {
                            allNodes.push(...this.findAllNodes(child));
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error finding all nodes:', err, node);
        }
        
        return allNodes;
    }

    /**
     * Finds the rightmost leaf node with a specific value in a tree
     * @param {omdNode} node - Root node to search from
     * @param {string} value - Value to search for
     * @returns {omdNode|null} The rightmost matching leaf node, or null if not found
     */
    static findRightmostNodeWithValue(node, value) {
        const leaves = this.findLeafNodes(node);
        
        const matchingNodes = leaves.filter(leaf => {
            const leafStr = leaf.toString();
            return leafStr === value || 
                   (leaf.constructor && 
                    leaf.type === 'omdConstantNode' && 
                    leaf.number !== undefined && 
                    Math.abs(leaf.number - parseFloat(value)) < 0.0001);
        });
        
        if (matchingNodes.length === 0) {
            return null;
        }
        
        const subtractedNodes = matchingNodes.filter(leaf => {
            const parent = leaf.parent;
            return parent && 
                   parent.constructor && 
                   parent.type === 'omdBinaryExpressionNode' &&
                   parent.operation === 'subtract' &&
                   parent.right === leaf;
        });
        
        if (subtractedNodes.length > 0) {
            return subtractedNodes[subtractedNodes.length - 1];
        }
        
        return matchingNodes[matchingNodes.length - 1];
    }
} 