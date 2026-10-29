export type OmdPrimitive = string | number | boolean | null;
export type OmdJsonValue = OmdPrimitive | OmdJsonObject | OmdJsonValue[];
export interface OmdJsonObject {
  [key: string]: OmdJsonValue;
}

export type OmdSize = "small" | "medium" | "large" | string;
export type OmdAlignment = "left" | "center" | "right";
export type OmdEquationAlignmentMode = "equals" | "center";

export type OmdConstructibleType =
  | "balanceHanger"
  | "table"
  | "tapeDiagram"
  | "doubleTapeDiagram"
  | "coordinatePlane"
  | "numberLine"
  | "doubleNumberLine"
  | "numberTile"
  | "ratioChart"
  | "tileEquation"
  | "spinner"
  | "equation"
  | "equationWork"
  | "equationStack"
  | "expression"
  | "term"
  | "powerExpression"
  | "rationalExpression"
  | "function"
  | "rightTriangle"
  | "isoscelesTriangle"
  | "rectangle"
  | "rectangularPrism"
  | "ellipse"
  | "circle"
  | "angle"
  | "regularPolygon"
  | "algorithmWork"
  | "fractionWork"
  | "fractionAreaModel"
  | "mathText"
  | "linePlot"
  | "areaDiagram"
  | "areaModel"
  | "fractionStrips"
  | "fractionCircle"
  | "label";

export type OmdType = OmdConstructibleType | "number" | "variable";

export type OmdLoadData<T extends { omdType: string }> =
  Omit<T, "omdType"> & Partial<Pick<T, "omdType">>;

export interface OmdComponentLike {
  svgObject: SVGElement;
  width: number;
  height: number;
  xpos?: number;
  ypos?: number;
  setPosition(x: number, y: number): void;
  setScale(scale: number): void;
  setWidthAndHeight?(width: number, height: number): void;
  setFontSize?(fontSize: number): void;
  setBackgroundColor?(color: string): void;
  hideBackgroundByDefault?(): void;
  computeDimensions?(): void;
  updateLayout?(): void;
  loadFromJSON?(data: unknown): void;
  getSvg?(): SVGElement;
}

export declare class OmdComponentBase implements OmdComponentLike {
  svgObject: SVGElement;
  width: number;
  height: number;
  xpos: number;
  ypos: number;
  setPosition(x: number, y: number): void;
  setScale(scale: number): void;
  setWidthAndHeight(width: number, height: number): void;
  setFontSize(fontSize: number): void;
  setBackgroundColor(color: string): void;
  hideBackgroundByDefault(): void;
  computeDimensions(): void;
  updateLayout(): void;
  addChild(child: OmdComponentLike): void;
  removeChild(child: OmdComponentLike): void;
  removeAllChildren(): void;
  getSvg(): SVGElement;
}

export interface OmdDisplayOptions {
  alignment?: OmdAlignment;
  autoScale?: boolean;
  maxScale?: number;
  padding?: number;
  onChange?: (payload: unknown) => void;
}

export declare class omdDisplay {
  constructor(container: HTMLElement, options?: OmdDisplayOptions);
  readonly container: HTMLElement;
  readonly options: Required<Omit<OmdDisplayOptions, "onChange">> &
    Pick<OmdDisplayOptions, "onChange">;
  readonly svg: OmdComponentLike;
  render(value: string): void;
  load(component: OmdComponentLike): void;
  loadFromJSON(json: OmdJson): void;
  clear(): void;
  destroy(): void;
}

export interface OmdCanvasOptions {
  width?: number;
  height?: number;
}

export interface OmdCanvasAddOptions {
  x?: number;
  y?: number;
  scale?: number;
}

export declare class omdCanvas {
  constructor(container: HTMLElement, options?: OmdCanvasOptions);
  readonly container: HTMLElement;
  width: number;
  height: number;
  readonly svg: OmdComponentLike;
  add<T extends OmdComponentLike>(component: T, options?: OmdCanvasAddOptions): T;
  move<T extends OmdComponentLike>(component: T, x: number, y: number): T;
  scale<T extends OmdComponentLike>(component: T, scale: number): T;
  remove(component: OmdComponentLike): void;
  clear(): void;
  resize(width: number, height: number): void;
  readonly items: OmdComponentLike[];
}

export interface OmdNumberJson {
  omdType: "number";
  value: number | string;
}

export interface OmdVariableJson {
  omdType: "variable";
  name: string;
}

export interface OmdEquationJson {
  omdType: "equation";
  equation?: string;
  fontSize?: number;
  backgroundColor?: string;
  leftExpression?: string | OmdExpressionJson;
  rightExpression?: string | OmdExpressionJson;
}

export interface OmdExpressionJson {
  omdType: "expression";
  expression?: string;
  fontSize?: number;
  backgroundColor?: string;
}

export interface OmdTermJson {
  omdType: "term";
  coefficient?: number;
  variable?: string;
  exponent?: number;
  fontSize?: number;
  backgroundColor?: string;
}

export interface OmdPowerExpressionJson {
  omdType: "powerExpression";
  baseExpression?: string | OmdExpressionJson;
  exponentExpression?: string | OmdExpressionJson;
  fontSize?: number;
  backgroundColor?: string;
}

export interface OmdRationalExpressionJson {
  omdType: "rationalExpression";
  numeratorExpression?: string | OmdExpressionJson;
  denominatorExpression?: string | OmdExpressionJson;
  fontSize?: number;
  backgroundColor?: string;
}

export interface OmdFunctionJson {
  omdType: "function";
  functionName?: string;
  variable?: string;
  expression?: string | OmdExpressionJson;
  fontSize?: number;
  backgroundColor?: string;
}

