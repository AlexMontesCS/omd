import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgRect, jsvgClipMask, jsvgLine, jsvgEllipse, jsvgTextBox, jsvgTextLine, jsvgPath } from "@teachinglab/jsvg";
import {
    omdRightTriangle,
    omdIsoscelesTriangle,
    omdRectangle,
    omdEllipse,
    omdCircle,
    omdRegularPolygon
} from "./omdShapes.js";

export class omdCoordinatePlane extends jsvgGroup {
    constructor() {
        super();
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

        // Load background customization properties
        this.backgroundColor = data.backgroundColor || this.backgroundColor;
        this.backgroundCornerRadius = (data.backgroundCornerRadius !== undefined) ? data.backgroundCornerRadius : this.backgroundCornerRadius;
        this.backgroundOpacity = (data.backgroundOpacity !== undefined) ? data.backgroundOpacity : this.backgroundOpacity;
        this.showBackground = (data.showBackground !== undefined) ? data.showBackground : this.showBackground;

        this.calculatePadding();
        this.updateLayout();
    }

    

    updateLayout() {
        this.removeAllChildren();
        this.calculateGraphDimensions();

        const outerWidth = this.width;
        const outerHeight = this.height;

        const clipMask = new jsvgClipMask(outerWidth, outerHeight, 15);
        this.addChild(clipMask);

        const whiteRect = new jsvgRect();
        whiteRect.setWidthAndHeight(outerWidth, outerHeight);
        
        // Apply customizable background properties
        if (this.showBackground) {
            whiteRect.setFillColor(this.backgroundColor);
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
            const xAxisLabel = new jsvgTextBox();

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
            const yAxisLabel = new jsvgTextLine();

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
        this.paddingLeft = this.yLabel ? 50 : 30;
        this.paddingBottom = this.xLabel ? 50 : 30;
        this.paddingTop = 25;
        this.paddingRight = 25;
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
            const lx = Math.max(10, Math.min(pos - 10, this.width - 30));
            label.setPosition(lx, this.height - this.paddingBottom + this.tickLabelOffsetPx);
        } else {
            const lx = Math.max(5, this.paddingLeft - (this.tickLabelOffsetPx + 20));
            const ly = Math.max(7.5, Math.min(pos - 7.5, this.height - 15));
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
        const label = new jsvgTextBox();
        label.setWidthAndHeight(20, 15);
        label.setText(String(text));
        label.setFontSize(9);
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
        for (const functionConfig of this.graphEquations) {
            const path = new jsvgPath();
            path.setStrokeColor(this.getAllowedColor(functionConfig.color));
            path.setStrokeWidth(functionConfig.strokeWidth);
            this.graphFunctionWithDomain(path, functionConfig.equation, functionConfig.domain);
            holder.addChild(path);

            if (functionConfig.label) {
                this.addFunctionLabel(holder, functionConfig);
            }
        }
    }

    graphFunctionWithDomain(pathObject, functionString, domain) {
        pathObject.clearPoints();

        let expression = functionString;
        if (expression.toLowerCase().startsWith("y=")) {
            expression = expression.substring(2).trim();
        }

        const compiledExpression = math.compile(expression);

    const leftLimit = (domain && typeof domain.min === 'number') ? domain.min : this.xMin;
    const rightLimit = (domain && typeof domain.max === 'number') ? domain.max : this.xMax;

        const step = Math.abs(rightLimit - leftLimit) / 1000;
        for (let x = leftLimit; x <= rightLimit; x += step) {
            const y = compiledExpression.evaluate({ x });
            pathObject.addPoint(this.toGraphPixelX(x), this.toGraphPixelY(y));
        }
        pathObject.updatePath();
    }

    addFunctionLabel(holder, functionConfig) {
        const labelText = String(functionConfig.label);
        const fontSize = 12;
        const padding = 6;
        const estimatedWidth = Math.max(40, labelText.length * (fontSize * 0.6));
        const estimatedHeight = fontSize + padding;

        const label = new jsvgTextBox();
        label.setWidthAndHeight(estimatedWidth, estimatedHeight);
        label.setText(labelText);
        label.setFontSize(fontSize);
        label.setFontColor(this.getAllowedColor(functionConfig.color || "black"));
        label.setAlignment("center");
        label.setVerticalCentering();
        label.setFontWeight(500);

        const anchorX = (typeof functionConfig.labelAtX === 'number')
            ? functionConfig.labelAtX
            : this.xMin + (this.xMax - this.xMin) * 0.1;

        let anchorY = this.yMin + (this.yMax - this.yMin) * 0.1;
        let equationBody = functionConfig.equation;
        if (equationBody.toLowerCase().startsWith("y=")) {
            equationBody = equationBody.substring(2).trim();
        }
        const compiled = math.compile(equationBody);
        const yVal = compiled.evaluate({ x: anchorX });
        anchorY = yVal;

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

        label.setPosition(finalX, finalY);
        holder.addChild(label);
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