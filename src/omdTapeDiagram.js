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

        this.title = "";
        this.values = []; 
        this.labelSet = [];
        this.totalWidth = 300;
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.title !== "undefined" )
            this.title = data.title;

        if ( typeof data.values !== "undefined" )
            this.values = data.values;

        if ( typeof data.labelSet !== "undefined" )
            this.labelSet = data.labelSet;

        if ( typeof data.totalWidth !== "undefined" )
            this.totalWidth = data.totalWidth;

        this.updateLayout();
    }

    setValues( newValues )
    {
        this.values = newValues;
        this.updateLayout();
    }

    updateLayout()
    {
        this.removeAllChildren();

        const leftPadding = this.title ? 80 : 20;
        const rightPadding = 20;
        
        // Add title if present
        if (this.title) {
            const titleText = new jsvgTextBox();
            titleText.setWidthAndHeight(70, 30);
            titleText.setFontFamily("Albert Sans");
            titleText.setFontColor("black");
            titleText.setFontSize(12);
            titleText.setAlignment("left");
            titleText.setText(this.title);
            titleText.setPosition(5, 20);
            this.addChild(titleText);
        }

        // Calculate width for each segment
        const segmentWidth = this.values.length > 0 ? this.totalWidth / this.values.length : 0;
        
        // Track x positions for labels
        var pX = leftPadding;
        var indexPositions = [];
        
        for( var i = 0; i < this.values.length; i++ )
        {
            indexPositions.push(pX);

            const valueData = this.values[i];
            let value = "";
            let showLabel = true;
            let color = omdColor.lightGray;

            // Handle both old format (simple values) and new format (objects)
            if (typeof valueData === "object" && valueData !== null) {
                value = valueData.value || "";
                showLabel = valueData.showLabel !== undefined ? valueData.showLabel : true;
                color = valueData.color || omdColor.lightGray;
            } else {
                value = valueData.toString();
            }

            // Make box
            var box = new jsvgRect();
            box.setWidthAndHeight(segmentWidth, 30);
            box.setCornerRadius(5);
            box.setStrokeColor("white");
            box.setStrokeWidth(1);
            box.setFillColor(color);
            box.setPosition(pX, 0);
            this.addChild(box);

            // Make box text (if showLabel is true)
            if (showLabel) {
                var boxText = new jsvgTextBox();
                boxText.setWidthAndHeight(segmentWidth, 30);
                boxText.setFontFamily("Albert Sans");
                boxText.setFontColor("black");
                boxText.setFontSize(18);
                boxText.setAlignment("center");
                boxText.setVerticalCentering();
                boxText.setText(value);
                boxText.setPosition(pX, 0);
                this.addChild(boxText);
            }

            pX += segmentWidth;
        }

        indexPositions.push(pX);

        // Calculate dimensions
        var contentWidth = pX - leftPadding;
        var contentHeight = 30;
        var topLabelSpace = 0;
        var bottomLabelSpace = 0;

        // Sort labels by span length (number of segments they cover)
        const sortedLabels = this.labelSet.slice().map((labelData, index) => ({
            data: labelData,
            span: (labelData.endIndex || 0) - (labelData.startIndex || 0)
        })).sort((a, b) => a.span - b.span); // Shortest first

        // Track occupied label layers to prevent overlap
        const topLayers = [];
        const bottomLayers = [];

        // Make label text
        for ( const item of sortedLabels )
        {
            const labelData = item.data;
            const T = new omdTapeLabel();
            T.setIndexPositions( indexPositions );
            T.loadFromJSON( labelData );
            
            if ( T.showBelow ) {
                // Find the lowest available layer for this label
                let layer = 0;
                const start = labelData.startIndex || 0;
                const end = labelData.endIndex || 0;
                
                while (layer < bottomLayers.length) {
                    const conflicts = bottomLayers[layer].some(occupied => 
                        !(end <= occupied.start || start >= occupied.end)
                    );
                    if (!conflicts) break;
                    layer++;
                }
                
                if (layer === bottomLayers.length) {
                    bottomLayers.push([]);
                }
                bottomLayers[layer].push({ start, end });
                
                const yPos = 40 + (layer * 35); // Stack labels with 35px spacing
                T.setPosition(0, yPos);
                bottomLabelSpace = Math.max(bottomLabelSpace, yPos + 30);
            } else {
                // Find the highest available layer for this label
                let layer = 0;
                const start = labelData.startIndex || 0;
                const end = labelData.endIndex || 0;
                
                while (layer < topLayers.length) {
                    const conflicts = topLayers[layer].some(occupied => 
                        !(end <= occupied.start || start >= occupied.end)
                    );
                    if (!conflicts) break;
                    layer++;
                }
                
                if (layer === topLayers.length) {
                    topLayers.push([]);
                }
                topLayers[layer].push({ start, end });
                
                const yPos = -10 - (layer * 35); // Stack labels upward with 35px spacing
                T.setPosition(0, yPos);
                topLabelSpace = Math.max(topLabelSpace, (layer + 1) * 35);
            }
            
            this.addChild( T );
        }

        // Set proper dimensions including space for labels above and below
        this.width = leftPadding + contentWidth + rightPadding;
        this.height = topLabelSpace + contentHeight + bottomLabelSpace;
        // Adjust viewBox to include space above for top labels
        this.svgObject.setAttribute("viewBox", `0 ${-topLabelSpace} ${this.width} ${this.height}`);
    }

}