import { omdColor, OMD_MATH_FONT_FAMILY } from "../omdConstants.js";
import { jsvgGroup, jsvgRect, jsvgClipMask, jsvgLine, jsvgEllipse, jsvgTextBox, jsvgTextLine, jsvgPath } from "@teachinglab/jsvg";
import { math } from "../math.js";
import {
    omdRightTriangle,
    omdIsoscelesTriangle,
    omdRectangle,
    omdEllipse,
    omdCircle,
    omdAngle,
    omdRegularPolygon
} from "./omdShapes.js";

export class omdCoordinatePlane extends jsvgGroup {
    constructor() {
        super();

        // Replace the default <g> element with an <svg> element so that
        // overflow:hidden is respected and getBBox() returns the correct
        // clipped dimensions (fixing the oversized selection box bug).
        const svgNS = "http://www.w3.org/2000/svg";
        const svgEl = document.createElementNS(svgNS, "svg");
        if (this.svgObject && this.svgObject.parentNode) {
            this.svgObject.parentNode.replaceChild(svgEl, this.svgObject);
        }
        this.svgObject = svgEl;
        this.svgObject.setAttribute("overflow", "hidden");

        this.graphEquations = [];
        this.lineSegments = [];
        this.dotValues = [];
        this.shapeSet = [];

        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -5;
        this.yMax = 5;

        this.xLabel = "";
        this.yLabel = "";
        this.axisLabelOffsetPx = 20; //offset from axes

        this.size = "medium";

        this.tickInterval = 1; //interval between ticks
        this.forceAllTickLabels = true; // show all tick labels despite potential overlap  
        this.tickLabelOffsetPx = 5; //offset from axes
        this.showTickLabels = true; // show numeric tick labels

        // Background customization properties
        this.backgroundColor = omdColor.lightGray;
        this.backgroundCornerRadius = 15;
        this.backgroundOpacity = 1.0;
        this.showBackground = true;
        // Plot mode swaps the default grey card for a white one with a hairline
        // border, unless the author picked a colour themselves.
        this._backgroundColorExplicit = false;

        this.interactive = false;
        this.variables = [];

        // --- Interactive point-plotting (student input) ---------------------
        // When `plotMode` is true the student can click inside the plane to drop
        // points (and click an existing point to remove it). Data flows back out
        // via the `onChange` callback and the `omd-coordinateplane-change` event.
        this.plotMode = false;
        this.plottedPoints = [];          // [[x, y], ...] in data coordinates
        this.plotSnap = 1;                // snap increment for clicked points
        this.maxPlottedPoints = null;     // optional cap (null = unlimited)
        this.plotPointColor = "#2563eb";  // colour of student-plotted points
        this.onChange = null;             // optional callback(payload)
        this._plotLayer = null;

        this.basePaddingBottom = 30;
        this.interactivePaddingBottom = 0;
        this.customPaddingTop = null;
        this.customPaddingRight = null;
        this.customPaddingBottom = null;
        this.customPaddingLeft = null;
        this.renderedFunctionEntries = [];
        this.sliderControlRows = [];

        this.calculatePadding();
        this.updateLayout();
    }

    

