
import { omdColor, OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { jsvgGroup, jsvgLine, jsvgTextLine, jsvgRect } from "@teachinglab/jsvg";

/**
 * Digit cell kinds for the standard-algorithms grid.
 */
export const ALGORITHM_CELL = {
    GIVEN: "given",     // operand digit from the problem statement
    CARRY: "carry",     // small regrouped digit above the operands
    ANSWER: "answer",   // result digit(s); emphasized
    WORK: "work",       // intermediate result digit(s) (e.g. long-division subtractions)
    BLANK: "blank",
};

const CELL_KINDS = new Set(Object.values(ALGORITHM_CELL));

function clamp(value, min, max)
{
    return Math.min(max, Math.max(min, value));
}

/**
 * omdAlgorithmWork — renders the US standard algorithms for addition,
 * subtraction, multiplication, and division as a place-value aligned digit
 * grid, with progressive step disclosure via `stepIndex`.
 *
 * Every digit row may carry `step: n` — it stays hidden until `stepIndex`
 * reaches n. Rows without `step` are always visible. An optional steps list
 * (showStepsList) mirrors the revealed steps with descriptions, highlighting
 * the current one, so students see WHICH part connects to WHICH step.
 *
 * JSON shape:
 * {
 *   omdType: 'algorithmWork',
 *   operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
 *   columns: ['1000s','100s','10s','1s'],      // optional place-value headers
 *   divisor: '24',                             // division only
 *   rows: [
 *     { kind: 'carry'|'given'|'work'|'answer', cells: ['','5','6'], step?, annotation?,
 *       color?, fontSize? },
 *     { kind: 'rule', gapAfter? },
 *   ],
 *   steps: [{ label: 'Step 1', description: '...' }],
 *   stepIndex: number,        // how many steps are revealed (default: all)
 *   activeRow: number,        // row highlighted as "current" (default: none)
 *   showStepsList: boolean,
 *   fontSize, columnWidth, rowGap,
 * }
 */
export class omdAlgorithmWork extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdAlgorithmWork";

        this.operation = "addition";
        this.rows = [];
        this.columns = [];
        this.divisor = "";
        this.steps = [];
        this.stepIndex = Infinity;      // default: every stepped row revealed
        this.activeRow = -1;
        this.showStepsList = false;
        this.fontSize = 26;
        this.columnWidth = 32;
        this.rowGap = 4;
        this.padding = 14;
        this.fontFamily = OMD_MATH_FONT_FAMILY;

        // Palette follows omdConstants so visuals stay on-brand.
        this.ruleColor = omdColor.darkGray;
        this.givenColor = "#222222";
        this.workColor = "#222222";
        this.carryColor = omdColor.red;
        this.answerColor = "#111111";
        this.headerColor = omdColor.darkGray;
        this.annotationColor = "#7A5A2E";         // darker cousin of explainColor for legible text
        this.highlightFill = omdColor.explainColor;
        this.currentStepFill = omdColor.stepColor;

        // Painted first so highlights sit behind all digit content.
        this._highlightRect = new jsvgRect();
        this._highlightRect.setFillColor(this.highlightFill);
        this._highlightRect.setStrokeColor("none");
        this._highlightRect.setCornerRadius(6);
        this._highlightRect.setPosition(-9999, -9999);
        this.addChild(this._highlightRect);

        this._headerHolder = new jsvgGroup();
        this.addChild(this._headerHolder);
        this._gridHolder = new jsvgGroup();
        this.addChild(this._gridHolder);
        this._stepsHolder = new jsvgGroup();
        this.addChild(this._stepsHolder);
    }

    loadFromJSON(data)
    {
        if ( typeof data.operation != "undefined" )
            this.operation = String(data.operation);

        if ( Array.isArray(data.columns) )
            this.columns = data.columns.map(String);

        if ( Array.isArray(data.rows) )
            this.rows = data.rows.map(normalizeRow);

        if ( typeof data.divisor != "undefined" )
            this.divisor = String(data.divisor);

        if ( Array.isArray(data.steps) )
            this.steps = data.steps.slice();

        if ( typeof data.stepIndex != "undefined" )
            this.stepIndex = Number(data.stepIndex);

        if ( typeof data.activeRow != "undefined" )
            this.activeRow = Math.floor(Number(data.activeRow));

        if ( typeof data.showStepsList != "undefined" )
            this.showStepsList = !!data.showStepsList;

        if ( typeof data.fontSize == "number" )
            this.fontSize = data.fontSize;

        if ( typeof data.columnWidth == "number" )
            this.columnWidth = data.columnWidth;

        if ( typeof data.rowGap == "number" )
            this.rowGap = data.rowGap;

        if ( this.showStepsList && this.steps.length === 0 )
            throw new Error("omdAlgorithmWork: showStepsList requires a non-empty steps array");

        this.updateLayout();
    }

    /**
     * Reveals one more step. Returns the step description that just appeared,
     * or null when already fully revealed — lets hosts narrate per step.
     */
    nextStep()
    {
        const total = this.steps.length || this.getMaxStep();
        const current = this.getRevealedSteps();
        if ( current >= total )
        {
            this.stepIndex = total;
            return null;
        }

        this.stepIndex = current + 1;
        this.updateLayout();

        const step = this.steps[current];
        return step ? (step.description || step.label || null) : null;
    }

    getRevealedSteps()
    {
        if ( this.stepIndex === Infinity )
            return this.steps.length || this.getMaxStep();
        return clamp(Math.floor(Number(this.stepIndex) || 0), 0, this.steps.length || this.getMaxStep());
    }

    getMaxStep()
    {
        let maxStep = 0;
        for ( const row of this.rows )
        {
            if ( typeof row.step == "number" )
                maxStep = Math.max(maxStep, row.step);
        }
        return maxStep;
    }

    updateLayout()
    {
        this._headerHolder.removeAllChildren();
        this._gridHolder.removeAllChildren();
        this._stepsHolder.removeAllChildren();
        this._highlightRect.setPosition(-9999, -9999);

        const fontSize = this.fontSize;
        // Rows and headers are RIGHT-aligned on the ones column (how standard
        // algorithms work), so the grid must be wide enough for the longest row
        // and for the header labels.
        const colCount = Math.max(
            1,
            this.columns.length,
            this.rows.reduce((max, row) => Math.max(max, Array.isArray(row.cells) ? row.cells.length : 0), 0)
        );
        const colWidth = Math.max(20, this.columnWidth);
        const digitRowH = fontSize * 1.42;
        const carryRowH = fontSize * 0.82;
        const gridWidth = colCount * colWidth;

        // Long division reserves room for the divisor + bracket left of the grid.
        const divisorSpace = (this.operation === "division" && this.divisor)
            ? estimateTextWidth(this.divisor, fontSize) + fontSize * 0.9
            : 0;
        const gridLeft = this.padding + divisorSpace;

        // Which steps are visible governs which rows render.
        const revealed = this.getRevealedSteps();

        // First pass: compute row heights + y positions for VISIBLE rows only.
        const placements = [];   // { row, y, height }
        let cursorY = this.padding;
        if ( this.columns.length > 0 )
        {
            this._headerY = cursorY;
            cursorY += fontSize * 0.95;
        }

        this.rows.forEach((row, index) => {
            if ( typeof row.step == "number" && row.step > revealed )
                return;

            const height = row.kind === "carry" ? carryRowH : (row.kind === "rule" ? (Number(row.gapAfter) || 10) : digitRowH);
            placements.push({ row, index, y: cursorY, height });
            // A carry row tucks directly against the operands below it — on
            // paper the regrouped digit sits snug above its column, not a full
            // line away.
            const gapAfter = row.kind === "rule" || row.kind === "carry" ? 0 : this.rowGap;
            cursorY += height + gapAfter;
        });

        const gridBottom = cursorY - this.rowGap;
        const gridRight = gridLeft + gridWidth;

        // Column headers (place-value labels).
        if ( this.columns.length > 0 )
        {
            // Headers must fit inside one column or adjacent labels collide
            // ("1000s100s"), so the font shrinks to the widest label.
            const widestLabel = this.columns
                .slice(0, colCount)
                .reduce((max, label) => Math.max(max, String(label).length), 0);
            const headerFit = widestLabel > 0
                ? (colWidth - 3) / (widestLabel * 0.58)
                : fontSize;
            const headerFontSize = Math.max(7, Math.min(fontSize * 0.52, headerFit));

            // Right-aligned: the LAST label is the ones column, so headers line
            // up with the digits regardless of how many sign columns precede.
            const labels = this.columns.slice(-colCount);
            labels.forEach((label, i) => {
                const cx = gridRight - (labels.length - 1 - i + 0.5) * colWidth;
                const text = makeGridLabel(label, cx, this._headerY + fontSize * 0.5, {
                    fontSize: headerFontSize,
                    color: this.headerColor,
                    fontFamily: this.fontFamily,
                });
                this._headerHolder.addChild(text);
            });
        }

        // Digit rows.
        let activeBandY = -1;
        let activeBandH = 0;
        let maxAnnotationX = gridRight;

        for ( const placement of placements )
        {
            const { row, index, y, height } = placement;

            if ( row.kind === "rule" )
            {
                const rule = new jsvgLine();
                rule.setStrokeColor(this.ruleColor);
                rule.setStrokeWidth(2);
                rule.setEndpoints(gridLeft, y + height / 2, gridRight, y + height / 2);
                this._gridHolder.addChild(rule);
                continue;
            }

            const cy = y + height / 2;
            const rowColor = row.color || null;

            row.cells.forEach((cell, i) => {
                if ( !cell.text )
                    return;

                // Per-cell disclosure: a quotient digit can appear on its own
                // step while the rest of the row is already placed.
                if ( typeof cell.step == "number" && cell.step > revealed )
                    return;

                const kind = cell.kind || row.kind;
                // Right-aligned: the row's LAST cell is its ones column, so
                // rows of differing length still share a place-value grid.
                const cx = gridRight - (row.cells.length - 1 - i + 0.5) * colWidth;

                let color = this.givenColor;
                let size = fontSize;
                let weight = 500;
                let dy = 0;

                if ( kind === ALGORITHM_CELL.CARRY )
                {
                    color = this.carryColor;
                    size = fontSize * 0.6;
                    // Centered in the tucked band leaves a small breathing gap
                    // above the operand digits.
                    dy = 0;
                    weight = 600;
                }
                else if ( kind === ALGORITHM_CELL.ANSWER )
                {
                    color = this.answerColor;
                    weight = 700;
                }
                else if ( kind === ALGORITHM_CELL.WORK )
                {
                    color = this.workColor;
                }

                const resolvedColor = cell.color || rowColor || color;

                const text = new jsvgTextLine();
                text.setFontFamily(this.fontFamily);
                text.setFontSize(size);
                text.setFontColor(resolvedColor);
                text.setFontWeight(weight);
                text.setAlignment("center");
                text.setText(cell.text);
                text.setPosition(cx, cy + dy);
                text.svgObject.setAttribute('data-text', cell.text);
                text.svgObject.setAttribute('data-kind', kind || '');
                if (typeof cell.step === 'number') text.svgObject.setAttribute('data-step', String(cell.step));
                text.svgObject.setAttribute("dominant-baseline", "central");
                this._gridHolder.addChild(text);

                // Crossed-out digit: the pencil-and-paper mark for a value that
                // has been regrouped away. `strike` is permanent; `strikeStep`
                // makes the cross-out appear on its own step.
                const struck = cell.strike === true
                    || (typeof cell.strikeStep == "number" && cell.strikeStep <= revealed);

                if ( struck )
                {
                    const glyphWidth = estimateTextWidth(cell.text, size);
                    const halfW = Math.max(size * 0.28, glyphWidth / 2) + size * 0.1;
                    const halfH = size * 0.42;
                    const strike = new jsvgLine();
                    strike.setStrokeColor(resolvedColor);
                    strike.setStrokeWidth(Math.max(1.1, size * 0.055));
                    strike.setEndpoints(
                        cx - halfW, cy + dy + halfH,
                        cx + halfW, cy + dy - halfH
                    );
                    this._gridHolder.addChild(strike);
                }
            });

            // Right-side step annotation ("why" narration for this part).
            if ( row.annotation )
            {
                const ann = new jsvgTextLine();
                const annSize = fontSize * 0.55;
                ann.setFontFamily(this.fontFamily);
                ann.setFontSize(annSize);
                ann.setFontColor(this.annotationColor);
                ann.setAlignment("left");
                ann.setText(row.annotation);
                ann.setPosition(gridRight + fontSize * 0.55, cy);
                ann.svgObject.setAttribute("dominant-baseline", "central");
                this._gridHolder.addChild(ann);
                // Annotations widen the component — without this they render
                // outside the viewBox and get clipped.
                maxAnnotationX = Math.max(
                    maxAnnotationX,
                    gridRight + fontSize * 0.55 + estimateTextWidth(row.annotation, annSize)
                );
            }

            if ( index === this.activeRow )
            {
                activeBandY = y;
                activeBandH = height;
            }
        }

        // Current-step highlight band behind the active row.
        if ( activeBandY >= 0 )
        {
            const bandPad = 3;
            this._highlightRect.setWidthAndHeight(maxAnnotationX - gridLeft + fontSize * 0.4, activeBandH + bandPad * 2);
            this._highlightRect.setPosition(gridLeft - fontSize * 0.2, activeBandY - bandPad);
        }

        // Long-division bracket: the rule runs ALONG THE TOP of the dividend
        // (directly under the quotient) with the upright to its left and the
        // divisor outside it — the standard ")‾" notation.
        if ( this.operation === "division" && this.divisor )
        {
            const dividend = placements.find(p => p.row.kind === ALGORITHM_CELL.GIVEN);
            if ( dividend )
            {
                const bracketX = gridLeft - fontSize * 0.42;
                const barY = dividend.y - 2;
                // The upright spans the dividend and every row of work below it.
                const lastRow = placements[placements.length - 1];
                const bottomY = Math.max(dividend.y + dividend.height, lastRow.y + lastRow.height);

                const divText = new jsvgTextLine();
                divText.setFontFamily(this.fontFamily);
                divText.setFontSize(fontSize);
                divText.setFontColor(this.givenColor);
                divText.setFontWeight(500);
                // jsvg maps only left|center|right — "end" would silently fall
                // back to left-anchored and run through the bracket.
                divText.setAlignment("right");
                divText.setText(this.divisor);
                divText.setPosition(bracketX - fontSize * 0.34, dividend.y + dividend.height / 2);
                divText.svgObject.setAttribute("dominant-baseline", "central");
                this._gridHolder.addChild(divText);

                const vLine = new jsvgLine();
                vLine.setStrokeColor(this.ruleColor);
                vLine.setStrokeWidth(2);
                vLine.setEndpoints(bracketX, barY, bracketX, bottomY);
                this._gridHolder.addChild(vLine);

                const hLine = new jsvgLine();
                hLine.setStrokeColor(this.ruleColor);
                hLine.setStrokeWidth(2);
                hLine.setEndpoints(bracketX, barY, gridRight, barY);
                this._gridHolder.addChild(hLine);
            }
        }

        // Optional steps list beside the grid. It can be TALLER than the digit
        // grid when few steps are revealed, so it drives height too.
        let contentWidth = maxAnnotationX + this.padding;
        let contentBottom = gridBottom;
        if ( this.showStepsList && this.steps.length > 0 )
        {
            const listX = contentWidth + fontSize * 0.8;
            const chipSize = fontSize * 0.62;
            const rowH = fontSize * 1.55;
            let ly = this.padding + (this.columns.length > 0 ? fontSize * 0.95 : 0);

            this.steps.forEach((step, i) => {
                const done = i < revealed;

                const chip = new jsvgRect();
                chip.setCornerRadius(chipSize / 2);
                chip.setWidthAndHeight(chipSize * 1.7, chipSize * 1.25);
                chip.setStrokeColor("none");
                chip.setFillColor(done ? (i === Math.min(revealed, this.steps.length) - 1 ? this.currentStepFill : "#DCEBF7") : "#EEEEEE");
                chip.svgObject.setAttribute('data-step-index', String(i + 1));
                chip.svgObject.setAttribute('data-role', 'step-chip');
                chip.setPosition(listX, ly + (rowH - chipSize * 1.25) / 2);
                this._stepsHolder.addChild(chip);

                const num = new jsvgTextLine();
                num.setFontFamily(this.fontFamily);
                num.setFontSize(chipSize * 0.85);
                num.setFontWeight(700);
                num.setAlignment("center");
                num.setText(String(i + 1));
                num.setPosition(listX + chipSize * 0.85, ly + rowH / 2);
                num.svgObject.setAttribute("dominant-baseline", "central");
                num.svgObject.setAttribute('data-step-index', String(i + 1));
                this._stepsHolder.addChild(num);

                const desc = step.description || step.label || "";
                const label = new jsvgTextLine();
                label.setFontFamily(this.fontFamily);
                label.setFontSize(fontSize * 0.56);
                label.setFontColor(done ? "#333333" : "#9A9A9A");
                label.setFontWeight(i === Math.min(revealed, this.steps.length) - 1 && done ? 650 : 400);
                label.setAlignment("left");
                label.setText(desc);
                label.setPosition(listX + chipSize * 1.7 + fontSize * 0.45, ly + rowH / 2);
                label.svgObject.setAttribute("dominant-baseline", "central");
                label.svgObject.setAttribute('data-step-index', String(i + 1));
                this._stepsHolder.addChild(label);

                contentWidth = Math.max(contentWidth, listX + chipSize * 1.7 + fontSize * 0.45 + estimateTextWidth(desc, fontSize * 0.56) + this.padding);
                ly += rowH;
                contentBottom = Math.max(contentBottom, ly);
            });

            contentWidth += fontSize * 0.4;
        }

        this.width = Math.ceil(contentWidth);
        this.height = Math.ceil(Math.max(contentBottom + this.padding, this.padding * 2));
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }
}

