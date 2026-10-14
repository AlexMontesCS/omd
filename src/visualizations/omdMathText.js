
import { OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { jsvgGroup } from "@teachinglab/jsvg";
import { inlineMathToPlainText } from "../text/omdInlineMath.js";
import { renderInlineMathToHTML, ensureInlineMathStyles } from "../text/omdInlineMathHtml.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

/**
 * omdMathText — a paragraph of prose with real typeset math inline.
 *
 * The prose is ordinary HTML text inside a <foreignObject>, not SVG <text>:
 * Chrome's page translator rewrites HTML text nodes only, so a word problem
 * rendered this way translates like any other paragraph while the math runs
 * (marked translate="no") keep their variables and numerals intact.
 *
 * Markup (see src/text/omdInlineMath.js for the full grammar):
 *   \( \frac{3}{4}x + 2 \)   LaTeX-subset inline math
 *   [3/4] [2 3/4] [6]        legacy bracket tokens
 *   3/4, 2 5/8               bare fractions in prose
 *   **bold**                 bold span
 *
 * JSON shape:
 * {
 *   omdType: 'mathText',
 *   text: 'A baker has \\( \\frac{3}{4} \\) of a box of muffin mix.',
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
        this.fontColor = "#222222";
        this.fontWeight = 400;

        this._foreignObject = null;
        this._contentDiv = null;
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

        if ( typeof data.fontColor == "string" )
            this.fontColor = data.fontColor;

        if ( typeof data.fontWeight == "number" || typeof data.fontWeight == "string" )
            this.fontWeight = data.fontWeight;

        this.updateLayout();
    }

    /** The paragraph as linear text — for read-aloud, grading and alt text. */
    getPlainText()
    {
        return inlineMathToPlainText(this.text);
    }

    /** Inline CSS shared by the rendered paragraph and its measuring twin. */
    _contentStyle()
    {
        const wrap = this.wrapWidth > 0
            ? `width:${this.wrapWidth}px;white-space:normal;`
            : "white-space:nowrap;";

        return "display:inline-block;box-sizing:border-box;"
            + wrap
            + `font-family:${this.fontFamily};`
            + `font-size:${this.fontSize}px;`
            + `line-height:${this.lineHeightRatio};`
            + `font-weight:${this.fontWeight};`
            + `color:${this.fontColor};`
            + "overflow-wrap:break-word;";
    }

    updateLayout()
    {
        const doc = this.svgObject && this.svgObject.ownerDocument
            ? this.svgObject.ownerDocument
            : (typeof document != "undefined" ? document : null);

        if ( !doc )
            return;

        ensureInlineMathStyles(doc);

        const html = renderInlineMathToHTML(this.text);
        const style = this._contentStyle();
        const { width, height } = measureHtml(doc, html, style, {
            source: this.text,
            wrapWidth: this.wrapWidth,
            fontSize: this.fontSize,
            lineHeightRatio: this.lineHeightRatio,
        });

        if ( !this._foreignObject )
        {
            this._foreignObject = doc.createElementNS(SVG_NS, "foreignObject");
            this._foreignObject.setAttribute("x", "0");
            this._foreignObject.setAttribute("y", "0");
            this._foreignObject.setAttribute("overflow", "visible");
            this._contentDiv = doc.createElementNS(XHTML_NS, "div");
            this._foreignObject.appendChild(this._contentDiv);
            this.svgObject.appendChild(this._foreignObject);
        }

        this._contentDiv.setAttribute("xmlns", XHTML_NS);
        this._contentDiv.setAttribute("style", style);
        this._contentDiv.innerHTML = html;

        this._applySize(width, height);
        this._observeContent();
    }

    /**
     * The paragraph as a standalone HTML element, for hosts that can mount
     * plain DOM. Chrome's page translator walks the HTML document and skips
     * everything inside an <svg> — foreignObject included — so prose that has
     * to be translatable must live OUTSIDE the SVG. omdDisplay prefers this
     * node; omdCanvas and other SVG-only hosts fall back to the foreignObject.
     */
    getHtmlNode()
    {
        const doc = this.svgObject && this.svgObject.ownerDocument
            ? this.svgObject.ownerDocument
            : (typeof document != "undefined" ? document : null);

        if ( !doc )
            return null;

        if ( !this._htmlNode )
            this._htmlNode = doc.createElement("div");

        this._htmlNode.className = "omd-math-paragraph";
        this._htmlNode.setAttribute("style", this._contentStyle());
        this._htmlNode.innerHTML = renderInlineMathToHTML(this.text);
        this._observeContent();
        return this._htmlNode;
    }

    _applySize(width, height)
    {
        this.width = width;
        this.height = height;

        // Slack keeps descenders and the bottom of a stacked fraction from
        // being clipped by the foreignObject's own box.
        this._foreignObject.setAttribute("width", String(width + 2));
        this._foreignObject.setAttribute("height", String(height + 2));
    }

    /**
     * Translated prose is a different length than the original, so the
     * paragraph reflows after load — Chrome swaps the text in long after
     * updateLayout ran. Watching the content box keeps the foreignObject and
     * the enclosing display sized to whatever the browser ends up laying out.
     */
    _observeContent()
    {
        if ( typeof ResizeObserver == "undefined" )
            return;
        if ( this._resizeObserver )
            this._resizeObserver.disconnect();

        // ResizeObserver reports the layout box, which — unlike
        // getBoundingClientRect — ignores the scale transform omdDisplay puts
        // on this component. Measuring the scaled rect here would feed the
        // display its own scale back and oscillate.
        this._resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[entries.length - 1];
            const box = entry.borderBoxSize && entry.borderBoxSize[0];
            const width = Math.ceil(box ? box.inlineSize : entry.contentRect.width);
            const height = Math.ceil(box ? box.blockSize : entry.contentRect.height);
            if ( width < 1 || height < 1 )
                return;
            if ( width === this.width && height === this.height )
                return;

            this._applySize(width, height);
            // omdDisplay owns scaling and the enclosing <svg> box; it listens
            // for this on the component's own node.
            this.svgObject.dispatchEvent(new CustomEvent("omd:resize", { bubbles: true }));
            if ( this._htmlNode )
                this._htmlNode.dispatchEvent(new CustomEvent("omd:resize", { bubbles: true }));
        });

        // Either box can be the mounted one; the unmounted twin measures zero
        // and is skipped by the guard above.
        this._resizeObserver.observe(this._contentDiv);
        if ( this._htmlNode )
            this._resizeObserver.observe(this._htmlNode);
    }

    destroy()
    {
        if ( this._resizeObserver )
        {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if ( typeof super.destroy == "function" )
            super.destroy();
    }
}