export interface OmdEquationStackJson {
  omdType: "equationStack";
  equations?: string[];
  alignmentMode?: OmdEquationAlignmentMode;
  fontSize?: number;
}

export type OmdEquationWorkAlignment = "start" | "center" | "end" | "left" | "right" | string;
export type OmdEquationWorkRowKind = "equation" | "operation" | "expression" | "text" | "line";

export interface OmdEquationWorkRow {
  kind?: OmdEquationWorkRowKind;
  left?: string | number;
  right?: string | number;
  center?: string | number;
  text?: string | number;
  operation?: string;
  value?: string | number;
  color?: string;
  leftColor?: string;
  rightColor?: string;
  centerColor?: string;
  textColor?: string;
  lineColor?: string;
  drawLineBefore?: boolean;
  drawLineAfter?: boolean;
  [key: string]: unknown;
}

export interface OmdEquationWorkJson {
  omdType: "equationWork";
  rows?: OmdEquationWorkRow[];
  operationLineUp?: OmdEquationWorkAlignment;
  operationLeftAlign?: OmdEquationWorkAlignment;
  operationRightAlign?: OmdEquationWorkAlignment;
  equationLeftAlign?: OmdEquationWorkAlignment;
  expressionAlign?: OmdEquationWorkAlignment;
  equationRightAlign?: OmdEquationWorkAlignment;
  drawLineBeforeRows?: number[];
  drawLineAfterRows?: number[];
  centerSymbol?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  rowHeightMultiplier?: number;
  rowGap?: number;
  columnGap?: number;
  paddingX?: number;
  paddingY?: number;
  lineGap?: number;
  lineInset?: number;
  lineStrokeWidth?: number;
  equationColor?: string;
  operationColor?: string;
  centerColor?: string;
  lineColor?: string;
  textColor?: string;
}

export interface OmdBalanceHangerJson {
  omdType: "balanceHanger";
  leftValues?: Array<string | number>;
  rightValues?: Array<string | number>;
  tilt?: "left" | "right" | "none" | string;
  fontFamily?: string;
  fontSize?: number;
  backgroundColor?: string;
  backgroundCornerRadius?: number;
  backgroundOpacity?: number;
  showBackground?: boolean;
}

export interface OmdNumberLineSpecialNumber {
  value: number;
  label?: string;
  color?: string;
}

export interface OmdNumberLineDot {
  value: number;
  label?: string;
  color?: string;
  fillColor?: string;
  size?: number;
  locked?: boolean;
}

export interface OmdNumberLineJson {
  omdType: "numberLine";
  min?: number;
  max?: number;
  increment?: number;
  dotValues?: Array<number | OmdNumberLineDot>;
  title?: string;
  label?: string;
  units?: string;
  showLeftArrow?: boolean;
  showRightArrow?: boolean;
  hideDefaultNumbers?: boolean;
  specialNumbers?: Array<number | OmdNumberLineSpecialNumber>;
  totalWidth?: number;
  interactive?: boolean;
  allowAddDots?: boolean;
  allowDragDots?: boolean;
  allowRemoveDots?: boolean;
  allowKeyboard?: boolean;
  snapToIncrement?: boolean;
  snapStep?: number;
  showValueLabels?: boolean;
  showHoverValue?: boolean;
  maxInteractiveDots?: number;
  interactiveDotColor?: string;
  selectedDotColor?: string;
  rangeColor?: string;
  interactiveRange?: boolean;
  rangeValues?: [number, number];
  selectedRange?: [number, number];
  rangeStartClosed?: boolean;
  rangeEndClosed?: boolean;
  rangeStartStyle?: "closed" | "open" | "arrow";
  rangeEndStyle?: "closed" | "open" | "arrow";
}

export interface OmdDoubleNumberLineJson {
  omdType: "doubleNumberLine";
  topNumberLine?: OmdLoadData<OmdNumberLineJson>;
  bottomNumberLine?: OmdLoadData<OmdNumberLineJson>;
  spacing?: number;
}

export interface OmdCoordinatePoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
  radius?: number;
  fillColor?: string;
  strokeColor?: string;
  [key: string]: unknown;
}

export interface OmdGraphEquation {
  equation: string;
  color?: string;
  strokeWidth?: number;
  domain?: [number, number];
  label?: string;
  [key: string]: unknown;
}

export interface OmdLineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  strokeWidth?: number;
  label?: string;
  [key: string]: unknown;
}

export interface OmdGraphPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface OmdCoordinateVariable {
  name: string;
  value: number;
}

export interface OmdCoordinatePlaneJson {
  omdType: "coordinatePlane";
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xLabel?: string;
  yLabel?: string;
  tickInterval?: number | null;
  showTickLabels?: boolean;
  showBackground?: boolean;
  interactive?: boolean;
  size?: OmdSize;
  graphEquations?: OmdGraphEquation[];
  lineSegments?: Array<OmdLineSegment | [[number, number], [number, number]]>;
  dotValues?: Array<OmdCoordinatePoint | [number, number]>;
  variables?: OmdCoordinateVariable[];
  axisLabelOffsetPx?: number;
  tickLabelOffsetPx?: number;
  forceAllTickLabels?: boolean;
  shapeSet?: OmdShapeJson[];
  graphPadding?: OmdGraphPadding | null;
  paddingTop?: number | null;
  paddingRight?: number | null;
  paddingBottom?: number | null;
  paddingLeft?: number | null;
  backgroundColor?: string;
  backgroundCornerRadius?: number;
  backgroundOpacity?: number;
  plotMode?: boolean;
  plottedPoints?: Array<[number, number]>;
  plotSnap?: number;
  maxPlottedPoints?: number | null;
  plotPointColor?: string;
}

