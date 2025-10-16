
import { omdColor } from "./omdColor.js";
import { omdMetaExpression } from "./omdMetaExpression.js"
import { jsvgTextBox } from "@teachinglab/jsvg";
export class omdString extends omdMetaExpression
{
    constructor( V = 'string' )
    {
        // initialization
        super();

        this.type = "omdString";

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

    setName( newName )
    {
        this.name = newName;

        var W = 15 + this.name.length*10;
        this.backRect.setWidthAndHeight( W, 30 );
        this.numText.setWidthAndHeight( W, 30 );
        this.numText.setText ( this.name );

        this.setWidthAndHeight( this.backRect.width, this.backRect.height );
    }

    loadFromJSON(data) {
        if (typeof data === 'string') {
            this.setName(data);
            return;
        }
        if (data && typeof data.name === 'string') {
            this.setName(data.name);
            return;
        }
    }
}