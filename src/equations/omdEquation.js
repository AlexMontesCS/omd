import { jsvgLayoutGroup } from '@teachinglab/jsvg';
import { omdMetaExpression } from './omdMetaExpression.js';
import { omdEquationNode } from './omdEquationNode.js';

export class omdEquation extends omdMetaExpression {
    constructor() {
        super();
        this.type = 'omdEquation';
        this.inset = 5;
        this.equationNode = null;

        this.equationStack = new jsvgLayoutGroup();
        this.equationStack.setPosition(this.inset, this.inset);
        this.addChild(this.equationStack);
    }

    loadFromJSON(data) {
        const equationStr = typeof data === 'string' ? data : (data?.equation ?? '');
        if (!equationStr.trim()) return;

        const node = omdEquationNode.fromString(equationStr);
        if (node.hideBackgroundByDefault) node.hideBackgroundByDefault();
        if (node.computeDimensions) node.computeDimensions();
        if (node.updateLayout) node.updateLayout();

        if (typeof this.equationStack.removeAllChildren === 'function') {
            this.equationStack.removeAllChildren();
        } else {
            this.equationStack.childList = [];
        }
        this.equationStack.addChild(node);
        this.equationStack.setSpacer(0);

        this.equationNode = node;
        this.updateLayout();
        this.hideChildBackgrounds();
        if ( data?.backgroundColor ) this.setBackgroundColor(data.backgroundColor);
    }

    updateLayout() {
        const node = this.equationNode;
        if (!node) return;

        if (node.computeDimensions) node.computeDimensions();
        if (node.updateLayout) node.updateLayout();

        this.equationStack.doHorizontalLayout();
        this.equationStack.setPosition(this.inset, this.inset);

        const W = node.width || this.equationStack.width;
        const H = node.height || this.equationStack.height;

        this.backRect.setWidthAndHeight(W + this.inset * 2, H + this.inset * 2);
        this.setWidthAndHeight(this.backRect.width, this.backRect.height);
        this.width = this.backRect.width;
        this.height = this.backRect.height;
        this.svgObject.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }
}
