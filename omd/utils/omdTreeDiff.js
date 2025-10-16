import { omdStepVisualizerNodeUtils } from '../utils/omdStepVisualizerNodeUtils.js';

/**
 * Robust tree diff algorithm using optimal substructure matching
 * This replaces the special-case-heavy approach with a systematic algorithm
 */
export class omdTreeDiff {
    
    /**
     * Main entry point - finds changed nodes between two equations
     * @param {omdEquationNode} oldEquation - Previous equation
     * @param {omdEquationNode} newEquation - Current equation
     * @param {Object} options - Configuration options
     * @param {boolean} options.educationalMode - If true, highlights mathematically neutral changes for learning
     * @returns {Array} Array of changed nodes to highlight
     */
    static findChangedNodes(oldEquation, newEquation, options = {}) {
        const { educationalMode = false } = options;
        

        
        // === SPECIAL CASE: Same operation added to both sides ===
        const specialCaseNodes = this.findEquationSpecialCases(oldEquation, newEquation);
        if (specialCaseNodes.length > 0) {
            return specialCaseNodes;
        }
        
        const changedNodes = [];
        
        // Compare left sides if they differ
        if (oldEquation.left.toString() !== newEquation.left.toString()) {
            const leftChanges = this.diffSubtrees(oldEquation.left, newEquation.left, educationalMode);
            changedNodes.push(...leftChanges);
        }
        
        // Compare right sides if they differ
        if (oldEquation.right.toString() !== newEquation.right.toString()) {
            const rightChanges = this.diffSubtrees(oldEquation.right, newEquation.right, educationalMode);
            changedNodes.push(...rightChanges);
        }
        
        return changedNodes;
    }
    
    /**
     * Find equation-level special cases (like adding same operation to both sides)
     * @param {omdEquationNode} oldEquation - Previous equation
     * @param {omdEquationNode} newEquation - Current equation
     * @returns {Array} Nodes to highlight for equation special cases
     */
    static findEquationSpecialCases(oldEquation, newEquation) {
        const oldLeftStr = oldEquation.left.toString();
        const newLeftStr = newEquation.left.toString();
        const oldRightStr = oldEquation.right.toString();
        const newRightStr = newEquation.right.toString();
        
        // Check if we're adding the same operation to both sides
        if (newLeftStr.startsWith(oldLeftStr) && newRightStr.startsWith(oldRightStr)) {
            const leftSuffix = newLeftStr.substring(oldLeftStr.length).trim();
            const rightSuffix = newRightStr.substring(oldRightStr.length).trim();
            
            // Case 1: Adding subtraction to both sides (e.g., "x + 2 = 5" → "x + 2 - 2 = 5 - 2")
            if (leftSuffix.startsWith("-") && rightSuffix.startsWith("-") && 
                leftSuffix.substring(1).trim() === rightSuffix.substring(1).trim()) {
                
                const subtractedValue = leftSuffix.substring(1).trim();
                
                const nodesToHighlight = [];
                
                // Find rightmost occurrence of the subtracted value on left side
                const leftSubtractedNode = omdStepVisualizerNodeUtils.findRightmostNodeWithValue(newEquation.left, subtractedValue);
                if (leftSubtractedNode) {
                    // If it's a leaf node, add it directly; otherwise find its leaf nodes
                    if (omdStepVisualizerNodeUtils.isLeafNode(leftSubtractedNode)) {
                        nodesToHighlight.push(leftSubtractedNode);
                    } else {
                        const leftLeaves = omdStepVisualizerNodeUtils.findLeafNodes(leftSubtractedNode);
                        nodesToHighlight.push(...leftLeaves);
                    }
                }
                
                // Find rightmost occurrence of the subtracted value on right side
                const rightSubtractedNode = omdStepVisualizerNodeUtils.findRightmostNodeWithValue(newEquation.right, subtractedValue);
                if (rightSubtractedNode) {
                    // If it's a leaf node, add it directly; otherwise find its leaf nodes
                    if (omdStepVisualizerNodeUtils.isLeafNode(rightSubtractedNode)) {
                        nodesToHighlight.push(rightSubtractedNode);
                    } else {
                        const rightLeaves = omdStepVisualizerNodeUtils.findLeafNodes(rightSubtractedNode);
                        nodesToHighlight.push(...rightLeaves);
                    }
                }
                
                return nodesToHighlight;
            }
            
            // Case 2: Adding addition to both sides (e.g., "x - 2 = 3" → "x - 2 + 2 = 3 + 2")
            if (leftSuffix.startsWith("+") && rightSuffix.startsWith("+") && 
                leftSuffix.substring(1).trim() === rightSuffix.substring(1).trim()) {
                
                const addedValue = leftSuffix.substring(1).trim();
                
                const nodesToHighlight = [];
                
                // Find rightmost occurrence of the added value on left side
                const leftAddedNode = omdStepVisualizerNodeUtils.findRightmostNodeWithValue(newEquation.left, addedValue);
                if (leftAddedNode) {
                    // If it's a leaf node, add it directly; otherwise find its leaf nodes
                    if (omdStepVisualizerNodeUtils.isLeafNode(leftAddedNode)) {
                        nodesToHighlight.push(leftAddedNode);
                    } else {
                        const leftLeaves = omdStepVisualizerNodeUtils.findLeafNodes(leftAddedNode);
                        nodesToHighlight.push(...leftLeaves);
                    }
                }
                
                // Find rightmost occurrence of the added value on right side  
                const rightAddedNode = omdStepVisualizerNodeUtils.findRightmostNodeWithValue(newEquation.right, addedValue);
                if (rightAddedNode) {
                    // If it's a leaf node, add it directly; otherwise find its leaf nodes
                    if (omdStepVisualizerNodeUtils.isLeafNode(rightAddedNode)) {
                        nodesToHighlight.push(rightAddedNode);
                    } else {
                        const rightLeaves = omdStepVisualizerNodeUtils.findLeafNodes(rightAddedNode);
                        nodesToHighlight.push(...rightLeaves);
                    }
                }
                
                return nodesToHighlight;
            }
        }
        
        return [];
    }
    
