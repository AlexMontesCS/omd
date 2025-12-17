import { omdEquationSequenceNode } from '../nodes/omdEquationSequenceNode.js';
import { omdStepVisualizer } from '../step-visualizer/omdStepVisualizer.js';
import { omdToolbar } from '../display/omdToolbar.js';
import { jsvgGroup, jsvgLayoutGroup } from '@teachinglab/jsvg';
import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdOperationDisplayNode } from '../nodes/omdOperationDisplayNode.js';

/**
 * A renderable component that bundles a sequence and optional UI controls.
 * It acts as a node that can be rendered by an omdDisplay.
 * @extends jsvgGroup
 */
export class omdEquationStack extends jsvgGroup {
    /**
     * @param {Array<omdNode>} [steps=[]] - An initial array of equation steps.
     * @param {Object} [options={}] - Configuration options.
     * @param {boolean} [options.toolbar=false] - If true, creates a toolbar-driven sequence.
     * @param {boolean} [options.stepVisualizer=false] - If true, creates a sequence with a step visualizer.
     */
    constructor(steps = [], options = {}) {
        super();
        this.options = { ...options };
        
        // Normalize new structured options
        this.toolbarOptions = null;
        if (typeof options.toolbar === 'object') {
            this.toolbarOptions = { enabled: true, ...options.toolbar };
        } else if (options.toolbar === true) {
            this.toolbarOptions = { enabled: true };
        } else if (options.toolbar === false) {
            this.toolbarOptions = { enabled: false };
        }
        this.stylingOptions = options.styling || null;

        // The sequence is the core. If a visualizer is needed, that's our sequence.
        if (options.stepVisualizer) {
            // Pass through step visualizer styling options
            const stepVisualizerStyling = this.stylingOptions?.stepVisualizer || {};
            this.sequence = new omdStepVisualizer(steps, stepVisualizerStyling);
        } else {
            this.sequence = new omdEquationSequenceNode(steps);
        }

        // Apply equation background styling if provided
        if (this.stylingOptions?.equationBackground) {
            this.sequence.setDefaultEquationBackground(this.stylingOptions.equationBackground);
        }

        // Apply step visualizer background styling if provided
        if (options.stepVisualizer && this.stylingOptions?.stepVisualizerBackground) {
            if (typeof this.sequence.setBackgroundStyle === 'function') {
                this.sequence.setBackgroundStyle(this.stylingOptions.stepVisualizerBackground);
            }
        }

        // If a toolbar is needed, create it.
        if (this.toolbarOptions?.enabled) {
            // Default undo: call global hook if provided
            const toolbarOpts = { ...this.toolbarOptions };
            if (toolbarOpts.showUndoButton && !toolbarOpts.onUndo) {
                toolbarOpts.onUndo = () => {
                    if (typeof window !== 'undefined' && typeof window.onOMDToolbarUndo === 'function') {
                        try { window.onOMDToolbarUndo(this.sequence); } catch (_) {}
                    }
                };
            }
            this.toolbar = new omdToolbar(this, this.sequence, toolbarOpts);
        }

        // Overlay padding (distance from bottom when overlayed)
        this.overlayPadding = typeof this.toolbarOptions?.overlayPadding === 'number'
            ? this.toolbarOptions.overlayPadding
            : 34; // Default a bit above the very bottom to match buttons

        // Create a vertical layout group to hold the sequence and toolbar
        this.layoutGroup = new jsvgLayoutGroup();
        this.layoutGroup.setSpacer(16); // Adjust as needed for spacing
        this.layoutGroup.addChild(this.sequence);
        this._overlayChildren = [];
        
        // Handle toolbar positioning
        const position = this.toolbarOptions?.position || this.options.toolbarPosition; // backward compat
        const overlayBottom = position === 'bottom' || position === 'overlay-bottom';
        
        if (this.toolbar) {
            if (overlayBottom) {
                // For overlay positioning, add toolbar directly to this (not layoutGroup)
                this.addChild(this.toolbar.elements.toolbarGroup);
            } else {
                // For in-flow positioning, add to layout group
                this.layoutGroup.addChild(this.toolbar.elements.toolbarGroup);
            }
        }
        
        this.addChild(this.layoutGroup);
        this.updateLayout();
    }

