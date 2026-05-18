import {
    omdColor
} from "../omdConstants.js";
import { jsvgGroup, jsvgRect, jsvgEllipse } from "@teachinglab/jsvg";

export class omdNumberTile extends jsvgGroup {
    constructor() {
        // initialization
        super();

        this.type = "omdNumberLine";

        this.value = 1;
        this.size = 'large';
        this.dotsPerColumn = 10; // arrange dots in columns of 10 by default
        this.backgroundColor = omdColor.lightGray;
        this.dotColor = "black";
        this.updateLayout();
    }

    loadFromJSON(data) {
        if (typeof data.value != "undefined")
            this.value = data.value;

        if (typeof data.size != "undefined")
            this.size = data.size;

        if (typeof data.dotsPerColumn != "undefined")
            this.dotsPerColumn = Math.max(1, Number(data.dotsPerColumn));

        if (typeof data.backgroundColor != "undefined")
            this.backgroundColor = data.backgroundColor;

        if (typeof data.dotColor != "undefined")
            this.dotColor = data.dotColor;

        this.updateLayout();
    }

    setValue(V) {
        this.value = V;
        this.updateLayout();
    }

    setSize(size) {
        this.size = size;
        this.updateLayout();
    }

    updateLayout() {
        this.removeAllChildren();

        // Normalize inputs
        const totalValue = Math.max(0, Number(this.value) || 0);
        const perColumn = Math.max(1, Number(this.dotsPerColumn) || 1);

        // 2) Sizing based on selected tile size
        let dotSize;
        if (this.size === 'large') {
            dotSize = 15;
        } else if (this.size === 'medium') {
            dotSize = 12;
        } else {
            dotSize = 5;
        }

        const gap = Math.max(2, Math.round(dotSize * 0.6));
        const pad = Math.max(3, Math.round(dotSize * 0.8));

        // Grid geometry
        const columns = Math.ceil(totalValue / perColumn);
        const rowsTallest = Math.min(perColumn, totalValue);

        // Expose for external alignment consumers
        this._dotSize = dotSize;
        this._pad = pad;

        // Compute background rect 
        const innerW = columns > 0 ? (columns * dotSize + (columns - 1) * gap) : 0;
        const innerH = rowsTallest > 0 ? (rowsTallest * dotSize + (rowsTallest - 1) * gap) : 0;
        const W = innerW + 2 * pad;
        const H = innerH + 2 * pad;

        const backRect = new jsvgRect();
        backRect.setWidthAndHeight(W, H);
        
        // Pill for single column; rounded rectangle for multiple
        const cornerR = (columns > 1) ? Math.round(dotSize) : Math.min(W, H) / 2;
        backRect.setCornerRadius(cornerR);
        backRect.setFillColor(this.backgroundColor || omdColor.lightGray);
        this.addChild(backRect);

        this.width = backRect.width;
        this.height = backRect.height;
        // Ensure group viewBox matches content so hosts size correctly
        this.svgObject.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);

        // Render dots top-down, perColumn dots per column
        for (let i = 0; i < totalValue; i++) {
            const col = Math.floor(i / perColumn);
            const row = i % perColumn;
            const cx = pad + col * (dotSize + gap) + dotSize / 2;
            const cy = pad + row * (dotSize + gap) + dotSize / 2;
            const dot = new jsvgEllipse();
            dot.setFillColor(this.dotColor || "black");
            dot.setWidthAndHeight(dotSize, dotSize);
            dot.setPosition(cx, cy);
            this.addChild(dot);
        }
    }

    // Returns y of the top-most dot center in local coordinates
    getTopDotCenterY() {
        const pad = this._pad ?? 0;
        const dotSize = this._dotSize ?? 0;
        return pad + dotSize / 2;
    }

}