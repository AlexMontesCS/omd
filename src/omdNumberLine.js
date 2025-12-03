
import { omdColor } from "./omdColor.js";
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

        const leftPadding = this.title ? 80 : 20;
        const rightPadding = 20;
        const arrowSize = 10;
        const tickOverhang = 8; // How much the line extends past the end ticks
        const lineWidth = this.totalWidth;
        // Calculate usable width (space for ticks) - subtract space for arrows only
        const usableLineWidth = lineWidth - (this.showLeftArrow ? arrowSize : 0) - (this.showRightArrow ? arrowSize : 0);
        
        // Set proper dimensions and viewBox for positioning
        this.width = leftPadding + lineWidth + rightPadding;
        this.height = 70;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        // Add title if present
        if (this.title) {
            const titleText = new jsvgTextBox();
            titleText.setWidthAndHeight(70, 30);
            titleText.setFontFamily("Albert Sans");
            titleText.setFontColor("black");
            titleText.setFontSize(12);
            titleText.setAlignment("left");
            titleText.setText(this.title);
            titleText.setPosition(5, 20);
            this.addChild(titleText);
        }

        // Calculate line position and width
        // Line starts at: leftPadding + (arrow space if present), and extends past ticks by tickOverhang on each end
        const lineStartX = leftPadding + (this.showLeftArrow ? arrowSize : 0);
        const lineActualWidth = usableLineWidth; // This is the space between arrows (or edges), ticks go here with overhang

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
        if (!this.hideDefaultNumbers) {
            for (let i = this.min; i <= this.max; i += this.increment) {
                numbersToShow.add(i);
            }
        }

        // Add special numbers
        for (const num of this.specialNumbers) {
            if (num >= this.min && num <= this.max) {
                numbersToShow.add(num);
            }
        }

        // Draw ticks and labels for all numbers
        const sortedNumbers = Array.from(numbersToShow).sort((a, b) => a - b);
        // Ticks are positioned with tickOverhang on both ends
        const tickBaseX = lineStartX + tickOverhang;
        const tickSpan = usableLineWidth - 2 * tickOverhang; // Space for ticks between the overhangs
        for (const value of sortedNumbers) {
            const normalized = (value - this.min) / (this.max - this.min);
            const pX = tickBaseX + normalized * tickSpan;

            // Draw tick
            const tick = new jsvgLine();
            tick.setStrokeColor("black");
            tick.setStrokeWidth(1);
            tick.setEndpoints(pX, 20, pX, 30);
            this.addChild(tick);

            // Draw label
            const tickText = new jsvgTextBox();
            tickText.setWidthAndHeight(40, 30);
            tickText.setFontFamily("Albert Sans");
            tickText.setFontColor("black");
            tickText.setFontSize(10);
            tickText.setAlignment("center");
            const labelText = this.units ? `${value}${this.units}` : value.toString();
            tickText.setText(labelText);
            tickText.setPosition(pX - 20, 32);
            this.addChild(tickText);
        }

        // Draw dots
        for (const V of this.dotValues) {
            if (V < this.min || V > this.max) continue;
            
            const normalized = (V - this.min) / (this.max - this.min);
            const pX = tickBaseX + normalized * tickSpan;

            const dot = new jsvgEllipse();
            dot.setFillColor("black");
            dot.setStrokeWidth(0);
            dot.setWidthAndHeight(8, 8);
            dot.setPosition(pX, 25);
            this.addChild(dot);
        }
    }

}