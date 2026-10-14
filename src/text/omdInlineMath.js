/**
 * omdInlineMath — the grammar behind text-first math.
 *
 * Parses a prose string into a flat list of inline nodes where prose stays
 * prose (real words, in order, translatable by Chrome) and only the math is
 * lifted into a small typesetting AST. Nothing here touches the DOM; see
 * omdInlineMathHtml.js for rendering.
 *
 * Accepted markup:
 *   \( 4x + 2 \)   LaTeX-subset inline math (primary)
 *   [3/4]          legacy omdMathText bracket token (fraction)
 *   [2 3/4]        legacy mixed number
 *   [6]            legacy bare number
 *   3/4, 2 5/8     bare fractions in running prose (auto-detected)
 *   **bold**       bold prose span
 *   \n             hard line break
 *
 * LaTeX subset inside \( ... \):
 *   \frac{a}{b} \dfrac \tfrac, a/b, x^2 x^{n+1}, a_1 a_{ij}, \sqrt{x} \sqrt[3]{x},
 *   ( ) [ ] with \left \right, \text{...} (stays translatable),
 *   \times \div \cdot \pm \mp \le \leq \ge \geq \ne \neq \approx \equiv
 *   \pi \theta \alpha \beta \degree \circ \percent \infty \to \rightarrow.
 *
 * Node shapes:
 *   { kind: "text",  value }                      prose run (translatable)
 *   { kind: "bold",  value }                      bold prose run (translatable)
 *   { kind: "break" }                             hard line break
 *   { kind: "math",  nodes: MathNode[], plain }   math run (never translated)
 *
 *   MathNode
 *   { t: "num",    v }
 *   { t: "ident",  v }                            variable / function name
 *   { t: "op",     v }                            spaced operator or relation
 *   { t: "punct",  v }                            comma / period, space after
 *   { t: "sym",    v }                            bare symbol, no extra spacing
 *   { t: "text",   v }                            \text{...} — translatable
 *   { t: "frac",   num: MathNode[], den: MathNode[] }
 *   { t: "mixed",  whole: MathNode[], num: MathNode[], den: MathNode[] }
 *   { t: "script", base: MathNode, sup?: MathNode[], sub?: MathNode[] }
 *   { t: "sqrt",   radicand: MathNode[], index?: MathNode[] }
 *   { t: "group",  open, close, children: MathNode[] }
 */

/** Commands that render as a single glyph. */
const SYMBOL_COMMANDS = {
    times: "\u00d7",
    div: "\u00f7",
    cdot: "\u00b7",
    pm: "\u00b1",
    mp: "\u2213",
    le: "\u2264",
    leq: "\u2264",
    ge: "\u2265",
    geq: "\u2265",
    ne: "\u2260",
    neq: "\u2260",
    approx: "\u2248",
    equiv: "\u2261",
    to: "\u2192",
    rightarrow: "\u2192",
    infty: "\u221e",
    pi: "\u03c0",
    theta: "\u03b8",
    alpha: "\u03b1",
    beta: "\u03b2",
    degree: "\u00b0",
    circ: "\u00b0",
    percent: "%",
};

/** Glyphs that read as relations/operators and therefore get side bearings. */
const SPACED_GLYPHS = new Set([
    "+", "=", "<", ">",
    "\u2212", "\u00d7", "\u00f7", "\u00b7", "\u00b1", "\u2213",
    "\u2264", "\u2265", "\u2260", "\u2248", "\u2261", "\u2192",
]);

const OPENERS = { "(": ")", "[": "]", "\\{": "\\}" };

/* ------------------------------------------------------------------ */
/* Prose scanning                                                      */
/* ------------------------------------------------------------------ */

/**
 * Parses a prose string into inline nodes.
 *
 * @param {string} source
 * @param {object} [options]
 * @param {boolean} [options.autoFractions=true] detect bare `3/4` / `2 5/8`
 * @param {boolean} [options.bracketTokens=true] accept legacy `[3/4]` tokens
 * @param {boolean} [options.bold=true] accept `**bold**`
 * @returns {Array<object>} inline nodes
 */
