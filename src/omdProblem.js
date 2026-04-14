
import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgTextBox } from "@teachinglab/jsvg";

export class omdProblem extends jsvgGroup
{
    constructor()
    {
        // initialization
        super();
        this.type = "omdProblem";
        this.theText = "";

        this.problemText = new jsvgTextBox({ translateMirror: true });
        this.problemText.setWidthAndHeight( 250,30 );
        this.problemText.setText ( "this it the problem text" );
        this.problemText.setFontFamily( "Albert Sans" );
        this.problemText.setFontColor( "black" );
        this.problemText.setFontSize( 18 );
        this.addChild( this.problemText );
    }

    loadFromJSON( data, handleAIResponse = null )
    {
        console.log(data)
        if ( typeof data.problemText != "undefined" )
            this.theText = data.problemText;

        if ( typeof data.visualization != "undefined" )
        {
            console.log(data)
            this.visualJSON = data.visualiation;
            console.log( this.visualJSON );
            console.log('testing 1 ')

            // // Fast-path: if the caller supplied an already-rendered SVG DOM element
            // // (for example, captured from the canvas), use it directly instead of
            // // trying to regenerate the graphic. This avoids constructing a temp
            // // omd container and the related initialization issues.
            if (data.svgElement) {
                try {
                    // Ensure the problem text is set so measurement is accurate
                    this.problemText.setText(this.theText);

                    const padding = 10;
                    const SVG_NS = 'http://www.w3.org/2000/svg';

                    // utility: hidden measuring svg for getBBox when needed
                    function getMeasuringSVG() {
                        let m = document.getElementById('_omd_measuring_svg');
                        if (!m) {
                            m = document.createElementNS(SVG_NS, 'svg');
                            m.setAttribute('id', '_omd_measuring_svg');
                            m.style.position = 'absolute';
                            m.style.left = '-9999px';
                            m.style.top = '-9999px';
                            m.style.width = '1px';
                            m.style.height = '1px';
                            m.style.visibility = 'hidden';
                            document.body.appendChild(m);
                        }
                        return m;
                    }

                    const incoming = data.svgElement;
                    const cloneRoot = incoming.cloneNode(true);

                    // Attempt 1: find a clip rect inside (common pattern)
                    let crop = null; // {x,y,width,height}
                    try {
                        const rect = cloneRoot.querySelector && cloneRoot.querySelector('clipPath rect');
                        if (rect) {
                            const x = parseFloat(rect.getAttribute('x') || '0');
                            const y = parseFloat(rect.getAttribute('y') || '0');
                            const w = parseFloat(rect.getAttribute('width') || '0');
                            const h = parseFloat(rect.getAttribute('height') || '0');
                            if (w > 0 && h > 0) crop = { x, y, width: w, height: h };
                        }
                    } catch (e) { /* ignore */ }

                    // Attempt 2: viewBox on root or nested svg
                    if (!crop) {
                        try {
                            let vb = null;
                            if (cloneRoot.getAttribute) vb = cloneRoot.getAttribute('viewBox');
                            if (!vb) {
                                const nested = cloneRoot.querySelector && cloneRoot.querySelector('svg');
                                if (nested && nested.getAttribute) vb = nested.getAttribute('viewBox');
                            }
                            if (vb) {
                                const parts = vb.trim().split(/\s+/).map(Number);
                                if (parts.length === 4) crop = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
                            }
                        } catch (e) { /* ignore */ }
                    }

                    // Attempt 3: measure bounding box by attaching to hidden SVG
                    if (!crop) {
                        const meas = getMeasuringSVG();
                        const wrapper = document.createElementNS(SVG_NS, 'g');
                        wrapper.appendChild(cloneRoot);
                        meas.appendChild(wrapper);
                        try {
                            const bb = wrapper.getBBox();
                            console.debug('omdProblem: measured bbox from wrapper', bb);
                            if (bb && bb.width > 0 && bb.height > 0) crop = { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
                        } catch (e) {
                            // ignore
                        }
                        try { meas.removeChild(wrapper); } catch (_) {}
                    }


                    if (!crop) crop = { x: 0, y: 0, width: 250, height: 250 };

                    // Allow caller to request a small margin around the crop to avoid clipping
                    const cropMargin = (data && typeof data.cropMargin === 'number') ? data.cropMargin : 6;
                    // expand crop safely
                    const expandedCrop = {
                        x: Math.max(0, crop.x - cropMargin),
                        y: Math.max(0, crop.y - cropMargin),
                        width: crop.width + cropMargin * 2,
                        height: crop.height + cropMargin * 2
                    };
                    crop = expandedCrop;
                    console.debug('omdProblem: final crop chosen (expanded)', crop);

                    // Build compact svg sized to crop area
                    const compact = document.createElementNS(SVG_NS, 'svg');
                    compact.setAttribute('width', String(crop.width));
                    compact.setAttribute('height', String(crop.height));
                    compact.setAttribute('viewBox', `0 0 ${crop.width} ${crop.height}`);

                    const contentWrapper = document.createElementNS(SVG_NS, 'g');
                    // don't apply arbitrary offsets; translate content so crop.x/y maps to 0,0
                    contentWrapper.setAttribute('transform', `translate(-55, -80)`);
                    contentWrapper.appendChild(cloneRoot);
                    compact.appendChild(contentWrapper);

                    // Position compact svg under the problem text
                    let textBoxHeight = 0;
                    try {
                        if (this.problemText.height) textBoxHeight = this.problemText.height;
                        else if (this.problemText.svgObject && this.problemText.svgObject.getBBox) textBoxHeight = this.problemText.svgObject.getBBox().height;
                        else textBoxHeight = 30;
                    } catch (e) { textBoxHeight = 30; }

                    // Center horizontally inside the problem box. Determine available width
                    // Caller can provide containerInfo to indicate the rounded-rect container dimensions
                    let containerWidth = 300;
                    let containerOffsetY = null;
                    let containerInnerPadding = 8;
                    try {
                        if (data && data.containerInfo) {
                            if (typeof data.containerInfo.width === 'number') containerWidth = data.containerInfo.width;
                            if (typeof data.containerInfo.offsetY === 'number') containerOffsetY = data.containerInfo.offsetY;
                            if (typeof data.containerInfo.innerPadding === 'number') containerInnerPadding = data.containerInfo.innerPadding;
                        } else if (this.width) containerWidth = this.width;
                        else if (this.problemText && this.problemText.width) containerWidth = Math.max(300, this.problemText.width);
                    } catch (e) { containerWidth = 300; }

                    const desiredY = Math.round((containerOffsetY !== null) ? (containerOffsetY + padding) : (textBoxHeight + padding));

                    // Ensure the compact SVG never extends outside the container: clamp and scale if needed
                    const innerPadding = containerInnerPadding; // keep some breathing room inside the rounded rectangle
                    const maxAllowedWidth = Math.max(20, containerWidth - innerPadding * 2);
                    let scale = 1;
                    if (crop.width > maxAllowedWidth) scale = maxAllowedWidth / crop.width;
                    const scaledWidth = Math.round(crop.width * scale);
                    const scaledHeight = Math.round(crop.height * scale);

                    // Apply scaled pixel dimensions to compact so it renders at the clamped size
                    compact.setAttribute('width', String(scaledWidth));
                    compact.setAttribute('height', String(scaledHeight));

                    // center: (containerWidth - scaledWidth) / 2, but don't go negative
                    let desiredX = Math.max(innerPadding, Math.round((containerWidth - scaledWidth) / 2));

                    console.debug('omdProblem: containerWidth, desiredX, desiredY', { containerWidth, desiredX, desiredY, cropWidth: crop.width, cropHeight: crop.height, scaledWidth, scaledHeight, scale });

                    const outerWrapper = document.createElementNS(SVG_NS, 'g');
                    outerWrapper.appendChild(compact);
                    outerWrapper.setAttribute('transform', `translate(${desiredX}, ${desiredY})`);
                    this.svgObject.appendChild(outerWrapper);

                    // Optional visual debug overlay: outlines the compact area if requested
                    if (data && data.debugPlacement) {
                        try {
                            const debugRect = document.createElementNS(SVG_NS, 'rect');
                            debugRect.setAttribute('x', '0');
                            debugRect.setAttribute('y', '0');
                            // debug rect shows the scaled layout area
                            debugRect.setAttribute('width', String(scaledWidth));
                            debugRect.setAttribute('height', String(scaledHeight));
                            debugRect.setAttribute('fill', 'none');
                            debugRect.setAttribute('stroke', 'rgba(255,0,0,0.9)');
                            debugRect.setAttribute('stroke-width', '2');
                            debugRect.setAttribute('pointer-events', 'none');
                            outerWrapper.appendChild(debugRect);
                        } catch (e) { console.warn('omdProblem: failed to add debugPlacement rect', e); }
                    }

                    this.updateLayout();
                    return;
                } catch (e) {
                    console.warn('omdProblem: svgElement fast-path failed, falling back to regenerate:', e);
                    // fall through to regeneration attempt
                }
            }
        }

        this.updateLayout();
    }

    setName( newName )
    {
        this.name = newName;
        this.updateLayout();
    }

    updateLayout()
    {
        // Update text content and size the problem container to fit the text and any child visualization
        this.problemText.setText( this.theText );

        // Measure the text box (use properties or fall back to getBBox)
        let textBoxWidth = 400;
        let textBoxHeight = 130;
        try {
            if (this.problemText.width) textBoxWidth = this.problemText.width;
            if (this.problemText.height) textBoxHeight = this.problemText.height;
            else if (this.problemText.svgObject && this.problemText.svgObject.getBBox) {
                const bb = this.problemText.svgObject.getBBox();
                if (bb.width) textBoxWidth = bb.width;
                if (bb.height) textBoxHeight = bb.height;
            }
        } catch (e) {
            // keep defaults
        }

        // Compute extra height from any visualization child we added
        let extraHeight = 0;
        try {
            // Find a child that isn't the problemText (likely the visualization)
            for (let i = 0; i < this.children.length; i++) {
                const child = this.children[i];
                if (child !== this.problemText && child && child.svgObject && child.svgObject.getBBox) {
                    const bb = child.svgObject.getBBox();
                    extraHeight = Math.max(extraHeight, bb.height + 20); // include padding
                }
            }
        } catch (e) {
            extraHeight = 0;
        }

        const totalWidth = Math.max(300, textBoxWidth);
        const totalHeight = Math.max(200, textBoxHeight + extraHeight + 20);
        this.setWidthAndHeight( totalWidth, totalHeight );
    }
}
