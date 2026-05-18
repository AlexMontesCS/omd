
import { omdColor } from "../config/omdColor.js";
import { jsvgGroup, jsvgEllipse, jsvgArc, jsvgLine, jsvgRect } from "@teachinglab/jsvg";

export class omdRatioChart extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdNumberLine";

        this.valueA = 1;
        this.valueB = 2;
        this.size = 'large';
        this.renderType = 'pie';
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.valueA != "undefined" )
            this.valueA = data.valueA;
        if ( typeof data.numerator != "undefined" )
            this.valueA = data.numerator;

        if ( typeof data.valueB != "undefined" )
            this.valueB = data.valueB;
        if ( typeof data.denominator != "undefined" ) {
            // For fractions: denominator = total tiles, numerator = filled tiles
            // So valueB should be (denominator - numerator) = unfilled tiles
            this.valueA = data.numerator;
            this.valueB = data.denominator - data.numerator;
        }

        if ( typeof data.renderType != "undefined" )
            this.renderType = data.renderType;

        if ( typeof data.size != "undefined" )
            this.size = data.size;

        this.updateLayout();
    }

    setValues( A, B )
    {
        this.valueA = A;
        this.valueB = B;
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

    updateLayout()
    {
        this.removeAllChildren();

        if ( this.renderType == 'pie' )
            this.renderAsPie();
        
        if ( this.renderType == 'dots' || this.renderType == 'dot' || this.renderType == 'tile' )
            this.renderAsDots();

        if ( this.renderType == 'bar' )
            this.renderAsBar();
    }

    renderAsPie()
    {
        var circleSize = 120;
        if ( this.size == "large" )
            circleSize = 120;
        if ( this.size == "medium" )
            circleSize = 80;
        if ( this.size == "small" )
            circleSize = 40;

        // Set dimensions for the pie chart
        this.width = circleSize;
        this.height = circleSize;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        // holder group
        var G = new jsvgGroup();
        G.setPosition( circleSize/2, circleSize/2 );
        this.addChild( G );

        var C = new jsvgEllipse();
        C.setFillColor( omdColor.mediumGray );
        C.setWidthAndHeight( circleSize, circleSize );
        G.addChild( C );

        var p = this.valueA / ( this.valueA + this.valueB );
        var A1 = 0;
        var A2 = 360 * p;

        var pieShape = new jsvgArc();
        pieShape.createPieSlice( circleSize / 2.0, A1, A2 );
        pieShape.setFillColor( "black" );
        G.addChild( pieShape );

        var total = this.valueA + this.valueB;
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
        }
    }

    renderAsDots()
    {
        if ( this.size == 'large' )
        {
            var W = 120;
            var H = 150;
            var dotSize = 15;
            var spacer = W / 4;
        }
        if ( this.size == 'medium' )
        {
            var W = 80;
            var H = 100;
            var dotSize = 12;
            var spacer = W / 4;
        }
        if ( this.size == 'small' )
        {
            var W = 40;
            var H = 50;
            var dotSize = 5;
            var spacer = W / 4;
        }
        
        var R = new jsvgRect();
        R.setWidthAndHeight( W*2,H );       // twice the width
        R.setCornerRadius( dotSize );
        R.setFillColor( omdColor.lightGray );
        this.addChild( R );

        this.width = R.width;
        this.height = R.height;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        // make top dots
        var pX = spacer;
        var pY = spacer;

        for( var i=0; i<this.valueA; i++ )
        {
            var dot = new jsvgEllipse();
            dot.setFillColor( "black" );
            dot.setWidthAndHeight( dotSize,dotSize );
            dot.setPosition( pX, pY );
            this.addChild( dot );
            pX += spacer;
            if ( i != 0 && i%3 == 2 )
            {
                pX = spacer;
                pY += spacer;
            }
        }

        // make  bottom dots
        var pX = spacer*5;
        var pY = spacer;
        for( var i=0; i<this.valueB; i++ )
        {
            var dot = new jsvgEllipse();
            dot.setFillColor( "black" );
            dot.setWidthAndHeight( dotSize,dotSize );
            dot.setPosition( pX, pY );
            this.addChild( dot );
            pX += spacer;
            if ( i != 0 && i%3 == 2 )
            {
                pX = spacer*5;
                pY += spacer;
            }
        }

        // make divider line
        var L = new jsvgLine();
        L.setEndpoints( spacer*4, spacer/2, spacer*4, H-spacer/2 );
        this.addChild( L );
    }

    renderAsBar()
    {
        if ( this.size == 'large' )
        {
            var W = 240;
        }
        if ( this.size == 'medium' )
        {
            var W = 120;
        }
        if ( this.size == 'small' )
        {
            var W = 80;
        }

        var p = this.valueA / ( this.valueA + this.valueB );

        // Set dimensions for the bar chart
        this.width = W;
        this.height = 30;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        var B1 = new jsvgRect();
        B1.setWidthAndHeight( W, 30 );
        // B1.setCornerRadius(5);
        B1.setFillColor( omdColor.mediumGray );
        this.addChild( B1 );

        var B2 = new jsvgRect();
        // B2.setCornerRadius(5);
        B2.setWidthAndHeight( p*W, 30 );
        B2.setFillColor( "black" );
        this.addChild( B2 );

        var total = this.valueA + this.valueB;
        var spacer = W / total;
        for( var i=1; i<total; i++ )
        {
            var pX = i * spacer;
            var L = new jsvgLine();
            L.setStrokeColor("white");
            L.setEndpoints( pX, 0, pX, 30 );
            this.addChild( L );
        }
    }

}