    /**
     * Updates the layout and positioning of internal components.
     */
    updateLayout() {
        this.sequence.updateLayout();
        this.layoutGroup.doVerticalLayout();

        // Handle toolbar positioning based on overlay flag
        const position = this.toolbarOptions?.position || this.options.toolbarPosition; // backward compat
        const overlayBottom = position === 'bottom' || position === 'overlay-bottom';
        
        if (this.toolbar && !overlayBottom) {
            // Center the toolbar under the stack if in-flow and their widths differ
            const stackWidth = this.sequence.width;
            const toolbarWidth = this.toolbar.elements.background.width;
            const toolbarGroup = this.toolbar.elements.toolbarGroup;
            // Center toolbar horizontally under the stack
            toolbarGroup.setPosition(
                (stackWidth - toolbarWidth) / 2,
                toolbarGroup.ypos // y is handled by layout group
            );
        }

        this.width = this.layoutGroup.width;
        this.height = this.layoutGroup.height;
    }

    /**
     * Initializes the stack and its underlying sequence.
     */
    initialize() {
        if (this.sequence && typeof this.sequence.initialize === 'function') {
            this.sequence.initialize();
        } else if (this.sequence) {
            if (typeof this.sequence.computeDimensions === 'function') {
                this.sequence.computeDimensions();
            }
            if (typeof this.sequence.updateLayout === 'function') {
                this.sequence.updateLayout();
            }
        }
        this.updateLayout();
    }

    /**
     * Propagates font size changes to the underlying sequence and recomputes layout.
     * @param {number} fontSize
     */
    setFontSize(fontSize) {
        if (this.sequence && typeof this.sequence.setFontSize === 'function') {
            this.sequence.setFontSize(fontSize);
        }
        this.updateLayout();
    }

    /**
     * Delegate to close the currently active step visualizer dot (if present).
     */
    closeActiveDot() {
        if (this.sequence && typeof this.sequence.closeActiveDot === 'function') {
            this.sequence.closeActiveDot();
        }
    }

    /**
     * Delegate to close all step visualizer text boxes (if present).
     */
    closeAllTextBoxes() {
        if (this.sequence && typeof this.sequence.closeAllTextBoxes === 'function') {
            this.sequence.closeAllTextBoxes();
        } else if (this.sequence && typeof this.sequence.closeActiveDot === 'function') {
            this.sequence.closeActiveDot();
        }
    }

    /**
     * Delegate to force close all step visualizer UI (if present).
     */
    forceCloseAll() {
        if (this.sequence && typeof this.sequence.forceCloseAll === 'function') {
            this.sequence.forceCloseAll();
        } else {
            this.closeAllTextBoxes();
        }
    }

    /**
     * Returns the underlying sequence instance.
     * @returns {omdEquationSequenceNode|omdStepVisualizer} The managed sequence instance.
     */
    getSequence() {
        return this.sequence;
    }

    /**
     * Expose overlay padding to the display so it can pass it during reposition
     */
    getOverlayPadding() {
        return this.overlayPadding;
    }

    /**
     * Returns the visual height in pixels of the toolbar background (unscaled), if present.
     * Useful for reserving space when overlaying the toolbar.
     */
    getToolbarVisualHeight() {
        if (this.toolbar && this.toolbar.elements && this.toolbar.elements.background) {
            return this.toolbar.elements.background.height || 0;
        }
        return 0;
    }

    /**
     * Whether the toolbar is configured to be overlayed at the bottom of the container
     * @returns {boolean}
     */
    isToolbarOverlay() {
        const position = this.toolbarOptions?.position || this.options.toolbarPosition; // backward compat
        return !!(this.toolbar && (position === 'bottom' || position === 'overlay-bottom'));
    }

