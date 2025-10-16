
import { omdColor } from "./omdColor.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { jsvgTextBox } from "@teachinglab/jsvg";

export class omdOperator extends omdMetaExpression
{
    constructor( Oper = '+' )
    {
        // initialization
        super();

        this.type = "omdOperator";
        this.operator = Oper;

        this.numText = new jsvgTextBox();
        this.numText.setWidthAndHeight( 30,30 );
        this.numText.setText( this.operator );
        this.numText.setFontFamily( "Albert Sans" );
        this.numText.setFontColor( "black" );
        this.numText.setFontSize( 18 );
        this.numText.setVerticalCentering();
        this.numText.setAlignment("center");
        //]this.numText.div.style.border = "1px solid black";
        this.addChild( this.numText );

        this.setOperator( Oper );
    }

    loadFromJSON( data )
    {
        if ( typeof data.operator != "undefined" )
            this.setOperator( data.operator );
    }

    setOperator( Op )
    {
        if ( Op == '+' )
            this.operator = '+';

        if ( Op == '-' )
            this.operator = '−';

        if ( Op == '/' )
            this.operator = '÷';
        if ( Op == '÷' )
            this.operator = '÷';

        if ( Op == 'x' )
            this.operator = '×';
        if ( Op == '*' )
            this.operator = '×';
        if ( Op == '•' )
            this.operator = '×';
        if ( Op == '×' )
            this.operator = '×';
        if ( Op == '=' )
            this.operator = '=';

        this.updateLayout();
    }

    updateLayout()
    {
        var T = this.operator;
        var W = 12 + T.length*10;
        this.backRect.setWidthAndHeight( W, 30 );
        this.numText.setWidthAndHeight( W, 30 );
        this.numText.setText ( T );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );
    }
}