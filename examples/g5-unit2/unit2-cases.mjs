/**
 * Grade 5 Unit 2 — Fractions as Quotients and Fraction Multiplication.
 *
 * Every figure in the unit plan and the end-of-unit assessment, expressed as
 * OMD JSON. Consumed by both the Node smoke renderer (render-cases.mjs) and
 * the browser demo (index.html), so the two can never drift.
 *
 * `source` names the image the figure replaces in the source documents:
 *   plan/imageNN  — Gr5_Math_UnitPlan_Unit2_...v2.docx
 *   usi/imageNN   — MAT.05.UNIT.N02.26-27.USI_student_DRAFT.docx
 */

const SHADE = "#7FCFEA";
const SHADE_GREEN = "#A9CD9B";
const SHADE_SAND = "#DCD8B6";

export const unit2 = [
    {
        id: "narrative",
        section: "Unit narrative",
        title: "Two readings of a fraction",
        blurb:
            "4/3 is both a sharing situation (4 things split 3 ways) and a product " +
            "(4 groups of 1/3). The same two diagrams carry the whole unit.",
        figures: [
            {
                id: "narrative-4-thirds",
                source: "plan/image1",
                caption: "4 \u00d7 1/3 — four wholes, one third of each shaded",
                json: {
                    omdType: "fractionStrips",
                    strips: 4, parts: 3, shaded: 1,
                    stripLength: 380, stripThickness: 40, gap: 10,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "narrative-3-halves",
                source: "plan/image3",
                caption: "3 \u00f7 2 — three wholes shared by two people",
                json: {
                    omdType: "fractionStrips",
                    strips: 3, parts: 2, shaded: 1,
                    stripLength: 380, stripThickness: 40, gap: 10,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "narrative-6-by-two-thirds",
                source: "plan/image5",
                caption: "6 \u00d7 2/5 — a 6 unit by 2/5 unit rectangle",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 1, rowParts: 5,
                    shadeHeight: "2/5", unitScale: 62,
                    topBrace: { scope: "grid", label: "6" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "narrative-distributive",
                source: "plan/image6",
                caption: "2 \u00d7 3 2/5 — whole units and fractional units, multiplied separately",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 2, columnParts: 5,
                    shadeWidth: "3 2/5", unitScale: 62,
                    topBraces: [
                        { from: 0, to: 3, label: "3" },
                        { from: 3, to: "3 2/5" },
                    ],
                    leftBrace: { scope: "grid", label: "2" },
                    partitionScope: "last",
                    decompose: true, shadeColor: SHADE,
                },
            },
        ],
    },

    {
        id: "section-a",
        section: "Section A \u00b7 Lessons 1\u20136",
        title: "Fractions as Quotients",
        blurb:
            "Equal sharing builds the generalization a \u00f7 b = a/b. Every share is " +
            "drawn as strips: one whole per object, partitioned by the number of sharers.",
        figures: [
            {
                id: "l1-share-sandwiches",
                lesson: "Lesson 1 \u00b7 Sharing Sandwiches",
                source: "plan/image17",
                caption: "3 sandwiches shared equally by 4 people \u2014 each share is 3 \u00d7 1/4",
                json: {
                    omdType: "fractionStrips",
                    strips: 3, parts: 4, shaded: 1,
                    stripLength: 400, stripThickness: 42, gap: 12,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l2-two-fifths",
                lesson: "Lesson 2 \u00b7 Share More Sandwiches",
                source: "plan/image16",
                caption: "2 sandwiches shared equally by 5 people \u2014 2 \u00f7 5",
                json: {
                    omdType: "fractionStrips",
                    strips: 2, parts: 5, shaded: 1,
                    stripLength: 400, stripThickness: 42, gap: 12,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l2-sandwich-table",
                lesson: "Lesson 2 \u00b7 Share More Sandwiches",
                source: "plan/image15",
                caption: "Task 1 table \u2014 students fill the last two columns",
                json: {
                    omdType: "table",
                    headers: [
                        "Sandwiches Being Shared",
                        "Number of People Sharing",
                        "Amount of Sandwich Each Person Gets",
                        "Division Expression",
                    ],
                    data: [
                        ["1", "2", null, null],
                        ["1", "3", null, null],
                        ["1", "4", null, null],
                        ["1", "5", null, null],
                    ],
                    editable: true,
                    editableCells: [[0, 2], [0, 3], [1, 2], [1, 3], [2, 2], [2, 3], [3, 2], [3, 3]],
                    columnWidth: 170,
                },
            },
            {
                id: "l3-dancers-table",
                lesson: "Lesson 3 \u00b7 Interpret Equations",
                source: "plan/image20",
                caption: "Dehydrated Dancers \u2014 complete the equal-groups table",
                json: {
                    omdType: "table",
                    headers: [
                        "Number of dancers",
                        "Liters of water",
                        "Division expression",
                        "Water each dancer drank (L)",
                    ],
                    data: [
                        ["4", "2", null, null],
                        [null, null, "3 \u00f7 4", null],
                        [null, null, "3 \u00f7 5", null],
                        ["4", null, null, null],
                        [null, "5", null, null],
                    ],
                    editable: true,
                    editableCells: [
                        [0, 2], [0, 3], [1, 0], [1, 1], [1, 3], [2, 0], [2, 1], [2, 3],
                        [3, 1], [3, 2], [3, 3], [4, 0], [4, 2], [4, 3],
                    ],
                    columnWidth: 165,
                },
            },
            {
                id: "l4-number-talk",
                lesson: "Lesson 4 \u00b7 Division Situations",
                source: "plan/image7",
                caption: "Number Talk \u2014 division",
                json: {
                    omdType: "mathText",
                    text: "35 \u00f7 7\n1 \u00f7 7\n36 \u00f7 7\n37 \u00f7 7",
                    fontSize: 26,
                },
            },
            {
                id: "l4-four-sixths",
                lesson: "Lesson 4 \u00b7 Division Situations",
                source: "plan/image22",
                caption: "4 \u00f7 6 \u2014 describe a situation this diagram could represent",
                json: {
                    omdType: "fractionStrips",
                    strips: 4, parts: 6, shaded: 1,
                    stripLength: 420, stripThickness: 40, gap: 11,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l4-equation",
                lesson: "Lesson 4 \u00b7 Division Situations",
                source: "plan/image21",
                caption: "The matching equation",
                json: { omdType: "mathText", text: "4 \u00f7 6 = [4/6]", fontSize: 30 },
            },
            {
                id: "l5-seven-pizzas",
                lesson: "Lesson 5 \u00b7 Mixed Numbers & Improper Fractions",
                source: "plan/image24",
                caption: "7 pizzas shared by 4 friends \u2014 7/4 = 1 3/4 each",
                json: {
                    omdType: "fractionStrips",
                    strips: 7, parts: 4, shaded: 1,
                    stripLength: 360, stripThickness: 30, gap: 8,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l5-conversion",
                lesson: "Lesson 5 \u00b7 Mixed Numbers & Improper Fractions",
                source: "plan/image27",
                caption: "Connect the model to the algorithm",
                json: {
                    omdType: "mathText",
                    text: "7 \u00f7 4 = [7/4] = [1 3/4]",
                    fontSize: 30,
                },
            },
            {
                id: "l6-true-false",
                lesson: "Lesson 6 \u00b7 Relate Division and Fractions",
                source: "plan/image11",
                caption: "True or False warm-up",
                json: {
                    omdType: "mathText",
                    text: "5 \u00f7 2 = [5/2]\n[5/2] = [5 1/2]\n[6/2] = 3",
                    fontSize: 26,
                },
            },
        ],
    },

    {
        id: "section-b",
        section: "Section B \u00b7 Lessons 7\u201310",
        title: "Fractions of Whole Numbers",
        blurb:
            "8 \u00f7 3, 8 \u00d7 1/3 and 4 \u00d7 2/3 all describe the same shaded strips. " +
            "The diagram is the bridge between division and multiplication.",
        figures: [
            {
                id: "l7-number-talk",
                lesson: "Lesson 7 \u00b7 Relate Division & Multiplication",
                source: "plan/image8",
                caption: "Number Talk \u2014 multiply and divide",
                json: {
                    omdType: "mathText",
                    text: "3 \u00d7 [1/2]\n3 \u00d7 [2/2]\n3 \u00d7 [3/2]\n5 \u00d7 [3/2]",
                    fontSize: 26,
                },
            },
            {
                id: "l7-the-race",
                lesson: "Lesson 7 \u00b7 Relate Division & Multiplication",
                source: "plan/image28",
                caption: "Lin and Han run a 3 mile relay \u2014 3 \u00f7 2 = 3 \u00d7 1/2",
                json: {
                    omdType: "fractionStrips",
                    strips: 3, parts: 2, shaded: 1,
                    stripLength: 380, stripThickness: 44, gap: 12,
                    brace: "1 mile", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l8-unit-fraction",
                lesson: "Lesson 8 \u00b7 Divide to Multiply Unit Fractions",
                caption: "Mai runs 1/4 of a 5 mile road \u2014 5 \u00d7 1/4 = 5 \u00f7 4",
                json: {
                    omdType: "fractionStrips",
                    strips: 5, parts: 4, shaded: 1,
                    stripLength: 400, stripThickness: 38, gap: 10,
                    brace: "1 mile", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l9-three-fifths",
                lesson: "Lesson 9 \u00b7 Divide to Multiply Non-Unit Fractions",
                source: "plan/image30",
                caption: "3 \u00f7 5 and 3 \u00d7 1/5 read off one diagram",
                json: {
                    omdType: "fractionStrips",
                    strips: 3, parts: 5, shaded: 1,
                    stripLength: 400, stripThickness: 44, gap: 12,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l9-diagram-b",
                lesson: "Lesson 9 \u00b7 Divide to Multiply Non-Unit Fractions",
                source: "plan/image29",
                caption: "Diagram B \u2014 2/5 of each whole shaded, 3 \u00d7 2/5",
                json: {
                    omdType: "fractionStrips",
                    strips: 3, parts: 5, shaded: 2,
                    stripLength: 400, stripThickness: 44, gap: 12,
                    brace: "1", expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l10-chocolate-bars",
                lesson: "Lesson 10 \u00b7 Multiply Non-Unit Fraction by Whole",
                source: "plan/image31",
                caption: "Four chocolate bars, 3/5 eaten from each \u2014 4 \u00d7 3/5",
                json: {
                    omdType: "fractionStrips",
                    strips: 4, parts: 5, shaded: 3,
                    orientation: "vertical", fillFrom: "end",
                    stripLength: 210, stripThickness: 46, gap: 16,
                    separator: "+", brace: false, dividerDash: "none",
                    expressionLine: true, shadeColor: "#4E63D8",
                },
            },
            {
                id: "l10-circles",
                lesson: "Lesson 10 \u00b7 Multiply Non-Unit Fraction by Whole",
                source: "plan/image34",
                caption: "Which expression matches the model? 2 \u00d7 5/6",
                json: {
                    omdType: "fractionCircle",
                    count: 2, parts: 6, shaded: 5,
                    radius: 72, gap: 24,
                    expressionLine: true,
                },
            },
            {
                id: "l10-algorithm",
                lesson: "Lesson 10 \u00b7 Multiply Non-Unit Fraction by Whole",
                caption: "Exit ticket \u2014 6 \u00d7 5/8 through the unit-fraction algorithm",
                json: {
                    omdType: "mathText",
                    text: "6 \u00d7 [5/8] = (6 \u00d7 [1/8]) \u00d7 5 = [6/8] \u00d7 5 = [30/8] = [3 3/4]",
                    fontSize: 24,
                },
            },
        ],
    },

    {
        id: "section-c",
        section: "Section C \u00b7 Lessons 11\u201315",
        title: "Area and Fractional Side Lengths",
        blurb:
            "The same area reasoning as whole-number rectangles: partition each unit " +
            "square, count what is shaded, write the multiplication expression.",
        figures: [
            {
                id: "l11-wodb",
                lesson: "Lesson 11 \u00b7 Relate Area to Multiplication",
                source: "plan/image35",
                caption: "Which one doesn't belong? \u2014 A: 6 \u00d7 1",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 1, unitScale: 46,
                    topBrace: { scope: "grid", label: "6" },
                    leftBrace: { scope: "grid", label: "1" },
                    shadeColor: SHADE,
                },
            },
            {
                id: "l11-wodb-d",
                lesson: "Lesson 11 \u00b7 Relate Area to Multiplication",
                source: "plan/image35",
                caption: "Which one doesn't belong? \u2014 D: 12 \u00d7 1/2",
                json: {
                    omdType: "areaDiagram",
                    columns: 12, rows: 1, rowParts: 2,
                    shadeHeight: "1/2", unitScale: 40,
                    topBrace: { scope: "grid", label: "12" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l11-find-the-area-1",
                lesson: "Lesson 11 \u00b7 Task 1",
                source: "plan/image36",
                caption: "6 \u00d7 1 = 6 square units",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 1, unitScale: 54,
                    topBrace: { scope: "grid", label: "6" },
                    leftBrace: { scope: "grid", label: "1" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l11-find-the-area-2",
                lesson: "Lesson 11 \u00b7 Task 1",
                source: "plan/image36",
                caption: "6 \u00d7 1/2",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 1, rowParts: 2,
                    shadeHeight: "1/2", unitScale: 54,
                    topBrace: { scope: "grid", label: "6" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l11-find-the-area-3",
                lesson: "Lesson 11 \u00b7 Task 1",
                source: "plan/image36",
                caption: "6 \u00d7 1/3",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 1, rowParts: 3,
                    shadeHeight: "1/3", unitScale: 54,
                    topBrace: { scope: "grid", label: "6" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l11-find-the-area-4",
                lesson: "Lesson 11 \u00b7 Task 1",
                source: "plan/image36",
                caption: "6 \u00d7 1/4",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 1, rowParts: 4,
                    shadeHeight: "1/4", unitScale: 54,
                    topBrace: { scope: "grid", label: "6" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l11-diagram-a",
                lesson: "Lesson 11 \u00b7 Independent Practice",
                source: "plan/image37",
                caption: "Diagram A \u2014 whole unit squares, 4 \u00d7 3",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 3, unitScale: 52,
                    topBrace: "unit", leftBrace: "unit",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l11-diagram-b",
                lesson: "Lesson 11 \u00b7 Independent Practice",
                source: "plan/image37",
                caption: "Diagram B \u2014 same width, one third of the height",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 1, rowParts: 3,
                    shadeHeight: "1/3", unitScale: 52,
                    topBrace: "unit", leftBrace: "unit",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l11-seven-fourths",
                lesson: "Lesson 11 \u00b7 Independent Practice",
                source: "plan/image38",
                caption: "7 \u00d7 1/4 with measurement arrows",
                json: {
                    omdType: "areaDiagram",
                    columns: 7, rows: 1, rowParts: 4,
                    shadeHeight: "1/4", unitScale: 56,
                    braceStyle: "arrow",
                    topBrace: { scope: "grid", label: "7" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE_GREEN,
                },
            },
            {
                id: "l11-exit-ticket",
                lesson: "Lesson 11 \u00b7 Exit Ticket",
                source: "plan/image39",
                caption: "Find the area of the shaded region \u2014 5 \u00d7 1/4",
                json: {
                    omdType: "areaDiagram",
                    columns: 5, rows: 1, rowParts: 4,
                    shadeHeight: "1/4", unitScale: 58,
                    topBrace: { scope: "grid", label: "5" },
                    leftBrace: { scope: "shaded" },
                    shadeColor: SHADE,
                },
            },
            {
                id: "l12-estimation",
                lesson: "Lesson 12 \u00b7 Warm-up",
                source: "plan/image40",
                caption: "Estimation Exploration \u2014 too low, about right, too high?",
                json: {
                    omdType: "areaDiagram",
                    columns: 7, rows: 1, showPartitions: false,
                    shadeHeight: "17/20", unitScale: 56,
                    topBrace: { scope: "grid", label: "7" },
                    leftBrace: { scope: "grid", label: "1" },
                    shadeColor: SHADE,
                },
            },
            {
                id: "l12-two-thirds",
                lesson: "Lesson 12 \u00b7 Task 1",
                source: "plan/image41",
                caption: "4 \u00d7 2/3",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 1, rowParts: 3,
                    shadeHeight: "2/3", unitScale: 62,
                    topBrace: { scope: "grid", label: "4" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l12-three-fourths",
                lesson: "Lesson 12 \u00b7 Task 1",
                source: "plan/image42",
                caption: "4 \u00d7 3/4",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 1, rowParts: 4,
                    shadeHeight: "3/4", unitScale: 62,
                    topBrace: { scope: "grid", label: "4" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l12-three-fifths",
                lesson: "Lesson 12 \u00b7 Task 1",
                source: "plan/image43",
                caption: "4 \u00d7 3/5",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 1, rowParts: 5,
                    shadeHeight: "3/5", unitScale: 62,
                    topBrace: { scope: "grid", label: "4" },
                    leftBrace: { scope: "shaded" },
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l12-ip-a",
                lesson: "Lesson 12 \u00b7 Independent Practice",
                source: "plan/image44",
                caption: "5 \u00d7 2/3 \u2014 write the expression, then find the area",
                json: {
                    omdType: "areaDiagram",
                    columns: 5, rows: 1, rowParts: 3,
                    shadeHeight: "2/3", unitScale: 58,
                    topBrace: "unit", leftBrace: { scope: "grid", label: "1" },
                    shadeColor: SHADE_SAND,
                },
            },
            {
                id: "l12-ip-b",
                lesson: "Lesson 12 \u00b7 Independent Practice",
                source: "plan/image45",
                caption: "2 \u00d7 1/2",
                json: {
                    omdType: "areaDiagram",
                    columns: 2, rows: 1, rowParts: 2,
                    shadeHeight: "1/2", unitScale: 58,
                    topBrace: "unit", leftBrace: { scope: "grid", label: "1" },
                    shadeColor: SHADE_SAND,
                },
            },
            {
                id: "l12-multiple-choice",
                lesson: "Lesson 12 \u00b7 Independent Practice",
                source: "plan/image46",
                caption: "Which expression represents the shaded region? 2 \u00d7 3/4",
                json: {
                    omdType: "areaDiagram",
                    columns: 2, rows: 1, rowParts: 4,
                    shadeHeight: "3/4", unitScale: 88,
                    braceStyle: "arrow",
                    topBrace: { scope: "grid", label: "2" },
                    leftBrace: { scope: "shaded" },
                    shadeColor: SHADE_GREEN,
                },
            },
            {
                id: "l12-exit-ticket",
                lesson: "Lesson 12 \u00b7 Exit Ticket",
                source: "plan/image47",
                caption: "5 \u00d7 3/4",
                json: {
                    omdType: "areaDiagram",
                    columns: 5, rows: 1, rowParts: 4,
                    shadeHeight: "3/4", unitScale: 58,
                    topBrace: { scope: "grid", label: "5" },
                    leftBrace: { scope: "shaded" },
                    shadeColor: SHADE,
                },
            },
            {
                id: "l13-greater-than-one",
                lesson: "Lesson 13 \u00b7 Task 1",
                source: "plan/image48",
                caption: "4 2/3 \u00d7 4 = 56/3 square units",
                json: {
                    omdType: "areaDiagram",
                    columns: 5, rows: 4, columnParts: 3,
                    shadeWidth: "4 2/3", unitScale: 52,
                    topBrace: "unit", leftBrace: "unit",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l13-ip-a",
                lesson: "Lesson 13 \u00b7 Independent Practice",
                source: "plan/image49",
                caption: "2 1/4 \u00d7 2",
                json: {
                    omdType: "areaDiagram",
                    columns: 3, rows: 2, columnParts: 4,
                    shadeWidth: "2 1/4", unitScale: 66,
                    topBrace: "unit", leftBrace: "unit",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l13-ip-b",
                lesson: "Lesson 13 \u00b7 Independent Practice",
                source: "plan/image50",
                caption: "3 3/4 \u00d7 3",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 3, columnParts: 4,
                    shadeWidth: "3 3/4", unitScale: 60,
                    topBrace: "unit", leftBrace: "unit",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l13-stove-top",
                lesson: "Lesson 13 \u00b7 Independent Practice",
                source: "plan/image51",
                caption: "The stove top \u2014 4 1/2 ft \u00d7 2 ft",
                json: {
                    omdType: "areaDiagram",
                    columns: 5, rows: 2, columnParts: 2,
                    shadeWidth: "4 1/2", unitScale: 64,
                    topBrace: { scope: "unit", label: "1 ft" },
                    leftBrace: { scope: "unit", label: "1 ft" },
                    expressionSuffix: "square feet",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l13-exit-ticket",
                lesson: "Lesson 13 \u00b7 Exit Ticket",
                source: "plan/image52",
                caption: "3 1/4 \u00d7 3",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 3, columnParts: 4,
                    shadeWidth: "3 1/4", unitScale: 60,
                    topBrace: "unit", leftBrace: "unit",
                    shadeColor: SHADE,
                },
            },
            {
                id: "l14-garden-grid",
                lesson: "Lesson 14 \u00b7 Task 1",
                source: "plan/image53",
                caption: "Blank grid \u2014 draw Noah's 5 yd by 6 1/4 yd garden",
                json: {
                    omdType: "areaDiagram",
                    columns: 7, rows: 6, columnParts: 1,
                    shadeWidth: 0, shadeHeight: 0, unitScale: 46,
                    topBrace: { scope: "unit", label: "1 yard" },
                    leftBrace: { scope: "unit", label: "1 yard" },
                    shadeColor: SHADE,
                },
            },
            {
                id: "l14-noah-garden",
                lesson: "Lesson 14 \u00b7 Task 1",
                caption: "Noah's garden \u2014 6 1/4 yd \u00d7 5 yd = 31 1/4 square yards",
                json: {
                    omdType: "areaDiagram",
                    columns: 7, rows: 5, columnParts: 4,
                    shadeWidth: "6 1/4", unitScale: 46,
                    topBrace: { scope: "unit", label: "1 yard" },
                    leftBrace: { scope: "unit", label: "1 yard" },
                    expressionSuffix: "square yards",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l14-priya-garden",
                lesson: "Lesson 14 \u00b7 Task 1",
                caption: "Priya's garden \u2014 6 yd \u00d7 5 1/4 yd = 31 1/2 square yards",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 6, rowParts: 4,
                    shadeWidth: 6, shadeHeight: "5 1/4", unitScale: 46,
                    topBrace: { scope: "unit", label: "1 yard" },
                    leftBrace: { scope: "unit", label: "1 yard" },
                    expressionSuffix: "square yards",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l14-ip-shaded",
                lesson: "Lesson 14 \u00b7 Independent Practice",
                source: "plan/image54",
                caption: "3 ft \u00d7 4 1/4 ft",
                json: {
                    omdType: "areaDiagram",
                    columns: 3, rows: 5, rowParts: 4,
                    shadeHeight: "4 1/4", unitScale: 58,
                    topBrace: { scope: "grid", label: "3 ft" },
                    leftBrace: { scope: "shaded", label: "[4 1/4] ft" },
                    expressionSuffix: "square feet",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l14-hopscotch",
                lesson: "Lesson 14 \u00b7 Independent Practice",
                source: "plan/image56",
                caption: "Kayla's hopscotch \u2014 2 ft \u00d7 6 1/2 ft",
                json: {
                    omdType: "areaDiagram",
                    columns: 7, rows: 2, columnParts: 2,
                    shadeWidth: "6 1/2", unitScale: 52,
                    topBrace: { scope: "shaded" },
                    leftBrace: { scope: "grid", label: "2" },
                    expressionSuffix: "square feet",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
            {
                id: "l14-decompose",
                lesson: "Lesson 14 \u00b7 Independent Practice",
                source: "plan/image57",
                caption: "3 1/4 \u00d7 4 \u2014 decompose to multiply",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 4, columnParts: 4,
                    shadeWidth: "3 1/4", unitScale: 54,
                    topBrace: { scope: "shaded" },
                    leftBrace: { scope: "grid", label: "4" },
                    decompose: true, shadeColor: SHADE,
                },
            },
            {
                id: "l15-number-talk",
                lesson: "Lesson 15 \u00b7 Warm-up",
                source: "plan/image10",
                caption: "Number Talk \u2014 parentheses",
                json: {
                    omdType: "mathText",
                    text: "5 \u00d7 (7 + 4)\n(5 \u00d7 7) + (5 \u00d7 4)\n(5 \u00d7 7) + (5 \u00d7 [1/4])",
                    fontSize: 24,
                },
            },
            {
                id: "l15-holly",
                lesson: "Lesson 15 \u00b7 I Do",
                source: "plan/image58",
                caption: "Holly's garden \u2014 5 1/6 ft \u00d7 3 ft",
                json: {
                    omdType: "areaDiagram",
                    columns: 6, rows: 3, columnParts: 6,
                    shadeWidth: "5 1/6", unitScale: 52,
                    topBraces: [
                        { from: 0, to: 5, label: "5" },
                        { from: 5, to: "5 1/6" },
                    ],
                    leftBrace: { scope: "shaded", label: "3" },
                    partitionScope: "last",
                    decompose: true,
                    expressionSuffix: "square feet",
                    shadeColor: SHADE,
                },
            },
            {
                id: "l15-brad",
                lesson: "Lesson 15 \u00b7 We Do",
                source: "plan/image60",
                caption: "Brad's garden \u2014 3 1/5 ft \u00d7 2 ft",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 2, columnParts: 5,
                    shadeWidth: "3 1/5", unitScale: 58,
                    topBraces: [
                        { from: 0, to: 3, label: "3" },
                        { from: 3, to: "3 1/5" },
                    ],
                    leftBrace: { scope: "shaded", label: "2" },
                    partitionScope: "last",
                    decompose: true,
                    expressionSuffix: "square feet",
                    shadeColor: SHADE,
                },
            },
            {
                id: "l15-trevor",
                lesson: "Lesson 15 \u00b7 You Do",
                source: "plan/image61",
                caption: "Trevor's garden \u2014 5 ft \u00d7 3 2/5 ft",
                json: {
                    omdType: "areaDiagram",
                    columns: 5, rows: 4, rowParts: 5,
                    shadeWidth: 5, shadeHeight: "3 2/5", unitScale: 52,
                    topBrace: { scope: "shaded", label: "5" },
                    leftBraces: [
                        { from: 0, to: 3, label: "3" },
                        { from: 3, to: "3 2/5" },
                    ],
                    partitionScope: "last",
                    decompose: true, decomposeAxis: "y",
                    expressionSuffix: "square feet",
                    shadeColor: SHADE,
                },
            },
            {
                id: "l15-ip",
                lesson: "Lesson 15 \u00b7 Independent Practice",
                source: "plan/image63",
                caption: "2 \u00d7 3 2/5",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 2, columnParts: 5,
                    shadeWidth: "3 2/5", unitScale: 62,
                    topBrace: false, leftBrace: false,
                    partitionScope: "last",
                    expressionLine: true, shadeColor: SHADE,
                },
            },
        ],
    },

    {
        id: "assessment",
        section: "End-of-unit assessment",
        title: "MAT.05.UNIT.N02 \u2014 student form",
        blurb:
            "The four diagrams on the printed assessment, rebuilt as data. " +
            "Same numbers, same braces, no scanned bitmaps.",
        figures: [
            {
                id: "q1",
                lesson: "Question 1 \u00b7 5.NF.B.4.b",
                source: "usi/image1",
                caption: "What is the area of the shaded region? 4 \u00d7 2/5",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 1, rowParts: 5,
                    shadeHeight: "2/5", unitScale: 74,
                    topBrace: { scope: "grid", label: "4 units" },
                    leftBrace: { scope: "grid", label: "1 unit" },
                    shadeColor: SHADE,
                },
            },
            {
                id: "q2",
                lesson: "Question 2 \u00b7 5.NF.B.4.b, 5.OA.A.2",
                source: "usi/image2",
                caption: "Select all expressions for the shaded region \u2014 5 \u00d7 2 3/4",
                json: {
                    omdType: "areaDiagram",
                    columns: 5, rows: 3, rowParts: 4,
                    shadeHeight: "2 3/4", unitScale: 58,
                    topBrace: "unit", leftBrace: "unit",
                    shadeColor: SHADE,
                },
            },
            {
                id: "q6",
                lesson: "Question 6 \u00b7 5.NF.B.3",
                source: "usi/image3",
                caption: "Explain how the diagram shows 3 \u00f7 5 and 3 \u00d7 1/5",
                json: {
                    omdType: "fractionStrips",
                    strips: 3, parts: 5, shaded: 1,
                    stripLength: 420, stripThickness: 44, gap: 13,
                    brace: "1", shadeColor: SHADE,
                },
            },
            {
                id: "q12",
                lesson: "Question 12 \u00b7 5.NF.B.4.b",
                source: "usi/image4",
                caption: "Write an expression for the shaded region, then find the area",
                json: {
                    omdType: "areaDiagram",
                    columns: 4, rows: 2, rowParts: 3,
                    shadeHeight: "1 2/3", unitScale: 66,
                    topBrace: "unit", leftBrace: "unit",
                    shadeColor: SHADE,
                },
            },
        ],
    },
];

/**
 * Interactive configurations. These are the same components with input
 * affordances switched on — students shade, drag and type instead of reading.
 */
export const unit2Interactives = [
    {
        id: "paint-area",
        title: "Shade the region",
        lesson: "Lesson 11\u201312 \u00b7 build the model",
        instructions:
            "Press and drag across the grid to shade partition cells. The first cell " +
            "you touch decides whether the stroke shades or erases. The readout is the " +
            "exact area of whatever is shaded.",
        json: {
            omdType: "areaDiagram",
            columns: 6, rows: 1, rowParts: 4,
            shadeWidth: 0, shadeHeight: 0, unitScale: 62,
            topBrace: { scope: "grid", label: "6" },
            leftBrace: { scope: "grid", label: "1" },
            interactive: true, allowPaint: true,
            shadeColor: SHADE,
            inputs: [
                { label: "Shaded area:", readout: "area" },
            ],
        },
    },
    {
        id: "resize-area",
        title: "Drag the side lengths",
        lesson: "Lesson 13 \u00b7 fractional side lengths greater than 1",
        instructions:
            "Drag the round handles on the shaded rectangle. Side lengths snap to the " +
            "partition lines, so 2 1/4 by 2 is reachable but 2.3 by 2 is not. The braces " +
            "and the expression update as you drag.",
        json: {
            omdType: "areaDiagram",
            columns: 4, rows: 3, columnParts: 4,
            shadeWidth: "2 1/4", shadeHeight: 2, unitScale: 66,
            topBrace: { scope: "shaded" },
            leftBrace: { scope: "shaded" },
            interactive: true, allowPaint: false, allowResize: true,
            shadeColor: SHADE,
            inputs: [
                { label: "Expression:", readout: "expression" },
                { label: "Area:", readout: "area" },
            ],
        },
    },
    {
        id: "answer-area",
        title: "Write the expression and the area",
        lesson: "Lesson 12 \u00b7 Independent Practice",
        instructions:
            "Type the multiplication expression and the area. Answers are graded as exact " +
            "rationals, so 15/4 and 3 3/4 both count; the expression accepts x, \u00d7 or *.",
        json: {
            omdType: "areaDiagram",
            columns: 5, rows: 1, rowParts: 4,
            shadeHeight: "3/4", unitScale: 62,
            topBrace: { scope: "grid", label: "5" },
            leftBrace: { scope: "shaded" },
            interactive: true, allowPaint: false,
            checkAnswers: true,
            shadeColor: SHADE,
            inputs: [
                { key: "expression", label: "Expression:", width: 170, answer: ["5 x 3/4", "3/4 x 5"] },
                { key: "area", label: "Area:", width: 120, suffix: "square units", answer: "15/4" },
            ],
        },
    },
    {
        id: "garden-grid",
        title: "Draw the garden on the grid",
        lesson: "Lesson 14 \u00b7 Which garden is larger?",
        instructions:
            "Noah's garden is 5 yards by 6 1/4 yards. Shade it on the grid, then type its " +
            "area. Each unit square is one square yard and each dashed strip is a quarter.",
        json: {
            omdType: "areaDiagram",
            columns: 7, rows: 6, columnParts: 4,
            shadeWidth: 0, shadeHeight: 0, unitScale: 46,
            topBrace: { scope: "unit", label: "1 yard" },
            leftBrace: { scope: "unit", label: "1 yard" },
            interactive: true, allowPaint: true,
            checkAnswers: true,
            shadeColor: SHADE,
            inputs: [
                { label: "Shaded so far:", readout: "area" },
                { key: "area", label: "Noah's garden:", width: 120, suffix: "square yards", answer: "31 1/4" },
            ],
        },
    },
    {
        id: "share-strips",
        title: "Share the sandwiches",
        lesson: "Lesson 1\u20132 \u00b7 equal sharing",
        instructions:
            "Three sandwiches, four people. Click parts of the strips to build one person's " +
            "share, then check that it comes to 3/4.",
        json: {
            omdType: "fractionStrips",
            strips: 3, parts: 4, shaded: 0,
            stripLength: 420, stripThickness: 44, gap: 13,
            brace: "1", interactive: true, shadeColor: SHADE,
        },
    },
    {
        id: "circle-model",
        title: "Build the circle model",
        lesson: "Lesson 10 \u00b7 non-unit fractions",
        instructions: "Click wedges to shade them. Two circles of sixths, five sixths each, is 2 \u00d7 5/6.",
        json: {
            omdType: "fractionCircle",
            count: 2, parts: 6, shaded: 0,
            radius: 72, gap: 26,
            interactive: true,
        },
    },
];

/** Flat list of every static figure, for the smoke renderer. */
export function allFigures()
{
    return unit2.flatMap((group) =>
        group.figures.map((figure) => ({ ...figure, group: group.id })));
}
