
import { omdColor } from "./omdColor.js";
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

        let padding = 16;
        if ( hasLabels ) padding = Math.max(padding, 36);
        if ( labelHasText(this.outsideTopLabel) ) padding = Math.max(padding, 56);

        const frontTL = { x: padding, y: padding + depthDy };
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

        this.hiddenEdgeHolder.removeAllChildren();
        if ( this.showHiddenEdges )
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
            const lengthLabelX = (frontBL.x + frontBR.x) * 0.5;
            const lengthLabelY = frontBL.y + 12;

            const heightLabelX = frontBR.x + 12;
            const heightLabelY = (frontTR.y + frontBR.y) * 0.5;

            const widthAngleRadians = Math.atan2(backTR.y - frontTR.y, backTR.x - frontTR.x);
            const widthNormalX = -Math.sin(widthAngleRadians);
            const widthNormalY = Math.cos(widthAngleRadians);
            const widthLabelX = (frontTR.x + backTR.x) * 0.5 + widthNormalX * 16;
            const widthLabelY = (frontTR.y + backTR.y) * 0.5 + widthNormalY * 16;

            if ( labelHasText(labels.length) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    labels.length,
                    lengthLabelX,
                    lengthLabelY,
                    { fontSize: this.labelFontSize }
                ));
            }

            if ( labelHasText(labels.height) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    labels.height,
                    heightLabelX,
                    heightLabelY,
                    { fontSize: this.labelFontSize }
                ));
            }

            if ( labelHasText(labels.width) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    labels.width,
                    widthLabelX,
                    widthLabelY,
                    { fontSize: this.labelFontSize }
                ));
            }

            if ( labelHasText(this.insideLabel) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    this.insideLabel,
                    (frontTL.x + frontBR.x) * 0.5,
                    frontBL.y + 30,
                    { fontSize: this.labelFontSize }
                ));
            }

            if ( labelHasText(this.outsideTopLabel) )
            {
                this.labelsHolder.addChild(createShapeTextLabel(
                    this.outsideTopLabel,
                    (backTL.x + backTR.x) * 0.5,
                    backTL.y - 20,
                    { fontSize: this.labelFontSize }
                ));
            }
        }

        this.width = Math.max(frontBR.x, backBR.x) + padding;
        this.height = Math.max(frontBR.y, backBR.y) + padding;
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
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

        this.shapePath = new jsvgEllipse();
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

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        if ( typeof data.showLabels != "undefined" )
            this.showLabels = data.showLabels;

        this.updateLayout();
    }

    updateLayout()
    {
        const diameter = 2.0 * this.radius * this.unitScale;
        const radiusPx = this.radius * this.unitScale;
        const centerX = radiusPx + 10;
        const centerY = radiusPx + 10;

        this.shapePath.setWidthAndHeight( diameter, diameter );
        this.shapePath.setPosition( centerX, centerY );

        this.labelsHolder.removeAllChildren();
        if ( this.showLabels )
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
        this.width = 2.0 * this.radius * this.unitScale + 20;
        this.height = 2.0 * this.radius * this.unitScale + 20;
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