    /**
     * Core algorithm: find optimal subtree matching and return unmatched nodes
     * @param {omdNode} oldTree - Old tree root
     * @param {omdNode} newTree - New tree root
     * @param {boolean} educationalMode - Whether to highlight pedagogical changes
     * @returns {Array} Array of unmatched leaf nodes in new tree
     */
    static diffSubtrees(oldTree, newTree, educationalMode = false) {
        // === STEP 1: CHECK FOR EDUCATIONAL PATTERNS FIRST ===
        // These patterns from the old system worked really well for highlighting
        
        // Check for common prefix patterns (like "2x + 4" → "2x + 4 - 4")
        const prefixHighlights = this.findCommonPrefixHighlights(oldTree, newTree);
        if (prefixHighlights.length > 0) {
            return prefixHighlights;
        }
        
        // Check for variable preservation patterns (when variables stay same but constants change)
        const variableHighlights = this.findVariablePreservationHighlights(oldTree, newTree);
        if (variableHighlights.length > 0) {
            return variableHighlights;
        }
        
        // Check for type difference patterns (constant becoming binary expression, etc.)
        const typeHighlights = this.findTypeDifferenceHighlights(oldTree, newTree);
        if (typeHighlights.length > 0) {
            return typeHighlights;
        }
        
        // Check for subtraction patterns (when one part matches and other is subtracted)
        const subtractionHighlights = this.findSubtractionPatternHighlights(oldTree, newTree);
        if (subtractionHighlights.length > 0) {
            return subtractionHighlights;
        }
        
        // === STEP 2: FALLBACK TO OPTIMAL MATCHING ALGORITHM ===
        
        // Find all possible subtree matches
        const allMatches = this.findAllSubtreeMatches(oldTree, newTree);
        
        // Select optimal non-overlapping set of matches
        const optimalMatches = this.selectOptimalMatching(allMatches);
        
        // Find unmatched nodes (these are the changes)
        let unmatchedNodes = this.findUnmatchedLeafNodes(newTree, optimalMatches);
        
        // Educational mode - highlight simplifications
        if (educationalMode && unmatchedNodes.length === 0) {
            const educationalHighlights = this.findEducationalHighlights(oldTree, newTree, optimalMatches);
            unmatchedNodes.push(...educationalHighlights);
        }
        
        return unmatchedNodes;
    }
    
