import { omdColor } from '../../src/omdColor.js';
import { jsvgLayoutGroup, jsvgTextBox, jsvgRect } from '@teachinglab/jsvg';
/**
 * Creates interactive step elements using jsvgLayoutGroup for multiple simplification steps
 * Each step is a separate jsvgTextBox that can have hover interactions with the omdSequence
 */
export class omdStepVisualizerInteractiveSteps {
    constructor(stepVisualizer, simplificationData, stylingOptions = {}) {
        this.stepVisualizer = stepVisualizer;
        this.simplificationData = simplificationData || {};
        this.stylingOptions = stylingOptions || {};
        this.messages = this._extractMessages(simplificationData);
        this.ruleNames = this._extractRuleNames(simplificationData);
        this.stepElements = [];
        this.layoutGroup = new jsvgLayoutGroup();
        this.layoutGroup.setSpacer(4); // Minimal spacing for tight layout

        // Styling configuration with defaults that can be overridden
        this.stepWidth = this.stylingOptions.maxWidth || 300; // Use maxWidth from styling options
        this.baseStepHeight = 30; // Minimal height for tight fit
        this.headerHeight = 28; // Minimal header height
        this.fontSize = this.stylingOptions.fontSize || 14;
        this.smallFontSize = 12;

        this.setupLayoutGroup();
        this.createStepElements();
    }

    /**
     * Extracts messages from simplification data
     * @param {Object} data - Simplification data
     * @returns {Array} Array of clean messages
     * @private
     */
    _extractMessages(data) {
        if (!data) return [];

        let messages = [];
        if (data.rawMessages && Array.isArray(data.rawMessages)) {
            messages = data.rawMessages;
        } else if (data.message) {
            messages = [data.message];
        }

        // Clean up messages - remove HTML tags and bullet points
        return messages.map(msg => {
            let clean = msg.replace(/<[^>]*>/g, ''); // Strip HTML tags
            clean = clean.replace(/^[•·◦▪▫‣⁃]\s*/, ''); // Strip bullet points
            return clean.trim();
        });
    }

    /**
     * Extracts rule names from simplification data
     * @param {Object} data - Simplification data
     * @returns {Array} Array of rule names
     * @private
     */
    _extractRuleNames(data) {
        if (!data) return ['Operation'];

        if (data.ruleNames && Array.isArray(data.ruleNames)) {
            return data.ruleNames;
        }

        // Default based on data type
        if (data.multipleSimplifications) {
            return ['Multiple Rules'];
        } else {
            return ['Operation'];
        }
    }

