# OMD Feasibility — Grade 5 Content

**Verdict: feasible. All three visual capability gaps in the 2025 NYST Grade 5 released test are now closed and proven with real renders.**

This directory is a working feasibility evaluation: `examples/g5-feasibility/`. It contains
three new/extended OMD capabilities, a Node render matrix (`render-cases.mjs`, 12/12 passing),
and a live browser gallery (`index.html`) whose screenshots are committed under `screenshots/`.

## What the 2025 test demands (and what OMD had)

| Requirement (from the released test) | Evidence in test | Before | After |
|---|---|---|---|
| Standard algorithms, parts connected to steps | Q3 (816÷12), Q31, Q34, Q36–44 constructed response | Nothing column-aligned; `omdEquationWork` is for equation-solving only | **New `omdAlgorithmWork`** — place-value grid, carry digits, long-division bracket, per-row `step` gating + side step list |
| Volume with unit cubes (nonstandard 3D omitted) | Q10 (first layer of prism), Q29 (identical layers), Q36 (V=90 ft³ find w) | `omdRectangularPrism` rendered smooth faces only | **Extended `omdRectangularPrism`**: `showUnitCubes: true`, `highlightLayer: n`, dimension labels compose over the cube grid |
| Fractions inline with text | Q11 ("baker has ¾…"), Q37–38 stems | Expressions render fractions stacked, but nothing mixes them into wrapped prose | **New `omdMathText`**: `[3/4]`, `[2 1/2]`, `[6]`, `**bold**` markup → real stacked math on the text baseline |
| Line plots with fraction axes | Q43 (paper airplane flights) | Nothing — `omdNumberLine` has no frequency stacks or fraction tick labels | **New `omdLinePlot`**: X-mark (or dot) stacks over a fraction/mixed-number axis, title + axis caption |

## Screenshots (real browser captures)

| File | Shows |
|---|---|
| `screenshots/algorithms-step-reveal.png` | Long division mid-reveal (step 1 highlighted, later rows still hidden) |
| `screenshots/division-complete.png` | Same problem fully worked through step 4 |
| `screenshots/volume-unit-cubes.png` | Unit-cube prisms with bottom/top layer highlighting + dimension labels |
| `screenshots/fractions-inline.png` | NYST Q11/Q38 word problems with stacked fractions inline |
| `screenshots/demo-hero.png` | Premium demo page (`demo.html`) — hero viewport |
| `screenshots/demo-page.png` | Full demo page with live-rendered bento cards |
| `screenshots/line-plot.png` | NYST Q43 line plot — X stacks over a quarter-yard mixed-number axis |
| `screenshots/cookbook-hero.png` | Cookbook page (`cookbook.html`) — hero viewport |
| `screenshots/cookbook-page.png` | All 16 cookbook examples |
| `screenshots/cookbook-card.png` | One example card — JSON left, live render right |

## Pages

| Page | Purpose |
|---|---|
| `demo.html` | Overview — the three capability gaps, one bento card each, live step-through |
| `cookbook.html` | Usage reference — 16 worked examples across all four components, each with the JSON that drew it |
| `gallery.html` | Raw gallery — every Node-rendered test case |

Local preview: serve the repo root (`python3 -m http.server` from `work/omd`) and open
`/examples/g5-feasibility/demo.html`. Hard-refresh after a rebuild — the page HTML is
cache-busted but `dist/omd.browser.js` is not.

## Publishing a public link

`build-site.mjs` assembles a self-contained static site into `public/` (gitignored):
it copies the three pages plus `dist/omd.browser.js` and rewrites the
`../../dist/...` import to a co-located path, so the folder deploys anywhere with
no build step. `demo.html` becomes the site's `index.html`.

```bash
npm run build:browser                                   # refresh the bundle
node examples/g5-feasibility/build-site.mjs             # assemble public/
python3 -m http.server 8941 --directory examples/g5-feasibility/public   # verify standalone
```

Deploy (either host serves it as pure static files):

```bash
cd examples/g5-feasibility/public

# Vercel — needs a valid session; the CLI token in this environment was expired
vercel login          # or: export VERCEL_TOKEN=<token from vercel.com/account/tokens>
vercel deploy --prod --yes

# Netlify — repo already carries netlify deps
netlify login && netlify deploy --prod --dir .
```

`public/vercel.json` sets a one-hour cache on the bundle; no other config is needed.

## New APIs

