import { Tool } from './tool.js';
import { BoundingBox } from '../utils/boundingBox.js';
import { Stroke } from '../drawing/stroke.js';
import { ResizeHandleManager } from '../features/resizeHandleManager.js';
import {omdColor} from '../../src/omdColor.js'; 
const SELECTION_TOLERANCE = 10;
const SELECTION_COLOR = '#007bff';
const SELECTION_OPACITY = 0.3;

/**
 * A tool for selecting, moving, and deleting stroke segments.
 * @extends Tool
 */
export class SelectTool extends Tool {
    /**
     * @param {OMDCanvas} canvas - The canvas instance.
     * @param {object} [options={}] - Configuration options for the tool.
     */
    constructor(canvas, options = {}) {
        super(canvas, {
            selectionColor: SELECTION_COLOR,
            selectionOpacity: SELECTION_OPACITY,
            ...options
        });

        this.displayName = 'Select';
        this.description = 'Select and manipulate segments';
        this.icon = 'select';
        this.shortcut = 'S';
        this.category = 'selection';

        /** @private */
        this.isSelecting = false;
        /** @private */
        this.selectionBox = null;
        /** @private */
        this.startPoint = null;
        /** @type {Map<string, Set<number>>} */
        this.selectedSegments = new Map();
        
        /** @private - OMD dragging state */
        this.isDraggingOMD = false;
        this.draggedOMDElement = null;
        
        // Initialize resize handle manager for OMD visuals
        this.resizeHandleManager = new ResizeHandleManager(canvas);
        
        // Store reference on canvas for makeDraggable to access
        if (canvas) {
            canvas.resizeHandleManager = this.resizeHandleManager;
        }
    }

    /**
     * Handles the pointer down event to start a selection.
     * @param {PointerEvent} event - The pointer event.
     */
    onPointerDown(event) {
        if (!this.canUse()) {
            return;
        }

        // Check for resize handle first (highest priority)
        const handle = this.resizeHandleManager.getHandleAtPoint(event.x, event.y);
        if (handle) {
            // Start resize operation
            this.resizeHandleManager.startResize(handle, event.x, event.y, event.shiftKey);
            if (this.canvas.eventManager) {
                this.canvas.eventManager.isDrawing = true;
            }
            return;
        }

        const segmentSelection = this._findSegmentAtPoint(event.x, event.y);
        let omdElement = this._findOMDElementAtPoint(event.x, event.y);
        if (omdElement?.dataset?.locked === 'true') {
            omdElement = null;
        }

        if (segmentSelection) {
            // Clicking on a stroke segment - clear OMD selection and handle segment selection
            this.resizeHandleManager.clearSelection();
            this._handleSegmentClick(segmentSelection, event.shiftKey);
        } else if (omdElement) {
            // Clicking on an OMD visual - clear segment selection and select OMD
            if (!event.shiftKey) {
                this.selectedSegments.clear();
                this._clearSelectionVisuals();
            }
            this.resizeHandleManager.selectElement(omdElement);
            
            // CRITICAL: Start tracking for potential drag operation
            this.isDraggingOMD = true;
            this.draggedOMDElement = omdElement;
            this.startPoint = { x: event.x, y: event.y };
            
            // Set isDrawing so we get pointermove events
            if (this.canvas.eventManager) {
                this.canvas.eventManager.isDrawing = true;
            }
            
            // Don't start box selection - we're either resizing or will be dragging
            return;
        } else {
            // Clicking on empty space - clear all selections and start box selection
            this.resizeHandleManager.clearSelection();
            this._startBoxSelection(event.x, event.y, event.shiftKey);
            
            // CRITICAL: Set startPoint AFTER _startBoxSelection so it doesn't get cleared!
            this.startPoint = { x: event.x, y: event.y };
            
            // CRITICAL: Tell the event manager we're "drawing" so pointer move events get sent to us
            if (this.canvas.eventManager) {
                this.canvas.eventManager.isDrawing = true;
            }
        }
    }

    /**
     * Handles the pointer move event to update the selection box.
     * @param {PointerEvent} event - The pointer event.
     */
    onPointerMove(event) {
        // Handle resize operation if in progress
        if (this.resizeHandleManager.isResizing) {
            this.resizeHandleManager.updateResize(event.x, event.y);
            return;
        }
        
        // Handle OMD dragging if in progress
        if (this.isDraggingOMD && this.draggedOMDElement) {
            this._dragOMDElement(event.x, event.y);
            return;
        }
        
        // Handle box selection if in progress
        if (!this.isSelecting || !this.selectionBox) return;

        this._updateSelectionBox(event.x, event.y);
        this._updateBoxSelection();
    }

