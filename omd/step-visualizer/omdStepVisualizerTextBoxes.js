import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdStepVisualizerInteractiveSteps } from '../utils/omdStepVisualizerInteractiveSteps.js';

/**
 * Manages interactive step text boxes that appear when dots are clicked
 * Handles creation, positioning, and cleanup of explanation popups
 */
export class omdStepVisualizerTextBoxes {
    constructor(stepVisualizer, highlighting, options = {}) {
        this.stepVisualizer = stepVisualizer;
        this.highlighting = highlighting;
        this.stepTextBoxes = [];
        this.options = options;
    }

    /**
     * Creates an interactive steps popup for a clicked dot
     * @param {number} dotIndex - Index of the dot to create text box for
     */
    createTextBoxForDot(dotIndex) {
        try {
            this.removeTextBoxForDot(dotIndex);
            
            const targetDot = this._findDotAboveForPositioning(dotIndex);
            if (!targetDot) {
                console.error('Target dot not found for positioning text box for dot index:', dotIndex);
                return;
            }
            
            const simplificationData = this._getSimplificationDataForDot(dotIndex);
            this._createInteractiveStepsForDot(dotIndex, targetDot, simplificationData);
            
        } catch (error) {
            console.error('Error creating text box for dot', dotIndex, ':', error);
        }
    }

    /**
     * Creates interactive steps for a dot with simplification data
     * @param {number} dotIndex - Index of the dot
     * @param {Object} targetDot - The dot to position relative to
     * @param {Object} simplificationData - Full simplification data including rule names
     * @private
     */
    _createInteractiveStepsForDot(dotIndex, targetDot, simplificationData) {
        const interactiveSteps = new omdStepVisualizerInteractiveSteps(
            this.stepVisualizer, 
            simplificationData, 
            this.options // Pass styling options to interactive steps
        );
        
        // Position relative to the target dot
        const x = targetDot.xpos + this.stepVisualizer.dotRadius * 2 + 10;
        const y = targetDot.ypos - this.stepVisualizer.dotRadius;
        interactiveSteps.setPosition(x, y);
        
        // Set up hover interactions
        interactiveSteps.setOnStepHover((stepIndex, message, isEntering) => {
        });
        
        // Set up click interactions
        interactiveSteps.setOnStepClick((stepIndex, message) => {
        });
        
        // Add to visual container and track
        const layoutGroup = interactiveSteps.getLayoutGroup();
        layoutGroup.dotIndex = dotIndex;
        this.stepVisualizer.visualContainer.addChild(layoutGroup);
        
    // Apply configured z-index styling to ensure proper layering
        if (layoutGroup.svgObject && (this.options.zIndex || this.options.position)) {
            if (this.options.position) {
                layoutGroup.svgObject.style.position = this.options.position;
            }
            if (this.options.zIndex) {
                layoutGroup.svgObject.style.zIndex = String(this.options.zIndex);
                
                // Only apply to the main container, NOT to child elements to preserve internal layout
                // Applying position absolute to child elements breaks flexbox layout
            }
        }
    
        this.stepTextBoxes.push({
            dotIndex: dotIndex,
            interactiveSteps: interactiveSteps,
            layoutGroup: layoutGroup
        });
        
        // Note: Removed updateVisualLayout call to prevent repositioning movement
    }





    /**
     * Removes the text box for a specific dot
     * @param {number} dotIndex - Index of the dot to remove text box for
     */
    removeTextBoxForDot(dotIndex) {
        const textBoxIndex = this.stepTextBoxes.findIndex(tb => tb.dotIndex === dotIndex);
        if (textBoxIndex >= 0) {
            const item = this.stepTextBoxes[textBoxIndex];
            this.stepVisualizer.visualContainer.removeChild(item.layoutGroup);
            item.interactiveSteps.destroy();
            this.stepTextBoxes.splice(textBoxIndex, 1);
            
            // Note: Removed updateVisualLayout call to prevent repositioning movement
        }
    }

    /**
     * Removes all text boxes
     */
    clearAllTextBoxes() {
        this.stepTextBoxes.forEach(item => {
            this.stepVisualizer.visualContainer.removeChild(item.layoutGroup);
            item.interactiveSteps.destroy();
        });
        this.stepTextBoxes = [];
        
        // Note: Removed updateVisualLayout call to prevent repositioning movement
    }

    /**
     * Finds the appropriate dot above the clicked one for text box positioning
     * @param {number} dotIndex - Index of the clicked dot
     * @returns {Object|null} The dot to align with, or null if none found
     * @private
     */
    _findDotAboveForPositioning(dotIndex) {
        const currentDot = this.stepVisualizer.stepDots[dotIndex];
        if (!currentDot || !currentDot.equationRef) {
            return null;
        }
        
        const currentEquation = currentDot.equationRef;
        const currentEquationIndex = this.stepVisualizer.steps.indexOf(currentEquation);
        
        // Find the nearest visible equation above
        for (let i = currentEquationIndex - 1; i >= 0; i--) {
            const step = this.stepVisualizer.steps[i];
            if (step instanceof omdEquationNode && step.visible !== false) {
                // Find the corresponding dot
                for (let dotIdx = dotIndex - 1; dotIdx >= 0; dotIdx--) {
                    const dot = this.stepVisualizer.stepDots[dotIdx];
                    if (dot && dot.equationRef === step) {
                        return dot;
                    }
                }
                break;
            }
        }
        
        // If no visible equation above, use the clicked dot itself
        return currentDot;
    }

    /**
     * Gets the simplification data for a specific dot
     * @param {number} dotIndex - Index of the dot
     * @returns {Object} The simplification data for this step
     * @private
     */
    _getSimplificationDataForDot(dotIndex) {
        return this.stepVisualizer._getSimplificationDataForDot(dotIndex);
    }



    /**
     * Gets all text boxes
     * @returns {Array} Array of text box objects
     */
    getStepTextBoxes() {
        return this.stepTextBoxes;
    }

    /**
     * Updates the styling options for text boxes
     * @param {Object} newOptions - New styling options
     */
    updateStyling(newOptions = {}) {
        this.options = { ...this.options, ...newOptions };
        
        // Apply new styling to existing text boxes
        this.stepTextBoxes.forEach(textBoxItem => {
            if (textBoxItem.interactiveSteps && typeof textBoxItem.interactiveSteps.updateStyling === 'function') {
                textBoxItem.interactiveSteps.updateStyling(this.options);
            }
        });
    }

    /**
     * Gets the current styling options
     * @returns {Object} Current styling options
     */
    getStyling() {
        return { ...this.options };
    }
} 