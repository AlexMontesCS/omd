

// ================ jsvgObject ================================= //

export class jsvgObject
{
    constructor()
    {
        this.name = "";
        this.xpos = 0;
        this.scale = 1.0;
        this.rotation = 0.0;
        this.ypos = 0;
        this.width = 0;
        this.height = 0;
        this.opacity = 1.0;
        this.visible = true;
        this.svgObject = null;
        this.childList = [];
        this.parent = null;
    }

    // set properties 

    setName( N )
    {
        this.name = N;
    }

    setPosition( x, y )
    {
        this.xpos = x;
        this.ypos = y;
        this.updateTransform();
    }

    setScale( s )
    {
        this.scale = s;
        this.updateTransform();
    }

    setRotation( r )
    {
        this.rotation = r;
        this.updateTransform();
    }

    updateTransform()
    {
        // Ensure xpos and ypos are valid numbers
        const x = isNaN(this.xpos) ? 0 : this.xpos;
        const y = isNaN(this.ypos) ? 0 : this.ypos;
        
        var transformParams = " translate(" + x.toString() + "," + y.toString() + ") "
        if ( this.scale != 1.0 )
            transformParams += " scale(" + this.scale.toString()  + ")";
        if ( this.rotation != 0.0 )
            transformParams += " rotate(" + this.rotation + ")";
        this.svgObject.setAttribute("transform", transformParams );
    }

    setWidth( w )
    {
        this.width = w;
        this.svgObject.setAttribute("width", this.width.toString() );
    }

    setHeight( h )
    {
        this.height = h;
        this.svgObject.setAttribute("height", this.height.toString() );
    }

    setWidthAndHeight( w,h )
    {
        this.setWidth( w );
        this.setHeight( h );
    }

    setFillColor( color )
    {
        this.svgObject.setAttribute( "fill", color );
    }

    setStrokeColor( color )
    {
        this.svgObject.setAttribute( "stroke", color );
    }

    setStrokeWidth( sW )
    {
        this.svgObject.setAttribute( "stroke-width", sW.toString() );
    }

    setOpacity( opacity )
    {
        this.opacity = opacity;
        this.svgObject.style.opacity = opacity;
    }

    setDropShadow()
    {
        // this is a generic dropshadow
        this.svgObject.style.filter = "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.4))";
    }

    show()
    {
        this.visible = true;
        this.svgObject.style.display = "";
    }

    hide()
    {
        this.visible = false;
        this.svgObject.style.display = "none";
    }

    // update

    update()
    {
        if ( ! this.visible )
            return;
        
        for( var C of this.childList )
        {
            C.update();
        }
    }

    // child stuff

    addChild( child )
    {
        if ( this.svgObject && child.svgObject )
        {
            this.childList.push( child );
            this.svgObject.appendChild( child.svgObject );
            child.parent = this;
        }
    }

    getChild( index )
    {
        return this.childList[index];
    }

    replaceChild( newChild, oldChild )
    {
        // replace the node
        this.svgObject.replaceChild( newChild.svgObject, oldChild.svgObject );

        // replace in childList
        for ( var i=0; i<this.childList.length; i++ )
        {
            if ( this.childList[i] == oldChild )
            {
                this.childList[i] = newChild;
                break;
            }
        }

        oldChild.parent = null;
        newChild.parent = this;
    }

    getNumberOfChildren()
    {
        return this.childList.length;
    }

    removeChild( C )
    {
        const index = this.childList.indexOf(C);
        this.removeChildByIndex( index );
        C.parent = null;
    }

    removeChildByIndex( index )
    {
        if (index >= 0) 
        { 
            var C = this.childList[index];
            this.childList.splice(index, 1);
            this.svgObject.removeChild( C.svgObject );
            C.parent = null;
        }
    }

    removeAllChildren()
    {
        while( this.svgObject.firstChild ) 
        {
            this.svgObject.removeChild( this.svgObject.lastChild );
        }
        this.childList = [];
    }

    sortChildren( sortFunction )
    {
        this.childList.sort( sortFunction );

        // If the  child is a reference to an existing node in the document, appendChild() moves it from its current position to the new positio
        this.childList.forEach(child => this.svgObject.appendChild( child.svgObject ));
    }

