import { omdColor } from "../omdConstants.js";
import { omdNumberTile } from "./omdNumberTile.js";
import { jsvgGroup, jsvgRect, jsvgTextLine } from "@teachinglab/jsvg";

export class omdTileEquation extends jsvgGroup {
    constructor() {
        super();
        this.type = "omdTileEquation";
        this._leftTokens = [];
        this._rightTokens = [];
        this._xLabel = 'x';
        // Sizing
        this.tileSize = 28;
        this.rowGap = 10;
        this.equalGap = null;
        // Colors
        this.operatorColor = '#79BBFD';
        this.equalsColor = '#FF6B6B';
        this.xPillColor = omdColor.lightGray;
        this.numberTileColor = omdColor.lightGray;
        this.numberTileDotColor = 'black';
        this.fontFamily = 'Albert Sans';
    }

    loadFromJSON(data) {
        if (!data || typeof data !== 'object') return;

        const eqStr = typeof data.equation === 'string' ? data.equation : null;
        const parsed = eqStr
            ? this._parseEquationString(eqStr)
            : this._parseTokenSides(data);
        if (!parsed) return;

        this._leftTokens = parsed.leftTokens;
        this._rightTokens = parsed.rightTokens;
        this._xLabel = parsed.xLabel;

        if (typeof data.tileSize === 'number') this.tileSize = data.tileSize;
        if (typeof data.rowGap === 'number') this.rowGap = data.rowGap;
        if (typeof data.tileGap === 'number') this.rowGap = data.tileGap;
        if (typeof data.equalGap === 'number') this.equalGap = data.equalGap;
        if (typeof data.fontFamily === 'string') this.fontFamily = data.fontFamily;
        if (typeof data.operatorColor === 'string') this.operatorColor = data.operatorColor;
        if (typeof data.equalsColor === 'string') this.equalsColor = data.equalsColor;
        if (typeof data.xPillColor === 'string') this.xPillColor = data.xPillColor;
        if (typeof data.numberTileColor === 'string') this.numberTileColor = data.numberTileColor;
        if (typeof data.numberTileDotColor === 'string') this.numberTileDotColor = data.numberTileDotColor;
        if (typeof data.plusColor === 'string') this.operatorColor = data.plusColor;
        if (data.numberTileDefaults?.backgroundColor) this.numberTileColor = data.numberTileDefaults.backgroundColor;
        if (data.numberTileDefaults?.color) this.numberTileColor = data.numberTileDefaults.color;
        if (data.numberTileDefaults?.dotColor) this.numberTileDotColor = data.numberTileDefaults.dotColor;

        this.updateLayout();
    }

    // Parse "2x + 3 = 11" → { leftTokens, rightTokens, xLabel }
    // Each token: { kind: 'x'|'const', count?: number, value?: number, sign: '+'|'-' }
    _parseEquationString(str) {
        try {
            const raw = String(str || '').replace(/\s+/g, '');
            const parts = raw.split('=');
            if (parts.length !== 2) return null;

            let varLabel = null;

            const parseSide = (sideStr) => {
                const cleaned = sideStr.replace(/[−–]/g, '-').replace(/\*/g, '');
                const tokens = [];
                const re = /([+-]?\d*[a-zA-Z]+)|([+-]?\d+)/g;
                let match;
                while ((match = re.exec(cleaned)) !== null) {
                    const tok = match[0];
                    if (/[a-zA-Z]/.test(tok)) {
                        const m = tok.match(/^([+-]?)(\d*)([a-zA-Z])$/);
                        if (!m) continue;
                        const sign = m[1] === '-' ? '-' : '+';
                        const coef = m[2] ? parseInt(m[2], 10) : 1;
                        varLabel = varLabel || m[3];
                        tokens.push({ kind: 'x', count: Math.max(1, coef), sign });
                    } else {
                        const sign = tok[0] === '-' ? '-' : '+';
                        const val = Math.abs(parseInt(tok, 10));
                        tokens.push({ kind: 'const', value: Math.max(0, val), sign });
                    }
                }
                return tokens;
            };

            return {
                leftTokens: parseSide(parts[0]),
                rightTokens: parseSide(parts[1]),
                xLabel: varLabel || 'x',
            };
        } catch (_) {
            return null;
        }
    }

    _parseTokenSides(data) {
        if (!Array.isArray(data.left) && !Array.isArray(data.right)) return null;

        const normalizeToken = (token) => {
            if (token == null) return null;

            if (typeof token === 'object') {
                const kind = String(token.kind || 'const').toLowerCase();
                const sign = token.sign === '-' || Number(token.value) < 0 ? '-' : '+';

                if (kind === 'x' || kind === 'var') {
                    return {
                        kind: 'x',
                        count: Math.max(1, Math.floor(Number(token.count ?? 1) || 1)),
                        sign,
                        label: token.label || 'x',
                        color: token.color
                    };
                }

                const value = Number(token.value ?? token.count ?? 1);
                return Number.isFinite(value)
                    ? { kind: 'const', value: Math.abs(value), sign, color: token.color }
                    : null;
            }

            const text = String(token).trim().replace(/[−–]/g, '-');
            if (!text) return null;

            const sign = text.startsWith('-') ? '-' : '+';
            const body = text.replace(/^[+-]/, '');
            if (/^[a-zA-Z]$/.test(body)) return { kind: 'x', count: 1, sign, label: body };

            const value = Number(body);
            return Number.isFinite(value) ? { kind: 'const', value: Math.abs(value), sign } : null;
        };

        const leftTokens = Array.isArray(data.left) ? data.left.map(normalizeToken).filter(Boolean) : [];
        const rightTokens = Array.isArray(data.right) ? data.right.map(normalizeToken).filter(Boolean) : [];
        const variableToken = [...leftTokens, ...rightTokens].find((token) => token.kind === 'x' && token.label);

        return {
            leftTokens,
            rightTokens,
            xLabel: variableToken?.label || data.xLabel || 'x',
        };
    }

