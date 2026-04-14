import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdColor } from '../../src/omdColor.js';
import { jsvgLine, jsvgEllipse } from '@teachinglab/jsvg';
import { getDotRadius } from '../config/omdConfigManager.js';

/**
 * Handles visual layout, positioning, and visibility management for step visualizations
 */
export class omdStepVisualizerLayout {
    constructor(stepVisualizer) {
        this.stepVisualizer = stepVisualizer;
        this.expansionDots = []; // Small dots that show/hide hidden steps
        this.fixedVisualizerPosition = 250; // Fixed position for the step visualizer from left edge
        this.allowEquationRepositioning = true; // Flag to control when equations can be repositioned
    }

    /**
     * Sets the fixed position for the step visualizer
     * @param {number} position - The x position from the left edge where the visualizer should be positioned
     */
    setFixedVisualizerPosition(position) {
        // Only update if position actually changes
        if (this.fixedVisualizerPosition !== position) {
            this.fixedVisualizerPosition = position;
            // Trigger a layout update if the visualizer is already initialized
            if (this.stepVisualizer && this.stepVisualizer.stepDots.length > 0) {
                this.updateVisualLayout(true); // Allow repositioning for position changes
            }
        }
    }

    /**
     * Updates the layout of visual elements relative to the sequence
     * @param {boolean} allowRepositioning - Whether to allow equation repositioning (default: false)
     */
    updateVisualLayout(allowRepositioning = false) {
        
        
        
        
        if (this.stepVisualizer.stepDots.length === 0) return;
        
        // Calculate the total width needed for equations (including any padding)
        const baseEquationWidth = (this.stepVisualizer.sequenceWidth || this.stepVisualizer.width);
        const extraPaddingX = this._getMaxEquationEffectivePaddingX();
        const totalEquationWidth = baseEquationWidth + extraPaddingX;
        
        // Position visual container at a fixed position
        const visualX = this.fixedVisualizerPosition;
        this.stepVisualizer.visualContainer.setPosition(visualX, 0);
        
        // Only reposition equations if explicitly allowed (not during simple dot clicks)
        if (this.allowEquationRepositioning && allowRepositioning) {
            
            // Calculate how much space is available for equations before the visualizer
            const availableEquationSpace = this.fixedVisualizerPosition - this.stepVisualizer.visualSpacing;
            
            // If equations are too wide, shift them left to fit
            let equationOffsetX = 0;
            if (totalEquationWidth > availableEquationSpace) {
                equationOffsetX = availableEquationSpace - totalEquationWidth;
                
            }
            
            // Apply the offset to equation positioning
            this._adjustEquationPositions(equationOffsetX);
        } else {
            
            
        }
        
        // Position dots based on visible equations
        const visibleSteps = this.stepVisualizer.steps.filter(s => s.visible !== false);
        let currentY = 0;
        const verticalPadding = 15 * this.stepVisualizer.getFontSize() / this.stepVisualizer.getRootFontSize();
        
        visibleSteps.forEach((step, visIndex) => {
            if (step instanceof omdEquationNode) {
                const dotIndex = this.findDotIndexForEquation(step);
                if (dotIndex >= 0 && dotIndex < this.stepVisualizer.stepDots.length) {
                    const dot = this.stepVisualizer.stepDots[dotIndex];
                    
                    // Center dot vertically with the equation
                    let equationCenter;
                    if (step.equalsSign && step.equalsSign.ypos !== undefined) {
                        equationCenter = step.equalsSign.ypos + (step.equalsSign.height / 2);
                    } else {
                        equationCenter = step.getAlignmentBaseline ? step.getAlignmentBaseline() : step.height / 2;
                    }
                    const dotY = currentY + equationCenter;
                    const dotX = (this.stepVisualizer.dotRadius * 3) / 2;
                    
                    dot.setPosition(dotX, dotY);
                }
            }
            
            currentY += step.height;
            if (visIndex < visibleSteps.length - 1) {
                currentY += verticalPadding;
            }
        });
        
        this.updateAllLinePositions();
        
        // Update container dimensions
        let containerWidth = this.stepVisualizer.dotRadius * 3;
        let containerHeight = this.stepVisualizer.height;
        
        // Store the original height before expansion for autoscale calculations
        if (!this.stepVisualizer.sequenceHeight) {
            this.stepVisualizer.sequenceHeight = containerHeight;
        }
        
        const textBoxes = this.stepVisualizer.textBoxManager.getStepTextBoxes();
        if (textBoxes.length > 0) {
            const textBoxWidth = 280;
            containerWidth = Math.max(containerWidth, textBoxWidth + this.stepVisualizer.dotRadius * 2 + 10 + 20);
            
            // Calculate the maximum extent of any text box to prevent clipping
            textBoxes.forEach(textBox => {
                if (textBox.interactiveSteps) {
                    const dimensions = textBox.interactiveSteps.getDimensions();
                    const layoutGroup = textBox.interactiveSteps.getLayoutGroup();
                    
                    // Calculate the bottom of this text box
                    const textBoxBottom = layoutGroup.ypos + dimensions.height;
                    containerHeight = Math.max(containerHeight, textBoxBottom + 20); // Add some buffer
                }
            });
        }
        
        if (this.stepVisualizer.stepDots.length > 0) {
            const maxRadius = Math.max(...this.stepVisualizer.stepDots.map(d=>d.radius||this.stepVisualizer.dotRadius));
            const containerWidth = maxRadius * 3;
            const maxDotY = Math.max(...this.stepVisualizer.stepDots.map(dot => dot.ypos + this.stepVisualizer.dotRadius));
            containerHeight = Math.max(containerHeight, maxDotY);
        }
        
        this.stepVisualizer.visualContainer.setWidthAndHeight(containerWidth, containerHeight);
        this.updateVisualZOrder();
        
        // Position expansion dots after main dots are positioned
        this._positionExpansionDots();
    }

