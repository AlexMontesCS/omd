

import { omdColor } from "./omdColor.js";
import { omdNumber } from "./omdNumber.js";
import { omdVariable } from "./omdVariable.js";
import { omdTerm } from "./omdTerm.js";
import { omdOperator } from "./omdOperator.js";
import { omdExpression } from "./omdExpression.js";
import { omdPowerExpression } from "./omdPowerExpression.js";
import { omdRationalExpression } from "./omdRationalExpression.js";
import { omdEquation } from "./omdEquation.js";
import { omdEquationNode } from "../omd/nodes/omdEquationNode.js";
import { omdFunction } from "./omdFunction.js";
import { omdNumberLine } from "./omdNumberLine.js";
import { omdDoubleNumberLine } from "./omdDoubleNumberLine.js";
import { omdTapeDiagram } from "./omdTapeDiagram.js";
import { omdDoubleTapeDiagram } from "./omdDoubleTapeDiagram.js";
import { omdBalanceHanger } from "./omdBalanceHanger.js";
import { omdNumberTile } from "./omdNumberTile.js";
import { omdRatioChart } from "./omdRatioChart.js";
import { omdCoordinatePlane } from "./omdCoordinatePlane.js";
import { omdSpinner } from "./omdSpinner.js";
import { omdTable } from "./omdTable.js";
import { omdTileEquation } from "./omdTileEquation.js";
import { omdRightTriangle } from "./omdShapes.js";
import { omdIsoscelesTriangle } from "./omdShapes.js";
import { omdRectangle } from "./omdShapes.js";
import { omdEllipse } from "./omdShapes.js";
import { omdCircle } from "./omdShapes.js";
import { omdRegularPolygon } from "./omdShapes.js";
import { jsvgContainer } from "@teachinglab/jsvg";

export class omd extends jsvgContainer
{
    constructor()
    {
        super();


        this.setViewbox( 400,400 );
        this.setBackgroundColor( "#F8F8F4" );
    }

    setCanvasSize( W, H )
    {
        this.setViewbox( W,H );
    }

    setBackgroundColor( C )
    {
        this.svgObject.style.backgroundColor =  C;
    }
    
    generateGraphic( jsonData )
    {
        this.removeAllChildren();

        if (!jsonData || !jsonData.omdType) {
            console.error('Invalid jsonData: missing omdType', jsonData);
            return;
        }

        var N = null;
        const omdType = jsonData.omdType;

        // Use a switch statement for better performance and readability
        switch (omdType) {
            case "number":
                N = new omdNumber();
                break;
            case "variable":
                N = new omdVariable();
                break;
            case "operator":
                N = new omdOperator();
                break;
            case "term":
                N = new omdTerm();
                break;
            case "expression":
                N = new omdExpression();
                break;
            case "powerExpression":
                N = new omdPowerExpression();
                break;
            case "rationalExpression":
                N = new omdRationalExpression();
                break;
            case "function":
                N = new omdFunction();
                break;
            case "equation":
                // ALWAYS prefer omdEquationNode for equations
                if (jsonData.equation && typeof jsonData.equation === 'string' && jsonData.equation.includes('=')) {
                    try {
                        N = omdEquationNode.fromString(jsonData.equation);
                        
                        // Properly initialize the equation node
                        if (typeof N.computeDimensions === 'function') {
                            N.computeDimensions();
                        }
                        
                        if (typeof N.updateLayout === 'function') {
                            N.updateLayout();
                        }
                        
                        N.setPosition(0, 30);
                        this.addChild(N);
                        return; // Early return - completely bypass old system
                    } catch (e) {
                        console.warn('⚠️ omdEquationNode failed, falling back to legacy omdEquation:', e);
                    }
                }
                
                // Legacy fallback for complex JSON structures
                if (jsonData.leftExpression || jsonData.rightExpression) {
                    console.log('📝 Using legacy omdEquation for complex JSON structure');
                    N = new omdEquation();
                } else {
                    console.warn('⚠️ Equation data missing both equation string and expression structure');
                    return;
                }
                break;
            case "numberLine":
                N = new omdNumberLine();
                break;
            case "doubleNumberLine":
                N = new omdDoubleNumberLine();
                break;
            case "balanceHanger":
                N = new omdBalanceHanger();
                break;
            case "tapeDiagram":
                N = new omdTapeDiagram();
                break;
            case "doubleTapeDiagram":
                N = new omdDoubleTapeDiagram();
                break;
            case "numberTile":
                N = new omdNumberTile();
                break;
            case "ratioChart":
                N = new omdRatioChart();
                break;
            case "coordinatePlane":
                N = new omdCoordinatePlane();
                break;
            case "spinner":
                N = new omdSpinner();
                break;
            case "table":
                N = new omdTable();
                break;
            case "tileEquation":
                N = new omdTileEquation();
                break;
            case "rightTriangle":
                N = new omdRightTriangle();
                break;
            case "isoscelesTriangle":
                N = new omdIsoscelesTriangle();
                break;
            case "rectangle":
                N = new omdRectangle();
                break;
            case "ellipse":
                N = new omdEllipse();
                break;
            case "circle":
                N = new omdCircle();
                break;
            case "regularPolygon":
                N = new omdRegularPolygon();
                break;
            default:
                console.error(`Unsupported OMD type: ${omdType}. Available types: number, variable, operator, term, expression, powerExpression, rationalExpression, function, equation, numberLine, balanceHanger, tapeDiagram, numberTile, ratioChart, coordinatePlane, spinner, table, tileEquation, rightTriangle, isoscelesTriangle, rectangle, ellipse, circle, regularPolygon`);
                return;
        }

        if (!N) {
            console.error(`Failed to create OMD object for type: ${omdType}`);
            return;
        }

        // Set default position
        N.setPosition(0, 30);

        // Special positioning for certain types
        if (omdType === "balanceHanger") {
            N.setPosition(150, 30);
        }

        try {
            // Load from JSON
            N.loadFromJSON(jsonData);
        } catch (error) {
            console.error(`Error loading JSON data for ${omdType}:`, error);
            console.error('JSON data:', jsonData);
            return;
        }
        // Add to the container
        this.addChild(N);
    }

    getSVG()
    {
        return this.svgObject;
    }

    getDiv()
    {
        const newDiv = document.createElement("div");
        newDiv.style.width = this.width + 'px';
        newDiv.style.height = this.height + 'px';
        newDiv.style.overflow = 'visible'
        newDiv.appendChild( this.svgObject );
        return newDiv;
    }
}