    /**
     * Positions the toolbar overlay at the bottom center of the container
     * @param {number} containerWidth - Width of the container
     * @param {number} containerHeight - Height of the container  
     * @param {number} [padding=16] - Padding from the bottom edge
     */
    positionToolbarOverlay(containerWidth, containerHeight, padding = 16) {
        if (!this.toolbar || !this.isToolbarOverlay()) return;
        
        const toolbarGroup = this.toolbar.elements.toolbarGroup;
        const toolbarWidth = this.toolbar.elements.background.width;
        const toolbarHeight = this.toolbar.elements.background.height;
        
        // Position at bottom center of the DISPLAY (container) while this toolbar
        // lives inside the stack's local coordinate system, which may be scaled.
        // Convert container (global) coordinates to stack-local by subtracting
        // the stack's position and dividing by its scale.
        const stackX = this.xpos || 0;
        const stackY = this.ypos || 0;
        const s = (typeof this.scale === 'number' && this.scale > 0) ? this.scale : 1;
        const effectivePadding = (typeof padding === 'number') ? padding : this.overlayPadding;

        // Compute top-left of toolbar in container coordinates using UN-SCALED toolbar size
        // because we counter-scale the toolbar by 1/s to keep constant Open size.
        let containerX = (containerWidth - toolbarWidth) / 2;
        let containerY = containerHeight - toolbarHeight - effectivePadding;
        // Snap to integer pixels to avoid subpixel jitter when scaling
        containerX = Math.round(containerX);
        containerY = Math.round(containerY);

        // Convert to stack-local coordinates
        const x = (containerX - stackX) / s;
        const y = (containerY - stackY) / s;
        
        // Find the root SVG to check its viewBox
        let rootSVG = toolbarGroup.svgObject;
        while (rootSVG && rootSVG.tagName !== 'svg' && rootSVG.parentElement) {
            rootSVG = rootSVG.parentElement;
        }
        const svgViewBox = rootSVG?.getAttribute?.('viewBox') || 'unknown';
        
        
        // Counter-scale the toolbar so it remains a constant Open size
        if (typeof toolbarGroup.setScale === 'function') {
            toolbarGroup.setScale(1 / s);
        }
        toolbarGroup.setPosition(x, y);
        
        // Ensure toolbar is visible and on top
        if (toolbarGroup.svgObject) {
            toolbarGroup.svgObject.style.display = 'block';
            toolbarGroup.svgObject.style.zIndex = '1000';
        }

        // Update any overlay children so they remain locked to container anchors
        try {
            this.updateOverlayChildren(containerWidth, containerHeight, padding);
        } catch (_) {}
    }
    /**
     * General helper to position an overlay child relative to a chosen anchor.
     * Does not assume only the toolbar; supports various anchors and options.
     * @param {object} child - A jsvg node (or any object with setPosition/setScale)
     * @param {number} containerWidth - Width of the container (px)
     * @param {number} containerHeight - Height of the container (px)
     * @param {object} [opts] - Options
     * @param {string} [opts.anchor='toolbar-center'] - One of: 'toolbar-center','toolbar-left','toolbar-right','top-left','top-center','top-right','custom'
     * @param {number} [opts.offsetX=0] - Horizontal offset in screen pixels (positive -> right)
     * @param {number} [opts.offsetY=0] - Vertical offset in screen pixels (positive -> down)
     * @param {number} [opts.padding=16] - Padding from edges when computing anchor
     * @param {boolean} [opts.counterScale=true] - Whether to counter-scale the child to keep constant Open size
     * @param {boolean} [opts.addToStack=true] - Whether to add the child to this stack's children (default true)
     * @param {{x:number,y:number}|null} [opts.customCoords=null] - If anchor==='custom', use these screen coords
     * @returns {object|null} The child or null if not applicable
     */
    addOverlayChild(child, containerWidth, containerHeight, opts = {}) {
        const {
            anchor = 'toolbar-center',
            offsetX = 0,
            offsetY = 0,
            padding = 16,
            counterScale = true,
            addToStack = true,
            customCoords = null
        } = opts || {};

        // Basic validation
        if (!child || typeof containerWidth !== 'number' || typeof containerHeight !== 'number') return null;

        const stackX = this.xpos || 0;
        const stackY = this.ypos || 0;
        const s = (typeof this.scale === 'number' && this.scale > 0) ? this.scale : 1;

        // Determine base container (screen) coordinates for the anchor
        let containerX = 0;
        let containerY = 0;

        if (anchor === 'custom' && customCoords && typeof customCoords.x === 'number' && typeof customCoords.y === 'number') {
            containerX = Math.round(customCoords.x);
            containerY = Math.round(customCoords.y);
        } else if (anchor.startsWith('toolbar')) {
            if (!this.toolbar) return null;
            const tbW = this.toolbar.elements?.background?.width || 0;
            const tbH = this.toolbar.elements?.background?.height || 0;
            const left = (containerWidth - tbW) / 2;
            const right = left + tbW;
            const center = left + (tbW / 2);
            containerY = Math.round(containerHeight - tbH - (typeof padding === 'number' ? padding : this.overlayPadding));
            if (anchor === 'toolbar-center') containerX = Math.round(center);
            else if (anchor === 'toolbar-left') containerX = Math.round(left);
            else if (anchor === 'toolbar-right') containerX = Math.round(right);
            else containerX = Math.round(center);
        } else if (anchor.startsWith('top')) {
            const topY = Math.round(typeof padding === 'number' ? padding : 16);
            const leftX = Math.round(typeof padding === 'number' ? padding : 16);
            const rightX = Math.round(containerWidth - (typeof padding === 'number' ? padding : 16));
            containerY = topY;
            if (anchor === 'top-left') containerX = leftX;
            else if (anchor === 'top-center') containerX = Math.round(containerWidth / 2);
            else if (anchor === 'top-right') containerX = rightX;
            else containerX = leftX;
        } else {
            // fallback: center
            containerX = Math.round(containerWidth / 2);
            containerY = Math.round(containerHeight / 2);
        }

        // Apply offsets (in screen pixels)
        containerX = Math.round(containerX + (offsetX || 0));
        containerY = Math.round(containerY + (offsetY || 0));

        // Convert to stack-local coordinates
        const x = (containerX - stackX) / s;
        const y = (containerY - stackY) / s;

        // Optionally counter-scale child to keep constant Open size
        if (counterScale && child && typeof child.setScale === 'function') {
            try { child.setScale(1 / s); } catch (_) {}
        }

        // Position child in stack-local coords
        if (child && typeof child.setPosition === 'function') {
            try { child.setPosition(x, y); } catch (_) {}
        }

        // Optionally add to this stack
        if (addToStack) {
            try { this.addChild(child); } catch (_) {
                try { this.layoutGroup.addChild(child); } catch (_) {}
            }
        }

        // Remember the overlay child and its options so we can reposition it when
        // the stack's scale/position changes (e.g., during zoom/center operations).
        try {
            // Store a shallow copy of opts to avoid external mutation surprises
            const stored = { anchor, offsetX, offsetY, padding, counterScale, addToStack, customCoords };
            this._overlayChildren.push({ child, opts: stored });
        } catch (_) {}

        // Make sure it's visible and above toolbar
        if (child && child.svgObject) {
            try { child.svgObject.style.zIndex = '1001'; } catch (_) {}
            try { child.svgObject.style.display = 'block'; } catch (_) {}
        }

        return child;
    }

