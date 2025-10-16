/**
 * omdNodeOverlay - A utility class for covering up nodes with overlay elements
 * 
 * This class creates a visual overlay that can be positioned over any node
 * to hide or mask it. Useful for step-by-step reveals, progressive disclosure,
 * or highlighting specific parts of expressions.
 */

import { omdPopup } from './omdPopup.js';
import { jsvgGroup, jsvgRect } from '@teachinglab/jsvg';

/**
 * A flexible overlay system for covering nodes with customizable elements
 * @extends jsvgGroup
 */
export class omdNodeOverlay extends jsvgGroup {
    /**
     * Creates a new node overlay
     * @param {Object} options - Configuration options
     * @param {string} options.fillColor - Fill color for the overlay (default: 'white')
     * @param {string} options.strokeColor - Stroke color for the overlay (default: 'black')
     * @param {number} options.strokeWidth - Stroke width (default: 2)
     * @param {number} options.opacity - Opacity of the overlay (default: 1.0)
     * @param {number} options.padding - Padding around the target node (default: 0)
     * @param {number} options.cornerRadius - Corner radius for rounded rectangles (default: 4)
     * @param {string} options.overlayType - Type of overlay: 'rectangle', 'ellipse', 'text' (default: 'rectangle')
     * @param {boolean} options.animated - Whether to animate show/hide transitions (default: false)
     * @param {string} options.text - Initial text for text overlays (default: '')
     * @param {boolean} options.editable - Whether text overlay should be editable (default: false)
     */
    constructor(options = {}) {
        super();
        
        this.options = {
            fillColor: 'white',
            strokeColor: 'black',
            strokeWidth: 2,
            opacity: 1.0,
            padding: 0,
            cornerRadius: 4,
            overlayType: 'rectangle',
            animated: false,
            animationDuration: 300,
            text: '',
            editable: false,
            ...options
        };
        
        this.targetNode = null;
        this.overlayElement = null;
        this.textElement = null;
        this.isVisible = false;
        this.animationId = null;
        this.clickLayer = null;
        this.savedHandlers = [];
        this.omdPopup = null;
        
        this._createOverlayElement();
    }
    
    /**
     * Creates the actual overlay element based on the overlay type
     * @private
     */
    _createOverlayElement() {
        switch (this.options.overlayType) {
            case 'rectangle':
                this.overlayElement = new jsvgRect();
                if (this.options.cornerRadius > 0) {
                    this.overlayElement.setCornerRadius(this.options.cornerRadius);
                }
                break;
            case 'ellipse':
                this.overlayElement = new jsvgEllipse();
                break;
            case 'text':
                this._createTextOverlay();
                return;
            default:
                this.overlayElement = new jsvgRect();
        }
        
        this.overlayElement.setFillColor(this.options.fillColor);
        this.overlayElement.setStrokeColor(this.options.strokeColor);
        this.overlayElement.setStrokeWidth(this.options.strokeWidth);
        this.overlayElement.setOpacity(this.options.opacity);
        this.addChild(this.overlayElement);
        this.setOpacity(0);
    }
    
    /**
     * Creates a text overlay with background and editable text
     * @private
     */
    _createTextOverlay() {
        // Create background rectangle
        this.overlayElement = new jsvgRect();
        if (this.options.cornerRadius > 0) {
            this.overlayElement.setCornerRadius(this.options.cornerRadius);
        }
        this.overlayElement.setFillColor(this.options.fillColor);
        this.overlayElement.setStrokeColor(this.options.strokeColor);
        this.overlayElement.setStrokeWidth(this.options.strokeWidth);
        this.overlayElement.setOpacity(this.options.opacity);
        this.addChild(this.overlayElement);
        
        // Create a click-only layer for editable overlays
        if (this.options.editable) {
            this.clickLayer = new jsvgRect();
            this.clickLayer.setWidthAndHeight(this.overlayElement.width, this.overlayElement.height);
            this.clickLayer.setPosition(0, 0);
            this.clickLayer.setFillColor('transparent');
            this.clickLayer.setStrokeColor('transparent');
            this.addChild(this.clickLayer);
            
            this.clickLayer.setClickCallback(() => {
                this.togglePopup();
            });
        }
        
        // For editable overlays, create a popup instead of inline text
        if (this.options.editable) {
            this.textElement = null;
        } else {
            // For static text overlays, use jsvgTextLine
            this.textElement = new jsvgTextLine();
            this.textElement.setText(this.options.text);
            this.textElement.setTextAnchor('middle');
            this.textElement.svgObject.setAttribute('dominant-baseline', 'middle');
            this.addChild(this.textElement);
        }
        
        this.setOpacity(0);
    }
    
