/**
 * OMD Factory - Creates OMD objects from JSON data
 * 
 * This factory function creates the appropriate OMD object based on the omdType
 * field in the JSON data, eliminating the need for large switch statements.
 * 
 * Usage:
 * import { createFromJSON } from '@teachinglab/omd';
 * 
 * const jsonData = { omdType: 'numberLine', min: 0, max: 10 };
 * const omdObject = createFromJSON(jsonData);
 * 
 * // Optionally load into existing container
 * const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
 * svg.appendChild(omdObject.svgObject);
 */

import { omdBalanceHanger } from './visualizations/omdBalanceHanger.js';
import { omdTable } from './visualizations/omdTable.js';
import { omdTapeDiagram } from './visualizations/omdTapeDiagram.js';
import { omdDoubleTapeDiagram } from './visualizations/omdDoubleTapeDiagram.js';
import { omdCoordinatePlane } from './visualizations/omdCoordinatePlane.js';
import { omdNumberLine } from './visualizations/omdNumberLine.js';
import { omdDoubleNumberLine } from './visualizations/omdDoubleNumberLine.js';
import { omdNumberTile } from './visualizations/omdNumberTile.js';
import { omdRatioChart } from './visualizations/omdRatioChart.js';
import { omdTileEquation } from './visualizations/omdTileEquation.js';
import { omdSpinner } from './visualizations/omdSpinner.js';
import { omdEquation } from './equations/omdEquation.js';
import { omdEquationWork } from './visualizations/omdEquationWork.js';
import { omdExpression } from './equations/omdExpression.js';
import { omdTerm } from './equations/omdTerm.js';
import { omdPowerExpression } from './equations/omdPowerExpression.js';
import { omdRationalExpression } from './equations/omdRationalExpression.js';
import { omdFunction } from './equations/omdFunction.js';
import {
    omdRightTriangle,
    omdIsoscelesTriangle,
    omdRectangle,
    omdRectangularPrism,
    omdCylinder,
    omdEllipse,
    omdCircle,
    omdAngle,
    omdRegularPolygon
} from './visualizations/omdShapes.js';
import { omdLabel } from './visualizations/omdLabel.js';
import { omdEquationStack } from './equations/omdEquationStack.js';
import { omdEquationNode } from './equations/omdEquationNode.js';
import { omdConstantNode } from './equations/omdConstantNode.js';
import { omdVariableNode } from './equations/omdVariableNode.js';
import { omdAlgorithmWork } from './visualizations/omdAlgorithmWork.js';
import { omdFractionWork } from './visualizations/omdFractionWork.js';
import { omdFractionAreaModel } from './visualizations/omdFractionAreaModel.js';
import { omdMathText } from './visualizations/omdMathText.js';
import { omdLinePlot } from './visualizations/omdLinePlot.js';
import { omdAreaDiagram } from './visualizations/omdAreaDiagram.js';
import { omdAreaModel } from './visualizations/omdAreaModel.js';
import { omdFractionStrips } from './visualizations/omdFractionStrips.js';
import { omdFractionCircle } from './visualizations/omdFractionCircle.js';

/**
 * Map of omdType strings to their corresponding class constructors
 */