### `omdAlgorithmWork` (`algorithmWork`)
```js
{
    omdType: 'algorithmWork',
    operation: 'division',            // addition | subtraction | multiplication | division
    divisor: '12',                    // division only — draws the bracket
    columns: ['100s', '10s', '1s'],   // place-value headers
    rows: [
        { kind: 'carry',  cells: ['','6','8'], step: 3 },        // small red regrouped digits
        { kind: 'given',  cells: ['8','1','6'] },
        { kind: 'rule' },
        { kind: 'work',   cells: ['7','2'], step: 1, annotation: '12 × 6 = 72' },
        { kind: 'answer', cells: ['6','8'], step: 4 },
    ],
    steps: [{ label: 'Step 1', description: 'Divide the tens' }, ...],
    stepIndex: 2,                     // how many steps are revealed (default: all)
    activeRow: 3,                     // highlight band on the row the current step acts on
    showStepsList: true,
}
```
- Rows with `step > stepIndex` are invisible → one JSON object drives an entire animated lesson.
- `nextStep()` advances and returns the revealed description (for narration/TTS hooks).
- Colors reuse `omdColor` (`red` carries, `stepColor` highlight, `explainColor` bands).

### `omdRectangularPrism` extensions
```js
{ omdType: 'rectangularPrism', length: 5, width: 3, height: 6,
  showUnitCubes: true,      // draws each unit as a 3-face cube
  highlightLayer: 1,        // 1-based layer from the bottom gets the blue treatment
  layerColors: { top, side, front },   // optional overrides
  cubeGapRatio: 0.08 }      // inset between cubes (fraction of a unit)
```
- Cube grid is pinned to the prism faces exactly (pitch = 1 unit), so cubes never drift outside
  the outline regardless of dimensions; existing label/insideLabel rendering composes over it.
- Existing smooth-prism output is byte-for-byte unchanged when `showUnitCubes` is false.

### `omdMathText` (`mathText`)
```js
{ omdType: 'mathText',
  text: '**11** A baker has [3/4] of a box. He pours it into [6] bowls.',
  fontSize: 18, width: 720 }
```
- `[n/d]` → stacked fraction, `[w n/d]` → mixed number; numerators/denominators are real
  `omdExpression`s (so `[x+1/2]` works too), sized ~60% and centered on the reading line.
- Greedy word wrap at `width`; pieces never split across lines.
- Unknown tokens degrade to literal text instead of throwing.

## Registration / packaging
- Both components registered in `src/omdFactory.js` (`createFromJSON`, `getSupportedTypes`),
  exported from `src/index.js`, typed in `index.d.ts`.
- Browser bundle rebuilt (`dist/omd.browser.js`) — the gallery imports it.

## Verification performed
1. **Node matrix** (`node examples/g5-feasibility/render-cases.mjs`): 12 cases covering all four
   algorithms, three reveal states of the same division problem, layer-highlighted prisms,
   labeled prism, two fraction-prose problems. Each case fails on NaN/undefined layout tokens or
   degenerate size. **12/12 pass.**
2. **Live browser** (headless Chromium via CDP): 12 SVGs mount; zero NaN/undefined in any SVG;
   DOM assertions confirmed 3 red carry digits (addition), division bracket strokes, 273 cube-face
   paths on the highlighted 5×3×6 prism (90 cubes × 3 faces + outline), exact fraction-bar counts
   (baker: 1, chocolate: 2, hike: 2).
3. **Interaction proof**: clicking "Next step" mutates the SVG (5.6KB → 6.5KB → 7.2KB innerHTML),
   readout advances "Step 1: Divide the tens" → … → "Step 4: Subtract to check".
4. **Screenshots**: full-section captures at 2624px wide, saved to `screenshots/*.png`
   (pixel-statistics sanity-checked: thousands of unique colors, no blank captures).

## Known limitations / follow-ups (not blockers)
- `rationalExpression` has a **pre-existing** factory bug (`Cannot read properties of null`)
  unrelated to this work — worth a separate fix before G5 content authoring leans on it.
- `omdMathText` wraps by whole words only; very long unbroken strings need explicit breaks.
- Algorithm grid uses estimated glyph widths (same heuristic as `omdShapes`), so digit cells are
  fixed-width monospace-like — intentional for column alignment, not proportional type.
- The schema JSON (`schema/omd-schemas.json`) and samples were not regenerated; run
  `npm run build` (full) before publishing if downstream tooling consumes schemas.

## Run it yourself
```bash
cd work/omd
npm run build:browser                       # rebuild bundle if src changed
python3 -m http.server 8934 &               # from repo root
open http://127.0.0.1:8934/examples/g5-feasibility/index.html
node examples/g5-feasibility/render-cases.mjs   # headless render matrix
```

### `omdLinePlot` (`linePlot`)
```js
{
    omdType: 'linePlot',
    min: 9, max: 12, step: 0.25,        // axis range + tick interval
    values: [9, 9.5, 9.75, 10, 10.25],  // one entry per observation
    title: 'PAPER AIRPLANE FLIGHTS',
    axisLabel: 'Distance (yards)',
    marker: 'x',                        // 'x' (state-test style) | 'dot'
    width: 720, fontSize: 15, dotRadius: 6,
}
```
- Ticks that land on exact halves/quarters/eighths/thirds label themselves as
  fractions **including mixed numbers** (9¼, 9½, 9¾); anything else as a decimal.
- Marks stack bottom-up per observation, centered exactly on their tick.
