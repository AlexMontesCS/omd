/**
 * Text-first math entry point: grammar and HTML rendering with no SVG, no
 * jsvg and no DOM access at import time, so React/SSR consumers can pull in
 * `@teachinglab/omd/text` without dragging in the visualization library.
 */

export {
    parseInlineMath,
    parseMathSource,
    inlineMathToPlainText,
    mathNodesToPlainText,
    hasInlineMath,
} from "./omdInlineMath.js";

export {
    inlineMathElementTree,
    renderInlineMathToDOM,
    renderInlineMathToHTML,
    ensureInlineMathStyles,
    INLINE_MATH_CSS,
    INLINE_MATH_STYLE_ID,
} from "./omdInlineMathHtml.js";
