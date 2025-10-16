/**
 * Example usage of omdNodeOverlay for covering up nodes
 * This file demonstrates various ways to use the node overlay system
 */

import { omdNodeOverlay, omdNodeOverlayPresets } from '../utils/omdNodeOverlay.js';

/**
 * Example class showing how to integrate node overlays with the OMD system
 */
export class omdNodeOverlayExample {
    constructor(renderer) {
        this.renderer = renderer;
        this.overlays = [];
        this.setupExamples();
    }
    
    setupExamples() {
        // Example 1: Simple hiding overlay
        this.setupSimpleHiding();
        
        // Example 2: Progressive reveal
        this.setupProgressiveReveal();
        
        // Example 3: Highlighting specific nodes
        this.setupHighlighting();
        
        // Example 4: Step-by-step unveiling
        this.setupStepByStepReveal();
    }
    
    /**
     * Example 1: Simple hiding overlay
     */
    setupSimpleHiding() {
        // Create a simple white overlay to hide content
        const hidingOverlay = omdNodeOverlayPresets.createHidingOverlay();
        
        // Example usage:
        // hidingOverlay.coverNode(someNode).show();
        
        this.overlays.push({
            name: 'hiding',
            overlay: hidingOverlay,
            description: 'Simple white overlay for hiding content'
        });
    }
    
    /**
     * Example 2: Progressive reveal system
     */
    setupProgressiveReveal() {
        // Create multiple overlays for different parts of an expression
        const leftSideOverlay = new omdNodeOverlay({
            fillColor: 'white',
            strokeColor: '#ddd',
            strokeWidth: 1,
            padding: 4,
            animated: true,
            animationDuration: 500
        });
        
        const rightSideOverlay = new omdNodeOverlay({
            fillColor: 'white', 
            strokeColor: '#ddd',
            strokeWidth: 1,
            padding: 4,
            animated: true,
            animationDuration: 500
        });
        
        this.overlays.push({
            name: 'progressive-left',
            overlay: leftSideOverlay,
            description: 'Left side of equation for progressive reveal'
        });
        
        this.overlays.push({
            name: 'progressive-right',
            overlay: rightSideOverlay,
            description: 'Right side of equation for progressive reveal'
        });
    }
    
    /**
     * Example 3: Highlighting system
     */
    setupHighlighting() {
        // Create highlighting overlays with different colors
        const primaryHighlight = omdNodeOverlayPresets.createHighlightOverlay('#ffff00'); // Yellow
        const secondaryHighlight = omdNodeOverlayPresets.createHighlightOverlay('#ff9900'); // Orange
        const errorHighlight = omdNodeOverlayPresets.createHighlightOverlay('#ff3333'); // Red
        
        this.overlays.push({
            name: 'highlight-primary',
            overlay: primaryHighlight,
            description: 'Primary highlight (yellow border)'
        });
        
        this.overlays.push({
            name: 'highlight-secondary', 
            overlay: secondaryHighlight,
            description: 'Secondary highlight (orange border)'
        });
        
        this.overlays.push({
            name: 'highlight-error',
            overlay: errorHighlight,
            description: 'Error highlight (red border)'
        });
    }
    
    /**
     * Example 4: Step-by-step unveiling
     */
    setupStepByStepReveal() {
        // Create overlays for step-by-step tutorials
        const stepOverlays = [];
        
        for (let i = 0; i < 5; i++) {
            const stepOverlay = new omdNodeOverlay({
                fillColor: `hsl(${i * 60}, 70%, 95%)`, // Different light colors
                strokeColor: `hsl(${i * 60}, 70%, 60%)`,
                strokeWidth: 2,
                padding: 6,
                cornerRadius: 4,
                animated: true,
                animationDuration: 400
            });
            
            stepOverlays.push(stepOverlay);
            
            this.overlays.push({
                name: `step-${i}`,
                overlay: stepOverlay,
                description: `Step ${i + 1} overlay for tutorials`
            });
        }
    }
    
    /**
     * Demonstration methods for different use cases
     */
    
    /**
     * Demonstrates hiding a specific node
     * @param {omdNode} targetNode - The node to hide
     */
    async demonstrateHiding(targetNode) {
        const overlay = this.getOverlay('hiding');
        if (!overlay) return;
        
        // Add to the same container as the target node
        const container = this.findContainer(targetNode);
        if (container) {
            container.addChild(overlay);
        }
        
        // Cover the node and show
        await overlay.coverNode(targetNode).show(true);
        
        console.log('Node is now hidden. Call unhideNode() to reveal it.');
        return overlay;
    }
    
    /**
     * Demonstrates progressive reveal of an equation
     * @param {omdEquationNode} equationNode - The equation to reveal progressively
     */
    async demonstrateProgressiveReveal(equationNode) {
        if (!equationNode.left || !equationNode.right) {
            console.warn('Equation node must have left and right sides');
            return;
        }
        
        const leftOverlay = this.getOverlay('progressive-left');
        const rightOverlay = this.getOverlay('progressive-right');
        
        if (!leftOverlay || !rightOverlay) return;
        
        const container = this.findContainer(equationNode);
        if (container) {
            container.addChild(leftOverlay);
            container.addChild(rightOverlay);
        }
        
        // Initially hide both sides
        leftOverlay.coverNode(equationNode.left);
        rightOverlay.coverNode(equationNode.right);
        await Promise.all([leftOverlay.show(), rightOverlay.show()]);
        
        // Reveal left side first
        setTimeout(async () => {
            await leftOverlay.hide(true);
            console.log('Left side revealed');
            
            // Then reveal right side
            setTimeout(async () => {
                await rightOverlay.hide(true);
                console.log('Right side revealed - equation fully visible');
            }, 1000);
        }, 2000);
    }
    