/**
 * Measures the paragraph with a throwaway copy in the live document, which is
 * the only way to get real glyph metrics for HTML content. Headless DOM shims
 * answer getBoundingClientRect with invented numbers, so the result is only
 * trusted when it looks like real layout; otherwise the library-wide glyph
 * heuristic takes over.
 */
function measureHtml(doc, html, style, metrics)
{
    let probe = null;

    try
    {
        if ( doc.body )
        {
            probe = doc.createElement("div");
            probe.setAttribute("aria-hidden", "true");
            probe.setAttribute("style", "position:absolute;left:-99999px;top:0;visibility:hidden;");
            const inner = doc.createElement("div");
            inner.setAttribute("style", style);
            inner.innerHTML = html;
            probe.appendChild(inner);
            doc.body.appendChild(probe);

            const rect = typeof inner.getBoundingClientRect == "function"
                ? inner.getBoundingClientRect()
                : null;

            if ( isRealLayout(rect, metrics) )
            {
                return {
                    width: Math.ceil(rect.width),
                    height: Math.ceil(rect.height),
                };
            }
        }
    }
    catch
    {
        // Fall through to the heuristic below.
    }
    finally
    {
        if ( probe && probe.parentNode )
            probe.parentNode.removeChild(probe);
    }

    return estimateSize(metrics);
}

// A real layout engine honours the wrap width and gives the box at least one
// full line box of height. Anything else is a shim guessing from string length.
function isRealLayout(rect, metrics)
{
    if ( !rect || !(rect.width > 0) || !(rect.height > 0) )
        return false;
    if ( metrics.wrapWidth > 0 && rect.width > metrics.wrapWidth + 2 )
        return false;
    return rect.height >= metrics.fontSize;
}

// ~0.58em average glyph width matches the heuristic the other omd visuals use,
// so Node-side layout stays deterministic and close to the browser.
function estimateSize({ source, wrapWidth, fontSize, lineHeightRatio })
{
    const plain = inlineMathToPlainText(source);
    const lineHeight = fontSize * lineHeightRatio;
    const lines = plain.split("\n");
    const naturalWidth = Math.max(...lines.map(line => line.length * fontSize * 0.58), 1);

    if ( wrapWidth <= 0 )
        return { width: Math.ceil(naturalWidth), height: Math.ceil(lines.length * lineHeight) };

    const rows = lines.reduce(
        (total, line) => total + Math.max(1, Math.ceil((line.length * fontSize * 0.58) / wrapWidth)),
        0,
    );

    return { width: Math.ceil(wrapWidth), height: Math.ceil(rows * lineHeight) };
}
