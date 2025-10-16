
import { omdColor } from "./omdColor.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { omdExpression } from "./omdExpression.js"
import { omdNumber } from "./omdNumber.js"
import { omdVariable } from "./omdVariable.js"
import { omdTerm } from "./omdTerm.js"

export class omdRationalExpression extends omdMetaExpression
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdPowerExpression";
        
        this.numeratorExpression = null;
        this.denominatorExpression = null;

        this.numeratorHolder = new jsvgGroup();
        this.addChild( this.numeratorHolder );

        this.denominatorHolder = new jsvgGroup();
        this.addChild( this.denominatorHolder );

        this.dividerLine = new jsvgLine();
        this.setStrokeWidth( 2 );
        this.setStrokeColor( "black" );
        this.addChild( this.dividerLine );
    }

    // make a power expression of (2x+2)^(3x+3)

    loadFromJSON( data )
    {
        if ( typeof data.numeratorExpression != "undefined" )
        {
            // console.log("A");
            // console.log( data.baseExpression );
            if ( data.numeratorExpression.omdType == "expression" )
                this.numeratorExpression = new omdExpression();
            if ( data.numeratorExpression.omdType == "number" )
                this.numeratorExpression = new omdNumber();
            if ( data.numeratorExpression.omdType == "variable" )
                this.numeratorExpression = new omdVariable();
            if ( data.numeratorExpression.omdType == "term" )
                this.numeratorExpression = new omdTerm();
            this.numeratorExpression.loadFromJSON(  data.numeratorExpression  );
            this.numeratorHolder.removeAllChildren();
            this.numeratorHolder.addChild( this.numeratorExpression );
        }
        if ( typeof data.denominatorExpression != "undefined" )
        {
            // console.log("B");
            // console.log( data.exponentExpression );
            if ( data.denominatorExpression.omdType == "expression" )
                this.denominatorExpression = new omdExpression();
            if ( data.denominatorExpression.omdType == "number" )
                this.denominatorExpression = new omdNumber();
            if ( data.denominatorExpression.omdType == "variable" )
                this.denominatorExpression = new omdVariable();
            if ( data.denominatorExpression.omdType == "term" )
                this.denominatorExpression = new omdTerm();
            this.denominatorExpression.loadFromJSON(  data.denominatorExpression  );
            this.denominatorHolder.removeAllChildren();
            this.denominatorHolder.addChild( this.denominatorExpression );
        }
    
        this.updateLayout();
    }


    setNumeratorAndDenominator( numerator, denominator )
    {
        this.numeratorExpression = numerator;
        this.numeratorHolder.removeAllChildren();
        this.numeratorHolder.addChild( numerator );

        this.denominatorExpression = denominator;
        this.denominatorHolder.removeAllChildren();
        this.denominatorHolder.addChild( denominator );

        this.numeratorExpression.hideBackgroundByDefault();
        this.denominatorExpression.hideBackgroundByDefault();

        this.updateLayout();
    }

    updateLayout()
    {
        this.numeratorHolder.setPosition(5, 0);
        this.denominatorHolder.setPosition( 5, 30 );

        // get max width
        var W = this.numeratorExpression.width;
        if ( this.denominatorExpression.width  > W )
            W = this.denominatorExpression.width;

        // center numerator
        var pX = W/2 - this.numeratorExpression.width/2 + 5;
        this.numeratorHolder.setPosition( pX, 0 );

        // center denominator
        pX = W/2 - this.denominatorExpression.width/2 + 5;
        this.denominatorHolder.setPosition( pX, 30 );

        // update line width
        this.dividerLine.setEndpoints( 10-5,30, W+5,30 );

        // update back rect
        this.backRect.setWidthAndHeight( W+10, 60 );
        this.setWidthAndHeight( this.backRect.width, this.backRect.height );
    }
}