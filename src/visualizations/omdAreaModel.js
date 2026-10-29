import { jsvgGroup, jsvgRect, jsvgLine } from "@teachinglab/jsvg";
import { OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { parseRational, ratAdd, ratMul, ratValue } from "./omdFraction.js";
import { parseFractionText, measureItems, extentOfItems, drawItems } from "./omdFractionTypeset.js";

/**
 * omdAreaModel — the partial-products area model teachers sketch: a
 * rectangle cut into pieces, side lengths written along the top and left,
 * each piece holding its product, and an optional sum line underneath.
 *
 * Unlike omdAreaDiagram it is not drawn on a unit grid, so it handles
 * mixed × mixed (2 1/4 × 3 2/3) and multi-digit whole numbers (213 × 12)
 * alike. Fractions anywhere in the labels are typeset stacked.
 *
 * JSON shape:
 * {
 *   omdType: 'areaModel',
 *   columns: ['3', '2/3'],            // side lengths across the top
 *   rows: ['2', '1/4'],               // side lengths down the left
 *   cells: [['6', '4/3'], ['3/4', '1/6']],  // optional; products are computed when omitted
 *   showSum: true,                    // "6 + 4/3 + 3/4 + 1/6 = 8 1/4"
 *   sumBy: 'cells' | 'rows',          // 'rows' adds each row first: "2,220 + 888 = 3,108"
 *   sum: '...',                       // explicit sum line, wins over the computed one
 *   toScale: false,                   // true sizes pieces by their side lengths
 *   lineStyle: 'solid' | 'dashed',    // the lines between pieces
 *   caption: 'not to scale',
 * }
 */

const BLUE = "#CFE0F1", YELLOW = "#EFE3B4", GREEN = "#DCEFD6", PINK = "#F2D4D4", PURPLE = "#E6DAF0", CYAN = "#D3ECF2";
// Two columns read as blue/yellow over green/pink; wider models give each
// row its own three-colour band so neighbours never repeat.
const TWO_COLUMN_COLORS = [[BLUE, YELLOW], [GREEN, PINK]];
const WIDE_COLORS = [[BLUE, YELLOW, GREEN], [PURPLE, PINK, CYAN]];

/** "2,000", "3 1/4", 6 → exact rational, or null when it is not a number. */
function parseAmount(value)
{
    if ( value === undefined || value === null ) return null;
    return parseRational(String(value).replace(/,/g, "").trim(), null);
}

/** Whole numbers get thousands separators; fractions stay improper or mixed. */
function formatAmount(r, { mixed })
{
    const sign = r.n < 0 ? "-" : "";
    const n = Math.abs(r.n);
    const whole = Math.floor(n / r.d);
    const rest = n - whole * r.d;
    const wholeText = whole.toLocaleString("en-US");

    if ( rest === 0 ) return `${sign}${wholeText}`;
    if ( !mixed || whole === 0 ) return `${sign}${n}/${r.d}`;
    return `${sign}${wholeText} ${rest}/${r.d}`;
}

export class omdAreaModel extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdAreaModel";

        this.columns = ["3", "2/3"];
        this.rows = ["2", "1/4"];
        this.cells = null;              // null = computed products
        this.showSum = false;
        this.sumBy = "cells";           // 'cells' | 'rows'
        this.sum = "";
        this.toScale = false;
        this.unitScale = 0;             // px per unit when toScale; 0 = fit cellWidth
        this.cellWidth = 190;           // widest column when not to scale
        this.cellHeight = 90;           // tallest row when not to scale
        this.lineStyle = "solid";       // 'solid' | 'dashed'
        this.lineDash = "7 6";
        this.cellColors = null;         // [[...], ...] per piece
        this.strokeColor = "#222222";
        this.strokeWidth = 2.5;
        this.fontSize = 20;
        this.labelFontSize = 20;
        this.textColor = "#222222";
        this.caption = "";
        this.captionColor = "#666666";
        this.padding = 8;

        this.updateLayout();
    }

    loadFromJSON(data)
    {
        if ( !data || typeof data !== "object" ) return;

        if ( Array.isArray(data.columns) ) this.columns = data.columns.map((value) => String(value ?? ""));
        if ( Array.isArray(data.rows) ) this.rows = data.rows.map((value) => String(value ?? ""));
        if ( data.cells !== undefined )
        {
            this.cells = Array.isArray(data.cells)
                ? data.cells.map((row) => (Array.isArray(row) ? row.map((value) => String(value ?? "")) : []))
                : null;
        }
        if ( Array.isArray(data.cellColors) || data.cellColors === null ) this.cellColors = data.cellColors;

        if ( data.showSum !== undefined ) this.showSum = data.showSum === true;
        if ( data.sumBy !== undefined ) this.sumBy = data.sumBy === "rows" ? "rows" : "cells";
        if ( data.sum !== undefined ) this.sum = String(data.sum ?? "");
        if ( data.toScale !== undefined ) this.toScale = data.toScale === true;
        if ( data.lineStyle !== undefined ) this.lineStyle = data.lineStyle === "dashed" ? "dashed" : "solid";
        if ( data.caption !== undefined ) this.caption = String(data.caption ?? "");

        for ( const key of ["unitScale", "cellWidth", "cellHeight", "strokeWidth", "fontSize", "labelFontSize", "padding"] )
        {
            if ( typeof data[key] === "number" && Number.isFinite(data[key]) && data[key] >= 0 )
                this[key] = data[key];
        }
        for ( const key of ["lineDash", "strokeColor", "textColor", "captionColor"] )
        {
            if ( typeof data[key] === "string" && data[key] !== "" )
                this[key] = data[key];
        }

        this.updateLayout();
    }

    /** Text in every piece: the given cells, else each computed product. */
    getCells()
    {
        return this.rows.map((rowLabel, r) => this.columns.map((columnLabel, c) => {
            const given = this.cells?.[r]?.[c];
            if ( given !== undefined ) return given;

            const a = parseAmount(rowLabel);
            const b = parseAmount(columnLabel);
            return a && b ? formatAmount(ratMul(a, b), { mixed: false }) : "";
        }));
    }

    /** The sum line: explicit `sum`, else the pieces (or row totals) added up. */
    getSumText()
    {
        if ( this.sum ) return this.sum;

        const cells = this.getCells();
        const values = cells.map((row) => row.map(parseAmount));
        if ( values.some((row) => row.some((value) => value === null)) ) return "";

        const add = (list) => list.reduce((total, value) => ratAdd(total, value), { n: 0, d: 1 });
        const total = add(values.flat());
        const terms = this.sumBy === "rows"
            ? values.map((row) => formatAmount(add(row), { mixed: false }))
            : cells.flat();

        return `${terms.join(" + ")} = ${formatAmount(total, { mixed: true })}`;
    }

    updateLayout()
    {
        this.removeAllChildren();

        const columnCount = this.columns.length;
        const rowCount = this.rows.length;
        if ( columnCount === 0 || rowCount === 0 )
        {
            this.width = 1;
            this.height = 1;
            this.svgObject.setAttribute("viewBox", "0 0 1 1");
            return;
        }

        const cells = this.getCells();
        const measure = (text, size) => {
            const runs = parseFractionText(text);
            const extent = extentOfItems(runs, size);
            return { runs, size, width: measureItems(runs, size), above: extent.above, below: extent.below };
        };

        const columnLabels = this.columns.map((text) => measure(text, this.labelFontSize));
        const rowLabels = this.rows.map((text) => measure(text, this.labelFontSize));
        const pieceText = cells.map((row) => row.map((text) => measure(text, this.fontSize)));

        const { columnWidths, rowHeights } = this._pieceSizes(columnLabels, pieceText);
        const gridW = columnWidths.reduce((a, b) => a + b, 0);
        const gridH = rowHeights.reduce((a, b) => a + b, 0);

        const labelGap = 18;
        const columnLabelH = columnLabels.reduce((max, label) => Math.max(max, label.above + label.below), 0);
        const rowLabelW = rowLabels.reduce((max, label) => Math.max(max, label.width), 0);
        const gridX = this.padding + rowLabelW + labelGap;
        const gridY = this.padding + columnLabelH + labelGap;

        const columnX = [gridX];
        columnWidths.forEach((width) => columnX.push(columnX[columnX.length - 1] + width));
        const rowY = [gridY];
        rowHeights.forEach((height) => rowY.push(rowY[rowY.length - 1] + height));

        // Pieces
        for ( let r = 0; r < rowCount; r++ )
        {
            for ( let c = 0; c < columnCount; c++ )
            {
                const rect = new jsvgRect();
                rect.setPosition(columnX[c], rowY[r]);
                rect.setWidthAndHeight(columnWidths[c], rowHeights[r]);
                rect.setFillColor(this._pieceColor(r, c, columnCount));
                rect.setStrokeWidth(0);
                this.addChild(rect);
            }
        }

        // Lines between pieces, then the outline over them.
        const addLine = (x1, y1, x2, y2) => {
            const line = new jsvgLine();
            line.setEndpoints(x1, y1, x2, y2);
            line.setStrokeColor(this.strokeColor);
            line.setStrokeWidth(this.strokeWidth);
            if ( this.lineStyle === "dashed" )
                line.svgObject.setAttribute("stroke-dasharray", this.lineDash);
            this.addChild(line);
        };
        for ( let c = 1; c < columnCount; c++ ) addLine(columnX[c], gridY, columnX[c], gridY + gridH);
        for ( let r = 1; r < rowCount; r++ ) addLine(gridX, rowY[r], gridX + gridW, rowY[r]);

        const border = new jsvgRect();
        border.setPosition(gridX, gridY);
        border.setWidthAndHeight(gridW, gridH);
        border.setFillColor("none");
        border.setStrokeColor(this.strokeColor);
        border.setStrokeWidth(this.strokeWidth);
        this.addChild(border);

        // Text: products centred in their pieces, sides centred on their edges.
        const draw = (label, x, axisY) => drawItems(this, label.runs, x, axisY, label.size,
            { color: this.textColor, weight: 400, fontFamily: OMD_MATH_FONT_FAMILY });
        const centerOn = (label, cx, cy) => draw(label, cx - label.width / 2, cy + (label.above - label.below) / 2);

        for ( let r = 0; r < rowCount; r++ )
        {
            for ( let c = 0; c < columnCount; c++ )
                centerOn(pieceText[r][c], columnX[c] + columnWidths[c] / 2, rowY[r] + rowHeights[r] / 2);
        }
        columnLabels.forEach((label, c) => draw(label, columnX[c] + columnWidths[c] / 2 - label.width / 2, gridY - labelGap - label.below));
        rowLabels.forEach((label, r) => centerOn(label, gridX - labelGap - label.width / 2, rowY[r] + rowHeights[r] / 2));

        // Sum line and caption, centred under the grid.
        let bottom = gridY + gridH;
        let right = gridX + gridW;
        let left = 0;
        const addTextLine = (text, size, color, gap) => {
            const label = measure(text, size);
            const x = gridX + gridW / 2 - label.width / 2;
            drawItems(this, label.runs, x, bottom + gap + label.above, size,
                { color, weight: 400, fontFamily: OMD_MATH_FONT_FAMILY });
            bottom += gap + label.above + label.below;
            left = Math.min(left, x - this.padding);
            right = Math.max(right, x + label.width);
        };

        const sumText = this.showSum ? this.getSumText() : "";
        if ( sumText ) addTextLine(sumText, this.fontSize, this.textColor, 18);
        if ( this.caption ) addTextLine(this.caption, Math.round(this.fontSize * 0.7), this.captionColor, 12);

        // A sum line wider than the grid would start left of zero.
        if ( left < 0 )
        {
            for ( const child of this.childList )
                child.setPosition((child.xpos || 0) - left, child.ypos || 0);
            right -= left;
        }

        this.width = Math.ceil(right + this.padding);
        this.height = Math.ceil(bottom + this.padding);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    /**
     * Not to scale: drawn the way teachers sketch it — a bigger side length
     * gets a bigger piece, but compressed so 2 next to 200 stays readable.
     * The largest column is cellWidth wide and the tallest row cellHeight
     * tall; every piece still grows to fit its text.
     * To scale: columns and rows share one px-per-unit.
     */
    _pieceSizes(columnLabels, pieceText)
    {
        const textPad = 24;
        const columnValues = this.columns.map((text) => ratValue(parseAmount(text)));
        const rowValues = this.rows.map((text) => ratValue(parseAmount(text)));
        const numeric = (values) => values.every((value) => value > 0);

        if ( this.toScale && numeric(columnValues) && numeric(rowValues) )
        {
            const columnTotal = columnValues.reduce((a, b) => a + b, 0);
            const unit = this.unitScale > 0 ? this.unitScale : (this.cellWidth * this.columns.length) / columnTotal;
            return {
                columnWidths: columnValues.map((value) => value * unit),
                rowHeights: rowValues.map((value) => value * unit),
            };
        }

        // Sketch sizing: the largest side gets the full size and the next ones
        // step down by rank (1, 0.63, 0.45, ...), so 3 | 2/3 and 200 | 20 | 2
        // read like a hand sketch; sides close in value (3 and 2 1/2) stay close
        // via the sqrt term. Non-numeric sides ("x") are all drawn full size.
        const sketchScale = (values) => {
            if ( !numeric(values) ) return values.map(() => 1);
            const largest = Math.max(...values);
            const distinct = [...new Set(values)].sort((a, b) => b - a);
            return values.map((value) => Math.max(
                Math.sqrt(value / largest),
                1 / (1 + 0.6 * distinct.indexOf(value)),
            ));
        };
        const columnScale = sketchScale(columnValues);
        const rowScale = sketchScale(rowValues);

        const columnWidths = this.columns.map((unused, c) => Math.max(
            this.cellWidth * columnScale[c],
            columnLabels[c].width + 12,
            ...pieceText.map((row) => row[c].width + textPad),
        ));
        const rowHeights = this.rows.map((unused, r) => Math.max(
            this.cellHeight * rowScale[r],
            ...pieceText[r].map((label) => label.above + label.below + textPad / 2),
        ));
        return { columnWidths, rowHeights };
    }

    _pieceColor(r, c, columnCount)
    {
        const given = this.cellColors?.[r]?.[c];
        if ( typeof given === "string" && given !== "" ) return given;
        const palette = columnCount <= 2 ? TWO_COLUMN_COLORS : WIDE_COLORS;
        const band = palette[r % palette.length];
        return band[c % band.length];
    }
}
