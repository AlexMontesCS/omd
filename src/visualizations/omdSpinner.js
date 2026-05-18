import { omdColor } from "../config/omdColor.js";
import { jsvgGroup, jsvgEllipse, jsvgPath, jsvgLine, jsvgTextBox } from "@teachinglab/jsvg";

export class omdSpinner extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdNumberLine";
        this.size = "medium";

        this.divisions = 5;
        this.arrowPosition = 1;
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.divisions != "undefined" )
            this.divisions = data.divisions;

        if ( typeof data.arrowPosition != "undefined" )
            this.arrowPosition = data.arrowPosition;

        if ( typeof data.size != "undefined" )
            this.size = data.size;
    
        this.updateLayout();
    }

    setDivisions( D )
    {
        this.divisions = D;
        this.updateLayout();
    }

    setRenderType( R )
    {
        this.renderType = R;
        this.updateLayout();
    }

    setSize( S )
    {
        this.size = S;
        this.updateLayout();
    }

    setArrowPosition( index )
    {
        this.arrowPosition = index;
        this.updateLayout();
    }

    updateLayout()
    {
        this.removeAllChildren();

        // holder group
        var G = new jsvgGroup();
        this.addChild( G );
       
        var circleSize = 120;
        var textSize = 14;
        if ( this.size == "large" )
        {
            circleSize = 120;
            textSize = 14;
        }
        if ( this.size == "medium" )
        {
            circleSize = 80;
            textSize = 12;
        }
        if ( this.size == "small" )
        {
            circleSize = 40;
            textSize = 10;
        }

        // make circle
        var C = new jsvgEllipse();
        C.setFillColor( omdColor.mediumGray );
        C.setWidthAndHeight( circleSize, circleSize );
        G.addChild( C );

        // offset circle position
        G.setPosition( circleSize/2, circleSize/2 );

        // make division lines
        var total = this.divisions;
        var dA = Math.PI*2.0 / total;
        for( var i=0; i<total; i++ )
        {
            var A = i * dA - Math.PI/2.0;
            var pX = Math.cos(A) * circleSize/2;
            var pY = Math.sin(A) * circleSize/2;
            var L = new jsvgLine();
            L.setStrokeColor("white");
            L.setEndpoints( 0, 0, pX, pY );
            G.addChild( L );

            // make tick numbers
            var A = (i+0.5) * dA - Math.PI/2.0;
            var pX = Math.cos(A) * circleSize*0.40;
            var pY = Math.sin(A) * circleSize*0.40;
            var tickText = new jsvgTextBox();
            tickText.setWidthAndHeight( 30,30 );
            tickText.setText ( (i+1).toString() );
            tickText.setFontFamily( "Albert Sans" );
            tickText.setFontColor( "black" );
            tickText.setFontSize( textSize );
            tickText.setAlignment("center");
            tickText.setPosition( pX-15, pY-7 );
            G.addChild( tickText );
        }

        

        // make arrow
        var D = circleSize*0.40;
        this.arrow = new jsvgPath();
        this.arrow.addPoint( 0,0 );
        this.arrow.addPoint( D*0.8,D*0.1 );
        this.arrow.addPoint( D,0 );
        this.arrow.addPoint( D*0.8,D*-0.1 );
        this.arrow.addPoint( 0,0 );
        this.arrow.updatePath();
        this.arrow.setFillColor( "black" );
        this.arrow.setOpacity( 0.80 );
        G.addChild( this.arrow );

        // set arrow position
        var A = -90 + 360.0 / this.divisions * (this.arrowPosition-0.5);
        this.arrow.setRotation( A );

        // Set dimensions and viewBox for API compatibility
        this.width = circleSize;
        this.height = circleSize;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        // var L = new jsvgLine();
        // var lineLength = circleSize*0.4;
        // L.setEndpoints( 0,0, lineLength,0 );
        // L.setStrokeColor("black");
        // L.setStrokeWidth(2);
        // L.setRotation( -22.5 );
    }
}
