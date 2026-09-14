import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFromJSON, omdSamples } from "../../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "output");
const outputFile = path.join(outputDir, "index.html");

const sharpCases = [
    {
        type: "expression",
        name: "sharp expression function spacing",
        json: { omdType: "expression", expression: "sin(theta) + cos(theta)", fontSize: 28 }
    },
    {
        type: "equation",
        name: "sharp equation function fraction",
        json: { omdType: "equation", equation: "sin(x) = 1/2", fontSize: 34 }
    },
    {
        type: "equation",
        name: "sharp equation nested functions",
        json: { omdType: "equation", equation: "log(x + 2) = sqrt(x)", fontSize: 30 }
    },
    {
        type: "equationWork",
        name: "sharp equationWork decimals",
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
        type: "coordinatePlane",
        name: "sharp coordinatePlane slider",
        json: {
            omdType: "coordinatePlane",
            xMin: -5,
            xMax: 5,
            yMin: -5,
            yMax: 5,
            graphEquations: [{ equation: "y = ax + 2", color: "#2563eb", strokeWidth: 3 }],
            interactive: true,
            variables: [{ name: "a", value: 1, min: -3, max: 3, step: 0.5 }]
        }
    }
];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
}

function plainTranslateText(value) {
    return String(value ?? "")
        .replace(/<\s*br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "");
}

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

function annotateTranslateMirrors(visual, prefix) {
    const mirrors = [];
    let nextId = 0;

    const addMirror = (target, node, kind) => {
        const sourceText = plainTranslateText(node.text);
        if (!target || !sourceText.trim()) return;

        const mirrorId = `${prefix}-${nextId++}`;
        target.setAttribute("data-omd-translate-target", mirrorId);
        target.setAttribute("data-omd-translate-kind", kind);

        if (kind === "box") {
            target.setAttribute("data-omd-box-width", String(Number(node.width) || 0));
            target.setAttribute("data-omd-box-height", String(Number(node.height) || 0));
            target.setAttribute("data-omd-line-height", String(Number(node._lineHeight || node._fontSize) || 16));
            target.setAttribute("data-omd-text-align", node._textAlign || "left");
            target.setAttribute("data-omd-vertical-center", node._verticalCenter ? "true" : "false");
        }

        mirrors.push({ id: mirrorId, text: sourceText });
    };

    const walk = (node) => {
        if (!node) return;

        if (node._translateMirrorEnabled === true) {
            if (node.textElement) {
                addMirror(node.textElement, node, "box");
            } else if (node.div) {
                addMirror(node.div, node, "html");
            } else if (node.svgObject?.tagName?.toLowerCase?.() === "text") {
                addMirror(node.svgObject, node, "line");
            }
        }

        for (const child of node.childList || []) walk(child);
    };

    walk(visual);
    return mirrors;
}

function renderTranslateMirrors(mirrors) {
    if (!mirrors?.length) return "";

    return mirrors.map((mirror) => (
        `<span translate="yes" data-omd-translate-mirror="${escapeHtml(mirror.id)}" data-omd-translate-source="${escapeHtml(mirror.text)}">${escapeHtml(mirror.text)}</span>`
    )).join("\n");
}

function serializeVisual(visual, index) {
    const mirrors = annotateTranslateMirrors(visual, `omd-mirror-${index}`);
    const width = Math.max(1, Math.ceil(Number(visual.width) || 1));
    const height = Math.max(1, Math.ceil(Number(visual.height) || 1));
    const markup = new XMLSerializer().serializeToString(visual.svgObject);

    return {
        width,
        height,
        markup,
        html: `<svg class="generated-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${markup}</svg>`,
        mirrorHtml: renderTranslateMirrors(mirrors)
    };
}

function renderCase(testCase, index) {
    const started = performance.now();

    try {
        const visual = createFromJSON(testCase.json);
        const serialized = serializeVisual(visual, index);
        const chars = serialized.markup.length;
        const hasBadLayout = /\bNaN\b|undefined|nullpx/.test(serialized.markup);
        const hasSize = serialized.width > 1 && serialized.height > 1;
        const duration = Math.round(performance.now() - started);

        if (!hasSize || hasBadLayout) {
            throw new Error(`Bad output: width=${serialized.width}, height=${serialized.height}, hasBadLayout=${hasBadLayout}`);
        }

        return {
            index,
            status: "pass",
            ...testCase,
            duration,
            chars,
            width: serialized.width,
            height: serialized.height,
            visualHtml: serialized.html,
            mirrorHtml: serialized.mirrorHtml
        };
    } catch (error) {
        return {
            index,
            status: "fail",
            ...testCase,
            duration: Math.round(performance.now() - started),
            error: error?.stack || error?.message || String(error),
            visualHtml: `<pre class="error">${escapeHtml(error?.stack || error?.message || String(error))}</pre>`,
            mirrorHtml: ""
        };
    }
}