    /**
     * Handles the pointer up event to complete the selection.
     * @param {PointerEvent} event - The pointer event.
     */
    onPointerUp(event) {
        // Handle resize completion
        if (this.resizeHandleManager.isResizing) {
            this.resizeHandleManager.finishResize();
            if (this.canvas.eventManager) {
                this.canvas.eventManager.isDrawing = false;
            }
            return;
        }
        
        // Handle OMD drag completion
        if (this.isDraggingOMD) {
            this.isDraggingOMD = false;
            this.draggedOMDElement = null;
            this.startPoint = null;
            if (this.canvas.eventManager) {
                this.canvas.eventManager.isDrawing = false;
            }
            return;
        }
        
        // Handle box selection completion
        if (this.isSelecting) {
            this._finishBoxSelection();
        }
        this.isSelecting = false;
        this._removeSelectionBox();
        
        // CRITICAL: Tell the event manager we're done "drawing"
        if (this.canvas.eventManager) {
            this.canvas.eventManager.isDrawing = false;
        }
    }

    /**
     * Cancels the current selection operation.
     */
    onCancel() {
        this.isSelecting = false;
        this._removeSelectionBox();
        this.clearSelection();
        
        // Reset OMD drag state
        this.isDraggingOMD = false;
        this.draggedOMDElement = null;
        
        // CRITICAL: Tell the event manager we're done "drawing"
        if (this.canvas.eventManager) {
            this.canvas.eventManager.isDrawing = false;
        }
        
        super.onCancel();
    }

    /**
     * Handle tool deactivation - clean up everything.
     */
    onDeactivate() {
        // Clear active state
        this.isActive = false;
        
        // Reset drag and resize states
        this.isDraggingOMD = false;
        this.draggedOMDElement = null;
        this.isSelecting = false;
        this.startPoint = null;
        
        // Clear the event manager drawing state
        if (this.canvas.eventManager) {
            this.canvas.eventManager.isDrawing = false;
        }
        
        // Clean up selection
        this.clearSelection();
        
        super.onDeactivate();
    }

    /**
     * Handle tool activation.
     */
    onActivate() {
        // Set active state first
        this.isActive = true;
        
        // Reset all state flags
        this.isDraggingOMD = false;
        this.draggedOMDElement = null;
        this.isSelecting = false;
        this.startPoint = null;
        
        // Ensure cursor is visible and properly set
        if (this.canvas.cursor) {
            this.canvas.cursor.show();
            this.canvas.cursor.setShape('select');
        }
        
        // Clear any existing selection to start fresh
        this.clearSelection();
        
        super.onActivate();
    }

    /**
     * Handles keyboard shortcuts for selection-related actions.
     * @param {string} key - The key that was pressed.
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {boolean} - True if the shortcut was handled, false otherwise.
     */
    onKeyboardShortcut(key, event) {
        if (event.ctrlKey || event.metaKey) {
            if (key === 'a') {
                this._selectAllSegments();
                return true;
            }
        }

        if (key === 'delete' || key === 'backspace') {
            this._deleteSelectedSegments();
            return true;
        }

        return false;
    }

    /**
     * Gets the cursor for the tool.
     * @returns {string} The CSS cursor name.
     */
    getCursor() {
        // If resizing, return appropriate resize cursor
        if (this.resizeHandleManager.isResizing) {
            return this.resizeHandleManager.getCursorForHandle(
                this.resizeHandleManager.resizeData?.handle?.type || 'se'
            );
        }
        
        return 'select'; // Use custom SVG select cursor
    }

    /**
     * Check if tool can be used
     * @returns {boolean}
     */
    canUse() {
        // Use the base class method which checks isActive and canvas state
        const result = super.canUse();
        
        return result;
    }

    /**
     * Clears the current selection.
     */
    clearSelection() {
        // Clear stroke selection data
        this.selectedSegments.clear();
        
        // Clear OMD selection
        this.resizeHandleManager.clearSelection();
        
        // Remove selection box if it exists
        this._removeSelectionBox();
        
        // Clear visual highlights
        this._clearSelectionVisuals();
        
        // Reset selection state
        this.isSelecting = false;
        this.startPoint = null;
        
        // Emit selection change event
        this.canvas.emit('selectionChanged', { selected: [] });
    }

