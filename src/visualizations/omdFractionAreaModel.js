import { jsvgGroup, jsvgRect, jsvgLine } from "@teachinglab/jsvg";
import { OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { makeBrace } from "./omdBrace.js";
import { makeRational, formatRationalMarkup } from "./omdFraction.js";
import { parseFractionMarkup, measureItems, extentOfItems, drawItems, makeText, textWidth } from "./omdFractionTypeset.js";

/**
 * omdFractionAreaModel — "a/b of c/d" on a unit square, built up in three
 * panels the way Grade 5 materials introduce fraction × fraction:
 *
 *   1. the whole, cut into d rows, with c rows shaded         ("1/3 of the whole")
 *   2. the shaded part cut into b columns, a of them darkened ("1/4 of 1/3")
 *   3. the column cuts extended across the whole square, so
 *      the darkened part reads as ac of bd equal pieces       ("1/4 of 1/3 is 1/12")
 *
 * Panels sit side by side, each with "1" braces on the top and left edge and
 * a caption underneath. `stepIndex` (1–3) reveals that many panels; space for
 * the rest is reserved so stepping never reflows the figure.
 *
 * JSON shape:
 * {
 *   omdType: 'fractionAreaModel',
 *   left: '1/4',             // the "of" fraction — a/b
 *   right: '1/3',            // the amount it is taken of — c/d
 *   stepIndex: 1 | 2 | 3,    // panels revealed (default 3)
 *   captions: ['pan with [1/3] left', ...],   // optional; [3/4] [2 1/2] [6] typeset as math
 *   unitScale: 150,          // px per side of the unit square
 *   shadeColor, overlapColor, captionFontSize, labelFontSize,
 * }
 */
export class omdFractionAreaModel extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdFractionAreaModel";

        this.left = { n: 1, d: 4 };
        this.right = { n: 1, d: 3 };
        this.stepIndex = 3;
        this.captions = null;
        this.unitScale = 150;
        this.panelGap = 40;
        this.padding = 8;

        this.shadeColor = "#7FCFEA";        // omdAreaDiagram's default shade
        this.overlapColor = "#0096C7";
        this.emptyColor = "#FFFFFF";
        this.gridColor = "#111111";
        this.gridStrokeWidth = 2;
        this.partitionColor = "#111111";
        this.partitionStrokeWidth = 1.4;
        this.partitionDash = "5 5";
        this.braceColor = "#111111";
        this.labelFontSize = 15;
        this.captionFontSize = 17;
        this.captionColor = "#222222";
    }

    loadFromJSON(data)
    {
        if ( typeof data.left != "undefined" )
            this.left = parseUnitFraction(data.left, "left");

        if ( typeof data.right != "undefined" )
            this.right = parseUnitFraction(data.right, "right");

        if ( typeof data.stepIndex != "undefined" )
            this.stepIndex = Math.min(3, Math.max(1, Math.floor(Number(data.stepIndex) || 1)));

        if ( Array.isArray(data.captions) )
            this.captions = data.captions.map(caption => String(caption ?? ""));

        for ( const key of ["unitScale", "labelFontSize", "captionFontSize", "panelGap"] )
        {
            if ( typeof data[key] == "number" && data[key] > 0 )
                this[key] = data[key];
        }

        for ( const key of ["shadeColor", "overlapColor", "emptyColor", "gridColor", "partitionColor", "braceColor"] )
        {
            if ( typeof data[key] == "string" && data[key] !== "" )
                this[key] = data[key];
        }

        this.updateLayout();
    }

    /** Default captions; `captions` entries override them one by one. */
    getCaptions()
    {
        const a = this.left;
        const c = this.right;
        const product = { n: a.n * c.n, d: a.d * c.d };
        const reduced = makeRational(product.n, product.d);
        const aText = fractionMarkup(a);
        const cText = fractionMarkup(c);
        const productText = fractionMarkup(product)
            + (reduced.d !== product.d ? ` = ${formatRationalMarkup(reduced)}` : "");

        const defaults = [
            `${cText} of the whole`,
            `${aText} of ${cText}`,
            `${aText} of ${cText} is ${productText}`,
        ];
        return defaults.map((text, i) => (this.captions && this.captions[i] ? this.captions[i] : text));
    }

    nextStep()
    {
        if ( this.stepIndex >= 3 )
            return null;
        this.stepIndex += 1;
        this.updateLayout();
        return this.getCaptions()[this.stepIndex - 1];
    }

    getRevealedSteps()
    {
        return this.stepIndex;
    }

    updateLayout()
    {
        this.removeAllChildren();

        const U = this.unitScale;
        const braceDepth = 11;
        const braceGap = 7;
        const labelGap = 6;
        const captionGap = 18;

        // The "1" brace labels are the same on every panel.
        const labelW = textWidth("1", this.labelFontSize);
        const labelH = this.labelFontSize;
        const topMargin = labelH + labelGap + braceDepth + braceGap;
        const leftMargin = labelW + labelGap + braceDepth + braceGap;

        const captions = this.getCaptions().map(text => {
            const runs = parseFractionMarkup(text);
            const ext = extentOfItems(runs, this.captionFontSize);
            return { runs, width: measureItems(runs, this.captionFontSize), above: ext.above, height: ext.above + ext.below };
        });
        const captionH = captions.reduce((max, caption) => Math.max(max, caption.height), 0);

        let slotX = this.padding;
        const originY = this.padding + topMargin;

        for ( let stage = 1; stage <= 3; stage++ )
        {
            const caption = captions[stage - 1];
            // A caption wider than the square pushes the square right so the
            // caption still centers under it without crossing the left edge.
            const squareX = slotX + Math.max(leftMargin, (caption.width - U) / 2);
            const slotRight = Math.max(squareX + U, squareX + U / 2 + caption.width / 2);

            if ( stage <= this.stepIndex )
            {
                const panel = new jsvgGroup();
                panel.svgObject.setAttribute("data-step", String(stage));
                panel.svgObject.setAttribute("data-role", "fraction-area-panel");
                this._drawPanel(panel, stage, squareX, originY, { braceDepth, braceGap, labelGap });

                drawItems(panel, caption.runs, squareX + U / 2 - caption.width / 2, originY + U + captionGap + caption.above,
                    this.captionFontSize, { weight: 400, color: this.captionColor, fontFamily: OMD_MATH_FONT_FAMILY });
                this.addChild(panel);
            }

            slotX = slotRight + this.panelGap;
        }

        this.width = Math.ceil(slotX - this.panelGap + this.padding);
        this.height = Math.ceil(originY + U + captionGap + captionH + this.padding);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    _drawPanel(panel, stage, x, y, { braceDepth, braceGap, labelGap })
    {
        const U = this.unitScale;
        const { n: a, d: b } = this.left;
        const { n: c, d } = this.right;
        const shadedH = (c / d) * U;

        panel.addChild(makeRect(x, y, U, U, this.emptyColor));
        panel.addChild(makeRect(x, y, U, shadedH, this.shadeColor));
        if ( stage >= 2 )
            panel.addChild(makeRect(x, y, (a / b) * U, shadedH, this.overlapColor));

        // Row cuts (the quantity's denominator) run the full width.
        for ( let k = 1; k < d; k++ )
            panel.addChild(this._dashed(x, y + (k / d) * U, x + U, y + (k / d) * U));

        // Column cuts (the "of" fraction's denominator) first divide only the
        // shaded part, then extend across the whole to reveal the unit size.
        if ( stage >= 2 )
        {
            const bottom = stage === 2 ? y + shadedH : y + U;
            for ( let j = 1; j < b; j++ )
                panel.addChild(this._dashed(x + (j / b) * U, y, x + (j / b) * U, bottom));
        }

        const border = makeRect(x, y, U, U, "none");
        border.setStrokeColor(this.gridColor);
        border.setStrokeWidth(this.gridStrokeWidth);
        panel.addChild(border);

        // "1" braces: right-to-left endpoints put the top tip above the square.
        const top = makeBrace(x + U, y - braceGap, x, y - braceGap, { depth: braceDepth, color: this.braceColor });
        panel.addChild(top.path);
        panel.addChild(this._label(top.tipX, top.tipY - labelGap - this.labelFontSize / 2));

        const side = makeBrace(x - braceGap, y, x - braceGap, y + U, { depth: braceDepth, color: this.braceColor });
        panel.addChild(side.path);
        panel.addChild(this._label(side.tipX - labelGap - textWidth("1", this.labelFontSize) / 2, side.tipY));
    }

    _label(cx, cy)
    {
        return makeText("1", cx, cy, this.labelFontSize, this.braceColor, 400, "center", OMD_MATH_FONT_FAMILY);
    }

    _dashed(x1, y1, x2, y2)
    {
        const line = new jsvgLine();
        line.setEndpoints(x1, y1, x2, y2);
        line.setStrokeColor(this.partitionColor);
        line.setStrokeWidth(this.partitionStrokeWidth);
        line.svgObject.setAttribute("stroke-dasharray", this.partitionDash);
        return line;
    }
}

/**
 * The model shows a part OF a unit square, so both factors must be fractions
 * from 0 to 1. Kept unreduced: 2/4 of the whole is drawn as 2 of 4 rows.
 */
function parseUnitFraction(value, name)
{
    const match = String(value ?? "").trim().match(/^(\d+)\s*\/\s*(\d+)$/);
    const n = match ? Number(match[1]) : NaN;
    const d = match ? Number(match[2]) : NaN;
    if ( !match || d === 0 || n > d )
        throw new Error(`omdFractionAreaModel: ${name} must be a fraction from 0 to 1 such as "3/4"; got ${JSON.stringify(value)}`);
    return { n, d };
}

function fractionMarkup(f)
{
    return `[${f.n}/${f.d}]`;
}

function makeRect(x, y, w, h, fill)
{
    const rect = new jsvgRect();
    rect.setPosition(x, y);
    rect.setWidthAndHeight(w, h);
    rect.setFillColor(fill);
    rect.setStrokeColor("none");
    return rect;
}
