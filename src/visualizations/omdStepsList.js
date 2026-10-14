import { jsvgRect, jsvgTextLine } from "@teachinglab/jsvg";

/**
 * Numbered step chips + descriptions drawn beside a step-by-step visual
 * (omdAlgorithmWork, omdFractionWork). Steps before `revealed` read as done;
 * the latest revealed one is highlighted as current.
 *
 * Every chip, number and label carries `data-step-index` (1-based) so hosts
 * can wire click-to-jump navigation.
 *
 * Returns the right edge of the widest description and the bottom of the last
 * row, so callers can size their viewBox.
 */
export function renderStepsList(holder, { steps, revealed, x, y, fontSize, fontFamily, currentFill })
{
    const chipSize = fontSize * 0.62;
    const rowH = fontSize * 1.55;
    const labelSize = fontSize * 0.56;
    const currentIndex = Math.min(revealed, steps.length) - 1;
    let ly = y;
    let right = x;

    steps.forEach((step, i) => {
        const done = i < revealed;
        const current = done && i === currentIndex;

        const chip = new jsvgRect();
        chip.setCornerRadius(chipSize / 2);
        chip.setWidthAndHeight(chipSize * 1.7, chipSize * 1.25);
        chip.setStrokeColor("none");
        chip.setFillColor(done ? (current ? currentFill : "#DCEBF7") : "#EEEEEE");
        chip.svgObject.setAttribute("data-step-index", String(i + 1));
        chip.svgObject.setAttribute("data-role", "step-chip");
        chip.setPosition(x, ly + (rowH - chipSize * 1.25) / 2);
        holder.addChild(chip);

        const num = new jsvgTextLine();
        num.setFontFamily(fontFamily);
        num.setFontSize(chipSize * 0.85);
        num.setFontWeight(700);
        num.setAlignment("center");
        num.setText(String(i + 1));
        num.setPosition(x + chipSize * 0.85, ly + rowH / 2);
        num.svgObject.setAttribute("dominant-baseline", "central");
        num.svgObject.setAttribute("data-step-index", String(i + 1));
        holder.addChild(num);

        const desc = step.description || step.label || "";
        const labelX = x + chipSize * 1.7 + fontSize * 0.45;
        const label = new jsvgTextLine();
        label.setFontFamily(fontFamily);
        label.setFontSize(labelSize);
        label.setFontColor(done ? "#333333" : "#9A9A9A");
        label.setFontWeight(current ? 650 : 400);
        label.setAlignment("left");
        label.setText(desc);
        label.setPosition(labelX, ly + rowH / 2);
        label.svgObject.setAttribute("dominant-baseline", "central");
        label.svgObject.setAttribute("data-step-index", String(i + 1));
        holder.addChild(label);

        right = Math.max(right, labelX + estimateTextWidth(desc, labelSize));
        ly += rowH;
    });

    return { right, bottom: ly };
}

// Same glyph-width heuristic as omdAlgorithmWork so list sizing is
// deterministic across browser and Node.
function estimateTextWidth(text, fontSize)
{
    return String(text || "").length * fontSize * 0.58;
}