    /**
     * Find educational highlights for cases where mathematical content didn't change
     * but pedagogical highlighting is desired (e.g., removing + 0)
     * @param {omdNode} oldTree - Old tree root
     * @param {omdNode} newTree - New tree root  
     * @param {Array} optimalMatches - The matches already found
     * @returns {Array} Additional nodes to highlight for educational purposes
     */
    static findEducationalHighlights(oldTree, newTree, optimalMatches) {
        const educationalNodes = [];
        
        // Case 1: Additive identity removal (+ 0 or - 0)
        const identityHighlights = this.findAdditiveIdentityChanges(oldTree, newTree);
        educationalNodes.push(...identityHighlights);
        
        // Case 2: Multiplicative identity removal (* 1 or / 1)  
        const multiplicativeHighlights = this.findMultiplicativeIdentityChanges(oldTree, newTree);
        educationalNodes.push(...multiplicativeHighlights);
        
        // Case 3: Double negative simplification (--x → x)
        const doubleNegativeHighlights = this.findDoubleNegativeChanges(oldTree, newTree);
        educationalNodes.push(...doubleNegativeHighlights);
        
        return educationalNodes;
    }
    
    /**
     * Find additive identity changes (removal of + 0 or - 0)
     * @param {omdNode} oldTree - Old tree
     * @param {omdNode} newTree - New tree
     * @returns {Array} Nodes to highlight for additive identity
     */
    static findAdditiveIdentityChanges(oldTree, newTree) {
        // Check if old tree has + 0 or - 0 that's not in new tree
        const oldStr = oldTree.toString();
        const newStr = newTree.toString();
        
        // Pattern: "expression + 0" → "expression" or "expression - 0" → "expression"
        if ((oldStr.includes(" + 0") || oldStr.includes(" - 0")) && 
            !newStr.includes(" + 0") && !newStr.includes(" - 0")) {
            
            // Highlight ALL leaf nodes of the remaining expression to show the complete term
            const allLeafNodes = omdStepVisualizerNodeUtils.findLeafNodes(newTree);
            
            if (allLeafNodes.length > 0) {
                return allLeafNodes; // Highlight all leaf nodes in the remaining expression
            }
        }
        
        return [];
    }
    
    /**
     * Find multiplicative identity changes (removal of * 1 or / 1)
     * @param {omdNode} oldTree - Old tree
     * @param {omdNode} newTree - New tree
     * @returns {Array} Nodes to highlight for multiplicative identity
     */
    static findMultiplicativeIdentityChanges(oldTree, newTree) {
        const oldStr = oldTree.toString();
        const newStr = newTree.toString();
        
        if ((oldStr.includes(" * 1") || oldStr.includes(" / 1")) && 
            !newStr.includes(" * 1") && !newStr.includes(" / 1")) {
            
            const allLeafNodes = omdStepVisualizerNodeUtils.findLeafNodes(newTree);
            if (allLeafNodes.length > 0) {
                return allLeafNodes; // Highlight entire remaining expression
            }
        }
        
        return [];
    }
    
    /**
     * Find double negative changes (--x → x)
     * @param {omdNode} oldTree - Old tree
     * @param {omdNode} newTree - New tree
     * @returns {Array} Nodes to highlight for double negative removal
     */
    static findDoubleNegativeChanges(oldTree, newTree) {
        const oldStr = oldTree.toString();
        const newStr = newTree.toString();
        
        if (oldStr.includes("--") && !newStr.includes("--")) {
            const allLeafNodes = omdStepVisualizerNodeUtils.findLeafNodes(newTree);
            if (allLeafNodes.length > 0) {
                return allLeafNodes; // Highlight entire remaining expression
            }
        }
        
        return [];
    }
    