    /**
     * Adjusts the horizontal position of all equations by the specified offset
     * @private
     */
    _adjustEquationPositions(offsetX) {
        if (offsetX === 0) return; // No adjustment needed
        
        const sv = this.stepVisualizer;
        
        // Adjust position of all steps (equations and operation display nodes)
        sv.steps.forEach(step => {
            if (step && step.setPosition) {
                const currentX = step.xpos || 0;
                const currentY = step.ypos || 0;
                step.setPosition(currentX + offsetX, currentY);
                
                // Also adjust operation display nodes if they exist
                if (step.operationDisplayNode && step.operationDisplayNode.setPosition) {
                    const opCurrentX = step.operationDisplayNode.xpos || 0;
                    const opCurrentY = step.operationDisplayNode.ypos || 0;
                    step.operationDisplayNode.setPosition(opCurrentX + offsetX, opCurrentY);
                }
            }
        });
        
        
    }

    /**
     * Computes the maximum horizontal padding (x) among visible equations, if configured.
     * This allows dots to shift further right when pill background padding is added.
     * @returns {number}
     * @private
     */
    _getMaxEquationEffectivePaddingX() {
        try {
            const steps = this.stepVisualizer.steps || [];
            let maxPadX = 0;
            steps.forEach(step => {
                if (step instanceof omdEquationNode && step.visible !== false) {
                    if (typeof step.getEffectiveBackgroundPaddingX === 'function') {
                        const px = Number(step.getEffectiveBackgroundPaddingX());
                        maxPadX = Math.max(maxPadX, isNaN(px) ? 0 : px);
                    }
                }
            });
            return maxPadX;
        } catch (_) {
            return 0;
        }
    }

    /**
     * Finds the dot index for a given equation
     */
    findDotIndexForEquation(equation) {
        return this.stepVisualizer.stepDots.findIndex(dot => dot.equationRef === equation);
    }