    /**
     * Targets a specific node to overlay
     * @param {omdNode} node - The node to cover
     * @returns {omdNodeOverlay} This overlay for method chaining
     */
    coverNode(node) {
        if (!node) {
            console.warn('omdNodeOverlay: Cannot cover null or undefined node');
            return this;
        }
        
        this.targetNode = node;
        
        // Save and override parent mouse handlers to prevent highlighting
        this.savedHandlers = [];
        let current = this.targetNode;
        while (current) {
            if (current.svgObject && typeof current.svgObject.onmouseenter === 'function') {
                this.savedHandlers.push({
                    element: current.svgObject,
                    onmouseenter: current.svgObject.onmouseenter,
                    onmouseleave: current.svgObject.onmouseleave,
                });
                current.svgObject.onmouseenter = null;
                current.svgObject.onmouseleave = null;
            }
            current = current.parent;
        }

        // Add the overlay as a child of the target node's parent
        if (this.targetNode.parent) {
            node.parent.addChild(this);
        }
        
        this._updateOverlayPosition();
        return this;
    }
    
    /**
     * Manually sets the overlay position and size
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width of the overlay
     * @param {number} height - Height of the overlay
     * @param {boolean} clearTargetNode - Whether to clear the target node
     * @returns {omdNodeOverlay} This overlay for method chaining
     */
    setCoverArea(x, y, width, height, clearTargetNode = true) {
        if (clearTargetNode) {
            this.targetNode = null;
        }
        
        const padding = this.options.padding || 0;
        const adjustedX = x - padding;
        const adjustedY = y - padding;
        const adjustedWidth = width + (padding * 2);
        const adjustedHeight = height + (padding * 2);
        
        this.setPosition(adjustedX, adjustedY);
        this.overlayElement.setWidthAndHeight(adjustedWidth, adjustedHeight);
        
        // Update click layer size to match overlay
        if (this.clickLayer) {
            this.clickLayer.setWidthAndHeight(adjustedWidth, adjustedHeight);
        }
        
        // Position text element for text overlays
        if (this.options.overlayType === 'text' && this.textElement) {
                this.textElement.setPosition(adjustedWidth / 2, adjustedHeight / 2);
        }
        
        return this;
    }
    
    /**
     * Updates the overlay position to match the target node
     * @private
     */
    _updateOverlayPosition() {
        if (!this.targetNode) return;
        
        // Get the position relative to the overlay's parent
        let nodePos;
        if (this.parent === this.targetNode.parent) {
            nodePos = {
                x: this.targetNode.xpos || this.targetNode.x || 0,
                y: this.targetNode.ypos || this.targetNode.y || 0
            };
        } else {
            nodePos = this._getGlobalPosition(this.targetNode);
        }
        
        let nodeWidth = this.targetNode.width || 0;
        let nodeHeight = this.targetNode.height || 0;
        
        // Prefer backRect dimensions if available
        if (this.targetNode.backRect) {
            nodeWidth = this.targetNode.backRect.width || nodeWidth;
            nodeHeight = this.targetNode.backRect.height || nodeHeight;
        }
        
        this.setCoverArea(nodePos.x, nodePos.y, nodeWidth, nodeHeight, false);
        

    }
    
    /**
     * Attempts to match visual properties of the target node
     * @private
     */
    _matchNodeProperties() {
        if (!this.targetNode) return;
        
        // Try to match corner radius for rectangles
        if (this.options.overlayType === 'rectangle' && this.overlayElement.setCornerRadius) {
            let cornerRadius = 0;
            
            // First, check if the node has a backRect (common in OMD nodes)
            if (this.targetNode.backRect && this.targetNode.backRect.cornerRadius !== undefined) {
                cornerRadius = this.targetNode.backRect.cornerRadius;
            }
            // Fallback: check the main SVG object for rx/ry attributes
            else if (this.targetNode.svgObject) {
                const rx = this.targetNode.svgObject.getAttribute('rx');
                const ry = this.targetNode.svgObject.getAttribute('ry');
                cornerRadius = parseFloat(rx || ry || 0);
            }
            // Another fallback: check if the SVG object is a rect with corner radius
            else if (this.targetNode.svgObject && this.targetNode.svgObject.tagName === 'rect') {
                const rx = this.targetNode.svgObject.getAttribute('rx');
                const ry = this.targetNode.svgObject.getAttribute('ry');
                cornerRadius = parseFloat(rx || ry || 0);
            }
            
            // Apply the corner radius if found
            if (cornerRadius > 0) {
                this.overlayElement.setCornerRadius(cornerRadius);
                this.options.cornerRadius = cornerRadius;
            }
        }
        
        // Match font properties for text overlays
        if (this.options.overlayType === 'text' && this.textElement) {
            this._matchFontProperties();
        }
        
        // Try to match stroke width if target has stroke
        if (this.targetNode.svgObject && !this.options.preserveStrokeWidth) {
            const targetStrokeWidth = this.targetNode.svgObject.getAttribute('stroke-width');
            if (targetStrokeWidth) {
                const strokeWidth = parseFloat(targetStrokeWidth);
                if (strokeWidth > 0) {
                    this.overlayElement.setStrokeWidth(strokeWidth);
                }
            }
        }
    }
    
