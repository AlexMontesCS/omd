
import { omdColor } from "./omdColor.js";
import { omdNumber } from "./omdNumber.js";
import { omdVariable } from "./omdVariable.js";
import { omdTerm } from "./omdTerm.js";
import { omdOperator } from "./omdOperator.js";
import { omdExpression } from "./omdExpression.js";
import { omdPowerExpression } from "./omdPowerExpression.js";
import { omdRationalExpression } from "./omdRationalExpression.js";
import { omdEquation } from "./omdEquation.js";
import { omdFunction } from "./omdFunction.js";
import { omdNumberLine } from "./omdNumberLine.js";
import { omdTapeDiagram } from "./omdTapeDiagram.js";
import { omdBalanceHanger } from "./omdBalanceHanger.js";
import { omdNumberTile } from "./omdNumberTile.js";
import { omdRatioChart } from "./omdRatioChart.js";
import { omdCoordinatePlane } from "./omdCoordinatePlane.js";
import { omdSpinner } from "./omdSpinner.js";
import { omdRightTriangle } from "./omdShapes.js";
import { omdIsoscelesTriangle } from "./omdShapes.js";
import { omdRectangle } from "./omdShapes.js";
import { omdEllipse } from "./omdShapes.js";
import { omdCircle } from "./omdShapes.js";
import { omdRegularPolygon } from "./omdShapes.js";
import { omdProblem } from "./omdProblem.js";
import { jsvgGroup, jsvgTextBox, jsvgTextArea, jsvgButton, jsvgEllipse } from "@teachinglab/jsvg";

export class omdAppCanvas extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        console.log("canvas!!!");

        window.theApp = this;

        window.addEventListener("resize", this.onResize.bind(this) );
        window.addEventListener("keydown", this.onKeydown.bind(this) );
       
        // upward shift
        this.setPosition( 0, -50 );

        // AI stuff
        this.inputField = new jsvgTextArea();
        this.inputField.setPlaceholderText( "please enter your request here" );
        this.inputField.setWidthAndHeight( 600, 100 );
        this.inputField.setPosition(  100, 100 );
        this.inputField.setFontFamily( "Albert Sans" );
        this.inputField.setFontColor( "black" );
        this.inputField.setFontSize( 18 );
        this.inputField.div.style.backgroundColor = "#FFDD00"; //omdColor.lightGray;
        this.inputField.div.style.border = "0px";
        this.inputField.div.style.padding = "10px";
        this.addChild( this.inputField );

        this.inputButton = new jsvgButton();
        this.inputButton.setText( "submit" );
        this.inputButton.setFillColor( omdColor.lightGray );
        this.inputButton.setPosition( 100, 220 );
        this.inputButton.setClickCallback( this.handleSubmitClick.bind(this) );
        this.addChild( this.inputButton );

        this.responseText = new jsvgTextBox();
        this.responseText.setText("");
        this.responseText.setWidthAndHeight( 400, 30 );
        this.responseText.setPosition( 100, 260 );
        this.responseText.setFontFamily( "Albert Sans" );
        this.responseText.setFontColor( omdColor.darkGray );
        this.responseText.setFontSize( 14 );
        this.addChild( this.responseText );

        this.AIholder = new jsvgGroup();
        this.AIholder.setPosition( 100, 350 );
        this.addChild( this.AIholder );

        // resize
        this.onResize();
    }

    onKeydown( event )
    {
    }

    update()
    {
        super.update();

        window.equatorScale = 1.5;
    }

    onResize()
    {
    }

    handleSubmitClick( B )
    {
        this.responseText.setText( "working..." );

        var text = this.inputField.getText();
        console.log( text );
        this.fetchAI( text );
    }

    handleAIResponse( jsonData )
    {
        var N = null;

        if ( jsonData.omdType == "number" ) { var N = new omdNumber(); }

        if ( jsonData.omdType == "variable" ) { var N = new omdVariable(); }

        if ( jsonData.omdType == "operator" ) { var N = new omdOperator(); }
        
        if ( jsonData.omdType == "term" ) { var N = new omdTerm(); }

        if ( jsonData.omdType == "expression" ) { var N = new omdExpression(); }

        if ( jsonData.omdType == "powerExpression" ) { var N = new omdPowerExpression(); }

        if ( jsonData.omdType == "rationalExpression" ) { var N = new omdRationalExpression(); }

        if ( jsonData.omdType == "function" ) { var N = new omdFunction(); }

        if ( jsonData.omdType == "equation" ) { var N = new omdEquation(); }

        if ( jsonData.omdType == "numberLine" ) { var N = new omdNumberLine(); } 

        if ( jsonData.omdType == "balanceHanger" )
        {
            var N = new omdBalanceHanger();
            N.setPosition( 150, 0 );
        }

        if ( jsonData.omdType == "tapeDiagram" ) { var N = new omdTapeDiagram(); }

        if ( jsonData.omdType == "numberTile" ) { var N = new omdNumberTile(); }

        if ( jsonData.omdType == "ratioChart" ) { var N = new omdRatioChart(); } 

        if ( jsonData.omdType == "coordinatePlane" ) { var N = new omdCoordinatePlane(); } 

        if ( jsonData.omdType == "spinner" ) { var N = new omdSpinner(); } 

        if ( jsonData.omdType == "rightTriangle" ) { var N = new omdRightTriangle(); } 

        if ( jsonData.omdType == "isoscelesTriangle" ) { var N = new omdIsoscelesTriangle(); } 

        if ( jsonData.omdType == "rectangle" ) { var N = new omdRectangle(); } 

        if ( jsonData.omdType == "ellipse" ) { var N = new omdEllipse(); } 

        if ( jsonData.omdType == "circle" ) { var N = new omdCircle(); } 

        if ( jsonData.omdType == "regularPolygon" ) { var N = new omdRegularPolygon(); } 

        if ( jsonData.omdType == "problem" ) { var N = new omdProblem(); } 

        // load from json
        N.loadFromJSON( jsonData );

        // add to the AI holder
        var E = new omdCanvasEntry();
        E.addObject( N );
        this.AIholder.addChild( E );
        return E;
    }

    fetchAI( topic )
    {
        // console.log( "=== fetchAI ===" );
        // console.log( topic );

        // consturct url based on topic
        var urlToFetch = "";
        if ( window.location.hostname.includes("localhost") )
            urlToFetch = "http://localhost:8888/.netlify/functions/ai-omd-lookup/";
        else
            urlToFetch = "https://teaching-lab-omd.netlify.app/.netlify/functions/ai-omd-lookup/";
       
        // add topic
        urlToFetch += "?topic='" + topic + "'";
        // console.log( "URL: " + urlToFetch );

        // fetch the data
        fetch( urlToFetch )
        .then((response) => response.text())
        .then((body) => {
            
            // console.log("==== raw data ======");
            // console.log( body );

            // console.log("==== preParseData ======");
            var preParseData = body;
            preParseData = preParseData.replaceAll( "`", "" );
            preParseData = preParseData.replaceAll( "json", "" );
            console.log( "=== pre-parse ===" );
            console.log( preParseData );

            try
            {
                var data = JSON.parse( preParseData );
                console.log( "=== parsedData ===" );
                console.log( data );

                this.responseText.setText( "" );
                this.handleAIResponse( data );
            }
            catch
            {
                // if parsing failed, try again
                console.log( preParseData );
                console.log(">>> data not parse-able");
                this.responseText.setText( "An error occured. Please try again." );
            }
        });
    }

}


