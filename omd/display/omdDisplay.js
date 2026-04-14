import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdEquationStack } from '../core/omdEquationStack.js';
import { getNodeForAST } from '../core/omdUtilities.js';
import { jsvgContainer } from '@teachinglab/jsvg';

const ACTIVE_DISPLAYS = new Set();

/**
 * OMD Renderer - Handles rendering of mathematical expressions
 * This class provides a cleaner API for rendering expressions without
 * being tied to specific DOM elements or UI concerns.
 */
export class omdDisplay {
    constructor(container, options = {}) {
        this.container = container;
        this._initialContainerStyle = {
            width: container?.style?.width || '',
            height: container?.style?.height || '',
            overflow: container?.style?.overflow || '',
            overflowX: container?.style?.overflowX || '',
            overflowY: container?.style?.overflowY || ''
        };

        const {
            stepVisualizer = false,
            stackOptions = null,
            math: mathInstance = (typeof window !== 'undefined' && window.math) ? window.math : null,
            ...otherOptions
        } = options || {};

        this.options = {
            fontSize: 32,
            centerContent: true,
            topMargin: 40,
            bottomMargin: 16,
            observeResize: true,
            expandViewboxToFitContent: true,
            fitToContent: false,
            autoScale: true,
            maxScale: 1,
            edgePadding: 16,
            autoCloseStepVisualizer: true,
            stepVisualizer,
            stackOptions,
            math: mathInstance,
            ...otherOptions
        };

        this.svg = new jsvgContainer();
        this.node = null;
        this._contentGroup = null;
        this._baseNodeScale = 1;
        this._isFitToContentSized = false;
        this._lastViewbox = null;
        this._lastContainerWidth = null;
        this._lastContainerHeight = null;
        this._deferredLayoutFrame = null;
        this._deferredLayoutAttempts = 0;

        this._setupSVG();
        this._registerGlobalRefreshHook();
    }

