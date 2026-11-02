/**
 * omdInlineMathHtml — renders the omdInlineMath AST as ordinary HTML.
 *
 * Why HTML and not SVG: Chrome's page translator only rewrites HTML text
 * nodes. A paragraph built from <text> elements (what the SVG mathText used
 * to emit, one per word) is invisible to it; a paragraph built from real text
 * nodes translates exactly like any other prose. Math runs carry
 * translate="no" so variables and numerals survive the translation, while
 * \text{...} inside math opts back in with translate="yes".
 *
 * Two emitters share one element tree so the DOM output and the string output
 * can never drift:
 *   renderInlineMathToDOM(source, { document })  -> DocumentFragment
 *   renderInlineMathToHTML(source)               -> escaped HTML string
 */

import { parseInlineMath, mathNodesToPlainText } from "./omdInlineMath.js";

export const INLINE_MATH_STYLE_ID = "omd-inline-math-styles";

/**
 * Self-contained stylesheet for the classes this module emits. Everything is
 * relative to the inherited font size, so inline math scales with its prose.
 */
export const INLINE_MATH_CSS = `
.omd-math{display:inline-block;white-space:nowrap;font-variant-numeric:lining-nums tabular-nums}
.omd-math-gap-l{margin-left:.1em}
.omd-math-gap-r{margin-right:.1em}
.omd-math-var{font-style:normal}
.omd-math-fn{font-style:normal}
.omd-math-op{padding:0 .18em}
.omd-math-punct{padding-right:.18em}
.omd-math-space{padding-right:.25em}
.omd-math-frac{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;vertical-align:middle;line-height:1;margin:0 .06em;font-size:.82em;text-align:center}
.omd-math-num{padding:0 .12em .08em;border-bottom:.075em solid currentColor}
.omd-math-den{padding:.08em .12em 0}
.omd-math-mixed{white-space:nowrap}
.omd-math-whole{padding-right:.04em}
.omd-math-sup{font-size:.72em;vertical-align:.52em;line-height:0}
.omd-math-sub{font-size:.72em;vertical-align:-.28em;line-height:0}
.omd-math-sqrt{position:relative;display:inline-block;line-height:1.15;padding-left:.5em;vertical-align:-.16em}
.omd-math-radical{position:absolute;left:0;top:0;width:.48em;height:100%;overflow:visible;fill:none;stroke:currentColor;stroke-width:.075em;stroke-linecap:square;stroke-linejoin:miter}
.omd-math-index{position:absolute;left:-.04em;top:-.45em;font-size:.56em;line-height:1}
.omd-math-radicand{display:inline-block;line-height:1.15;border-top:.075em solid currentColor;padding:.1em .14em 0}
.omd-math-text{font-style:normal;padding:0 .12em}
.omd-math-paren{padding:0 .02em}
`.trim();

/**
 * Injects the stylesheet once per document. Safe to call on every render.
 *
 * @param {Document} [doc]
 * @returns {boolean} true when a document was available
 */
export function ensureInlineMathStyles(doc)
{
    const target = doc || (typeof document != "undefined" ? document : null);
    if ( !target || !target.head )
        return false;
    if ( target.getElementById(INLINE_MATH_STYLE_ID) )
        return true;

    const style = target.createElement("style");
    style.id = INLINE_MATH_STYLE_ID;
    style.textContent = INLINE_MATH_CSS;
    target.head.appendChild(style);
    return true;
}

/* ------------------------------------------------------------------ */
/* Element tree                                                        */
/* ------------------------------------------------------------------ */

const SVG_NS = "http://www.w3.org/2000/svg";

function element(tag, attributes, children, ns)
{
    const node = { tag, attributes: attributes || {}, children: children || [] };
    if ( ns ) node.ns = ns;
    return node;
}

/**
 * Builds a renderer-agnostic element tree: strings are text nodes, objects are
 * `{ tag, attributes, children }`.
 *
 * @param {string|Array<object>} sourceOrNodes
 * @param {object} [options] forwarded to parseInlineMath
 * @returns {Array<object|string>}
 */
export function inlineMathElementTree(sourceOrNodes, options)
{
    const nodes = Array.isArray(sourceOrNodes) ? sourceOrNodes : parseInlineMath(sourceOrNodes, options);
    const out = [];

    for ( let i = 0; i < nodes.length; i += 1 )
    {
        const node = nodes[i];
        if ( node.kind === "text" )
            out.push(node.value);
        else if ( node.kind === "break" )
            out.push(element("br"));
        else if ( node.kind === "bold" )
            out.push(element("strong", {}, [node.value]));
        else if ( node.kind === "math" )
        {
            // A math run reserves side bearings ONLY where the prose really
            // has a space. Chrome's translator rewrites a text node and drops
            // the whitespace at an inline boundary, fusing "has" onto "3/4";
            // the margin survives that. Where the prose has no space —
            // "(4 × [2/5])" — a margin would just push the ")" away.
            const before = nodes[i - 1];
            const after = nodes[i + 1];
            out.push(mathRunElement(node, {
                left: before ? before.kind !== "math" && /\s$/.test(before.value || "") : false,
                right: after ? after.kind !== "math" && /^\s/.test(after.value || "") : false,
            }));
        }
    }

    return out;
}

function mathRunElement(node, gaps = {})
{
    const plain = node.plain != null ? node.plain : mathNodesToPlainText(node.nodes);
    const classes = ["omd-math", "notranslate"];
    if ( gaps.left ) classes.push("omd-math-gap-l");
    if ( gaps.right ) classes.push("omd-math-gap-r");

    return element("span", {
        class: classes.join(" "),
        translate: "no",
        "data-plain": plain,
        "aria-label": plain,
    }, mathRow(node.nodes));
}