    /**
     * Updates the z-order of visual elements
     */
    updateVisualZOrder() {
        if (!this.stepVisualizer.visualContainer) return;

        // Lines behind (z-index 1)
        this.stepVisualizer.stepLines.forEach(line => {
            if (line && line.svgObject) {
                line.svgObject.style.zIndex = '1';
                if (line.parentNode !== this.stepVisualizer.visualContainer) {
                    this.stepVisualizer.visualContainer.addChild(line);
                }
            }
        });

        // Dots in front (z-index 2)
        this.stepVisualizer.stepDots.forEach(dot => {
            if (dot && dot.svgObject) {
                dot.svgObject.style.zIndex = '2';
                if (dot.parentNode !== this.stepVisualizer.visualContainer) {
                    this.stepVisualizer.visualContainer.addChild(dot);
                }
            }
        });

        // Text boxes on top (z-index 3)
        const textBoxes = this.stepVisualizer.textBoxManager.getStepTextBoxes();
        textBoxes.forEach(textBox => {
            if (textBox && textBox.svgObject) {
                textBox.svgObject.style.zIndex = '3';
                if (textBox.parentNode !== this.stepVisualizer.visualContainer) {
                    this.stepVisualizer.visualContainer.addChild(textBox);
                }
            }
        });

        // Expansion dots on top of regular dots (z-index 4)
        this.expansionDots.forEach(dot => {
            if (dot && dot.svgObject) {
                dot.svgObject.style.zIndex = '4';
                if (dot.parentNode !== this.stepVisualizer.visualContainer) {
                    this.stepVisualizer.visualContainer.addChild(dot);
                }
            }
        });
    }

    /**
     * Updates all line positions to connect dot centers
     */
    updateAllLinePositions() {
        this.stepVisualizer.stepLines.forEach(line => {
            const fromDot = this.stepVisualizer.stepDots[line.fromDotIndex];
            const toDot = this.stepVisualizer.stepDots[line.toDotIndex];
            
            if (fromDot && toDot) {
                line.setEndpoints(fromDot.xpos, fromDot.ypos, toDot.xpos, toDot.ypos);
            }
        });
    }

    /**
     * Updates visibility of visual elements based on equation visibility
     */
    updateVisualVisibility() {
        
        const sv = this.stepVisualizer;

        // Update dot visibility and color first, which is the source of truth
        const dotColor = sv.styling?.dotColor || omdColor.stepColor;
        
        
        sv.stepDots.forEach((dot, index) => {
            if (dot.equationRef && dot.equationRef.visible !== false) {
                dot.setFillColor(dotColor);
                dot.setStrokeColor(dotColor);
                dot.show();
                dot.visible = true; // Use the dot's own visibility property
                
            } else {
                dot.hide();
                dot.visible = false;
                
            }
        });

        // Clear existing expansion dots
        
        this._clearExpansionDots();

        // Remove all old lines from the container and the array
        
        sv.stepLines.forEach(line => {
            // Remove the line if it is currently a child of the visualContainer
            if (line.parent === sv.visualContainer) {
                sv.visualContainer.removeChild(line);
            }
        });
        sv.stepLines = [];

        // Get the dots that are currently visible
        const visibleDots = sv.stepDots.filter(dot => dot.visible);
        

        // Re-create connecting lines only between the visible dots
        
        for (let i = 0; i < visibleDots.length - 1; i++) {
            const fromDot = visibleDots[i];
            const toDot = visibleDots[i + 1];

            const line = new jsvgLine();
            const lineColor = sv.styling?.lineColor || omdColor.stepColor;
            line.setStrokeColor(lineColor);
            line.setStrokeWidth(sv.styling?.lineWidth || sv.lineWidth);
            line.fromDotIndex = sv.stepDots.indexOf(fromDot);
            line.toDotIndex = sv.stepDots.indexOf(toDot);

            sv.visualContainer.addChild(line);
            sv.stepLines.push(line);
        }
        

        // After creating the lines, update their positions
        this.updateAllLinePositions();

        // Create expansion dots for dots that have hidden steps before them
        
        this._createExpansionDots();
        
        
        this._positionExpansionDots();
        
        
    }

