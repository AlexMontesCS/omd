
import { OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { jsvgGroup, jsvgLine, jsvgTextLine } from "@teachinglab/jsvg";


/**
 * omdMathText — a paragraph of text with real stacked math embedded inline.
 *
 * Answers the "nice rendering of fractions inline with text" requirement:
 * word problems like "A baker has 3/4 of a box..." render the fraction as a
 * true vertical fraction sitting on the text baseline instead of "3/4".
 *
 * Markup (a light subset — everything else is plain prose):
 *   [3/4]        → stacked fraction
 *   [2 3/4]      → mixed number (whole + fraction)
 *   **bold**     → bold span
 *
 * JSON shape:
 * {
 *   omdType: 'mathText',
 *   text: 'A baker has [3/4] of a box of muffin mix.',
 *   fontSize: 18,
 *   width: 420,          // wrap width in px (0 = single line)
 * }
 */
export class omdMathText extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdMathText";

        this.text = "";
        this.fontSize = 18;
        this.wrapWidth = 0;             // 0 = single line, no wrapping
        this.lineHeightRatio = 1.85;
        this.fontFamily = OMD_MATH_FONT_FAMILY;

        this._measureContext = null;
        this._lineHolder = new jsvgGroup();
        this.addChild(this._lineHolder);
    }

    _getMeasureContext()
    {
        if ( typeof document == "undefined" )
            return null;
        if ( this._measureContext )
            return this._measureContext;
        const canvas = document.createElement("canvas");
        this._measureContext = canvas.getContext("2d");
        return this._measureContext;
    }

    /**
     * Real DOM-accurate width when a canvas is available (browser); falls back
     * to the library-wide glyph heuristic in non-DOM environments.
     */
    _measureText(text, fontSize, bold)
    {
        const context = this._getMeasureContext();
        const weight = bold ? 700 : 400;
        if ( !context )
            return String(text || "").length * fontSize * (bold ? 0.62 : 0.58);
        context.font = `${weight} ${fontSize}px ${this.fontFamily}`;
        return context.measureText(String(text || "")).width;
    }

    loadFromJSON(data)
    {
        if ( typeof data.text != "undefined" )
            this.text = String(data.text);

        if ( typeof data.fontSize == "number" )
            this.fontSize = data.fontSize;

        // lineHeight is given in px and converted to a ratio of the font size.
        if ( typeof data.lineHeight == "number" && data.lineHeight > 0 )
            this.lineHeightRatio = data.lineHeight / this.fontSize;

        if ( typeof data.width == "number" )
            this.wrapWidth = Math.max(0, data.width);

        if ( typeof data.fontFamily == "string" )
            this.fontFamily = data.fontFamily;

        this.updateLayout();
    }

    updateLayout()
    {
        this._lineHolder.removeAllChildren();

        // Flatten markup into atomic layout pieces: one per word, one per
        // fraction/mixed-number. Pieces carry their own visual + real metrics.
        const pieces = [];
        for ( const segment of parseSegments(this.text) )
            pieces.push(...buildSegmentPieces(segment, this, this._measureText.bind(this)));

        const lineHeight = this.fontSize * this.lineHeightRatio;
        const spaceW = spaceWidth(this.fontSize);
        const maxWidth = this.wrapWidth > 0 ? this.wrapWidth : Infinity;

        // Greedy line breaking: never split a piece across lines. A break piece
        // ends the current line outright.
        const lines = [[]];
        let cursorX = 0;

        for ( const piece of pieces )
        {
            if ( piece.isBreak )
            {
                lines.push([]);
                cursorX = 0;
                continue;
            }

            const fits = cursorX === 0 || cursorX + spaceW + piece.width <= maxWidth;
            if ( !fits )
            {
                lines.push([]);
                cursorX = 0;
            }

            lines[lines.length - 1].push(piece);
            cursorX += (cursorX > 0 ? spaceW : 0) + piece.width;
        }

        // Render pass: vertically center every piece on its line's reading
        // axis so stacked fractions grow up AND down like typeset inline math.
        let y = 0;
        let maxRight = 0;

        for ( const line of lines )
        {
            const lineWidth = line.reduce((sum, piece) => sum + piece.width, 0)
                + Math.max(0, line.length - 1) * spaceW;
            maxRight = Math.max(maxRight, lineWidth);

            let x = 0;
            for ( const piece of line )
            {
                if ( piece.visual )
                {
                    // jsvgTextLine glyphs center on their anchor point
                    // (dominant-baseline: central) — hand word pieces the line's
                    // reading axis directly. Fraction groups are top-left boxes,
                    // so they keep the centered-box math.
                    if ( piece.isText )
                        piece.visual.setPosition(x, y + lineHeight / 2);
                    else
                        piece.visual.setPosition(x, y + lineHeight / 2 - piece.height / 2);
                    this._lineHolder.addChild(piece.visual);
                }
                x += piece.width + spaceW;
            }

            y += lineHeight;
        }

        this.width = Math.ceil(Math.max(maxRight, 1));
        this.height = Math.ceil(y);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/**
 * Splits raw markup into typed segments. Text segments keep their internal
 * spaces; they are split into word pieces at build time.
 */
function parseSegments(raw)
{
    const segments = [];
    const pattern = /\[([^\[\]]+?)\]|\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ( (match = pattern.exec(raw)) !== null )
    {
        if ( match.index > lastIndex )
            segments.push({ type: "text", text: raw.slice(lastIndex, match.index) });

        if ( match[1] )
            segments.push(parseMathToken(match[1]));
        else if ( match[2] )
            segments.push({ type: "bold", text: match[2] });

        lastIndex = pattern.lastIndex;
    }

    if ( lastIndex < raw.length )
        segments.push({ type: "text", text: raw.slice(lastIndex) });

    return segments;
}

/**
 * Parses the inside of a [...] token: `n/d` fraction, `w n/d` mixed number, or
 * a bare number (authors bracket those for consistency — render as-is).
 */
function parseMathToken(token)
{
    const fraction = token.match(/^(\d+)\/(\d+)$/);
    if ( fraction )
        return { type: "fraction", numerator: fraction[1], denominator: fraction[2] };

    const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if ( mixed )
        return { type: "mixed", whole: mixed[1], numerator: mixed[2], denominator: mixed[3] };

    if ( /^\d+(?:\.\d+)?$/.test(token) )
        return { type: "text", text: token };

    // Unknown token — degrade gracefully to literal bracketed text.
    return { type: "text", text: `[${token}]` };
}

/* ------------------------------------------------------------------ */
/* Segment visuals                                                     */
/* ------------------------------------------------------------------ */

function buildSegmentPieces(segment, owner, measure)
{
    const fontSize = owner.fontSize;

    if ( segment.type === "fraction" )
        return [buildFraction(null, segment.numerator, segment.denominator, owner, measure)];

    if ( segment.type === "mixed" )
        return [buildFraction(segment.whole, segment.numerator, segment.denominator, owner, measure)];

    const bold = segment.type === "bold";
    const color = bold ? "#111111" : "#222222";
    const weight = bold ? 700 : 400;

    // A newline is a hard break: it emits a break piece, and the surrounding
    // runs are word-split as usual. Lets a Number Talk list one expression per
    // line without one component per line.
    const pieces = [];
    const chunks = String(segment.text).split("\n");

    chunks.forEach((chunk, index) => {
        if ( index > 0 ) pieces.push({ isBreak: true, width: 0, height: 0 });

        for ( const word of chunk.split(/\s+/) )
        {
            if ( word.length === 0 ) continue;
            pieces.push({
                width: Math.max(2, measure(word, fontSize, bold)),
                height: fontSize * 1.42,   // covers Albert Sans ascent+descent (~1.36em)
                isText: true,              // glyph centers on anchor → axis placement
                visual: makeWordLabel(word, color, weight, fontSize, owner.fontFamily),
            });
        }
    });

    return pieces;
}

function makeWordLabel(text, color, weight, fontSize, fontFamily)
{
    const label = new jsvgTextLine();
    label.setFontFamily(fontFamily);
    label.setFontSize(fontSize);
    label.setFontColor(color);
    label.setFontWeight(weight);
    label.setAlignment("left");
    label.setText(text);
    label.svgObject.setAttribute("dominant-baseline", "central");
    return label;
}

/**
 * Same as makeWordLabel but center-anchored — used for fraction digits so they
 * sit exactly on the rule's midline regardless of glyph width.
 */
function makeCenteredLabel(text, color, weight, fontSize, fontFamily)
{
    const label = makeWordLabel(text, color, weight, fontSize, fontFamily);
    label.setAlignment("center");
    return label;
}

// A mixed number is one number: the whole part, the numerator and the
// denominator all carry the same ink and weight as the prose around them, so
// "3 1/4" never reads as a bold 3 next to a lighter fraction.
const FRACTION_INK = "#222222";
const FRACTION_WEIGHT = 400;

/**
 * Stacked fraction (or mixed number): two small anchored labels around a rule,
 * sized to sit inline with surrounding prose. Plain jsvgTextLines are used
 * instead of omdExpression boxes because their glyphs center exactly on the
 * anchor (dominant-baseline: central) — no padded-box guesswork, identical in
 * browser and Node.
 */
function buildFraction(whole, numerator, denominator, owner, measure)
{
    const fontSize = owner.fontSize;
    const fontFamily = owner.fontFamily;
    const fracSize = fontSize * 0.62;                 // fraction digits run smaller inline
    const group = new jsvgGroup();

    const numW = Math.max(measure(numerator, fracSize, false), 4);
    const denW = Math.max(measure(denominator, fracSize, false), 4);
    const inkH = measureDigitHeight(owner, fracSize);

    const digitWidth = Math.max(numW, denW);
    const wholeWidth = whole ? measure(whole, fontSize, false) + fontSize * 0.14 : 0;
    // The rule overhangs the widest digit slightly, like typeset fractions.
    const barLength = digitWidth + fontSize * 0.22;
    const barWidth = barLength + fontSize * 0.08;
    const gap = fontSize * 0.17;
    const barStroke = Math.max(1.4, fontSize * 0.055);
    const aboveBar = inkH / 2 + gap + barStroke / 2;
    const belowBar = aboveBar;
    const barY = aboveBar + barStroke / 2;
    let x = 0;

    if ( whole )
    {
        const wholeLabel = makeWordLabel(whole, FRACTION_INK, FRACTION_WEIGHT, fontSize, fontFamily);
        wholeLabel.setPosition(0, barY);
        group.addChild(wholeLabel);
        x += wholeWidth;
    }

    // Digits are CENTER-anchored on the bar's midline; anchors sit a half-ink
    // plus the gap from the rule, so the nearest ink edge clears it by `gap`.
    const cx = x + barWidth / 2;

    const numLabel = makeCenteredLabel(String(numerator), FRACTION_INK, FRACTION_WEIGHT, fracSize, fontFamily);
    numLabel.setPosition(cx, barY - barStroke / 2 - gap - inkH / 2);
    group.addChild(numLabel);

    const denLabel = makeCenteredLabel(String(denominator), FRACTION_INK, FRACTION_WEIGHT, fracSize, fontFamily);
    denLabel.setPosition(cx, barY + barStroke / 2 + gap + inkH / 2);
    group.addChild(denLabel);

    const bar = new jsvgLine();
    bar.setStrokeColor(FRACTION_INK);
    bar.setStrokeWidth(barStroke);
    bar.setEndpoints(cx - barLength / 2, barY, cx + barLength / 2, barY);
    group.addChild(bar);

    return {
        width: x + barWidth,
        height: aboveBar + belowBar + barStroke,
        visual: group,
    };
}

/**
 * Cap-height estimate for fraction digits. Uses canvas ascent/descent when a
 * DOM is present; heuristic otherwise.
 */
function measureDigitHeight(owner, fontSize)
{
    const context = owner._getMeasureContext();
    if ( !context )
        return fontSize * 1.15;
    context.font = `400 ${fontSize}px ${owner.fontFamily}`;
    const metrics = context.measureText("8");
    const ascent = Number.isFinite(metrics.actualBoundingBoxAscent) ? metrics.actualBoundingBoxAscent : fontSize * 0.72;
    const descent = Number.isFinite(metrics.actualBoundingBoxDescent) ? metrics.actualBoundingBoxDescent : fontSize * 0.04;
    return ascent + descent;
}


/* ------------------------------------------------------------------ */

// Matches the omdShapes glyph-width heuristic (~0.58em average) so layout is
// deterministic between Node and browser without DOM measurement.
function estimateTextWidth(text, fontSize, bold)
{
    const ratio = bold ? 0.62 : 0.58;
    return String(text || "").length * fontSize * ratio;
}

function spaceWidth(fontSize)
{
    return fontSize * 0.30;
}
