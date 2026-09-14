
import { omdColor } from "../omdConstants.js";
import { jsvgGroup, jsvgLine, jsvgTextLine, jsvgEllipse } from "@teachinglab/jsvg";

/**
 * omdLinePlot — a dot plot (line plot) in the style of Grade 5 state tests:
 * a horizontal axis with labeled ticks and stacks of dots above values.
 * Matches NYST 2025 Q43 ("the results are recorded in the line plot shown").
 *
 * Tick labels render as trimmed decimals or stacked fractions — values whose
 * exact form is a fraction over 2, 3, 4, or 8 display as n/d, everything else
 * as a decimal. Mixed numbers stay decimal on the axis.
 *
 * JSON shape:
 * {
 *   omdType: 'linePlot',
 *   min: 1, max: 3, step: 0.25,        // axis range + tick interval
 *   values: [1.5, 1.5, 1.75, 2.25],    // one entry per observation
 *   title: 'Paper airplane flight distances (yards)',
 *   fontSize: 15,
 *   width: 520,
 *   dotRadius: 6,
 * }
 */
export class omdLinePlot extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdLinePlot";

        this.min = 0;
        this.max = 10;
        this.step = 1;
        this.values = [];
        this.title = "";
        this.axisLabel = "";
        this.marker = "x";              // 'x' (state-test style) or 'dot'
        this.fontSize = 15;
        this.width = 520;
        this.dotRadius = 6;
        this.axisColor = "#333333";
        this.tickColor = "#555555";
        this.dotColor = omdColor.blue;
        this.markColor = "#1B4965";

        this._measureContext = null;
    }

    loadFromJSON(data)
    {
        if ( typeof data.min == "number" )
            this.min = data.min;

        if ( typeof data.max == "number" )
            this.max = data.max;

        if ( typeof data.step == "number" && data.step > 0 )
            this.step = data.step;

        if ( Array.isArray(data.values) )
            this.values = data.values.map(Number);

        if ( typeof data.title != "undefined" )
            this.title = String(data.title);

        if ( typeof data.fontSize == "number" )
            this.fontSize = data.fontSize;

        if ( typeof data.width == "number" )
            this.width = Math.max(200, data.width);

        if ( typeof data.dotRadius == "number" )
            this.dotRadius = Math.max(2, data.dotRadius);


        if ( typeof data.axisLabel != "undefined" )
            this.axisLabel = String(data.axisLabel);

        if ( data.marker === "x" || data.marker === "dot" )
            this.marker = data.marker;

        this.updateLayout();
    }

    _getMeasureContext()
    {
        if ( typeof document == "undefined" )
            return null;
        if ( !this._measureContext )
        {
            const canvas = document.createElement("canvas");
            this._measureContext = canvas.getContext("2d");
        }
        return this._measureContext;
    }

    _measureText(text, fontSize)
    {
        const context = this._getMeasureContext();
        if ( !context )
            return String(text || "").length * fontSize * 0.58;
        context.font = `400 ${fontSize}px Albert Sans, Arial, sans-serif`;
        return context.measureText(String(text || "")).width;
    }

    /**
     * Buckets observed values onto tick indices so near-tick floats still
     * stack on their intended column. Off-axis values are ignored.
     */
    _countStacks()
    {
        const counts = new Map();   // tick index -> count
        for ( const value of this.values )
        {
            const index = Math.round((value - this.min) / this.step);
            const snapped = this.min + index * this.step;
            if ( snapped < this.min - this.step / 2 || snapped > this.max + this.step / 2 || index < 0 )
                continue;
            counts.set(index, (counts.get(index) || 0) + 1);
        }
        return counts;
    }

    updateLayout()
    {
        this.removeAllChildren();

        const fontSize = this.fontSize;
        const family = "Albert Sans, Arial, sans-serif";
        const padX = 36;                          // room for edge tick labels
        const titleSize = Math.round(fontSize * 0.82);
        const titleH = this.title ? titleSize * 2.2 : fontSize * 0.6;
        const dotDiameter = this.dotRadius * 2;
        const dotGap = this.dotRadius * 0.8;

        // Tallest stack governs how much room the dots need above the axis.
        let maxCount = 0;
        for ( const count of this._countStacks().values() )
            maxCount = Math.max(maxCount, count);
        if ( maxCount === 0 )
            maxCount = 1;

        const labelZoneH = fracLabelHeight(fontSize);   // fractions are taller than plain labels
        const axisY = titleH + maxCount * (dotDiameter + dotGap) + this.dotRadius + 14;

        // Title.
        if ( this.title )
        {
            const title = makeLabel(this.title, "center", titleSize, "#444444", 600);
            title.setPosition(this.width / 2, titleH / 2);
            title.svgObject.setAttribute("dominant-baseline", "central");
            this.addChild(title);
        }

        // Axis with slight overhang past the end ticks.
        const innerWidth = this.width - padX * 2;
        const tickCount = Math.max(1, Math.round((this.max - this.min) / this.step));
        const xForIndex = index => padX + (innerWidth * index) / tickCount;

        const axis = new jsvgLine();
        axis.setStrokeColor(this.axisColor);
        axis.setStrokeWidth(2);
        axis.setEndpoints(padX - 12, axisY, this.width - padX + 12, axisY);
        this.addChild(axis);

        // Marks stack upward from just above the axis. jsvgEllipse positions by
        // CENTER, so cx is used directly — no radius offset.
        const markSize = this.dotRadius * 2;
        for ( const [index, count] of this._countStacks().entries() )
        {
            const cx = xForIndex(index);
            for ( let k = 0; k < count; k++ )
            {
                const cy = axisY - 10 - k * (markSize + dotGap) - markSize / 2;

                if ( this.marker === "dot" )
                {
                    const dot = new jsvgEllipse();
                    dot.setWidthAndHeight(markSize, markSize);
                    dot.setFillColor(this.dotColor);
                    dot.setStrokeColor("#FFFFFF");
                    dot.setStrokeWidth(1.5);
                    dot.setPosition(cx, cy);
                    const value = this.min + index * ((this.max - this.min) / Math.max(1, Math.round((this.max - this.min) / this.step)));
                    dot.svgObject.setAttribute('data-value', String(value));
                    dot.svgObject.setAttribute('data-tick', String(index));
                    this.addChild(dot);
                    continue;
                }

                // State-test style: an X built from two crossing strokes, wrapped
                // in a group so the playground can hit-test and drag the whole mark.
                const group = new jsvgGroup();
                const value = this.min + index * ((this.max - this.min) / Math.max(1, Math.round((this.max - this.min) / this.step)));
                group.svgObject.setAttribute('data-value', String(value));
                group.svgObject.setAttribute('data-tick', String(index));
                const half = markSize * 0.38;
                for ( const [sx, sy, ex, ey] of [
                    [cx - half, cy - half, cx + half, cy + half],
                    [cx - half, cy + half, cx + half, cy - half],
                ] )
                {
                    const stroke = new jsvgLine();
                    stroke.setStrokeColor(this.markColor);
                    stroke.setStrokeWidth(Math.max(1.6, this.dotRadius * 0.34));
                    stroke.setEndpoints(sx, sy, ex, ey);
                    group.addChild(stroke);
                }
                // larger invisible hit area for easier grabbing
                const hit = new jsvgEllipse();
                hit.setWidthAndHeight(markSize * 1.6, markSize * 1.6);
                hit.setFillColor('transparent');
                hit.setStrokeColor('transparent');
                hit.setPosition(cx, cy);
                group.addChild(hit);
                this.addChild(group);
            }
        }

        // Ticks + labels below the axis.
        for ( let i = 0; i <= tickCount; i++ )
        {
            const x = xForIndex(i);

            const tick = new jsvgLine();
            tick.setStrokeColor(this.axisColor);
            tick.setStrokeWidth(1.5);
            tick.setEndpoints(x, axisY - 6, x, axisY + 6);
            this.addChild(tick);

            addTickLabel(this, x, axisY, formatTick(this.min + i * this.step), fontSize, family);
        }

        let bottom = axisY + 10 + labelZoneH;

        if ( this.axisLabel )
        {
            const caption = makeLabel(this.axisLabel, "center", Math.round(fontSize * 0.85), "#444444", 600);
            caption.setPosition(this.width / 2, bottom + fontSize * 0.5);
            caption.svgObject.setAttribute("dominant-baseline", "central");
            this.addChild(caption);
            bottom += fontSize * 1.3;
        }

        this.height = Math.ceil(bottom + 4);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }
}

