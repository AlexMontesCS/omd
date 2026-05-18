import { omdDisplay, omdNumberLine } from "../../dist/omd.browser.js";

const equationTarget = document.getElementById("equation");
const numberLineTarget = document.getElementById("number-line");

if (!equationTarget || !numberLineTarget) {
    throw new Error("Missing render targets for the minimal browser example.");
}

new omdDisplay(equationTarget, {
    centerContent: true,
    autoScale: true,
    maxScale: 1
}).render("2*x + 3 = 11");

const numberLine = new omdNumberLine();
numberLine.loadFromJSON({
    min: 0,
    max: 12,
    increment: 1,
    dotValues: [4, 9],
    title: "Points scored"
});

new omdDisplay(numberLineTarget, {
    centerContent: true,
    autoScale: true,
    maxScale: 1
}).load(numberLine);