export interface OmdTapeValue {
  /** Segment text; bare fractions ("3/10", "4 1/2") are typeset stacked. */
  value?: number | string;
  /** Relative width; defaults to the numeric value, else 1. */
  weight?: number;
  showLabel?: boolean;
  color?: string;
  textColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  /** Equal parts drawn as dashed lines inside the segment. */
  parts?: number;
}

export interface OmdTapeLabel {
  /** First segment the brace covers (0-based). */
  startIndex: number;
  /** One past the last segment covered: `{ startIndex: 0, endIndex: 1 }` spans segment 0. */
  endIndex: number;
  label?: string;
  showBelow?: boolean;
  color?: string;
  fontSize?: number;
  strokeWidth?: number;
}

export interface OmdTapeDiagramJson {
  omdType: "tapeDiagram";
  totalWidth?: number;
  title?: string;
  titleFontSize?: number;
  titleColor?: string;
  segmentHeight?: number;
  segmentCornerRadius?: number;
  segmentStrokeColor?: string;
  segmentStrokeWidth?: number;
  labelFontSize?: number;
  segmentTextColor?: string;
  braceLabelFontSize?: number;
  braceColor?: string;
  /** SVG dash pattern for segment `parts`, or "none" for solid. */
  partDash?: string;
  values?: Array<number | string | OmdTapeValue>;
  /** A plain array of braces — not `{ braces: [...] }`. */
  labelSet?: OmdTapeLabel[];
}

export interface OmdDoubleTapeDiagramJson {
  omdType: "doubleTapeDiagram";
  topTapeDiagram?: OmdLoadData<OmdTapeDiagramJson>;
  bottomTapeDiagram?: OmdLoadData<OmdTapeDiagramJson>;
  spacing?: number;
  /** Width of the longer tape in px; defaults to the widest tape `totalWidth`, else 300. */
  totalWidth?: number;
}

export interface OmdNumberTileJson {
  omdType: "numberTile";
  value?: number;
  tileSize?: number;
  tileGap?: number;
  tileRadius?: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fillColor?: string;
  showLabel?: boolean;
  [key: string]: unknown;
}

export interface OmdTileEquationJson {
  omdType: "tileEquation";
  equation?: string;
  equationString?: string;
  left?: OmdNumberTileJson[];
  right?: OmdNumberTileJson[];
  tileSize?: number;
  tileGap?: number;
  equalGap?: number;
  tileRadius?: number;
  showLabels?: boolean;
  fontFamily?: string;
  fontSize?: number;
  plusColor?: string;
  equalsColor?: string;
  xPillColor?: string;
  xPill?: OmdJsonObject | null;
  numberTileDefaults?: Partial<OmdNumberTileJson> | null;
}

export type OmdTableCellValue = OmdPrimitive;
export type OmdTableRow = OmdTableCellValue[] | Record<string, OmdTableCellValue>;

export interface OmdTableJson {
  omdType: "table";
  equation?: string;
  data?: OmdTableRow[];
  headers?: string[];
  xMin?: number;
  xMax?: number;
  stepSize?: number;
  title?: string;
  alternatingRowColors?: string[] | null;
  fontSize?: number;
  headerFontSize?: number;
  fontFamily?: string;
  headerFontFamily?: string;
  cellHeight?: number;
  headerHeight?: number;
  minCellWidth?: number;
  maxCellWidth?: number;
  padding?: number;
  backgroundColor?: string;
  backgroundCornerRadius?: number;
  backgroundOpacity?: number;
  showBackground?: boolean;
  evenRowColor?: string;
  oddRowColor?: string;
  alternatingRowOpacity?: number;
  editable?: boolean;
  editableCells?: Array<[number, number]>;
  editableToken?: OmdTableCellValue;
  editableValues?: Record<string, OmdTableCellValue>;
}

export interface OmdTableChangePayload {
  type: string;
  data: OmdTableCellValue[][];
  editableValues: Record<string, OmdTableCellValue>;
  values: Record<string, OmdTableCellValue>;
  row?: number;
  col?: number;
  value?: OmdTableCellValue;
}

export interface OmdCoordinatePlaneChangePayload {
  type: string;
  points: Array<[number, number]>;
  x?: number;
  y?: number;
}

export interface OmdRatioChartJson {
  omdType: "ratioChart";
  numerator?: number;
  valueA?: number;
  denominator?: number;
  valueB?: number;
  renderType?: "pie" | "bar" | string;
  size?: OmdSize;
}

export interface OmdRightTriangleJson {
  omdType: "rightTriangle";
  horizontalLeg?: number;
  verticalLeg?: number;
  unitScale?: number;
  showLabels?: boolean;
  angleA?: number;
  angleB?: number;
  hypotenuse?: number;
}

export interface OmdIsoscelesTriangleJson {
  omdType: "isoscelesTriangle";
  base?: number;
  height?: number;
  unitScale?: number;
  showLabels?: boolean;
}

export interface OmdRectangleSideLabels {
  width?: string;
  height?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  [key: string]: string | undefined;
}

export interface OmdRectangleJson {
  omdType: "rectangle";
  width?: number;
  height?: number;
  unitScale?: number;
  showLabels?: boolean;
  labelMode?: "edge" | "side" | string;
  sideLabels?: OmdRectangleSideLabels | null;
  centerLabel?: string;
  outsideTopLabel?: string;
  outsideBottomLabel?: string;
  outsideLeftLabel?: string;
  outsideRightLabel?: string;
  labelFontSize?: number;
}