export function parseInlineMath(source, options = {})
{
    const raw = source == null ? "" : String(source);
    const autoFractions = options.autoFractions !== false;
    const bracketTokens = options.bracketTokens !== false;
    const allowBold = options.bold !== false;

    const nodes = [];
    let pending = "";
    let index = 0;

    const flush = () => {
        if ( pending.length === 0 )
            return;
        nodes.push({ kind: "text", value: pending });
        pending = "";
    };

    const pushMath = (mathNodes) => {
        if ( mathNodes.length === 0 )
            return;
        flush();
        nodes.push({ kind: "math", nodes: mathNodes, plain: mathNodesToPlainText(mathNodes) });
    };

    while ( index < raw.length )
    {
        const char = raw[index];

        // Escaped delimiter: "\\(" renders a literal "(" and never opens math.
        if ( char === "\\" && index + 2 < raw.length && raw[index + 1] === "\\" )
        {
            pending += raw[index + 2];
            index += 3;
            continue;
        }

        if ( char === "\n" )
        {
            flush();
            nodes.push({ kind: "break" });
            index += 1;
            continue;
        }

        if ( char === "\\" && (raw[index + 1] === "(" || raw[index + 1] === "[") )
        {
            const close = raw[index + 1] === "(" ? "\\)" : "\\]";
            const end = raw.indexOf(close, index + 2);
            if ( end !== -1 )
            {
                pushMath(parseMathSource(raw.slice(index + 2, end)));
                index = end + 2;
                continue;
            }
        }

        if ( allowBold && char === "*" && raw[index + 1] === "*" )
        {
            const end = raw.indexOf("**", index + 2);
            if ( end !== -1 && end > index + 2 )
            {
                flush();
                nodes.push({ kind: "bold", value: raw.slice(index + 2, end) });
                index = end + 2;
                continue;
            }
        }

        if ( bracketTokens && char === "[" )
        {
            const end = raw.indexOf("]", index + 1);
            if ( end !== -1 )
            {
                const token = raw.slice(index + 1, end);
                const parsed = parseBracketToken(token);
                if ( parsed )
                {
                    pushMath(parsed);
                    index = end + 1;
                    continue;
                }
            }
        }

        if ( autoFractions && char >= "0" && char <= "9" && isFractionBoundary(raw[index - 1]) )
        {
            const bare = matchBareFraction(raw, index);
            if ( bare )
            {
                pushMath(bare.nodes);
                index = bare.end;
                continue;
            }
        }

        pending += char;
        index += 1;
    }

    flush();
    return nodes;
}

/**
 * Plain-text projection of a parsed string: what a screen reader, the TTS
 * pipeline or an answer grader should see. Math collapses back to linear
 * notation (`3/4`, `x^2`, `sqrt(2)`).
 *
 * @param {string|Array<object>} sourceOrNodes
 * @returns {string}
 */
export function inlineMathToPlainText(sourceOrNodes)
{
    const nodes = Array.isArray(sourceOrNodes) ? sourceOrNodes : parseInlineMath(sourceOrNodes);
    let out = "";
    for ( const node of nodes )
    {
        if ( node.kind === "break" ) out += "\n";
        else if ( node.kind === "math" ) out += node.plain != null ? node.plain : mathNodesToPlainText(node.nodes);
        else out += node.value;
    }
    return out;
}

/**
 * True when the string contains anything this module would typeset — lets
 * callers skip the render path for pure prose.
 *
 * @param {string} source
 * @param {object} [options] same options as parseInlineMath
 * @returns {boolean}
 */
export function hasInlineMath(source, options)
{
    return parseInlineMath(source, options).some(node => node.kind === "math");
}

/* ------------------------------------------------------------------ */
/* Bare fractions and legacy bracket tokens                            */
/* ------------------------------------------------------------------ */

// A bare fraction only counts at a word edge: "3/4" and "2 5/8" typeset, but
// "km/h", "9/12/2025" and "1.5/2" stay literal text.
function isFractionBoundary(previousChar)
{
    if ( previousChar === undefined )
        return true;
    return !/[A-Za-z0-9./\\]/.test(previousChar);
}

