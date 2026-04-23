import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgRect, jsvgTextBox, jsvgClipMask } from "@teachinglab/jsvg";
import { math } from "../omd/utils/math.js";

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
            this.data = data.data;

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
        if ( typeof data.alternatingRowColors != "undefined" ) {
            this.alternatingRowColors = data.alternatingRowColors;
            console.log('LoadFromJSON - Setting alternatingRowColors to:', this.alternatingRowColors);
        }
        if ( typeof data.evenRowColor != "undefined" )
            this.evenRowColor = data.evenRowColor;
        if ( typeof data.oddRowColor != "undefined" )
            this.oddRowColor = data.oddRowColor;
        if ( typeof data.alternatingRowOpacity != "undefined" )
            this.alternatingRowOpacity = data.alternatingRowOpacity;

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
        console.log('updateLayout called - alternatingRowColors:', this.alternatingRowColors);
        console.log('alternatingRowColors type:', typeof this.alternatingRowColors);
        console.log('alternatingRowColors isArray:', Array.isArray(this.alternatingRowColors));
        
        this.removeAllChildren();

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
            console.log('Creating header background with color:', this.alternatingRowColors[0]);
            const headerBg = new jsvgRect();
            headerBg.setWidthAndHeight(this.width, this.headerHeight);
            headerBg.setFillColor(this.alternatingRowColors[0]); // Headers use first color
            headerBg.setCornerRadius(0);
            headerBg.setStrokeWidth(0);
            headerBg.setPosition(0, headerY);
            tableContentGroup.addChild(headerBg);
        } else {
            console.log('NOT creating header background - alternatingRowColors:', this.alternatingRowColors);
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
            
            const headerText = this.createHeaderTextBox(
                cellWidth,
                this.headerHeight,
                this.headers[col] || `Col ${col + 1}`
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
                
                console.log(`Creating row ${row} background with color:`, rowColor, 'at position:', 0, rowY);
                
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
            } else {
                console.log(`Row ${row}: No alternating colors - alternatingRowColors:`, this.alternatingRowColors);
            }
            
            for (let col = 0; col < numCols; col++) {
                const cellWidth = cellWidths[col];
                const cellText = this.createBodyTextBox(cellWidth, this.cellHeight, "");
                const cellValue = rowData[col];
                cellText.setText((cellValue ?? '').toString());
                cellText.setPosition(currentX, rowY);
                tableContentGroup.addChild(cellText);
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
        console.log('setAlternatingRowColors called with:', colors);
        this.alternatingRowColors = colors;
        console.log('alternatingRowColors set to:', this.alternatingRowColors);
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
