import { jsvgGroup, jsvgRect, jsvgTextLine, jsvgImage, jsvgClipMask } from './jsvg.js';

// ================ jsvgButton ================================= //

export class jsvgButton extends jsvgGroup
{
    constructor()
    {
        super();

        this.callback = null;
        this.fontSize = 12;
        this.text = 'button';
        
        // add rect
        this.backRect = new jsvgRect();
        this.backRect.setWidthAndHeight( 100,30 );
        this.backRect.setFillColor( "white" );
        this.backRect.setStrokeWidth(0);
        this.backRect.setCornerRadius( 15 );
        this.backRect.svgObject.style.cursor = "pointer";
        this.addChild( this.backRect );

        // add text
        this.buttonText = new jsvgTextLine();
        this.buttonText.setPosition(50,20);
        this.buttonText.setFontFamily( "Arial" );
        this.buttonText.setFontSize( 12 );
        this.buttonText.setText("button");
        this.buttonText.setTextAnchor("middle");
        this.buttonText.svgObject.style.cursor = "pointer";

        this.addChild( this.buttonText );
    }

    setText( T ) { this.text = T; this.buttonText.setText(T) }
    setFontFamily( F ) { this.buttonText.setFontFamily(F) }
    setFontSize( S ) { this.fontSize=S; this.buttonText.setFontSize(S) }
    setFontColor( C ) { this.buttonText.setFontColor(C) }
    setFillColor( C ) { this.backRect.setFillColor( C ) };
    setStrokeColor( C ) { this.backRect.setStrokeColor( C ) };
    setStrokeWidth( C ) { this.backRect.setStrokeWidth( C ) };
    setCornerRadius( R ) { this.backRect.setCornerRadius( R ) };

    addImage( imageURL, imageWidth=30, imageHeight=30 )
    {
        this.image = new jsvgImage();
        this.image.setImageURL( imageURL );
        this.image.setWidthAndHeight( imageWidth, imageHeight );
        this.image.setPosition( this.backRect.width/2-imageWidth/2, this.backRect.height/2-imageHeight/2 );
        this.image.svgObject.style.cursor = "pointer";
        this.addChild( this.image );
    }

    setWidthAndHeight( W, H )
    {
        this.width = W;
        this.height = H;
        this.backRect.setWidthAndHeight( W, H );
        this.buttonText.setPosition( W/2, H*0.50+2 + this.fontSize*0.25 );
        if ( this.image )
        {
            this.image.setPosition( this.backRect.width/2-this.image.width/2, 
                                    this.backRect.height/2-this.image.height/2 );
        }
    }
}


// ================ jsvgLayoutGroup ================================= //

export class jsvgLayoutGroup extends jsvgGroup
{
    constructor()
    {
        super();

        this.spacer = 10;
    }

    setSpacer( S ) 
    {
        this.spacer = S;
    }

    updateLayout()
    {
    }

    showAll()
    {
        var N = this.getNumberOfChildren();
        for ( var i=0; i<N; i++)
        {
            var C = this.getChild(i);
            C.show();
        }
    }

    showOnly( indexToShow )
    {
        var N = this.getNumberOfChildren();
        for ( var i=0; i<N; i++)
        {
            var C = this.getChild(i);
            if ( i == indexToShow )
                C.show();
            else
                C.hide();
        }
    }

    doVerticalLayout()
    {
        var N = this.getNumberOfChildren();

        // layout children from top to bottom
        var pX = 0;
        var pY = 0;
        var minW = 0;
        for ( var i=0; i<N; i++)
        {
            var C = this.getChild(i);
            if ( ! C.visible )
                continue;
            C.setPosition( pX,pY );
            pY += C.height;
            pY += this.spacer;

            if ( C.width > minW )
                minW = C.width;
        }

        // set width and height
        this.height = pY - this.spacer;
        this.width = minW;

        // horizontal center all items
        for ( var i=0; i<N; i++)
        {
            var C = this.getChild(i);
            var pX = this.width/2-C.width/2;
            C.setPosition( pX, C.ypos );
        }
    }

    doHorizontalLayout()
    {
        var N = this.getNumberOfChildren();

        // layout children from left to right
        var pX = 0;
        var pY = 0;
        var minH = 0;
        for ( var i=0; i<N; i++)
        {
            var C = this.getChild(i);
            if ( ! C.visible )
                continue;
            C.setPosition( pX,pY );
            pX += C.width;
            pX += this.spacer;

            if ( C.height > minH )
                minH = C.height;
        }

        // set width and height
        this.width = pX - this.spacer;
        this.height = minH;

        // vertically center all items
        for ( var i=0; i<N; i++)
        {
            var C = this.getChild(i);
            var pY = this.height/2-C.height/2;
            C.setPosition( C.xpos, pY  );
        }
    }
} 


