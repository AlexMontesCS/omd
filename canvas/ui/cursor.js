export class Cursor {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.isVisible = true;
        this.currentShape = 'pencil';
        this.size = 20;
        this.color = '#007bff';
        
        // Create cursor element
        this._createElement();
        
        // Add to UI layer
        this.canvas.uiLayer.appendChild(this.element);
    }
    
    /**
     * Create the cursor SVG element
     * @private
     */
    _createElement() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'omd-cursor');
        this.element.style.pointerEvents = 'none';
        this.element.style.opacity = '0.8';
        
        // Create different cursor shapes
        this._createShapes();
        
        // Initially hidden
        this.hide();
    }
    
    /**
     * Create different cursor shape elements
     * @private
     */
    _createShapes() {
        this.shapes = {};
        
        // Default cursor (crosshair)
        this.shapes.default = this._createCrosshair();
        
        // Pointer cursor (arrow)
        this.shapes.pointer = this._createPointerCursor();
        
        // Pencil cursor
        this.shapes.pencil = this._createPencilCursor();
        
        // Eraser cursor
        this.shapes.eraser = this._createEraserCursor();
        
        // Select cursor
        this.shapes.select = this._createSelectCursor();
        
        // Add all shapes to cursor element
        Object.values(this.shapes).forEach(shape => {
            this.element.appendChild(shape);
        });
        
        // Show pencil (blue dot) shape initially so the first visible cursor is always a dot
        this.setShape('pencil');
    }
    
    /**
     * Create crosshair cursor
     * @private
     */
    _createCrosshair() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-shape', 'default');
        
        // Horizontal line
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', '-10');
        hLine.setAttribute('y1', '0');
        hLine.setAttribute('x2', '10');
        hLine.setAttribute('y2', '0');
        hLine.setAttribute('stroke', this.color);
        hLine.setAttribute('stroke-width', '1');
        
        // Vertical line
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', '0');
        vLine.setAttribute('y1', '-10');
        vLine.setAttribute('x2', '0');
        vLine.setAttribute('y2', '10');
        vLine.setAttribute('stroke', this.color);
        vLine.setAttribute('stroke-width', '1');
        
        group.appendChild(hLine);
        group.appendChild(vLine);
        
        return group;
    }
    
    /**
     * Create pencil cursor
     * @private
     */
    _createPencilCursor() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-shape', 'pencil');
        
        // Solid dot cursor
        this.brushCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.brushCircle.setAttribute('cx', '0');
        this.brushCircle.setAttribute('cy', '0');
        this.brushCircle.setAttribute('r', this.size / 2);
        this.brushCircle.setAttribute('fill', this.color);
        this.brushCircle.setAttribute('stroke', 'none');
        
        group.appendChild(this.brushCircle);
        
        return group;
    }
    
    /**
     * Create eraser cursor
     * @private
     */
    _createEraserCursor() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-shape', 'eraser');
        
        // Circle eraser indicator
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', this.size / 2);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#dc3545');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('class', 'eraser-circle');
        
        // Mode indicator (inner fill for radius mode)
        const modeIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        modeIndicator.setAttribute('r', this.size / 3);
        modeIndicator.setAttribute('fill', 'rgba(220, 53, 69, 0.15)');
        modeIndicator.setAttribute('class', 'eraser-mode-indicator');
        modeIndicator.style.display = 'none';
        
        // X mark inside (for stroke mode)
        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', -this.size / 5);
        line1.setAttribute('y1', -this.size / 5);
        line1.setAttribute('x2', this.size / 5);
        line1.setAttribute('y2', this.size / 5);
        line1.setAttribute('stroke', '#dc3545');
        line1.setAttribute('stroke-width', '1.5');
        line1.setAttribute('class', 'eraser-x1');
        
        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', this.size / 5);
        line2.setAttribute('y1', -this.size / 5);
        line2.setAttribute('x2', -this.size / 5);
        line2.setAttribute('y2', this.size / 5);
        line2.setAttribute('stroke', '#dc3545');
        line2.setAttribute('stroke-width', '1.5');
        line2.setAttribute('class', 'eraser-x2');
        
        group.appendChild(circle);
        group.appendChild(modeIndicator);
        group.appendChild(line1);
        group.appendChild(line2);
        
        return group;
    }
    
    /**
     * Create select cursor
     * @private
     */
    _createSelectCursor() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-shape', 'select');
        
        // Classic arrow cursor for selection tool
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 2,2 L 2,16 L 7,11 L 10,18 L 12,17 L 9,10 L 16,10 Z');
        path.setAttribute('fill', 'white');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '1.2');
        path.setAttribute('stroke-linejoin', 'round');
        
        group.appendChild(path);
        
        return group;
    }
    
    /**
     * Create pointer cursor (standard arrow)
     * @private
     */
    _createPointerCursor() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-shape', 'pointer');
        
        // Use the same pointer cursor as the toolbar icon
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M1.63448 2.04462C1.60922 1.98633 1.60208 1.92179 1.61397 1.85938C1.62585 1.79697 1.65623 1.73958 1.70116 1.69466C1.74608 1.64973 1.80347 1.61935 1.86588 1.60747C1.92829 1.59558 1.99283 1.60272 2.05112 1.62798L12.2911 5.78798C12.3534 5.81335 12.4061 5.85768 12.4417 5.91469C12.4774 5.9717 12.4941 6.03849 12.4897 6.10557C12.4852 6.17266 12.4597 6.23663 12.4169 6.28842C12.374 6.3402 12.3159 6.37717 12.2508 6.39406L8.33144 7.40526C8.11 7.46219 7.90784 7.5774 7.74599 7.73891C7.58415 7.90042 7.46852 8.10234 7.41112 8.32366L6.40056 12.2443C6.38367 12.3094 6.3467 12.3675 6.29492 12.4104C6.24313 12.4532 6.17916 12.4787 6.11207 12.4832C6.04499 12.4876 5.9782 12.4709 5.92119 12.4352C5.86419 12.3996 5.81985 12.3469 5.79448 12.2846L1.63448 2.04462Z');
        path.setAttribute('fill', 'white');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '1.28');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        group.appendChild(path);
        
        return group;
    }
    
    /**
     * Set cursor shape
     * @param {string} shape - Shape name ('default', 'pencil', 'eraser', 'select')
     */
    setShape(shape) {
        this.currentShape = shape;
        
        // Hide all shapes
        Object.values(this.shapes).forEach(shapeElement => {
            shapeElement.style.display = 'none';
        });
        
        // Show current shape
        if (this.shapes[shape]) {
            this.shapes[shape].style.display = 'block';
        } else {
            this.shapes.default.style.display = 'block';
        }
        
        // Update brush size for pencil
        if (shape === 'pencil' && this.brushCircle) {
            this._updateBrushSize();
        }
    }
    
    /**
     * Set cursor position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setPosition(x, y) {
        this.element.setAttribute('transform', `translate(${x}, ${y})`);
    }
    
    /**
     * Show cursor
     */
    show() {
        this.isVisible = true;
        this.element.style.display = 'block';
    }
    
    /**
     * Hide cursor
     */
    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
    }
    
    /**
     * Set cursor size (for tools that support it)
     * @param {number} size - Cursor size
     */
    setSize(size) {
        this.size = size;
        this._updateBrushSize();
    }
    
    /**
     * Update brush size for pencil cursor
     * @private
     */
    _updateBrushSize() {
        if (this.brushCircle) {
            this.brushCircle.setAttribute('r', this.size / 2);
        }
        
        // Update eraser size if applicable
        const eraserShape = this.shapes.eraser;
        if (eraserShape) {
            const circle = eraserShape.querySelector('.eraser-circle');
            const modeIndicator = eraserShape.querySelector('.eraser-mode-indicator');
            const x1 = eraserShape.querySelector('.eraser-x1');
            const x2 = eraserShape.querySelector('.eraser-x2');
            
            if (circle) {
                circle.setAttribute('r', this.size / 2);
            }
            if (modeIndicator) {
                modeIndicator.setAttribute('r', this.size / 3);
            }
            if (x1) {
                x1.setAttribute('x1', -this.size / 5);
                x1.setAttribute('y1', -this.size / 5);
                x1.setAttribute('x2', this.size / 5);
                x1.setAttribute('y2', this.size / 5);
            }
            if (x2) {
                x2.setAttribute('x1', this.size / 5);
                x2.setAttribute('y1', -this.size / 5);
                x2.setAttribute('x2', -this.size / 5);
                x2.setAttribute('y2', this.size / 5);
            }
        }
    }
    
    /**
     * Set cursor color
     * @param {string} color - CSS color value
     */
    setColor(color) {
        this.color = color;
        
        // Update all shape colors
        this.element.querySelectorAll('[stroke]').forEach(element => {
            if (element.getAttribute('stroke') === this.color) {
                element.setAttribute('stroke', color);
            }
        });
        
        this.element.querySelectorAll('[fill]').forEach(element => {
            if (element.getAttribute('fill') === this.color) {
                element.setAttribute('fill', color);
            }
        });
    }
    
    /**
     * Set cursor opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setOpacity(opacity) {
        this.element.style.opacity = opacity;
    }
    
    /**
     * Enable pressure feedback (for pressure-sensitive devices)
     * @param {number} pressure - Pressure value (0-1)
     */
    setPressureFeedback(pressure) {
        if (this.currentShape === 'pencil' && this.brushCircle) {
            // Scale brush circle based on pressure
            const scale = 0.5 + (pressure * 0.5); // Scale from 50% to 100%
            this.brushCircle.setAttribute('transform', `scale(${scale})`);
            
            // Adjust opacity based on pressure
            const opacity = 0.3 + (pressure * 0.5); // Opacity from 30% to 80%
            this.brushCircle.style.opacity = opacity;
        }
    }
    
    /**
     * Add temporary visual feedback
     * @param {string} type - Feedback type ('success', 'error', 'info')
     * @param {number} [duration=500] - Duration in milliseconds
     */
    showFeedback(type, duration = 500) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        const originalColor = this.color;
        this.setColor(colors[type] || colors.info);
        
        // Pulse animation
        this.element.style.animation = 'pulse 0.3s ease-in-out';
        
        setTimeout(() => {
            this.setColor(originalColor);
            this.element.style.animation = '';
        }, duration);
    }
    
    /**
     * Update cursor based on tool configuration
     * @param {Object} toolConfig - Tool configuration
     */
    updateFromToolConfig(toolConfig) {
        if (toolConfig.strokeWidth) {
            // Scale the cursor size for better visibility - multiply by 4 for pencil to make it clearly visible
            const scaledSize = this.currentShape === 'pencil' ? toolConfig.strokeWidth * 4 : toolConfig.strokeWidth;
            this.setSize(scaledSize);
        }
        
        if (toolConfig.strokeColor) {
            this.setColor(toolConfig.strokeColor);
        }
        
        if (toolConfig.size) {
            this.setSize(toolConfig.size);
        }
        
        // Update eraser mode indicator
        if (toolConfig.mode !== undefined && this.currentShape === 'eraser') {
            this._updateEraserMode(toolConfig.mode);
        }
    }
    
    /**
     * Update eraser mode visual indicator
     * @private
     */
    _updateEraserMode(mode) {
        const eraserShape = this.shapes.eraser;
        if (!eraserShape) return;
        
        const circle = eraserShape.querySelector('.eraser-circle');
        const modeIndicator = eraserShape.querySelector('.eraser-mode-indicator');
        const x1 = eraserShape.querySelector('.eraser-x1');
        const x2 = eraserShape.querySelector('.eraser-x2');
        
        if (mode === 'radius') {
            // Radius mode: show filled circle, hide X, use orange color
            if (circle) {
                circle.setAttribute('stroke', '#ff9f43');
                circle.setAttribute('stroke-dasharray', '3,3');
            }
            if (modeIndicator) {
                modeIndicator.style.display = 'block';
                modeIndicator.setAttribute('fill', 'rgba(255, 159, 67, 0.3)');
            }
            if (x1) x1.style.display = 'none';
            if (x2) x2.style.display = 'none';
        } else {
            // Stroke mode: show X, hide fill, use red color
            if (circle) {
                circle.setAttribute('stroke', '#dc3545');
                circle.setAttribute('stroke-dasharray', 'none');
            }
            if (modeIndicator) {
                modeIndicator.style.display = 'none';
            }
            if (x1) x1.style.display = 'block';
            if (x2) x2.style.display = 'block';
        }
    }
    
    /**
     * Get current cursor state
     * @returns {Object} Cursor state
     */
    getState() {
        return {
            isVisible: this.isVisible,
            shape: this.currentShape,
            size: this.size,
            color: this.color
        };
    }
    
    /**
     * Clean up cursor resources
     */
    destroy() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    /**
     * Reattach the cursor element to a specific parent so it can sit above other SVG UI.
     * @param {SVGElement} parent
     */
    attachTo(parent) {
        if (!parent || !this.element) return;
        parent.appendChild(this.element);
    }
} 