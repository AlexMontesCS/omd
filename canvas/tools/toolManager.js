export class ToolManager {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.tools = new Map();
        this.activeTool = null;
        this.previousTool = null;
        this.isDestroyed = false;
    }
    
    /**
     * Register a tool with the manager
     * @param {string} name - Tool name
     * @param {Tool} tool - Tool instance
     * @returns {boolean} True if tool was registered successfully
     */
    registerTool(name, tool) {
        if (this.isDestroyed) {
            console.warn('Cannot register tool on destroyed ToolManager');
            return false;
        }
        
        if (!name || typeof name !== 'string') {
            console.error('Tool name must be a non-empty string');
            return false;
        }
        
        if (!tool || typeof tool.onPointerDown !== 'function') {
            console.error('Tool must implement required methods');
            return false;
        }
        
        // Check if tool is enabled in config
        if (!this.canvas.config.enabledTools.includes(name)) {
            console.warn(`Tool '${name}' is not enabled in canvas configuration`);
            return false;
        }
        
        // Set tool name and canvas reference
        tool.name = name;
        tool.canvas = this.canvas;
        
        // Store tool
        this.tools.set(name, tool);
        
        return true;
    }
    
    /**
     * Unregister a tool
     * @param {string} name - Tool name
     * @returns {boolean} True if tool was unregistered
     */
    unregisterTool(name) {
        const tool = this.tools.get(name);
        if (!tool) return false;
        
        // Deactivate if it's the active tool
        if (this.activeTool === tool) {
            this.setActiveTool(null);
        }
        
        // Remove from tools
        this.tools.delete(name);
        
        return true;
    }
    
    /**
     * Set the active tool
     * @param {string|null} toolName - Tool name to activate, or null to deactivate all
     * @returns {boolean} True if tool was activated successfully
     */
    setActiveTool(toolName) {
        // Deactivate current tool
        if (this.activeTool) {
            try {
                this.activeTool.onDeactivate();
            } catch (error) {
                console.error('Error deactivating tool:', error);
            }
            this.previousTool = this.activeTool;
        }
        
        // Clear active tool if null
        if (!toolName) {
            this.activeTool = null;
            this.canvas.emit('toolChanged', { name: null, tool: null, previous: this.previousTool?.name });
            return true;
        }
        
        // Get new tool
        const newTool = this.tools.get(toolName);
        if (!newTool) {
            console.error(`Tool '${toolName}' not found`);
            return false;
        }
        
        // Activate new tool
        this.activeTool = newTool;
        
        try {
            this.activeTool.onActivate();
        } catch (error) {
            console.error('Error activating tool:', error);
            this.activeTool = null;
            return false;
        }
        
        // Update cursor if available
        if (this.canvas.cursor && this.activeTool.getCursor) {
            const cursorType = this.activeTool.getCursor();
            this.canvas.cursor.setShape(cursorType);
        }
        
        // Update tool config for cursor
        if (this.canvas.cursor && this.activeTool.config) {
            this.canvas.cursor.updateFromToolConfig(this.activeTool.config);
        }
        
        // Emit tool change event
        this.canvas.emit('toolChanged', { 
            name: toolName, 
            tool: newTool, 
            previous: this.previousTool?.name 
        });
        
        return true;
    }
    
    /**
     * Get the currently active tool
     * @returns {Tool|null} Active tool instance
     */
    getActiveTool() {
        return this.activeTool;
    }
    
    /**
     * Get tool by name
     * @param {string} name - Tool name
     * @returns {Tool|undefined} Tool instance
     */
    getTool(name) {
        return this.tools.get(name);
    }
    
    /**
     * Get all registered tool names
     * @returns {Array<string>} Array of tool names
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
    
    /**
     * Get all registered tools
     * @returns {Map<string, Tool>} Map of tools
     */
    getAllTools() {
        return new Map(this.tools);
    }
    
    /**
     * Get metadata for all tools
     * @returns {Array<Object>} Array of tool metadata
     */
    getAllToolMetadata() {
        return Array.from(this.tools.entries()).map(([name, tool]) => ({
            name,
            displayName: tool.displayName || name,
            description: tool.description || '',
            shortcut: tool.shortcut || '',
            category: tool.category || 'general',
            icon: tool.icon || 'tool'
        }));
    }
    
    /**
     * Switch to previous tool
     * @returns {boolean} True if switched successfully
     */
    switchToPreviousTool() {
        if (this.previousTool) {
            return this.setActiveTool(this.previousTool.name);
        }
        return false;
    }
    
    /**
     * Temporarily switch to a tool and back
     * @param {string} toolName - Tool to switch to temporarily
     * @param {Function} callback - Function to execute with temporary tool
     * @returns {Promise<any>} Result of callback
     */
    async withTemporaryTool(toolName, callback) {
        const currentTool = this.activeTool?.name;
        
        if (!this.setActiveTool(toolName)) {
            throw new Error(`Failed to activate temporary tool: ${toolName}`);
        }
        
        try {
            const result = await callback(this.activeTool);
            return result;
        } finally {
            // Restore previous tool
            if (currentTool) {
                this.setActiveTool(currentTool);
            }
        }
    }
    
    /**
     * Update tool configuration
     * @param {string} toolName - Tool name
     * @param {Object} config - Configuration updates
     * @returns {boolean} True if updated successfully
     */
    updateToolConfig(toolName, config) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            console.error(`Tool '${toolName}' not found`);
            return false;
        }
        
        if (tool.updateConfig) {
            tool.updateConfig(config);
            
            // Update cursor if this is the active tool
            if (this.activeTool === tool && this.canvas.cursor) {
                this.canvas.cursor.updateFromToolConfig(tool.config);
            }
            
            return true;
        }
        
        console.warn(`Tool '${toolName}' does not support configuration updates`);
        return false;
    }
    
    /**
     * Get tool configuration
     * @param {string} toolName - Tool name
     * @returns {Object|null} Tool configuration
     */
    getToolConfig(toolName) {
        const tool = this.tools.get(toolName);
        return tool ? tool.config || {} : null;
    }
    
         /**
      * Check if a tool is registered
      * @param {string} toolName - Tool name
      * @returns {boolean} True if tool is registered
      */
     hasTool(toolName) {
         return this.tools.has(toolName);
     }
    
    /**
     * Check if a tool is enabled in configuration
     * @param {string} toolName - Tool name
     * @returns {boolean} True if tool is enabled
     */
    isToolEnabled(toolName) {
        return this.canvas.config.enabledTools.includes(toolName);
    }
    
    /**
     * Get tool capabilities
     * @param {string} toolName - Tool name
     * @returns {Object|null} Tool capabilities
     */
    getToolCapabilities(toolName) {
        const tool = this.tools.get(toolName);
        if (!tool) return null;
        
        return {
            name: tool.name,
            displayName: tool.displayName,
            description: tool.description,
            shortcut: tool.shortcut,
            category: tool.category,
            supportsKeyboardShortcuts: typeof tool.onKeyboardShortcut === 'function',
            supportsPressure: tool.supportsPressure || false,
            supportsMultiTouch: tool.supportsMultiTouch || false,
            configurable: typeof tool.updateConfig === 'function',
            hasHelp: typeof tool.getHelpText === 'function'
        };
    }
    
    /**
     * Handle keyboard shortcuts for tools
     * @param {string} key - Key pressed
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {boolean} True if shortcut was handled
     */
    handleKeyboardShortcut(key, event) {
        // First, check for tool switching shortcuts
        for (const [name, tool] of this.tools) {
            if (tool.shortcut && tool.shortcut.toLowerCase() === key.toLowerCase()) {
                this.setActiveTool(name);
                return true;
            }
        }
        
        // Then, delegate to active tool
        if (this.activeTool && this.activeTool.onKeyboardShortcut) {
            return this.activeTool.onKeyboardShortcut(key, event);
        }
        
        return false;
    }
    
    /**
     * Get help text for all tools or specific tool
     * @param {string} [toolName] - Optional tool name
     * @returns {string|Object} Help text
     */
    getHelpText(toolName = null) {
        if (toolName) {
            const tool = this.tools.get(toolName);
            if (tool && tool.getHelpText) {
                return tool.getHelpText();
            }
            return `No help available for tool: ${toolName}`;
        }
        
        // Return help for all tools
        const helpTexts = {};
        for (const [name, tool] of this.tools) {
            if (tool.getHelpText) {
                helpTexts[name] = tool.getHelpText();
            }
        }
        return helpTexts;
    }
    
    /**
     * Get current tool manager state
     * @returns {Object} Current state
     */
    getState() {
        return {
            activeToolName: this.activeTool?.name || null,
            previousToolName: this.previousTool?.name || null,
            registeredTools: this.getToolNames(),
            enabledTools: this.canvas.config.enabledTools,
            isDestroyed: this.isDestroyed
        };
    }
    
    /**
     * Destroy the tool manager
     */
    destroy() {
        if (this.isDestroyed) return;
        
        // Deactivate current tool
        if (this.activeTool) {
            try {
                this.activeTool.onDeactivate();
            } catch (error) {
                console.error('Error deactivating tool during destroy:', error);
            }
        }
        
        // Destroy all tools if they have a destroy method
        for (const [name, tool] of this.tools) {
            if (tool.destroy) {
                try {
                    tool.destroy();
                } catch (error) {
                    console.error(`Error destroying tool '${name}':`, error);
                }
            }
        }
        
        // Clear references
        this.tools.clear();
        this.activeTool = null;
        this.previousTool = null;
        this.canvas = null;
        this.isDestroyed = true;
        
    }
} 