    // set up events
    setClickCallback( callback )
    {
        if ( this.svgObject )
        {
            var outerThis = this;
            this.svgObject.onclick = function() { callback(outerThis) };
            this.svgObject.style.cursor = "pointer";
        }
    }

    enableDragging()
    {
        this.svgObject.style.cursor = "pointer";

        // on mouse down
        var outerThis = this;
        this.svgObject.onmousedown = function(E) 
        {
            // console.log("mouse down");
            outerThis.lastX = E.clientX;
            outerThis.lastY = E.clientY;
            
            // register on mouse move function (unregister on mouseup)
            window.onmousemove = function(E)
            {
                // console.log("mouse move");
                var dX = E.clientX - outerThis.lastX;       // this method works if there's no scaling or rotation
                var dY = E.clientY - outerThis.lastY;
                outerThis.lastX = E.clientX;
                outerThis.lastY = E.clientY;
                outerThis.setPosition( outerThis.xpos+dX, outerThis.ypos+dY );
            }

            // on mouse up
            window.onmouseup = function() 
            {
                // console.log("mouse up");
                window.onmousemove = null;
            }
        }
    }
}


// ================ jsvgContainer ================================= //

export class jsvgContainer extends jsvgObject
{
    constructor()
    {
        super();

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "svg");
        this.svgObject.setAttribute("x", "0");
        this.svgObject.setAttribute("y", "0");
        this.svgObject.setAttribute("width", "500");
        this.svgObject.setAttribute("height", "500");
        this.svgObject.setAttribute("backgroundColor", "blue");
    }

    setViewbox( w, h )
    {
        this.setWidth(w);
        this.setHeight(h);
        var viewBoxParams = "0 0 " + w.toString() + " " + h.toString();
        this.svgObject.setAttribute("viewBox", viewBoxParams );
    }
}

// ================ jsvgGroup ================================= //

export class jsvgGroup extends jsvgObject
{
    constructor()
    {
        super();

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "g");
        this.svgObject.setAttribute("x", "0");
        this.svgObject.setAttribute("y", "0");
        this.svgObject.setAttribute("width", "500");
        this.svgObject.setAttribute("height", "500");
        this.svgObject.setAttribute("viewBox", "0 0 500 500");
    }
}

// ================ jsvgLine ================================= //

export class jsvgLine extends jsvgObject
{
    constructor()
    {
        super();

        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 100;
        this.y2 = 100;

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "line");
        this.svgObject.setAttribute("x1", "0");
        this.svgObject.setAttribute("y1", "0");
        this.svgObject.setAttribute("x2", "100");
        this.svgObject.setAttribute("y2", "100");
        
        this.setStrokeColor("black");
        this.setStrokeWidth( 1 );

        this.setEndpointA( this.x1, this.y1 );
        this.setEndpointB( this.x2, this.y2 );
    }

    setEndpointA( x, y )
    {
        this.x1 = x;
        this.y1 = y;
        this.svgObject.setAttribute("x1", x.toString() );
        this.svgObject.setAttribute("y1", y.toString() );
    }

    setEndpointB( x, y )
    {
        this.x2 = x;
        this.y2 = y;
        this.svgObject.setAttribute("x2", x.toString() );
        this.svgObject.setAttribute("y2", y.toString() );
    }

    setEndpoints( x1,y1, x2,y2 )
    {
        this.setEndpointA( x1,y1 );
        this.setEndpointB( x2,y2 );
    }
}

// ================ jsvgRect ================================= //

export class jsvgRect extends jsvgObject
{
    constructor()
    {
        super();

        this.cornerRadius = 0;

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "rect");
        this.setWidthAndHeight( 100,100 );
        this.setFillColor( "white" );
        this.setStrokeColor( "black" );
        this.setStrokeWidth( 0 );
    }

    setCornerRadius( r )
    {
        this.cornerRadius = r;
        this.svgObject.setAttribute( "rx", r.toString() );
        this.svgObject.setAttribute( "ry", r.toString() );
    }
}

// ================ jsvgEllipse ================================= //

export class jsvgEllipse extends jsvgObject
{
    constructor()
    {
        super();

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "ellipse");

