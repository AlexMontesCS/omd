
import { omdColor } from "../omdConstants.js";
import { jsvgGroup, jsvgPath, jsvgLine, jsvgTextLine, jsvgEllipse } from "@teachinglab/jsvg";

const DEFAULT_SHAPE_PADDING = 10;
const LABEL_SHAPE_PADDING = 38;

function normalizeLabelValue(value) {
    if (value === null || typeof value === "undefined") return "";
    return String(value);
}

function labelHasText(value) {
    return normalizeLabelValue(value).trim().length > 0;
}

function createShapeTextLabel(text, x, y, options = {}) {
    const label = new jsvgTextLine();
    label.setAlignment(options.align || "center");
    label.setFontFamily("Albert Sans");
    label.setFontColor(options.color || "black");
    label.setFontSize(typeof options.fontSize === "number" ? options.fontSize : 12);
    label.setPosition(x, y);
    label.svgObject.setAttribute("dominant-baseline", "middle");

    if (typeof options.rotation === "number" && Number.isFinite(options.rotation)) {
        label.setRotation(options.rotation);
    }

    label.setText(normalizeLabelValue(text));
    return label;
}

function getShapePadding(showLabels) {
    return showLabels ? LABEL_SHAPE_PADDING : DEFAULT_SHAPE_PADDING;
}

function estimateLabelWidth(text, fontSize = 12) {
    const normalized = normalizeLabelValue(text);
    if (!normalized) return 0;
    // Approximate average latin glyph width at ~0.58em for compact layout sizing.
    return normalized.length * fontSize * 0.58;
}

function estimateLabelHeight(fontSize = 12) {
    return fontSize * 1.2;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180.0;
}

function getEstimatedLabelBox(text, x, y, options = {}) {
    const fontSize = typeof options.fontSize === "number" ? options.fontSize : 12;
    const padding = typeof options.padding === "number" ? options.padding : 4;
    const width = estimateLabelWidth(text, fontSize) + padding * 2;
    const height = estimateLabelHeight(fontSize) + padding * 2;
    const align = options.align || "center";

    let left = x - width * 0.5;
    if ( align === "left" ) left = x - padding;
    if ( align === "right" ) left = x - width + padding;

    return {
        left,
        right: left + width,
        top: y - height * 0.5,
        bottom: y + height * 0.5,
        width,
        height
    };
}

function boxesOverlap(a, b, gap = 0) {
    return !(
        a.right + gap < b.left ||
        a.left - gap > b.right ||
        a.bottom + gap < b.top ||
        a.top - gap > b.bottom
    );
}

function pointInsideBox(point, box) {
    return point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;
}

function orientation(a, b, c) {
    return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function segmentsIntersect(a, b, c, d) {
    const o1 = orientation(a, b, c);
    const o2 = orientation(a, b, d);
    const o3 = orientation(c, d, a);
    const o4 = orientation(c, d, b);

    return o1 * o2 < 0 && o3 * o4 < 0;
}

function segmentIntersectsBox(segment, box) {
    const a = { x: segment.x1, y: segment.y1 };
    const b = { x: segment.x2, y: segment.y2 };

    if ( pointInsideBox(a, box) || pointInsideBox(b, box) ) return true;

    const topLeft = { x: box.left, y: box.top };
    const topRight = { x: box.right, y: box.top };
    const bottomRight = { x: box.right, y: box.bottom };
    const bottomLeft = { x: box.left, y: box.bottom };

    return (
        segmentsIntersect(a, b, topLeft, topRight) ||
        segmentsIntersect(a, b, topRight, bottomRight) ||
        segmentsIntersect(a, b, bottomRight, bottomLeft) ||
        segmentsIntersect(a, b, bottomLeft, topLeft)
    );
}

function expandBox(box, amount) {
    return {
        left: box.left - amount,
        right: box.right + amount,
        top: box.top - amount,
        bottom: box.bottom + amount,
        width: box.width + amount * 2,
        height: box.height + amount * 2
    };
}

function getClosedPolygonVertices(shapePath) {
    const points = Array.isArray(shapePath?.points) ? shapePath.points : [];
    if (points.length <= 1) return points.slice();

    const first = points[0];
    const last = points[points.length - 1];
    const isClosed = first.x === last.x && first.y === last.y;
    return isClosed ? points.slice(0, -1) : points.slice();
}

function getPolygonCentroid(points) {
    if (!points.length) return { x: 0, y: 0 };

    let sumX = 0;
    let sumY = 0;
    for (const point of points) {
        sumX += point.x;
        sumY += point.y;
    }

    return {
        x: sumX / points.length,
        y: sumY / points.length
    };
}

export class omdRightTriangle extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdRightTriangle";

        this.horizontalLeg = 5;
        this.verticalLeg = 10;
        this.angleA = 0;
        this.angleB = 0;
        this.hypotenuse = 0;
        this.unitScale = 10;

        this.showLabels = false;

        this.shapePath = new jsvgPath();
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

        this.labelsHolder = new jsvgGroup();
        this.addChild( this.labelsHolder );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.horizontalLeg != "undefined" )
             this.horizontalLeg = data.horizontalLeg;

        if ( typeof data.verticalLeg != "undefined" )
            this.verticalLeg = data.verticalLeg;

        if ( typeof data.angleA != "undefined" )
            this.angleA = data.angleA;

        if ( typeof data.angleB != "undefined" )
            this.angleB = data.angleB;

        if ( typeof data.hypotenuse != "undefined" )
            this.hypotenuse = data.hypotenuse;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        // calculate leg lengths
        if ( this.angleA && this.hypotenuse )
        {
            var A = Math.PI * this.angleA / 180.0;
            this.horizontalLeg = Math.cos(A) * this.hypotenuse;
            this.verticalLeg = Math.sin(A) * this.hypotenuse;
        }

        this.updateLayout();
    }

    updateLayout()
    {
        // Center the triangle within the viewBox
        const padding = getShapePadding(this.showLabels);
        const offsetX = padding;
        const offsetY = this.unitScale * this.verticalLeg + padding;

        this.shapePath.clearPoints();
        this.shapePath.addPoint(offsetX, offsetY);
        this.shapePath.addPoint(offsetX + this.unitScale * this.horizontalLeg, offsetY);
        this.shapePath.addPoint(offsetX + this.unitScale * this.horizontalLeg, offsetY - this.unitScale * this.verticalLeg);
        this.shapePath.addPoint(offsetX, offsetY);

        this.shapePath.updatePath();

        if ( this.showLabels )
        {
            this.labelsHolder.removeAllChildren();
            var L = new omdShapeLabelSet();
            var A = this.horizontalLeg.toString();
            var B = this.verticalLeg.toString();
            var C = "";
            L.initializeWithShapePath( this.shapePath, [A,B,C] );
            this.labelsHolder.addChild( L );
        }

        // Set viewBox to center the shape
        this.width = this.unitScale * this.horizontalLeg + padding * 2;
        this.height = this.unitScale * this.verticalLeg + padding * 2;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}



export class omdIsoscelesTriangle extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdIsoscelesTriangle";

        this.triangleBase = 5;
        this.triangleHeight = 10;
        this.unitScale = 10;

        this.showLabels = false;

        this.shapePath = new jsvgPath();
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

        this.labelsHolder = new jsvgGroup();
        this.addChild( this.labelsHolder );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.base != "undefined" )
            this.triangleBase = data.base;

        if ( typeof data.height != "undefined" )
            this.triangleHeight = data.height;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        this.updateLayout();
    }

    updateLayout()
    {
        this.shapePath.clearPoints();

        const baseWidth = this.unitScale * this.triangleBase;
        const triangleHeight = this.unitScale * this.triangleHeight;
        const padding = getShapePadding(this.showLabels);
        const offsetX = padding;
        const offsetY = triangleHeight + padding;

        this.shapePath.addPoint( offsetX, offsetY );
        this.shapePath.addPoint( offsetX + baseWidth, offsetY );
        this.shapePath.addPoint( offsetX + baseWidth * 0.5, offsetY - triangleHeight );
        this.shapePath.addPoint( offsetX, offsetY );

        this.shapePath.updatePath();

        if ( this.showLabels )
        {
            this.labelsHolder.removeAllChildren();
            var L = new omdShapeLabelSet();
            L.initializeWithShapePath( this.shapePath );
            this.labelsHolder.addChild( L );
        }

        // Set dimensions and viewBox for API compatibility
        this.width = this.unitScale * this.triangleBase + padding * 2;
        this.height = this.unitScale * this.triangleHeight + padding * 2;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}

