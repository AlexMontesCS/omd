
import { omdColor } from "./omdColor.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { jsvgTextBox } from "@teachinglab/jsvg";

export class omdVariable extends omdMetaExpression
{
    constructor( V = 'A' )
    {
        // initialization
        super();

        this.type = "omdVariable";

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

        this.setName( V );
    }

    loadFromJSON( data )
    {
        if ( typeof data.name != "undefined" )
            this.name = data.name;

        this.updateLayout();
    }

    setName( newName )
    {
        this.name = newName;
        this.updateLayout();
    }

    updateLayout()
    {
        var W = 15 + this.name.length*10;
        this.backRect.setWidthAndHeight( W, 30 );
        this.numText.setWidthAndHeight( W, 30 );
        this.numText.setText ( this.name );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );
    }
}