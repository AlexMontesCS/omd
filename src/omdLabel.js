import { omdMetaExpression } from "./omdMetaExpression.js";
import { jsvgTextBox } from "@teachinglab/jsvg";

const SIZE_MAP = {
    small:  14,
    medium: 20,
    large:  28,
};

export class omdLabel extends omdMetaExpression
{
    constructor()
    {
        super();

        this.type = "omdLabel";
        this.text = "";
        this.size = "medium"; // small | medium | large

        this.textBox = new jsvgTextBox();
        this.textBox.setFontFamily("Albert Sans");
        this.textBox.setFontColor("black");
        this.textBox.setVerticalCentering();
        this.textBox.setAlignment("left");
        this.addChild(this.textBox);

        this.backRect.setFillColor("transparent");
        this.backRect.setOpacity(0);
    }

    loadFromJSON(data)
    {
        if (typeof data === 'string') {
            this.text = data;
        } else {
            if (typeof data.text  !== "undefined") this.text  = data.text;
            if (typeof data.size  !== "undefined") this.size  = data.size;
            if (typeof data.color !== "undefined") this.textBox.setFontColor(data.color);
        }
        this.updateLayout();
    }

    updateLayout()
    {
        const fontSize = SIZE_MAP[this.size] ?? SIZE_MAP.medium;
        this.textBox.setFontSize(fontSize);

        const padding = 8;
        const approxCharW = fontSize * 0.58;
        const W = Math.max(60, Math.ceil(String(this.text).length * approxCharW) + padding * 2);
        const H = fontSize + padding * 2;

        this.textBox.setWidthAndHeight(W, H);
        this.textBox.setText(this.text ?? "");

        this.backRect.setWidthAndHeight(W, H);
        this.setWidthAndHeight(W, H);
        this.width  = W;
        this.height = H;
    }

    hideBackgroundByDefault()
    {
        this.backRect.setOpacity(0);
    }
}
