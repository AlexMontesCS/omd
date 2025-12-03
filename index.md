# OMD Index

An index map of this OMD repos

## Quick links
- Project overview: [README.md](README.md)
- Package entry point: [index.js](index.js)
- Primary docs home: [npm-docs/README.md](npm-docs/README.md) (built: [npm-docs/index.html](npm-docs/index.html), [npm-docs.html](npm-docs.html))
- Example hub: [examples/index.html](examples/index.html)
- One-file API snippet: [simple-api-example.html](simple-api-example.html)

## Documentation
- **npm package docs (`npm-docs/`)**
  - Overview: [npm-docs/README.md](npm-docs/README.md); summary: [npm-docs/DOCUMENTATION_SUMMARY.md](npm-docs/DOCUMENTATION_SUMMARY.md)
  - Guides: [npm-docs/guides/getting-started.md](npm-docs/guides/getting-started.md), [npm-docs/guides/quick-examples.md](npm-docs/guides/quick-examples.md), [npm-docs/guides/factory-functions.md](npm-docs/guides/factory-functions.md), [npm-docs/guides/visualizations.md](npm-docs/guides/visualizations.md), [npm-docs/guides/equations.md](npm-docs/guides/equations.md)
  - API: [npm-docs/api/api-reference.md](npm-docs/api/api-reference.md) plus the complete node docs in [npm-docs/api/](npm-docs/api/)
  - Schemas: [npm-docs/json-schemas.md](npm-docs/json-schemas.md)
  - Built site: [npm-docs/index.html](npm-docs/index.html)
- **Single-page mirrors**
  - [npm-docs.html](npm-docs.html), [readme.html](readme.html) provide quick HTML views of the main docs.

## Examples & demos
- Central launcher: [examples/index.html](examples/index.html) (links to the main interactive demos).
- Core demos:
  - [examples/minimal.html](examples/minimal.html) – bare-bones render setup.
  - [examples/simple-usage.html](examples/simple-usage.html) – interactive controls around basic rendering.
  - [examples/equation-stack-test.html](examples/equation-stack-test.html) – working with `omdEquationStack`.
  - [examples/highlighting-test.html](examples/highlighting-test.html) – equation highlighting interactions.
  - [examples/worked-solution.html](examples/worked-solution.html) – step-by-step worked solution view.
  - [examples/kids-interactive.html](examples/kids-interactive.html) (styles in [examples/kids-interactive.css](examples/kids-interactive.css)) – kid-focused solver UI.
  - [examples/expression-playground.html](examples/expression-playground.html) – advanced expression playground.
  - [examples/drag-and-drop-playground.html](examples/drag-and-drop-playground.html) – canvas drag/move demo.
  - [examples/focus-frame-demo.html](examples/focus-frame-demo.html) – focus-frame controls on a canvas.
  - [examples/node-overlay-demo.html](examples/node-overlay-demo.html) with presets in [examples/node-overlay-examples.js](examples/node-overlay-examples.js).
- Additional showcases:
  - [examples/equation-rendering/index.html](examples/equation-rendering/index.html) + [examples/equation-rendering/main.js](examples/equation-rendering/main.js) – bundler-friendly rendering sample.
  - [examples/canvas/index.html](examples/canvas/index.html) + [examples/canvas/canvas.js](examples/canvas/canvas.js) – modular drawing/canvas system.
- Other entry points: [index.html](index.html), [index-ai.html](index-ai.html) for the main site shells; [npm-docs.html](npm-docs.html) for docs-only views; [simple-api-example.html](simple-api-example.html) for a compact API demo.
- React sample app: [react-demo/README.md](react-demo/README.md) with sources under [react-demo/src/](react-demo/src/) and static shell [react-demo/index.html](react-demo/index.html).

## Source layout
- [index.js](index.js) re-exports the core (`omd/`), canvas, and visualization modules and exposes factory helpers.
- [omd/](omd/) – core library modules split into `config/`, `core/`, `nodes/`, `simplification/`, `step-visualizer/`, `utils/` (e.g., `omdDisplay`, equation nodes, overlay utilities).
- [canvas/](canvas/) – canvas rendering stack (core, drawing, events, features, tools, ui, utils) powering `omdCanvas` and interactive demos.
- [src/](src/) – visualization components and helpers (number line, tape diagrams, coordinate plane, ratio charts, spinner, tables, tile equations, JSON factory utilities, schemas/samples).
- [jsvg/](jsvg/) – SVG helper library bundled with the package.
- Built artifacts and docs: [dist/](dist/), [npm-docs/](npm-docs/), [npm-docs.html](npm-docs.html), [readme.html](readme.html).
- Tooling & deploy: [vite.config.js](vite.config.js), [build-docs.js](build-docs.js), [build-npm-docs.js](build-npm-docs.js), [copy-static.js](copy-static.js), [netlify/](netlify/) and [netlify.toml](netlify.toml).

## Key visualizations (`src/`)
- [src/omdNumberLine.js](src/omdNumberLine.js) and [src/omdDoubleNumberLine.js](src/omdDoubleNumberLine.js) – single and double number lines.
- [src/omdTapeDiagram.js](src/omdTapeDiagram.js) and [src/omdDoubleTapeDiagram.js](src/omdDoubleTapeDiagram.js) – tape diagram variants.
- [src/omdCoordinatePlane.js](src/omdCoordinatePlane.js) – 2D plotting with functions/shapes.
- [src/omdRatioChart.js](src/omdRatioChart.js) – ratio/pie/bar visualizations.
- [src/omdSpinner.js](src/omdSpinner.js) – interactive spinner.
- [src/omdTable.js](src/omdTable.js) – configurable tables.
- [src/omdTileEquation.js](src/omdTileEquation.js) – tile-based equation visuals.
- [src/omdBalanceHanger.js](src/omdBalanceHanger.js) – balance-scale visualization.

## Scripts (`package.json`)
- `npm run dev` – rebuild docs then start the Vite dev server.
- `npm run build` – Vite build plus static/doc copies for the site and npm docs.
- `npm run build:docs` / `npm run build:npm-docs` / `npm run build:static` – targeted build steps.
- `npm run dev:netlify` – prep docs and run the Netlify dev server.
