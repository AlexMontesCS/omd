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
}

export declare class omdDisplay {
  constructor(container: HTMLElement, options?: OmdDisplayOptions);
  readonly container: HTMLElement;
  readonly options: Required<OmdDisplayOptions>;
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

export interface OmdNumberLineJson {
  omdType: "numberLine";
  min?: number;
  max?: number;
  increment?: number;
  dotValues?: number[];
  title?: string;
  label?: string;
  units?: string;
  showLeftArrow?: boolean;
  showRightArrow?: boolean;
  hideDefaultNumbers?: boolean;
  specialNumbers?: Array<number | OmdNumberLineSpecialNumber>;
  totalWidth?: number;
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
}

export interface OmdTapeValue {
  value?: number;
  label?: string;
  color?: string;
  fillColor?: string;
  text?: string;
  [key: string]: unknown;
}

export interface OmdTapeLabel {
  from?: number;
  to?: number;
  label?: string;
  text?: string;
  color?: string;
  position?: "top" | "bottom" | string;
  [key: string]: unknown;
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
  values?: Array<number | string | OmdTapeValue>;
  labelSet?: OmdTapeLabel[];
}

export interface OmdDoubleTapeDiagramJson {
  omdType: "doubleTapeDiagram";
  topTapeDiagram?: OmdLoadData<OmdTapeDiagramJson>;
  bottomTapeDiagram?: OmdLoadData<OmdTapeDiagramJson>;
  spacing?: number;
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
  angle: number;
  length?: number;
  label?: string;
  labelDistance?: number;
  color?: string;
  strokeWidth?: number;
}

export interface OmdAngleMarker {
  from: number;
  to: number;
  label?: string;
  marker?: "arc" | "square" | "right" | "full-circle" | string;
  color?: string;
  radius?: number;
}

export interface OmdAngleJson {
  omdType: "angle";
  rays?: OmdAngleRay[];
  angles?: OmdAngleMarker[];
  vertexLabel?: string;
  rayLength?: number;
  strokeColor?: string;
  strokeWidth?: number;
  arcRadius?: number;
  dotRadius?: number;
  fontSize?: number;
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
}

export declare class omdDoubleNumberLine extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdDoubleNumberLineJson>): void;
}

export declare class omdCoordinatePlane extends OmdComponentBase {
  constructor();
  loadFromJSON(data: OmdLoadData<OmdCoordinatePlaneJson>): void;
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
export default omdSchemas;
export { omdSchemas };
