import { CanvasConfig } from './canvasConfig.js';
import { EventManager } from '../events/eventManager.js';
import { ToolManager } from '../tools/toolManager.js';
import { PencilTool } from '../tools/PencilTool.js';
import { EraserTool } from '../tools/EraserTool.js';
import { SelectTool } from '../tools/SelectTool.js';
import { PointerTool } from '../tools/PointerTool.js';
import { Cursor } from '../ui/cursor.js';
import { Toolbar } from '../ui/toolbar.js';
import { FocusFrameManager } from '../features/focusFrameManager.js';
import {jsvgGroup} from '@teachinglab/jsvg'
/**
 * Main OMD Canvas class
 * Provides the primary interface for creating and managing a drawing canvas
 */
export class omdCanvas {
    /**
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        // Resolve container element
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!this.container) {
            throw new Error('Container element not found');
        }
        
        // Set container to relative positioning for absolute positioned children
        this.container.style.position = 'relative';
        
        // Initialize configuration
        this.config = new CanvasConfig(options);
        
        // Initialize state
        this.strokes = new Map();
        this.selectedStrokes = new Set();
        this.isDestroyed = false;
        this.strokeCounter = 0;
        
        // Event system
        this.listeners = new Map();
        
        // Initialize canvas
        this._createSVGContainer();
        this._createLayers();
        this._initializeManagers();
        this._setupEventListeners();
        
    }
    
    /**
     * Create the main SVG container
     * @private
     */
    _createSVGContainer() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', this.config.width);
        this.svg.setAttribute('height', this.config.height);
        this.svg.setAttribute('viewBox', `0 0 ${this.config.width} ${this.config.height}`);
        this.svg.style.cssText = `
            display: block;
            background: ${this.config.backgroundColor};
            cursor: none;
            touch-action: none;
            user-select: none;
        `;
        
