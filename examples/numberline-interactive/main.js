import { omdDisplay } from "../../src/canvas/omdDisplay.js";
import { omdNumberLine } from "../../src/visualizations/omdNumberLine.js";

const eventLog = document.getElementById("event-log");
let sandboxLine = null;
let rangeLine = null;

function renderLine(containerId, config, options = {}) {
    const container = document.getElementById(containerId);
    const line = new omdNumberLine();
    line.loadFromJSON(config);

    const display = new omdDisplay(container, {
        centerContent: true,
        autoScale: true,
        maxScale: 1,
        padding: 10,
        ...options
    });
    display.load(line);

    line.svgObject.addEventListener("omd-numberline-change", (event) => {
        logEvent(containerId, event.detail);
    });

    return { line, display };
}

function logEvent(source, detail) {
    if (!eventLog) return;

    const item = document.createElement("div");
    item.className = "event";
    item.innerHTML = `<b>${source}</b><br>${escapeHtml(JSON.stringify(detail))}`;
    eventLog.prepend(item);

    while (eventLog.children.length > 18) {
        eventLog.lastChild.remove();
    }
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function sandboxConfig() {
    return {
        min: -10,
        max: 10,
        increment: 1,
        totalWidth: 620,
        title: "Change",
        label: "click, drag, nudge, delete",
        units: "",
        showLeftArrow: true,
        showRightArrow: true,
        specialNumbers: [
            { value: -10, label: "min", color: "#DB2323" },
            { value: 0, label: "zero", color: "#172033" },
            { value: 10, label: "max", color: "#DB2323" }
        ],
        dotValues: [
            { value: -6, color: "#2386DB", label: "left draggable dot" },
            { value: 2, color: "black", label: "middle draggable dot" },
            { value: 7, color: "#2386DB", label: "right draggable dot" }
        ],
        interactive: true,
        interactiveRange: true,
        rangeValues: [-3, 4],
        rangeStartClosed: true,
        rangeEndClosed: false,
        snapStep: 1,
        showValueLabels: true,
        showHoverValue: true,
        allowAddDots: true,
        allowDragDots: true,
        allowRemoveDots: true,
        maxInteractiveDots: 12,
        interactiveDotColor: "black"
    };
}

function mountSandbox() {
    const target = document.getElementById("sandbox-line");
    target.replaceChildren();
    sandboxLine = renderLine("sandbox-line", sandboxConfig()).line;
}

mountSandbox();

rangeLine = renderLine("range-line", {
    min: 0,
    max: 1,
    increment: 0.1,
    snapStep: 0.05,
    totalWidth: 600,
    title: "Probability",
    label: "selected interval",
    units: "",
    specialNumbers: [
        { value: 0, label: "0", color: "#172033" },
        { value: 0.5, label: "1/2", color: "#2386DB" },
        { value: 1, label: "1", color: "#172033" }
    ],
    dotValues: [
        { value: 0.25, color: "#2386DB" },
        { value: 0.75, color: "black" }
    ],
    interactive: true,
    interactiveRange: true,
    rangeValues: [0.2, 1],
    rangeStartStyle: "open",
    rangeEndStyle: "arrow",
    allowAddDots: false,
    allowRemoveDots: false,
    showHoverValue: true
}).line;

renderLine("locked-line", {
    min: -4,
    max: 4,
    increment: 1,
    snapStep: 0.25,
    totalWidth: 560,
    title: "Temperature",
    label: "locked and editable points",
    units: "°",
    showLeftArrow: true,
    showRightArrow: true,
    specialNumbers: [
        { value: -4, color: "#DB2323" },
        { value: 0, label: "0°", color: "#172033" },
        { value: 4, color: "#DB2323" }
    ],
    dotValues: [
        { value: -2, color: "#2386DB", label: "editable low" },
        { value: 0, color: "#DB2323", label: "locked zero", locked: true },
        { value: 2.5, color: "#2386DB", label: "editable high" }
    ],
    interactive: true,
    allowAddDots: false,
    allowRemoveDots: true,
    showValueLabels: true,
    showHoverValue: true
});

document.getElementById("add-random")?.addEventListener("click", () => {
    const value = -10 + Math.random() * 20;
    sandboxLine?.addInteractiveDot(value);
});

document.getElementById("reset-sandbox")?.addEventListener("click", () => {
    mountSandbox();
    logEvent("sandbox-line", { type: "reset" });
});

document.getElementById("clear-sandbox")?.addEventListener("click", () => {
    if (!sandboxLine) return;
    sandboxLine.dotValues = [];
    sandboxLine.updateLayout();
    logEvent("sandbox-line", { type: "clear", dotValues: [] });
});

document.getElementById("add-range")?.addEventListener("click", () => {
    rangeLine?.setInteractiveRange([0.2, 1], {
        startStyle: "open",
        endStyle: "arrow"
    });
});

document.getElementById("remove-range")?.addEventListener("click", () => {
    rangeLine?.clearInteractiveRange();
});

document.getElementById("cycle-start")?.addEventListener("click", () => {
    if (!rangeLine?.rangeValues) {
        rangeLine?.setInteractiveRange([0.2, 0.65]);
    }
    rangeLine?.cycleRangeEndpointStyle("start");
});

document.getElementById("cycle-end")?.addEventListener("click", () => {
    if (!rangeLine?.rangeValues) {
        rangeLine?.setInteractiveRange([0.2, 0.65]);
    }
    rangeLine?.cycleRangeEndpointStyle("end");
});
