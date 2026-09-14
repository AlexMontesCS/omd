/**
 * omdFractionCircle — one or more circles cut into equal wedges with some
 * wedges shaded.
 *
 * Unit 2 Lesson 10 asks which expression matches a model of two circles in
 * sixths with five sixths shaded on each: 2 x 5/6.
 *
 *   { count: 2, parts: 6, shaded: 5 }
 *
 * Clicking a wedge toggles it when `interactive` is set; state leaves through
 * `onChange(payload)` and the DOM event `omd-fractioncircle-change`.
 */

import { jsvgGroup, jsvgPath, jsvgEllipse } from "@teachinglab/jsvg";
import { makeMathLabel, centerMathLabel } from "./omdBrace.js";
import { makeRational, formatRationalMarkup, formatRationalText } from "./omdFraction.js";

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

function nonNegativeInteger(value, fallback)
{
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
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

export class omdFractionCircle extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdFractionCircle";

        this.count = 2;
        this.parts = 6;
        this.shaded = 5;
        this.shadedList = null;

        this.radius = 74;
        this.gap = 26;
        this.startAngle = -90;           // degrees; -90 puts the first cut at 12 o'clock

        this.shadeColor = "#FFD84D";
        this.emptyColor = "#FFFFFF";
        this.strokeColor = "#111111";
        this.strokeWidth = 2.5;

        this.labelFontSize = 17;
        this.title = "";
        this.circleLabels = [];
        this.expressionLine = false;

        this.interactive = false;
        this.onChange = null;

        this._shadedCells = null;
        this._wedgeLayer = null;

        this.updateLayout();
    }

    loadFromJSON(data)
    {
        if ( !data || typeof data !== "object" ) return;

        if ( data.count !== undefined ) this.count = positiveInteger(data.count, this.count);
        if ( data.circles !== undefined ) this.count = positiveInteger(data.circles, this.count);
        if ( data.parts !== undefined ) this.parts = positiveInteger(data.parts, this.parts);
        if ( data.shaded !== undefined ) this.shaded = nonNegativeInteger(data.shaded, this.shaded);
        if ( Array.isArray(data.shadedList) ) this.shadedList = data.shadedList.map((v) => nonNegativeInteger(v, 0));

        if ( data.radius !== undefined ) this.radius = positiveNumber(data.radius, this.radius);
        if ( data.gap !== undefined ) this.gap = positiveNumber(data.gap, this.gap);
        if ( data.startAngle !== undefined && Number.isFinite(Number(data.startAngle)) )
            this.startAngle = Number(data.startAngle);

        if ( data.shadeColor !== undefined ) this.shadeColor = optionalText(data.shadeColor, this.shadeColor);
        if ( data.emptyColor !== undefined ) this.emptyColor = optionalText(data.emptyColor, this.emptyColor);
        if ( data.strokeColor !== undefined ) this.strokeColor = optionalText(data.strokeColor, this.strokeColor);
        if ( data.strokeWidth !== undefined ) this.strokeWidth = positiveNumber(data.strokeWidth, this.strokeWidth);

        if ( data.labelFontSize !== undefined ) this.labelFontSize = positiveNumber(data.labelFontSize, this.labelFontSize);
        if ( data.title !== undefined ) this.title = String(data.title ?? "");
        if ( Array.isArray(data.circleLabels) ) this.circleLabels = data.circleLabels.slice();
        if ( data.expressionLine !== undefined ) this.expressionLine = coerceBoolean(data.expressionLine, this.expressionLine);

        if ( data.interactive !== undefined ) this.interactive = coerceBoolean(data.interactive, this.interactive);
        if ( typeof data.onChange === "function" ) this.onChange = data.onChange;

        if ( Array.isArray(data.shadedCells) )
            this._shadedCells = new Set(data.shadedCells.map((cell) =>
                Array.isArray(cell) ? `${cell[0]},${cell[1]}` : String(cell)));
        else
            this._shadedCells = null;

        this.updateLayout();
    }

    _shadedCountFor(index)
    {
        if ( Array.isArray(this.shadedList) ) return Math.min(this.parts, this.shadedList[index] ?? 0);
        return Math.min(this.parts, this.shaded);
    }

    _ensureCellSet()
    {
        if ( this._shadedCells ) return this._shadedCells;

        const cells = new Set();
        for ( let c = 0; c < this.count; c++ )
        {
            const shadedCount = this._shadedCountFor(c);
            for ( let k = 0; k < shadedCount; k++ ) cells.add(`${c},${k}`);
        }
        this._shadedCells = cells;
        return cells;
    }

    /** Total shaded amount in wholes, exact and reduced. */
    getTotal()
    {
        return makeRational(this._ensureCellSet().size, this.parts);
    }

    /** Total as drawn: shaded wedges over wedges per circle, unreduced. */
    getTotalAsDrawn()
    {
        return { n: this._ensureCellSet().size, d: this.parts };
    }

    getState()
    {
        const total = this.getTotal();
        return {
            count: this.count,
            parts: this.parts,
            shadedCells: Array.from(this._ensureCellSet()),
            shadedCount: this._ensureCellSet().size,
            total: formatRationalText(total),
            totalValue: total.n / total.d,
            totalFraction: { n: total.n, d: total.d },
        };
    }

    setShadedCells(cells, emit = true)
    {
        this._shadedCells = new Set((cells || []).map((cell) =>
            Array.isArray(cell) ? `${cell[0]},${cell[1]}` : String(cell)));
        this.updateLayout();
        if ( emit ) this._emit("cells");
    }

    /* ================= layout ================= */

    _wedgePath(cx, cy, radius, index)
    {
        const sweep = 360 / this.parts;
        const a0 = (this.startAngle + index * sweep) * Math.PI / 180;
        const a1 = (this.startAngle + (index + 1) * sweep) * Math.PI / 180;

        const x0 = cx + radius * Math.cos(a0);
        const y0 = cy + radius * Math.sin(a0);
        const x1 = cx + radius * Math.cos(a1);
        const y1 = cy + radius * Math.sin(a1);
        const largeArc = sweep > 180 ? 1 : 0;

        if ( this.parts === 1 )
            return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}` +
                   ` A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy} Z`;

        return `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1} Z`;
    }

    updateLayout()
    {
        this.removeAllChildren();

        const radius = this.radius;
        const diameter = radius * 2;
        const step = diameter + this.gap;
        const titleHeight = this.title ? this.labelFontSize + 16 : 0;

        const originX = 4;
        const originY = titleHeight + 4;

        if ( this.title )
        {
            const titleLabel = makeMathLabel(this.title, { fontSize: this.labelFontSize });
            titleLabel.setPosition(originX, 0);
            this.addChild(titleLabel);
        }

        const content = new jsvgGroup();
        content.setPosition(originX, originY);
        this.addChild(content);
        this._wedgeLayer = content;

        const cells = this._ensureCellSet();
        let labelBottom = diameter;

        for ( let c = 0; c < this.count; c++ )
        {
            const cx = c * step + radius;
            const cy = radius;

            for ( let k = 0; k < this.parts; k++ )
            {
                const wedge = new jsvgPath();
                wedge.svgObject.setAttribute("d", this._wedgePath(cx, cy, radius, k));
                wedge.svgObject.setAttribute("fill", cells.has(`${c},${k}`) ? this.shadeColor : this.emptyColor);
                wedge.svgObject.setAttribute("data-omd-wedge", `${c},${k}`);
                wedge.setStrokeColor(this.strokeColor);
                wedge.setStrokeWidth(this.strokeWidth);
                content.addChild(wedge);

                if ( this.interactive )
                {
                    wedge.svgObject.style.cursor = "pointer";
                    wedge.svgObject.addEventListener("click", () => {
                        const key = `${c},${k}`;
                        const set = this._ensureCellSet();
                        if ( set.has(key) ) set.delete(key);
                        else set.add(key);
                        wedge.svgObject.setAttribute("fill", set.has(key) ? this.shadeColor : this.emptyColor);
                        this._emit("toggle", { cell: key });
                    });
                }
            }

            // Outline last so wedge seams never cut the rim.
            const rim = new jsvgEllipse();
            rim.setWidthAndHeight(diameter, diameter);
            rim.setPosition(cx, cy);
            rim.setFillColor("none");
            rim.setStrokeColor(this.strokeColor);
            rim.setStrokeWidth(this.strokeWidth);
            content.addChild(rim);

            if ( this.circleLabels[c] )
            {
                const label = makeMathLabel(String(this.circleLabels[c]), { fontSize: this.labelFontSize });
                centerMathLabel(label, cx, diameter + 18);
                content.addChild(label);
                labelBottom = Math.max(labelBottom, diameter + 18 + label.height / 2);
            }
        }

        let bottomY = originY + labelBottom;

        if ( this.expressionLine )
        {
            const perCircle = { n: this._shadedCountFor(0), d: this.parts };
            const markup = `${this.count} \u00d7 ${formatRationalMarkup(perCircle, { mixed: false })} = ` +
                `${formatRationalMarkup(this.getTotalAsDrawn(), { mixed: false })}`;
            const line = makeMathLabel(markup, { fontSize: this.labelFontSize });
            line.setPosition(originX, bottomY + 14);
            this.addChild(line);
            bottomY += 14 + line.height;
        }

        this.width = Math.ceil(originX + (this.count - 1) * step + diameter + 8);
        this.height = Math.ceil(bottomY + 8);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    _emit(type, detail = {})
    {
        const payload = { type, ...this.getState(), ...detail };

        if ( typeof this.onChange === "function" ) this.onChange(payload);

        if ( typeof CustomEvent !== "undefined" &&
             this.svgObject &&
             typeof this.svgObject.dispatchEvent === "function" )
        {
            this.svgObject.dispatchEvent(new CustomEvent("omd-fractioncircle-change", {
                bubbles: true,
                detail: payload,
            }));
        }
    }
}