        this.container.appendChild(this.svg);
    }
    
    /**
     * Create SVG layers for different canvas elements
     * @private
     */
    _createLayers() {
        // Background layer (grid, etc.)
        this.backgroundLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.backgroundLayer.setAttribute('class', 'background-layer');
        this.svg.appendChild(this.backgroundLayer);
        
        // Drawing layer (strokes)
        this.drawingLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.drawingLayer.setAttribute('class', 'drawing-layer');
        this.svg.appendChild(this.drawingLayer);
        
        // UI layer (selection boxes, etc.)
        this.uiLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.uiLayer.setAttribute('class', 'ui-layer');
        this.svg.appendChild(this.uiLayer);
        
        // Focus frame layer
        this.focusFrameLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.focusFrameLayer.setAttribute('class', 'focus-frame-layer');
        this.svg.appendChild(this.focusFrameLayer);
        
        // Add grid if enabled
        if (this.config.showGrid) {
            this._createGrid();
        }
    }
    
    /**
     * Initialize managers
     * @private
     */
    _initializeManagers() {
        // Tool manager
        this.toolManager = new ToolManager(this);
        
        // Register default tools
        if (this.config.enabledTools.includes('pointer')) {
            this.toolManager.registerTool('pointer', new PointerTool(this));
        }
        if (this.config.enabledTools.includes('pencil')) {
            this.toolManager.registerTool('pencil', new PencilTool(this));
        }
        if (this.config.enabledTools.includes('eraser')) {
            this.toolManager.registerTool('eraser', new EraserTool(this));
        }
        if (this.config.enabledTools.includes('select')) {
            this.toolManager.registerTool('select', new SelectTool(this));
        }
        
        // Set default tool
        if (this.config.defaultTool && this.config.enabledTools.includes(this.config.defaultTool)) {
            this.toolManager.setActiveTool(this.config.defaultTool);
        }
        
        // Event manager
        this.eventManager = new EventManager(this);
        this.eventManager.initialize();
        
        // Cursor
        this.cursor = new Cursor(this);
        
        // Toolbar
        if (this.config.showToolbar) {
            this.toolbar = new Toolbar(this);
            // Toolbar is now added directly to container in its constructor
        }
        
        // Cursor will be shown/hidden based on mouse enter/leave events
        
        // Focus frame manager
        if (this.config.enableFocusFrames) {
            this.focusFrameManager = new FocusFrameManager(this);
        }
    }
    
    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for window resize
        this._resizeHandler = () => this._handleResize();
        window.addEventListener('resize', this._resizeHandler);
        
        // Hide cursor initially - EventManager will handle show/hide
        if (this.cursor) {
            this.cursor.hide();
        }
    }
    
    /**
     * Create grid background
     * @private
     */
    _createGrid() {
        const gridSize = 20;
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'grid');
        pattern.setAttribute('width', gridSize);
        pattern.setAttribute('height', gridSize);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${gridSize} 0 L 0 0 0 ${gridSize}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ddd');
        path.setAttribute('stroke-width', '1');
        
        pattern.appendChild(path);
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.appendChild(pattern);
        this.svg.insertBefore(defs, this.backgroundLayer);
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#grid)');
        this.backgroundLayer.appendChild(rect);
    }
    
    /**
     * Add a stroke to the canvas
     * @param {Stroke} stroke - Stroke to add
     * @returns {string} Stroke ID
     */
    addStroke(stroke) {
        const id = `stroke_${++this.strokeCounter}`;
        stroke.id = id;
        if (stroke.element) {
            stroke.element.setAttribute('data-stroke-id', id);
            stroke.element.id = id;
        }
        this.strokes.set(id, stroke);
        this.drawingLayer.appendChild(stroke.element);
        
        this.emit('strokeAdded', { id, stroke });
        return id;
    }
    
    /**
     * Remove a stroke from the canvas
     * @param {string} strokeId - ID of stroke to remove
     * @returns {boolean} True if stroke was removed
     */
    removeStroke(strokeId) {
        const stroke = this.strokes.get(strokeId);
        if (!stroke) return false;
        
        
        if (stroke.element.parentNode) {
            stroke.element.parentNode.removeChild(stroke.element);
        }
        
        this.strokes.delete(strokeId);
        this.selectedStrokes.delete(strokeId);
        
        this.emit('strokeRemoved', { strokeId });
        return true;
    }
    
    /**
     * Clear all strokes
     */
    clear() {
        
        this.strokes.forEach((stroke, id) => {
            if (stroke.element.parentNode) {
                stroke.element.parentNode.removeChild(stroke.element);
            }
        });
        
        this.strokes.clear();
        this.selectedStrokes.clear();
        
        this.emit('cleared');
    }
    
    /**
     * Select strokes by IDs
     * @param {Array<string>} strokeIds - Array of stroke IDs
     */
    selectStrokes(strokeIds) {
        this.selectedStrokes.clear();
        strokeIds.forEach(id => {
            if (this.strokes.has(id)) {
                this.selectedStrokes.add(id);
            }
        });
        
        this._updateStrokeSelection();
        this.emit('selectionChanged', { selected: Array.from(this.selectedStrokes) });
    }
    
    /**
     * Update visual selection state of strokes
     * @private
     */
    _updateStrokeSelection() {
        this.strokes.forEach((stroke, id) => {
            const isSelected = this.selectedStrokes.has(id);
            if (stroke.setSelected) {
                stroke.setSelected(isSelected);
            }
        });
    }
    
    /**
     * Convert client coordinates to SVG coordinates
     * @param {number} clientX - Client X coordinate
     * @param {number} clientY - Client Y coordinate
     * @returns {Object} {x, y} SVG coordinates
     */
    clientToSVG(clientX, clientY) {
        const rect = this.svg.getBoundingClientRect();
        const scaleX = this.config.width / rect.width;
        const scaleY = this.config.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    /**
     * Export canvas as SVG string
     * @returns {string} SVG content
     */
    exportSVG() {
        const svgClone = this.svg.cloneNode(true);
        
        // Remove UI elements from export
        const uiLayer = svgClone.querySelector('.ui-layer');
        if (uiLayer) uiLayer.remove();
        
        const focusFrameLayer = svgClone.querySelector('.focus-frame-layer');
        if (focusFrameLayer) focusFrameLayer.remove();
        
        return new XMLSerializer().serializeToString(svgClone);
    }
    
    /**
     * Export canvas as image
     * @param {string} format - Image format (png, jpeg, webp)
     * @param {number} quality - Image quality (0-1)
     * @returns {Promise<Blob>} Image blob
     */
    async exportImage(format = 'png', quality = 1) {
        const svgData = this.exportSVG();
        const canvas = document.createElement('canvas');
        canvas.width = this.config.width;
        canvas.height = this.config.height;
        
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
            
            ctx.drawImage(img, 0, 0);
            
            return new Promise(resolve => {
                canvas.toBlob(resolve, `image/${format}`, quality);
            });
        } finally {
            URL.revokeObjectURL(url);
        }
    }
    
    /**
     * Resize canvas
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.config.width = width;
        this.config.height = height;
        
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        this.emit('resized', { width, height });
    }
    
    /**
     * Handle window resize
     * @private
     */
    _handleResize() {
        // Optional: implement responsive behavior
    }
    
    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        if (this.backgroundLayer.querySelector('rect[fill="url(#grid)"]')) {
            // Remove grid
            const gridRect = this.backgroundLayer.querySelector('rect[fill="url(#grid)"]');
            if (gridRect) gridRect.remove();
            const defs = this.svg.querySelector('defs');
            if (defs) defs.remove();
        } else {
            // Add grid
            this._createGrid();
        }
    }
    
    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data = {}) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback({ type: event, detail: data });
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Get canvas information
     * @returns {Object} Canvas information
     */
    getInfo() {
        return {
            width: this.config.width,
            height: this.config.height,
            strokeCount: this.strokes.size,
            selectedStrokeCount: this.selectedStrokes.size,
            activeTool: this.toolManager.getActiveTool()?.name,
            availableTools: this.toolManager.getToolNames(),
            isDestroyed: this.isDestroyed
        };
    }
    
    /**
     * Destroy the canvas and clean up resources
     */
    destroy() {
        if (this.isDestroyed) return;
        
        // Clean up event listeners
        window.removeEventListener('resize', this._resizeHandler);
        
        // Destroy managers
        if (this.eventManager) this.eventManager.destroy();
        if (this.toolManager) this.toolManager.destroy();
        if (this.focusFrameManager) this.focusFrameManager.destroy();
        if (this.toolbar) this.toolbar.destroy();
        if (this.cursor) this.cursor.destroy();
        
        // Remove DOM elements
        if (this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
        
        // Clear state
        this.strokes.clear();
        this.selectedStrokes.clear();
        this.listeners.clear();
        
        this.isDestroyed = true;
        this.emit('destroyed');
    }
} 