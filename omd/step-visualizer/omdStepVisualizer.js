import { omdEquationSequenceNode } from "../nodes/omdEquationSequenceNode.js";
import { omdEquationNode } from "../nodes/omdEquationNode.js";
import { omdOperationDisplayNode } from "../nodes/omdOperationDisplayNode.js";
import { omdColor } from "../../src/omdColor.js";
import { omdStepVisualizerHighlighting } from "./omdStepVisualizerHighlighting.js";
import { omdStepVisualizerTextBoxes } from "./omdStepVisualizerTextBoxes.js";
import { omdStepVisualizerLayout } from "./omdStepVisualizerLayout.js";
import { getDotRadius } from "../config/omdConfigManager.js";
import { jsvgLayoutGroup, jsvgEllipse, jsvgLine } from '@teachinglab/jsvg';


/**
 * A visual step tracker that extends omdEquationSequenceNode to show step progression
 * with dots and connecting lines to the right of the sequence.
 * @extends omdEquationSequenceNode
 */
export class omdStepVisualizer extends omdEquationSequenceNode {
    constructor(steps, styling = {}) {
        super(steps);
        
        // Store styling options with defaults
        this.styling = this._mergeWithDefaults(styling || {});
        
        // Visual elements for step tracking
        this.stepDots = [];
        this.stepLines = [];
        this.visualContainer = new jsvgLayoutGroup();
        
        // Use styling values for these properties
        this.dotRadius = this.styling.dotRadius;
        this.lineWidth = this.styling.lineWidth;
        this.visualSpacing = this.styling.visualSpacing;
        
        this.activeDotIndex = -1;
        this.dotsClickable = true;
        this.nodeToStepMap = new Map();
        
        // Highlighting system
        this.stepVisualizerHighlights = new Set();
        this.highlighting = new omdStepVisualizerHighlighting(this);
        
        // Pass textbox options through styling parameter
        const textBoxOptions = this.styling.textBoxOptions || {};
        this.textBoxManager = new omdStepVisualizerTextBoxes(this, this.highlighting, textBoxOptions);
        this.layoutManager = new omdStepVisualizerLayout(this);
        
        this.addChild(this.visualContainer);
        this._initializeVisualElements();
        
        // Set default filter level to show only major steps (stepMark = 0)
        // This ensures intermediate steps are hidden and expansion dots can be created
        
        
        
        if (this.setFilterLevel && typeof this.setFilterLevel === 'function') {
            this.setFilterLevel(0);
            
        } else {
            
        }
        
        this.computeDimensions();
        this.updateLayout();
    }

    /**
     * Public: programmatically toggle a dot (simulate user click behavior)
     * @param {number} dotIndex
     */
    toggleDot(dotIndex) {
        if (typeof dotIndex !== 'number') return;
        if (dotIndex < 0 || dotIndex >= this.stepDots.length) return;
        const dot = this.stepDots[dotIndex];
        this._handleDotClick(dot, dotIndex);
    }

    /**
     * Public: close currently active dot textbox if any
     */
    closeActiveDot() {
        // Always clear all boxes to be safe (even if activeDotIndex already reset)
        try {
            const before = this.textBoxManager?.stepTextBoxes?.length || 0;
            this._clearActiveDot();
            if (this.textBoxManager && typeof this.textBoxManager.clearAllTextBoxes === 'function') {
                this.textBoxManager.clearAllTextBoxes();
            }
            const after = this.textBoxManager?.stepTextBoxes?.length || 0;
        } catch (e) { /* no-op */ }
    }

    /**
     * Public: close all text boxes (future-proof; currently only one can be active)
     */
    closeAllTextBoxes() {
        this.closeActiveDot();
    }

    /**
     * Public: force close EVERYTHING related to active explanation UI
     */
    forceCloseAll() {
        this.closeActiveDot();
    }
    
