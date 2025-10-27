import { omdEquationNode } from '../nodes/omdEquationNode.js';
import { omdStepVisualizer } from '../step-visualizer/omdStepVisualizer.js';
import { getNodeForAST } from '../core/omdUtilities.js';
import { jsvgContainer } from '@teachinglab/jsvg';

/**
 * OMD Renderer - Handles rendering of mathematical expressions
 * This class provides a cleaner API for rendering expressions without
 * being tied to specific DOM elements or UI concerns.
 */
export class omdDisplay {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            fontSize: 32,
            centerContent: true,
            topMargin: 40,
            bottomMargin: 16,
            fitToContent: true,   // Fit to content size by default
            autoScale: false,     // Don't auto-scale by default
            maxScale: 1,          // Do not upscale beyond 1 by default
            edgePadding: 16,      // Horizontal padding from edges when scaling
            autoCloseStepVisualizer: true, // Close active step visualizer text boxes before autoscale to avoid shrink
            ...options
        };

        // Create SVG container
        this.svg = new jsvgContainer();
        this.node = null;

        // Internal guards to prevent recursive resize induced growth
        this._suppressResizeObserver = false; // When true, _handleResize is a no-op
        this._lastViewbox = null;             // Cache last applied viewBox string
        this._lastContentExtents = null;      // Cache last measured content extents to detect real growth
        this._viewboxLocked = false;          // When true, suppress micro growth adjustments
        this._viewboxLockThreshold = 8;       // Require at least 8px growth once locked

        // Set up the SVG
        this._setupSVG();
    }

    _setupSVG() {
        const width = this.container.offsetWidth || 800;
        const height = this.container.offsetHeight || 600;

        this.svg.setViewbox(width, height);
        this.svg.svgObject.style.verticalAlign = "middle";
        // Enable internal scrolling via native SVG scrolling if content overflows
        this.svg.svgObject.style.overflow = 'hidden';
        this.container.appendChild(this.svg.svgObject);

        // Create a dedicated content group we can translate to compensate for
        // viewBox origin changes (so expanding the origin doesn't visually move content).
        try {
            const ns = 'http://www.w3.org/2000/svg';
            this._contentGroup = document.createElementNS(ns, 'g');
            this._contentGroup.setAttribute('id', 'omd-content-root');
            this.svg.svgObject.appendChild(this._contentGroup);
            this._contentOffsetX = 0;
            this._contentOffsetY = 0;
        } catch (e) {
            this._contentGroup = null;
        }

        // Handle resize
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this._handleResize();
            });
            this.resizeObserver.observe(this.container);
        }
    }

    _handleResize() {
        if (this._suppressResizeObserver) return; // Prevent re-entrant resize loops
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;
        // Skip if size unchanged; avoids loops where internal changes trigger observer without real container delta
        if (this._lastContainerWidth === width && this._lastContainerHeight === height) return;
        this._lastContainerWidth = width;
        this._lastContainerHeight = height;
        this.svg.setViewbox(width, height);

        if (this.options.centerContent && this.node) {
            this.centerNode();
        }

        // Reposition overlay toolbar (if any) on resize
        this._repositionOverlayToolbar();
        if (this.options.debugExtents) this._drawDebugOverlays();
    }

    /**
     * Ensure the internal SVG viewBox is at least as large as the provided content dimensions.
     * This prevents clipping when content is larger than the current viewBox.
     * @param {number} contentWidth
     * @param {number} contentHeight
     */
    _ensureViewboxFits(contentWidth, contentHeight) {
        // If caller provided just width/height, but we prefer extents, bail early
        if (!this.node) return;
        const pad = 10;

        // Prefer DOM measured extents (accounts for strokes, transforms, children SVG geometry)
        let ext = null;
        try {
            const collected = this._collectNodeExtents(this.node);
            if (collected) {
                ext = { minX: collected.minX, minY: collected.minY, maxX: collected.maxX, maxY: collected.maxY };
            }
        } catch (e) {
            ext = null;
        }
        if (!ext) {
            ext = this._computeNodeExtents(this.node);
        }
        if (!ext) return;

        const minX = Math.floor(ext.minX - pad);
        const minY = Math.floor(ext.minY - pad);
        const maxX = Math.ceil(ext.maxX + pad);
        const maxY = Math.ceil(ext.maxY + pad);

        const curView = this.svg.svgObject.getAttribute('viewBox') || '';
        let curX = 0, curY = 0, curW = 0, curH = 0;
        if (curView) {
            const parts = curView.split(/\s+/).map(Number).filter(n => !isNaN(n));
            if (parts.length === 4) {
                curX = parts[0];
                curY = parts[1];
                curW = parts[2];
                curH = parts[3];
            }
        }

        // To avoid shifting visible content, keep the current viewBox origin (curX,curY)
        // and only expand width/height as needed. Changing the origin would change
        // the mapping from SVG coordinates to screen coordinates and appear to move
        // existing content.
        const desiredX = curX;
        const desiredY = curY;
        const desiredRight = Math.max(curX + curW, maxX);
        const desiredBottom = Math.max(curY + curH, maxY);
        const desiredW = Math.max(curW, desiredRight - desiredX);
        const desiredH = Math.max(curH, desiredBottom - desiredY);

        // Guard: If the desired size change is negligible (< 0.5px), skip.
        const widthDelta = Math.abs(desiredW - curW);
        const heightDelta = Math.abs(desiredH - curH);

        // Safety cap to avoid runaway expansion due to logic errors.
        const MAX_DIM = 10000; // arbitrary large but finite limit
        if (desiredW > MAX_DIM || desiredH > MAX_DIM) {
            console.warn('omdDisplay: viewBox growth capped to prevent runaway expansion', desiredW, desiredH);
            return;
        }

        if (widthDelta < 0.5 && heightDelta < 0.5) return;

        // Detect repeated growth with identical content extents (suggests feedback loop)
        const curExtSignature = `${minX},${minY},${maxX},${maxY}`;
        if (this._lastContentExtents === curExtSignature && heightDelta > 0 && desiredH > curH) {
            return; // content unchanged, skip
        }

        // If locked, only allow substantial growth
        if (this._viewboxLocked) {
            const growW = desiredW - curW;
            const growH = desiredH - curH;
            if (growW < this._viewboxLockThreshold && growH < this._viewboxLockThreshold) {
                return; // ignore micro growth attempts
            }
        }

        const newViewBox = `${desiredX} ${desiredY} ${desiredW} ${desiredH}`;
        if (this._lastViewbox === newViewBox) return;

        this._suppressResizeObserver = true;
        try {
            this.svg.svgObject.setAttribute('viewBox', newViewBox);
        } finally {
            // Allow ResizeObserver events after microtask; use timeout to defer
            setTimeout(() => { this._suppressResizeObserver = false; }, 0);
        }
        this._lastViewbox = newViewBox;
        this._lastContentExtents = curExtSignature;

        // Lock if the growth applied was small; prevents future tiny increments
        if (heightDelta < 2 && widthDelta < 2 && !this._viewboxLocked) {
            this._viewboxLocked = true;
        }
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
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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

            // push children
            if (Array.isArray(node.childList)) {
                for (const c of node.childList) {
                    if (!c) continue;
                    const cx = (c.xpos || 0) + nx;
                    const cy = (c.ypos || 0) + ny;
                    stack.push({ node: c, absX: cx, absY: cy });
                }
            }
            if (node.argumentNodeList) {
                for (const val of Object.values(node.argumentNodeList)) {
                    if (Array.isArray(val)) {
                        for (const v of val) {
                            if (!v) continue;
                            const vx = (v.xpos || 0) + nx;
                            const vy = (v.ypos || 0) + ny;
                            stack.push({ node: v, absX: vx, absY: vy });
                        }
                    } else if (val) {
                        const vx = (val.xpos || 0) + nx;
                        const vy = (val.ypos || 0) + ny;
                        stack.push({ node: val, absX: vx, absY: vy });
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
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;


        while (stack.length) {
            const { node, absX, absY, parent } = stack.pop();
            if (!node || visited.has(node)) continue;
            visited.add(node);

            // Prefer DOM measurement if available for accuracy
            let nx = absX;
            let ny = absY;
            let nminX = nx;
            let nminY = ny;
            let nmaxX = nx;
            let nmaxY = ny;

            try {
                if (node.svgObject && typeof node.svgObject.getBBox === 'function' && typeof node.svgObject.getCTM === 'function') {
                    const bbox = node.svgObject.getBBox();
                    const ctm = node.svgObject.getCTM();
                    // Transform all four bbox corners into root SVG coordinates
                    const corners = [
                        { x: bbox.x, y: bbox.y },
                        { x: bbox.x + bbox.width, y: bbox.y },
                        { x: bbox.x, y: bbox.y + bbox.height },
                        { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
                    ];
                    const tx = corners.map(p => ({
                        x: ctm.a * p.x + ctm.c * p.y + ctm.e,
                        y: ctm.b * p.x + ctm.d * p.y + ctm.f
                    }));
                    nminX = Math.min(...tx.map(t => t.x));
                    nminY = Math.min(...tx.map(t => t.y));
                    nmaxX = Math.max(...tx.map(t => t.x));
                    nmaxY = Math.max(...tx.map(t => t.y));
                    nx = nminX;
                    ny = nminY;
                } else {
                    const w = node.width || 0;
                    const h = node.height || 0;
                    nx = absX;
                    ny = absY;
                    nminX = nx;
                    nminY = ny;
                    nmaxX = nx + w;
                    nmaxY = ny + h;
                }
            } catch (e) {
                const w = node.width || 0;
                const h = node.height || 0;
                nx = absX;
                ny = absY;
                nminX = nx;
                nminY = ny;
                nmaxX = nx + w;
                nmaxY = ny + h;
            }

            nodes.push({ node, minX: nminX, minY: nminY, maxX: nmaxX, maxY: nmaxY, parent });

            minX = Math.min(minX, nminX);
            minY = Math.min(minY, nminY);
            maxX = Math.max(maxX, nmaxX);
            maxY = Math.max(maxY, nmaxY);

            // push children
            if (Array.isArray(node.childList)) {
                for (const c of node.childList) {
                    if (!c) continue;
                    const cx = (c.xpos || 0) + nx;
                    const cy = (c.ypos || 0) + ny;
                    stack.push({ node: c, absX: cx, absY: cy, parent: node });
                }
            }
            if (node.argumentNodeList) {
                for (const val of Object.values(node.argumentNodeList)) {
                    if (Array.isArray(val)) {
                        for (const v of val) {
                            if (!v) continue;
                            const vx = (v.xpos || 0) + nx;
                            const vy = (v.ypos || 0) + ny;
                            stack.push({ node: v, absX: vx, absY: vy, parent: node });
                        }
                    } else if (val) {
                        const vx = (val.xpos || 0) + nx;
                        const vy = (val.ypos || 0) + ny;
                        stack.push({ node: val, absX: vx, absY: vy, parent: node });
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

        // overall node extents
        const collected = this._collectNodeExtents(this.node);
        if (!collected) return;

        const { nodes, minX, minY, maxX, maxY } = collected;

        // Draw content extents (blue dashed)
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

        // Draw viewBox rect (orange)
        const curView = this.svg.svgObject.getAttribute('viewBox') || '';
        if (curView) {
            const parts = curView.split(/\s+/).map(Number).filter(n => !isNaN(n));
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

        // Per-node boxes: green if inside parent, red if overflowing parent bounds
    const overflowing = [];
    for (const item of nodes) {
            const r = document.createElementNS(ns, 'rect');
            r.setAttribute('x', String(item.minX));
            r.setAttribute('y', String(item.minY));
            r.setAttribute('width', String(Math.max(0, item.maxX - item.minX)));
            r.setAttribute('height', String(Math.max(0, item.maxY - item.minY)));
            r.setAttribute('fill', 'none');
            r.setAttribute('stroke-width', '0.6');

            let stroke = 'green';
            if (item.parent) {
                const pMinX = (item.parent.xpos || 0) + (item.parent._absX || 0);
                const pMinY = (item.parent.ypos || 0) + (item.parent._absY || 0);
                // fallback compute parent's absX/Y from nodes list if available
                const parentEntry = nodes.find(n => n.node === item.parent);
                const pminX = parentEntry ? parentEntry.minX : pMinX;
                const pminY = parentEntry ? parentEntry.minY : pMinY;
                const pmaxX = parentEntry ? parentEntry.maxX : pminX + (item.parent.width || 0);
                const pmaxY = parentEntry ? parentEntry.maxY : pminY + (item.parent.height || 0);

                if (item.minX < pminX || item.minY < pminY || item.maxX > pmaxX || item.maxY > pmaxY) {
                    stroke = 'red';
                    overflowing.push({ node: item.node, bounds: item });
                }
            }

            r.setAttribute('stroke', stroke);
            r.setAttribute('opacity', stroke === 'red' ? '0.9' : '0.6');
            group.appendChild(r);
        }

        if (overflowing.length) {
            console.warn('omdDisplay: debugExtents found overflowing nodes:', overflowing.map(o => ({ type: o.node?.type, bounds: o.bounds }))); 
        }

        this.svg.svgObject.appendChild(group);
    }

    centerNode() {
        if (!this.node) return;
        if (!this._centerCallCount) this._centerCallCount = 0;
        this._centerCallCount++;
        if (this._centerCallCount > 500) {
            console.warn('omdDisplay: excessive centerNode calls detected; halting further centering to prevent loop');
            return;
        }
        const containerWidth = this.container.offsetWidth || 0;
        const containerHeight = this.container.offsetHeight || 0;

        // Early auto-close of step visualizer UI before measuring dimensions to avoid transient height inflation
        if (this.options.autoCloseStepVisualizer && this.node) {
            try {
                if (typeof this.node.forceCloseAll === 'function') {
                    this.node.forceCloseAll();
                } else if (typeof this.node.closeAllTextBoxes === 'function') {
                    this.node.closeAllTextBoxes();
                } else if (typeof this.node.closeActiveDot === 'function') {
                    this.node.closeActiveDot();
                }
            } catch (e) { /* no-op */ }
        }

        // Determine actual content size (prefer sequence/current step when available)
        let contentWidth = this.node.width || 0;
        let contentHeight = this.node.height || 0;
        if (this.node.getSequence) {
            const seq = this.node.getSequence();
            if (seq) {
                if (seq.width && seq.height) {
                    // For step visualizers, use sequenceWidth/Height instead of total dimensions to exclude visualizer elements from autoscale
                    contentWidth = seq.sequenceWidth || seq.width;
                    contentHeight = seq.sequenceHeight || seq.height;
                }
                if (seq.getCurrentStep) {
                    const step = seq.getCurrentStep();
                    if (step && step.width && step.height) {
                        // For step visualizers, prioritize sequenceWidth/Height for dimension calculations
                        const stepWidth = seq.sequenceWidth || step.width;
                        const stepHeight = seq.sequenceHeight || step.height;
                        contentWidth = Math.max(contentWidth, stepWidth);
                        contentHeight = Math.max(contentHeight, stepHeight);
                    }
                }
            }
        }

        // Compute scale to keep within bounds
        let scale = 1;
        if (this.options.autoScale && contentWidth > 0 && contentHeight > 0) {
            // Optionally close any open step visualizer textbox to prevent transient height expansion
            if (this.options.autoCloseStepVisualizer && this.node) {
                try {
                    if (typeof this.node.closeActiveDot === 'function') {
                        this.node.closeActiveDot();
                    } else if (typeof this.node.closeAllTextBoxes === 'function') {
                        this.node.closeAllTextBoxes();
                    }
                } catch (e) { /* no-op */ }
            }
            // Detect step visualizer directly on node (getSequence returns underlying sequence only)
            let hasStepVisualizer = false;
            if (this.node) {
                const ctorName = this.node.constructor?.name;
                hasStepVisualizer = (ctorName === 'omdStepVisualizer') || this.node.type === 'omdStepVisualizer' || (typeof omdStepVisualizer !== 'undefined' && this.node instanceof omdStepVisualizer);
            }

            if (hasStepVisualizer) {
                // Preserve existing scale if already set on node; otherwise lock to 1.
                const existingScale = (this.node && typeof this.node.scale === 'number') ? this.node.scale : undefined;
                scale = (existingScale && existingScale > 0) ? existingScale : 1;
            } else {
                const hPad = this.options.edgePadding || 0;
                const vPadTop = this.options.topMargin || 0;
                const vPadBottom = this.options.bottomMargin || 0;
                // Reserve extra space for overlay toolbar if needed
                let reserveBottom = vPadBottom;
                if (this.node && typeof this.node.isToolbarOverlay === 'function' && this.node.isToolbarOverlay()) {
                    const tH = (typeof this.node.getToolbarVisualHeight === 'function') ? this.node.getToolbarVisualHeight() : 0;
                    reserveBottom += (tH + (this.node.getOverlayPadding ? this.node.getOverlayPadding() : 16));
                }
                const availW = Math.max(0, containerWidth - hPad * 2);
                const availH = Math.max(0, containerHeight - (vPadTop + reserveBottom));
                const sx = availW > 0 ? (availW / contentWidth) : 1;
                const sy = availH > 0 ? (availH / contentHeight) : 1;
                const maxScale = (typeof this.options.maxScale === 'number') ? this.options.maxScale : 1;
                scale = Math.min(sx, sy, maxScale);
                if (!isFinite(scale) || scale <= 0) scale = 1;
            }
        }

        // Apply scale
        if (typeof this.node.setScale === 'function') {
            this.node.setScale(scale);
        }

        // Compute X so that equals anchor (if present) is centered after scaling
        let x;
        if (this.node.type === 'omdEquationSequenceNode' && this.node.alignPointX !== undefined) {
            const screenCenterX = containerWidth / 2;
            x = screenCenterX - (this.node.alignPointX * scale);
        } else {
            const scaledWidth = contentWidth * scale;
            x = (containerWidth - scaledWidth) / 2;
        }

        // Decide whether positioning would move content outside container. If so,
        // prefer expanding the SVG viewBox instead of moving nodes.
        const scaledWidthFinal = contentWidth * scale;
        const scaledHeightFinal = contentHeight * scale;
        const totalNeededH = scaledHeightFinal + (this.options.topMargin || 0) + (this.options.bottomMargin || 0);

        const willOverflowHoriz = scaledWidthFinal > containerWidth;
        const willOverflowVert = totalNeededH > containerHeight;

        // Avoid looping if content dimension signature hasn't changed
        const contentSig = `${contentWidth}x${contentHeight}x${scale}`;
        if (this._lastCenterSignature === contentSig && !willOverflowHoriz && !willOverflowVert) {
            // Only update position; skip expensive ensureViewboxFits
            if (this.node.setPosition) this.node.setPosition(x, this.options.topMargin);
            return;
        }

        if (willOverflowHoriz || willOverflowVert) {
            // Set scale but do NOT reposition node (preserve its absolute positions).
            if (this.node.setScale) this.node.setScale(scale);
            // Expand viewBox to contain entire unscaled content so nothing is clipped.
            this._ensureViewboxFits(contentWidth, contentHeight);
            // Reposition overlay toolbar in case viewBox/container changed
            this._repositionOverlayToolbar();

            // If content still exceeds available height in the host, allow vertical scrolling
            if (willOverflowVert) {
                this.container.style.overflowY = 'auto';
                this.container.style.overflowX = 'hidden';
            } else {
                this.container.style.overflow = 'hidden';
            }
            if (this.options.debugExtents) this._drawDebugOverlays();
        } else {
            // Y is top margin; scaled content will grow downward
            this.node.setPosition(x, this.options.topMargin);

            // Reposition overlay toolbar (if any)
            this._repositionOverlayToolbar();

            // Ensure viewBox can contain the (unscaled) content to avoid clipping in some hosts
            this._ensureViewboxFits(contentWidth, contentHeight);

            if (totalNeededH > containerHeight) {
                // Let the host scroll vertically; keep horizontal overflow hidden to avoid layout shift
                this.container.style.overflowY = 'auto';
                this.container.style.overflowX = 'hidden';
            } else {
                this.container.style.overflow = 'hidden';
            }
            if (this.options.debugExtents) this._drawDebugOverlays();
        }

        this._lastCenterSignature = contentSig;
    }

    fitToContent() {
        if (!this.node) {
            return;
        }

        // Try to get actual rendered dimensions
        let actualWidth = 0;
        let actualHeight = 0;

        // Get both sequence and current step dimensions
        let sequenceWidth = 0, sequenceHeight = 0;
        let stepWidth = 0, stepHeight = 0;

        if (this.node.getSequence) {
            const sequence = this.node.getSequence();
            if (sequence && sequence.width && sequence.height) {
                // For step visualizers, use sequenceWidth/Height instead of total dimensions to exclude visualizer elements from autoscale
                sequenceWidth = sequence.sequenceWidth || sequence.width;
                sequenceHeight = sequence.sequenceHeight || sequence.height;

                // Check current step dimensions too
                if (sequence.getCurrentStep) {
                    const currentStep = sequence.getCurrentStep();
                    if (currentStep && currentStep.width && currentStep.height) {
                        // For step visualizers, prioritize sequenceWidth/Height for dimension calculations
                        stepWidth = sequence.sequenceWidth || currentStep.width;
                        stepHeight = sequence.sequenceHeight || currentStep.height;
                    }
                }

                // Use the larger of sequence or step dimensions
                actualWidth = Math.max(sequenceWidth, stepWidth);
                actualHeight = Math.max(sequenceHeight, stepHeight);
            }
        }

        // Fallback to node dimensions only if sequence/step dimensions aren't available
        if ((actualWidth === 0 || actualHeight === 0) && this.node.width && this.node.height) {
            actualWidth = this.node.width;
            actualHeight = this.node.height;
        }

        // Fallback dimensions
        if (actualWidth === 0 || actualHeight === 0) {
            actualWidth = 200;
            actualHeight = 60;
        }

        const padding = 10; // More comfortable padding to match user expectation
        const newWidth = actualWidth + (padding * 2);
        const newHeight = actualHeight + (padding * 2);


        // Position the content at the minimal padding offset FIRST
        if (this.node && this.node.setPosition) {
            this.node.setPosition(padding, padding);
        }

        // Update SVG dimensions with viewBox starting from 0,0 since we repositioned content
        this.svg.setViewbox(newWidth, newHeight);
        this.svg.setWidthAndHeight(newWidth, newHeight);

        // Update container
        this.container.style.width = `${newWidth}px`;
        this.container.style.height = `${newHeight}px`;
        if (this.options.debugExtents) this._drawDebugOverlays();
        else this._clearDebugOverlays();
    }

    /**
     *  s a mathematical expression or equation
     * @param {string|omdNode} expression - Expression string or node
     * @returns {omdNode} The rendered node
     */
    render(expression) {
        // Clear previous node
        if (this.node) {
            if (this._contentGroup && this.node && this.node.svgObject) {
                try {
                    if (this.node.svgObject.parentNode === this._contentGroup) {
                        this._contentGroup.removeChild(this.node.svgObject);
                    }
                } catch (e) {
                    // Fallback to svg remove
                    this.svg.removeChild(this.node);
                }
            } else {
                this.svg.removeChild(this.node);
            }
        }

        // Create node from expression
        if (typeof expression === 'string') {
            if (expression.includes(';')) {
                // Multiple equations
                const equationStrings = expression.split(';').filter(s => s.trim() !== '');
                const steps = equationStrings.map(str => omdEquationNode.fromString(str));
                this.node = new omdStepVisualizer(steps, this.options.styling || {});
            } else {
                // Single expression or equation
                if (expression.includes('=')) {
                    const firstStep = omdEquationNode.fromString(expression);
                    this.node = new omdStepVisualizer([firstStep], this.options.styling || {});
                } else {
                    // Create node directly from expression
                    const parsedAST = math.parse(expression);
                    const NodeClass = getNodeForAST(parsedAST);
                    const firstStep = new NodeClass(parsedAST);
                    this.node = new omdStepVisualizer([firstStep], this.options.styling || {});
                }
            }
        } else {
            // Assume it's already a node
            this.node = expression;
        }

        // Initialize and render
        const sequence = this.node.getSequence ? this.node.getSequence() : null;
        if (sequence) {
            sequence.setFontSize(this.options.fontSize);
            // Apply filtering based on filterLevel
            sequence.updateStepsVisibility(step => (step.stepMark ?? 0) === sequence.getFilterLevel());
        }
        // Prefer appending the node's svgObject into our content group so DOM measurements are consistent
        if (this._contentGroup && this.node && this.node.svgObject) {
            try { this._contentGroup.appendChild(this.node.svgObject); } catch (e) { this.svg.addChild(this.node); }
        } else {
            this.svg.addChild(this.node);
        }

        // Apply any stored font settings
        if (this.options.fontFamily) {
                this.setFont(this.options.fontFamily, this.options.fontWeight || '400');
        }

        // Only use fitToContent for tight sizing when explicitly requested
        if (this.options.fitToContent) {
            this.fitToContent();
        } else if (this.options.centerContent) {
            this.centerNode();
        }
        // Ensure overlay toolbar is positioned initially
        this._repositionOverlayToolbar();

    // Also ensure the viewBox is large enough to contain the node (avoid clipping)
    const cw = (this.node && this.node.width) ? this.node.width : 0;
    const ch = (this.node && this.node.height) ? this.node.height : 0;
    this._ensureViewboxFits(cw, ch);

        if (this.options.debugExtents) this._drawDebugOverlays();
        else this._clearDebugOverlays();

        // Provide a default global refresh function if not present
        if (typeof window !== 'undefined' && !window.refreshDisplayAndFilters) {
            window.refreshDisplayAndFilters = () => {
                try {
                    const node = this.getCurrentNode();
                    const sequence = node?.getSequence ? node.getSequence() : null;
                    if (sequence) {
                        if (typeof sequence.simplifyAll === 'function') {
                            sequence.simplifyAll();
                        }
                        if (typeof sequence.updateStepsVisibility === 'function') {
                            sequence.updateStepsVisibility(step => (step.stepMark ?? 0) === 0);
                        }
                        if (typeof node.updateLayout === 'function') {
                                node.updateLayout();
                        }
                    }
                    if (this.options.centerContent) {
                        this.centerNode();
                    }
                } catch (e) {
                    // no-op
                }
            };
        }

        return this.node;
    }

    /**
     * Add a jsvg child to the internal SVG container and optionally
     * trigger layout/centering.
     * @param {object} child - A jsvg node to add
     */
    addChild(child) {
        if (this._contentGroup && child && child.svgObject) {
            try { this._contentGroup.appendChild(child.svgObject); } catch (e) { this.svg.addChild(child); }
        } else {
            this.svg.addChild(child);
        }

        if (this.options.centerContent) this.centerNode();

        return child;
    }

    /**
     * Remove a child previously added to the internal SVG container.
     * @param {object} child
     */
    removeChild(child) {
        if (!this.svg) return;
        try {
            if (child && child.svgObject) {
                if (this._contentGroup && this._contentGroup.contains(child.svgObject)) {
                    this._contentGroup.removeChild(child.svgObject);
                } else if (this.svg.svgObject && this.svg.svgObject.contains(child.svgObject)) {
                    this.svg.svgObject.removeChild(child.svgObject);
                } else if (typeof this.svg.removeChild === 'function') {
                    this.svg.removeChild(child);
                }
            } else if (typeof this.svg.removeChild === 'function') {
                this.svg.removeChild(child);
            }
        } catch (e) {
            // no-op
        }
        // If the removed child was the main node, clear reference
        if (this.node === child) this.node = null;
    }

    /**
     * Updates the display with a new node
     * @param {omdNode} newNode - The new node to display
     */
    update(newNode) {
        if (this.node) {
            if (this._contentGroup && this.node && this.node.svgObject && this._contentGroup.contains(this.node.svgObject)) {
                this._contentGroup.removeChild(this.node.svgObject);
            } else if (typeof this.svg.removeChild === 'function') {
                this.svg.removeChild(this.node);
            }
        }

        this.node = newNode;
        this.node.setFontSize(this.options.fontSize);
        this.node.initialize();
        if (this._contentGroup && this.node && this.node.svgObject) {
            try { this._contentGroup.appendChild(this.node.svgObject); } catch (e) { this.svg.addChild(this.node); }
        } else {
            this.svg.addChild(this.node);
        }

        if (this.options.centerContent) {
            this.centerNode();
        }
        // Ensure overlay toolbar is positioned on updates
        this._repositionOverlayToolbar();
    }

    
    /**
     * Sets the font size
     * @param {number} size - The font size
     */
    setFontSize(size) {
        this.options.fontSize = size;
        if (this.node) {
            // Apply font size - handle different node types
            if (this.node.getSequence && typeof this.node.getSequence === 'function') {
                // For omdEquationStack, set font size on the sequence
                this.node.getSequence().setFontSize(size);
            } else if (this.node.setFontSize && typeof this.node.setFontSize === 'function') {
                // For regular nodes with setFontSize method
                this.node.setFontSize(size);
            }
            this.node.initialize();
            if (this.options.centerContent) {
                this.centerNode();
            }
        }
    }

    /**
     * Sets the font family for all elements in the display
     * @param {string} fontFamily - CSS font-family string (e.g., '"Shantell Sans", cursive')
     * @param {string} fontWeight - CSS font-weight (default: '400')
     */
    setFont(fontFamily, fontWeight = '400') {
        if (this.svg?.svgObject) {
            const applyFont = (element) => {
                if (element.style) {
                    element.style.fontFamily = fontFamily;
                    element.style.fontWeight = fontWeight;
                }
                // Recursively apply to all children
                Array.from(element.children || []).forEach(applyFont);
            };

            // Apply font to the entire SVG
            applyFont(this.svg.svgObject);

            // Store font settings for future use
            this.options.fontFamily = fontFamily;
            this.options.fontWeight = fontWeight;
        }
    }

    /**
     * Clears the display
     */
    clear() {
        if (this.node) {
            this.svg.removeChild(this.node);
            this.node = null;
        }
    }

    /**
     * Destroys the renderer and cleans up resources
     */
    destroy() {
        this.clear();
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
        // Use same width calculation as centering to ensure consistency
        const containerWidth = this.container.offsetWidth || 0;
        const containerHeight = this.container.offsetHeight || 0;
        const node = this.node;
        if (!node) return;
        const hasOverlayApi = typeof node.isToolbarOverlay === 'function' && typeof node.positionToolbarOverlay === 'function';
        if (hasOverlayApi && node.isToolbarOverlay()) {
            const padding = (typeof node.getOverlayPadding === 'function') ? node.getOverlayPadding() : 16;
            node.positionToolbarOverlay(containerWidth, containerHeight, padding);
        }
    }

    /**
     * Public API: returns the currently rendered root node (could be a step visualizer, sequence, or plain node)
     * @returns {object|null}
     */
    getCurrentNode() {
        return this.node;
    }

    /**
     * Returns the SVG element for the entire display.
     * @returns {SVGElement} The SVG element representing the display.
     */
    getSVG() {
        return this.svg.svgObject;
    }
}