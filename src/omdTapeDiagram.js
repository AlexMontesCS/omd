import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgRect, jsvgTextBox, jsvgLine} from "@teachinglab/jsvg";

function getDisplayText(value)
{
    if ( value === undefined || value === null ) { return ""; }
    return String(value);
}

function getOptionalText(value, fallback)
{
    if ( value === undefined || value === null ) { return fallback; }

    const text = String(value).trim();
    return text === "" ? fallback : String(value);
}

function getFiniteNumber(value, fallback)
{
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getPositiveNumber(value, fallback)
{
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function getNonNegativeNumber(value, fallback)
{
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
}

function getNonNegativeInteger(value, fallback)
{
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue >= 0
        ? Math.round(parsedValue)
        : fallback;
}

function parseSegmentWeight(value, fallback = 1)
{
    const text = getDisplayText(value).trim();
    if ( text === "" ) { return fallback; }

    // Unit-weight default behavior:
    // - plain positive numbers use their numeric value (e.g. "2" => 2)
    // - variables or non-numeric text use 1 unit (e.g. "x", "2x" => 1)
    const numericValue = Number(text);
    if ( Number.isFinite(numericValue) && numericValue > 0 )
    {
        return numericValue;
    }

    return 1;
}

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
        this.color = "black";
        this.fontSize = 14;
        this.strokeWidth = 1;
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

        const { startIndex, endIndex, label, showBelow, color, fontSize, strokeWidth } = data;

        if (startIndex !== undefined) {
            this.startIndex = getNonNegativeInteger(startIndex, this.startIndex);
            if (this.startIndex >= 0 && this.startIndex <= this.indexPositions.length) {
                this.startPos = this.indexPositions[this.startIndex];
            }
        }

        if (endIndex !== undefined) {
            this.endIndex = getNonNegativeInteger(endIndex, this.endIndex);
            if (this.endIndex >= 0 && this.endIndex <= this.indexPositions.length) {
                this.endPos = this.indexPositions[this.endIndex];
            }
        }

        // startValue/endValue no longer supported; use startIndex/endIndex only

        if (label !== undefined) { this.label = getDisplayText(label); }
        if (showBelow !== undefined) { this.showBelow = showBelow; }
        if (color !== undefined) { this.color = getOptionalText(color, this.color); }
        if (fontSize !== undefined) { this.fontSize = getPositiveNumber(fontSize, this.fontSize); }
        if (strokeWidth !== undefined) { this.strokeWidth = getNonNegativeNumber(strokeWidth, this.strokeWidth); }

        this.updateLayout();
    }

    updateLayout()
    {
        this.removeAllChildren();

        // make line
        var startX = this.startPos;
        var endX = this.endPos;
        var W = endX - startX;
        const labelHeight = Math.max(30, this.fontSize + 12);
        const labelOffsetY = this.showBelow ? 5 : -(this.fontSize + 6);

        this.line = new jsvgLine();
        this.line.setEndpoints( startX, 0, endX, 0 );
        this.line.setStrokeColor( this.color );
        this.line.setStrokeWidth( this.strokeWidth );
        this.addChild( this.line );

        // make ticks
        var tick = new jsvgLine();
        tick.setEndpoints( startX, -3, startX, 3 );
        tick.setStrokeColor( this.color );
        tick.setStrokeWidth( this.strokeWidth );
        this.addChild( tick );

        tick = new jsvgLine();
        tick.setEndpoints( endX, -3, endX, 3 );
        tick.setStrokeColor( this.color );
        tick.setStrokeWidth( this.strokeWidth );
        this.addChild( tick );

         // make label text
        var labelText = new jsvgTextBox({ translateMirror: true });
        labelText.setWidthAndHeight( W,labelHeight );
        labelText.setText ( this.name );
        labelText.setFontFamily( "Albert Sans" );
        labelText.setFontColor( this.color );
        labelText.setFontSize( this.fontSize );
        labelText.setAlignment("center");
        labelText.setText( this.label );
        labelText.setPosition( startX, labelOffsetY );
        this.addChild( labelText );

        // Calculate dimensions for this label
        var labelWidth = Math.max(W, endX);
        const minY = this.showBelow ? -5 : labelOffsetY - 5;
        const maxY = this.showBelow ? labelOffsetY + labelHeight : 5;
        const viewHeight = maxY - minY;
        
        // Set proper bounds and viewBox for the label
        this.setWidthAndHeight( labelWidth, viewHeight );
        this.svgObject.setAttribute("viewBox", `0 ${minY} ${labelWidth} ${viewHeight}`);
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
        this.segmentHeight = 30;
        this.segmentCornerRadius = 5;
        this.segmentStrokeColor = "white";
        this.segmentStrokeWidth = 1;
        this.labelFontSize = 18;
        this.segmentTextColor = "black";
        this.titleFontSize = 12;
        this.titleColor = "black";
        this.braceLabelFontSize = 14;
        this.braceColor = "black";
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( !data || typeof data !== "object" ) { return; }

        if ( typeof data.title !== "undefined" )
            this.title = getDisplayText(data.title);

        if ( typeof data.values !== "undefined" )
            this.values = Array.isArray(data.values) ? data.values : [];

        if ( typeof data.labelSet !== "undefined" )
            this.labelSet = Array.isArray(data.labelSet) ? data.labelSet : [];

        if ( typeof data.totalWidth !== "undefined" )
            this.totalWidth = getPositiveNumber(data.totalWidth, this.totalWidth);

        if ( typeof data.segmentHeight !== "undefined" )
            this.segmentHeight = getPositiveNumber(data.segmentHeight, this.segmentHeight);

        if ( typeof data.segmentCornerRadius !== "undefined" )
            this.segmentCornerRadius = getNonNegativeNumber(data.segmentCornerRadius, this.segmentCornerRadius);

        if ( typeof data.segmentStrokeColor !== "undefined" )
            this.segmentStrokeColor = getOptionalText(data.segmentStrokeColor, this.segmentStrokeColor);

        if ( typeof data.segmentStrokeWidth !== "undefined" )
            this.segmentStrokeWidth = getNonNegativeNumber(data.segmentStrokeWidth, this.segmentStrokeWidth);

        if ( typeof data.labelFontSize !== "undefined" )
            this.labelFontSize = getPositiveNumber(data.labelFontSize, this.labelFontSize);

        if ( typeof data.segmentTextColor !== "undefined" )
            this.segmentTextColor = getOptionalText(data.segmentTextColor, this.segmentTextColor);

        if ( typeof data.titleFontSize !== "undefined" )
            this.titleFontSize = getPositiveNumber(data.titleFontSize, this.titleFontSize);

        if ( typeof data.titleColor !== "undefined" )
            this.titleColor = getOptionalText(data.titleColor, this.titleColor);

        if ( typeof data.braceLabelFontSize !== "undefined" )
            this.braceLabelFontSize = getPositiveNumber(data.braceLabelFontSize, this.braceLabelFontSize);

        if ( typeof data.braceColor !== "undefined" )
            this.braceColor = getOptionalText(data.braceColor, this.braceColor);

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

        const titleOuterPadding = 8;
        const titleGap = 8;
        const titleWidth = this.title ? this._estimateTitleWidth(this.title, this.titleFontSize) : 0;
        const titleBoxHeight = Math.max(24, this.titleFontSize + 10);
        const titleY = Math.max(0, (this.segmentHeight - titleBoxHeight) / 2);
        const leftPadding = this.title ? titleOuterPadding + titleWidth + titleGap : 20;
        const rightPadding = 20;
        
        // Add title if present
        if (this.title) {
            const titleText = new jsvgTextBox({ translateMirror: true });
            titleText.setWidthAndHeight(titleWidth, titleBoxHeight);
            titleText.setFontFamily("Albert Sans");
            titleText.setFontColor(this.titleColor);
            titleText.setFontSize(this.titleFontSize);
            titleText.setAlignment("right");
            titleText.setVerticalCentering();
            titleText.setText(this.title);
            titleText.setPosition(titleOuterPadding, titleY);
            this.addChild(titleText);
        }

        // Parse values and calculate proportional widths
        const parsedValues = [];
        let totalNumericValue = 0;
        
        for (const valueData of this.values) {
            const isRichValue = typeof valueData === "object" && valueData !== null && !Array.isArray(valueData);
            let value = "";
            let showLabel = true;
            let color = omdColor.lightGray;
            let textColor = this.segmentTextColor;
            let strokeColor = this.segmentStrokeColor;
            let strokeWidth = this.segmentStrokeWidth;
            let numericValue = null;

            // Handle both old format (simple values) and new format (objects)
            if (isRichValue) {
                value = getDisplayText(valueData.value);
                showLabel = valueData.showLabel !== undefined ? valueData.showLabel : true;
                color = getOptionalText(valueData.color, omdColor.lightGray);
                textColor = getOptionalText(valueData.textColor, this.segmentTextColor);
                strokeColor = getOptionalText(valueData.strokeColor, this.segmentStrokeColor);
                strokeWidth = getNonNegativeNumber(valueData.strokeWidth, this.segmentStrokeWidth);
                if (valueData.weight !== undefined) {
                    numericValue = getPositiveNumber(valueData.weight, null);
                }
            } else {
                value = getDisplayText(valueData);
            }

            if (!Number.isFinite(numericValue)) {
                numericValue = parseSegmentWeight(value, 1);
            }

            parsedValues.push({
                value,
                showLabel,
                color,
                textColor,
                strokeColor,
                strokeWidth,
                numericValue
            });
            totalNumericValue += numericValue;
        }

        // Calculate width for each segment based on proportion
        var pX = leftPadding;
        var indexPositions = [];
        
        for (const parsed of parsedValues) {
            indexPositions.push(pX);

            // Calculate proportional width
            const proportion = totalNumericValue > 0 ? parsed.numericValue / totalNumericValue : 1 / parsedValues.length;
            const segmentWidth = this.totalWidth * proportion;

            // Make box
            var box = new jsvgRect();
            box.setWidthAndHeight(segmentWidth, this.segmentHeight);
            box.setCornerRadius(this.segmentCornerRadius);
            box.setStrokeColor(parsed.strokeColor);
            box.setStrokeWidth(parsed.strokeWidth);
            box.setFillColor(parsed.color);
            box.setPosition(pX, 0);
            this.addChild(box);

            // Make box text (if showLabel is true)
            if (parsed.showLabel) {
                var boxText = new jsvgTextBox();
                boxText.setWidthAndHeight(segmentWidth, this.segmentHeight);
                boxText.setFontFamily("Albert Sans");
                boxText.setFontColor(parsed.textColor);
                boxText.setFontSize(this.labelFontSize);
                boxText.setAlignment("center");
                boxText.setVerticalCentering();
                boxText.setText(parsed.value);
                boxText.setPosition(pX, 0);
                this.addChild(boxText);
            }

            pX += segmentWidth;
        }

        indexPositions.push(pX);

        // Calculate dimensions
        var contentWidth = pX - leftPadding;
        var contentHeight = this.segmentHeight;
        var topLabelSpace = 0;
        var bottomLabelSpace = 0;
        const braceLayerStep = Math.max(35, this.braceLabelFontSize + 18);

        // Sort labels by span length (number of segments they cover)
        const sortedLabels = this.labelSet.slice().map((labelData, index) => ({
            data: labelData,
            startIndex: getNonNegativeInteger(labelData?.startIndex, 0),
            endIndex: getNonNegativeInteger(labelData?.endIndex, 0),
            span: getNonNegativeInteger(labelData?.endIndex, 0) - getNonNegativeInteger(labelData?.startIndex, 0)
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
            T.loadFromJSON({
                color: this.braceColor,
                fontSize: this.braceLabelFontSize,
                ...labelData
            });
            
            if ( T.showBelow ) {
                // Find the lowest available layer for this label
                let layer = 0;
                const start = item.startIndex;
                const end = item.endIndex;
                
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
                
                const yPos = this.segmentHeight + 10 + (layer * braceLayerStep);
                T.setPosition(0, yPos);
                bottomLabelSpace = Math.max(bottomLabelSpace, yPos + T.height);
            } else {
                // Find the highest available layer for this label
                let layer = 0;
                const start = item.startIndex;
                const end = item.endIndex;
                
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
                
                const yPos = -10 - (layer * braceLayerStep);
                T.setPosition(0, yPos);
                topLabelSpace = Math.max(topLabelSpace, Math.abs(yPos) + T.height);
            }
            
            this.addChild( T );
        }
        // Set proper dimensions including space for labels above and below
        this.width = leftPadding + contentWidth + rightPadding;
        this.height = topLabelSpace + contentHeight + bottomLabelSpace;
        // Adjust viewBox to show everything including title and labels
        const viewBoxY = -topLabelSpace;
        const viewBoxHeight = this.height;
        this.svgObject.setAttribute("viewBox", `0 ${viewBoxY} ${this.width} ${viewBoxHeight}`);
        this.svgObject.setAttribute("viewBox", `0 ${-topLabelSpace} ${this.width} ${this.height}`);
    }

    _estimateTitleWidth( title, fontSize )
    {
        const text = typeof title === "string" ? title : String(title ?? "");
        let width = 0;
        for ( const ch of text )
        {
            if ( ch === " " ) width += fontSize * 0.35;
            else if ( /[A-Z0-9]/.test(ch) ) width += fontSize * 0.68;
            else width += fontSize * 0.58;
        }

        return Math.max(12, Math.ceil(width));
    }

}