    /**
     * Recompute and apply positions for tracked overlay children.
     * Called automatically during `positionToolbarOverlay` and can be called
     * manually if you change container size/stack position outside normal flows.
     */
    updateOverlayChildren(containerWidth, containerHeight, padding = 16) {
        if (!Array.isArray(this._overlayChildren) || this._overlayChildren.length === 0) return;

        const stackX = this.xpos || 0;
        const stackY = this.ypos || 0;
        const s = (typeof this.scale === 'number' && this.scale > 0) ? this.scale : 1;

        for (const entry of this._overlayChildren) {
            if (!entry || !entry.child) continue;
            const child = entry.child;
            const o = entry.opts || {};
            const anchor = o.anchor || 'toolbar-center';
            const offsetX = o.offsetX || 0;
            const offsetY = o.offsetY || 0;
            const pad = (typeof o.padding === 'number') ? o.padding : padding;
            const counterScale = (typeof o.counterScale === 'boolean') ? o.counterScale : true;
            const customCoords = o.customCoords || null;

            // Compute container anchor coords (duplicated logic from addOverlayChild)
            let containerX = 0;
            let containerY = 0;
            if (anchor === 'custom' && customCoords && typeof customCoords.x === 'number' && typeof customCoords.y === 'number') {
                containerX = Math.round(customCoords.x + offsetX);
                containerY = Math.round(customCoords.y + offsetY);
            } else if (anchor.startsWith('toolbar')) {
                if (!this.toolbar) continue;
                const tbW = this.toolbar.elements?.background?.width || 0;
                const tbH = this.toolbar.elements?.background?.height || 0;
                const left = (containerWidth - tbW) / 2;
                const right = left + tbW;
                const center = left + (tbW / 2);
                containerY = Math.round(containerHeight - tbH - pad + offsetY);
                if (anchor === 'toolbar-center') containerX = Math.round(center + offsetX);
                else if (anchor === 'toolbar-left') containerX = Math.round(left + offsetX);
                else if (anchor === 'toolbar-right') containerX = Math.round(right + offsetX);
                else containerX = Math.round(center + offsetX);
            } else if (anchor.startsWith('top')) {
                const topY = Math.round(pad);
                const leftX = Math.round(pad);
                const rightX = Math.round(containerWidth - pad);
                containerY = topY + offsetY;
                if (anchor === 'top-left') containerX = leftX + offsetX;
                else if (anchor === 'top-center') containerX = Math.round(containerWidth / 2) + offsetX;
                else if (anchor === 'top-right') containerX = rightX + offsetX;
                else containerX = leftX + offsetX;
            } else {
                containerX = Math.round(containerWidth / 2 + offsetX);
                containerY = Math.round(containerHeight / 2 + offsetY);
            }

            // Convert to stack-local coordinates
            const x = (containerX - stackX) / s;
            const y = (containerY - stackY) / s;

            // Apply counter-scaling and position
            if (counterScale && child && typeof child.setScale === 'function') {
                try { child.setScale(1 / s); } catch (_) {}
            }
            if (child && typeof child.setPosition === 'function') {
                try { child.setPosition(x, y); } catch (_) {}
            }
        }
    }

