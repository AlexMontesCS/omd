import { omdColor, OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { jsvgGroup, jsvgRect } from "@teachinglab/jsvg";
import { renderStepsList } from "./omdStepsList.js";
import {
    num, op, word, frac,
    measureItems, extentOfItems, mergeExtent, drawItems, makeText,
} from "./omdFractionTypeset.js";

const OPERATION_SYMBOL = {
    multiplication: "\u00d7",
    division: "\u00f7",
    addition: "+",
    subtraction: "\u2212",
};

const TIMES = "\u00d7";
const DIVIDE = "\u00f7";
const MINUS = "\u2212";

/**
 * omdFractionWork — the standard fraction algorithms worked line by line:
 *
 *   multiplication  rename → multiply across → products → simplify → mixed number
 *   division        rename → keep, change, flip → (multiplication steps)
 *   addition        rename → common denominator → equivalent fractions →
 *                   add numerators → sum → simplify → mixed number
 *   subtraction     same as addition, subtracting the numerators
 *
 * The work is DERIVED from the two operands — authors give the problem, not
 * the rows. Lines align on their equals signs; the first step sits to the
 * right of the problem itself, the way it is written on paper:
 *
 *   2/3 × 3/4 = (2 × 3)/(3 × 4)     multiply the numerators and the denominators
 *             = 6/12                2 × 3 = 6,  3 × 4 = 12
 *             = (6 ÷ 6)/(12 ÷ 6)    the GCF of 6 and 12 is 6
 *             = 1/2                 6 ÷ 6 = 1,  12 ÷ 6 = 2
 *
 * Each line is one step. `stepIndex` reveals that many steps (0 = problem
 * only); the band behind the newest line marks the current step, and the
 * part each step introduces (a flipped divisor, the × 4 that builds an
 * equivalent fraction, the ÷ GCF) is drawn in the accent color. Layout is
 * sized for the finished work, so stepping never reflows the figure.
 *
 * Mixed numbers are renamed as fractions greater than 1 before every
 * operation, so subtraction never needs regrouping.
 *
 * JSON shape:
 * {
 *   omdType: 'fractionWork',
 *   operation: 'multiplication' | 'division' | 'addition' | 'subtraction',
 *   left: '2/3',              // "a/b", "w a/b", "w", or a whole number
 *   right: '1 1/2',
 *   stepIndex: number,        // steps revealed (default: all)
 *   showStepsList: boolean,   // numbered step list beside the work
 *   showAnnotations: boolean, // per-line "why" notes (default true)
 *   fontSize: number,
 * }
 */
export class omdFractionWork extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdFractionWork";

        this.operation = "multiplication";
        this.left = "1/2";
        this.right = "1/3";
        this.stepIndex = Infinity;      // default: every step revealed
        this.showStepsList = false;
        this.showAnnotations = true;
        this.fontSize = 28;
        this.padding = 14;
        this.fontFamily = OMD_MATH_FONT_FAMILY;

        // Palette follows omdAlgorithmWork so the two read as one family.
        this.textColor = "#222222";
        this.answerColor = "#111111";
        this.accentColor = omdColor.blue;
        this.annotationColor = "#7A5A2E";
        this.highlightFill = omdColor.explainColor;
        this.currentStepFill = omdColor.stepColor;

        this._work = null;

        // Painted first so the band sits behind all math.
        this._highlightRect = new jsvgRect();
        this._highlightRect.setFillColor(this.highlightFill);
        this._highlightRect.setStrokeColor("none");
        this._highlightRect.setCornerRadius(6);
        this._highlightRect.setPosition(-9999, -9999);
        this.addChild(this._highlightRect);

        this._workHolder = new jsvgGroup();
        this.addChild(this._workHolder);
        this._stepsHolder = new jsvgGroup();
        this.addChild(this._stepsHolder);
    }

    loadFromJSON(data)
    {
        if ( typeof data.operation != "undefined" )
            this.operation = String(data.operation);

        if ( !OPERATION_SYMBOL[this.operation] )
            throw new Error(`omdFractionWork: unknown operation "${this.operation}" (use multiplication, division, addition, or subtraction)`);

        if ( typeof data.left != "undefined" )
            this.left = data.left;

        if ( typeof data.right != "undefined" )
            this.right = data.right;

        // Explicit stepping turns the current-step band on; a static render
        // of the finished work has no "current" line.
        this._stepping = typeof data.stepIndex != "undefined";
        this.stepIndex = this._stepping ? Number(data.stepIndex) : Infinity;

        if ( typeof data.showStepsList != "undefined" )
            this.showStepsList = !!data.showStepsList;

        if ( typeof data.showAnnotations != "undefined" )
            this.showAnnotations = !!data.showAnnotations;

        if ( typeof data.fontSize == "number" )
            this.fontSize = data.fontSize;

        this._work = buildFractionWork(
            this.operation,
            parseOperand(this.left, "left"),
            parseOperand(this.right, "right")
        );

        this.updateLayout();
    }

    /** Step descriptions in order — for narration or an external step list. */
    getSteps()
    {
        return this._work ? this._work.lines.map(line => ({ description: line.description })) : [];
    }

    /**
     * Reveals one more step. Returns the description of the step that just
     * appeared, or null when the work is already complete.
     */
    nextStep()
    {
        const total = this.getSteps().length;
        const current = this.getRevealedSteps();
        if ( current >= total )
            return null;

        this._stepping = true;
        this.stepIndex = current + 1;
        this.updateLayout();
        return this._work.lines[current].description;
    }

    getRevealedSteps()
    {
        const total = this.getSteps().length;
        if ( this.stepIndex === Infinity )
            return total;
        return Math.min(total, Math.max(0, Math.floor(Number(this.stepIndex) || 0)));
    }

    updateLayout()
    {
        this._workHolder.removeAllChildren();
        this._stepsHolder.removeAllChildren();
        this._highlightRect.setPosition(-9999, -9999);

        if ( !this._work )
            return;

        const F = this.fontSize;
        const annSize = F * 0.6;
        const eqSlot = F * 1.25;
        const { problem, lines } = this._work;
        const revealed = this.getRevealedSteps();

        // Column geometry is computed from ALL lines so revealing a step
        // never shifts what is already on screen.
        const problemW = measureItems(problem, F);
        const eqX = this.padding + problemW + eqSlot / 2;
        const exprX = this.padding + problemW + eqSlot;
        const exprRight = lines.reduce((max, line) => Math.max(max, exprX + measureItems(line.tokens, F)), exprX);
        const annX = exprRight + F * 0.9;

        let contentRight = exprRight;
        if ( this.showAnnotations )
        {
            for ( const line of lines )
            {
                if ( line.annotation )
                    contentRight = Math.max(contentRight, annX + measureItems(line.annotation, annSize));
            }
        }

        // Row k holds step k + 1; row 0 also carries the problem.
        const rowGap = F * 0.45;
        let cursorY = this.padding;
        const rows = lines.map((line, k) => {
            const ext = extentOfItems(line.tokens, F);
            if ( k === 0 )
                mergeExtent(ext, extentOfItems(problem, F));
            if ( this.showAnnotations && line.annotation )
                mergeExtent(ext, extentOfItems(line.annotation, annSize));

            const top = cursorY;
            const cy = top + ext.above;
            cursorY = cy + ext.below + rowGap;
            return { top, cy, height: ext.above + ext.below };
        });

        if ( lines.length === 0 )
        {
            const ext = extentOfItems(problem, F);
            rows.push({ top: cursorY, cy: cursorY + ext.above, height: ext.above + ext.below });
            cursorY += ext.above + ext.below + rowGap;
        }

        const contentBottom = cursorY - rowGap;

        // Problem statement — always visible.
        const problemGroup = new jsvgGroup();
        problemGroup.svgObject.setAttribute("data-step", "0");
        problemGroup.svgObject.setAttribute("data-role", "fraction-work-problem");
        drawItems(problemGroup, problem, this.padding, rows[0].cy, F, this._style(500, this.textColor));
        this._workHolder.addChild(problemGroup);

        lines.forEach((line, k) => {
            if ( k >= revealed )
                return;

            const { cy } = rows[k];
            const answer = k === lines.length - 1;
            const group = new jsvgGroup();
            group.svgObject.setAttribute("data-step", String(k + 1));
            group.svgObject.setAttribute("data-role", answer ? "fraction-work-answer" : "fraction-work-line");

            const style = answer ? this._style(700, this.answerColor) : this._style(500, this.textColor);
            group.addChild(makeText("=", eqX, cy, F, this.textColor, 500, "center", this.fontFamily));
            drawItems(group, line.tokens, exprX, cy, F, style);

            if ( this.showAnnotations && line.annotation )
                drawItems(group, line.annotation, annX, cy, annSize, this._style(400, this.annotationColor));

            this._workHolder.addChild(group);
        });

        // Current-step band behind the newest line.
        if ( this._stepping && revealed > 0 )
        {
            const row = rows[revealed - 1];
            const pad = F * 0.12;
            const bandX = eqX - eqSlot / 2;
            this._highlightRect.setWidthAndHeight(contentRight - bandX + F * 0.3, row.height + pad * 2);
            this._highlightRect.setPosition(bandX, row.top - pad);
        }

        let width = contentRight + this.padding;
        let height = contentBottom + this.padding;

        if ( this.showStepsList && lines.length > 0 )
        {
            const list = renderStepsList(this._stepsHolder, {
                steps: this.getSteps(),
                revealed,
                x: width + F * 0.8,
                y: this.padding,
                fontSize: F,
                fontFamily: this.fontFamily,
                currentFill: this.currentStepFill,
            });
            width = Math.max(width, list.right + this.padding) + F * 0.4;
            height = Math.max(height, list.bottom + this.padding);
        }

        this.width = Math.ceil(width);
        this.height = Math.ceil(height);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }

    _style(weight, color)
    {
        return { weight, color, fontFamily: this.fontFamily };
    }
}

