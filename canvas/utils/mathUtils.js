export class mathUtils {
    /**
     * Calculate distance between two points
     * @param {Object} p1 - First point {x, y}
     * @param {Object} p2 - Second point {x, y}
     * @returns {number} Distance
     */
    static distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calculate squared distance (faster than distance when just comparing)
     * @param {Object} p1 - First point {x, y}
     * @param {Object} p2 - Second point {x, y}
     * @returns {number} Squared distance
     */
    static distanceSquared(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return dx * dx + dy * dy;
    }
    
    /**
     * Calculate angle between two points
     * @param {Object} p1 - First point {x, y}
     * @param {Object} p2 - Second point {x, y}
     * @returns {number} Angle in radians
     */
    static angle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
    
    /**
     * Calculate angle in degrees
     * @param {Object} p1 - First point {x, y}
     * @param {Object} p2 - Second point {x, y}
     * @returns {number} Angle in degrees
     */
    static angleDegrees(p1, p2) {
        return this.angle(p1, p2) * 180 / Math.PI;
    }
    
    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Linear interpolation between two points
     * @param {Object} p1 - Start point {x, y}
     * @param {Object} p2 - End point {x, y}
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Object} Interpolated point {x, y}
     */
    static lerpPoint(p1, p2, t) {
        return {
            x: this.lerp(p1.x, p2.x, t),
            y: this.lerp(p1.y, p2.y, t)
        };
    }
    
    /**
     * Clamp value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Normalize value from one range to another
     * @param {number} value - Input value
     * @param {number} inMin - Input range minimum
     * @param {number} inMax - Input range maximum
     * @param {number} outMin - Output range minimum
     * @param {number} outMax - Output range maximum
     * @returns {number} Normalized value
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
    
    /**
     * Calculate distance from point to line segment
     * @param {Object} point - Point {x, y}
     * @param {Object} lineStart - Line start {x, y}
     * @param {Object} lineEnd - Line end {x, y}
     * @returns {number} Distance
     */
    static distanceToLineSegment(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {
            return this.distance(point, lineStart);
        }
        
        const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)));
        const projection = {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy
        };
        
        return this.distance(point, projection);
    }
    
    /**
     * Check if point is inside circle
     * @param {Object} point - Point {x, y}
     * @param {Object} center - Circle center {x, y}
     * @param {number} radius - Circle radius
     * @returns {boolean} True if point is inside circle
     */
    static pointInCircle(point, center, radius) {
        return this.distanceSquared(point, center) <= radius * radius;
    }
    
    /**
     * Check if point is inside rectangle
     * @param {Object} point - Point {x, y}
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @returns {boolean} True if point is inside rectangle
     */
    static pointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }
    
    /**
     * Smooth an array of points using averaging
     * @param {Array} points - Array of points
     * @param {number} factor - Smoothing factor (0-1)
     * @returns {Array} Smoothed points
     */
    static smoothPoints(points, factor = 0.5) {
        if (points.length < 3) return points;
        
        const smoothed = [points[0]]; // Keep first point
        
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            
            const avgX = (prev.x + curr.x + next.x) / 3;
            const avgY = (prev.y + curr.y + next.y) / 3;
            
            smoothed.push({
                x: this.lerp(curr.x, avgX, factor),
                y: this.lerp(curr.y, avgY, factor),
                ...curr // Preserve other properties
            });
        }
        
        smoothed.push(points[points.length - 1]); // Keep last point
        return smoothed;
    }
    
    /**
     * Generate bezier curve points
     * @param {Object} p0 - Control point 0
     * @param {Object} p1 - Control point 1
     * @param {Object} p2 - Control point 2
     * @param {Object} p3 - Control point 3
     * @param {number} steps - Number of steps
     * @returns {Array} Curve points
     */
    static bezierCurve(p0, p1, p2, p3, steps = 20) {
        const points = [];
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            const uuu = uu * u;
            const ttt = tt * t;
            
            const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
            const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    static degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    
    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    static radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }
    
    /**
     * Rotate point around center
     * @param {Object} point - Point to rotate {x, y}
     * @param {Object} center - Center of rotation {x, y}
     * @param {number} angle - Rotation angle in radians
     * @returns {Object} Rotated point {x, y}
     */
    static rotatePoint(point, center, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        return {
            x: center.x + dx * cos - dy * sin,
            y: center.y + dx * sin + dy * cos
        };
    }
    
    /**
     * Generate random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Generate random integer between min and max
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number} Random integer
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
} 