export class omdRectangle extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdRectangle";

        this.rectWidth = 10;
        this.rectHeight = 10;
        this.unitScale = 10;

        this.showLabels = false;
        this.labelMode = "edge";
        this.sideLabels = null;
        this.centerLabel = "";
        this.outsideTopLabel = "";
        this.outsideBottomLabel = "";
        this.outsideLeftLabel = "";
        this.outsideRightLabel = "";
        this.labelFontSize = 12;

        this.shapePath = new jsvgPath();
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

        this.labelsHolder = new jsvgGroup();
        this.addChild( this.labelsHolder );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.width != "undefined" )
            this.rectWidth = data.width;

        if ( typeof data.height != "undefined" )
            this.rectHeight = data.height;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        if ( typeof data.labelMode != "undefined" )
            this.labelMode = data.labelMode;

        if ( typeof data.sideLabels != "undefined" && data.sideLabels && typeof data.sideLabels === "object" )
            this.sideLabels = { ...data.sideLabels };

        if ( typeof data.centerLabel != "undefined" )
            this.centerLabel = data.centerLabel;

        if ( typeof data.outsideTopLabel != "undefined" )
            this.outsideTopLabel = data.outsideTopLabel;

        if ( typeof data.outsideBottomLabel != "undefined" )
            this.outsideBottomLabel = data.outsideBottomLabel;

        if ( typeof data.outsideLeftLabel != "undefined" )
            this.outsideLeftLabel = data.outsideLeftLabel;

        if ( typeof data.outsideRightLabel != "undefined" )
            this.outsideRightLabel = data.outsideRightLabel;

        if ( typeof data.labelFontSize === "number" )
            this.labelFontSize = data.labelFontSize;

        this.updateLayout();
    }

    getResolvedSideLabels()
    {
        const defaults = { top: "", right: "", bottom: "", left: "" };
        if ( this.showLabels )
        {
            defaults.top = normalizeLabelValue(this.rectWidth);
            defaults.right = normalizeLabelValue(this.rectHeight);
            if ( this.labelMode === "side" )
            {
                defaults.bottom = normalizeLabelValue(this.rectWidth);
                defaults.left = normalizeLabelValue(this.rectHeight);
            }
        }

        if ( !this.sideLabels || typeof this.sideLabels !== "object" )
            return defaults;

        const sideLabels = this.sideLabels;
        return {
            top: typeof sideLabels.top !== "undefined" ? normalizeLabelValue(sideLabels.top) : defaults.top,
            right: typeof sideLabels.right !== "undefined" ? normalizeLabelValue(sideLabels.right) : defaults.right,
            bottom: typeof sideLabels.bottom !== "undefined" ? normalizeLabelValue(sideLabels.bottom) : defaults.bottom,
            left: typeof sideLabels.left !== "undefined" ? normalizeLabelValue(sideLabels.left) : defaults.left,
        };
    }

    hasAnyLabels()
    {
        const sideLabels = this.getResolvedSideLabels();
        return (
            labelHasText(sideLabels.top) ||
            labelHasText(sideLabels.right) ||
            labelHasText(sideLabels.bottom) ||
            labelHasText(sideLabels.left) ||
            labelHasText(this.centerLabel) ||
            labelHasText(this.outsideTopLabel) ||
            labelHasText(this.outsideBottomLabel) ||
            labelHasText(this.outsideLeftLabel) ||
            labelHasText(this.outsideRightLabel)
        );
    }

    updateLayout()
    {
        // Compute compact per-side padding so the exported container hugs visible content.
        const sideLabels = this.getResolvedSideLabels();
        const hasAnyLabels = this.hasAnyLabels();
        const fontSize = this.labelFontSize;
        const strokeWidth = 2;
        const basePadding = Math.max(2, strokeWidth * 0.5 + 1);

        const edgeOffset = 16;
        const outerOffset = 36;

        const widthPx = this.unitScale * this.rectWidth;
        const heightPx = this.unitScale * this.rectHeight;

        let leftPad = basePadding;
        let rightPad = basePadding;
        let topPad = basePadding;
        let bottomPad = basePadding;

        if ( hasAnyLabels )
        {
            const topHeight = estimateLabelHeight(fontSize);
            const rightHeight = estimateLabelHeight(fontSize);
            const bottomHeight = estimateLabelHeight(fontSize);
            const leftHeight = estimateLabelHeight(fontSize);

            const topWidth = estimateLabelWidth(sideLabels.top, fontSize);
            const rightWidth = estimateLabelWidth(sideLabels.right, fontSize);
            const bottomWidth = estimateLabelWidth(sideLabels.bottom, fontSize);
            const leftWidth = estimateLabelWidth(sideLabels.left, fontSize);

            const centerWidth = estimateLabelWidth(this.centerLabel, fontSize);
            const centerHeight = estimateLabelHeight(fontSize);

            const outTopHeight = estimateLabelHeight(fontSize);
            const outRightHeight = estimateLabelHeight(fontSize);
            const outBottomHeight = estimateLabelHeight(fontSize);
            const outLeftHeight = estimateLabelHeight(fontSize);

            const outTopWidth = estimateLabelWidth(this.outsideTopLabel, fontSize);
            const outRightWidth = estimateLabelWidth(this.outsideRightLabel, fontSize);
            const outBottomWidth = estimateLabelWidth(this.outsideBottomLabel, fontSize);
            const outLeftWidth = estimateLabelWidth(this.outsideLeftLabel, fontSize);

            if ( labelHasText(sideLabels.top) )
            {
                topPad = Math.max(topPad, edgeOffset + topHeight * 0.5 + basePadding);
                leftPad = Math.max(leftPad, topWidth * 0.5 + basePadding);
                rightPad = Math.max(rightPad, topWidth * 0.5 + basePadding);
            }

            if ( labelHasText(sideLabels.right) )
            {
                rightPad = Math.max(rightPad, edgeOffset + rightWidth * 0.5 + basePadding);
                topPad = Math.max(topPad, rightHeight * 0.5 + basePadding);
                bottomPad = Math.max(bottomPad, rightHeight * 0.5 + basePadding);
            }

            if ( labelHasText(sideLabels.bottom) )
            {
                bottomPad = Math.max(bottomPad, edgeOffset + bottomHeight * 0.5 + basePadding);
                leftPad = Math.max(leftPad, bottomWidth * 0.5 + basePadding);
                rightPad = Math.max(rightPad, bottomWidth * 0.5 + basePadding);
            }

            if ( labelHasText(sideLabels.left) )
            {
                leftPad = Math.max(leftPad, edgeOffset + leftWidth * 0.5 + basePadding);
                topPad = Math.max(topPad, leftHeight * 0.5 + basePadding);
                bottomPad = Math.max(bottomPad, leftHeight * 0.5 + basePadding);
            }

            if ( labelHasText(this.centerLabel) )
            {
                leftPad = Math.max(leftPad, centerWidth * 0.5 + basePadding);
                rightPad = Math.max(rightPad, centerWidth * 0.5 + basePadding);
                topPad = Math.max(topPad, centerHeight * 0.5 + basePadding);
                bottomPad = Math.max(bottomPad, centerHeight * 0.5 + basePadding);
            }

            if ( labelHasText(this.outsideTopLabel) )
            {
                topPad = Math.max(topPad, outerOffset + outTopHeight * 0.5 + basePadding);
                leftPad = Math.max(leftPad, outTopWidth * 0.5 + basePadding);
                rightPad = Math.max(rightPad, outTopWidth * 0.5 + basePadding);
            }

            if ( labelHasText(this.outsideBottomLabel) )
            {
                bottomPad = Math.max(bottomPad, outerOffset + outBottomHeight * 0.5 + basePadding);
                leftPad = Math.max(leftPad, outBottomWidth * 0.5 + basePadding);
                rightPad = Math.max(rightPad, outBottomWidth * 0.5 + basePadding);
            }

            if ( labelHasText(this.outsideLeftLabel) )
            {
                leftPad = Math.max(leftPad, outerOffset + outLeftWidth * 0.5 + basePadding);
                topPad = Math.max(topPad, outLeftHeight * 0.5 + basePadding);
                bottomPad = Math.max(bottomPad, outLeftHeight * 0.5 + basePadding);
            }

            if ( labelHasText(this.outsideRightLabel) )
            {
                rightPad = Math.max(rightPad, outerOffset + outRightWidth * 0.5 + basePadding);
                topPad = Math.max(topPad, outRightHeight * 0.5 + basePadding);
                bottomPad = Math.max(bottomPad, outRightHeight * 0.5 + basePadding);
            }
        }

        const offsetX = leftPad;
        const offsetY = topPad + heightPx;

        this.shapePath.clearPoints();
        this.shapePath.addPoint(offsetX, offsetY);
        this.shapePath.addPoint(offsetX + widthPx, offsetY);
        this.shapePath.addPoint(offsetX + widthPx, offsetY - heightPx);
        this.shapePath.addPoint(offsetX, offsetY - heightPx);
        this.shapePath.addPoint(offsetX, offsetY);

        this.shapePath.updatePath();

        this.labelsHolder.removeAllChildren();
        if ( hasAnyLabels )
        {
            const leftX = offsetX;
            const rightX = offsetX + widthPx;
            const topY = offsetY - heightPx;
            const bottomY = offsetY;
            const centerX = offsetX + widthPx * 0.5;
            const centerY = offsetY - heightPx * 0.5;
            if ( labelHasText(sideLabels.top) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    sideLabels.top,
                    centerX,
                    topY - edgeOffset,
                    { fontSize }
                ));
            }

            if ( labelHasText(sideLabels.right) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    sideLabels.right,
                    rightX + edgeOffset,
                    centerY,
                    { fontSize }
                ));
            }

            if ( labelHasText(sideLabels.bottom) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    sideLabels.bottom,
                    centerX,
                    bottomY + edgeOffset,
                    { fontSize }
                ));
            }

            if ( labelHasText(sideLabels.left) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    sideLabels.left,
                    leftX - edgeOffset,
                    centerY,
                    { fontSize }
                ));
            }

            if ( labelHasText(this.centerLabel) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    this.centerLabel,
                    centerX,
                    centerY,
                    { fontSize }
                ));
            }

            if ( labelHasText(this.outsideTopLabel) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    this.outsideTopLabel,
                    centerX,
                    topY - outerOffset,
                    { fontSize }
                ));
            }

            if ( labelHasText(this.outsideBottomLabel) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    this.outsideBottomLabel,
                    centerX,
                    bottomY + outerOffset,
                    { fontSize }
                ));
            }

            if ( labelHasText(this.outsideLeftLabel) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    this.outsideLeftLabel,
                    leftX - outerOffset,
                    centerY,
                    { fontSize }
                ));
            }

            if ( labelHasText(this.outsideRightLabel) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    this.outsideRightLabel,
                    rightX + outerOffset,
                    centerY,
                    { fontSize }
                ));
            }
        }

        this.width = widthPx + leftPad + rightPad;
        this.height = heightPx + topPad + bottomPad;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}