    /**
     * Find common prefix highlighting patterns
     * Example: "2x + 4" → "2x + 4 - 4" should highlight only the "- 4" part
     * @param {omdNode} oldTree - Old tree
     * @param {omdNode} newTree - New tree
     * @returns {Array} Nodes to highlight for common prefix patterns
     */
    static findCommonPrefixHighlights(oldTree, newTree) {
        // Only apply to binary expressions
        if (!omdStepVisualizerNodeUtils.isBinaryNode(newTree)) {
            return [];
        }
        
        const oldStr = oldTree.toString();
        const newStr = newTree.toString();
        
        // Find common prefix
        const commonPrefix = this._findCommonPrefix(oldStr, newStr);
        if (!commonPrefix || commonPrefix.length <= 1) {
            return [];
        }
        
        const oldSuffix = oldStr.substring(commonPrefix.length).trim();
        const newSuffix = newStr.substring(commonPrefix.length).trim();
        
        // Case 1: New suffix is "0" (simplification to zero)
        if (newSuffix === "0") {
            const zeroNodes = omdStepVisualizerNodeUtils.findLeafNodesWithValue(newTree, "0");
            if (zeroNodes.length > 0) {
                return zeroNodes;
            }
        }
        
        // Case 2: New suffix is a subtraction (adding negative term)
        if (oldSuffix === "" && newSuffix.startsWith("- ")) {
            const subtractedValue = newSuffix.substring(2).trim();
            
            const subtractedNodes = omdStepVisualizerNodeUtils.findLeafNodesWithValue(newTree, subtractedValue);
            if (subtractedNodes.length > 0) {
                return subtractedNodes;
            }
        }
        
        return [];
    }
    
    /**
     * Find variable preservation highlighting patterns  
     * Example: "2x + 4" → "2x + 2" should highlight only the changed constant
     * @param {omdNode} oldTree - Old tree
     * @param {omdNode} newTree - New tree
     * @returns {Array} Nodes to highlight for variable preservation patterns
     */
    static findVariablePreservationHighlights(oldTree, newTree) {
        // Only apply to binary expressions
        if (!omdStepVisualizerNodeUtils.isBinaryNode(oldTree) || 
            !omdStepVisualizerNodeUtils.isBinaryNode(newTree)) {
            return [];
        }
        
        const oldStr = oldTree.toString();
        const newStr = newTree.toString();
        
        // Check if both expressions contain the same variable term
        const variablePattern = /(\d*[a-zA-Z])/;
        const oldMatch = oldStr.match(variablePattern);
        const newMatch = newStr.match(variablePattern);
        
        if (oldMatch && newMatch && oldMatch[0] === newMatch[0]) {
            // Find constants that changed
            const oldConstNodes = omdStepVisualizerNodeUtils.findConstantNodes(oldTree);
            const newConstNodes = omdStepVisualizerNodeUtils.findConstantNodes(newTree);
            
            const changedConstNodes = newConstNodes.filter(newNode => {
                return !oldConstNodes.some(oldNode => 
                    oldNode.toString() === newNode.toString()
                );
            });
            
            return changedConstNodes;
        }
        
        return [];
    }
    
    /**
     * Find type difference highlighting patterns
     * Example: constant "3" → binary expression "x + 2" should highlight the new expression
     * @param {omdNode} oldTree - Old tree
     * @param {omdNode} newTree - New tree  
     * @returns {Array} Nodes to highlight for type difference patterns
     */
    static findTypeDifferenceHighlights(oldTree, newTree) {
        const oldType = oldTree.constructor ? oldTree.type : 'unknown';
        const newType = newTree.constructor ? newTree.type : 'unknown';
        
        if (oldType === newType) {
            return []; // Same type, not a type difference pattern
        }
        
        // Case 1: New node is binary, check if old node is part of it
        if (omdStepVisualizerNodeUtils.isBinaryNode(newTree)) {
            const oldStr = oldTree.toString();
            const newLeftStr = newTree.left ? newTree.left.toString() : '';
            const newRightStr = newTree.right ? newTree.right.toString() : '';
            
            if (oldStr === newLeftStr) {
                if (newTree.right) {
                    const leafNodes = omdStepVisualizerNodeUtils.findLeafNodes(newTree.right);
                    return leafNodes;
                }
            } else if (oldStr === newRightStr) {
                if (newTree.left) {
                    const leafNodes = omdStepVisualizerNodeUtils.findLeafNodes(newTree.left);
                    return leafNodes;
                }
            }
        }
        
        // Case 2: Complete change - highlight all leaf nodes in new tree
        const leaves = omdStepVisualizerNodeUtils.findLeafNodes(newTree);
        return leaves;
    }
    