        this.setPosition( 0,0 );
        this.setWidthAndHeight( 100,100 );
        this.setFillColor( "white" );
        this.setStrokeColor( "black" );
        this.setStrokeWidth( 0 );
    }

    setWidth( w )
    {
        this.width = w;
        this.svgObject.setAttribute("rx", (this.width/2).toString() );
    }

    setHeight( h )
    {
        this.height = h;
        this.svgObject.setAttribute("ry", (this.height/2).toString() );
    }
}


// ================ jsvgArc ================================= //

export class jsvgArc extends jsvgObject
{
    constructor()
    {
        super();

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "path");
        
        this.setFillColor("white");
        this.setStrokeColor("black");
        this.setStrokeWidth(0);
    }

    createPieSlice(radius, startAngle, endAngle)
    {
        // Convert polar coordinates to Cartesian for SVG arc
        function polarToCartesian(radius, angleInDegrees) 
        {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
            return {
                x: (radius * Math.cos(angleInRadians)),
                y: (radius * Math.sin(angleInRadians))
            };
        }
        
        const start = polarToCartesian(radius, endAngle);
        const end = polarToCartesian(radius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        const d = [
            `M ${0} ${0}`, // Move to center
            `L ${start.x} ${start.y}`, // Draw line to start of arc
            `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, // Draw arc
            `Z` // Close path to center
        ].join(" ");

        this.svgObject.setAttribute("d", d);
    }
}

// ================ jsvgPath ================================= //

export class jsvgPath extends jsvgObject
{
    constructor() 
    {  
        super();

        // Create the path element and add it to the SVG element
        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.path.setAttribute("fill", "none"); // Default fill is none
        this.path.setAttribute("stroke", "black"); // Default stroke is black
        this.path.setAttribute("stroke-width", "2"); // Default stroke width
        // this.svgElement.appendChild(this.path);

        this.svgObject = this.path;

        // Initialize the points array
        this.points = [];

        // Update the path's 'd' attribute
        this.updatePath();
    }
  
    addPoint(x, y) 
    {
        if (typeof x !== "number" || typeof y !== "number") 
        {
            throw new Error("Coordinates must be numbers.");
        }

        this.points.push({ x:x, y:y });
        
        // must call updatePath to see new points
    }
  
    updatePath() 
    {
        if (this.points.length === 0)
        {
            this.path.setAttribute("d", "");
            return;
        }
  
        // Create the 'd' attribute for the path
        const d = this.points
            .map((point, index) => (index === 0 ? `M ${point.x},${point.y}` : `L ${point.x},${point.y}`))
            .join(" ");
  
        // Close the polygon if it has at least three points
        const pathData = d;
  
        this.path.setAttribute("d", pathData);
    }

    clearPoints() 
    {
        this.points = [];
        this.updatePath();
    }
}


// ================ jsvgClipMask ================================= //

export class jsvgClipMask extends jsvgObject
{
    constructor( width=300, height=300, cornerRadius=10 ) 
    {  
        super();

        // make a new svg group
        const svgNamespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNamespace, "g");
        this.svgObject = svg;

        this.width = width;
        this.height = height;
        this.cornerRadius = cornerRadius;

        this.maskID = "clipMaskID" + Math.random();

        svg.setAttribute("width", this.width);
        svg.setAttribute("height", this.height);
        svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    
        // Create a clipPath to apply rounded corners
        const clipPath = document.createElementNS(svgNamespace, "clipPath");
        clipPath.setAttribute("id", this.maskID );
    
        this.clipRect = document.createElementNS(svgNamespace, "rect");
        this.clipRect.setAttribute("x", 0);
        this.clipRect.setAttribute("y", 0);
        this.clipRect.setAttribute("width", this.width);
        this.clipRect.setAttribute("height", this.height);
        this.clipRect.setAttribute("rx", this.cornerRadius); // Rounded corner radius
        this.clipRect.setAttribute("ry", this.cornerRadius);
    
        clipPath.appendChild(this.clipRect);
        svg.appendChild(clipPath); 
        
        // we create an inner group that gets masked
        // all children get added this group
        this.clipGroup = new jsvgGroup();
        this.clipGroup.svgObject.setAttribute("clip-path", `url(#${this.maskID})`);
        super.addChild( this.clipGroup );   // use super to avoid recursion
    }

    setWidth( width )
    {
        this.width = width;

        this.svgObject.setAttribute("width", this.width);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
        this.clipRect.setAttribute("width", this.width);
    }

    setHeight( height )
    {
        this.height = height;

        this.svgObject.setAttribute("height", this.height);
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
        this.clipRect.setAttribute("height", this.height);
    }

    // setWidthAndHeight( width, height )
    // {
    //     this.width = width;
    //     this.height = height;

    //     this.svgObject.setAttribute("width", this.width);
    //     this.svgObject.setAttribute("height", this.height);
    //     this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);

    //     this.clipRect.setAttribute("width", this.width);
    //     this.clipRect.setAttribute("height", this.height);
    // }

    setCornerRadius( cornerRadius ) 
    {
        this.cornerRadius = cornerRadius;
        this.clipRect.setAttribute("rx", this.cornerRadius); // Rounded corner radius
        this.clipRect.setAttribute("ry", this.cornerRadius);
    }

    addChild( obj )
    {
        // add to masked clip group
        this.clipGroup.addChild( obj );
    }
}




// ================ jsvgImage ================================= //

export class jsvgImage extends jsvgObject
{
    constructor()
    {
        super();

        this.preserveAspectRatio = true;

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "image");
        this.setWidthAndHeight( 100,100 );
    }

    setImageURL( newURL )
    {
        this.svgObject.setAttribute("href", newURL );
        this.imageURL = newURL;
    }

    setAspectRatio( svgAspectRatio )
    {
        // to fill the whole space use "xMidYMid slice"
        this.svgObject.setAttribute("preserveAspectRatio", svgAspectRatio );
    }

    applyRoundedCorners( cornerRadius, svgAspectRatio = 0 )
    {
        // remove the original image
        if ( this.svgObject )
            this.svgObject.remove();

        // make a new svg image
        const svgNamespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNamespace, "g");
        this.svgObject = svg;

        svg.setAttribute("width", this.width);
        svg.setAttribute("height", this.height);
        svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    
        // Create a clipPath to apply rounded corners
        const clipPath = document.createElementNS(svgNamespace, "clipPath");
        clipPath.setAttribute("id", "rounded-corners");
    
        const rect = document.createElementNS(svgNamespace, "rect");
        rect.setAttribute("x", 0);
        rect.setAttribute("y", 0);
        rect.setAttribute("width", this.width);
        rect.setAttribute("height", this.height);
        rect.setAttribute("rx", cornerRadius); // Rounded corner radius
        rect.setAttribute("ry", cornerRadius);
    
        clipPath.appendChild(rect);
        svg.appendChild(clipPath);
    
        // Create the image element
        const image = document.createElementNS(svgNamespace, "image");
        image.setAttribute("href", this.imageURL );
        image.setAttribute("width", this.width);
        image.setAttribute("height", this.height);
        image.setAttribute("clip-path", "url(#rounded-corners)");
        if ( svgAspectRatio )
            image.setAttribute("preserveAspectRatio", svgAspectRatio );

        svg.appendChild(image);
    }
}