export class omdRectangularPrism extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdRectangularPrism";

        this.prismLength = 5;
        this.prismWidth = 3;
        this.prismHeight = 4;
        this.unitScale = 18;

        this.showLabels = false;
        this.sideLabels = null;
        this.lengthLabel = "";
        this.widthLabel = "";
        this.heightLabel = "";
        this.insideLabel = "";
        this.outsideTopLabel = "";
        this.showHiddenEdges = true;
        this.labelFontSize = 12;

        // Unit-cube rendering (Grade 5 volume work).
        this.showUnitCubes = false;
        this.highlightLayer = -1;          // 1-based layer index counted from the bottom
        this.layerColors = {               // per-layer face colors; falls back to defaults
            top: "#e6edf7",
            side: "#d5dfef",
            front: omdColor.lightGray,
        };
        this.cubeGapRatio = 0.08;          // gap between cubes as a fraction of a unit
        
        this._cubeStrokeColor = "#3B5578";

        this.topFacePath = new jsvgPath();
        this.topFacePath.setStrokeColor("black");
        this.topFacePath.setStrokeWidth(2);
        this.topFacePath.setFillColor("#e6edf7");
        this.addChild(this.topFacePath);

        this.sideFacePath = new jsvgPath();
        this.sideFacePath.setStrokeColor("black");
        this.sideFacePath.setStrokeWidth(2);
        this.sideFacePath.setFillColor("#d5dfef");
        this.addChild(this.sideFacePath);

        this.frontFacePath = new jsvgPath();
        this.frontFacePath.setStrokeColor("black");
        this.frontFacePath.setStrokeWidth(2);
        this.frontFacePath.setFillColor(omdColor.lightGray);
        this.addChild(this.frontFacePath);

        // Cubes paint after the faces but BEFORE hidden edges and labels so
        // dimension lines, dashed edges, and text always sit on top.
        this.cubeHolder = new jsvgGroup();
        this.addChild(this.cubeHolder);

        this.hiddenEdgeHolder = new jsvgGroup();
        this.addChild(this.hiddenEdgeHolder);

        this.labelsHolder = new jsvgGroup();
        this.addChild(this.labelsHolder);

        this.updateLayout();
    }

    loadFromJSON(data)
    {
        if ( typeof data.length != "undefined" )
            this.prismLength = data.length;

        if ( typeof data.width != "undefined" )
            this.prismWidth = data.width;

        if ( typeof data.height != "undefined" )
            this.prismHeight = data.height;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        if ( typeof data.sideLabels != "undefined" && data.sideLabels && typeof data.sideLabels === "object" )
            this.sideLabels = { ...data.sideLabels };

        if ( typeof data.lengthLabel != "undefined" )
            this.lengthLabel = data.lengthLabel;

        if ( typeof data.widthLabel != "undefined" )
            this.widthLabel = data.widthLabel;

        if ( typeof data.heightLabel != "undefined" )
            this.heightLabel = data.heightLabel;

        if ( typeof data.insideLabel != "undefined" )
            this.insideLabel = data.insideLabel;

        if ( typeof data.outsideTopLabel != "undefined" )
            this.outsideTopLabel = data.outsideTopLabel;

        if ( typeof data.showHiddenEdges != "undefined" )
            this.showHiddenEdges = data.showHiddenEdges !== false;

        if ( typeof data.labelFontSize === "number" )
            this.labelFontSize = data.labelFontSize;

        if ( typeof data.showUnitCubes != "undefined" )
            this.showUnitCubes = data.showUnitCubes !== false;

        if ( typeof data.highlightLayer != "undefined" && data.highlightLayer !== null )
            this.highlightLayer = Math.floor(Number(data.highlightLayer));

        if ( data.layerColors && typeof data.layerColors === "object" )
            this.layerColors = { ...this.layerColors, ...data.layerColors };

        if ( typeof data.cubeGapRatio == "number" )
            this.cubeGapRatio = Math.min(0.4, Math.max(0, data.cubeGapRatio));

        this.updateLayout();
    }

    getResolvedPrismLabels()
    {
        const defaults = {
            length: "",
            width: "",
            height: "",
        };

        if ( this.showLabels )
        {
            defaults.length = normalizeLabelValue(this.prismLength);
            defaults.width = normalizeLabelValue(this.prismWidth);
            defaults.height = normalizeLabelValue(this.prismHeight);
        }

        const sideLabels = (this.sideLabels && typeof this.sideLabels === "object") ? this.sideLabels : {};

        const resolved = {
            length: defaults.length,
            width: defaults.width,
            height: defaults.height,
        };

        if ( typeof sideLabels.length != "undefined" ) resolved.length = normalizeLabelValue(sideLabels.length);
        if ( typeof sideLabels.l != "undefined" ) resolved.length = normalizeLabelValue(sideLabels.l);

        if ( typeof sideLabels.width != "undefined" ) resolved.width = normalizeLabelValue(sideLabels.width);
        if ( typeof sideLabels.w != "undefined" ) resolved.width = normalizeLabelValue(sideLabels.w);

        if ( typeof sideLabels.height != "undefined" ) resolved.height = normalizeLabelValue(sideLabels.height);
        if ( typeof sideLabels.h != "undefined" ) resolved.height = normalizeLabelValue(sideLabels.h);

        if ( labelHasText(this.lengthLabel) ) resolved.length = normalizeLabelValue(this.lengthLabel);
        if ( labelHasText(this.widthLabel) ) resolved.width = normalizeLabelValue(this.widthLabel);
        if ( labelHasText(this.heightLabel) ) resolved.height = normalizeLabelValue(this.heightLabel);

        return resolved;
    }

    updateLayout()
    {
        const prismLength = Math.max(1, Number(this.prismLength) || 1);
        const prismWidth = Math.max(1, Number(this.prismWidth) || 1);
        const prismHeight = Math.max(1, Number(this.prismHeight) || 1);
        const scale = Math.max(1, Number(this.unitScale) || 1);

        const lengthPx = prismLength * scale;
        const widthPx = prismWidth * scale;
        const heightPx = prismHeight * scale;

        const depthDx = widthPx * 0.8;
        const depthDy = widthPx * 0.5;

        const labels = this.getResolvedPrismLabels();
        const hasLabels = (
            labelHasText(labels.length) ||
            labelHasText(labels.width) ||
            labelHasText(labels.height) ||
            labelHasText(this.insideLabel) ||
            labelHasText(this.outsideTopLabel)
        );

        const basePadding = 16;
        const fontSize = this.labelFontSize;
        const textHeight = estimateLabelHeight(fontSize);
        const endpointMarkerHalfLength = Math.max(4, textHeight * 0.35);
        const shapeBarGap = Math.max(4, textHeight * 0.32);
        const dimensionOffset = shapeBarGap + endpointMarkerHalfLength;
        const labelGap = Math.max(9, textHeight * 0.55);

        const lengthTextWidth = estimateLabelWidth(labels.length, fontSize);
        const widthTextWidth = estimateLabelWidth(labels.width, fontSize);
        const heightTextWidth = estimateLabelWidth(labels.height, fontSize);
        const insideTextWidth = estimateLabelWidth(this.insideLabel, fontSize);
        const topTextWidth = estimateLabelWidth(this.outsideTopLabel, fontSize);

        let leftPad = basePadding;
        let rightPad = basePadding;
        let topPad = basePadding;
        let bottomPad = basePadding;

        if ( hasLabels )
        {
            if ( labelHasText(labels.height) )
            {
                leftPad = Math.max(leftPad, dimensionOffset + heightTextWidth + labelGap + 8);
            }

            if ( labelHasText(labels.width) )
            {
                rightPad = Math.max(rightPad, dimensionOffset + widthTextWidth * 0.5 + labelGap + 10);
                bottomPad = Math.max(bottomPad, dimensionOffset * 0.75 + textHeight + 8);
            }

            if ( labelHasText(labels.length) )
            {
                bottomPad = Math.max(bottomPad, dimensionOffset + textHeight + 12);
                leftPad = Math.max(leftPad, Math.max(0, lengthTextWidth * 0.5 - lengthPx * 0.5) + basePadding);
                rightPad = Math.max(rightPad, Math.max(0, lengthTextWidth * 0.5 - lengthPx * 0.5) + basePadding);
            }

            if ( labelHasText(this.insideLabel) )
            {
                const volumeStack = labelHasText(labels.length) ? (textHeight + 10) : 0;
                bottomPad = Math.max(bottomPad, dimensionOffset + volumeStack + textHeight + 12);
                leftPad = Math.max(leftPad, Math.max(0, insideTextWidth * 0.5 - lengthPx * 0.5) + basePadding);
                rightPad = Math.max(rightPad, Math.max(0, insideTextWidth * 0.5 - lengthPx * 0.5) + basePadding);
            }

            if ( labelHasText(this.outsideTopLabel) )
            {
                topPad = Math.max(topPad, labelGap + textHeight * 2 + 10);
                leftPad = Math.max(leftPad, Math.max(0, topTextWidth * 0.5 - lengthPx * 0.5) + basePadding);
                rightPad = Math.max(rightPad, Math.max(0, topTextWidth * 0.5 - lengthPx * 0.5) + basePadding);
            }
        }

        const frontTL = { x: leftPad, y: topPad + depthDy };
        const frontTR = { x: frontTL.x + lengthPx, y: frontTL.y };
        const frontBR = { x: frontTR.x, y: frontTL.y + heightPx };
        const frontBL = { x: frontTL.x, y: frontTL.y + heightPx };

        const backTL = { x: frontTL.x + depthDx, y: frontTL.y - depthDy };
        const backTR = { x: frontTR.x + depthDx, y: frontTR.y - depthDy };
        const backBR = { x: frontBR.x + depthDx, y: frontBR.y - depthDy };
        const backBL = { x: frontBL.x + depthDx, y: frontBL.y - depthDy };

        this.topFacePath.clearPoints();
        this.topFacePath.addPoint(frontTL.x, frontTL.y);
        this.topFacePath.addPoint(frontTR.x, frontTR.y);
        this.topFacePath.addPoint(backTR.x, backTR.y);
        this.topFacePath.addPoint(backTL.x, backTL.y);
        this.topFacePath.addPoint(frontTL.x, frontTL.y);
        this.topFacePath.updatePath();

        this.sideFacePath.clearPoints();
        this.sideFacePath.addPoint(frontTR.x, frontTR.y);
        this.sideFacePath.addPoint(frontBR.x, frontBR.y);
        this.sideFacePath.addPoint(backBR.x, backBR.y);
        this.sideFacePath.addPoint(backTR.x, backTR.y);
        this.sideFacePath.addPoint(frontTR.x, frontTR.y);
        this.sideFacePath.updatePath();

        this.frontFacePath.clearPoints();
        this.frontFacePath.addPoint(frontTL.x, frontTL.y);
        this.frontFacePath.addPoint(frontTR.x, frontTR.y);
        this.frontFacePath.addPoint(frontBR.x, frontBR.y);
        this.frontFacePath.addPoint(frontBL.x, frontBL.y);
        this.frontFacePath.addPoint(frontTL.x, frontTL.y);
        this.frontFacePath.updatePath();

        this._drawUnitCubeLayers(frontTL, frontTR, frontBR, frontBL, backTL, backTR, backBR, backBL, prismLength, prismWidth, prismHeight);

        this.hiddenEdgeHolder.removeAllChildren();
        // Unit cubes already describe the solid — dashed rear edges would read
        // as lines cutting through the cubes.
        if ( this.showHiddenEdges && !this.showUnitCubes )
        {
            const hiddenEdges = [
                [backTL, backBL],
                [backBL, backBR],
                [frontBL, backBL],
            ];

            for ( const [p0, p1] of hiddenEdges )
            {
                const hiddenLine = new jsvgLine();
                hiddenLine.setStrokeColor("black");
                hiddenLine.setStrokeWidth(1);
                hiddenLine.setEndpoints(p0.x, p0.y, p1.x, p1.y);
                hiddenLine.svgObject.setAttribute("stroke-dasharray", "3 2");
                this.hiddenEdgeHolder.addChild(hiddenLine);
            }
        }

        this.labelsHolder.removeAllChildren();
        if ( hasLabels )
        {
            const addLine = (x0, y0, x1, y1) => {
                const line = new jsvgLine();
                line.setStrokeColor("black");
                line.setStrokeWidth(1);
                line.setEndpoints(x0, y0, x1, y1);
                this.labelsHolder.addChild(line);
            };

            const addTextbookLabel = (text, x, y, options = {}) => {
                this.labelsHolder.addChild(createShapeTextLabel(text, x, y, { fontSize, ...options }));
            };

            const addEndpointMarker = (point, nx, ny) => {
                addLine(
                    point.x - nx * endpointMarkerHalfLength,
                    point.y - ny * endpointMarkerHalfLength,
                    point.x + nx * endpointMarkerHalfLength,
                    point.y + ny * endpointMarkerHalfLength
                );
            };

            const addDimensionLineWithGap = (p0, p1, text, options = {}) => {
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const len = Math.hypot(dx, dy) || 1;
                const ux = dx / len;
                const uy = dy / len;
                const labelWidth = Math.max(fontSize * 1.6, estimateLabelWidth(text, fontSize) + fontSize * 0.8);
                const halfGap = Math.min(Math.max(0, len * 0.5 - 2), labelWidth * 0.5);
                const midX = (p0.x + p1.x) * 0.5;
                const midY = (p0.y + p1.y) * 0.5;

                if ( halfGap > 1 )
                {
                    addLine(p0.x, p0.y, midX - ux * halfGap, midY - uy * halfGap);
                    addLine(midX + ux * halfGap, midY + uy * halfGap, p1.x, p1.y);
                }
                else
                {
                    addLine(p0.x, p0.y, p1.x, p1.y);
                }

                let rotation = Math.atan2(dy, dx) * 180 / Math.PI;
                if ( rotation > 90 || rotation < -90 ) rotation += 180;
                addTextbookLabel(text, midX, midY, options.rotate === false ? {} : { rotation });
            };

            if ( labelHasText(labels.length) )
            {
                const y = frontBL.y + dimensionOffset;
                addEndpointMarker({ x: frontBL.x, y }, 0, 1);
                addEndpointMarker({ x: frontBR.x, y }, 0, 1);
                addDimensionLineWithGap(
                    { x: frontBL.x, y },
                    { x: frontBR.x, y },
                    labels.length,
                    { rotate: false }
                );
            }

            if ( labelHasText(labels.height) )
            {
                const x = frontTL.x - dimensionOffset;
                addEndpointMarker({ x, y: frontTL.y }, 1, 0);
                addEndpointMarker({ x, y: frontBL.y }, 1, 0);
                addDimensionLineWithGap(
                    { x, y: frontTL.y },
                    { x, y: frontBL.y },
                    labels.height,
                    { rotate: false }
                );
            }

            if ( labelHasText(labels.width) )
            {
                const dx = backBR.x - frontBR.x;
                const dy = backBR.y - frontBR.y;
                const len = Math.hypot(dx, dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                const offsetX = nx * dimensionOffset;
                const offsetY = ny * dimensionOffset;
                const dim0 = { x: frontBR.x + offsetX, y: frontBR.y + offsetY };
                const dim1 = { x: backBR.x + offsetX, y: backBR.y + offsetY };
                addEndpointMarker(dim0, nx, ny);
                addEndpointMarker(dim1, nx, ny);
                addDimensionLineWithGap(dim0, dim1, labels.width);
            }

            if ( labelHasText(this.insideLabel) )
            {
                const lengthDimY = frontBL.y + dimensionOffset;
                const volumeY = labelHasText(labels.length)
                    ? lengthDimY + textHeight + 10
                    : frontBL.y + dimensionOffset + labelGap;
                addTextbookLabel(this.insideLabel, (frontBL.x + frontBR.x) * 0.5, volumeY);
            }

            if ( labelHasText(this.outsideTopLabel) )
            {
                addTextbookLabel(this.outsideTopLabel, (backTL.x + backTR.x) * 0.5, backTL.y - labelGap - textHeight);
            }
        }

        this.width = Math.max(frontBR.x, backBR.x) + rightPad;
        this.height = Math.max(frontBR.y, backBR.y) + bottomPad;
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    }
    /**
     * Draws the prism as stacked unit cubes (Grade 5 volume work). Layers are
     * counted bottom-up; `highlightLayer` recolors one layer so a lesson can
     * walk through "volume = layers × cubes-per-layer" step by step.
     */
    _drawUnitCubeLayers(frontTL, frontTR, frontBR, frontBL, backTL, backTR, backBR, backBL, prismLength, prismWidth, prismHeight)
    {
        this.cubeHolder.removeAllChildren();

        if ( !this.showUnitCubes )
            return;

        const scale = Math.max(1, Number(this.unitScale) || 1);
        // Cube grid is pinned to the prism faces: pitch equals one unit exactly,
        // the gap becomes an inset inside each unit cell so stacks never drift.
        const inset = Math.min(0.4, Math.max(0, this.cubeGapRatio)) * scale * 0.5;
        const cell = scale;
        // Recession unit vector along the depth axis (matches the face geometry).
        const dx = (backTL.x - frontTL.x) / prismWidth;
        const dy = (backTL.y - frontTL.y) / prismWidth;

        for ( let layer = 0; layer < prismHeight; layer++ )
        {
            const isHighlighted = layer === this.highlightLayer - 1;
            const topColor = isHighlighted ? "#BFD9F2" : this.layerColors.top;
            const sideColor = isHighlighted ? "#A8C8E8" : this.layerColors.side;
            const frontColor = isHighlighted ? omdColor.stepColor : this.layerColors.front;

            // Paint back-to-front: rear rows first, then higher layers, so a
            // front cube's opaque faces cover the ones behind it. Front-to-back
            // order makes rear edges bleed through and reads as transparent.
            for ( let row = prismWidth - 1; row >= 0; row-- )
            {
                for ( let col = 0; col < prismLength; col++ )
                {
                    // Only the OUTER SHELL is drawn. An interior cube's faces
                    // are hidden by its neighbours in a solid prism, so drawing
                    // them would show edges "through" the solid.
                    const showFront = row === 0;
                    const showTop = layer === prismHeight - 1;
                    const showSide = col === prismLength - 1;
                    if ( !showFront && !showTop && !showSide )
                        continue;

                    const x0 = frontBL.x + col * cell + inset + row * dx;
                    const yBase = frontBL.y - layer * cell - inset + row * dy;
                    const size = scale - inset * 2;

                    // Front square of this cube.
                    const p0 = { x: x0, y: yBase };
                    const p1 = { x: x0 + size, y: yBase };
                    const p2 = { x: x0 + size, y: yBase - size };
                    const p3 = { x: x0, y: yBase - size };
                    // Corners pushed back one unit along the recession axis.
                    const p1b = { x: p1.x + dx, y: p1.y + dy };
                    const p2b = { x: p2.x + dx, y: p2.y + dy };
                    const p3b = { x: p3.x + dx, y: p3.y + dy };

                    if ( showFront )
                    {
                        const frontPath = new jsvgPath();
                        frontPath.setStrokeColor(this._cubeStrokeColor);
                        frontPath.setStrokeWidth(1);
                        frontPath.setFillColor(frontColor);
                        frontPath.svgObject.setAttribute('data-layer', String(layer + 1));
                        frontPath.svgObject.setAttribute('data-col', String(col));
                        frontPath.svgObject.setAttribute('data-row', String(row));
                        frontPath.svgObject.setAttribute('data-face', 'front');
                        frontPath.addPoint(p0.x, p0.y);
                        frontPath.addPoint(p1.x, p1.y);
                        frontPath.addPoint(p2.x, p2.y);
                        frontPath.addPoint(p3.x, p3.y);
                        frontPath.addPoint(p0.x, p0.y);
                        frontPath.updatePath();
                        this.cubeHolder.addChild(frontPath);
                    }

                    if ( showTop )
                    {
                        const topPath = new jsvgPath();
                        topPath.setStrokeColor(this._cubeStrokeColor);
                        topPath.setStrokeWidth(1);
                        topPath.setFillColor(topColor);
                        topPath.svgObject.setAttribute('data-layer', String(layer + 1));
                        topPath.svgObject.setAttribute('data-col', String(col));
                        topPath.svgObject.setAttribute('data-row', String(row));
                        topPath.svgObject.setAttribute('data-face', 'top');
                        topPath.addPoint(p3.x, p3.y);
                        topPath.addPoint(p2.x, p2.y);
                        topPath.addPoint(p2b.x, p2b.y);
                        topPath.addPoint(p3b.x, p3b.y);
                        topPath.addPoint(p3.x, p3.y);
                        topPath.updatePath();
                        this.cubeHolder.addChild(topPath);
                    }

                    if ( showSide )
                    {
                        const sidePath = new jsvgPath();
                        sidePath.setStrokeColor(this._cubeStrokeColor);
                        sidePath.setStrokeWidth(1);
                        sidePath.setFillColor(sideColor);
                        sidePath.svgObject.setAttribute('data-layer', String(layer + 1));
                        sidePath.svgObject.setAttribute('data-col', String(col));
                        sidePath.svgObject.setAttribute('data-row', String(row));
                        sidePath.svgObject.setAttribute('data-face', 'side');
                        sidePath.addPoint(p1.x, p1.y);
                        sidePath.addPoint(p1b.x, p1b.y);
                        sidePath.addPoint(p2b.x, p2b.y);
                        sidePath.addPoint(p2.x, p2.y);
                        sidePath.addPoint(p1.x, p1.y);
                        sidePath.updatePath();
                        this.cubeHolder.addChild(sidePath);
                    }
                }
            }
        }
    }
}