class omdCanvasEntry extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.clickRect = new jsvgEllipse();
        this.clickRect.setWidthAndHeight( 40,40 );
        this.clickRect.setPosition( 10,10 );
        this.clickRect.setFillColor( "transparent" );
        this.addChild( this.clickRect );

        this.clickRect.svgObject.onmousedown = this.handleMouseDown.bind( this );
        this.clickRect.svgObject.ontouchstart = this.handleMouseDown.bind( this );
        this.clickRect.svgObject.style.cursor = "pointer";

        this.backRect = new jsvgEllipse();
        this.backRect.setWidthAndHeight( 20,20 );
        this.backRect.setPosition( 10,10 );
        this.backRect.setFillColor( "#DDDDDD" );
        this.addChild( this.backRect );

        this.backRect.svgObject.onmousedown = this.handleMouseDown.bind( this );
        this.backRect.svgObject.ontouchstart = this.handleMouseDown.bind( this );
        this.backRect.svgObject.style.cursor = "pointer";
    }

    addObject( obj )
    {
        this.theObject = obj;
        obj.setPosition( 10,10 );
        this.addChild( obj );

        //var W = this.theObject.width;
        //var H = this.theObject.height;
        //this.backRect.setWidthAndHeight( W+20,H+20 );
        //this.backRect.setWidthAndHeight( 20,20 );
    }

    handleMouseDown( event )
    {
        if ( ! this.visible )
            return;

        // select
//        window.theApp.setActiveEntry( this );

        // handle dragging
        function handleMouseMove(event)
        {
            event.preventDefault();

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

                // dX /= window.dragScale;      // adjust for drag scale
                // dY /= window.dragScale;      // adjust for drag scale

                var pX = this.xpos + dX;
                var pY = this.ypos + dY;

                // move the circle
                this.setPosition( pX, pY );
            }

            // set oldMouseX and oldMouseY
            this.oldMouseX = mouseX;
            this.oldMouseY = mouseY;
        }

        // on mouse up
        function handleMouseUp(event)
        {            
            // set active dot
            // window.theApp.setActiveEntry( this );             // this forces an update to the detail panel

            // update data in firebase
            // this.updateEntryInDatabase();

            // console.log("handleMouseUp");
            // this.activeDot = null;
            window.onmousemove = null;
            window.ontouchmove = null;
            window.onmouseup = null;
            window.ontouchend = null;
            this.oldMouseX = 0;
            this.oldMouseY = 0;

            // this.dotHilite.hide();
        }

        window.onmousemove = handleMouseMove.bind(this);
        window.ontouchmove = handleMouseMove.bind(this);;
        window.onmouseup = handleMouseUp.bind(this);
        window.ontouchend = handleMouseUp.bind(this);;
    }
}