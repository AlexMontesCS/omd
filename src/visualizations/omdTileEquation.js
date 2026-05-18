import { omdColor } from "../config/omdColor.js";
import { omdNumberTile } from "./omdNumberTile.js";
import { jsvgGroup, jsvgRect, jsvgTextBox, jsvgTextLine } from "@teachinglab/jsvg";

export class omdTileEquation extends jsvgGroup {
    constructor() {
        super();
        this.type = "omdTileEquation";
        this.left = [];   // generic mode
        this.right = [];
        this.equation = null; // special mode: { x:number, units:number, total:number, xLabel?:string }
        this.tileSize = 28;
        this.tileGap = 6;
        this.rowGap = 10;
        this.equalGap = 24; // gap between left and right
        this.tileRadius = 6;
        this.showLabels = true;
        this.fontFamily = 'Albert Sans';
        this.fontSize = 16;
        // Styles
        this.plusColor = '#79BBFD';
        this.equalsColor = '#FF6B6B';
        this.xPillColor = omdColor.lightGray;
        this.numberTileDefaults = { backgroundColor: omdColor.lightGray, dotColor: 'black' };
        this.updateLayout();
    }

    loadFromJSON(data) {
        if (!data || typeof data !== 'object') return;
        if (Array.isArray(data.left)) this.left = data.left;
        if (Array.isArray(data.right)) this.right = data.right;
        if (typeof data.equation === 'string') {
            this.equation = this._parseEquationString(data.equation);
        } else if (data.equation && typeof data.equation === 'object') {
            this.equation = data.equation;
        } else if (typeof data.equationString === 'string') {
            this.equation = this._parseEquationString(data.equationString);
        }
        if (typeof data.tileSize === 'number') this.tileSize = data.tileSize;
        if (typeof data.tileGap === 'number') this.tileGap = data.tileGap;
        if (typeof data.equalGap === 'number') this.equalGap = data.equalGap;
        if (typeof data.tileRadius === 'number') this.tileRadius = data.tileRadius;
        if (typeof data.showLabels === 'boolean') this.showLabels = data.showLabels;
        if (typeof data.fontFamily === 'string') this.fontFamily = data.fontFamily;
        if (typeof data.fontSize === 'number') this.fontSize = data.fontSize;
        if (typeof data.plusColor === 'string') this.plusColor = data.plusColor;
        if (typeof data.equalsColor === 'string') this.equalsColor = data.equalsColor;
        if (data.xPill && typeof data.xPill.color === 'string') this.xPillColor = data.xPill.color;
        if (typeof data.xPillColor === 'string') this.xPillColor = data.xPillColor;
        if (data.numberTileDefaults && typeof data.numberTileDefaults === 'object') {
            this.numberTileDefaults = {
                backgroundColor: data.numberTileDefaults.backgroundColor ?? this.numberTileDefaults.backgroundColor,
                dotColor: data.numberTileDefaults.dotColor ?? this.numberTileDefaults.dotColor
            };
        }
        this.updateLayout();
    }

    // Parse equations like "5x+4+2=23+12x" or with subtraction like "4x+3=23-x".
    // Returns an object with positive counts arranged on each side by moving negatives across '='.
    _parseEquationString(str) {
        try {
            const raw = String(str || '').replace(/\s+/g, '');
            const parts = raw.split('=');
            if (parts.length !== 2) return null;
            const left = parts[0];
            const right = parts[1];

            const parseSide = (sideStr) => {
                const cleaned = String(sideStr || '').replace(/[\s−–]/g, ch => (ch === ' ' ? '' : '-'));
                const tokenRe = /([+-]?\d*[a-zA-Z])|([+-]?\d+)/g;
                let varLabel = null;
                const tokens = [];
                const matches = cleaned.match(tokenRe) || [];
                matches.forEach(tok => {
                    if (/[a-zA-Z]/.test(tok)) {
                        const m = tok.match(/^([+-]?)(\d*)([a-zA-Z])$/);
                        const sign = (m[1] || '+') === '-' ? '-' : '+';
                        const coef = m[2] ? parseInt(m[2], 10) : 1;
                        varLabel = varLabel || m[3];
                        tokens.push({ kind: 'x', count: Math.max(1, coef), sign });
                    } else {
                        const sign = tok[0] === '-' ? '-' : '+';
                        const val = Math.abs(parseInt(tok, 10));
                        tokens.push({ kind: 'const', value: Math.max(0, val), sign });
                    }
                });
                return { varLabel, tokens };
            };

            const L = parseSide(left);
            const R = parseSide(right);
            const useLabel = L.varLabel || R.varLabel || 'X';

            return {
                leftTokens: L.tokens,
                rightTokens: R.tokens,
                xLabel: useLabel
            };
        } catch (_) {
            return null;
        }
    }

