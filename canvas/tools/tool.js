import { Stroke } from '../drawing/stroke.js';

/**
 * Base class for all canvas tools
 * All tools should extend this class and implement the required methods
 */
export class Tool {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     * @param {Object} options - Tool options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.name = '';
        this.displayName = '';
        this.description = '';
        this.icon = '';
        this.shortcut = '';
        this.category = 'general';
        
        // Tool state
        this.isActive = false;
        this.isDrawing = false;
        this.currentStroke = null;
        
        // Configuration
        this.config = {
            strokeWidth: 5,
            strokeColor: '#000000',
            strokeOpacity: 1,
            ...options
        };
        
        // Bind methods
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }
    
    /**
     * Called when tool is activated
     * Subclasses can override this to perform setup
     */
    onActivate() {
        this.isActive = true;
        this.canvas.emit('toolActivated', { tool: this, name: this.name });
    }
    
    /**
     * Called when tool is deactivated
     * Subclasses can override this to perform cleanup
     */
    onDeactivate() {
        this.isActive = false;
        
        // Cancel any ongoing drawing
        if (this.isDrawing) {
            this.onCancel();
        }
        
        this.canvas.emit('toolDeactivated', { tool: this, name: this.name });
    }
    
    /**
     * Handle pointer down events
     * Subclasses must implement this method
     * @param {Object} event - Normalized pointer event
     */
    onPointerDown(event) {
        throw new Error('Tool.onPointerDown() must be implemented by subclass');
    }
    
    /**
     * Handle pointer move events
     * Subclasses must implement this method
     * @param {Object} event - Normalized pointer event
     */
    onPointerMove(event) {
        throw new Error('Tool.onPointerMove() must be implemented by subclass');
    }
    
    /**
     * Handle pointer up events
     * Subclasses must implement this method
     * @param {Object} event - Normalized pointer event
     */
    onPointerUp(event) {
        throw new Error('Tool.onPointerUp() must be implemented by subclass');
    }
    
    /**
     * Cancel current tool action
     * Subclasses can override this to handle cancellation
     */
    onCancel() {
        if (this.isDrawing) {
            this.isDrawing = false;
            
            // Remove incomplete stroke if any
            if (this.currentStroke && this.currentStroke.id) {
                this.canvas.removeStroke(this.currentStroke.id);
            }
            
            this.currentStroke = null;
        }
    }
    
    /**
     * Update tool configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.onConfigUpdate();
    }
    
    /**
     * Called when configuration is updated
     * Subclasses can override this to respond to config changes
     */
    onConfigUpdate() {
        // Default implementation does nothing
    }
    
    /**
     * Get current tool configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    
    /**
     * Check if tool is currently drawing
     * @returns {boolean} True if drawing
     */
    isDrawingActive() {
        return this.isDrawing;
    }
    
    /**
     * Get tool cursor style
     * @returns {string} CSS cursor value or tool name for custom cursor
     */
    getCursor() {
        return this.name;
    }
    
    /**
     * Get tool properties for serialization
     * @returns {Object} Serializable tool properties
     */
    getProperties() {
        return {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            icon: this.icon,
            shortcut: this.shortcut,
            category: this.category,
            config: this.getConfig()
        };
    }
    
    /**
     * Create a stroke with tool's current configuration
     * @param {number} x - Starting X coordinate
     * @param {number} y - Starting Y coordinate
     * @returns {Stroke} New stroke instance
     */
    createStroke(x, y) {
        const strokeConfig = {
            x,
            y,
            strokeWidth: this.config.strokeWidth,
            strokeColor: this.config.strokeColor,
            strokeOpacity: this.config.strokeOpacity,
            tool: this.name
        };
        
        return new Stroke(strokeConfig);
    }
    
    /**
     * Calculate stroke width based on pressure (if supported)
     * @param {number} pressure - Pressure value (0-1)
     * @returns {number} Calculated stroke width
     */
    calculateStrokeWidth(pressure = 0.5) {
        const baseWidth = this.config.strokeWidth;
        const minWidth = Math.max(1, baseWidth * 0.3);
        const maxWidth = baseWidth * 1.5;
        
        return minWidth + (maxWidth - minWidth) * pressure;
    }
    
    /**
     * Handle keyboard shortcut
     * @param {string} key - Key that was pressed
     * @param {Object} event - Keyboard event
     * @returns {boolean} True if shortcut was handled
     */
    onKeyboardShortcut(key, event) {
        // Default implementation - subclasses can override
        return false;
    }
    
    /**
     * Get help text for this tool
     * @returns {string} Help text
     */
    getHelpText() {
        return `${this.displayName}: ${this.description}`;
    }
    
    /**
     * Validate if tool can be used with current canvas state
     * @returns {boolean} True if tool can be used
     */
    canUse() {
        return !this.canvas.isDestroyed && this.isActive;
    }
} 