// ================ jsvgTextLine ================================= //

export class jsvgTextLine extends jsvgObject
{
    constructor()
    {
        super();

        this.text = "";

        const svgNS = "http://www.w3.org/2000/svg";
        this.svgObject = document.createElementNS(svgNS, "text");
        this.svgObject.textContent = "hello world";
        this.svgObject.setAttribute("x", "0");       // x-coordinate of the rectangle
        this.svgObject.setAttribute("y", "0");       // y-coordinate of the rectangle
        this.svgObject.setAttribute("fill", "black");  // fill color of the rectangle
        this.svgObject.style.fontFamily = "Arial, Helvetica, sans-serif;";
    }

    setText( text ) { this.text = text; this.svgObject.textContent = text;  }
    getText() { return this.text; }

    setFontSize( S ) { this.svgObject.style.fontSize = S.toString() + 'px'; }

    setFontFamily( F ) { this.svgObject.style.fontFamily = F; }

    setFontColor( C ) { this.svgObject.style.fill = C; }

    setTextAnchor( A )
    {
        // left, middle or right
        this.svgObject.setAttribute("text-anchor", A );  // fill color of the rectangle
    }

    setAlignment( A ) 
    {
        this.alignment = A;
        if ( A == 'left' )
            this.setTextAnchor( 'start' );
        if ( A == 'center' )
            this.setTextAnchor( 'middle' );
        if ( A == 'right' )
            this.setTextAnchor( 'end' );
    }   

