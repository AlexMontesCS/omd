export class CanvasConfig {
    /**
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Default configuration
        this.width = options.width || 800;
        this.height = options.height || 500;
        this.backgroundColor = options.backgroundColor || 'white';
        
        // UI options
        this.showToolbar = options.showToolbar !== false;
        this.showGrid = options.showGrid || false;
        this.gridSpacing = options.gridSpacing || 20;
        
        // Tool configuration
        this.enabledTools = options.enabledTools || ['pointer', 'pencil', 'eraser'];
        this.defaultTool = options.defaultTool || 'pointer';
        
        // Feature flags
        this.enableFocusFrames = options.enableFocusFrames !== false;
        this.enableKeyboardShortcuts = options.enableKeyboardShortcuts !== false;
        this.enableMultiTouch = options.enableMultiTouch !== false;
        
        // Tool defaults
        this.tools = {
            pencil: {
                strokeWidth: 5,
                strokeColor: '#000000',
                strokeOpacity: 1,
                smoothing: 0.5,
                pressureSensitivity: true,
                ...options.tools?.pencil
            },
            eraser: {
                size: 20,
                hardness: 0.8,
                ...options.tools?.eraser
            }
        };
        
        // Theme
        this.theme = {
            primary: '#007bff',
            secondary: '#6c757d',
            success: '#28a745',
            warning: '#ffc107',
            danger: '#dc3545',
            ...options.theme
        };

        // Selection / resize-handle styling
        this.selection = {
            // Selection border
            border: {
                color:        options.selection?.border?.color        ?? '#007bff',
                width:        options.selection?.border?.width        ?? 2,
                dasharray:    options.selection?.border?.dasharray    ?? '4,2',
                cornerRadius: options.selection?.border?.cornerRadius ?? undefined,
            },
            // Resize handles
            handle: {
                size:         options.selection?.handle?.size         ?? 8,
                color:        options.selection?.handle?.color        ?? '#007bff',
                strokeColor:  options.selection?.handle?.strokeColor  ?? '#ffffff',
                strokeWidth:  options.selection?.handle?.strokeWidth  ?? 1,
                cornerRadius: options.selection?.handle?.cornerRadius ?? 1,
            },
        };

        // Validate configuration
        this._validate();
    }
    
    /**
     * Validate configuration
     * @private
     */
    _validate() {
        // Validate dimensions
        if (this.width <= 0 || this.height <= 0) {
            throw new Error('Canvas dimensions must be positive numbers');
        }
        
        // Validate enabled tools
        const availableTools = ['pointer', 'pencil', 'eraser'];
        const invalidTools = this.enabledTools.filter(tool => !availableTools.includes(tool));
        if (invalidTools.length > 0) {
            console.warn(`Invalid tools specified: ${invalidTools.join(', ')}`);
            this.enabledTools = this.enabledTools.filter(tool => availableTools.includes(tool));
        }

        // Ensure at least one tool is enabled
        if (this.enabledTools.length === 0) {
            this.enabledTools = ['pencil'];
        }
        
        // Validate default tool
        if (!this.enabledTools.includes(this.defaultTool)) {
            this.defaultTool = this.enabledTools[0];
        }
        
        // Validate tool configurations
        this._validateToolConfigs();
    }
    
    /**
     * Validate tool configurations
     * @private
     */
    _validateToolConfigs() {
        // Validate pencil config
        if (this.tools.pencil.strokeWidth <= 0) {
            this.tools.pencil.strokeWidth = 5;
        }
        if (this.tools.pencil.strokeOpacity < 0 || this.tools.pencil.strokeOpacity > 1) {
            this.tools.pencil.strokeOpacity = 1;
        }
        
        // Validate eraser config
        if (this.tools.eraser.size <= 0) {
            this.tools.eraser.size = 20;
        }
        if (this.tools.eraser.hardness < 0 || this.tools.eraser.hardness > 1) {
            this.tools.eraser.hardness = 0.8;
        }
    }

    /**
     * Update configuration
     * @param {Object} updates - Configuration updates
     */
    update(updates) {
        Object.assign(this, updates);
        this._validate();
    }
    
    /**
     * Get tool configuration
     * @param {string} toolName - Tool name
     * @returns {Object} Tool configuration
     */
    getToolConfig(toolName) {
        return this.tools[toolName] || {};
    }
    
    /**
     * Update tool configuration
     * @param {string} toolName - Tool name
     * @param {Object} config - Tool configuration updates
     */
    updateToolConfig(toolName, config) {
        if (!this.tools[toolName]) {
            this.tools[toolName] = {};
        }
        Object.assign(this.tools[toolName], config);
        this._validateToolConfigs();
    }
    
    /**
     * Clone configuration
     * @returns {CanvasConfig} New configuration instance
     */
    clone() {
        return new CanvasConfig({
            width: this.width,
            height: this.height,
            backgroundColor: this.backgroundColor,
            showToolbar: this.showToolbar,
            showGrid: this.showGrid,
            gridSpacing: this.gridSpacing,
            enabledTools: [...this.enabledTools],
            defaultTool: this.defaultTool,
            enableFocusFrames: this.enableFocusFrames,
            enableKeyboardShortcuts: this.enableKeyboardShortcuts,
            enableMultiTouch: this.enableMultiTouch,
            tools: JSON.parse(JSON.stringify(this.tools)),
            theme: { ...this.theme },
            selection: JSON.parse(JSON.stringify(this.selection))
        });
    }
    
    /**
     * Convert to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            width: this.width,
            height: this.height,
            backgroundColor: this.backgroundColor,
            showToolbar: this.showToolbar,
            showGrid: this.showGrid,
            gridSpacing: this.gridSpacing,
            enabledTools: this.enabledTools,
            defaultTool: this.defaultTool,
            enableFocusFrames: this.enableFocusFrames,
            enableKeyboardShortcuts: this.enableKeyboardShortcuts,
            enableMultiTouch: this.enableMultiTouch,
            tools: this.tools,
            theme: this.theme,
            selection: this.selection
        };
    }
    
    /**
     * Create from JSON
     * @param {Object} data - JSON data
     * @returns {CanvasConfig} New configuration instance
     */
    static fromJSON(data) {
        return new CanvasConfig(data);
    }
} 