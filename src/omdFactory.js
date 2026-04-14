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

import { omdBalanceHanger } from './omdBalanceHanger.js';
import { omdTable } from './omdTable.js';
import { omdTapeDiagram } from './omdTapeDiagram.js';
import { omdDoubleTapeDiagram } from './omdDoubleTapeDiagram.js';
import { omdCoordinatePlane } from './omdCoordinatePlane.js';
import { omdNumberLine } from './omdNumberLine.js';
import { omdDoubleNumberLine } from './omdDoubleNumberLine.js';
import { omdNumberTile } from './omdNumberTile.js';
import { omdRatioChart } from './omdRatioChart.js';
import { omdTileEquation } from './omdTileEquation.js';
import { omdSpinner } from './omdSpinner.js';
import { omdEquation } from './omdEquation.js';
import { omdEquationWork } from './omdEquationWork.js';
import { omdExpression } from './omdExpression.js';
import { omdTerm } from './omdTerm.js';
import { omdNumber } from './omdNumber.js';
import { omdVariable } from './omdVariable.js';
import { omdPowerExpression } from './omdPowerExpression.js';
import { omdRationalExpression } from './omdRationalExpression.js';
import { omdFunction } from './omdFunction.js';
import { 
    omdRightTriangle,
    omdIsoscelesTriangle,
    omdRectangle,
    omdEllipse,
    omdCircle,
    omdRegularPolygon
} from './omdShapes.js';
import { omdLabel } from './omdLabel.js';
import { omdEquationStack } from '../omd/core/omdEquationStack.js';
import { omdEquationNode } from '../omd/nodes/omdEquationNode.js';

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
    'number': omdNumber,
    'variable': omdVariable,
    'powerExpression': omdPowerExpression,
    'rationalExpression': omdRationalExpression,
    'function': omdFunction,
    'rightTriangle': omdRightTriangle,
    'isoscelesTriangle': omdIsoscelesTriangle,
    'rectangle': omdRectangle,
    'ellipse': omdEllipse,
    'circle': omdCircle,
    'regularPolygon': omdRegularPolygon,
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