    /**
     * Thoroughly clears all selection visuals.
     * @private
     */
    _clearSelectionVisuals() {
        const selectionLayer = this.canvas.uiLayer.querySelector('.segment-selection-layer');
        if (selectionLayer) {
            // Remove all children
            while (selectionLayer.firstChild) {
                selectionLayer.removeChild(selectionLayer.firstChild);
            }
        }
        
        // Also remove any orphaned selection elements
        const orphanedHighlights = this.canvas.uiLayer.querySelectorAll('[stroke="' + this.config.selectionColor + '"]');
        orphanedHighlights.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }

    /**
     * @private
     */
    _handleSegmentClick({ strokeId, segmentIndex }, shiftKey) {
        const segmentSet = this.selectedSegments.get(strokeId) || new Set();
        if (segmentSet.has(segmentIndex)) {
            segmentSet.delete(segmentIndex);
            if (segmentSet.size === 0) {
                this.selectedSegments.delete(strokeId);
            }
        } else {
            if (!shiftKey) {
                this.selectedSegments.clear();
            }
            if (!this.selectedSegments.has(strokeId)) {
                this.selectedSegments.set(strokeId, new Set());
            }
            this.selectedSegments.get(strokeId).add(segmentIndex);
        }
        this._updateSegmentSelectionVisuals();
        this.canvas.emit('selectionChanged', { selected: this._getSelectedSegmentsAsArray() });
    }

    /**
     * @private
     */
    _startBoxSelection(x, y, shiftKey) {
        if (!shiftKey) {
            this.clearSelection();
        }
        this.isSelecting = true;
        this._createSelectionBox(x, y);
    }

    /**
     * @private
     */
    _finishBoxSelection() {
        this._updateSegmentSelectionVisuals();
        this.canvas.emit('selectionChanged', { selected: this._getSelectedSegmentsAsArray() });
    }

    /**
     * @private
     */
    _getSelectedSegmentsAsArray() {
        const selected = [];
        for (const [strokeId, segmentSet] of this.selectedSegments.entries()) {
            for (const segmentIndex of segmentSet) {
                selected.push({ strokeId, segmentIndex });
            }
        }
        return selected;
    }

