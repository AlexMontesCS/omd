import { jsvgGroup, jsvgLine, jsvgTextLine } from "@teachinglab/jsvg";

/**
 * Pure-SVG typesetting for the fraction visuals (omdFractionWork,
 * omdFractionAreaModel): a math run is a flat list of items —
 *
 *   { t: 'num',  v: '12' }                 number, centered in its slot
 *   { t: 'op',   v: '×' }                  operator with surrounding space
 *   { t: 'word', v: 'of the whole' }       prose, left-aligned
 *   { t: 'frac', num: [...], den: [...], whole: '2' | null }   stacked fraction
 *
 * Any item may carry `color`. Runs are laid out on a math axis `cy` (the
 * fraction bar), so whole numbers and operators line up with the bars.
 *
 * No DOM measurement: widths come from a glyph table, so layout is identical
 * in the browser and in Node and survives SVG export without foreignObject.
 */

export const num = (v, color) => ({ t: "num", v: String(v), color });
export const op = (v, color) => ({ t: "op", v, color });
export const word = (v, color) => ({ t: "word", v, color });
const items = (part) => (Array.isArray(part) ? part : [num(part)]);
export const frac = (n, d, { whole = null, color } = {}) => ({
    t: "frac",
    num: items(n),
    den: items(d),
    whole: whole === null ? null : String(whole),
    color,
});

/* ================= typesetting ================= */

// Deterministic glyph-width estimates (no DOM measurement) so layout matches
// in the browser and in Node. Each number/operator is centered in its own
// slot, so estimate error only changes spacing, never overlaps glyphs.
const OP_EM = 1.15;
const OP_EM_INNER = 0.95;
const FRAC_SCALE = 0.9;

// Advance widths of Albert Sans (OMD_MATH_FONT_FAMILY) in thousandths of an em,
// measured from the regular weight. Arial, the fallback, is within a few percent.
const GLYPH_WIDTH = (() => {
    const table = {};
    const spec = "a528 b606 c556 d606 e564 f324 g606 h567 i258 j251 k518 l228 m896 n563 o590 p606 q606 r360 s475 t352 u562 "
        + "v527 w754 x491 y513 z479 A672 B660 C765 D729 E609 F587 G770 H705 I250 J508 K607 L520 M864 N705 O781 P612 Q781 "
        + "R625 S574 T610 U697 V677 W971 X708 Y649 Z596 0629 1306 2601 3599 4655 5624 6599 7556 8632 9599 .235 ,264 ;280 "
        + ":244 '190 \u2019250 !261 ?548 (408 )409 -521 \u00d7555 \u00f7637 =667 +636 \u2212521 /319";
    for ( const entry of spec.split(" ") )
        table[entry[0]] = Number(entry.slice(1)) / 1000;
    table[" "] = 0.28;
    return table;
})();

export function textWidth(text, size)
{
    let em = 0;
    for ( const ch of String(text) )
        em += GLYPH_WIDTH[ch] ?? 0.58;
    return em * size;
}

function fracMetrics(item, size)
{
    const fs = size * FRAC_SCALE;
    const numW = measureItems(item.num, fs, true);
    const denW = measureItems(item.den, fs, true);
    const barW = Math.max(numW, denW) + size * 0.3;
    const wholeW = item.whole === null ? 0 : textWidth(item.whole, size) + size * 0.12;
    const side = size * 0.08;
    return { fs, numW, denW, barW, wholeW, side, width: side + wholeW + barW + side };
}

function itemWidth(item, size, inner)
{
    switch ( item.t )
    {
        case "num": return textWidth(item.v, size);
        case "op": return (inner ? OP_EM_INNER : OP_EM) * size;
        case "word": return textWidth(item.v, size);
        case "frac": return fracMetrics(item, size).width;
        default: return 0;
    }
}

export function measureItems(list, size, inner = false)
{
    return list.reduce((sum, item) => sum + itemWidth(item, size, inner), 0);
}

function fracVertical(size)
{
    const fs = size * FRAC_SCALE;
    const stroke = Math.max(1.4, size * 0.055);
    const gap = size * 0.14;
    // Digit ink is ~0.72em tall; its center sits this far from the bar.
    const offset = stroke / 2 + gap + fs * 0.36;
    return { fs, stroke, offset, reach: offset + fs * 0.36 + size * 0.06 };
}

/** Space a row needs above and below its math axis. */
export function extentOfItems(list, size)
{
    let reach = size * 0.5;
    for ( const item of list )
    {
        if ( item.t === "frac" )
            reach = Math.max(reach, fracVertical(size).reach);
    }
    return { above: reach, below: reach };
}

export function mergeExtent(target, other)
{
    target.above = Math.max(target.above, other.above);
    target.below = Math.max(target.below, other.below);
}