function matchBareFraction(raw, index)
{
    const pattern = /(\d+)[ \t](\d+)\/(\d+)|(\d+)\/(\d+)/y;
    pattern.lastIndex = index;
    const match = pattern.exec(raw);
    if ( !match )
        return null;

    const end = index + match[0].length;
    const next = raw[end];
    // Reject dates and ratios-of-ratios: "3/4/2025", "3/45x".
    if ( next !== undefined && /[A-Za-z0-9/]/.test(next) )
        return null;

    const nodes = match[1] !== undefined
        ? [makeMixed(match[1], match[2], match[3])]
        : [makeFraction(match[4], match[5])];

    return { nodes, end };
}

/**
 * Legacy `[...]` token. Returns math nodes, or null to leave the bracketed
 * text literal — the same graceful degradation the SVG mathText had.
 */
function parseBracketToken(token)
{
    const trimmed = token.trim();
    if ( trimmed.length === 0 )
        return null;

    const mixed = trimmed.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
    if ( mixed )
        return [makeMixed(mixed[1], mixed[2], mixed[3])];

    const fraction = trimmed.match(/^(-?\d+)\/(\d+)$/);
    if ( fraction )
        return [makeFraction(fraction[1], fraction[2])];

    if ( /^-?\d+(?:\.\d+)?$/.test(trimmed) )
        return [{ t: "num", v: trimmed }];

    return null;
}

function makeFraction(numerator, denominator)
{
    return { t: "frac", num: [{ t: "num", v: String(numerator) }], den: [{ t: "num", v: String(denominator) }] };
}

function makeMixed(whole, numerator, denominator)
{
    return {
        t: "mixed",
        whole: [{ t: "num", v: String(whole) }],
        num: [{ t: "num", v: String(numerator) }],
        den: [{ t: "num", v: String(denominator) }],
    };
}

/* ------------------------------------------------------------------ */
/* LaTeX subset                                                        */
/* ------------------------------------------------------------------ */

/**
 * Parses the inside of `\( ... \)` into math nodes.
 *
 * @param {string} source
 * @returns {Array<object>}
 */
export function parseMathSource(source)
{
    const tokens = tokenizeMath(source == null ? "" : String(source));
    const parser = { tokens, index: 0 };
    return parseRow(parser, null);
}

function tokenizeMath(source)
{
    const tokens = [];
    let index = 0;

    while ( index < source.length )
    {
        const char = source[index];

        if ( char === " " || char === "\t" || char === "\n" )
        {
            // Whitespace is layout-insignificant in TeX but marks the gap in a
            // mixed number ("2 1/2"), so it survives as a token.
            if ( tokens.length > 0 && tokens[tokens.length - 1].type !== "space" )
                tokens.push({ type: "space" });
            index += 1;
            continue;
        }

        if ( char === "\\" )
        {
            const command = /^[a-zA-Z]+/.exec(source.slice(index + 1));
            if ( command )
            {
                tokens.push({ type: "command", value: command[0] });
                index += 1 + command[0].length;
                continue;
            }
            const escaped = source[index + 1];
            if ( escaped === undefined )
            {
                index += 1;
                continue;
            }
            // \{ \} \% \$ are literals; \, \; \! \  are author-requested gaps
            // and, unlike source whitespace, they survive into the output.
            if ( escaped === "," || escaped === ";" || escaped === "!" || escaped === " " )
                tokens.push({ type: "space", explicit: true });
            else
                tokens.push({ type: "char", value: escaped, literal: true });
            index += 2;
            continue;
        }

        if ( char >= "0" && char <= "9" )
        {
            const number = /^\d+(?:\.\d+)?/.exec(source.slice(index))[0];
            tokens.push({ type: "number", value: number });
            index += number.length;
            continue;
        }

        if ( /[A-Za-z]/.test(char) )
        {
            const word = /^[A-Za-z]+/.exec(source.slice(index))[0];
            tokens.push({ type: "word", value: word });
            index += word.length;
            continue;
        }

        tokens.push({ type: "char", value: char });
        index += 1;
    }

    return tokens;
}

