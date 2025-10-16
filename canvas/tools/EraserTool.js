import { Tool } from './tool.js';
import { Stroke } from '../drawing/stroke.js';

/**
 * Eraser tool for removing strokes
 */
export class EraserTool extends Tool {
    constructor(canvas, options = {}) {
        super(canvas, {
            size: 12,
            hardness: 0.8,
            mode: 'radius', // 'stroke' or 'radius'
            ...options
        });
        
        this.displayName = 'Eraser';
        this.description = 'Erase strokes (M to toggle mode)';
        this.icon = 'eraser';
        this.shortcut = 'E';
        this.category = 'editing';
        
        // Eraser state
        this.isErasing = false;
        this.erasedPoints = new Set(); // Track erased points for radius mode
    }
    
    /**
     * Start erasing
     */
    onPointerDown(event) {
        if (!this.canUse()) return;
        
        this.isErasing = true;
        this._eraseAtPoint(event.x, event.y);
        
        this.canvas.emit('eraseStarted', {
            tool: this.name,
            point: { x: event.x, y: event.y }
        });
    }
    
    /**
     * Continue erasing
     */
    onPointerMove(event) {
        if (!this.isErasing) return;
        
        this._eraseAtPoint(event.x, event.y);
    }
    
    /**
     * Stop erasing
     */
    onPointerUp(event) {
        if (!this.isErasing) return;
        
        this.isErasing = false;
        
        this.canvas.emit('eraseCompleted', {
            tool: this.name
        });
    }
    
    /**
     * Cancel erasing
     */
    onCancel() {
        this.isErasing = false;
        super.onCancel();
    }
    
    /**
     * Erase strokes at point
     * @private
     */
    _eraseAtPoint(x, y) {
        if (this.config.mode === 'stroke') {
            this._eraseWholeStrokes(x, y);
        } else {
            this._eraseInRadius(x, y);
        }
    }
    
    /**
     * Erase whole strokes (original behavior)
     * @private
     */
    _eraseWholeStrokes(x, y) {
        const tolerance = this.config.size || 20;
        const strokesToRemove = [];
        
        // Check each stroke to see if it's near the eraser point
        for (const [id, stroke] of this.canvas.strokes) {
            if (stroke.isNearPoint(x, y, tolerance)) {
                strokesToRemove.push(id);
            }
        }
        
        // Remove the strokes
        strokesToRemove.forEach(id => {
            this.canvas.removeStroke(id);
        });
    }
    
    /**
     * Erase within radius (traditional eraser behavior)
     * @private
     */
    _eraseInRadius(x, y) {
        const radius = this.config.size || 20;
        const radiusSquared = radius * radius;
        const strokesToModify = [];
        
        // Find strokes that intersect with the eraser circle
        for (const [id, stroke] of this.canvas.strokes) {
            const boundingBox = stroke.getBoundingBox();
            
            // Quick bounding box check first
            if (this._circleIntersectsRect(x, y, radius, boundingBox)) {
                // Check individual points
                const pointsToRemove = [];
                
                for (let i = 0; i < stroke.points.length; i++) {
                    const point = stroke.points[i];
                    const dx = point.x - x;
                    const dy = point.y - y;
                    const distanceSquared = dx * dx + dy * dy;
                    
                    if (distanceSquared <= radiusSquared) {
                        pointsToRemove.push(i);
                    }
                }
                
                if (pointsToRemove.length > 0) {
                    strokesToModify.push({ id, stroke, pointsToRemove });
                }
            }
        }
        
        // Modify or remove strokes
        strokesToModify.forEach(({ id, stroke, pointsToRemove }) => {
            if (pointsToRemove.length >= stroke.points.length * 0.8) {
                // If most points are erased, remove the whole stroke
                this.canvas.removeStroke(id);
            } else {
                // Remove points and split stroke if necessary
                this._splitStrokeAtErasedPoints(stroke, pointsToRemove);
            }
        });
    }
    
    /**
     * Check if circle intersects with rectangle
     * @private
     */
    _circleIntersectsRect(cx, cy, radius, rect) {
        const closestX = Math.max(rect.left, Math.min(cx, rect.right));
        const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
        
        const dx = cx - closestX;
        const dy = cy - closestY;
        
        return (dx * dx + dy * dy) <= (radius * radius);
    }
    
