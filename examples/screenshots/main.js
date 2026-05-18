import { omdDisplay } from '../../src/canvas/omdDisplay.js';
import { omdExpression } from '../../src/equations/omdExpression.js';
import { omdEquation } from '../../src/equations/omdEquation.js';
import { omdEquationStack } from '../../src/equations/omdEquationStack.js';
import { omdEquationNode } from '../../src/equations/omdEquationNode.js';
import { omdEquationWork } from '../../src/visualizations/omdEquationWork.js';
import { omdNumberLine } from '../../src/visualizations/omdNumberLine.js';
import { omdDoubleNumberLine } from '../../src/visualizations/omdDoubleNumberLine.js';
import { omdBalanceHanger } from '../../src/visualizations/omdBalanceHanger.js';
import { omdRatioChart } from '../../src/visualizations/omdRatioChart.js';
import { omdSpinner } from '../../src/visualizations/omdSpinner.js';
import { omdTapeDiagram } from '../../src/visualizations/omdTapeDiagram.js';
import { omdDoubleTapeDiagram } from '../../src/visualizations/omdDoubleTapeDiagram.js';
import { omdCoordinatePlane } from '../../src/visualizations/omdCoordinatePlane.js';
import { omdTable } from '../../src/visualizations/omdTable.js';
import { omdTileEquation } from '../../src/visualizations/omdTileEquation.js';
import {
    omdRectangle,
    omdRectangularPrism,
    omdRightTriangle,
    omdIsoscelesTriangle,
    omdCircle,
    omdEllipse,
    omdAngle,
    omdRegularPolygon,
} from '../../src/visualizations/omdShapes.js';

const D = (id, opts = {}) =>
    new omdDisplay(document.getElementById(id), { centerContent: true, autoScale: true, maxScale: 1, ...opts });

// ── Expressions ──────────────────────────────────────────────────────────────

D('expr-1').render('3*x + 2');
D('expr-2').render('(3/2)*x + 3');
D('expr-3').render('x^2 + 2*x + 1');
D('expr-4').render('sqrt(x + 4)');

D('eq-1').render('2*x + 3 = 7');
D('eq-2').render('(3/4)*x = 12');
D('eq-3').render('x^2 - 4 = 0');
D('eq-4').render('sqrt(x) + 1 = 4');

const stack = new omdEquationStack([
    omdEquationNode.fromString('2*x + 3 = 11'),
    omdEquationNode.fromString('2*x = 8'),
    omdEquationNode.fromString('x = 4'),
]);
D('eq-stack').load(stack);

const work = new omdEquationWork();
work.loadFromJSON({
    rows: [
        { kind: 'equation', left: '2x + 3', right: '11' },
        { kind: 'operation', left: '-3', right: '-3' },
        { kind: 'line' },
        { kind: 'equation', left: '2x', right: '8' },
        { kind: 'operation', left: '÷2', right: '÷2' },
        { kind: 'line' },
        { kind: 'equation', left: 'x', right: '4' },
    ],
    fontSize: 32,
});
D('eq-work').load(work);

// ── Number Visualizations ─────────────────────────────────────────────────────

const line = new omdNumberLine();
line.loadFromJSON({ min: 0, max: 20, increment: 2, dotValues: [6, 14], title: 'Miles walked' });
D('number-line').load(line);

const doubleLine = new omdDoubleNumberLine();
doubleLine.loadFromJSON({
    topNumberLine:    { min: 0, max: 60, increment: 10, title: 'Minutes', units: 'min' },
    bottomNumberLine: { min: 0, max: 6,  increment: 1,  title: 'Miles',   units: 'mi' },
    spacing: 40,
});
D('double-number-line').load(doubleLine);

const hanger = new omdBalanceHanger();
hanger.loadFromJSON({ leftValues: ['x', 'x', '3'], rightValues: ['9'] });
D('balance-hanger').load(hanger);

const ratioP = new omdRatioChart();
ratioP.loadFromJSON({ valueA: 3, valueB: 5, renderType: 'pie', size: 'medium' });
D('ratio-pie').load(ratioP);

const spinnerV = new omdSpinner();
spinnerV.loadFromJSON({ divisions: 6, arrowPosition: 45, size: 'medium' });
D('spinner').load(spinnerV);

// ── Tape Diagrams ─────────────────────────────────────────────────────────────