export interface OmdRectangularPrismSideLabels {
  length?: string;
  width?: string;
  height?: string;
  l?: string;
  w?: string;
  h?: string;
  [key: string]: string | undefined;
}

export interface OmdRectangularPrismJson {
  omdType: "rectangularPrism";
  length?: number;
  width?: number;
  height?: number;
  unitScale?: number;
  showLabels?: boolean;
  sideLabels?: OmdRectangularPrismSideLabels | null;
  insideLabel?: string;
  outsideTopLabel?: string;
  showHiddenEdges?: boolean;
  lengthLabel?: string;
  widthLabel?: string;
  heightLabel?: string;
  labelFontSize?: number;
  showUnitCubes?: boolean;
  highlightLayer?: number;
  layerColors?: { top?: string; side?: string; front?: string };
  cubeGapRatio?: number;
}

export interface OmdEllipseJson {
  omdType: "ellipse";
  width?: number;
  height?: number;
  unitScale?: number;
  showLabels?: boolean;
}

export interface OmdCirclePoint {
  x?: number;
  y?: number;
  angle?: number;
  label?: string;
  color?: string;
  radius?: number;
  [key: string]: unknown;
}

export interface OmdCircleSegment {
  from?: number | string;
  to?: number | string;
  label?: string;
  color?: string;
  strokeWidth?: number;
  [key: string]: unknown;
}

export interface OmdCircleJson {
  omdType: "circle";
  radius?: number;
  unitScale?: number;
  showLabels?: boolean;
  points?: OmdCirclePoint[];
  segments?: OmdCircleSegment[];
  pointRadius?: number;
  annotationFontSize?: number;
}

export interface OmdAngleRay {
  name?: string;
  angle: number;
  length?: number;
  label?: string;
  labelDistance?: number;
  color?: string;
  strokeWidth?: number;
  fontSize?: number;
  italic?: boolean;
}

export interface OmdAngleLabelPosition {
  x: number;
  y: number;
}

export interface OmdAngleMarker {
  from: number | string;
  to: number | string;
  label?: string;
  marker?: "arc" | "right" | "full" | "circle" | string;
  type?: "arc" | "right" | "full" | "circle" | string;
  color?: string;
  strokeWidth?: number;
  arcRadius?: number;
  size?: number;
  labelRadius?: number;
  labelPosition?: OmdAngleLabelPosition;
  labelMode?: "auto" | "inline" | "callout" | string;
  tickCount?: number;
  arcCount?: number;
  tickLength?: number;
  reflex?: boolean;
  useReflexAngle?: boolean;
  fontSize?: number;
  italic?: boolean;
}

export interface OmdAngleJson {
  omdType: "angle";
  rays?: OmdAngleRay[];
  angles?: OmdAngleMarker[];
  showRayNames?: boolean;
  vertexLabel?: string;
  rayLength?: number;
  strokeColor?: string;
  strokeWidth?: number;
  arcRadius?: number;
  showAngleTicks?: boolean;
  angleTickGap?: number;
  angleTickLength?: number;
  angleTickTolerance?: number;
  dotRadius?: number;
  fontSize?: number;
  padding?: number;
  startAngle?: number;
  endAngle?: number;
  label?: string;
}

export interface OmdRegularPolygonJson {
  omdType: "regularPolygon";
  numberOfSides?: number;
  radius?: number;
  unitScale?: number;
  showLabels?: boolean;
}

export type OmdShapeJson =
  | OmdRightTriangleJson
  | OmdIsoscelesTriangleJson
  | OmdRectangleJson
  | OmdRectangularPrismJson
  | OmdEllipseJson
  | OmdCircleJson
  | OmdAngleJson
  | OmdRegularPolygonJson;

export interface OmdSpinnerJson {
  omdType: "spinner";
  divisions?: number;
  arrowPosition?: number;
  size?: OmdSize;
}

export interface OmdLabelJson {
  omdType: "label";
  text?: string;
  size?: OmdSize;
  color?: string;
}

export type OmdJson =
  | OmdNumberJson
  | OmdVariableJson
  | OmdEquationJson
  | OmdEquationStackJson
  | OmdEquationWorkJson
  | OmdExpressionJson
  | OmdTermJson
  | OmdPowerExpressionJson
  | OmdRationalExpressionJson
  | OmdFunctionJson
  | OmdBalanceHangerJson
  | OmdNumberLineJson
  | OmdDoubleNumberLineJson
  | OmdCoordinatePlaneJson
  | OmdTapeDiagramJson
  | OmdDoubleTapeDiagramJson
  | OmdNumberTileJson
  | OmdTileEquationJson
  | OmdTableJson
  | OmdRatioChartJson
  | OmdShapeJson
  | OmdSpinnerJson
  | OmdAlgorithmWorkJson
  | OmdFractionWorkJson
  | OmdFractionAreaModelJson
  | OmdMathTextJson
  | OmdLinePlotJson
  | OmdAreaDiagramJson
  | OmdAreaModelJson
  | OmdFractionStripsJson
  | OmdFractionCircleJson
  | OmdLabelJson;

export interface OmdEquationStackOptions {
  toolbar?: boolean;
  stepVisualizer?: boolean;
  styling?: {
    equationBackground?: {
      backgroundColor?: string;
      cornerRadius?: number;
      pill?: boolean;
      padding?: number | { x?: number; y?: number };
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export declare class omdTerm extends OmdComponentBase {
  constructor(coefficient?: number, variable?: string, exponent?: number);
  loadFromJSON(data: OmdLoadData<OmdTermJson>): void;
}

export declare class omdExpression extends OmdComponentBase {
  constructor();
  loadFromJSON(data: string | OmdLoadData<OmdExpressionJson>): void;
}

export declare class omdEquation extends OmdComponentBase {
  constructor();
  loadFromJSON(data: string | OmdLoadData<OmdEquationJson>): void;
}

export declare class omdPowerExpression extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdPowerExpressionJson>): void;
}

export declare class omdRationalExpression extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdRationalExpressionJson>): void;
}