export class omdCylinder extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdCylinder";

        this.cylinderRadius = 3;
        this.cylinderHeight = 5;
        this.unitScale = 18;

        this.showLabels = false;
        this.sideLabels = null;
        this.radiusLabel = "";
        this.heightLabel = "";
        this.insideLabel = "";
        this.outsideTopLabel = "";
        this.showHiddenEdges = false;
        this.labelFontSize = 12;

        // Bottom face drawn first so the body covers its back arc
        this.bottomFacePath = new jsvgEllipse();
        this.bottomFacePath.setStrokeColor("black");
        this.bottomFacePath.setStrokeWidth(2);
        this.bottomFacePath.setFillColor(omdColor.lightGray);
        this.addChild(this.bottomFacePath);

        // Solid rectangle fill for the body — no stroke, covers the back arc of the bottom face
        this.bodyFill = new jsvgPath();
        this.bodyFill.setFillColor(omdColor.lightGray);
        this.addChild(this.bodyFill);

        // Side strokes as explicit lines
        this.leftLine = new jsvgLine();
        this.leftLine.setStrokeColor("black");
        this.leftLine.setStrokeWidth(2);
        this.addChild(this.leftLine);

        this.rightLine = new jsvgLine();
        this.rightLine.setStrokeColor("black");
        this.rightLine.setStrokeWidth(2);
        this.addChild(this.rightLine);

        this.hiddenEdgeHolder = new jsvgGroup();
        this.addChild(this.hiddenEdgeHolder);

        // Top face drawn last so it sits on top of everything
        this.topFacePath = new jsvgEllipse();
        this.topFacePath.setStrokeColor("black");
        this.topFacePath.setStrokeWidth(2);
        this.topFacePath.setFillColor("#e6edf7");
        this.addChild(this.topFacePath);

        this.labelsHolder = new jsvgGroup();
        this.addChild(this.labelsHolder);

        this.updateLayout();
    }

    loadFromJSON(data)
    {
        if ( typeof data.radius != "undefined" )
            this.cylinderRadius = data.radius;

        if ( typeof data.height != "undefined" )
            this.cylinderHeight = data.height;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        if ( typeof data.sideLabels != "undefined" && data.sideLabels && typeof data.sideLabels === "object" )
            this.sideLabels = { ...data.sideLabels };

        if ( typeof data.radiusLabel != "undefined" )
            this.radiusLabel = data.radiusLabel;

        if ( typeof data.heightLabel != "undefined" )
            this.heightLabel = data.heightLabel;

        if ( typeof data.insideLabel != "undefined" )
            this.insideLabel = data.insideLabel;

        if ( typeof data.outsideTopLabel != "undefined" )
            this.outsideTopLabel = data.outsideTopLabel;

        if ( typeof data.showHiddenEdges != "undefined" )
            this.showHiddenEdges = data.showHiddenEdges !== false;

        if ( typeof data.labelFontSize === "number" )
            this.labelFontSize = data.labelFontSize;

        this.updateLayout();
    }

    getResolvedCylinderLabels()
    {
        const defaults = { radius: "", height: "" };

        if ( this.showLabels )
        {
            defaults.radius = normalizeLabelValue(this.cylinderRadius);
            defaults.height = normalizeLabelValue(this.cylinderHeight);
        }

        const sideLabels = (this.sideLabels && typeof this.sideLabels === "object") ? this.sideLabels : {};
        const resolved = { radius: defaults.radius, height: defaults.height };

        if ( typeof sideLabels.radius != "undefined" ) resolved.radius = normalizeLabelValue(sideLabels.radius);
        if ( typeof sideLabels.r != "undefined" ) resolved.radius = normalizeLabelValue(sideLabels.r);
        if ( typeof sideLabels.height != "undefined" ) resolved.height = normalizeLabelValue(sideLabels.height);
        if ( typeof sideLabels.h != "undefined" ) resolved.height = normalizeLabelValue(sideLabels.h);

        if ( labelHasText(this.radiusLabel) ) resolved.radius = normalizeLabelValue(this.radiusLabel);
        if ( labelHasText(this.heightLabel) ) resolved.height = normalizeLabelValue(this.heightLabel);

        return resolved;
    }

    updateLayout()
    {
        const radius = Math.max(1, Number(this.cylinderRadius) || 1);
        const height = Math.max(1, Number(this.cylinderHeight) || 1);
        const scale = Math.max(1, Number(this.unitScale) || 1);

        const rx = radius * scale;
        const ry = rx * 0.35;
        const heightPx = height * scale;

        const labels = this.getResolvedCylinderLabels();
        const hasLabels = (
            labelHasText(labels.radius) ||
            labelHasText(labels.height) ||
            labelHasText(this.insideLabel) ||
            labelHasText(this.outsideTopLabel)
        );

        const basePadding = 16;
        const fontSize = this.labelFontSize;
        const textHeight = estimateLabelHeight(fontSize);
        const endpointMarkerHalfLength = Math.max(4, textHeight * 0.35);
        const shapeBarGap = Math.max(4, textHeight * 0.32);
        const dimensionOffset = shapeBarGap + endpointMarkerHalfLength;
        const labelGap = Math.max(9, textHeight * 0.55);
        const radiusDimensionOffset = dimensionOffset;
        const radiusLabelOffset = Math.max(labelGap, textHeight * 0.68);

        const radiusTextWidth = estimateLabelWidth(labels.radius, fontSize);
        const heightTextWidth = estimateLabelWidth(labels.height, fontSize);
        const insideTextWidth = estimateLabelWidth(this.insideLabel, fontSize);
        const topTextWidth = estimateLabelWidth(this.outsideTopLabel, fontSize);
        const heightDimensionOffset = labelHasText(labels.height)
            ? Math.max(dimensionOffset, heightTextWidth * 0.5 + labelGap * 0.5)
            : dimensionOffset;

        let leftPad = basePadding;
        let rightPad = basePadding;
        let topPad = basePadding;
        let bottomPad = basePadding;

        if ( hasLabels )
        {
            if ( labelHasText(labels.radius) )
            {
                topPad = Math.max(topPad, radiusDimensionOffset + textHeight * 1.2 + basePadding);
                rightPad = Math.max(rightPad, Math.max(0, radiusTextWidth * 0.5 - rx * 0.5) + basePadding);
                leftPad = Math.max(leftPad, Math.max(0, radiusTextWidth * 0.5 - rx * 1.5) + basePadding);
            }

            if ( labelHasText(labels.height) )
            {
                leftPad = Math.max(leftPad, heightDimensionOffset + heightTextWidth * 0.5 + basePadding);
            }

            if ( labelHasText(this.insideLabel) )
            {
                bottomPad = Math.max(bottomPad, labelGap + textHeight + basePadding);
                leftPad = Math.max(leftPad, Math.max(0, insideTextWidth * 0.5 - rx) + basePadding);
                rightPad = Math.max(rightPad, Math.max(0, insideTextWidth * 0.5 - rx) + basePadding);
            }

            if ( labelHasText(this.outsideTopLabel) )
            {
                const topLabelStackHeight = labelHasText(labels.radius)
                    ? radiusDimensionOffset + textHeight * 2.18 + labelGap
                    : labelGap + textHeight * 1.5;
                topPad = Math.max(topPad, topLabelStackHeight + basePadding);
                leftPad = Math.max(leftPad, Math.max(0, topTextWidth * 0.5 - rx) + basePadding);
                rightPad = Math.max(rightPad, Math.max(0, topTextWidth * 0.5 - rx) + basePadding);
            }
        }

        const cx = leftPad + rx;
        const cy = topPad + ry;

        // Bottom face: full ellipse at the base (drawn first, front arc sticks out below body)
        this.bottomFacePath.setWidthAndHeight(2 * rx, 2 * ry);
        this.bottomFacePath.setPosition(cx, cy + heightPx);

        // Body fill: solid rectangle that covers the back arc of the bottom face — no stroke
        this.bodyFill.clearPoints();
        this.bodyFill.addPoint(cx - rx, cy);
        this.bodyFill.addPoint(cx + rx, cy);
        this.bodyFill.addPoint(cx + rx, cy + heightPx);
        this.bodyFill.addPoint(cx - rx, cy + heightPx);
        this.bodyFill.addPoint(cx - rx, cy);
        this.bodyFill.updatePath();
        this.bodyFill.svgObject.setAttribute("stroke", "none");

        // Side strokes
        this.leftLine.setEndpoints(cx - rx, cy, cx - rx, cy + heightPx);
        this.rightLine.setEndpoints(cx + rx, cy, cx + rx, cy + heightPx);

        // Hidden edge: back arc of bottom ellipse
        this.hiddenEdgeHolder.removeAllChildren();
        if ( this.showHiddenEdges )
        {
            const hiddenArc = new jsvgPath();
            hiddenArc.setStrokeColor("black");
            hiddenArc.setStrokeWidth(1);
            hiddenArc.setFillColor("none");
            hiddenArc.svgObject.setAttribute("stroke-dasharray", "3 2");
            hiddenArc.svgObject.setAttribute("d",
                `M ${cx - rx} ${cy + heightPx} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy + heightPx}`
            );
            this.hiddenEdgeHolder.addChild(hiddenArc);
        }

        // Top face: drawn after everything else so it caps the cylinder cleanly
        this.topFacePath.setWidthAndHeight(2 * rx, 2 * ry);
        this.topFacePath.setPosition(cx, cy);

        this.labelsHolder.removeAllChildren();
        if ( hasLabels )
        {
            const addLine = (x0, y0, x1, y1) => {
                const line = new jsvgLine();
                line.setStrokeColor("black");
                line.setStrokeWidth(1);
                line.setEndpoints(x0, y0, x1, y1);
                this.labelsHolder.addChild(line);
            };

            const addTextbookLabel = (text, x, y, options = {}) => {
                this.labelsHolder.addChild(createShapeTextLabel(text, x, y, { fontSize, ...options }));
            };

            const addEndpointMarker = (point, nx, ny) => {
                addLine(
                    point.x - nx * endpointMarkerHalfLength,
                    point.y - ny * endpointMarkerHalfLength,
                    point.x + nx * endpointMarkerHalfLength,
                    point.y + ny * endpointMarkerHalfLength
                );
            };

            const addDimensionLineWithGap = (p0, p1, text, options = {}) => {
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const len = Math.hypot(dx, dy) || 1;
                const ux = dx / len;
                const uy = dy / len;
                const labelWidth = Math.max(fontSize * 1.6, estimateLabelWidth(text, fontSize) + fontSize * 0.8);
                const halfGap = Math.min(Math.max(0, len * 0.5 - 2), labelWidth * 0.5);
                const midX = (p0.x + p1.x) * 0.5;
                const midY = (p0.y + p1.y) * 0.5;

                if ( halfGap > 1 )
                {
                    addLine(p0.x, p0.y, midX - ux * halfGap, midY - uy * halfGap);
                    addLine(midX + ux * halfGap, midY + uy * halfGap, p1.x, p1.y);
                }
                else
                {
                    addLine(p0.x, p0.y, p1.x, p1.y);
                }

                let rotation = Math.atan2(dy, dx) * 180 / Math.PI;
                if ( rotation > 90 || rotation < -90 ) rotation += 180;
                addTextbookLabel(text, midX, midY, options.rotate === false ? {} : { rotation });
            };

            // Radius: keep the dimension just above the top face so text never collides with the ellipse.
            if ( labelHasText(labels.radius) )
            {
                const radiusY = cy - ry - radiusDimensionOffset;
                addLine(cx, radiusY, cx + rx, radiusY);
                addEndpointMarker({ x: cx, y: radiusY }, 0, 1);
                addEndpointMarker({ x: cx + rx, y: radiusY }, 0, 1);
                addTextbookLabel(labels.radius, cx + rx * 0.5, radiusY - radiusLabelOffset);
            }

            if ( labelHasText(labels.height) )
            {
                const x = cx - rx - heightDimensionOffset;
                addEndpointMarker({ x, y: cy }, 1, 0);
                addEndpointMarker({ x, y: cy + heightPx }, 1, 0);
                addDimensionLineWithGap(
                    { x, y: cy },
                    { x, y: cy + heightPx },
                    labels.height,
                    { rotate: false }
                );
            }

            if ( labelHasText(this.insideLabel) )
            {
                addTextbookLabel(this.insideLabel, cx, cy + heightPx + ry + labelGap + textHeight * 0.5);
            }

            if ( labelHasText(this.outsideTopLabel) )
            {
                const radiusY = cy - ry - radiusDimensionOffset;
                const radiusTextY = radiusY - radiusLabelOffset;
                const outsideTopY = labelHasText(labels.radius)
                    ? radiusTextY - textHeight - labelGap
                    : cy - ry - labelGap - textHeight;
                addTextbookLabel(this.outsideTopLabel, cx, outsideTopY);
            }
        }

        const totalWidth = leftPad + 2 * rx + rightPad;
        const totalHeight = topPad + 2 * ry + heightPx + bottomPad;
        this.width = totalWidth;
        this.height = totalHeight;
        this.svgObject.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
    }
}


