

import { omdColor } from "./omdColor.js";
import { jsvgLayoutGroup } from "@teachinglab/jsvg";
import { omdTerm } from "./omdTerm.js";
import { omdOperator } from "./omdOperator.js";
import { omdNumber } from "./omdNumber.js";
import { omdVariable } from "./omdVariable.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { parseExpressionString } from "./omdUtils.js";

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

        this.expressionStack = new jsvgLayoutGroup();
        this.expressionStack.setPosition( this.inset, 0 );
        this.expressionStack.setSpacer(-6);
        this.addChild( this.expressionStack );
    }

    loadFromJSON( data )
    {
        // Accept either structured object or a plain expression string
        if ( typeof data === 'string' ) {
            const parsed = parseExpressionString(data);
            if ( parsed ) data = parsed;
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
        this.expressionStack.doHorizontalLayout();

        var W = this.expressionStack.width;
        this.backRect.setWidthAndHeight( W + this.inset*2, 30 );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );

        // Set individual width/height properties and viewBox for API compatibility
        this.width = this.backRect.width;
        this.height = this.backRect.height;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}