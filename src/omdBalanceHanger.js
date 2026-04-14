
import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgLine, jsvgEllipse, jsvgRect, jsvgTextBox } from "@teachinglab/jsvg";

export class omdBalanceHanger extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdBalanceHanger";

        this.leftValues = [];
        this.rightValues = [];
        this.tilt = "none";
        this.fontFamily = "Albert Sans";
        this.fontSize = 18;

        // Background customization properties
        this.backgroundColor = omdColor.lightGray;
        this.backgroundCornerRadius = 5;
        this.backgroundOpacity = 1.0;
        this.showBackground = true;

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.leftValues != "undefined" )
            this.leftValues = data.leftValues;

        if ( typeof data.rightValues != "undefined" )
            this.rightValues = data.rightValues;

        if ( typeof data.tilt != "undefined" )
            this.tilt = data.tilt;

        if ( typeof data.fontFamily != "undefined" )
            this.fontFamily = data.fontFamily;

        if ( typeof data.fontSize != "undefined" )
            this.fontSize = data.fontSize;

        // Load background customization properties
        if ( typeof data.backgroundColor != "undefined" )
            this.backgroundColor = data.backgroundColor;
        if ( typeof data.backgroundCornerRadius != "undefined" )
            this.backgroundCornerRadius = data.backgroundCornerRadius;
        if ( typeof data.backgroundOpacity != "undefined" )
            this.backgroundOpacity = data.backgroundOpacity;
        if ( typeof data.showBackground != "undefined" )
            this.showBackground = data.showBackground;

        this.updateLayout();
    }

    setLeftAndRightValues( leftValues, rightValues )
    {
        this.leftValues = leftValues;
        this.rightValues = rightValues;
    }

    updateLayout()
    {
        this.removeAllChildren();

        var bX = 50; // Half beam width
        var bY = 0;

        if ( this.tilt == "left" )
            bY = -10;
        if ( this.tilt == "right" )
            bY = 10;

        var slackOnTop = 20;
        var outerPadding = 20;

        const getValueWidth = ( value ) => {
            if ( typeof value == "string" )
                return 20 + value.length*10;
            return 30;
        };

        const leftHalfWidth = this.leftValues.length > 0
            ? Math.max(...this.leftValues.map(getValueWidth)) / 2
            : 15;
        const rightHalfWidth = this.rightValues.length > 0
            ? Math.max(...this.rightValues.map(getValueWidth)) / 2
            : 15;

        const centerX = outerPadding + bX + Math.max(leftHalfWidth, rightHalfWidth);
        const centerY = outerPadding + Math.max(Math.abs(bY), 5);
        const leftTopY = centerY + bY + slackOnTop;
        const rightTopY = centerY - bY + slackOnTop;

        const leftHangDepth = this.leftValues.length > 0
            ? slackOnTop + 40*(this.leftValues.length-1)
            : 0;
        const rightHangDepth = this.rightValues.length > 0
            ? slackOnTop + 40*(this.rightValues.length-1)
            : 0;

        // make beam
        this.line = new jsvgLine();
        this.line.setStrokeColor( "black" );
        this.line.setStrokeWidth( 1 );
        this.line.setEndpoints( centerX-bX, centerY+bY, centerX+bX, centerY-bY );
        this.addChild( this.line );

        // left line
        var leftLine = new jsvgLine();
        leftLine.setStrokeColor( "black" );
        leftLine.setStrokeWidth( 1 );
        leftLine.setEndpoints( centerX-bX, centerY+bY, centerX-bX, centerY+bY + leftHangDepth );
        this.addChild( leftLine );

        // right line
        var right = new jsvgLine();
        right.setStrokeColor( "black" );
        right.setStrokeWidth( 1 );
        right.setEndpoints( centerX+bX, centerY-bY, centerX+bX, centerY-bY + rightHangDepth );
        this.addChild( right );

        // center dot
        var dot = new jsvgEllipse();
        dot.setWidthAndHeight( 10, 10 );
        dot.setFillColor( "black" );
        dot.setPosition( centerX, centerY );
        this.addChild( dot );

        this.makeValueStack( this.leftValues, centerX-bX, leftTopY );
        this.makeValueStack( this.rightValues, centerX+bX, rightTopY );

        const leftStackMinX = this.leftValues.length > 0
            ? (centerX-bX) - leftHalfWidth
            : centerX-bX;
        const rightStackMaxX = this.rightValues.length > 0
            ? (centerX+bX) + rightHalfWidth
            : centerX+bX;
        const leftStackBottomY = this.leftValues.length > 0
            ? leftTopY + 40*(this.leftValues.length-1) + 30
            : centerY+bY;
        const rightStackBottomY = this.rightValues.length > 0
            ? rightTopY + 40*(this.rightValues.length-1) + 30
            : centerY-bY;

        const displayWidth = Math.max(
            220,
            Math.ceil(Math.max(centerX+bX, centerX+5, rightStackMaxX) + outerPadding)
        );
        const displayHeight = Math.max(
            180,
            Math.ceil(
                Math.max(
                    centerY+5,
                    centerY+bY + leftHangDepth,
                    centerY-bY + rightHangDepth,
                    leftStackBottomY,
                    rightStackBottomY
                ) + outerPadding
            )
        );

        this.setWidthAndHeight(displayWidth, displayHeight);
        this.svgObject.setAttribute("viewBox", `0 0 ${displayWidth} ${displayHeight}`);
    }

    makeValueStack( values, xOffset, yOffset )
    {
        // make boxes on each side
        for( var i=0; i<values.length; i++ )
        {
            // get value
            var value = values[i];
            var W = 30;
            if ( typeof value == "string" )
            {
                W = 20 + value.length*10;
            }
            else
            {
                W = 30;
            }

            // make box
            var box;
            if ( typeof value == "string" )
            {
                box = new jsvgEllipse();
                box.setWidthAndHeight( W, 30 );
                box.setPosition( xOffset-W/2 + W/2, yOffset + i*40 + 15);
            }
            else
            {
                box = new jsvgRect();
                box.setWidthAndHeight( W, 30 );
                box.setCornerRadius(5);
                box.setPosition( xOffset-W/2, yOffset + i*40 );
            }
            
            // Apply customizable background properties
            if (this.showBackground) {
                box.setFillColor(this.backgroundColor);
                if (this.backgroundOpacity < 1.0) {
                    box.setOpacity(this.backgroundOpacity);
                }
            } else {
                box.setFillColor("transparent");
            }
            
            // Only apply corner radius to rectangular boxes (jsvgRect), not ellipses
            if (this.backgroundCornerRadius > 0 && box.setCornerRadius) {
                box.setCornerRadius(this.backgroundCornerRadius);
            }
            
            this.addChild( box );

            // make box text
            var boxText = new jsvgTextBox();
            boxText.setWidthAndHeight( W,30 );
            boxText.setText ( this.name );
            boxText.setFontFamily( this.fontFamily );
            boxText.setFontColor( "black" );
            boxText.setFontSize( this.fontSize );
            boxText.setAlignment("center");
            boxText.setVerticalCentering();
            boxText.setText( value );
            boxText.setPosition( xOffset-W/2, yOffset + i*40 );
            this.addChild( boxText );
        }
    }

    setFont( fontFamily, fontSize )
    {
        this.fontFamily = fontFamily;
        if ( fontSize )
            this.fontSize = fontSize;
        this.updateLayout();
    }

}