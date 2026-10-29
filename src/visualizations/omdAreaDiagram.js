/**
 * omdAreaDiagram — rectangular area model with fractional side lengths.
 *
 * This is the core Grade 5 Unit 2 (Fractions as Quotients / Fraction
 * Multiplication) visual: a rectangle built from whole unit squares drawn with
 * solid rules, each unit square partitioned into equal strips drawn with dashed
 * rules, and a shaded sub-rectangle whose area is the product of a whole number
 * and a fraction.
 *
 *   4 x 2/3   -> columns: 4, rows: 1, rowParts: 3, shadeHeight: '2/3'
 *   2 x 3 2/5 -> columns: 4, rows: 2, columnParts: 5, shadeWidth: '3 2/5'
 *
 * Every length is carried as an exact rational, so the reported area of a
 * 3 1/4 x 4 rectangle is 13, never 12.999999999999998.
 *
 * Interaction (opt in with `interactive: true`):
 *   - paint  — press and drag across the grid to shade / unshade partition cells
 *   - resize — drag the handles on the shaded region to set the side lengths
 *   - inputs — labelled answer fields under the figure, optionally self-checking
 *
 * State leaves through `onChange(payload)` and the DOM event
 * `omd-areadiagram-change`.
 */

import { jsvgGroup, jsvgRect, jsvgLine } from "@teachinglab/jsvg";
import { OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { makeBrace, makeArrowDimension, makeMathLabel, centerMathLabel } from "./omdBrace.js";
import {
    parseRational,
    makeRational,
    ratValue,
    ratAdd,
    ratSub,
    ratMul,
    ratCompare,
    formatRationalMarkup,
    formatRationalText,
    rationalMatchesText,
} from "./omdFraction.js";

const EPSILON = 1e-9;
const MAX_CELLS_PER_AXIS = 400;

function coerceBoolean(value, fallback)
{
    if ( value === undefined || value === null ) return fallback;
    if ( typeof value === "string" ) return value.toLowerCase() === "true";
    return value === true;
}

function positiveInteger(value, fallback)
{
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function positiveNumber(value, fallback)
{
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalText(value, fallback)
{
    if ( value === undefined || value === null ) return fallback;
    const text = String(value);
    return text.trim() === "" ? fallback : text;
}

/**
 * Cell edges along one axis, in units: every partition boundary strictly
 * inside `total`, plus `total` itself. A 3 2/5 wide grid partitioned in fifths
 * yields 17 cells; partitioned in halves it yields 6 full cells and a 2/5
 * remainder cell.
 */
function cellEdges(total, parts)
{
    const edges = [{ n: 0, d: 1 }];
    const step = makeRational(1, parts);
    let current = { n: 0, d: 1 };

    while ( edges.length < MAX_CELLS_PER_AXIS )
    {
        const next = ratAdd(current, step);
        if ( ratCompare(next, total) >= 0 ) break;
        edges.push(next);
        current = next;
    }

    if ( ratCompare(current, total) < 0 ) edges.push(total);
    return edges;
}

export class omdAreaDiagram extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdAreaDiagram";

        // ---- geometry -------------------------------------------------
        this.columns = { n: 4, d: 1 };      // drawn width, in units
        this.rows = { n: 1, d: 1 };         // drawn height, in units
        this.columnParts = 1;               // vertical strips per unit square
        this.rowParts = 1;                  // horizontal strips per unit square
        this.unitScale = 64;                // px per unit

        // ---- shading --------------------------------------------------
        this.shadeWidth = null;             // rational; defaults to `columns`
        this.shadeHeight = null;            // rational; defaults to `rows`
        this.shadeMode = "rect";            // 'rect' | 'cells'
        this.shadedCells = null;            // Set of "col,row" partition cells
        this.shadeColor = "#7FCFEA";
        this.shadeOpacity = 1;
        this.emptyColor = "#FFFFFF";

        // ---- rules ----------------------------------------------------
        this.gridColor = "#111111";
        this.gridStrokeWidth = 2.5;
        this.partitionColor = "#111111";
        this.partitionStrokeWidth = 1.6;
        this.partitionDash = "7 6";
        this.showPartitions = true;
        this.showUnitLines = true;
        this.columnPartitionScope = "all";  // 'all' | 'last' | { from, to }
        this.rowPartitionScope = "all";

        // ---- annotations ----------------------------------------------
        this.topBraces = [];
        this.leftBraces = [];
        this.bottomBraces = [];
        this.rightBraces = [];
        this.braceStyle = "brace";          // 'brace' | 'arrow'
        this.braceColor = "#111111";
        this.labelFontSize = 17;
        this.title = "";
        this.titleFontSize = 15;
        this.showAreaLabel = false;
        this.areaLabelText = "";
        this.expressionLine = false;        // live "4 x 2/3 = 8/3" readout
        this.expressionSuffix = "square units";

        // ---- decomposition (distributive property) --------------------
        this.decompose = false;
        this.decomposeAxis = "auto";        // 'auto' | 'x' | 'y' | 'both'
        this.readout = "full";              // 'full' | 'partials' | 'none'
        this.decomposeColor = "#F6C177";    // fractional columns
        this.decomposeRowColor = "#BFE3B4"; // fractional rows ('both')
        this.decomposeCornerColor = "#F2B8B5"; // fraction x fraction ('both')

        // ---- interaction ----------------------------------------------
        this.interactive = false;
        this.allowPaint = true;
        this.allowResize = false;
        this.inputs = [];
        this.checkAnswers = false;
        this.onChange = null;

        this._answers = {};
        this._feedback = {};
        this._inputElements = new Map();
        this._markElements = new Map();
        this._readoutNodes = [];
        this._metrics = null;
        this._contentGroup = null;
        this._shadeLayer = null;
        this._interactionLayer = null;

        this.updateLayout();
    }

    /* ================= configuration ================= */

    loadFromJSON(data)
    {
        if ( !data || typeof data !== "object" ) return;

        if ( data.columns !== undefined ) this.columns = parseRational(data.columns, this.columns);
        if ( data.width !== undefined ) this.columns = parseRational(data.width, this.columns);
        if ( data.rows !== undefined ) this.rows = parseRational(data.rows, this.rows);
        if ( data.height !== undefined ) this.rows = parseRational(data.height, this.rows);

        if ( data.columnParts !== undefined ) this.columnParts = positiveInteger(data.columnParts, this.columnParts);
        if ( data.rowParts !== undefined ) this.rowParts = positiveInteger(data.rowParts, this.rowParts);
        if ( data.unitScale !== undefined ) this.unitScale = positiveNumber(data.unitScale, this.unitScale);

        if ( data.shadeWidth !== undefined ) this.shadeWidth = parseRational(data.shadeWidth, { n: 0, d: 1 });
        if ( data.shadeHeight !== undefined ) this.shadeHeight = parseRational(data.shadeHeight, { n: 0, d: 1 });

        if ( data.shadeColor !== undefined ) this.shadeColor = optionalText(data.shadeColor, this.shadeColor);
        if ( data.shadeOpacity !== undefined ) this.shadeOpacity = positiveNumber(data.shadeOpacity, this.shadeOpacity);
        if ( data.emptyColor !== undefined ) this.emptyColor = optionalText(data.emptyColor, this.emptyColor);

        if ( data.gridColor !== undefined ) this.gridColor = optionalText(data.gridColor, this.gridColor);
        if ( data.gridStrokeWidth !== undefined ) this.gridStrokeWidth = positiveNumber(data.gridStrokeWidth, this.gridStrokeWidth);
        if ( data.partitionColor !== undefined ) this.partitionColor = optionalText(data.partitionColor, this.partitionColor);
        if ( data.partitionStrokeWidth !== undefined ) this.partitionStrokeWidth = positiveNumber(data.partitionStrokeWidth, this.partitionStrokeWidth);
        if ( data.partitionDash !== undefined ) this.partitionDash = optionalText(data.partitionDash, this.partitionDash);
        if ( data.showPartitions !== undefined ) this.showPartitions = coerceBoolean(data.showPartitions, this.showPartitions);
        if ( data.showUnitLines !== undefined ) this.showUnitLines = coerceBoolean(data.showUnitLines, this.showUnitLines);

        if ( data.partitionScope !== undefined )
        {
            this.columnPartitionScope = data.partitionScope;
            this.rowPartitionScope = data.partitionScope;
        }
        if ( data.columnPartitionScope !== undefined ) this.columnPartitionScope = data.columnPartitionScope;
        if ( data.rowPartitionScope !== undefined ) this.rowPartitionScope = data.rowPartitionScope;

        if ( data.braceStyle !== undefined ) this.braceStyle = data.braceStyle === "arrow" ? "arrow" : "brace";
        if ( data.braceColor !== undefined ) this.braceColor = optionalText(data.braceColor, this.braceColor);
        if ( data.labelFontSize !== undefined ) this.labelFontSize = positiveNumber(data.labelFontSize, this.labelFontSize);
        if ( data.title !== undefined ) this.title = String(data.title ?? "");
        if ( data.titleFontSize !== undefined ) this.titleFontSize = positiveNumber(data.titleFontSize, this.titleFontSize);
        if ( data.showAreaLabel !== undefined ) this.showAreaLabel = coerceBoolean(data.showAreaLabel, this.showAreaLabel);
        if ( data.areaLabelText !== undefined ) this.areaLabelText = String(data.areaLabelText ?? "");
        if ( data.expressionLine !== undefined ) this.expressionLine = coerceBoolean(data.expressionLine, this.expressionLine);
        if ( data.expressionSuffix !== undefined ) this.expressionSuffix = String(data.expressionSuffix ?? "");

        if ( data.decompose !== undefined ) this.decompose = coerceBoolean(data.decompose, this.decompose);
        if ( data.decomposeAxis !== undefined )
            this.decomposeAxis = ["x", "y", "both"].includes(data.decomposeAxis) ? data.decomposeAxis : "auto";
        if ( data.readout !== undefined )
            this.readout = ["full", "partials", "none"].includes(data.readout) ? data.readout : "full";
        if ( data.decomposeColor !== undefined ) this.decomposeColor = optionalText(data.decomposeColor, this.decomposeColor);
        if ( data.decomposeRowColor !== undefined ) this.decomposeRowColor = optionalText(data.decomposeRowColor, this.decomposeRowColor);
        if ( data.decomposeCornerColor !== undefined ) this.decomposeCornerColor = optionalText(data.decomposeCornerColor, this.decomposeCornerColor);

        if ( data.interactive !== undefined ) this.interactive = coerceBoolean(data.interactive, this.interactive);
        if ( data.allowPaint !== undefined ) this.allowPaint = coerceBoolean(data.allowPaint, this.allowPaint);
        if ( data.allowResize !== undefined ) this.allowResize = coerceBoolean(data.allowResize, this.allowResize);
        if ( data.checkAnswers !== undefined ) this.checkAnswers = coerceBoolean(data.checkAnswers, this.checkAnswers);
        if ( Array.isArray(data.inputs) ) this.inputs = data.inputs.slice();
        if ( typeof data.onChange === "function" ) this.onChange = data.onChange;

        // Braces come either as explicit spans or as a shorthand keyword.
        if ( data.topBraces !== undefined || data.topBrace !== undefined )
            this.topBraces = this._normalizeBraceSpec(data.topBraces ?? data.topBrace);
        if ( data.leftBraces !== undefined || data.leftBrace !== undefined )
            this.leftBraces = this._normalizeBraceSpec(data.leftBraces ?? data.leftBrace);
        if ( data.bottomBraces !== undefined || data.bottomBrace !== undefined )
            this.bottomBraces = this._normalizeBraceSpec(data.bottomBraces ?? data.bottomBrace);
        if ( data.rightBraces !== undefined || data.rightBrace !== undefined )
            this.rightBraces = this._normalizeBraceSpec(data.rightBraces ?? data.rightBrace);

        if ( data.showLabels === true &&
             data.topBrace === undefined && data.topBraces === undefined &&
             data.leftBrace === undefined && data.leftBraces === undefined )
        {
            this.topBraces = [{ scope: "shaded" }];
            this.leftBraces = [{ scope: "shaded" }];
        }

        // Explicit cell shading wins over the rectangle.
        if ( Array.isArray(data.shadedCells) )
        {
            this.shadeMode = "cells";
            this.shadedCells = new Set(data.shadedCells.map((cell) =>
                Array.isArray(cell) ? `${cell[0]},${cell[1]}` : String(cell)));
        }
        else if ( data.shadeMode === "cells" )
        {
            this.shadeMode = "cells";
            this.shadedCells = null;   // seeded from the rectangle at layout time
        }

        for ( const input of this.inputs )
        {
            if ( input && input.key !== undefined && input.value !== undefined )
                this._answers[input.key] = String(input.value);
        }

        this.updateLayout();
    }

    /**
     * `'unit' | 'shaded' | 'grid' | false` shorthand, a single span object, or
     * an array of `{ from, to, label, style }` spans measured in units.
     */
    _normalizeBraceSpec(spec)
    {
        if ( spec === false || spec === null || spec === undefined || spec === "none" ) return [];
        if ( Array.isArray(spec) ) return spec.map((item) => this._normalizeBraceSpan(item)).filter(Boolean);

        const span = this._normalizeBraceSpan(spec);
        return span ? [span] : [];
    }

    _normalizeBraceSpan(item)
    {
        if ( typeof item === "string" ) return { scope: item };
        if ( !item || typeof item !== "object" ) return null;

        return {
            scope: item.scope,
            from: item.from !== undefined ? parseRational(item.from, { n: 0, d: 1 }) : null,
            to: item.to !== undefined ? parseRational(item.to, null) : null,
            label: item.label,
            style: item.style,
        };
    }

    /* ================= derived values ================= */

    getShadeWidth()
    {
        return this.shadeWidth ?? this.columns;
    }

    getShadeHeight()
    {
        return this.shadeHeight ?? this.rows;
    }

    /**
     * Bounding extent of the shaded cells. `rectangular` is false when the
     * student painted a ragged region, in which case the bounding box is a
     * summary and not a multiplication expression.
     */
    _cellBounds()
    {
        const zero = { n: 0, d: 1 };
        const cells = this._ensureCellSet();
        const xEdges = cellEdges(this.columns, this.columnParts);
        const yEdges = cellEdges(this.rows, this.rowParts);

        let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
        for ( const key of cells )
        {
            const [ci, ri] = key.split(",").map(Number);
            if ( !(ci >= 0 && ci < xEdges.length - 1 && ri >= 0 && ri < yEdges.length - 1) ) continue;
            minC = Math.min(minC, ci); maxC = Math.max(maxC, ci);
            minR = Math.min(minR, ri); maxR = Math.max(maxR, ri);
        }

        if ( maxC < 0 ) return { width: zero, height: zero, rectangular: true };

        return {
            width: ratSub(xEdges[maxC + 1], xEdges[minC]),
            height: ratSub(yEdges[maxR + 1], yEdges[minR]),
            rectangular: cells.size === (maxC - minC + 1) * (maxR - minR + 1),
        };
    }

    /** Effective shaded extent: the configured rectangle, or the painted bounds. */
    getShadeExtent()
    {
        if ( this.shadeMode !== "cells" )
            return { width: this.getShadeWidth(), height: this.getShadeHeight(), rectangular: true };
        return this._cellBounds();
    }

    /** Exact shaded area as a rational. */
    getArea()
    {
        if ( this.shadeMode === "cells" )
        {
            const cells = this._ensureCellSet();
            const xEdges = cellEdges(this.columns, this.columnParts);
            const yEdges = cellEdges(this.rows, this.rowParts);
            let total = { n: 0, d: 1 };

            for ( const key of cells )
            {
                const [ci, ri] = key.split(",").map(Number);
                if ( !(ci >= 0 && ci < xEdges.length - 1 && ri >= 0 && ri < yEdges.length - 1) ) continue;
                const w = ratSub(xEdges[ci + 1], xEdges[ci]);
                const h = ratSub(yEdges[ri + 1], yEdges[ri]);
                total = ratAdd(total, ratMul(w, h));
            }
            return total;
        }

        return ratMul(this.getShadeWidth(), this.getShadeHeight());
    }

    /**
     * Marked-up multiplication expression. Empty when nothing is shaded or the
     * painted region is ragged — neither reads as a single product.
     */
    getExpressionMarkup()
    {
        const extent = this.getShadeExtent();
        if ( !extent.rectangular || extent.width.n === 0 || extent.height.n === 0 ) return "";
        return `${formatRationalMarkup(extent.width)} \u00d7 ${formatRationalMarkup(extent.height)}`;
    }

    getExpressionText()
    {
        const markup = this.getExpressionMarkup();
        if ( markup === "" ) return "\u2014";

        const extent = this.getShadeExtent();
        return `${formatRationalText(extent.width)} \u00d7 ${formatRationalText(extent.height)}`;
    }

    getState()
    {
        const area = this.getArea();
        const extent = this.getShadeExtent();
        return {
            columns: formatRationalText(this.columns),
            rows: formatRationalText(this.rows),
            shadeWidth: formatRationalText(extent.width),
            shadeHeight: formatRationalText(extent.height),
            rectangular: extent.rectangular,
            shadeMode: this.shadeMode,
            shadedCells: this.shadeMode === "cells" ? Array.from(this._ensureCellSet()) : null,
            area: formatRationalText(area),
            areaValue: ratValue(area),
            areaFraction: { n: area.n, d: area.d },
            expression: this.getExpressionText(),
            answers: { ...this._answers },
            feedback: { ...this._feedback },
        };
    }

    /* ================= cell helpers ================= */

    _ensureCellSet()
    {
        if ( this.shadedCells ) return this.shadedCells;

        // Seed from the configured rectangle so switching into paint mode
        // never blanks the figure the author set up.
        const cells = new Set();
        const xEdges = cellEdges(this.columns, this.columnParts);
        const yEdges = cellEdges(this.rows, this.rowParts);
        const w = this.getShadeWidth();
        const h = this.getShadeHeight();

        for ( let ci = 0; ci < xEdges.length - 1; ci++ )
        {
            if ( ratCompare(xEdges[ci + 1], w) > 0 ) break;
            for ( let ri = 0; ri < yEdges.length - 1; ri++ )
            {
                if ( ratCompare(yEdges[ri + 1], h) > 0 ) break;
                cells.add(`${ci},${ri}`);
            }
        }

        this.shadedCells = cells;
        return cells;
    }

    setShadedCells(cells, emit = true)
    {
        this.shadeMode = "cells";
        this.shadedCells = new Set((cells || []).map((cell) =>
            Array.isArray(cell) ? `${cell[0]},${cell[1]}` : String(cell)));
        this._redrawShading();
        if ( emit ) this._emit("cells");
    }

    clearShading(emit = true)
    {
        this.shadeMode = "cells";
        this.shadedCells = new Set();
        this._redrawShading();
        if ( emit ) this._emit("clear");
    }

    setShadeSize(width, height, emit = true)
    {
        this.shadeMode = "rect";
        this.shadedCells = null;
        if ( width !== undefined && width !== null ) this.shadeWidth = parseRational(width, this.getShadeWidth());
        if ( height !== undefined && height !== null ) this.shadeHeight = parseRational(height, this.getShadeHeight());
        this.updateLayout();
        if ( emit ) this._emit("resize");
    }

    /* ================= layout ================= */

    updateLayout()
    {
        this.removeAllChildren();
        this._inputElements.clear();
        this._markElements.clear();
        this._readoutNodes = [];

        const unit = this.unitScale;
        const gridW = ratValue(this.columns) * unit;
        const gridH = ratValue(this.rows) * unit;

        const braceDepth = 11;
        const braceGap = 7;
        const labelGap = 7;

        const sides = {
            top: this._resolveSpans(this.topBraces, "x"),
            bottom: this._resolveSpans(this.bottomBraces, "x"),
            left: this._resolveSpans(this.leftBraces, "y"),
            right: this._resolveSpans(this.rightBraces, "y"),
        };

        // Measure labels first so the gutters are exactly as deep as needed.
        const labels = {};
        const gutter = {};
        for ( const [side, spans] of Object.entries(sides) )
        {
            labels[side] = spans.map((span) => this._makeSpanLabel(span));
            const across = side === "top" || side === "bottom" ? "height" : "width";
            const labelSize = labels[side].reduce((max, label) => Math.max(max, label ? label[across] : 0), 0);
            gutter[side] = spans.length ? braceGap + braceDepth + labelGap + labelSize : 0;
        }

        const titleHeight = this.title ? this.titleFontSize + 16 : 0;
        const originY = titleHeight + (gutter.top || 4);
        const originX = gutter.left || 4;

        const content = new jsvgGroup();
        content.setPosition(originX, originY);
        this.addChild(content);
        this._contentGroup = content;

        this._metrics = {
            unit, gridW, gridH, originX, originY,
            xEdges: cellEdges(this.columns, this.columnParts),
            yEdges: cellEdges(this.rows, this.rowParts),
        };

        if ( this.title )
        {
            const titleLabel = makeMathLabel(this.title, { fontSize: this.titleFontSize });
            titleLabel.setPosition(originX, 0);
            this.addChild(titleLabel);
        }

        this._drawBackground(content, gridW, gridH);

        // The shade layer sits under the rules so partition lines stay visible
        // over the fill, and can be rebuilt on its own while painting.
        this._shadeLayer = new jsvgGroup();
        content.addChild(this._shadeLayer);
        this._drawShading();

        const decomposition = this._drawDecomposition(content);

        this._drawPartitions(content, gridW, gridH);
        this._drawUnitLines(content, gridW, gridH);
        this._drawBorder(content, gridW, gridH);

        for ( const [side, spans] of Object.entries(sides) )
        {
            spans.forEach((span, index) => this._drawSpan(span, labels[side][index], {
                side, braceDepth, braceGap, labelGap, originX, originY, gridW, gridH,
            }));
        }

        let bottomY = originY + gridH + gutter.bottom;
        // Readout lines start at the grid's left edge and may run wider than
        // it, so the figure grows to fit them.
        let flowRight = 0;
        const addFlowLabel = (markup, fontSize, centered) => {
            const label = makeMathLabel(markup, { fontSize });
            const x = centered ? originX + Math.max(0, (gridW - label.width) / 2) : originX;
            label.setPosition(x, bottomY + 14);
            this.addChild(label);
            bottomY += 14 + label.height;
            flowRight = Math.max(flowRight, x + label.width);
            return label;
        };

        if ( decomposition && this.readout !== "none" )
            addFlowLabel(this.readout === "partials" ? decomposition.partials : decomposition.full, this.labelFontSize, false);

        if ( this.showAreaLabel )
        {
            const markup = this.areaLabelText
                ? this.areaLabelText
                : `${formatRationalMarkup(this.getArea())} ${this.expressionSuffix}`.trim();
            addFlowLabel(markup, this.labelFontSize, true);
        }

        if ( this.expressionLine )
        {
            const expression = this.getExpressionMarkup();
            const markup = (expression ? `${expression} = ` : "") +
                formatRationalMarkup(this.getArea()) +
                (this.expressionSuffix ? ` ${this.expressionSuffix}` : "");
            addFlowLabel(markup, this.labelFontSize, false);
        }

        if ( this.interactive )
        {
            this._interactionLayer = new jsvgGroup();
            this._interactionLayer.setPosition(originX, originY);
            this.addChild(this._interactionLayer);
            this._installInteraction(gridW, gridH);
        }

        if ( this.inputs.length )
            bottomY = this._drawInputs(originX, bottomY + 16, Math.max(gridW, 340));

        // Brace labels above and below can overhang the grid on either side.
        let leftExtent = 0;
        let rightExtent = Math.max(originX + gridW + gutter.right, flowRight);
        for ( const side of ["top", "bottom"] )
        {
            sides[side].forEach((span, index) => {
                const label = labels[side][index];
                if ( !label ) return;
                const cx = originX + (ratValue(span.from) + ratValue(span.to)) / 2 * unit;
                leftExtent = Math.min(leftExtent, cx - label.width / 2);
                rightExtent = Math.max(rightExtent, cx + label.width / 2);
            });
        }

        if ( leftExtent < 0 )
        {
            const shift = -leftExtent;
            for ( const child of this.childList )
                child.setPosition((child.xpos || 0) + shift, child.ypos || 0);
            for ( const node of this.svgObject.children || [] )
            {
                if ( node.tagName === "foreignObject" )
                    node.setAttribute("x", String(Number(node.getAttribute("x") || 0) + shift));
            }
            rightExtent += shift;
        }

        this.width = Math.ceil(rightExtent + 8);
        this.height = Math.ceil(bottomY + 10);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    _resolveSpans(specs, axis)
    {
        const total = axis === "x" ? this.columns : this.rows;
        const extent = this.getShadeExtent();
        const shaded = axis === "x" ? extent.width : extent.height;

        return specs.map((spec) => {
            const from = spec.from ?? { n: 0, d: 1 };
            let to = spec.to;

            if ( !to )
            {
                if ( spec.scope === "unit" ) to = { n: 1, d: 1 };
                else if ( spec.scope === "grid" ) to = total;
                else to = shaded;
            }

            const label = spec.label !== undefined
                ? String(spec.label)
                : formatRationalMarkup(ratSub(to, from));

            return { from, to, label, style: spec.style ?? this.braceStyle, axis };
        }).filter((span) => ratCompare(span.to, span.from) > 0);
    }

    _makeSpanLabel(span)
    {
        if ( !span.label ) return null;
        return makeMathLabel(span.label, { fontSize: this.labelFontSize });
    }

    /** One brace or arrow on any side of the grid, its label just outside the tip. */
    _drawSpan(span, label, options)
    {
        const { side, braceDepth, braceGap, labelGap, originX, originY, gridW, gridH } = options;
        const unit = this.unitScale;
        const color = this.braceColor;
        const horizontal = side === "top" || side === "bottom";
        const outward = side === "top" || side === "left" ? -1 : 1;
        let tipX;
        let tipY;

        if ( horizontal )
        {
            const x1 = originX + ratValue(span.from) * unit;
            const x2 = originX + ratValue(span.to) * unit;
            const y = side === "top" ? originY - braceGap : originY + gridH + braceGap;

            if ( span.style === "arrow" )
            {
                const arrowY = y + outward * braceDepth;
                const arrow = makeArrowDimension(x1, arrowY, x2, arrowY, { color });
                this.addChild(arrow.group);
                tipX = arrow.tipX;
                tipY = arrowY;
            }
            else
            {
                // The tip sits on the left of the drawing direction: right-to-left
                // points it up, left-to-right points it down.
                const brace = side === "top"
                    ? makeBrace(x2, y, x1, y, { depth: braceDepth, color })
                    : makeBrace(x1, y, x2, y, { depth: braceDepth, color });
                this.addChild(brace.path);
                tipX = brace.tipX;
                tipY = brace.tipY;
            }

            if ( label ) centerMathLabel(label, tipX, tipY + outward * (labelGap + label.height / 2));
        }
        else
        {
            const y1 = originY + ratValue(span.from) * unit;
            const y2 = originY + ratValue(span.to) * unit;
            const x = side === "left" ? originX - braceGap : originX + gridW + braceGap;

            if ( span.style === "arrow" )
            {
                const arrowX = x + outward * braceDepth;
                const arrow = makeArrowDimension(arrowX, y1, arrowX, y2, { color });
                this.addChild(arrow.group);
                tipX = arrowX;
                tipY = arrow.tipY;
            }
            else
            {
                // Top-to-bottom points the tip left, bottom-to-top points it right.
                const brace = side === "left"
                    ? makeBrace(x, y1, x, y2, { depth: braceDepth, color })
                    : makeBrace(x, y2, x, y1, { depth: braceDepth, color });
                this.addChild(brace.path);
                tipX = brace.tipX;
                tipY = brace.tipY;
            }

            if ( label ) centerMathLabel(label, tipX + outward * (labelGap + label.width / 2), tipY);
        }

        if ( label ) this.addChild(label);
    }

    _drawBackground(content, gridW, gridH)
    {
        const background = new jsvgRect();
        background.setWidthAndHeight(gridW, gridH);
        background.setFillColor(this.emptyColor);
        background.setStrokeWidth(0);
        background.setPosition(0, 0);
        content.addChild(background);
    }

    /** Rebuilds the shade layer only — cheap enough to run on every paint move. */
    _drawShading()
    {
        const layer = this._shadeLayer;
        if ( !layer ) return;
        layer.removeAllChildren();

        const unit = this.unitScale;

        const addRect = (x, y, w, h, bleed) => {
            if ( w <= 0 || h <= 0 ) return;
            const rect = new jsvgRect();
            rect.setWidthAndHeight(w + bleed, h + bleed);
            rect.setFillColor(this.shadeColor);
            rect.setStrokeWidth(0);
            if ( this.shadeOpacity !== 1 ) rect.setOpacity(this.shadeOpacity);
            rect.setPosition(x, y);
            layer.addChild(rect);
        };

        if ( this.shadeMode === "cells" )
        {
            const { xEdges, yEdges } = this._metrics;
            for ( const key of this._ensureCellSet() )
            {
                const [ci, ri] = key.split(",").map(Number);
                if ( !(ci >= 0 && ci < xEdges.length - 1 && ri >= 0 && ri < yEdges.length - 1) ) continue;

                addRect(
                    ratValue(xEdges[ci]) * unit,
                    ratValue(yEdges[ri]) * unit,
                    ratValue(ratSub(xEdges[ci + 1], xEdges[ci])) * unit,
                    ratValue(ratSub(yEdges[ri + 1], yEdges[ri])) * unit,
                    0.6,   // hairline bleed hides seams between adjacent cells
                );
            }
            return;
        }

        addRect(0, 0,
            ratValue(this.getShadeWidth()) * unit,
            ratValue(this.getShadeHeight()) * unit,
            0);
    }

    _redrawShading()
    {
        this._drawShading();
        this._refreshReadouts();
    }

    /**
     * Which slice of an axis carries dashed partition lines.
     *
     * `'all'` (default) subdivides every unit. `'last'` subdivides only the unit
     * that the shaded extent ends inside — the IM convention for mixed numbers,
     * where 3 2/5 is drawn as three plain unit squares plus a partitioned one.
     */
    _partitionWindow(axis)
    {
        const scope = axis === "x" ? this.columnPartitionScope : this.rowPartitionScope;
        const total = axis === "x" ? this.columns : this.rows;

        if ( scope && typeof scope === "object" )
        {
            return {
                from: parseRational(scope.from, { n: 0, d: 1 }),
                to: parseRational(scope.to, total),
            };
        }

        if ( scope !== "last" ) return { from: { n: 0, d: 1 }, to: total };

        const extent = this.getShadeExtent();
        const along = axis === "x" ? extent.width : extent.height;
        let start = makeRational(Math.floor(along.n / along.d), 1);

        // A whole-number extent has no fractional unit; fall back to the last
        // unit of the drawn grid.
        if ( along.d === 1 || ratCompare(start, total) >= 0 )
            start = makeRational(Math.max(0, Math.ceil(ratValue(total) - EPSILON) - 1), 1);

        const end = ratAdd(start, { n: 1, d: 1 });
        return { from: start, to: ratCompare(end, total) > 0 ? total : end };
    }

    _drawPartitions(content, gridW, gridH)
    {
        if ( !this.showPartitions ) return;

        const unit = this.unitScale;
        const addLine = (x1, y1, x2, y2) => {
            const line = new jsvgLine();
            line.setEndpoints(x1, y1, x2, y2);
            line.setStrokeColor(this.partitionColor);
            line.setStrokeWidth(this.partitionStrokeWidth);
            line.svgObject.setAttribute("stroke-dasharray", this.partitionDash);
            content.addChild(line);
        };

        const isUnitBoundary = (value) => Math.abs(ratValue(value) - Math.round(ratValue(value))) < EPSILON;

        if ( this.rowParts > 1 )
        {
            const span = this._partitionWindow("y");
            for ( const edge of this._metrics.yEdges.slice(1, -1) )
            {
                if ( isUnitBoundary(edge) ) continue;
                if ( ratCompare(edge, span.from) <= 0 || ratCompare(edge, span.to) >= 0 ) continue;
                const y = ratValue(edge) * unit;
                addLine(0, y, gridW, y);
            }
        }

        if ( this.columnParts > 1 )
        {
            const span = this._partitionWindow("x");
            for ( const edge of this._metrics.xEdges.slice(1, -1) )
            {
                if ( isUnitBoundary(edge) ) continue;
                if ( ratCompare(edge, span.from) <= 0 || ratCompare(edge, span.to) >= 0 ) continue;
                const x = ratValue(edge) * unit;
                addLine(x, 0, x, gridH);
            }
        }
    }

    _drawUnitLines(content, gridW, gridH)
    {
        if ( !this.showUnitLines ) return;

        const unit = this.unitScale;
        const addLine = (x1, y1, x2, y2) => {
            const line = new jsvgLine();
            line.setEndpoints(x1, y1, x2, y2);
            line.setStrokeColor(this.gridColor);
            line.setStrokeWidth(this.gridStrokeWidth);
            content.addChild(line);
        };

        const columnCount = Math.ceil(ratValue(this.columns) - EPSILON);
        for ( let c = 1; c < columnCount; c++ ) addLine(c * unit, 0, c * unit, gridH);

        const rowCount = Math.ceil(ratValue(this.rows) - EPSILON);
        for ( let r = 1; r < rowCount; r++ ) addLine(0, r * unit, gridW, r * unit);
    }

    _drawBorder(content, gridW, gridH)
    {
        const border = new jsvgRect();
        border.setWidthAndHeight(gridW, gridH);
        border.setFillColor("none");
        border.setStrokeColor(this.gridColor);
        border.setStrokeWidth(this.gridStrokeWidth);
        border.setPosition(0, 0);
        content.addChild(border);
    }

    /**
     * Distributive-property overlay: tints the fractional parts of the shaded
     * region, rules the splits, and returns the readout markup, e.g.
     * 2 x 3 2/5 -> "(2 x 3) + (2 x 2/5)". With decomposeAxis 'both' each
     * mixed side splits into whole + fraction, giving four partial products.
     */
    _drawDecomposition(content)
    {
        if ( !this.decompose ) return null;

        const unit = this.unitScale;
        const w = this.getShadeWidth();
        const h = this.getShadeHeight();

        const splitMixed = (r) => {
            const whole = makeRational(Math.floor(r.n / r.d), 1);
            const rest = ratSub(r, whole);
            return whole.n > 0 && rest.n > 0 ? [whole, rest] : null;
        };

        const axis = this.decomposeAxis === "auto" ? (w.d > 1 ? "x" : "y") : this.decomposeAxis;
        const columnSplit = axis === "x" || axis === "both" ? splitMixed(w) : null;
        const rowSplit = axis === "y" || axis === "both" ? splitMixed(h) : null;
        if ( !columnSplit && !rowSplit ) return null;

        const columnPieces = columnSplit ?? [w];
        const rowPieces = rowSplit ?? [h];
        const wPx = ratValue(w) * unit;
        const hPx = ratValue(h) * unit;
        const splitXPx = columnSplit ? ratValue(columnSplit[0]) * unit : wPx;
        const splitYPx = rowSplit ? ratValue(rowSplit[0]) * unit : hPx;

        // The whole x whole piece keeps the shade colour; every piece with a
        // fractional side gets a tint, the fraction x fraction corner its own.
        const addTint = (x, y, width, height, color) => {
            const tint = new jsvgRect();
            tint.setWidthAndHeight(width, height);
            tint.setPosition(x, y);
            tint.setFillColor(color);
            tint.setStrokeWidth(0);
            content.addChild(tint);
        };
        const rowColor = columnSplit ? this.decomposeRowColor : this.decomposeColor;
        if ( columnSplit ) addTint(splitXPx, 0, wPx - splitXPx, splitYPx, this.decomposeColor);
        if ( rowSplit ) addTint(0, splitYPx, splitXPx, hPx - splitYPx, rowColor);
        if ( columnSplit && rowSplit ) addTint(splitXPx, splitYPx, wPx - splitXPx, hPx - splitYPx, this.decomposeCornerColor);

        const addDivider = (x1, y1, x2, y2) => {
            const divider = new jsvgLine();
            divider.setEndpoints(x1, y1, x2, y2);
            divider.setStrokeColor("#9F2F2D");
            divider.setStrokeWidth(3);
            content.addChild(divider);
        };
        if ( columnSplit ) addDivider(splitXPx, 0, splitXPx, hPx);
        if ( rowSplit ) addDivider(0, splitYPx, wPx, splitYPx);

        // Factor order follows the single-axis convention — the unsplit side
        // first — and reads row by row once both sides split.
        const factors = [];
        if ( columnSplit )
        {
            for ( const rowPiece of rowPieces )
                for ( const columnPiece of columnPieces ) factors.push([rowPiece, columnPiece]);
        }
        else
        {
            for ( const rowPiece of rowPieces ) factors.push([w, rowPiece]);
        }

        const partials = factors
            .map(([a, b]) => `(${formatRationalMarkup(a)} \u00d7 ${formatRationalMarkup(b)})`)
            .join(" + ");
        const products = factors.map(([a, b]) => ratMul(a, b));
        const total = products.reduce((sum, product) => ratAdd(sum, product), { n: 0, d: 1 });

        return {
            axis,
            partials,
            full: `${partials} = ${products.map((product) => formatRationalMarkup(product)).join(" + ")}` +
                ` = ${formatRationalMarkup(total)}`,
        };
    }

    /* ================= interaction ================= */

    _createSvgElement(tagName, attributes = {})
    {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        for ( const [key, value] of Object.entries(attributes) )
        {
            if ( value !== undefined && value !== null )
                element.setAttribute(key, String(value));
        }
        return element;
    }

    _clientToLocalSvgPoint(clientX, clientY)
    {
        const ownerSvg = this.svgObject.ownerSVGElement || this.svgObject;
        if ( typeof ownerSvg.createSVGPoint !== "function" ) return { x: clientX, y: clientY };

        const matrix = this._contentGroup?.svgObject?.getScreenCTM?.();
        if ( !matrix ) return { x: clientX, y: clientY };

        const point = ownerSvg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        return point.matrixTransform(matrix.inverse());
    }

    /** Partition cell under a point given in content-local pixels. */
    _cellAt(localX, localY)
    {
        const { xEdges, yEdges } = this._metrics;
        const unit = this.unitScale;

        const findIndex = (edges, value) => {
            for ( let i = 0; i < edges.length - 1; i++ )
            {
                const lo = ratValue(edges[i]) * unit;
                const hi = ratValue(edges[i + 1]) * unit;
                if ( value >= lo && value < hi ) return i;
            }
            return -1;
        };

        const ci = findIndex(xEdges, localX);
        const ri = findIndex(yEdges, localY);
        return ci < 0 || ri < 0 ? null : `${ci},${ri}`;
    }

    _installInteraction(gridW, gridH)
    {
        const layer = this._interactionLayer;

        if ( this.allowPaint )
        {
            const hit = this._createSvgElement("rect", {
                x: 0, y: 0, width: gridW, height: gridH,
                fill: "transparent", "data-omd-area-hit": "1",
            });
            hit.style.cursor = "crosshair";
            hit.style.touchAction = "none";
            layer.svgObject.appendChild(hit);

            let painting = false;
            let paintValue = true;

            const applyAt = (clientX, clientY) => {
                const local = this._clientToLocalSvgPoint(clientX, clientY);
                const key = this._cellAt(local.x, local.y);
                if ( !key ) return;

                const cells = this._ensureCellSet();
                if ( paintValue === cells.has(key) ) return;

                if ( paintValue ) cells.add(key);
                else cells.delete(key);
                this._redrawShading();
            };

            hit.addEventListener("pointerdown", (event) => {
                if ( event.button !== 0 ) return;
                event.preventDefault();

                const local = this._clientToLocalSvgPoint(event.clientX, event.clientY);
                const key = this._cellAt(local.x, local.y);
                if ( !key ) return;

                // First press decides whether this stroke shades or erases.
                this.shadeMode = "cells";
                paintValue = !this._ensureCellSet().has(key);
                painting = true;
                hit.setPointerCapture?.(event.pointerId);
                applyAt(event.clientX, event.clientY);
            });

            hit.addEventListener("pointermove", (event) => {
                if ( painting ) applyAt(event.clientX, event.clientY);
            });

            const stop = () => {
                if ( !painting ) return;
                painting = false;
                // Catch braces, expression lines and readouts up to the stroke.
                this.updateLayout();
                this._emit("paint");
            };

            hit.addEventListener("pointerup", stop);
            hit.addEventListener("pointercancel", stop);
        }

        if ( this.allowResize && this.shadeMode === "rect" )
            this._installResizeHandles(layer);
    }

    _installResizeHandles(layer)
    {
        const unit = this.unitScale;
        const wPx = ratValue(this.getShadeWidth()) * unit;
        const hPx = ratValue(this.getShadeHeight()) * unit;

        const handles = [
            { name: "corner", x: wPx, y: hPx, cursor: "nwse-resize", axes: "xy" },
            { name: "right", x: wPx, y: hPx / 2, cursor: "ew-resize", axes: "x" },
            { name: "bottom", x: wPx / 2, y: hPx, cursor: "ns-resize", axes: "y" },
        ];

        const snap = (pxValue, total, parts) => {
            const step = 1 / parts;
            const raw = pxValue / unit;
            const clamped = Math.max(step, Math.min(ratValue(total), Math.round(raw / step) * step));
            return makeRational(Math.round(clamped * parts), parts);
        };

        for ( const handle of handles )
        {
            const group = this._createSvgElement("g", { "data-omd-area-handle": handle.name });

            const dot = this._createSvgElement("circle", {
                cx: handle.x, cy: handle.y, r: 8,
                fill: "#FFFFFF", stroke: "#1F6C9F", "stroke-width": 3,
            });
            const hit = this._createSvgElement("circle", { cx: handle.x, cy: handle.y, r: 20, fill: "transparent" });
            hit.style.cursor = handle.cursor;
            hit.style.touchAction = "none";

            group.appendChild(dot);
            group.appendChild(hit);
            layer.svgObject.appendChild(group);

            const updateFrom = (event) => {
                const local = this._clientToLocalSvgPoint(event.clientX, event.clientY);
                let nextW = this.getShadeWidth();
                let nextH = this.getShadeHeight();

                if ( handle.axes.includes("x") ) nextW = snap(local.x, this.columns, this.columnParts);
                if ( handle.axes.includes("y") ) nextH = snap(local.y, this.rows, this.rowParts);

                if ( ratCompare(nextW, this.getShadeWidth()) === 0 &&
                     ratCompare(nextH, this.getShadeHeight()) === 0 ) return;

                this.shadeWidth = nextW;
                this.shadeHeight = nextH;
                this.updateLayout();
                this._emit("resize");
            };

            // The listeners live on the window, not the handle: a resize
            // relayout replaces the whole interaction layer mid-drag, and a
            // detached element stops receiving pointer events even with capture.
            hit.addEventListener("pointerdown", (event) => {
                if ( event.button !== 0 ) return;
                event.preventDefault();
                event.stopPropagation();

                const view = hit.ownerDocument?.defaultView ?? globalThis;
                const move = (moveEvent) => updateFrom(moveEvent);
                const stop = () => {
                    view.removeEventListener("pointermove", move);
                    view.removeEventListener("pointerup", stop);
                    view.removeEventListener("pointercancel", stop);
                };

                view.addEventListener("pointermove", move);
                view.addEventListener("pointerup", stop);
                view.addEventListener("pointercancel", stop);
            });
        }
    }

    _refreshReadouts()
    {
        const area = this.getArea();
        for ( const node of this._readoutNodes )
        {
            node.textContent = node.getAttribute("data-omd-readout") === "area"
                ? formatRationalText(area)
                : this.getExpressionText();
        }
    }

    /* ================= answer inputs ================= */

    _drawInputs(originX, startY, width)
    {
        const rowHeight = 40;
        const gap = 8;
        let y = startY;

        for ( const config of this.inputs )
        {
            if ( !config || typeof config !== "object" ) continue;

            const key = String(config.key ?? config.label ?? "answer");
            const fo = this._createSvgElement("foreignObject", {
                x: originX, y, width: Math.max(width, 360), height: rowHeight,
                "data-omd-area-input-row": key,
            });

            const row = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
            Object.assign(row.style, {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                height: "100%",
                fontFamily: OMD_MATH_FONT_FAMILY,
                fontSize: `${this.labelFontSize}px`,
                color: "#111111",
            });

            if ( config.label )
            {
                const label = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
                label.textContent = String(config.label);
                label.style.fontWeight = "600";
                label.style.whiteSpace = "nowrap";
                row.appendChild(label);
            }

            if ( config.readout )
                row.appendChild(this._buildReadout(config.readout));
            else
                this._buildAnswerField(row, config, key);

            fo.appendChild(row);
            this.svgObject.appendChild(fo);
            y += rowHeight + gap;
        }

        return y - gap;
    }

    _buildReadout(kind)
    {
        const readout = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
        readout.setAttribute("data-omd-readout", kind);
        readout.textContent = kind === "area"
            ? formatRationalText(this.getArea())
            : this.getExpressionText();
        Object.assign(readout.style, {
            fontWeight: "700",
            padding: "5px 14px",
            borderRadius: "6px",
            background: "#E1F3FE",
            color: "#1F6C9F",
            minWidth: "56px",
            textAlign: "center",
            whiteSpace: "nowrap",
        });
        this._readoutNodes.push(readout);
        return readout;
    }

    _buildAnswerField(row, config, key)
    {
        const input = document.createElementNS("http://www.w3.org/1999/xhtml", "input");
        input.setAttribute("type", "text");
        input.setAttribute("data-omd-area-input", key);
        input.setAttribute("placeholder", String(config.placeholder ?? ""));
        input.value = this._answers[key] ?? "";
        Object.assign(input.style, {
            flex: "0 0 auto",
            width: `${config.width ?? 170}px`,
            height: "30px",
            boxSizing: "border-box",
            border: "1px solid #C7CBD1",
            borderBottom: "2px solid #111111",
            borderRadius: "6px",
            background: "#FFFFFF",
            padding: "0 10px",
            fontFamily: OMD_MATH_FONT_FAMILY,
            fontSize: `${this.labelFontSize}px`,
            color: "#111111",
            outline: "none",
        });

        const mark = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
        mark.setAttribute("data-omd-area-mark", key);
        Object.assign(mark.style, {
            fontWeight: "700",
            fontSize: `${this.labelFontSize + 3}px`,
            width: "18px",
        });
        this._applyFeedbackStyle(mark, this._feedback[key]);

        input.addEventListener("focus", () => {
            input.style.borderColor = "#1F6C9F";
            input.style.background = "#F4FAFE";
        });
        input.addEventListener("blur", () => {
            input.style.borderColor = "#C7CBD1";
            input.style.borderBottomColor = "#111111";
            input.style.background = "#FFFFFF";
        });
        input.addEventListener("input", () => {
            this._answers[key] = input.value;
            if ( this.checkAnswers )
            {
                this._feedback[key] = this._gradeAnswer(config, input.value);
                this._applyFeedbackStyle(mark, this._feedback[key]);
            }
            this._emit("input", { key, value: input.value });
        });

        row.appendChild(input);

        if ( config.suffix )
        {
            const suffix = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
            suffix.textContent = String(config.suffix);
            suffix.style.whiteSpace = "nowrap";
            suffix.style.color = "#5c646d";
            row.appendChild(suffix);
        }

        row.appendChild(mark);
        this._inputElements.set(key, input);
        this._markElements.set(key, mark);
    }

    _applyFeedbackStyle(mark, state)
    {
        if ( state === "correct" )
        {
            mark.textContent = "\u2713";
            mark.style.color = "#346538";
        }
        else if ( state === "incorrect" )
        {
            mark.textContent = "\u2715";
            mark.style.color = "#9F2F2D";
        }
        else
        {
            mark.textContent = "";
        }
    }

    /**
     * Numeric answers compare as exact rationals ("8/3" matches "2 2/3");
     * expression answers compare as normalized text so "4 x 2/3", "4*2/3" and
     * "4 × 2/3" all pass.
     */
    _gradeAnswer(config, value)
    {
        const raw = String(value ?? "").trim();
        if ( raw === "" ) return null;

        const expected = config.answer;
        if ( expected === undefined || expected === null ) return null;

        for ( const candidate of (Array.isArray(expected) ? expected : [expected]) )
        {
            const target = parseRational(candidate, null);
            if ( target && rationalMatchesText(target, raw) ) return "correct";
            if ( this._normalizeExpression(raw) === this._normalizeExpression(candidate) ) return "correct";
        }

        return "incorrect";
    }

    _normalizeExpression(text)
    {
        return String(text ?? "")
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[x\u00d7*\u2219\u00b7]/g, "*")
            .replace(/\u00f7/g, "/");
    }

    getAnswers()
    {
        return { ...this._answers };
    }

    setAnswer(key, value, emit = true)
    {
        this._answers[key] = String(value ?? "");
        const input = this._inputElements.get(key);
        if ( input ) input.value = this._answers[key];
        if ( emit ) this._emit("input", { key, value: this._answers[key] });
    }

    /** Grades every configured field and paints the check marks. */
    checkAll()
    {
        for ( const config of this.inputs )
        {
            if ( !config || config.readout ) continue;
            const key = String(config.key ?? config.label ?? "answer");
            this._feedback[key] = this._gradeAnswer(config, this._answers[key]);
            const mark = this._markElements.get(key);
            if ( mark ) this._applyFeedbackStyle(mark, this._feedback[key]);
        }
        this._emit("check");
        return { ...this._feedback };
    }

    /* ================= events ================= */

    _emit(type, detail = {})
    {
        const payload = { type, ...this.getState(), ...detail };

        if ( typeof this.onChange === "function" ) this.onChange(payload);

        if ( typeof CustomEvent !== "undefined" &&
             this.svgObject &&
             typeof this.svgObject.dispatchEvent === "function" )
        {
            this.svgObject.dispatchEvent(new CustomEvent("omd-areadiagram-change", {
                bubbles: true,
                detail: payload,
            }));
        }
    }
}