/* ================= operands ================= */

/**
 * Keeps the operand in the form it was WRITTEN — 6/8 stays 6/8 and 1 1/2
 * stays mixed — because the work must start from the problem as given.
 */
function parseOperand(value, name)
{
    const invalid = () => new Error(
        `omdFractionWork: ${name} must be a non-negative whole number, fraction ("3/4"), or mixed number ("2 1/2"); got ${JSON.stringify(value)}`
    );

    if ( typeof value === "number" )
    {
        if ( !Number.isInteger(value) || value < 0 ) throw invalid();
        return { whole: value, num: null, den: null };
    }

    const text = String(value ?? "").trim();
    let match = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if ( match )
    {
        const operand = { whole: Number(match[1]), num: Number(match[2]), den: Number(match[3]) };
        if ( operand.den === 0 ) throw invalid();
        return operand;
    }

    match = text.match(/^(\d+)\s*\/\s*(\d+)$/);
    if ( match )
    {
        const operand = { whole: null, num: Number(match[1]), den: Number(match[2]) };
        if ( operand.den === 0 ) throw invalid();
        return operand;
    }

    if ( /^\d+$/.test(text) )
        return { whole: Number(text), num: null, den: null };

    throw invalid();
}

function operandIsFraction(operand)
{
    return operand.whole === null;
}

