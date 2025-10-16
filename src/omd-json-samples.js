/**
 * STREAMLINED OMD JSON SAMPLES
 * One comprehensive example per visual type showing ALL properties
 */

// COORDINATE PLANE - Complete example with all features
export const coordinatePlaneExample = {
    "omdType": "coordinatePlane",
    "size": "medium",
    "xMin": -2,
    "xMax": 6, 
    "yMin": -1,
    "yMax": 8,
    "xLabel": "Time (hours)",
    "yLabel": "Temperature (°C)",
    "tickInterval": 1,
    "tickLabelOffsetPx": 5,
    "axisLabelOffsetPx": 20,
    "paddingLeft": 60,
    "paddingRight": 30,
    "paddingTop": 30,
    "paddingBottom": 60,
    "graphEquations": [
        {
            "equation": "2*x + 1",
            "domain": { "min": 0, "max": 4 },
            "color": "blue", 
            "strokeWidth": 3
        },
        {
            "equation": "x**2 - 2*x + 3",
            "domain": { "min": 1, "max": 5 },
            "color": "red",
            "strokeWidth": 2
        }
    ],
    "dotValues": [
        [1, 3, "green"],
        [3, 5, "purple"],
        [5, 7]
    ],
    "lineSegments": [
        {
            "point1": [0, 2],
            "point2": [2, 6],
            "color": "orange",
            "strokeWidth": 2
        }
    ]
};

// TABLE - Complete example with all features  
export const tableExample = {
    "omdType": "table",
    "title": "Student Scores",
    "headers": ["Name", "Math", "Science", "Average"],
    "data": [
        ["Alice", 95, 88, 91.5],
        ["Bob", 87, 92, 89.5],
        ["Carol", 91, 85, 88]
    ],
    "highlightRows": [0],
    "highlightCols": [3],
    "cellColors": {
        "1,1": "lightblue",
        "2,2": "lightgreen"
    },
    "showBorders": true,
    "alternateRowColors": true,
    "headerBackgroundColor": "lightgray",
    "width": 400,
    "height": 250
};

// TABLE WITH EQUATION - Function table showing x/y values from equation
export const tableEquationExample = {
    "omdType": "table",
    "title": "Function Table: y = 2x + 3",
    "headers": ["x", "y"],
    "equation": "y = 2x + 3",
    "width": 350,
    "height": 300
};

// BALANCE HANGER - Complete example
export const balanceHangerExample = {
    "omdType": "balanceHanger", 
    "leftValues": [3, "x", 5],
    "rightValues": [2, "y", 8],
    "tilt": "left",
    "showLabels": true,
    "equilibrium": false
};

// TAPE DIAGRAM - Complete example (canonical schema)
export const tapeDiagramExample = {
    "omdType": "tapeDiagram",
    "values": [2, 3],
    "colors": ["#2386DB", "#DB2323"],
    "labelSet": [
        { "omdType": "omdTapeLabel", "startIndex": 0, "endIndex": 1, "label": "2x", "showBelow": false },
        { "omdType": "omdTapeLabel", "startIndex": 1, "endIndex": 2, "label": "3", "showBelow": false },
        { "omdType": "omdTapeLabel", "startIndex": 0, "endIndex": 2, "label": "5", "showBelow": true }
    ],
    "showValues": true
};

// EQUATION STACK - Complete example showing step-by-step equation solving
export const equationStackExample = {
    "omdType": "equationStack",
    "equations": [
        "2x + 3 = 11",
        "2x = 8", 
        "x = 4"
    ]
};

// EQUATION STACK - Multi-step algebraic solution
export const equationStackMultiStepExample = {
    "omdType": "equationStack", 
    "equations": [
        "3(x + 2) = 15",
        "3x + 6 = 15",
        "3x = 9",
        "x = 3"
    ]
};

// EQUATION STACK - Quadratic equation solution
export const equationStackQuadraticExample = {
    "omdType": "equationStack",
    "equations": [
        "x² + 5x + 6 = 0",
        "(x + 2)(x + 3) = 0",
    ]
};

// Export all examples for AI reference
export const allExamples = {
    coordinatePlane: coordinatePlaneExample,
    table: tableExample,
    tableEquation: tableEquationExample,
    balanceHanger: balanceHangerExample,
    tapeDiagram: tapeDiagramExample,
    equationStack: equationStackExample,
    equationStackMultiStep: equationStackMultiStepExample,
    equationStackQuadratic: equationStackQuadraticExample
};