export function drawItems(holder, list, x, cy, size, style, inner = false)
{
    let cursor = x;
    for ( const item of list )
    {
        const w = itemWidth(item, size, inner);
        const color = item.color || style.color;

        if ( item.t === "num" || item.t === "op" )
        {
            holder.addChild(makeText(item.v, cursor + w / 2, cy, size, color, style.weight, "center", style.fontFamily));
        }
        else if ( item.t === "word" )
        {
            // SVG collapses leading whitespace, so it becomes an x offset.
            const lead = item.v.length - item.v.trimStart().length;
            const offset = textWidth(item.v.slice(0, lead), size);
            holder.addChild(makeText(item.v.trimStart(), cursor + offset, cy, size, color, style.weight, "left", style.fontFamily));
        }
        else if ( item.t === "frac" )
        {
            const m = fracMetrics(item, size);
            const v = fracVertical(size);
            const fracStyle = { ...style, color };

            if ( item.whole !== null )
                holder.addChild(makeText(item.whole, cursor + m.side + (m.wholeW - size * 0.12) / 2, cy, size, color, style.weight, "center", style.fontFamily));

            const barX = cursor + m.side + m.wholeW;
            const center = barX + m.barW / 2;
            drawItems(holder, item.num, center - m.numW / 2, cy - v.offset, m.fs, fracStyle, true);
            drawItems(holder, item.den, center - m.denW / 2, cy + v.offset, m.fs, fracStyle, true);

            const bar = new jsvgLine();
            bar.setStrokeColor(color);
            bar.setStrokeWidth(v.stroke * (style.weight >= 700 ? 1.25 : 1));
            bar.setEndpoints(barX, cy, barX + m.barW, cy);
            holder.addChild(bar);
        }

        cursor += w;
    }
    return cursor - x;
}

export function makeText(text, x, y, size, color, weight, align, fontFamily)
{
    const label = new jsvgTextLine();
    label.setFontFamily(fontFamily);
    label.setFontSize(size);
    label.setFontColor(color);
    label.setFontWeight(weight);
    label.setAlignment(align);
    label.setText(text);
    label.setPosition(x, y);
    label.svgObject.setAttribute("dominant-baseline", "central");
    return label;
}

/**
 * Caption markup → items. `[3/4]`, `[2 1/2]` and `[6]` become math, the rest
 * is prose: "[1/4] of [1/3] is [1/12]".
 */
export function parseFractionMarkup(markup)
{
    const out = [];
    const pattern = /\[\s*(?:(\d+)\s+)?(\d+)(?:\s*\/\s*(\d+))?\s*\]/g;
    let last = 0;
    let match;
    while ( (match = pattern.exec(markup)) !== null )
    {
        if ( match.index > last )
            out.push(word(markup.slice(last, match.index)));
        if ( match[3] === undefined )
            out.push(num(match[1] === undefined ? match[2] : `${match[1]} ${match[2]}`));
        else
            out.push(frac(match[2], match[3], { whole: match[1] === undefined ? null : match[1] }));
        last = pattern.lastIndex;
    }
    if ( last < markup.length )
        out.push(word(markup.slice(last)));
    return out;
}

// A bare fraction or mixed number inside plain label text: "3/10", "4 1/2".
// Digits, dots or slashes on either side mean it is part of something else
// (a date, a decimal, "1/2/3"), so it stays flat.
const BARE_FRACTION = /(?<![\d./])(?:(\d+) )?(\d+)\/(\d+)(?![\d/])/g;

/** True when plain label text holds a fraction that should be stacked. */
export function hasFractionText(text)
{
    BARE_FRACTION.lastIndex = 0;
    const found = BARE_FRACTION.test(String(text ?? ""));
    BARE_FRACTION.lastIndex = 0;
    return found;
}

/**
 * Plain label text → items, every bare fraction stacked:
 * "1/4 × 3 = 3/4", "4 1/2", "3/10 cup".
 */
export function parseFractionText(text)
{
    const source = String(text ?? "");
    const out = [];
    let last = 0;
    for ( const match of source.matchAll(BARE_FRACTION) )
    {
        if ( match.index > last )
            out.push(word(source.slice(last, match.index)));
        out.push(frac(match[2], match[3], { whole: match[1] ?? null }));
        last = match.index + match[0].length;
    }
    if ( last < source.length )
        out.push(word(source.slice(last)));
    return out;
}

/** Size of a plain-text label once its fractions are stacked. */
export function measureFractionText(text, fontSize)
{
    const runs = parseFractionText(text);
    const extent = extentOfItems(runs, fontSize);
    return { width: measureItems(runs, fontSize), above: extent.above, below: extent.below, height: extent.above + extent.below };
}

/**
 * The one way OMD labels typeset fraction strings — tape boxes and braces,
 * table cells, shape labels, area models. Returns a group centred on its
 * origin (move it with setPosition(cx, cy)), or null when the text has no
 * fraction so callers keep their ordinary text path.
 */
export function makeFractionTextLabel(text, { fontSize, color = "black", fontFamily, fontWeight = 400 })
{
    if ( !hasFractionText(text) )
        return null;

    const runs = parseFractionText(text);
    const size = measureFractionText(text, fontSize);
    const group = new jsvgGroup();
    drawItems(group, runs, -size.width / 2, 0, fontSize, { color, weight: fontWeight, fontFamily });
    group.width = size.width;
    group.height = size.height;
    return group;
}