    /**
     * Matches font properties from the target node
     * @private
     */
    _matchFontProperties() {
        if (!this.targetNode || !this.textElement) return;
        
        // Get font size from target node
        let fontSize = 32; // Default fallback
        if (this.targetNode.getFontSize && typeof this.targetNode.getFontSize === 'function') {
            fontSize = this.targetNode.getFontSize();
        } else if (this.targetNode.fontSize) {
            fontSize = this.targetNode.fontSize;
        }
        this.textElement.setFontSize(fontSize);
        
        // Try to match font family and color from target node's text element
        if (this.targetNode.textElement) {
            const targetTextSvg = this.targetNode.textElement.svgObject;
            if (targetTextSvg) {
                // Match font family
                const fontFamily = targetTextSvg.style.fontFamily || 'Arial, Helvetica, sans-serif';
                this.textElement.setFontFamily(fontFamily);
                
                // Match font color - handle both jsvgTextLine and jsvgTextInput
                const fontColor = targetTextSvg.style.fill || targetTextSvg.getAttribute('fill') || 'black';
                if (this.textElement.setFontColor) {
                    this.textElement.setFontColor(fontColor);
                } else if (this.textElement.div) {
                    // For jsvgTextInput, set color on the div
                    this.textElement.div.style.color = fontColor;
                }
                
                // Match font weight if available
                const fontWeight = targetTextSvg.style.fontWeight;
                if (fontWeight && this.textElement.setFontWeight) {
                    this.textElement.setFontWeight(fontWeight);
                } else if (fontWeight && this.textElement.div) {
                    // For jsvgTextInput, set font weight on the div
                    this.textElement.div.style.fontWeight = fontWeight;
                }
            }
        }
    }
    
    /**
     * Calculates the global position of a node
     * @param {omdNode} node - The node to get position for
     * @returns {Object} Object with x and y coordinates
     * @private
     */
    _getGlobalPosition(node) {
        // Try to use SVG bounding box for accurate positioning
        if (node.svgObject && node.svgObject.getCTM) {
            try {
                const ctm = node.svgObject.getCTM();
                if (ctm) {
                    return { x: ctm.e, y: ctm.f };
                }
            } catch (e) {
                // Fall back to manual calculation
            }
        }
        
        let x = node.xpos || node.x || 0;
        let y = node.ypos || node.y || 0;
        
        // Walk up the parent chain
        let parent = node.parent;
        while (parent && parent.xpos !== undefined) {
            x += parent.xpos || parent.x || 0;
            y += parent.ypos || parent.y || 0;
            parent = parent.parent;
        }
        
        return { x, y };
    }
    
    /**
     * Creates the popup instance
     * @private
     */
    _createPopup() {
        if (!this.options.editable || this.omdPopup) return;
        
        // Create the popup instance
        this.omdPopup = new omdPopup(this.targetNode, this.parent, {
            animationDuration: this.options.animationDuration
        });
        
        // Set initial text value
        this.omdPopup.setValue(this.options.text);
        
        // Set up validation callback
        this.omdPopup.setValidationCallback(() => {
            const currentText = this.omdPopup.getValue();
            
            if (this.targetNode) {
                const nodeText = this.targetNode.text || this.targetNode.toString() || "";
                
                if (this.omdPopup.areExpressionsEquivalent(currentText.trim(), nodeText.trim())) {
                    // Show success and destroy overlay
                    this.omdPopup.flashValidation(true);
                    setTimeout(() => {
                        this.destroy();
                    }, 500);
                } else {
                    // Show error
                    this.omdPopup.flashValidation(false);
                }
            }
        });
        
        // Set up clear callback
        this.omdPopup.setClearCallback(() => {
            this.omdPopup.setValue('');
        });
    }
    
