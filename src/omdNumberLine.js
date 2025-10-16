
import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgRect, jsvgLine, jsvgTextBox, jsvgEllipse } from "@teachinglab/jsvg";

export class omdNumberLine extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdNumberLine";

        this.min = 0;
        this.max = 10;
        this.dotValues = []; 
        this.label = "";  
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.min != "undefined" )
            this.min = data.min;

        if ( typeof data.max != "undefined" )
            this.max = data.max;

        if ( typeof data.dotValues != "undefined" )
            this.dotValues = data.dotValues;

        if ( typeof data.label != "undefined" )
            this.label = data.label;

        this.updateLayout();
    }

    setMinAndMax( min, max )
    {
        this.min = min;
        this.max = max;
    }

    addNumberDot( V )
    {
        this.dotValues.push( V );
    }

    updateLayout()
    {
        this.removeAllChildren();

        // Set proper dimensions and viewBox for positioning
        this.width = 360;
        this.height = 70;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        // make line
        this.line = new jsvgRect();
        // this.line.setStrokeColor( "black" );
        // this.line.setStrokeWidth( 1 );
        // this.line.setEndpoints( 0,0, 300, 0 );
        this.line.setWidthAndHeight(320,5);
        this.line.setPosition( 20, 22.5 );
        this.line.setFillColor( omdColor.mediumGray );
        this.line.setCornerRadius( 2.5 );
        this.addChild( this.line );

        // make ticks with text
        for( var i=this.min; i<=this.max; i++ )
        {
            var N = i - this.min;
            var dX = 300 / (this.max - this.min);

            var pX = 30 + N*dX;

            var tick = new jsvgLine();
            tick.setStrokeColor( "black" );
            tick.setStrokeWidth( 1 );
            tick.setEndpoints( pX, 20, pX, 30 );
            this.addChild( tick );

            var tickText = new jsvgTextBox();
            tickText.setWidthAndHeight( 30,30 );
            tickText.setText ( this.name );
            tickText.setFontFamily( "Albert Sans" );
            tickText.setFontColor( "black" );
            tickText.setFontSize( 10 );
            tickText.setAlignment("center");
            tickText.setText( i.toString() );
            tickText.setPosition( pX-15, 32 );
            this.addChild( tickText );
        }

        // make dots
        for( var i=0; i<this.dotValues.length; i++ )
        {
            var V = this.dotValues[i];

            var N = V - this.min;
            var dX = 300 / (this.max - this.min);
            var pX = 30 + N*dX;

            var dot = new jsvgEllipse();
            dot.setFillColor( "black" );
            dot.setStrokeWidth( 0 );
            dot.setWidthAndHeight( 9,9 );
            dot.setPosition( pX, 25 );
            this.addChild( dot );
        }
    }

}