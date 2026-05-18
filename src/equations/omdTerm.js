
import { omdColor } from "../config/omdColor.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { jsvgGroup, jsvgRect, jsvgTextBox } from "@teachinglab/jsvg";
export class omdTerm extends omdMetaExpression
{
    constructor( coefficient=1, variable='', exponent=1 )
    {
        // initialization
        super();

        this.type = "omdTerm";
        this.coefficient = coefficient;
        this.variable = variable;
        this.exponent = exponent;

        this.numText = new jsvgTextBox();
        this.numText.setWidthAndHeight( 30,30 );
        this.numText.setText ( this.name );
        this.numText.setFontFamily( "Albert Sans" );
        this.numText.setFontColor( "black" );
        this.numText.setFontSize( 18 );
        this.numText.setVerticalCentering();
        this.numText.setAlignment("center");
        // this.numText.div.style.border = "1px solid black";
        this.addChild( this.numText );

        this.setValue( coefficient, variable, exponent );
        this.updateLayout();
    }

    loadFromJSON( data )
    {
        if ( typeof data.coefficient != "undefined" )
            this.coefficient = data.coefficient;

        if ( typeof data.variable != "undefined" )
            this.variable = data.variable;
    
        if ( typeof data.exponent != "undefined" )
            this.exponent = data.exponent;

        this.updateLayout();
    }

    setValue( coefficient, variable='', exponent=1 )
    {
        this.coefficient = coefficient;
        this.variable = variable;
        this.exponent = exponent;

        this.updateLayout();
    }

    updateLayout()
    {
        var T = "";
        if ( this.variable && this.variable.length != 0 )
        {
            T = this.coefficient.toString() + this.variable;
            if ( this.coefficient == 1)
            {
                T = this.variable;
            }
        }
        else
        {
            T = this.coefficient.toString();
        }

        if ( this.exponent )
        {
            if ( this.exponent == 1 )
            {
                // don't show it
            }
            else if ( this.exponent == 2 )
                T += "²";
            else if ( this.exponent == 3 )
                T += "³";
            else
                T += "<sup>" + this.exponent.toString() + "</sup>";
        }

        var W = 15 + T.length*10;
        this.backRect.setWidthAndHeight( W, 30 );
        this.numText.setWidthAndHeight( W, 30 );
        this.numText.setText ( T );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );
    }
}