function peek(parser)
{
    return parser.tokens[parser.index];
}

function skipSpace(parser)
{
    while ( peek(parser) && peek(parser).type === "space" )
        parser.index += 1;
}

/**
 * Parses tokens until `stop` (a literal char token value) or the end.
 * `stop` is consumed by the caller.
 */
function parseRow(parser, stop)
{
    const nodes = [];

    while ( parser.index < parser.tokens.length )
    {
        const token = peek(parser);

        if ( stop && token.type === "char" && token.value === stop && !token.literal )
            break;

        if ( token.type === "space" )
        {
            parser.index += 1;
            if ( nodes.length > 0 )
                nodes.push({ t: "space", implicit: !token.explicit });
            continue;
        }

        if ( token.type === "char" && token.value === "}" && !token.literal )
            break;

        // `\right)` closes the row opened by `\left(` — the delimiter itself
        // is drawn by the group, so both tokens are consumed here.
        if ( token.type === "command" && token.value === "right" )
        {
            parser.index += 1;
            skipSpace(parser);
            const delimiter = peek(parser);
            if ( delimiter && (delimiter.type === "char" || delimiter.type === "command") )
                parser.index += 1;
            break;
        }

        const atom = parseAtom(parser);
        if ( !atom )
            continue;

        nodes.push(attachScripts(parser, atom));
    }

    return dropImplicitSpaces(mergeMixedNumbers(markUnaryMinus(collapseSlashes(trimSpaces(nodes)))));
}

function parseAtom(parser)
{
    const token = peek(parser);
    if ( !token )
        return null;

    if ( token.type === "number" )
    {
        parser.index += 1;
        return { t: "num", v: token.value };
    }

    if ( token.type === "word" )
    {
        parser.index += 1;
        return { t: "ident", v: token.value };
    }

    if ( token.type === "command" )
        return parseCommand(parser);

    parser.index += 1;
    const char = token.value;

    if ( char === "{" && !token.literal )
    {
        const children = parseRow(parser, null);
        expectClose(parser, "}");
        return { t: "group", open: "", close: "", children };
    }

    if ( !token.literal && (char === "(" || char === "[") )
    {
        const children = parseRow(parser, OPENERS[char]);
        expectClose(parser, OPENERS[char]);
        return { t: "group", open: char, close: OPENERS[char], children };
    }

    if ( char === "-" )
        return { t: "op", v: "\u2212" };

    if ( SPACED_GLYPHS.has(char) )
        return { t: "op", v: char };

    if ( char === "," || char === ";" )
        return { t: "punct", v: char };

    return { t: "sym", v: char };
}

function parseCommand(parser)
{
    const token = parser.tokens[parser.index];
    parser.index += 1;
    const name = token.value;

    if ( name === "frac" || name === "dfrac" || name === "tfrac" )
    {
        const num = parseArgument(parser);
        const den = parseArgument(parser);
        return { t: "frac", num, den };
    }

    if ( name === "sqrt" )
    {
        skipSpace(parser);
        let index;
        const next = peek(parser);
        if ( next && next.type === "char" && next.value === "[" && !next.literal )
        {
            parser.index += 1;
            index = parseRow(parser, "]");
            expectClose(parser, "]");
        }
        return { t: "sqrt", radicand: parseArgument(parser), index };
    }

    if ( name === "text" || name === "mathrm" || name === "textrm" || name === "mbox" )
        return { t: "text", v: readRawArgument(parser) };

    if ( name === "left" || name === "right" )
    {
        // Delimiter sizing is irrelevant at inline sizes; keep the delimiter.
        skipSpace(parser);
        const next = peek(parser);
        if ( next && (next.type === "char" || next.type === "command") )
        {
            parser.index += 1;
            const glyph = next.type === "command" ? (SYMBOL_COMMANDS[next.value] || "") : next.value;
            if ( glyph === "." || glyph === "" )
                return null;
            if ( name === "left" && OPENERS[glyph] )
            {
                const children = parseRow(parser, OPENERS[glyph]);
                return { t: "group", open: glyph, close: OPENERS[glyph], children };
            }
            return { t: "sym", v: glyph };
        }
        return null;
    }

    const symbol = SYMBOL_COMMANDS[name];
    if ( symbol )
        return SPACED_GLYPHS.has(symbol) ? { t: "op", v: symbol } : { t: "sym", v: symbol };

    // Unknown command degrades to its literal name rather than vanishing.
    return { t: "ident", v: name };
}

