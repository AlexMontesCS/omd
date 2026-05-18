import { omdDisplay } from '../../src/canvas/omdDisplay.js';
import { omdCanvas } from '../../src/canvas/omdCanvas.js';
import { omdExpression } from '../../src/equations/omdExpression.js';
import { omdEquation } from '../../src/equations/omdEquation.js';
import { omdCoordinatePlane } from '../../src/visualizations/omdCoordinatePlane.js';
import { omdNumberLine } from '../../src/visualizations/omdNumberLine.js';
import { omdBalanceHanger } from '../../src/visualizations/omdBalanceHanger.js';

// --- omdDisplay: expressions ---

const expressions = [
    { id: 'expr-linear',   expr: '3*x + 2'       },
    { id: 'expr-power',    expr: 'x^2 + 2*x + 1' },
    { id: 'expr-fraction', expr: '(3/2)*x + 3'    },
    { id: 'expr-sqrt',     expr: 'sqrt(x + 4)'    },
];

const equations = [
    { id: 'eq-simple',    expr: '2*x + 3 = 7'     },
    { id: 'eq-quadratic', expr: 'x^2 - 4 = 0'     },
    { id: 'eq-fraction',  expr: '(3/4)*x = 12'    },
    { id: 'eq-sqrt',      expr: 'sqrt(x) + 1 = 4' },
];

for (const { id, expr } of [...expressions, ...equations]) {
    const container = document.getElementById(id);
    if (!container) continue;
    new omdDisplay(container, { centerContent: true, autoScale: true, maxScale: 1 }).render(expr);
}

// --- omdDisplay: visualizations ---

const vizPlane = new omdCoordinatePlane();
vizPlane.loadFromJSON({ width: 260, height: 260, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
new omdDisplay(document.getElementById('viz-plane'), { centerContent: true, maxScale: 1 })
    .load(vizPlane);

const vizLine1 = new omdNumberLine();
vizLine1.loadFromJSON({ min: 0, max: 10, dotValues: [6] });
new omdDisplay(document.getElementById('viz-numberline'), { centerContent: true, maxScale: 1 })
    .load(vizLine1);

const vizLine2 = new omdBalanceHanger();
vizLine2.loadFromJSON({ leftValues: [3], rightValues: [5, 'x'] });
new omdDisplay(document.getElementById('viz-numberline2'), { centerContent: true, maxScale: 1 })
    .load(vizLine2);

// --- omdCanvas: multi-object stage with explicit positioning ---

const canvasContainer = document.getElementById('omd-canvas-container');
if (!canvasContainer) throw new Error('Missing #omd-canvas-container in HTML');
const canvas = new omdCanvas(canvasContainer, {
    width:  canvasContainer.offsetWidth || 1100,
    height: 420,
});

const plane = new omdCoordinatePlane();
plane.loadFromJSON({ width: 280, height: 280, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
canvas.add(plane, { x: 30, y: 60 });

const line = new omdNumberLine();
line.loadFromJSON({ min: 0, max: 10, dotValues: [6] });
canvas.add(line, { x: 350, y: 120 });

const hanger = new omdBalanceHanger();
hanger.loadFromJSON({ leftValues: [3], rightValues: [5, 'x'] });
canvas.add(hanger, { x: 720, y: 40 });

const expr = new omdExpression();
expr.loadFromJSON('(3/2)*x + 3');
canvas.add(expr, { x: 600, y: 300 });

const eq = new omdEquation();
eq.loadFromJSON('2*x + 3 = 7');
canvas.add(eq, { x: 380, y: 340 });
