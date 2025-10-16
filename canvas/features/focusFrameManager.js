export class FocusFrameManager {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.frames = new Map();
        this.activeFrameId = null;
        this.frameCounter = 0;
    }
    
    /**
     * Create a new focus frame
     * @param {Object} options - Frame options
     * @param {number} options.x - X position
     * @param {number} options.y - Y position
     * @param {number} options.width - Frame width
     * @param {number} options.height - Frame height
     * @param {boolean} [options.showOutline=true] - Show frame outline
     * @param {string} [options.outlineColor='#007bff'] - Outline color
     * @param {number} [options.outlineWidth=2] - Outline width
     * @param {boolean} [options.outlineDashed=false] - Dashed outline
     * @returns {Object} {id, frame} Created frame
     */
    createFrame(options = {}) {
        const id = `frame_${++this.frameCounter}`;
        const frame = new FocusFrame(this.canvas, id, options);
        
        this.frames.set(id, frame);
        
        // Add to focus frame layer if available
        if (this.canvas.focusFrameLayer) {
            this.canvas.focusFrameLayer.appendChild(frame.element);
        } else {
            console.warn('Focus frame layer not found!');
        }
        
        this.canvas.emit('focusFrameCreated', { id, frame });
        
        return { id, frame };
    }
    
    /**
     * Remove a focus frame
     * @param {string} frameId - Frame ID
     * @returns {boolean} True if frame was removed
     */
    removeFrame(frameId) {
        const frame = this.frames.get(frameId);
        if (!frame) return false;
        
        if (this.activeFrameId === frameId) {
            this.activeFrameId = null;
        }
        
        frame.destroy();
        this.frames.delete(frameId);
        
        this.canvas.emit('focusFrameRemoved', { frameId });
        
        return true;
    }
    
    /**
     * Get frame by ID
     * @param {string} frameId - Frame ID
     * @returns {FocusFrame|undefined} Frame instance
     */
    getFrame(frameId) {
        return this.frames.get(frameId);
    }
    
    /**
     * Set active frame
     * @param {string} frameId - Frame ID
     * @returns {boolean} True if frame was set as active
     */
    setActiveFrame(frameId) {
        const frame = this.frames.get(frameId);
        if (!frame) return false;
        
        // Deactivate previous frame
        if (this.activeFrameId) {
            const prevFrame = this.frames.get(this.activeFrameId);
            if (prevFrame) {
                prevFrame.setActive(false);
            }
        }
        
        // Activate new frame
        this.activeFrameId = frameId;
        frame.setActive(true);
        
        this.canvas.emit('focusFrameActivated', { frameId, frame });
        
        return true;
    }
    
    /**
     * Get active frame
     * @returns {FocusFrame|null} Active frame or null
     */
    getActiveFrame() {
        return this.activeFrameId ? this.frames.get(this.activeFrameId) : null;
    }
    
    /**
     * Capture content from active frame
     * @returns {string|null} SVG content or null
     */
    captureActiveFrame() {
        const activeFrame = this.getActiveFrame();
        return activeFrame ? activeFrame.capture() : null;
    }
    
    /**
     * Capture all frames
     * @returns {Map<string, string>} Map of frame IDs to SVG content
     */
    captureAllFrames() {
        const captures = new Map();
        
        for (const [id, frame] of this.frames) {
            captures.set(id, frame.capture());
        }
        
        return captures;
    }
    
    /**
     * Clear all frames
     */
    clearAllFrames() {
        for (const [id, frame] of this.frames) {
            frame.destroy();
        }
        
        this.frames.clear();
        this.activeFrameId = null;
        
        this.canvas.emit('focusFramesCleared');
    }
    
    /**
     * Get all frame IDs
     * @returns {Array<string>} Array of frame IDs
     */
    getFrameIds() {
        return Array.from(this.frames.keys());
    }
    
    /**
     * Destroy focus frame manager
     */
    destroy() {
        this.clearAllFrames();
    }
}

/**
 * Individual focus frame for capturing canvas regions
 */
class FocusFrame {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     * @param {string} id - Frame ID
     * @param {Object} options - Frame options
     */
    constructor(canvas, id, options = {}) {
        this.canvas = canvas;
        this.id = id;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 200;
        this.height = options.height || 150;
        this.showOutline = options.showOutline !== false;
        this.outlineColor = options.outlineColor || '#007bff';
        this.outlineWidth = options.outlineWidth || 2;
        this.outlineDashed = options.outlineDashed || false;
        this.isActive = false;
        this._createElement();
    }
    /**
     * Create the visual frame element
     * @private
     */
    _createElement() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'focus-frame');
        this.element.setAttribute('data-frame-id', this.id);
        this.element.style.pointerEvents = 'none'; // No pointer events
        this.element.style.zIndex = '1000';
        if (this.showOutline) {
            this.outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.outline.setAttribute('x', this.x);
            this.outline.setAttribute('y', this.y);
            this.outline.setAttribute('width', this.width);
            this.outline.setAttribute('height', this.height);
            this.outline.setAttribute('fill', 'none');
            this.outline.setAttribute('stroke', this.outlineColor);
            this.outline.setAttribute('stroke-width', this.outlineWidth);
            if (this.outlineDashed) {
                this.outline.setAttribute('stroke-dasharray', '5,5');
            }
            this.outline.style.pointerEvents = 'none';
            this.element.appendChild(this.outline);
        }
    }
    setActive(active) {
        this.isActive = active;
        if (this.outline) {
            this.outline.setAttribute('stroke-width', this.outlineWidth);
        }
    }
    capture() {
        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        tempSvg.setAttribute('width', this.width);
        tempSvg.setAttribute('height', this.height);
        tempSvg.setAttribute('viewBox', `${this.x} ${this.y} ${this.width} ${this.height}`);
        const drawingLayer = this.canvas.drawingLayer.cloneNode(true);
        tempSvg.appendChild(drawingLayer);
        return new XMLSerializer().serializeToString(tempSvg);
    }
    async toBitmap(format = 'png', quality = 1) {
        const svgData = this.capture();
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
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
    async downloadAsBitmap(filename = `focus-frame-${this.id}.png`, format = 'png') {
        try {
            const blob = await this.toBitmap(format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download frame:', error);
        }
    }
    updateBounds(bounds) {
        if (bounds.x !== undefined) this.x = bounds.x;
        if (bounds.y !== undefined) this.y = bounds.y;
        if (bounds.width !== undefined) this.width = bounds.width;
        if (bounds.height !== undefined) this.height = bounds.height;
        if (this.outline) {
            this.outline.setAttribute('x', this.x);
            this.outline.setAttribute('y', this.y);
            this.outline.setAttribute('width', this.width);
            this.outline.setAttribute('height', this.height);
        }
    }
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    destroy() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 