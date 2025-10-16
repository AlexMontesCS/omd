
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
import { jsvgGroup } from "@teachinglab/jsvg";

export class omdApp extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        window.addEventListener("resize", this.onResize.bind(this) );
        window.addEventListener("keydown", this.onKeydown.bind(this) );
       
        // upward shift
        this.setPosition( 0, -50 );

        var N = new omdNumber( 100 );
        N.setPosition( 100,100 );
        this.addChild( N );

        var V = new omdVariable('x');
        V.setPosition( 100, 150 );
        this.addChild( V );

        var T = new omdTerm( 3, 'x', 2 );
        T.setPosition( 100, 200 );
        this.addChild( T );

        var P = new omdOperator('*');
        P.setPosition( 100, 250 );
        this.addChild( P );

        var E = new omdExpression();
        // E.addTerm( 5 );
        // E.addOperator( '+' );
        // E.addTerm( 4 );
        // E.addOperator( '-');
        // E.addTerm( 3,'x', 2 );
        E.loadFromJSON( expressionSample );
        E.setPosition( 100, 300 );
        this.addChild( E )
        
        var PE = new omdPowerExpression();
            var E2 = new omdExpression();
            E2.addTerm( 7 );
            E2.addOperator( '-' );
            E2.addTerm( 5, 'x' );
        PE.setExpressionAndPower( E2, new omdTerm(3,'x',2) );
        PE.setPosition( 100, 370 );
        this.addChild( PE );

        var RE = new omdRationalExpression();
        var EN = new omdExpression();
            EN.addTerm( 7 );
            EN.addOperator( '-' );
            EN.addTerm( 5, 'x' );
        var ED = new omdExpression();
            ED.addTerm( 3, 'x' );
            ED.addOperator( '+' );
            ED.addTerm( 2 );
            ED.addOperator( '-' );
            ED.addTerm( 3 );
            var pow = new omdPowerExpression();
                var E3 = new omdExpression();
                E3.addTerm("4", "x", "3");
                E3.addOperator("x");
                E3.addTerm("5", "y", "2");
            pow.setExpressionAndPower(ED, E3);
        RE.setNumeratorAndDenominator( ED, EN );
        RE.setPosition( 100, 440 );
        this.addChild( RE );

        var F = new omdFunction();
        var ER = new omdExpression();
            ER.addTerm( 3, 'x' );
            ER.addOperator( '+' );
            ER.addTerm( 2 );
        F.setNameVariableAndExpression( "f", "x", ER );
        F.setPosition( 100, 540 );
        this.addChild( F );

        var EQ = new omdEquation();
        var EL = new omdExpression();
            EL.addTerm( 7 );
            EL.addOperator( '-' );
            EL.addTerm( 5, 'x' );
        var ER = new omdExpression();
            ER.addTerm( 3, 'x' );
            ER.addOperator( '+' );
            ER.addTerm( 2 );
        EQ.setLeftAndRightExpressions( EL, ER );
        EQ.setPosition( 100, 610 );
        this.addChild( EQ );

        var L = new omdNumberLine();
        L.loadFromJSON( numberLineSample );
        L.setPosition( 400, 100 );
        L.updateLayout();
        this.addChild( L );

        var T = new omdTapeDiagram();
        T.loadFromJSON( tapeDiagramSample );
        T.setPosition( 400, 200 );
        this.addChild( T );

        T = new omdTapeDiagram();
        T.loadFromJSON( tapeDiagramSample2 );
        T.setPosition( 400, 300 );
        this.addChild( T );

        // var B = new omdBalanceHanger();
        // B.loadFromJSON( balanceHangerSample );
        // B.setPosition( 450, 400 );
        // this.addChild( B );

        var B = new omdBalanceHanger();
        B.loadFromJSON( balanceHangerSample2 );
        B.setPosition( 300, 100 );
        this.addChild( B );

        var T = new omdNumberTile();
        T.setValue( 8 );
        T.setSize( 'medium' );
        T.setPosition( 380, 620 );
        this.addChild( T );

        var P = new omdRatioChart();
        P.setValues( 3,5 );
        P.setSize( 'large' );
        P.setPosition( 550-60, 670-60 );
        P.setRenderType('pie');
        this.addChild( P );

        var P = new omdRatioChart();
        P.setValues( 3,5 );
        P.setSize( 'medium' );
        P.setPosition( 620, 620 );
        P.setRenderType('dots');
        this.addChild( P );

        var P = new omdRatioChart();
        P.setValues( 3,5 );
        P.setSize( 'large' );
        P.setPosition( 520, 740 );
        P.setRenderType('bar');
        this.addChild( P );

        var G = new omdCoordinatePlane();
        G.setPosition( 350,380 );
        G.setGraphFunction( "1/2/(x)" );
        G.setDotValues( [ [1,1], [3,2], [-3,2] ] );
        G.setSize( "medium" );
        this.addChild( G );

        G = new omdCoordinatePlane();
        G.setPosition( 570,380 );
        G.loadFromJSON( planeWithShapes );
        this.addChild( G );

        var S = new omdSpinner();
        S.setPosition( 870-60,670-60 );
        S.setDivisions( 8 );
        S.setArrowPosition( 3 );
        S.setSize( "large" );
        this.addChild( S );

        S = new omdRightTriangle();
        S.setPosition( 340,860 );
        S.loadFromJSON( rightTriangleSample );
        this.addChild( S );

        S = new omdIsoscelesTriangle();
        S.setPosition( 420,860 );
        S.loadFromJSON( isoscelesTriangleSample );
        this.addChild( S );

        S = new omdRectangle();
        S.setPosition( 470,860 );
        S.loadFromJSON( rectangleSample );
        this.addChild( S );

        S = new omdEllipse();
        S.setPosition( 650,830 );
        S.loadFromJSON( ellipseSample );
        this.addChild( S );

        S = new omdCircle();
        S.setPosition( 750,830 );
        S.loadFromJSON( circleSample );
        this.addChild( S );

        S = new omdRegularPolygon();
        S.setPosition( 830,830 );
        S.loadFromJSON( regularPolygonSample );
        this.addChild( S );

        // AI stuff
        this.inputField = new jsvgTextArea();
        this.inputField.setPlaceholderText( "please enter your request here" );
        this.inputField.setWidthAndHeight( 400, 100 );
        this.inputField.setPosition(  800, 100 );
        this.inputField.setFontFamily( "Albert Sans" );
        this.inputField.setFontColor( "black" );
        this.inputField.setFontSize( 14 );
        this.inputField.div.style.backgroundColor = omdColor.lightGray;
        this.inputField.div.style.border = "0px";
        this.inputField.div.style.padding = "10px";
        this.addChild( this.inputField );

        this.inputButton = new jsvgButton();
        this.inputButton.setText( "submit" );
        this.inputButton.setFillColor( omdColor.lightGray );
        this.inputButton.setPosition( 800, 220 );
        this.inputButton.setClickCallback( this.handleSubmitClick.bind(this) );
        this.addChild( this.inputButton );

        this.responseText = new jsvgTextBox();
        this.responseText.setText("");
        this.responseText.setWidthAndHeight( 400, 30 );
        this.responseText.setPosition( 920, 225 );
        this.responseText.setFontFamily( "Albert Sans" );
        this.responseText.setFontColor( omdColor.darkGray );
        this.responseText.setFontSize( 14 );
        this.addChild( this.responseText );

        this.AIholder = new jsvgGroup();
        this.AIholder.setPosition( 800, 350 );
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
        this.AIholder.removeAllChildren();

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

        // load from json
        N.loadFromJSON( jsonData );

        // add to the AI holder
        this.AIholder.addChild( N );
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
            // console.log( "=== pre-parse ===" );
            // console.log( preParseData );

            try
            {
                var data = JSON.parse( preParseData );

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

