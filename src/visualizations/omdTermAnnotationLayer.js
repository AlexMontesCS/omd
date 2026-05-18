import { jsvgGroup, jsvgRect, jsvgLine, jsvgTextBox } from "@teachinglab/jsvg";

const DEFAULT_STYLE = {
    strokeColor: "#2563eb",
    strokeWidth: 2,
    highlightFill: "rgba(37, 99, 235, 0.14)",
    highlightStroke: "#2563eb",
    highlightPaddingX: 4,
    highlightPaddingY: 3,
    labelFontFamily: "Albert Sans",
    labelFontSize: 12,
    labelTextColor: "#1f2937",
    labelBackground: "white",
    labelBorderColor: "#94a3b8",
    labelPaddingX: 8,
    labelPaddingY: 4,
    laneLift: 24,
    laneStep: 16,
    labelGap: 6,
    arrowHeadSize: 8
};

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringOrEmpty(value) {
    if (value === undefined || value === null) return "";
    return String(value);
}

function normalizePointSpec(spec, fallbackSide = "main") {
    if (spec === undefined || spec === null) return null;

    if (typeof spec === "number") {
        return {
            side: fallbackSide,
            termIndex: Math.max(0, Math.floor(spec)),
            point: "center"
        };
    }

    if (typeof spec !== "object") return null;

    const side = toStringOrEmpty(spec.side || fallbackSide).toLowerCase() || fallbackSide;
    const pointRaw = toStringOrEmpty(spec.point).toLowerCase();
    const point = (pointRaw === "start" || pointRaw === "end" || pointRaw === "center")
        ? pointRaw
        : "center";

    const termIndex = toNumber(spec.termIndex, NaN);
    if (!Number.isFinite(termIndex)) return null;

    return {
        side,
        termIndex: Math.max(0, Math.floor(termIndex)),
        point
    };
}

function normalizeHighlightSpec(annotation) {
    const side = toStringOrEmpty(annotation.side || "main").toLowerCase() || "main";
    const list = Array.isArray(annotation.termIndices)
        ? annotation.termIndices
        : [annotation.termIndex];

    const termIndices = list
        .map((value) => toNumber(value, NaN))
        .filter((value) => Number.isFinite(value))
        .map((value) => Math.max(0, Math.floor(value)));

    return {
        type: "highlight",
        side,
        termIndices,
        label: toStringOrEmpty(annotation.label),
        color: annotation.color,
        fillColor: annotation.fillColor,
        strokeColor: annotation.strokeColor
    };
}

function normalizeArrowSpec(annotation) {
    const from = normalizePointSpec(
        annotation.from || {
            side: annotation.fromSide,
            termIndex: annotation.fromTermIndex,
            point: annotation.fromPoint
        },
        "main"
    );

    const to = normalizePointSpec(
        annotation.to || {
            side: annotation.toSide,
            termIndex: annotation.toTermIndex,
            point: annotation.toPoint
        },
        "main"
    );

    if (!from || !to) return null;

    return {
        type: "arrow",
        from,
        to,
        label: toStringOrEmpty(annotation.label),
        color: annotation.color,
        lane: Number.isFinite(toNumber(annotation.lane, NaN))
            ? Math.max(0, Math.floor(toNumber(annotation.lane, 0)))
            : null
    };
}

function normalizeAnnotation(annotation) {
    if (!annotation || typeof annotation !== "object") return null;

    const typeRaw = toStringOrEmpty(annotation.type).toLowerCase();
    if (typeRaw === "arrow") return normalizeArrowSpec(annotation);
    if (typeRaw === "highlight") return normalizeHighlightSpec(annotation);

    if (annotation.from !== undefined || annotation.to !== undefined
        || annotation.fromTermIndex !== undefined || annotation.toTermIndex !== undefined) {
        return normalizeArrowSpec(annotation);
    }

    return normalizeHighlightSpec(annotation);
}

export class omdTermAnnotationLayer extends jsvgGroup {
    constructor() {
        super();

        this.anchorMap = {};
        this.annotations = [];
        this.styleConfig = { ...DEFAULT_STYLE };
        this.svgObject.style.pointerEvents = "none";
    }

    setStyle(styleConfig = {}) {
        this.styleConfig = { ...DEFAULT_STYLE, ...(styleConfig || {}) };
    }

    setAnchors(anchorMap = {}) {
        this.anchorMap = anchorMap || {};
    }

    setAnnotations(annotations = []) {
        this.annotations = Array.isArray(annotations)
            ? annotations.map(normalizeAnnotation).filter(Boolean)
            : [];
    }

    _resolveTermAnchor(spec) {
        if (!spec) return null;

        const sideAnchors = Array.isArray(this.anchorMap?.[spec.side]) ? this.anchorMap[spec.side] : [];
        if (!sideAnchors.length) return null;

        const direct = sideAnchors.find((anchor) => anchor.termIndex === spec.termIndex);
        if (direct) return direct;

        const ordered = [...sideAnchors].sort((a, b) => (a.termIndex ?? 0) - (b.termIndex ?? 0));
        const index = Math.max(0, Math.min(ordered.length - 1, spec.termIndex));
        return ordered[index] || null;
    }

    _pointForAnchor(anchor, pointMode = "center") {
        if (!anchor) return null;

        const y = toNumber(anchor.top, 0);
        if (pointMode === "start") return { x: toNumber(anchor.startX, 0), y, anchor };
        if (pointMode === "end") return { x: toNumber(anchor.endX, 0), y, anchor };

        return {
            x: toNumber(anchor.centerX, (toNumber(anchor.startX, 0) + toNumber(anchor.endX, 0)) / 2),
            y,
            anchor
        };
    }