export class omdEllipse extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdEllipse";

        this.rectWidth = 10;
        this.rectHeight = 5;
        this.unitScale = 10;
        this.showLabels = false;

        this.shapePath = new jsvgEllipse();
        this.shapePath.setWidthAndHeight( this.rectWidth*this.unitScale, this.rectHeight*this.unitScale );
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

        this.labelsHolder = new jsvgGroup();
        this.addChild( this.labelsHolder );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.width != "undefined" )
            this.rectWidth = data.width;

        if ( typeof data.height != "undefined" )
            this.rectHeight = data.height;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        this.updateLayout();
    }

    updateLayout()
    {
        const ellipseWidth = this.rectWidth * this.unitScale;
        const ellipseHeight = this.rectHeight * this.unitScale;

        this.shapePath.setWidthAndHeight( ellipseWidth, ellipseHeight );
        this.shapePath.setPosition( ellipseWidth * 0.5 + 10, ellipseHeight * 0.5 + 10 );

        this.labelsHolder.removeAllChildren();
        if ( this.showLabels )
        {
            const label = new jsvgTextLine();
            label.setAlignment("center");
            label.setFontFamily( "Albert Sans" );
            label.setFontColor( "black" );
            label.setFontSize( 12 );
            label.setPosition( ellipseWidth * 0.5 + 10, ellipseHeight * 0.5 + 14 );
            label.setText( `${this.rectWidth} × ${this.rectHeight}` );
            this.labelsHolder.addChild( label );
        }

        // Set dimensions and viewBox for API compatibility
        this.width = this.rectWidth * this.unitScale + 20;
        this.height = this.rectHeight * this.unitScale + 20;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}

export class omdCircle extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdCircle";

        this.radius = 5;
        this.unitScale = 10;
        this.showLabels = false;
        this.points = [];
        this.segments = [];
        this.pointRadius = 4;
        this.annotationFontSize = 16;
        this.circleLabelBoxes = [];
        this.circlePointBoxes = [];
        this.circleSegmentGeometries = [];

        this.shapePath = new jsvgEllipse();
        this.shapePath.setWidthAndHeight( this.radius*this.unitScale, this.radius*this.unitScale );
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

        this.segmentHolder = new jsvgGroup();
        this.addChild( this.segmentHolder );

        this.pointHolder = new jsvgGroup();
        this.addChild( this.pointHolder );

        this.labelsHolder = new jsvgGroup();
        this.addChild( this.labelsHolder );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.radius != "undefined" )
            this.radius = data.radius;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        if ( Array.isArray(data.points) )
            this.points = data.points;

        if ( Array.isArray(data.segments) )
            this.segments = data.segments;

        if ( typeof data.pointRadius != "undefined" )
            this.pointRadius = data.pointRadius;

        if ( typeof data.annotationFontSize != "undefined" )
            this.annotationFontSize = data.annotationFontSize;

        this.updateLayout();
    }

    getCircleHasAnnotations()
    {
        return this.points.length > 0 || this.segments.length > 0;
    }

    getCirclePadding()
    {
        return this.getCircleHasAnnotations() || this.showLabels ? 34 : 10;
    }

    getCirclePointPosition( point, centerX, centerY, radiusPx )
    {
        if ( point.type === "center" )
            return { x: centerX, y: centerY };

        const angle = typeof point.angle === "number" ? point.angle : 0;
        const distance = typeof point.distance === "number" ? point.distance : 1;
        const angleRadians = degreesToRadians( angle );

        return {
            x: centerX + Math.cos( angleRadians ) * radiusPx * distance,
            y: centerY - Math.sin( angleRadians ) * radiusPx * distance
        };
    }

    getCircleLabelPosition( point, pointPosition, centerX, centerY )
    {
        if ( point.labelOffset && typeof point.labelOffset === "object" )
        {
            return {
                x: pointPosition.x + (Number(point.labelOffset.x) || 0),
                y: pointPosition.y + (Number(point.labelOffset.y) || 0)
            };
        }

        if ( point.type === "center" )
        {
            const offset = typeof point.labelOffset === "number" ? point.labelOffset : 14;
            return {
                x: pointPosition.x + offset * 0.7,
                y: pointPosition.y + offset * 0.9
            };
        }

        const dx = pointPosition.x - centerX;
        const dy = pointPosition.y - centerY;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const outwardOffset = typeof point.labelOffset === "number" ? point.labelOffset : 13;

        return {
            x: pointPosition.x + dx / length * outwardOffset,
            y: pointPosition.y + dy / length * outwardOffset
        };
    }

    createCirclePointMap( centerX, centerY, radiusPx )
    {
        const pointMap = new Map();

        for ( const point of this.points )
        {
            const name = normalizeLabelValue(
                typeof point.name !== "undefined" && point.name !== null ? point.name : point.label
            );
            if ( !name ) continue;

            const position = this.getCirclePointPosition( point, centerX, centerY, radiusPx );
            pointMap.set( name, { ...point, name, position } );
        }

        return pointMap;
    }

    getCircleLabelCollisionScore( box )
    {
        const expandedBox = expandBox( box, 2 );
        let score = 0;

        for ( const existingBox of this.circleLabelBoxes )
        {
            if ( boxesOverlap(expandedBox, existingBox, 2) )
                score += 1000;
        }

        for ( const pointBox of this.circlePointBoxes )
        {
            if ( boxesOverlap(expandedBox, pointBox, 2) )
                score += 500;
        }

        for ( const segment of this.circleSegmentGeometries )
        {
            if ( segmentIntersectsBox(segment, expandBox(box, 3)) )
                score += 250;
        }

        return score;
    }

    getBestCircleLabelCandidate( candidates, text, options = {} )
    {
        let bestCandidate = candidates[0];
        let bestScore = Infinity;

        for ( const candidate of candidates )
        {
            const box = getEstimatedLabelBox( text, candidate.x, candidate.y, options );
            const score = this.getCircleLabelCollisionScore( box );
            if ( score < bestScore )
            {
                bestCandidate = { ...candidate, box };
                bestScore = score;
            }

            if ( score === 0 ) return { ...candidate, box };
        }

        return bestCandidate;
    }

    getCirclePointLabelCandidates( point, pointPosition, centerX, centerY )
    {
        const primary = this.getCircleLabelPosition( point, pointPosition, centerX, centerY );
        const candidates = [ primary ];

        if ( point.type === "center" )
        {
            const distance = typeof point.labelOffset === "number" ? Math.max(point.labelOffset, 18) : 18;
            const directions = [
                { x: 1, y: 1 },
                { x: -1, y: 1 },
                { x: 1, y: -1 },
                { x: -1, y: -1 },
                { x: 0, y: 1 },
                { x: 1, y: 0 },
                { x: 0, y: -1 },
                { x: -1, y: 0 }
            ];

            return directions.map(direction => ({
                x: pointPosition.x + direction.x * distance,
                y: pointPosition.y + direction.y * distance
            }));
        }

        const dx = pointPosition.x - centerX;
        const dy = pointPosition.y - centerY;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const outwardX = dx / length;
        const outwardY = dy / length;
        const tangentX = -outwardY;
        const tangentY = outwardX;
        const outwardOffset = typeof point.labelOffset === "number" ? point.labelOffset : 15;

        candidates.push(
            {
                x: pointPosition.x + outwardX * outwardOffset + tangentX * 10,
                y: pointPosition.y + outwardY * outwardOffset + tangentY * 10
            },
            {
                x: pointPosition.x + outwardX * outwardOffset - tangentX * 10,
                y: pointPosition.y + outwardY * outwardOffset - tangentY * 10
            },
            {
                x: pointPosition.x + outwardX * (outwardOffset + 10),
                y: pointPosition.y + outwardY * (outwardOffset + 10)
            }
        );

        return candidates;
    }

    getCircleSegmentLabelCandidates( segment, start, end )
    {
        const defaultLabelPosition = typeof segment.labelPosition === "number" ? segment.labelPosition : 0.5;
        const labelPositions = [
            defaultLabelPosition,
            Math.max(0.18, defaultLabelPosition - 0.18),
            Math.min(0.82, defaultLabelPosition + 0.18),
            0.35,
            0.65
        ];
        const dx = end.position.x - start.position.x;
        const dy = end.position.y - start.position.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const perpendicularX = -dy / length;
        const perpendicularY = dx / length;
        const defaultOffset = typeof segment.labelOffset === "number" ? segment.labelOffset : 22;
        const offsets = [ defaultOffset, -defaultOffset, defaultOffset + 12, -(defaultOffset + 12) ];

        if ( segment.labelOffset && typeof segment.labelOffset === "object" )
        {
            return labelPositions.map(labelPosition => ({
                x: start.position.x + dx * labelPosition + (Number(segment.labelOffset.x) || 0),
                y: start.position.y + dy * labelPosition + (Number(segment.labelOffset.y) || 0)
            }));
        }

        const candidates = [];
        for ( const labelPosition of labelPositions )
        {
            for ( const offset of offsets )
            {
                candidates.push({
                    x: start.position.x + dx * labelPosition + perpendicularX * offset,
                    y: start.position.y + dy * labelPosition + perpendicularY * offset
                });
            }
        }

        return candidates;
    }

    addCirclePoint( point, centerX, centerY )
    {
        const hasExplicitLabel = Object.prototype.hasOwnProperty.call(point, "label");
        const labelText = point.showLabel === false
            ? ""
            : normalizeLabelValue(hasExplicitLabel ? point.label : point.name);
        const dotRadius = typeof point.pointRadius === "number" ? point.pointRadius : this.pointRadius;

        if ( point.showDot !== false )
        {
            const dot = new jsvgEllipse();
            dot.setWidthAndHeight( dotRadius * 2, dotRadius * 2 );
            dot.setPosition( point.position.x, point.position.y );
            dot.setFillColor( point.dotColor || "black" );
            dot.setStrokeColor( point.dotColor || "black" );
            dot.setStrokeWidth( 0 );
            this.pointHolder.addChild( dot );
            this.circlePointBoxes.push({
                left: point.position.x - dotRadius,
                right: point.position.x + dotRadius,
                top: point.position.y - dotRadius,
                bottom: point.position.y + dotRadius,
                width: dotRadius * 2,
                height: dotRadius * 2
            });
        }

        if ( labelHasText(labelText) )
        {
            const fontSize = typeof point.fontSize === "number" ? point.fontSize : this.annotationFontSize;
            const align = point.align || "center";
            const labelPosition = this.getBestCircleLabelCandidate(
                this.getCirclePointLabelCandidates( point, point.position, centerX, centerY ),
                labelText,
                { fontSize, align }
            );
            const label = createShapeTextLabel( labelText, labelPosition.x, labelPosition.y, {
                fontSize,
                align,
                color: point.color || "black"
            });
            this.labelsHolder.addChild( label );
            this.circleLabelBoxes.push( labelPosition.box );
        }
    }

    addCircleSegmentLine( segment, pointMap )
    {
        const start = pointMap.get( normalizeLabelValue(segment.from) );
        const end = pointMap.get( normalizeLabelValue(segment.to) );
        if ( !start || !end ) return;

        const line = new jsvgLine();
        line.setStrokeColor( segment.color || "black" );
        line.setStrokeWidth( typeof segment.strokeWidth === "number" ? segment.strokeWidth : 2 );
        line.setEndpoints( start.position.x, start.position.y, end.position.x, end.position.y );
        this.segmentHolder.addChild( line );
        this.circleSegmentGeometries.push({
            x1: start.position.x,
            y1: start.position.y,
            x2: end.position.x,
            y2: end.position.y
        });
    }

    addCircleSegmentLabel( segment, pointMap )
    {
        if ( !labelHasText(segment.label) ) return;

        const start = pointMap.get( normalizeLabelValue(segment.from) );
        const end = pointMap.get( normalizeLabelValue(segment.to) );
        if ( !start || !end ) return;

        const fontSize = typeof segment.fontSize === "number" ? segment.fontSize : this.annotationFontSize;
        const labelPosition = this.getBestCircleLabelCandidate(
            this.getCircleSegmentLabelCandidates( segment, start, end ),
            segment.label,
            { fontSize, align: "center" }
        );
        const label = createShapeTextLabel( segment.label, labelPosition.x, labelPosition.y, {
            fontSize,
            align: "center",
            color: segment.labelColor || "black"
        });
        this.labelsHolder.addChild( label );
        this.circleLabelBoxes.push( labelPosition.box );
    }

    updateLayout()
    {
        const diameter = 2.0 * this.radius * this.unitScale;
        const radiusPx = this.radius * this.unitScale;
        const padding = this.getCirclePadding();
        const centerX = radiusPx + padding;
        const centerY = radiusPx + padding;

        this.shapePath.setWidthAndHeight( diameter, diameter );
        this.shapePath.setPosition( centerX, centerY );

        this.segmentHolder.removeAllChildren();
        this.pointHolder.removeAllChildren();
        this.labelsHolder.removeAllChildren();
        this.circleLabelBoxes = [];
        this.circlePointBoxes = [];
        this.circleSegmentGeometries = [];

        const pointMap = this.createCirclePointMap( centerX, centerY, radiusPx );

        for ( const segment of this.segments )
            this.addCircleSegmentLine( segment, pointMap );

        for ( const point of pointMap.values() )
            this.addCirclePoint( point, centerX, centerY );

        for ( const segment of this.segments )
            this.addCircleSegmentLabel( segment, pointMap );

        if ( this.showLabels && !this.getCircleHasAnnotations() )
        {
            const angleRadians = -Math.PI / 6;
            const endX = centerX + Math.cos(angleRadians) * radiusPx * 0.82;
            const endY = centerY + Math.sin(angleRadians) * radiusPx * 0.82;

            const radiusLine = new jsvgLine();
            radiusLine.setStrokeColor("black");
            radiusLine.setStrokeWidth(1.5);
            radiusLine.setEndpoints(centerX, centerY, endX, endY);
            this.labelsHolder.addChild(radiusLine);

            const label = new jsvgTextLine();
            label.setAlignment("center");
            label.setFontFamily( "Albert Sans" );
            label.setFontColor( "black" );
            label.setFontSize( 12 );
            label.svgObject.setAttribute('dominant-baseline', 'middle');
            label.setRotation(angleRadians * 180 / Math.PI);
            label.setPosition(
                (centerX + endX) * 0.5 + 3,
                (centerY + endY) * 0.5 - 4
            );
            label.setText( `r=${this.radius}` );
            this.labelsHolder.addChild( label );
        }

        // Set dimensions and viewBox for API compatibility
        this.width = diameter + padding * 2;
        this.height = diameter + padding * 2;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}

