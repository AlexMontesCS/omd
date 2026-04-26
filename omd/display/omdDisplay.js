import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdEquationStack } from '../core/omdEquationStack.js';
import { getNodeForAST } from '../core/omdUtilities.js';
import { jsvgContainer } from '@teachinglab/jsvg';

const ACTIVE_DISPLAYS = new Set();
const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

const DEFAULT_OPTIONS = {
    fontSize: undefined,
    centerContent: true,
    topMargin: 40,
    bottomMargin: 16,
    observeResize: true,
    expandViewboxToFitContent: true,
    fitToContent: false,
    autoScale: true,
    maxScale: 1,
    edgePadding: 16,
    contentPadding: undefined,
    fitPadding: undefined,
    compactBleed: 2,
    preserveContainerSize: 'width',
    autoCloseStepVisualizer: true
};

/**
 * OMD Renderer - Handles rendering of mathematical expressions
 * This class provides a cleaner API for rendering expressions without
 * being tied to specific DOM elements or UI concerns.
 */
export class omdDisplay {
    constructor(container, options = {}) {
        if (!container || typeof container.appendChild !== 'function') {
            throw new Error('omdDisplay requires a valid DOM container element.');
        }

        this.container = container;
        this._providedOptions = { ...(options || {}) };
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
            ...DEFAULT_OPTIONS,
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
        this._destroyed = false;

        this._setupSVG();
        this._registerGlobalRefreshHook();
        this._scheduleFontReadyLayoutRefresh();
    }

