import { omdColor } from "../omdConstants.js";
import { jsvgGroup, jsvgRect, jsvgTextBox, jsvgClipMask } from "@teachinglab/jsvg";
import { math } from "../math.js";
import { makeFractionTextLabel } from "./omdFractionTypeset.js";

export class omdTable extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdTable";

        this.equation = "";
        this.data = [];
        this.headers = ['x', 'y'];
        this.xMin = -5;
        this.xMax = 5;
        this.stepSize = 1;
        this.title = "";
        this.fontSize = 14;
        this.headerFontSize = 16;
        this.fontFamily = "Albert Sans";
        this.headerFontFamily = "Albert Sans";
        this.cellHeight = 35;
        this.headerHeight = 40;
        this.minCellWidth = 80;
        this.maxCellWidth = 300;
        this.padding = 10;

        // Background customization properties
        this.backgroundColor = omdColor.lightGray;
        this.backgroundCornerRadius = 15;
        this.backgroundOpacity = 1.0;
        this.showBackground = true;

        // Alternating row color properties
        this.alternatingRowColors = [omdColor.mediumGray, omdColor.lightGray]; // Should be an array of colors or null
        this.headerBackgroundColor = omdColor.lightGray;
        this.cellBackgroundColor = "white";
        
        // Legacy properties for backward compatibility
        this.evenRowColor = "rgba(255,255,255,0.5)";
        this.oddRowColor = "transparent";
        this.alternatingRowOpacity = 1.0;

        // --- Interactive editable cells (student input) ---------------------
        // When `editable` is true, blank cells (value === null/"" or matching
        // `editableToken`) render as text inputs. An explicit `editableCells`
        // list of [row, col] pairs overrides the blank-detection heuristic.
        // Student entries are written straight back into `this.data` and flow
        // out via `onChange` + the `omd-table-change` event.
        this.editable = false;
        this.editableCells = null;        // optional [[row, col], ...]
        this.editableToken = null;        // value that marks a blank editable cell
        this.onChange = null;             // optional callback(payload)
        this._editableCellKeys = new Set(); // "row,col" of cells rendered as inputs
        this._configuredEditableCellKeys = new Set();

        this.updateLayout();
    }

    // Estimate title width in pixels based on font size and text length
    estimateTitleWidth()
    {
        if (!this.title || this.title.length === 0) return 0;
        const titleFontSize = this.headerFontSize + 2;
        const padding = 40; // side padding inside the title text box
        const minWidth = 200;
        const estimated = Math.round(this.title.length * (titleFontSize * 0.6)) + padding;
        return Math.max(minWidth, estimated);
    }

    loadFromJSON( data )
    {
        if ( typeof data.equation != "undefined" )
            this.equation = data.equation;

        if ( typeof data.data != "undefined" )
            this.data = Array.isArray(data.data)
                ? data.data.map((row) => Array.isArray(row) ? row.slice() : row)
                : data.data;

        if ( typeof data.headers != "undefined" )
            this.headers = data.headers;

        if ( typeof data.xMin != "undefined" )
            this.xMin = data.xMin;

        if ( typeof data.xMax != "undefined" )
            this.xMax = data.xMax;

        if ( typeof data.stepSize != "undefined" )
            this.stepSize = data.stepSize;

        if ( typeof data.title != "undefined" )
            this.title = data.title;

        if ( typeof data.fontSize != "undefined" )
            this.fontSize = data.fontSize;

        if ( typeof data.headerFontSize != "undefined" )
            this.headerFontSize = data.headerFontSize;

        if ( typeof data.fontFamily != "undefined" )
            this.fontFamily = data.fontFamily;

        if ( typeof data.headerFontFamily != "undefined" )
            this.headerFontFamily = data.headerFontFamily;

        if ( typeof data.cellHeight != "undefined" )
            this.cellHeight = data.cellHeight;

        if ( typeof data.headerHeight != "undefined" )
            this.headerHeight = data.headerHeight;

        if ( typeof data.minCellWidth != "undefined" )
            this.minCellWidth = data.minCellWidth;

        if ( typeof data.maxCellWidth != "undefined" )
            this.maxCellWidth = data.maxCellWidth;

        if ( typeof data.padding != "undefined" )
            this.padding = data.padding;

        // Load background customization properties
        if ( typeof data.backgroundColor != "undefined" )
            this.backgroundColor = data.backgroundColor;
        if ( typeof data.backgroundCornerRadius != "undefined" )
            this.backgroundCornerRadius = data.backgroundCornerRadius;
        if ( typeof data.backgroundOpacity != "undefined" )
            this.backgroundOpacity = data.backgroundOpacity;
        if ( typeof data.showBackground != "undefined" )
            this.showBackground = data.showBackground;

        // Load alternating row color properties
        if ( typeof data.alternatingRowColors != "undefined" )
            this.alternatingRowColors = data.alternatingRowColors;
        if ( typeof data.evenRowColor != "undefined" )
            this.evenRowColor = data.evenRowColor;
        if ( typeof data.oddRowColor != "undefined" )
            this.oddRowColor = data.oddRowColor;
        if ( typeof data.alternatingRowOpacity != "undefined" )
            this.alternatingRowOpacity = data.alternatingRowOpacity;

        // Interactive editable-cell config.
        if ( typeof data.editable != "undefined" )
            this.editable = data.editable === true || data.editable === "true";
        if ( Array.isArray(data.editableCells) )
            this.editableCells = data.editableCells;
        if ( typeof data.editableToken != "undefined" )
            this.editableToken = data.editableToken;

        // Keep editability separate from entered values. This prevents the
        // first keystroke from turning a formerly blank cell into static text.
        this._configuredEditableCellKeys = new Set();
        if (this.editable) {
            if (Array.isArray(this.editableCells)) {
                for (const cell of this.editableCells) {
                    if (Array.isArray(cell) && cell.length >= 2) {
                        this._configuredEditableCellKeys.add(`${cell[0]},${cell[1]}`);
                    }
                }
            } else {
                for (let row = 0; row < this.data.length; row++) {
                    const rowData = this.data[row];
                    if (!Array.isArray(rowData)) continue;
                    for (let col = 0; col < rowData.length; col++) {
                        const value = rowData[col];
                        if (value === null || value === "" || value === this.editableToken) {
                            this._configuredEditableCellKeys.add(`${row},${col}`);
                        }
                    }
                }
            }
        }

        if (data.editableValues && typeof data.editableValues === "object") {
            for (const [key, value] of Object.entries(data.editableValues)) {
                if (!this._configuredEditableCellKeys.has(key)) continue;
                const [row, col] = key.split(",").map(Number);
                if (Array.isArray(this.data[row])) {
                    this.data[row][col] = value === "" ? null : value;
                }
            }
        }

        this.updateLayout();
    }

    setEquation( equation )
    {
        this.equation = equation;
        this.updateLayout();
    }

    setData( data, headers )
    {
        this.data = data;
        if ( headers )
            this.headers = headers;
        this.updateLayout();
    }

    calculateOptimalCellWidth(columnIndex)
    {
        let maxLength = (this.headers[columnIndex] ?? '').toString().length;
        
        // Assume rows are arrays aligned with headers
        for (let row of this.data) {
            const cellValue = row[columnIndex];
            if (cellValue !== null && cellValue !== undefined) {
                maxLength = Math.max(maxLength, cellValue.toString().length);
            }
        }
        
        // Estimate width based on character count (approximate 8 pixels per character)
        const estimatedWidth = Math.max(maxLength * 8 + this.padding * 2, this.minCellWidth);
        return Math.min(estimatedWidth, this.maxCellWidth);
    }

    generateDataFromEquation()
    {
        if (!this.equation || this.equation.trim().length === 0) return;

        // Clear existing data and set headers
        this.data = [];
        this.headers = ['x', 'y'];

        let expression = this.equation;
        // Remove "y=" from start or "=y" from end, case insensitive, handling spaces
        expression = expression.replace(/^\s*y\s*=\s*/i, '').replace(/\s*=\s*y\s*$/i, '');

        try {
            // Use math.js if available (preferred)
            if (math.compile) {
                const compiled = math.compile(expression);
                for (let x = this.xMin; x <= this.xMax; x += this.stepSize) {
                    try {
                        let y = compiled.evaluate({ x });
                        // Round to 2 decimal places for display
                        y = Math.round(y * 100) / 100;
                        this.data.push([x, y]);
                    } catch (e) {
                        // Skip points that fail to evaluate
                    }
                }
                return;
            }
        } catch (e) {
            console.warn("math.js evaluation failed, falling back to simple parser:", e);
        }

        // CSP-safe behavior: do not fall back to dynamic code execution.
        // Without math.js compilation support available, leave table data empty.
        console.error("Unable to evaluate equation without math.js compile support under CSP-safe mode.");
    }

    updateLayout()
    {
        
        this.removeAllChildren();
        // removeAllChildren() only clears jsvg-tracked children; editable-cell
        // inputs are raw SVG appended to a content group, so clear any strays
        // to avoid duplicates across re-layouts.
        if (this.svgObject && this.svgObject.querySelectorAll) {
            this.svgObject
                .querySelectorAll("[data-omd-cell-input]")
                .forEach((el) => el.remove());
        }
        // Recomputed below as cells are rendered.
        this._editableCellKeys = new Set();

        // If an equation is provided, generate data before measuring/layout
        if (this.equation && this.equation.length > 0) {
            this.generateDataFromEquation();
        }

        // Calculate table dimensions
        const numCols = this.headers.length;
        const numRows = this.data.length;
        let cellWidths = [];
        let totalWidth = 0;
        for (let col = 0; col < numCols; col++) {
            const width = this.calculateOptimalCellWidth(col);
            cellWidths.push(width);
            totalWidth += width;
        }
        this.width = totalWidth;
        const titleOffset = (this.title && this.title.length > 0) ? 30 : 0;
        const bodyHeight = this.headerHeight + numRows * this.cellHeight;
        const totalHeight = titleOffset + bodyHeight;
        this.height = totalHeight;

        // Compute a display width that ensures the title is not clipped,
        // without changing column widths or table background.
        const titleBoxWidth = this.estimateTitleWidth();
        const displayWidth = Math.max(this.width, titleBoxWidth);
        const contentOffsetX = Math.max(0, (displayWidth - this.width) / 2);

        // Create a clipped group for rounded corners if corner radius is specified
        let tableContentGroup;
        if (this.backgroundCornerRadius > 0) {
            // Create clip mask with rounded corners
            const clipMask = new jsvgClipMask(this.width, bodyHeight, this.backgroundCornerRadius);
            clipMask.setPosition(contentOffsetX, titleOffset);
            this.addChild(clipMask);
            
            // Table content will be added to the clip mask
            tableContentGroup = clipMask;
            
            // Create table background inside the clip mask (so it gets rounded corners)
            if (this.showBackground) {
                const tableBg = new jsvgRect();
                tableBg.setWidthAndHeight(this.width, bodyHeight);
                tableBg.setFillColor(this.backgroundColor);
                if (this.backgroundOpacity < 1.0) {
                    tableBg.setOpacity(this.backgroundOpacity);
                }
                tableBg.setStrokeWidth(0);
                tableBg.setPosition(0, 0); // Relative to clip mask
                tableContentGroup.addChild(tableBg);
            }
        } else {
            // No clipping needed, create background and use the main group
            if (this.showBackground) {
                const tableBg = new jsvgRect();
                tableBg.setWidthAndHeight(this.width, bodyHeight);
                tableBg.setFillColor(this.backgroundColor);
                if (this.backgroundOpacity < 1.0) {
                    tableBg.setOpacity(this.backgroundOpacity);
                }
                tableBg.setStrokeWidth(0);
                tableBg.setPosition(contentOffsetX, titleOffset);
                this.addChild(tableBg);
            }
            tableContentGroup = this;
        }

        // Remove the separate footer rectangle since the main background now covers everything

        // Generate data from equation if provided; otherwise assume valid data/headers
        if (this.equation && this.equation.length > 0) {
            this.generateDataFromEquation();
        }

        let currentY = 0;
        // Add title if provided
        if (this.title && this.title.length > 0) {
            var titleText = new jsvgTextBox({ translateMirror: true });
            // Use an expanded text box width (only for title) to avoid clipping
            titleText.setWidthAndHeight(titleBoxWidth, 25);
            titleText.setText(this.title);
            titleText.setFontFamily(this.headerFontFamily);
            titleText.setFontColor("black");
            titleText.setFontSize(this.headerFontSize + 2);
            titleText.setAlignment("center");
            titleText.setVerticalCentering();
            // Center the title within the display width (table is centered within display)
            const titleX = Math.max(0, (displayWidth - titleBoxWidth) / 2);
            titleText.setPosition(titleX, currentY);
            titleText.setFontWeight(600);
            this.addChild(titleText);
            currentY += 30;
        }

        // Create header row
        let currentX = 0;
        const headerY = 0; // Relative to the clipped content group
        
        // First create a full-width header background if using alternating colors
        if (this.alternatingRowColors && Array.isArray(this.alternatingRowColors) && this.alternatingRowColors.length > 0) {
            const headerBg = new jsvgRect();
            headerBg.setWidthAndHeight(this.width, this.headerHeight);
            headerBg.setFillColor(this.alternatingRowColors[0]); // Headers use first color
            headerBg.setCornerRadius(0);
            headerBg.setStrokeWidth(0);
            headerBg.setPosition(0, headerY);
            tableContentGroup.addChild(headerBg);
        }
        
        for (let col = 0; col < numCols; col++) {
            const cellWidth = cellWidths[col];
            
            // Only create individual header background if NOT using alternating colors
            if (!this.alternatingRowColors || !Array.isArray(this.alternatingRowColors) || this.alternatingRowColors.length === 0) {
                var headerRect = new jsvgRect();
                headerRect.setWidthAndHeight(cellWidth, this.headerHeight);
                headerRect.setFillColor(this.headerBackgroundColor || omdColor.lightGray);
                headerRect.setCornerRadius(0);
                headerRect.setStrokeWidth(0);
                headerRect.setPosition(currentX, headerY);
                tableContentGroup.addChild(headerRect);
            }
            
            // Only a missing header gets a placeholder; "" is a deliberately blank corner.
            const headerText = this.createHeaderTextBox(
                cellWidth,
                this.headerHeight,
                this.headers[col] ?? `Col ${col + 1}`
            );
            headerText.setPosition(currentX, headerY);
            tableContentGroup.addChild(headerText);
            currentX += cellWidth;
        }
        currentY += this.headerHeight;

        // Create data rows with alternating colors
        for (let row = 0; row < numRows; row++) {
            const rowData = this.data[row];
            let currentX = 0;
            const rowY = this.headerHeight + row * this.cellHeight; // Relative to clipped content group
            
            // Create row background with alternating colors if enabled
            if (this.alternatingRowColors && Array.isArray(this.alternatingRowColors) && this.alternatingRowColors.length > 0) {
                const colorIndex = (row + 1) % this.alternatingRowColors.length; // +1 to account for header
                const rowColor = this.alternatingRowColors[colorIndex];
                
                
                var barRect = new jsvgRect();
                barRect.setWidthAndHeight(this.width, this.cellHeight);
                barRect.setFillColor(rowColor);
                if (this.backgroundOpacity < 1.0) {
                    barRect.setOpacity(this.backgroundOpacity);
                }
                // No corner radius on individual row backgrounds - clip mask handles the rounding
                barRect.setCornerRadius(0);
                barRect.setStrokeWidth(0);
                barRect.setPosition(0, rowY);
                tableContentGroup.addChild(barRect);
            }
            
            for (let col = 0; col < numCols; col++) {
                const cellWidth = cellWidths[col];
                const cellValue = rowData[col];
                if (this.isCellEditable(row, col, cellValue)) {
                    this._editableCellKeys.add(`${row},${col}`);
                    this.createCellInput(
                        tableContentGroup,
                        row,
                        col,
                        currentX,
                        rowY,
                        cellWidth,
                        this.cellHeight,
                        cellValue,
                    );
                } else {
                    const cellText = this.createBodyTextBox(cellWidth, this.cellHeight, (cellValue ?? '').toString());
                    cellText.setPosition(currentX, rowY);
                    tableContentGroup.addChild(cellText);
                }
                currentX += cellWidth;
            }
            currentY += this.cellHeight;
        }
        // Draw vertical dividing lines at each column boundary (except the far right edge)
        if (numCols > 1) {
            let x = 0;
            for (let col = 0; col < numCols - 1; col++) {
                x += cellWidths[col];
                const vline = new jsvgRect(); 
                vline.setWidthAndHeight(1, Math.max(0, bodyHeight - 1));
                vline.setFillColor("black");
                vline.setCornerRadius(0);
                vline.setOpacity(0.5);
                vline.setStrokeWidth(0);
                vline.setPosition(x, 0); // Relative to the clipped content group
                tableContentGroup.addChild(vline);
            }
        }
        // Use displayWidth for the viewBox so the title never clips,
        // but keep the table background at the original table width
        this.setWidthAndHeight(displayWidth, totalHeight);
        this.svgObject.setAttribute("viewBox", `0 0 ${displayWidth} ${totalHeight}`);
    }

    // ===== Helpers for consistent styling (match other components) =====
    createHeaderTextBox(width, height, text) {
        const stacked = this.createStackedCellText(width, height, text, this.headerFontFamily, this.headerFontSize, 600);
        if (stacked) return stacked;

        const tb = new jsvgTextBox();
        tb.setWidthAndHeight(width, height);
        tb.setText(text);
        tb.setFontFamily(this.headerFontFamily);
        tb.setFontColor("black");
        tb.setFontSize(this.headerFontSize);
        tb.setAlignment("center");
        tb.setVerticalCentering();
        tb.setFontWeight(600);
        return tb;
    }

    createBodyTextBox(width, height, text) {
        const stacked = this.createStackedCellText(width, height, text, this.fontFamily, this.fontSize, 400);
        if (stacked) return stacked;

        const tb = new jsvgTextBox({ translateMirror: true });
        tb.setWidthAndHeight(width, height);
        tb.setText(text);
        tb.setFontFamily(this.fontFamily);
        tb.setFontColor("black");
        tb.setFontSize(this.fontSize);
        tb.setAlignment("center");
        tb.setVerticalCentering();
        tb.setFontWeight(400);
        return tb;
    }

    /**
     * Cell text holding a fraction ("3/4", "1 1/2") is typeset stacked, like
     * every other OMD label. Returned as a cell-sized group so callers place it
     * by its top-left corner exactly like a text box; null for plain text.
     */
    createStackedCellText(width, height, text, fontFamily, fontSize, fontWeight) {
        const label = makeFractionTextLabel(text, { fontSize, color: "black", fontFamily, fontWeight });
        if (!label) return null;

        const cell = new jsvgGroup();
        cell.setWidthAndHeight(width, height);
        label.setPosition(width / 2, height / 2);
        cell.addChild(label);
        return cell;
    }

    addRow( rowData )
    {
        this.data.push( rowData );
        this.updateLayout();
    }

    setHeaders( headers )
    {
        this.headers = headers;
        this.updateLayout();
    }

    setFont( fontFamily, headerFontFamily )
    {
        this.fontFamily = fontFamily;
        if ( headerFontFamily )
            this.headerFontFamily = headerFontFamily;
        else
            this.headerFontFamily = fontFamily;
        this.updateLayout();
    }

    clearData()
    {
        this.data = [];
        this.updateLayout();
    }

    // ===== Interactive editable cells (student input) =====

    isCellEditable(row, col, value) {
        if (!this.editable) return false;
        return this._configuredEditableCellKeys.has(`${row},${col}`);
    }

    _createSvgElement(tagName, attributes = {}) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        for (const [key, value] of Object.entries(attributes)) {
            if (value !== undefined && value !== null) {
                element.setAttribute(key, String(value));
            }
        }
        return element;
    }

    createCellInput(group, row, col, x, y, width, height, currentValue) {
        // The field sits inset in its cell, so it reads as an answer blank
        // on the row stripe rather than a tinted block over the whole cell.
        const inset = Math.min(5, Math.max(2, Math.floor(Math.min(width, height) * 0.12)));
        const fo = this._createSvgElement("foreignObject", {
            x: x + inset,
            y: y + inset,
            width: Math.max(0, width - inset * 2),
            height: Math.max(0, height - inset * 2),
            "data-omd-cell-input": `${row},${col}`,
        });

        const input = document.createElementNS(
            "http://www.w3.org/1999/xhtml",
            "input"
        );
        input.setAttribute("type", "text");
        input.setAttribute("inputmode", "decimal");
        input.setAttribute("data-omd-cell", `${row},${col}`);
        const initial =
            currentValue === null || currentValue === this.editableToken
                ? ""
                : String(currentValue ?? "");
        input.value = initial;
        this._editableCellKeys.add(`${row},${col}`);

        const BORDER = "#CBD5E1";
        const BORDER_HOVER = "#94A3B8";
        const ACCENT = "#2563EB";
        Object.assign(input.style, {
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            margin: "0",
            border: `1.5px solid ${BORDER}`,
            borderRadius: "6px",
            background: "#FFFFFF",
            textAlign: "center",
            fontFamily: this.fontFamily,
            fontSize: `${this.fontSize}px`,
            fontWeight: "600",
            color: "#111827",
            outline: "none",
            padding: "0 4px",
            caretColor: ACCENT,
            transition: "border-color 120ms ease, box-shadow 120ms ease",
        });

        // Idle: a quiet outlined blank. Hover darkens the outline; focus turns
        // it a thicker blue — drawn inside the field, since foreignObject clips
        // anything outside it — with no fill, so the entered value stays crisp.
        input.addEventListener("mouseenter", () => {
            if (document.activeElement !== input) input.style.borderColor = BORDER_HOVER;
        });
        input.addEventListener("mouseleave", () => {
            if (document.activeElement !== input) input.style.borderColor = BORDER;
        });
        input.addEventListener("focus", () => {
            input.style.borderColor = ACCENT;
            input.style.boxShadow = `inset 0 0 0 1px ${ACCENT}`;
        });
        input.addEventListener("blur", () => {
            input.style.borderColor = BORDER;
            input.style.boxShadow = "none";
        });
        input.addEventListener("input", () => {
            const raw = input.value;
            // Keep the data grid as the single source of truth.
            if (!Array.isArray(this.data[row])) return;
            this.data[row][col] = raw === "" ? null : raw;
            this.emitTableChange("celledit", { row, col, value: raw });
        });

        fo.appendChild(input);
        // Append to the content group's svgObject so it inherits the group's
        // transform (clip-mask offset) and is torn down with it on re-layout.
        const host = group && group.svgObject ? group.svgObject : this.svgObject;
        host.appendChild(fo);
    }

    /** Full data grid including any student-entered values. */
    getCellValues() {
        return this.data.map((row) =>
            Array.isArray(row) ? row.slice() : row
        );
    }

    /** Map of "row,col" → entered value for every editable cell. */
    getEditableValues() {
        const out = {};
        for (const key of this._editableCellKeys) {
            const [r, c] = key.split(",").map(Number);
            const row = this.data[r];
            out[key] = Array.isArray(row) ? row[c] ?? null : null;
        }
        return out;
    }

    /** Update editable cells without rebuilding the table or losing focus. */
    setEditableValues(values, emitChange = true) {
        if (!values || typeof values !== "object") return;
        for (const [key, value] of Object.entries(values)) {
            if (!this._configuredEditableCellKeys.has(key)) continue;
            const [row, col] = key.split(",").map(Number);
            if (!Array.isArray(this.data[row])) continue;
            this.data[row][col] = value === "" ? null : value;
            const input = this.svgObject?.querySelector?.(
                `[data-omd-cell="${key}"]`
            );
            if (input && input.value !== String(value ?? "")) {
                input.value = String(value ?? "");
            }
        }
        if (emitChange) this.emitTableChange("set");
    }

    emitTableChange(type, detail = {}) {
        const payload = {
            type,
            data: this.getCellValues(),
            editableValues: this.getEditableValues(),
            values: this.getEditableValues(),
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
                new CustomEvent("omd-table-change", {
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

    // Alternating row colors methods
    setAlternatingRowColors(colors) {
        this.alternatingRowColors = colors;
        this.updateLayout();
    }

    setHeaderBackgroundColor(color) {
        this.headerBackgroundColor = color;
        this.updateLayout();
    }

    setCellBackgroundColor(color) {
        this.cellBackgroundColor = color;
        this.updateLayout();
    }
} 
