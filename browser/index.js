import { math as mathjs } from '../omd/utils/math.js';

import { getNodeForAST } from '../omd/core/omdUtilities.js';
import { omdEquationNode } from '../omd/nodes/omdEquationNode.js';
import { omdStepVisualizer } from '../omd/step-visualizer/omdStepVisualizer.js';

export const math = mathjs;

export const omdHelpers = {
    createNodeFromExpression(expression, mathInstance = mathjs) {
        const parsedAST = mathInstance.parse(expression);
        const NodeClass = getNodeForAST(parsedAST);
        return new NodeClass(parsedAST);
    },

    createEquation(equationString) {
        return omdEquationNode.fromString(equationString);
    },

    createStepVisualizer(equationStrings) {
        const steps = equationStrings.map((equationString) =>
            omdEquationNode.fromString(equationString)
        );
        return new omdStepVisualizer(steps);
    },
};

export { omdNode } from '../omd/nodes/omdNode.js';
export { omdBinaryExpressionNode } from '../omd/nodes/omdBinaryExpressionNode.js';
export { omdConstantNode } from '../omd/nodes/omdConstantNode.js';
export { omdEquationNode } from '../omd/nodes/omdEquationNode.js';
export { omdFunctionNode } from '../omd/nodes/omdFunctionNode.js';
export { omdGroupNode } from '../omd/nodes/omdGroupNode.js';
export { omdLeafNode } from '../omd/nodes/omdLeafNode.js';
export { omdOperationDisplayNode } from '../omd/nodes/omdOperationDisplayNode.js';
export { omdOperatorNode } from '../omd/nodes/omdOperatorNode.js';
export { omdParenthesisNode } from '../omd/nodes/omdParenthesisNode.js';
export { omdPowerNode } from '../omd/nodes/omdPowerNode.js';
export { omdRationalNode } from '../omd/nodes/omdRationalNode.js';
export { omdEquationSequenceNode } from '../omd/nodes/omdEquationSequenceNode.js';
export { omdSqrtNode } from '../omd/nodes/omdSqrtNode.js';
export { omdUnaryExpressionNode } from '../omd/nodes/omdUnaryExpressionNode.js';
export { omdVariableNode } from '../omd/nodes/omdVariableNode.js';
export { omdEquationStack } from '../omd/core/omdEquationStack.js';
export { omdStepVisualizer } from '../omd/step-visualizer/omdStepVisualizer.js';
export { omdDisplay } from '../omd/display/omdDisplay.js';
export { omdToolbar } from '../omd/display/omdToolbar.js';
export { omdNodeOverlay, omdNodeOverlayPresets } from '../omd/utils/omdNodeOverlay.js';
export { omdTranscriptionService } from '../omd/utils/omdTranscriptionService.js';
export { getNodeForAST } from '../omd/core/omdUtilities.js';
export { simplifyStep } from '../omd/simplification/omdSimplification.js';
export {
    initializeConfig,
    setConfig,
    getDefaultConfig,
} from '../omd/config/omdConfigManager.js';

export { omdTable } from '../src/omdTable.js';
export { omdBalanceHanger } from '../src/omdBalanceHanger.js';
export { omdCoordinatePlane } from '../src/omdCoordinatePlane.js';
export { omdTapeDiagram } from '../src/omdTapeDiagram.js';
export { omdDoubleTapeDiagram } from '../src/omdDoubleTapeDiagram.js';
export { omdTileEquation } from '../src/omdTileEquation.js';
export { omdRatioChart } from '../src/omdRatioChart.js';
export { omdNumberLine } from '../src/omdNumberLine.js';
export { omdDoubleNumberLine } from '../src/omdDoubleNumberLine.js';
export { omdNumberTile } from '../src/omdNumberTile.js';
export { omdEquation } from '../src/omdEquation.js';
export { omdDistributionWork } from '../src/omdDistributionWork.js';
export { omdExpression } from '../src/omdExpression.js';
export { omdTerm } from '../src/omdTerm.js';
export { omdNumber } from '../src/omdNumber.js';
export { omdVariable } from '../src/omdVariable.js';
export { omdPowerExpression } from '../src/omdPowerExpression.js';
export { omdRationalExpression } from '../src/omdRationalExpression.js';
export { omdFunction } from '../src/omdFunction.js';
export { omdApp } from '../src/omdApp.js';
export { omdAppCanvas } from '../src/omdAppCanvas.js';
export { omd } from '../src/omd.js';
export { omdColor } from '../src/omdColor.js';
export {
    createFromJSON,
    getSupportedTypes,
    isTypeSupported,
} from '../src/omdFactory.js';
export {
    omdRightTriangle,
    omdIsoscelesTriangle,
    omdRectangle,
    omdEllipse,
    omdCircle,
    omdRegularPolygon,
    omdShapeLabelSet,
} from '../src/omdShapes.js';
export { omdSpinner } from '../src/omdSpinner.js';
export { omdLabel } from '../src/omdLabel.js';
export { omdProblem } from '../src/omdProblem.js';

export { omdCanvas } from '../canvas/core/omdCanvas.js';
export { CanvasConfig as canvasConfig } from '../canvas/core/canvasConfig.js';
export { EventManager } from '../canvas/events/eventManager.js';
export { pointerEventHandler } from '../canvas/events/pointerEventHandler.js';
export { ToolManager } from '../canvas/tools/toolManager.js';
export { Tool } from '../canvas/tools/tool.js';
export { PencilTool } from '../canvas/tools/PencilTool.js';
export { EraserTool } from '../canvas/tools/EraserTool.js';
export { Toolbar } from '../canvas/ui/toolbar.js';
export { Cursor } from '../canvas/ui/cursor.js';
export { Stroke } from '../canvas/drawing/stroke.js';
export { segment } from '../canvas/drawing/segment.js';
export { BoundingBox } from '../canvas/utils/boundingBox.js';
export { mathUtils } from '../canvas/utils/mathUtils.js';
export { FocusFrameManager } from '../canvas/features/focusFrameManager.js';
export { createCanvas, createMultipleCanvases } from '../canvas/index.js';

export * from '../jsvg/index.js';
