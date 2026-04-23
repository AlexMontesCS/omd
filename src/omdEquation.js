
import { omdColor } from "./omdColor.js";
import { jsvgLayoutGroup, jsvgGroup } from "@teachinglab/jsvg";
import { omdOperator } from "./omdOperator.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { omdTerm } from "./omdTerm.js";
import { omdExpression } from "./omdExpression.js";
import { omdVariable } from "./omdVariable.js";
import { omdString } from "./omdString.js";
import { omdNumber } from "./omdNumber.js";
import { parseEquationString } from "./omdUtils.js";
import { omdEquationNode } from "../omd/nodes/omdEquationNode.js";
import { math } from "../omd/utils/math.js";

export class omdEquation extends omdMetaExpression
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdPowerExpression";
        
        this.leftExpression = null;
        this.rightExpression = null;
        
        this.centerEquation = true;
        this.inset = 5;

        this.equationStack = new jsvgLayoutGroup();
        this.equationStack.setSpacer(-7);
        this.addChild( this.equationStack );

        this.leftHolder = new jsvgGroup();
        this.equationStack.addChild( this.leftHolder );

        this.equalSign = new omdOperator('=');
        this.equationStack.addChild( this.equalSign );

        this.rightHolder = new jsvgGroup();
        this.equationStack.addChild( this.rightHolder );

        this.equationNode = null;
    }

    // make an equation (x + 2) = (2x - 3)

    loadFromJSON( data )
    {
        // Prefer math.js parsing into omdEquationNode for richer rendering (functions, rationals, roots)
        if (typeof data.equation === 'string' && data.equation.trim()) {
            try {
                this._renderWithEquationNode(data.equation, data.fontSize);
                return;
            } catch (e) {
                console.warn('⚠️ omdEquation math.js render failed, falling back to legacy parsing:', e?.message || e);
            }
        }

        // Helper function to fix operator symbols in termsAndOpers arrays
        function fixOperatorSymbols(expressionData) {
            if (expressionData && expressionData.termsAndOpers && Array.isArray(expressionData.termsAndOpers)) {
                expressionData.termsAndOpers.forEach(item => {
                    if (item && item.omdType === 'operator' && item.symbol) {
                        // Ensure operator symbols are correct
                        if (item.symbol === '−') item.symbol = '-'; // Fix unicode minus
                        if (item.symbol === '＋') item.symbol = '+'; // Fix unicode plus
                    }
                });
            }
            return expressionData;
        }

        // If explicit left/right JSON provided, build them according to their omdType
        if ( typeof data.leftExpression != "undefined" && data.leftExpression )
        {
            let left = data.leftExpression;
            // Fix operator symbols in left expression before processing
            left = fixOperatorSymbols(left);
            
            if ( left.omdType == "expression" ) this.leftExpression = new omdExpression();
            else if ( left.omdType == "number" ) this.leftExpression = new omdNumber();
            else if ( left.omdType == "variable" ) this.leftExpression = new omdVariable();
            else if ( left.omdType == "term" ) this.leftExpression = new omdTerm();
            else if ( left.omdType == "string" || typeof left == 'string' ) this.leftExpression = new omdExpression();

            if (this.leftExpression && typeof this.leftExpression.loadFromJSON === 'function' && left && typeof left === 'object') {
                this.leftExpression.loadFromJSON( left );
            }

            if (this.leftExpression) {
                this.leftHolder.removeAllChildren();
                this.leftHolder.addChild( this.leftExpression );
            }
        }

        if ( typeof data.rightExpression != "undefined" && data.rightExpression )
        {
            let right = data.rightExpression;
            // Fix operator symbols in right expression before processing
            right = fixOperatorSymbols(right);
            
            if ( right.omdType == "expression" ) this.rightExpression = new omdExpression();
            else if ( right.omdType == "number" ) this.rightExpression = new omdNumber();
            else if ( right.omdType == "variable" ) this.rightExpression = new omdVariable();
            else if ( right.omdType == "term" ) this.rightExpression = new omdTerm();
            else if ( right.omdType == "string" || typeof right == 'string' ) this.rightExpression = new omdExpression();

            if (this.rightExpression && typeof this.rightExpression.loadFromJSON === 'function' && right && typeof right === 'object') {
                this.rightExpression.loadFromJSON( right );
            }

            if (this.rightExpression) {
                this.rightHolder.removeAllChildren();
                this.rightHolder.addChild( this.rightExpression );
            }
        }

        // If no structured left/right provided but an `equation` string exists, try to parse it into structured expressions
        if ( (!this.leftExpression || !this.rightExpression) && typeof data.equation === 'string' ) {
            const parsed = parseEquationString(data.equation);
            if ( parsed ) {
                if (!this.leftExpression) this.leftExpression = new omdExpression();
                if (!this.rightExpression) this.rightExpression = new omdExpression();
                // pass parsed structured JSON to expressions
                if (this.leftExpression && typeof this.leftExpression.loadFromJSON === 'function') this.leftExpression.loadFromJSON(parsed.leftExpression);
                if (this.rightExpression && typeof this.rightExpression.loadFromJSON === 'function') this.rightExpression.loadFromJSON(parsed.rightExpression);
                this.leftHolder.removeAllChildren(); this.leftHolder.addChild(this.leftExpression);
                this.rightHolder.removeAllChildren(); this.rightHolder.addChild(this.rightExpression);
            } else {
                // fallback: treat sides as plain strings
                const parts = String(data.equation || '').split('=');
                const leftStr = (parts[0] || '').trim();
                const rightStr = (parts[1] || '').trim();
                if (!this.leftExpression) this.leftExpression = new omdString(leftStr || '');
                if (!this.rightExpression) this.rightExpression = new omdString(rightStr || '');
                if (this.leftExpression && typeof this.leftExpression.loadFromJSON === 'function' && typeof leftStr === 'string') this.leftExpression.loadFromJSON(leftStr);
                if (this.rightExpression && typeof this.rightExpression.loadFromJSON === 'function' && typeof rightStr === 'string') this.rightExpression.loadFromJSON(rightStr);
                this.leftHolder.removeAllChildren(); this.leftHolder.addChild(this.leftExpression);
                this.rightHolder.removeAllChildren(); this.rightHolder.addChild(this.rightExpression);
            }
        }

        // Guarded calls to hide backgrounds only when components exist
        if (this.equalSign && typeof this.equalSign.hideBackgroundByDefault === 'function') this.equalSign.hideBackgroundByDefault();
        if (this.leftExpression && typeof this.leftExpression.hideBackgroundByDefault === 'function') this.leftExpression.hideBackgroundByDefault();
        if (this.rightExpression && typeof this.rightExpression.hideBackgroundByDefault === 'function') this.rightExpression.hideBackgroundByDefault();

        this.centerEquation = false;
        this.updateLayout();
    }

    _renderWithEquationNode(equationString, fontSize) {
        if (typeof math.parse !== 'function') {
            throw new Error('math.js is required to parse equation strings');
        }

        const eqNode = omdEquationNode.fromString(equationString);
        if (typeof fontSize === 'number' && eqNode.setFontSize) {
            eqNode.setFontSize(fontSize);
        }

        if (eqNode.hideBackgroundByDefault) eqNode.hideBackgroundByDefault();
        if (eqNode.computeDimensions) eqNode.computeDimensions();
        if (eqNode.updateLayout) eqNode.updateLayout();

        // Clear the legacy stack and render just the parsed node
        if (typeof this.equationStack.removeAllChildren === 'function') {
            this.equationStack.removeAllChildren();
        } else {
            this.equationStack.childList = [];
        }
        this.equationStack.addChild(eqNode);
        this.equationStack.setSpacer(0);

        this.equationNode = eqNode;
        this.leftExpression = null;
        this.rightExpression = null;

        this.centerEquation = false;
        this.updateLayout();
    }


    setLeftAndRightExpressions( leftExp, rightExp )
    {
        this.leftExpression = leftExp;
        this.leftHolder.removeAllChildren();
        this.leftHolder.addChild( leftExp );

        this.rightExpression = rightExp;
        this.rightHolder.removeAllChildren();
        this.rightHolder.addChild( rightExp );

        this.equalSign.hideBackgroundByDefault();
        this.leftExpression.hideBackgroundByDefault();
        this.rightExpression.hideBackgroundByDefault();

        this.updateLayout();
    }

    updateLayout()
    {
        if (this.equationNode) {
            const node = this.equationNode;
            if (node.computeDimensions) node.computeDimensions();
            if (node.updateLayout) node.updateLayout();

            this.equationStack.doHorizontalLayout();
            this.equationStack.setPosition(this.inset, this.inset);

            const W = node.width || this.equationStack.width;
            const H = node.height || this.equationStack.height;

            this.backRect.setWidthAndHeight( W + this.inset*2, H + this.inset*2 );
            this.setWidthAndHeight( this.backRect.width, this.backRect.height );
            this.width = this.backRect.width;
            this.height = this.backRect.height;
            this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
            return;
        }

        this.leftHolder.setWidthAndHeight( this.leftExpression.width, this.leftExpression.height );
        this.rightHolder.setWidthAndHeight( this.rightExpression.width, this.rightExpression.height );

        // Layout the horizontal equation stack and place it with both horizontal and vertical inset
        this.equationStack.doHorizontalLayout();
        // Position the stack inside the back rectangle using inset for both X and Y
        this.equationStack.setPosition( this.inset, this.inset );

        var W = this.equationStack.width;
        var H = this.equationStack.height;

        // Size backRect to include top/bottom inset so internal content has consistent padding
        this.backRect.setWidthAndHeight( W + this.inset*2, H + this.inset*2 );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );

        // Set individual width/height properties and viewBox for API compatibility
        this.width = this.backRect.width;
        this.height = this.backRect.height;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        if ( this.centerEquation )
        {
            var leftShift = this.leftExpression.width + this.equalSign.width*0.50;
            // shift backRect and equationStack together but keep vertical inset
            this.backRect.setPosition( -1.0 * leftShift + this.inset/2, 0 );
            this.equationStack.setPosition( -1.0 * leftShift + this.inset + this.inset/2, this.inset );
        }
    }

}