/** Reads `{...}` (or a single following atom, TeX-style) as a node row. */
function parseArgument(parser)
{
    skipSpace(parser);
    const token = peek(parser);
    if ( !token )
        return [];

    if ( token.type === "char" && token.value === "{" && !token.literal )
    {
        parser.index += 1;
        const children = parseRow(parser, null);
        expectClose(parser, "}");
        return children;
    }

    const atom = parseAtom(parser);
    return atom ? [atom] : [];
}

/** Reads `{...}` verbatim — used by \text so prose keeps its spaces. */
function readRawArgument(parser)
{
    skipSpace(parser);
    const token = peek(parser);
    if ( !token || token.type !== "char" || token.value !== "{" )
    {
        const atom = parseAtom(parser);
        return atom ? mathNodesToPlainText([atom]) : "";
    }

    parser.index += 1;
    let depth = 1;
    let out = "";

    while ( parser.index < parser.tokens.length )
    {
        const next = parser.tokens[parser.index++];
        if ( next.type === "char" && !next.literal && next.value === "{" ) depth += 1;
        if ( next.type === "char" && !next.literal && next.value === "}" )
        {
            depth -= 1;
            if ( depth === 0 ) break;
        }
        if ( next.type === "space" ) out += " ";
        else if ( next.type === "command" ) out += SYMBOL_COMMANDS[next.value] || next.value;
        else out += next.value;
    }

    return out;
}

function expectClose(parser, glyph)
{
    const token = peek(parser);
    if ( token && token.type === "char" && token.value === glyph && !token.literal )
        parser.index += 1;
}

/** Consumes any `^`/`_` following an atom and wraps it in a script node. */
function attachScripts(parser, atom)
{
    let node = atom;

    for (;;)
    {
        const token = peek(parser);
        if ( !token || token.type !== "char" || token.literal )
            break;
        if ( token.value !== "^" && token.value !== "_" )
            break;

        parser.index += 1;
        const argument = parseArgument(parser);

        if ( node.t === "script" )
        {
            if ( token.value === "^" ) node.sup = argument;
            else node.sub = argument;
        }
        else
        {
            node = token.value === "^"
                ? { t: "script", base: node, sup: argument }
                : { t: "script", base: node, sub: argument };
        }
    }

    return node;
}

function trimSpaces(nodes)
{
    let start = 0;
    let end = nodes.length;
    while ( start < end && nodes[start].t === "space" ) start += 1;
    while ( end > start && nodes[end - 1].t === "space" ) end -= 1;
    return nodes.slice(start, end);
}

/**
 * `a / b` builds a real fraction when both sides are single atoms — the way
 * authors actually type `1/2` and `(x+1)/2` inside \( ... \).
 */
function collapseSlashes(nodes)
{
    const out = [];

    for ( let i = 0; i < nodes.length; i += 1 )
    {
        const node = nodes[i];
        const isSlash = node.t === "sym" && node.v === "/";
        const previous = out[out.length - 1];
        const next = nodes[i + 1];

        if ( isSlash && previous && next && isFractionOperand(previous) && isFractionOperand(next) )
        {
            out[out.length - 1] = { t: "frac", num: [unwrapGroup(previous)], den: [unwrapGroup(next)] };
            i += 1;
            continue;
        }

        out.push(node);
    }

    return out;
}

function isFractionOperand(node)
{
    return node.t === "num" || node.t === "ident" || node.t === "group" || node.t === "script";
}

// (x+1)/2 reads better with the parentheses dropped once it is stacked.
function unwrapGroup(node)
{
    if ( node.t === "group" && node.open === "(" && node.children.length > 0 )
        return { t: "group", open: "", close: "", children: node.children };
    return node;
}

