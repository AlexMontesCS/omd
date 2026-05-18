import { omdColor } from "../config/omdColor.js";
import { jsvgGroup } from "@teachinglab/jsvg";
import { omdNumberLine } from "./omdNumberLine.js";

export class omdDoubleNumberLine extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();  

        this.type = "omdDoubleNumberLine";

        this.topNumberLine = new omdNumberLine();
        this.bottomNumberLine = new omdNumberLine();
        
        this.spacing = 30;
        
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        // Load spacing first, before updating layout
        if ( typeof data.spacing !== "undefined" ) {
            this.spacing = data.spacing;
        }

        if ( typeof data.topNumberLine !== "undefined" ) {
            this.topNumberLine.loadFromJSON(data.topNumberLine);
        }

        if ( typeof data.bottomNumberLine !== "undefined" ) {
            this.bottomNumberLine.loadFromJSON(data.bottomNumberLine);
        }

        // Don't call updateLayout here - let it be called separately
        // This prevents double-calling and ensures spacing is used
        this.updateLayout();
    }

    updateLayout()
    {
        this.removeAllChildren();

        // Calculate the maximum left padding needed to align the start of the lines
        const rightPadding = 20;
        const topLeftPadding = this.topNumberLine.width - this.topNumberLine.totalWidth - rightPadding;
        const bottomLeftPadding = this.bottomNumberLine.width - this.bottomNumberLine.totalWidth - rightPadding;
        const maxLeftPadding = Math.max(topLeftPadding, bottomLeftPadding);

        // Position top number line
        const topXOffset = maxLeftPadding - topLeftPadding;
        this.topNumberLine.setPosition(topXOffset, 0);
        this.addChild(this.topNumberLine);

        // Position bottom number line - spacing controls the gap
        // If spacing = 0, they overlap. If spacing = 10, there's a 10px gap between them
        const bottomXOffset = maxLeftPadding - bottomLeftPadding;
        this.bottomNumberLine.setPosition(bottomXOffset, this.spacing);
        this.addChild(this.bottomNumberLine);

        // Set overall dimensions
        const maxWidth = Math.max(
            this.topNumberLine.width + topXOffset,
            this.bottomNumberLine.width + bottomXOffset
        );
        this.width = maxWidth;
        this.height = 70 + this.spacing; // Top line (70px) + spacing
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }

}