export class omdAngle extends jsvgGroup
{
    constructor()
    {
        super();

        this.type = "omdAngle";
        this.rayLength = 160;
        this.strokeColor = "black";
        this.strokeWidth = 2;
        this.dotRadius = 4;
        this.fontSize = 28;
        this.arcRadius = 42;
        this.showAngleTicks = false;
        this.angleTickGap = 8;
        this.angleTickLength = 12;
        this.angleTickTolerance = 0.1;
        this.padding = 32;
        this.showRayNames = false;
        this.vertexLabel = "";
        this.rays = [
            { angle: 0 },
            { angle: 55 }
        ];
        this.angles = [
            { from: 0, to: 1, label: "a°" }
        ];

        this.contentHolder = new jsvgGroup();
        this.addChild( this.contentHolder );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.rayLength !== "undefined" )
            this.rayLength = data.rayLength;

        if ( typeof data.strokeColor !== "undefined" )
            this.strokeColor = data.strokeColor;

        if ( typeof data.strokeWidth !== "undefined" )
            this.strokeWidth = data.strokeWidth;

        if ( typeof data.dotRadius !== "undefined" )
            this.dotRadius = data.dotRadius;

        if ( typeof data.fontSize !== "undefined" )
            this.fontSize = data.fontSize;

        if ( typeof data.arcRadius !== "undefined" )
            this.arcRadius = data.arcRadius;

        if ( typeof data.showAngleTicks !== "undefined" )
            this.showAngleTicks = data.showAngleTicks;

        if ( typeof data.angleTickGap !== "undefined" )
            this.angleTickGap = data.angleTickGap;

        if ( typeof data.angleTickLength !== "undefined" )
            this.angleTickLength = data.angleTickLength;

        if ( typeof data.angleTickTolerance !== "undefined" )
            this.angleTickTolerance = data.angleTickTolerance;

        if ( typeof data.padding !== "undefined" )
            this.padding = data.padding;

        if ( typeof data.showRayNames !== "undefined" )
            this.showRayNames = data.showRayNames;

        if ( typeof data.vertexLabel !== "undefined" )
            this.vertexLabel = data.vertexLabel;

        if ( Array.isArray(data.rays) )
            this.rays = data.rays;
        else if ( typeof data.startAngle === "number" && typeof data.endAngle === "number" )
            this.rays = [{ angle: data.startAngle }, { angle: data.endAngle }];

        if ( Array.isArray(data.angles) )
            this.angles = data.angles;
        else if ( typeof data.label !== "undefined" )
            this.angles = [{ from: 0, to: 1, label: data.label }];

