/**
 * Node smoke render for every Grade 5 Unit 2 figure.
 *
 * Serializes each case through createFromJSON and checks the SVG the same way
 * examples/node-render-gallery does: no NaN / undefined / nullpx tokens, sane
 * dimensions, and — for area diagrams — the exact area the lesson expects.
 *
 *   node examples/g5-unit2/render-cases.mjs
 */

import { createFromJSON } from "../../src/index.js";
import { JsvgHeadlessXMLSerializer } from "@teachinglab/jsvg";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { allFigures, unit2Interactives } from "./unit2-cases.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "output");
mkdirSync(outDir, { recursive: true });

const serializer = new JsvgHeadlessXMLSerializer();
const BAD_TOKEN = /NaN|undefined|nullpx|Infinity/;

/** Areas the lesson materials state, keyed by figure id. */
const expectedArea = {
    "narrative-6-by-two-thirds": "2 2/5",
    "narrative-distributive": "6 4/5",
    "l11-wodb-d": "6",
    "l11-find-the-area-1": "6",
    "l11-find-the-area-2": "3",
    "l11-find-the-area-3": "2",
    "l11-find-the-area-4": "1 1/2",
    "l11-diagram-a": "12",
    "l11-diagram-b": "1 1/3",
    "l11-seven-fourths": "1 3/4",
    "l11-exit-ticket": "1 1/4",
    "l12-two-thirds": "2 2/3",
    "l12-three-fourths": "3",
    "l12-three-fifths": "2 2/5",
    "l12-ip-a": "3 1/3",
    "l12-ip-b": "1",
    "l12-multiple-choice": "1 1/2",
    "l12-exit-ticket": "3 3/4",
    "l13-greater-than-one": "18 2/3",
    "l13-ip-a": "4 1/2",
    "l13-ip-b": "11 1/4",
    "l13-stove-top": "9",
    "l13-exit-ticket": "9 3/4",
    "l14-noah-garden": "31 1/4",
    "l14-priya-garden": "31 1/2",
    "l14-ip-shaded": "12 3/4",
    "l14-hopscotch": "13",
    "l14-decompose": "13",
    "l15-holly": "15 1/2",
    "l15-brad": "6 2/5",
    "l15-trevor": "17",
    "l15-ip": "6 4/5",
    q1: "1 3/5",
    q2: "13 3/4",
    q12: "6 2/3",
};

/** Total shaded amount for strip and circle models. */
const expectedTotal = {
    "narrative-4-thirds": "1 1/3",
    "narrative-3-halves": "1 1/2",
    "l1-share-sandwiches": "3/4",
    "l2-two-fifths": "2/5",
    "l4-four-sixths": "2/3",
    "l5-seven-pizzas": "1 3/4",
    "l7-the-race": "1 1/2",
    "l8-unit-fraction": "1 1/4",
    "l9-three-fifths": "3/5",
    "l9-diagram-b": "1 1/5",
    "l10-chocolate-bars": "2 2/5",
    "l10-circles": "1 2/3",
    q6: "3/5",
};

let failures = 0;
let checks = 0;

function report(name, message)
{
    failures += 1;
    console.log(`  FAIL  ${name}: ${message}`);
}

const cases = [
    ...allFigures(),
    ...unit2Interactives.map((item) => ({ ...item, group: "interactive", caption: item.title })),
];

console.log(`Rendering ${cases.length} Unit 2 figures\n`);

for ( const testCase of cases )
{
    let component;
    try
    {
        component = createFromJSON(testCase.json);
    }
    catch ( error )
    {
        report(testCase.id, `createFromJSON threw: ${error.message}`);
        continue;
    }

    const svg = serializer.serializeToString(component.svgObject);

    if ( BAD_TOKEN.test(svg) )
        report(testCase.id, `bad token in SVG: ${svg.match(BAD_TOKEN)[0]}`);

    if ( !(component.width > 8) || !(component.height > 8) )
        report(testCase.id, `implausible size ${component.width}x${component.height}`);

    if ( expectedArea[testCase.id] !== undefined )
    {
        checks += 1;
        const actual = component.getState().area;
        if ( actual !== expectedArea[testCase.id] )
            report(testCase.id, `area ${actual}, expected ${expectedArea[testCase.id]}`);
    }

    if ( expectedTotal[testCase.id] !== undefined )
    {
        checks += 1;
        const actual = component.getState().total;
        if ( actual !== expectedTotal[testCase.id] )
            report(testCase.id, `total ${actual}, expected ${expectedTotal[testCase.id]}`);
    }

    writeFileSync(
        path.join(outDir, `${testCase.id}.svg`),
        `<svg xmlns="http://www.w3.org/2000/svg" width="${component.width}" height="${component.height}" ` +
        `viewBox="0 0 ${component.width} ${component.height}">` +
        `<rect width="100%" height="100%" fill="#ffffff"/>${svg}</svg>`,
    );
}

console.log(`\n${cases.length} figures rendered, ${checks} exact-value checks`);
console.log(failures === 0 ? "All checks passed." : `${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
