/**
 * Manages resize handles for OMD visuals
 * Provides functionality for creating, positioning, and handling resize operations
 */
export class ResizeHandleManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.selectedElement = null;
        this.handles = [];
        this.isResizing = false;
        this.resizeData = null;
        
        // Handle configuration
        this.handleSize = 8;
        this.handleColor = '#007bff';
        this.handleStrokeColor = '#ffffff';
        this.handleStrokeWidth = 1;
        
        // Selection border config
        this.selectionBorderColor = '#007bff';
        this.selectionBorderWidth = 2;
        this.selectionBorder = null;
        this.selectionBorderPadding = { top: 8, right: 8, bottom: 8, left: 8 };
        
        // Resize constraints
        this.minSize = 20;
        this.maxSize = 800;
        this.maintainAspectRatio = true; // Always maintain aspect ratio by default
    }
    
    /**
     * Select an OMD visual element and show resize handles
     * @param {SVGElement} element - The OMD wrapper element to select
     */
    selectElement(element) {
        this.clearSelection();
        
        if (!element || !element.classList.contains('omd-item')) {
            return;
        }

        if (element?.dataset?.locked === 'true') {
            return;
        }
        
        this.selectedElement = element;
        this._createSelectionBorder();
        this._createResizeHandles();
        this._updateHandlePositions();
        
        // Add selected class for CSS styling
        element.classList.add('omd-selected');
        
        // Emit selection event
        this.canvas.emit('omdElementSelected', { element });
    }
    
    /**
     * Clear current selection and remove all handles
     */
    clearSelection() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('omd-selected');
            this.selectedElement = null;
        }
        
        this._removeSelectionBorder();
        this._removeResizeHandles();
        this.isResizing = false;
        this.resizeData = null;
        
        // Emit deselection event
        this.canvas.emit('omdElementDeselected');
    }
    
    /**
     * Check if a point is over a resize handle
     * @param {number} x - X coordinate in canvas coordinates
     * @param {number} y - Y coordinate in canvas coordinates
     * @returns {Object|null} Handle data if hit, null otherwise
     */
    getHandleAtPoint(x, y) {
        const tolerance = this.handleSize / 2 + 3; // Slightly larger hit area
        
        for (const handle of this.handles) {
            // Get handle position from its attributes
            const handleX = parseFloat(handle.element.getAttribute('x')) + this.handleSize / 2;
            const handleY = parseFloat(handle.element.getAttribute('y')) + this.handleSize / 2;
            
            const distance = Math.hypot(x - handleX, y - handleY);
            if (distance <= tolerance) {
                return handle;
            }
        }
        return null;
    }
    
    /**
     * Start resize operation
     * @param {Object} handle - Handle data
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {boolean} maintainAspectRatio - Whether to maintain aspect ratio
     */
    startResize(handle, startX, startY, maintainAspectRatio = false) {
        if (!this.selectedElement || !handle) return;
        
        this.isResizing = true;
        this.maintainAspectRatio = maintainAspectRatio;
        
        // Get current transform and bounds
        const transform = this.selectedElement.getAttribute('transform') || 'translate(0,0)';
        const match = transform.match(/translate\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
        const currentX = match ? parseFloat(match[1]) : 0;
        const currentY = match ? parseFloat(match[2]) : 0;
        
        // Get current scale
        const scaleMatch = transform.match(/scale\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/);
        const currentScaleX = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        const currentScaleY = scaleMatch ? (scaleMatch[2] ? parseFloat(scaleMatch[2]) : currentScaleX) : 1;
        
        // Get bounding box of the content
        const bbox = this._getElementBounds();
        
        this.resizeData = {
            handle,
            startX,
            startY,
            originalTransform: transform,
            currentX,
            currentY,
            currentScaleX,
            currentScaleY,
            originalBounds: bbox,
            startWidth: bbox.width * currentScaleX,
            startHeight: bbox.height * currentScaleY
        };
        
        // Add resizing class
        this.selectedElement.classList.add('omd-resizing');
    }
    
    /**
     * Update resize operation
     * @param {number} currentX - Current X coordinate  
     * @param {number} currentY - Current Y coordinate
     */
    updateResize(currentX, currentY) {
        if (!this.isResizing || !this.resizeData) return;
        
        const { handle, startX, startY, originalBounds, startWidth, startHeight } = this.resizeData;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let offsetX = 0;
        let offsetY = 0;
        
        // Calculate new dimensions based on handle type
        switch (handle.type) {
            case 'nw': // Top-left corner
                newWidth = startWidth - deltaX;
                newHeight = startHeight - deltaY;
                offsetX = deltaX;
                offsetY = deltaY;
                break;
            case 'ne': // Top-right corner
                newWidth = startWidth + deltaX;
                newHeight = startHeight - deltaY;
                offsetY = deltaY;
                break;
            case 'sw': // Bottom-left corner
                newWidth = startWidth - deltaX;
                newHeight = startHeight + deltaY;
                offsetX = deltaX;
                break;
            case 'se': // Bottom-right corner
                newWidth = startWidth + deltaX;
                newHeight = startHeight + deltaY;
                break;
            case 'n': // Top edge
                newHeight = startHeight - deltaY;
                offsetY = deltaY;
                break;
            case 's': // Bottom edge
                newHeight = startHeight + deltaY;
                break;
            case 'w': // Left edge
                newWidth = startWidth - deltaX;
                offsetX = deltaX;
                break;
            case 'e': // Right edge
                newWidth = startWidth + deltaX;
                break;
        }
        
        // Maintain aspect ratio — use the larger delta to drive the resize
        if (this.maintainAspectRatio) {
            const aspectRatio = startWidth / startHeight;
            const widthChange = Math.abs(newWidth - startWidth);
            const heightChange = Math.abs(newHeight - startHeight);

            if (widthChange >= heightChange) {
                newHeight = newWidth / aspectRatio;
                // Correct offsetY for top-anchored corners
                if (handle.type.includes('n')) {
                    offsetY = startHeight - newHeight;
                }
            } else {
                newWidth = newHeight * aspectRatio;
                // Correct offsetX for left-anchored corners
                if (handle.type.includes('w')) {
                    offsetX = startWidth - newWidth;
                }
            }
        }
        
        // Apply size constraints
        newWidth = Math.max(this.minSize, Math.min(this.maxSize, newWidth));
        newHeight = Math.max(this.minSize, Math.min(this.maxSize, newHeight));
        
        // Calculate scale factors
        const scaleX = newWidth / originalBounds.width;
        const scaleY = newHeight / originalBounds.height;
        
        // Calculate new position
        const newX = this.resizeData.currentX + offsetX;
        const newY = this.resizeData.currentY + offsetY;
        
        // Apply transform
        this.selectedElement.setAttribute('transform', 
            `translate(${newX}, ${newY}) scale(${scaleX}, ${scaleY})`);
        
        // Update handle positions
        this._updateHandlePositions();
        this._updateSelectionBorder();
    }
    
    /**
     * Finish resize operation
     */
    finishResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        
        if (this.selectedElement) {
            this.selectedElement.classList.remove('omd-resizing');
        }
        
        // Update handle positions after resize is complete
        this._updateHandlePositions();
        this._updateSelectionBorder();
        
        // Emit resize complete event
        this.canvas.emit('omdElementResized', { 
            element: this.selectedElement,
            transform: this.selectedElement.getAttribute('transform')
        });
        
        this.resizeData = null;
    }
    
    /**
     * Style the selection border.
     * @param {Object} style
     * @param {string}  [style.color]       - Stroke colour of the border (e.g. '#007bff')
     * @param {number}  [style.width]       - Stroke width in px
     * @param {string}  [style.dasharray]   - SVG stroke-dasharray value (e.g. '4,2' or 'none')
     * @param {number}  [style.cornerRadius]- rx/ry corner radius of the border rect
     */
    setSelectionStyle({ color, width, dasharray, cornerRadius, padding, paddingX, paddingY, paddingTop, paddingRight, paddingBottom, paddingLeft } = {}) {
        if (color !== undefined)       this.selectionBorderColor = color;
        if (width !== undefined)       this.selectionBorderWidth = width;
        if (dasharray !== undefined)   this.selectionBorderDasharray = dasharray;
        if (cornerRadius !== undefined) this.selectionBorderCornerRadius = cornerRadius;
        const basePadding = padding ?? null;
        const nextPadding = {
            top: paddingTop ?? paddingY ?? basePadding ?? this.selectionBorderPadding.top,
            right: paddingRight ?? paddingX ?? basePadding ?? this.selectionBorderPadding.right,
            bottom: paddingBottom ?? paddingY ?? basePadding ?? this.selectionBorderPadding.bottom,
            left: paddingLeft ?? paddingX ?? basePadding ?? this.selectionBorderPadding.left
        };
        this.selectionBorderPadding = nextPadding;

        // Re-apply to live border if one exists
        if (this.selectionBorder) {
            this.selectionBorder.setAttribute('stroke', this.selectionBorderColor);
            this.selectionBorder.setAttribute('stroke-width', this.selectionBorderWidth);
            this.selectionBorder.setAttribute('stroke-dasharray',
                this.selectionBorderDasharray !== undefined ? this.selectionBorderDasharray : '4,2');
            if (this.selectionBorderCornerRadius !== undefined) {
                this.selectionBorder.setAttribute('rx', this.selectionBorderCornerRadius);
                this.selectionBorder.setAttribute('ry', this.selectionBorderCornerRadius);
            }
            this._updateSelectionBorder();
        }
    }

    /**
     * Style the resize handles.
     * @param {Object} style
     * @param {number}  [style.size]         - Handle square size in px
     * @param {string}  [style.color]        - Fill colour
     * @param {string}  [style.strokeColor]  - Border colour
     * @param {number}  [style.strokeWidth]  - Border width
     * @param {number}  [style.cornerRadius] - rx/ry corner radius (0 = square, size/2 = circle)
     */
    setHandleStyle({ size, color, strokeColor, strokeWidth, cornerRadius } = {}) {
        if (size !== undefined)         this.handleSize = size;
        if (color !== undefined)        this.handleColor = color;
        if (strokeColor !== undefined)  this.handleStrokeColor = strokeColor;
        if (strokeWidth !== undefined)  this.handleStrokeWidth = strokeWidth;
        if (cornerRadius !== undefined) this.handleCornerRadius = cornerRadius;

        // Re-apply to any live handles
        const radius = this.handleCornerRadius !== undefined
            ? this.handleCornerRadius
            : 1;
        this.handles.forEach(h => {
            h.element.setAttribute('width',  this.handleSize);
            h.element.setAttribute('height', this.handleSize);
            h.element.setAttribute('fill',   this.handleColor);
            h.element.setAttribute('stroke', this.handleStrokeColor);
            h.element.setAttribute('stroke-width', this.handleStrokeWidth);
            h.element.setAttribute('rx', radius);
        });

        // Reposition so centres stay correct after a size change
        if (this.handles.length > 0) {
            this._updateHandlePositions();
        }
    }

    /**
     * Update handle positions for currently selected element (called externally)
     */
    updateIfSelected(element) {
        if (this.selectedElement && this.selectedElement === element) {
            this._updateHandlePositions();
            this._updateSelectionBorder();
        }
    }
    
    /**
     * Get cursor for handle type
     * @param {string} handleType - Type of handle
     * @returns {string} CSS cursor value
     */
    getCursorForHandle(handleType) {
        const cursors = {
            'nw': 'nw-resize',
            'n': 'n-resize', 
            'ne': 'ne-resize',
            'e': 'e-resize',
            'se': 'se-resize',
            's': 's-resize',
            'sw': 'sw-resize',
            'w': 'w-resize'
        };
        return cursors[handleType] || 'default';
    }
    
    /**
     * Create selection border around element
     * @private
     */
    _createSelectionBorder() {
        if (!this.selectedElement) return;
        
        this.selectionBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.selectionBorder.setAttribute('fill', 'none');
        this.selectionBorder.setAttribute('stroke', this.selectionBorderColor);
        this.selectionBorder.setAttribute('stroke-width', this.selectionBorderWidth);
        this.selectionBorder.setAttribute('stroke-dasharray',
            this.selectionBorderDasharray !== undefined ? this.selectionBorderDasharray : '4,2');
        if (this.selectionBorderCornerRadius !== undefined) {
            this.selectionBorder.setAttribute('rx', this.selectionBorderCornerRadius);
            this.selectionBorder.setAttribute('ry', this.selectionBorderCornerRadius);
        }
        this.selectionBorder.style.pointerEvents = 'none';
        this.selectionBorder.classList.add('omd-selection-border');
        
        this.canvas.uiLayer.appendChild(this.selectionBorder);
        this._updateSelectionBorder();
    }
    
    /**
     * Update selection border position and size
     * @private
     */
    _updateSelectionBorder() {
        if (!this.selectionBorder || !this.selectedElement) return;
        
        const bounds = this._getTransformedBounds();
        const padding = this.selectionBorderPadding;
        
        this.selectionBorder.setAttribute('x', bounds.x - padding.left);
        this.selectionBorder.setAttribute('y', bounds.y - padding.top);
        this.selectionBorder.setAttribute('width', bounds.width + padding.left + padding.right);
        this.selectionBorder.setAttribute('height', bounds.height + padding.top + padding.bottom);
    }
    
    /**
     * Remove selection border
     * @private
     */
    _removeSelectionBorder() {
        if (this.selectionBorder) {
            this.selectionBorder.remove();
            this.selectionBorder = null;
        }
    }
    
    /**
     * Create resize handles around the selected element
     * @private
     */
    _createResizeHandles() {
        if (!this.selectedElement) return;
        
        // Only corner handles — mid-edge handles would break aspect ratio
        const handleTypes = [
            { type: 'nw', pos: 'top-left' },
            { type: 'ne', pos: 'top-right' },
            { type: 'se', pos: 'bottom-right' },
            { type: 'sw', pos: 'bottom-left' }
        ];
        
        handleTypes.forEach(handleDef => {
            const handle = this._createHandle(handleDef.type, handleDef.pos);
            this.handles.push(handle);
            this.canvas.uiLayer.appendChild(handle.element);
        });
    }
    
    /**
     * Create individual resize handle
     * @private
     */
    _createHandle(type, position) {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        
        const cornerRadius = this.handleCornerRadius !== undefined ? this.handleCornerRadius : 1;
        handle.setAttribute('width', this.handleSize);
        handle.setAttribute('height', this.handleSize);
        handle.setAttribute('fill', this.handleColor);
        handle.setAttribute('stroke', this.handleStrokeColor);
        handle.setAttribute('stroke-width', this.handleStrokeWidth);
        handle.setAttribute('rx', cornerRadius);
        handle.style.cursor = this.getCursorForHandle(type);
        handle.classList.add('resize-handle', `resize-handle-${type}`);
        
        // Add hover effects
        handle.addEventListener('mouseenter', () => {
            handle.setAttribute('fill', '#0056b3');
        });
        
        handle.addEventListener('mouseleave', () => {
            handle.setAttribute('fill', this.handleColor);
        });
        
        return {
            element: handle,
            type,
            position
        };
    }
    
    /**
     * Update positions of all resize handles
     * @private
     */
    _updateHandlePositions() {
        if (!this.selectedElement || this.handles.length === 0) return;
        
        const bounds = this._getTransformedBounds();
        const halfHandle = this.handleSize / 2;
        
        const positions = {
            'nw': { x: bounds.x - halfHandle, y: bounds.y - halfHandle },
            'n': { x: bounds.x + bounds.width/2 - halfHandle, y: bounds.y - halfHandle },
            'ne': { x: bounds.x + bounds.width - halfHandle, y: bounds.y - halfHandle },
            'e': { x: bounds.x + bounds.width - halfHandle, y: bounds.y + bounds.height/2 - halfHandle },
            'se': { x: bounds.x + bounds.width - halfHandle, y: bounds.y + bounds.height - halfHandle },
            's': { x: bounds.x + bounds.width/2 - halfHandle, y: bounds.y + bounds.height - halfHandle },
            'sw': { x: bounds.x - halfHandle, y: bounds.y + bounds.height - halfHandle },
            'w': { x: bounds.x - halfHandle, y: bounds.y + bounds.height/2 - halfHandle }
        };
        
        this.handles.forEach(handle => {
            const pos = positions[handle.type];
            if (pos) {
                handle.element.setAttribute('x', pos.x);
                handle.element.setAttribute('y', pos.y);
            }
        });
    }
    
    /**
     * Remove all resize handles
     * @private
     */
    _removeResizeHandles() {
        this.handles.forEach(handle => {
            handle.element.remove();
        });
        this.handles = [];
    }
    
    /**
     * Get element bounds without transform
     * @private
     */
    _getElementBounds() {
        if (!this.selectedElement) return { x: 0, y: 0, width: 0, height: 0 };
        
        try {
            // Get the content inside the wrapper (usually an SVG element)
            const content = this.selectedElement.firstElementChild;
            if (!content) {
                return this.selectedElement.getBBox();
            }
            
            // For elements with clip paths (like coordinate planes), 
            // the graph lines extend beyond the visible area causing getBBox() to be too large.
            // We need to find the clip rect to get the actual visible bounds.
            const clipPaths = content.querySelectorAll('clipPath');
            
            if (clipPaths.length > 0) {
                let maxArea = 0;
                let clipBounds = null;
                
                for (const clipPath of clipPaths) {
                    const rect = clipPath.querySelector('rect');
                    if (rect) {
                        const w = parseFloat(rect.getAttribute('width')) || 0;
                        const h = parseFloat(rect.getAttribute('height')) || 0;
                        const x = parseFloat(rect.getAttribute('x')) || 0;
                        const y = parseFloat(rect.getAttribute('y')) || 0;
                        
                        const area = w * h;
                        if (area > maxArea) {
                            maxArea = area;
                            
                            // Find the transform on the content group
                            const contentGroup = content.firstElementChild;
                            let tx = 0, ty = 0;
                            if (contentGroup) {
                                const transform = contentGroup.getAttribute('transform');
                                if (transform) {
                                    const translateMatch = transform.match(/translate\(\s*([^,]+)(?:,\s*([^)]+))?\s*\)/);
                                    if (translateMatch) {
                                        tx = parseFloat(translateMatch[1]) || 0;
                                        ty = parseFloat(translateMatch[2]) || 0;
                                    }
                                }
                            }
                            
                            clipBounds = {
                                x: x + tx,
                                y: y + ty,
                                width: w,
                                height: h
                            };
                        }
                    }
                }
                
                if (clipBounds) {
                    return clipBounds;
                }
            }
            
            // Fallback to getBBox if no clip path found
            return content.getBBox();
        } catch (error) {
            // Fallback if getBBox fails
            return { x: 0, y: 0, width: 100, height: 100 };
        }
    }
    
    /**
     * Get element bounds with current transform applied
     * @private
     */
    _getTransformedBounds() {
        if (!this.selectedElement) return { x: 0, y: 0, width: 0, height: 0 };
        
        const transform = this.selectedElement.getAttribute('transform') || '';
        const translateMatch = transform.match(/translate\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
        const scaleMatch = transform.match(/scale\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/);
        
        const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
        const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
        const scaleX = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        const scaleY = scaleMatch ? (scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX) : 1;
        
        const bounds = this._getElementBounds();
        
        return {
            x: translateX + (bounds.x * scaleX),
            y: translateY + (bounds.y * scaleY), 
            width: bounds.width * scaleX,
            height: bounds.height * scaleY
        };
    }
}
