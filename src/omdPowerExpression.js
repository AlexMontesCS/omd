
import { omdColor } from "./omdColor.js";
import { omdExpression } from "./omdExpression.js"
import { omdMetaExpression } from "./omdMetaExpression.js"
import { omdNumber } from "./omdNumber.js"
import { omdVariable } from "./omdVariable.js"
import { omdTerm } from "./omdTerm.js"
import { jsvgGroup } from "@teachinglab/jsvg";

export class omdPowerExpression extends omdMetaExpression
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdPowerExpression";
        
        this.expression = null;
        this.exponent = null;

        this.expressionHolder = new jsvgGroup();
        this.addChild( this.expressionHolder );

        this.exponentHolder = new jsvgGroup();
        this.addChild( this.exponentHolder );
    }

    // make a power expression of (2x+2)^(3x+3)

    loadFromJSON( data )
    {
        if ( typeof data.baseExpression != "undefined" )
        {
            // console.log("A");
            // console.log( data.baseExpression );
            if ( data.baseExpression.omdType == "expression" )
                this.expression = new omdExpression();
            if ( data.baseExpression.omdType == "number" )
                this.expression = new omdNumber();
            if ( data.baseExpression.omdType == "variable" )
                this.expression = new omdVariable();
            if ( data.baseExpression.omdType == "term" )
                this.expression = new omdTerm();
            this.expression.loadFromJSON(  data.baseExpression  );
            this.expressionHolder.removeAllChildren();
            this.expressionHolder.addChild( this.expression );
        }
        if ( typeof data.exponentExpression != "undefined" )
        {
            // console.log("B");
            // console.log( data.exponentExpression );
            if ( data.exponentExpression.omdType == "expression" )
                this.exponent = new omdExpression();
            if ( data.exponentExpression.omdType == "number" )
                this.exponent = new omdNumber();
            if ( data.exponentExpression.omdType == "variable" )
                this.exponent = new omdVariable();
            if ( data.exponentExpression.omdType == "term" )
                this.exponent = new omdTerm();
            this.exponent.loadFromJSON(  data.exponentExpression  );
            this.exponentHolder.removeAllChildren();
            this.exponentHolder.addChild( this.exponent );
        }

        this.updateLayout();
    }

    setExpressionAndPower( expression, exponent )
    {
        this.expression = expression;
        this.expressionHolder.removeAllChildren();
        this.expressionHolder.addChild( expression );

        this.exponent = exponent;
        this.exponentHolder.removeAllChildren();
        this.exponentHolder.addChild( exponent );

        // this.expression.hideBackgroundByDefault();
        // this.exponent.hideBackgroundByDefault();

        this.updateLayout();
    }

    updateLayout()
    {
        this.expressionHolder.setPosition(0,0);

        this.exponentHolder.setPosition( this.expression.width-10,-15);
        this.exponentHolder.setScale( 0.70 );
    }
}