// ================ jsvgScrollbox ================================= //

export class jsvgScrollbox extends jsvgGroup
{
    constructor()
    {
        super();

        this.scrollPercent = 0;
        this.scrollOffset = 0;
        this.contentHeight = 0;

        this.oldMouseX = 0;
        this.oldMouseY = 0;

        // make clip mask
        this.clipMask = new jsvgClipMask( 200,400, 10 );
        super.addChild( this.clipMask );        // use super to avoid addChild recursion

        // make background rect
        this.backRect = new jsvgRect();
        this.backRect.setFillColor("white");
        this.clipMask.addChild( this.backRect );

        // make scroll group
        this.scrollGroup = new jsvgGroup();
        this.clipMask.addChild( this.scrollGroup );

        // make scroll bar
        this.scrollBar = new jsvgRect();
        this.scrollBar.setWidthAndHeight( 10,50 );
        this.scrollBar.setCornerRadius( 5 );
        this.scrollBar.setFillColor( "darkgray" );
        this.scrollBar.setPosition( 180, 10 );
        this.scrollBar.svgObject.onmousedown = this.handleMouseDown.bind(this);
        this.scrollBar.svgObject.style.cursor = "pointer";
        this.clipMask.addChild( this.scrollBar );

        this.setWidthAndHeight( 200,500 );

        this.updateLayout();
    }

    setWidth( W )
    {
        super.setWidth( W );
        this.clipMask.setWidth( W );
        this.backRect.setWidth( W );
    }

    setHeight( H )
    {
        super.setWidth( H );
        this.clipMask.setHeight( H );
        this.backRect.setHeight( H );
    }

    setCornerRadius( R )
    {
        this.clipMask.setCornerRadius( R );
    }

    addChild( C )
    {
        this.scrollGroup.addChild( C );
    }

    handleMouseDown( event )
    {
        if ( ! this.visible )
            return;

        // handle dragging
        function handleMouseMove(event)
        {
            event.preventDefault();
            // console.log("handleMouseMove");

            // get mouseX and mouseY
            var mouseX, mouseY;
            if ( event.touches && event.touches.length >= 1 )
            {
                mouseX = event.touches[0].clientX;
                mouseY = event.touches[0].clientY;
            }
            else
            {
                mouseX = event.clientX;
                mouseY = event.clientY;
            }

            // calculate dX and dY
            if ( this.oldMouseX && this.oldMouseY )
            {
                var dX = mouseX - this.oldMouseX;
                var dY = mouseY - this.oldMouseY;

                var pY = this.scrollBar.ypos + dY;

                // enforce slider bounds
                var minY = 10;
                var maxY = this.backRect.height - this.scrollBar.height - 10;
                if ( pY < minY )
                    pY = minY;
                if ( pY > maxY )
                    pY = maxY;

                // move the circle
                this.scrollBar.setPosition( this.scrollBar.xpos, pY  );

                this.scrollPercent = (pY-minY) / (maxY-minY);
                // console.log( this.scrollPercent.toFixed(2) );

                // update layout
                this.updateLayout();
            }

            // set oldMouseX and oldMouseY
            this.oldMouseX = mouseX;
            this.oldMouseY = mouseY;
        }

        // on mouse up
        function handleMouseUp(event)
        {            
            // console.log("handleMouseUp");
            this.activeBubble = null;
            window.onmousemove = null;
            window.ontouchmove = null;
            window.onmouseup = null;
            window.ontouchend = null;
            this.oldMouseX = 0;
            this.oldMouseY = 0;
            return;
        }

        // set up events
        window.onmousemove = handleMouseMove.bind(this);
        window.ontouchmove = handleMouseMove.bind(this);;
        window.onmouseup = handleMouseUp.bind(this);
        window.ontouchend = handleMouseUp.bind(this);;
    }

    computeContentBounds()
    {
        var maxY = 0;
        var N = this.scrollGroup.getNumberOfChildren();

        // find bottom most point of all child objects
        for ( var i=0; i<N; i++ )
        {
            var C = this.scrollGroup.getChild(i);
            var bottomY = C.ypos + C.height;
            if ( bottomY > maxY )
                maxY = bottomY;
        }

        this.contentHeight = maxY;
    }

    updateLayout()
    {
        var W = this.backRect.width;
        var H = this.backRect.height;

        this.computeContentBounds();

        if ( this.contentHeight > this.backRect.height )
        {
            var maxShift = this.contentHeight - this.backRect.height;
            var scrollOffset = -1.0 * this.scrollPercent * maxShift;
            this.scrollGroup.setPosition( 0, scrollOffset );
        }
    }

}