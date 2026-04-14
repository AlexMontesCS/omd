// OMD Visualization Components
export { omdTable } from './omdTable.js';
export { omdBalanceHanger } from './omdBalanceHanger.js';
export { omdCoordinatePlane } from './omdCoordinatePlane.js';
export { omdTapeDiagram } from './omdTapeDiagram.js';
export { omdDoubleTapeDiagram } from './omdDoubleTapeDiagram.js';
export { omdTileEquation } from './omdTileEquation.js';

// OMD Charts and Diagrams
export { omdRatioChart } from './omdRatioChart.js';
export { omdNumberLine } from './omdNumberLine.js';
export { omdDoubleNumberLine } from './omdDoubleNumberLine.js';
export { omdNumberTile } from './omdNumberTile.js';

// OMD Mathematical Components
export { omdEquation } from './omdEquation.js';
export { omdEquationWork } from './omdEquationWork.js';
export { omdExpression } from './omdExpression.js';
export { omdTerm } from './omdTerm.js';
export { omdNumber } from './omdNumber.js';
export { omdVariable } from './omdVariable.js';
export { omdPowerExpression } from './omdPowerExpression.js';
export { omdRationalExpression } from './omdRationalExpression.js';
export { omdFunction } from './omdFunction.js';

// OMD Core Components
export { omdApp } from './omdApp.js';
export { omdAppCanvas } from './omdAppCanvas.js';
export { omd } from './omd.js';
export { omdDisplay } from '../omd/display/omdDisplay.js';
export { omdEquationNode } from '../omd/nodes/omdEquationNode.js';
export { omdEquationStack } from '../omd/core/omdEquationStack.js';
export { omdEquationSequenceNode } from '../omd/nodes/omdEquationSequenceNode.js';
export { omdConstantNode } from '../omd/nodes/omdConstantNode.js';
export { omdNodeOverlay, omdNodeOverlayPresets } from '../omd/utils/omdNodeOverlay.js';

// OMD Utilities and Helpers
export { omdColor } from './omdColor.js';
export { createFromJSON, getSupportedTypes, isTypeSupported } from './omdFactory.js';

// OMD Shape Classes
export { 
    omdRightTriangle,
    omdIsoscelesTriangle, 
    omdRectangle,
    omdEllipse,
    omdCircle,
    omdRegularPolygon,
    omdShapeLabelSet 
} from './omdShapes.js';
export { omdSpinner } from './omdSpinner.js';
export { omdLabel } from './omdLabel.js';
export { omdProblem } from './omdProblem.js';

// Default export for organized access
export default {
    // Main visualizations (most commonly used)
    visualizations: {
        omdTable: () => import('./omdTable.js').then(m => m.omdTable),
        omdBalanceHanger: () => import('./omdBalanceHanger.js').then(m => m.omdBalanceHanger),
        omdCoordinatePlane: () => import('./omdCoordinatePlane.js').then(m => m.omdCoordinatePlane),
        omdTapeDiagram: () => import('./omdTapeDiagram.js').then(m => m.omdTapeDiagram),
        omdTileEquation: () => import('./omdTileEquation.js').then(m => m.omdTileEquation),
        omdEquationWork: () => import('./omdEquationWork.js').then(m => m.omdEquationWork),
        omdRatioChart: () => import('./omdRatioChart.js').then(m => m.omdRatioChart),
        omdNumberLine: () => import('./omdNumberLine.js').then(m => m.omdNumberLine),
        omdDoubleNumberLine: () => import('./omdDoubleNumberLine.js').then(m => m.omdDoubleNumberLine)
    },
    
    // Mathematical expressions
    expressions: {
        omdExpression: () => import('./omdExpression.js').then(m => m.omdExpression),
        omdEquation: () => import('./omdEquation.js').then(m => m.omdEquation),
        omdMetaExpression: () => import('./omdMetaExpression.js').then(m => m.omdMetaExpression),
        omdNaturalExpression: () => import('./omdNaturalExpression.js').then(m => m.omdNaturalExpression),
        omdPowerExpression: () => import('./omdPowerExpression.js').then(m => m.omdPowerExpression),
        omdRationalExpression: () => import('./omdRationalExpression.js').then(m => m.omdRationalExpression),
        omdFunction: () => import('./omdFunction.js').then(m => m.omdFunction)
    },
    
    // Core app components
    app: {
        omdApp: () => import('./omdApp.js').then(m => m.omdApp),
        omdAppCanvas: () => import('./omdAppCanvas.js').then(m => m.omdAppCanvas),
        omd: () => import('./omd.js').then(m => m.omd),
        async createDisplay(container) {
            const { omdDisplay } = await import('../omd/core/index.js');
            return new omdDisplay(container);
        }
    }
}; 
// Force reload