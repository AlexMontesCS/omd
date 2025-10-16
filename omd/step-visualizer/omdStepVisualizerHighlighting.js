import { omdColor } from '../../src/omdColor.js';
import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdStepVisualizerNodeUtils } from '../utils/omdStepVisualizerNodeUtils.js';
import { omdTreeDiff } from '../utils/omdTreeDiff.js';

/**
 * Step visualizer highlighting functionality using robust tree diff algorithm.
 * This class implements optimal substructure matching to identify truly changed nodes
 * between mathematical equation steps, eliminating the need for special cases.
 */
export class omdStepVisualizerHighlighting {
    constructor(stepVisualizer) {
        this.stepVisualizer = stepVisualizer;
        this.highlightedNodes = new Set();
        this.educationalMode = true; // Enable highlighting of pedagogical simplifications
    }

    /**
     * Main entry point for highlighting nodes based on robust tree diff.
     * @param {number} dotIndex - Index of the dot/step.
     */
    highlightAffectedNodes(dotIndex, isOperation = false) {
        
        this.clearHighlights();

        const dot = this.stepVisualizer.stepDots[dotIndex];
        if (!dot || !dot.equationRef) {
            console.error("Highlighting failed: No equation reference for dot", dotIndex);
            return;
        }

        const currentEquation = dot.equationRef;
        const equationIndex = this.stepVisualizer.steps.indexOf(currentEquation);
        

        const previousEquation = this._findNearestVisibleEquationAbove(equationIndex);
        
        if (!previousEquation) {
            const leafNodes = omdStepVisualizerNodeUtils.findLeafNodes(currentEquation);
            leafNodes.forEach(node => this._highlightNode(node));
            return;
        }
        
        const previousIndex = this.stepVisualizer.steps.indexOf(previousEquation);

        // Use robust tree diff algorithm to find changed nodes
        const changedNodes = omdTreeDiff.findChangedNodes(previousEquation, currentEquation, {
            educationalMode: this.educationalMode
        });
        

        // Apply highlighting to changed nodes
        changedNodes.forEach(node => this._highlightNode(node));

        // Use provenance to highlight related nodes in the previous equation
        if (!isOperation) {
            this._highlightProvenanceNodes(changedNodes, previousEquation);
        }

    }

    /**
     * Highlights a single node with the standard explanation color.
     * @param {omdNode} node - The node to highlight.
     * @private
     */
    _highlightNode(node) {
        if (node && typeof node.setExplainHighlight === 'function') {
            node.setExplainHighlight(true);
            this.highlightedNodes.add(node);
        }
    }

    /**
     * Finds the nearest visible equation above the given index.
     * @param {number} currentIndex - Index of current equation.
     * @returns {omdEquationNode|null} The nearest visible equation above, or null.
     * @private
     */
    _findNearestVisibleEquationAbove(currentIndex) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            const step = this.stepVisualizer.steps[i];
            if (step instanceof omdEquationNode && step.visible !== false) {
                return step;
            }
        }
        return null;
    }

    /**
     * Clears all highlights managed by this class.
     */
    clearHighlights() {
        this.highlightedNodes.forEach(node => {
            if (node && typeof node.setExplainHighlight === 'function') {
                node.setExplainHighlight(false);
            }
        });
        
        this.highlightedNodes.clear();
        this.stepVisualizer.stepVisualizerHighlights.clear();
    }

    /**
     * Clears ALL explain highlights from the entire sequence, not just tracked ones.
     * This is more thorough than clearHighlights() and should be used when
     * the step visualizer is disabled or when we need to ensure no stale highlights remain.
     */
    clearAllExplainHighlights() {
        // Clear tracked highlights first
        this.clearHighlights();
        
        // Also clear any explain highlights from the entire sequence tree
        const rootNode = this.stepVisualizer.getRootNode ? this.stepVisualizer.getRootNode() : null;
        if (rootNode) {
            this._clearExplainHighlightsFromTree(rootNode);
        }
    }

    /**
     * Recursively clears explain highlights from an entire tree
     * @param {omdNode} node - The root node to start clearing from
     * @private
     */
    _clearExplainHighlightsFromTree(node) {
        if (node && typeof node.setExplainHighlight === 'function') {
            node.setExplainHighlight(false);
        }
        
        // Recursively clear from children
        if (node && node.childList && Array.isArray(node.childList)) {
            node.childList.forEach(child => {
                this._clearExplainHighlightsFromTree(child);
            });
        }
        
        // Also check argumentNodeList if it exists
        if (node && node.argumentNodeList) {
            Object.values(node.argumentNodeList).forEach(child => {
                this._clearExplainHighlightsFromTree(child);
            });
        }
    }

    /**
     * Highlights nodes in the previous equation based on provenance from changed nodes.
     * This creates a visual connection between the current changes and their origins.
     * @param {Array} changedNodes - Array of changed nodes in the current equation
     * @param {omdEquationNode} previousEquation - The previous equation to highlight nodes in
     * @private
     */
    _highlightProvenanceNodes(changedNodes, previousEquation) {
        
        const rootNode = previousEquation.getRootNode();
        if (!rootNode || !rootNode.nodeMap) {
            return;
        }
        
        const currentIndex = this.stepVisualizer.steps.indexOf(previousEquation) + 1;
        let targetEquation = null;
        
        // Search backwards for the first visible equation
        for (let i = currentIndex - 1; i >= 0; i--) {
            const step = this.stepVisualizer.steps[i];
            if (step instanceof omdEquationNode && step.visible !== false) {
                targetEquation = step;
                break;
            }
        }
        
        if (!targetEquation) {
            return;
        }
        
        const visited = new Set();
        const nodesToProcess = [];
        
        // Start with the changed nodes' provenance
        changedNodes.forEach(node => {
            if (node.provenance && Array.isArray(node.provenance)) {
                node.provenance.forEach(id => {
                    if (!visited.has(id)) {
                        visited.add(id);
                        nodesToProcess.push(id);
                    }
                });
            }
        });
        
        // Process provenance IDs
        while (nodesToProcess.length > 0) {
            const id = nodesToProcess.shift();
            const provenanceNode = rootNode.nodeMap.get(id);
            
            if (provenanceNode) {
                if (this._belongsToEquation(provenanceNode, targetEquation)) {
                    this._highlightProvenanceNode(provenanceNode);
                }
                // Add this node's provenance to the processing queue
                if (provenanceNode.provenance && Array.isArray(provenanceNode.provenance)) {
                    provenanceNode.provenance.forEach(subId => {
                        if (!visited.has(subId)) {
                            visited.add(subId);
                            nodesToProcess.push(subId);
                            
                        }
                    });
                }
            } else {
                
            }
        }
        
        
    }

    /**
     * Checks if a node belongs to a specific equation by traversing up the tree
     * @param {omdNode} node - The node to check
     * @param {omdEquationNode} targetEquation - The equation to check against
     * @returns {boolean} True if the node belongs to the equation
     * @private
     */
    _belongsToEquation(node, targetEquation) {
        let current = node;
        while (current) {
            if (current === targetEquation) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    /**
     * Highlights a provenance node with secondary highlighting style
     * @param {omdNode} node - The node to highlight with provenance style
     * @private
     */
    _highlightProvenanceNode(node) {
        if (node && typeof node.setExplainHighlight === 'function') {
            // Use a slightly different color or style for provenance if desired
            node.setExplainHighlight(true, omdColor.provenanceColor); 
            this.highlightedNodes.add(node);
        }
    }
}