    /**
     * Find subtraction pattern highlighting 
     * Example: "x + 2" → "x + 2 - 2" should highlight only the "- 2" part
     * @param {omdNode} oldTree - Old tree
     * @param {omdNode} newTree - New tree
     * @returns {Array} Nodes to highlight for subtraction patterns
     */
    static findSubtractionPatternHighlights(oldTree, newTree) {
        // Check if new tree is a subtraction and old tree matches the left side
        if (omdStepVisualizerNodeUtils.isBinaryNode(newTree) && 
            newTree.operation === 'subtract') {
            
            const oldStr = oldTree.toString();
            const newLeftStr = newTree.left?.toString();
            
            if (oldStr === newLeftStr) {
                if (newTree.right) {
                    const rightLeaves = omdStepVisualizerNodeUtils.findLeafNodes(newTree.right);
                    return rightLeaves;
                }
            }
        }
        
        return [];
    }
    
    /**
     * Helper: Find the longest common prefix between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {string} The common prefix
     * @private
     */
    static _findCommonPrefix(str1, str2) {
        let i = 0;
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
            i++;
        }
        return str1.substring(0, i);
    }
    
    /**
     * Find all possible matches between subtrees of old and new trees
     * @param {omdNode} oldTree - Old tree root
     * @param {omdNode} newTree - New tree root
     * @returns {Array} Array of match objects {oldNode, newNode, size, score}
     */
    static findAllSubtreeMatches(oldTree, newTree) {
        const matches = [];
        const oldSubtrees = this.getAllSubtrees(oldTree);
        const newSubtrees = this.getAllSubtrees(newTree);
        
        for (const oldSub of oldSubtrees) {
            for (const newSub of newSubtrees) {
                const similarity = this.calculateSimilarity(oldSub, newSub);
                if (similarity.isMatch) {
                    matches.push({
                        oldNode: oldSub,
                        newNode: newSub,
                        size: similarity.size,
                        score: similarity.score,
                        type: similarity.type
                    });
                }
            }
        }
        
        return matches;
    }
    
    /**
     * Get all subtrees (including single nodes) from a tree
     * @param {omdNode} root - Root node
     * @returns {Array} Array of all subtrees
     */
    static getAllSubtrees(root) {
        if (!root) return [];
        
        const subtrees = [root];
        
        // Add all child subtrees recursively
        if (omdStepVisualizerNodeUtils.isBinaryNode(root)) {
            subtrees.push(...this.getAllSubtrees(root.left));
            subtrees.push(...this.getAllSubtrees(root.right));
        } else if (omdStepVisualizerNodeUtils.isUnaryNode(root)) {
            subtrees.push(...this.getAllSubtrees(root.argument));
        } else if (omdStepVisualizerNodeUtils.hasExpression(root)) {
            subtrees.push(...this.getAllSubtrees(root.expression));
        }
        
        return subtrees;
    }
    
    /**
     * Calculate similarity between two subtrees
     * @param {omdNode} tree1 - First tree
     * @param {omdNode} tree2 - Second tree
     * @returns {Object} Similarity info {isMatch, size, score, type}
     */
    static calculateSimilarity(tree1, tree2) {
        // Exact structural match
        if (this.treesStructurallyEqual(tree1, tree2)) {
            const size = this.getSubtreeSize(tree1);
            return {
                isMatch: true,
                size: size,
                score: size * 10, // High score for exact matches
                type: 'exact'
            };
        }
        
        // Exact string match (different structure, same result)
        if (tree1.toString() === tree2.toString()) {
            const size = this.getSubtreeSize(tree1);
            return {
                isMatch: true,
                size: size,
                score: size * 8, // Slightly lower than structural match
                type: 'equivalent'
            };
        }
        
        // Leaf node value match
        if (omdStepVisualizerNodeUtils.isLeafNode(tree1) && 
            omdStepVisualizerNodeUtils.isLeafNode(tree2)) {
            const val1 = omdStepVisualizerNodeUtils.getNodeValue(tree1);
            const val2 = omdStepVisualizerNodeUtils.getNodeValue(tree2);
            
            if (val1 === val2) {
                return {
                    isMatch: true,
                    size: 1,
                    score: 5, // Lower score for single nodes
                    type: 'leaf'
                };
            }
        }
        
        return { isMatch: false, size: 0, score: 0, type: 'none' };
    }
    
    /**
     * Check if two trees are structurally identical
     * @param {omdNode} tree1 - First tree
     * @param {omdNode} tree2 - Second tree
     * @returns {boolean} True if structurally identical
     */
    static treesStructurallyEqual(tree1, tree2) {
        if (!tree1 && !tree2) return true;
        if (!tree1 || !tree2) return false;
        
        // Check node types
        const type1 = tree1.constructor ? tree1.type : 'unknown';
        const type2 = tree2.constructor ? tree2.type : 'unknown';
        if (type1 !== type2) return false;
        
        // Check leaf nodes
        if (omdStepVisualizerNodeUtils.isLeafNode(tree1)) {
            const val1 = omdStepVisualizerNodeUtils.getNodeValue(tree1);
            const val2 = omdStepVisualizerNodeUtils.getNodeValue(tree2);
            return val1 === val2;
        }
        
        // Check binary nodes
        if (omdStepVisualizerNodeUtils.isBinaryNode(tree1)) {
            if (tree1.operation !== tree2.operation) return false;
            return this.treesStructurallyEqual(tree1.left, tree2.left) &&
                   this.treesStructurallyEqual(tree1.right, tree2.right);
        }
        
        // Check unary nodes
        if (omdStepVisualizerNodeUtils.isUnaryNode(tree1)) {
            if (tree1.operation !== tree2.operation) return false;
            return this.treesStructurallyEqual(tree1.argument, tree2.argument);
        }
        
        // Check expression nodes
        if (omdStepVisualizerNodeUtils.hasExpression(tree1)) {
            return this.treesStructurallyEqual(tree1.expression, tree2.expression);
        }
        
        return false;
    }
    
    /**
     * Calculate the size (number of nodes) in a subtree
     * @param {omdNode} root - Root of subtree
     * @returns {number} Number of nodes in subtree
     */
    static getSubtreeSize(root) {
        if (!root) return 0;
        
        let size = 1; // Count this node
        
        if (omdStepVisualizerNodeUtils.isBinaryNode(root)) {
            size += this.getSubtreeSize(root.left);
            size += this.getSubtreeSize(root.right);
        } else if (omdStepVisualizerNodeUtils.isUnaryNode(root)) {
            size += this.getSubtreeSize(root.argument);
        } else if (omdStepVisualizerNodeUtils.hasExpression(root)) {
            size += this.getSubtreeSize(root.expression);
        }
        
        return size;
    }
    
    /**
     * Select optimal non-overlapping set of matches using greedy algorithm
     * @param {Array} matches - Array of potential matches
     * @returns {Array} Array of selected optimal matches
     */
    static selectOptimalMatching(matches) {
        // Sort by score (descending) to prefer better matches
        const sortedMatches = matches.slice().sort((a, b) => b.score - a.score);
        
        const selectedMatches = [];
        const usedOldNodes = new Set();
        const usedNewNodes = new Set();
        
        for (const match of sortedMatches) {
            // Check if this match overlaps with already selected matches
            if (!this.hasNodeOverlap(match.oldNode, usedOldNodes) &&
                !this.hasNodeOverlap(match.newNode, usedNewNodes)) {
                
                selectedMatches.push(match);
                this.markSubtreeAsUsed(match.oldNode, usedOldNodes);
                this.markSubtreeAsUsed(match.newNode, usedNewNodes);
            }
        }
        
        return selectedMatches;
    }
    
    /**
     * Check if a node overlaps with any node in the used set
     * @param {omdNode} node - Node to check
     * @param {Set} usedNodes - Set of already used nodes
     * @returns {boolean} True if there's overlap
     */
    static hasNodeOverlap(node, usedNodes) {
        // Check if this node or any of its ancestors/descendants are used
        const nodeSubtrees = this.getAllSubtrees(node);
        return nodeSubtrees.some(subtree => usedNodes.has(subtree));
    }
    
    /**
     * Mark all nodes in a subtree as used
     * @param {omdNode} root - Root of subtree to mark
     * @param {Set} usedNodes - Set to add nodes to
     */
    static markSubtreeAsUsed(root, usedNodes) {
        const allNodes = this.getAllSubtrees(root);
        allNodes.forEach(node => usedNodes.add(node));
    }
    
    /**
     * Find leaf nodes in new tree that aren't covered by any match
     * @param {omdNode} newTree - New tree root
     * @param {Array} matches - Array of selected matches
     * @returns {Array} Array of unmatched leaf nodes
     */
    static findUnmatchedLeafNodes(newTree, matches) {
        const allLeafNodes = omdStepVisualizerNodeUtils.findLeafNodes(newTree);
        const matchedNodes = new Set();
        
        // Mark all nodes covered by matches
        for (const match of matches) {
            const matchedSubtreeNodes = this.getAllSubtrees(match.newNode);
            matchedSubtreeNodes.forEach(node => matchedNodes.add(node));
        }
        
        // Return leaf nodes not covered by any match
        const unmatchedLeaves = allLeafNodes.filter(leaf => !matchedNodes.has(leaf));
        
        return unmatchedLeaves;
    }
    
    /**
     * Find leaf nodes in old tree that aren't covered by any match (i.e., removed nodes)
     * @param {omdNode} oldTree - Old tree root
     * @param {Array} matches - Array of selected matches
     * @returns {Array} Array of unmatched leaf nodes from old tree
     */
    static findUnmatchedOldNodes(oldTree, matches) {
        const allOldLeafNodes = omdStepVisualizerNodeUtils.findLeafNodes(oldTree);
        const matchedOldNodes = new Set();
        
        // Mark all old nodes covered by matches
        for (const match of matches) {
            const matchedSubtreeNodes = this.getAllSubtrees(match.oldNode);
            matchedSubtreeNodes.forEach(node => matchedOldNodes.add(node));
        }
        
        // Return old leaf nodes not covered by any match (these were removed)
        const unmatchedOldLeaves = allOldLeafNodes.filter(leaf => !matchedOldNodes.has(leaf));
        
        return unmatchedOldLeaves;
    }
    
    /**
     * Debug helper: print tree structure
     * @param {omdNode} node - Node to print
     * @param {number} depth - Current depth for indentation
     * @returns {string} String representation of tree structure
     */
    static debugPrintTree(node, depth = 0) {
        if (!node) return '';
        
        const indent = '  '.repeat(depth);
        const nodeType = node.constructor ? node.type : 'unknown';
        const nodeValue = node.toString ? node.toString() : 'unknown';
        
        let result = `${indent}${nodeType}: "${nodeValue}"\n`;
        
        if (omdStepVisualizerNodeUtils.isBinaryNode(node)) {
            result += `${indent}├─ left:\n${this.debugPrintTree(node.left, depth + 1)}`;
            result += `${indent}└─ right:\n${this.debugPrintTree(node.right, depth + 1)}`;
        } else if (omdStepVisualizerNodeUtils.isUnaryNode(node)) {
            result += `${indent}└─ argument:\n${this.debugPrintTree(node.argument, depth + 1)}`;
        } else if (omdStepVisualizerNodeUtils.hasExpression(node)) {
            result += `${indent}└─ expression:\n${this.debugPrintTree(node.expression, depth + 1)}`;
        }
        
        return result;
    }
} 