function mathRow(nodes)
{
    const out = [];
    for ( const node of nodes || [] )
    {
        const built = mathElement(node);
        if ( built ) out.push(built);
    }
    return out;
}

function mathElement(node)
{
    switch ( node.t )
    {
        case "num":
            return node.v;

        case "ident":
            return element("span", { class: node.v.length === 1 ? "omd-math-var" : "omd-math-fn" }, [node.v]);

        case "op":
            return element("span", { class: "omd-math-op" }, [node.v]);

        case "punct":
            return element("span", { class: "omd-math-punct" }, [node.v]);

        case "space":
            return element("span", { class: "omd-math-space" }, ["\u200a"]);

        case "sym":
            return node.v;

        // \text{...} is prose that happens to live inside math, so it opts
        // back into translation.
        case "text":
            return element("span", { class: "omd-math-text", translate: "yes" }, [node.v]);

        case "frac":
            return fractionElement(node.num, node.den);

        case "mixed":
            return element("span", { class: "omd-math-mixed" }, [
                element("span", { class: "omd-math-whole" }, mathRow(node.whole)),
                fractionElement(node.num, node.den),
            ]);

        case "script":
        {
            const children = [mathElement(node.base)];
            if ( node.sub ) children.push(element("span", { class: "omd-math-sub" }, mathRow(node.sub)));
            if ( node.sup ) children.push(element("span", { class: "omd-math-sup" }, mathRow(node.sup)));
            return element("span", { class: "omd-math-script" }, children);
        }

        case "sqrt":
        {
            // The radical is drawn, not typeset: a font glyph never matches the
            // height of what it covers, which is why omdSqrtNode strokes a path
            // too. The svg stretches to the radicand box (preserveAspectRatio
            // none) and the rule is the radicand's own border, so the hook and
            // the bar always meet.
            const children = [];
            if ( node.index )
                children.push(element("span", { class: "omd-math-index" }, mathRow(node.index)));
            children.push(element("svg", {
                class: "omd-math-radical",
                viewBox: "0 0 10 100",
                preserveAspectRatio: "none",
                "aria-hidden": "true",
                focusable: "false",
            }, [
                element("path", { d: "M0.5 62 L4 97 L9.5 3" }, [], SVG_NS),
            ], SVG_NS));
            children.push(element("span", { class: "omd-math-radicand" }, mathRow(node.radicand)));
            return element("span", { class: "omd-math-sqrt" }, children);
        }

        case "group":
        {
            const children = [];
            if ( node.open ) children.push(element("span", { class: "omd-math-paren" }, [node.open]));
            children.push(...mathRow(node.children));
            if ( node.close ) children.push(element("span", { class: "omd-math-paren" }, [node.close]));
            return element("span", { class: "omd-math-group" }, children);
        }

        default:
            return null;
    }
}

function fractionElement(numerator, denominator)
{
    return element("span", { class: "omd-math-frac" }, [
        element("span", { class: "omd-math-num" }, mathRow(numerator)),
        element("span", { class: "omd-math-den" }, mathRow(denominator)),
    ]);
}

/* ------------------------------------------------------------------ */
/* Emitters                                                            */
/* ------------------------------------------------------------------ */

/**
 * Builds the inline content as DOM inside the given document.
 *
 * @param {string|Array<object>} sourceOrNodes
 * @param {object} [options]
 * @param {Document} [options.document] defaults to the global document
 * @param {string} [options.namespace] element namespace (XHTML inside SVG)
 * @returns {DocumentFragment}
 */
export function renderInlineMathToDOM(sourceOrNodes, options = {})
{
    const doc = options.document || (typeof document != "undefined" ? document : null);
    if ( !doc )
        throw new Error("renderInlineMathToDOM requires a document");

    const fragment = doc.createDocumentFragment();
    for ( const child of inlineMathElementTree(sourceOrNodes, options) )
        fragment.appendChild(toDomNode(child, doc, options.namespace));
    return fragment;
}

function toDomNode(child, doc, namespace)
{
    if ( typeof child == "string" )
        return doc.createTextNode(child);

    // The radical carries its own SVG namespace; everything below it inherits.
    const ns = child.ns || namespace;
    const node = ns ? doc.createElementNS(ns, child.tag) : doc.createElement(child.tag);
    for ( const [name, value] of Object.entries(child.attributes) )
        node.setAttribute(name, value);
    for ( const nested of child.children )
        node.appendChild(toDomNode(nested, doc, ns));
    return node;
}

/**
 * Serializes the inline content as an HTML string (escaped).
 *
 * @param {string|Array<object>} sourceOrNodes
 * @param {object} [options] forwarded to parseInlineMath
 * @returns {string}
 */
export function renderInlineMathToHTML(sourceOrNodes, options)
{
    return inlineMathElementTree(sourceOrNodes, options).map(serialize).join("");
}

const VOID_TAGS = new Set(["br"]);

function serialize(child)
{
    if ( typeof child == "string" )
        return escapeHtml(child);

    const attributes = Object.entries(child.attributes)
        .map(([name, value]) => ` ${name}="${escapeHtml(String(value))}"`)
        .join("");

    if ( VOID_TAGS.has(child.tag) )
        return `<${child.tag}${attributes}>`;

    return `<${child.tag}${attributes}>${child.children.map(serialize).join("")}</${child.tag}>`;
}

function escapeHtml(value)
{
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
