import { jsvgGroup, jsvgRect, jsvgButton, jsvgLayoutGroup, jsvgTextInput  } from '@teachinglab/jsvg';
/**
 * omdPopup - Handles popup creation and management for node overlays
 */
export class omdPopup {
    constructor(targetNode, parentElement, options = {}) {
        this.targetNode = targetNode;
        this.parentElement = parentElement;
        this.options = {
            editable: true,
            animationDuration: 200,
            ...options
        };
        
        // State
        this.popup = null;
        this.popupBackground = null;
        this.popupTextInput = null;
        this.penCanvas = null;
        this.penCanvasCleanup = null;
        this.currentMode = 'text'; // 'text' or 'pen'
        this.popupAnimationId = null;
        
        // Buttons
        this.penButton = null;
        this.textButton = null;
        this.clearButton = null;
        this.submitButton = null;
        
        // Callbacks
        this.onValidateCallback = null;
        this.onClearCallback = null;
        
        // Layout configuration - centralized variables
        this.popupWidth = 400;
        this.buttonSize = 18;
        this.margin = 10;
        this.buttonSpacing = 4;
        this.canvasMinWidth = 100;
        this.canvasMinHeight = 60;
        this.popupHeightMultiplier = 2;
        this.targetNodeDefaultHeight = 40;
        this.canvasTopOffset = this.margin;
        this.canvasLeftOffset = this.margin;
    }
    
    /**
     * Creates and shows the popup
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Promise} Promise that resolves when animation completes
     */
    show(x, y) {
        if (this.popup) {
            return this.hide().then(() => this.show(x, y));
        }
        
        this._createPopup();
        this._positionPopup(x, y);
        this.parentElement.addChild(this.popup);
        
        // Start invisible and animate in
        this.popup.setOpacity(0);
        return this._animateOpacity(0, 1, this.options.animationDuration);
    }
    
    /**
     * Hides the popup
     * @returns {Promise} Promise that resolves when animation completes
     */
    hide() {
        if (!this.popup) return Promise.resolve();
        
        // Store original opacities for animation
        const originalPopupOpacity = this.popup.opacity;
        const originalTextInputOpacity = this.popupTextInput?.div?.style.opacity || '1';
        
        // Ensure canvas and text input are visible for animation but preserve canvas drawing
        if (this.penCanvas && this.penCanvas.container) {
            this.penCanvas.container.style.display = 'block';
            // Don't fade canvas opacity - keep strokes visible during popup hide
        }
        if (this.popupTextInput && this.popupTextInput.div) {
            this.popupTextInput.div.style.display = 'flex';
            this.popupTextInput.div.style.opacity = originalTextInputOpacity;
        }
        
        // Animate popup and canvas together
        const duration = this.options.animationDuration || 300;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentOpacity = originalPopupOpacity * (1 - easeOut);
            
            // Animate popup
            if (this.popup) {
                this.popup.setOpacity(currentOpacity);
            }
            
            // Animate canvas container with same opacity curve
            if (this.penCanvas && this.penCanvas.container) {
                this.penCanvas.container.style.opacity = currentOpacity;
            }
            
            // Animate text input with proper opacity setting
            if (this.popupTextInput && this.popupTextInput.div) {
                this.popupTextInput.div.style.opacity = currentOpacity;
            }
            
            if (progress < 1) {
                this.popupAnimationId = requestAnimationFrame(animate);
            } else {
                // Animation complete - hide and cleanup both popup and canvas
                if (this.penCanvas && this.penCanvas.container) {
                    this.penCanvas.container.style.display = 'none';
                    this.penCanvas.container.style.opacity = '1'; // Reset for next show
                }
                if (this.popupTextInput && this.popupTextInput.div) {
                    this.popupTextInput.div.style.display = 'none';
                }
                this._cleanup();
            }
        };
        
        this.popupAnimationId = requestAnimationFrame(animate);
        