/** Operand as an unreduced fraction n/d (mixed and whole numbers renamed). */
function operandFraction(operand)
{
    if ( operand.num === null ) return { n: operand.whole, d: 1 };
    if ( operand.whole === null ) return { n: operand.num, d: operand.den };
    return { n: operand.whole * operand.den + operand.num, d: operand.den };
}

/* ================= tokens ================= */

function operandTokens(operand)
{
    if ( operand.num === null ) return [num(operand.whole)];
    return [frac(operand.num, operand.den, { whole: operand.whole })];
}

/** Signed value; d === 1 renders as a whole number. */
function valueTokens(n, d, { mixed = false } = {})
{
    const sign = n < 0 ? [op(MINUS)] : [];
    const a = Math.abs(n);
    if ( d === 1 ) return [...sign, num(a)];
    if ( mixed && a > d ) return [...sign, frac(a % d, d, { whole: Math.floor(a / d) })];
    return [...sign, frac(a, d)];
}

function signed(n)
{
    return n < 0 ? `${MINUS}${Math.abs(n)}` : String(n);
}

function gcd(a, b)
{
    a = Math.abs(a);
    b = Math.abs(b);
    while ( b ) [a, b] = [b, a % b];
    return a || 1;
}

/* ================= the algorithms ================= */

/**
 * Derives the worked lines for `left <operation> right`. Each line is
 * `{ tokens, annotation, description }` and stands for one step.
 */
export function buildFractionWork(operation, left, right)
{
    const symbol = OPERATION_SYMBOL[operation];
    const accent = omdColor.blue;
    const problem = [...operandTokens(left), op(symbol), ...operandTokens(right)];
    const lines = [];

    let a = operandFraction(left);
    let b = operandFraction(right);

    if ( operation === "division" && b.n === 0 )
        throw new Error("omdFractionWork: cannot divide by zero");

    // Rename whole and mixed numbers as fractions before operating.
    if ( !operandIsFraction(left) || !operandIsFraction(right) )
    {
        const renamed = (operand, f) => (operand.whole === null
            ? [frac(f.n, f.d)]
            : [frac(f.n, f.d, { color: accent })]);

        const notes = [];
        for ( const [operand, f] of [[left, a], [right, b]] )
        {
            if ( operand.whole === null ) continue;
            if ( notes.length > 0 ) notes.push(word(",  "));
            notes.push(...operandTokens(operand), op("="), frac(f.n, f.d));
        }

        const mixed = (left.whole !== null && left.num !== null) || (right.whole !== null && right.num !== null);
        lines.push({
            tokens: [...renamed(left, a), op(symbol), ...renamed(right, b)],
            annotation: notes,
            description: mixed ? "Rename mixed numbers as fractions" : "Write whole numbers as fractions",
        });
    }

    if ( operation === "division" )
    {
        lines.push({
            tokens: [frac(a.n, a.d), op(TIMES, accent), frac(b.d, b.n, { color: accent })],
            annotation: [word("multiply by the reciprocal of "), frac(b.n, b.d)],
            description: "Keep, change, flip",
        });
        b = { n: b.d, d: b.n };
    }

    let result;
    if ( operation === "multiplication" || operation === "division" )
        result = multiplyAcross(lines, a, b);
    else
        result = combineLikeDenominators(lines, a, b, operation === "addition", accent);

    finish(lines, result.n, result.d, accent);
    return { problem, lines };
}

