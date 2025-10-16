import { Tool } from './tool.js';
import { Stroke } from '../drawing/stroke.js';

/**
 * Pencil tool for freehand drawing
 */
export class PencilTool extends Tool {
    constructor(canvas, options = {}) {
        super(canvas, {
            strokeWidth: 5,
            strokeColor: '#000000',
            strokeOpacity: 1,
            smoothing: 0.5,
            pressureSensitive: true,
            ...options
        });
        
        this.displayName = 'Pencil';
        this.description = 'Draw freehand strokes';
        this.icon = 'pencil';
        this.shortcut = 'P';
        this.category = 'drawing';
        
        // Drawing state
        this.points = [];
        this.lastPoint = null;
        this.minDistance = 2.0; // Minimum distance between points (increased for better performance)
    }
    
    /**
     * Start drawing a new stroke
     */
    onPointerDown(event) {
        if (!this.canUse()) return;
        
        
        this.isDrawing = true;
        this.points = [];
        this.lastPoint = { x: event.x, y: event.y };
        
        // Create new stroke
        this.currentStroke = new Stroke({
            x: event.x,
            y: event.y,
            strokeWidth: this.calculateStrokeWidth(event.pressure),
            strokeColor: this.config.strokeColor,
            strokeOpacity: this.config.strokeOpacity,
            tool: this.name
        });
        
        // Add first point
        this.addPoint(event.x, event.y, event.pressure);
        
        // Add stroke to canvas
        const strokeId = this.canvas.addStroke(this.currentStroke);
        
        this.canvas.emit('strokeStarted', {
            stroke: this.currentStroke,
            tool: this.name,
            point: { x: event.x, y: event.y, pressure: event.pressure }
        });
    }
    
    /**
     * Continue drawing the stroke
     */
    onPointerMove(event) {
        if (!this.isDrawing || !this.currentStroke) return;
        
        // Process coalesced events for higher precision if available
        if (event.coalescedEvents && event.coalescedEvents.length > 0) {
            // Limit the number of coalesced events processed to prevent performance issues
            const maxCoalescedEvents = 5;
            const eventsToProcess = event.coalescedEvents.slice(0, maxCoalescedEvents);
            
            for (const coalescedEvent of eventsToProcess) {
                this._addPointIfNeeded(coalescedEvent.x, coalescedEvent.y, coalescedEvent.pressure);
            }
        } else {
            // Fallback to regular event
            this._addPointIfNeeded(event.x, event.y, event.pressure);
        }
        
        this.canvas.emit('strokeContinued', {
            stroke: this.currentStroke,
            tool: this.name,
            point: { x: event.x, y: event.y, pressure: event.pressure }
        });
    }
    
    /**
     * Finish drawing the stroke
     */
    onPointerUp(event) {
        if (!this.isDrawing || !this.currentStroke) return;
        
        // Add final point
        this.addPoint(event.x, event.y, event.pressure);
        
        // Finish the stroke
        this.currentStroke.finish();
        
        
        this.canvas.emit('strokeCompleted', {
            stroke: this.currentStroke,
            tool: this.name,
            totalPoints: this.points.length
        });
        
        // Reset drawing state
        this.isDrawing = false;
        this.currentStroke = null;
        this.points = [];
        this.lastPoint = null;
    }
    
    /**
     * Cancel current stroke
     */
    onCancel() {
        if (this.isDrawing && this.currentStroke) {
            // Remove incomplete stroke
            this.canvas.removeStroke(this.currentStroke.id);
            
            this.canvas.emit('strokeCancelled', {
                stroke: this.currentStroke,
                tool: this.name
            });
        }
        
        super.onCancel();
        
        // Reset state
        this.points = [];
        this.lastPoint = null;
    }
    
    /**
     * Add a point to the current stroke
     * @private
     */
    addPoint(x, y, pressure = 0.5) {
        const point = {
            x,
            y,
            pressure,
            width: this.calculateStrokeWidth(pressure),
            timestamp: Date.now()
        };
        
        this.points.push(point);
        
        if (this.currentStroke) {
            this.currentStroke.addPoint(point);
        }
    }
    