const OMD_TYPE_MAP = {
    'balanceHanger': omdBalanceHanger,
    'table': omdTable,
    'tapeDiagram': omdTapeDiagram,
    'doubleTapeDiagram': omdDoubleTapeDiagram,
    'coordinatePlane': omdCoordinatePlane,
    'numberLine': omdNumberLine,
    'doubleNumberLine': omdDoubleNumberLine,
    'numberTile': omdNumberTile,
    'ratioChart': omdRatioChart,
    'tileEquation': omdTileEquation,
    'spinner': omdSpinner,
    'equation': omdEquation,
    'equationWork': omdEquationWork,
    'equationStack': omdEquationStack,
    'expression': omdExpression,
    'term': omdTerm,
    'powerExpression': omdPowerExpression,
    'rationalExpression': omdRationalExpression,
    'function': omdFunction,
    'rightTriangle': omdRightTriangle,
    'isoscelesTriangle': omdIsoscelesTriangle,
    'rectangle': omdRectangle,
    'rectangularPrism': omdRectangularPrism,
    'cylinder': omdCylinder,
    'ellipse': omdEllipse,
    'circle': omdCircle,
    'angle': omdAngle,
    'regularPolygon': omdRegularPolygon,
    'algorithmWork': omdAlgorithmWork,
    'fractionWork': omdFractionWork,
    'fractionAreaModel': omdFractionAreaModel,
    'mathText': omdMathText,
    'linePlot': omdLinePlot,
    'areaDiagram': omdAreaDiagram,
    'areaModel': omdAreaModel,
    'fractionStrips': omdFractionStrips,
    'fractionCircle': omdFractionCircle,
    'label': omdLabel,
};

/**
 * Creates an OMD object from JSON data
 * 
 * @param {object} jsonData - The JSON data with an omdType field
 * @returns {object} The created OMD object with data loaded
 * @throws {Error} If omdType is missing or unsupported
 * 
 * @example
 * // Create a number line
 * const numberLine = createFromJSON({
 *     omdType: 'numberLine',
 *     min: 0,
 *     max: 10,
 *     dotValues: [2, 5, 8]
 * });
 * 
 * @example
 * // Create a coordinate plane
 * const plane = createFromJSON({
 *     omdType: 'coordinatePlane',
 *     xMin: -10,
 *     xMax: 10,
 *     yMin: -10,
 *     yMax: 10,
 *     graphEquations: [
 *         { equation: 'y = x^2', color: '#e11d48' }
 *     ]
 * });
 * 
 * @example
 * // Create an equation
 * const equation = createFromJSON({
 *     omdType: 'equation',
 *     equation: '2x + 3 = 11'
 * });
 */
export function createFromJSON(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('createFromJSON requires a valid JSON object');
    }
    
    const omdType = jsonData.omdType;
    
    if (!omdType) {
        throw new Error('JSON data must include an "omdType" field');
    }

    if (omdType === 'equationStack') {
        return createEquationStackFromJSON(jsonData);
    }

    if (omdType === 'number') {
        return omdConstantNode.fromValue(jsonData.value);
    }

    if (omdType === 'variable') {
        return omdVariableNode.fromName(jsonData.name);
    }

    const Constructor = OMD_TYPE_MAP[omdType];
    
    if (!Constructor) {
        throw new Error(`Unsupported omdType: "${omdType}". Supported types: ${Object.keys(OMD_TYPE_MAP).join(', ')}`);
    }
    
    // Create instance and load data
    const omdObject = new Constructor();
    omdObject.loadFromJSON(jsonData);
    
    return omdObject;
}

function createEquationStackFromJSON(jsonData) {
    const equations = Array.isArray(jsonData.equations) ? jsonData.equations : [];
    const steps = equations
        .map(equation => (typeof equation === 'string' ? equation.trim() : ''))
        .filter(Boolean)
        .map(equation => omdEquationNode.fromString(equation));

    const stack = new omdEquationStack(steps, {
        toolbar: false,
        stepVisualizer: false
    });

    if (typeof jsonData.fontSize === 'number' && Number.isFinite(jsonData.fontSize)) {
        stack.setFontSize(jsonData.fontSize);
    }

    if (typeof stack.initialize === 'function') {
        stack.initialize();
    }

    return stack;
}

/**
 * Gets the list of supported OMD types
 * 
 * @returns {string[]} Array of supported omdType strings
 */
export function getSupportedTypes() {
    return Object.keys(OMD_TYPE_MAP);
}

/**
 * Checks if an omdType is supported
 * 
 * @param {string} omdType - The type to check
 * @returns {boolean} True if the type is supported
 */
export function isTypeSupported(omdType) {
    return omdType in OMD_TYPE_MAP;
}