    _setupSVG() {
        const width = this.container.offsetWidth || 800;
        const height = this.container.offsetHeight || 600;

        this.svg.setViewbox(width, height);
        this.svg.svgObject.style.display = 'block';
        this.svg.svgObject.style.verticalAlign = 'middle';
        this.svg.svgObject.style.maxWidth = 'none';
        this.svg.svgObject.style.maxHeight = 'none';
        this.svg.svgObject.style.overflow = 'hidden';
        this.container.appendChild(this.svg.svgObject);

        try {
            const ns = 'http://www.w3.org/2000/svg';
            this._contentGroup = document.createElementNS(ns, 'g');
            this._contentGroup.setAttribute('id', 'omd-content-root');
            this.svg.svgObject.appendChild(this._contentGroup);
        } catch (_) {
            this._contentGroup = null;
        }

        this._setCanvasSize(width, height);
        this._restoreContainerOverflow();

        if (this.options.observeResize && typeof window !== 'undefined' && window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this._handleResize();
            });
            this.resizeObserver.observe(this.container);
        }
    }

    _registerGlobalRefreshHook() {
        ACTIVE_DISPLAYS.add(this);
        if (typeof window === 'undefined') return;

        window.refreshDisplayAndFilters = () => {
            for (const display of Array.from(ACTIVE_DISPLAYS)) {
                try {
                    display._refreshDisplayAndFilters();
                } catch (_) {
                    // Ignore per-display refresh failures so one bad node
                    // does not break every active display on the page.
                }
            }
        };
    }

    _unregisterGlobalRefreshHook() {
        ACTIVE_DISPLAYS.delete(this);
        if (typeof window === 'undefined') return;

        window.refreshDisplayAndFilters = () => {
            for (const display of Array.from(ACTIVE_DISPLAYS)) {
                try {
                    display._refreshDisplayAndFilters();
                } catch (_) {
                    // no-op
                }
            }
        };
    }

    _refreshDisplayAndFilters() {
        if (!this.node) return;

        const sequence = this.node.getSequence ? this.node.getSequence() : null;
        if (sequence) {
            if (typeof sequence.simplifyAll === 'function') {
                sequence.simplifyAll();
            }
            if (typeof sequence.updateStepsVisibility === 'function') {
                const filterLevel = typeof sequence.getFilterLevel === 'function'
                    ? sequence.getFilterLevel()
                    : 0;
                sequence.updateStepsVisibility(step => (step.stepMark ?? 0) === filterLevel);
            }
        }

        this._prepareNodeForLayout(this.node);
        this._applyLayoutOptions();
        if (this._needsDeferredLayout()) this._scheduleDeferredLayout();
    }

    _handleResize() {
        const width = this.container.offsetWidth || 0;
        const height = this.container.offsetHeight || 0;

        if (!width || !height) {
            if (this.node) this._scheduleDeferredLayout();
            return;
        }
        if (this._lastContainerWidth === width && this._lastContainerHeight === height) return;

        this._lastContainerWidth = width;
        this._lastContainerHeight = height;

        if (!this.node) {
            this._syncViewboxToContainer(width, height);
            this._restoreContainerOverflow();
            return;
        }

        if (this.options.fitToContent) {
            // fitToContent owns the host size. Ignore external host resizes.
            return;
        }

        this._applyLayoutOptions();
    }

    _setCanvasSize(width, height, { resizeContainer = false } = {}) {
        const safeWidth = Math.max(1, Math.ceil(width || 1));
        const safeHeight = Math.max(1, Math.ceil(height || 1));

        this.svg.setViewbox(safeWidth, safeHeight);
        this.svg.setWidthAndHeight(safeWidth, safeHeight);
        this.svg.svgObject.style.width = `${safeWidth}px`;
        this.svg.svgObject.style.height = `${safeHeight}px`;
        this._lastViewbox = `0 0 ${safeWidth} ${safeHeight}`;

        if (resizeContainer) {
            this.container.style.width = `${safeWidth}px`;
            this.container.style.height = `${safeHeight}px`;
            this._isFitToContentSized = true;
        }
    }

    _syncViewboxToContainer(width = this.container.offsetWidth || 0, height = this.container.offsetHeight || 0) {
        if (!width || !height) return;
        this._setCanvasSize(width, height);
    }

    _restoreContainerSize() {
        if (!this._isFitToContentSized) return;

        this.container.style.width = this._initialContainerStyle.width;
        this.container.style.height = this._initialContainerStyle.height;
        this._isFitToContentSized = false;
    }

    _restoreContainerOverflow() {
        this.container.style.overflow = this._initialContainerStyle.overflow;
        this.container.style.overflowX = this._initialContainerStyle.overflowX;
        this.container.style.overflowY = this._initialContainerStyle.overflowY;
    }

    _applyContainerOverflow(canvasWidth, canvasHeight) {
        if (this.options.fitToContent || this._isFitToContentSized) {
            this.container.style.overflow = 'hidden';
            this.container.style.overflowX = 'hidden';
            this.container.style.overflowY = 'hidden';
            return;
        }

        const hostWidth = this.container.offsetWidth || 0;
        const hostHeight = this.container.offsetHeight || 0;
        const needsX = canvasWidth > hostWidth + 0.5;
        const needsY = canvasHeight > hostHeight + 0.5;

        if (!needsX && !needsY) {
            this._restoreContainerOverflow();
            return;
        }

        this.container.style.overflow = 'hidden';
        this.container.style.overflowX = needsX ? 'auto' : 'hidden';
        this.container.style.overflowY = needsY ? 'auto' : 'hidden';
    }

    _needsDeferredLayout() {
        if (!this.node || typeof window === 'undefined') return false;
        if (!this.container?.isConnected || !this.svg?.svgObject?.isConnected) return true;
        if (this.options.fitToContent) return false;
        return !(this.container.offsetWidth && this.container.offsetHeight);
    }

    _scheduleDeferredLayout() {
        if (!this.node) return;
        if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
        if (this._deferredLayoutFrame !== null) return;

        this._deferredLayoutFrame = window.requestAnimationFrame(() => {
            this._deferredLayoutFrame = null;

            if (!this.node) {
                this._deferredLayoutAttempts = 0;
                return;
            }

            if (this._needsDeferredLayout()) {
                if (this._deferredLayoutAttempts >= 8) return;
                this._deferredLayoutAttempts += 1;
                this._scheduleDeferredLayout();
                return;
            }

            this._deferredLayoutAttempts = 0;
            this._prepareNodeForLayout(this.node);
            this._applyLayoutOptions();
        });
    }

    _cancelDeferredLayout() {
        if (this._deferredLayoutFrame === null) return;
        if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(this._deferredLayoutFrame);
        }
        this._deferredLayoutFrame = null;
        this._deferredLayoutAttempts = 0;
    }

    _appendNode(node) {
        if (!node) return;

        if (this._contentGroup && node.svgObject) {
            try {
                this._contentGroup.appendChild(node.svgObject);
                return;
            } catch (_) {
                // Fall back to jsvg container addChild below.
            }
        }

        this.svg.addChild(node);
    }

    _removeNodeFromDom(node) {
        if (!node || !node.svgObject) return;

        try {
            if (this._contentGroup && this._contentGroup.contains(node.svgObject)) {
                this._contentGroup.removeChild(node.svgObject);
            } else if (this.svg.svgObject && this.svg.svgObject.contains(node.svgObject)) {
                this.svg.svgObject.removeChild(node.svgObject);
            } else if (typeof this.svg.removeChild === 'function') {
                this.svg.removeChild(node);
            }
        } catch (_) {
            // no-op
        }
    }

    _removeAllContentChildren() {
        if (this._contentGroup) {
            while (this._contentGroup.lastChild) {
                this._contentGroup.removeChild(this._contentGroup.lastChild);
            }
            return;
        }

        if (typeof this.svg?.removeAllChildren === 'function') {
            this.svg.removeAllChildren();
        }
    }

    _captureBaseNodeScale(node = this.node) {
        if (!node) {
            this._baseNodeScale = 1;
            return;
        }

        const scale = typeof node.scale === 'number' && isFinite(node.scale) && node.scale > 0
            ? node.scale
            : 1;
        this._baseNodeScale = scale;
    }

    _getBaseNodeScale() {
        return typeof this._baseNodeScale === 'number' && isFinite(this._baseNodeScale) && this._baseNodeScale > 0
            ? this._baseNodeScale
            : 1;
    }

    _applyConfiguredFontProperties(node = this.node) {
        if (!node) return;

        if (typeof this.options.fontSize === 'number') {
            if (typeof node.setFontSize === 'function') {
                node.setFontSize(this.options.fontSize);
            } else if ('fontSize' in node) {
                node.fontSize = this.options.fontSize;
            }
        }

        if (this.options.fontFamily) {
            if ('fontFamily' in node) {
                node.fontFamily = this.options.fontFamily;
            }
            if ('headerFontFamily' in node && !node.headerFontFamily) {
                node.headerFontFamily = this.options.fontFamily;
            }
        }
    }

    _prepareNodeForLayout(node = this.node) {
        if (!node) return;

        this._applyConfiguredFontProperties(node);

        if (typeof node.initialize === 'function') {
            node.initialize();
        } else if (typeof node.updateLayout === 'function') {
            node.updateLayout();
        }

        this._applyFontStylesToSvg();
    }

    _applyFontStylesToSvg() {
        if (!this.svg?.svgObject) return;
        if (!this.options.fontFamily && !this.options.fontWeight) return;

        const applyFont = (element) => {
            if (element?.style) {
                if (this.options.fontFamily) {
                    element.style.fontFamily = this.options.fontFamily;
                }
                if (this.options.fontWeight) {
                    element.style.fontWeight = this.options.fontWeight;
                }
            }

            Array.from(element?.children || []).forEach(applyFont);
        };

        applyFont(this.svg.svgObject);
    }

    _getLayoutTarget() {
        if (!this.node) return null;
        if (this.node.layoutGroup?.svgObject) {
            return this.node.layoutGroup;
        }
        return this.node;
    }

    _getAlignmentNode() {
        if (!this.node) return null;

        if (this.node.type === 'omdEquationSequenceNode' || this.node.type === 'omdStepVisualizer') {
            return this.node;
        }

        if (typeof this.node.getSequence === 'function') {
            const sequence = this.node.getSequence();
            if (sequence?.svgObject) {
                return sequence;
            }
        }

        return null;
    }

    _identityMatrix() {
        return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    }

    _transformPoint(matrix, x, y) {
        return {
            x: matrix.a * x + matrix.c * y + matrix.e,
            y: matrix.b * x + matrix.d * y + matrix.f
        };
    }

    _normalizeBounds(minX, minY, maxX, maxY) {
        if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }

        return {
            minX,
            minY,
            maxX,
            maxY,
            width: Math.max(0, maxX - minX),
            height: Math.max(0, maxY - minY)
        };
    }

    _getMatrixRelativeToNode(target) {
        const element = target?.svgObject || target;
        const nodeElement = this.node?.svgObject;

        if (!element || !nodeElement) return null;
        if (element === nodeElement) return this._identityMatrix();

        try {
            const elementCTM = element.getCTM?.();
            const nodeCTM = nodeElement.getCTM?.();
            if (!elementCTM || !nodeCTM || typeof nodeCTM.inverse !== 'function') return null;
            return nodeCTM.inverse().multiply(elementCTM);
        } catch (_) {
            return null;
        }
    }

    _measureBoundsRelativeToNode(target = this._getLayoutTarget()) {
        if (!this.node || !target) {
            return this._normalizeBounds(0, 0, 0, 0);
        }

        try {
            const bbox = target.svgObject?.getBBox?.();
            if (bbox) {
                const matrix = this._getMatrixRelativeToNode(target);
                if (!matrix) {
                    return this._normalizeBounds(bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height);
                }

                const corners = [
                    this._transformPoint(matrix, bbox.x, bbox.y),
                    this._transformPoint(matrix, bbox.x + bbox.width, bbox.y),
                    this._transformPoint(matrix, bbox.x, bbox.y + bbox.height),
                    this._transformPoint(matrix, bbox.x + bbox.width, bbox.y + bbox.height)
                ];

                return this._normalizeBounds(
                    Math.min(...corners.map(point => point.x)),
                    Math.min(...corners.map(point => point.y)),
                    Math.max(...corners.map(point => point.x)),
                    Math.max(...corners.map(point => point.y))
                );
            }
        } catch (_) {
            // Fall through to structural fallback below.
        }

        return this._fallbackBoundsRelativeToNode(target);
    }

    _measureBoundsInRoot(target = this._getLayoutTarget()) {
        if (!target?.svgObject) {
            return this._normalizeBounds(0, 0, 0, 0);
        }

        try {
            const bbox = target.svgObject.getBBox?.();
            const ctm = target.svgObject.getCTM?.();
            if (!bbox || !ctm) {
                return this._normalizeBounds(bbox?.x || 0, bbox?.y || 0, (bbox?.x || 0) + (bbox?.width || 0), (bbox?.y || 0) + (bbox?.height || 0));
            }

            const corners = [
                this._transformPoint(ctm, bbox.x, bbox.y),
                this._transformPoint(ctm, bbox.x + bbox.width, bbox.y),
                this._transformPoint(ctm, bbox.x, bbox.y + bbox.height),
                this._transformPoint(ctm, bbox.x + bbox.width, bbox.y + bbox.height)
            ];

            return this._normalizeBounds(
                Math.min(...corners.map(point => point.x)),
                Math.min(...corners.map(point => point.y)),
                Math.max(...corners.map(point => point.x)),
                Math.max(...corners.map(point => point.y))
            );
        } catch (_) {
            return this._normalizeBounds(0, 0, 0, 0);
        }
    }

    _fallbackBoundsRelativeToNode(target) {
        if (!target) return this._normalizeBounds(0, 0, 0, 0);

        if (target === this.node) {
            return this._normalizeBounds(0, 0, target.width || 0, target.height || 0);
        }

        const x = target.xpos || 0;
        const y = target.ypos || 0;
        const width = target.width || 0;
        const height = target.height || 0;
        return this._normalizeBounds(x, y, x + width, y + height);
    }

    _getOverlayMetrics() {
        const node = this.node;
        if (!node || typeof node.isToolbarOverlay !== 'function' || !node.isToolbarOverlay()) {
            return { width: 0, height: 0, padding: 0, totalHeight: 0 };
        }

        const width = node.toolbar?.elements?.background?.width || 0;
        const height = typeof node.getToolbarVisualHeight === 'function'
            ? node.getToolbarVisualHeight()
            : 0;
        const padding = typeof node.getOverlayPadding === 'function'
            ? node.getOverlayPadding()
            : 16;

        return {
            width,
            height,
            padding,
            totalHeight: height + padding
        };
    }

    _closeTransientUi() {
        if (!this.options.autoCloseStepVisualizer || !this.node) return;

        try {
            if (typeof this.node.forceCloseAll === 'function') {
                this.node.forceCloseAll();
            } else if (typeof this.node.closeAllTextBoxes === 'function') {
                this.node.closeAllTextBoxes();
            } else if (typeof this.node.closeActiveDot === 'function') {
                this.node.closeActiveDot();
            }
        } catch (_) {
            // no-op
        }
    }

    _getAlignmentAnchorX() {
        const alignmentNode = this._getAlignmentNode();
        if (!alignmentNode || alignmentNode.alignPointX === undefined) return null;

        const matrix = this._getMatrixRelativeToNode(alignmentNode);
        if (!matrix) return alignmentNode.alignPointX;

        return this._transformPoint(matrix, alignmentNode.alignPointX, 0).x;
    }

    _computeAutoScale(bounds) {
        const baseScale = this._getBaseNodeScale();
        if (!this.options.autoScale || !bounds.width || !bounds.height) {
            return baseScale;
        }

        const overlay = this._getOverlayMetrics();
        const naturalWidth = Math.max(bounds.width * baseScale, overlay.width);
        const naturalHeight = Math.max(1, bounds.height * baseScale + overlay.totalHeight);

        const containerWidth = this.container.offsetWidth || naturalWidth;
        const containerHeight = this.container.offsetHeight || naturalHeight;
        const availWidth = Math.max(1, containerWidth - (this.options.edgePadding || 0) * 2);
        const availHeight = Math.max(1, containerHeight - (this.options.topMargin || 0) - (this.options.bottomMargin || 0));
        const maxScale = typeof this.options.maxScale === 'number' && this.options.maxScale > 0
            ? this.options.maxScale
            : Infinity;

        const scaleFactor = Math.min(
            availWidth / Math.max(1, naturalWidth),
            availHeight / Math.max(1, naturalHeight),
            maxScale / baseScale
        );

        if (!isFinite(scaleFactor) || scaleFactor <= 0) {
            return baseScale;
        }

        return baseScale * scaleFactor;
    }

    _layoutToPosition({ centered }) {
        if (!this.node) return;

        this._closeTransientUi();

        const bounds = this._measureBoundsRelativeToNode();
        const overlay = this._getOverlayMetrics();
        const scale = this._computeAutoScale(bounds);
        const edgePadding = this.options.edgePadding || 0;
        const topMargin = this.options.topMargin || 0;
        const bottomMargin = this.options.bottomMargin || 0;
        const containerWidth = this.container.offsetWidth || 0;
        const containerHeight = this.container.offsetHeight || 0;
        const allowOverflow = this.options.expandViewboxToFitContent !== false;

        if (typeof this.node.setScale === 'function') {
            this.node.setScale(scale);
        }

        const scaledWidth = bounds.width * scale;
        const scaledHeight = bounds.height * scale;
        const anchorX = centered ? this._getAlignmentAnchorX() : null;

        let requiredWidth = edgePadding * 2 + scaledWidth;
        if (anchorX !== null) {
            const leftExtent = (anchorX - bounds.minX) * scale;
            const rightExtent = (bounds.maxX - anchorX) * scale;
            requiredWidth = edgePadding * 2 + Math.max(leftExtent, rightExtent) * 2;
        }
        requiredWidth = Math.max(requiredWidth, edgePadding * 2 + overlay.width);

        const requiredHeight = topMargin + bottomMargin + overlay.totalHeight + scaledHeight;
        const canvasWidth = allowOverflow ? Math.max(containerWidth, Math.ceil(requiredWidth)) : Math.max(1, containerWidth);
        const canvasHeight = allowOverflow ? Math.max(containerHeight, Math.ceil(requiredHeight)) : Math.max(1, containerHeight);

        this._setCanvasSize(canvasWidth, canvasHeight);
        this._applyContainerOverflow(canvasWidth, canvasHeight);

        let x;
        if (anchorX !== null) {
            x = canvasWidth / 2 - anchorX * scale;
        } else {
            const availableWidth = Math.max(0, canvasWidth - edgePadding * 2);
            const desiredMinX = centered
                ? edgePadding + Math.max(0, (availableWidth - scaledWidth) / 2)
                : edgePadding;
            x = desiredMinX - bounds.minX * scale;
        }

        const availableHeight = Math.max(0, canvasHeight - topMargin - bottomMargin - overlay.totalHeight);
        const desiredMinY = centered
            ? topMargin + Math.max(0, (availableHeight - scaledHeight) / 2)
            : topMargin;
        const y = desiredMinY - bounds.minY * scale;

        if (typeof this.node.setPosition === 'function') {
            this.node.setPosition(x, y);
        }

        this._repositionOverlayToolbar();
        if (this.options.debugExtents) this._drawDebugOverlays();
        else this._clearDebugOverlays();
    }

    _applyLayoutOptions() {
        if (!this.node) return;

        if (this.options.fitToContent) {
            this.fitToContent();
            return;
        }

        this._restoreContainerSize();

        if (this.options.centerContent) {
            this.centerNode();
        } else {
            this._layoutToPosition({ centered: false });
        }
    }

    /**
     * Ensure the internal SVG canvas is large enough to contain the current content.
     * This preserves visual scale by expanding the canvas, not by changing centering math.
     * @param {number} _contentWidth
     * @param {number} _contentHeight
     */
    _ensureViewboxFits(_contentWidth, _contentHeight) {
        if (!this.node) return;

        const pad = 10;
        let rootBounds = this._measureBoundsInRoot();
        if (!rootBounds.width && !rootBounds.height) return;

        let dx = 0;
        let dy = 0;
        if (rootBounds.minX < pad) dx = pad - rootBounds.minX;
        if (rootBounds.minY < pad) dy = pad - rootBounds.minY;

        if ((dx || dy) && typeof this.node.setPosition === 'function') {
            this.node.setPosition((this.node.xpos || 0) + dx, (this.node.ypos || 0) + dy);
            rootBounds = this._measureBoundsInRoot();
        }

        const containerWidth = this.container.offsetWidth || 0;
        const containerHeight = this.container.offsetHeight || 0;
        const canvasWidth = Math.max(containerWidth, Math.ceil(rootBounds.maxX + pad));
        const canvasHeight = Math.max(containerHeight, Math.ceil(rootBounds.maxY + pad));

        this._setCanvasSize(canvasWidth, canvasHeight);
        this._applyContainerOverflow(canvasWidth, canvasHeight);
    }

    /**
     * Walk the node tree and compute absolute extents in SVG coordinates.
     * Uses `xpos`/`ypos` and `width`/`height` properties; falls back to 0 when missing.
     * @param {omdNode} root
     * @returns {{minX:number,minY:number,maxX:number,maxY:number}}
     */
    _computeNodeExtents(root) {
        if (!root) return null;
        const visited = new Set();
        const stack = [{ node: root, absX: root.xpos || 0, absY: root.ypos || 0 }];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        while (stack.length) {
            const { node, absX, absY } = stack.pop();
            if (!node || visited.has(node)) continue;
            visited.add(node);

            const w = node.width || 0;
            const h = node.height || 0;
            const nx = absX;
            const ny = absY;

            minX = Math.min(minX, nx);
            minY = Math.min(minY, ny);
            maxX = Math.max(maxX, nx + w);
            maxY = Math.max(maxY, ny + h);

            if (Array.isArray(node.childList)) {
                for (const child of node.childList) {
                    if (!child) continue;
                    stack.push({
                        node: child,
                        absX: nx + (child.xpos || 0),
                        absY: ny + (child.ypos || 0)
                    });
                }
            }

            if (node.argumentNodeList) {
                for (const value of Object.values(node.argumentNodeList)) {
                    if (Array.isArray(value)) {
                        value.forEach(child => {
                            if (!child) return;
                            stack.push({
                                node: child,
                                absX: nx + (child.xpos || 0),
                                absY: ny + (child.ypos || 0)
                            });
                        });
                    } else if (value) {
                        stack.push({
                            node: value,
                            absX: nx + (value.xpos || 0),
                            absY: ny + (value.ypos || 0)
                        });
                    }
                }
            }
        }

        if (minX === Infinity) return null;
        return { minX, minY, maxX, maxY };
    }

    /**
     * Collect extents for each node and return per-node list plus overall extents.
     * Useful for debugging elements that extend outside parent coordinates.
     * @param {omdNode} root
     * @returns {{nodes:Array, minX:number, minY:number, maxX:number, maxY:number}}
     */
    _collectNodeExtents(root) {
        if (!root) return null;
        const visited = new Set();
        const stack = [{ node: root, absX: root.xpos || 0, absY: root.ypos || 0, parent: null }];
        const nodes = [];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        while (stack.length) {
            const { node, absX, absY, parent } = stack.pop();
            if (!node || visited.has(node)) continue;
            visited.add(node);

            let nminX = absX;
            let nminY = absY;
            let nmaxX = absX;
            let nmaxY = absY;

            try {
                if (node.svgObject && typeof node.svgObject.getBBox === 'function' && typeof node.svgObject.getCTM === 'function') {
                    const bbox = node.svgObject.getBBox();
                    const ctm = node.svgObject.getCTM();
                    const corners = [
                        this._transformPoint(ctm, bbox.x, bbox.y),
                        this._transformPoint(ctm, bbox.x + bbox.width, bbox.y),
                        this._transformPoint(ctm, bbox.x, bbox.y + bbox.height),
                        this._transformPoint(ctm, bbox.x + bbox.width, bbox.y + bbox.height)
                    ];
                    nminX = Math.min(...corners.map(point => point.x));
                    nminY = Math.min(...corners.map(point => point.y));
                    nmaxX = Math.max(...corners.map(point => point.x));
                    nmaxY = Math.max(...corners.map(point => point.y));
                } else {
                    nmaxX = absX + (node.width || 0);
                    nmaxY = absY + (node.height || 0);
                }
            } catch (_) {
                nmaxX = absX + (node.width || 0);
                nmaxY = absY + (node.height || 0);
            }

            nodes.push({ node, minX: nminX, minY: nminY, maxX: nmaxX, maxY: nmaxY, parent });
            minX = Math.min(minX, nminX);
            minY = Math.min(minY, nminY);
            maxX = Math.max(maxX, nmaxX);
            maxY = Math.max(maxY, nmaxY);

            if (Array.isArray(node.childList)) {
                for (const child of node.childList) {
                    if (!child) continue;
                    stack.push({
                        node: child,
                        absX: absX + (child.xpos || 0),
                        absY: absY + (child.ypos || 0),
                        parent: node
                    });
                }
            }

            if (node.argumentNodeList) {
                for (const value of Object.values(node.argumentNodeList)) {
                    if (Array.isArray(value)) {
                        value.forEach(child => {
                            if (!child) return;
                            stack.push({
                                node: child,
                                absX: absX + (child.xpos || 0),
                                absY: absY + (child.ypos || 0),
                                parent: node
                            });
                        });
                    } else if (value) {
                        stack.push({
                            node: value,
                            absX: absX + (value.xpos || 0),
                            absY: absY + (value.ypos || 0),
                            parent: node
                        });
                    }
                }
            }
        }

        if (minX === Infinity) return null;
        return { nodes, minX, minY, maxX, maxY };
    }

    _clearDebugOverlays() {
        if (!this.svg || !this.svg.svgObject) return;
        const existing = this.svg.svgObject.querySelector('#omd-debug-overlays');
        if (existing) existing.remove();
    }

    _drawDebugOverlays() {
        if (!this.options.debugExtents) return;
        if (!this.svg || !this.svg.svgObject || !this.node) return;

        this._clearDebugOverlays();

        const ns = 'http://www.w3.org/2000/svg';
        const group = document.createElementNS(ns, 'g');
        group.setAttribute('id', 'omd-debug-overlays');
        group.setAttribute('pointer-events', 'none');

        const collected = this._collectNodeExtents(this.node);
        if (!collected) return;

        const { nodes, minX, minY, maxX, maxY } = collected;

        const contentRect = document.createElementNS(ns, 'rect');
        contentRect.setAttribute('x', String(minX));
        contentRect.setAttribute('y', String(minY));
        contentRect.setAttribute('width', String(maxX - minX));
        contentRect.setAttribute('height', String(maxY - minY));
        contentRect.setAttribute('fill', 'none');
        contentRect.setAttribute('stroke', 'blue');
        contentRect.setAttribute('stroke-dasharray', '6 4');
        contentRect.setAttribute('stroke-width', '0.8');
        group.appendChild(contentRect);

        const curView = this.svg.svgObject.getAttribute('viewBox') || '';
        if (curView) {
            const parts = curView.split(/\s+/).map(Number).filter(n => !Number.isNaN(n));
            if (parts.length === 4) {
                const [vx, vy, vw, vh] = parts;
                const vbRect = document.createElementNS(ns, 'rect');
                vbRect.setAttribute('x', String(vx));
                vbRect.setAttribute('y', String(vy));
                vbRect.setAttribute('width', String(vw));
                vbRect.setAttribute('height', String(vh));
                vbRect.setAttribute('fill', 'none');
                vbRect.setAttribute('stroke', 'orange');
                vbRect.setAttribute('stroke-width', '1');
                vbRect.setAttribute('opacity', '0.9');
                group.appendChild(vbRect);
            }
        }

        const overflowing = [];
        for (const item of nodes) {
            const rect = document.createElementNS(ns, 'rect');
            rect.setAttribute('x', String(item.minX));
            rect.setAttribute('y', String(item.minY));
            rect.setAttribute('width', String(Math.max(0, item.maxX - item.minX)));
            rect.setAttribute('height', String(Math.max(0, item.maxY - item.minY)));
            rect.setAttribute('fill', 'none');
            rect.setAttribute('stroke-width', '0.6');

            let stroke = 'green';
            if (item.parent) {
                const parentEntry = nodes.find(nodeEntry => nodeEntry.node === item.parent);
                const pminX = parentEntry ? parentEntry.minX : (item.parent.xpos || 0);
                const pminY = parentEntry ? parentEntry.minY : (item.parent.ypos || 0);
                const pmaxX = parentEntry ? parentEntry.maxX : pminX + (item.parent.width || 0);
                const pmaxY = parentEntry ? parentEntry.maxY : pminY + (item.parent.height || 0);

                if (item.minX < pminX || item.minY < pminY || item.maxX > pmaxX || item.maxY > pmaxY) {
                    stroke = 'red';
                    overflowing.push({ node: item.node, bounds: item });
                }
            }

            rect.setAttribute('stroke', stroke);
            rect.setAttribute('opacity', stroke === 'red' ? '0.9' : '0.6');
            group.appendChild(rect);
        }

        if (overflowing.length) {
            console.warn(
                'omdDisplay: debugExtents found overflowing nodes:',
                overflowing.map(entry => ({ type: entry.node?.type, bounds: entry.bounds }))
            );
        }

        this.svg.svgObject.appendChild(group);
    }

    centerNode() {
        this._layoutToPosition({ centered: true });
    }

    _getMathInstance() {
        if (this.options.math) {
            return this.options.math;
        }
        if (typeof window !== 'undefined' && window.math) {
            return window.math;
        }
        return null;
    }

    _createNodeFromSegment(segment, mathLib) {
        try {
            if (segment.includes('=')) {
                return omdEquationNode.fromString(segment);
            }

            if (!mathLib || typeof mathLib.parse !== 'function') {
                throw new Error('math.js parser is unavailable');
            }

            const ast = mathLib.parse(segment);
            const NodeClass = getNodeForAST(ast);
            return new NodeClass(ast);
        } catch (error) {
            const reason = error?.message || String(error);
            throw new Error(`Failed to parse expression "${segment}": ${reason}`, { cause: error });
        }
    }

    _createNodesFromString(expressionString) {
        const segments = (expressionString || '')
            .split(';')
            .map(segment => segment.trim())
            .filter(Boolean);

        if (!segments.length) {
            throw new Error('omdDisplay.render() received an empty expression string.');
        }

        const mathLib = this._getMathInstance();
        return segments.map(segment => this._createNodeFromSegment(segment, mathLib));
    }

    _buildStackOptions() {
        const baseOptions = {};
        if (typeof this.options.stepVisualizer === 'boolean') {
            baseOptions.stepVisualizer = this.options.stepVisualizer;
        }
        if (this.options.styling) {
            baseOptions.styling = this.options.styling;
        }
        if (Object.prototype.hasOwnProperty.call(this.options, 'toolbar')) {
            baseOptions.toolbar = this.options.toolbar;
        }

        if (this.options.stackOptions && typeof this.options.stackOptions === 'object') {
            return { ...baseOptions, ...this.options.stackOptions };
        }
        return baseOptions;
    }

    _createStackFromSteps(steps) {
        if (!steps || !steps.length) {
            throw new Error('omdDisplay.render() received no steps to render.');
        }
        return new omdEquationStack(steps, this._buildStackOptions());
    }

    fitToContent() {
        if (!this.node) return;

        this._closeTransientUi();
        this._restoreContainerOverflow();

        const bounds = this._measureBoundsRelativeToNode();
        const overlay = this._getOverlayMetrics();
        const scale = this._getBaseNodeScale();
        const paddingX = Math.max(10, this.options.edgePadding || 0);
        const paddingY = 10;

        if (typeof this.node.setScale === 'function') {
            this.node.setScale(scale);
        }

        const contentWidth = bounds.width * scale;
        const contentHeight = bounds.height * scale;
        const canvasWidth = Math.ceil(Math.max(contentWidth + paddingX * 2, overlay.width + paddingX * 2, 1));
        const canvasHeight = Math.ceil(Math.max(contentHeight + overlay.totalHeight + paddingY * 2, 1));
        const x = paddingX - bounds.minX * scale;
        const y = paddingY - bounds.minY * scale;

        if (typeof this.node.setPosition === 'function') {
            this.node.setPosition(x, y);
        }

        this._setCanvasSize(canvasWidth, canvasHeight, { resizeContainer: true });
        this.container.style.overflow = 'hidden';
        this.container.style.overflowX = 'hidden';
        this.container.style.overflowY = 'hidden';

        this._repositionOverlayToolbar();
        if (this.options.debugExtents) this._drawDebugOverlays();
        else this._clearDebugOverlays();
    }

    /**
     * Renders a mathematical expression or equation
     * @param {string|omdNode} expression - Expression string or node
     * @returns {omdNode} The rendered node
     */
    render(expression) {
        if (this.node) {
            this._removeNodeFromDom(this.node);
        }

        if (typeof expression === 'string') {
            const steps = this._createNodesFromString(expression);
            this.node = this._createStackFromSteps(steps);
        } else if (Array.isArray(expression)) {
            const steps = expression
                .flatMap(item => (typeof item === 'string' ? this._createNodesFromString(item) : item))
                .filter(Boolean);
            this.node = this._createStackFromSteps(steps);
        } else {
            this.node = expression;
        }

        if (!this.node) {
            throw new Error('omdDisplay.render() was unable to create a node from the provided expression.');
        }

        this._captureBaseNodeScale(this.node);
        this._appendNode(this.node);
        this._prepareNodeForLayout(this.node);
        this._applyFontStylesToSvg();
        this._applyLayoutOptions();
        if (this._needsDeferredLayout()) this._scheduleDeferredLayout();

        return this.node;
    }

    /**
     * Add a jsvg child to the internal SVG container and optionally
     * trigger layout/centering.
     * @param {object} child - A jsvg node to add
     */
    addChild(child) {
        if (!child) return child;

        if (this._contentGroup && child.svgObject) {
            try {
                this._contentGroup.appendChild(child.svgObject);
            } catch (_) {
                this.svg.addChild(child);
            }
        } else {
            this.svg.addChild(child);
        }

        this._applyLayoutOptions();
        if (this._needsDeferredLayout()) this._scheduleDeferredLayout();
        return child;
    }

    /**
     * Remove a child previously added to the internal SVG container.
     * @param {object} child
     */
    removeChild(child) {
        if (!child) return;

        this._removeNodeFromDom(child);
        if (this.node === child) {
            this.node = null;
            this._cancelDeferredLayout();
            this._restoreContainerSize();
            this._restoreContainerOverflow();
            this._syncViewboxToContainer();
            this._clearDebugOverlays();
        } else if (this.node) {
            this._applyLayoutOptions();
            if (this._needsDeferredLayout()) this._scheduleDeferredLayout();
        }
    }

    /**
     * Updates the display with a new node
     * @param {omdNode} newNode - The new node to display
     */
    update(newNode) {
        if (!newNode) {
            this.clear();
            return;
        }

        if (this.node) {
            this._removeNodeFromDom(this.node);
        }

        this.node = newNode;
        this._captureBaseNodeScale(this.node);
        this._appendNode(this.node);
        this._prepareNodeForLayout(this.node);
        this._applyFontStylesToSvg();
        this._applyLayoutOptions();
        if (this._needsDeferredLayout()) this._scheduleDeferredLayout();
    }

    /**
     * Sets the font size
     * @param {number} size - The font size
     */
    setFontSize(size) {
        this.options.fontSize = size;
        if (!this.node) return;

        this._prepareNodeForLayout(this.node);
        this._applyLayoutOptions();
        if (this._needsDeferredLayout()) this._scheduleDeferredLayout();
    }

    /**
     * Sets the font family for all elements in the display
     * @param {string} fontFamily - CSS font-family string
     * @param {string} fontWeight - CSS font-weight (default: '400')
     */
    setFont(fontFamily, fontWeight = '400') {
        this.options.fontFamily = fontFamily;
        this.options.fontWeight = fontWeight;

        if (!this.node) {
            this._applyFontStylesToSvg();
            return;
        }

        this._prepareNodeForLayout(this.node);
        this._applyLayoutOptions();
        if (this._needsDeferredLayout()) this._scheduleDeferredLayout();
    }

    /**
     * Clears the display
     */
    clear() {
        this._cancelDeferredLayout();

        if (this.node) {
            this._removeNodeFromDom(this.node);
            this.node = null;
        }

        this._removeAllContentChildren();
        this._restoreContainerSize();
        this._restoreContainerOverflow();
        this._syncViewboxToContainer();
        this._clearDebugOverlays();
    }

    /**
     * Destroys the renderer and cleans up resources
     */
    destroy() {
        this.clear();
        this._unregisterGlobalRefreshHook();
        this._cancelDeferredLayout();

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.container.contains(this.svg.svgObject)) {
            this.container.removeChild(this.svg.svgObject);
        }
    }

    /**
     * Repositions overlay toolbar if current node supports it
     * @private
     */
    _repositionOverlayToolbar() {
        const node = this.node;
        if (!node) return;

        const hasOverlayApi = typeof node.isToolbarOverlay === 'function'
            && typeof node.positionToolbarOverlay === 'function';

        if (hasOverlayApi && node.isToolbarOverlay()) {
            const containerWidth = this.container.offsetWidth || 0;
            const containerHeight = this.container.offsetHeight || 0;
            const padding = typeof node.getOverlayPadding === 'function'
                ? node.getOverlayPadding()
                : 16;
            node.positionToolbarOverlay(containerWidth, containerHeight, padding);
        }
    }

    /**
     * Public API: returns the currently rendered root node
     * @returns {object|null}
     */
    getCurrentNode() {
        return this.node;
    }
}