        return new Promise((resolve) => {
            setTimeout(resolve, duration);
        });
    }
    
    /**
     * Toggles popup visibility
     * @param {number} x - X position for showing
     * @param {number} y - Y position for showing
     * @returns {Promise} Promise that resolves when animation completes
     */
    toggle(x, y) {
        if (this.popup && this.popup.visible) {
            return this.hide();
        } else {
            return this.show(x, y);
        }
    }
    
    /**
     * Sets the validation callback
     * @param {Function} callback - Function to call for validation
     */
    setValidationCallback(callback) {
        this.onValidateCallback = callback;
    }
    
    /**
     * Sets the clear callback
     * @param {Function} callback - Function to call when clearing
     */
    setClearCallback(callback) {
        this.onClearCallback = callback;
    }
    
    /**
     * Gets the current input value
     * @returns {string} Current input value
     */
    getValue() {
        // If we have transcribed text from pen mode, return it
        if (this.transcribedText) {
            const text = this.transcribedText;
            // Clear the transcribed text after returning it
            this.transcribedText = null;
            return text;
        }
        
        if (this.currentMode === 'text' && this.popupTextInput) {
            return this.popupTextInput.getText();
        }
        return '';
    }
    
    /**
     * Sets the input value
     * @param {string} value - Value to set
     */
    setValue(value) {
        if (this.currentMode === 'text' && this.popupTextInput) {
            this.popupTextInput.setText(value);
        }
    }
    
    /**
     * Switches between text and pen modes
     * @param {string} mode - 'text' or 'pen'
     */
    switchToMode(mode) {
        if (this.currentMode === mode || !this.popup) {
            return;
        }
        this.currentMode = mode;
        if (mode === 'pen') {
            this._showPenMode();
        } else {
            this._showTextMode();
        }
        // Update button states
        this._updateButtonStates();
    }
    
    /**
     * Creates the popup structure
     * @private
     */
    _createPopup() {
        const popupHeight = (this.targetNode?.height || this.targetNodeDefaultHeight) * this.popupHeightMultiplier;
        
        // Create popup container
        this.popup = new jsvgLayoutGroup();
        
        // Create popup background
        this.popupBackground = new jsvgRect();
        this.popupBackground.setWidthAndHeight(this.popupWidth, popupHeight);
        this.popupBackground.setFillColor('white');
        this.popupBackground.setStrokeColor('black');
        this.popupBackground.setStrokeWidth(2);
        this.popupBackground.setCornerRadius(8);
        this.popup.addChild(this.popupBackground);
        
        // Create buttons
        this._createButtons(this.popupWidth, popupHeight, this.buttonSize, this.margin, this.buttonSpacing);
        
        // Create text input (default mode)
        this._createTextInput(this.popupWidth, popupHeight, this.margin);
        
        // Set initial mode
        this.currentMode = 'text';
        this._updateButtonStates();
    }
    
    /**
     * Creates the popup buttons
     * @private
     */
    _createButtons(popupWidth, popupHeight, buttonSize, margin, buttonSpacing) {
        const buttonX = popupWidth - buttonSize - margin;
        
        // Clear button
        const clearButtonY = popupHeight - (buttonSize * 2) - margin - buttonSpacing;
        this.clearButton = new jsvgButton();
        this.clearButton.setText("C");
        this.clearButton.setWidthAndHeight(buttonSize, buttonSize);
        this.clearButton.setFillColor('#E65423');
        this.clearButton.setFontColor('white');
        this.clearButton.buttonText.setFontWeight('bold');
        this.clearButton.setPosition(buttonX, clearButtonY);
        this.clearButton.setClickCallback(() => {
            if (this.currentMode === 'pen' && this.penCanvas) {
                // Clear the canvas
                this.penCanvas.clear();
            } else if (this.currentMode === 'text' && this.popupTextInput) {
                // Clear the text input
                this.popupTextInput.setText('');
            }
            // Also call the external clear callback if provided
            if (this.onClearCallback) {
                this.onClearCallback();
            }
        });
        this.popup.addChild(this.clearButton);
        
        // Submit button
        const submitButtonY = popupHeight - buttonSize - margin;
        this.submitButton = new jsvgButton();
        this.submitButton.setText("✓");
        this.submitButton.setWidthAndHeight(buttonSize, buttonSize);
        this.submitButton.setFillColor('#2ECC71');
        this.submitButton.setFontColor('white');
        this.submitButton.buttonText.setFontWeight('bold');
        this.submitButton.setPosition(buttonX, submitButtonY);
        this.submitButton.setClickCallback(() => {
            if (this.currentMode === 'pen' && this.penCanvas) {
                // For pen mode, transcribe the canvas first
                this._setSubmitButtonLoading(true);
                this._downloadCanvasAsBitmap();
            } else if (this.onValidateCallback) {
                // For text mode, validate directly
                this.onValidateCallback();
            }
        });
        this.popup.addChild(this.submitButton);
        
        // Mode buttons (P and T) - positioned in bottom left, aligned with other buttons
        const leftMargin = margin;
        
        // Text button (above pen button, aligned with clear button)
        this.textButton = new jsvgButton();
        this.textButton.setText("T");
        this.textButton.setWidthAndHeight(buttonSize, buttonSize);
        this.textButton.setFillColor('#28a745');
        this.textButton.setFontColor('white');
        this.textButton.buttonText.setFontWeight('bold');
        this.textButton.setPosition(leftMargin, clearButtonY);
        this.textButton.setClickCallback(() => {
            this.switchToMode('text');
        });
        this.popup.addChild(this.textButton);
        
        // Pen button (bottom, aligned with submit button)
        this.penButton = new jsvgButton();
        this.penButton.setText("");
        this.penButton.setWidthAndHeight(buttonSize, buttonSize);
        this.penButton.setFillColor('#007bff');
        this.penButton.setPosition(leftMargin, submitButtonY);
        this.penButton.setClickCallback(() => this.switchToMode('pen'));
        
        // Add pencil icon (same as canvas toolbar)
        const pencilIconSvg = `<svg width="12" height="12" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.3658 4.68008C13.7041 4.34179 13.8943 3.88294 13.8943 3.40447C13.8944 2.926 13.7044 2.4671 13.3661 2.12872C13.0278 1.79035 12.5689 1.60022 12.0905 1.60016C11.612 1.6001 11.1531 1.79011 10.8147 2.1284L2.27329 10.6718C2.12469 10.8199 2.0148 11.0023 1.95329 11.203L1.10785 13.9882C1.09131 14.0436 1.09006 14.1024 1.10423 14.1584C1.11841 14.2144 1.14748 14.2655 1.18836 14.3063C1.22924 14.3471 1.28041 14.3761 1.33643 14.3902C1.39246 14.4043 1.45125 14.403 1.50657 14.3863L4.29249 13.5415C4.49292 13.4806 4.67532 13.3713 4.82369 13.2234L13.3658 4.68008Z" stroke="white" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.41443 3.52039L11.9744 6.08039" stroke="white" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        const dataURI = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(pencilIconSvg);
        this.penButton.addImage(dataURI, 12, 12);
        
        this.popup.addChild(this.penButton);
    }
    
    /**
     * Creates the text input
     * @private
     */
    _createTextInput(popupWidth, popupHeight, margin) {
        const buttonAreaWidth = (this.buttonSize * 2) + (margin * 2) + this.margin;
        
        // Text input covers the middle area between the left and right button areas
        const inputWidth = popupWidth - buttonAreaWidth - (margin * 2);
        const inputHeight = popupHeight - (margin * 2);
        const inputX = this.buttonSize + (margin * 2);
        const inputY = margin;
        
        this.popupTextInput = new jsvgTextInput();
        this.popupTextInput.setWidthAndHeight(inputWidth, inputHeight);
        this.popupTextInput.setPosition(inputX, inputY);
        
        // Make background transparent/invisible
        this.popupTextInput.setFillColor('transparent');
        this.popupTextInput.setStrokeColor('transparent');
        this.popupTextInput.setStrokeWidth(0);
        this.popupTextInput.setPlaceholderText("");
        
        // Style the actual input for large centered text
        if (this.popupTextInput.div) {
            this.popupTextInput.div.style.border = 'none';
            this.popupTextInput.div.style.outline = 'none';
            this.popupTextInput.div.style.background = 'transparent';
            this.popupTextInput.div.style.textAlign = 'center';
            this.popupTextInput.div.style.fontSize = '48px';
            this.popupTextInput.div.style.fontFamily = 'Albert Sans, Arial, sans-serif';
            this.popupTextInput.div.style.resize = 'none';
            this.popupTextInput.div.style.width = '100%';
            this.popupTextInput.div.style.height = '100%';
            this.popupTextInput.div.style.display = 'flex';
            this.popupTextInput.div.style.alignItems = 'center';
            this.popupTextInput.div.style.justifyContent = 'center';
            this.popupTextInput.div.style.boxSizing = 'border-box';
        }
        
        // Add to popup in text mode
        this.popup.addChild(this.popupTextInput);
    }
    
    /**
     * Creates the pen canvas
     * @private
     */
    _createPenCanvas() {
        // Use class variables directly
        const popupWidth = this.popupWidth;
        const popupHeight = (this.targetNode?.height || this.targetNodeDefaultHeight) * this.popupHeightMultiplier;
        
        // Calculate canvas dimensions based on popup size
        const leftMargin = this.buttonSize;
        const rightMargin = 2 * this.buttonSize + this.buttonSpacing; // Space for buttons
        
        // Calculate canvas dimensions based on popup size
        const canvasWidth = Math.max(popupWidth - leftMargin - rightMargin, this.canvasMinWidth);
        
        // Calculate canvas height to fit in available space
        const buttonAreaHeight = (this.buttonSize * 2) + this.buttonSpacing + (this.margin * 2);
        const availableHeight = popupHeight - buttonAreaHeight;
        const canvasHeight = Math.max(availableHeight, this.canvasMinHeight);
        const canvasX = leftMargin;
        
        // Try to create a regular HTML container first (fallback approach)
        let canvasContainer;
        let foreignObject = null;
        
        // Check if we're in an SVG context
        if (this.parentElement && this.parentElement.element && 
            this.parentElement.element.namespaceURI === 'http://www.w3.org/2000/svg') {
            
            // Create an SVG foreignObject to embed HTML canvas
            foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            foreignObject.setAttribute('width', canvasWidth);
            foreignObject.setAttribute('height', canvasHeight);
            foreignObject.setAttribute('x', canvasX);
            foreignObject.setAttribute('y', this.canvasTopOffset);
            
            // Create the HTML container inside foreignObject
            canvasContainer = document.createElement('div');
            canvasContainer.style.width = `${canvasWidth}px`;
            canvasContainer.style.height = `${canvasHeight}px`;
            canvasContainer.style.border = '1px solid #ddd';
            canvasContainer.style.borderRadius = '4px';
            canvasContainer.style.backgroundColor = '#f8f9fa';
            canvasContainer.style.margin = '0';
            canvasContainer.style.padding = '0';
        
            // Add the container to foreignObject
            foreignObject.appendChild(canvasContainer);
        } else {
            // Create a regular HTML container
            canvasContainer = document.createElement('div');
            canvasContainer.style.width = `${canvasWidth}px`;
            canvasContainer.style.height = `${canvasHeight}px`;
            canvasContainer.style.position = 'absolute';
            canvasContainer.style.left = `${canvasX}px`;
            canvasContainer.style.top = `${this.canvasTopOffset}px`;
            canvasContainer.style.border = 'none'; // No border
            canvasContainer.style.borderRadius = '0px';
            canvasContainer.style.backgroundColor = '#ffffff'; // White background
            canvasContainer.style.zIndex = '1000';
            canvasContainer.style.pointerEvents = 'auto';
            canvasContainer.style.cursor = 'crosshair';
        }
        
        // Import our new modular canvas system
        import('../../canvas/index.js').then(({ createCanvas }) => {
            // Ensure we have valid positive dimensions
            const finalWidth = canvasWidth;
            const finalHeight = canvasHeight;
            
            // Create the canvas using our new system
            this.penCanvas = createCanvas(canvasContainer, {
                width: finalWidth - this.buttonSize,
                height: finalHeight,
                showToolbar: false,
                showGrid: false,
                backgroundColor: '#ffffff', // White background
                strokeWidth: 3,
                strokeColor: '#000000'
            });
            
            // Store the container and foreignObject references for cleanup
            this.penCanvas.container = canvasContainer;
            this.penCanvas.foreignObject = foreignObject;
            
            // Set pencil as the default tool
            this.penCanvas.toolManager.setActiveTool('pencil');
            
            // Cursor will be shown/hidden by EventManager based on mouse enter/leave
            
            // Add event listeners for debugging
            this.penCanvas.on('strokeStarted', (event) => {});
            this.penCanvas.on('strokeCompleted', (event) => {});
            
            // Add pointer event debugging
            canvasContainer.addEventListener('pointerdown', (e) => {});
            

            
            // Add click debugging
            canvasContainer.addEventListener('click', (e) => {});
            
        // Store cleanup function
        this.penCanvasCleanup = () => {
            if (this.penCanvas) {
                this.penCanvas.destroy();
            }
            if (foreignObject && foreignObject.parentNode) {
                foreignObject.parentNode.removeChild(foreignObject);
            } else if (canvasContainer && canvasContainer.parentNode) {
                canvasContainer.parentNode.removeChild(canvasContainer);
            }
            // Remove step visualizer listeners
            this._removeStepVisualizerListeners();
        };
        
        // Set up step visualizer change detection
        this._setupStepVisualizerListeners();            // If we're currently in pen mode, show the canvas
            if (this.currentMode === 'pen' && this.popup) {
                this._addCanvasToParent(foreignObject || canvasContainer);
            }
            
        }).catch(console.error);
    }
    
    /**
     * Shows pen mode
     * @private
     */
    _showPenMode() {
        // Hide text input by making it invisible instead of removing it
        if (this.popupTextInput && this.popupTextInput.div) {
            this.popupTextInput.div.style.display = 'none';
            this.popupTextInput.div.style.visibility = 'hidden';
        }
        
        // Create pen canvas if it doesn't exist
        if (!this.penCanvas) {
            this._createPenCanvas();
        } else {
            // Show existing canvas and ensure it's fully opaque
            const element = this.penCanvas.foreignObject || this.penCanvas.container;
            if (element) {
                element.style.display = 'block';
                element.style.opacity = '1'; // Ensure full opacity for stroke visibility
            }
            this._addCanvasToParent();
        }
    }
    
    /**
     * Shows text mode
     * @private
     */
    _showTextMode() {
        // Hide pen canvas by removing its element
        if (this.penCanvas) {
            const element = this.penCanvas.foreignObject || this.penCanvas.container;
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
        
        // Show text input and ensure it's visible and focused
        if (this.popupTextInput && this.popup) {
            // Make sure text input is visible
            if (this.popupTextInput.div) {
                this.popupTextInput.div.style.display = 'flex';
                this.popupTextInput.div.style.visibility = 'visible';
                this.popupTextInput.div.style.opacity = '1';
            }
            
            // Add to popup (jsvgLayoutGroup handles duplicates automatically)
            this.popup.addChild(this.popupTextInput);
            
            // Focus the text input after a short delay to ensure it's rendered
            setTimeout(() => {
                if (this.popupTextInput.div) {
                    this.popupTextInput.div.focus();
                }
            }, 100);
        }
    }
    
    /**
     * Adds canvas to parent element (same level as popup)
     * @private
     */
    _addCanvasToParent(element = null) {
        // If no element provided and canvas already exists, re-add it to parent
        if (!element && this.penCanvas && this.penCanvas.container) {
            // Re-add the canvas container to the parent
            if (this.penCanvas.container.parentNode) {
                this.penCanvas.container.parentNode.removeChild(this.penCanvas.container);
            }
            document.body.appendChild(this.penCanvas.container);
            this._updateCanvasPosition();
            return;
        }
        
        if (this.penCanvas && this.popup && this.parentElement) {
            const popupX = this.popup.xpos || 0;
            const popupY = this.popup.ypos || 0;
            
            // If we have an element to add
            if (element) {
                // Check if it's a foreignObject (SVG) or regular HTML element
                if (element.namespaceURI === 'http://www.w3.org/2000/svg') {
                    // SVG foreignObject
                    element.setAttribute('x', popupX + this.canvasLeftOffset);
                    element.setAttribute('y', popupY + this.canvasTopOffset);
                    
                    // Add the foreignObject to the parent element
                    if (this.parentElement.element) {
                        this.parentElement.element.appendChild(element);
                    } else if (this.parentElement.appendChild) {
                        this.parentElement.appendChild(element);
                    }
                } else {
                    // Regular HTML element
                    const popupRect = this.popup.svgObject ? this.popup.svgObject.getBoundingClientRect() : null;
                    
                    if (popupRect) {
                        // Calculate position to match popup exactly
                        const leftButtonArea = this.buttonSize + (this.margin * 2);
                        const rightButtonArea = (this.buttonSize * 2) + (this.margin * 2) + this.margin;
                        
                        // Position canvas in the middle content area
                        const absoluteX = popupRect.left + leftButtonArea;
                        const absoluteY = popupRect.top + this.margin;
                        
                        element.style.left = `${absoluteX}px`;
                        element.style.top = `${absoluteY}px`;
                        element.style.position = 'fixed';
                        element.style.zIndex = '9999';
                        element.style.pointerEvents = 'auto';
                        
                        // Set canvas size to match popup content area
                        const contentWidth = popupRect.width - leftButtonArea - rightButtonArea;
                        element.style.width = `${contentWidth}px`;
                        
                        // Store popup reference for resize handling
                        this.penCanvas.popupRect = popupRect;
                        
                        // Add resize observer to track popup changes
                        this._setupResizeObserver();
                        
                    } else {
                        // Fallback positioning
                        const absoluteX = (window.innerWidth - 280) / 2;
                        const absoluteY = (window.innerHeight - 60) / 2;
                        
                        element.style.left = `${absoluteX}px`;
                        element.style.top = `${absoluteY}px`;
                        element.style.position = 'fixed';
                        element.style.zIndex = '9999';
                        element.style.pointerEvents = 'auto';
                    }
                    
                    // Add to document body for HTML approach
                    document.body.appendChild(element);
                }
            }
        }
    }
    
    /**
     * Updates button visual states based on current mode
     * @private
     */
    _updateButtonStates() {
        if (!this.penButton || !this.textButton) return;
        
        if (this.currentMode === 'pen') {
            this.penButton.setFillColor('#2980B9'); // Darker blue for active
            this.textButton.setFillColor('#9B59B6'); // Normal purple
        } else {
            this.penButton.setFillColor('#3498DB'); // Normal blue
            this.textButton.setFillColor('#8E44AD'); // Darker purple for active
        }
    }
    
    /**
     * Positions the popup
     * @private
     */
    _positionPopup(x, y) {
        if (!this.popup) return;
        this.popup.setPosition(x, y);
    }
    
    /**
     * Animates popup opacity
     * @private
     */
    _animateOpacity(fromOpacity, toOpacity, duration) {
        return new Promise((resolve) => {
            if (!this.popup) {
                resolve();
                return;
            }
            
            if (this.popupAnimationId) {
                cancelAnimationFrame(this.popupAnimationId);
            }
            
            const startTime = performance.now();
            const deltaOpacity = toOpacity - fromOpacity;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const currentOpacity = fromOpacity + (deltaOpacity * easedProgress);
                
                // Animate popup
                this.popup.setOpacity(currentOpacity);
                
                // Animate canvas with same opacity if it exists
                if (this.penCanvas && this.penCanvas.container && this.currentMode === 'pen') {
                    this.penCanvas.container.style.opacity = currentOpacity;
                }
                
                if (progress < 1) {
                    this.popupAnimationId = requestAnimationFrame(animate);
                } else {
                    this.popupAnimationId = null;
                    // Ensure canvas is fully opaque when animation completes
                    if (this.penCanvas && this.penCanvas.container && this.currentMode === 'pen') {
                        this.penCanvas.container.style.opacity = '1';
                    }
                    resolve();
                }
            };
            
            this.popupAnimationId = requestAnimationFrame(animate);
        });
    }
    
    /**
     * Flashes the popup background to indicate validation result
     * @param {boolean} isValid - Whether validation was successful
     */
    flashValidation(isValid) {
        if (!this.popupBackground) return;
        
        const flashColor = isValid ? '#E8F5E8' : '#FFE6E6';
        this._flashAllElements(flashColor);
    }
    
    /**
     * Flash all elements with the same color and return to white
     * @private
     */
    _flashAllElements(flashColor) {
        // Flash popup background
        this.popupBackground.setFillColor(flashColor);
        
        // Flash canvas container
        if (this.penCanvas && this.penCanvas.container) {
            this.penCanvas.container.style.backgroundColor = flashColor;
        }
        
        // Flash canvas drawing area
        if (this.penCanvas && this.penCanvas.svg) {
            this.penCanvas.svg.style.backgroundColor = flashColor;
        }
        
        // Return all elements to white after 300ms
        setTimeout(() => {
            this.popupBackground.setFillColor('white');
            
            if (this.penCanvas && this.penCanvas.container) {
                this.penCanvas.container.style.backgroundColor = 'white';
            }
            
            if (this.penCanvas && this.penCanvas.svg) {
                this.penCanvas.svg.style.backgroundColor = 'white';
            }
        }, 300);
    }
    
    /**
     * Checks if two mathematical expressions are equivalent
     * @param {string} expr1 - First expression
     * @param {string} expr2 - Second expression
     * @returns {boolean} True if expressions are mathematically equivalent
     */
    areExpressionsEquivalent(expr1, expr2) {
        // Robust equivalence: compare evaluated results for random variable assignments
        if (!window.math || !window.math.simplify || !window.math.parse) {
            return false;
        }
        try {
            const expr1Trimmed = expr1.trim();
            const expr2Trimmed = expr2.trim();
            const node1 = window.math.simplify(expr1Trimmed);
            const node2 = window.math.simplify(expr2Trimmed);

            // If ASTs match, return true
            if (node1.equals(node2)) return true;

            // Otherwise, compare evaluated results for random variable assignments
            // Find all variable names
            const getVars = expr => {
                const node = window.math.parse(expr);
                const vars = new Set();
                node.traverse(n => {
                    if (n.isSymbolNode) vars.add(n.name);
                });
                return Array.from(vars);
            };
            const vars = Array.from(new Set([...getVars(expr1Trimmed), ...getVars(expr2Trimmed)]));
            if (vars.length === 0) {
                // No variables, just compare evaluated results
                return node1.evaluate() === node2.evaluate();
            }
            // Try several random assignments
            for (let i = 0; i < 100; i++) {
                const scope = {};
                for (const v of vars) {
                    scope[v] = Math.floor(Math.random() * 1000 + 1); // random int 1-10
                }
                const val1 = node1.evaluate(scope);
                const val2 = node2.evaluate(scope);
                if (Math.abs(val1 - val2) > 1e-9) return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Cleanup popup and all associated elements
     * @private
     */
    _cleanup() {
        if (this.popup && this.parentElement) {
            this.parentElement.removeChild(this.popup);
        }
        
        // Remove pen canvas from parent if it exists
        if (this.penCanvas) {
            // Remove both foreignObject and container if they exist
            if (this.penCanvas.foreignObject && this.penCanvas.foreignObject.parentNode) {
                this.penCanvas.foreignObject.parentNode.removeChild(this.penCanvas.foreignObject);
            }
            
            if (this.penCanvas.container && this.penCanvas.container.parentNode) {
                this.penCanvas.container.parentNode.removeChild(this.penCanvas.container);
            }
        }
        
        // Clean up pen canvas
        if (this.penCanvasCleanup) {
            this.penCanvasCleanup();
            this.penCanvasCleanup = null;
        }
        
        // Clean up resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // Clean up step visualizer listeners
        this._removeStepVisualizerListeners();
        
        // Clean up animation
        if (this.popupAnimationId) {
            cancelAnimationFrame(this.popupAnimationId);
            this.popupAnimationId = null;
        }
        
        // Reset all references
        this.popup = null;
        this.popupBackground = null;
        this.popupTextInput = null;
        this.penCanvas = null;
        this.penButton = null;
        this.textButton = null;
        this.clearButton = null;
        this.submitButton = null;
    }
    
    /**
     * Destroys the popup completely
     */
    destroy() {
        return this.hide();
    }
    
    /**
     * Debug function to test canvas positioning
     */
    debugCanvasPosition() {
        if (this.penCanvas && this.penCanvas.container) {
            const container = this.penCanvas.container;
            // Flash the border to make it visible
            container.style.border = '3px solid #00ff00';
            setTimeout(() => {
                container.style.border = '2px solid #ff0000';
            }, 1000);
        }
    }
    
    /**
     * Reposition canvas to center of screen
     */
    centerCanvas() {
        if (this.penCanvas && this.penCanvas.container) {
            const container = this.penCanvas.container;
            const centerX = (window.innerWidth - 280) / 2;
            const centerY = (window.innerHeight - 60) / 2;
            container.style.left = `${centerX}px`;
            container.style.top = `${centerY}px`;
        }
    }
    
    /**
     * Setup resize observer to track popup changes
     * @private
     */
    _setupResizeObserver() {
        if (!this.penCanvas || !this.popup || !this.popup.svgObject) return;
        
        // Create a resize observer to track popup changes
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this._updateCanvasPosition();
            }
        });
        
        // Observe the popup element
        this.resizeObserver.observe(this.popup.svgObject);
        
        // Also observe the parent element for position changes
        if (this.parentElement && this.parentElement.svgObject) {
            this.resizeObserver.observe(this.parentElement.svgObject);
        }
        
        // Also observe the document body for zoom changes
        this.resizeObserver.observe(document.body);
    }
    
    /**
     * Setup step visualizer listeners to track expand/collapse
     * @private
     */
    _setupStepVisualizerListeners() {
        if (!this.penCanvas) return;
        
        // Listen for step visualizer events that might change layout
        this._stepVisualizerUpdateHandler = () => {
            console.log('[Step Visualizer Debug] Layout change detected, updating canvas position');
            // Small delay to allow layout to settle
            setTimeout(() => this._updateCanvasPosition(), 50);
        };
        
        // Listen for various events that might indicate step visualizer changes
        document.addEventListener('click', this._stepVisualizerUpdateHandler);
        window.addEventListener('resize', this._stepVisualizerUpdateHandler);
        
        // Listen for custom step visualizer events if they exist
        if (this.parentElement && this.parentElement.element) {
            this.parentElement.element.addEventListener('stepVisualizerChanged', this._stepVisualizerUpdateHandler);
        }
        
        // Set up mutation observer to detect DOM changes in step visualizer
        if (this.parentElement && this.parentElement.element) {
            this._mutationObserver = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                for (const mutation of mutations) {
                    // Check if any changes might affect layout
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || 
                         mutation.attributeName === 'class' ||
                         mutation.attributeName === 'transform')) {
                        console.log('[Step Visualizer Debug] Mutation detected:', mutation.attributeName, mutation.target);
                        shouldUpdate = true;
                        break;
                    }
                    if (mutation.type === 'childList' && 
                        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                        console.log('[Step Visualizer Debug] Child list mutation detected');
                        shouldUpdate = true;
                        break;
                    }
                }
                if (shouldUpdate) {
                    setTimeout(() => this._updateCanvasPosition(), 10);
                }
            });
            
            // Observe the parent element and its children
            this._mutationObserver.observe(this.parentElement.element, {
                childList: true,
                attributes: true,
                subtree: true,
                attributeFilter: ['style', 'class', 'transform', 'viewBox']
            });
        }
    }
    
    /**
     * Remove step visualizer listeners
     * @private
     */
    _removeStepVisualizerListeners() {
        if (this._stepVisualizerUpdateHandler) {
            document.removeEventListener('click', this._stepVisualizerUpdateHandler);
            window.removeEventListener('resize', this._stepVisualizerUpdateHandler);
            
            if (this.parentElement && this.parentElement.element) {
                this.parentElement.element.removeEventListener('stepVisualizerChanged', this._stepVisualizerUpdateHandler);
            }
            
            this._stepVisualizerUpdateHandler = null;
        }
        
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }
    }
    
    /**
     * Update canvas position to match popup
     * @private
     */
    _updateCanvasPosition() {
        if (!this.penCanvas || !this.penCanvas.container || !this.popup) return;
        
        const container = this.penCanvas.container;
        const popupRect = this.popup.svgObject ? this.popup.svgObject.getBoundingClientRect() : null;
        
        console.log('[Canvas Position Debug] Update triggered:', {
            hasCanvas: !!this.penCanvas,
            hasContainer: !!container,
            strokeCount: this.penCanvas?.strokes?.size || 0,
            popupRect: popupRect ? `${popupRect.width}x${popupRect.height}` : 'null'
        });
        
        if (popupRect && popupRect.width > 0 && popupRect.height > 0) {
            // Calculate button areas based on popup dimensions
            const leftButtonArea = this.buttonSize + (this.margin * 2);
            const rightButtonArea = (this.buttonSize * 2) + (this.margin * 2) + this.margin;
            
            // Calculate content area within popup
            const contentWidth = Math.max(popupRect.width - leftButtonArea - rightButtonArea, this.canvasMinWidth);
            const contentHeight = Math.max(popupRect.height - (this.margin * 2) - (this.buttonSize * 2) - this.buttonSpacing, this.canvasMinHeight);
            
            // Position canvas within popup bounds
            const absoluteX = popupRect.left + leftButtonArea;
            const absoluteY = popupRect.top + this.margin;
            
            // Ensure canvas doesn't exceed popup bounds
            const maxWidth = popupRect.width - leftButtonArea - rightButtonArea;
            const maxHeight = popupRect.height - (this.margin * 2) - (this.buttonSize * 2) - this.buttonSpacing;
            
            const finalWidth = Math.min(Math.max(contentWidth, this.canvasMinWidth), maxWidth);
            const finalHeight = Math.min(Math.max(contentHeight, this.canvasMinHeight), maxHeight);
            
            console.log('[Canvas Position Debug] Moving canvas:', {
                from: `${container.style.left}, ${container.style.top}`,
                to: `${absoluteX}px, ${absoluteY}px`,
                size: `${finalWidth}x${finalHeight}`
            });
            
            container.style.left = `${absoluteX}px`;
            container.style.top = `${absoluteY}px`;
            container.style.width = `${finalWidth}px`;
            container.style.height = `${finalHeight}px`;
            
            // Check stroke count after move
            setTimeout(() => {
                console.log('[Canvas Position Debug] After move stroke count:', this.penCanvas?.strokes?.size || 0);
            }, 50);
        }
    }
    
    /**
     * Download canvas as bitmap and transcribe
     * @private
     */
    async _downloadCanvasAsBitmap() {
        if (!this.penCanvas) {
            return;
        }
        try {
            // Get the canvas SVG element
            const svgElement = this.penCanvas.svg;
            if (!svgElement) {
                return;
            }
            
            // Create a canvas element for conversion
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match SVG
            const svgRect = svgElement.getBoundingClientRect();
            canvas.width = svgRect.width;
            canvas.height = svgRect.height;
            
            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            // Create an image from the SVG
            const img = new Image();
            img.onload = async () => {
                // Draw the image to canvas
                ctx.drawImage(img, 0, 0);
                
                // Convert to blob and transcribe (no download)
                canvas.toBlob(async (blob) => {
                    URL.revokeObjectURL(url);
                    await this._transcribeCanvas(blob);
                }, 'image/png');
            };
            
            img.src = url;
            
        } catch (error) {
        }
    }
    
    /**
     * Transcribe canvas content
     * @private
     */
    async _transcribeCanvas(imageBlob) {
        try {
            // Import transcription service
            const { omdTranscriptionService } = await import('./omdTranscriptionService.js');
            // Create transcription service instance (no API keys needed - server handles them)
            const transcriptionService = new omdTranscriptionService({
                defaultProvider: 'gemini'
            });

            // Check if service is available
            if (!transcriptionService.isAvailable()) {
                return;
            }
            
            // Transcribe with fallback
            const result = await transcriptionService.transcribeWithFallback(imageBlob, {
                prompt: 'Transcribe this handwritten mathematical expression. Return ONLY the pure mathematical expression with no formatting, no LaTeX, no dollar signs, no explanations. Use ^ for powers (e.g., 3^2), use / for fractions (e.g., (2x+1)/(x-3)), use * for multiplication, use + and - for addition/subtraction. Return only the expression.'
            });

            if (result.text) {
                this._setSubmitButtonLoading(false);
                this.flashValidation(true);
                this.transcribedText = result.text;
                if (this.onValidateCallback) {
                    this.onValidateCallback();
                }
            } else {
                this._setSubmitButtonLoading(false);
            }
        } catch (error) {
            this.flashValidation(false);
            this._setSubmitButtonLoading(false);
        }
    }
    
    /**
     * Set submit button loading state
     * @private
     */
    _setSubmitButtonLoading(isLoading) {
        if (!this.submitButton) return;
        
        if (isLoading) {
            // Start blinking animation
            this._startBlinkingAnimation();
        } else {
            // Stop blinking and restore original state
            this._stopBlinkingAnimation();
            this.submitButton.setText("✓");
            this.submitButton.setFillColor('#2ECC71');
            this.submitButton.setFontColor('white');
        }
    }
    
    /**
     * Start blinking animation for submit button
     * @private
     */
    _startBlinkingAnimation() {
        if (!this.submitButton) return;
        
        let isOrange = true;
        const blink = () => {
            if (isOrange) {
                this.submitButton.setFillColor('#FFA500'); // Orange
            } else {
                this.submitButton.setFillColor('#2ECC71'); // Green
            }
            isOrange = !isOrange;
            
            this.blinkAnimationId = setTimeout(blink, 300); // Blink every 300ms
        };
        
        // Start blinking immediately
        blink();
    }
    
    /**
     * Stop blinking animation for submit button
     * @private
     */
    _stopBlinkingAnimation() {
        if (this.blinkAnimationId) {
            clearTimeout(this.blinkAnimationId);
            this.blinkAnimationId = null;
        }
    }
    
    /**
     * Reposition canvas relative to popup
     */
    repositionCanvasRelativeToPopup() {
        this._updateCanvasPosition();
    }
}