    /**
     * Updates the clickability of a dot
     */
    updateDotClickability(dot) {
        if (this.stepVisualizer.dotsClickable) {
            dot.svgObject.style.cursor = "pointer";
            dot.svgObject.onclick = (event) => {
                try {
                    const idx = this.stepVisualizer.stepDots.indexOf(dot);
                    if (idx < 0) return; // orphan dot, ignore
                    this.stepVisualizer._handleDotClick(dot, idx);
                    event.stopPropagation();
                } catch (error) {
                    console.error('Error in dot click handler:', error);
                }
            };
        } else {
            dot.svgObject.style.cursor = "default";
            dot.svgObject.onclick = null;
        }
    }

    /**
     * Clears all expansion dots
     * @private
     */
    _clearExpansionDots() {
        this.expansionDots.forEach(dot => {
            if (dot.parentNode === this.stepVisualizer.visualContainer) {
                this.stepVisualizer.visualContainer.removeChild(dot);
            }
        });
        this.expansionDots = [];
    }

    /**
     * Creates expansion dots for visible dots that have hidden steps before them
     * @private
     */
    _createExpansionDots() {
        
        const sv = this.stepVisualizer;
        const allDots = sv.stepDots;
        const visibleDots = sv.stepDots.filter(dot => dot.visible);
        
        
        
        // Debug all steps and their properties
        
        sv.steps.forEach((step, i) => {
            if (step && (step instanceof omdEquationNode || step.type === 'omdEquationNode')) {
                
            } else {
                
            }
        });
        
        // Debug all dots and their properties
        
        allDots.forEach((dot, i) => {
            if (dot && dot.equationRef) {
                
            } else {
                
            }
        });
        
        
        
        // Check for hidden intermediate steps between consecutive visible major steps (stepMark = 0)
        const visibleMajorSteps = [];
        sv.steps.forEach((step, stepIndex) => {
            if (step && (step instanceof omdEquationNode || step.type === 'omdEquationNode')) {
                if (step.stepMark === 0 && step.visible === true) {
                    visibleMajorSteps.push(stepIndex);
                    
                }
            }
        });
        
        
        
        // Check between consecutive visible major steps for hidden intermediate steps
        for (let i = 1; i < visibleMajorSteps.length; i++) {
            const previousMajorStepIndex = visibleMajorSteps[i - 1];
            const currentMajorStepIndex = visibleMajorSteps[i];
            
            
            
            // Count hidden intermediate steps between these major steps
            let hiddenIntermediateCount = 0;
            for (let j = previousMajorStepIndex + 1; j < currentMajorStepIndex; j++) {
                const step = sv.steps[j];
                if (step && (step instanceof omdEquationNode || step.type === 'omdEquationNode')) {
                    if (step.stepMark > 0 && step.visible === false) {
                        hiddenIntermediateCount++;
                        
                    }
                }
            }
            
            
            
            if (hiddenIntermediateCount > 0) {
                
                // Find the dot for the current major step to position the expansion dot above it
                const currentMajorStep = sv.steps[currentMajorStepIndex];
                const currentDotIndex = sv.stepDots.findIndex(dot => dot.equationRef === currentMajorStep);
                
                if (currentDotIndex >= 0) {
                    // Find the position in the visible dots array
                    const visibleDotIndex = i; // i is the position in visibleMajorSteps array
                    
                    const expansionDot = this._createSingleExpansionDot(visibleDotIndex, previousMajorStepIndex, hiddenIntermediateCount);
                    expansionDot.majorStepIndex = currentMajorStepIndex; // Store for reference
                    this.expansionDots.push(expansionDot);
                    sv.visualContainer.addChild(expansionDot);
                    
                } else {
                    
                }
            } else {
                
            }
        }
        
        
        // Also create collapse dots for expanded sequences
        this._createCollapseDots();
        
        
        
    }