    /**
     * Add a point only if it meets distance requirements
     * @private
     */
    _addPointIfNeeded(x, y, pressure = 0.5) {
        if (!this.lastPoint) {
            this.addPoint(x, y, pressure);
            this.lastPoint = { x, y };
            return;
        }
        
        const distance = this.getDistance(this.lastPoint, { x, y });
        
        // Add point if moved enough distance
        if (distance >= this.minDistance) {
            // Only interpolate for very large gaps to prevent performance issues
            if (distance > 8) {
                this._interpolatePoints(this.lastPoint, { x, y, pressure });
            } else {
                this.addPoint(x, y, pressure);
            }
            this.lastPoint = { x, y };
        }
    }
    
    /**
     * Add interpolated points between two points for smoother strokes
     * @private
     */
    _interpolatePoints(fromPoint, toPoint) {
        const distance = this.getDistance(fromPoint, toPoint);
        // Increase spacing to reduce point density - point every 3 pixels instead of 1.5
        const steps = Math.ceil(distance / 3);
        
        // Limit maximum interpolation steps to prevent performance issues
        const maxSteps = 10;
        const actualSteps = Math.min(steps, maxSteps);
        
        for (let i = 1; i <= actualSteps; i++) {
            const t = i / actualSteps;
            const x = fromPoint.x + (toPoint.x - fromPoint.x) * t;
            const y = fromPoint.y + (toPoint.y - fromPoint.y) * t;
            const pressure = fromPoint.pressure ? 
                fromPoint.pressure + (toPoint.pressure - fromPoint.pressure) * t : 
                toPoint.pressure;
            
            this.addPoint(x, y, pressure);
        }
    }
    
    /**
     * Calculate distance between two points
     * @private
     */
    getDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Update configuration and apply smoothing
     */
    onConfigUpdate() {
        // Update minimum distance based on stroke width
        this.minDistance = Math.max(1, this.config.strokeWidth * 0.2);
        
        // Update current stroke if drawing
        if (this.isDrawing && this.currentStroke) {
            this.currentStroke.updateConfig({
                strokeColor: this.config.strokeColor,
                strokeOpacity: this.config.strokeOpacity
            });
        }
        
        // Update cursor size
        if (this.canvas.cursor) {
            this.canvas.cursor.updateFromToolConfig(this.config);
        }
    }
    
    /**
     * Calculate stroke width with pressure sensitivity
     */
    calculateStrokeWidth(pressure = 0.5) {
        if (!this.config.pressureSensitive) {
            return this.config.strokeWidth;
        }
        
        return super.calculateStrokeWidth(pressure);
    }
    
    /**
     * Get smoothed points using interpolation
     * @param {Array} points - Array of points to smooth
     * @returns {Array} Smoothed points
     */
    getSmoothPath(points) {
        if (points.length < 2) return points;
        
        const smoothed = [];
        const smoothing = this.config.smoothing;
        
        // First point
        smoothed.push(points[0]);
        
        // Smooth intermediate points
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            
            const smoothedPoint = {
                x: curr.x + smoothing * ((prev.x + next.x) / 2 - curr.x),
                y: curr.y + smoothing * ((prev.y + next.y) / 2 - curr.y),
                pressure: curr.pressure,
                width: curr.width,
                timestamp: curr.timestamp
            };
            
            smoothed.push(smoothedPoint);
        }
        
        // Last point
        if (points.length > 1) {
            smoothed.push(points[points.length - 1]);
        }
        
        return smoothed;
    }
    
    /**
     * Handle keyboard shortcuts specific to pencil tool
     */
    onKeyboardShortcut(key, event) {
        switch (key) {
            case '[':
                // Decrease brush size
                this.updateConfig({ 
                    strokeWidth: Math.max(1, this.config.strokeWidth - 1) 
                });
                // Notify tool manager of config change
                this.canvas.toolManager.updateToolConfig(this.name, this.config);
                return true;
            case ']':
                // Increase brush size
                this.updateConfig({ 
                    strokeWidth: Math.min(50, this.config.strokeWidth + 1) 
                });
                // Notify tool manager of config change
                this.canvas.toolManager.updateToolConfig(this.name, this.config);
                return true;
            default:
                return super.onKeyboardShortcut(key, event);
        }
    }
    
    /**
     * Get help text for pencil tool
     */
    getHelpText() {
        return `${super.getHelpText()}\nShortcuts: [ ] to adjust brush size`;
    }
} 
