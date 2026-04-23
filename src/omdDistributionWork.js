import { jsvgGroup } from "@teachinglab/jsvg";

const SVG_NS = "http://www.w3.org/2000/svg";

let sharedMeasureContext = null;

function toStringOrEmpty(value) {
    if (value === undefined || value === null) return "";
    return String(value);
}

function toFiniteNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getMeasureContext() {
    if (sharedMeasureContext) return sharedMeasureContext;
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    sharedMeasureContext = canvas.getContext("2d");
    return sharedMeasureContext;
}

function measureText(text, fontSize, fontFamily, fontWeight = 700) {
    const value = toStringOrEmpty(text);
    if (!value) return 0;
    const context = getMeasureContext();
    if (!context) return value.length * fontSize * 0.58;
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return context.measureText(value).width;
}

function normalizeTokens(tokens) {
    if (!Array.isArray(tokens)) return [];
    return tokens
        .map((token) => ({
            text: toStringOrEmpty(token?.text),
            role: toStringOrEmpty(token?.role || "plain"),
            groupIndex: Number.isFinite(Number(token?.groupIndex))
                ? Number(token.groupIndex)
                : null,
            termIndex: Number.isFinite(Number(token?.termIndex))
                ? Number(token.termIndex)
                : null,
        }))
        .filter((token) => token.text);
}

function normalizeGroups(groups) {
    if (!Array.isArray(groups)) return [];
    return groups.map((group, groupIndex) => {
        const terms = Array.isArray(group?.terms) ? group.terms : [];
        return {
            groupIndex,
            label: toStringOrEmpty(group?.label || `Group ${groupIndex + 1}`),
            factor: toStringOrEmpty(group?.factor),
            effectiveFactor: toStringOrEmpty(group?.effectiveFactor || group?.factor),
            terms: terms.map((term, termIndex) => ({
                termIndex,
                text: toStringOrEmpty(term?.text),
                product: toStringOrEmpty(term?.product),
                label: toStringOrEmpty(term?.label),
            })),
        };
    });
}

function tokenIsActive(token, activeGroupIndex) {
    if (!Number.isFinite(activeGroupIndex)) return false;
    if (token.groupIndex !== activeGroupIndex) return false;
    return token.role === "factor"
        || token.role === "outerSign"
        || token.role === "term"
        || token.role === "innerSign";
}

function tokenFill(token, activeGroupIndex, palette) {
    if (!tokenIsActive(token, activeGroupIndex)) return "transparent";
    if (token.role === "factor") return palette.factorBg;
    if (token.role === "innerSign" || token.role === "outerSign") return palette.signBg;
    return token.termIndex === 0 ? palette.termABg : palette.termBBg;
}

function tokenStroke(token, activeGroupIndex, palette) {
    if (!tokenIsActive(token, activeGroupIndex)) return "transparent";
    if (token.role === "factor") return palette.factor;
    if (token.role === "innerSign" || token.role === "outerSign") return palette.sign;
    return token.termIndex === 0 ? palette.termA : palette.termB;
}

function tokenTextFill(token, activeGroupIndex, palette) {
    if (!tokenIsActive(token, activeGroupIndex)) return palette.text;
    if (token.role === "factor") return palette.factorText;
    if (token.role === "innerSign" || token.role === "outerSign") return palette.signText;
    return token.termIndex === 0 ? palette.termAText : palette.termBText;
}

function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            element.setAttribute(key, String(value));
        }
    });
    return element;
}

function appendText(parent, text, x, y, options = {}) {
    const element = createSvgElement("text", {
        x,
        y,
        fill: options.fill || "#111827",
        "font-family": options.fontFamily || "Albert Sans, Inter, Arial, sans-serif",
        "font-size": options.fontSize || 24,
        "font-weight": options.fontWeight || 700,
        "text-anchor": options.anchor || "start",
        "dominant-baseline": options.baseline || "middle",
    });
    element.textContent = text;
    parent.appendChild(element);
    return element;
}

function appendRoundedRect(parent, x, y, width, height, options = {}) {
    const rect = createSvgElement("rect", {
        x,
        y,
        width,
        height,
        rx: options.radius ?? 12,
        ry: options.radius ?? 12,
        fill: options.fill || "transparent",
        stroke: options.stroke || "transparent",
        "stroke-width": options.strokeWidth ?? 0,
        opacity: options.opacity ?? 1,
    });
    parent.appendChild(rect);
    return rect;
}