    /**
     * Counts intermediate steps (stepMark > 0) between two visible dots
     * @private
     */
    _countIntermediateStepsBetween(fromDotIndex, toDotIndex) {
        const sv = this.stepVisualizer;
        let count = 0;
        
        // Get the equation references for the from and to dots
        const fromEquation = sv.stepDots[fromDotIndex]?.equationRef;
        const toEquation = sv.stepDots[toDotIndex]?.equationRef;
        
        if (!fromEquation || !toEquation) {
            
            return 0;
        }
        
        // Find the step indices in the main steps array
        const fromStepIndex = sv.steps.indexOf(fromEquation);
        const toStepIndex = sv.steps.indexOf(toEquation);
        
        
        
        // Count intermediate steps between these two major steps
        for (let i = fromStepIndex + 1; i < toStepIndex; i++) {
            const step = sv.steps[i];
            if (step && (step instanceof omdEquationNode || step.type === 'omdEquationNode')) {
                // Count intermediate steps (stepMark > 0) that are currently hidden
                if (step.stepMark !== undefined && step.stepMark > 0 && step.visible === false) {
                    
                    count++;
                }
            }
        }
        
        
        return count;
    }

    /**
     * Counts hidden steps between two step indices (legacy method for backward compatibility)
     * @private
     */
    _countHiddenStepsBetween(fromIndex, toIndex) {
        return this._countIntermediateStepsBetween(fromIndex, toIndex);
    }

    /**
     * Creates a single expansion dot
     * @private
     */
    _createSingleExpansionDot(currentStepIndex, previousStepIndex, hiddenCount) {
        
        const sv = this.stepVisualizer;
        const baseRadius = sv.styling?.dotRadius || getDotRadius(0);
        const expansionRadius = Math.max(3, baseRadius * (sv.styling?.expansionDotScale || 0.4));
        
        
        
        const expansionDot = new jsvgEllipse();
        expansionDot.setWidthAndHeight(expansionRadius * 2, expansionRadius * 2);
        
        // Use same color as regular dots from styling
        const dotColor = sv.styling?.dotColor || omdColor.stepColor;
        
        expansionDot.setFillColor(dotColor);
        expansionDot.setStrokeColor(dotColor);
        expansionDot.setStrokeWidth(sv.styling?.dotStrokeWidth || 1);
        
        // Store metadata
        expansionDot.isExpansionDot = true;
        expansionDot.currentStepIndex = currentStepIndex;
        expansionDot.previousStepIndex = previousStepIndex;
        expansionDot.hiddenCount = hiddenCount;
        expansionDot.radius = expansionRadius;
        
        
        // Make it clickable
        expansionDot.svgObject.style.cursor = "pointer";
        expansionDot.svgObject.onclick = (event) => {
            try {
                
                this._handleExpansionDotClick(expansionDot);
                event.stopPropagation();
            } catch (error) {
                console.error('Error in expansion dot click handler:', error);
            }
        };
        
        
        
        
        return expansionDot;
    }

    /**
     * Positions expansion dots above their corresponding main dots
     * @private
     */
    _positionExpansionDots() {
        
        const sv = this.stepVisualizer;
        
        
        
        this.expansionDots.forEach((expansionDot, index) => {
            
            let targetDot;
            
            if (expansionDot.isCollapseDot) {
                
                // For collapse dots, use the currentStepIndex which points to the dot index
                const dotIndex = expansionDot.currentStepIndex;
                targetDot = sv.stepDots[dotIndex];
                
            } else {
                
                // For expansion dots, we need to find the actual visible dot that corresponds to the major step
                const majorStepIndex = expansionDot.majorStepIndex;
                const majorStep = sv.steps[majorStepIndex];
                
                if (majorStep) {
                    // Find the dot that corresponds to this major step
                    const dotIndex = sv.stepDots.findIndex(dot => dot.equationRef === majorStep);
                    targetDot = sv.stepDots[dotIndex];
                    
                } else {
                    
                }
            }
            
            if (targetDot && targetDot.visible) {
                const offsetY = -(expansionDot.radius * 2 + 8); // Position above main dot
                const newX = targetDot.xpos;
                const newY = targetDot.ypos + offsetY;
                
                expansionDot.setPosition(newX, newY);
                
            } else {
                
            }
        });
        
        
    }

