
import { jsvgLayoutGroup } from "@teachinglab/jsvg";
import { omdMetaExpression } from "./omdMetaExpression.js";
import { getNodeForAST } from "./omdUtilities.js";
import { math } from "../config/math.js";

export class omdExpression extends omdMetaExpression
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdExpression";
        this.inset = 5;
        this.expressionNode = null;

        this.expressionStack = new jsvgLayoutGroup();
        this.expressionStack.setPosition( this.inset, 0 );
        this.expressionStack.setSpacer(-6);
        this.addChild( this.expressionStack );
    }

    _renderWithExpressionNode(expressionString, fontSize) {
        if (typeof math.parse !== 'function') {
            throw new Error('math.js is required to parse expression strings');
        }

        const ast = math.parse(expressionString);
        const NodeType = getNodeForAST(ast);
        const exprNode = new NodeType(ast);

        if (typeof fontSize === 'number' && exprNode.setFontSize) {
            exprNode.setFontSize(fontSize);
        }

        if (exprNode.hideBackgroundByDefault) exprNode.hideBackgroundByDefault();
        if (exprNode.computeDimensions) exprNode.computeDimensions();
        if (exprNode.updateLayout) exprNode.updateLayout();

        if (typeof this.expressionStack.removeAllChildren === 'function') {
            this.expressionStack.removeAllChildren();
        } else {
            this.expressionStack.childList = [];
        }
        this.expressionStack.addChild(exprNode);
        this.expressionStack.setSpacer(0);

        this.expressionNode = exprNode;
        this.updateLayout();
        this.hideChildBackgrounds();
    }

    loadFromJSON( data )
    {
        if ( typeof data === 'string' ) {
            this._renderWithExpressionNode(data);
        } else if ( typeof data === 'object' && data.expression ) {
            this._renderWithExpressionNode(data.expression, data.fontSize);
        }
        if ( data?.backgroundColor ) this.setBackgroundColor(data.backgroundColor);
    }

    updateLayout()
    {
        const node = this.expressionNode;
        if (!node) return;

        if (node.computeDimensions) node.computeDimensions();
        if (node.updateLayout) node.updateLayout();

        this.expressionStack.doHorizontalLayout();
        this.expressionStack.setPosition(this.inset, this.inset);

        const W = node.width || this.expressionStack.width;
        const H = node.height || this.expressionStack.height;

        this.backRect.setWidthAndHeight( W + this.inset*2, H + this.inset*2 );
        this.setWidthAndHeight( this.backRect.width, this.backRect.height );
        this.width = this.backRect.width;
        this.height = this.backRect.height;
    }
}