function appendArrow(parent, from, to, color, label, font, options = {}) {
    const midX = (from.x + to.x) / 2;
    const verticalLift = options.verticalLift
        ?? Math.max(46, Math.abs(to.x - from.x) * 0.30);
    const controlY = Math.min(from.y, to.y) - verticalLift;
    const path = createSvgElement("path", {
        d: `M ${from.x} ${from.y} Q ${midX} ${controlY} ${to.x} ${to.y}`,
        fill: "none",
        stroke: color,
        "stroke-width": 4,
        "stroke-linecap": "round",
    });
    parent.appendChild(path);

    const angle = Math.atan2(to.y - controlY, to.x - midX);
    const arrowLength = 12;
    const arrowAngle = Math.PI / 7;
    const p1 = {
        x: to.x - arrowLength * Math.cos(angle - arrowAngle),
        y: to.y - arrowLength * Math.sin(angle - arrowAngle),
    };
    const p2 = {
        x: to.x - arrowLength * Math.cos(angle + arrowAngle),
        y: to.y - arrowLength * Math.sin(angle + arrowAngle),
    };
    const head = createSvgElement("path", {
        d: `M ${to.x} ${to.y} L ${p1.x} ${p1.y} M ${to.x} ${to.y} L ${p2.x} ${p2.y}`,
        fill: "none",
        stroke: color,
        "stroke-width": 4,
        "stroke-linecap": "round",
    });
    parent.appendChild(head);

    if (label) {
        const labelWidth = measureText(label, font.small, font.family, 800) + 20;
        const labelX = midX - labelWidth / 2;
        const labelY = options.labelY ?? controlY - 26;
        appendRoundedRect(parent, labelX, labelY - 15, labelWidth, 30, {
            fill: "#ffffff",
            stroke: color,
            strokeWidth: 2,
            radius: 15,
        });
        appendText(parent, label, midX, labelY, {
            fill: color,
            fontFamily: font.family,
            fontSize: font.small,
            fontWeight: 800,
            anchor: "middle",
        });
    }
}

export class omdDistributionWork extends jsvgGroup {
    constructor() {
        super();

        this.type = "omdDistributionWork";

        this.step = 0;
        this.tokens = [];
        this.groups = [];
        this.workRows = [];
        this.caption = "";
        this.finalExpression = "";

        this.fontFamily = "Albert Sans, Inter, Arial, sans-serif";
        this.fontSize = 34;
        this.width = 760;
        this.height = 430;

        this.palette = {
            background: "#ffffff",
            border: "#D4E4F7",
            text: "#172033",
            muted: "#5F6B7A",
            factor: "#4A90D9",
            factorBg: "#E8F0FE",
            factorText: "#1D4ED8",
            termA: "#22C55E",
            termABg: "#ECFDF5",
            termAText: "#166534",
            termB: "#F59E0B",
            termBBg: "#FFFBEB",
            termBText: "#92400E",
            sign: "#8B5CF6",
            signBg: "#F3F0FF",
            signText: "#6D28D9",
            rowBg: "#F8FBFF",
            finalBg: "#F0FDF4",
            finalBorder: "#22C55E",
        };

        this.updateLayout();
    }

    loadFromJSON(data) {
        if (!data || typeof data !== "object") return;

        this.step = Math.max(0, Math.floor(toFiniteNumber(data.step, this.step)));
        this.tokens = normalizeTokens(data.tokens);
        this.groups = normalizeGroups(data.groups);
        this.workRows = Array.isArray(data.workRows)
            ? data.workRows.map(toStringOrEmpty).filter(Boolean)
            : [];
        this.caption = toStringOrEmpty(data.caption);
        this.finalExpression = toStringOrEmpty(data.finalExpression);
        this.fontSize = Math.max(18, toFiniteNumber(data.fontSize, this.fontSize));
        this.width = Math.max(480, toFiniteNumber(data.width, this.width));

        if (data.palette && typeof data.palette === "object") {
            this.palette = { ...this.palette, ...data.palette };
        }

        this.updateLayout();
    }

    _activeGroupIndex() {
        if (this.step === 1 || this.step === 2) return 0;
        if (this.step === 3 || this.step === 4) return 1;
        return NaN;
    }

    _visibleProductRows() {
        if (this.step < 2) return [];
        if (this.step < 4) return this.workRows.slice(0, 1);
        return this.workRows.slice(0, 2);
    }