function normalizeRow(row)
{
    if ( !row || typeof row !== "object" )
        return { kind: ALGORITHM_CELL.BLANK, cells: [] };

    if ( row.kind === "rule" || row.kind === "divider" )
        return {
            kind: "rule",
            gapAfter: Number(row.gapAfter) || 0,
            // Rules participate in step disclosure like any other row.
            step: Number.isFinite(Number(row.step)) ? Math.floor(Number(row.step)) : undefined,
        };

    const kind = CELL_KINDS.has(row.kind) ? row.kind : ALGORITHM_CELL.BLANK;
    const cells = Array.isArray(row.cells) ? row.cells.map(normalizeCell) : [];

    return {
        kind,
        cells,
        color: typeof row.color == "string" ? row.color : null,
        step: Number.isFinite(Number(row.step)) ? Math.floor(Number(row.step)) : undefined,
        annotation: typeof row.annotation == "string" ? row.annotation : undefined,
    };
}

function normalizeCell(cell)
{
    if ( cell === null || typeof cell === "undefined" )
        return { text: "", kind: null, color: undefined };

    if ( typeof cell === "string" || typeof cell === "number" )
        return { text: String(cell), kind: null, color: undefined };

    if ( typeof cell === "object" )
    {
        return {
            text: cell.text === null || typeof cell.text == "undefined" ? "" : String(cell.text),
            kind: CELL_KINDS.has(cell.kind) ? cell.kind : null,
            color: typeof cell.color == "string" ? cell.color : undefined,
            step: Number.isFinite(Number(cell.step)) ? Math.floor(Number(cell.step)) : undefined,
            strike: cell.strike === true,
            strikeStep: Number.isFinite(Number(cell.strikeStep)) ? Math.floor(Number(cell.strikeStep)) : undefined,
        };
    }

    return { text: String(cell), kind: null, color: undefined };
}

function makeGridLabel(text, x, y, options)
{
    const label = new jsvgTextLine();
    label.setAlignment("center");
    label.setFontFamily(options.fontFamily);
    label.setFontColor(options.color);
    label.setFontSize(options.fontSize);
    label.setPosition(x, y);
    label.setText(text);
    label.svgObject.setAttribute("dominant-baseline", "central");
    return label;
}

// Matches omdShapes.js glyph-width heuristic so layout is deterministic
// across browser and Node (no DOM measurement dependency).
function estimateTextWidth(text, fontSize)
{
    return String(text || "").length * fontSize * 0.58;
}