function multiplyAcross(lines, a, b)
{
    lines.push({
        tokens: [frac([num(a.n), op(TIMES), num(b.n)], [num(a.d), op(TIMES), num(b.d)])],
        annotation: [word("multiply the numerators and the denominators")],
        description: "Multiply across",
    });

    const n = a.n * b.n;
    const d = a.d * b.d;
    lines.push({
        tokens: [frac(n, d)],
        annotation: [word(`${a.n} ${TIMES} ${b.n} = ${n},  ${a.d} ${TIMES} ${b.d} = ${d}`)],
        description: "Find the products",
    });
    return { n, d };
}

function combineLikeDenominators(lines, a, b, adding, accent)
{
    const symbol = adding ? "+" : MINUS;

    if ( a.d !== b.d )
    {
        const lcd = a.d / gcd(a.d, b.d) * b.d;
        const ma = lcd / a.d;
        const mb = lcd / b.d;
        const scaled = (f, m) => (m === 1
            ? frac(f.n, f.d)
            : frac([num(f.n), op(TIMES, accent), num(m, accent)], [num(f.d), op(TIMES, accent), num(m, accent)]));

        lines.push({
            tokens: [scaled(a, ma), op(symbol), scaled(b, mb)],
            annotation: [word(`the least common denominator of ${a.d} and ${b.d} is ${lcd}`)],
            description: "Find a common denominator",
        });

        const products = [[a, ma], [b, mb]]
            .filter(([, m]) => m > 1)
            .map(([f, m]) => `${f.n} ${TIMES} ${m} = ${f.n * m}`);

        a = { n: a.n * ma, d: lcd };
        b = { n: b.n * mb, d: lcd };
        lines.push({
            tokens: [frac(a.n, a.d), op(symbol), frac(b.n, b.d)],
            annotation: [word(products.join(",  "))],
            description: "Write equivalent fractions",
        });
    }

    lines.push({
        tokens: [frac([num(a.n), op(symbol), num(b.n)], [num(a.d)])],
        annotation: [word(`${adding ? "add" : "subtract"} the numerators, keep the denominator`)],
        description: adding ? "Add the numerators" : "Subtract the numerators",
    });

    const n = adding ? a.n + b.n : a.n - b.n;
    lines.push({
        tokens: n < 0 ? [op(MINUS), frac(-n, a.d)] : [frac(n, a.d)],
        annotation: [word(`${a.n} ${symbol} ${b.n} = ${signed(n)}`)],
        description: adding ? "Find the sum" : "Find the difference",
    });
    return { n, d: a.d };
}

/** Simplify, then name whole and mixed numbers. */
function finish(lines, n, d, accent)
{
    const sign = n < 0 ? [op(MINUS)] : [];
    let a = Math.abs(n);

    if ( a === 0 )
    {
        if ( d !== 1 )
            lines.push({
                tokens: [num(0)],
                annotation: [word(`0 ${DIVIDE} ${d} = 0`)],
                description: "Simplify",
            });
        return;
    }

    const g = gcd(a, d);
    if ( g > 1 )
    {
        lines.push({
            tokens: [...sign, frac([num(a), op(DIVIDE, accent), num(g, accent)], [num(d), op(DIVIDE, accent), num(g, accent)])],
            annotation: [word(`the greatest common factor of ${a} and ${d} is ${g}`)],
            description: "Divide by the GCF",
        });
        lines.push({
            tokens: valueTokens(n / g, d / g),
            annotation: [word(`${a} ${DIVIDE} ${g} = ${a / g},  ${d} ${DIVIDE} ${g} = ${d / g}`)],
            description: "Simplify",
        });
        a /= g;
        d /= g;
    }
    else if ( d === 1 )
    {
        lines.push({
            tokens: [...sign, num(a)],
            annotation: [word(`${a} ${DIVIDE} 1 = ${a}`)],
            description: "Write as a whole number",
        });
        return;
    }

    if ( d !== 1 && a > d )
    {
        lines.push({
            tokens: valueTokens(Math.sign(n) * a, d, { mixed: true }),
            annotation: [word(`${a} ${DIVIDE} ${d} = ${Math.floor(a / d)} R ${a % d}`)],
            description: "Write as a mixed number",
        });
    }
}