    updateLayout() {
        this.removeAllChildren();

        if (this.equation) {
            const dims = this._renderEquation(this.equation);
            this.setWidthAndHeight(dims.width, dims.height);
            this.svgObject.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);
            return;
        }

        const leftGroup = new jsvgGroup();
        const rightGroup = new jsvgGroup();
        this.addChild(leftGroup);
        this.addChild(rightGroup);

        const leftDims = this._renderSide(leftGroup, this.left);
        const rightDims = this._renderSide(rightGroup, this.right);

        rightGroup.setPosition(leftDims.width + this.equalGap, 0);

        const totalWidth = leftDims.width + this.equalGap + rightDims.width;
        const totalHeight = Math.max(leftDims.height, rightDims.height);
        this.setWidthAndHeight(totalWidth, totalHeight);
        this.svgObject.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    }

    _renderSide(holder, terms) {
        let x = 0;
        let baseY = 0;
        let maxHeight = 0;

        terms.forEach(term => {
            const kind = term?.kind || 'var';
            const color = term?.color || (kind === 'var' ? '#79BBFD' : '#FFA26D');
            const count = Math.max(1, Number(term?.count || 1));

            if (kind === 'text') {
                const t = new jsvgTextBox();
                const padX = 8, padY = 6; 
                t.setWidthAndHeight(this.fontSize * (String(term.value).length * 0.7) + padX * 2, this.fontSize + padY * 2);
                t.setFontFamily(this.fontFamily);
                t.setFontSize(this.fontSize);
                t.setFontColor('black');
                t.setAlignment('center');
                t.setVerticalCentering();
                t.setText(String(term.value));

                const r = new jsvgRect();
                r.setWidthAndHeight(t.width, t.height);
                r.setCornerRadius(Math.min(this.tileRadius, t.height / 2));
                r.setFillColor(omdColor.lightGray);
                const g = new jsvgGroup();
                g.setPosition(x, baseY);
                g.addChild(r);
                g.addChild(t);
                holder.addChild(g);
                x += t.width + this.tileGap;
                maxHeight = Math.max(maxHeight, t.height);
                return;
            }

            const g = new jsvgGroup();
            g.setPosition(x, baseY);
            holder.addChild(g);

            // Arrange as vertical stack if 'stack' true; otherwise single row
            const stack = !!term.stack;
            let localWidth = 0;
            let localHeight = 0;
            for (let i = 0; i < count; i++) {
                const box = new jsvgRect();
                box.setWidthAndHeight(this.tileSize, this.tileSize);
                box.setCornerRadius(Math.min(this.tileRadius, this.tileSize / 2));
                box.setFillColor(color);
                const bx = stack ? 0 : i * (this.tileSize + this.tileGap);
                const by = stack ? i * (this.tileSize + this.rowGap) : 0;
                box.setPosition(bx, by);
                g.addChild(box);
                localWidth = Math.max(localWidth, bx + this.tileSize);
                localHeight = Math.max(localHeight, by + this.tileSize);
            }
            x += localWidth + this.tileGap;
            maxHeight = Math.max(maxHeight, localHeight);
        });

        return { width: x > 0 ? x - this.tileGap : 0, height: maxHeight };
    }

    _renderEquation(eq) {
        // Prefer new token format; fall back to legacy counts if provided
        const hasTokens = Array.isArray(eq.leftTokens) && Array.isArray(eq.rightTokens);
        const leftTokens = hasTokens ? eq.leftTokens : [];
        const rightTokens = hasTokens ? eq.rightTokens : [];
        const legacyLeftX  = Math.max(0, Number(eq.leftX  ?? eq.x  ?? 0));
        const legacyLeftUnits = Array.isArray(eq.leftUnitList) ? eq.leftUnitList : (Number.isFinite(eq.leftUnits ?? eq.units) ? [Math.max(0, Number(eq.leftUnits ?? eq.units))] : []);
        const legacyRightX = Math.max(0, Number(eq.rightX ?? 0));
        const legacyRightUnits = Array.isArray(eq.rightUnitList) ? eq.rightUnitList : (Number.isFinite(eq.rightUnits ?? eq.total) ? [Math.max(0, Number(eq.rightUnits ?? eq.total))] : []);
        const xLabel = String(eq.xLabel || 'X');

        // Pre-compute sizes and local top-center offsets
        // Configure X pill appearance
        const xPillColor = this.xPillColor || omdColor.lightGray;
        // Pill width: ~5x the "X" glyph width (fontSize 0.7 * tileSize; glyph width ~0.62*fontSize)
        const xFont = this.tileSize;
        const xGlyphWidth = 0.62 * xFont;
        const tileW = Math.max(this.tileSize * 1.6, Math.round(5 * xGlyphWidth));
        const tileH = this.tileSize;
        // Pre-create number tiles for measurement (tokens or legacy)
        const countLeftX = hasTokens ? (leftTokens.filter(t => t.kind === 'x').reduce((a, t) => a + t.count, 0)) : legacyLeftX;
        const countRightX = hasTokens ? (rightTokens.filter(t => t.kind === 'x').reduce((a, t) => a + t.count, 0)) : legacyRightX;
        const stackH = countLeftX > 0 ? (countLeftX * (tileH + this.rowGap) - this.rowGap) : 0;
        const unitTilesL = (hasTokens
            ? leftTokens.filter(t => t.kind === 'const').map(tk => { const t = new omdNumberTile(); t.loadFromJSON({ value: tk.value, size: 'medium', backgroundColor: this.numberTileDefaults.backgroundColor, dotColor: this.numberTileDefaults.dotColor }); return t; })
            : legacyLeftUnits.map(v => { const t = new omdNumberTile(); t.loadFromJSON({ value: v, size: 'medium', backgroundColor: this.numberTileDefaults.backgroundColor, dotColor: this.numberTileDefaults.dotColor }); return t; })
        );
        const unitTilesR = (hasTokens
            ? rightTokens.filter(t => t.kind === 'const').map(tk => { const t = new omdNumberTile(); t.loadFromJSON({ value: tk.value, size: 'medium', backgroundColor: this.numberTileDefaults.backgroundColor, dotColor: this.numberTileDefaults.dotColor }); return t; })
            : legacyRightUnits.map(v => { const t = new omdNumberTile(); t.loadFromJSON({ value: v, size: 'medium', backgroundColor: this.numberTileDefaults.backgroundColor, dotColor: this.numberTileDefaults.dotColor }); return t; })
        );

        const xTopLocal = countLeftX > 0 ? (tileH / 2) : 0;
        const unitTopLocalL = unitTilesL.length ? Math.min(...unitTilesL.map(t => t.getTopDotCenterY())) : 0;
        const unitTopLocalR = unitTilesR.length ? Math.min(...unitTilesR.map(t => t.getTopDotCenterY())) : 0;

        // Choose a baseline so all components have non-negative Y positions when aligned
        const baselineY = Math.max(xTopLocal, unitTopLocalL, unitTopLocalR, this.tileSize * 0.6);

        // Compute Y positions such that each component's top anchor equals baselineY
        const yX = countLeftX > 0 ? (baselineY - xTopLocal) : 0;
        const yUnitL = unitTilesL.length ? (baselineY - unitTopLocalL) : 0;
        const yUnitR = unitTilesR.length ? (baselineY - unitTopLocalR) : 0;

        // Compute overall height from bottoms
        const bottoms = [];
        if (countLeftX > 0) bottoms.push(yX + stackH);
        unitTilesL.forEach(t => bottoms.push(yUnitL + t.height));
        unitTilesR.forEach(t => bottoms.push(yUnitR + t.height));
        const maxH = bottoms.length ? Math.max(...bottoms) : this.tileSize * 2;

        let cursorX = 0;

        // Helper to add an operator centered in the upcoming gap
        const addOp = (opChar, x) => {
            const op = new jsvgTextLine();
            op.setText(opChar);
            op.setFontSize(this.tileSize);
            op.setFontColor(this.plusColor);
            op.setAlignment('center');
            op.svgObject.setAttribute('dominant-baseline', 'middle');
            op.setPosition(x + this.equalGap / 2, baselineY);
            this.addChild(op);
        };

        // Render left side tokens (or legacy)
        const renderXStack = () => {
            const g = new jsvgGroup();
            for (let i = 0; i < countLeftX; i++) {
                const y = i * (tileH + this.rowGap);
                const r = new jsvgRect();
                r.setWidthAndHeight(tileW, tileH);
                r.setCornerRadius(tileH / 2);
                r.setFillColor(xPillColor);
                r.setPosition(0, y);
                g.addChild(r);
                const t = new jsvgTextLine();
                t.setText(xLabel);
                t.setFontWeight('bold');
                t.setFontSize(this.tileSize * 0.7);
                t.setFontFamily(this.fontFamily);
                t.setFontColor('black');
                t.setAlignment('center');
                t.svgObject.setAttribute('dominant-baseline', 'middle');
                const textBias = tileH * 0.06;
                t.setPosition(tileW / 2, y + tileH / 2 + textBias);
                g.addChild(t);
            }
            return g;
        };

        const renderSide = (tokens, startX, yUnitTop, countX, isLeft) => {
            let x = startX;
            let hasPrev = false;
            // If legacy, synthesize token sequence: X then each unit
            const seq = hasTokens ? tokens.slice() : [
                ...(countX > 0 ? [{ kind: 'x', count: countX, sign: '+' }] : []),
                ...((isLeft ? legacyLeftUnits : legacyRightUnits).map(v => ({ kind: 'const', value: v, sign: '+' })))
            ];

            seq.forEach(tok => {
                const sign = tok.sign === '-' ? '-' : '+';
                // operator before this token
                if (hasPrev || sign === '-') {
                    addOp(sign === '-' ? '−' : '+', x);
                    x += this.equalGap;
                }
                if (tok.kind === 'x') {
                    const g = renderXStack();
                    g.setPosition(x, baselineY - xTopLocal);
                    this.addChild(g);
                    x += tileW;
                    hasPrev = true;
                } else {
                    // const tile
                    const tile = new omdNumberTile();
                    tile.loadFromJSON({ value: tok.value, size: 'medium', backgroundColor: this.numberTileDefaults.backgroundColor, dotColor: this.numberTileDefaults.dotColor });
                    tile.setPosition(x, yUnitTop);
                    this.addChild(tile);
                    x += tile.width;
                    hasPrev = true;
                }
            });
            return x;
        };

        // Render left side
        if (hasTokens ? (leftTokens.length > 0) : (countLeftX > 0 || unitTilesL.length)) {
            const g = new jsvgGroup();
            g.setPosition(0, 0); // placeholder container (not strictly needed)
            // Ensure left starts with any minus/plus operators between tokens
            cursorX = renderSide(leftTokens, cursorX, yUnitL, countLeftX, true);
        }
        // Reserve equals gap
        cursorX += this.equalGap;

        // Equals sign aligned to baselineY
        const eqWidth = this.tileSize * 1.2;
        const eqTxt = new jsvgTextLine();
        eqTxt.setText('=');
        eqTxt.setFontSize(this.tileSize * 1.1);
        eqTxt.setFontColor(this.equalsColor);
        eqTxt.setAlignment('center');
        eqTxt.svgObject.setAttribute('dominant-baseline', 'middle');
        // Center equals in the equals gap we just reserved
        const eqMid = cursorX - this.equalGap / 2;
        eqTxt.setPosition(eqMid, baselineY);
        this.addChild(eqTxt);

        // Render right side tokens
        cursorX = renderSide(rightTokens, cursorX, yUnitR, countRightX, false);

        return { width: cursorX, height: maxH };
    }
}


