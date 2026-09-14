/**
 * Exact rational helpers shared by the fraction visuals (area diagrams,
 * fraction strips, fraction circles).
 *
 * Grade 5 fraction work is exact by nature — "3 1/4 x 4" must land on 13 and
 * not 12.999999999999998 — so every side length, partition and shaded extent
 * is carried as an integer numerator/denominator pair and only converted to a
 * float at pixel time.
 */

function gcd(a, b)
{
    a = Math.abs(a);
    b = Math.abs(b);
    while ( b )
    {
        const t = a % b;
        a = b;
        b = t;
    }
    return a || 1;
}

/** Normalizes sign and reduces to lowest terms. */
export function makeRational(n, d)
{
    if ( !Number.isFinite(n) || !Number.isFinite(d) || d === 0 ) return null;

    let num = Math.round(n);
    let den = Math.round(d);
    if ( den < 0 ) { num = -num; den = -den; }

    const g = gcd(num, den);
    return { n: num / g, d: den / g };
}

function rationalFromDecimal(value)
{
    if ( Number.isInteger(value) ) return { n: value, d: 1 };

    // Exact decimal → fraction (no float search): 3.4 → 34/10 → 17/5.
    const text = String(value);
    const exponentMatch = text.match(/e[+-]?\d+$/i);
    if ( exponentMatch ) return makeRational(Math.round(value * 1e6), 1e6);

    const decimals = (text.split(".")[1] || "").length;
    const scale = Math.pow(10, Math.min(decimals, 9));
    return makeRational(value * scale, scale);
}

// Trailing unit words: "1 1/2 ft", "8 square units", "3 yd.".
const UNIT_SUFFIX = /\s+[A-Za-z][A-Za-z.\u00b2]*(?:\s+[A-Za-z][A-Za-z.\u00b2]*)*$/;

/**
 * Accepts 2, 0.75, "3/4", "3 1/4", "3-1/4", "1 1/2 ft", "8 square units".
 * Returns a reduced { n, d } or `fallback`.
 *
 * The numeric part must match in full. That matters for answer grading: a
 * lenient parse would read "5 x 4/3" as 5 and mark it equal to "5 x 3/4".
 */
export function parseRational(value, fallback = null)
{
    if ( value === undefined || value === null || value === "" ) return fallback;

    if ( typeof value === "object" )
    {
        if ( Number.isFinite(value.n) && Number.isFinite(value.d) )
            return makeRational(value.n, value.d) ?? fallback;
        return fallback;
    }

    if ( typeof value === "number" )
        return Number.isFinite(value) ? rationalFromDecimal(value) : fallback;

    const text = String(value).trim().replace(UNIT_SUFFIX, "").trim();
    if ( text === "" ) return fallback;

    const mixed = text.match(/^(-?\d+)[\s-]+(\d+)\s*\/\s*(\d+)$/);
    if ( mixed )
    {
        const whole = Number(mixed[1]);
        const num = Number(mixed[2]);
        const den = Number(mixed[3]);
        if ( den === 0 ) return fallback;
        const sign = whole < 0 ? -1 : 1;
        return makeRational(whole * den + sign * num, den) ?? fallback;
    }

    const simple = text.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if ( simple )
        return makeRational(Number(simple[1]), Number(simple[2])) ?? fallback;

    if ( !/^-?\d+(?:\.\d+)?$/.test(text) ) return fallback;

    const plain = Number.parseFloat(text);
    return Number.isFinite(plain) ? rationalFromDecimal(plain) : fallback;
}

export const ratZero = { n: 0, d: 1 };
export const ratOne = { n: 1, d: 1 };

export function ratValue(r)
{
    return r ? r.n / r.d : 0;
}

export function ratAdd(a, b)
{
    return makeRational(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function ratSub(a, b)
{
    return makeRational(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function ratMul(a, b)
{
    return makeRational(a.n * b.n, a.d * b.d);
}

export function ratCompare(a, b)
{
    return a.n * b.d - b.n * a.d;
}

export function ratEquals(a, b)
{
    return !!a && !!b && a.n === b.n && a.d === b.d;
}

export function ratIsZero(r)
{
    return !r || r.n === 0;
}

/** Ceiling of a rational as a plain integer — used to size the drawn grid. */
export function ratCeil(r)
{
    return Math.ceil(r.n / r.d);
}

/** Plain text: "3 1/4", "2/3", "6". */
export function formatRationalText(r, { mixed = true } = {})
{
    if ( !r ) return "";
    if ( r.d === 1 ) return String(r.n);

    const sign = r.n < 0 ? "-" : "";
    const num = Math.abs(r.n);

    if ( !mixed || num < r.d ) return `${sign}${num}/${r.d}`;

    const whole = Math.floor(num / r.d);
    const rest = num - whole * r.d;
    return rest === 0 ? `${sign}${whole}` : `${sign}${whole} ${rest}/${r.d}`;
}

/**
 * omdMathText markup so the value typesets as a real stacked fraction:
 * 6 → "6", 2/3 → "[2/3]", 13/4 → "[3 1/4]".
 */
export function formatRationalMarkup(r, { mixed = true } = {})
{
    if ( !r ) return "";
    if ( r.d === 1 ) return String(r.n);
    return `[${formatRationalText(r, { mixed })}]`;
}

/** Multiplication expression markup, e.g. "4 &times; [2/3]". */
export function formatProductMarkup(a, b, { mixed = true } = {})
{
    return `${formatRationalMarkup(a, { mixed })} \u00d7 ${formatRationalMarkup(b, { mixed })}`;
}

/**
 * True when `text` names the same number as `r`. "8/3", "2 2/3" and "8/3 units"
 * all match 8/3; a terminating decimal that is exactly equal ("3.75" for 15/4)
 * matches too, a rounded one ("2.67" for 8/3) does not.
 */
export function rationalMatchesText(r, text)
{
    const parsed = parseRational(text, null);
    return !!parsed && !!r && ratCompare(parsed, r) === 0;
}
