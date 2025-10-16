import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgRect, jsvgTextBox, jsvgLine} from "@teachinglab/jsvg";

export class omdTapeLabel extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.startValue = 1;
        this.endValue = 3;
        this.startIndex = 0;
        this.endIndex = 1;
        this.label = "label";
        this.showBelow = false;
        this.unitWidth = 30;
        this.indexPositions = [];

        this.startPos = 0;
        this.endPos = 0;

        this.updateLayout();
    }
    
    setIndexPositions( xPosArray )
    {
        this.indexPositions = xPosArray
    }

    loadFromJSON( data )
    {
        if (!data || typeof data !== "object") { return; }

        const { startIndex, endIndex, label, showBelow } = data;

        if (startIndex !== undefined) {
            this.startIndex = startIndex;
            if (startIndex >= 0 && startIndex <= this.indexPositions.length) {
                this.startPos = this.indexPositions[startIndex];
            }
        }

        if (endIndex !== undefined) {
            this.endIndex = endIndex;
            if (endIndex >= 0 && endIndex <= this.indexPositions.length) {
                this.endPos = this.indexPositions[endIndex];
            }
        }

        // startValue/endValue no longer supported; use startIndex/endIndex only

        if (label !== undefined) { this.label = label; }
        if (showBelow !== undefined) { this.showBelow = showBelow; }

        this.updateLayout();
    }

    updateLayout()
    {
        this.removeAllChildren();

        // make line
        var startX = this.startPos;
        var endX = this.endPos;
        var W = endX - startX;
        this.line = new jsvgLine();
        this.line.setEndpoints( startX, 0, endX, 0 );
        this.addChild( this.line );

        // make ticks
        var tick = new jsvgLine();
        tick.setEndpoints( startX, -3, startX, 3 );
        this.addChild( tick );

        tick = new jsvgLine();
        tick.setEndpoints( endX, -3, endX, 3 );
        this.addChild( tick );

         // make label text
        var labelText = new jsvgTextBox();
        labelText.setWidthAndHeight( W,30 );
        labelText.setText ( this.name );
        labelText.setFontFamily( "Albert Sans" );
        labelText.setFontColor( "black" );
        labelText.setFontSize( 14 );
        labelText.setAlignment("center");
        labelText.setText( this.label );
        if ( this.showBelow )
            labelText.setPosition( startX, 5 );
        else
            labelText.setPosition( startX, -20 );
        this.addChild( labelText );

        // Calculate dimensions for this label
        var labelWidth = Math.max(W, endX);
        var labelHeight = this.showBelow ? 35 : 30; // Account for text position
        
        // Set proper bounds and viewBox for the label
        this.setWidthAndHeight( labelWidth, labelHeight );
        this.svgObject.setAttribute("viewBox", `0 ${this.showBelow ? -5 : -25} ${labelWidth} ${labelHeight}`);
    }
}

export class omdTapeDiagram extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdTapeDiagram";

        this.values = []; 
        this.showValues = true;
        this.colors = [];
        this.labelSet = [];
        this.unitWidth = 30;
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.values != "undefined" )
            this.values = data.values;

        if ( typeof data.showValues != "undefined" )
            this.showValues = data.showValues;

        if ( typeof data.colors != "undefined" )
            this.colors = data.colors;

        if ( typeof data.labelSet != "undefined" )
            this.labelSet = data.labelSet;

        if ( typeof data.unitWidth != "undefined" )
            this.unitWidth = data.unitWidth;

        this.updateLayout();
    }

    setValues( newValues )
    {
        this.values = newValues;
    }

    updateLayout()
    {
        this.removeAllChildren();

        // console.log( this.values );

        // make box with text
        var pX = 0;
        var indexPositions = [];
        for( var i=0; i<this.values.length; i++ )
        {
            indexPositions.push(pX);

            var value = this.values[i];
            var W = 30;
            if ( typeof value == "string" )
            {
                W = 20 + value.length*10;
            }
            else
            {
                W = value * this.unitWidth;
            }
            

            // make box
            var box = new jsvgRect();
            box.setWidthAndHeight( W, 30 );
            box.setCornerRadius(5);
            box.setStrokeColor( "white" );
            box.setStrokeWidth( 1 );
            
            // Use custom color if available, otherwise default to light gray
            var boxColor = omdColor.lightGray;
            if ( this.colors && this.colors.length > i && this.colors[i] )
            {
                boxColor = this.colors[i];
            }
            box.setFillColor( boxColor );
            
            box.setPosition( pX, 0 );
            this.addChild( box );

            // make box text
            var boxText = new jsvgTextBox();
            boxText.setWidthAndHeight( W,30 );
            boxText.setText ( this.name );
            boxText.setFontFamily( "Albert Sans" );
            boxText.setFontColor( "black" );
            boxText.setFontSize( 18 );
            boxText.setAlignment("center");
            boxText.setVerticalCentering();
            boxText.setText( value.toString() );
            boxText.setPosition( pX, 0 );
            this.addChild( boxText );

            pX += W;
        }

        indexPositions.push(pX);

        // Calculate actual content dimensions
        var contentWidth = pX; // Total width of all boxes
        var contentHeight = 30; // Height of the tape
        var labelHeight = 0;

        // Check if labels extend the height
        for ( var labelData of this.labelSet )
        {
            if ( labelData.showBelow )
                labelHeight = Math.max(labelHeight, 70); // 40 offset + 30 text height
            else
                labelHeight = Math.max(labelHeight, 30); // 20 offset above + 10 buffer
        }
        
        if ( labelHeight > 0 )
            contentHeight += labelHeight;

        // make label text
        for ( var labelData of this.labelSet )
        {
            var T = new omdTapeLabel();
            T.unitWidth = this.unitWidth;
            T.setIndexPositions( indexPositions );
            T.loadFromJSON( labelData );
            if ( T.showBelow )
                T.setPosition( 0, 40 );
            else
                T.setPosition( 0, -10 );
            this.addChild( T )
        }

        // Set proper bounds to hug the content
        this.setWidthAndHeight( contentWidth, contentHeight );
        // Fix the viewBox to match our actual content dimensions (no padding)
        this.svgObject.setAttribute("viewBox", `0 0 ${contentWidth} ${contentHeight}`);
    }

}