const tape = new omdTapeDiagram();
tape.loadFromJSON({
    title: 'Total: 48',
    values: [
        { value: 'Part A', weight: 3, color: '#93c5fd' },
        { value: 'Part B', weight: 1, color: '#fca5a5' },
        { value: 'Part C', weight: 2, color: '#6ee7b7' },
    ],
    labelSet: [{ startIndex: 0, endIndex: 2, label: '48', showBelow: true }],
    totalWidth: 420,
});
D('tape').load(tape);

const doubleTape = new omdDoubleTapeDiagram();
doubleTape.loadFromJSON({
    topTapeDiagram: {
        title: 'Alex: 30',
        values: [{ value: '30', weight: 3, color: '#93c5fd' }],
        totalWidth: 420,
    },
    bottomTapeDiagram: {
        title: 'Sam: 50',
        values: [{ value: '50', weight: 5, color: '#fca5a5' }],
        totalWidth: 420,
    },
    spacing: 24,
});
D('double-tape').load(doubleTape);

// ── Coordinate Plane & Data ───────────────────────────────────────────────────

const plane = new omdCoordinatePlane();
plane.loadFromJSON({
    xMin: -6, xMax: 6, yMin: -6, yMax: 6,
    graphEquations: [
        { equation: 'y = x + 1',     color: '#2563eb', strokeWidth: 2 },
        { equation: 'y = -0.5*x + 3', color: '#e11d48', strokeWidth: 2 },
    ],
    dotValues: [[2, 3, '#7c3aed']],
    showBackground: true,
});
D('coord-plane', { maxScale: 1.2 }).load(plane);

const tableV = new omdTable();
tableV.loadFromJSON({
    equation: 'y = 2*x + 1',
    xMin: -2, xMax: 4, stepSize: 1,
    headers: ['x', 'y'],
    alternatingRowColors: ['#f8fafc', '#e2e8f0'],
    fontSize: 18,
});
D('table').load(tableV);

const tileEq = new omdTileEquation();
tileEq.loadFromJSON({ equation: '2*x + 3 = 7', tileSize: 48 });
D('tile-eq').load(tileEq);

const ratioBar = new omdRatioChart();
ratioBar.loadFromJSON({ valueA: 2, valueB: 3, renderType: 'bar', size: 'medium' });
D('ratio-bar').load(ratioBar);

// ── Shapes ────────────────────────────────────────────────────────────────────

const rect = new omdRectangle();
rect.loadFromJSON({ width: 8, height: 5, unitScale: 28, showLabels: true, centerLabel: '40 sq units' });
D('shape-rect').load(rect);

const prism = new omdRectangularPrism();
prism.loadFromJSON({ length: 6, width: 4, height: 3, unitScale: 28, showLabels: true });
D('shape-prism').load(prism);

const tri = new omdRightTriangle();
tri.loadFromJSON({ horizontalLeg: 6, verticalLeg: 4, unitScale: 32, showLabels: true });
D('shape-triangle').load(tri);

const circle = new omdCircle();
circle.loadFromJSON({
    radius: 5, unitScale: 22, showLabels: true,
    points: [
        { name: 'O', label: 'O', type: 'center' },
        { name: 'A', label: 'A', type: 'circumference', angle: 40 },
    ],
    segments: [{ from: 'O', to: 'A', label: 'r = 5' }],
});
D('shape-circle').load(circle);

const angle = new omdAngle();
angle.loadFromJSON({
    rays: [
        { angle: 0,   length: 90, label: 'B' },
        { angle: 55,  length: 90, label: 'A' },
        { angle: -30, length: 90, label: 'C' },
    ],
    angles: [
        { from: 0, to: 1, label: '55°', marker: 'arc' },
        { from: 2, to: 0, label: '30°', marker: 'arc' },
    ],
    vertexLabel: 'V',
    strokeColor: '#334155',
    fontSize: 14,
});
D('shape-angle').load(angle);

const hex = new omdRegularPolygon();
hex.loadFromJSON({ numberOfSides: 6, radius: 5, unitScale: 20, showLabels: true });
D('shape-polygon').load(hex);

const ellipse = new omdEllipse();
ellipse.loadFromJSON({ width: 7, height: 4, unitScale: 24, showLabels: true });
D('shape-ellipse').load(ellipse);

const iso = new omdIsoscelesTriangle();
iso.loadFromJSON({ base: 8, height: 6, unitScale: 28, showLabels: true });
D('shape-iso').load(iso);
