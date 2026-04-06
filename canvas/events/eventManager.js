import { pointerEventHandler } from './pointerEventHandler.js';

/**
 * Event manager for canvas interactions
 * Handles pointer, keyboard, and wheel events
 */
export class EventManager {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.isInitialized = false;
        
        // Event handlers
        this.pointerEventHandler = new pointerEventHandler(canvas);
        
        // Bound event listeners
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);
        this._onPointerEnter = this._onPointerEnter.bind(this);
        this._onPointerLeave = this._onPointerLeave.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        
        // State tracking
        this.activePointers = new Map();
        this.isDrawing = false;
        this.lastEventTime = 0;
    }
    
    /**
     * Initialize event listeners
     */
    initialize() {
        if (this.isInitialized) return;
        
        const svg = this.canvas.svg;
        
        // Pointer events (unified mouse/touch/pen handling)
        svg.addEventListener('pointerdown', this._onPointerDown);
        svg.addEventListener('pointermove', this._onPointerMove);
        svg.addEventListener('pointerup', this._onPointerUp);
        svg.addEventListener('pointercancel', this._onPointerCancel);
        svg.addEventListener('pointerenter', this._onPointerEnter);
        svg.addEventListener('pointerleave', this._onPointerLeave);
        
        // Keyboard events (on document for global shortcuts)
        if (this.canvas.config.enableKeyboardShortcuts) {
            document.addEventListener('keydown', this._onKeyDown);
            document.addEventListener('keyup', this._onKeyUp);
        }
        
        // Mouse wheel events
        svg.addEventListener('wheel', this._onWheel);
        
        // Prevent context menu
        svg.addEventListener('contextmenu', this._onContextMenu);
        
        // Set touch-action for better touch handling
        svg.style.touchAction = 'none';
        
        this.isInitialized = true;
    }
    
    /**
     * Handle pointer down events
     * @private
     */
    _onPointerDown(event) {
        event.preventDefault();
        // Track active pointer
        this.activePointers.set(event.pointerId, event);
        // Set pointer capture so canvas continues to receive events
        event.target.setPointerCapture(event.pointerId);
        // Convert to canvas coordinates
        const canvasCoords = this.canvas.clientToSVG(event.clientX, event.clientY);
        // Create normalized event
        const normalizedEvent = this._normalizePointerEvent(event, canvasCoords);
        // Handle multi-touch
        if (this.canvas.config.enableMultiTouch && this.activePointers.size > 1) {
            this.pointerEventHandler.handleMultiTouchStart(this.activePointers);
            return;
        }
        // Delegate to pointer event handler
        this.pointerEventHandler.handlePointerDown(event, normalizedEvent);
        // Delegate to active tool
        const activeTool = this.canvas.toolManager.getActiveTool();
        if (activeTool) {
            // Let the tool decide if it's drawing (e.g., PointerTool won't set isDrawing)
            activeTool.onPointerDown(normalizedEvent);
            // If tool hasn't explicitly set isDrawing, set it for backwards compatibility
            // (tools like PencilTool and EraserTool expect isDrawing to be true)
            if (this.isDrawing === false && activeTool.constructor.name !== 'PointerTool') {
                this.isDrawing = true;
            }
        }
        // Emit canvas event
        this.canvas.emit('pointerDown', normalizedEvent);
    }
    
    /**
     * Handle pointer move events
     * @private
     */
    _onPointerMove(event) {
        // Throttle events for performance
        const now = Date.now();
        if (now - this.lastEventTime < 16) return; // ~60fps
        this.lastEventTime = now;
        
        // Update active pointer
        if (this.activePointers.has(event.pointerId)) {
            this.activePointers.set(event.pointerId, event);
        }
        
        // Convert to canvas coordinates
        const canvasCoords = this.canvas.clientToSVG(event.clientX, event.clientY);
        
        // Create normalized event
        const normalizedEvent = this._normalizePointerEvent(event, canvasCoords);
        
        // Handle multi-touch
        if (this.canvas.config.enableMultiTouch && this.activePointers.size > 1) {
            this.pointerEventHandler.handleMultiTouchMove(this.activePointers);
            return;
        }
        
        // Update cursor position
        if (this.canvas.cursor) {
            this.canvas.cursor.setPosition(canvasCoords.x, canvasCoords.y);
            
            // Update pressure feedback if available
            if (event.pressure !== undefined) {
                this.canvas.cursor.setPressureFeedback(event.pressure);
            }
        }
        
        // Delegate to pointer event handler
        this.pointerEventHandler.handlePointerMove(event, normalizedEvent);
        
        // Delegate to active tool if drawing
        if (this.isDrawing) {
            const activeTool = this.canvas.toolManager.getActiveTool();
            if (activeTool) {
                activeTool.onPointerMove(normalizedEvent);
            }
        }
        
        // Emit canvas event
        this.canvas.emit('pointerMove', normalizedEvent);
    }
    
    /**
     * Handle pointer up events
     * @private
     */
    _onPointerUp(event) {
        // Remove from active pointers
        this.activePointers.delete(event.pointerId);
        // Release pointer capture
        event.target.releasePointerCapture(event.pointerId);
        // Convert to canvas coordinates
        const canvasCoords = this.canvas.clientToSVG(event.clientX, event.clientY);
        // Create normalized event
        const normalizedEvent = this._normalizePointerEvent(event, canvasCoords);
        // Handle multi-touch
        if (this.canvas.config.enableMultiTouch && this.activePointers.size >= 1) {
            this.pointerEventHandler.handleMultiTouchEnd(this.activePointers);
            return;
        }
        // Clear drawing state
        this.isDrawing = false;
        // Delegate to pointer event handler
        this.pointerEventHandler.handlePointerUp(event, normalizedEvent);
        // Delegate to active tool
        const activeTool = this.canvas.toolManager.getActiveTool();
        if (activeTool) {
            activeTool.onPointerUp(normalizedEvent);
        }
        // Emit canvas event
        this.canvas.emit('pointerUp', normalizedEvent);
    }
    
    /**
     * Handle pointer cancel events
     * @private
     */
    _onPointerCancel(event) {
        // Remove from active pointers
        this.activePointers.delete(event.pointerId);
        // Release pointer capture
        event.target.releasePointerCapture(event.pointerId);
        // Clear drawing state
        this.isDrawing = false;
        // Cancel active tool
        const activeTool = this.canvas.toolManager.getActiveTool();
        if (activeTool) {
            activeTool.onCancel();
        }
        // Emit canvas event
        this.canvas.emit('pointerCancel', { pointerId: event.pointerId });
    }
    
    /**
     * Handle pointer enter events
     * @private
     */
    _onPointerEnter(event) {
        // Show custom cursor when entering canvas
        if (this.canvas.cursor) {
            this.canvas.cursor.show();
            // Ensure the cursor shape matches the active tool (fixes stale crosshair on first entry)
            const activeTool = this.canvas.toolManager.getActiveTool();
            if (activeTool) {
                if (activeTool.getCursor) {
                    this.canvas.cursor.setShape(activeTool.getCursor());
                }
                if (activeTool.config) {
                    this.canvas.cursor.updateFromToolConfig(activeTool.config);
                }
            }
        }
        // If mouse is down (event.buttons !== 0), start drawing
        if (event.buttons !== 0) {
            // Convert to canvas coordinates
            const canvasCoords = this.canvas.clientToSVG(event.clientX, event.clientY);
            const normalizedEvent = this._normalizePointerEvent(event, canvasCoords);
            this.isDrawing = true;
            const activeTool = this.canvas.toolManager.getActiveTool();
            if (activeTool) {
                activeTool.onPointerDown(normalizedEvent);
            }
        }
        // Emit canvas event
        this.canvas.emit('pointerEnter', { event });
    }
    
    /**
     * Handle pointer leave events
     * @private
     */
    _onPointerLeave(event) {
        // Hide custom cursor when leaving canvas
        if (this.canvas.cursor) {
            this.canvas.cursor.hide();
        }
        // Do NOT cancel drawing on pointerleave; drawing continues outside canvas
        // But if no buttons are pressed, we can safely clear the drawing state
        if (event.buttons === 0) {
            this.isDrawing = false;
        }
        // Clear active pointers only if no buttons pressed
        if (event.buttons === 0) {
            this.activePointers.clear();
        }
        // Emit canvas event
        this.canvas.emit('pointerLeave', { event });
    }
    
    /**
     * Handle keyboard down events
     * @private
     */
    _onKeyDown(event) {
        // Ignore if typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        // Global shortcuts
        switch (key) {
            case 'p':
                if (this.canvas.config.enabledTools.includes('pencil')) {
                    this.canvas.toolManager.setActiveTool('pencil');
                    event.preventDefault();
                }
                break;
            case 'e':
                if (this.canvas.config.enabledTools.includes('eraser')) {
                    this.canvas.toolManager.setActiveTool('eraser');
                    event.preventDefault();
                }
                break;
            case 's':
                if (this.canvas.config.enabledTools.includes('select')) {
                    this.canvas.toolManager.setActiveTool('select');
                    event.preventDefault();
                }
                break;
            case 'escape':
                // Cancel current operation
                const activeTool = this.canvas.toolManager.getActiveTool();
                if (activeTool) {
                    activeTool.onCancel();
                }
                event.preventDefault();
                break;
        }
        
        // Delegate to active tool
        const activeTool = this.canvas.toolManager.getActiveTool();
        if (activeTool && activeTool.onKeyboardShortcut) {
            const handled = activeTool.onKeyboardShortcut(key, event);
            if (handled) {
                event.preventDefault();
            }
        }
        
        // Emit canvas event
        this.canvas.emit('keyDown', { key, event });
    }
    
    /**
     * Handle keyboard up events
     * @private
     */
    _onKeyUp(event) {
        // Ignore if typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        // Emit canvas event
        this.canvas.emit('keyUp', { key, event });
    }
    
    /**
     * Handle wheel events (zoom/pan)
     * @private
     */
    _onWheel(event) {
        // Prevent default scrolling
        event.preventDefault();
        
        // Convert to canvas coordinates
        const canvasCoords = this.canvas.clientToSVG(event.clientX, event.clientY);
        
        // Emit canvas event
        this.canvas.emit('wheel', {
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaZ: event.deltaZ,
            x: canvasCoords.x,
            y: canvasCoords.y,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey
        });
    }
    
    /**
     * Prevent context menu
     * @private
     */
    _onContextMenu(event) {
        event.preventDefault();
    }
    
    /**
     * Normalize pointer event data
     * @private
     */
    _normalizePointerEvent(event, canvasCoords) {
        return {
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            isPrimary: event.isPrimary,
            x: canvasCoords.x,
            y: canvasCoords.y,
            clientX: event.clientX,
            clientY: event.clientY,
            pressure: this._normalizePressure(event.pressure),
            tiltX: event.tiltX || 0,
            tiltY: event.tiltY || 0,
            twist: event.twist || 0,
            width: event.width || 1,
            height: event.height || 1,
            tangentialPressure: event.tangentialPressure || 0,
            buttons: event.buttons,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            timestamp: event.timeStamp || Date.now()
        };
    }
    
    /**
     * Normalize pressure values
     * @private
     */
    _normalizePressure(pressure) {
        if (pressure === undefined || pressure === null) {
            return 0.5; // Default pressure for devices without pressure sensitivity
        }
        
        // Clamp pressure between 0 and 1
        return Math.max(0, Math.min(1, pressure));
    }
    
    /**
     * Get current pointer information
     * @returns {Object} Pointer information
     */
    getPointerInfo() {
        return {
            activePointers: this.activePointers.size,
            isDrawing: this.isDrawing,
            multiTouch: this.activePointers.size > 1
        };
    }
    
    /**
     * Destroy event manager
     */
    destroy() {
        if (!this.isInitialized) return;
        
        const svg = this.canvas.svg;
        
        // Remove pointer events
        svg.removeEventListener('pointerdown', this._onPointerDown);
        svg.removeEventListener('pointermove', this._onPointerMove);
        svg.removeEventListener('pointerup', this._onPointerUp);
        svg.removeEventListener('pointercancel', this._onPointerCancel);
        svg.removeEventListener('pointerenter', this._onPointerEnter);
        svg.removeEventListener('pointerleave', this._onPointerLeave);
        
        // Remove keyboard events
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        
        // Remove other events
        svg.removeEventListener('wheel', this._onWheel);
        svg.removeEventListener('contextmenu', this._onContextMenu);
        
                 // Clear state
         this.activePointers.clear();
         this.isDrawing = false;
         this.isInitialized = false;
     }
} 