    _setupSVG() {
        const width = this.container.offsetWidth || DEFAULT_CANVAS_WIDTH;
        const height = this.container.offsetHeight || DEFAULT_CANVAS_HEIGHT;

        this.svg.setViewbox(width, height);
        this.svg.svgObject.removeAttribute('backgroundColor');
        this.svg.svgObject.style.display = 'block';
        this.svg.svgObject.style.verticalAlign = 'middle';
        this.svg.svgObject.style.maxWidth = 'none';
        this.svg.svgObject.style.maxHeight = 'none';
        this.svg.svgObject.style.overflow = 'hidden';
        this.container.appendChild(this.svg.svgObject);

        try {
            this._contentGroup = document.createElementNS(SVG_NS, 'g');
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

        this._refreshCurrentNodeLayout();
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

    _hasProvidedOption(optionName) {
        return Object.prototype.hasOwnProperty.call(this._providedOptions, optionName);
    }

    _toFiniteNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    _toNonNegativeNumber(value, fallback = 0) {
        return Math.max(0, this._toFiniteNumber(value, fallback));
    }

    _normalizePadding(value, fallback = { top: 0, right: 0, bottom: 0, left: 0 }) {
        const normalizedFallback = {
            top: this._toNonNegativeNumber(fallback?.top, 0),
            right: this._toNonNegativeNumber(fallback?.right, 0),
            bottom: this._toNonNegativeNumber(fallback?.bottom, 0),
            left: this._toNonNegativeNumber(fallback?.left, 0)
        };

        if (value === undefined || value === null) {
            return normalizedFallback;
        }

        if (typeof value === 'number' || typeof value === 'string') {
            const padding = this._toNonNegativeNumber(value, 0);
            return { top: padding, right: padding, bottom: padding, left: padding };
        }

        if (typeof value !== 'object') {
            return normalizedFallback;
        }

        const horizontal = value.x ?? value.horizontal;
        const vertical = value.y ?? value.vertical;
        const left = value.left ?? horizontal ?? normalizedFallback.left;
        const right = value.right ?? horizontal ?? normalizedFallback.right;
        const top = value.top ?? vertical ?? normalizedFallback.top;
        const bottom = value.bottom ?? vertical ?? normalizedFallback.bottom;

        return {
            top: this._toNonNegativeNumber(top, normalizedFallback.top),
            right: this._toNonNegativeNumber(right, normalizedFallback.right),
            bottom: this._toNonNegativeNumber(bottom, normalizedFallback.bottom),
            left: this._toNonNegativeNumber(left, normalizedFallback.left)
        };
    }

    _getPreservedLayoutPadding() {
        const edgePadding = this._toNonNegativeNumber(this.options.edgePadding, 0);
        return {
            top: this._toNonNegativeNumber(this.options.topMargin, 0),
            right: edgePadding,
            bottom: this._toNonNegativeNumber(this.options.bottomMargin, 0),
            left: edgePadding
        };
    }

    _getCompactLayoutPadding() {
        if (this.options.contentPadding !== undefined) {
            return this._normalizePadding(this.options.contentPadding);
        }

        if (this.options.fitPadding !== undefined) {
            return this._normalizePadding(this.options.fitPadding);
        }

        if (this.options.fitToContent && this._hasProvidedOption('edgePadding')) {
            return this._normalizePadding(this.options.edgePadding);
        }

        return this._normalizePadding(this.options.compactBleed);
    }

    _getLayoutPadding({ preserveAxes = this._getPreserveContainerAxes() } = {}) {
        const preserved = this._getPreservedLayoutPadding();
        const compact = this._getCompactLayoutPadding();

        return {
            top: preserveAxes.height ? preserved.top : compact.top,
            right: preserveAxes.width ? preserved.right : compact.right,
            bottom: preserveAxes.height ? preserved.bottom : compact.bottom,
            left: preserveAxes.width ? preserved.left : compact.left
        };
    }

    _getCanvasDimensions() {
        const widthAttr = this._toFiniteNumber(this.svg?.svgObject?.getAttribute?.('width'), 0);
        const heightAttr = this._toFiniteNumber(this.svg?.svgObject?.getAttribute?.('height'), 0);
        if (widthAttr > 0 && heightAttr > 0) {
            return { width: widthAttr, height: heightAttr };
        }

        const viewBox = this.svg?.svgObject?.getAttribute?.('viewBox') || '';
        const parts = viewBox.split(/\s+/).map(Number).filter(Number.isFinite);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            return { width: parts[2], height: parts[3] };
        }

        return {
            width: this.container.offsetWidth || 0,
            height: this.container.offsetHeight || 0
        };
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
            this._refreshCurrentNodeLayout();
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

    _scheduleFontReadyLayoutRefresh() {
        if (typeof document === 'undefined') return;
        const fontReady = document.fonts?.ready;
        if (!fontReady || typeof fontReady.then !== 'function') return;

        fontReady.then(() => {
            if (this._destroyed || !this.node) return;
            this._refreshCurrentNodeLayout();
        }).catch(() => {
            // Font readiness is best-effort; rendering should not depend on it.
        });
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

            if (Array.isArray(this.svg?.childList)) {
                for (const child of this.svg.childList.slice()) {
                    if (!child?.svgObject || child.svgObject === this._contentGroup) continue;
                    try {
                        if (this.svg.svgObject?.contains(child.svgObject)) {
                            this.svg.svgObject.removeChild(child.svgObject);
                        }
                    } catch (_) {
                        // no-op
                    }
                }
                this.svg.childList = [];
            }
            return;
        }

        if (typeof this.svg?.removeAllChildren === 'function') {
            this.svg.removeAllChildren();
        }
    }

    _resetRenderedContent() {
        this._cancelDeferredLayout();
        this._removeAllContentChildren();
        this.node = null;
    }

    _layoutCurrentNode() {
        if (!this.node) return;
        this._applyLayoutOptions();
        if (this._needsDeferredLayout()) this._scheduleDeferredLayout();
    }

    _refreshCurrentNodeLayout() {
        if (!this.node) return;
        this._prepareNodeForLayout(this.node);
        this._layoutCurrentNode();
    }

    _mountRootNode(node, { append = true } = {}) {
        if (!node) {
            throw new Error('omdDisplay.render() was unable to create a node from the provided expression.');
        }

        this.node = node;
        this._captureBaseNodeScale(this.node);
        if (append) this._appendNode(this.node);
        this._refreshCurrentNodeLayout();
        return this.node;
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

    _getSvgBBox(element) {
        if (!element || typeof element.getBBox !== 'function') return null;

        try {
            return element.getBBox({ stroke: true, markers: true });
        } catch (_) {
            try {
                return element.getBBox();
            } catch (_) {
                return null;
            }
        }
    }

    _boundsFromBBox(bbox, matrix = null) {
        if (!bbox) return this._normalizeBounds(0, 0, 0, 0);

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

    _unionBounds(boundsList) {
        const validBounds = boundsList.filter(bounds => (
            bounds &&
            [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].every(Number.isFinite) &&
            (bounds.width > 0 || bounds.height > 0)
        ));

        if (!validBounds.length) {
            return this._normalizeBounds(0, 0, 0, 0);
        }

        return this._normalizeBounds(
            Math.min(...validBounds.map(bounds => bounds.minX)),
            Math.min(...validBounds.map(bounds => bounds.minY)),
            Math.max(...validBounds.map(bounds => bounds.maxX)),
            Math.max(...validBounds.map(bounds => bounds.maxY))
        );
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
            const bbox = this._getSvgBBox(target.svgObject);
            if (bbox) {
                const matrix = this._getMatrixRelativeToNode(target);
                const visualBounds = this._boundsFromBBox(bbox, matrix);
                return this._unionBounds([visualBounds, this._fallbackBoundsRelativeToNode(target)]);
            }
        } catch (_) {
            // Fall through to structural fallback below.
        }

        return this._fallbackBoundsRelativeToNode(target);
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

    _computeAutoScale(bounds, { preserveAxes = this._getPreserveContainerAxes() } = {}) {
        const baseScale = this._getBaseNodeScale();
        if (!this.options.autoScale || !bounds.width || !bounds.height) {
            return baseScale;
        }

        const constrainToCanvas = this.options.expandViewboxToFitContent === false;
        const constrainWidth = preserveAxes.width || constrainToCanvas;
        const constrainHeight = preserveAxes.height || constrainToCanvas;

        if (!constrainWidth && !constrainHeight) {
            return baseScale;
        }

        const overlay = this._getOverlayMetrics();
        const naturalWidth = Math.max(bounds.width * baseScale, overlay.width);
        const naturalHeight = Math.max(1, bounds.height * baseScale + overlay.totalHeight);
        const padding = this._getLayoutPadding({ preserveAxes });

        const containerWidth = this.container.offsetWidth || naturalWidth + padding.left + padding.right;
        const containerHeight = this.container.offsetHeight || naturalHeight + padding.top + padding.bottom;
        const availWidth = Math.max(1, containerWidth - padding.left - padding.right);
        const availHeight = Math.max(1, containerHeight - padding.top - padding.bottom);
        const maxScale = typeof this.options.maxScale === 'number' && this.options.maxScale > 0
            ? this.options.maxScale
            : Infinity;

        const scaleFactor = Math.min(
            constrainWidth ? availWidth / Math.max(1, naturalWidth) : Infinity,
            constrainHeight ? availHeight / Math.max(1, naturalHeight) : Infinity,
            maxScale / baseScale
        );

        if (!isFinite(scaleFactor) || scaleFactor <= 0) {
            return baseScale;
        }

        return baseScale * scaleFactor;
    }

    _createLayoutContext({ centered }) {
        const bounds = this._measureBoundsRelativeToNode();
        const overlay = this._getOverlayMetrics();
        const preserveAxes = this._getPreserveContainerAxes();
        const scale = this._computeAutoScale(bounds, { preserveAxes });

        return {
            centered,
            bounds,
            overlay,
            preserveAxes,
            scale,
            padding: this._getLayoutPadding({ preserveAxes }),
            containerWidth: this.container.offsetWidth || 0,
            containerHeight: this.container.offsetHeight || 0,
            allowOverflow: this.options.expandViewboxToFitContent !== false,
            scaledWidth: bounds.width * scale,
            scaledHeight: bounds.height * scale,
            anchorX: centered ? this._getAlignmentAnchorX() : null
        };
    }

    _computeRequiredCanvasSize(layout) {
        let requiredWidth = layout.padding.left + layout.padding.right + layout.scaledWidth;
        if (layout.anchorX !== null) {
            const leftExtent = (layout.anchorX - layout.bounds.minX) * layout.scale;
            const rightExtent = (layout.bounds.maxX - layout.anchorX) * layout.scale;
            requiredWidth = layout.padding.left + layout.padding.right + Math.max(leftExtent, rightExtent) * 2;
        }
        requiredWidth = Math.max(requiredWidth, layout.padding.left + layout.padding.right + layout.overlay.width);

        const requiredHeight = layout.padding.top + layout.padding.bottom + layout.overlay.totalHeight + layout.scaledHeight;
        return { width: requiredWidth, height: requiredHeight };
    }

    _resolveCanvasSize(layout, requiredSize) {
        const width = layout.allowOverflow
            ? (
                layout.preserveAxes.width
                    ? Math.max(layout.containerWidth, Math.ceil(requiredSize.width))
                    : Math.max(1, Math.ceil(requiredSize.width))
            )
            : Math.max(1, layout.containerWidth || Math.ceil(requiredSize.width));

        const height = layout.allowOverflow
            ? (
                layout.preserveAxes.height
                    ? Math.max(layout.containerHeight, Math.ceil(requiredSize.height))
                    : Math.max(1, Math.ceil(requiredSize.height))
            )
            : Math.max(1, layout.containerHeight || Math.ceil(requiredSize.height));

        return { width, height };
    }

    _computeNodePosition(layout, canvasSize) {
        let x;
        if (layout.anchorX !== null) {
            const availableWidth = Math.max(0, canvasSize.width - layout.padding.left - layout.padding.right);
            x = layout.padding.left + availableWidth / 2 - layout.anchorX * layout.scale;
        } else {
            const availableWidth = Math.max(0, canvasSize.width - layout.padding.left - layout.padding.right);
            const desiredMinX = layout.centered
                ? layout.padding.left + Math.max(0, (availableWidth - layout.scaledWidth) / 2)
                : layout.padding.left;
            x = desiredMinX - layout.bounds.minX * layout.scale;
        }

        const availableHeight = Math.max(0, canvasSize.height - layout.padding.top - layout.padding.bottom - layout.overlay.totalHeight);
        const desiredMinY = layout.centered
            ? layout.padding.top + Math.max(0, (availableHeight - layout.scaledHeight) / 2)
            : layout.padding.top;

        return {
            x,
            y: desiredMinY - layout.bounds.minY * layout.scale
        };
    }

    _applyNodeTransform({ scale, x, y }) {
        if (typeof this.node.setScale === 'function') {
            this.node.setScale(scale);
        }
        if (typeof this.node.setPosition === 'function') {
            this.node.setPosition(x, y);
        }
    }

    _layoutToPosition({ centered }) {
        if (!this.node) return;

        this._closeTransientUi();

        const layout = this._createLayoutContext({ centered });
        const requiredSize = this._computeRequiredCanvasSize(layout);
        const canvasSize = this._resolveCanvasSize(layout, requiredSize);
        const position = this._computeNodePosition(layout, canvasSize);

        this._applyNodeTransform({ scale: layout.scale, ...position });
        this._setCanvasSize(canvasSize.width, canvasSize.height);
        this._applyContainerOverflow(canvasSize.width, canvasSize.height);
        this._repositionOverlayToolbar();
        if (this.options.debugExtents) this._drawDebugOverlays();
        else this._clearDebugOverlays();
    }

    _getPreserveContainerAxes() {
        const mode = this.options.preserveContainerSize;
        if (mode === true) return { width: true, height: true };
        if (mode === false) return { width: false, height: false };
        if (mode === 'width') return { width: true, height: false };
        if (mode === 'height') return { width: false, height: true };
        if (mode && typeof mode === 'object') {
            return {
                width: mode.width !== false,
                height: mode.height !== false
            };
        }

        // Keep the historical full-pane behavior for equation-style layouts,
        // but allow compact content-sized SVGs for standalone visuals.
        const type = this.node?.type || '';
        const hasSequenceApi = !!(this.node && typeof this.node.getSequence === 'function');
        const isEquationLike =
            hasSequenceApi ||
            type.includes('Equation') ||
            type.includes('equation') ||
            type.includes('Stack') ||
            type.includes('stack');

        return {
            width: isEquationLike,
            height: isEquationLike
        };
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
                    const ctm = node.svgObject.getCTM();
                    const bounds = this._boundsFromBBox(this._getSvgBBox(node.svgObject), ctm);
                    nminX = bounds.minX;
                    nminY = bounds.minY;
                    nmaxX = bounds.maxX;
                    nmaxY = bounds.maxY;
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

        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('id', 'omd-debug-overlays');
        group.setAttribute('pointer-events', 'none');

        const collected = this._collectNodeExtents(this.node);
        if (!collected) return;

        const { nodes, minX, minY, maxX, maxY } = collected;

        const contentRect = document.createElementNS(SVG_NS, 'rect');
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
                const vbRect = document.createElementNS(SVG_NS, 'rect');
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
            const rect = document.createElementNS(SVG_NS, 'rect');
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
        const padding = this._getCompactLayoutPadding();

        if (typeof this.node.setScale === 'function') {
            this.node.setScale(scale);
        }

        const contentWidth = bounds.width * scale;
        const contentHeight = bounds.height * scale;
        const canvasWidth = Math.ceil(Math.max(contentWidth + padding.left + padding.right, overlay.width + padding.left + padding.right, 1));
        const canvasHeight = Math.ceil(Math.max(contentHeight + overlay.totalHeight + padding.top + padding.bottom, 1));
        const x = padding.left - bounds.minX * scale;
        const y = padding.top - bounds.minY * scale;

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
        this._resetRenderedContent();

        let nextNode;
        if (typeof expression === 'string') {
            const steps = this._createNodesFromString(expression);
            nextNode = this._createStackFromSteps(steps);
        } else if (Array.isArray(expression)) {
            const steps = expression
                .flatMap(item => (typeof item === 'string' ? this._createNodesFromString(item) : item))
                .filter(Boolean);
            nextNode = this._createStackFromSteps(steps);
        } else {
            nextNode = expression;
        }

        return this._mountRootNode(nextNode);
    }

    /**
     * Add a jsvg child to the internal SVG container and optionally
     * trigger layout/centering.
     * @param {object} child - A jsvg node to add
     */
    addChild(child) {
        if (!child) return child;

        const shouldBecomeRoot = !this.node;

        this._appendNode(child);

        if (shouldBecomeRoot) {
            return this._mountRootNode(child, { append: false });
        }

        this._layoutCurrentNode();
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
            this._layoutCurrentNode();
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

        this._resetRenderedContent();
        this._mountRootNode(newNode);
    }

    /**
     * Sets the font size
     * @param {number} size - The font size
     */
    setFontSize(size) {
        this.options.fontSize = size;
        if (!this.node) return;

        this._refreshCurrentNodeLayout();
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

        this._refreshCurrentNodeLayout();
    }

    /**
     * Clears the display
     */
    clear() {
        this._resetRenderedContent();
        this._restoreContainerSize();
        this._restoreContainerOverflow();
        this._syncViewboxToContainer();
        this._clearDebugOverlays();
    }

    /**
     * Destroys the renderer and cleans up resources
     */
    destroy() {
        this._destroyed = true;
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
            const { width: containerWidth, height: containerHeight } = this._getCanvasDimensions();
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