export declare class omdFunction extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdFunctionJson>): void;
}

export declare class omdEquationNode extends OmdComponentBase {
  constructor(ast: unknown);
  static fromString(equationString: string): omdEquationNode;
}

export declare class omdConstantNode extends OmdComponentBase {
  constructor(nodeData: unknown);
  static fromValue(value: number | string): omdConstantNode;
  getValue(): number | string;
  evaluate(): number | string;
  toString(): string;
}

export declare class omdEquationSequenceNode extends OmdComponentBase {
  static OPERATION_MAP: Record<string, string>;
  constructor(steps: omdEquationNode[]);
  static fromStringArray(stepStrings: string[]): omdEquationSequenceNode;
  static fromSteps(stepsArray: string[]): omdEquationSequenceNode;
  setAlignmentMode(mode: OmdEquationAlignmentMode): void;
  getAlignmentMode(): OmdEquationAlignmentMode;
  setFilterLevel(level?: number): void;
  setFilterLevels(levels?: number[]): void;
  getFilterLevel(): number;
}

export declare class omdEquationStack extends OmdComponentBase {
  constructor(steps?: omdEquationNode[], options?: OmdEquationStackOptions);
  initialize(): void;
  setFontSize(fontSize: number): void;
  getSequence(): omdEquationSequenceNode;
  undoLastOperation(): boolean;
  getSvg(): SVGElement;
}

export declare class omdBalanceHanger extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdBalanceHangerJson>): void;
}

export declare class omdNumberLine extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdNumberLineJson>): void;
  addNumberDot(value: number | OmdNumberLineDot): void;
  setMinAndMax(min: number, max: number): void;
  addInteractiveDot(value: number): void;
  removeDot(index: number): void;
  setDotValue(index: number, value: number): void;
  setRangeValue(handle: "start" | "end", value: number): void;
  setInteractiveRange(
    rangeValues?: [number, number],
    options?: { startStyle?: "closed" | "open" | "arrow"; endStyle?: "closed" | "open" | "arrow" }
  ): void;
  clearInteractiveRange(): void;
  cycleRangeEndpointStyle(handle: "start" | "end"): void;
  setRangeEndpointStyle(handle: "start" | "end", style: "closed" | "open" | "arrow"): void;
}

export declare class omdDoubleNumberLine extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdDoubleNumberLineJson>): void;
}

export declare class omdCoordinatePlane extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdCoordinatePlaneJson>): void;
  onChange: ((payload: OmdCoordinatePlaneChangePayload) => void) | null;
  getPlottedPoints(): Array<[number, number]>;
  setPlottedPoints(points: Array<[number, number]>): void;
  clearPlottedPoints(): void;
  togglePlotPoint(x: number, y: number): void;
}

export declare class omdTapeDiagram extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdTapeDiagramJson>): void;
}

export declare class omdDoubleTapeDiagram extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdDoubleTapeDiagramJson>): void;
}

export declare class omdNumberTile extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdNumberTileJson>): void;
}

export declare class omdTileEquation extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdTileEquationJson>): void;
}

export declare class omdTable extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdTableJson>): void;
  onChange: ((payload: OmdTableChangePayload) => void) | null;
  getCellValues(): OmdTableCellValue[][];
  getEditableValues(): Record<string, OmdTableCellValue>;
  setEditableValues(
    values: Record<string, OmdTableCellValue>,
    emitChange?: boolean
  ): void;
}

export declare class omdRatioChart extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdRatioChartJson>): void;
}

export declare class omdRightTriangle extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdRightTriangleJson>): void;
}

export declare class omdIsoscelesTriangle extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdIsoscelesTriangleJson>): void;
}

export declare class omdRectangle extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdRectangleJson>): void;
}

export declare class omdRectangularPrism extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdRectangularPrismJson>): void;
}

export declare class omdEllipse extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdEllipseJson>): void;
}

export declare class omdCircle extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdCircleJson>): void;
}

export declare class omdAngle extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdAngleJson>): void;
}

export declare class omdRegularPolygon extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdRegularPolygonJson>): void;
}

export declare class omdShapeLabelSet extends OmdComponentBase {
  constructor();
}

export declare class omdSpinner extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdSpinnerJson>): void;
}

export declare class omdLabel extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdLabelJson>): void;
}

export interface OmdAlgorithmWorkRow {
  kind?: "carry" | "given" | "answer" | "work" | "blank" | "rule";
  cells?: (string | number | { text: string | number; kind?: string; color?: string; step?: number; strike?: boolean; strikeStep?: number })[];
  step?: number;
  annotation?: string;
  color?: string;
  gapAfter?: number;
}

export interface OmdAlgorithmWorkStep {
  label?: string;
  description?: string;
}

export interface OmdAlgorithmWorkJson {
  omdType: "algorithmWork";
  operation?: "addition" | "subtraction" | "multiplication" | "division";
  columns?: string[];
  divisor?: string;
  rows?: OmdAlgorithmWorkRow[];
  steps?: OmdAlgorithmWorkStep[];
  stepIndex?: number;
  activeRow?: number;
  showStepsList?: boolean;
  fontSize?: number;
  columnWidth?: number;
  rowGap?: number;
}