    _renderExpression(parent, y, activeGroupIndex) {
        const font = {
            family: this.fontFamily,
            size: this.fontSize,
            small: Math.max(13, Math.round(this.fontSize * 0.42)),
        };
        const tokenGap = Math.max(4, Math.round(this.fontSize * 0.12));
        const tokenPadX = Math.max(6, Math.round(this.fontSize * 0.18));
        const tokenHeight = Math.round(this.fontSize * 1.38);

        const tokenLayouts = this.tokens.map((token) => {
            const width = Math.ceil(
                measureText(token.text, font.size, font.family, 800) + tokenPadX * 2
            );
            return { token, width };
        });

        const totalWidth = tokenLayouts.reduce((sum, layout) => sum + layout.width, 0)
            + Math.max(0, tokenLayouts.length - 1) * tokenGap;
        let cursorX = Math.max(24, (this.width - totalWidth) / 2);
        const anchors = [];

        tokenLayouts.forEach(({ token, width }) => {
            const active = tokenIsActive(token, activeGroupIndex);
            if (active) {
                appendRoundedRect(parent, cursorX, y - tokenHeight / 2, width, tokenHeight, {
                    fill: tokenFill(token, activeGroupIndex, this.palette),
                    stroke: tokenStroke(token, activeGroupIndex, this.palette),
                    strokeWidth: 2.5,
                    radius: 11,
                });
            }

            appendText(parent, token.text, cursorX + width / 2, y + 1, {
                fill: tokenTextFill(token, activeGroupIndex, this.palette),
                fontFamily: font.family,
                fontSize: font.size,
                fontWeight: active ? 900 : 750,
                anchor: "middle",
            });

            anchors.push({
                ...token,
                x: cursorX + width / 2,
                y,
                top: y - tokenHeight / 2,
                bottom: y + tokenHeight / 2,
                left: cursorX,
                right: cursorX + width,
            });
            cursorX += width + tokenGap;
        });

        return { anchors, font, tokenHeight };
    }

    _renderArrows(parent, anchors, activeGroupIndex, baseY, font) {
        if (!Number.isFinite(activeGroupIndex)) return;

        const group = this.groups[activeGroupIndex];
        if (!group) return;

        const factorAnchor = anchors.find(
            (anchor) => anchor.groupIndex === activeGroupIndex && anchor.role === "factor"
        );
        if (!factorAnchor) return;

        const termAnchors = anchors.filter(
            (anchor) => anchor.groupIndex === activeGroupIndex && anchor.role === "term"
        );

        const sortedTerms = [...termAnchors].sort((a, b) => (a.termIndex ?? 0) - (b.termIndex ?? 0));
        const labelLaneTop = 98;
        const labelBaseY = Math.max(labelLaneTop, baseY - 76);

        sortedTerms.forEach((termAnchor, visualIndex) => {
            const term = group.terms.find((entry) => entry.termIndex === termAnchor.termIndex);
            const color = termAnchor.termIndex === 0 ? this.palette.termA : this.palette.termB;
            const horizontalSpan = Math.abs(termAnchor.x - factorAnchor.x);
            const lift = Math.max(56, horizontalSpan * 0.34) + visualIndex * 14;
            appendArrow(
                parent,
                { x: factorAnchor.x, y: factorAnchor.top - 4 },
                { x: termAnchor.x, y: termAnchor.top - 4 },
                color,
                term?.product
                    ? `${group.effectiveFactor} × ${term.text} = ${term.product}`
                    : "",
                font,
                {
                    verticalLift: lift,
                    labelY: labelBaseY + visualIndex * 28,
                }
            );
        });
    }

    _renderProductCards(parent, activeGroupIndex, startY, font) {
        if (!Number.isFinite(activeGroupIndex)) return startY;

        const group = this.groups[activeGroupIndex];
        if (!group) return startY;

        const cardGap = 14;
        const cardHeight = 56;
        const cardWidth = Math.min(300, (this.width - 72 - cardGap) / 2);
        const totalWidth = group.terms.length * cardWidth + Math.max(0, group.terms.length - 1) * cardGap;
        let x = (this.width - totalWidth) / 2;

        group.terms.forEach((term) => {
            const color = term.termIndex === 0 ? this.palette.termA : this.palette.termB;
            const fill = term.termIndex === 0 ? this.palette.termABg : this.palette.termBBg;
            appendRoundedRect(parent, x, startY, cardWidth, cardHeight, {
                fill,
                stroke: color,
                strokeWidth: 2,
                radius: 14,
            });
            appendText(parent, `${group.effectiveFactor} × ${term.text}`, x + 18, startY + 20, {
                fill: this.palette.muted,
                fontFamily: font.family,
                fontSize: font.small,
                fontWeight: 800,
            });
            appendText(parent, `= ${term.product}`, x + cardWidth - 18, startY + 34, {
                fill: color,
                fontFamily: font.family,
                fontSize: Math.max(20, Math.round(this.fontSize * 0.58)),
                fontWeight: 900,
                anchor: "end",
            });
            x += cardWidth + cardGap;
        });

        return startY + cardHeight;
    }