    loadFromJSON(data) {
        // Assume valid JSON shape
        this.graphEquations = data.graphEquations || [];
        this.lineSegments = data.lineSegments || [];
        this.dotValues = data.dotValues || [];
        this.shapeSet = data.shapeSet || [];

        this.xMin = (data.xMin !== undefined) ? data.xMin : this.xMin;
        this.xMax = (data.xMax !== undefined) ? data.xMax : this.xMax;
        this.yMin = (data.yMin !== undefined) ? data.yMin : this.yMin;
        this.yMax = (data.yMax !== undefined) ? data.yMax : this.yMax;

        this.xLabel = (data.xLabel !== undefined) ? data.xLabel : this.xLabel;
        this.yLabel = (data.yLabel !== undefined) ? data.yLabel : this.yLabel;
        this.axisLabelOffsetPx = (data.axisLabelOffsetPx !== undefined) ? data.axisLabelOffsetPx : this.axisLabelOffsetPx;

        this.size = (data.size !== undefined) ? data.size : this.size;

        this.tickInterval = (data.tickInterval !== undefined) ? data.tickInterval : this.tickInterval;
        this.tickLabelOffsetPx = (data.tickLabelOffsetPx !== undefined) ? data.tickLabelOffsetPx : this.tickLabelOffsetPx;
        this.forceAllTickLabels = (data.forceAllTickLabels !== undefined) ? data.forceAllTickLabels : this.forceAllTickLabels;
        this.showTickLabels = (data.showTickLabels !== undefined) ? data.showTickLabels : this.showTickLabels;

        if (typeof data.graphPadding === "number") {
            this.customPaddingTop = data.graphPadding;
            this.customPaddingRight = data.graphPadding;
            this.customPaddingBottom = data.graphPadding;
            this.customPaddingLeft = data.graphPadding;
        } else if (data.graphPadding && typeof data.graphPadding === "object") {
            if (typeof data.graphPadding.top === "number") this.customPaddingTop = data.graphPadding.top;
            if (typeof data.graphPadding.right === "number") this.customPaddingRight = data.graphPadding.right;
            if (typeof data.graphPadding.bottom === "number") this.customPaddingBottom = data.graphPadding.bottom;
            if (typeof data.graphPadding.left === "number") this.customPaddingLeft = data.graphPadding.left;
        }

        if (typeof data.paddingTop === "number") this.customPaddingTop = data.paddingTop;
        if (typeof data.paddingRight === "number") this.customPaddingRight = data.paddingRight;
        if (typeof data.paddingBottom === "number") this.customPaddingBottom = data.paddingBottom;
        if (typeof data.paddingLeft === "number") this.customPaddingLeft = data.paddingLeft;

        // Load background customization properties
        this.backgroundColor = data.backgroundColor || this.backgroundColor;
        if (data.backgroundColor) this._backgroundColorExplicit = true;
        this.backgroundCornerRadius = (data.backgroundCornerRadius !== undefined) ? data.backgroundCornerRadius : this.backgroundCornerRadius;
        this.backgroundOpacity = (data.backgroundOpacity !== undefined) ? data.backgroundOpacity : this.backgroundOpacity;
        this.showBackground = (data.showBackground !== undefined) ? data.showBackground : this.showBackground;
        this.interactive = data.interactive === true || data.interactive === "true";
        this.variables = this.normalizeInteractiveVariables(
            data.variables || data.interactiveVariables || []
        );

        // Interactive point-plotting config.
        this.plotMode = data.plotMode === true || data.plotMode === "true";
        if (Array.isArray(data.plottedPoints)) {
            this.plottedPoints = data.plottedPoints
                .map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : null))
                .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
        }
        if (Number.isFinite(data.plotSnap) && data.plotSnap > 0) this.plotSnap = data.plotSnap;
        if (Number.isFinite(data.maxPlottedPoints)) this.maxPlottedPoints = data.maxPlottedPoints;
        if (typeof data.plotPointColor === "string") this.plotPointColor = data.plotPointColor;

        this.calculatePadding();
        this.updateLayout();
    }

    

    updateLayout() {
        this.removeAllChildren();
        // removeAllChildren() only clears jsvg-tracked children; interactive
        // overlays are appended directly to svgObject, so clear them here to
        // avoid duplicating controls/plot layers across re-layouts.
        if (this.svgObject && this.svgObject.querySelectorAll) {
            this.svgObject
                .querySelectorAll("[data-omd-interactive-controls], [data-omd-plot-layer]")
                .forEach((el) => el.remove());
        }
        this.calculateGraphDimensions();

        const outerWidth = this.width;
        const outerHeight = this.height;

        const clipMask = new jsvgClipMask(outerWidth, outerHeight, 15);
        this.addChild(clipMask);

        const whiteRect = new jsvgRect();
        whiteRect.setWidthAndHeight(outerWidth, outerHeight);
        
        // Plot mode reads as a worksheet, not a chart chrome: white paper with a
        // hairline edge rather than the default grey card.
        const plotSurface = this.plotMode && !this._backgroundColorExplicit;
        const surfaceColor = plotSurface ? "#FFFFFF" : this.backgroundColor;

        // Apply customizable background properties
        if (this.showBackground) {
            whiteRect.setFillColor(surfaceColor);
            if (this.backgroundOpacity < 1.0) {
                whiteRect.setOpacity(this.backgroundOpacity);
            }
        } else {
            whiteRect.setFillColor("transparent");
        }
        whiteRect.setStrokeWidth(0);

        if (whiteRect.setCornerRadius && this.backgroundCornerRadius > 0) {
            whiteRect.setCornerRadius(this.backgroundCornerRadius);
        }

        clipMask.addChild(whiteRect);

        if (plotSurface && this.showBackground) {
            const edge = new jsvgRect();
            edge.setWidthAndHeight(outerWidth - 1, outerHeight - 1);
            edge.setPosition(0.5, 0.5);
            edge.setFillColor("none");
            edge.setStrokeColor("#E4E7EB");
            edge.setStrokeWidth(1);
            if (edge.setCornerRadius) edge.setCornerRadius(Math.max(0, this.backgroundCornerRadius - 1));
            clipMask.addChild(edge);
        }

        const contentGroup = new jsvgGroup();
        contentGroup.setPosition(0, 0);
        clipMask.addChild(contentGroup);

        this.setWidthAndHeight(outerWidth, outerHeight);
        this.svgObject.setAttribute("viewBox", `0 0 ${outerWidth} ${outerHeight}`);

        const gridHolder = new jsvgGroup();
        contentGroup.addChild(gridHolder);
        this.makeGrid(gridHolder);

        const graphClipMask = new jsvgClipMask(this.graphWidth, this.graphHeight, 0);
        graphClipMask.setPosition(this.paddingLeft, this.paddingTop);
        contentGroup.addChild(graphClipMask);

        // Traditional explicit calls instead of dynamic invocation
        const functionsHolder = new jsvgGroup();
        graphClipMask.addChild(functionsHolder);
        this.graphMultipleFunctions(functionsHolder);

        const segmentsHolder = new jsvgGroup();
        graphClipMask.addChild(segmentsHolder);
        this.drawLineSegments(segmentsHolder);

        const dotsHolder = new jsvgGroup();
        graphClipMask.addChild(dotsHolder);
        this.plotDots(dotsHolder);

        const shapesHolder = new jsvgGroup();
        graphClipMask.addChild(shapesHolder);
        this.addShapes(shapesHolder);

        this.sliderControlRows = [];
        if (this.shouldShowInteractiveControls()) {
            this.createInteractiveControls(this.svgObject);
        }

        if (this.plotMode) {
            this.createPlotLayer(this.svgObject);
        }
    }

    createAxisGrid(gridHolder, isXAxis) {
        const interval = this.tickInterval || 1;
        const min = isXAxis ? this.xMin : this.yMin;
        const max = isXAxis ? this.xMax : this.yMax;

        const firstTick = Math.ceil(min);
        const lastTick = Math.floor(max);
        const minLabelSpacing = 10;
        const labelWidthEstimate = 20; // matches createNumericLabel width
        const requiredLabelSpacing = minLabelSpacing + labelWidthEstimate;

        // Compute label interval for label display only
        let labelInterval = interval;
        if (!this.forceAllTickLabels) {
            const span = isXAxis ? this.xMax - this.xMin : this.yMax - this.yMin;
            let floored = Math.floor(span / 10) * 10;
            let raw = floored / 6;
            let rounded = Math.round(raw / 5) * 5;
            if (rounded === 0) rounded = 1;
            labelInterval = rounded;
        }

        let lastLabelPos = -Infinity;
        let zeroLineDrawn = false;

        for (let value = firstTick; value <= lastTick; value += interval) {
            const pos = this.computeAxisPos(isXAxis, value);

            const line = new jsvgLine();
            this.setAxisLineEndpoints(isXAxis, line, pos);
            line.setStrokeColor("black");
            line.setOpacity(value === 0 ? 1.0 : 0.15);
            gridHolder.addChild(line);

            if (value === 0) {
                zeroLineDrawn = true;
            }

            let shouldShowLabel = false;
            if (this.showTickLabels) {
                if (this.forceAllTickLabels) {
                    shouldShowLabel = true;
                } else {
                    // Only show label if value is a multiple of labelInterval
                    const eps = 1e-9;
                    const isMultiple = (v, candidate) => Math.abs(v / candidate - Math.round(v / candidate)) < eps;
                    shouldShowLabel = isMultiple(value, labelInterval);
                }
            }

            if (shouldShowLabel) {
                this.addTickLabel(gridHolder, isXAxis, pos, value);
                // store the actual clamped center used by addTickLabel
                if (isXAxis) {
                    const center = Math.max(20, Math.min(pos, this.width - 20));
                    lastLabelPos = center;
                } else {
                    const center = Math.max(15, Math.min(pos, this.height - 7.5));
                    lastLabelPos = center;
                }
            }
        }

        if (0 >= min && 0 <= max && !zeroLineDrawn) {
            const zeroPos = this.computeAxisPos(isXAxis, 0);
            const zeroLine = new jsvgLine();
            this.setAxisLineEndpoints(isXAxis, zeroLine, zeroPos);
            zeroLine.setStrokeColor("black");
            zeroLine.setOpacity(1.0);
            gridHolder.addChild(zeroLine);
        }
    }

    createAxisLabels(gridHolder) {
        if (this.xLabel) {
            const w = Math.max(60, this.xLabel.length * 10);
            const h = 20;
            const xAxisLabel = new jsvgTextBox({ translateMirror: true });

            xAxisLabel.setWidthAndHeight(w, h);
            xAxisLabel.setText(this.xLabel);
            xAxisLabel.setFontSize(14);
            xAxisLabel.setFontColor("black");
            xAxisLabel.setAlignment("center");
            xAxisLabel.setVerticalCentering();
            xAxisLabel.setFontWeight(600);

            const idealX = this.paddingLeft + this.graphWidth / 2 - w / 2;
            const lx = Math.max(5, Math.min(idealX, this.width - w - 5));

            xAxisLabel.setPosition(lx, this.height - this.paddingBottom + this.axisLabelOffsetPx);
            gridHolder.addChild(xAxisLabel);
        }
        if (this.yLabel) {
            const fontSize = 14;
            const finalX = Math.max(15, this.paddingLeft - (this.axisLabelOffsetPx + 10));
            const finalY = this.paddingTop + this.graphHeight / 2;
            const labelGroup = new jsvgGroup();
            const yAxisLabel = new jsvgTextLine({ translateMirror: true });

            yAxisLabel.setText(this.yLabel);
            yAxisLabel.setFontSize(fontSize);
            yAxisLabel.setFontColor("black");
            yAxisLabel.setPosition(0, 0);
            yAxisLabel.svgObject.setAttribute("text-anchor", "middle");
            yAxisLabel.svgObject.setAttribute("dominant-baseline", "middle");
            yAxisLabel.setFontWeight(600);

            labelGroup.addChild(yAxisLabel);
            labelGroup.svgObject.setAttribute("transform", `translate(${finalX}, ${finalY}) rotate(-90)`);

            gridHolder.addChild(labelGroup);
        }
    }

    makeGrid(gridHolder) {
        this.createAxisGrid(gridHolder, true);
        this.createAxisGrid(gridHolder, false);
        this.createAxisLabels(gridHolder);
    }

    // ===== Helper functions =====

    calculatePadding() {
        const defaultPaddingLeft = this.yLabel ? 50 : 30;
        const defaultPaddingBottom = this.xLabel ? 50 : 30;
        const defaultPaddingTop = 25;
        const defaultPaddingRight = 25;

        this.paddingLeft = typeof this.customPaddingLeft === "number" ? this.customPaddingLeft : defaultPaddingLeft;
        this.basePaddingBottom = typeof this.customPaddingBottom === "number" ? this.customPaddingBottom : defaultPaddingBottom;
        this.interactivePaddingBottom = this.shouldShowInteractiveControls()
            ? this.getInteractiveControlHeight()
            : 0;
        this.paddingBottom = this.basePaddingBottom + this.interactivePaddingBottom;
        this.paddingTop = typeof this.customPaddingTop === "number" ? this.customPaddingTop : defaultPaddingTop;
        this.paddingRight = typeof this.customPaddingRight === "number" ? this.customPaddingRight : defaultPaddingRight;
    }

    computeAxisPos(isXAxis, value) {
        return isXAxis
            ? this.paddingLeft + (value - this.xMin) * this.xSpacer
            : this.height - this.paddingBottom - (value - this.yMin) * this.ySpacer;
    }

    setAxisLineEndpoints(isXAxis, line, pos) {
        if (isXAxis) {
            line.setEndpoints(pos, this.paddingTop, pos, this.height - this.paddingBottom);
        } else {
            line.setEndpoints(this.paddingLeft, pos, this.width - this.paddingRight, pos);
        }
    }

    addTickLabel(gridHolder, isXAxis, pos, value) {
        const label = this.createNumericLabel(value);
        if (isXAxis) {
            const labelWidth = label.width || 20;
            const lx = Math.max(10, Math.min(pos - labelWidth / 2, this.width - labelWidth - 10));
            label.setPosition(lx, this.height - this.paddingBottom + this.tickLabelOffsetPx);
        } else {
            const labelWidth = label.width || 20;
            const labelHeight = label.height || 15;
            const lx = Math.max(5, this.paddingLeft - (this.tickLabelOffsetPx + labelWidth));
            const ly = Math.max(labelHeight / 2, Math.min(pos - labelHeight / 2, this.height - labelHeight));
            label.setPosition(lx, ly);
        }
        gridHolder.addChild(label);
    }

    toGraphPixelX(x) {
        return (x - this.xMin) * this.xSpacer;
    }
    toGraphPixelY(y) {
        return this.graphHeight - (y - this.yMin) * this.ySpacer;
    }

    createNumericLabel(text) {
        const textString = String(text);
        const fontSize = 9;
        const horizontalPadding = 6;
        const verticalPadding = 4;
        const estimatedCharWidth = fontSize * 0.58;
        const labelWidth = Math.max(20, Math.ceil(textString.length * estimatedCharWidth) + horizontalPadding * 2);
        const labelHeight = fontSize + verticalPadding * 2;
        const label = new jsvgTextBox();
        label.setWidthAndHeight(labelWidth, labelHeight);
        label.setText(textString);
        label.setFontSize(fontSize);
        label.setFontColor(this.getAllowedColor("black"));
        label.setAlignment("center");
        label.setVerticalCentering();
        return label;
    }

    getAllowedColor(inputColor) {
        if (!inputColor) return "black";
        const k = String(inputColor).trim();
        return omdColor[k.toLowerCase()] || k || "black"; //first try omdColor, then try string, then black
    }

    assignFromData(data, mappings) {
        for (const [key, type] of Object.entries(mappings)) {
            if (typeof data[key] === type) this[key] = data[key];
        }
    }

    calculateGraphDimensions() {
        let baseSize = 200;
        let dotSize = 8;

        if (this.size === "large") {
            baseSize = 300;
            dotSize = 12;
        } else if (this.size === "small") {
            baseSize = 100;
            dotSize = 6;
        }

        this.dotSize = dotSize;
        this.xSpan = this.xMax - this.xMin;
        this.ySpan = this.yMax - this.yMin;

        const unit = Math.min(baseSize / this.xSpan, baseSize / this.ySpan);

        this.graphWidth = unit * this.xSpan;
        this.graphHeight = unit * this.ySpan;

        this.width = this.graphWidth + this.paddingLeft + this.paddingRight;
        this.height = this.graphHeight + this.paddingTop + this.paddingBottom;

        this.xSpacer = unit;
        this.ySpacer = unit;
        
        this.originX = this.paddingLeft - this.xMin * this.xSpacer;
        this.originY = this.height - this.paddingBottom + this.yMin * this.ySpacer;
    }

    graphMultipleFunctions(holder) {
        this.renderedFunctionEntries = [];

        for (const functionConfig of this.graphEquations) {
            try {
                const compiledExpression = this.compileFunctionExpression(functionConfig.equation);
                const path = new jsvgPath();
                path.setStrokeColor(this.getAllowedColor(functionConfig.color || 'blue'));
                path.setStrokeWidth(typeof functionConfig.strokeWidth === 'number' && Number.isFinite(functionConfig.strokeWidth) ? functionConfig.strokeWidth : 2);
                this.graphFunctionWithDomain(path, functionConfig.domain, compiledExpression);
                holder.addChild(path);

                const entry = {
                    functionConfig,
                    compiledExpression,
                    path,
                    label: null
                };

                if (functionConfig.label) {
                    entry.label = this.addFunctionLabel(holder, functionConfig, compiledExpression);
                }

                this.renderedFunctionEntries.push(entry);
            } catch (e) {
                console.warn(`Failed to graph equation: ${functionConfig.equation}`, e);
            }
        }
    }

    _extractExpression(equationString) {
        let expression = String(equationString).trim();
        // Remove "y=" from start or "=y" from end, case insensitive, handling spaces
        // This converts "y = 3x+2" or "3x+2 = y" into "3x+2"
        expression = expression.replace(/^\s*y\s*=\s*/i, '').replace(/\s*=\s*y\s*$/i, '');
        return expression;
    }

    compileFunctionExpression(functionString) {
        return math.compile(this.normalizeFunctionExpression(this._extractExpression(functionString)));
    }

    normalizeFunctionExpression(expression) {
        const knownNames = ["x", ...this.variables.map((variable) => variable.name)]
            .filter((name) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name));

        if (knownNames.length <= 1) return expression;

        const sortedNames = [...new Set(knownNames)].sort((a, b) => b.length - a.length);
        return String(expression).replace(/[A-Za-z_][A-Za-z0-9_]*/g, (token, offset, source) => {
            if (source[offset + token.length] === "(" || sortedNames.includes(token)) {
                return token;
            }

            const parts = this.splitImplicitVariableProduct(token, sortedNames);
            return parts && parts.length > 1 ? parts.join("*") : token;
        });
    }

    splitImplicitVariableProduct(token, knownNames) {
        const memo = new Map();
        const splitFrom = (index) => {
            if (index === token.length) return [];
            if (memo.has(index)) return memo.get(index);

            for (const name of knownNames) {
                if (!token.startsWith(name, index)) continue;

                const rest = splitFrom(index + name.length);
                if (rest) {
                    const result = [name, ...rest];
                    memo.set(index, result);
                    return result;
                }
            }

            memo.set(index, null);
            return null;
        };

        return splitFrom(0);
    }

    graphFunctionWithDomain(pathObject, domain, compiledExpression) {
        pathObject.clearPoints();

    const leftLimit = (domain && typeof domain.min === 'number') ? domain.min : this.xMin;
    const rightLimit = (domain && typeof domain.max === 'number') ? domain.max : this.xMax;

        const pointCount = this.shouldShowInteractiveControls() ? 400 : 1000;
        const span = rightLimit - leftLimit;
        for (let i = 0; i <= pointCount; i++) {
            const x = leftLimit + (span * i) / pointCount;
            const y = compiledExpression.evaluate(this.getEvaluationScope({ x }));
            if (!Number.isFinite(y)) continue;
            // Keep the rendered path inside the plane range so clipped-off
            // spikes do not inflate SVG bounds/viewBox measurements.
            if (y < this.yMin || y > this.yMax) continue;
            pathObject.addPoint(this.toGraphPixelX(x), this.toGraphPixelY(y));
        }
        pathObject.updatePath();
    }

    addFunctionLabel(holder, functionConfig, compiledExpression) {
        const labelText = String(functionConfig.label);
        const fontSize = 12;
        const padding = 6;
        const estimatedWidth = Math.max(40, labelText.length * (fontSize * 0.6));
        const estimatedHeight = fontSize + padding;

        const label = new jsvgTextBox({ translateMirror: true });
        label.setWidthAndHeight(estimatedWidth, estimatedHeight);
        label.setText(labelText);
        label.setFontSize(fontSize);
        label.setFontColor(this.getAllowedColor(functionConfig.color || "black"));
        label.setAlignment("center");
        label.setVerticalCentering();
        label.setFontWeight(500);

        this.updateFunctionLabelPosition(label, functionConfig, compiledExpression);
        holder.addChild(label);
        return label;
    }

    updateFunctionLabelPosition(label, functionConfig, compiledExpression) {
        const anchorX = (typeof functionConfig.labelAtX === 'number')
            ? functionConfig.labelAtX
            : this.xMin + (this.xMax - this.xMin) * 0.1;

        let anchorY = this.yMin + (this.yMax - this.yMin) * 0.1;
        const yVal = compiledExpression.evaluate(this.getEvaluationScope({ x: anchorX }));
        anchorY = Number.isFinite(yVal)
            ? Math.max(this.yMin, Math.min(this.yMax, yVal))
            : anchorY;

        const xPx = this.toGraphPixelX(anchorX);
        const yPx = this.toGraphPixelY(anchorY);

        const positionPref = (functionConfig.labelPosition || 'below').toLowerCase();
        const offset = 10;
        let finalX = xPx;
        let finalY = yPx;
        switch (positionPref) {
            case 'above':
                finalY = yPx - offset;
                break;
            case 'below':
                finalY = yPx + offset;
                break;
            case 'left':
                finalX = xPx - offset;
                break;
            case 'right':
                finalX = xPx + offset;
                break;
            default:
                finalY = yPx + offset;
        }

        const minX = this.paddingLeft + 8;
        const maxX = this.paddingLeft + this.graphWidth - 8;
        const minY = this.paddingTop + 8;
        const maxY = this.paddingTop + this.graphHeight - 8;
        finalX = Math.max(minX, Math.min(maxX, finalX));
        finalY = Math.max(minY, Math.min(maxY, finalY));

        label.setPosition(finalX, finalY);
    }

    drawLineSegments(holder) {
        for (const segment of this.lineSegments) {
            const x1 = this.toGraphPixelX(segment.point1[0]);
            const y1 = this.toGraphPixelY(segment.point1[1]);
            const x2 = this.toGraphPixelX(segment.point2[0]);
            const y2 = this.toGraphPixelY(segment.point2[1]);

            const line = new jsvgLine();
            line.setEndpoints(x1, y1, x2, y2);
            line.setStrokeColor(this.getAllowedColor(segment.color || "blue"));
            line.setStrokeWidth(segment.strokeWidth || 2);
            holder.addChild(line);
        }
    }

    plotDots(holder) {
        for (const dot of this.dotValues) {
            const pX = this.toGraphPixelX(dot[0]);
            const pY = this.toGraphPixelY(dot[1]);

            const ellipse = new jsvgEllipse();
            ellipse.setWidthAndHeight(this.dotSize, this.dotSize);
            ellipse.setPosition(pX, pY);
            ellipse.setFillColor(this.getAllowedColor(dot.length >= 3 ? dot[2] : "black"));
            holder.addChild(ellipse);
        }
    }

    addShapes(holder) {
        holder.setPosition(
            -this.xMin * this.xSpacer,
            this.graphHeight + this.yMin * this.ySpacer
        );

        const typeToCtor = {
            rightTriangle: omdRightTriangle,
            isoscelesTriangle: omdIsoscelesTriangle,
            rectangle: omdRectangle,
            ellipse: omdEllipse,
            circle: omdCircle,
            angle: omdAngle,
            regularPolygon: omdRegularPolygon
        };

        for (const shapeData of this.shapeSet) {
            const Ctor = typeToCtor[shapeData.omdType];
            if (!Ctor) {
                continue;
            }
            shapeData.unitScale = this.xSpacer;
            const shape = new Ctor();
            shape.loadFromJSON(shapeData);
            if (shape.shapePath) {
                shape.shapePath.setFillColor("none");
            }
            holder.addChild(shape);
        }
    }

    shouldShowInteractiveControls() {
        return this.interactive === true && this.variables.length > 0;
    }

    getInteractiveControlHeight() {
        return 18 + this.variables.length * 38;
    }

    normalizeInteractiveVariables(variables) {
        if (!Array.isArray(variables)) return [];

        return variables
            .map((variable, index) => this.normalizeInteractiveVariable(variable, index))
            .filter(Boolean);
    }

    normalizeInteractiveVariable(variable, index) {
        const source = (typeof variable === "string")
            ? { name: variable }
            : (variable && typeof variable === "object" ? variable : null);

        if (!source) return null;

        const name = String(
            source.name ??
            source.variable ??
            source.id ??
            ""
        ).trim();

        if (!name) return null;

        let min = Number.isFinite(source.min) ? source.min : -10;
        let max = Number.isFinite(source.max) ? source.max : 10;
        if (max < min) {
            const tmp = min;
            min = max;
            max = tmp;
        }
        if (max === min) {
            max = min + 1;
        }

        const step = (Number.isFinite(source.step) && source.step > 0) ? source.step : 0.1;
        const fallbackValue = (min <= 0 && max >= 0) ? 0 : min;
        const initialValue = this.clampInteractiveValue(
            Number.isFinite(source.value) ? source.value : fallbackValue,
            min,
            max
        );

        return {
            name,
            label: String(source.label ?? name),
            min,
            max,
            step,
            value: initialValue,
            color: source.color ?? null,
            graphIndex: Number.isInteger(source.graphIndex)
                ? source.graphIndex
                : (Number.isInteger(source.equationIndex) ? source.equationIndex : null),
            order: index
        };
    }

    clampInteractiveValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    snapInteractiveValue(value, variable) {
        const step = variable.step || 0.1;
        const snapped = variable.min + Math.round((value - variable.min) / step) * step;
        const decimals = this.getStepPrecision(step);
        const rounded = Number(snapped.toFixed(decimals));
        return this.clampInteractiveValue(rounded, variable.min, variable.max);
    }

    getStepPrecision(step) {
        const stepText = String(step);
        if (!stepText.includes(".")) return 0;
        return stepText.split(".")[1].length;
    }

    getInteractiveVariableValue(variable) {
        if (!variable) return 0;
        if (Number.isFinite(variable.currentValue)) return variable.currentValue;
        if (Number.isFinite(variable.value)) return variable.value;
        return 0;
    }

    getEvaluationScope(extraScope = {}) {
        const scope = { ...extraScope };
        for (const variable of this.variables) {
            scope[variable.name] = this.getInteractiveVariableValue(variable);
        }
        return scope;
    }

    createInteractiveControls(parentSvg) {
        const controlsGroup = this.createSvgElement("g", {
            "data-omd-interactive-controls": "true"
        });

        const graphBottom = this.paddingTop + this.graphHeight;
        const startY = graphBottom + this.basePaddingBottom + 8;
        const labelX = this.paddingLeft;
        const valueX = this.width - this.paddingRight;
        const trackStart = this.paddingLeft + 36;
        const trackEnd = this.width - this.paddingRight - 56;
        const trackWidth = Math.max(40, trackEnd - trackStart);

        this.sliderControlRows = this.variables.map((variable, index) => {
            const color = this.resolveInteractiveVariableColor(variable);
            const rowY = startY + index * 38;
            const rowGroup = this.createSvgElement("g", {
                transform: `translate(0, ${rowY})`,
                "data-omd-variable": variable.name
            });

            const label = this.createSvgElement("text", {
                x: labelX,
                y: 4,
                fill: color,
                "font-size": 13,
                "font-weight": 700,
                "dominant-baseline": "middle"
            });
            label.textContent = variable.label;

            const track = this.createSvgElement("line", {
                x1: trackStart,
                y1: 0,
                x2: trackStart + trackWidth,
                y2: 0,
                stroke: "#d1d5db",
                "stroke-width": 6,
                "stroke-linecap": "round"
            });

            const activeTrack = this.createSvgElement("line", {
                x1: trackStart,
                y1: 0,
                x2: trackStart,
                y2: 0,
                stroke: color,
                "stroke-width": 6,
                "stroke-linecap": "round"
            });

            const thumb = this.createSvgElement("circle", {
                cx: trackStart,
                cy: 0,
                r: 8,
                fill: color,
                stroke: "#ffffff",
                "stroke-width": 2
            });

            const valueText = this.createSvgElement("text", {
                x: valueX,
                y: 4,
                fill: color,
                "font-size": 12,
                "font-weight": 600,
                "dominant-baseline": "middle",
                "text-anchor": "end"
            });

            const hitArea = this.createSvgElement("rect", {
                x: trackStart - 10,
                y: -14,
                width: trackWidth + 20,
                height: 28,
                fill: "transparent",
                "pointer-events": "all",
                rx: 14
            });
            hitArea.style.cursor = "pointer";

            rowGroup.appendChild(label);
            rowGroup.appendChild(track);
            rowGroup.appendChild(activeTrack);
            rowGroup.appendChild(thumb);
            rowGroup.appendChild(valueText);
            rowGroup.appendChild(hitArea);
            controlsGroup.appendChild(rowGroup);

            const row = {
                variable,
                color,
                label,
                track,
                activeTrack,
                thumb,
                valueText,
                hitArea,
                trackStart,
                trackEnd: trackStart + trackWidth
            };

            this.attachSliderInteraction(row);
            this.updateSliderRow(row);
            return row;
        });

        parentSvg.appendChild(controlsGroup);
    }

    attachSliderInteraction(row) {
        const updateFromPointer = (event) => {
            const localX = this.clientToLocalSvgX(event.clientX);
            const ratio = (localX - row.trackStart) / (row.trackEnd - row.trackStart);
            const unclampedValue = row.variable.min + ratio * (row.variable.max - row.variable.min);
            const nextValue = this.snapInteractiveValue(unclampedValue, row.variable);
            row.variable.currentValue = nextValue;
            row.variable.value = nextValue;
            this.refreshInteractiveElements();
        };

        row.hitArea.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();

            updateFromPointer(event);
            row.hitArea.setPointerCapture?.(event.pointerId);

            const handleMove = (moveEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                updateFromPointer(moveEvent);
            };

            const stop = (endEvent) => {
                endEvent?.preventDefault?.();
                endEvent?.stopPropagation?.();
                row.hitArea.removeEventListener("pointermove", handleMove);
                row.hitArea.removeEventListener("pointerup", stop);
                row.hitArea.removeEventListener("pointercancel", stop);
                try {
                    row.hitArea.releasePointerCapture?.(event.pointerId);
                } catch {}
            };

            row.hitArea.addEventListener("pointermove", handleMove);
            row.hitArea.addEventListener("pointerup", stop);
            row.hitArea.addEventListener("pointercancel", stop);
        });
    }

    refreshInteractiveElements() {
        for (const entry of this.renderedFunctionEntries) {
            try {
                this.graphFunctionWithDomain(entry.path, entry.functionConfig.domain, entry.compiledExpression);
                if (entry.label) {
                    this.updateFunctionLabelPosition(entry.label, entry.functionConfig, entry.compiledExpression);
                }
            } catch (error) {
                console.warn(`Failed to refresh equation: ${entry.functionConfig?.equation}`, error);
            }
        }

        for (const row of this.sliderControlRows) {
            this.updateSliderRow(row);
        }
    }

    updateSliderRow(row) {
        const currentValue = this.getInteractiveVariableValue(row.variable);
        const ratio = (currentValue - row.variable.min) / (row.variable.max - row.variable.min);
        const clampedRatio = Math.max(0, Math.min(1, ratio));
        const thumbX = row.trackStart + (row.trackEnd - row.trackStart) * clampedRatio;

        row.activeTrack.setAttribute("x2", String(thumbX));
        row.thumb.setAttribute("cx", String(thumbX));
        row.valueText.textContent = this.formatInteractiveValue(currentValue, row.variable.step);
    }

    formatInteractiveValue(value, step) {
        const decimals = Math.min(4, Math.max(0, this.getStepPrecision(step)));
        const rounded = Number(value.toFixed(decimals));
        return `${rounded}`;
    }

    resolveInteractiveVariableColor(variable) {
        if (variable.color) {
            return this.getAllowedColor(variable.color);
        }

        const graphIndex = variable.graphIndex;
        if (Number.isInteger(graphIndex) && this.graphEquations[graphIndex]?.color) {
            return this.getAllowedColor(this.graphEquations[graphIndex].color);
        }

        const matchedEquation = this.graphEquations.find((graphConfig) =>
            this.equationContainsVariable(graphConfig?.equation, variable.name)
        );

        if (matchedEquation?.color) {
            return this.getAllowedColor(matchedEquation.color);
        }

        return this.getAllowedColor("#2563eb");
    }

    equationContainsVariable(equation, variableName) {
        if (!equation || !variableName) return false;
        const expression = this.normalizeFunctionExpression(this._extractExpression(equation));
        const escapedName = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const variableRegex = new RegExp(`(^|[^A-Za-z0-9_])${escapedName}([^A-Za-z0-9_]|$)`);
        return variableRegex.test(expression);
    }

    createSvgElement(tagName, attributes = {}) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        for (const [key, value] of Object.entries(attributes)) {
            if (value !== undefined && value !== null) {
                element.setAttribute(key, String(value));
            }
        }
        return element;
    }

    clientToLocalSvgX(clientX) {
        const rect = this.svgObject.getBoundingClientRect();
        const viewBox = (this.svgObject.getAttribute("viewBox") || "0 0 0 0")
            .split(/\s+/)
            .map(Number);
        const [viewBoxX = 0, , viewBoxWidth = 0] = viewBox;
        if (!rect.width || !viewBoxWidth) return 0;

        return viewBoxX + ((clientX - rect.left) / rect.width) * viewBoxWidth;
    }

    // ===== Interactive point plotting (student input) =====

    /**
     * Map a viewport (client) coordinate to this plane's internal SVG user
     * units using the live screen CTM. Mirrors the approach used by
     * omdNumberLine so plotting stays accurate under any CSS scaling.
     */
    clientToLocalPoint(clientX, clientY) {
        if (!this.svgObject || typeof this.svgObject.createSVGPoint !== "function") {
            return { x: clientX, y: clientY };
        }
        const point = this.svgObject.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        const matrix = this.svgObject.getScreenCTM();
        if (!matrix) return { x: clientX, y: clientY };
        return point.matrixTransform(matrix.inverse());
    }

    /** Convert internal SVG user units → graph data coordinates {x, y}. */
    localPointToData(localX, localY) {
        const graphPixelX = localX - this.paddingLeft;
        const graphPixelY = localY - this.paddingTop;
        const dataX = this.xMin + graphPixelX / this.xSpacer;
        const dataY = this.yMin + (this.graphHeight - graphPixelY) / this.ySpacer;
        return { x: dataX, y: dataY };
    }

    snapPlotValue(value, min, max) {
        const step = this.plotSnap || 1;
        const snapped = Math.round(value / step) * step;
        const decimals = this.getStepPrecision(step);
        const rounded = Number(snapped.toFixed(decimals));
        return Math.max(min, Math.min(max, rounded));
    }

    /** Text width for the hover pill — canvas-accurate in a browser. */
    measurePlotLabel(text, fontSize) {
        if (typeof document === "undefined") return String(text).length * fontSize * 0.58;
        if (!this._plotMeasureContext) {
            this._plotMeasureContext = document.createElement("canvas").getContext("2d");
        }
        const context = this._plotMeasureContext;
        if (!context) return String(text).length * fontSize * 0.58;
        context.font = `600 ${fontSize}px ${OMD_MATH_FONT_FAMILY}`;
        return context.measureText(String(text)).width;
    }

    createPlotLayer(parentSvg) {
        const layer = this.createSvgElement("g", { "data-omd-plot-layer": "true" });
        const accent = this.getAllowedColor(this.plotPointColor);
        const removeColor = "#DC2626";
        const r = Math.max(5, this.dotSize / 1.4);

        const left = this.paddingLeft;
        const top = this.paddingTop;
        const right = left + this.graphWidth;
        const bottom = top + this.graphHeight;

        // Transparent hit area covering the plotting region. Everything else in
        // the layer sets pointer-events:none so a click anywhere — including
        // directly on a plotted dot — falls through to this single handler,
        // which snaps to the grid and toggles.
        const hitArea = this.createSvgElement("rect", {
            x: left, y: top, width: this.graphWidth, height: this.graphHeight,
            fill: "transparent",
            "pointer-events": "all",
        });
        hitArea.style.cursor = "crosshair";
        layer.appendChild(hitArea);

        // --- Hover guides: dashed rules from the snapped point out to both
        // axes, so a student can read the coordinates off the scale instead of
        // eyeballing the dot's position. ---
        const guideStyle = {
            stroke: accent,
            "stroke-width": 1.5,
            "stroke-dasharray": "4 4",
            "stroke-opacity": 0.55,
            "pointer-events": "none",
            visibility: "hidden",
        };
        const guideX = this.createSvgElement("line", guideStyle);
        const guideY = this.createSvgElement("line", guideStyle);
        layer.appendChild(guideX);
        layer.appendChild(guideY);

        // Existing student points: soft halo, white ring, solid core.
        for (let i = 0; i < this.plottedPoints.length; i++) {
            const [x, y] = this.plottedPoints[i];
            const cx = left + this.toGraphPixelX(x);
            const cy = top + this.toGraphPixelY(y);

            layer.appendChild(this.createSvgElement("circle", {
                cx, cy, r: r + 5,
                fill: accent,
                "fill-opacity": 0.14,
                "pointer-events": "none",
            }));
            layer.appendChild(this.createSvgElement("circle", {
                cx, cy, r,
                fill: accent,
                stroke: "#ffffff",
                "stroke-width": 2.5,
                "pointer-events": "none",
                "data-omd-plot-point": i,
            }));
        }

        // --- Hover affordance: a dashed ghost where the click will land, or a
        // red ring over a point that a click would remove. ---
        const ghost = this.createSvgElement("circle", {
            r,
            fill: accent,
            "fill-opacity": 0.18,
            stroke: accent,
            "stroke-width": 2,
            "stroke-dasharray": "3 3",
            "pointer-events": "none",
            visibility: "hidden",
        });
        const ring = this.createSvgElement("circle", {
            r: r + 6,
            fill: "none",
            stroke: removeColor,
            "stroke-width": 2,
            "pointer-events": "none",
            visibility: "hidden",
        });

        const labelFont = 12;
        const labelHeight = 22;
        const pill = this.createSvgElement("rect", {
            rx: 6, ry: 6, height: labelHeight,
            fill: accent,
            "pointer-events": "none",
            visibility: "hidden",
        });
        const label = this.createSvgElement("text", {
            "font-family": OMD_MATH_FONT_FAMILY,
            "font-size": labelFont,
            "font-weight": 600,
            "text-anchor": "middle",
            "dominant-baseline": "central",
            "pointer-events": "none",
            fill: "#ffffff",
            visibility: "hidden",
        });

        layer.appendChild(ring);
        layer.appendChild(ghost);
        layer.appendChild(pill);
        layer.appendChild(label);

        const setVisible = (visible) => {
            const value = visible ? "visible" : "hidden";
            for (const node of [guideX, guideY, pill, label]) node.setAttribute("visibility", value);
        };

        const updateHover = (event) => {
            const local = this.clientToLocalPoint(event.clientX, event.clientY);
            const data = this.localPointToData(local.x, local.y);
            const px = this.snapPlotValue(data.x, this.xMin, this.xMax);
            const py = this.snapPlotValue(data.y, this.yMin, this.yMax);
            const cx = left + this.toGraphPixelX(px);
            const cy = top + this.toGraphPixelY(py);
            const existing = this.plottedPoints.some((p) => p[0] === px && p[1] === py);
            const color = existing ? removeColor : accent;

            // Guides run to the axes when they are in view, otherwise to the edge.
            const axisX = left + this.toGraphPixelX(Math.min(Math.max(0, this.xMin), this.xMax));
            const axisY = top + this.toGraphPixelY(Math.min(Math.max(0, this.yMin), this.yMax));
            guideX.setAttribute("x1", cx);
            guideX.setAttribute("y1", cy);
            guideX.setAttribute("x2", cx);
            guideX.setAttribute("y2", Math.min(bottom, Math.max(top, axisY)));
            guideY.setAttribute("x1", cx);
            guideY.setAttribute("y1", cy);
            guideY.setAttribute("x2", Math.min(right, Math.max(left, axisX)));
            guideY.setAttribute("y2", cy);
            guideX.setAttribute("stroke", color);
            guideY.setAttribute("stroke", color);

            ghost.setAttribute("cx", cx);
            ghost.setAttribute("cy", cy);
            ghost.setAttribute("visibility", existing ? "hidden" : "visible");

            ring.setAttribute("cx", cx);
            ring.setAttribute("cy", cy);
            ring.setAttribute("visibility", existing ? "visible" : "hidden");

            const text = `(${px}, ${py})`;
            const pillWidth = this.measurePlotLabel(text, labelFont) + 16;

            // Sit above the point, or below it when the pill would clip the top.
            const above = cy - r - 9 - labelHeight >= top - 4;
            const pillY = above ? cy - r - 9 - labelHeight : cy + r + 9;
            const pillX = Math.min(right - pillWidth, Math.max(left, cx - pillWidth / 2));

            pill.setAttribute("x", pillX);
            pill.setAttribute("y", pillY);
            pill.setAttribute("width", pillWidth);
            pill.setAttribute("fill", color);

            label.textContent = text;
            label.setAttribute("x", pillX + pillWidth / 2);
            label.setAttribute("y", pillY + labelHeight / 2);

            setVisible(true);
        };

        const hideHover = () => {
            setVisible(false);
            ghost.setAttribute("visibility", "hidden");
            ring.setAttribute("visibility", "hidden");
        };

        hitArea.addEventListener("pointermove", updateHover);
        hitArea.addEventListener("pointerenter", updateHover);
        hitArea.addEventListener("pointerleave", hideHover);

        hitArea.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            const local = this.clientToLocalPoint(event.clientX, event.clientY);
            const data = this.localPointToData(local.x, local.y);
            const px = this.snapPlotValue(data.x, this.xMin, this.xMax);
            const py = this.snapPlotValue(data.y, this.yMin, this.yMax);
            this.togglePlotPoint(px, py);
        });

        parentSvg.appendChild(layer);
        this._plotLayer = layer;
    }

    /** Add a point, or remove it if one already exists at (x, y). */
    togglePlotPoint(x, y) {
        const idx = this.plottedPoints.findIndex(
            (p) => p[0] === x && p[1] === y
        );
        if (idx >= 0) {
            this.plottedPoints.splice(idx, 1);
            this.updateLayout();
            this.emitPlotChange("remove", { x, y });
            return;
        }
        if (
            Number.isFinite(this.maxPlottedPoints) &&
            this.plottedPoints.length >= this.maxPlottedPoints
        ) {
            if (this.maxPlottedPoints <= 1) {
                this.plottedPoints = [];
            } else {
                this.plottedPoints.shift(); // drop oldest to make room
            }
        }
        this.plottedPoints.push([x, y]);
        this.updateLayout();
        this.emitPlotChange("add", { x, y });
    }

    getPlottedPoints() {
        return this.plottedPoints.map((p) => [p[0], p[1]]);
    }

    setPlottedPoints(points) {
        this.plottedPoints = (Array.isArray(points) ? points : [])
            .map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : null))
            .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
        this.updateLayout();
        this.emitPlotChange("set");
    }

    clearPlottedPoints() {
        this.plottedPoints = [];
        this.updateLayout();
        this.emitPlotChange("clear");
    }

    emitPlotChange(type, detail = {}) {
        const payload = {
            type,
            points: this.getPlottedPoints(),
            ...detail,
        };
        if (typeof this.onChange === "function") {
            this.onChange(payload);
        }
        if (
            typeof CustomEvent !== "undefined" &&
            this.svgObject &&
            typeof this.svgObject.dispatchEvent === "function"
        ) {
            this.svgObject.dispatchEvent(
                new CustomEvent("omd-coordinateplane-change", {
                    bubbles: true,
                    detail: payload,
                })
            );
        }
    }

    // Background customization methods
    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.updateLayout();
    }

    setBackgroundCornerRadius(radius) {
        this.backgroundCornerRadius = radius;
        this.updateLayout();
    }

    setBackgroundOpacity(opacity) {
        this.backgroundOpacity = Math.max(0, Math.min(1, opacity));
        this.updateLayout();
    }

    setShowBackground(show) {
        this.showBackground = show;
        this.updateLayout();
    }

    setBackgroundStyle(options = {}) {
        if (options.backgroundColor !== undefined) this.backgroundColor = options.backgroundColor;
        if (options.cornerRadius !== undefined) this.backgroundCornerRadius = options.cornerRadius;
        if (options.opacity !== undefined) this.backgroundOpacity = Math.max(0, Math.min(1, options.opacity));
        if (options.show !== undefined) this.showBackground = options.show;
        this.updateLayout();
    }
}
