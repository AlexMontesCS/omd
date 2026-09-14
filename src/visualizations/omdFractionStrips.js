/**
 * omdFractionStrips — the equal-sharing strip diagram used all through
 * Grade 5 Unit 2 Sections A and B.
 *
 * Three sandwiches shared by five people is drawn as three whole strips, each
 * partitioned into fifths, with one fifth of each strip shaded: the shaded
 * parts are one person's share, 3 x 1/5 = 3/5 = 3 / 5.
 *
 *   { strips: 3, parts: 5, shaded: 1, brace: '1' }
 *
 * Vertical orientation with a separator renders the chocolate-bar model
 * (four bars of fifths, three fifths eaten from each).
 *
 * State leaves through `onChange(payload)` and the DOM event
 * `omd-fractionstrips-change`.
 */

import { jsvgGroup, jsvgRect, jsvgLine } from "@teachinglab/jsvg";
import { makeBrace, makeMathLabel, centerMathLabel } from "./omdBrace.js";
import { makeRational, ratMul, formatRationalMarkup, formatRationalText } from "./omdFraction.js";

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

export class omdFractionStrips extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdFractionStrips";

        this.strips = 3;
        this.parts = 5;
        this.shaded = 1;                 // shaded parts per strip
        this.shadedList = null;          // per-strip override
        this.orientation = "horizontal";
        this.fillFrom = "start";         // 'start' | 'end'

        this.stripLength = 420;          // px along the partitioned axis
        this.stripThickness = 46;
        this.gap = 14;

        this.shadeColor = "#7FCFEA";
        this.emptyColor = "#FFFFFF";
        this.strokeColor = "#111111";
        this.strokeWidth = 2.5;
        this.dividerColor = "#111111";
        this.dividerWidth = 1.8;
        this.dividerDash = "6 5";
        this.cornerRadius = 3;

        this.brace = "1";                // label under the whole; false to hide
        this.braceEvery = false;
        this.stripLabels = [];
        this.separator = "";             // e.g. '+' between strips
        this.labelFontSize = 17;
        this.title = "";
        this.expressionLine = false;

        this.interactive = false;
        this.onChange = null;

        this._shadedCells = null;
        this._shadeLayer = null;
        this._metrics = null;

        this.updateLayout();
    }

    loadFromJSON(data)
    {
        if ( !data || typeof data !== "object" ) return;

        if ( data.strips !== undefined ) this.strips = positiveInteger(data.strips, this.strips);
        if ( data.parts !== undefined ) this.parts = positiveInteger(data.parts, this.parts);
        if ( data.shaded !== undefined ) this.shaded = nonNegativeInteger(data.shaded, this.shaded);
        if ( Array.isArray(data.shadedList) ) this.shadedList = data.shadedList.map((v) => nonNegativeInteger(v, 0));

        if ( data.orientation !== undefined )
            this.orientation = data.orientation === "vertical" ? "vertical" : "horizontal";
        if ( data.fillFrom !== undefined ) this.fillFrom = data.fillFrom === "end" ? "end" : "start";

        if ( data.stripLength !== undefined ) this.stripLength = positiveNumber(data.stripLength, this.stripLength);
        if ( data.stripThickness !== undefined ) this.stripThickness = positiveNumber(data.stripThickness, this.stripThickness);
        if ( data.gap !== undefined ) this.gap = positiveNumber(data.gap, this.gap);

        if ( data.shadeColor !== undefined ) this.shadeColor = optionalText(data.shadeColor, this.shadeColor);
        if ( data.emptyColor !== undefined ) this.emptyColor = optionalText(data.emptyColor, this.emptyColor);
        if ( data.strokeColor !== undefined ) this.strokeColor = optionalText(data.strokeColor, this.strokeColor);
        if ( data.strokeWidth !== undefined ) this.strokeWidth = positiveNumber(data.strokeWidth, this.strokeWidth);
        if ( data.dividerColor !== undefined ) this.dividerColor = optionalText(data.dividerColor, this.dividerColor);
        if ( data.dividerWidth !== undefined ) this.dividerWidth = positiveNumber(data.dividerWidth, this.dividerWidth);
        if ( data.dividerDash !== undefined ) this.dividerDash = optionalText(data.dividerDash, this.dividerDash);
        if ( data.cornerRadius !== undefined ) this.cornerRadius = Number(data.cornerRadius) || 0;

        if ( data.brace !== undefined ) this.brace = data.brace === false ? false : String(data.brace);
        if ( data.braceEvery !== undefined ) this.braceEvery = coerceBoolean(data.braceEvery, this.braceEvery);
        if ( Array.isArray(data.stripLabels) ) this.stripLabels = data.stripLabels.slice();
        if ( data.separator !== undefined ) this.separator = String(data.separator ?? "");
        if ( data.labelFontSize !== undefined ) this.labelFontSize = positiveNumber(data.labelFontSize, this.labelFontSize);
        if ( data.title !== undefined ) this.title = String(data.title ?? "");
        if ( data.expressionLine !== undefined ) this.expressionLine = coerceBoolean(data.expressionLine, this.expressionLine);

        if ( data.interactive !== undefined ) this.interactive = coerceBoolean(data.interactive, this.interactive);
        if ( typeof data.onChange === "function" ) this.onChange = data.onChange;

        if ( Array.isArray(data.shadedCells) )
            this._shadedCells = new Set(data.shadedCells.map((cell) =>
                Array.isArray(cell) ? `${cell[0]},${cell[1]}` : String(cell)));
        else
            this._shadedCells = null;   // rebuilt from `shaded` / `shadedList`

        this.updateLayout();
    }

    /* ================= state ================= */

    _shadedCountFor(stripIndex)
    {
        if ( Array.isArray(this.shadedList) )
            return Math.min(this.parts, this.shadedList[stripIndex] ?? 0);
        return Math.min(this.parts, this.shaded);
    }

    _ensureCellSet()
    {
        if ( this._shadedCells ) return this._shadedCells;

        const cells = new Set();
        for ( let s = 0; s < this.strips; s++ )
        {
            const count = this._shadedCountFor(s);
            for ( let k = 0; k < count; k++ )
            {
                const index = this.fillFrom === "end" ? this.parts - 1 - k : k;
                cells.add(`${s},${index}`);
            }
        }
        this._shadedCells = cells;
        return cells;
    }

    /** Total shaded amount in wholes, exact and reduced. */
    getTotal()
    {
        return makeRational(this._ensureCellSet().size, this.parts);
    }

    /**
     * Total as the diagram literally reads it: shaded parts over partitions,
     * unreduced. 10 shaded sixths displays as 10/6, not 5/3.
     */
    getTotalAsDrawn()
    {
        return { n: this._ensureCellSet().size, d: this.parts };
    }

    /** Amount shaded on a single strip, as drawn. */
    getPerStrip()
    {
        return { n: this._shadedCountFor(0), d: this.parts };
    }

    getState()
    {
        const total = this.getTotal();
        return {
            strips: this.strips,
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
        this._redrawShading();
        if ( emit ) this._emit("cells");
    }

    clearShading(emit = true)
    {
        this._shadedCells = new Set();
        this._redrawShading();
        if ( emit ) this._emit("clear");
    }

    /* ================= layout ================= */

    updateLayout()
    {
        this.removeAllChildren();

        const horizontal = this.orientation === "horizontal";
        const partLength = this.stripLength / this.parts;
        const braceDepth = 11;
        const braceGap = 8;
        const labelGap = 6;

        const stripW = horizontal ? this.stripLength : this.stripThickness;
        const stripH = horizontal ? this.stripThickness : this.stripLength;

        const separatorLabels = [];
        let separatorWidth = 0;
        if ( this.separator && !horizontal )
        {
            for ( let i = 0; i < this.strips - 1; i++ )
            {
                const label = makeMathLabel(this.separator, { fontSize: this.labelFontSize + 4 });
                separatorLabels.push(label);
                separatorWidth = Math.max(separatorWidth, label.width);
            }
        }

        const step = horizontal
            ? stripH + this.gap
            : stripW + this.gap + (separatorWidth ? separatorWidth + this.gap : 0);

        const titleHeight = this.title ? this.labelFontSize + 16 : 0;
        const originX = 4;
        const originY = titleHeight;

        if ( this.title )
        {
            const titleLabel = makeMathLabel(this.title, { fontSize: this.labelFontSize });
            titleLabel.setPosition(originX, 0);
            this.addChild(titleLabel);
        }

        const content = new jsvgGroup();
        content.setPosition(originX, originY);
        this.addChild(content);

        this._shadeLayer = new jsvgGroup();
        this._metrics = { horizontal, partLength, stripW, stripH, step, originX, originY };

        // Shade layer sits under the rules so dividers stay legible.
        content.addChild(this._shadeLayer);
        this._drawShading();

        const stripLabels = [];

        for ( let s = 0; s < this.strips; s++ )
        {
            const { x, y } = this._stripOrigin(s);

            for ( let k = 1; k < this.parts; k++ )
            {
                const divider = new jsvgLine();
                if ( horizontal )
                {
                    const dx = x + k * partLength;
                    divider.setEndpoints(dx, y, dx, y + stripH);
                }
                else
                {
                    const dy = y + k * partLength;
                    divider.setEndpoints(x, dy, x + stripW, dy);
                }
                divider.setStrokeColor(this.dividerColor);
                divider.setStrokeWidth(this.dividerWidth);
                if ( this.dividerDash !== "none" )
                    divider.svgObject.setAttribute("stroke-dasharray", this.dividerDash);
                content.addChild(divider);
            }

            const border = new jsvgRect();
            border.setWidthAndHeight(stripW, stripH);
            border.setFillColor("none");
            border.setStrokeColor(this.strokeColor);
            border.setStrokeWidth(this.strokeWidth);
            if ( this.cornerRadius ) border.setCornerRadius(this.cornerRadius);
            border.setPosition(x, y);
            content.addChild(border);

            if ( this.stripLabels[s] )
            {
                const label = makeMathLabel(String(this.stripLabels[s]), { fontSize: this.labelFontSize - 2 });
                centerMathLabel(label, x + stripW / 2, y + stripH + 16);
                content.addChild(label);
                stripLabels.push(label);
            }
        }

        if ( !horizontal && separatorLabels.length )
        {
            for ( let i = 0; i < separatorLabels.length; i++ )
            {
                const left = this._stripOrigin(i);
                centerMathLabel(separatorLabels[i], left.x + stripW + this.gap + separatorWidth / 2, left.y + stripH / 2);
                content.addChild(separatorLabels[i]);
            }
        }

        // Braces: one under the last strip by default, or one under each.
        let braceBottom = 0;
        if ( this.brace !== false )
        {
            const targets = this.braceEvery
                ? Array.from({ length: this.strips }, (unused, index) => index)
                : [this.strips - 1];

            for ( const index of targets )
            {
                const { x, y } = this._stripOrigin(index);
                const braceY = y + stripH + braceGap;
                const brace = makeBrace(x, braceY, x + stripW, braceY, { depth: braceDepth, color: this.strokeColor });
                content.addChild(brace.path);

                const label = makeMathLabel(String(this.brace), { fontSize: this.labelFontSize });
                centerMathLabel(label, brace.tipX, brace.tipY + labelGap + label.height / 2);
                content.addChild(label);

                braceBottom = Math.max(braceBottom, brace.tipY + labelGap + label.height);
            }
        }

        const lastStrip = this._stripOrigin(this.strips - 1);
        let contentBottom = Math.max(
            lastStrip.y + stripH,
            braceBottom,
            stripLabels.reduce((max, label) => Math.max(max, label.ypos + label.height), 0),
        );

        let bottomY = originY + contentBottom;

        if ( this.expressionLine )
        {
            const perStrip = this.getPerStrip();
            const total = this.getTotalAsDrawn();
            const markup = `${this.strips} \u00d7 ${formatRationalMarkup(perStrip, { mixed: false })} = ` +
                `${formatRationalMarkup(total, { mixed: false })}`;
            const line = makeMathLabel(markup, { fontSize: this.labelFontSize });
            line.setPosition(originX, bottomY + 14);
            this.addChild(line);
            bottomY += 14 + line.height;
        }

        if ( this.interactive ) this._installInteraction(content);

        const rightExtent = horizontal
            ? originX + stripW
            : originX + this._stripOrigin(this.strips - 1).x + stripW;

        this.width = Math.ceil(rightExtent + 8);
        this.height = Math.ceil(bottomY + 8);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    _stripOrigin(index)
    {
        const { horizontal, step } = this._metrics;
        return horizontal ? { x: 0, y: index * step } : { x: index * step, y: 0 };
    }

    _drawShading()
    {
        const layer = this._shadeLayer;
        if ( !layer ) return;
        layer.removeAllChildren();

        const { horizontal, partLength, stripW, stripH } = this._metrics;

        for ( const key of this._ensureCellSet() )
        {
            const [s, k] = key.split(",").map(Number);
            if ( !(s >= 0 && s < this.strips && k >= 0 && k < this.parts) ) continue;

            const { x, y } = this._stripOrigin(s);
            const rect = new jsvgRect();

            if ( horizontal )
            {
                rect.setWidthAndHeight(partLength, stripH);
                rect.setPosition(x + k * partLength, y);
            }
            else
            {
                rect.setWidthAndHeight(stripW, partLength);
                rect.setPosition(x, y + k * partLength);
            }

            rect.setFillColor(this.shadeColor);
            rect.setStrokeWidth(0);
            layer.addChild(rect);
        }
    }

    _redrawShading()
    {
        this._drawShading();
    }

    /* ================= interaction ================= */

    _clientToLocalSvgPoint(host, clientX, clientY)
    {
        const ownerSvg = this.svgObject.ownerSVGElement || this.svgObject;
        if ( typeof ownerSvg.createSVGPoint !== "function" ) return { x: clientX, y: clientY };

        const matrix = host.svgObject?.getScreenCTM?.();
        if ( !matrix ) return { x: clientX, y: clientY };

        const point = ownerSvg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        return point.matrixTransform(matrix.inverse());
    }

    _cellAt(localX, localY)
    {
        const { horizontal, partLength, stripW, stripH } = this._metrics;

        for ( let s = 0; s < this.strips; s++ )
        {
            const { x, y } = this._stripOrigin(s);
            if ( localX < x || localX > x + stripW || localY < y || localY > y + stripH ) continue;

            const offset = horizontal ? localX - x : localY - y;
            const k = Math.floor(offset / partLength);
            if ( k < 0 || k >= this.parts ) return null;
            return `${s},${k}`;
        }
        return null;
    }

    _installInteraction(content)
    {
        const { horizontal, stripW, stripH, step } = this._metrics;
        const spanW = horizontal ? stripW : (this.strips - 1) * step + stripW;
        const spanH = horizontal ? (this.strips - 1) * step + stripH : stripH;

        const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hit.setAttribute("x", "0");
        hit.setAttribute("y", "0");
        hit.setAttribute("width", String(spanW));
        hit.setAttribute("height", String(spanH));
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("data-omd-strip-hit", "1");
        hit.style.cursor = "pointer";
        hit.style.touchAction = "none";
        content.svgObject.appendChild(hit);

        let painting = false;
        let paintValue = true;

        const applyAt = (clientX, clientY) => {
            const local = this._clientToLocalSvgPoint(content, clientX, clientY);
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

            const local = this._clientToLocalSvgPoint(content, event.clientX, event.clientY);
            const key = this._cellAt(local.x, local.y);
            if ( !key ) return;

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
            this._emit("paint");
        };

        hit.addEventListener("pointerup", stop);
        hit.addEventListener("pointercancel", stop);
    }

    _emit(type, detail = {})
    {
        const payload = { type, ...this.getState(), ...detail };

        if ( typeof this.onChange === "function" ) this.onChange(payload);

        if ( typeof CustomEvent !== "undefined" &&
             this.svgObject &&
             typeof this.svgObject.dispatchEvent === "function" )
        {
            this.svgObject.dispatchEvent(new CustomEvent("omd-fractionstrips-change", {
                bubbles: true,
                detail: payload,
            }));
        }
    }
}
