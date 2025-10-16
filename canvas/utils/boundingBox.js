export class BoundingBox {
    /**
     * @param {number} [x=0] - X coordinate
     * @param {number} [y=0] - Y coordinate  
     * @param {number} [width=0] - Width
     * @param {number} [height=0] - Height
     */
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    /**
     * Set bounding box values
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     */
    set(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    /**
     * Get left edge
     * @returns {number} Left X coordinate
     */
    get left() {
        return this.x;
    }
    
    /**
     * Get right edge
     * @returns {number} Right X coordinate
     */
    get right() {
        return this.x + this.width;
    }
    
    /**
     * Get top edge
     * @returns {number} Top Y coordinate
     */
    get top() {
        return this.y;
    }
    
    /**
     * Get bottom edge
     * @returns {number} Bottom Y coordinate
     */
    get bottom() {
        return this.y + this.height;
    }
    
    /**
     * Get center X coordinate
     * @returns {number} Center X
     */
    get centerX() {
        return this.x + this.width / 2;
    }
    
    /**
     * Get center Y coordinate
     * @returns {number} Center Y
     */
    get centerY() {
        return this.y + this.height / 2;
    }
    
    /**
     * Get center point
     * @returns {Object} {x, y} center coordinates
     */
    get center() {
        return {
            x: this.centerX,
            y: this.centerY
        };
    }
    
    /**
     * Check if point is inside bounding box
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} [tolerance=0] - Tolerance for edge cases
     * @returns {boolean} True if point is inside
     */
    containsPoint(x, y, tolerance = 0) {
        return x >= this.left - tolerance &&
               x <= this.right + tolerance &&
               y >= this.top - tolerance &&
               y <= this.bottom + tolerance;
    }
    
    /**
     * Check if this bounding box intersects with another
     * @param {BoundingBox} other - Other bounding box
     * @returns {boolean} True if boxes intersect
     */
    intersects(other) {
        return !(this.right < other.left ||
                 other.right < this.left ||
                 this.bottom < other.top ||
                 other.bottom < this.top);
    }
    
    /**
     * Check if this bounding box completely contains another
     * @param {BoundingBox} other - Other bounding box
     * @returns {boolean} True if this box contains the other
     */
    contains(other) {
        return this.left <= other.left &&
               this.right >= other.right &&
               this.top <= other.top &&
               this.bottom >= other.bottom;
    }
    
    /**
     * Expand bounding box to include a point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    expandToIncludePoint(x, y) {
        if (this.width === 0 && this.height === 0) {
            // First point
            this.x = x;
            this.y = y;
            this.width = 0;
            this.height = 0;
        } else {
            const newLeft = Math.min(this.left, x);
            const newTop = Math.min(this.top, y);
            const newRight = Math.max(this.right, x);
            const newBottom = Math.max(this.bottom, y);
            
            this.x = newLeft;
            this.y = newTop;
            this.width = newRight - newLeft;
            this.height = newBottom - newTop;
        }
    }
    
    /**
     * Expand bounding box to include another bounding box
     * @param {BoundingBox} other - Other bounding box
     */
    expandToIncludeBox(other) {
        if (other.width === 0 && other.height === 0) return;
        
        if (this.width === 0 && this.height === 0) {
            this.set(other.x, other.y, other.width, other.height);
        } else {
            const newLeft = Math.min(this.left, other.left);
            const newTop = Math.min(this.top, other.top);
            const newRight = Math.max(this.right, other.right);
            const newBottom = Math.max(this.bottom, other.bottom);
            
            this.x = newLeft;
            this.y = newTop;
            this.width = newRight - newLeft;
            this.height = newBottom - newTop;
        }
    }
    
    /**
     * Get intersection with another bounding box
     * @param {BoundingBox} other - Other bounding box
     * @returns {BoundingBox|null} Intersection box or null if no intersection
     */
    getIntersection(other) {
        if (!this.intersects(other)) {
            return null;
        }
        
        const left = Math.max(this.left, other.left);
        const top = Math.max(this.top, other.top);
        const right = Math.min(this.right, other.right);
        const bottom = Math.min(this.bottom, other.bottom);
        
        return new BoundingBox(left, top, right - left, bottom - top);
    }
    
    /**
     * Get union with another bounding box
     * @param {BoundingBox} other - Other bounding box
     * @returns {BoundingBox} Union bounding box
     */
    getUnion(other) {
        if (this.width === 0 && this.height === 0) {
            return other.clone();
        }
        
        if (other.width === 0 && other.height === 0) {
            return this.clone();
        }
        
        const left = Math.min(this.left, other.left);
        const top = Math.min(this.top, other.top);
        const right = Math.max(this.right, other.right);
        const bottom = Math.max(this.bottom, other.bottom);
        
        return new BoundingBox(left, top, right - left, bottom - top);
    }
    
    /**
     * Inflate (expand) bounding box by amount
     * @param {number} amount - Amount to inflate (positive to expand, negative to shrink)
     */
    inflate(amount) {
        this.x -= amount;
        this.y -= amount;
        this.width += amount * 2;
        this.height += amount * 2;
        
        // Ensure width/height don't go negative
        this.width = Math.max(0, this.width);
        this.height = Math.max(0, this.height);
    }
    
    /**
     * Move bounding box by offset
     * @param {number} dx - X offset
     * @param {number} dy - Y offset
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
    
    /**
     * Scale bounding box by factor
     * @param {number} scale - Scale factor
     * @param {number} [originX] - Scale origin X (defaults to center)
     * @param {number} [originY] - Scale origin Y (defaults to center)
     */
    scale(scale, originX = this.centerX, originY = this.centerY) {
        const newWidth = this.width * scale;
        const newHeight = this.height * scale;
        
        this.x = originX - (originX - this.x) * scale;
        this.y = originY - (originY - this.y) * scale;
        this.width = newWidth;
        this.height = newHeight;
    }
    
    /**
     * Get area of bounding box
     * @returns {number} Area
     */
    getArea() {
        return this.width * this.height;
    }
    
    /**
     * Get perimeter of bounding box
     * @returns {number} Perimeter
     */
    getPerimeter() {
        return 2 * (this.width + this.height);
    }
    
    /**
     * Check if bounding box is empty (zero area)
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.width <= 0 || this.height <= 0;
    }
    
    /**
     * Check if bounding box is valid
     * @returns {boolean} True if valid
     */
    isValid() {
        return !isNaN(this.x) && !isNaN(this.y) && 
               !isNaN(this.width) && !isNaN(this.height) &&
               this.width >= 0 && this.height >= 0;
    }
    
    /**
     * Calculate distance from point to bounding box
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Distance (0 if point is inside)
     */
    distanceToPoint(x, y) {
        if (this.containsPoint(x, y)) {
            return 0;
        }
        
        const dx = Math.max(0, Math.max(this.left - x, x - this.right));
        const dy = Math.max(0, Math.max(this.top - y, y - this.bottom));
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get corners of bounding box
     * @returns {Array<Object>} Array of {x, y} corner points
     */
    getCorners() {
        return [
            { x: this.left, y: this.top },      // Top-left
            { x: this.right, y: this.top },     // Top-right
            { x: this.right, y: this.bottom },  // Bottom-right
            { x: this.left, y: this.bottom }    // Bottom-left
        ];
    }
    
    /**
     * Create a copy of this bounding box
     * @returns {BoundingBox} New bounding box instance
     */
    clone() {
        return new BoundingBox(this.x, this.y, this.width, this.height);
    }
    
    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `BoundingBox(${this.x}, ${this.y}, ${this.width}, ${this.height})`;
    }
    
    /**
     * Convert to JSON object
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Create bounding box from JSON object
     * @param {Object} json - JSON representation
     * @returns {BoundingBox} New bounding box instance
     */
    static fromJSON(json) {
        return new BoundingBox(json.x, json.y, json.width, json.height);
    }
    
    /**
     * Create bounding box from array of points
     * @param {Array<Object>} points - Array of {x, y} points
     * @returns {BoundingBox} Bounding box containing all points
     */
    static fromPoints(points) {
        if (points.length === 0) {
            return new BoundingBox();
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
    }
} 