    _estimateLabelWidth(text, style) {
        const value = toStringOrEmpty(text);
        if (!value) return 0;
        return Math.max(
            16,
            Math.ceil(value.length * style.labelFontSize * 0.56) + style.labelPaddingX * 2
        );
    }

    _drawLabel(x, y, text, style, colorOverride = null) {
        const value = toStringOrEmpty(text);
        if (!value) return;

        const width = this._estimateLabelWidth(value, style);
        const height = style.labelFontSize + style.labelPaddingY * 2;

        const bubble = new jsvgRect();
        bubble.setPosition(x - width / 2, y - height / 2);
        bubble.setWidthAndHeight(width, height);
        bubble.setCornerRadius(height / 2);
        bubble.setFillColor(style.labelBackground);
        bubble.setStrokeColor(style.labelBorderColor);
        bubble.setStrokeWidth(1);
        this.addChild(bubble);

        const box = new jsvgTextBox({ translateMirror: true });
        box.setWidthAndHeight(width, height);
        box.setPosition(x - width / 2, y - height / 2);
        box.setText(value);
        box.setFontFamily(style.labelFontFamily);
        box.setFontSize(style.labelFontSize);
        box.setFontColor(colorOverride || style.labelTextColor);
        box.setFontWeight(700);
        box.setAlignment("center");
        box.setVerticalCentering();

        this.addChild(box);
    }

    _drawHighlight(anchor, annotation, style) {
        const rect = new jsvgRect();
        const padX = toNumber(style.highlightPaddingX, 4);
        const padY = toNumber(style.highlightPaddingY, 3);
        const x = toNumber(anchor.startX, 0) - padX;
        const y = toNumber(anchor.top, 0) - padY;
        const width = Math.max(1, toNumber(anchor.endX, 0) - toNumber(anchor.startX, 0) + padX * 2);
        const height = Math.max(1, toNumber(anchor.bottom, toNumber(anchor.top, 0) + 24) - toNumber(anchor.top, 0) + padY * 2);

        rect.setPosition(x, y);
        rect.setWidthAndHeight(width, height);
        rect.setCornerRadius(8);
        rect.setFillColor(annotation.fillColor || style.highlightFill);
        rect.setStrokeColor(annotation.strokeColor || annotation.color || style.highlightStroke);
        rect.setStrokeWidth(1.5);
        this.addChild(rect);

        if (annotation.label) {
            this._drawLabel(
                toNumber(anchor.centerX, x + width / 2),
                y - style.labelGap - style.labelFontSize / 2,
                annotation.label,
                style,
                annotation.color || style.labelTextColor
            );
        }
    }

    _drawArrow(fromPoint, toPoint, annotation, style, laneIndex) {
        const color = annotation.color || style.strokeColor;
        const laneOffset = annotation.lane !== null ? annotation.lane : laneIndex;
        const laneY = Math.min(fromPoint.y, toPoint.y)
            - toNumber(style.laneLift, 24)
            - laneOffset * toNumber(style.laneStep, 16);

        const startX = fromPoint.x;
        const endX = toPoint.x;

        const up = new jsvgLine();
        up.setEndpoints(startX, fromPoint.y, startX, laneY);
        up.setStrokeColor(color);
        up.setStrokeWidth(style.strokeWidth);
        this.addChild(up);

        const across = new jsvgLine();
        across.setEndpoints(startX, laneY, endX, laneY);
        across.setStrokeColor(color);
        across.setStrokeWidth(style.strokeWidth);
        this.addChild(across);

        const down = new jsvgLine();
        down.setEndpoints(endX, laneY, endX, toPoint.y);
        down.setStrokeColor(color);
        down.setStrokeWidth(style.strokeWidth);
        this.addChild(down);

        const headSize = toNumber(style.arrowHeadSize, 8);
        const headA = new jsvgLine();
        headA.setEndpoints(endX, toPoint.y, endX - headSize, toPoint.y - headSize);
        headA.setStrokeColor(color);
        headA.setStrokeWidth(style.strokeWidth);
        this.addChild(headA);

        const headB = new jsvgLine();
        headB.setEndpoints(endX, toPoint.y, endX + headSize, toPoint.y - headSize);
        headB.setStrokeColor(color);
        headB.setStrokeWidth(style.strokeWidth);
        this.addChild(headB);

        if (annotation.label) {
            this._drawLabel(
                (startX + endX) / 2,
                laneY - style.labelGap - style.labelFontSize / 2,
                annotation.label,
                style,
                color
            );
        }
    }

    render() {
        this.removeAllChildren();

        if (!this.annotations.length) return;

        const style = { ...DEFAULT_STYLE, ...this.styleConfig };

        // Draw highlights first so arrows and labels appear above them.
        for (const annotation of this.annotations) {
            if (annotation.type !== "highlight") continue;

            for (const termIndex of annotation.termIndices) {
                const anchor = this._resolveTermAnchor({
                    side: annotation.side,
                    termIndex,
                    point: "center"
                });
                if (!anchor) continue;
                this._drawHighlight(anchor, annotation, style);
            }
        }

        let autoLane = 0;
        for (const annotation of this.annotations) {
            if (annotation.type !== "arrow") continue;

            const fromAnchor = this._resolveTermAnchor(annotation.from);
            const toAnchor = this._resolveTermAnchor(annotation.to);
            if (!fromAnchor || !toAnchor) continue;

            const fromPoint = this._pointForAnchor(fromAnchor, annotation.from.point);
            const toPoint = this._pointForAnchor(toAnchor, annotation.to.point);
            if (!fromPoint || !toPoint) continue;

            this._drawArrow(fromPoint, toPoint, annotation, style, autoLane);
            autoLane += 1;
        }
    }
}
