import { Tool } from './tool.js';

/**
 * Pointer/Browse tool
 * Allows browsing and interacting with interactive components without selecting or moving items.
 * Use this tool to click buttons, interact with UI elements, etc. without modifying the canvas.
 */
export class PointerTool extends Tool {
    /**
     * @param {OMDCanvas} canvas
     * @param {object} [options={}]
     */
    constructor(canvas, options = {}) {
        super(canvas, { ...options });

        this.displayName = 'Pointer';
        this.description = 'Browse and interact with components';
        this.icon = 'pointer';
        this.shortcut = 'V';
        this.category = 'navigation';
    }

    onActivate() {
        this.isActive = true;
        if (this.canvas.cursor) {
            this.canvas.cursor.show();
            this.canvas.cursor.setShape('pointer');
        }
        super.onActivate();
    }

    onDeactivate() {
        this.isActive = false;
        super.onDeactivate();
    }

    onPointerDown(event) {
        // Pointer tool is completely passive - it does nothing
        // This allows click events to pass through to interactive components
        // but prevents any canvas manipulation (drawing, selecting, moving)
        
        // Explicitly ensure we are not entering a drawing/dragging state
        if (this.canvas?.eventManager) {
            this.canvas.eventManager.isDrawing = false;
        }
    }

    onPointerMove(event) {
        // No-op: allow hovering without any interaction
    }

    onPointerUp(event) {
        // No-op: do not modify selections or positions
    }

    onKeyboardShortcut(key, event) {
        // No shortcuts to handle for passive pointer tool
        return false;
    }

    onKeyboardShortcut(key, event) {
        // No shortcuts to handle for passive pointer tool
        return false;
    }

    getCursor() {
        return 'pointer';
    }
}


