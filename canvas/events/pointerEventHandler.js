export class pointerEventHandler {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     */
    constructor(canvas) {
        this.canvas = canvas;
        
        // State tracking
        this.lastPointerPosition = { x: 0, y: 0 };
        this.lastPointerTime = 0;
        this.velocity = { x: 0, y: 0 };
        
        // Multi-touch state
        this.multiTouchState = {
            isActive: false,
            initialDistance: 0,
            initialAngle: 0,
            lastScale: 1,
            lastRotation: 0
        };
        
        // Gesture thresholds
        this.gestureThresholds = {
            minPinchDistance: 20,
            minRotationAngle: 0.1
        };
    }
    
    /**
     * Handle pointer down event
     * @param {PointerEvent} event - Original pointer event
     * @param {Object} normalizedEvent - Normalized event data
     */
    handlePointerDown(event, normalizedEvent) {
        this.lastPointerPosition = { x: normalizedEvent.x, y: normalizedEvent.y };
        this.lastPointerTime = normalizedEvent.timestamp;
        this.velocity = { x: 0, y: 0 };
        
        // Update velocity and pressure for active tool
        normalizedEvent.velocity = this.velocity;
        normalizedEvent.normalizedPressure = this._normalizePressure(normalizedEvent.pressure);
    }
    
    /**
     * Handle pointer move event
     * @param {PointerEvent} event - Original pointer event
     * @param {Object} normalizedEvent - Normalized event data
     */
    handlePointerMove(event, normalizedEvent) {
        // Calculate velocity
        this._calculateVelocity(normalizedEvent);
        
        // Handle coalesced events for smoother drawing
        if (event.getCoalescedEvents) {
            const coalescedEvents = event.getCoalescedEvents();
            normalizedEvent.coalescedEvents = coalescedEvents.map(coalescedEvent => {
                const coalescedCoords = this.canvas.clientToSVG(coalescedEvent.clientX, coalescedEvent.clientY);
                return {
                    x: coalescedCoords.x,
                    y: coalescedCoords.y,
                    pressure: this._normalizePressure(coalescedEvent.pressure),
                    timestamp: coalescedEvent.timeStamp || Date.now()
                };
            });
        }
        
        // Add velocity and pressure data
        normalizedEvent.velocity = this.velocity;
        normalizedEvent.normalizedPressure = this._normalizePressure(normalizedEvent.pressure);
        
        // Update last position and time
        this.lastPointerPosition = { x: normalizedEvent.x, y: normalizedEvent.y };
        this.lastPointerTime = normalizedEvent.timestamp;
    }
    
    /**
     * Handle pointer up event
     * @param {PointerEvent} event - Original pointer event
     * @param {Object} normalizedEvent - Normalized event data
     */
    handlePointerUp(event, normalizedEvent) {
        // Final velocity calculation
        this._calculateVelocity(normalizedEvent);
        normalizedEvent.velocity = this.velocity;
        normalizedEvent.normalizedPressure = this._normalizePressure(normalizedEvent.pressure);
        
        // Reset velocity
        this.velocity = { x: 0, y: 0 };
    }
    
    /**
     * Handle multi-touch start
     * @param {Map} activePointers - Map of active pointers
     */
    handleMultiTouchStart(activePointers) {
        if (activePointers.size === 2) {
            const pointers = Array.from(activePointers.values());
            const pointer1 = pointers[0];
            const pointer2 = pointers[1];
            
            this.multiTouchState.isActive = true;
            this.multiTouchState.initialDistance = this._calculateDistance(pointer1, pointer2);
            this.multiTouchState.initialAngle = this._calculateAngle(pointer1, pointer2);
            this.multiTouchState.lastScale = 1;
            this.multiTouchState.lastRotation = 0;
            
            this.canvas.emit('multiTouchStart', {
                pointers: pointers,
                distance: this.multiTouchState.initialDistance,
                angle: this.multiTouchState.initialAngle
            });
        }
    }
    
    /**
     * Handle multi-touch move
     * @param {Map} activePointers - Map of active pointers
     */
    handleMultiTouchMove(activePointers) {
        if (activePointers.size === 2 && this.multiTouchState.isActive) {
            const pointers = Array.from(activePointers.values());
            const pointer1 = pointers[0];
            const pointer2 = pointers[1];
            
            const currentDistance = this._calculateDistance(pointer1, pointer2);
            const currentAngle = this._calculateAngle(pointer1, pointer2);
            
            const scale = currentDistance / this.multiTouchState.initialDistance;
            const rotation = currentAngle - this.multiTouchState.initialAngle;
            
            // Detect pinch gesture
            if (Math.abs(scale - 1) > 0.1) {
                this.canvas.emit('pinch', {
                    scale: scale,
                    deltaScale: scale - this.multiTouchState.lastScale,
                    center: this._calculateCenter(pointer1, pointer2)
                });
                this.multiTouchState.lastScale = scale;
            }
            
            // Detect rotation gesture
            if (Math.abs(rotation) > this.gestureThresholds.minRotationAngle) {
                this.canvas.emit('rotate', {
                    rotation: rotation,
                    deltaRotation: rotation - this.multiTouchState.lastRotation,
                    center: this._calculateCenter(pointer1, pointer2)
                });
                this.multiTouchState.lastRotation = rotation;
            }
        }
    }
    
    /**
     * Handle multi-touch end
     * @param {Map} activePointers - Map of active pointers
     */
    handleMultiTouchEnd(activePointers) {
        if (activePointers.size < 2) {
            this.multiTouchState.isActive = false;
            this.canvas.emit('multiTouchEnd');
        }
    }
    
    /**
     * Calculate velocity between pointer events
     * @private
     */
    _calculateVelocity(normalizedEvent) {
        const deltaTime = normalizedEvent.timestamp - this.lastPointerTime;
        
        if (deltaTime > 0) {
            const deltaX = normalizedEvent.x - this.lastPointerPosition.x;
            const deltaY = normalizedEvent.y - this.lastPointerPosition.y;
            
            this.velocity.x = deltaX / deltaTime * 1000; // pixels per second
            this.velocity.y = deltaY / deltaTime * 1000;
        }
    }
    
    /**
     * Normalize pressure value with device-specific adjustments
     * @param {number} pressure - Raw pressure value
     * @returns {number} Normalized pressure (0-1)
     * @private
     */
    _normalizePressure(pressure = 0.5) {
        if (pressure === undefined || pressure === null) {
            return 0.5;
        }
        
        // Device-specific pressure normalization
        // Some devices report pressure differently
        let normalizedPressure = pressure;
        
        // Apple Pencil typically reports good pressure values
        // Surface Pen and other styluses might need adjustment
        if (normalizedPressure < 0.1) {
            normalizedPressure = 0.1; // Minimum pressure to ensure visibility
        }
        
        // Apply slight curve to make pressure feel more natural
        normalizedPressure = Math.pow(normalizedPressure, 0.8);
        
        return Math.max(0, Math.min(1, normalizedPressure));
    }
    
    /**
     * Calculate distance between two pointers
     * @private
     */
    _calculateDistance(pointer1, pointer2) {
        const dx = pointer2.clientX - pointer1.clientX;
        const dy = pointer2.clientY - pointer1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calculate angle between two pointers
     * @private
     */
    _calculateAngle(pointer1, pointer2) {
        return Math.atan2(
            pointer2.clientY - pointer1.clientY,
            pointer2.clientX - pointer1.clientX
        );
    }
    
    /**
     * Calculate center point between two pointers
     * @private
     */
    _calculateCenter(pointer1, pointer2) {
        const centerX = (pointer1.clientX + pointer2.clientX) / 2;
        const centerY = (pointer1.clientY + pointer2.clientY) / 2;
        
        return this.canvas.clientToSVG(centerX, centerY);
    }
    
    /**
     * Get velocity information
     * @returns {Object} Current velocity data
     */
    getVelocity() {
        return {
            x: this.velocity.x,
            y: this.velocity.y,
            magnitude: Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y),
            angle: Math.atan2(this.velocity.y, this.velocity.x)
        };
    }
    
    /**
     * Get multi-touch state
     * @returns {Object} Current multi-touch state
     */
    getMultiTouchState() {
        return {
            isActive: this.multiTouchState.isActive,
            scale: this.multiTouchState.lastScale,
            rotation: this.multiTouchState.lastRotation
        };
    }
} 