    /**
     * Merges user styling with default styling options
     * @param {Object} userStyling - User-provided styling options
     * @returns {Object} Merged styling object with defaults
     * @private
     */
    _mergeWithDefaults(userStyling) {
        const defaults = {
            // Dot styling
            dotColor: omdColor.stepColor,
            dotRadius: getDotRadius(0),
            dotStrokeWidth: 2,
            activeDotColor: omdColor.explainColor,
            expansionDotScale: 0.4,
            
            // Line styling
            lineColor: omdColor.stepColor,
            lineWidth: 2,
            activeLineColor: omdColor.explainColor,
            
            // Colors
            explainColor: omdColor.explainColor,
            highlightColor: omdColor.hiliteColor,
            
            // Layout
            visualSpacing: 30,
            fixedVisualizerPosition: 250,
            dotVerticalOffset: 15,
            
            // Text boxes
            textBoxOptions: {
                backgroundColor: omdColor.white,
                borderColor: 'none',
                borderWidth: 1,
                borderRadius: 5,
                padding: 8, // Minimal padding for tight fit
                fontSize: 14,
                fontFamily: 'Albert Sans, Arial, sans-serif',
                maxWidth: 300, // More reasonable width for compact layout
                dropShadow: true
                // Removed zIndex and position from defaults - these should only apply to container
            },
            
            // Visual effects
            enableAnimations: true,
            hoverEffects: true,
            
            // Background styling (inherited from equation styling)
            backgroundColor: null,
            cornerRadius: null,
            pill: null
        };
        
        return this._deepMerge(defaults, userStyling);
    }
    
    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     * @private
     */
    _deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this._deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    /**
     * Updates the styling options and applies them to existing visual elements
     * @param {Object} newStyling - New styling options to apply
     */
    setStyling(newStyling) {
        this.styling = this._mergeWithDefaults({ ...this.styling, ...newStyling });
        
        // Update instance properties that are used elsewhere
        this.dotRadius = this.styling.dotRadius;
        this.lineWidth = this.styling.lineWidth;
        this.visualSpacing = this.styling.visualSpacing;
        
        this._applyStylingToExistingElements();
        
        // Update layout spacing if changed
        if (newStyling.visualSpacing !== undefined) {
            this.visualSpacing = this.styling.visualSpacing;
        }
        if (newStyling.fixedVisualizerPosition !== undefined && this.layoutManager) {
            this.layoutManager.setFixedVisualizerPosition(this.styling.fixedVisualizerPosition);
        }
        
        // Refresh layout and visual elements
        this.updateLayout();
    }
    
    /**
     * Gets the current styling options
     * @returns {Object} Current styling configuration
     */
    getStyling() {
        return { ...this.styling };
    }
    
    /**
     * Sets a specific styling property
     * @param {string} property - The property to set (supports dot notation like 'textBoxOptions.backgroundColor')
     * @param {any} value - The value to set
     */
    setStyleProperty(property, value) {
        const keys = property.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.styling);
        
        target[lastKey] = value;
        
        // Update instance properties if they were changed
        if (property === 'dotRadius') this.dotRadius = value;
        if (property === 'lineWidth') this.lineWidth = value;
        if (property === 'visualSpacing') this.visualSpacing = value;
        if (property === 'fixedVisualizerPosition' && this.layoutManager) {
            this.layoutManager.setFixedVisualizerPosition(value);
        }
        
