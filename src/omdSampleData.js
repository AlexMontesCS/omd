

let numberSample = 
{
    "omdType": "number",
    "value" : 7
}

let variableSample = 
{
    "omdType": "variable",
    "name" : "C"
}

let operatorSample = 
{
    "omdType": "operator",
    "operator" : "+"
}

let termSample = 
{
    "omdType": "term",
    "coefficient": 3,
    "variable": "x",
    "exponent":  1
}

let expressionSample = 
{
    "omdType": "expression",
    "termsAndOpers":  
    [ 
        {
            "omdType": "term",
            "coefficient": 3,
            "variable": '',
            "exponent":  1
        },
        {
            "omdType": "operator",
            "operator" : "+"
        },
        {
            "omdType": "term",
            "coefficient": 5,
            "variable": 'x',
            "exponent":  2
        },
        {
            "omdType": "operator",
            "operator" : "+"
        },
        {
            "omdType": "variable",
            "name": "x",
        }
    ],
}



let numberLineSample = 
{
    "omdType": "numberLine",
    "dotValues": [3, 5, 7],
    "min": 0,
    "max": 10,
    "label": "",
}

let tapeDiagramSample = 
{
    "omdType": "tapeDiagram",
    //"values": ['x','x','x+1'],
    "values": [1,2,3,4],
    "showValues": true,
    "colors": [],
    "unitWidth": 30,
    "labelSet": [
        {
            "omdType": "omdTapeLabel",
            "startValue":  0,
            "endValue":  3,
            "label":  "3",
            "showBelow":  false
        },
        {
            "omdType": "omdTapeLabel",
            "startValue":  1,
            "endValue":  6,
            "label":  "5",
            "showBelow":  true
        }
    ]
 }
 
let tapeDiagramSample2 = 
{
    "omdType": "tapeDiagram",
    "values": ['2','x','x+1'],
    "showValues": true,
    "colors": [],
    "unitWidth": 30,
    "labelSet": [
        {
            "omdType": "omdTapeLabel",
            "startIndex":  0,
            "endIndex":  3,
            "label":  "9",
            "showBelow":  false
        }
    ]
 }
 
let balanceHangerSample = 
{
    "leftValues": [1, 2, 3, 4],
    "rightValues": [1, 2, 3],
    "tilt": "right"
}

let balanceHangerSample2 = 
{
    "leftValues": [1, 'x', 3],
    "rightValues": [1, 4, 5],
    "tilt": "none"
}

let numberTileSample1 = 
{
    "omdType": "numberTile",
    "value": 3
}

let numberTileSample2 = 
{
    "omdType": "numberTile",
    "value": 8,
    "size": "medium"        // small, medium or large
}

let rightTriangleSample =
{
    "omdType": "rightTriangle",
    "verticalLeg": 6,        // length of vertical leg
    "horizontalLeg": 3,      // length of horizontal leg
    "unitScale":10            // unit scale should be 10 unless otherwise specified
}

let isoscelesTriangleSample =
{
    "omdType": "isoscelesTriangle",
    "base": 4,                  // triangle base
    "height": 6,                // triangle height
    "unitScale":10              // unit scale should be 10 unless otherwise specified
}

let rightTriangleSample2 = 
{
    "omdType": "rightTriangle",
    "angleA": 60,          // angle A
    "hypotenuse": 50,      // hypotenuse
    "unitScale":10         // unit scale should be 10 unless otherwise specified
}

let rectangleSample = 
{
    "omdType": "rectangle",
    "width": 10,          // width
    "height": 6,            // height
    "unitScale": 10         // unit scale should be 10 unless otherwise specified
}

let ellipseSample = 
{
    "omdType": "ellipse",
    "width": 10,           // width
    "height": 6,           // height  (same as width for circle)
    "unitScale":10         // unit scale should be 10 unless otherwise specified
}

let circleSample = 
{
    "omdType": "circle",
    "radius": 3,           // radius
    "unitScale":10         // unit scale should be 10 unless otherwise specified
}

let regularPolygonSample = 
{
    "omdType": "regularPolygon",
    "radius": 3,          // radius
    "numberOfSides": 6,    // number of sides
    "unitScale":10        // unit scale should be 10 unless otherwise specified
}

let planeWithShapes = 
{
    "omdType": "coordinatePlane",
    "size": "medium",
    "shapeSet": [
        {
            "omdType": "circle",
            "radius": 3,
            "unitScale": 10
        },
        {
            "omdType": "isoscelesTriangle",
            "base": 2,                  // triangle base
            "height": 3,                // triangle height
            "unitScale":10              // unit scale should be 10 unless otherwise specified
        }
    ]
}