        this.updateLayout();
    }

    getAngleRay( ray, index )
    {
        const angle = typeof ray.angle === "number" ? ray.angle : 0;
        const length = typeof ray.length === "number" ? ray.length : this.rayLength;
        const radians = degreesToRadians( angle );

        return {
            ...ray,
            index,
            angle,
            length,
            x: Math.cos(radians) * length,
            y: -Math.sin(radians) * length,
            unitX: Math.cos(radians),
            unitY: -Math.sin(radians)
        };
    }

    getAngleByIndexOrName( value, computedRays )
    {
        if ( typeof value === "number" )
            return computedRays[value] || null;

        const name = normalizeLabelValue(value);
        return computedRays.find(ray => normalizeLabelValue(ray.name || ray.label) === name) || null;
    }

    getDirectedAngleDelta( startAngle, endAngle )
    {
        return ((endAngle - startAngle) % 360 + 360) % 360;
    }

    getAngleDelta( startAngle, endAngle, angleData = {} )
    {
        const delta = this.getDirectedAngleDelta( startAngle, endAngle );
        if ( angleData.reflex === true || angleData.useReflexAngle === true )
            return delta;

        return delta > 180 ? delta - 360 : delta;
    }

    getAngleMeasureKey( startRay, endRay, angleData = {} )
    {
        const delta = Math.abs(this.getAngleDelta( startRay.angle, endRay.angle, angleData ));
        const tolerance = Math.max(0.001, Number(this.angleTickTolerance) || 0.1);
        return String(Math.round(delta / tolerance));
    }

    getAngleMarkerType( angleData )
    {
        return angleData.marker || angleData.type || "arc";
    }

    getAngleLabelText( angleData, startRay, endRay )
    {
        if ( typeof angleData.label !== "undefined" )
            return normalizeLabelValue(angleData.label);

        if ( this.getAngleMarkerType(angleData) !== "arc" )
            return "";

        if ( !startRay || !endRay )
            return "";

        const measure = Math.abs(this.getAngleDelta( startRay.angle, endRay.angle, angleData ));
        return `${Math.round(measure)}°`;
    }

    getAngleTickGap()
    {
        return Math.max(1, Number(this.angleTickGap) || 8);
    }

    getAngleTickLength( angleData = {} )
    {
        return Math.max(2, Number(angleData.tickLength ?? this.angleTickLength) || 12);
    }

    getAngleTickCount( angleData, angleIndex, angleTickCounts )
    {
        if ( typeof angleData.tickCount === "number" )
            return Math.max(1, Math.floor(angleData.tickCount));

        if ( typeof angleData.arcCount === "number" )
            return Math.max(1, Math.floor(angleData.arcCount));

        return angleTickCounts?.get(angleIndex) || 1;
    }

    getAngleOuterRadius( angleData, angleIndex, angleTickCounts )
    {
        const radius = typeof angleData.arcRadius === "number" ? angleData.arcRadius : this.arcRadius;
        const markerType = this.getAngleMarkerType(angleData);
        if ( markerType !== "arc" )
            return radius;

        const tickCount = this.getAngleTickCount(angleData, angleIndex, angleTickCounts);
        return this.showAngleTicks && tickCount > 0
            ? radius + this.getAngleTickLength(angleData) * 0.5
            : radius;
    }

    getAngleTickCounts( computedRays )
    {
        const counts = new Map();
        if ( !this.showAngleTicks )
            return counts;

        const countsByMeasure = new Map();
        let nextCount = 1;

        this.angles.forEach((angleData, index) => {
            if ( this.getAngleMarkerType(angleData) !== "arc" )
                return;

            const startRay = this.getAngleByIndexOrName(angleData.from, computedRays) || computedRays[0];
            const endRay = this.getAngleByIndexOrName(angleData.to, computedRays) || computedRays[1];
            if ( !startRay || !endRay )
                return;

            const measureKey = this.getAngleMeasureKey(startRay, endRay, angleData);
            if ( !countsByMeasure.has(measureKey) )
            {
                countsByMeasure.set(measureKey, nextCount);
                nextCount += 1;
            }

            counts.set(index, countsByMeasure.get(measureKey));
        });

        return counts;
    }

    getAngleRayLabelPosition( ray )
    {
        const labelDistance = typeof ray.labelDistance === "number" ? ray.labelDistance : 12;
        return {
            x: ray.x + ray.unitX * labelDistance,
            y: ray.y + ray.unitY * labelDistance,
            fontSize: typeof ray.fontSize === "number" ? ray.fontSize : this.fontSize
        };
    }

    getAngleRayDisplayLabel( ray )
    {
        if ( labelHasText(ray.label) )
            return ray.label;

        if ( this.showRayNames && labelHasText(ray.name) )
            return ray.name;

        return "";
    }

    getAngleLabelCandidates( angleData, startRay, endRay, radius )
    {
        if ( angleData.labelPosition && typeof angleData.labelPosition === "object" )
        {
            const x = Number(angleData.labelPosition.x) || 0;
            const y = Number(angleData.labelPosition.y) || 0;
            return [
                { x, y, preferencePenalty: 0 },
                { x: x + 14, y, preferencePenalty: 24 },
                { x: x - 14, y, preferencePenalty: 24 },
                { x, y: y + 14, preferencePenalty: 24 },
                { x, y: y - 14, preferencePenalty: 24 }
            ];
        }

        const delta = this.getAngleDelta( startRay.angle, endRay.angle, angleData );
        const midAngle = startRay.angle + delta * 0.5;
        const baseRadius = typeof angleData.labelRadius === "number" ? angleData.labelRadius : radius + 28;
        const maxAngleOffset = Math.max(0, Math.abs(delta) * 0.5 - 4);
        const angleOffsets = [0, 8, -8, 16, -16, 24, -24].filter(offset => Math.abs(offset) <= maxAngleOffset);
        const radiusOffsets = [0, 12, 24, -8, 36];
        const candidates = [];

        if ( angleOffsets.length === 0 )
            angleOffsets.push(0);

        for ( const radiusOffset of radiusOffsets )
        {
            const candidateRadius = Math.max(radius + 20, baseRadius + radiusOffset);
            for ( const angleOffset of angleOffsets )
            {
                const candidateAngle = midAngle + angleOffset;
                const radians = degreesToRadians( candidateAngle );
                candidates.push({
                    x: Math.cos(radians) * candidateRadius,
                    y: -Math.sin(radians) * candidateRadius,
                    radius: candidateRadius,
                    preferencePenalty: Math.abs(angleOffset) * 2 + Math.abs(radiusOffset)
                });
            }
        }

        return candidates;
    }

    getAngleLabelCollisionScore( candidate, box, context, markerRadius )
    {
        let score = candidate.preferencePenalty || 0;
        const expandedBox = expandBox(box, 2);

        for ( const existingBox of context.labelBoxes )
        {
            if ( boxesOverlap(expandedBox, existingBox, 2) )
                score += 1200;
        }

        for ( const pointBox of context.pointBoxes )
        {
            if ( boxesOverlap(expandedBox, pointBox, 2) )
                score += 600;
        }

        for ( const raySegment of context.raySegments )
        {
            if ( segmentIntersectsBox(raySegment, expandBox(box, 3)) )
                score += 900;
        }

        if ( typeof candidate.radius === "number" && Math.abs(candidate.radius - markerRadius) < 16 )
            score += 200;

        return score;
    }

    getAngleArcAnchor( angleData, startRay, endRay, radius )
    {
        const delta = this.getAngleDelta( startRay.angle, endRay.angle, angleData );
        const midAngle = startRay.angle + delta * 0.5;
        const radians = degreesToRadians( midAngle );

        return {
            x: Math.cos(radians) * radius,
            y: -Math.sin(radians) * radius,
            angle: midAngle
        };
    }

    getBestAngleLabelCandidate( angleData, startRay, endRay, radius, context, labelText )
    {
        const text = normalizeLabelValue(labelText ?? this.getAngleLabelText(angleData, startRay, endRay));
        const fontSize = typeof angleData.fontSize === "number" ? angleData.fontSize : this.fontSize;
        let bestCandidate = null;
        let bestScore = Infinity;

        for ( const candidate of this.getAngleLabelCandidates(angleData, startRay, endRay, radius) )
        {
            const box = getEstimatedLabelBox(text, candidate.x, candidate.y, { fontSize });
            const score = this.getAngleLabelCollisionScore(candidate, box, context, radius);
            if ( score < bestScore )
            {
                bestScore = score;
                bestCandidate = { ...candidate, box, fontSize, score, mode: "inline" };
            }
        }

        return bestCandidate;
    }

    shouldUseAngleCallout( angleData, layout, radius, labeledAngleCount )
    {
        if ( angleData.labelMode === "inline" )
            return layout.score >= 700;

        if ( angleData.labelMode === "callout" ) return true;
        if ( angleData.labelPosition && typeof angleData.labelPosition === "object" ) return false;

        if ( layout.score >= 700 ) return true;
        if ( labeledAngleCount >= 3 && radius >= this.arcRadius + 20 ) return true;
        if ( labeledAngleCount >= 3 && layout.score >= 200 ) return true;

        return false;
    }

    getAngleCalloutCandidates( angleData, startRay, endRay, radius, bounds )
    {
        const anchor = this.getAngleArcAnchor( angleData, startRay, endRay, radius );
        const delta = this.getAngleDelta( startRay.angle, endRay.angle, angleData );
        const midAngle = startRay.angle + delta * 0.5;
        const leaderLength = Math.max(24, (typeof angleData.fontSize === "number" ? angleData.fontSize : this.fontSize) * 1.5);
        const leaderRadians = degreesToRadians(midAngle);
        const directionX = Math.cos(leaderRadians);
        const directionY = -Math.sin(leaderRadians);
        const perpendicularX = -directionY;
        const perpendicularY = directionX;
        const leaderEnd = {
            x: anchor.x + directionX * leaderLength,
            y: anchor.y + directionY * leaderLength
        };
        const fontSize = typeof angleData.fontSize === "number" ? angleData.fontSize : this.fontSize;
        const labelDistance = leaderLength + Math.max(18, fontSize * 0.85);
        const labelCenter = {
            x: anchor.x + directionX * labelDistance,
            y: anchor.y + directionY * labelDistance
        };
        const radialOffsets = [0, 12, 24];
        const perpendicularOffsets = [0, 16, -16, 32, -32, 48, -48];

        const candidates = [];
        for ( const radialOffset of radialOffsets )
        {
            for ( const perpendicularOffset of perpendicularOffsets )
            {
                candidates.push({
                    x: labelCenter.x + directionX * radialOffset + perpendicularX * perpendicularOffset,
                    y: labelCenter.y + directionY * radialOffset + perpendicularY * perpendicularOffset,
                    anchor,
                    leaderEnd,
                    fontSize,
                    mode: "callout",
                    preferencePenalty: Math.abs(perpendicularOffset) * 0.4 + Math.abs(radialOffset) * 0.3
                });
            }
        }

        return candidates;
    }

    getBestAngleCalloutCandidate( angleData, startRay, endRay, radius, context, bounds, labelText )
    {
        const text = normalizeLabelValue(labelText ?? this.getAngleLabelText(angleData, startRay, endRay));
        let bestCandidate = null;
        let bestScore = Infinity;

        for ( const candidate of this.getAngleCalloutCandidates(angleData, startRay, endRay, radius, bounds) )
        {
            const box = getEstimatedLabelBox(text, candidate.x, candidate.y, { fontSize: candidate.fontSize });
            let score = candidate.preferencePenalty || 0;

            for ( const existingBox of context.labelBoxes )
            {
                if ( boxesOverlap(expandBox(box, 2), existingBox, 2) )
                    score += 1200;
            }

            if ( score < bestScore )
            {
                bestScore = score;
                bestCandidate = {
                    ...candidate,
                    box,
                    score,
                    leaderEnd: candidate.leaderEnd
                };
            }
        }

        return bestCandidate;
    }

    getAngleLabelLayouts( computedRays, context, bounds, angleTickCounts )
    {
        const labeledAngleCount = this.angles.reduce((count, angleData) => {
            const startRay = this.getAngleByIndexOrName(angleData.from, computedRays) || computedRays[0];
            const endRay = this.getAngleByIndexOrName(angleData.to, computedRays) || computedRays[1];
            return count + (labelHasText(this.getAngleLabelText(angleData, startRay, endRay)) ? 1 : 0);
        }, 0);
        const sortedAngles = this.angles
            .map((angleData, index) => ({ angleData, index }))
            .sort((a, b) => {
                const radiusA = this.getAngleOuterRadius(a.angleData, a.index, angleTickCounts);
                const radiusB = this.getAngleOuterRadius(b.angleData, b.index, angleTickCounts);
                return radiusA - radiusB || a.index - b.index;
            });
        const layouts = [];

        for ( const { angleData, index } of sortedAngles )
        {
            const startRay = this.getAngleByIndexOrName(angleData.from, computedRays) || computedRays[0];
            const endRay = this.getAngleByIndexOrName(angleData.to, computedRays) || computedRays[1];
            if ( !startRay || !endRay ) continue;

            const labelText = this.getAngleLabelText(angleData, startRay, endRay);
            if ( !labelHasText(labelText) ) continue;

            const radius = this.getAngleOuterRadius(angleData, index, angleTickCounts);
            let layout = this.getBestAngleLabelCandidate(angleData, startRay, endRay, radius, context, labelText);
            if ( !layout ) continue;

            if ( this.shouldUseAngleCallout(angleData, layout, radius, labeledAngleCount) )
            {
                const calloutLayout = this.getBestAngleCalloutCandidate(angleData, startRay, endRay, radius, context, bounds, labelText);
                if ( calloutLayout )
                    layout = calloutLayout;
            }

            context.labelBoxes.push(layout.box);
            layouts.push({ angleData, layout, labelText });
        }

        return layouts;
    }

    createRawPath( d, options = {} )
    {
        const path = new jsvgPath();
        path.svgObject.setAttribute("d", d);
        path.setStrokeColor( options.strokeColor || this.strokeColor );
        path.setStrokeWidth( typeof options.strokeWidth === "number" ? options.strokeWidth : this.strokeWidth );
        path.setFillColor( options.fillColor || "none" );
        return path;
    }

    addBoundsPoint( bounds, x, y )
    {
        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, y);
    }

    addBoundsBox( bounds, box )
    {
        this.addBoundsPoint( bounds, box.left, box.top );
        this.addBoundsPoint( bounds, box.right, box.bottom );
    }

    addTranslatedText( text, x, y, shiftX, shiftY, options = {} )
    {
        const label = createShapeTextLabel( text, x + shiftX, y + shiftY, {
            fontSize: typeof options.fontSize === "number" ? options.fontSize : this.fontSize,
            align: options.align || "center",
            color: options.color || "black"
        });
        if ( options.italic )
            label.svgObject.style.fontStyle = "italic";
        this.contentHolder.addChild( label );
    }

    getArcPathData( startRay, endRay, radius, shiftX, shiftY, angleData = {} )
    {
        const delta = this.getAngleDelta( startRay.angle, endRay.angle, angleData );
        const startX = Math.cos(degreesToRadians(startRay.angle)) * radius + shiftX;
        const startY = -Math.sin(degreesToRadians(startRay.angle)) * radius + shiftY;
        const endX = Math.cos(degreesToRadians(endRay.angle)) * radius + shiftX;
        const endY = -Math.sin(degreesToRadians(endRay.angle)) * radius + shiftY;
        const largeArcFlag = Math.abs(delta) > 180 ? 1 : 0;
        const sweepFlag = delta >= 0 ? 0 : 1;

        return `M ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX},${endY}`;
    }

    addAngleTickMarks( angleData, startRay, endRay, radius, shiftX, shiftY, tickCount )
    {
        if ( !this.showAngleTicks || tickCount <= 0 )
            return;

        const delta = this.getAngleDelta( startRay.angle, endRay.angle, angleData );
        const midAngle = startRay.angle + delta * 0.5;
        const tickLength = this.getAngleTickLength(angleData);
        const angularGap = this.getAngleTickGap() / Math.max(1, radius) * 180 / Math.PI;
        const strokeColor = angleData.color || this.strokeColor;
        const strokeWidth = typeof angleData.strokeWidth === "number" ? angleData.strokeWidth : this.strokeWidth;

        for ( let tickIndex = 0; tickIndex < tickCount; tickIndex += 1 )
        {
            const angle = midAngle + (tickIndex - (tickCount - 1) * 0.5) * angularGap;
            const radians = degreesToRadians(angle);
            const unitX = Math.cos(radians);
            const unitY = -Math.sin(radians);
            const innerRadius = radius - tickLength * 0.5;
            const outerRadius = radius + tickLength * 0.5;

            const tick = new jsvgLine();
            tick.setStrokeColor(strokeColor);
            tick.setStrokeWidth(strokeWidth);
            tick.setEndpoints(
                unitX * innerRadius + shiftX,
                unitY * innerRadius + shiftY,
                unitX * outerRadius + shiftX,
                unitY * outerRadius + shiftY
            );
            this.contentHolder.addChild(tick);
        }
    }

    addAngleMarker( angleData, startRay, endRay, shiftX, shiftY, tickCount = 1 )
    {
        const radius = typeof angleData.arcRadius === "number" ? angleData.arcRadius : this.arcRadius;
        const markerType = this.getAngleMarkerType(angleData);

        if ( markerType === "right" )
        {
            const size = typeof angleData.size === "number" ? angleData.size : 20;
            const cornerX = (startRay.unitX + endRay.unitX) * size + shiftX;
            const cornerY = (startRay.unitY + endRay.unitY) * size + shiftY;
            const d = [
                `M ${startRay.unitX * size + shiftX},${startRay.unitY * size + shiftY}`,
                `L ${cornerX},${cornerY}`,
                `L ${endRay.unitX * size + shiftX},${endRay.unitY * size + shiftY}`
            ].join(" ");
            this.contentHolder.addChild( this.createRawPath( d, {
                strokeColor: angleData.color || this.strokeColor,
                strokeWidth: typeof angleData.strokeWidth === "number" ? angleData.strokeWidth : this.strokeWidth,
                fillColor: "none"
            }));
            return;
        }

        if ( markerType === "full" || markerType === "circle" )
        {
            const fullCircle = new jsvgEllipse();
            fullCircle.setWidthAndHeight( radius * 2, radius * 2 );
            fullCircle.setPosition( shiftX, shiftY );
            fullCircle.setFillColor( "none" );
            fullCircle.setStrokeColor( angleData.color || this.strokeColor );
            fullCircle.setStrokeWidth( typeof angleData.strokeWidth === "number" ? angleData.strokeWidth : this.strokeWidth );
            this.contentHolder.addChild( fullCircle );
            return;
        }

        this.contentHolder.addChild( this.createRawPath(
            this.getArcPathData( startRay, endRay, radius, shiftX, shiftY, angleData ),
            {
                strokeColor: angleData.color || this.strokeColor,
                strokeWidth: typeof angleData.strokeWidth === "number" ? angleData.strokeWidth : this.strokeWidth,
                fillColor: "none"
            }
        ));
        this.addAngleTickMarks( angleData, startRay, endRay, radius, shiftX, shiftY, tickCount );
    }

    updateLayout()
    {
        this.contentHolder.removeAllChildren();

        const computedRays = this.rays.map((ray, index) => this.getAngleRay(ray, index));
        const angleTickCounts = this.getAngleTickCounts(computedRays);
        const bounds = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };
        const labelContext = {
            labelBoxes: [],
            pointBoxes: [
                {
                    left: -this.dotRadius,
                    right: this.dotRadius,
                    top: -this.dotRadius,
                    bottom: this.dotRadius,
                    width: this.dotRadius * 2,
                    height: this.dotRadius * 2
                }
            ],
            raySegments: computedRays.map(ray => ({
                x1: 0,
                y1: 0,
                x2: ray.x,
                y2: ray.y
            }))
        };

        for ( const ray of computedRays )
        {
            this.addBoundsPoint( bounds, ray.x, ray.y );
            const rayLabel = this.getAngleRayDisplayLabel(ray);
            if ( labelHasText(rayLabel) )
            {
                const labelPosition = this.getAngleRayLabelPosition(ray);
                const labelBox = getEstimatedLabelBox(rayLabel, labelPosition.x, labelPosition.y, {
                    fontSize: labelPosition.fontSize
                });
                labelContext.labelBoxes.push(labelBox);
                this.addBoundsBox( bounds, labelBox );
            }
        }

        if ( labelHasText(this.vertexLabel) )
        {
            const vertexLabelBox = getEstimatedLabelBox(this.vertexLabel, -18, 22, { fontSize: this.fontSize });
            labelContext.labelBoxes.push(vertexLabelBox);
            this.addBoundsBox( bounds, vertexLabelBox );
        }

        for ( const [index, angleData] of this.angles.entries() )
        {
            const startRay = this.getAngleByIndexOrName(angleData.from, computedRays) || computedRays[0];
            const endRay = this.getAngleByIndexOrName(angleData.to, computedRays) || computedRays[1];
            if ( !startRay || !endRay ) continue;

            const radius = this.getAngleOuterRadius(angleData, index, angleTickCounts);
            this.addBoundsPoint( bounds, -radius, -radius );
            this.addBoundsPoint( bounds, radius, radius );
        }

        const angleLabelLayouts = this.getAngleLabelLayouts(computedRays, labelContext, bounds, angleTickCounts);
        for ( const { layout } of angleLabelLayouts )
            this.addBoundsBox( bounds, layout.box );

        const shiftX = this.padding - bounds.minX;
        const shiftY = this.padding - bounds.minY;

        for ( const ray of computedRays )
        {
            const line = new jsvgLine();
            line.setStrokeColor( ray.color || this.strokeColor );
            line.setStrokeWidth( typeof ray.strokeWidth === "number" ? ray.strokeWidth : this.strokeWidth );
            line.setEndpoints( shiftX, shiftY, ray.x + shiftX, ray.y + shiftY );
            this.contentHolder.addChild( line );
        }

        for ( const [index, angleData] of this.angles.entries() )
        {
            const startRay = this.getAngleByIndexOrName(angleData.from, computedRays) || computedRays[0];
            const endRay = this.getAngleByIndexOrName(angleData.to, computedRays) || computedRays[1];
            if ( !startRay || !endRay ) continue;

            const tickCount = this.getAngleTickCount(angleData, index, angleTickCounts);
            this.addAngleMarker( angleData, startRay, endRay, shiftX, shiftY, tickCount );
        }

        const dot = new jsvgEllipse();
        dot.setWidthAndHeight( this.dotRadius * 2, this.dotRadius * 2 );
        dot.setPosition( shiftX, shiftY );
        dot.setFillColor( "black" );
        dot.setStrokeColor( "black" );
        dot.setStrokeWidth( 0 );
        this.contentHolder.addChild( dot );

        if ( labelHasText(this.vertexLabel) )
            this.addTranslatedText( this.vertexLabel, -18, 22, shiftX, shiftY, { italic: true } );

        for ( const ray of computedRays )
        {
            const rayLabel = this.getAngleRayDisplayLabel(ray);
            if ( !labelHasText(rayLabel) ) continue;

            const labelPosition = this.getAngleRayLabelPosition(ray);
            this.addTranslatedText(
                rayLabel,
                labelPosition.x,
                labelPosition.y,
                shiftX,
                shiftY,
                {
                    fontSize: labelPosition.fontSize,
                    italic: ray.italic !== false
                }
            );
        }

        for ( const { layout } of angleLabelLayouts )
        {
            if ( layout.mode !== "callout" ) continue;

            const leader = new jsvgLine();
            leader.setStrokeColor( "rgba(0, 0, 0, 0.55)" );
            leader.setStrokeWidth( 1 );
            leader.setEndpoints(
                layout.anchor.x + shiftX,
                layout.anchor.y + shiftY,
                layout.leaderEnd.x + shiftX,
                layout.leaderEnd.y + shiftY
            );
            this.contentHolder.addChild( leader );
        }

        for ( const { angleData, layout, labelText } of angleLabelLayouts )
        {
            this.addTranslatedText( labelText, layout.x, layout.y, shiftX, shiftY, {
                fontSize: layout.fontSize,
                italic: angleData.italic === true
            });
        }

        this.width = bounds.maxX - bounds.minX + this.padding * 2;
        this.height = bounds.maxY - bounds.minY + this.padding * 2;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}