/* ------------------------------------------------------------------ */

function makeLabel(text, align, fontSize, color, weight)
{
    const label = new jsvgTextLine();
    label.setAlignment(align === "center" ? "center" : (align === "right" ? "right" : "left"));
    label.setFontFamily("Albert Sans, Arial, sans-serif");
    label.setFontSize(fontSize);
    label.setFontColor(color);
    label.setFontWeight(weight);
    label.setText(text);
    return label;
}

function fracLabelHeight(fontSize)
{
    // Stacked fraction zone: two small digits + gap + rule, with margin.
    return fontSize * 0.72 * 2.6 + fontSize * 0.3;
}

/**
 * Adds one tick label below the axis at (x, axisY).
 */
function addTickLabel(plot, x, axisY, spec, fontSize, family)
{
    if ( !spec.fraction )
    {
        const label = makeLabel(spec.text, "center", fontSize, plot.tickColor, 400);
        label.setPosition(x, axisY + 12 + fontSize * 0.72);
        label.svgObject.setAttribute("dominant-baseline", "central");
        plot.addChild(label);
        return;
    }

    // Stacked fraction (optionally preceded by a whole number), centered under
    // the tick — the notation used on state-test line plots.
    const group = new jsvgGroup();
    const fracSize = fontSize * 0.72;
    const digitW = Math.max(simpleWidth(spec.numerator, fracSize), simpleWidth(spec.denominator, fracSize));
    const barLength = digitW + fontSize * 0.16;
    const wholeW = spec.whole ? simpleWidth(spec.whole, fontSize) + fontSize * 0.1 : 0;
    const totalW = wholeW + barLength + fontSize * 0.08;
    const strokeW = Math.max(1.2, fontSize * 0.05);
    const inkH = fracSize * 1.02;
    const gap = fontSize * 0.13;
    const barY = axisY + 12 + inkH / 2 + gap + strokeW / 2;
    const cx = wholeW + barLength / 2 + fontSize * 0.04;

    if ( spec.whole )
    {
        const wholeLabel = makeLabel(String(spec.whole), "center", fontSize, plot.tickColor, 400);
        wholeLabel.setPosition(wholeW / 2, barY);
        wholeLabel.svgObject.setAttribute("dominant-baseline", "central");
        group.addChild(wholeLabel);
    }

    const numLabel = makeLabel(String(spec.numerator), "center", fracSize, plot.tickColor, 400);
    numLabel.setPosition(cx, barY - strokeW / 2 - gap - inkH / 2);
    numLabel.svgObject.setAttribute("dominant-baseline", "central");
    group.addChild(numLabel);

    const denLabel = makeLabel(String(spec.denominator), "center", fracSize, plot.tickColor, 400);
    denLabel.setPosition(cx, barY + strokeW / 2 + gap + inkH / 2);
    denLabel.svgObject.setAttribute("dominant-baseline", "central");
    group.addChild(denLabel);

    const bar = new jsvgLine();
    bar.setStrokeColor(plot.tickColor);
    bar.setStrokeWidth(strokeW);
    bar.setEndpoints(cx - barLength / 2, barY, cx + barLength / 2, barY);
    group.addChild(bar);

    group.setPosition(x - totalW / 2, 0);
    plot.addChild(group);
}

