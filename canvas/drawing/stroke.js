import { BoundingBox } from '../utils/boundingBox.js';
import { jsvgPath } from '@teachinglab/jsvg';
/**
 * Represents a drawing stroke made up of connected points
 */
export class Stroke {
    /**
     * @param {Object} options - Stroke configuration
     * @param {number} options.x - Starting X coordinate
     * @param {number} options.y - Starting Y coordinate
     * @param {number} [options.strokeWidth=5] - Stroke width
     * @param {string} [options.strokeColor='#000000'] - Stroke color
     * @param {number} [options.strokeOpacity=1] - Stroke opacity
     * @param {string} [options.tool='pencil'] - Tool that created this stroke
     */
    constructor(options = {}) {
        this.id = options.id || this._generateId();
        this.tool = options.tool || 'pencil';
        
        // Stroke properties
        this.strokeWidth = options.strokeWidth || 5;
        this.strokeColor = options.strokeColor || '#000000';
        this.strokeOpacity = options.strokeOpacity || 1;
        
        // Drawing data
        this.points = [];
        this.isFinished = false;
        this.isSelected = false;
        
        // Bounding box for hit testing and selection
        this.boundingBox = new BoundingBox();
        
        // Create SVG element
        this._createElement();
        
        // Add starting point if provided
        if (options.x !== undefined && options.y !== undefined) {
            this.addPoint({
                x: options.x,
                y: options.y,
                pressure: 0.5,
                width: this.strokeWidth,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Create the SVG path element
     * @private
     */
    _createElement() {
        this.jsvgPath = new jsvgPath();
        this.element = this.jsvgPath.svgObject; // Get the underlying SVG element
        this.jsvgPath.setFillColor('none');
        this.jsvgPath.setStrokeColor(this.strokeColor);
        this.jsvgPath.setStrokeWidth(this.strokeWidth);
        this.element.setAttribute('stroke-opacity', this.strokeOpacity);
        this.element.setAttribute('stroke-linecap', 'round');
        this.element.setAttribute('stroke-linejoin', 'round');
        this.element.setAttribute('data-stroke-id', this.id);
        this.element.setAttribute('data-tool', this.tool);
    }
    
    /**
     * Add a point to the stroke
     * @param {Object} point - Point data
     * @param {number} point.x - X coordinate
     * @param {number} point.y - Y coordinate
     * @param {number} [point.pressure=0.5] - Pressure value
     * @param {number} [point.width] - Stroke width at this point
     * @param {number} [point.timestamp] - Timestamp
     */
    addPoint(point) {
        const normalizedPoint = {
            x: point.x,
            y: point.y,
            pressure: point.pressure || 0.5,
            width: point.width || this.strokeWidth,
            timestamp: point.timestamp || Date.now()
        };
        
        this.points.push(normalizedPoint);
        this._updatePath();
        this._updateBoundingBox();
    }
    
    /**
     * Update the SVG path based on current points
     * @private
     */
    _updatePath() {
        if (this.points.length === 0) {
            this.jsvgPath.clearPoints();
            return;
        }
        
        this.jsvgPath.clearPoints(); // Clear existing points before adding new ones
        
        if (this.points.length === 1) {
            // Single point - draw a small circle
            const point = this.points[0];
            this.jsvgPath.addPoint(point.x, point.y);
            this.jsvgPath.addPoint(point.x + 0.1, point.y); // Add a second point for a tiny line
        } else {
            // Multiple points - create smooth path
            this._generateSmoothPath();
        }
        
        this.jsvgPath.updatePath();
    }
    
    /**
     * Generate smooth path using cubic Bézier curves
     * @private
     */
    _generateSmoothPath() {
        if (this.points.length < 2) return '';
        
        this.jsvgPath.addPoint(this.points[0].x, this.points[0].y);
        
        if (this.points.length === 2) {
            // Simple line for 2 points
            this.jsvgPath.addPoint(this.points[1].x, this.points[1].y);
            return;
        }
        
        // Use cubic Bézier curves for smoother paths
        for (let i = 1; i < this.points.length - 1; i++) {
            const prev = this.points[i - 1];
            const curr = this.points[i];
            const next = this.points[i + 1];
            
            // Calculate control points for smooth curve
            const cp1x = curr.x + (next.x - prev.x) * 0.25;
            const cp1y = curr.y + (next.y - prev.y) * 0.25;
            const cp2x = next.x - (next.x - curr.x) * 0.25;
            const cp2y = next.y - (next.y - curr.y) * 0.25;
            
            // jsvgPath doesn't directly support cubic bezier curves, so we'll approximate with more points
            // For a true cubic bezier, we'd need to extend jsvgPath or use raw SVG path data.
            // For now, we'll just add the next point.
            this.jsvgPath.addPoint(next.x, next.y);
        }
    }
    
    /**
     * Update bounding box based on current points
     * @private
     */
    _updateBoundingBox() {
        if (this.points.length === 0) return;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.points.forEach(point => {
            const radius = point.width / 2;
            minX = Math.min(minX, point.x - radius);
            minY = Math.min(minY, point.y - radius);
            maxX = Math.max(maxX, point.x + radius);
            maxY = Math.max(maxY, point.y + radius);
        });
        
        this.boundingBox.set(minX, minY, maxX - minX, maxY - minY);
    }
    
    /**
     * Finish the stroke (no more points will be added)
     */
    finish() {
        this.isFinished = true;
        this.element.setAttribute('data-finished', 'true');
    }
    
    /**
     * Set stroke selection state
     * @param {boolean} selected - Whether stroke is selected
     */
    setSelected(selected) {
        this.isSelected = selected;
        
        if (selected) {
            this.element.setAttribute('stroke-dasharray', '5,5');
            this.element.setAttribute('data-selected', 'true');
        } else {
            this.element.removeAttribute('stroke-dasharray');
            this.element.removeAttribute('data-selected');
        }
    }
    
    /**
     * Update stroke configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
        if (config.strokeColor !== undefined) {
            this.strokeColor = config.strokeColor;
            this.jsvgPath.setStrokeColor(this.strokeColor);
        }
        
        if (config.strokeWidth !== undefined) {
            this.strokeWidth = config.strokeWidth;
            this.jsvgPath.setStrokeWidth(this.strokeWidth);
        }
        
        if (config.strokeOpacity !== undefined) {
            this.strokeOpacity = config.strokeOpacity;
            this.element.setAttribute('stroke-opacity', this.strokeOpacity);
        }
    }
    
    /**
     * Check if a point is near this stroke
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} [tolerance=10] - Distance tolerance
     * @returns {boolean} True if point is near stroke
     */
    isNearPoint(x, y, tolerance = 10) {
        // Quick bounding box check first
        if (!this.boundingBox.containsPoint(x, y, tolerance)) {
            return false;
        }
        
        // Check distance to each line segment
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            
            const distance = this._distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            if (distance <= tolerance) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Calculate distance from point to line segment
     * @private
     */
    _distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {
            // Points are the same
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }
        
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        
        return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    }
    
    /**
     * Get stroke length
     * @returns {number} Total stroke length
     */
    getLength() {
        let length = 0;
        
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        
        return length;
    }
    
    /**
     * Get stroke data for serialization
     * @returns {Object} Serializable stroke data
     */
    toJSON() {
        return {
            id: this.id,
            tool: this.tool,
            strokeWidth: this.strokeWidth,
            strokeColor: this.strokeColor,
            strokeOpacity: this.strokeOpacity,
            points: this.points,
            isFinished: this.isFinished,
            boundingBox: this.boundingBox.toJSON()
        };
    }
    
    /**
     * Create stroke from serialized data
     * @param {Object} data - Serialized stroke data
     * @returns {Stroke} New stroke instance
     */
    static fromJSON(data) {
        const stroke = new Stroke({
            id: data.id,
            tool: data.tool,
            strokeWidth: data.strokeWidth,
            strokeColor: data.strokeColor,
            strokeOpacity: data.strokeOpacity
        });
        
        // Add all points
        data.points.forEach(point => stroke.addPoint(point));
        
        if (data.isFinished) {
            stroke.finish();
        }
        
        return stroke;
    }
    
    /**
     * Generate unique stroke ID
     * @private
     */
    _generateId() {
        return `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Clone this stroke
     * @returns {Stroke} New stroke instance
     */
    clone() {
        return Stroke.fromJSON(this.toJSON());
    }
    
    /**
     * Get point count
     * @returns {number} Number of points in stroke
     */
    getPointCount() {
        return this.points.length;
    }
    
    /**
     * Get bounding box
     * @returns {BoundingBox} Stroke bounding box
     */
    getBoundingBox() {
        return this.boundingBox;
    }
    
    /**
     * Move stroke by offset
     * @param {number} dx - X offset
     * @param {number} dy - Y offset
     */
    move(dx, dy) {
        this.points.forEach(point => {
            point.x += dx;
            point.y += dy;
        });
        
        this._updatePath();
        this._updateBoundingBox();
    }
    
    /**
     * Scale stroke by factor
     * @param {number} scale - Scale factor
     * @param {number} [originX=0] - Scale origin X
     * @param {number} [originY=0] - Scale origin Y
     */
    scale(scale, originX = 0, originY = 0) {
        this.points.forEach(point => {
            point.x = originX + (point.x - originX) * scale;
            point.y = originY + (point.y - originY) * scale;
            point.width *= scale;
        });
        
        this.strokeWidth *= scale;
        this.jsvgPath.setStrokeWidth(this.strokeWidth);
        
        this._updatePath();
        this._updateBoundingBox();
    }
} 