    /**
     * Creates collapse dots for expanded sequences
     * @private
     */
    _createCollapseDots() {
        
        const sv = this.stepVisualizer;
        const allDots = sv.stepDots;
        
        
        
        // Group visible intermediate steps by their consecutive sequences
        const intermediateGroups = [];
        let currentGroup = [];
        
        allDots.forEach((dot, index) => {
            if (dot && dot.visible && dot.equationRef) {
                const stepMark = dot.equationRef.stepMark;
                
                
                if (stepMark !== undefined && stepMark > 0) {
                    currentGroup.push(index);
                    
                } else if (currentGroup.length > 0) {
                    // We hit a major step, so end the current group
                    intermediateGroups.push([...currentGroup]);
                    
                    currentGroup = [];
                }
            } else if (currentGroup.length > 0) {
                // We hit a non-visible dot, so end the current group
                intermediateGroups.push([...currentGroup]);
                
                currentGroup = [];
            }
        });
        
        // Don't forget the last group if it exists
        if (currentGroup.length > 0) {
            intermediateGroups.push([...currentGroup]);
            
        }
        
        
        
        // Create a collapse dot for each group
        intermediateGroups.forEach((group, groupIndex) => {
            if (group.length > 0) {
                
                
                // Find the major step that comes after the last intermediate step in this group
                const lastIntermediateIndex = group[group.length - 1];
                const lastIntermediateDot = sv.stepDots[lastIntermediateIndex];
                const lastIntermediateStep = lastIntermediateDot.equationRef;
                const lastIntermediateStepIndex = sv.steps.indexOf(lastIntermediateStep);
                
                
                
                // Find the next major step (stepMark = 0) after the intermediate steps
                let majorStepAfterIndex = -1;
                for (let i = lastIntermediateStepIndex + 1; i < sv.steps.length; i++) {
                    const step = sv.steps[i];
                    if (step && (step instanceof omdEquationNode || step.type === 'omdEquationNode')) {
                        if (step.stepMark === 0 && step.visible === true) {
                            majorStepAfterIndex = i;
                            
                            break;
                        }
                    }
                }
                
                if (majorStepAfterIndex >= 0) {
                    // Find the dot index for this major step
                    const majorStepAfter = sv.steps[majorStepAfterIndex];
                    const majorDotIndex = sv.stepDots.findIndex(dot => dot.equationRef === majorStepAfter);
                    
                    if (majorDotIndex >= 0) {
                        
                        
                        const collapseDot = this._createSingleExpansionDot(majorDotIndex, -1, group.length);
                        collapseDot.isCollapseDot = true;
                        collapseDot.intermediateSteps = group;
                        collapseDot.groupIndex = groupIndex; // Store group reference
                        this.expansionDots.push(collapseDot);
                        sv.visualContainer.addChild(collapseDot);
                        
                    } else {
                        
                    }
                } else {
                    
                }
            }
        });
        
        
    }

