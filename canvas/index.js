// Core canvas system
import { omdCanvas } from './core/omdCanvas.js';
export { omdCanvas } from './core/omdCanvas.js';
export { CanvasConfig as canvasConfig } from './core/canvasConfig.js';

// Event handling
export { EventManager } from './events/eventManager.js';
export { pointerEventHandler } from './events/pointerEventHandler.js';

// Tool system
export { ToolManager } from './tools/toolManager.js';
export { Tool } from './tools/tool.js';
export { PencilTool } from './tools/PencilTool.js';
export { EraserTool } from './tools/EraserTool.js';
export { SelectTool } from './tools/SelectTool.js';

// UI components
export { Toolbar } from './ui/toolbar.js';
export { Cursor } from './ui/cursor.js';

// Drawing objects
export { Stroke } from './drawing/stroke.js';
export { segment } from './drawing/segment.js';

// Utilities
export { BoundingBox } from './utils/boundingBox.js';
export { mathUtils } from './utils/mathUtils.js';

// Focus frame system
export { FocusFrameManager } from './features/focusFrameManager.js';
/**
 * Quick setup function for common use cases
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {omdCanvas} Configured canvas instance
 */
export function createCanvas(container, options = {}) {
    const canvas = new omdCanvas(container, options);
    return canvas;
}

/**
 * Create multiple canvas instances for comparison or multi-canvas apps
 * @param {Array} configs - Array of {container, options} objects
 * @returns {Array<omdCanvas>} Array of canvas instances
 */
export function createMultipleCanvases(configs) {
    return configs.map(config => createCanvas(config.container, config.options));
} 