    _renderWorkRows(parent, startY, font) {
        const rows = this._visibleProductRows();
        let y = startY;

        rows.forEach((row, index) => {
            const isFinalDistributedRow = index === rows.length - 1 && this.step >= 4;
            appendRoundedRect(parent, 70, y, this.width - 140, 48, {
                fill: isFinalDistributedRow ? "#F8FBFF" : this.palette.rowBg,
                stroke: this.palette.border,
                strokeWidth: 1.5,
                radius: 13,
            });
            appendText(parent, row, this.width / 2, y + 25, {
                fill: this.palette.text,
                fontFamily: font.family,
                fontSize: Math.max(23, Math.round(this.fontSize * 0.70)),
                fontWeight: 850,
                anchor: "middle",
            });
            y += 58;
        });

        if (this.step >= 5 && this.finalExpression) {
            appendRoundedRect(parent, 90, y + 4, this.width - 180, 58, {
                fill: this.palette.finalBg,
                stroke: this.palette.finalBorder,
                strokeWidth: 2.5,
                radius: 16,
            });
            appendText(parent, `Answer: ${this.finalExpression}`, this.width / 2, y + 34, {
                fill: "#166534",
                fontFamily: font.family,
                fontSize: Math.max(24, Math.round(this.fontSize * 0.72)),
                fontWeight: 950,
                anchor: "middle",
            });
            y += 74;
        }

        return y;
    }

    updateLayout() {
        this.removeAllChildren();

        const root = this.svgObject;
        const font = {
            family: this.fontFamily,
            size: this.fontSize,
            small: Math.max(13, Math.round(this.fontSize * 0.42)),
        };
        const activeGroupIndex = this._activeGroupIndex();

        let cursorY = 28;
        const title = this.step === 0
            ? "Start with the whole expression"
            : Number.isFinite(activeGroupIndex)
                ? `Distribute ${this.groups[activeGroupIndex]?.effectiveFactor || "the factor"}`
                : "Put the distributed pieces together";

        appendRoundedRect(root, 8, 8, this.width - 16, 72, {
            fill: "#F8FBFF",
            stroke: this.palette.border,
            strokeWidth: 1.5,
            radius: 18,
        });
        appendText(root, title, this.width / 2, cursorY + 8, {
            fill: this.palette.text,
            fontFamily: font.family,
            fontSize: Math.max(18, Math.round(this.fontSize * 0.54)),
            fontWeight: 900,
            anchor: "middle",
        });
        if (this.caption) {
            appendText(root, this.caption, this.width / 2, cursorY + 35, {
                fill: this.palette.muted,
                fontFamily: font.family,
                fontSize: font.small,
                fontWeight: 700,
                anchor: "middle",
            });
        }

        cursorY = Number.isFinite(activeGroupIndex) ? 190 : 132;
        const expression = this._renderExpression(root, cursorY, activeGroupIndex);
        this._renderArrows(root, expression.anchors, activeGroupIndex, cursorY, font);

        cursorY += Number.isFinite(activeGroupIndex) ? 132 : 70;
        if (this.step === 1 || this.step === 3) {
            cursorY = this._renderProductCards(root, activeGroupIndex, cursorY, font) + 8;
        } else if (this.step >= 2) {
            if (Number.isFinite(activeGroupIndex)) {
                cursorY = this._renderProductCards(root, activeGroupIndex, cursorY, font) + 12;
            }
            cursorY = this._renderWorkRows(root, cursorY, font);
        }

        const totalHeight = Math.max(360, Math.ceil(cursorY + 26));
        appendRoundedRect(root, 1, 1, this.width - 2, totalHeight - 2, {
            fill: "none",
            stroke: this.palette.border,
            strokeWidth: 2,
            radius: 22,
        });

        this.height = totalHeight;
        this.setWidthAndHeight(this.width, totalHeight);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${totalHeight}`);
    }
}
