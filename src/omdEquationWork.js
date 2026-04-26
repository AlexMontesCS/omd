import { jsvgGroup, jsvgLine, jsvgTextBox } from "@teachinglab/jsvg";
import { getNodeForAST } from "../omd/core/omdUtilities.js";
import { math } from "../omd/utils/math.js";

let sharedMeasureContext = null;

function toFiniteNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
    }
    return fallback;
}

function toStringOrEmpty(value) {
    if (value === undefined || value === null) return '';
    return String(value);
}

function normalizeMathText(value) {
    return toStringOrEmpty(value)
        .replace(/[−–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeTermLookupText(value) {
    return normalizeMathText(value).replace(/\s+/g, '');
}

function parseOptionalNonNegativeIndex(value) {
    if (value === undefined || value === null) return NaN;
    if (typeof value === 'string' && value.trim() === '') return NaN;

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return NaN;
    return Math.max(0, Math.floor(parsed));
}

function parseTermIndex(value) {
    return parseOptionalNonNegativeIndex(value);
}

function parseTermText(value, { allowNumeric = true } = {}) {
    if (value === undefined || value === null) return '';

    const normalized = normalizeTermLookupText(value);
    if (!normalized) return '';

    if (!allowNumeric && /^[-+]?\d+(?:\.\d+)?$/.test(normalized)) {
        return '';
    }

    return normalized;
}

function normalizeAnchorPoint(value) {
    const lower = toStringOrEmpty(value).trim().toLowerCase();
    if (lower === 'start' || lower === 'left') return 'start';
    if (lower === 'end' || lower === 'right') return 'end';
    if (lower === 'center' || lower === 'middle') return 'center';
    return '';
}

function getMeasureContext() {
    if (sharedMeasureContext) return sharedMeasureContext;
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    sharedMeasureContext = canvas.getContext('2d');
    return sharedMeasureContext;
}

function measureTextWidth(text, fontSize, fontFamily, fontWeight = 500) {
    const normalized = toStringOrEmpty(text);
    if (!normalized) return 0;

    const context = getMeasureContext();
    if (!context) {
        return normalized.length * fontSize * 0.62;
    }

    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return context.measureText(normalized).width;
}

function normalizeAlignment(rawAlign, side) {
    const lower = toStringOrEmpty(rawAlign).trim().toLowerCase();
    if (!lower) return null;

    if (lower === 'start' || lower === 'left') return 'start';
    if (lower === 'center' || lower === 'middle') return 'center';
    if (lower === 'decimal' || lower === 'decimals') return 'decimal';
    if (lower === 'end' || lower === 'right') return 'end';

    if (lower === 'equals' || lower === 'nearequals' || lower === 'near-equals') {
        return side === 'left' ? 'end' : 'start';
    }

    if (lower === 'outer') {
        return side === 'left' ? 'start' : 'end';
    }

    return null;
}

function splitTopLevelTerms(expression) {
    const raw = toStringOrEmpty(expression);
    if (!raw.trim()) return [];

    const parts = [];
    let depth = 0;
    let startIndex = 0;

    for (let index = 0; index < raw.length; index += 1) {
        const char = raw[index];

        if (char === '(' || char === '[' || char === '{') {
            depth += 1;
            continue;
        }

        if (char === ')' || char === ']' || char === '}') {
            depth = Math.max(0, depth - 1);
            continue;
        }

        if (depth !== 0) continue;
        if (char !== '+' && char !== '-') continue;
        if (index === startIndex) continue;

        const segment = raw.slice(startIndex, index);
        if (segment.trim()) {
            parts.push({
                startIndex,
                endIndex: index,
                text: segment
            });
        }
        startIndex = index;
    }

    const tail = raw.slice(startIndex);
    if (tail.trim()) {
        parts.push({
            startIndex,
            endIndex: raw.length,
            text: tail
        });
    }

    return parts;
}

function parseRowFromString(entry) {
    const trimmed = toStringOrEmpty(entry).trim();
    if (!trimmed) return null;

    if (trimmed.toLowerCase() === 'line' || /^[=\-_]{3,}$/.test(trimmed)) {
        return { kind: 'line' };
    }

    if (trimmed.includes('=')) {
        const parts = trimmed.split('=');
        const left = toStringOrEmpty(parts.shift()).trim();
        const right = toStringOrEmpty(parts.join('=')).trim();
        return {
            kind: 'equation',
            left,
            right,
            center: '='
        };
    }

    // Treat math-like standalone strings as expression rows so they can align
    // (including decimal alignment) in stacked arithmetic workflows.
    if (/[-+*/^().]|\d/.test(trimmed)) {
        return {
            kind: 'expression',
            expression: trimmed
        };
    }

    return {
        kind: 'text',
        text: trimmed
    };
}

function normalizeRowEntry(entry) {
    if (typeof entry === 'string') {
        return parseRowFromString(entry);
    }

    if (!entry || typeof entry !== 'object') {
        return null;
    }

    const inferredType = toStringOrEmpty(entry.kind || entry.type).trim().toLowerCase();
    const kind = inferredType || 'equation';

    if (kind === 'line' || kind === 'divider') {
        return {
            kind: 'line',
            lineColor: entry.lineColor,
            lineStrokeWidth: entry.lineStrokeWidth,
            lineInset: entry.lineInset
        };
    }

    const left = toStringOrEmpty(
        entry.left ?? entry.leftText ?? entry.leftSide ?? entry.leftExpression
    ).trim();
    const right = toStringOrEmpty(
        entry.right ?? entry.rightText ?? entry.rightSide ?? entry.rightExpression
    ).trim();
    const center = toStringOrEmpty(entry.center ?? entry.centerText ?? entry.middle).trim();
    const text = toStringOrEmpty(entry.text ?? entry.value).trim();
    const expression = toStringOrEmpty(
        entry.expression ?? entry.expr ?? entry.left ?? entry.leftExpression ?? entry.text
    ).trim();

    const sharedAnchorRow = parseOptionalNonNegativeIndex(entry.anchorRow);
    const sharedAnchorTerm = entry.anchorTerm;
    const sharedAnchorPoint = normalizeAnchorPoint(entry.anchorPoint);
    const sharedAnchorVisualPoint = normalizeAnchorPoint(entry.anchorVisualPoint);

    const leftAnchorTermSource = entry.leftAnchorTerm ?? sharedAnchorTerm;
    const rightAnchorTermSource = entry.rightAnchorTerm ?? sharedAnchorTerm;
    const leftAnchorRow = parseOptionalNonNegativeIndex(entry.leftAnchorRow);
    const rightAnchorRow = parseOptionalNonNegativeIndex(entry.rightAnchorRow);
    const leftAnchorTermIndex = parseTermIndex(entry.leftAnchorTermIndex);
    const rightAnchorTermIndex = parseTermIndex(entry.rightAnchorTermIndex);
    const leftAnchorTermSourceIndex = parseTermIndex(leftAnchorTermSource);
    const rightAnchorTermSourceIndex = parseTermIndex(rightAnchorTermSource);
    const hasExplicitLeftAnchorTermText = Object.prototype.hasOwnProperty.call(entry, 'leftAnchorTermText');
    const hasExplicitRightAnchorTermText = Object.prototype.hasOwnProperty.call(entry, 'rightAnchorTermText');

    if (!inferredType && !left && !right && text) {
        return parseRowFromString(text);
    }

    return {
        kind:
            kind === 'operation'
                ? 'operation'
                : (kind === 'text' ? 'text' : (kind === 'expression' ? 'expression' : 'equation')),
        left,
        right,
        center,
        text,
        expression,
        fontSize: toFiniteNumber(entry.fontSize, NaN),
        affectsDividerWidth: toBoolean(entry.affectsDividerWidth, true),
        leftAlign: normalizeAlignment(entry.leftAlign, 'left'),
        rightAlign: normalizeAlignment(entry.rightAlign, 'right'),
        leftOffset: toFiniteNumber(entry.leftOffset, 0),
        rightOffset: toFiniteNumber(entry.rightOffset, 0),
        centerOffset: toFiniteNumber(entry.centerOffset, 0),
        drawLineBefore: toBoolean(entry.drawLineBefore, false),
        drawLineAfter: toBoolean(entry.drawLineAfter, false),
        color: entry.color,
        leftColor: entry.leftColor,
        rightColor: entry.rightColor,
        centerColor: entry.centerColor,
        lineColor: entry.lineColor,
        lineStrokeWidth: entry.lineStrokeWidth,
        lineInset: entry.lineInset,
        leftAnchorRow: Number.isFinite(leftAnchorRow) ? leftAnchorRow : sharedAnchorRow,
        rightAnchorRow: Number.isFinite(rightAnchorRow) ? rightAnchorRow : sharedAnchorRow,
        leftAnchorTermIndex: Number.isFinite(leftAnchorTermIndex) ? leftAnchorTermIndex : leftAnchorTermSourceIndex,
        rightAnchorTermIndex: Number.isFinite(rightAnchorTermIndex) ? rightAnchorTermIndex : rightAnchorTermSourceIndex,
        leftAnchorTermText: parseTermText(
            hasExplicitLeftAnchorTermText ? entry.leftAnchorTermText : leftAnchorTermSource,
            { allowNumeric: hasExplicitLeftAnchorTermText }
        ),
        rightAnchorTermText: parseTermText(
            hasExplicitRightAnchorTermText ? entry.rightAnchorTermText : rightAnchorTermSource,
            { allowNumeric: hasExplicitRightAnchorTermText }
        ),
        leftAnchorPoint: normalizeAnchorPoint(entry.leftAnchorPoint) || sharedAnchorPoint,
        rightAnchorPoint: normalizeAnchorPoint(entry.rightAnchorPoint) || sharedAnchorPoint,
        leftAnchorVisualPoint: normalizeAnchorPoint(entry.leftAnchorVisualPoint) || sharedAnchorVisualPoint,
        rightAnchorVisualPoint: normalizeAnchorPoint(entry.rightAnchorVisualPoint) || sharedAnchorVisualPoint
    };
}

function normalizeRows(data) {
    if (Array.isArray(data?.rows)) {
        return data.rows.map(normalizeRowEntry).filter(Boolean);
    }

    if (Array.isArray(data?.equations)) {
        return data.equations
            .map((equation) => parseRowFromString(toStringOrEmpty(equation)))
            .filter(Boolean);
    }

    if (typeof data?.equation === 'string' && data.equation.includes('=')) {
        return [parseRowFromString(data.equation)].filter(Boolean);
    }

    return [];
}

export class omdEquationWork extends jsvgGroup {
    constructor() {
        super();

        this.type = 'omdEquationWork';

        this.rows = [];

        this.fontFamily = 'Albert Sans';
        this.fontSize = 40;
        this.fontWeight = 400;

        this.rowHeightMultiplier = 1.22;
        this.rowGap = 22;
        this.columnGap = 24;
        this.paddingX = 30;
        this.paddingY = 26;

        this.lineGap = 12;
        this.lineInset = 6;
        this.lineStrokeWidth = 4;

        this.centerSymbol = '=';

        this.equationColor = '#111827';
        this.operationColor = '#111827';
        this.textColor = '#111827';
        this.centerColor = '';
        this.lineColor = '#111827';

        this.operationLineUp = 'equals';
        this.operationLeftAlign = '';
        this.operationRightAlign = '';
        this.equationLeftAlign = 'end';
        this.equationRightAlign = 'start';
        this.expressionAlign = 'end';

        this.drawLineBeforeRows = new Set();
        this.drawLineAfterRows = new Set();

        this.updateLayout();
    }

    loadFromJSON(data) {
        if (!data || typeof data !== 'object') {
            return;
        }

        this.rows = normalizeRows(data);

        if (typeof data.fontFamily === 'string' && data.fontFamily.trim()) {
            this.fontFamily = data.fontFamily.trim();
        }

        this.fontSize = Math.max(8, toFiniteNumber(data.fontSize, this.fontSize));
        this.fontWeight = data.fontWeight ?? this.fontWeight;

        this.rowHeightMultiplier = Math.max(0.8, toFiniteNumber(data.rowHeightMultiplier, this.rowHeightMultiplier));
        this.rowGap = Math.max(0, toFiniteNumber(data.rowGap, this.rowGap));
        this.columnGap = Math.max(0, toFiniteNumber(data.columnGap, this.columnGap));
        this.paddingX = Math.max(0, toFiniteNumber(data.paddingX, this.paddingX));
        this.paddingY = Math.max(0, toFiniteNumber(data.paddingY, this.paddingY));

        this.lineGap = Math.max(0, toFiniteNumber(data.lineGap, this.lineGap));
        this.lineInset = Math.max(0, toFiniteNumber(data.lineInset, this.lineInset));
        this.lineStrokeWidth = Math.max(1, toFiniteNumber(data.lineStrokeWidth, this.lineStrokeWidth));

        const centerSymbol = toStringOrEmpty(data.centerSymbol).trim();
        if (centerSymbol) this.centerSymbol = centerSymbol;

        if (typeof data.equationColor === 'string' && data.equationColor) this.equationColor = data.equationColor;
        if (typeof data.operationColor === 'string' && data.operationColor) this.operationColor = data.operationColor;
        if (typeof data.textColor === 'string' && data.textColor) this.textColor = data.textColor;
        if (typeof data.centerColor === 'string') this.centerColor = data.centerColor;
        if (typeof data.lineColor === 'string' && data.lineColor) this.lineColor = data.lineColor;

        if (typeof data.operationLineUp !== 'undefined') this.operationLineUp = data.operationLineUp;
        if (typeof data.operationLeftAlign !== 'undefined') this.operationLeftAlign = data.operationLeftAlign;
        if (typeof data.operationRightAlign !== 'undefined') this.operationRightAlign = data.operationRightAlign;
        if (typeof data.equationLeftAlign !== 'undefined') this.equationLeftAlign = data.equationLeftAlign;
        if (typeof data.equationRightAlign !== 'undefined') this.equationRightAlign = data.equationRightAlign;
        if (typeof data.expressionAlign !== 'undefined') this.expressionAlign = data.expressionAlign;

        this.drawLineAfterRows = new Set(
            Array.isArray(data.drawLineAfterRows)
                ? data.drawLineAfterRows.map((value) => Number(value)).filter(Number.isFinite)
                : []
        );

        this.drawLineBeforeRows = new Set(
            Array.isArray(data.drawLineBeforeRows)
                ? data.drawLineBeforeRows.map((value) => Number(value)).filter(Number.isFinite)
                : []
        );

        this.updateLayout();
    }

    _resolveSideAlignment(row, side) {
        const rowAlign = side === 'left' ? row.leftAlign : row.rightAlign;
        if (rowAlign) return rowAlign;

        if (row.kind === 'operation') {
            const explicitSideAlign = normalizeAlignment(
                side === 'left' ? this.operationLeftAlign : this.operationRightAlign,
                side
            );
            if (explicitSideAlign) return explicitSideAlign;

            const shared = normalizeAlignment(this.operationLineUp, side);
            if (shared) return shared;

            return 'start';
        }

        if (row.kind === 'equation') {
            const explicitEquationAlign = normalizeAlignment(
                side === 'left' ? this.equationLeftAlign : this.equationRightAlign,
                side
            );
            if (explicitEquationAlign) return explicitEquationAlign;

            return side === 'left' ? 'end' : 'start';
        }

        if (row.kind === 'expression') {
            const explicitExpressionAlign = normalizeAlignment(this.expressionAlign, side);
            if (explicitExpressionAlign) return explicitExpressionAlign;
            return side === 'left' ? 'end' : 'start';
        }

        return 'center';
    }

    _getDecimalAlignmentInfo(visual) {
        if (!visual) return null;

        const text = normalizeMathText(visual.text);
        const dotIndex = text.indexOf('.');
        if (dotIndex < 0) return null;

        const beforeDecimal = text.slice(0, dotIndex);
        const widthBefore = measureTextWidth(
            beforeDecimal,
            visual.fontSize || this.fontSize,
            this.fontFamily,
            visual.fontWeight ?? this.fontWeight
        );

        return {
            widthBefore
        };
    }

    _walkMathNodes(rootNode, visitor) {
        if (!rootNode || typeof visitor !== 'function') return;

        const visited = new Set();
        const stack = [rootNode];

        while (stack.length) {
            const node = stack.pop();
            if (!node || visited.has(node)) continue;
            visited.add(node);

            visitor(node);

            if (Array.isArray(node.childList)) {
                node.childList.forEach((child) => stack.push(child));
            }

            if (node.argumentNodeList && typeof node.argumentNodeList === 'object') {
                Object.values(node.argumentNodeList).forEach((value) => {
                    if (Array.isArray(value)) {
                        value.forEach((child) => stack.push(child));
                    } else {
                        stack.push(value);
                    }
                });
            }
        }
    }

    _hideMathBackgrounds(rootNode) {
        this._walkMathNodes(rootNode, (node) => {
            if (typeof node.hideBackgroundByDefault === 'function') {
                node.hideBackgroundByDefault();
            }
        });
    }

    _applyMathColor(rootNode, color) {
        if (!color) return;

        this._walkMathNodes(rootNode, (node) => {
            if (node.textElement && typeof node.textElement.setFillColor === 'function') {
                node.textElement.setFillColor(color);
            }

            if (node.fractionLine && typeof node.fractionLine.setStrokeColor === 'function') {
                node.fractionLine.setStrokeColor(color);
            }
        });
    }

    _applyMathFontWeight(rootNode, fontWeight) {
        if (fontWeight === undefined || fontWeight === null || fontWeight === '') return;

        this._walkMathNodes(rootNode, (node) => {
            const applyWeight = (target) => {
                if (!target) return;

                if (typeof target.setFontWeight === 'function') {
                    target.setFontWeight(fontWeight);
                    return;
                }

                if (target.svgObject?.style) {
                    target.svgObject.style.fontWeight = String(fontWeight);
                }
            };

            applyWeight(node.textElement);

            for (const value of Object.values(node)) {
                if (Array.isArray(value)) {
                    value.forEach((entry) => applyWeight(entry));
                } else {
                    applyWeight(value);
                }
            }
        });
    }

    _initializeMathNode(node, fontSize) {
        if (!node) return;

        if (typeof node.setFontSize === 'function') {
            node.setFontSize(fontSize);
        }

        if (typeof node.initialize === 'function') {
            node.initialize();
            return;
        }

        if (typeof node.computeDimensions === 'function') {
            node.computeDimensions();
        }
        if (typeof node.updateLayout === 'function') {
            node.updateLayout();
        }
    }

    _createMathVisual(value, fontSize, fontWeight, color) {
        const expression = normalizeMathText(value);
        if (!expression) return null;

        if (typeof math.parse !== 'function') {
            return null;
        }

        try {
            const ast = math.parse(expression);
            const NodeType = getNodeForAST(ast);
            const node = new NodeType(ast);
            this._initializeMathNode(node, fontSize);
            this._applyMathFontWeight(node, fontWeight);
            if (typeof node.computeDimensions === 'function') node.computeDimensions();
            if (typeof node.updateLayout === 'function') node.updateLayout();
            this._hideMathBackgrounds(node);
            this._applyMathColor(node, color);

            return {
                kind: 'math',
                node,
                width: Math.max(1, node.width || 0),
                height: Math.max(1, node.height || Math.ceil(fontSize * 1.2)),
                text: expression,
                normalizedText: normalizeTermLookupText(expression),
                color,
                fontSize,
                fontWeight
            };
        } catch {
            // Fall back to text or composite rendering.
        }

        return null;
    }

    _createLeadingDivisionVisual(value, fontSize, fontWeight, color) {
        const expression = normalizeMathText(value);
        if (!expression.startsWith('/')) return null;

        const denominator = expression.slice(1).trim();
        if (!denominator || !denominator.includes('/')) {
            return null;
        }

        const denominatorVisual = this._createMathVisual(denominator, fontSize, fontWeight, color)
            || this._createTextVisual(denominator, fontSize, fontWeight, color);

        if (!denominatorVisual) return null;

        const slashVisual = this._createTextVisual('/', fontSize, fontWeight, color);
        if (!slashVisual) return null;

        const gap = Math.max(4, Math.round(fontSize * 0.14));

        return {
            kind: 'composite',
            parts: [
                { visual: slashVisual, xOffset: 0 },
                { visual: denominatorVisual, xOffset: slashVisual.width + gap }
            ],
            width: slashVisual.width + gap + denominatorVisual.width,
            height: Math.max(slashVisual.height || 0, denominatorVisual.height || 0),
            text: expression,
            normalizedText: normalizeTermLookupText(expression),
            color,
            fontSize,
            fontWeight
        };
    }

    _createTextVisual(value, fontSize, fontWeight, color) {
        const text = normalizeMathText(value);
        if (!text) return null;

        const width = Math.max(1, Math.ceil(measureTextWidth(text, fontSize, this.fontFamily, fontWeight) + 4));
        const height = Math.max(18, Math.ceil(fontSize * 1.2));

        return {
            kind: 'text',
            text,
            normalizedText: normalizeTermLookupText(text),
            width,
            height,
            color,
            fontSize,
            fontWeight
        };
    }

    _createSideVisual(value, fontSize, fontWeight, color) {
        const normalized = normalizeMathText(value);
        if (!normalized) return null;

        const leadingDivisionVisual = this._createLeadingDivisionVisual(
            normalized,
            fontSize,
            fontWeight,
            color
        );
        if (leadingDivisionVisual) return leadingDivisionVisual;

        const mathVisual = this._createMathVisual(normalized, fontSize, fontWeight, color);
        if (mathVisual) return mathVisual;

        return this._createTextVisual(normalized, fontSize, fontWeight, color);
    }

    _createCenterVisual(value, fontSize, fontWeight, color) {
        return this._createTextVisual(value, fontSize, fontWeight, color);
    }

    _resolveAlignedX(startX, columnWidth, visualWidth, alignment, offset = 0) {
        const width = Math.max(0, visualWidth || 0);
        if (alignment === 'end') {
            return startX + columnWidth - width + offset;
        }
        if (alignment === 'center') {
            return startX + ((columnWidth - width) / 2) + offset;
        }
        return startX + offset;
    }

    _placeVisual(visual, x, yCenter, rowHeight, textAlign = 'left') {
        if (!visual) return;

        if (visual.kind === 'composite' && Array.isArray(visual.parts)) {
            visual.parts.forEach((part) => {
                if (!part?.visual) return;
                this._placeVisual(
                    part.visual,
                    x + (part.xOffset || 0),
                    yCenter,
                    rowHeight,
                    part.textAlign || textAlign
                );
            });
            return;
        }

        if (visual.kind === 'math' && visual.node) {
            visual.node.setPosition(x, yCenter - (visual.height / 2));
            this.addChild(visual.node);
            return;
        }

        if (visual.kind === 'text') {
            const textBox = new jsvgTextBox();
            textBox.setWidthAndHeight(Math.max(1, visual.width), Math.max(1, rowHeight));
            textBox.setText(visual.text || '');
            textBox.setFontFamily(this.fontFamily);
            textBox.setFontColor(visual.color || this.textColor);
            textBox.setFontSize(visual.fontSize || this.fontSize);
            if (typeof textBox.setFontWeight === 'function') {
                textBox.setFontWeight(visual.fontWeight ?? this.fontWeight);
            }
            textBox.setVerticalCentering();
            if (textAlign === 'right') textBox.setAlignment('right');
            else if (textAlign === 'center') textBox.setAlignment('center');
            else textBox.setAlignment('left');

            textBox.setPosition(x, yCenter - (rowHeight / 2));
            this.addChild(textBox);
        }
    }

    _flattenTopLevelTerms(node, sign = 1, terms = []) {
        if (!node) return terms;

        const op = toStringOrEmpty(node?.astNodeData?.op);
        const isAddSubtract = node.type === 'omdBinaryExpressionNode' && (op === '+' || op === '-');

        if (isAddSubtract) {
            this._flattenTopLevelTerms(node.left, sign, terms);
            this._flattenTopLevelTerms(node.right, op === '-' ? -sign : sign, terms);
            return terms;
        }

        terms.push({ node, sign });
        return terms;
    }

    _absoluteX(node, stopAtNode) {
        let total = 0;
        let current = node;

        while (current && current !== stopAtNode) {
            total += toFiniteNumber(current.xpos, 0);
            current = current.parent;
        }

        return total;
    }

    _buildMathTermAnchors(sideVisual, sideX) {
        if (!sideVisual?.node) return [];

        const flattened = this._flattenTopLevelTerms(sideVisual.node);
        if (!flattened.length) return [];

        return flattened.map((termEntry, index) => {
            const termNode = termEntry.node;
            const termStart = sideX + this._absoluteX(termNode, sideVisual.node);
            const termEnd = termStart + Math.max(0, termNode.width || 0);

            const baseRaw = normalizeTermLookupText(
                typeof termNode.toString === 'function' ? termNode.toString() : ''
            );

            let signed = baseRaw;
            if (termEntry.sign < 0) {
                if (signed.startsWith('-')) signed = signed.slice(1);
                else signed = `-${signed}`;
            }

            const unsigned = signed.startsWith('-') || signed.startsWith('+')
                ? signed.slice(1)
                : signed;

            return {
                index,
                signed,
                unsigned,
                start: termStart,
                center: termStart + ((termEnd - termStart) / 2),
                end: termEnd
            };
        });
    }

    _buildTextTermAnchors(sideVisual, sideX) {
        if (!sideVisual?.text) return [];

        const terms = splitTopLevelTerms(sideVisual.text);
        if (!terms.length) return [];

        return terms.map((term, index) => {
            const prefix = sideVisual.text.slice(0, term.startIndex);
            const termText = sideVisual.text.slice(term.startIndex, term.endIndex);

            const prefixWidth = measureTextWidth(prefix, sideVisual.fontSize, this.fontFamily, sideVisual.fontWeight);
            const termWidth = measureTextWidth(termText, sideVisual.fontSize, this.fontFamily, sideVisual.fontWeight);

            const start = sideX + prefixWidth;
            const end = start + termWidth;

            const normalized = normalizeTermLookupText(termText);
            const unsigned = normalized.startsWith('-') || normalized.startsWith('+')
                ? normalized.slice(1)
                : normalized;

            return {
                index,
                signed: normalized,
                unsigned,
                start,
                center: start + (termWidth / 2),
                end
            };
        });
    }

    _buildSideTermAnchors(sideVisual, sideX) {
        if (!sideVisual) return [];

        if (sideVisual.kind === 'math') {
            const mathAnchors = this._buildMathTermAnchors(sideVisual, sideX);
            if (mathAnchors.length) return mathAnchors;
        }

        return this._buildTextTermAnchors(sideVisual, sideX);
    }

    _findReferenceEquation(rowIndex, explicitRowIndex, equationAnchorList) {
        if (!equationAnchorList.length) return null;

        if (Number.isFinite(explicitRowIndex)) {
            const exact = equationAnchorList.find((entry) => entry.rowIndex === explicitRowIndex);
            if (exact) return exact;
        }

        let nearestAbove = null;
        for (const entry of equationAnchorList) {
            if (entry.rowIndex < rowIndex) {
                nearestAbove = entry;
            }
        }

        if (nearestAbove) return nearestAbove;
        return equationAnchorList[0];
    }

    _findTargetTerm(terms, termIndex, termText) {
        if (!Array.isArray(terms) || !terms.length) return null;

        const normalizedText = normalizeTermLookupText(termText);
        if (normalizedText) {
            const match = terms.find((term) => term.signed === normalizedText || term.unsigned === normalizedText);
            if (match) return match;
        }

        if (Number.isFinite(termIndex)) {
            const clamped = Math.max(0, Math.min(terms.length - 1, Math.floor(termIndex)));
            return terms[clamped];
        }

        return null;
    }

    _resolveAnchoredSideX({
        row,
        side,
        defaultX,
        visual,
        rowIndex,
        equationAnchorList,
        sideOffset
    }) {
        if (!visual) return defaultX;

        const rowIndexField = side === 'left' ? row.leftAnchorRow : row.rightAnchorRow;
        const termIndexField = side === 'left' ? row.leftAnchorTermIndex : row.rightAnchorTermIndex;
        const termTextField = side === 'left' ? row.leftAnchorTermText : row.rightAnchorTermText;
        const targetPoint = (side === 'left' ? row.leftAnchorPoint : row.rightAnchorPoint) || 'center';
        const visualPoint = (side === 'left' ? row.leftAnchorVisualPoint : row.rightAnchorVisualPoint) || 'center';

        const hasAnchorTerm = Number.isFinite(termIndexField) || !!termTextField;
        if (!hasAnchorTerm) return defaultX;

        const referenceEquation = this._findReferenceEquation(rowIndex, rowIndexField, equationAnchorList);
        if (!referenceEquation) return defaultX;

        const referenceTerms = side === 'left' ? referenceEquation.leftTerms : referenceEquation.rightTerms;
        const targetTerm = this._findTargetTerm(referenceTerms, termIndexField, termTextField);
        if (!targetTerm) return defaultX;

        const anchorValue = targetTerm[targetPoint] ?? targetTerm.center;
        if (!Number.isFinite(anchorValue)) return defaultX;

        if (visualPoint === 'start') return anchorValue + sideOffset;
        if (visualPoint === 'end') return anchorValue - visual.width + sideOffset;
        return anchorValue - (visual.width / 2) + sideOffset;
    }

    updateLayout() {
        this.removeAllChildren();

        if (!this.rows.length) {
            const defaultWidth = this.paddingX * 2 + 120;
            const defaultHeight = this.paddingY * 2 + 60;
            this.setWidthAndHeight(defaultWidth, defaultHeight);
            this.width = defaultWidth;
            this.height = defaultHeight;
            return;
        }

        const rowLayouts = [];
        let leftColumnWidth = 0;
        let rightColumnWidth = 0;
        let centerColumnWidth = 0;
        let standaloneTextWidth = 0;

        this.rows.forEach((row, index) => {
            const globalFontSize = this.fontSize;
            const globalFontWeight = this.fontWeight;

            if (row.kind === 'line') {
                rowLayouts.push({ index, row, kind: 'line' });
                return;
            }

            if (row.kind === 'text') {
                const textFontSize = Number.isFinite(row.fontSize)
                    ? Math.max(8, row.fontSize)
                    : globalFontSize;
                const textVisual = this._createTextVisual(
                    row.text,
                    textFontSize,
                    globalFontWeight,
                    row.color || this.textColor
                );
                const textWidth = textVisual ? textVisual.width : 0;
                if (row.affectsDividerWidth !== false) {
                    standaloneTextWidth = Math.max(standaloneTextWidth, textWidth);
                }

                rowLayouts.push({
                    index,
                    row,
                    kind: 'text',
                    textVisual,
                    rowHeight: Math.max(18, textFontSize * this.rowHeightMultiplier, textVisual?.height || 0)
                });
                return;
            }

            if (row.kind === 'expression') {
                const expressionVisual = this._createSideVisual(
                    row.expression,
                    globalFontSize,
                    globalFontWeight,
                    row.color || this.textColor
                );

                const expressionWidth = expressionVisual?.width || 0;
                if (row.affectsDividerWidth !== false) {
                    leftColumnWidth = Math.max(leftColumnWidth, expressionWidth);
                }

                rowLayouts.push({
                    index,
                    row,
                    kind: 'expression',
                    expressionVisual,
                    leftWidth: expressionWidth,
                    rowHeight: Math.max(18, globalFontSize * this.rowHeightMultiplier, expressionVisual?.height || 0)
                });
                return;
            }

            const rowColor = row.color || (row.kind === 'operation' ? this.operationColor : this.equationColor);

            const leftVisual = this._createSideVisual(
                row.left,
                globalFontSize,
                globalFontWeight,
                row.leftColor || rowColor
            );
            const rightVisual = this._createSideVisual(
                row.right,
                globalFontSize,
                globalFontWeight,
                row.rightColor || rowColor
            );

            const centerValue = row.center || (row.kind === 'equation' ? this.centerSymbol : '');
            const centerVisual = this._createCenterVisual(
                centerValue,
                globalFontSize,
                globalFontWeight,
                row.centerColor || this.centerColor || rowColor
            );

            const leftWidth = leftVisual?.width || 0;
            const rightWidth = rightVisual?.width || 0;
            const centerWidth = centerVisual?.width || 0;

            if (row.affectsDividerWidth !== false) {
                leftColumnWidth = Math.max(leftColumnWidth, leftWidth);
                rightColumnWidth = Math.max(rightColumnWidth, rightWidth);
                centerColumnWidth = Math.max(centerColumnWidth, centerWidth);
            }

            const rowHeight = Math.max(
                18,
                globalFontSize * this.rowHeightMultiplier,
                leftVisual?.height || 0,
                rightVisual?.height || 0,
                centerVisual?.height || 0
            );

            rowLayouts.push({
                index,
                row,
                kind: row.kind,
                rowHeight,
                leftVisual,
                rightVisual,
                centerVisual,
                leftWidth,
                rightWidth,
                centerWidth
            });
        });

        if (centerColumnWidth <= 0) {
            centerColumnWidth = measureTextWidth(
                this.centerSymbol,
                this.fontSize,
                this.fontFamily,
                this.fontWeight
            );
        }

        const columnsWidth = leftColumnWidth + this.columnGap + centerColumnWidth + this.columnGap + rightColumnWidth;
        const contentWidth = Math.max(columnsWidth, standaloneTextWidth);
        const columnsShift = (contentWidth - columnsWidth) / 2;

        const leftStartX = this.paddingX + columnsShift;
        const centerStartX = leftStartX + leftColumnWidth + this.columnGap;
        const rightStartX = centerStartX + centerColumnWidth + this.columnGap;

        const lineStartX = this.paddingX;
        const lineEndX = this.paddingX + contentWidth;

        const layoutRows = [];
        const lines = [];

        let cursorY = this.paddingY;

        rowLayouts.forEach((layout) => {
            const { row, index } = layout;
            const rowHeight = layout.rowHeight ?? Math.max(18, this.fontSize * this.rowHeightMultiplier);

            const lineBefore = row.drawLineBefore || this.drawLineBeforeRows.has(index);
            const lineAfter = row.drawLineAfter || this.drawLineAfterRows.has(index);

            if (lineBefore) {
                const strokeWidth = Math.max(1, toFiniteNumber(row.lineStrokeWidth, this.lineStrokeWidth));
                lines.push({
                    y: cursorY + (strokeWidth / 2),
                    color: row.lineColor || this.lineColor,
                    strokeWidth,
                    inset: Math.max(0, toFiniteNumber(row.lineInset, this.lineInset))
                });
                cursorY += strokeWidth + this.lineGap;
            }

            if (layout.kind === 'line') {
                const strokeWidth = Math.max(1, toFiniteNumber(row.lineStrokeWidth, this.lineStrokeWidth));
                lines.push({
                    y: cursorY + (strokeWidth / 2),
                    color: row.lineColor || this.lineColor,
                    strokeWidth,
                    inset: Math.max(0, toFiniteNumber(row.lineInset, this.lineInset))
                });
                cursorY += strokeWidth + this.rowGap;
                return;
            }

            const rowCenterY = cursorY + (rowHeight / 2);
            layoutRows.push({
                layout,
                row,
                index,
                centerY: rowCenterY,
                rowHeight
            });

            cursorY += rowHeight;

            if (lineAfter) {
                const strokeWidth = Math.max(1, toFiniteNumber(row.lineStrokeWidth, this.lineStrokeWidth));
                lines.push({
                    y: cursorY + this.lineGap + (strokeWidth / 2),
                    color: row.lineColor || this.lineColor,
                    strokeWidth,
                    inset: Math.max(0, toFiniteNumber(row.lineInset, this.lineInset))
                });
                cursorY += strokeWidth + this.lineGap;
            }

            cursorY += this.rowGap;
        });

        if (cursorY > this.paddingY) {
            cursorY -= this.rowGap;
        }

        const totalWidth = this.paddingX * 2 + contentWidth;
        const totalHeight = Math.max(this.paddingY * 2 + 20, cursorY + this.paddingY);

        const equationAnchorList = [];
        layoutRows.forEach(({ layout, row, index }) => {
            if (layout.kind !== 'equation') return;

            const leftAlign = this._resolveSideAlignment(row, 'left');
            const rightAlign = this._resolveSideAlignment(row, 'right');

            const leftX = this._resolveAlignedX(
                leftStartX,
                leftColumnWidth,
                layout.leftWidth || 0,
                leftAlign,
                row.leftOffset || 0
            );
            const rightX = this._resolveAlignedX(
                rightStartX,
                rightColumnWidth,
                layout.rightWidth || 0,
                rightAlign,
                row.rightOffset || 0
            );

            equationAnchorList.push({
                rowIndex: index,
                leftTerms: this._buildSideTermAnchors(layout.leftVisual, leftX),
                rightTerms: this._buildSideTermAnchors(layout.rightVisual, rightX)
            });
        });

        let leftDecimalAnchorOffset = null;
        layoutRows.forEach(({ layout, row }) => {
            const leftVisual = layout.leftVisual || layout.expressionVisual;
            if (!leftVisual) return;

            const leftAlign = this._resolveSideAlignment(row, 'left');
            if (leftAlign !== 'decimal') return;

            const decimalInfo = this._getDecimalAlignmentInfo(leftVisual);
            if (!decimalInfo) return;

            leftDecimalAnchorOffset = Math.max(
                leftDecimalAnchorOffset ?? 0,
                decimalInfo.widthBefore
            );
        });

        const leftDecimalAnchorX =
            leftDecimalAnchorOffset === null
                ? null
                : leftStartX + leftDecimalAnchorOffset;

        lines.forEach((line) => {
            const inset = Math.max(0, line.inset || 0);
            const clampedInset = Math.min(inset, Math.max(0, (contentWidth / 2) - 6));

            const divider = new jsvgLine();
            divider.setStrokeColor(line.color);
            divider.setStrokeWidth(line.strokeWidth);
            divider.setEndpoints(
                lineStartX + clampedInset,
                line.y,
                lineEndX - clampedInset,
                line.y
            );
            this.addChild(divider);
        });

        layoutRows.forEach(({ layout, row, index, centerY, rowHeight }) => {
            if (layout.kind === 'text') {
                this._placeVisual(
                    layout.textVisual,
                    this.paddingX + ((contentWidth - (layout.textVisual?.width || 0)) / 2),
                    centerY,
                    rowHeight,
                    'left'
                );
                return;
            }

            if (layout.kind === 'expression') {
                const leftAlign = this._resolveSideAlignment(row, 'left');
                let expressionX = this._resolveAlignedX(
                    leftStartX,
                    leftColumnWidth,
                    layout.leftWidth || 0,
                    leftAlign,
                    row.leftOffset || 0
                );

                if (leftAlign === 'decimal' && leftDecimalAnchorX !== null) {
                    const decimalInfo = this._getDecimalAlignmentInfo(layout.expressionVisual);
                    if (decimalInfo) {
                        expressionX = leftDecimalAnchorX - decimalInfo.widthBefore + (row.leftOffset || 0);
                    } else {
                        expressionX = this._resolveAlignedX(
                            leftStartX,
                            leftColumnWidth,
                            layout.leftWidth || 0,
                            'end',
                            row.leftOffset || 0
                        );
                    }
                }

                this._placeVisual(layout.expressionVisual, expressionX, centerY, rowHeight, 'left');
                return;
            }

            const leftAlign = this._resolveSideAlignment(row, 'left');
            const rightAlign = this._resolveSideAlignment(row, 'right');

            let leftX = this._resolveAlignedX(
                leftStartX,
                leftColumnWidth,
                layout.leftWidth || 0,
                leftAlign,
                row.leftOffset || 0
            );

            let rightX = this._resolveAlignedX(
                rightStartX,
                rightColumnWidth,
                layout.rightWidth || 0,
                rightAlign,
                row.rightOffset || 0
            );

            if (leftAlign === 'decimal' && leftDecimalAnchorX !== null) {
                const decimalInfo = this._getDecimalAlignmentInfo(layout.leftVisual);
                if (decimalInfo) {
                    leftX = leftDecimalAnchorX - decimalInfo.widthBefore + (row.leftOffset || 0);
                } else {
                    leftX = this._resolveAlignedX(
                        leftStartX,
                        leftColumnWidth,
                        layout.leftWidth || 0,
                        'end',
                        row.leftOffset || 0
                    );
                }
            }

            if (layout.kind === 'operation') {
                leftX = this._resolveAnchoredSideX({
                    row,
                    side: 'left',
                    defaultX: leftX,
                    visual: layout.leftVisual,
                    rowIndex: index,
                    equationAnchorList,
                    sideOffset: row.leftOffset || 0
                });

                rightX = this._resolveAnchoredSideX({
                    row,
                    side: 'right',
                    defaultX: rightX,
                    visual: layout.rightVisual,
                    rowIndex: index,
                    equationAnchorList,
                    sideOffset: row.rightOffset || 0
                });
            }

            this._placeVisual(layout.leftVisual, leftX, centerY, rowHeight, 'left');
            this._placeVisual(layout.rightVisual, rightX, centerY, rowHeight, 'left');

            if (layout.centerVisual) {
                const centerX = this._resolveAlignedX(
                    centerStartX,
                    centerColumnWidth,
                    layout.centerWidth || 0,
                    'center',
                    row.centerOffset || 0
                );
                this._placeVisual(layout.centerVisual, centerX, centerY, rowHeight, 'left');
            }
        });

        this.setWidthAndHeight(totalWidth, totalHeight);
        this.width = totalWidth;
        this.height = totalHeight;
    }
}
