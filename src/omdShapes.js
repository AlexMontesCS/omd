
import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgPath, jsvgLine, jsvgTextLine, jsvgEllipse } from "@teachinglab/jsvg";

const DEFAULT_SHAPE_PADDING = 10;
const LABEL_SHAPE_PADDING = 38;

function getShapePadding(showLabels) {
    return showLabels ? LABEL_SHAPE_PADDING : DEFAULT_SHAPE_PADDING;
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

        this.updateLayout();
    }

    updateLayout()
    {
        // Center the rectangle within the viewBox
        const padding = getShapePadding(this.showLabels);
        const offsetX = padding;
        const offsetY = this.unitScale * this.rectHeight + padding;

        this.shapePath.clearPoints();
        this.shapePath.addPoint(offsetX, offsetY);
        this.shapePath.addPoint(offsetX + this.unitScale * this.rectWidth, offsetY);
        this.shapePath.addPoint(offsetX + this.unitScale * this.rectWidth, offsetY - this.unitScale * this.rectHeight);
        this.shapePath.addPoint(offsetX, offsetY - this.unitScale * this.rectHeight);
        this.shapePath.addPoint(offsetX, offsetY);

        this.shapePath.updatePath();

        if ( this.showLabels )
        {
            this.labelsHolder.removeAllChildren();
            var L = new omdShapeLabelSet();
            var A = this.rectWidth.toString();
            var B = this.rectHeight.toString();
            L.initializeWithShapePath( this.shapePath, [A,B,"",""] );
            this.labelsHolder.addChild( L );
        }

        // Set viewBox
        this.width = this.unitScale * this.rectWidth + padding * 2;
        this.height = this.unitScale * this.rectHeight + padding * 2;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
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
