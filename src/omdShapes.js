
import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgPath, jsvgLine, jsvgTextLine, jsvgEllipse } from "@teachinglab/jsvg";

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
        const offsetX = 10; // Left margin
        const offsetY = this.unitScale * this.verticalLeg + 10; // Bottom margin

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
        this.width = this.unitScale * this.horizontalLeg + 20;
        this.height = this.unitScale * this.verticalLeg + 20;
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

        this.shapePath.addPoint( -0.5*this.unitScale*this.triangleBase, 0 );
        this.shapePath.addPoint(  0.5*this.unitScale*this.triangleBase, 0 );
        this.shapePath.addPoint( 0, -1.0*this.unitScale*this.triangleHeight );
        this.shapePath.addPoint( -0.5*this.unitScale*this.triangleBase, 0 );

        this.shapePath.updatePath();

        if ( this.showLabels )
        {
            this.labelsHolder.removeAllChildren();
            var L = new omdShapeLabelSet();
            L.initializeWithShapePath( this.shapePath );
            this.labelsHolder.addChild( L );
        }

        // Set dimensions and viewBox for API compatibility
        this.width = this.unitScale * this.triangleBase + 20;
        this.height = this.unitScale * this.triangleHeight + 20;
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
        const offsetX = 10;
        const offsetY = this.unitScale * this.rectHeight + 10;

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
        this.width = this.unitScale * this.rectWidth + 20;
        this.height = this.unitScale * this.rectHeight + 20;
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

        this.shapePath = new jsvgEllipse();
        this.shapePath.setWidthAndHeight( this.rectWidth*this.unitScale, this.rectHeight*this.unitScale );
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

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

        this.updateLayout();
    }

    updateLayout()
    {
        this.shapePath.setWidthAndHeight( this.rectWidth*this.unitScale, this.rectHeight*this.unitScale );

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

        this.shapePath = new jsvgEllipse();
        this.shapePath.setWidthAndHeight( this.radius*this.unitScale, this.radius*this.unitScale );
        this.shapePath.setStrokeColor( "black" );
        this.shapePath.setStrokeWidth( 2 );
        this.shapePath.setFillColor( omdColor.lightGray );
        this.addChild( this.shapePath );

        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.radius != "undefined" )
            this.radius = data.radius;

        if ( typeof data.unitScale != "undefined" )
            this.unitScale = data.unitScale;

        this.updateLayout();
    }

    updateLayout()
    {
        this.shapePath.setWidthAndHeight( 2.0*this.radius*this.unitScale, 2.0*this.radius*this.unitScale );

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
            var pX = Math.cos(A) * this.radius * this.unitScale;
            var pY = Math.sin(A) * this.radius * this.unitScale;
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
        this.width = 2.0 * this.radius * this.unitScale + 20;
        this.height = 2.0 * this.radius * this.unitScale + 20;
        this.svgObject.setAttribute('viewBox', `-${this.width/2} -${this.height/2} ${this.width} ${this.height}`);
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
        // this assumes counterclockwise path

        // create lines
        for( var i=0; i<shapePath.points.length-1; i++ )
        {
            if ( i >= labelTextArray.length || labelTextArray[i].length == 0 )
                continue;
            
            // get points
            var point0 = shapePath.points[i];
            var x0 = point0.x;
            var y0 = point0.y;

            var point1 = shapePath.points[i+1];
            var x1 = point1.x;
            var y1 = point1.y;

            // get normalized vector
            var dX = x1 - x0;
            var dY = y1 - y0;
            var L = Math.sqrt( dX*dX + dY*dY );
            dX /= L;
            dY /= L;
            
            // get normal
            var normalX = -1.0 * dY;
            var normalY = dX;

            // make line
            var labelLine = new jsvgLine();
            var newLineX0 = x0 + normalX * 10.0;
            var newLineY0 = y0 + normalY * 10.0;
            var newLineX1 = x1 + normalX * 10.0;
            var newLineY1 = y1 + normalY * 10.0;
            labelLine.setEndpoints( newLineX0, newLineY0, newLineX1, newLineY1 );
            this.addChild( labelLine );

            // center point
            var centerX = (x0 + x1) / 2.0;
            var centerY = (y0 + y1) / 2.0;

            var angle = Math.atan2( dY, dX );
            angle *= 180 / Math.PI;
            angle += 180.0;
            angle = angle % 360.0;
            var originalAngle = angle;            

            // flip upside-down text
            var offset = 0;
            if ( angle > 90 && angle < 270 )
            {
                angle -= 180.0;
                offset += 10.0;
            }

            // label text
            var textCenterX = centerX + normalX * (15.0+offset);
            var textCenterY = centerY + normalY * (15.0+offset);
            var labelText = new jsvgTextLine();
            labelText.setAlignment("center");
            labelText.setFontFamily( "Albert Sans" );
            labelText.setFontColor( "black" );
            labelText.setFontSize( 12 );
            labelText.setPosition( textCenterX, textCenterY );
            labelText.setRotation( angle );
            this.addChild( labelText );

            labelText.setText( labelTextArray[i] );
        }
    }

}