    /**
     * Handles clicking on an expansion dot to toggle hidden steps
     * @private
     */
    _handleExpansionDotClick(expansionDot) {
        const sv = this.stepVisualizer;
        
        // Clear all step visualizer highlights when expanding/contracting
        if (sv.highlighting && typeof sv.highlighting.clearAllExplainHighlights === 'function') {
            sv.highlighting.clearAllExplainHighlights();
        }
        
        if (expansionDot.isCollapseDot) {
            // Handle collapse dot click - hide only the specific group of intermediate steps
            
            
            // Hide only the intermediate steps in this specific group
            const intermediateSteps = expansionDot.intermediateSteps || [];
            
            
            intermediateSteps.forEach(dotIndex => {
                const dot = sv.stepDots[dotIndex];
                if (dot && dot.equationRef) {
                    
                    this._hideStep(dot.equationRef);
                    
                    // Also hide the corresponding dot
                    dot.hide();
                    dot.visible = false;
                    
                }
            });
            
            // Remove any lines that connect to the hidden dots
            
            this._removeLinesToHiddenDots();
            
            
        } else {
            // Handle expansion dot click - show steps between the major steps
            const { majorStepIndex, previousStepIndex } = expansionDot;
            
            
            
            // Remove this expansion dot immediately since we're expanding
            
            if (expansionDot.parentNode === sv.visualContainer) {
                sv.visualContainer.removeChild(expansionDot);
            }
            const dotIndex = this.expansionDots.indexOf(expansionDot);
            if (dotIndex >= 0) {
                this.expansionDots.splice(dotIndex, 1);
                
            }
            
            // Show all intermediate steps between the previous and current major steps
            for (let i = previousStepIndex + 1; i < majorStepIndex; i++) {
                const step = sv.steps[i];
                if (step && (step instanceof omdEquationNode || step.type === 'omdEquationNode')) {
                    if (step.stepMark > 0) {
                        
                        this._showStep(step);
                        
                        // Also show the corresponding dot
                        const stepDotIndex = sv.stepDots.findIndex(dot => dot.equationRef === step);
                        if (stepDotIndex >= 0) {
                            const stepDot = sv.stepDots[stepDotIndex];
                            stepDot.show();
                            stepDot.visible = true;
                            
                        }
                    }
                }
            }
            
            
        }
        
        // Force a complete refresh of the visualizer to clean up artifacts and rebuild lines
        sv.rebuildVisualizer();
    }

    /**
     * Properly hides a step and all its child elements
     * @private
     */
    _hideStep(step) {
        step.visible = false;
        if (step.svgObject) {
            step.svgObject.style.display = 'none';
        }
        
        // Also hide operation display nodes if they exist
        if (step.operationDisplayNode) {
            step.operationDisplayNode.visible = false;
            if (step.operationDisplayNode.svgObject) {
                step.operationDisplayNode.svgObject.style.display = 'none';
            }
        }
        
        // Hide any child nodes recursively
        if (step.children && Array.isArray(step.children)) {
            step.children.forEach(child => {
                if (child) {
                    this._hideStep(child);
                }
            });
        }
    }

    /**
     * Properly shows a step and all its child elements
     * @private
     */
    _showStep(step) {
        step.visible = true;
        if (step.svgObject) {
            step.svgObject.style.display = '';
        }
        
        // Also show operation display nodes if they exist
        if (step.operationDisplayNode) {
            step.operationDisplayNode.visible = true;
            if (step.operationDisplayNode.svgObject) {
                step.operationDisplayNode.svgObject.style.display = '';
            }
        }
        
        // Show any child nodes recursively
        if (step.children && Array.isArray(step.children)) {
            step.children.forEach(child => {
                if (child) {
                    this._showStep(child);
                }
            });
        }
    }

    /**
     * Removes lines that connect to hidden dots
     * @private
     */
    _removeLinesToHiddenDots() {
        const sv = this.stepVisualizer;
        
        
        // Get lines that connect to hidden dots
        const linesToRemove = [];
        sv.stepLines.forEach((line, lineIndex) => {
            const fromDot = sv.stepDots[line.fromDotIndex];
            const toDot = sv.stepDots[line.toDotIndex];
            
            if ((fromDot && !fromDot.visible) || (toDot && !toDot.visible)) {
                
                linesToRemove.push(line);
            }
        });
        
        // Remove the problematic lines
        
        linesToRemove.forEach(line => {
            if (line.parent === sv.visualContainer) {
                sv.visualContainer.removeChild(line);
                
            }
            const lineIndex = sv.stepLines.indexOf(line);
            if (lineIndex >= 0) {
                sv.stepLines.splice(lineIndex, 1);
                
            }
        });
        
        
    }
} 
