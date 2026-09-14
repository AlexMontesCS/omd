/**
 * Dimension annotations shared by the fraction visuals: the curly brace and
 * the double-headed arrow that grade 5 print materials use to call out a side
 * length ("4 units", "1 ft", "3 1/4").
 */

import { jsvgGroup, jsvgPath, jsvgLine } from "@teachinglab/jsvg";
import { omdMathText } from "./omdMathText.js";

/**
 * Curly brace running from (x1,y1) to (x2,y2) with its tip `depth` px away on
 * the left-hand side of that direction vector. Two mirrored quadratic arms
 * meeting at the tip — the shape used across IM/Uncommon fraction diagrams.
 */
export function braceGeometry(x1, y1, x2, y2, depth, curviness = 0.6)
{
    let dx = x1 - x2;
    let dy = y1 - y2;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const q = Math.min(Math.max(curviness, 0.05), 0.95);
    const w = depth;

    const qx1 = x1 + q * w * dy;
    const qy1 = y1 - q * w * dx;
    const qx2 = (x1 - 0.25 * len * dx) + (1 - q) * w * dy;
    const qy2 = (y1 - 0.25 * len * dy) - (1 - q) * w * dx;
    const tipX = (x1 - 0.5 * len * dx) + w * dy;
    const tipY = (y1 - 0.5 * len * dy) - w * dx;
    const qx3 = x2 + q * w * dy;
    const qy3 = y2 - q * w * dx;
    const qx4 = (x1 - 0.75 * len * dx) + (1 - q) * w * dy;
    const qy4 = (y1 - 0.75 * len * dy) - (1 - q) * w * dx;

    const d =
        `M ${x1} ${y1} Q ${qx1} ${qy1} ${qx2} ${qy2} T ${tipX} ${tipY}` +
        ` M ${x2} ${y2} Q ${qx3} ${qy3} ${qx4} ${qy4} T ${tipX} ${tipY}`;

    return { d, tipX, tipY };
}

export function makeBrace(x1, y1, x2, y2, options = {})
{
    const depth = options.depth ?? 10;
    const { d, tipX, tipY } = braceGeometry(x1, y1, x2, y2, depth, options.curviness ?? 0.6);

    const path = new jsvgPath();
    path.svgObject.setAttribute("d", d);
    path.svgObject.setAttribute("fill", "none");
    path.svgObject.setAttribute("stroke-linecap", "round");
    path.setStrokeColor(options.color ?? "#111111");
    path.setStrokeWidth(options.strokeWidth ?? 2);

    return { path, tipX, tipY };
}

function makeArrowHead(x, y, angle, size, color)
{
    const spread = 0.42;
    const path = new jsvgPath();
    const ax = x + size * Math.cos(angle - spread);
    const ay = y + size * Math.sin(angle - spread);
    const bx = x + size * Math.cos(angle + spread);
    const by = y + size * Math.sin(angle + spread);
    path.svgObject.setAttribute("d", `M ${ax} ${ay} L ${x} ${y} L ${bx} ${by} Z`);
    path.svgObject.setAttribute("fill", color);
    path.setStrokeColor(color);
    path.setStrokeWidth(1);
    return path;
}

/** Double-headed measurement arrow between two points. */
export function makeArrowDimension(x1, y1, x2, y2, options = {})
{
    const color = options.color ?? "#111111";
    const strokeWidth = options.strokeWidth ?? 2;
    const head = options.headSize ?? 9;
    const group = new jsvgGroup();

    const shaft = new jsvgLine();
    shaft.setEndpoints(x1, y1, x2, y2);
    shaft.setStrokeColor(color);
    shaft.setStrokeWidth(strokeWidth);
    group.addChild(shaft);

    const angle = Math.atan2(y2 - y1, x2 - x1);
    group.addChild(makeArrowHead(x1, y1, angle, head, color));
    group.addChild(makeArrowHead(x2, y2, angle + Math.PI, head, color));

    return { group, tipX: (x1 + x2) / 2, tipY: (y1 + y2) / 2 };
}

/**
 * Label group that typesets omdMathText markup ("[2/3] units") and reports its
 * own measured width/height so callers can centre it against a brace tip.
 */
export function makeMathLabel(markup, options = {})
{
    const label = new omdMathText();
    label.loadFromJSON({
        text: String(markup ?? ""),
        fontSize: options.fontSize ?? 16,
        width: options.width ?? 0,
    });
    return label;
}

/** Centres a math label on (cx, cy). */
export function centerMathLabel(label, cx, cy)
{
    label.setPosition(cx - label.width / 2, cy - label.height / 2);
}