    /**
     * Split stroke at erased points or remove segments
     * @private
     */
    _splitStrokeAtErasedPoints(stroke, pointsToRemove) {
        if (pointsToRemove.length === 0) return;
        
        // Sort indices in ascending order for processing
        pointsToRemove.sort((a, b) => a - b);
        
        // Find continuous segments to keep
        const segments = [];
        let startIndex = 0;
        
        for (let i = 0; i < pointsToRemove.length; i++) {
            const removeIndex = pointsToRemove[i];
            
            // If there's a gap before this point, create a segment
            if (removeIndex > startIndex) {
                const segmentPoints = stroke.points.slice(startIndex, removeIndex);
                if (segmentPoints.length >= 2) {
                    segments.push(segmentPoints);
                }
            }
            
            startIndex = removeIndex + 1;
        }
        
        // Add final segment if there are remaining points
        if (startIndex < stroke.points.length) {
            const finalSegment = stroke.points.slice(startIndex);
            if (finalSegment.length >= 2) {
                segments.push(finalSegment);
            }
        }
        
        // Remove original stroke
        this.canvas.removeStroke(stroke.id);
        
        // Create new strokes for each segment
        segments.forEach((segmentPoints, index) => {
            const newStroke = new Stroke({
                strokeWidth: stroke.strokeWidth,
                strokeColor: stroke.strokeColor,
                strokeOpacity: stroke.strokeOpacity,
                tool: stroke.tool
            });
            
            // Add all points to the new stroke
            segmentPoints.forEach(point => {
                newStroke.addPoint(point);
            });
            
            newStroke.finish();
            this.canvas.addStroke(newStroke);
        });
    }
    
    /**
     * Get eraser cursor
     */
    getCursor() {
        return 'eraser';
    }
    
    /**
     * Handle keyboard shortcuts
     */
    onKeyboardShortcut(key, event) {
        switch (key) {
            case '[':
                // Decrease eraser size
                this.updateConfig({ 
                    size: Math.max(5, this.config.size - 5) 
                });
                return true;
            case ']':
                // Increase eraser size
                this.updateConfig({ 
                    size: Math.min(100, this.config.size + 5) 
                });
                return true;
            case 'm':
                // Toggle eraser mode
                this.toggleMode();
                return true;
            default:
                return super.onKeyboardShortcut(key, event);
        }
    }
    
    /**
     * Toggle between stroke and radius erasing modes
     */
    toggleMode() {
        const newMode = this.config.mode === 'stroke' ? 'radius' : 'stroke';
        this.updateConfig({ mode: newMode });
        
        // Update cursor appearance
        if (this.canvas.cursor) {
            this.canvas.cursor.updateFromToolConfig(this.config);
        }
        
        // Emit mode change event
        this.canvas.emit('eraserModeChanged', { 
            mode: newMode,
            description: this._getModeDescription(newMode)
        });
        
    }
    
    /**
     * Get mode description
     * @private
     */
    _getModeDescription(mode) {
        return mode === 'stroke' ? 'Whole Stroke Erasing' : 'Radius Erasing';
    }
    
    /**
     * Update configuration
     */
    onConfigUpdate() {
        // Update cursor size if available
        if (this.canvas.cursor) {
            this.canvas.cursor.setSize(this.config.size);
        }
    }
    
    /**
     * Get help text
     */
    getHelpText() {
        return `${super.getHelpText()}\nShortcuts: [ ] to adjust size, M to toggle mode\nCurrent mode: ${this._getModeDescription(this.config.mode)}`;
    }
    
    /**
     * Get current eraser mode
     */
    getMode() {
        return this.config.mode;
    }
    
    /**
     * Set eraser mode
     * @param {string} mode - 'stroke' or 'radius'
     */
    setMode(mode) {
        if (mode === 'stroke' || mode === 'radius') {
            this.updateConfig({ mode });
            if (this.canvas.cursor) {
                this.canvas.cursor.updateFromToolConfig(this.config);
            }
        }
    }
}
