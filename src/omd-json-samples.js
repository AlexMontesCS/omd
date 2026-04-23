/**
 * EXPANDED OMD JSON SAMPLES
 *
 * Goal: provide multiple schema-aligned examples per omdType so AI lookup has
 * richer patterns to follow when generating objects.
 */

export const omdSampleCatalog = {
    equation: [
        {
            omdType: 'equation',
            equation: '2x + 3 = 11',
            fontSize: 28
        },
        {
            omdType: 'equation',
            equation: '(x^2 + 3x - 4)/(2x) = 5',
            fontSize: 24
        }
    ],

    equationStack: [
        {
            omdType: 'equationStack',
            equations: ['2x + 3 = 11', '2x = 8', 'x = 4'],
            alignmentMode: 'equals',
            fontSize: 24
        },
        {
            omdType: 'equationStack',
            equations: ['3(x + 2) = 15', '3x + 6 = 15', '3x = 9', 'x = 3'],
            alignmentMode: 'center',
            fontSize: 22
        }
    ],

    equationWork: [
        {
            omdType: 'equationWork',
            rows: [
                { kind: 'equation', left: '2 + 2x', right: '12' },
                {
                    kind: 'operation',
                    left: '-2',
                    right: '-2',
                    leftAnchorTermText: '2',
                    rightAnchorTermText: '12',
                    drawLineAfter: true
                },
                { kind: 'equation', left: '2x', right: '10' },
                { kind: 'operation', left: '/2', right: '/2', drawLineAfter: true },
                { kind: 'equation', left: 'x', right: '10/2' },
                { kind: 'equation', left: 'x', right: '5' }
            ],
            operationLineUp: 'equals',
            equationLeftAlign: 'end',
            equationRightAlign: 'start',
            fontFamily: 'Albert Sans',
            fontSize: 40,
            fontWeight: 500
        },
        {
            omdType: 'equationWork',
            rows: [
                { kind: 'equation', left: '3/4x - 5', right: '7' },
                {
                    kind: 'operation',
                    left: '+5',
                    right: '+5',
                    leftAnchorTermText: '-5',
                    rightAnchorTermText: '7',
                    drawLineAfter: true
                },
                { kind: 'equation', left: '3/4x', right: '12' },
                {
                    kind: 'operation',
                    left: '/ 3/4',
                    right: '/ 3/4',
                    drawLineAfter: true
                },
                { kind: 'equation', left: 'x', right: '16' }
            ],
            fontSize: 38,
            rowGap: 20,
            lineStrokeWidth: 4
        }
    ],

    expression: [
        {
            omdType: 'expression',
            expression: '3x + 2y - 5',
            fontSize: 28
        },
        {
            omdType: 'expression',
            expression: '(x^2 - 4)/(x + 1)',
            fontSize: 24
        }
    ],

    balanceHanger: [
        {
            omdType: 'balanceHanger',
            leftValues: ['x', 'x', 3],
            rightValues: [11],
            tilt: 'none',
            fontSize: 24
        },
        {
            omdType: 'balanceHanger',
            leftValues: [2, 'x', 1],
            rightValues: [9],
            tilt: 'left',
            showBackground: true
        }
    ],

    numberLine: [
        {
            omdType: 'numberLine',
            min: 0,
            max: 10,
            increment: 1,
            dotValues: [3, 7],
            title: 'Distance',
            units: ' m',
            showRightArrow: true
        },
        {
            omdType: 'numberLine',
            min: -5,
            max: 5,
            increment: 1,
            specialNumbers: [-3, 0, 4],
            hideDefaultNumbers: false,
            totalWidth: 420
        }
    ],

    doubleNumberLine: [
        {
            omdType: 'doubleNumberLine',
            topNumberLine: {
                min: 0,
                max: 6,
                increment: 1,
                title: 'Hours',
                showRightArrow: true
            },
            bottomNumberLine: {
                min: 0,
                max: 180,
                increment: 30,
                title: 'Miles',
                showRightArrow: true
            },
            spacing: 30
        },
        {
            omdType: 'doubleNumberLine',
            topNumberLine: {
                min: 0,
                max: 8,
                increment: 2,
                units: ' cups'
            },
            bottomNumberLine: {
                min: 0,
                max: 16,
                increment: 4,
                units: ' tbsp'
            },
            spacing: 24
        }
    ],

    coordinatePlane: [
        {
            omdType: 'coordinatePlane',
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
            tickInterval: 1,
            graphEquations: [
                { equation: 'y = 2x + 3', color: 'black', strokeWidth: 2 }
            ],
            xLabel: 'x',
            yLabel: 'y'
        },
        {
            omdType: 'coordinatePlane',
            xMin: -6,
            xMax: 6,
            yMin: -2,
            yMax: 12,
            tickInterval: 1,
            graphEquations: [
                { equation: 'y = x^2', color: '#1f77b4', strokeWidth: 2 },
                { equation: 'y = x + 2', color: '#d62728', strokeWidth: 2 }
            ],
            dotValues: [[0, 0, '#1f77b4'], [2, 4, '#1f77b4']],
            showTickLabels: true
        }
    ],

    tapeDiagram: [
        {
            omdType: 'tapeDiagram',
            title: 'Parts and Total',
            values: ['2', '3', 'x'],
            totalWidth: 320
        },
        {
            omdType: 'tapeDiagram',
            values: [
                { value: '5', weight: 5, color: '#93c5fd' },
                { value: '3', weight: 3, color: '#fca5a5' }
            ],
            labelSet: [
                { startIndex: 0, endIndex: 2, label: '8 total', showBelow: true }
            ]
        }
    ],

    doubleTapeDiagram: [
        {
            omdType: 'doubleTapeDiagram',
            topTapeDiagram: {
                title: 'Pencils',
                values: ['5', '5']
            },
            bottomTapeDiagram: {
                title: 'Cost',
                values: ['$2', '$2']
            },
            spacing: 30
        },
        {
            omdType: 'doubleTapeDiagram',
            topTapeDiagram: {
                values: [{ value: '3x', weight: 3 }, { value: '2', weight: 2 }]
            },
            bottomTapeDiagram: {
                values: ['17']
            },
            spacing: 26
        }
    ],

    tileEquation: [
        {
            omdType: 'tileEquation',
            equation: '2x + 3 = 11',
            tileSize: 28,
            tileGap: 6
        },
        {
            omdType: 'tileEquation',
            left: [
                { kind: 'x', count: 2 },
                { kind: 'const', value: 3 }
            ],
            right: [
                { kind: 'const', value: 11 }
            ],
            showLabels: true
        }
    ],

    table: [
        {
            omdType: 'table',
            equation: 'y = 2x + 3',
            headers: ['x', 'y'],
            xMin: -2,
            xMax: 3,
            stepSize: 1,
            title: 'Function Table'
        },
        {
            omdType: 'table',
            equation: 'y = -x + 4',
            headers: ['x', 'y'],
            data: [[0, 4], [1, 3], [2, 2]],
            title: 'Given Values',
            fontSize: 22
        }
    ],

    ratioChart: [
        {
            omdType: 'ratioChart',
            valueA: 3,
            valueB: 5,
            renderType: 'pie',
            size: 'medium'
        },
        {
            omdType: 'ratioChart',
            numerator: 2,
            denominator: 7,
            valueA: 2,
            valueB: 5,
            renderType: 'bar',
            size: 'large'
        }
    ],

    rightTriangle: [
        {
            omdType: 'rightTriangle',
            horizontalLeg: 3,
            verticalLeg: 4,
            showLabels: true,
            unitScale: 24
        },
        {
            omdType: 'rightTriangle',
            horizontalLeg: 5,
            verticalLeg: 12,
            unitScale: 16
        }
    ],

    isoscelesTriangle: [
        {
            omdType: 'isoscelesTriangle',
            base: 8,
            height: 6,
            showLabels: true
        },
        {
            omdType: 'isoscelesTriangle',
            base: 10,
            height: 7,
            unitScale: 14
        }
    ],

    rectangle: [
        {
            omdType: 'rectangle',
            width: 6,
            height: 4,
            sideLabels: {
                top: '6',
                right: '4',
                bottom: '',
                left: ''
            },
            showLabels: true,
            unitScale: 24
        },
        {
            omdType: 'rectangle',
            width: 12,
            height: 3,
            sideLabels: {
                top: 'x',
                right: '3',
                bottom: 'x',
                left: '3'
            },
            insideLabel: 'A = 36',
            unitScale: 18
        }
    ],

    rectangularPrism: [
        {
            omdType: 'rectangularPrism',
            length: 5,
            width: 3,
            height: 4,
            showLabels: true,
            unitScale: 20
        },
        {
            omdType: 'rectangularPrism',
            length: 5,
            width: 3,
            height: 4,
            sideLabels: {
                length: '5',
                width: '3',
                height: 'h'
            },
            insideLabel: 'V = 60',
            unitScale: 20
        }
    ],

    ellipse: [
        {
            omdType: 'ellipse',
            width: 6,
            height: 4,
            showLabels: true,
            unitScale: 16
        },
        {
            omdType: 'ellipse',
            width: 10,
            height: 5,
            unitScale: 12
        }
    ],

    circle: [
        {
            omdType: 'circle',
            radius: 5,
            showLabels: true,
            unitScale: 18
        },
        {
            omdType: 'circle',
            radius: 9,
            unitScale: 12
        }
    ],

    regularPolygon: [
        {
            omdType: 'regularPolygon',
            numberOfSides: 6,
            radius: 5,
            showLabels: false,
            unitScale: 20
        },
        {
            omdType: 'regularPolygon',
            numberOfSides: 8,
            radius: 4,
            showLabels: true,
            unitScale: 18
        }
    ],

    spinner: [
        {
            omdType: 'spinner',
            divisions: 8,
            arrowPosition: 3,
            size: 'medium'
        },
        {
            omdType: 'spinner',
            divisions: 6,
            arrowPosition: 1,
            size: 'large'
        }
    ],

    label: [
        {
            omdType: 'label',
            text: 'Solve for x',
            size: 'large',
            color: 'black'
        },
        {
            omdType: 'label',
            text: 'Check your work',
            size: 'small',
            color: '#334155'
        }
    ]
};

// Compatibility exports used as single-sample aliases.
export const coordinatePlaneExample = omdSampleCatalog.coordinatePlane[0];
export const tableExample = omdSampleCatalog.table[0];
export const tableEquationExample = omdSampleCatalog.table[0];
export const balanceHangerExample = omdSampleCatalog.balanceHanger[0];
export const tapeDiagramExample = omdSampleCatalog.tapeDiagram[0];
export const equationStackExample = omdSampleCatalog.equationStack[0];
export const equationStackMultiStepExample = omdSampleCatalog.equationStack[1];
export const equationStackQuadraticExample = {
    omdType: 'equationStack',
    equations: ['x^2 + 5x + 6 = 0', '(x + 2)(x + 3) = 0', 'x = -2 or x = -3']
};

export const allExamples = {
    ...omdSampleCatalog,
    tableEquation: tableEquationExample,
    equationStackQuadratic: equationStackQuadraticExample
};