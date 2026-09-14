
import { omdColor } from "../omdConstants.js";
import { jsvgGroup, jsvgRect, jsvgLine, jsvgTextBox, jsvgEllipse, jsvgPath } from "@teachinglab/jsvg";

export class omdNumberLine extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdNumberLine";

        this.title = "";
        this.min = 0;
        this.max = 10;
        this.increment = 1;
        this.showLeftArrow = false;
        this.showRightArrow = false;
        this.units = "";
        this.hideDefaultNumbers = false;
        this.specialNumbers = [];
        this.totalWidth = 320;
        this.dotValues = []; 
        this.label = "";  

        this.interactive = false;
        this.allowAddDots = true;
        this.allowDragDots = true;
        this.allowRemoveDots = true;
        this.allowKeyboard = true;
        this.snapToIncrement = true;
        this.snapStep = null;
        this.showValueLabels = true;
        this.showHoverValue = true;
        this.maxInteractiveDots = null;
        this.interactiveDotColor = "black";
        this.selectedDotColor = omdColor.blue;
        this.rangeColor = omdColor.blue;
        this.interactiveRange = false;
        this.rangeValues = null;
        this.rangeStartClosed = true;
        this.rangeEndClosed = true;
        this.rangeStartStyle = "closed";
        this.rangeEndStyle = "closed";
        this.onChange = null;

        this._layoutMetrics = null;
        this._dotRefs = [];
        this._rangeRefs = null;
        this._hoverValueText = null;
        this._suppressLineAddUntil = 0;
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.title !== "undefined" )
            this.title = data.title;

        if ( typeof data.min !== "undefined" )
            this.min = data.min;

        if ( typeof data.max !== "undefined" )
            this.max = data.max;

        if ( typeof data.increment !== "undefined" )
            this.increment = data.increment;

        if ( typeof data.showLeftArrow !== "undefined" )
            this.showLeftArrow = data.showLeftArrow;

        if ( typeof data.showRightArrow !== "undefined" )
            this.showRightArrow = data.showRightArrow;

        if ( typeof data.units !== "undefined" )
            this.units = data.units;

        if ( typeof data.hideDefaultNumbers !== "undefined" )
            this.hideDefaultNumbers = data.hideDefaultNumbers;

        if ( typeof data.specialNumbers !== "undefined" )
            this.specialNumbers = data.specialNumbers;

        if ( typeof data.totalWidth !== "undefined" )
            this.totalWidth = data.totalWidth;

        if ( typeof data.dotValues !== "undefined" )
            this.dotValues = data.dotValues;

        if ( typeof data.label !== "undefined" )
            this.label = data.label;

        if ( typeof data.interactive !== "undefined" )
            this.interactive = data.interactive === true || data.interactive === "true";

        if ( typeof data.allowAddDots !== "undefined" )
            this.allowAddDots = this._coerceBoolean(data.allowAddDots);

        if ( typeof data.allowDragDots !== "undefined" )
            this.allowDragDots = this._coerceBoolean(data.allowDragDots);

        if ( typeof data.allowRemoveDots !== "undefined" )
            this.allowRemoveDots = this._coerceBoolean(data.allowRemoveDots);

        if ( typeof data.allowKeyboard !== "undefined" )
            this.allowKeyboard = this._coerceBoolean(data.allowKeyboard);

        if ( typeof data.snapToIncrement !== "undefined" )
            this.snapToIncrement = this._coerceBoolean(data.snapToIncrement);

        if ( typeof data.snapStep !== "undefined" )
            this.snapStep = data.snapStep;

        if ( typeof data.showValueLabels !== "undefined" )
            this.showValueLabels = this._coerceBoolean(data.showValueLabels);

        if ( typeof data.showHoverValue !== "undefined" )
            this.showHoverValue = this._coerceBoolean(data.showHoverValue);

        if ( typeof data.maxInteractiveDots !== "undefined" )
            this.maxInteractiveDots = data.maxInteractiveDots;

        if ( typeof data.interactiveDotColor !== "undefined" )
            this.interactiveDotColor = data.interactiveDotColor;

        if ( typeof data.selectedDotColor !== "undefined" )
            this.selectedDotColor = data.selectedDotColor;

        if ( typeof data.rangeColor !== "undefined" )
            this.rangeColor = data.rangeColor;

        if ( typeof data.interactiveRange !== "undefined" )
            this.interactiveRange = data.interactiveRange === true || data.interactiveRange === "true";

        if ( Array.isArray(data.rangeValues) )
            this.rangeValues = data.rangeValues.slice(0, 2);
        else if ( Array.isArray(data.selectedRange) )
            this.rangeValues = data.selectedRange.slice(0, 2);

        if ( typeof data.rangeStartClosed !== "undefined" )
            this.rangeStartStyle = this._coerceBoolean(data.rangeStartClosed) ? "closed" : "open";

        if ( typeof data.rangeEndClosed !== "undefined" )
            this.rangeEndStyle = this._coerceBoolean(data.rangeEndClosed) ? "closed" : "open";

        if ( typeof data.rangeStartStyle !== "undefined" )
            this.rangeStartStyle = this._normalizeRangeEndpointStyle(data.rangeStartStyle, this.rangeStartStyle);

        if ( typeof data.rangeEndStyle !== "undefined" )
            this.rangeEndStyle = this._normalizeRangeEndpointStyle(data.rangeEndStyle, this.rangeEndStyle);

        this.rangeStartClosed = this.rangeStartStyle === "closed";
        this.rangeEndClosed = this.rangeEndStyle === "closed";

        if ( typeof data.onChange === "function" )
            this.onChange = data.onChange;

        this.updateLayout();
    }

    setMinAndMax( min, max )
    {
        this.min = min;
        this.max = max;
        this.updateLayout();
    }

    addNumberDot( V )
    {
        this.dotValues.push( V );
        this.updateLayout();
    }

    updateLayout()
    {
        this.removeAllChildren();
        this._dotRefs = [];
        this._rangeRefs = null;
        this._hoverValueText = null;

        const titleFontSize = 12;
        const titleOuterPadding = 8;
        const titleGap = 8;
        const titleWidth = this.title ? this._estimateTitleWidth(this.title, titleFontSize) : 0;
        const leftPadding = this.title ? titleOuterPadding + titleWidth + titleGap : 20;
        const rightPadding = 20;
        const arrowSize = 10;
        const tickOverhang = 8; // How much the line extends past the end ticks
        const lineWidth = this.totalWidth;
        // Calculate usable width (space for ticks) - subtract space for arrows only
        const usableLineWidth = lineWidth - (this.showLeftArrow ? arrowSize : 0) - (this.showRightArrow ? arrowSize : 0);
        
        // Set proper dimensions and viewBox for positioning
        this.width = leftPadding + lineWidth + rightPadding;
        this.height = this.interactive ? 108 : 70;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        // Add title if present
        if (this.title) {
            const titleText = new jsvgTextBox({ translateMirror: true });
            titleText.setWidthAndHeight(titleWidth, 24);
            titleText.setFontFamily("Albert Sans");
            titleText.setFontColor("black");
            titleText.setFontSize(titleFontSize);
            titleText.setAlignment("right");
            titleText.setVerticalCentering();
            titleText.setText(this.title);
            titleText.setPosition(titleOuterPadding, 13);
            this.addChild(titleText);
        }

        // Calculate line position and width
        // Line starts at: leftPadding + (arrow space if present), and extends past ticks by tickOverhang on each end
        const lineStartX = leftPadding + (this.showLeftArrow ? arrowSize : 0);
        const lineActualWidth = usableLineWidth; // This is the space between arrows (or edges), ticks go here with overhang
        const tickBaseX = lineStartX + tickOverhang;
        const tickSpan = usableLineWidth - 2 * tickOverhang; // Space for ticks between the overhangs
        this._layoutMetrics = {
            leftPadding,
            lineStartX,
            lineActualWidth,
            tickBaseX,
            tickSpan,
            lineY: 25
        };

        this._drawInteractiveRange();

        // Draw main line (extends past the first and last ticks by tickOverhang)
        this.line = new jsvgRect();
        this.line.setWidthAndHeight(lineActualWidth, 5);
        this.line.setPosition(lineStartX, 22.5);
        this.line.setFillColor(omdColor.mediumGray);
        this.line.setCornerRadius(2.5);
        this.addChild(this.line);

        // Draw left arrow if needed
        if (this.showLeftArrow) {
            // Cover the rounded corner with a rectangle
            const coverRect = new jsvgRect();
            coverRect.setWidthAndHeight(3, 5);
            coverRect.setPosition(lineStartX, 22.5);
            coverRect.setFillColor(omdColor.mediumGray);
            this.addChild(coverRect);
            
            const leftArrow = new jsvgPath();
            const arrowY = 25;
            const arrowX = leftPadding; // Arrow tip position
            leftArrow.addPoint(arrowX + arrowSize, arrowY - 5);
            leftArrow.addPoint(arrowX, arrowY);
            leftArrow.addPoint(arrowX + arrowSize, arrowY + 5);
            leftArrow.addPoint(arrowX + arrowSize, arrowY - 5); // Close the path
            leftArrow.updatePath();
            leftArrow.setFillColor(omdColor.mediumGray);
            leftArrow.setStrokeWidth(0);
            leftArrow.path.setAttribute("fill", omdColor.mediumGray);
            this.addChild(leftArrow);
        }

        // Draw right arrow if needed
        if (this.showRightArrow) {
            // Cover the rounded corner with a rectangle
            const coverRect = new jsvgRect();
            coverRect.setWidthAndHeight(3, 5);
            coverRect.setPosition(lineStartX + lineActualWidth - 3, 22.5);
            coverRect.setFillColor(omdColor.mediumGray);
            this.addChild(coverRect);
            
            const rightArrow = new jsvgPath();
            const arrowY = 25;
            const arrowX = leftPadding + lineWidth - arrowSize; // Arrow tip position
            rightArrow.addPoint(arrowX, arrowY - 5);
            rightArrow.addPoint(arrowX + arrowSize, arrowY);
            rightArrow.addPoint(arrowX, arrowY + 5);
            rightArrow.addPoint(arrowX, arrowY - 5); // Close the path
            rightArrow.updatePath();
            rightArrow.setFillColor(omdColor.mediumGray);
            rightArrow.setStrokeWidth(0);
            rightArrow.path.setAttribute("fill", omdColor.mediumGray);
            this.addChild(rightArrow);
        }

        // Collect all numbers that should be displayed
        const numbersToShow = new Set();
        
        // Add increment-based numbers if not hidden
        if (!this.hideDefaultNumbers && Number.isFinite(this.increment) && this.increment > 0) {
            for (let i = this.min; i <= this.max + 1e-9; i += this.increment) {
                numbersToShow.add(this._normalizeTickValue(i));
            }
        }

        // Add special numbers
        for (const item of this.specialNumbers) {
            const special = this._normalizeSpecialNumber(item);
            if (special && special.value >= this.min && special.value <= this.max) {
                numbersToShow.add(special.value);
            }
        }

        this._drawLineHitArea();

        // Draw ticks and labels for all numbers
        const sortedNumbers = Array.from(numbersToShow).sort((a, b) => a - b);
        for (const value of sortedNumbers) {
            const pX = this.valueToX(value);
            const special = this._findSpecialNumber(value);

            // Draw tick
            const tick = new jsvgLine();
            tick.setStrokeColor(special?.color || "black");
            tick.setStrokeWidth(special ? 2 : 1);
            tick.setEndpoints(pX, 20, pX, 30);
            this.addChild(tick);

            // Draw label
            const tickText = new jsvgTextBox({ translateMirror: true });
            tickText.setWidthAndHeight(40, 30);
            tickText.setFontFamily("Albert Sans");
            tickText.setFontColor(special?.color || "black");
            tickText.setFontSize(10);
            tickText.setAlignment("center");
            const labelValue = special?.label ?? this.formatValue(value);
            const labelText = this.units && !special?.label ? `${labelValue}${this.units}` : String(labelValue);
            tickText.setText(labelText);
            tickText.setPosition(pX - 20, 32);
            this.addChild(tickText);
        }

        this._drawInteractiveRangeHandles();

        // Draw dots
        for (let index = 0; index < this.dotValues.length; index++) {
            const dotData = this._normalizeDot(this.dotValues[index], index);
            if (!dotData || dotData.value < this.min || dotData.value > this.max) continue;
            
            const pX = this.valueToX(dotData.value);

            const dot = new jsvgEllipse();
            dot.setFillColor(dotData.color || (this.interactive ? this.interactiveDotColor : "black"));
            dot.setStrokeColor("white");
            dot.setStrokeWidth(this.interactive ? 1.5 : 0);
            dot.setWidthAndHeight(dotData.size || 8, dotData.size || 8);
            dot.setPosition(pX, 25);
            this.addChild(dot);

            const ref = { index, dot, dotData, valueLabel: null, hitArea: null };
            if (this.interactive && this.showValueLabels) {
                ref.valueLabel = this._createValueLabel(dotData.value, pX, dotData.color);
                this.svgObject.appendChild(ref.valueLabel);
            }

            if (this.interactive) {
                ref.hitArea = this._createSvgElement("circle", {
                    cx: pX,
                    cy: 25,
                    r: 18,
                    fill: "transparent",
                    "pointer-events": "all",
                    tabindex: dotData.locked ? null : 0,
                    role: "slider",
                    "aria-label": dotData.label || `Number line point ${index + 1}`,
                    "aria-valuemin": this.min,
                    "aria-valuemax": this.max,
                    "aria-valuenow": dotData.value
                });
                ref.hitArea.style.cursor = dotData.locked ? "default" : "grab";
                this.svgObject.appendChild(ref.hitArea);
                this._attachDotInteraction(ref);
            }

            this._dotRefs.push(ref);
        }

        if (this.label) {
            const labelText = new jsvgTextBox({ translateMirror: true });
            labelText.setWidthAndHeight(Math.max(80, this.label.length * 8), 18);
            labelText.setFontFamily("Albert Sans");
            labelText.setFontColor("#555");
            labelText.setFontSize(11);
            labelText.setAlignment("center");
            labelText.setVerticalCentering();
            labelText.setText(this.label);
            labelText.setPosition(leftPadding + lineWidth / 2 - labelText.width / 2, this.interactive ? 82 : 54);
            this.addChild(labelText);
        }
    }

    valueToX(value)
    {
        if (!this._layoutMetrics) return 0;
        const span = this.max - this.min || 1;
        const normalized = (value - this.min) / span;
        return this._layoutMetrics.tickBaseX + normalized * this._layoutMetrics.tickSpan;
    }

    xToValue(x)
    {
        if (!this._layoutMetrics) return this.min;
        const ratio = (x - this._layoutMetrics.tickBaseX) / this._layoutMetrics.tickSpan;
        return this.clampValue(this.min + ratio * (this.max - this.min));
    }

    clampValue(value)
    {
        return Math.max(this.min, Math.min(this.max, value));
    }

    snapValue(value)
    {
        if (!Number.isFinite(value)) return this.min;
        const clamped = this.clampValue(value);
        if (!this.snapToIncrement) return clamped;

        const step = Number.isFinite(this.snapStep) && this.snapStep > 0
            ? this.snapStep
            : (Number.isFinite(this.increment) && this.increment > 0 ? this.increment : 1);
        const snapped = this.min + Math.round((clamped - this.min) / step) * step;
        const decimals = this._getStepPrecision(step);
        return this.clampValue(Number(snapped.toFixed(decimals)));
    }

    formatValue(value)
    {
        const step = Number.isFinite(this.snapStep) && this.snapStep > 0
            ? this.snapStep
            : (Number.isFinite(this.increment) && this.increment > 0 ? this.increment : 1);
        const decimals = Math.min(4, this._getStepPrecision(step));
        const rounded = Number(Number(value).toFixed(decimals));
        return `${rounded}`;
    }

    setDotValue(index, value)
    {
        if (index < 0 || index >= this.dotValues.length) return;
        const nextValue = this.snapValue(value);
        const current = this.dotValues[index];
        if (current && typeof current === "object") {
            current.value = nextValue;
        } else {
            this.dotValues[index] = nextValue;
        }
        this._refreshInteractiveElements();
        this._emitChange("dotchange", { dotIndex: index, value: nextValue });
    }

    removeDot(index)
    {
        if (!this.allowRemoveDots || index < 0 || index >= this.dotValues.length) return;
        this.dotValues.splice(index, 1);
        this.updateLayout();
        this._emitChange("dotremove", { dotIndex: index });
    }

    addInteractiveDot(value)
    {
        if (!this.interactive || !this.allowAddDots) return;
        if (Number.isFinite(this.maxInteractiveDots) && this.dotValues.length >= this.maxInteractiveDots) return;

        const nextValue = this.snapValue(value);
        this.dotValues.push(nextValue);
        this.updateLayout();
        this._emitChange("dotadd", { dotIndex: this.dotValues.length - 1, value: nextValue });
    }

    setRangeValue(handle, value)
    {
        if (!this.rangeValues) return;
        if (!Number.isFinite(value)) return;
        const index = handle === "end" ? 1 : 0;
        const nextValue = this.snapValue(value);
        const arrowBound = handle === "end" ? this.max : this.min;
        if (this._getRangeEndpointStyle(handle) === "arrow" && nextValue !== arrowBound) {
            this._setRangeEndpointStyle(handle, "closed", false);
        }
        this.rangeValues[index] = nextValue;
        if (this.rangeValues[0] > this.rangeValues[1]) {
            this.rangeValues.reverse();
        }
        this._refreshInteractiveElements();
        this._emitChange("rangechange", { rangeValues: this.rangeValues.slice(0, 2) });
    }

    setInteractiveRange(rangeValues = [this.min, this.max], options = {})
    {
        if (!Array.isArray(rangeValues) || rangeValues.length < 2) return;
        const start = Number(rangeValues[0]);
        const end = Number(rangeValues[1]);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return;

        this.interactiveRange = true;
        this.rangeValues = [this.snapValue(start), this.snapValue(end)].sort((a, b) => a - b);
        if (options.startStyle || options.rangeStartStyle) {
            this.rangeStartStyle = this._normalizeRangeEndpointStyle(options.startStyle || options.rangeStartStyle, this.rangeStartStyle);
        }
        if (options.endStyle || options.rangeEndStyle) {
            this.rangeEndStyle = this._normalizeRangeEndpointStyle(options.endStyle || options.rangeEndStyle, this.rangeEndStyle);
        }
        this._syncRangeClosedBooleans();
        this.updateLayout();
        this._emitChange("rangeadd", { rangeValues: this.rangeValues.slice(0, 2) });
    }

    clearInteractiveRange()
    {
        this.interactiveRange = false;
        this.rangeValues = null;
        this._rangeRefs = null;
        this.updateLayout();
        this._emitChange("rangeremove", { rangeValues: null });
    }

    cycleRangeEndpointStyle(handle)
    {
        const currentStyle = this._getRangeEndpointStyle(handle);
        const styles = ["closed", "open", "arrow"];
        const currentIndex = styles.indexOf(currentStyle);
        const nextStyle = styles[(currentIndex + 1) % styles.length];
        this.setRangeEndpointStyle(handle, nextStyle);
    }

    setRangeEndpointStyle(handle, style)
    {
        const nextStyle = this._normalizeRangeEndpointStyle(style, this._getRangeEndpointStyle(handle));
        this._setRangeEndpointStyle(handle, nextStyle, true);
        this.updateLayout();
        this._emitChange("rangestylechange", {
            handle,
            rangeStartStyle: this.rangeStartStyle,
            rangeEndStyle: this.rangeEndStyle,
            rangeValues: Array.isArray(this.rangeValues) ? this.rangeValues.slice(0, 2) : null
        });
    }

    _drawInteractiveRange()
    {
        if (!this.interactiveRange || !Array.isArray(this.rangeValues) || this.rangeValues.length < 2) return;

        const startValue = Number(this.rangeValues[0]);
        const endValue = Number(this.rangeValues[1]);
        if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) return;

        this.rangeValues = [
            this.snapValue(startValue),
            this.snapValue(endValue)
        ].sort((a, b) => a - b);
        this._applyArrowEndpointBounds();

        const startX = this.valueToX(this.rangeValues[0]);
        const endX = this.valueToX(this.rangeValues[1]);
        const y = this._getRangeY();
        const rangeLine = new jsvgLine();
        rangeLine.setEndpoints(startX, y, endX, y);
        rangeLine.setStrokeColor(this.rangeColor);
        rangeLine.setStrokeWidth(3);
        rangeLine.setOpacity(0.9);
        this.addChild(rangeLine);

        this._rangeRefs = {
            rangeLine,
            start: null,
            end: null
        };
    }

    _drawInteractiveRangeHandles()
    {
        if (!this._rangeRefs || !Array.isArray(this.rangeValues) || this.rangeValues.length < 2) return;

        const startX = this.valueToX(this.rangeValues[0]);
        const endX = this.valueToX(this.rangeValues[1]);
        const startHandle = this._createRangeHandle("start", startX);
        const endHandle = this._createRangeHandle("end", endX);
        this.svgObject.appendChild(startHandle.handle);
        this.svgObject.appendChild(startHandle.hitArea);
        this.svgObject.appendChild(endHandle.handle);
        this.svgObject.appendChild(endHandle.hitArea);

        this._rangeRefs.start = startHandle;
        this._rangeRefs.end = endHandle;

        this._attachRangeInteraction(startHandle);
        this._attachRangeInteraction(endHandle);
    }

    _createRangeHandle(handleName, x)
    {
        const y = this._getRangeY();
        const handle = this._createRangeEndpointSymbol(handleName, x, y);

        const hitArea = this._createSvgElement("circle", {
            cx: x,
            cy: y,
            r: 16,
            fill: "transparent",
            "pointer-events": "all",
            tabindex: 0,
            role: "slider",
            "aria-label": `${handleName} of selected number-line range`,
            "aria-valuemin": this.min,
            "aria-valuemax": this.max,
            "aria-valuenow": handleName === "start" ? this.rangeValues[0] : this.rangeValues[1]
        });
        hitArea.style.cursor = "ew-resize";

        return { handleName, handle, hitArea };
    }

    _createRangeEndpointSymbol(handleName, x, y)
    {
        const style = this._getRangeEndpointStyle(handleName);
        const group = this._createSvgElement("g", {
            transform: `translate(${x}, ${y})`
        });

        if (style === "arrow") {
            const points = handleName === "start"
                ? "-8,0 2,-6 2,6"
                : "8,0 -2,-6 -2,6";
            const arrow = this._createSvgElement("polygon", {
                points,
                fill: this.rangeColor,
                stroke: this.rangeColor,
                "stroke-width": 1,
                "stroke-linejoin": "round"
            });
            group.appendChild(arrow);
            return group;
        }

        const circle = this._createSvgElement("circle", {
            cx: 0,
            cy: 0,
            r: 5.5,
            fill: style === "closed" ? this.rangeColor : "#ffffff",
            stroke: this.rangeColor,
            "stroke-width": 2
        });
        group.appendChild(circle);
        return group;
    }

    _drawLineHitArea()
    {
        if (!this.interactive) return;

        const hitArea = this._createSvgElement("rect", {
            x: this._layoutMetrics.tickBaseX,
            y: 4,
            width: this._layoutMetrics.tickSpan,
            height: 48,
            fill: "transparent",
            "pointer-events": "all"
        });
        hitArea.style.cursor = this.allowAddDots ? "crosshair" : "default";
        this.svgObject.appendChild(hitArea);

        if (this.allowAddDots) {
            hitArea.addEventListener("pointerdown", (event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.detail > 1 || Date.now() < this._suppressLineAddUntil) return;
                const point = this._clientToLocalSvgPoint(event.clientX, event.clientY);
                this.addInteractiveDot(this.xToValue(point.x));
            });
        }

        if (this.showHoverValue) {
            this._hoverValueText = this._createSvgElement("text", {
                x: 0,
                y: 10,
                fill: "#334155",
                "font-size": 11,
                "font-weight": 700,
                "text-anchor": "middle",
                "pointer-events": "none",
                visibility: "hidden"
            });
            this._hoverValueText.style.fontFamily = "Albert Sans, sans-serif";
            this.svgObject.appendChild(this._hoverValueText);

            hitArea.addEventListener("pointermove", (event) => {
                const point = this._clientToLocalSvgPoint(event.clientX, event.clientY);
                const value = this.snapValue(this.xToValue(point.x));
                const x = this.valueToX(value);
                this._hoverValueText.setAttribute("x", String(x));
                this._hoverValueText.textContent = this.formatValue(value);
                this._hoverValueText.setAttribute("visibility", "visible");
            });
            hitArea.addEventListener("pointerleave", () => {
                this._hoverValueText?.setAttribute("visibility", "hidden");
            });
        }
    }

    _attachDotInteraction(ref)
    {
        if (!ref.hitArea || ref.dotData.locked) return;

        ref.hitArea.addEventListener("pointerdown", (event) => {
            if (!this.allowDragDots || event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();

            ref.hitArea.style.cursor = "grabbing";
            ref.hitArea.setPointerCapture?.(event.pointerId);

            const updateFromPointer = (moveEvent) => {
                const point = this._clientToLocalSvgPoint(moveEvent.clientX, moveEvent.clientY);
                this.setDotValue(ref.index, this.xToValue(point.x));
            };

            updateFromPointer(event);

            const handleMove = (moveEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                updateFromPointer(moveEvent);
            };

            const stop = (endEvent) => {
                endEvent?.preventDefault?.();
                endEvent?.stopPropagation?.();
                ref.hitArea.style.cursor = "grab";
                ref.hitArea.removeEventListener("pointermove", handleMove);
                ref.hitArea.removeEventListener("pointerup", stop);
                ref.hitArea.removeEventListener("pointercancel", stop);
                try {
                    ref.hitArea.releasePointerCapture?.(event.pointerId);
                } catch {}
            };

            ref.hitArea.addEventListener("pointermove", handleMove);
            ref.hitArea.addEventListener("pointerup", stop);
            ref.hitArea.addEventListener("pointercancel", stop);
        });

        ref.hitArea.addEventListener("dblclick", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.removeDot(ref.index);
        });

        ref.hitArea.addEventListener("focus", () => {
            ref.dot.setStrokeColor(this.selectedDotColor);
            ref.dot.setStrokeWidth(3);
        });

        ref.hitArea.addEventListener("blur", () => {
            ref.dot.setStrokeColor("white");
            ref.dot.setStrokeWidth(1.5);
        });

        if (this.allowKeyboard) {
            ref.hitArea.addEventListener("keydown", (event) => {
                const step = (Number.isFinite(this.snapStep) && this.snapStep > 0)
                    ? this.snapStep
                    : (Number.isFinite(this.increment) && this.increment > 0 ? this.increment : 1);
                const multiplier = event.shiftKey ? 10 : 1;
                const currentValue = this._normalizeDot(this.dotValues[ref.index], ref.index)?.value ?? this.min;

                if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    this.setDotValue(ref.index, currentValue - step * multiplier);
                } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    this.setDotValue(ref.index, currentValue + step * multiplier);
                } else if (event.key === "Home") {
                    event.preventDefault();
                    this.setDotValue(ref.index, this.min);
                } else if (event.key === "End") {
                    event.preventDefault();
                    this.setDotValue(ref.index, this.max);
                } else if (event.key === "Delete" || event.key === "Backspace") {
                    event.preventDefault();
                    this.removeDot(ref.index);
                }
            });
        }
    }

    _attachRangeInteraction(ref)
    {
        const updateFromPointer = (event) => {
            const point = this._clientToLocalSvgPoint(event.clientX, event.clientY);
            this.setRangeValue(ref.handleName, this.xToValue(point.x));
        };

        ref.hitArea.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            this._suppressLineAdd();
            ref.hitArea.setPointerCapture?.(event.pointerId);
            updateFromPointer(event);

            const handleMove = (moveEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                updateFromPointer(moveEvent);
            };

            const stop = (endEvent) => {
                endEvent?.preventDefault?.();
                endEvent?.stopPropagation?.();
                ref.hitArea.removeEventListener("pointermove", handleMove);
                ref.hitArea.removeEventListener("pointerup", stop);
                ref.hitArea.removeEventListener("pointercancel", stop);
                try {
                    ref.hitArea.releasePointerCapture?.(event.pointerId);
                } catch {}
            };

            ref.hitArea.addEventListener("pointermove", handleMove);
            ref.hitArea.addEventListener("pointerup", stop);
            ref.hitArea.addEventListener("pointercancel", stop);
        });

        ref.hitArea.addEventListener("dblclick", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this._suppressLineAdd();
            this.cycleRangeEndpointStyle(ref.handleName);
        });

        if (this.allowKeyboard) {
            ref.hitArea.addEventListener("keydown", (event) => {
                const step = (Number.isFinite(this.snapStep) && this.snapStep > 0)
                    ? this.snapStep
                    : (Number.isFinite(this.increment) && this.increment > 0 ? this.increment : 1);
                const multiplier = event.shiftKey ? 10 : 1;
                const index = ref.handleName === "end" ? 1 : 0;
                const currentValue = this.rangeValues?.[index] ?? this.min;

                if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    this.setRangeValue(ref.handleName, currentValue - step * multiplier);
                } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    this.setRangeValue(ref.handleName, currentValue + step * multiplier);
                } else if (event.key === "Home") {
                    event.preventDefault();
                    this.setRangeValue(ref.handleName, this.min);
                } else if (event.key === "End") {
                    event.preventDefault();
                    this.setRangeValue(ref.handleName, this.max);
                } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this._suppressLineAdd();
                    this.cycleRangeEndpointStyle(ref.handleName);
                }
            });
        }
    }

    _refreshInteractiveElements()
    {
        for (const ref of this._dotRefs) {
            const dotData = this._normalizeDot(this.dotValues[ref.index], ref.index);
            if (!dotData) continue;

            const x = this.valueToX(dotData.value);
            ref.dot.setPosition(x, 25);
            if (ref.valueLabel) {
                ref.valueLabel.setAttribute("x", String(x));
                ref.valueLabel.textContent = this.formatValue(dotData.value);
            }
            if (ref.hitArea) {
                ref.hitArea.setAttribute("cx", String(x));
                ref.hitArea.setAttribute("aria-valuenow", String(dotData.value));
            }
        }

        if (this._rangeRefs && Array.isArray(this.rangeValues)) {
            const startX = this.valueToX(this.rangeValues[0]);
            const endX = this.valueToX(this.rangeValues[1]);
            const y = this._getRangeY();
            this._rangeRefs.rangeLine.setEndpoints(startX, y, endX, y);
            if (this._rangeRefs.start) {
                this._updateRangeHandle(this._rangeRefs.start, startX, this.rangeValues[0]);
            }
            if (this._rangeRefs.end) {
                this._updateRangeHandle(this._rangeRefs.end, endX, this.rangeValues[1]);
            }
        }
    }

    _updateRangeHandle(ref, x, value)
    {
        ref.handle.setAttribute("transform", `translate(${x}, ${this._getRangeY()})`);
        ref.hitArea.setAttribute("cx", String(x));
        ref.hitArea.setAttribute("aria-valuenow", String(value));
    }

    _getRangeY()
    {
        return 14;
    }

    _createValueLabel(value, x, color)
    {
        const label = this._createSvgElement("text", {
            x,
            y: 8,
            fill: color || this.interactiveDotColor,
            "font-size": 11,
            "font-weight": 700,
            "text-anchor": "middle",
            "pointer-events": "none"
        });
        label.style.fontFamily = "Albert Sans, sans-serif";
        label.textContent = this.formatValue(value);
        return label;
    }

    _normalizeDot(dot, index = 0)
    {
        if (typeof dot === "number") {
            return { value: dot, index };
        }

        if (dot && typeof dot === "object") {
            const value = Number(dot.value ?? dot.x ?? dot.number);
            if (!Number.isFinite(value)) return null;
            return {
                ...dot,
                value,
                index,
                color: dot.color || dot.fillColor || null,
                size: Number.isFinite(dot.size) ? dot.size : null,
                locked: dot.locked === true
            };
        }

        return null;
    }

    _normalizeSpecialNumber(item)
    {
        if (typeof item === "number") {
            return { value: item };
        }

        if (item && typeof item === "object") {
            const value = Number(item.value ?? item.number);
            if (!Number.isFinite(value)) return null;
            return {
                value,
                label: item.label,
                color: item.color || item.fillColor || null
            };
        }

        return null;
    }

    _findSpecialNumber(value)
    {
        const epsilon = 1e-9;
        for (const item of this.specialNumbers) {
            const special = this._normalizeSpecialNumber(item);
            if (special && Math.abs(special.value - value) < epsilon) return special;
        }
        return null;
    }

    _clientToLocalSvgPoint(clientX, clientY)
    {
        const ownerSvg = this.svgObject.ownerSVGElement || this.svgObject;
        const point = ownerSvg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        const matrix = this.svgObject.getScreenCTM();
        if (!matrix) return { x: clientX, y: clientY };
        return point.matrixTransform(matrix.inverse());
    }

    _createSvgElement(tagName, attributes = {})
    {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        for (const [key, value] of Object.entries(attributes)) {
            if (value !== undefined && value !== null) {
                element.setAttribute(key, String(value));
            }
        }
        return element;
    }

    _coerceBoolean(value)
    {
        if (typeof value === "string") return value.toLowerCase() === "true";
        return value === true;
    }

    _suppressLineAdd(durationMs = 450)
    {
        this._suppressLineAddUntil = Date.now() + durationMs;
    }

    _normalizeRangeEndpointStyle(style, fallback = "closed")
    {
        const normalized = String(style || "").toLowerCase();
        return ["closed", "open", "arrow"].includes(normalized) ? normalized : fallback;
    }

    _getRangeEndpointStyle(handle)
    {
        return handle === "end" ? this.rangeEndStyle : this.rangeStartStyle;
    }

    _setRangeEndpointStyle(handle, style, snapArrowToBound)
    {
        const nextStyle = this._normalizeRangeEndpointStyle(style, this._getRangeEndpointStyle(handle));
        if (handle === "end") {
            this.rangeEndStyle = nextStyle;
        } else {
            this.rangeStartStyle = nextStyle;
        }
        this._syncRangeClosedBooleans();

        if (snapArrowToBound && Array.isArray(this.rangeValues) && nextStyle === "arrow") {
            if (handle === "end") {
                this.rangeValues[1] = this.max;
            } else {
                this.rangeValues[0] = this.min;
            }
            this.rangeValues.sort((a, b) => a - b);
        }
    }

    _syncRangeClosedBooleans()
    {
        this.rangeStartClosed = this.rangeStartStyle === "closed";
        this.rangeEndClosed = this.rangeEndStyle === "closed";
    }

    _applyArrowEndpointBounds()
    {
        if (!Array.isArray(this.rangeValues)) return;
        if (this.rangeStartStyle === "arrow") this.rangeValues[0] = this.min;
        if (this.rangeEndStyle === "arrow") this.rangeValues[1] = this.max;
    }

    _emitChange(type, detail = {})
    {
        const payload = {
            type,
            min: this.min,
            max: this.max,
            dotValues: this.dotValues.map((dot, index) => this._normalizeDot(dot, index)?.value).filter(Number.isFinite),
            rangeValues: Array.isArray(this.rangeValues) ? this.rangeValues.slice(0, 2) : null,
            rangeStartClosed: this.rangeStartClosed,
            rangeEndClosed: this.rangeEndClosed,
            rangeStartStyle: this.rangeStartStyle,
            rangeEndStyle: this.rangeEndStyle,
            ...detail
        };

        if (typeof this.onChange === "function") {
            this.onChange(payload);
        }

        if (typeof CustomEvent !== "undefined") {
            this.svgObject.dispatchEvent(new CustomEvent("omd-numberline-change", {
                bubbles: true,
                detail: payload
            }));
        }
    }

    _getStepPrecision(step)
    {
        const stepText = String(step);
        if (stepText.includes("e-")) {
            const [, exponent] = stepText.split("e-");
            return Number(exponent) || 0;
        }
        if (!stepText.includes(".")) return 0;
        return stepText.split(".")[1].length;
    }

    _normalizeTickValue(value)
    {
        return Number(Number(value).toFixed(12));
    }

    _estimateTitleWidth( title, fontSize )
    {
        const text = typeof title === "string" ? title : String(title ?? "");
        let width = 0;
        for ( const ch of text )
        {
            if ( ch === " " ) width += fontSize * 0.35;
            else if ( /[A-Z0-9]/.test(ch) ) width += fontSize * 0.68;
            else width += fontSize * 0.58;
        }

        return Math.max(12, Math.ceil(width));
    }
}