    /**
     * Sets up the main layout group properties
     * @private
     */
    setupLayoutGroup() {
        // Add background using styling options for the entire step group
        this.backgroundRect = new jsvgRect();
        this.backgroundRect.setWidthAndHeight(this.stepWidth + 16, 60); // Minimal padding and height for tight fit

        // Apply styling options to the background container
        const backgroundColor = this.stylingOptions.backgroundColor || omdColor.lightGray;
        const borderColor = this.stylingOptions.borderColor || '#e0e0e0';
        const borderWidth = this.stylingOptions.borderWidth || 1;
        const borderRadius = this.stylingOptions.borderRadius || 6;

        this.backgroundRect.setFillColor(backgroundColor);
        this.backgroundRect.setStrokeColor(borderColor);
        this.backgroundRect.setStrokeWidth(borderWidth);
        this.backgroundRect.setCornerRadius(borderRadius);
        this.backgroundRect.setPosition(0, 0); // Start at origin, not negative offset

        // Apply drop shadow to the SVG element if requested
        if (this.stylingOptions.dropShadow && this.backgroundRect.svgObject) {
            this.backgroundRect.svgObject.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))';
        }

        this.layoutGroup.addChild(this.backgroundRect);
    }

    /**
     * Creates individual step elements from the messages array
     * @private
     */
    createStepElements() {
        if (!this.messages || this.messages.length === 0) return;

        // Create content container to separate from background
        this.contentGroup = new jsvgLayoutGroup();
        this.contentGroup.setSpacer(2); // Minimal spacing between elements
        this.contentGroup.setPosition(8, 8); // Minimal offset for tight fit

        if (this.messages.length === 1) {

            this.createSingleStepElement(this.messages[0], 0);
        } else {

            this.createMultipleStepElements();
        }

        this.contentGroup.doVerticalLayout();
        this.layoutGroup.addChild(this.contentGroup);
        this.updateBackgroundSize();

        // Apply drop shadow after SVG element is created
        setTimeout(() => {
            this.applyDropShadowIfNeeded();
        }, 10);

        // Debug logging

    }

    /**
     * Creates a single step element with header
     * @param {string} message - The step message
     * @param {number} index - Step index
     * @private
     */
    createSingleStepElement(message, index) {
        // Create header for single step using rule name
        const ruleName = this.ruleNames[0] || 'Operation';
        const headerBox = this.createHeaderBox(ruleName + ':');
        this.contentGroup.addChild(headerBox);

        // Create the step box
        const stepBox = this.createStepTextBox(message, index, false);
        this.stepElements.push(stepBox);
        this.contentGroup.addChild(stepBox);
    }

    /**
     * Creates multiple step elements with header
     * @private
     */
    createMultipleStepElements() {
        // Only create header for truly multiple steps (more than 1)
        if (this.messages.length > 1) {
            // Create header showing rule names
            let headerText;
            if (this.ruleNames.length === 1) {
                headerText = this.ruleNames[0] + ':';
            } else if (this.ruleNames.length <= 3) {
                headerText = this.ruleNames.join(' + ') + ':';
            } else {
                headerText = `${this.ruleNames.length} Rules Applied:`;
            }

            const headerBox = this.createHeaderBox(headerText);
            this.contentGroup.addChild(headerBox);
        }

        // Create individual step elements
        this.messages.forEach((message, index) => {
            const stepBox = this.createStepTextBox(message, index, this.messages.length > 1);
            this.stepElements.push(stepBox);
            this.contentGroup.addChild(stepBox);
        });
    }

    /**
     * Creates a header box with custom text
     * @param {string} headerText - Text to display in header
     * @returns {jsvgTextBox} Header text box
     * @private
     */
    createHeaderBox(headerText = 'Operation:') {
        const headerBox = new jsvgTextBox();
        const headerHeight = Math.max(this.headerHeight, 50); // Increased minimum height


        headerBox.setWidthAndHeight(this.stepWidth, headerHeight);
        headerBox.setText(headerText);
        headerBox.setFontSize(this.fontSize);
        headerBox.setFontWeight('600');
        headerBox.setFontColor('#2c3e50');

        // Style the header with border and minimal spacing
        if (headerBox.div) {
            Object.assign(headerBox.div.style, {
                borderBottom: '1px solid #e0e0e0',
                padding: '6px 8px 4px 8px', // Minimal padding for tight fit
                margin: '0',
                boxSizing: 'border-box',
                minHeight: `${headerHeight}px`,
                overflow: 'visible',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                width: '100%',
                lineHeight: '1.2', // Tight line height
                fontFamily: 'Albert Sans, Arial, sans-serif',
                display: 'flex',
                alignItems: 'center', // Center text vertically
                justifyContent: 'flex-start'
            });
        }


        return headerBox;
    }

    /**
     * Creates an individual step text box
     * @param {string} message - Step message
     * @param {number} index - Step index
     * @param {boolean} isMultiple - Whether this is part of multiple steps
     * @returns {jsvgTextBox} Step text box
     * @private
     */
    createStepTextBox(message, index, isMultiple) {
        const stepBox = new jsvgTextBox();
        // Calculate actual height needed for content with minimal padding
        const contentHeight = this.calculateContentHeight(message, index, isMultiple);
        const height = Math.max(contentHeight, this.baseStepHeight); // Use calculated height



        stepBox.setWidthAndHeight(this.stepWidth, height);
        stepBox.setFontSize(this.fontSize);
        stepBox.setFontColor('#2c3e50');

        // Store step data for interactions
        stepBox.stepIndex = index;
        stepBox.stepMessage = message;
        stepBox.isMultiple = isMultiple;

        // Format the step content
        const formattedContent = this.formatStepContent(message, index, isMultiple);

        // Apply styling and content
        if (stepBox.div) {
            this.applyStepStyling(stepBox, formattedContent, isMultiple, height);
            this.setupStepInteractions(stepBox);

            // Force the jsvgTextBox to respect our sizing
            stepBox.div.style.height = `${height}px`;
            stepBox.div.style.minHeight = `${height}px`;
            stepBox.div.style.display = 'block';

            // Add a more aggressive override after a delay to ensure it sticks
            if (stepBox.div) {
                const actualPadding = this.stylingOptions.padding || 6; // Get padding from styling options
                stepBox.div.style.cssText += `
                        height: ${height}px !important;
                        min-height: ${height}px !important;
                        max-height: ${height}px !important;
                        padding: ${actualPadding}px ${actualPadding + 2}px !important;
                        line-height: 1.3 !important;
                        font-size: ${this.fontSize}px !important;
                        font-family: Albert Sans, Arial, sans-serif !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                        align-items: flex-start !important;
                        word-spacing: normal !important;
                        letter-spacing: normal !important;
                        transition: none !important;
                        transform: none !important;
                        animation: none !important;
                    `;
            }

        }

        return stepBox;
    }

    /**
     * Formats the content for a step
     * @param {string} message - Raw message
     * @param {number} index - Step index
     * @param {boolean} isMultiple - Whether part of multiple steps
     * @returns {string} Formatted content
     * @private
     */
    formatStepContent(message, index, isMultiple) {
        const cleanMessage = message.trim();
        let content = '';

        // Only show step numbers for multiple steps
        if (isMultiple && this.messages.length > 1) {
            content += `<div class="step-number" style="color: #666; font-size: ${this.smallFontSize}px; margin: 0 0 2px 0; font-weight: 500; line-height: 1.2; font-family: Albert Sans, Arial, sans-serif;">Step ${index + 1}</div>`; // Minimal margin
        }

        content += '<div class="step-content" style="display: flex; align-items: center; gap: 6px; margin: 0; width: 100%; line-height: 1.3; font-family: Albert Sans, Arial, sans-serif;">'; // Center align and minimal spacing
        content += '<span class="bullet" style="color: #666; font-weight: bold; flex-shrink: 0; font-size: 10px;">•</span>'; // Smaller bullet
        content += '<div class="step-text" style="margin: 0; flex: 1; min-width: 0; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.3; padding: 0;">';

        // Parse operation details
        if (this.isOperationMessage(cleanMessage)) {
            const action = this.extractOperationAction(cleanMessage);
            const value = this.extractOperationValue(cleanMessage);
            const valueNode = this.extractOperationValueNode(cleanMessage);

            if (action && (value || valueNode)) {
                content += `<span style="font-weight: 600; color: #2c3e50; margin-right: 4px;">${action}</span> `;
                const displayValue = valueNode ? valueNode.toString() : value;
                content += `<span style="background: #f5f5f5; padding: 3px 8px; border-radius: 4px; font-family: 'Courier New', monospace; color: #d63384; margin: 0 3px;">${displayValue}</span>`;
                content += `<span style="color: #666; font-size: ${this.smallFontSize}px; margin-left: 4px;"> to both sides</span>`;
            } else {
                content += `<span style="padding: 2px 0;">${cleanMessage}</span>`;
            }
        } else {
            content += `<span style="font-weight: 500; padding: 2px 0;">${cleanMessage}</span>`;
        }

        content += '</div></div>';
        return content;
    }

    /**
     * Applies styling to a step text box
     * @param {jsvgTextBox} stepBox - The step box
     * @param {string} content - Formatted content
     * @param {boolean} isMultiple - Whether part of multiple steps
     * @param {number} height - The calculated height for the step box
     * @private
     */
    applyStepStyling(stepBox, content, isMultiple, height) {
        const backgroundColor = this.stylingOptions.backgroundColor || omdColor.white;
        const borderColor = this.stylingOptions.borderColor || omdColor.lightGray;
        const borderWidth = this.stylingOptions.borderWidth || 1;
        const borderRadius = this.stylingOptions.borderRadius || 4;
        const padding = this.stylingOptions.padding || 6; // Minimal padding for tight fit

        const baseStyles = {
            padding: `${padding}px ${padding + 2}px !important`, // Minimal padding for tight fit
            borderRadius: `${borderRadius}px`,
            border: `${borderWidth}px solid ${borderColor}`,
            backgroundColor: backgroundColor,
            cursor: 'pointer',
            transition: 'none !important', // Explicitly disable all transitions
            transform: 'none !important', // Explicitly disable all transforms
            animation: 'none !important', // Explicitly disable all animations
            lineHeight: '1.3 !important', // Tight line height
            margin: '0',
            boxSizing: 'border-box',
            overflow: 'visible',
            minHeight: `${height}px !important`, // Use calculated height
            height: `${height}px !important`, // Fixed height to content
            width: '100%',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            fontSize: `${this.fontSize}px !important`, // Force font size
            fontFamily: 'Albert Sans, Arial, sans-serif !important', // Albert Sans font
            display: 'flex !important', // Use flex for centering
            flexDirection: 'column !important',
            justifyContent: 'center !important', // Center content vertically
            alignItems: 'flex-start !important'
        };

        // Add drop shadow if requested - but NOT to individual step boxes
        // The drop shadow should only be on the outer background rectangle
        // Remove any previous drop shadow from individual steps
        if (stepBox.div) {
            stepBox.div.style.boxShadow = 'none';
        }

        // Set font family if specified
        if (this.stylingOptions.fontFamily) {
            baseStyles.fontFamily = this.stylingOptions.fontFamily;
        }

        Object.assign(stepBox.div.style, baseStyles);
        stepBox.div.innerHTML = content;

        // Additional CSS to force proper text spacing
        if (stepBox.div) {
            stepBox.div.style.cssText += `
                    padding: ${padding + 6}px ${padding + 10}px !important;
                    line-height: 1.7 !important;
                    min-height: ${this.baseStepHeight + 20}px !important;
                    font-size: ${this.fontSize}px !important;
                    display: flex !important;
                    flex-direction: column !important;
                `;

            // Apply proper layout to nested content - DO NOT use position absolute
            const contentElements = stepBox.div.querySelectorAll('.step-content, .step-text');
            contentElements.forEach(el => {
                el.style.lineHeight = '1.3 !important';
                el.style.margin = '0 !important';
                el.style.fontFamily = 'Albert Sans, Arial, sans-serif !important';
                // Remove any position absolute that might be inherited
                el.style.position = 'static !important';
            });

            // Ensure bullet points and text spans stay in normal flow
            const allSpans = stepBox.div.querySelectorAll('span');
            allSpans.forEach(span => {
                span.style.position = 'static !important';
            });
        }

        // Force a reflow to ensure proper sizing
        stepBox.div.offsetHeight;
    }

    /**
     * Sets up hover and click interactions for a step
     * @param {jsvgTextBox} stepBox - The step box
     * @private
     */
    setupStepInteractions(stepBox) {
        // Store the original background color to restore on mouseleave
        const originalBackgroundColor = stepBox.div.style.backgroundColor || '';

        // Hover effects
        stepBox.div.addEventListener('mouseenter', () => {
            stepBox.div.style.backgroundColor = omdColor.mediumGray; // Slightly darker version of explainColor

            // Call hover callback if provided
            this.onStepHover?.(stepBox.stepIndex, stepBox.stepMessage, true);
        });

        stepBox.div.addEventListener('mouseleave', () => {
            // Restore the original background color instead of setting to transparent
            stepBox.div.style.backgroundColor = originalBackgroundColor;

            // Call hover callback if provided
            this.onStepHover?.(stepBox.stepIndex, stepBox.stepMessage, false);
        });

        // Click interactions
        stepBox.div.addEventListener('click', () => {
            this.onStepClick?.(stepBox.stepIndex, stepBox.stepMessage);
        });
    }

    /**
     * Calculates the exact height needed for content with minimal padding
     * @param {string} message - Step message
     * @param {number} index - Step index
     * @param {boolean} isMultiple - Whether part of multiple steps
     * @returns {number} Tight-fitting height in pixels
     * @private
     */
    calculateContentHeight(message, index, isMultiple) {
        // Create a temporary element to measure actual text height
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.width = `${this.stepWidth - 16}px`; // Account for minimal padding
        tempDiv.style.fontSize = `${this.fontSize}px`;
        tempDiv.style.lineHeight = '1.3'; // Tight line height
        tempDiv.style.fontFamily = 'Albert Sans, Arial, sans-serif';
        tempDiv.style.whiteSpace = 'normal';
        tempDiv.style.wordWrap = 'break-word';
        tempDiv.style.overflowWrap = 'break-word';
        tempDiv.style.padding = '6px 8px'; // Match the minimal padding
        tempDiv.style.boxSizing = 'border-box';
        tempDiv.style.display = 'flex';
        tempDiv.style.flexDirection = 'column';
        tempDiv.style.justifyContent = 'center';

        // Use actual formatted content for measurement
        const formattedContent = this.formatStepContent(message, index, isMultiple);
        tempDiv.innerHTML = formattedContent;

        // Append to document to measure
        document.body.appendChild(tempDiv);
        const measuredHeight = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);

        // Return exact measured height with minimal buffer
        return Math.max(this.baseStepHeight, measuredHeight + 2); // Just 2px buffer
    }

    /**
     * Calculates the height needed for a step box (legacy method, kept for compatibility)
     * @param {string} message - Step message
     * @returns {number} Height in pixels
     * @private
     */
    calculateStepHeight(message) {
        // Use the new tight-fitting calculation
        return this.calculateContentHeight(message, 0, false);
    }

    /**
     * Updates the background rectangle size after layout
     * @private
     */
    updateBackgroundSize() {
        if (this.backgroundRect && this.contentGroup) {
            const totalHeight = this.contentGroup.height + 16; // Minimal padding for tight fit
            const totalWidth = this.stepWidth + 16; // Minimal padding for tight fit
            this.backgroundRect.setWidthAndHeight(totalWidth, totalHeight);
        }
    }

    /**
     * Applies drop shadow to the background container if SVG element exists
     * @private
     */
    applyDropShadowIfNeeded() {
        if (this.stylingOptions.dropShadow && this.backgroundRect && this.backgroundRect.svgObject) {
            this.backgroundRect.svgObject.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))';
        }
    }

    /**
     * Sets callback for step hover events
     * @param {Function} callback - Function called with (stepIndex, message, isEntering)
     */
    setOnStepHover(callback) {
        this.onStepHover = callback;
    }

    /**
     * Sets callback for step click events
     * @param {Function} callback - Function called with (stepIndex, message)
     */
    setOnStepClick(callback) {
        this.onStepClick = callback;
    }

    /**
     * Gets the main layout group for adding to parent containers
     * @returns {jsvgLayoutGroup} The layout group
     */
    getLayoutGroup() {
        return this.layoutGroup;
    }

    /**
     * Sets the position of the entire step group
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setPosition(x, y) {
        this.layoutGroup.setPosition(x, y);
    }

    /**
     * Gets the dimensions of the step group
     * @returns {Object} Width and height
     */
    getDimensions() {
        return {
            width: this.backgroundRect ? this.backgroundRect.width : this.stepWidth + 16,
            height: this.backgroundRect ? this.backgroundRect.height : 100
        };
    }

    /**
     * Updates the styling options and re-applies them to existing elements
     * @param {Object} newStylingOptions - New styling options
     */
    updateStyling(newStylingOptions = {}) {
        this.stylingOptions = { ...this.stylingOptions, ...newStylingOptions };

        // Update width if maxWidth changed
        if (newStylingOptions.maxWidth) {
            this.stepWidth = newStylingOptions.maxWidth;
        }

        // Update font size if changed
        if (newStylingOptions.fontSize) {
            this.fontSize = newStylingOptions.fontSize;
        }

        // Update background container styling
        if (this.backgroundRect) {
            const backgroundColor = this.stylingOptions.backgroundColor || omdColor.lightGray;
            const borderColor = this.stylingOptions.borderColor || '#e0e0e0';
            const borderWidth = this.stylingOptions.borderWidth || 1;
            const borderRadius = this.stylingOptions.borderRadius || 6;

            this.backgroundRect.setFillColor(backgroundColor);
            this.backgroundRect.setStrokeColor(borderColor);
            this.backgroundRect.setStrokeWidth(borderWidth);
            this.backgroundRect.setCornerRadius(borderRadius);

            // Apply or remove drop shadow
            if (this.backgroundRect.svgObject) {
                if (this.stylingOptions.dropShadow) {
                    this.backgroundRect.svgObject.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))';
                } else {
                    this.backgroundRect.svgObject.style.filter = '';
                }
            }
        }

        // Re-apply styling to all existing step elements
        this.stepElements.forEach((stepBox, index) => {
            if (stepBox.div) {
                const content = stepBox.div.innerHTML;
                // Calculate new height for the step
                const height = this.calculateContentHeight(stepBox.stepMessage, index, stepBox.isMultiple);
                this.applyStepStyling(stepBox, content, stepBox.isMultiple, height);

                // Update font size
                stepBox.setFontSize(this.fontSize);

                // Update dimensions if needed
                stepBox.setWidthAndHeight(this.stepWidth, height);
            }
        });

        // Update background size
        this.updateBackgroundSize();
    }

    /**
     * Gets the current styling options
     * @returns {Object} Current styling options
     */
    getStyling() {
        return { ...this.stylingOptions };
    }

    // Helper methods for message parsing (same as in formatter)

    isOperationMessage(message) {
        const operationKeywords = ['Applied', 'added', 'subtracted', 'multiplied', 'divided', 'both sides'];
        return operationKeywords.some(keyword =>
            message.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    extractOperationAction(message) {
        const match = message.match(/^(Added|Subtracted|Multiplied|Divided)/i);
        return match ? match[0] : null;
    }

    extractOperationValue(message) {
        // Updated regex to handle simple values and expressions
        const match = message.match(/(?:Added|Subtracted|Multiplied|Divided)\s(.*?)\s(?:to|by)/i);
        if (match && match[1]) {
            // Avoid returning "[object Object]"
            if (match[1].includes('[object Object]')) {
                return null;
            }
            return match[1];
        }
        return null;
    }

    extractOperationValueNode(message) {
        if (this.simplificationData && this.simplificationData.operationValueNode) {
            return this.simplificationData.operationValueNode;
        }
        return null;
    }

    /**
     * Destroys the step group and cleans up resources
     */
    destroy() {
        this.stepElements = [];
        if (this.contentGroup) {
            this.contentGroup.removeAllChildren();
        }
        this.layoutGroup.removeAllChildren();
        this.onStepHover = null;
        this.onStepClick = null;
    }
}