/**
 * `2 1/2` and `2\frac{1}{2}` are both one mixed number: a bare number
 * immediately followed by a fraction, with at most a gap between them.
 */
function mergeMixedNumbers(nodes)
{
    const out = [];

    for ( let i = 0; i < nodes.length; i += 1 )
    {
        const node = nodes[i];
        const gap = nodes[i + 1] && nodes[i + 1].t === "space" ? nodes[i + 1] : null;
        const fraction = nodes[i + (gap ? 2 : 1)];

        if ( node.t === "num" && fraction && fraction.t === "frac" )
        {
            out.push({ t: "mixed", whole: [node], num: fraction.num, den: fraction.den });
            i += gap ? 2 : 1;
            continue;
        }

        out.push(node);
    }

    return out;
}

/**
 * A minus with no operand to its left is a sign, not a subtraction: `-2`,
 * `10^{-2}`, `(-x)`. Signs hug their operand instead of taking side bearings.
 */
function markUnaryMinus(nodes)
{
    return nodes.map((node, i) => {
        if ( node.t !== "op" || node.v !== "\u2212" )
            return node;

        let before;
        for ( let j = i - 1; j >= 0 && !before; j -= 1 )
            if ( nodes[j].t !== "space" ) before = nodes[j];

        const unary = !before || before.t === "op" || before.t === "punct";
        return unary ? { t: "sym", v: "\u2212" } : node;
    });
}

/**
 * TeX ignores source whitespace — `2 \pi r` sets as `2πr`, and the visible
 * gaps around a relation come from the operator's own side bearings. Spaces
 * the author asked for (`\,` `\;` `\ `) are kept.
 */
function dropImplicitSpaces(nodes)
{
    return nodes.filter(node => node.t !== "space" || !node.implicit);
}

/* ------------------------------------------------------------------ */
/* Plain-text projection                                               */
/* ------------------------------------------------------------------ */

/**
 * Linear notation for a math row.
 *
 * @param {Array<object>} nodes
 * @returns {string}
 */
export function mathNodesToPlainText(nodes)
{
    let out = "";

    for ( const node of nodes || [] )
    {
        switch ( node.t )
        {
            case "num":
            case "ident":
            case "text":
                out += node.v;
                break;
            case "sym":
                out += node.v === "\u2212" ? "-" : node.v;
                break;
            case "op":
                out += ` ${node.v === "\u2212" ? "-" : node.v} `;
                break;
            case "punct":
                out += `${node.v} `;
                break;
            case "space":
                out += " ";
                break;
            case "frac":
                out += `${wrapPlain(node.num)}/${wrapPlain(node.den)}`;
                break;
            case "mixed":
                out += `${mathNodesToPlainText(node.whole)} ${wrapPlain(node.num)}/${wrapPlain(node.den)}`;
                break;
            case "script":
                out += mathNodesToPlainText([node.base]);
                if ( node.sub ) out += `_${wrapPlain(node.sub)}`;
                if ( node.sup ) out += `^${wrapPlain(node.sup)}`;
                break;
            case "sqrt":
                out += node.index
                    ? `root${mathNodesToPlainText(node.index)}(${mathNodesToPlainText(node.radicand)})`
                    : `sqrt(${mathNodesToPlainText(node.radicand)})`;
                break;
            case "group":
                out += `${node.open}${mathNodesToPlainText(node.children)}${node.close}`;
                break;
            default:
                break;
        }
    }

    return out.replace(/\s+/g, " ").trim();
}

// Multi-atom numerators/exponents need parentheses to stay unambiguous once
// the layout is gone: (x+1)/2, x^(n+1).
function wrapPlain(nodes)
{
    const text = mathNodesToPlainText(nodes);
    const atomic = nodes && nodes.length === 1 && (nodes[0].t === "num" || nodes[0].t === "ident" || nodes[0].t === "sym");
    return atomic || /^-?[A-Za-z0-9.]+$/.test(text) ? text : `(${text})`;
}