    /**
     * Demonstrates highlighting different parts of an expression
     * @param {Array<omdNode>} nodes - Array of nodes to highlight in sequence
     */
    async demonstrateHighlighting(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return;
        
        const highlights = ['highlight-primary', 'highlight-secondary', 'highlight-error'];
        const container = this.findContainer(nodes[0]);
        
        for (let i = 0; i < nodes.length && i < highlights.length; i++) {
            const overlay = this.getOverlay(highlights[i]);
            if (!overlay) continue;
            
            if (container) {
                container.addChild(overlay);
            }
            
            await overlay.coverNode(nodes[i]).show(true);
            
            // Keep highlight for 2 seconds, then fade out
            setTimeout(async () => {
                await overlay.hide(true);
                setTimeout(() => {
                    if (container) {
                        container.removeChild(overlay);
                    }
                }, 300);
            }, 2000);
            
            // Stagger the highlights
            if (i < nodes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    
    /**
     * Creates an interactive masking system where users can click to reveal parts
     * @param {Array<omdNode>} nodes - Nodes to mask initially
     * @param {Function} onReveal - Callback when a node is revealed
     */
    setupInteractiveMasking(nodes, onReveal = () => {}) {
        const masks = [];
        
        nodes.forEach((node, index) => {
            const mask = new omdNodeOverlay({
                fillColor: '#f0f0f0',
                strokeColor: '#999',
                strokeWidth: 1,
                padding: 3,
                cornerRadius: 3,
                animated: true
            });
            
            const container = this.findContainer(node);
            if (container) {
                container.addChild(mask);
            }
            
            mask.coverNode(node).show();
            
            // Add click handler to reveal (this is a simplified example)
            // In a real implementation, you'd need proper event handling
            mask.svgObject.style.cursor = 'pointer';
            mask.svgObject.addEventListener('click', async () => {
                await mask.hide(true);
                onReveal(node, index);
                
                setTimeout(() => {
                    if (container) {
                        container.removeChild(mask);
                    }
                }, 300);
            });
            
            masks.push(mask);
        });
        
        return masks;
    }
    
    /**
     * Utility methods
     */
    
    getOverlay(name) {
        const overlayData = this.overlays.find(o => o.name === name);
        return overlayData ? overlayData.overlay : null;
    }
    
    findContainer(node) {
        // Try to find the appropriate container for the overlay
        // This would typically be the same container as the target node
        if (this.renderer && this.renderer.svg) {
            return this.renderer.svg;
        }
        
        // Fallback: try to find the node's root container
        let current = node;
        while (current.parent) {
            current = current.parent;
        }
        
        return current.parent || this.renderer?.svg;
    }
    
    /**
     * Clean up all overlays
     */
    destroy() {
        this.overlays.forEach(overlayData => {
            overlayData.overlay.destroy();
        });
        this.overlays = [];
    }
}

/**
 * Utility functions for common overlay operations
 */
export class omdOverlayUtils {
    /**
     * Creates a "scratch work" overlay that can hide working steps
     * @param {Array<omdNode>} workingNodes - Nodes representing scratch work
     * @param {Object} options - Styling options
     */
    static createScratchWorkHider(workingNodes, options = {}) {
        const defaultOptions = {
            fillColor: 'white',
            strokeColor: '#ddd',
            strokeWidth: 1,
            padding: 4,
            animated: true,
            ...options
        };
        
        return workingNodes.map(node => {
            const overlay = new omdNodeOverlay(defaultOptions);
            overlay.coverNode(node);
            return overlay;
        });
    }
    
    /**
     * Creates a "focus" system that dims everything except the focused nodes
     * @param {Array<omdNode>} allNodes - All nodes in the expression
     * @param {Array<omdNode>} focusNodes - Nodes to keep visible
     * @param {Object} options - Styling options
     */
    static createFocusSystem(allNodes, focusNodes, options = {}) {
        const defaultOptions = {
            fillColor: 'white',
            opacity: 0.8,
            strokeColor: 'none',
            padding: 2,
            animated: true,
            ...options
        };
        
        const nodesToDim = allNodes.filter(node => !focusNodes.includes(node));
        
        return nodesToDim.map(node => {
            const overlay = new omdNodeOverlay(defaultOptions);
            overlay.coverNode(node);
            return overlay;
        });
    }
    
    /**
     * Creates a sequence of overlays for step-by-step reveals
     * @param {Array<omdNode>} nodes - Nodes to reveal in sequence
     * @param {number} delay - Delay between reveals in ms
     * @param {Object} options - Styling options
     */
    static async createSequentialReveal(nodes, delay = 1000, options = {}) {
        const defaultOptions = {
            fillColor: 'white',
            strokeColor: '#ccc',
            strokeWidth: 1,
            padding: 3,
            animated: true,
            ...options
        };
        
        const overlays = nodes.map(node => {
            const overlay = new omdNodeOverlay(defaultOptions);
            overlay.coverNode(node);
            return overlay;
        });
        
        // Show all overlays initially
        await Promise.all(overlays.map(overlay => overlay.show()));
        
        // Reveal them in sequence
        for (let i = 0; i < overlays.length; i++) {
            setTimeout(async () => {
                await overlays[i].hide(true);
            }, delay * i);
        }
        
        return overlays;
    }
}
