
import { omdColor } from "./omdColor.js";
import { jsvgLayoutGroup, jsvgGroup } from "@teachinglab/jsvg";
import { omdOperator } from "./omdOperator.js";
import { omdExpression } from "./omdExpression.js";
import { omdVariable } from "./omdVariable.js";
import { omdString } from "./omdString.js";
import { omdMetaExpression } from "./omdMetaExpression.js"

export class omdFunction extends omdMetaExpression
{
    constructor()
    {
        // initialization
        super();

        this.type = "omdPowerExpression";
        
        this.leftExpression = null;
        this.rightExpresion = null;
        this.functionName = 'f';
        this.inputVariableArray = [];
        
        this.centerEquation = false;
        this.inset = 5;

        this.equationStack = new jsvgLayoutGroup();
        this.equationStack.setSpacer(-7);
        this.addChild( this.equationStack );

        this.leftHolder = new jsvgGroup();
        this.equationStack.addChild( this.leftHolder );

        this.equalSign = new omdOperator('=');
        this.equationStack.addChild( this.equalSign );

        this.rightHolder = new jsvgGroup();
        this.equationStack.addChild( this.rightHolder );
    }

    loadFromJSON( data )
    {
        if ( typeof data.name != "undefined" )
        {
            this.functionName = data.name;
        }

        if ( typeof data.inputVariables != "undefined" )
        {
            this.inputVariableArray = data.inputVariables;
        }
            
        if ( typeof data.expression != "undefined" )
        {
            // console.log("A");
            // console.log( data.expression );
            if ( data.expression.omdType == "expression" )
                this.rightExpresion = new omdExpression();
            
            this.rightExpresion.loadFromJSON(  data.expression  );
            this.rightHolder.removeAllChildren();
            this.rightHolder.addChild( this.rightExpresion );
        }
        
        // format the f(x) part on the left
        this.leftHolder.removeAllChildren();
    var funcText = this.functionName + "(" + this.inputVariableArray[0] + ")";   // this should be refactored as a function call
    this.leftExpression = new omdExpression();
    this.leftExpression.loadFromJSON(funcText);
        this.leftHolder.addChild( this.leftExpression );
    
        this.updateLayout();
    }
    
    setNameVariableAndExpression( funcName, funcVariable, rightExp )
    {
        this.leftHolder.removeAllChildren();
        var funcText = funcName + "(" + funcVariable + ")";   // this should be refactored as a function call
        this.leftExpression = new omdExpression();
        this.leftExpression.loadFromJSON(funcText);
        this.leftHolder.addChild( this.leftExpression );

        this.rightExpresion = rightExp;
        this.rightHolder.removeAllChildren();
        this.rightHolder.addChild( rightExp );

        this.equalSign.hideBackgroundByDefault();
        this.leftExpression.hideBackgroundByDefault();
        this.rightExpresion.hideBackgroundByDefault();

        this.updateLayout();
    }

    updateLayout()
    {
        this.leftHolder.setWidthAndHeight( this.leftExpression.width, this.leftExpression.height );
        this.rightHolder.setWidthAndHeight( this.rightExpresion.width, this.rightExpresion.height );

        this.equationStack.doHorizontalLayout();
        this.equationStack.setPosition( this.inset, 0 );

        var W = this.equationStack.width;
        this.backRect.setWidthAndHeight( W + this.inset*2, 30 );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );

        if ( this.centerEquation )
        {
            var leftShift = this.leftExpression.width + this.equalSign.width*0.50;
            this.backRect.setPosition( -1.0 * leftShift + this.inset/2, 0  );
            this.equationStack.setPosition( -1.0 * leftShift + this.inset + this.inset/2, 0 );
        }
    }

}