export declare class omdAlgorithmWork extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdAlgorithmWorkJson>): void;
  nextStep(): string | null;
  getRevealedSteps(): number;
}

export interface OmdFractionWorkJson {
  omdType: "fractionWork";
  operation: "multiplication" | "division" | "addition" | "subtraction";
  /** Whole number, fraction ("3/4"), or mixed number ("2 1/2"). */
  left: string | number;
  right: string | number;
  stepIndex?: number;
  showStepsList?: boolean;
  showAnnotations?: boolean;
  fontSize?: number;
}

export declare class omdFractionWork extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdFractionWorkJson>): void;
  getSteps(): { description: string }[];
  nextStep(): string | null;
  getRevealedSteps(): number;
}

export interface OmdFractionAreaModelJson {
  omdType: "fractionAreaModel";
  /** The "of" fraction a/b, from 0 to 1. */
  left: string;
  /** The amount c/d it is taken of, from 0 to 1. */
  right: string;
  stepIndex?: 1 | 2 | 3;
  captions?: string[];
  unitScale?: number;
  shadeColor?: string;
  overlapColor?: string;
  captionFontSize?: number;
  labelFontSize?: number;
}

export declare class omdFractionAreaModel extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdFractionAreaModelJson>): void;
  getCaptions(): string[];
  nextStep(): string | null;
  getRevealedSteps(): number;
}

export interface OmdMathTextJson {
  omdType: "mathText";
  text: string;
  fontSize?: number;
  width?: number;
  lineHeight?: number;
  fontFamily?: string;
  fontColor?: string;
  fontWeight?: number | string;
}

export interface OmdLinePlotJson {
  omdType: "linePlot";
  min?: number;
  max?: number;
  step?: number;
  values?: number[];
  title?: string;
  fontSize?: number;
  width?: number;
  dotRadius?: number;
}

export declare class omdLinePlot extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdLinePlotJson>): void;
}

/** A length in units: 4, 0.75, "2/3" or "3 1/4". */
export type OmdRationalLike = number | string | { n: number; d: number };

export interface OmdBraceSpan {
  /** Preset extent when `from`/`to` are omitted. */
  scope?: "unit" | "shaded" | "grid";
  from?: OmdRationalLike;
  to?: OmdRationalLike;
  /** omdMathText markup; defaults to the span length, e.g. "[2/3]". */
  label?: string;
  style?: "brace" | "arrow";
}

export type OmdBraceSpec =
  | false
  | "none"
  | "unit"
  | "shaded"
  | "grid"
  | OmdBraceSpan
  | ReadonlyArray<"unit" | "shaded" | "grid" | OmdBraceSpan>;

export type OmdPartitionScope = "all" | "last" | { from?: OmdRationalLike; to?: OmdRationalLike };

export interface OmdAreaDiagramInput {
  /** Identifies the field in payloads; defaults to `label`. */
  key?: string;
  label?: string;
  /** Renders a live value instead of a text field. */
  readout?: "area" | "expression";
  placeholder?: string;
  suffix?: string;
  width?: number;
  /** Accepted answer(s); numbers compare as exact rationals. */
  answer?: string | number | ReadonlyArray<string | number>;
  value?: string;
}

export interface OmdAreaDiagramState {
  columns: string;
  rows: string;
  shadeWidth: string;
  shadeHeight: string;
  rectangular: boolean;
  shadeMode: "rect" | "cells";
  shadedCells: string[] | null;
  area: string;
  areaValue: number;
  areaFraction: { n: number; d: number };
  expression: string;
  answers: Record<string, string>;
  feedback: Record<string, "correct" | "incorrect" | null>;
}

export interface OmdAreaDiagramChange extends OmdAreaDiagramState {
  type: "paint" | "resize" | "cells" | "clear" | "input" | "check";
  key?: string;
  value?: string;
}

export interface OmdAreaDiagramJson {
  omdType: "areaDiagram";
  /** Drawn grid extent in whole units. `width`/`height` are accepted aliases. */
  columns?: OmdRationalLike;
  rows?: OmdRationalLike;
  width?: OmdRationalLike;
  height?: OmdRationalLike;
  /** Dashed partitions per unit square. */
  columnParts?: number;
  rowParts?: number;
  unitScale?: number;
  shadeWidth?: OmdRationalLike;
  shadeHeight?: OmdRationalLike;
  shadeMode?: "rect" | "cells";
  shadedCells?: ReadonlyArray<[number, number] | string>;
  shadeColor?: string;
  shadeOpacity?: number;
  emptyColor?: string;
  gridColor?: string;
  gridStrokeWidth?: number;
  partitionColor?: string;
  partitionStrokeWidth?: number;
  partitionDash?: string;
  showPartitions?: boolean;
  showUnitLines?: boolean;
  partitionScope?: OmdPartitionScope;
  columnPartitionScope?: OmdPartitionScope;
  rowPartitionScope?: OmdPartitionScope;
  topBrace?: OmdBraceSpec;
  leftBrace?: OmdBraceSpec;
  bottomBrace?: OmdBraceSpec;
  rightBrace?: OmdBraceSpec;
  topBraces?: OmdBraceSpec;
  leftBraces?: OmdBraceSpec;
  bottomBraces?: OmdBraceSpec;
  rightBraces?: OmdBraceSpec;
  /** Shorthand for `topBrace: 'shaded'` and `leftBrace: 'shaded'`. */
  showLabels?: boolean;
  braceStyle?: "brace" | "arrow";
  braceColor?: string;
  labelFontSize?: number;
  title?: string;
  titleFontSize?: number;
  showAreaLabel?: boolean;
  areaLabelText?: string;
  expressionLine?: boolean;
  expressionSuffix?: string;
  decompose?: boolean;
  /** "both" splits both mixed sides into whole + fraction: four partial products. */
  decomposeAxis?: "auto" | "x" | "y" | "both";
  /** Decomposition line: the whole equation, the partial products only, or nothing. */
  readout?: "full" | "partials" | "none";
  /** Tint for the fractional columns (and the fractional rows when only rows split). */
  decomposeColor?: string;
  /** Tint for the fractional rows when both sides split. */
  decomposeRowColor?: string;
  /** Tint for the fraction × fraction piece when both sides split. */
  decomposeCornerColor?: string;
  interactive?: boolean;
  allowPaint?: boolean;
  allowResize?: boolean;
  inputs?: ReadonlyArray<OmdAreaDiagramInput>;
  checkAnswers?: boolean;
  onChange?: (payload: OmdAreaDiagramChange) => void;
}

