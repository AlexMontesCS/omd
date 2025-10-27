
import { jsvgGroup } from "@teachinglab/jsvg";
import { omdTapeDiagram } from "./omdTapeDiagram.js";

export class omdDoubleTapeDiagram extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdDoubleTapeDiagram";

        this.topTapeDiagram = new omdTapeDiagram();
        this.bottomTapeDiagram = new omdTapeDiagram();
        
        this.spacing = 10;
        
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        // Load spacing first, before updating layout
        if ( typeof data.spacing !== "undefined" ) {
            this.spacing = data.spacing;
        }

        if ( typeof data.topTapeDiagram !== "undefined" ) {
            this.topTapeDiagram.loadFromJSON(data.topTapeDiagram);
        }

        if ( typeof data.bottomTapeDiagram !== "undefined" ) {
            this.bottomTapeDiagram.loadFromJSON(data.bottomTapeDiagram);
        }

        this.updateLayout();
    }

    updateLayout()
    {
        this.removeAllChildren();

        // Calculate the maximum left padding needed to align the start of the tapes
        const topLeftPadding = this.topTapeDiagram.title ? 80 : 20;
        const bottomLeftPadding = this.bottomTapeDiagram.title ? 80 : 20;
        const maxLeftPadding = Math.max(topLeftPadding, bottomLeftPadding);

        // Check if top tape has labels above (this affects positioning)
        let topLabelOffset = 0;
        for (const labelData of this.topTapeDiagram.labelSet) {
            if (!labelData.showBelow) {
                topLabelOffset = 30; // Space needed for top labels
                break;
            }
        }

        // Position top tape diagram (with space for top labels)
        const topXOffset = maxLeftPadding - topLeftPadding;
        this.topTapeDiagram.setPosition(topXOffset, topLabelOffset);
        this.addChild(this.topTapeDiagram);

        // Position bottom tape diagram
        // The spacing is the gap between where top tape ends and bottom tape starts
        const bottomXOffset = maxLeftPadding - bottomLeftPadding;
        const topTapeActualHeight = this.topTapeDiagram.height; // This already includes label space
        const bottomYPosition = topLabelOffset + topTapeActualHeight + this.spacing;
        this.bottomTapeDiagram.setPosition(bottomXOffset, bottomYPosition);
        this.addChild(this.bottomTapeDiagram);

        // Set overall dimensions
        const maxWidth = Math.max(
            this.topTapeDiagram.width + topXOffset,
            this.bottomTapeDiagram.width + bottomXOffset
        );
        this.width = maxWidth;
        this.height = topLabelOffset + topTapeActualHeight + this.spacing + this.bottomTapeDiagram.height;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }

}