        this._applyStylingToExistingElements();
        this.updateLayout();
    }
    
    /**
     * Gets a specific styling property
     * @param {string} property - The property to get (supports dot notation)
     * @returns {any} The property value
     */
    getStyleProperty(property) {
        return property.split('.').reduce((obj, key) => obj?.[key], this.styling);
    }
    
    /**
     * Applies current styling to all existing visual elements
     * @private
     */
    _applyStylingToExistingElements() {
        // Update dots
        this.stepDots.forEach((dot, index) => {
            if (dot && dot.equationRef) {
                const isActive = this.activeDotIndex === index;
                const color = isActive ? this.styling.activeDotColor : this.styling.dotColor;
                dot.setFillColor(color);
                dot.setStrokeColor(color);
                dot.setStrokeWidth(this.styling.dotStrokeWidth);
                
                // Update radius based on step mark
                const stepMark = dot.equationRef.stepMark ?? 0;
                const radius = this.styling.dotRadius || getDotRadius(stepMark);
                dot.setWidthAndHeight(radius * 2, radius * 2);
                dot.radius = radius;
            }
        });
        
        // Update lines
        this.stepLines.forEach((line, index) => {
            if (line) {
                const isActive = this.activeDotIndex >= 0 && 
                    (line.toDotIndex === this.activeDotIndex || line.fromDotIndex === this.activeDotIndex);
                const color = isActive ? this.styling.activeLineColor : this.styling.lineColor;
                line.setStrokeColor(color);
                line.setStrokeWidth(this.styling.lineWidth);
            }
        });
        
        // Update expansion dots
        if (this.layoutManager && this.layoutManager.expansionDots) {
            this.layoutManager.expansionDots.forEach(expansionDot => {
                if (expansionDot) {
                    const baseRadius = this.styling.dotRadius || getDotRadius(0);
                    const radius = Math.max(3, baseRadius * this.styling.expansionDotScale);
                    expansionDot.setWidthAndHeight(radius * 2, radius * 2);
                    expansionDot.radius = radius;
                    expansionDot.setFillColor(this.styling.dotColor);
                    expansionDot.setStrokeColor(this.styling.dotColor);
                }
            });
        }
        
        // Update text box styling if manager exists
        if (this.textBoxManager && typeof this.textBoxManager.updateStyling === 'function') {
            this.textBoxManager.updateStyling(this.styling.textBoxOptions);
        }
    }
    
    /**
     * Sets the visual background style (inherits from equation styling)
     * @param {Object} style - Background style options
     */
    setBackgroundStyle(style = {}) {
        this.styling.backgroundColor = style.backgroundColor || this.styling.backgroundColor;
        this.styling.cornerRadius = style.cornerRadius || this.styling.cornerRadius;
        this.styling.pill = style.pill !== undefined ? style.pill : this.styling.pill;
        
        // Apply to equation background if this step visualizer has equation styling
        if (typeof this.setDefaultEquationBackground === 'function') {
            this.setDefaultEquationBackground(style);
        }
    }
    
    /**
     * Gets the current background style
     * @returns {Object} Current background style
     */
    getBackgroundStyle() {
        return {
            backgroundColor: this.styling.backgroundColor,
            cornerRadius: this.styling.cornerRadius,
            pill: this.styling.pill
        };
    }
    
    /**
     * Sets the fixed position for the step visualizer
     * @param {number} position - The x position from the left edge where the visualizer should be positioned
     */
    setFixedVisualizerPosition(position) {
        if (this.layoutManager) {
            this.layoutManager.setFixedVisualizerPosition(position);
        }
    }

    /**
     * Force rebuild visual container (dots/lines) from scratch
     */
    rebuildVisualizer() {
        // Clear all step visualizer highlights before rebuilding
        if (this.highlighting && typeof this.highlighting.clearAllExplainHighlights === 'function') {
            this.highlighting.clearAllExplainHighlights();
        }
        
        if (this.visualContainer) {
            this.removeChild(this.visualContainer);
        }
        this.visualContainer = new jsvgLayoutGroup();
        this.addChild(this.visualContainer);
        this._initializeVisualElements();
        this.computeDimensions();
        this.updateLayout();
    }
    
    /**
     * Initializes visual elements (dots and lines) for all existing steps
     * @private
     */
    _initializeVisualElements() {
        this._clearVisualElements();
        this.nodeToStepMap.clear();
        
        const equations = this.steps.filter(step => step instanceof omdEquationNode);
        
        equations.forEach((equation, index) => {
            this._createStepDot(equation, index);
            equation.findAllNodes().forEach(node => {
                this.nodeToStepMap.set(node.id, index);
            });
            
            if (index > 0) {
                this._createStepLine(index - 1, index);
            }
        });
        
        this.layoutManager.updateVisualZOrder();
        this.layoutManager.updateVisualLayout(true); 
    }
    
    /**
     * Creates a visual dot for a step
     * @private
     */
    _createStepDot(equation, index) {
        const stepMark = equation.stepMark ?? 0;
        const radius = this.styling.dotRadius || getDotRadius(stepMark);
        const dot = new jsvgEllipse();
        dot.setWidthAndHeight(radius * 2, radius * 2);
        const dotColor = this.styling.dotColor;
        dot.setFillColor(dotColor);
        dot.setStrokeColor(dotColor);
        dot.setStrokeWidth(this.styling.dotStrokeWidth);
        dot.radius = radius;
        
        dot.equationRef = equation;
        dot.stepIndex = index;
        
        if (equation.visible === false) {
            dot.hide();
        }
        
        this.layoutManager.updateDotClickability(dot);
        
        this.stepDots.push(dot);
        this.visualContainer.addChild(dot);
        
        return dot;
    }
    
    /**
     * Creates a connecting line between two step dots
     * @private
     */
    _createStepLine(fromIndex, toIndex) {
        const line = new jsvgLine();
        const lineColor = this.styling.lineColor;
        line.setStrokeColor(lineColor);
        line.setStrokeWidth(this.styling.lineWidth);
        
        line.fromDotIndex = fromIndex;
        line.toDotIndex = toIndex;
        
        const fromEquation = this.stepDots[fromIndex]?.equationRef;
        const toEquation = this.stepDots[toIndex]?.equationRef;
        
        if (fromEquation?.visible === false || toEquation?.visible === false) {
            line.hide();
        }
        
        this.stepLines.push(line);
        this.visualContainer.addChild(line);
        
        return line;
    }
    
    /**
     * Clears all visual elements
     * @private
     */
    _clearVisualElements() {
        this.stepDots.forEach(dot => this.visualContainer.removeChild(dot));
        this.stepLines.forEach(line => this.visualContainer.removeChild(line));
        this.textBoxManager.clearAllTextBoxes();
        
        this.stepDots = [];
        this.stepLines = [];
        this.activeDotIndex = -1;
    }
    
    /**
     * Override addStep to update visual elements when new steps are added
     */
    addStep(step, options = {}) {
        // Clear all step visualizer highlights when adding new steps (stack expansion)
        if (this.highlighting && typeof this.highlighting.clearAllExplainHighlights === 'function') {
            this.highlighting.clearAllExplainHighlights();
        }
        
        // Call parent first to add the step properly
        super.addStep(step, options);
        
        // Now create visual elements for equation nodes only
        if (step instanceof omdEquationNode) {
            // Find the actual index of this equation in the steps array
            const equationIndex = this.steps.filter(s => s instanceof omdEquationNode).indexOf(step);
            
            if (equationIndex >= 0) {
                const createdDot = this._createStepDot(step, equationIndex);
                
                // Update the node to step mapping
                step.findAllNodes().forEach(node => {
                    this.nodeToStepMap.set(node.id, equationIndex);
                });
                
                // Create connecting line if this isn't the first equation
                if (equationIndex > 0) {
                    this._createStepLine(equationIndex - 1, equationIndex);
                }
                
                // After stepMark is set, adjust dot radius
                if (createdDot) {
                    const radius = getDotRadius(step.stepMark ?? 0);
                    createdDot.setWidthAndHeight(radius * 2, radius * 2);
                    createdDot.radius = radius;
                }
            }
        }
        
        // Update layout after adding the step
        this.computeDimensions();
        this.updateLayout();
    }
    
    /**
     * Gets the step number for a given node ID.
     */
    getNodeStepNumber(nodeId) {
        return this.nodeToStepMap.get(nodeId);
    }
    
    /**
     * Override computeDimensions to account for visual elements
     */
    computeDimensions() {
        super.computeDimensions();
        // Store original dimensions before visualizer expansion
        this.sequenceWidth = this.width;
        this.sequenceHeight = this.height;
        
        // Set width to include the fixed visualizer position plus visualizer width
        if (this.stepDots && this.stepDots.length > 0 && this.layoutManager) {
            const containerWidth = this.dotRadius * 3;
            const fixedVisualizerPosition = this.layoutManager.fixedVisualizerPosition || 250;
            const totalWidth = fixedVisualizerPosition + this.visualSpacing + containerWidth;
            this.setWidthAndHeight(totalWidth, this.height);
        }
    }
    
    /**
     * Override updateLayout to update visual elements as well
     */
    updateLayout() {
        
        
        super.updateLayout();
        
        // Only update visual layout if layoutManager is initialized
        if (this.layoutManager) {
            
            
            this.layoutManager.updateVisualLayout(true); // Allow repositioning for main layout updates
            
            
            this.layoutManager.updateVisualVisibility();
            
            
            this.layoutManager.updateAllLinePositions();
        } else {
            
        }
        
        
    }

    /**
     * Removes the most recent operation and refreshes visual dots/lines accordingly.
     * @returns {boolean} Whether an operation was undone
     */
    undoLastOperation() {
        // Clear all step visualizer highlights before undoing
        if (this.highlighting && typeof this.highlighting.clearAllExplainHighlights === 'function') {
            this.highlighting.clearAllExplainHighlights();
        }
        
        // Remove bottom-most equation and its preceding operation display
        const beforeCount = this.steps.length;
        const removed = super.undoLastOperation ? super.undoLastOperation() : false;
        if (removed || this.steps.length < beforeCount) {
            // Hard rebuild the visual container to avoid stale dots/lines
            this.rebuildVisualizer();
            return true;
        }
        return false;
    }
    
    /**
     * Sets the color of a specific dot and its associated lines
     */
    setDotColor(dotIndex, color) {
        if (this.stepDots && dotIndex >= 0 && dotIndex < this.stepDots.length) {
            const dot = this.stepDots[dotIndex];
            dot.setFillColor(color);
            dot.setStrokeColor(color);
        }
    }
    
    /**
     * Sets the color of the line above a specific dot
     */
    setLineAboveColor(dotIndex, color) {
        let targetLine = this.stepLines.find(line => 
            line.toDotIndex === dotIndex && line.isTemporary && line.svgObject && line.svgObject.style.display !== 'none'
        );
        
        if (!targetLine) {
            targetLine = this.stepLines.find(line => 
                line.toDotIndex === dotIndex && !line.isTemporary && line.svgObject && line.svgObject.style.display !== 'none'
            );
        }
        
        if (targetLine) {
            targetLine.setStrokeColor(color);
        }
    }
    
    /**
     * Enables or disables dot clicking functionality
     */
    setDotsClickable(enabled) {
        this.dotsClickable = enabled;
        
        // If disabling, clear any active highlights and dots
        if (!enabled) {
            this._clearActiveDot();
            // Use the more thorough clearing to ensure no stale highlights remain
            this.highlighting.clearAllExplainHighlights();
        }
        
        this.stepDots.forEach(dot => {
            this.layoutManager.updateDotClickability(dot);
        });
    }
    
    /**
     * Handles clicking on a step dot
     * @private
     */
    _handleDotClick(dot, dotIndex) {
        if (!this.dotsClickable) return;
        // Guard against stale dot references
        if (dotIndex < 0 || dotIndex >= this.stepDots.length) return;
        if (this.stepDots[dotIndex] !== dot) {
            // try to resolve current index
            const idx = this.stepDots.indexOf(dot);
            if (idx === -1) return;
            dotIndex = idx;
        }
        
        try {
            if (this.activeDotIndex === dotIndex) {
                this._clearActiveDot();
            } else {
                if (this.activeDotIndex !== -1) {
                    this._clearActiveDot();
                }
                this.setActiveDot(dotIndex);
                const equation = this.stepDots[dotIndex].equationRef;
                const equationIndex = this.steps.indexOf(equation);
                const isOperation = this._checkForOperationStep(equationIndex);
                this.highlighting.highlightAffectedNodes(dotIndex, isOperation);
            }
        } catch (error) {
            console.error('Error handling dot click:', error);
        }
    }
    
    /**
     * Sets a dot to be the visually active one.
     * @private
     */
    setActiveDot(dotIndex) {
        if (!this.stepDots || dotIndex < 0 || dotIndex >= this.stepDots.length) return;

        this.activeDotIndex = dotIndex;
        this.activeDot = this.stepDots[dotIndex];
        
        const dot = this.stepDots[dotIndex];
        const explainColor = this.styling.activeDotColor;
        dot.setFillColor(explainColor);
        dot.setStrokeColor(explainColor);
        
        this.setLineAboveColor(dotIndex, this.styling.activeLineColor);
        this.textBoxManager.createTextBoxForDot(dotIndex);
        
        // Temporarily disable equation repositioning for simple dot state changes
        const originalRepositioning = this.layoutManager.allowEquationRepositioning;
        this.layoutManager.allowEquationRepositioning = false;
        this.layoutManager.updateVisualZOrder();
        this.layoutManager.allowEquationRepositioning = originalRepositioning;
    }
    
    /**
     * Clears the currently active dot
     * @private
     */
        /**
     * Clears the currently active dot
     * @private
     */
    _clearActiveDot() {
        try {
            if (this.activeDotIndex !== -1) {
                const dot = this.stepDots[this.activeDotIndex];
                const dotColor = this.styling.dotColor;
                dot.setFillColor(dotColor);
                dot.setStrokeColor(dotColor);
                
                this.setLineAboveColor(this.activeDotIndex, this.styling.lineColor);
                this.textBoxManager.removeTextBoxForDot(this.activeDotIndex);
                
                // Use thorough clearing to ensure no stale highlights remain
                this.highlighting.clearAllExplainHighlights();
                
                // Temporarily disable equation repositioning for simple dot state changes
                const originalRepositioning = this.layoutManager.allowEquationRepositioning;
                this.layoutManager.allowEquationRepositioning = false;
                this.layoutManager.updateVisualZOrder();
                this.layoutManager.allowEquationRepositioning = originalRepositioning;
            
                this.activeDot = null;
                this.activeDotIndex = -1;
            }
        } catch (error) {
            console.error('Error clearing active dot:', error);
        }
    }
    
    /**
     * Gets simplification data for a specific dot
     * @private
     */
    _getSimplificationDataForDot(dotIndex) {
        try {
            const dot = this.stepDots[dotIndex];
            if (!dot || !dot.equationRef) {
                return this._createDefaultSimplificationData("No equation found for this step");
            }
            
            const equationIndex = this.steps.indexOf(dot.equationRef);
            if (equationIndex === -1) {
                return this._createDefaultSimplificationData("Step not found in sequence");
            }
            
            // Find the previous visible equation
            const previousVisibleIndex = this._findPreviousVisibleEquationIndex(equationIndex);
            
            // Get all steps between previous visible equation and current
            const allSteps = [];
            
            // Get simplifications
            const simplificationHistory = this.getSimplificationHistory();
            const relevantSimplifications = this._getRelevantSimplifications(
                simplificationHistory, 
                previousVisibleIndex, 
                equationIndex
            );
            allSteps.push(...relevantSimplifications);
            
            // Get operations
            for (let i = previousVisibleIndex + 1; i <= equationIndex; i++) {
                const operationData = this._checkForOperationStep(i);
                if (operationData) {
                    allSteps.push({
                        message: operationData.message,
                        affectedNodes: operationData.affectedNodes,
                        stepNumber: i - 1
                    });
                }
            }
            
            // Sort steps by step number
            allSteps.sort((a, b) => a.stepNumber - b.stepNumber);
            
            if (allSteps.length > 0) {
                return this._createMultipleSimplificationsData(allSteps);
            }
            
            // Check for single simplification
            const singleSimplificationData = this._checkForSingleSimplification(
                simplificationHistory, 
                equationIndex
            );
            if (singleSimplificationData) {
                return singleSimplificationData;
            }
            
            // Fallback cases
            return this._getFallbackSimplificationData(equationIndex);
            
        } catch (error) {
            console.error('Error getting simplification data for dot:', error);
            return this._createDefaultSimplificationData("Error retrieving step data");
        }
    }
    
    /**
     * Gets the step text boxes
     */
    getStepTextBoxes() {
        return this.textBoxManager.getStepTextBoxes();
    }

    // ===== SIMPLIFICATION DATA METHODS =====

    /**
     * Creates default simplification data
     * @param {string} message - The message to display
     * @returns {Object} Default data object
     * @private
     */
    _createDefaultSimplificationData(message) {
        return { 
            message: message,
            rawMessages: [message],
            ruleNames: ['Step Description'],
            affectedNodes: [], 
            resultNodeIds: [], 
            resultProvSources: [], 
            multipleSimplifications: false 
        };
    }

    /**
     * Finds the index of the previous visible equation
     * @param {number} currentIndex - Current equation index
     * @returns {number} Index of previous visible equation, or -1 if none found
     * @private
     */
    _findPreviousVisibleEquationIndex(currentIndex) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (this.steps[i] instanceof omdEquationNode && this.steps[i].visible !== false) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Gets relevant simplifications between two step indices
     * @param {Array} simplificationHistory - Full simplification history
     * @param {number} startIndex - Starting step index
     * @param {number} endIndex - Ending step index
     * @returns {Array} Array of relevant simplification entries
     * @private
     */
    _getRelevantSimplifications(simplificationHistory, startIndex, endIndex) {
        const relevantSimplifications = [];
        
        for (let stepNum = startIndex; stepNum < endIndex; stepNum++) {
            const entries = simplificationHistory.filter(entry => entry.stepNumber === stepNum);
            if (entries.length > 0) {
                relevantSimplifications.push(...entries);
            }
        }
        
        return relevantSimplifications;
    }

    /**
     * Creates data object for multiple simplifications
     * @param {Array} simplifications - Array of simplification entries
     * @returns {Object} Data object for multiple simplifications
     * @private
     */
    _createMultipleSimplificationsData(simplifications) {
        const messages = simplifications.map(s => s.message);
        const ruleNames = simplifications.map(s => s.name || 'Operation').filter(Boolean);
        
        const allAffectedNodes = [];
        const allResultNodeIds = [];
        const allResultProvSources = [];
        
        simplifications.forEach(entry => {
            if (entry.affectedNodes) {
                allAffectedNodes.push(...entry.affectedNodes);
            }
            if (entry.resultNodeId) {
                allResultNodeIds.push(entry.resultNodeId);
            }
            if (entry.resultProvSources) {
                allResultProvSources.push(...entry.resultProvSources);
            }
        });
        
        return {
            message: messages.join('. '),
            rawMessages: messages,
            ruleNames: ruleNames,
            affectedNodes: allAffectedNodes,
            resultNodeIds: allResultNodeIds,
            resultProvSources: allResultProvSources,
            multipleSimplifications: true
        };
    }

    /**
     * Checks for operation step data
     * @param {number} equationIndex - Current equation index
     * @returns {Object|null} Operation data object or null
     * @private
     */
    _checkForOperationStep(equationIndex) {
        if (equationIndex > 0) {
            const step = this.steps[equationIndex - 1];
            if (step instanceof omdOperationDisplayNode) {
                return {
                    message: `Applied ${step.operation} ${step.value} to both sides`,
                    affectedNodes: [step.operatorLeft, step.valueLeft, step.operatorRight, step.valueRight]
                };
            }
        }
        return null;
    }

    /**
     * Checks for single simplification data
     * @param {Array} simplificationHistory - Full simplification history
     * @param {number} equationIndex - Current equation index
     * @returns {Object|null} Single simplification data or null
     * @private
     */
    _checkForSingleSimplification(simplificationHistory, equationIndex) {
        const relevantSimplification = simplificationHistory.find(entry => 
            entry.stepNumber === equationIndex - 1 
        );
        
        if (relevantSimplification) {
            return {
                message: relevantSimplification.message,
                rawMessages: [relevantSimplification.message],
                ruleNames: [relevantSimplification.name || 'Operation'],
                affectedNodes: relevantSimplification.affectedNodes || [],
                resultNodeIds: relevantSimplification.resultNodeId ? [relevantSimplification.resultNodeId] : [],
                resultProvSources: relevantSimplification.resultProvSources || [],
                multipleSimplifications: false
            };
        }
        
        return null;
    }

    /**
     * Gets fallback data for special cases
     * @param {number} equationIndex - Current equation index
     * @returns {Object} Fallback data object
     * @private
     */
    _getFallbackSimplificationData(equationIndex) {
        const currentStep = this.steps[equationIndex];
        if (equationIndex === 0 && currentStep.stepMark === 0) {
            const equationStr = currentStep.toString();
            return this._createDefaultSimplificationData(`Starting with equation: ${equationStr}`);
        } else if (currentStep && currentStep.description) {
            return this._createDefaultSimplificationData(currentStep.description);
        } else {
            return this._createDefaultSimplificationData("Step explanation not available");
        }
    }
}