export declare class omdAreaDiagram extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdAreaDiagramJson>): void;
  onChange: ((payload: OmdAreaDiagramChange) => void) | null;
  getState(): OmdAreaDiagramState;
  getArea(): { n: number; d: number };
  getShadeExtent(): { width: { n: number; d: number }; height: { n: number; d: number }; rectangular: boolean };
  getExpressionText(): string;
  setShadeSize(width?: OmdRationalLike, height?: OmdRationalLike, emit?: boolean): void;
  setShadedCells(cells: ReadonlyArray<[number, number] | string>, emit?: boolean): void;
  clearShading(emit?: boolean): void;
  getAnswers(): Record<string, string>;
  setAnswer(key: string, value: string, emit?: boolean): void;
  checkAll(): Record<string, "correct" | "incorrect" | null>;
}

export interface OmdAreaModelJson {
  omdType: "areaModel";
  /** Side lengths across the top, one per column: "3", "2/3", "200". */
  columns: ReadonlyArray<string | number>;
  /** Side lengths down the left, one per row. */
  rows: ReadonlyArray<string | number>;
  /** Text in each piece, row by row; computed products when omitted. */
  cells?: ReadonlyArray<ReadonlyArray<string | number>>;
  /** Sum line under the figure. */
  showSum?: boolean;
  /** "rows" adds each row first: "2,220 + 888 = 3,108". */
  sumBy?: "cells" | "rows";
  /** Explicit sum line; wins over the computed one. */
  sum?: string;
  /** Size pieces by their side lengths instead of by their text. */
  toScale?: boolean;
  /** px per unit when `toScale`; 0 fits the columns to `cellWidth` each. */
  unitScale?: number;
  /** Width of the largest column when not to scale; smaller side lengths get narrower (compressed, not proportional) columns. */
  cellWidth?: number;
  /** Height of the largest row when not to scale. */
  cellHeight?: number;
  lineStyle?: "solid" | "dashed";
  lineDash?: string;
  cellColors?: ReadonlyArray<ReadonlyArray<string>> | null;
  strokeColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  labelFontSize?: number;
  textColor?: string;
  caption?: string;
  captionColor?: string;
  padding?: number;
}

export declare class omdAreaModel extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdAreaModelJson>): void;
  getCells(): string[][];
  getSumText(): string;
}

export interface OmdFractionStripsState {
  strips: number;
  parts: number;
  subParts: number;
  shadedCells: string[];
  shadedCount: number;
  total: string;
  totalValue: number;
  totalFraction: { n: number; d: number };
}

export interface OmdFractionStripsJson {
  omdType: "fractionStrips";
  /** Wholes being shared. */
  strips?: number;
  /** Equal parts each whole is cut into. */
  parts?: number;
  /** Shaded pieces per whole (sub-parts when `subParts` > 1). */
  shaded?: number;
  /** Cuts every part again; parts are then ruled solid, sub-parts dashed. */
  subParts?: number;
  shadedList?: readonly number[];
  shadedCells?: ReadonlyArray<[number, number] | string>;
  orientation?: "horizontal" | "vertical";
  fillFrom?: "start" | "end";
  stripLength?: number;
  stripThickness?: number;
  gap?: number;
  shadeColor?: string;
  emptyColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  dividerColor?: string;
  dividerWidth?: number;
  /** SVG dash pattern for part lines when `subParts` is 1, or "none" for solid. */
  dividerDash?: string;
  /** SVG dash pattern for sub-part lines. */
  subPartDash?: string;
  cornerRadius?: number;
  /** Label under the whole; false hides the brace. */
  brace?: string | false;
  braceEvery?: boolean;
  stripLabels?: readonly string[];
  separator?: string;
  labelFontSize?: number;
  title?: string;
  expressionLine?: boolean;
  interactive?: boolean;
  onChange?: (payload: OmdFractionStripsState & { type: string }) => void;
}

export declare class omdFractionStrips extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdFractionStripsJson>): void;
  onChange: ((payload: OmdFractionStripsState & { type: string }) => void) | null;
  getState(): OmdFractionStripsState;
  getTotal(): { n: number; d: number };
  getTotalAsDrawn(): { n: number; d: number };
  setShadedCells(cells: ReadonlyArray<[number, number] | string>, emit?: boolean): void;
  clearShading(emit?: boolean): void;
}

export interface OmdFractionCircleState {
  count: number;
  parts: number;
  shadedCells: string[];
  shadedCount: number;
  total: string;
  totalValue: number;
  totalFraction: { n: number; d: number };
}

