import { omdDisplay, omdSamples } from "../../src/index.js";

const grid = document.getElementById("stress-grid");
const typeFilter = document.getElementById("type-filter");
const failuresOnlyButton = document.getElementById("failures-only");
const runAgainButton = document.getElementById("run-again");

const statNodes = {
    status: document.getElementById("stat-status"),
    total: document.getElementById("stat-total"),
    passed: document.getElementById("stat-passed"),
    failed: document.getElementById("stat-failed"),
    warnings: document.getElementById("stat-warnings"),
    duration: document.getElementById("stat-duration")
};

const sharpCases = [
    {
        type: "expression",
        name: "expressionWork function spacing",
        json: { omdType: "expression", expression: "sin(theta) + cos(theta)", fontSize: 28 }
    },
    {
        type: "equation",
        name: "equation function equals fraction",
        json: { omdType: "equation", equation: "sin(x) = 1/2", fontSize: 34 }
    },
    {
        type: "equation",
        name: "equation nested function argument",
        json: { omdType: "equation", equation: "log(x + 2) = sqrt(x)", fontSize: 30 }
    },
    {
        type: "equationWork",
        name: "equationWork decimal alignment",
        json: {
            omdType: "equationWork",
            expressionAlign: "decimal",
            fontSize: 32,
            rows: [
                { kind: "expression", expression: "124.5" },
                { kind: "expression", expression: "+ 36.75" },
                { kind: "line" },
                { kind: "expression", expression: "161.25" },
                { kind: "text", text: "Decimal points stay aligned." }
            ]
        }
    },
    {
        type: "tileEquation",
        name: "tileEquation token sides",
        json: {
            omdType: "tileEquation",
            left: [{ kind: "x", count: 2 }, { kind: "const", value: 3 }],
            right: [{ kind: "const", value: 11 }],
            tileSize: 34,
            tileGap: 7
        }
    }
];

let cards = [];
let results = [];
let failuresOnly = false;

function buildCases() {
    const sampleCases = Object.entries(omdSamples || {}).flatMap(([type, samples]) => {
        if (!Array.isArray(samples)) return [];
        return samples.map((json, index) => ({
            type,
            name: `${type} #${index + 1}`,
            json
        }));
    });

    return sharpCases.concat(sampleCases);
}

const cases = buildCases();

function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
}

function setStats(next) {
    for (const [key, value] of Object.entries(next)) {
        if (statNodes[key]) statNodes[key].textContent = value;
    }
}

function populateFilter() {
    const types = [...new Set(cases.map((testCase) => testCase.type))].sort();
    for (const type of types) {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    }
}

function createCard(testCase, index) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.type = testCase.type;
    card.dataset.index = String(index);

    const head = document.createElement("div");
    head.className = "card-head";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = testCase.name;

    const status = document.createElement("div");
    status.className = "card-status";
    status.textContent = "PENDING";

    const target = document.createElement("div");
    target.className = "render-target";

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "JSON";

    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(testCase.json, null, 2);

    head.append(title, status);
    details.append(summary, pre);
    card.append(head, target, details);

    return { card, target, status };
}

function renderCards() {
    for (const entry of cards) {
        entry.display?.destroy?.();
    }

    grid.replaceChildren();
    cards = cases.map(createCard);
    grid.append(...cards.map(({ card }) => card));
    applyFilters();
}

function applyFilters() {
    const type = typeFilter.value;
    for (const { card } of cards) {
        const typeHidden = type !== "all" && card.dataset.type !== type;
        const failureHidden = failuresOnly && card.dataset.result !== "fail";
        card.classList.toggle("hidden", typeHidden || failureHidden);
    }
}