export class omdRegularPolygon extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdRegularPolygon";

        this.radius = 5;
        this.numberOfSides = 5;
        this.unitScale = 10;

        this.showLabels = false;

        this.shapePath = new jsvgPath();
        this.shapePath.setWidthAndHeight( this.radius*this.unitScale, this.radius*this.unitScale );
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

        this.labelsHolder = new jsvgGroup();
        this.addChild( this.labelsHolder );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.radius != "undefined" )
            this.radius = data.radius;

        if ( typeof data.numberOfSides != "undefined" )
            this.numberOfSides = data.numberOfSides;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;


        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        this.updateLayout();
    }

    updateLayout()
    {
        this.shapePath.clearPoints();
        const radiusPx = this.radius * this.unitScale;
        const padding = this.showLabels ? 48 : 14;
        const centerX = radiusPx + padding;
        const centerY = radiusPx + padding;

        var angleOffset = 0;
        if ( this.numberOfSides % 2 == 1 )
        {
            angleOffset = Math.PI / this.numberOfSides * 0.5;   // shift angle for odd number of sides   
            if ( ((this.numberOfSides-1)/2) % 2 == 0 )
                angleOffset *= -1.0;
        }

        for( var i=0; i<=this.numberOfSides; i++ )
        {
            var A = -2.0 * Math.PI / this.numberOfSides * i;
            A += angleOffset;
            var pX = centerX + Math.cos(A) * radiusPx;
            var pY = centerY + Math.sin(A) * radiusPx;
            this.shapePath.addPoint( pX, pY );
        }

        this.shapePath.updatePath();

        if ( this.showLabels )
        {
            // make label
            this.labelsHolder.removeAllChildren();
            var L = new omdShapeLabelSet();
            var sideLength = 2.0 * this.radius * Math.sin( Math.PI / this.numberOfSides );
            var A = sideLength.toFixed(2);
            L.initializeWithShapePath( this.shapePath, [ A ] );
            this.labelsHolder.addChild( L );
        }

        // Set dimensions and viewBox for API compatibility
        this.width = 2.0 * radiusPx + padding * 2;
        this.height = 2.0 * radiusPx + padding * 2;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}


export class omdShapeLabelSet extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();
    }

    initializeWithShapePath( shapePath, labelTextArray=[] )
    {
        const polygonPoints = getClosedPolygonVertices(shapePath);
        const centroid = getPolygonCentroid(polygonPoints);

        // create lines
        for (let i = 0; i < polygonPoints.length; i++)
        {
            if ( i >= labelTextArray.length )
                continue;

            const labelValue = labelTextArray[i];
            const labelString = String(labelValue ?? "");
            if ( labelString.length === 0 )
                continue;
            
            // get points
            const point0 = polygonPoints[i];
            const x0 = point0.x;
            const y0 = point0.y;

            const point1 = polygonPoints[(i + 1) % polygonPoints.length];
            const x1 = point1.x;
            const y1 = point1.y;

            // get normalized vector
            let dX = x1 - x0;
            let dY = y1 - y0;
            const L = Math.sqrt( dX*dX + dY*dY );
            dX /= L;
            dY /= L;
            
            // get outward normal based on the polygon centroid rather than path winding
            const centerX = (x0 + x1) / 2.0;
            const centerY = (y0 + y1) / 2.0;
            let normalX = -1.0 * dY;
            let normalY = dX;
            const toMidX = centerX - centroid.x;
            const toMidY = centerY - centroid.y;
            if ( toMidX * normalX + toMidY * normalY < 0 )
            {
                normalX *= -1.0;
                normalY *= -1.0;
            }

            // make line
            const labelLine = new jsvgLine();
            const newLineX0 = x0 + normalX * 10.0;
            const newLineY0 = y0 + normalY * 10.0;
            const newLineX1 = x1 + normalX * 10.0;
            const newLineY1 = y1 + normalY * 10.0;
            labelLine.setEndpoints( newLineX0, newLineY0, newLineX1, newLineY1 );
            this.addChild( labelLine );

            let angle = Math.atan2( dY, dX ) * 180 / Math.PI;
            if ( angle > 90 || angle < -90 )
                angle += 180.0;

            // label text
            const textCenterX = centerX + normalX * 18.0;
            const textCenterY = centerY + normalY * 18.0;
            const labelText = new jsvgTextLine();
            labelText.setAlignment("center");
            labelText.setFontFamily( "Albert Sans" );
            labelText.setFontColor( "black" );
            labelText.setFontSize( 12 );
            labelText.setPosition( textCenterX, textCenterY );
            labelText.setRotation( angle );
            labelText.svgObject.setAttribute('dominant-baseline', 'middle');
            this.addChild( labelText );

            labelText.setText( labelString );
        }
    }

}
