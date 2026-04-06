import { CanvasConfig } from './canvasConfig.js';
import { EventManager } from '../events/eventManager.js';
import { ToolManager } from '../tools/toolManager.js';
import { PencilTool } from '../tools/PencilTool.js';
import { EraserTool } from '../tools/EraserTool.js';
import { PointerTool } from '../tools/PointerTool.js';
import { Cursor } from '../ui/cursor.js';
import { Toolbar } from '../ui/toolbar.js';
import { FocusFrameManager } from '../features/focusFrameManager.js';
import {jsvgGroup} from '@teachinglab/jsvg'

// Create a clone that is safe to draw onto an HTML canvas.
// Chrome will taint canvases if an SVG contains <foreignObject> nodes,
// so we replace them with basic <text> nodes during export.
function cloneSVGForExport(svgRoot, options = {}) {
    const { stripForeignObjects = true } = options;
    const clone = svgRoot.cloneNode(true);

    if (stripForeignObjects) {
        const ns = 'http://www.w3.org/2000/svg';
        clone.querySelectorAll('foreignObject').forEach((fo) => {
            const parent = fo.parentNode;
            if (!parent) return;

            const htmlEl = fo.firstElementChild;
            const textContent = (htmlEl?.innerText || htmlEl?.textContent || '').trim();
            const textEl = document.createElementNS(ns, 'text');
            textEl.textContent = textContent;

            const x = parseFloat(fo.getAttribute('x') || '0');
            const y = parseFloat(fo.getAttribute('y') || '0');
            const width = parseFloat(fo.getAttribute('width') || '0');
            const fontFamily = htmlEl?.style?.fontFamily || 'sans-serif';
            const fontSizeStr = htmlEl?.style?.fontSize || '16px';
            const fontSize = parseFloat(fontSizeStr) || 16;
            const fontWeight = htmlEl?.style?.fontWeight || 'normal';
            const fill = htmlEl?.style?.color || 'black';
            const textAlign = htmlEl?.style?.textAlign || 'start';

            textEl.setAttribute('font-family', fontFamily);
            textEl.setAttribute('font-size', `${fontSize}px`);
            textEl.setAttribute('font-weight', fontWeight);
            textEl.setAttribute('fill', fill);
            textEl.setAttribute('dominant-baseline', 'hanging');

            // Approximate alignment using the known foreignObject width
            let textX = x;
            if (!isNaN(width) && width > 0) {
                if (textAlign === 'center') {
                    textX = x + width / 2;
                    textEl.setAttribute('text-anchor', 'middle');
                } else if (textAlign === 'end' || textAlign === 'right') {
                    textX = x + width;
                    textEl.setAttribute('text-anchor', 'end');
                }
            }
            textEl.setAttribute('x', textX);
            // Bump y by font size so the text sits inside the original box
            textEl.setAttribute('y', y + fontSize);

            parent.replaceChild(textEl, fo);
        });
    }

    return clone;
}
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
            width: 100%;
            height: 100%;
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

        // Keep the custom cursor above toolbar/buttons and all other SVG UI.
        if (this.cursor && this.svg) {
            this.cursor.attachTo(this.svg);
        }

        // Apply any selection styles defined in config to the ResizeHandleManager
        // (PointerTool registers the manager on canvas.resizeHandleManager during its constructor)
        if (this.resizeHandleManager && this.config.selection) {
            this.resizeHandleManager.setSelectionStyle(this.config.selection.border);
            this.resizeHandleManager.setHandleStyle(this.config.selection.handle);
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
     * @param {Object} options - Export options
     * @param {boolean} options.stripForeignObjects - Replace <foreignObject> with <text> for canvas-safe exports (default true)
     * @returns {string} SVG content
     */
    exportSVG(options = {}) {
        const svgClone = cloneSVGForExport(this.svg, options);
        
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
     * @param {Object} options - Export options passed to exportSVG (e.g., { stripForeignObjects: true })
     * @returns {Promise<Blob>} Image blob
     */
    async exportImage(format = 'png', quality = 1, options = {}) {
        // Allow passing options as the second argument for backward compatibility
        if (typeof quality === 'object' && quality !== null) {
            options = quality;
            quality = 1;
        }
        if (typeof format === 'object' && format !== null) {
            options = format;
            format = 'png';
            quality = 1;
        }

        const svgData = this.exportSVG(options);
        const canvas = document.createElement('canvas');
        canvas.width = this.config.width;
        canvas.height = this.config.height;
        
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
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
     * Handle window resize — resize the canvas to match the container.
     * @private
     */
    _handleResize() {
        if (!this.container) return;
        const w = Math.max(400, this.container.clientWidth  || this.container.getBoundingClientRect().width  || 0);
        const h = Math.max(400, this.container.clientHeight || this.container.getBoundingClientRect().height || 0);
        if (!w || !h) return;
        if (Math.abs(w - this.config.width) < 1 && Math.abs(h - this.config.height) < 1) return;
        this.resize(w, h);
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
    /**
     * Style the selection border shown when an OMD visual is selected.
     * Can be called at any time; changes take effect immediately.
     * @param {Object} style
     * @param {string}  [style.color]        - Border stroke colour (e.g. '#007bff')
     * @param {number}  [style.width]        - Border stroke width in px
     * @param {string}  [style.dasharray]    - SVG stroke-dasharray (e.g. '4,2' or 'none')
     * @param {number}  [style.cornerRadius] - Border corner radius
     */
    setSelectionStyle(style = {}) {
        if (this.resizeHandleManager) {
            this.resizeHandleManager.setSelectionStyle(style);
        }
        // Persist into config so clones / serialisation reflect the change
        if (this.config.selection?.border) {
            Object.assign(this.config.selection.border, style);
        }
    }

    /**
     * Style the resize handles shown when an OMD visual is selected.
     * Can be called at any time; changes take effect immediately.
     * @param {Object} style
     * @param {number}  [style.size]         - Handle size in px
     * @param {string}  [style.color]        - Handle fill colour
     * @param {string}  [style.strokeColor]  - Handle border colour
     * @param {number}  [style.strokeWidth]  - Handle border width in px
     * @param {number}  [style.cornerRadius] - Handle corner radius (0 = square, size/2 = circle)
     */
    setHandleStyle(style = {}) {
        if (this.resizeHandleManager) {
            this.resizeHandleManager.setHandleStyle(style);
        }
        // Persist into config
        if (this.config.selection?.handle) {
            Object.assign(this.config.selection.handle, style);
        }
    }
} 