    /**
     * Drags the selected OMD element
     * @private
     * @param {number} x - Current pointer x coordinate
     * @param {number} y - Current pointer y coordinate
     */
    _dragOMDElement(x, y) {
        if (!this.draggedOMDElement || !this.startPoint) return;
        
        const dx = x - this.startPoint.x;
        const dy = y - this.startPoint.y;
        
        // Parse current transform
        const currentTransform = this.draggedOMDElement.getAttribute('transform') || '';
        const translateMatch = currentTransform.match(/translate\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
        const scaleMatch = currentTransform.match(/scale\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/);
        
        // Get current translate values
        let currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
        let currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;
        
        // Calculate new position
        const newX = currentX + dx;
        const newY = currentY + dy;
        
        // Build new transform preserving scale
        let newTransform = `translate(${newX}, ${newY})`;
        if (scaleMatch) {
            const scaleX = parseFloat(scaleMatch[1]) || 1;
            const scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
            newTransform += ` scale(${scaleX}, ${scaleY})`;
        }
        
        this.draggedOMDElement.setAttribute('transform', newTransform);
        
        // Update start point for next move
        this.startPoint = { x, y };
        
        // Update resize handles if element is selected
        this.resizeHandleManager.updateIfSelected(this.draggedOMDElement);
    }
    
    /**
     * Finds the closest segment to a given point.
     * @private
     * @param {number} x - The x-coordinate of the point.
     * @param {number} y - The y-coordinate of the point.
     * @returns {{strokeId: string, segmentIndex: number}|null}
     */
    _findSegmentAtPoint(x, y) {
        let closest = null;
        let minDist = SELECTION_TOLERANCE;
        for (const [id, stroke] of this.canvas.strokes) {
            if (!stroke.points || stroke.points.length < 2) continue;
            for (let i = 0; i < stroke.points.length - 1; i++) {
                const p1 = stroke.points[i];
                const p2 = stroke.points[i + 1];
                const dist = this._pointToSegmentDistance(x, y, p1, p2);
                if (dist < minDist) {
                    minDist = dist;
                    closest = { strokeId: id, segmentIndex: i };
                }
            }
        }
        return closest;
    }

    /**
     * Check if point is inside an OMD visual element
     * @private
     */
    _findOMDElementAtPoint(x, y) {
        // Find OMD layer directly from canvas
        const omdLayer = this.canvas.drawingLayer?.querySelector('.omd-layer');
        if (!omdLayer) {
            return null;
        }
        
        // Check all OMD items in the layer
        const omdItems = omdLayer.querySelectorAll('.omd-item');

        for (const item of omdItems) {
            if (item?.dataset?.locked === 'true') {
                continue;
            }
            try {
                // Get the bounding box of the item
                const bbox = item.getBBox();
                
                // Parse transform to get the actual position
                const transform = item.getAttribute('transform') || '';
                let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1;
                
                // Parse translate
                const translateMatch = transform.match(/translate\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
                if (translateMatch) {
                    offsetX = parseFloat(translateMatch[1]) || 0;
                    offsetY = parseFloat(translateMatch[2]) || 0;
                }
                
                // Parse scale
                const scaleMatch = transform.match(/scale\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/);
                if (scaleMatch) {
                    scaleX = parseFloat(scaleMatch[1]) || 1;
                    scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
                }
                
                // Calculate the actual bounds including transform
                const actualX = offsetX + (bbox.x * scaleX);
                const actualY = offsetY + (bbox.y * scaleY);
                const actualWidth = bbox.width * scaleX;
                const actualHeight = bbox.height * scaleY;
                
                // Add some padding for easier clicking
                const padding = 10;
                
                // Check if point is within the bounds (with padding)
                if (x >= actualX - padding && 
                    x <= actualX + actualWidth + padding &&
                    y >= actualY - padding && 
                    y <= actualY + actualHeight + padding) {
                    return item;
                }
            } catch (error) {
                // Skip items that can't be measured (continue with next)
                continue;
            }
        }
        
        return null;
    }

    /**
     * Calculates the distance from a point to a line segment.
     * @private
     */
    _pointToSegmentDistance(x, y, p1, p2) {
        const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
        if (l2 === 0) return Math.hypot(x - p1.x, y - p1.y);
        let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = p1.x + t * (p2.x - p1.x);
        const projY = p1.y + t * (p2.y - p1.y);
        return Math.hypot(x - projX, y - projY);
    }

    /**
     * Creates the selection box element.
     * @private
     */
    _createSelectionBox(x, y) {
        this.selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.selectionBox.setAttribute('x', x);
        this.selectionBox.setAttribute('y', y);
        this.selectionBox.setAttribute('width', 0);
        this.selectionBox.setAttribute('height', 0);
        
        // Clean blue selection box
        this.selectionBox.setAttribute('fill', 'rgba(0, 123, 255, 0.2)'); // Blue with transparency
        this.selectionBox.setAttribute('stroke', '#007bff'); // Blue stroke
        this.selectionBox.setAttribute('stroke-width', '1'); // Thin stroke
        this.selectionBox.setAttribute('stroke-dasharray', '4,2'); // Small dashes
        this.selectionBox.style.pointerEvents = 'none';
        this.selectionBox.setAttribute('data-selection-box', 'true');
        
        
        if (this.canvas.uiLayer) {
            this.canvas.uiLayer.appendChild(this.selectionBox);
        } else if (this.canvas.svg) {
            this.canvas.svg.appendChild(this.selectionBox);
        } else {
            console.error('No canvas layer found to add selection box!');
        }
    }

    /**
     * Updates the dimensions of the selection box.
     * @private
     */
    _updateSelectionBox(x, y) {
        if (!this.selectionBox || !this.startPoint) return;
        
        const minX = Math.min(this.startPoint.x, x);
        const minY = Math.min(this.startPoint.y, y);
        const width = Math.abs(this.startPoint.x - x);
        const height = Math.abs(this.startPoint.y - y);
        
        this.selectionBox.setAttribute('x', minX);
        this.selectionBox.setAttribute('y', minY);
        this.selectionBox.setAttribute('width', width);
        this.selectionBox.setAttribute('height', height);
    }

    /**
     * Removes the selection box element.
     * @private
     */
    _removeSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        this.startPoint = null;
    }

    /**
     * Updates the set of selected segments based on the selection box.
     * @private
     */
    _updateBoxSelection() {
        if (!this.selectionBox) return;

        const x = parseFloat(this.selectionBox.getAttribute('x'));
        const y = parseFloat(this.selectionBox.getAttribute('y'));
        const width = parseFloat(this.selectionBox.getAttribute('width'));
        const height = parseFloat(this.selectionBox.getAttribute('height'));
        const selectionBounds = new BoundingBox(x, y, width, height);

        for (const [id, stroke] of this.canvas.strokes) {
            if (!stroke.points || stroke.points.length < 2) continue;
            for (let i = 0; i < stroke.points.length - 1; i++) {
                const p1 = stroke.points[i];
                const p2 = stroke.points[i + 1];
                if (this._segmentIntersectsBox(p1, p2, selectionBounds)) {
                    if (!this.selectedSegments.has(id)) {
                        this.selectedSegments.set(id, new Set());
                    }
                    this.selectedSegments.get(id).add(i);
                }
            }
        }
        this._updateSegmentSelectionVisuals();
    }

    /**
     * Checks if a line segment intersects with a bounding box.
     * @private
     * @param {{x: number, y: number}} p1 - The start point of the segment.
     * @param {{x: number, y: number}} p2 - The end point of the segment.
     * @param {BoundingBox} box - The bounding box.
     * @returns {boolean}
     */
    _segmentIntersectsBox(p1, p2, box) {
        if (box.containsPoint(p1.x, p1.y) || box.containsPoint(p2.x, p2.y)) {
            return true;
        }

        const { x, y, width, height } = box;
        const right = x + width;
        const bottom = y + height;

        const lines = [
            { a: { x, y }, b: { x: right, y } },
            { a: { x: right, y }, b: { x: right, y: bottom } },
            { a: { x: right, y: bottom }, b: { x, y: bottom } },
            { a: { x, y: bottom }, b: { x, y } }
        ];

        for (const line of lines) {
            if (this._lineIntersectsLine(p1, p2, line.a, line.b)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if two line segments intersect.
     * @private
     */
    _lineIntersectsLine(p1, p2, p3, p4) {
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
        if (det === 0) return false;
        const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / det;
        const u = -((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)) / det;
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    /**
     * Updates the visual representation of selected segments.
     * @private
     */
    _updateSegmentSelectionVisuals() {
        // Get or create selection layer
        const selectionLayer = this.canvas.uiLayer.querySelector('.segment-selection-layer') || this._createSelectionLayer();
        
        // Clear existing visuals efficiently
        while (selectionLayer.firstChild) {
            selectionLayer.removeChild(selectionLayer.firstChild);
        }

        // Add highlights for currently selected segments
        let highlightCount = 0;
        
        for (const [strokeId, segmentSet] of this.selectedSegments.entries()) {
            const stroke = this.canvas.strokes.get(strokeId);
            if (!stroke || !stroke.points) continue;

            for (const segmentIndex of segmentSet) {
                if (segmentIndex >= stroke.points.length - 1) continue;
                
                const p1 = stroke.points[segmentIndex];
                const p2 = stroke.points[segmentIndex + 1];
                
                // Create highlight element
                const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                highlight.setAttribute('x1', p1.x);
                highlight.setAttribute('y1', p1.y);
                highlight.setAttribute('x2', p2.x);
                highlight.setAttribute('y2', p2.y);
                highlight.setAttribute('stroke', omdColor.hiliteColor);
                highlight.setAttribute('stroke-width', '4');
                highlight.setAttribute('stroke-opacity', '0.8');
                highlight.setAttribute('stroke-linecap', 'round');
                highlight.style.pointerEvents = 'none';
                highlight.classList.add('selection-highlight');
                
                selectionLayer.appendChild(highlight);
                highlightCount++;
            }
        }
        
    }

    /**
     * @private
     */
    _createSelectionLayer() {
        const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        layer.classList.add('segment-selection-layer');
        this.canvas.uiLayer.appendChild(layer);
        return layer;
    }

    /**
     * Selects all segments on the canvas.
     * @private
     */
    _selectAllSegments() {
        // Clear current selection
        this.selectedSegments.clear();
        
        let totalSegments = 0;
        
        // Select all valid segments from all strokes
        for (const [id, stroke] of this.canvas.strokes) {
            if (!stroke.points || stroke.points.length < 2) continue;
            
            const segmentIndices = new Set();
            for (let i = 0; i < stroke.points.length - 1; i++) {
                segmentIndices.add(i);
                totalSegments++;
            }
            
            if (segmentIndices.size > 0) {
                this.selectedSegments.set(id, segmentIndices);
            }
        }
        
        // Update visuals
        this._updateSegmentSelectionVisuals();
        
        // Emit selection change event
        this.canvas.emit('selectionChanged', { 
            selected: this._getSelectedSegmentsAsArray() 
        });
        
    }

    /**
     * Deletes all currently selected segments efficiently.
     * @private
     */
    _deleteSelectedSegments() {
        if (this.selectedSegments.size === 0) return;

        // Process each stroke that has selected segments
        const strokesToProcess = Array.from(this.selectedSegments.entries());
        
        for (const [strokeId, segmentIndices] of strokesToProcess) {
            const stroke = this.canvas.strokes.get(strokeId);
            if (!stroke || !stroke.points || stroke.points.length < 2) continue;

            const sortedIndices = Array.from(segmentIndices).sort((a, b) => a - b);
            
            // If all or most segments are selected, just delete the whole stroke
            const totalSegments = stroke.points.length - 1;
            const selectedCount = sortedIndices.length;
            
            if (selectedCount >= totalSegments * 0.8) {
                // Delete entire stroke
                this.canvas.removeStroke(strokeId);
                continue;
            }

            // Split the stroke, keeping only unselected segments
            this._splitStrokeKeepingUnselected(stroke, sortedIndices);
        }

        // Clear selection and update UI
        this.clearSelection();
        
        // Emit deletion event
        this.canvas.emit('segmentsDeleted', { 
            strokesAffected: strokesToProcess.length 
        });
    }

    /**
     * Splits a stroke, keeping only the segments that weren't selected for deletion.
     * @private
     */
    _splitStrokeKeepingUnselected(stroke, selectedSegmentIndices) {
        const totalSegments = stroke.points.length - 1;
        const keepSegments = [];
        
        // Determine which segments to keep
        for (let i = 0; i < totalSegments; i++) {
            if (!selectedSegmentIndices.includes(i)) {
                keepSegments.push(i);
            }
        }
        
        if (keepSegments.length === 0) {
            // All segments were selected, delete the whole stroke
            this.canvas.removeStroke(stroke.id);
            return;
        }

        // Group consecutive segments into separate strokes
        const strokeSegments = this._groupConsecutiveSegments(keepSegments);
        
        // Remove the original stroke
        this.canvas.removeStroke(stroke.id);
        
        // Create new strokes for each group of consecutive segments
        strokeSegments.forEach(segmentGroup => {
            this._createStrokeFromSegments(stroke, segmentGroup);
        });
    }

    /**
     * Groups consecutive segment indices into separate arrays.
     * @private
     */
    _groupConsecutiveSegments(segmentIndices) {
        if (segmentIndices.length === 0) return [];
        
        const groups = [];
        let currentGroup = [segmentIndices[0]];
        
        for (let i = 1; i < segmentIndices.length; i++) {
            const current = segmentIndices[i];
            const previous = segmentIndices[i - 1];
            
            if (current === previous + 1) {
                // Consecutive segment
                currentGroup.push(current);
            } else {
                // Gap found, start new group
                groups.push(currentGroup);
                currentGroup = [current];
            }
        }
        
        // Add the last group
        groups.push(currentGroup);
        
        return groups;
    }

    /**
     * Creates a new stroke from a group of segment indices.
     * @private
     */
    _createStrokeFromSegments(originalStroke, segmentIndices) {
        if (segmentIndices.length === 0) return;
        
        // Collect points for the new stroke
        const newPoints = [];
        
        // Add the first point of the first segment
        newPoints.push(originalStroke.points[segmentIndices[0]]);
        
        // Add all subsequent points
        for (const segmentIndex of segmentIndices) {
            newPoints.push(originalStroke.points[segmentIndex + 1]);
        }
        
        // Only create stroke if we have at least 2 points
        if (newPoints.length < 2) return;
        
        // Create new stroke with same properties
        const newStroke = new Stroke({
            strokeWidth: originalStroke.strokeWidth,
            strokeColor: originalStroke.strokeColor,
            strokeOpacity: originalStroke.strokeOpacity,
            tool: originalStroke.tool
        });
        
        // Add all points
        newPoints.forEach(point => {
            newStroke.addPoint(point);
        });
        
        newStroke.finish();
        this.canvas.addStroke(newStroke);
    }

}
