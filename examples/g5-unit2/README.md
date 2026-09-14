# Grade 5 Unit 2 — Fractions as Quotients and Fraction Multiplication

Every diagram in the Unit 2 plan and the end-of-unit assessment, expressed as OMD JSON.

```
unit2-cases.mjs   the catalog: 60 static figures + 6 interactive configurations
index.html        the browser gallery (vite dev server)
render-cases.mjs  Node smoke render + exact-value checks
output/           one standalone SVG per case, written by render-cases.mjs
```

The catalog is the single source for both consumers, so the page and the smoke run can
never drift.

## Run it

```bash
npm run dev
# then open http://localhost:5173/examples/g5-unit2/index.html

node examples/g5-unit2/render-cases.mjs
# 66 figures rendered, 48 exact-value checks — All checks passed.
```

`render-cases.mjs` fails the process if any figure emits `NaN`/`undefined` into its SVG,
collapses to an implausible size, or reports an area the lesson materials disagree with
(for example `l13-greater-than-one` must be exactly `18 2/3`).

## What the unit needs

| Section | Lessons | Components |
|---|---|---|
| Unit narrative | — | `fractionStrips`, `areaDiagram` |
| A — Fractions as Quotients | 1–6 | `fractionStrips`, `table`, `mathText` |
| B — Fractions of Whole Numbers | 7–10 | `fractionStrips`, `fractionCircle`, `mathText` |
| C — Area and Fractional Side Lengths | 11–15 | `areaDiagram` |
| End-of-unit assessment | — | `areaDiagram`, `fractionStrips` |

`areaDiagram`, `fractionStrips` and `fractionCircle` were added for this unit; their fields
are documented in [`docs/visualizations.md`](../../docs/visualizations.md).

## Fidelity notes

Each figure carries a `source` naming the bitmap it replaces (`plan/imageNN` from the unit
plan, `usi/imageNN` from the student assessment form). Two conventions from the source
materials are reproduced by options rather than by hand:

- **`partitionScope: 'last'`** — mixed-number diagrams subdivide only the unit the shading
  ends inside. 3 2/5 is three plain unit squares plus one partitioned into fifths.
- **`decompose: true`** — Lesson 14–15 figures tint the fractional part, rule the split and
  print the partial products, e.g. `(2 × 3) + (2 × 2/5) = 6 + 4/5 = 6 4/5`.

## Interaction

The interactive panels exercise all four input modes:

| Panel | Mode |
|---|---|
| `paint-area` | press and drag to shade or erase partition cells |
| `resize-area` | drag corner/edge handles; side lengths snap to partition lines |
| `answer-area` | typed expression and area, graded as exact rationals |
| `garden-grid` | shade a 5 by 6 1/4 garden on blank grid paper, then answer |
| `share-strips` | click strip parts to build one person's share |
| `circle-model` | click wedges |

Every gesture emits `onChange(payload)` and the DOM event `omd-areadiagram-change`
(or `omd-fractionstrips-change` / `omd-fractioncircle-change`). The payload for each panel
is printed under it on the page.
