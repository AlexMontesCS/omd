import { omdColor } from "../omdConstants.js";
import { jsvgGroup, jsvgRect, jsvgTextBox, jsvgLine} from "@teachinglab/jsvg";
import { hasFractionText, makeFractionTextLabel, measureFractionText } from "./omdFractionTypeset.js";

const TAPE_FONT_FAMILY = "Albert Sans";

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

        // make label text; fractions are stacked like every other OMD label
        let labelTop;
        let labelBottom;
        const stacked = makeFractionTextLabel( this.label, { fontSize: this.fontSize, color: this.color, fontFamily: TAPE_FONT_FAMILY } );
        if ( stacked )
        {
            const centerY = this.showBelow ? 6 + stacked.height / 2 : -(6 + stacked.height / 2);
            stacked.setPosition( startX + W / 2, centerY );
            this.addChild( stacked );
            labelTop = centerY - stacked.height / 2;
            labelBottom = centerY + stacked.height / 2;
        }
        else
        {
            var labelText = new jsvgTextBox({ translateMirror: true });
            labelText.setWidthAndHeight( W,labelHeight );
            labelText.setFontFamily( TAPE_FONT_FAMILY );
            labelText.setFontColor( this.color );
            labelText.setFontSize( this.fontSize );
            labelText.setAlignment("center");
            labelText.setText( this.label );
            labelText.setPosition( startX, labelOffsetY );
            this.addChild( labelText );
            labelTop = labelOffsetY;
            labelBottom = labelOffsetY + labelHeight;
        }

        // Calculate dimensions for this label using geometric bounds.
        // This avoids clipping when labels are stacked above the tape.
        var labelWidth = Math.max(W, endX);
        const verticalPadding = 6;
        const contentTop = Math.min(-3, labelTop);
        const contentBottom = Math.max(3, labelBottom);
        const minY = contentTop - verticalPadding;
        const maxY = contentBottom + verticalPadding;
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
        this.partDash = "4 4";
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

        if ( typeof data.partDash !== "undefined" )
            this.partDash = getOptionalText(data.partDash, this.partDash);

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
            let parts = 1;

            // Handle both old format (simple values) and new format (objects)
            if (isRichValue) {
                value = getDisplayText(valueData.value);
                showLabel = valueData.showLabel !== undefined ? valueData.showLabel : true;
                color = getOptionalText(valueData.color, omdColor.lightGray);
                textColor = getOptionalText(valueData.textColor, this.segmentTextColor);
                strokeColor = getOptionalText(valueData.strokeColor, this.segmentStrokeColor);
                strokeWidth = getNonNegativeNumber(valueData.strokeWidth, this.segmentStrokeWidth);
                parts = Math.max(1, getNonNegativeInteger(valueData.parts, 1));
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
                numericValue,
                parts
            });
            totalNumericValue += numericValue;
        }

        // Stacked fractions are taller than a line of text; grow the boxes so
        // "4 1/2" keeps clear space above and below inside its segment.
        const stackedPadding = 18;
        let segmentHeight = this.segmentHeight;
        for (const parsed of parsedValues) {
            if (parsed.showLabel && hasFractionText(parsed.value))
                segmentHeight = Math.max(segmentHeight, measureFractionText(parsed.value, this.labelFontSize).height + stackedPadding);
        }

        const titleOuterPadding = 8;
        const titleGap = 8;
        const titleWidth = this.title ? this._estimateTitleWidth(this.title, this.titleFontSize) : 0;
        const titleBoxHeight = Math.max(24, this.titleFontSize + 10);
        const titleY = Math.max(0, (segmentHeight - titleBoxHeight) / 2);
        const leftPadding = this.title ? titleOuterPadding + titleWidth + titleGap : 20;
        const rightPadding = 20;
        
        // Add title if present
        if (this.title) {
            const titleText = new jsvgTextBox({ translateMirror: true });
            titleText.setWidthAndHeight(titleWidth, titleBoxHeight);
            titleText.setFontFamily(TAPE_FONT_FAMILY);
            titleText.setFontColor(this.titleColor);
            titleText.setFontSize(this.titleFontSize);
            titleText.setAlignment("right");
            titleText.setVerticalCentering();
            titleText.setText(this.title);
            titleText.setPosition(titleOuterPadding, titleY);
            this.addChild(titleText);
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
            box.setWidthAndHeight(segmentWidth, segmentHeight);
            box.setCornerRadius(this.segmentCornerRadius);
            box.setStrokeColor(parsed.strokeColor);
            box.setStrokeWidth(parsed.strokeWidth);
            box.setFillColor(parsed.color);
            box.setPosition(pX, 0);
            this.addChild(box);

            // Equal parts inside one segment are dashed, so the segment's own
            // solid edges still read as the unit.
            for (let k = 1; k < parsed.parts; k++) {
                const partX = pX + k * segmentWidth / parsed.parts;
                const partLine = new jsvgLine();
                partLine.setEndpoints(partX, 0, partX, segmentHeight);
                partLine.setStrokeColor(parsed.strokeColor);
                partLine.setStrokeWidth(Math.max(1, parsed.strokeWidth));
                if (this.partDash !== "none")
                    partLine.svgObject.setAttribute("stroke-dasharray", this.partDash);
                this.addChild(partLine);
            }

            // Make box text (if showLabel is true)
            if (parsed.showLabel) {
                const stacked = makeFractionTextLabel(parsed.value, {
                    fontSize: this.labelFontSize,
                    color: parsed.textColor,
                    fontFamily: TAPE_FONT_FAMILY,
                });
                if (stacked) {
                    stacked.setPosition(pX + segmentWidth / 2, segmentHeight / 2);
                    this.addChild(stacked);
                } else {
                    var boxText = new jsvgTextBox();
                    boxText.setWidthAndHeight(segmentWidth, segmentHeight);
                    boxText.setFontFamily(TAPE_FONT_FAMILY);
                    boxText.setFontColor(parsed.textColor);
                    boxText.setFontSize(this.labelFontSize);
                    boxText.setAlignment("center");
                    boxText.setVerticalCentering();
                    boxText.setText(parsed.value);
                    boxText.setPosition(pX, 0);
                    this.addChild(boxText);
                }
            }

            pX += segmentWidth;
        }

        indexPositions.push(pX);

        // Calculate dimensions
        var contentWidth = pX - leftPadding;
        var contentHeight = segmentHeight;
        let minGlobalY = 0;
        let maxGlobalY = contentHeight;
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

        const getLocalVerticalBounds = (labelObj) => {
            const viewBox = labelObj?.svgObject?.getAttribute("viewBox");
            if (viewBox) {
                const [ , minYRaw, , heightRaw ] = viewBox.split(" ").map(Number);
                if (Number.isFinite(minYRaw) && Number.isFinite(heightRaw)) {
                    return { minY: minYRaw, maxY: minYRaw + heightRaw };
                }
            }
            return {
                minY: 0,
                maxY: Number.isFinite(labelObj?.height) ? labelObj.height : 0
            };
        };

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
                
                const yPos = segmentHeight + 10 + (layer * braceLayerStep);
                T.setPosition(0, yPos);
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
            }

            const localBounds = getLocalVerticalBounds(T);
            minGlobalY = Math.min(minGlobalY, T.ypos + localBounds.minY);
            maxGlobalY = Math.max(maxGlobalY, T.ypos + localBounds.maxY);
            
            this.addChild( T );
        }

        // Normalize to non-negative local coordinates.
        // Some downstream crop/measurement code assumes y >= 0 and can clip negative extents.
        if (minGlobalY < 0) {
            const yShift = -minGlobalY;
            for (const child of this.childList) {
                const currentX = Number.isFinite(child?.xpos) ? child.xpos : 0;
                const currentY = Number.isFinite(child?.ypos) ? child.ypos : 0;
                if (typeof child?.setPosition === 'function') {
                    child.setPosition(currentX, currentY + yShift);
                }
            }
            maxGlobalY += yShift;
            minGlobalY = 0;
        }

        // Set proper dimensions including stacked labels above and below.
        this.width = leftPadding + contentWidth + rightPadding;
        this.height = Math.max(1, maxGlobalY - minGlobalY);

        // Keep viewBox origin at zero after normalization.
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
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
