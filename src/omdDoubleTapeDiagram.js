
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
        
        this.spacing = 30;
        
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

        // Calculate total numeric values for both tapes to determine unit width
        const topTotal = this.calculateTotalValue(this.topTapeDiagram);
        const bottomTotal = this.calculateTotalValue(this.bottomTapeDiagram);
        
        // Find the maximum total to determine a consistent unit width
        const maxTotal = Math.max(topTotal, bottomTotal);
        const baseWidth = 300; // Base width for the longest tape
        const unitWidth = maxTotal > 0 ? baseWidth / maxTotal : baseWidth;
        
        // Set each tape's width based on its total value
        this.topTapeDiagram.totalWidth = topTotal * unitWidth;
        this.bottomTapeDiagram.totalWidth = bottomTotal * unitWidth;
        
        // Force update of both tape diagrams with new widths
        this.topTapeDiagram.updateLayout();
        this.bottomTapeDiagram.updateLayout();

        // Calculate the maximum left padding needed to align the start of the tapes
        const rightPadding = 20;
        const topLeftPadding = this.topTapeDiagram.width - this.topTapeDiagram.totalWidth - rightPadding;
        const bottomLeftPadding = this.bottomTapeDiagram.width - this.bottomTapeDiagram.totalWidth - rightPadding;
        const maxLeftPadding = Math.max(topLeftPadding, bottomLeftPadding);

        // Position top tape diagram
        const topXOffset = maxLeftPadding - topLeftPadding;
        this.topTapeDiagram.setPosition(topXOffset, 0);
        this.addChild(this.topTapeDiagram);

        // Position bottom tape diagram
        // spacing controls the gap between the bottom of top tape and top of bottom tape
        const bottomXOffset = maxLeftPadding - bottomLeftPadding;
        const bottomYPosition = this.topTapeDiagram.height + this.spacing;
        this.bottomTapeDiagram.setPosition(bottomXOffset, bottomYPosition);
        this.addChild(this.bottomTapeDiagram);

        // Set overall dimensions
        const maxWidth = Math.max(
            this.topTapeDiagram.width + topXOffset,
            this.bottomTapeDiagram.width + bottomXOffset
        );
        this.width = maxWidth;
        this.height = this.topTapeDiagram.height + this.spacing + this.bottomTapeDiagram.height;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }

    calculateTotalValue(tapeDiagram)
    {
        let total = 0;
        
        for (const valueData of tapeDiagram.values) {
            let value = "";
            let weight = null;
            
            // Handle both old format (simple values) and new format (objects)
            if (typeof valueData === "object" && valueData !== null) {
                value = valueData.value === undefined || valueData.value === null ? "" : String(valueData.value);
                if (valueData.weight !== undefined) {
                    const explicitWeight = Number(valueData.weight);
                    if (Number.isFinite(explicitWeight) && explicitWeight > 0) {
                        weight = explicitWeight;
                    }
                }
            } else {
                value = String(valueData ?? "");
            }

            if (weight !== null) {
                total += weight;
                continue;
            }

            // Parse numeric value from string (e.g., "3", "2x", "5y")
            const match = value.match(/^([0-9.]+)?([a-zA-Z]*)$/);
            if (match) {
                const coefficient = match[1] ? parseFloat(match[1]) : (match[2] ? 1 : 1);
                total += coefficient;
            } else {
                total += 1; // Default for unparseable values
            }
        }
        
        return total;
    }

}