function simpleWidth(text, fontSize)
{
    return String(text).length * fontSize * 0.58;
}

/**
 * Chooses a tick's display form. Values that are exact halves, quarters,
 * eighths, or thirds render as fractions — including MIXED numbers
 * (e.g. 9¼), matching how state-test line plots label fractional axes.
 * Anything else falls back to a trimmed decimal.
 */
function formatTick(value)
{
    const EPSILON = 1e-9;

    if ( Math.abs(value - Math.round(value)) < EPSILON )
        return { text: String(Math.round(value)), fraction: false };

    const whole = Math.floor(value);
    const remainder = value - whole;

    for ( const denominator of [2, 4, 8, 3] )
    {
        const scaled = remainder * denominator;
        const rounded = Math.round(scaled);
        if ( Math.abs(scaled - rounded) > EPSILON || rounded <= 0 )
            continue;

        const divisor = gcdOf(rounded, denominator);
        return {
            whole: whole > 0 ? String(whole) : "",
            numerator: rounded / divisor,
            denominator: denominator / divisor,
            fraction: true,
        };
    }

    return { text: trimNumber(value), fraction: false };
}

function trimNumber(value)
{
    return String(Math.round(value * 1000) / 1000);
}

function gcdOf(a, b)
{
    a = Math.abs(a);
    b = Math.abs(b);
    while ( b ) { [a, b] = [b, a % b]; }
    return a || 1;
}
