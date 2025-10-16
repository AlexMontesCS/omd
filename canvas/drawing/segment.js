import { BoundingBox } from '../utils/boundingBox.js';

/**
 * Represents a segment of a stroke
 */
export class segment {
    /**
     * @param {Object} options - Segment configuration
     */
    constructor(options = {}) {
        this.id = options.id || this._generateId();
        this.points = [];
        this.strokeWidth = options.strokeWidth || 5;
        this.strokeColor = options.strokeColor || '#000000';
        this.strokeOpacity = options.strokeOpacity || 1;
        
        this.boundingBox = new BoundingBox();
        this.isFinished = false;
        
        // Create SVG element
        this._createElement();
        
        // Add starting point if provided
        if (options.x !== undefined && options.y !== undefined) {
            this.addPoint(options.x, options.y, options.pressure);
        }
    }
    
    /**
     * Create SVG path element
     * @private
     */
    _createElement() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.element.setAttribute('fill', 'none');
        this.element.setAttribute('stroke', this.strokeColor);
        this.element.setAttribute('stroke-width', this.strokeWidth);
        this.element.setAttribute('stroke-opacity', this.strokeOpacity);
        this.element.setAttribute('stroke-linecap', 'round');
        this.element.setAttribute('stroke-linejoin', 'round');
        this.element.setAttribute('data-segment-id', this.id);
    }
    
    /**
     * Add point to segment
     */
    addPoint(x, y, pressure = 0.5) {
        const point = { x, y, pressure, timestamp: Date.now() };
        this.points.push(point);
        this._updatePath();
        this._updateBoundingBox();
    }
    
    /**
     * Update SVG path
     * @private
     */
    _updatePath() {
        if (this.points.length === 0) return;
        
        let pathData = '';
        
        if (this.points.length === 1) {
            const point = this.points[0];
            pathData = `M ${point.x},${point.y} L ${point.x + 0.1},${point.y}`;
        } else {
            pathData = `M ${this.points[0].x},${this.points[0].y}`;
            for (let i = 1; i < this.points.length; i++) {
                pathData += ` L ${this.points[i].x},${this.points[i].y}`;
            }
        }
        
        this.element.setAttribute('d', pathData);
    }
    
    /**
     * Update bounding box
     * @private
     */
    _updateBoundingBox() {
        if (this.points.length === 0) return;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.points.forEach(point => {
            const radius = this.strokeWidth / 2;
            minX = Math.min(minX, point.x - radius);
            minY = Math.min(minY, point.y - radius);
            maxX = Math.max(maxX, point.x + radius);
            maxY = Math.max(maxY, point.y + radius);
        });
        
        this.boundingBox.set(minX, minY, maxX - minX, maxY - minY);
    }
    
    /**
     * Mark segment as finished
     */
    finish() {
        this.isFinished = true;
        this.element.setAttribute('data-finished', 'true');
    }
    
    /**
     * Generate unique ID
     * @private
     */
    _generateId() {
        return `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get segment length
     */
    getLength() {
        let length = 0;
        for (let i = 1; i < this.points.length; i++) {
            const dx = this.points[i].x - this.points[i-1].x;
            const dy = this.points[i].y - this.points[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }
    
    /**
     * Check if point is near segment
     */
    isNearPoint(x, y, tolerance = 10) {
        return this.boundingBox.containsPoint(x, y, tolerance);
    }
    
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            points: this.points,
            strokeWidth: this.strokeWidth,
            strokeColor: this.strokeColor,
            strokeOpacity: this.strokeOpacity,
            isFinished: this.isFinished
        };
    }
    
    /**
     * Create from JSON
     */
    static fromJSON(data) {
        const segment = new Segment({
            id: data.id,
            strokeWidth: data.strokeWidth,
            strokeColor: data.strokeColor,
            strokeOpacity: data.strokeOpacity
        });
        
        data.points.forEach(point => {
            segment.addPoint(point.x, point.y, point.pressure);
        });
        
        if (data.isFinished) {
            segment.finish();
        }
        
        return segment;
    }
} 