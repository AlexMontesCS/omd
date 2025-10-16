
import { omdColor } from "./omdColor.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { jsvgGroup, jsvgRect, jsvgTextBox } from "@teachinglab/jsvg";
export class omdNumber extends omdMetaExpression
{
    constructor( V = 1 )
    {
        // initialization
        super();

        this.type = "omdNumber";
        this.value = V;

        this.numText = new jsvgTextBox();
        this.numText.setWidthAndHeight( 30,30 );
        this.numText.setText ( this.value.toString() );
        this.numText.setFontFamily( "Albert Sans" );
        this.numText.setFontColor( "black" );
        this.numText.setFontSize( 18 );
        this.numText.setVerticalCentering();
        this.numText.setAlignment("center");
        // this.numText.div.style.border = "1px solid black";
        this.addChild( this.numText );

        this.setValue( V );
    }

    loadFromJSON( data )
    {
        if ( typeof data.value != "undefined" )
            this.value = data.value;

        this.updateLayout();
    }

    setValue( V )
    {
        this.value = V;
        this.updateLayout();   
    }

    updateLayout()
    {
        var T = this.value.toString();
        var W = 10 + T.length*10;
        this.backRect.setWidthAndHeight( W, 30 );
        this.numText.setWidthAndHeight( W, 30 );
        this.numText.setText ( this.value.toString() );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );
    }
}