    /**
     * Remove a previously added overlay child (if present).
     */
    removeOverlayChild(child) {
        if (!child || !Array.isArray(this._overlayChildren)) return false;
        let idx = -1;
        for (let i = 0; i < this._overlayChildren.length; i++) {
            if (this._overlayChildren[i].child === child) { idx = i; break; }
        }
        if (idx === -1) return false;
        this._overlayChildren.splice(idx, 1);
        try { this.removeChild(child); } catch (_) {}
        return true;
    }

    /**
     * Returns the toolbar instance, if one was created.
     * @returns {omdToolbar|undefined}
     */
    getToolbar() {
        return this.toolbar;
    }

    /**
     * Undo the last operation (remove bottom-most equation and its preceding operation display)
     * Also updates a step visualizer if present.
     * @returns {boolean} Whether an operation was undone
     */
    undoLastOperation() {
        const seq = this.sequence;
        if (!seq || !Array.isArray(seq.steps) || seq.steps.length === 0) return false;

        // Find bottom-most equation
        let eqIndex = -1;
        for (let i = seq.steps.length - 1; i >= 0; i--) {
            const st = seq.steps[i];
            const name = st?.constructor?.name;
            if (st instanceof omdEquationNode || name === 'omdEquationNode') { eqIndex = i; break; }
        }
        if (eqIndex === -1) return false;

        // Find nearest preceding operation display (if any)
        let startIndex = eqIndex;
        for (let i = eqIndex; i >= 0; i--) {
            const st = seq.steps[i];
            const name = st?.constructor?.name;
            if (st instanceof omdOperationDisplayNode || name === 'omdOperationDisplayNode') { startIndex = i; break; }
        }
        // Remove DOM children and steps from startIndex to end
        for (let i = seq.steps.length - 1; i >= startIndex; i--) {
            const step = seq.steps[i];
            try { seq.removeChild(step); } catch (_) {}
        }
        seq.steps.splice(startIndex);
        seq.argumentNodeList.steps = seq.steps;
        if (Array.isArray(seq.stepDescriptions)) seq.stepDescriptions.length = seq.steps.length;
        if (Array.isArray(seq.importanceLevels)) seq.importanceLevels.length = seq.steps.length;

        // Adjust current index
        if (typeof seq.currentStepIndex === 'number' && seq.currentStepIndex >= seq.steps.length) {
            seq.currentStepIndex = Math.max(0, seq.steps.length - 1);
        }

        // Rebuild maps and layout on sequence
        if (typeof seq.rebuildNodeMap === 'function') seq.rebuildNodeMap();
        if (typeof seq.computeDimensions === 'function') seq.computeDimensions();
        if (typeof seq.updateLayout === 'function') seq.updateLayout();

        // If this is a step visualizer, rebuild its dots/lines
        if (typeof seq.rebuildVisualizer === 'function') {
            try {
                // Clear all step visualizer highlights before rebuilding
                if (seq.highlighting && typeof seq.highlighting.clearAllExplainHighlights === 'function') {
                    seq.highlighting.clearAllExplainHighlights();
                }
                seq.rebuildVisualizer();
            } catch (_) {}
        } else if (typeof seq._initializeVisualElements === 'function') {
            try {
                // Clear all step visualizer highlights before rebuilding
                if (seq.highlighting && typeof seq.highlighting.clearAllExplainHighlights === 'function') {
                    seq.highlighting.clearAllExplainHighlights();
                }
                seq._initializeVisualElements();
                if (typeof seq.computeDimensions === 'function') seq.computeDimensions();
                if (typeof seq.updateLayout === 'function') seq.updateLayout();
            } catch (_) {}
        }

        // Safety: ensure dot/line counts match equations and prune orphan dots
        try {
            const isEquation = (s) => (s instanceof omdEquationNode) || (s?.constructor?.name === 'omdEquationNode');
            const equationsCount = Array.isArray(seq.steps) ? seq.steps.filter(isEquation).length : 0;

            // Remove dots whose equationRef is no longer present in steps
            if (Array.isArray(seq.stepDots) && seq.visualContainer) {
                const eqSet = new Set(seq.steps.filter(isEquation));
                const keptDots = [];
                for (const dot of seq.stepDots) {
                    if (!dot || !dot.equationRef || !eqSet.has(dot.equationRef)) {
                        try { seq.visualContainer.removeChild(dot); } catch (_) {}
                    } else {
                        keptDots.push(dot);
                    }
                }
                seq.stepDots = keptDots;
            }
            // Also purge any children in visualContainer that are not current dots or lines
            if (seq.visualContainer && Array.isArray(seq.visualContainer.childList)) {
                const valid = new Set([...(seq.stepDots||[]), ...(seq.stepLines||[])]);
                const toRemove = [];
                seq.visualContainer.childList.forEach(child => { if (!valid.has(child)) toRemove.push(child); });
                toRemove.forEach(child => { try { seq.visualContainer.removeChild(child); } catch (_) {} });
            }
            if (Array.isArray(seq.stepDots) && seq.visualContainer) {
                while (seq.stepDots.length > equationsCount) {
                    const dot = seq.stepDots.pop();
                    try { seq.visualContainer.removeChild(dot); } catch (_) {}
                }
            }
            if (Array.isArray(seq.stepLines) && seq.visualContainer) {
                const targetLines = Math.max(0, equationsCount - 1);
                while (seq.stepLines.length > targetLines) {
                    const line = seq.stepLines.pop();
                    try { seq.visualContainer.removeChild(line); } catch (_) {}
                }
            }
            if (seq.layoutManager) {
                try {
                    seq.layoutManager.updateVisualLayout(true); // Allow repositioning for equation stack changes
                    seq.layoutManager.updateVisualVisibility();
                    seq.layoutManager.updateAllLinePositions();
                } catch (_) {}
            }
        } catch (_) {}

        // Refresh stack layout
        this.updateLayout();
        return true;
    }

    /**
     * Returns the SVG element for the entire equation stack.
     * @returns {SVGElement} The SVG element representing the equation stack.
     */
    getSvg() {
        return this.svgObject;
    }
} 