function renderCard(result) {
    const meta = result.status === "pass"
        ? `PASS - ${formatNumber(result.chars)} chars - ${result.width}x${result.height}`
        : "FAIL";

    return `
        <article class="card ${result.status}" data-type="${escapeHtml(result.type)}" data-status="${result.status}">
            <header class="card-head">
                <div class="card-title">${escapeHtml(result.name)}</div>
                <div class="card-status">${escapeHtml(meta)}</div>
            </header>
            <div class="visual">${result.visualHtml}</div>
            <details>
                <summary>JSON</summary>
                <pre>${escapeHtml(JSON.stringify(result.json, null, 2))}</pre>
            </details>
        </article>
    `;
}

function renderPage(results) {
    const passed = results.filter((result) => result.status === "pass").length;
    const failed = results.length - passed;
    const types = [...new Set(results.map((result) => result.type))].sort();
    const options = types
        .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
        .join("");
    const mirrorHtml = results
        .map((result) => result.mirrorHtml || "")
        .filter(Boolean)
        .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OMD Node Render Gallery</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: #f4f6f8;
            color: #172033;
            font-family: Arial, Helvetica, sans-serif;
        }
        .topbar {
            position: sticky;
            top: 0;
            z-index: 10;
            display: grid;
            grid-template-columns: minmax(220px, 1fr) auto;
            gap: 16px;
            align-items: center;
            padding: 14px 18px;
            background: #ffffff;
            border-bottom: 1px solid #d8dee8;
        }
        h1 {
            margin: 0 0 4px;
            font-size: 20px;
        }
        .meta {
            margin: 0;
            color: #60708a;
            font-size: 13px;
        }
        .controls {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            flex-wrap: wrap;
        }
        select,
        button {
            height: 34px;
            border: 1px solid #c8d0dc;
            border-radius: 7px;
            background: #ffffff;
            color: #172033;
            font: inherit;
            font-size: 13px;
        }
        select { min-width: 150px; padding: 0 10px; }
        button { padding: 0 12px; cursor: pointer; }
        main { padding: 16px; }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 14px;
        }
        .card {
            display: grid;
            grid-template-rows: auto minmax(150px, auto) auto;
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #ccd5e0;
            border-left: 5px solid #6b7280;
            border-radius: 8px;
        }
        .card.pass { border-left-color: #15803d; }
        .card.fail { border-left-color: #dc2626; }
        .card.hidden { display: none; }
        .card-head {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: baseline;
            padding: 11px 12px;
            border-bottom: 1px solid #e8edf3;
        }
        .card-title {
            overflow: hidden;
            font-size: 13px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .card-status {
            color: #60708a;
            font-size: 11px;
            white-space: nowrap;
        }
        .visual {
            display: flex;
            min-height: 150px;
            align-items: center;
            justify-content: center;
            padding: 12px;
            border-bottom: 1px solid #e8edf3;
        }
        .generated-svg {
            max-width: 100%;
            max-height: 300px;
            height: auto;
        }
        details {
            padding: 9px 12px 12px;
        }
        summary {
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            color: #2b3b52;
        }
        pre {
            max-height: 220px;
            margin: 9px 0 0;
            overflow: auto;
            color: #25334a;
            font-size: 11px;
            line-height: 1.4;
            white-space: pre-wrap;
        }
        .error {
            width: 100%;
            color: #991b1b;
        }
        .omd-translate-mirror-root {
            position: fixed;
            left: -12000px;
            top: 0;
            z-index: -1;
            width: 4000px;
            max-width: 4000px;
            min-height: 1px;
            overflow: hidden;
            opacity: 0.01;
            pointer-events: none;
            user-select: none;
            white-space: pre-wrap;
        }
        .omd-translate-mirror-root span {
            display: inline-block;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <header class="topbar">
        <div>
            <h1>OMD Node Render Gallery</h1>
            <p class="meta">${formatNumber(passed)}/${formatNumber(results.length)} passed, ${formatNumber(failed)} failed. Generated ${escapeHtml(new Date().toLocaleString())} from Node-created SVG.</p>
        </div>
        <div class="controls">
            <select id="type-filter" aria-label="Filter by type">
                <option value="all">All types</option>
                ${options}
            </select>
            <button id="failures-only" type="button">Failures only</button>
        </div>
    </header>
    <main>
        <section class="grid" id="gallery">
            ${results.map(renderCard).join("\n")}
        </section>
    </main>
    <div class="omd-translate-mirror-root" aria-hidden="true" translate="yes">
        ${mirrorHtml}
    </div>
    <script>
        const typeFilter = document.getElementById("type-filter");
        const failuresOnlyButton = document.getElementById("failures-only");
        const cards = [...document.querySelectorAll(".card")];
        let failuresOnly = false;

        function applyFilters() {
            const type = typeFilter.value;
            for (const card of cards) {
                const hiddenByType = type !== "all" && card.dataset.type !== type;
                const hiddenByStatus = failuresOnly && card.dataset.status !== "fail";
                card.classList.toggle("hidden", hiddenByType || hiddenByStatus);
            }
        }

        typeFilter.addEventListener("change", applyFilters);
        failuresOnlyButton.addEventListener("click", () => {
            failuresOnly = !failuresOnly;
            failuresOnlyButton.textContent = failuresOnly ? "Show all" : "Failures only";
            applyFilters();
        });

        const svgNamespace = "http://www.w3.org/2000/svg";
        const mirrorNodes = [...document.querySelectorAll("[data-omd-translate-mirror]")];

        function getMirrorTarget(mirror) {
            const id = mirror.dataset.omdTranslateMirror;
            if (!id) return null;
            return document.querySelector('[data-omd-translate-target="' + id + '"]');
        }

        function numberData(element, name, fallback) {
            const value = Number(element.dataset[name]);
            return Number.isFinite(value) ? value : fallback;
        }

        function getBoxTextX(target, width) {
            const align = (target.dataset.omdTextAlign || "left").toLowerCase();
            if (align === "center" || align === "middle") return width / 2;
            if (align === "right" || align === "end") return width;
            return 0;
        }

        function setBoxAnchor(target) {
            const align = (target.dataset.omdTextAlign || "left").toLowerCase();
            if (align === "center" || align === "middle") {
                target.setAttribute("text-anchor", "middle");
            } else if (align === "right" || align === "end") {
                target.setAttribute("text-anchor", "end");
            } else {
                target.setAttribute("text-anchor", "start");
            }
        }

        function renderTextBox(target, text) {
            const lines = String(text || "").split(/\\r?\\n/);
            const width = numberData(target, "omdBoxWidth", 0);
            const height = numberData(target, "omdBoxHeight", 0);
            const lineHeight = numberData(target, "omdLineHeight", 16);
            const blockHeight = lineHeight * Math.max(1, lines.length);
            const centered = target.dataset.omdVerticalCenter === "true";
            const startY = centered ? Math.max(0, (height - blockHeight) / 2) : 0;
            const startX = getBoxTextX(target, width);

            while (target.firstChild) target.removeChild(target.firstChild);
            target.setAttribute("dominant-baseline", "hanging");
            setBoxAnchor(target);

            for (let index = 0; index < Math.max(1, lines.length); index++) {
                const tspan = document.createElementNS(svgNamespace, "tspan");
                tspan.textContent = lines[index] || "";
                tspan.setAttribute("x", startX);
                if (index === 0) {
                    tspan.setAttribute("y", startY);
                } else {
                    tspan.setAttribute("dy", lineHeight);
                }
                target.appendChild(tspan);
            }
        }

        function applyMirrorText(mirror) {
            const target = getMirrorTarget(mirror);
            if (!target) return;

            const text = mirror.textContent || "";
            const kind = target.dataset.omdTranslateKind || "line";
            if (kind === "box") {
                renderTextBox(target, text);
            } else {
                target.textContent = text;
            }
        }

        function handleMirrorMutation(mirror) {
            const source = mirror.dataset.omdTranslateSource || "";
            const current = mirror.textContent || "";
            if (current === source && mirror.dataset.omdTranslated !== "true") return;

            mirror.dataset.omdTranslated = current === source ? "false" : "true";
            applyMirrorText(mirror);
        }

        for (const mirror of mirrorNodes) {
            const observer = new MutationObserver(() => handleMirrorMutation(mirror));
            observer.observe(mirror, { characterData: true, childList: true, subtree: true });
        }
    </script>
</body>
</html>`;
}

function renderAllCases(cases) {
    const originalConsoleLog = console.log;
    try {
        console.log = () => {};
        return cases.map(renderCase);
    } finally {
        console.log = originalConsoleLog;
    }
}

await mkdir(outputDir, { recursive: true });

const cases = buildCases();
const results = renderAllCases(cases);
await writeFile(outputFile, renderPage(results), "utf8");

const passed = results.filter((result) => result.status === "pass").length;
const failed = results.length - passed;

console.log(`Wrote ${path.relative(process.cwd(), outputFile)}`);
console.log(`${passed}/${results.length} passed, ${failed} failed`);
