

import { omdColor } from "./omdColor.js";
import { jsvgLayoutGroup } from "@teachinglab/jsvg";
import { omdTerm } from "./omdTerm.js";
import { omdOperator } from "./omdOperator.js";
import { omdNumber } from "./omdNumber.js";
import { omdVariable } from "./omdVariable.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { parseExpressionString } from "./omdUtils.js";
import { getNodeForAST } from "../omd/core/omdUtilities.js";

export class omdExpression extends omdMetaExpression
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdExpression";
        this.termSet = [];
        this.operatorSet = [];
        
        this.inset = 5;
        this.expressionNode = null;

        this.expressionStack = new jsvgLayoutGroup();
        this.expressionStack.setPosition( this.inset, 0 );
        this.expressionStack.setSpacer(-6);
        this.addChild( this.expressionStack );
    }

    _renderWithExpressionNode(expressionString, fontSize) {
        if (typeof math === 'undefined' || typeof math.parse !== 'function') {
            throw new Error('math.js is required to parse expression strings');
        }

        const ast = math.parse(expressionString);
        const NodeType = getNodeForAST(ast);
        const exprNode = new NodeType(ast);

        if (typeof fontSize === 'number' && exprNode.setFontSize) {
            exprNode.setFontSize(fontSize);
        }

        if (exprNode.hideBackgroundByDefault) exprNode.hideBackgroundByDefault();
        if (exprNode.computeDimensions) exprNode.computeDimensions();
        if (exprNode.updateLayout) exprNode.updateLayout();

        if (typeof this.expressionStack.removeAllChildren === 'function') {
            this.expressionStack.removeAllChildren();
        } else {
            this.expressionStack.childList = [];
        }
        this.expressionStack.addChild(exprNode);
        this.expressionStack.setSpacer(0);

        this.expressionNode = exprNode;
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        // Accept either structured object or a plain expression string
        if ( typeof data === 'string' ) {
            try {
                this._renderWithExpressionNode(data, data.fontSize);
                return;
            } catch (e) {
                console.warn('⚠️ omdExpression math.js render failed, falling back to legacy parsing:', e?.message || e);
            }
            const parsed = parseExpressionString(data);
            if ( parsed ) data = parsed;
        }
        // Handle object with 'expression' string property
        else if ( typeof data === 'object' && data.expression && typeof data.expression === 'string' ) {
            try {
                this._renderWithExpressionNode(data.expression, data.fontSize);
                return;
            } catch (e) {
                console.warn('⚠️ omdExpression math.js render failed, falling back to legacy parsing:', e?.message || e);
            }
             const parsed = parseExpressionString(data.expression);
             if ( parsed ) {
                 // Merge parsed data into data object
                 data = { ...data, ...parsed };
             }
        }

        if ( typeof data.termsAndOpers != "undefined" )
        {
            for( var i=0; i<data.termsAndOpers.length; i++ )
            {
                var elem = data.termsAndOpers[i];
                if ( elem.omdType == "term" )
                {
                    var T = new omdTerm();
                    T.loadFromJSON( elem );
                    T.hideBackgroundByDefault();
                    this.termSet.push( T );
                    this.expressionStack.addChild( T );
                }
                else if ( elem.omdType == "variable" )
                {
                    var T = new omdVariable();
                    T.loadFromJSON( elem );
                    T.hideBackgroundByDefault();
                    this.termSet.push( T );
                    this.expressionStack.addChild( T );
                }
                else if ( elem.omdType == "number" )
                {
                    var T = new omdNumber();
                    T.loadFromJSON( elem );
                    T.hideBackgroundByDefault();
                    this.termSet.push( T );
                    this.expressionStack.addChild( T );
                }
                else if ( elem.omdType == "operator" )
                {
                    var P = new omdOperator();
                    P.loadFromJSON( elem );
                    P.hideBackgroundByDefault();
                    this.operatorSet.push( P );
                    this.expressionStack.addChild( P );
                }
                else if ( elem.omdType == "string" )
                {
                    // Fallback for string tokens - treat as term with variable name
                    var T = new omdTerm(1, elem.name, 1);
                    T.hideBackgroundByDefault();
                    this.termSet.push( T );
                    this.expressionStack.addChild( T );
                }
            }
        }

        this.updateLayout();
    }

    addTerm( coefficient, variable='', exponent='1' )
    {
        var T = new omdTerm( coefficient, variable, exponent );
        this.termSet.push( T );
        this.expressionStack.addChild( T );
        this.updateLayout();

        T.hideBackgroundByDefault();
    }

    addOperator( oper )
    {
        var P = new omdOperator(oper);
        this.operatorSet.push( P );
        this.expressionStack.addChild( P );
        this.updateLayout();

        P.hideBackgroundByDefault();
    }

    updateLayout()
    {
        if (this.expressionNode) {
            const node = this.expressionNode;
            if (node.computeDimensions) node.computeDimensions();
            if (node.updateLayout) node.updateLayout();

            this.expressionStack.doHorizontalLayout();
            this.expressionStack.setPosition(this.inset, this.inset);

            const W = node.width || this.expressionStack.width;
            const H = node.height || this.expressionStack.height;

            this.backRect.setWidthAndHeight( W + this.inset*2, H + this.inset*2 );
            this.setWidthAndHeight( this.backRect.width, this.backRect.height );
            this.width = this.backRect.width;
            this.height = this.backRect.height;
            return;
        }

        this.expressionStack.doHorizontalLayout();

        var W = this.expressionStack.width;
        this.backRect.setWidthAndHeight( W + this.inset*2, 30 );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );

        // Set individual width/height properties
        this.width = this.backRect.width;
        this.height = this.backRect.height;
        // Removed viewBox setting as it is not valid for 'g' elements and can cause rendering issues
        // this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}