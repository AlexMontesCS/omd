// Feasibility smoke matrix: renders every G5 visual through createFromJSON
// in Node and validates serialized SVG the same way examples/node-render-gallery
// does (no NaN/undefined/nullpx, sane dimensions).
import { createFromJSON } from "../../src/index.js";
import { JsvgHeadlessXMLSerializer } from "@teachinglab/jsvg";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "output");
mkdirSync(outDir, { recursive: true });

const cases = [
    {
        name: "addition-3576-2489",
        label: "Addition with regrouping — 3,576 + 2,489",
        json: {
            omdType: "algorithmWork",
            operation: "addition",
            columns: ["1000s", "100s", "10s", "1s"],
            rows: [
                { kind: "carry", cells: ["1", "1", "1", ""], step: 2 },
                { kind: "given", cells: ["3", "5", "7", "6"] },
                { kind: "given", cells: ["+", "2", "4", "8", "9"] },
                { kind: "rule" },
                { kind: "answer", cells: ["6", "0", "6", "5"], step: 4 },
            ],
            steps: [
                { label: "Step 1", description: "Line up place values" },
                { label: "Step 2", description: "Add ones; regroup tens" },
                { label: "Step 3", description: "Add tens; regroup hundreds" },
                { label: "Step 4", description: "Add hundreds & thousands" },
            ],
        },
    },
    {
        name: "subtraction-6320-2756",
        label: "Subtraction with regrouping — 6,320 − 2,756",
        json: {
            omdType: "algorithmWork",
            operation: "subtraction",
            columns: ["1000s", "100s", "10s", "1s"],
            rows: [
                { kind: "given", cells: ["6", "3", "2", "0"] },
                { kind: "given", cells: ["−", "2", "7", "5", "6"] },
                { kind: "rule" },
                { kind: "answer", cells: ["3", "5", "6", "4"], step: 3 },
            ],
            steps: [
                { label: "Step 1", description: "Line up place values" },
                { label: "Step 2", description: "Regroup to subtract ones and tens" },
                { label: "Step 3", description: "Subtract hundreds & thousands" },
            ],
        },
    },
    {
        name: "multiplication-24x36",
        label: "Multiplication — 24 × 36 (partial products into the algorithm)",
        json: {
            omdType: "algorithmWork",
            operation: "multiplication",
            columns: ["100s", "10s", "1s"],
            rows: [
                { kind: "carry", cells: ["2", ""], step: 3 },
                { kind: "given", cells: ["2", "4"] },
                { kind: "given", cells: ["×", "", "3", "6"] },
                { kind: "rule" },
                { kind: "work", cells: ["1", "4", "4"], step: 1, annotation: "24 × 6 = 144" },
                { kind: "work", cells: ["7", "2", ""], step: 2, annotation: "24 × 30 = 720" },
                { kind: "rule", gapAfter: 4, step: 2 },
                { kind: "answer", cells: ["8", "6", "4"], step: 4 },
            ],
            steps: [
                { label: "Step 1", description: "Multiply by the ones digit" },
                { label: "Step 2", description: "Multiply by the tens digit" },
                { label: "Step 3", description: "Regroup while adding" },
                { label: "Step 4", description: "Add partial products" },
            ],
        },
    },
    {
        name: "division-816-div-12",
        label: "Long division — 816 ÷ 12 (NYST 2025 #3 style)",
        json: {
            omdType: "algorithmWork",
            operation: "division",
            divisor: "12",
            columns: ["100s", "10s", "1s"],
            rows: [
                { kind: "answer", cells: ["", "", "6"], step: 2 },
                { kind: "rule", gapAfter: 2 },
                { kind: "given", cells: ["8", "1", "6"] },
                { kind: "work", cells: ["7", "2"], step: 1, annotation: "12 × 6 = 72" },
                { kind: "rule", gapAfter: 3, step: 1 },
                { kind: "work", cells: ["9", "6"], step: 2, annotation: "81 − 72 = 96 after bring-down" },
                { kind: "work", cells: [], step: 3 },
                { kind: "answer", cells: [], step: 4 },
            ],
            steps: [
                { label: "Step 1", description: "Divide 81 by 12 → 6, subtract 72" },
                { label: "Step 2", description: "Bring down 6 → divide 96 by 12" },
                { label: "Step 3", description: "12 × 8 = 96, subtract" },
                { label: "Step 4", description: "Remainder 0 → quotient 68" },
            ],
            showStepsList: true,
        },
    },
    // Progressive reveal of the same division problem.
    ...[0, 1, 2].map(i => ({
        name: `division-steps-${i}`,
        label: `Long division — revealed through step ${i}`,
        json: {
            omdType: "algorithmWork",
            operation: "division",
            divisor: "12",
            columns: ["100s", "10s", "1s"],
            stepIndex: i === 0 ? 0 : i + 1,
            activeRow: i === 0 ? -1 : [3, 5][i - 1],
            rows: [
                { kind: "given", cells: ["8", "1", "6"] },
                { kind: "work", cells: ["7", "2"], step: 1, annotation: "12 × 6 = 72" },
                { kind: "rule", gapAfter: 3, step: 1 },
                { kind: "work", cells: ["9", "6"], step: 2, annotation: "bring down the 6" },
                { kind: "rule", gapAfter: 3, step: 2 },
                { kind: "work", cells: ["9", "6"], step: 3, annotation: "12 × 8 = 96" },
                { kind: "rule", gapAfter: 3, step: 3 },
                { kind: "answer", cells: ["6", "8"], step: 4 },
            ],
            showStepsList: true,
            steps: [
                { label: "Step 1", description: "Divide 81 by 12" },
                { label: "Step 2", description: "Bring down the 6" },
                { label: "Step 3", description: "Divide 96 by 12" },
                { label: "Step 4", description: "Quotient: 68" },
            ],
        },
    })),
    {
        name: "volume-layer-1",
        label: "Volume — first layer of 15 cubes (NYST 2025 #10)",
        json: {
            omdType: "rectangularPrism",
            length: 5, width: 3, height: 6,
            showUnitCubes: true, highlightLayer: 1, unitScale: 20,
        },
    },
    {
        name: "volume-full",
        label: "Volume — all layers visible",
        json: {
            omdType: "rectangularPrism",
            length: 5, width: 3, height: 6,
            showUnitCubes: true, unitScale: 20,
        },
    },
    {
        name: "prism-dimensions",
        label: "Prism with dimension labels (NYST 2025 #36 style)",
        json: {
            omdType: "rectangularPrism",
            length: 5, width: 3, height: 6,
            showUnitCubes: true, highlightLayer: 6, unitScale: 18,
            sideLabels: { l: "5 ft", w: "3 ft", h: "6 ft" },
            insideLabel: "V = 90 cubic feet",
        },
    },
    {
        name: "mathtext-baker",
        label: "Fractions inline with text (NYST 2025 #11)",
        json: {
            omdType: "mathText",
            text: "**11** A baker has [3/4] of a box of muffin mix. He pours all the muffin mix equally into [6] bowls.",
            fontSize: 19,
            width: 430,
        },
    },
    {
        name: "mathtext-chocolate",
        label: "Mixed numbers inline with text (NYST 2025 #38)",
        json: {
            omdType: "mathText",
            text: "Leia has [2 1/2] pounds of chocolate. She puts [1/4] pound into each bag.",
            fontSize: 19,
            width: 400,
        },
    },
];

const serializer = new JsvgHeadlessXMLSerializer();
let pass = 0;
let fail = 0;

for ( const testCase of cases )
{
    try
    {
        const visual = createFromJSON(testCase.json);
        const width = Math.max(1, Math.ceil(Number(visual.width) || 1));
        const height = Math.max(1, Math.ceil(Number(visual.height) || 1));
        const markup = serializer.serializeToString(visual.svgObject) ||
            new XMLSerializer().serializeToString(visual.svgObject);

        if ( /\bNaN\b|undefined|nullpx/.test(markup) )
            throw new Error("bad layout tokens in SVG");
        if ( width <= 1 || height <= 1 )
            throw new Error(`degenerate size ${width}x${height}`);

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${markup}</svg>`;
        writeFileSync(path.join(outDir, `${testCase.name}.svg`), svg);

        console.log(`PASS ${testCase.name} (${width}x${height})`);
        pass++;
    }
    catch ( error )
    {
        console.log(`FAIL ${testCase.name}: ${error.message}`);
        fail++;
    }
}

console.log(`\n${pass}/${cases.length} passed`);
process.exit(fail > 0 ? 1 : 0);