function inspectRender(display, target) {
    const component = display._component;
    const svg = target.querySelector("svg");
    const markup = svg?.outerHTML || "";
    const warnings = [];

    if (!component) throw new Error("No component was loaded.");
    if (!svg) throw new Error("No SVG was inserted into the browser DOM.");
    if (!Number.isFinite(component.width) || component.width <= 0) throw new Error(`Invalid component width: ${component.width}`);
    if (!Number.isFinite(component.height) || component.height <= 0) throw new Error(`Invalid component height: ${component.height}`);
    if (!markup || markup.length < 100) throw new Error("Rendered SVG markup is unexpectedly short.");
    if (/\bNaN\b|undefined|nullpx/.test(markup)) throw new Error("Rendered SVG contains invalid layout text.");

    const box = svg.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) warnings.push("zero browser bounding box");
    if (component.width > 5000 || component.height > 5000) warnings.push("very large component dimensions");

    return {
        chars: markup.length,
        width: Math.round(component.width),
        height: Math.round(component.height),
        domWidth: Math.round(box.width),
        domHeight: Math.round(box.height),
        warnings
    };
}

async function nextFrame() {
    await new Promise((resolve) => requestAnimationFrame(resolve));
}

async function runCase(testCase, index) {
    const entry = cards[index];
    const started = performance.now();
    let display = null;

    entry.display?.destroy?.();
    entry.display = null;
    entry.card.className = "card";
    entry.card.dataset.result = "running";
    entry.status.textContent = "RUNNING";
    entry.target.replaceChildren();

    try {
        display = new omdDisplay(entry.target, {
            alignment: "center",
            autoScale: true,
            maxScale: 1,
            padding: 8
        });
        entry.display = display;

        display.loadFromJSON(testCase.json);
        await nextFrame();
        display._layout();

        const metrics = inspectRender(display, entry.target);
        const duration = Math.round(performance.now() - started);
        const hasWarnings = metrics.warnings.length > 0;

        entry.card.classList.add(hasWarnings ? "warn" : "pass");
        entry.card.dataset.result = hasWarnings ? "warn" : "pass";
        entry.status.textContent = `${hasWarnings ? "WARN" : "PASS"} - ${formatNumber(metrics.chars)} chars`;

        return {
            ...testCase,
            index,
            status: hasWarnings ? "warn" : "pass",
            duration,
            metrics
        };
    } catch (error) {
        display?.destroy?.();
        entry.display = null;

        const duration = Math.round(performance.now() - started);
        const message = error?.stack || error?.message || String(error);
        const errorBox = document.createElement("div");
        errorBox.className = "error";
        errorBox.textContent = message;
        entry.target.replaceChildren(errorBox);
        entry.card.classList.add("fail");
        entry.card.dataset.result = "fail";
        entry.status.textContent = "FAIL";

        return {
            ...testCase,
            index,
            status: "fail",
            duration,
            error: message
        };
    }
}

async function runStressTest() {
    const started = performance.now();
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    results = [];
    renderCards();
    runAgainButton.disabled = true;
    setStats({
        status: "Running",
        total: formatNumber(cases.length),
        passed: "0",
        failed: "0",
        warnings: "0",
        duration: "0 ms"
    });

    if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
    }

    for (let i = 0; i < cases.length; i += 1) {
        const result = await runCase(cases[i], i);
        results.push(result);

        if (result.status === "fail") failed += 1;
        else if (result.status === "warn") warnings += 1;
        else passed += 1;

        if (i % 8 === 0) {
            setStats({
                status: `Running ${i + 1}/${cases.length}`,
                passed: formatNumber(passed),
                failed: formatNumber(failed),
                warnings: formatNumber(warnings),
                duration: `${Math.round(performance.now() - started)} ms`
            });
            await nextFrame();
        }
    }

    const duration = Math.round(performance.now() - started);
    window.__omdStressResults = results;
    setStats({
        status: failed ? "Failing" : (warnings ? "Warnings" : "Passing"),
        total: formatNumber(cases.length),
        passed: formatNumber(passed),
        failed: formatNumber(failed),
        warnings: formatNumber(warnings),
        duration: `${formatNumber(duration)} ms`
    });
    applyFilters();
    runAgainButton.disabled = false;
}

populateFilter();
renderCards();

typeFilter.addEventListener("change", applyFilters);
failuresOnlyButton.addEventListener("click", () => {
    failuresOnly = !failuresOnly;
    failuresOnlyButton.textContent = failuresOnly ? "Show all" : "Failures only";
    applyFilters();
});
runAgainButton.addEventListener("click", runStressTest);

runStressTest();
