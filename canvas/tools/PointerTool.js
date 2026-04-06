import { Tool } from './tool.js';
import { BoundingBox } from '../utils/boundingBox.js';
import { Stroke } from '../drawing/stroke.js';
import { ResizeHandleManager } from '../features/resizeHandleManager.js';
import {omdColor} from '../../src/omdColor.js'; 

const SELECTION_TOLERANCE = 10;
const SELECTION_COLOR = '#007bff';
const SELECTION_OPACITY = 0.3;

/**
 * Pointer tool
 * Combined functionality of Pointer and Select tools.
 * Allows selecting, moving, deleting items, and interacting with components.
 */
export class PointerTool extends Tool {
    /**
     * @param {OMDCanvas} canvas
     * @param {object} [options={}]
     */
    constructor(canvas, options = {}) {
        super(canvas, {
            selectionColor: SELECTION_COLOR,
            selectionOpacity: SELECTION_OPACITY,
            ...options
        });

        this.displayName = 'Pointer';
        this.description = 'Select and interact with components';
        this.icon = 'pointer';
        this.shortcut = 'V';
        this.category = 'navigation';

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
        this.selectedOMDElements = new Set();

        /** @private - Stroke dragging state */
        this.isDraggingStrokes = false;
        this.dragStartPoint = null;
        this.potentialDeselect = null;
        this.hasSeparatedForDrag = false;

        this.selectionBoundsPadding = {
            top: options.selectionBoundsPaddingTop ?? options.selectionBoundsPaddingY ?? options.selectionBoundsPadding ?? 14,
            right: options.selectionBoundsPaddingRight ?? options.selectionBoundsPaddingX ?? options.selectionBoundsPadding ?? 14,
            bottom: options.selectionBoundsPaddingBottom ?? options.selectionBoundsPaddingY ?? options.selectionBoundsPadding ?? 14,
            left: options.selectionBoundsPaddingLeft ?? options.selectionBoundsPaddingX ?? options.selectionBoundsPadding ?? 14
        };
        
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
            // Check if already selected
            const isSelected = this._isSegmentSelected(segmentSelection);

            if (isSelected) {
                // Already selected - prepare for drag, but don't deselect yet
                this.isDraggingStrokes = true;
                this.hasSeparatedForDrag = false;
                this.dragStartPoint = { x: event.x, y: event.y };
                this.potentialDeselect = segmentSelection;
                
                // Set isDrawing so we get pointermove events
                if (this.canvas.eventManager) {
                    this.canvas.eventManager.isDrawing = true;
                }
                return;
            } else {
                // Clicking on a stroke segment
                if (!event.shiftKey) {
                    this.resizeHandleManager.clearSelection();
                    this.selectedOMDElements.clear();
                }
                this._handleSegmentClick(segmentSelection, event.shiftKey);
                
                // Prepare for drag immediately after selection
                this.isDraggingStrokes = true;
                this.hasSeparatedForDrag = false;
                this.dragStartPoint = { x: event.x, y: event.y };
                
                if (this.canvas.eventManager) {
                    this.canvas.eventManager.isDrawing = true;
                }
            }
        } else if (omdElement) {
            // Clicking on an OMD visual
            
            // Check if already selected
            if (this.selectedOMDElements.has(omdElement)) {
                // Already selected - prepare for drag
                this.isDraggingOMD = true;
                this.draggedOMDElement = omdElement; // Primary drag target
                this.startPoint = { x: event.x, y: event.y };
                
                // Show resize handles if this is the only selected element
                if (this.selectedOMDElements.size === 1) {
                    this.resizeHandleManager.selectElement(omdElement);
                }
                
                if (this.canvas.eventManager) {
                    this.canvas.eventManager.isDrawing = true;
                }
                return;
            }

            // New selection
            if (!event.shiftKey) {
                this.selectedSegments.clear();
                this._clearSelectionVisuals();
                this.selectedOMDElements.clear();
                this.resizeHandleManager.clearSelection();
            }
            
            this.selectedOMDElements.add(omdElement);
            this.resizeHandleManager.selectElement(omdElement);
            
            // Start tracking for potential drag operation
            this.isDraggingOMD = true;
            this.draggedOMDElement = omdElement;
            this.startPoint = { x: event.x, y: event.y };
            
            // Set isDrawing so we get pointermove events
            if (this.canvas.eventManager) {
                this.canvas.eventManager.isDrawing = true;
            }
            
            return;
        } else {
            // Check if clicking inside existing selection bounds
            const selectionBounds = this._getSelectionBounds();
            if (selectionBounds && 
                event.x >= selectionBounds.x && 
                event.x <= selectionBounds.x + selectionBounds.width &&
                event.y >= selectionBounds.y && 
                event.y <= selectionBounds.y + selectionBounds.height) {
                
                // Drag the selection (strokes AND OMD elements)
                this.isDraggingStrokes = true; // We reuse this flag for general dragging
                this.isDraggingOMD = true;     // Also set this for OMD elements
                this.hasSeparatedForDrag = false;
                this.dragStartPoint = { x: event.x, y: event.y };
                this.startPoint = { x: event.x, y: event.y }; // For OMD dragging
                
                if (this.canvas.eventManager) {
                    this.canvas.eventManager.isDrawing = true;
                }
                return;
            }

            // Clicking on empty space - clear all selections and start box selection
            this.resizeHandleManager.clearSelection();
            this.selectedOMDElements.clear();
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
        
        let handled = false;
        
        // Handle OMD dragging if in progress
        if (this.isDraggingOMD) {
            this._dragOMDElements(event.x, event.y);
            handled = true;
        }

        // Handle stroke dragging if in progress
        if (this.isDraggingStrokes && this.dragStartPoint) {
            const dx = event.x - this.dragStartPoint.x;
            const dy = event.y - this.dragStartPoint.y;
            
            if (dx !== 0 || dy !== 0) {
                // If we moved, it's a drag, so cancel potential deselect
                this.potentialDeselect = null;

                // Separate selected parts if needed
                if (!this.hasSeparatedForDrag) {
                    this._separateSelectedParts();
                    this.hasSeparatedForDrag = true;
                }
                
                // Move all selected strokes
                const movedStrokes = new Set();
                for (const [strokeId, _] of this.selectedSegments) {
                    const stroke = this.canvas.strokes.get(strokeId);
                    if (stroke) {
                        stroke.move(dx, dy);
                        movedStrokes.add(strokeId);
                    }
                }
                
                this.dragStartPoint = { x: event.x, y: event.y };
                this._updateSegmentSelectionVisuals();
                
                // Emit event
                this.canvas.emit('strokesMoved', { 
                    dx, dy, 
                    strokeIds: Array.from(movedStrokes) 
                });
            }
            handled = true;
        }
        
        if (handled) return;
        
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

        // Handle stroke drag completion
        if (this.isDraggingStrokes) {
            if (this.potentialDeselect) {
                // We clicked a selected segment but didn't drag -> toggle selection
                this._handleSegmentClick(this.potentialDeselect, event.shiftKey);
                this.potentialDeselect = null;
            }
            
            this.isDraggingStrokes = false;
            this.dragStartPoint = null;
            
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
            this.canvas.cursor.setShape('pointer');
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
        
        return 'pointer'; 
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
        this.selectedOMDElements.clear();
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
     * Checks if a segment is currently selected.
     * @private
     * @param {{strokeId: string, segmentIndex: number}} selection - The selection to check.
     * @returns {boolean}
     */
    _isSegmentSelected({ strokeId, segmentIndex }) {
        const segmentSet = this.selectedSegments.get(strokeId);
        return segmentSet ? segmentSet.has(segmentIndex) : false;
    }

    /**
     * Gets the bounding box of the current selection (strokes + OMD).
     * @private
     * @returns {{x: number, y: number, width: number, height: number}|null}
     */
    _getSelectionBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasPoints = false;

        // 1. Check strokes
        if (this.selectedSegments.size > 0) {
            for (const [strokeId, segmentSet] of this.selectedSegments.entries()) {
                const stroke = this.canvas.strokes.get(strokeId);
                if (!stroke || !stroke.points) continue;

                for (const segmentIndex of segmentSet) {
                    if (segmentIndex >= stroke.points.length - 1) continue;
                    const p1 = stroke.points[segmentIndex];
                    const p2 = stroke.points[segmentIndex + 1];
                    
                    minX = Math.min(minX, p1.x, p2.x);
                    minY = Math.min(minY, p1.y, p2.y);
                    maxX = Math.max(maxX, p1.x, p2.x);
                    maxY = Math.max(maxY, p1.y, p2.y);
                    hasPoints = true;
                }
            }
        }

        // 2. Check OMD elements
        if (this.selectedOMDElements.size > 0) {
            for (const element of this.selectedOMDElements) {
                const bbox = this._getOMDElementBounds(element);
                if (bbox) {
                    minX = Math.min(minX, bbox.x);
                    minY = Math.min(minY, bbox.y);
                    maxX = Math.max(maxX, bbox.x + bbox.width);
                    maxY = Math.max(maxY, bbox.y + bbox.height);
                    hasPoints = true;
                }
            }
        }

        if (!hasPoints) return null;
        
        // Add padding to match the visual box
        const padding = this.selectionBoundsPadding;
        return {
            x: minX - padding.left,
            y: minY - padding.top,
            width: (maxX + padding.right) - (minX - padding.left),
            height: (maxY + padding.bottom) - (minY - padding.top)
        };
    }

    /**
     * Drags all selected OMD elements
     * @private
     * @param {number} x - Current pointer x coordinate
     * @param {number} y - Current pointer y coordinate
     */
    _dragOMDElements(x, y) {
        if (!this.startPoint) return;
        
        const dx = x - this.startPoint.x;
        const dy = y - this.startPoint.y;
        
        if (dx === 0 && dy === 0) return;

        for (const element of this.selectedOMDElements) {
            this._moveOMDElement(element, dx, dy);
        }
        
        // Update start point for next move
        this.startPoint = { x, y };
        
        // Update resize handles if we have a single selection
        if (this.selectedOMDElements.size === 1) {
            const element = this.selectedOMDElements.values().next().value;
            this.resizeHandleManager.updateIfSelected(element);
        }
        
        this._updateSegmentSelectionVisuals();
    }

    /**
     * Moves a single OMD element
     * @private
     */
    _moveOMDElement(element, dx, dy) {
        // Parse current transform
        const currentTransform = element.getAttribute('transform') || '';
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
        
        element.setAttribute('transform', newTransform);
    }
    
    /**
     * Gets the bounds of an OMD element including transform
     * @private
     */
    _getOMDElementBounds(item) {
        try {
            const transform = item.getAttribute('transform') || '';
            let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1;

            const translateMatch = transform.match(/translate\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
            if (translateMatch) {
                offsetX = parseFloat(translateMatch[1]) || 0;
                offsetY = parseFloat(translateMatch[2]) || 0;
            }

            const scaleMatch = transform.match(/scale\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/);
            if (scaleMatch) {
                scaleX = parseFloat(scaleMatch[1]) || 1;
                scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
            }

            // Use clip-rect logic (same as ResizeHandleManager) to avoid
            // getBBox() returning the full unclipped geometry for coordinate planes.
            const content = item.firstElementChild;
            let bbox = null;

            if (content) {
                const clipPaths = content.querySelectorAll('clipPath');
                if (clipPaths.length > 0) {
                    let maxArea = 0;
                    for (const clipPath of clipPaths) {
                        const rect = clipPath.querySelector('rect');
                        if (rect) {
                            const w = parseFloat(rect.getAttribute('width')) || 0;
                            const h = parseFloat(rect.getAttribute('height')) || 0;
                            const x = parseFloat(rect.getAttribute('x')) || 0;
                            const y = parseFloat(rect.getAttribute('y')) || 0;
                            if (w * h > maxArea) {
                                maxArea = w * h;
                                // Account for the content group's own translate
                                const contentGroup = content.firstElementChild;
                                let tx = 0, ty = 0;
                                if (contentGroup) {
                                    const t = contentGroup.getAttribute('transform');
                                    if (t) {
                                        const m = t.match(/translate\(\s*([^,]+)(?:,\s*([^)]+))?\s*\)/);
                                        if (m) { tx = parseFloat(m[1]) || 0; ty = parseFloat(m[2]) || 0; }
                                    }
                                }
                                bbox = { x: x + tx, y: y + ty, width: w, height: h };
                            }
                        }
                    }
                }
                if (!bbox) {
                    bbox = content.getBBox();
                }
            } else {
                bbox = item.getBBox();
            }

            return {
                x: offsetX + (bbox.x * scaleX),
                y: offsetY + (bbox.y * scaleY),
                width: bbox.width * scaleX,
                height: bbox.height * scaleY
            };
        } catch (e) {
            return null;
        }
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
                // Reuse _getOMDElementBounds which applies clip-rect logic
                // to avoid oversized hit areas on coordinate planes.
                const bounds = this._getOMDElementBounds(item);
                if (!bounds) continue;

                // Add some padding for easier clicking
                const padding = 10;
                
                if (x >= bounds.x - padding && 
                    x <= bounds.x + bounds.width + padding &&
                    y >= bounds.y - padding && 
                    y <= bounds.y + bounds.height + padding) {
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

        // 1. Select strokes
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

        // 2. Select OMD elements
        const omdLayer = this.canvas.drawingLayer?.querySelector('.omd-layer');
        if (omdLayer) {
             const omdItems = omdLayer.querySelectorAll('.omd-item');
             for (const item of omdItems) {
                 if (item?.dataset?.locked === 'true') continue;
                 
                 const itemBounds = this._getOMDElementBounds(item);
                 if (itemBounds) {
                     // Check intersection
                     const intersects = !(itemBounds.x > x + width || 
                                        itemBounds.x + itemBounds.width < x || 
                                        itemBounds.y > y + height || 
                                        itemBounds.y + itemBounds.height < y);
                     
                     if (intersects) {
                         this.selectedOMDElements.add(item);
                     }
                 }
             }
        }
        
        // Update resize handles
        this.resizeHandleManager.clearSelection();

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

        // If a single OMD element was directly clicked, ResizeHandleManager already draws
        // its own selection border + handles — don't draw a second box on top of it.
        // For drag-box selections (no active resizeHandleManager element), always draw the box.
        if (this.selectedSegments.size === 0 &&
            this.selectedOMDElements.size > 0 &&
            this.resizeHandleManager?.selectedElement !== null) {
            return;
        }

        const bounds = this._getSelectionBounds();
        if (!bounds) return;

        // Create bounding box element
        const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        box.setAttribute('x', bounds.x);
        box.setAttribute('y', bounds.y);
        box.setAttribute('width', bounds.width);
        box.setAttribute('height', bounds.height);
        box.setAttribute('fill', 'none');
        box.setAttribute('stroke', '#007bff'); // Selection color
        box.setAttribute('stroke-width', '1.5');
        box.setAttribute('stroke-dasharray', '6, 4'); // Dotted/Dashed
        box.setAttribute('stroke-opacity', '0.6'); // Light
        box.setAttribute('rx', '8'); // Rounded corners
        box.setAttribute('ry', '8');
        box.style.pointerEvents = 'none';
        box.classList.add('selection-bounds');
        
        selectionLayer.appendChild(box);
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
     * Selects all segments and OMD elements on the canvas.
     * @private
     */
    _selectAllSegments() {
        // Clear current selection
        this.selectedSegments.clear();
        this.selectedOMDElements.clear();
        
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
        
        // Select all OMD elements
        const omdLayer = this.canvas.drawingLayer?.querySelector('.omd-layer');
        if (omdLayer) {
             const omdItems = omdLayer.querySelectorAll('.omd-item');
             for (const item of omdItems) {
                 if (item?.dataset?.locked !== 'true') {
                     this.selectedOMDElements.add(item);
                 }
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
     * Deletes all currently selected items (segments and OMD elements).
     * @private
     */
    _deleteSelectedSegments() {
        let changed = false;

        // Delete OMD elements
        if (this.selectedOMDElements.size > 0) {
            for (const element of this.selectedOMDElements) {
                element.remove();
            }
            this.selectedOMDElements.clear();
            this.resizeHandleManager.clearSelection();
            changed = true;
        }

        if (this.selectedSegments.size > 0) {
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
            changed = true;
        }

        if (changed) {
            // Clear selection and update UI
            this.clearSelection();
            
            // Emit deletion event
            this.canvas.emit('selectionDeleted');
        }
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
     * Separates selected segments into new strokes so they can be moved independently.
     * @private
     */
    _separateSelectedParts() {
        const newSelection = new Map();
        const strokesToProcess = Array.from(this.selectedSegments.entries());

        for (const [strokeId, selectedIndices] of strokesToProcess) {
            const stroke = this.canvas.strokes.get(strokeId);
            if (!stroke || !stroke.points || stroke.points.length < 2) continue;

            const totalSegments = stroke.points.length - 1;
            
            // If fully selected, just keep it as is
            if (selectedIndices.size === totalSegments) {
                newSelection.set(strokeId, selectedIndices);
                continue;
            }

            // It's a partial selection - we need to split
            const sortedSelectedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
            
            // Determine unselected indices
            const unselectedIndices = [];
            for (let i = 0; i < totalSegments; i++) {
                if (!selectedIndices.has(i)) {
                    unselectedIndices.push(i);
                }
            }

            // Group segments
            const selectedGroups = this._groupConsecutiveSegments(sortedSelectedIndices);
            const unselectedGroups = this._groupConsecutiveSegments(unselectedIndices);

            // Create new strokes for selected parts
            selectedGroups.forEach(group => {
                const newStroke = this._createStrokeFromSegments(stroke, group);
                if (newStroke) {
                    // Add to new selection (all segments selected)
                    const newIndices = new Set();
                    for (let i = 0; i < newStroke.points.length - 1; i++) {
                        newIndices.add(i);
                    }
                    newSelection.set(newStroke.id, newIndices);
                }
            });

            // Create new strokes for unselected parts (don't add to selection)
            unselectedGroups.forEach(group => {
                this._createStrokeFromSegments(stroke, group);
            });

            // Remove original stroke
            this.canvas.removeStroke(strokeId);
        }

        this.selectedSegments = newSelection;
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
     * @returns {Stroke|null} The newly created stroke
     */
    _createStrokeFromSegments(originalStroke, segmentIndices) {
        if (segmentIndices.length === 0) return null;
        
        // Collect points for the new stroke
        const newPoints = [];
        
        // Add the first point of the first segment
        newPoints.push(originalStroke.points[segmentIndices[0]]);
        
        // Add all subsequent points
        for (const segmentIndex of segmentIndices) {
            newPoints.push(originalStroke.points[segmentIndex + 1]);
        }
        
        // Only create stroke if we have at least 2 points
        if (newPoints.length < 2) return null;
        
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
        return newStroke;
    }

}