    /**
     * Toggles the popup visibility
     * @returns {Promise} Promise that resolves when animation completes
     */
    togglePopup() {
        if (!this.options.editable) return Promise.resolve();
        
        if (!this.omdPopup) {
            this._createPopup();
        }
        
        const overlayX = this.xpos || this.x || 0;
        const overlayY = this.ypos || this.y || 0;
        const overlayWidth = this.overlayElement.width || this.targetNode.width || 100;
        const overlayHeight = this.overlayElement.height || this.targetNode.height || 40;
        const popupWidth = 400;
        
        const popupX = overlayX + (overlayWidth / 2) - (popupWidth / 2);
        const popupY = overlayY + overlayHeight + 10;
        
        return this.omdPopup.toggle(popupX, popupY);
    }
    

    

    




    /**
     * Hides and removes the popup
     * @private
     */
    _hidePopup() {
        if (this.omdPopup) {
            this.omdPopup.destroy();
            this.omdPopup = null;
        }
    }

    /**
     * Shows the overlay
     * @param {boolean} animated - Whether to animate the show
     * @returns {Promise} Promise that resolves when animation completes
     */
    show(animated = this.options.animated) {
        return new Promise((resolve) => {
            if (this.isVisible) {
                resolve();
                return;
            }
            
            this.isVisible = true;
            
            if (animated) {
                this._animateOpacity(0, this.options.opacity, this.options.animationDuration)
                    .then(resolve);
            } else {
                this.setOpacity(this.options.opacity);
                resolve();
            }
        });
    }
    
    /**
     * Animates the opacity from one value to another
     * @private
     */
    _animateOpacity(fromOpacity, toOpacity, duration) {
        return new Promise((resolve) => {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            
            const startTime = performance.now();
            const deltaOpacity = toOpacity - fromOpacity;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const currentOpacity = fromOpacity + (deltaOpacity * easedProgress);
                
                this.setOpacity(currentOpacity);
                
                if (progress < 1) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.animationId = null;
                    resolve();
                }
            };
            
            this.animationId = requestAnimationFrame(animate);
        });
    }
    
        /**
     * Removes the overlay and cleans up resources
     * @param {boolean} animated - Whether to animate the destruction
     * @returns {Promise} Promise that resolves when destruction is complete
     */
    destroy(animated = this.options.animated) {
        return new Promise((resolve) => {
            if (animated && this.isVisible) {
                this._animateOpacity(this.options.opacity, 0, this.options.animationDuration)
                    .then(() => {
                        this._performDestroy();
                        resolve();
                    });
            } else {
                this._performDestroy();
                resolve();
            }
        });
    }
    
    /**
     * Performs the actual destruction without animation
     * @private
     */
    _performDestroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Restore original mouse handlers
        this.savedHandlers.forEach(({ element, onmouseenter, onmouseleave }) => {
            if (element) {
                element.onmouseenter = onmouseenter;
                element.onmouseleave = onmouseleave;
            }
        });
        
        this._hidePopup();
        
        this.targetNode = null;
        this.isVisible = false;
        
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    // === ESSENTIAL GETTERS/SETTERS ===
    
    /**
     * Checks if the overlay is currently visible
     */
    getIsVisible() {
        return this.isVisible;
    }
    
    /**
     * Gets the currently targeted node
     */
    getTargetNode() {
        return this.targetNode;
    }
    
    /**
     * Sets the text content for text overlays
     */
    setText(text) {
        if (this.textElement) {
            this.textElement.setText(text);
            this.options.text = text;
        }
        return this;
    }
    
    /**
     * Gets the text content from text overlays
     */
    getText() {
        if (this.textElement) {
            return this.textElement.getText();
        }
        return this.options.text;
    }
}

/**
 * Factory function for creating common overlay presets
 */
export class omdNodeOverlayPresets {
    /**
     * Creates a simple white overlay for hiding content
     */
    static createHidingOverlay(enableTextInput = false, initialText = null) {
        const config = {
            fillColor: 'white',
            strokeColor: 'black',
            strokeWidth: 2,
            padding: 1,
            animated: true
        };
        
        if (enableTextInput) {
            config.overlayType = 'text';
            config.text = initialText || '';
            config.editable = true;
            config.fillColor = 'white';
            config.strokeColor = 'black';
            config.strokeWidth = 2;
        }
        
        return new omdNodeOverlay(config);
    }
    
    /**
     * Creates a highlighted border overlay for feedback
     */
    static createHighlightOverlay(color = '#ffff00') {
        return new omdNodeOverlay({
            fillColor: 'none',
            strokeColor: color,
            strokeWidth: 3,
            padding: 2,
            cornerRadius: 4,
            animated: true
        });
    }
}