    // Width of an x-pill tile (wider than square for the label to fit)
    _xTileWidth() {
        const labelFontSize = this.tileSize * 0.7;
        return Math.max(Math.round(this.tileSize * 1.6), Math.round(labelFontSize * 0.62 * 5));
    }

    // Space reserved for each operator symbol (+, −) or the = sign
    _opGap() {
        return Math.round(this.equalGap ?? this.tileSize * 1.1);
    }

    _makeNumberTile(value, token = {}) {
        const t = new omdNumberTile();
        t.loadFromJSON({
            value,
            size: 'medium',
            backgroundColor: token.color || this.numberTileColor,
            dotColor: this.numberTileDotColor,
        });
        return t;
    }

    // Measure a token sequence without adding to the tree.
    // Returns { elements, totalWidth, maxHeight }
    _buildSideLayout(tokens) {
        const elements = [];
        let totalWidth = 0;
        let maxHeight = 0;
        let hasPrev = false;

        for (const tok of tokens) {
            const sign = tok.sign ?? '+';
            if (hasPrev || sign === '-') {
                const char = sign === '-' ? '−' : '+';
                const w = this._opGap();
                elements.push({ type: 'op', char, width: w });
                totalWidth += w;
            }

            if (tok.kind === 'x') {
                const w = this._xTileWidth();
                const h = tok.count * this.tileSize + (tok.count - 1) * this.rowGap;
                elements.push({ type: 'x', count: tok.count, label: tok.label, color: tok.color, width: w, height: h });
                totalWidth += w;
                maxHeight = Math.max(maxHeight, h);
            } else {
                const tile = this._makeNumberTile(tok.value, tok);
                elements.push({ type: 'num', tile, width: tile.width, height: tile.height });
                totalWidth += tile.width;
                maxHeight = Math.max(maxHeight, tile.height);
            }
            hasPrev = true;
        }

        return { elements, totalWidth, maxHeight };
    }

    // Place a pre-built side layout onto the canvas.
    _placeSideLayout(layout, startX, totalHeight) {
        let x = startX;
        for (const el of layout.elements) {
            if (el.type === 'op') {
                this._addSymbol(el.char, x + el.width / 2, totalHeight / 2, this.tileSize * 0.8, this.operatorColor);
                x += el.width;
            } else if (el.type === 'x') {
                const y = (totalHeight - el.height) / 2;
                this._renderXStack(el.count, x, y, el.label, el.color);
                x += el.width;
            } else {
                el.tile.setPosition(x, (totalHeight - el.height) / 2);
                this.addChild(el.tile);
                x += el.width;
            }
        }
        return x;
    }

    _addSymbol(text, cx, cy, fontSize, color) {
        const t = new jsvgTextLine();
        t.setText(text);
        t.setFontSize(fontSize);
        t.setFontFamily(this.fontFamily);
        t.setFontColor(color);
        t.setAlignment('center');
        t.svgObject.setAttribute('dominant-baseline', 'middle');
        t.setPosition(cx, cy);
        this.addChild(t);
    }

    _renderXStack(count, x, y, label = this._xLabel, color = this.xPillColor) {
        const w = this._xTileWidth();
        const h = this.tileSize;
        const g = new jsvgGroup();
        g.setPosition(x, y);
        for (let i = 0; i < count; i++) {
            const tileY = i * (h + this.rowGap);
            const r = new jsvgRect();
            r.setWidthAndHeight(w, h);
            r.setCornerRadius(h / 2);
            r.setFillColor(color || this.xPillColor);
            r.setPosition(0, tileY);
            g.addChild(r);

            const t = new jsvgTextLine();
            t.setText(label || this._xLabel);
            t.setFontWeight('bold');
            t.setFontSize(this.tileSize * 0.7);
            t.setFontFamily(this.fontFamily);
            t.setFontColor('black');
            t.setAlignment('center');
            t.svgObject.setAttribute('dominant-baseline', 'middle');
            t.setPosition(w / 2, tileY + h / 2);
            g.addChild(t);
        }
        this.addChild(g);
    }

    updateLayout() {
        this.removeAllChildren();
        if (!this._leftTokens.length && !this._rightTokens.length) return;

        const leftLayout = this._buildSideLayout(this._leftTokens);
        const rightLayout = this._buildSideLayout(this._rightTokens);
        const totalHeight = Math.max(leftLayout.maxHeight, rightLayout.maxHeight, this.tileSize);
        const eqGap = this._opGap();

        let x = 0;

        x = this._placeSideLayout(leftLayout, x, totalHeight);

        // Equals sign centered in its gap
        this._addSymbol('=', x + eqGap / 2, totalHeight / 2, this.tileSize * 1.0, this.equalsColor);
        x += eqGap;

        x = this._placeSideLayout(rightLayout, x, totalHeight);

        this.setWidthAndHeight(x, totalHeight);
        this.svgObject.setAttribute('viewBox', `0 0 ${x} ${totalHeight}`);
    }
}