    setFontWeight( W ) { 
        this.svgObject.style.fontWeight = W.toString(); 
    }
}


// ================ jsvgTextBox (Div) ================================= //

export class jsvgTextBox extends jsvgGroup
{
    constructor()
    {
        super();

        this.text = "";
        
        var ns = 'http://www.w3.org/2000/svg';
        this.foreignObject = document.createElementNS( ns, 'foreignObject');

        this.foreignObject.style.backgroundColor = 'none';
        this.svgObject.appendChild( this.foreignObject );

        this.div = document.createElement('div');
        this.foreignObject.appendChild( this.div ); 

        this.setWidthAndHeight( 200,100 );
    }

    setText( T ) { this.text = T; this.div.innerHTML = T; }

    getText() { return this.text; }

    setStyle( S )   // for style setting with CSS
    { 
        this.div.className = S; 
        this.div.style.position = 'fixed';      // for safari
    };       

    setFontFamily( F ) { this.div.style.fontFamily = F; }

    setFontSize( S ) { this.div.style.fontSize = S.toString() + "px"; }

    setLineHeight( H ) { this.div.style.lineHeight = H + 'px'; }

    setFontWeight( W ) { this.div.style.fontWeight = W; }

    setFontColor( C )  { this.div.style.color = C; }

    setAlignment( A )  { this.div.style.textAlign = A; }
    
    setVerticalCentering()
    {
        this.div.style.display = "flex";
        this.div.style.flexFlow = "column"
        this.div.style.justifyContent = "center";
        this.div.style.alignItems = "center";
    }

    makeEditable()
    {
        this.div.style.contentEditable = 'true';
        this.div.onclick = function() { console.log("here"); this.focus(); };
    }

    setBorderWidthAndColor( width, color ) { this.div.style.border = width + "px solid " + color; }

    setWidth( W )
    { 
        this.width = W;
        if ( this.div )
            this.div.style.width = W  + 'px' 

        if ( this.foreignObject )
            this.foreignObject.setAttribute('width', W );
    }

    setHeight( H )
    { 
        this.height = H;
        if ( this.div )
            this.div.style.height = H  + 'px' 

        if ( this.foreignObject )
            this.foreignObject.setAttribute('height', H );
    }
}



// ================ jsvgTextInput ================================= //

export class jsvgTextInput extends jsvgTextBox
{
    constructor()
    {
        super();

        this.callback = null;
        
        // remove the generic div before replacing it
        this.foreignObject.removeChild( this.div );

        this.div = document.createElement('input');
        this.div.contentEditable = true;

        this.div.onkeyup = this.handleInput.bind(this);
        this.foreignObject.appendChild( this.div ); 

        this.setWidthAndHeight( 200,30 );
        this.setPlaceholderText("placeholder");
    }

    setStyle( S )   // for style setting with CSS
    { 
        this.div.className = S; 
    }; 

    setPlaceholderText( T ) { this.div.placeholder = T }

    setText( T ) { this.div.value = T; }

    getText() { return this.div.value; }

    setInputCallback( callback ) { this.callback = callback; }   // the callback is a function which receives text

    handleInput( event )
    {
        if ( event.key == 'Enter' || event.keyCode==13 )
        {
            if ( this.callback )
                this.callback( this.div.value )
        }
    }
}


// ================ jsvgTextArea ================================= //

export class jsvgTextArea extends jsvgTextBox
{
    constructor()
    {
        super();

        this.callback = null;
        
        // remove the generic div before replacing it
        this.foreignObject.removeChild( this.div );

        this.div = document.createElement('textarea');

        this.div.onkeyup = this.handleInput.bind(this);
        this.foreignObject.appendChild( this.div ); 

        this.setWidthAndHeight( 200,30 );
        this.setPlaceholderText("placeholder");
    }

    setText( T ) { this.div.value = T; }
    getText() { return this.div.value; }

    setStyle( S )   // for style setting with CSS
    { 
        this.div.className = S; 
    }; 

    handleInput( event )
    {
        if ( this.callback )
            this.callback( this );
    }

    setPlaceholderText( T ) { this.div.placeholder = T }

    setInputCallback( callback ) { this.callback = callback; }   // the callback is a function which receives text

}