export interface OmdFractionCircleJson {
  omdType: "fractionCircle";
  count?: number;
  circles?: number;
  parts?: number;
  shaded?: number;
  shadedList?: readonly number[];
  shadedCells?: ReadonlyArray<[number, number] | string>;
  radius?: number;
  gap?: number;
  startAngle?: number;
  shadeColor?: string;
  emptyColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  labelFontSize?: number;
  title?: string;
  circleLabels?: readonly string[];
  expressionLine?: boolean;
  interactive?: boolean;
  onChange?: (payload: OmdFractionCircleState & { type: string }) => void;
}

export declare class omdFractionCircle extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdFractionCircleJson>): void;
  onChange: ((payload: OmdFractionCircleState & { type: string }) => void) | null;
  getState(): OmdFractionCircleState;
  getTotal(): { n: number; d: number };
  getTotalAsDrawn(): { n: number; d: number };
  setShadedCells(cells: ReadonlyArray<[number, number] | string>, emit?: boolean): void;
}

/** Exact rational helpers used by the fraction visuals. */
export declare function parseRational(value: OmdRationalLike, fallback?: { n: number; d: number } | null): { n: number; d: number } | null;
export declare function makeRational(n: number, d: number): { n: number; d: number } | null;
export declare function ratValue(r: { n: number; d: number }): number;
export declare function formatRationalText(r: { n: number; d: number }, options?: { mixed?: boolean }): string;
export declare function formatRationalMarkup(r: { n: number; d: number }, options?: { mixed?: boolean }): string;

export type OmdInlineMathNode =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "break" }
  | { kind: "math"; nodes: OmdMathNode[]; plain: string };

export interface OmdMathNode {
  t: "num" | "ident" | "op" | "punct" | "sym" | "space" | "text" | "frac" | "mixed" | "script" | "sqrt" | "group";
  v?: string;
  num?: OmdMathNode[];
  den?: OmdMathNode[];
  whole?: OmdMathNode[];
  base?: OmdMathNode;
  sup?: OmdMathNode[];
  sub?: OmdMathNode[];
  radicand?: OmdMathNode[];
  index?: OmdMathNode[];
  children?: OmdMathNode[];
  open?: string;
  close?: string;
}

export interface OmdInlineMathOptions {
  /** Detect bare `3/4` and `2 5/8` in prose. Default true. */
  autoFractions?: boolean;
  /** Accept legacy `[3/4]` bracket tokens. Default true. */
  bracketTokens?: boolean;
  /** Accept `**bold**`. Default true. */
  bold?: boolean;
}

export interface OmdInlineMathElement {
  tag: string;
  attributes: Record<string, string>;
  children: Array<OmdInlineMathElement | string>;
}

export declare function parseInlineMath(source: string, options?: OmdInlineMathOptions): OmdInlineMathNode[];
export declare function parseMathSource(source: string): OmdMathNode[];
export declare function inlineMathToPlainText(sourceOrNodes: string | OmdInlineMathNode[]): string;
export declare function mathNodesToPlainText(nodes: OmdMathNode[]): string;
export declare function hasInlineMath(source: string, options?: OmdInlineMathOptions): boolean;
export declare function inlineMathElementTree(sourceOrNodes: string | OmdInlineMathNode[], options?: OmdInlineMathOptions): Array<OmdInlineMathElement | string>;
export declare function renderInlineMathToDOM(sourceOrNodes: string | OmdInlineMathNode[], options?: OmdInlineMathOptions & { document?: Document; namespace?: string }): DocumentFragment;
export declare function renderInlineMathToHTML(sourceOrNodes: string | OmdInlineMathNode[], options?: OmdInlineMathOptions): string;
export declare function ensureInlineMathStyles(doc?: Document): boolean;
export declare const INLINE_MATH_CSS: string;
export declare const INLINE_MATH_STYLE_ID: string;

export declare class omdMathText extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdMathTextJson>): void;
  getPlainText(): string;
}

export declare class omdProblem extends OmdComponentBase {
  constructor();
  loadFromJSON(data: unknown, handleAIResponse?: ((response: unknown) => void) | null): void;
}

export declare class omd extends OmdComponentBase {
  constructor();
  setCanvasSize(width: number, height: number): void;
  setBackgroundColor(color: string): void;
  generateGraphic(jsonData: OmdJson): void;
  getSVG(): SVGElement;
  getDiv(): HTMLDivElement;
}

export interface OmdSchemaField {
  name: string;
  type: string;
  default?: unknown;
  required?: boolean;
  options?: readonly unknown[];
  description?: string;
  [key: string]: unknown;
}

export interface OmdSchemaDefinition {
  notes?: string;
  fields?: OmdSchemaField[];
  [key: string]: unknown;
}

export type OmdSchemas = Partial<Record<OmdType, OmdSchemaDefinition>>;
export type OmdSampleJson = OmdJson & { _comment?: string };
export type OmdSamples = Partial<Record<OmdType, OmdSampleJson[]>>;

export declare const omdColor: {
  readonly lightGray: "#EEEEEE";
  readonly mediumGray: "#DDDDDD";
  readonly darkGray: "#AAAAAA";
  readonly hiliteColor: "#FF69B4";
  readonly stepColor: "#9FDAFF";
  readonly explainColor: "#FFD9B3";
  readonly red: "#DB2323";
  readonly green: "#6FDE29";
  readonly blue: "#2386DB";
  readonly white: "#FFFFFF";
};

export declare function createFromJSON(jsonData: OmdJson): OmdComponentLike;
export declare function getSupportedTypes(): OmdConstructibleType[];
export declare function isTypeSupported(omdType: string): omdType is OmdConstructibleType;

declare const omdSchemas: OmdSchemas;
declare const omdSamples: OmdSamples;
export default omdSchemas;
export { omdSchemas, omdSamples };
