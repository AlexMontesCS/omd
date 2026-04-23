import { omdColor } from "./omdColor.js";
import { jsvgGroup, jsvgRect } from "@teachinglab/jsvg";

export class omdMetaExpression extends jsvgGroup
{
    constructor( V = 1 )
    {
        // initialization
        super();

        this.type = "";
        this.value = V;
        
        this.defaultOpaqueBack = true;

        this.backRect = new jsvgRect();
        this.backRect.setWidthAndHeight( 30,30 );
        this.backRect.setCornerRadius( 5 );
        this.backRect.setFillColor( this.getBackgroundColor() );
        this.addChild( this.backRect );

        // Old events for selection - we will replace these with provenance highlighting
        // this.svgObject.onmouseenter = this.select.bind(this);
        // this.svgObject.onmouseleave = this.deselect.bind(this);
        
        // New events for provenance highlighting
        this.svgObject.onmouseenter = this.highlightProvenance.bind(this);
        this.svgObject.onmouseleave = this.clearProvenance.bind(this);
        this.svgObject.style.cursor = "pointer";
    }

    /* Gerard - ADDED */
    setWidthAndHeight(w, h) {
        super.setWidthAndHeight(w, h);
        this.backRect.setWidthAndHeight(w, h);
    }
    setFontSize(fontSize) {
        this.fontSize = fontSize;
        
        // Propagate font size to all children that support it
        if (this.childList) {
            this.childList.forEach(child => {
                if (child && typeof child.setFontSize === 'function') {
                    child.setFontSize(fontSize);
                }
            });
        }
    }
    getFontSize() {
        if (this.fontSize) return this.fontSize;

        if (this.parent && typeof this.parent.getFontSize === 'function') {
            return this.parent.getFontSize();
        }

        return 16; // Default fallback
    }
    getRootFontSize() {
        if (this.parent && (this.parent instanceof omdMetaExpression)) {
            return this.parent.getRootFontSize();
        }
        // No parent, so this is the root. Return its font size or default.
        return this.fontSize || 16;
    }

    getBackgroundColor() {
        return this._backgroundStyle?.backgroundColor ?? omdColor.lightGray;
    }

    _setForegroundColor(target, color) {
        if (!target || !color) return;

        if (typeof target.setFillColor === 'function') {
            target.setFillColor(color);
            return;
        }

        const svg = target.svgObject || target;
        if (!svg || typeof svg.setAttribute !== 'function') return;
        svg.setAttribute('fill', color);
        if (svg.style) svg.style.fill = color;
    }

    _readForegroundColor(target) {
        if (!target) return null;

        const svg = target.svgObject || target;
        if (!svg || typeof svg.getAttribute !== 'function') return null;

        const styleFill = svg.style?.fill;
        if (styleFill && styleFill !== 'none') return styleFill;

        const attrFill = svg.getAttribute('fill');
        if (attrFill && attrFill !== 'none') return attrFill;

        return null;
    }

    setHighlightForeground(target, highlightColor = omdColor.white) {
        if (!target) return;

        // Capture current style each time before highlight is applied so restores
        // reflect the latest caller-provided visual color.
        target._omdOriginalForegroundColor = this._readForegroundColor(target);
        this._setForegroundColor(target, highlightColor);
    }

    restoreHighlightForeground(target, fallbackColor = omdColor.text) {
        if (!target) return;

        const original = target._omdOriginalForegroundColor;
        const nextColor = original || fallbackColor;
        this._setForegroundColor(target, nextColor);
    }

    // ===== PROVENANCE HIGHLIGHTING =====

    highlightProvenance(event, color = omdColor.hiliteColor, minStepNumber = -Infinity) {
        // Prevent event from bubbling up to parent containers and causing flickering
        event.stopPropagation();

        const rootNode = this.getRootNode();
        if (!rootNode || !rootNode.nodeMap) return;

        // Clear any previous highlights from the entire sequence
        rootNode.clearProvenanceHighlights();

        // Highlight the node being hovered over
        this.highlight(color);
        
        // Use an iterative approach to traverse the provenance chain
        let nodesToProcess = [...this.provenance];
        const visited = new Set(nodesToProcess);

        while (nodesToProcess.length > 0) {
            const currentId = nodesToProcess.shift(); // Get the next node to process
            const node = rootNode.nodeMap.get(currentId);

            if (node) {
                node.highlight(color);
                if (node.provenance) {
                    node.provenance.forEach(pId => {
                        if (!visited.has(pId)) {
                            visited.add(pId);
                            nodesToProcess.push(pId);
                        }
                    });
                }
            }
        }
    }
    
    clearProvenance(event) {
        event.stopPropagation();
        const rootNode = this.getRootNode();
        if (rootNode) {
            rootNode.clearProvenanceHighlights();
        }
    }
    
    highlight(color) {
        this.backRect.setFillColor(color);
        this.backRect.setOpacity(1.0);

        // also highlight children
        this.childList.forEach((child) => {
            if (child instanceof omdMetaExpression)
                child.highlight(color);
        });
    }

    clearProvenanceHighlights() {
        // Preserve step visualizer highlights (explain highlights) if present
        if (this.isExplainHighlighted) {
            // Restore the explain highlight color and ensure full opacity
            this.backRect.setFillColor(omdColor.explainColor);
            this.backRect.setOpacity(1.0);
        } else if (this.isProvenanceHighlighted) {
            // Preserve step visualizer provenance highlights
            this.backRect.setFillColor(omdColor.explainColor);
            this.backRect.setOpacity(1.0);
        } else {
            // Reset to the default background state
            this.backRect.setFillColor(this._backgroundStyle?.backgroundColor ?? omdColor.lightGray);
            if (!this.defaultOpaqueBack) {
                this.backRect.setOpacity(0.01);
            }
        }

        // Recursively clear highlights for all children in the tree
        this.childList.forEach((child) => {
            if (child instanceof omdMetaExpression && typeof child.clearProvenanceHighlights === 'function') {
                child.clearProvenanceHighlights();
            }
        });
    }

    /**
     * Recursively applies or clears a persistent "explain" highlight.
     * This is used by the step visualizer to mark nodes that have changed between steps.
     * The highlight is preserved during hover events.
     * @param {boolean} isOn - True to apply the highlight, false to clear it.
     * @param {string} color - The color to use for the highlight.
     */
    setExplainHighlight(isOn = true, color = omdColor.explainColor) {
        this.isExplainHighlighted = isOn;

        if (isOn) {
            this.backRect.setFillColor(color);
            this.backRect.setOpacity(1.0);
        } else {
            // Reset to default state
            this.backRect.setFillColor(this.getBackgroundColor());
            if (!this.defaultOpaqueBack) {
                this.backRect.setOpacity(0.01);
            }
        }

        // Use the same traversal logic as hover highlighting to recurse
        if (this.argumentNodeList) {
            Object.values(this.argumentNodeList).forEach(child => {
                if (child && typeof child.setExplainHighlight === 'function') {
                    child.setExplainHighlight(isOn, color);
                }
            });
        }
    }

    getRootNode() {
        let current = this;
        // Traverse upwards as long as the parent is also part of the omd expression system
        while (current.parent && (current.parent instanceof omdMetaExpression)) {
            current = current.parent;
        }
        return current;
    }

    findAllNodes(nodes = []) {
        nodes.push(this);
        if (this.childList) {
            this.childList.forEach(child => {
                if (child.findAllNodes) { // Ensure child has the method
                    child.findAllNodes(nodes);
                }
            });
        }
        return nodes;
    }

    // ===== OLD SELECTION LOGIC (can be removed or kept for other purposes) =====

    select(root) {
        if (root === this) return;

        if (!(root instanceof omdMetaExpression)) root = this;

        this.backRect.setFillColor( omdColor.hiliteColor );
        this.backRect.setOpacity( 1.0 );

        this.childList.forEach((child) => {
            if (child instanceof omdMetaExpression)
                child.select(root);
        });

        if (this === root && this.parent instanceof omdMetaExpression)
            root.parent.deselect(root);
    }

    deselect(root) {
        if (!(root instanceof omdMetaExpression)) root = this;

        if (this === root && this.parent instanceof omdMetaExpression)
            root.parent.select(root);

        if (root === this && this.parent instanceof omdMetaExpression) return;
        
        this.backRect.setFillColor( this.getBackgroundColor() );
        if ( this.defaultOpaqueBack == false )
           this.backRect.setOpacity(0.01);
        
        this.childList.forEach((child) => {
            if (child !== root && child instanceof omdMetaExpression) 
                child.deselect(root);
        });

    }

    // select(root)
    // {
    //     this.backRect.setFillColor( omdColor.hiliteColor );
    //     this.backRect.setOpacity( 1.0 );
        
    //     if (!(root instanceof omdMetaExpression))
    //         root = this;

    //     this.childList.forEach((child) => {
    //         if (child instanceof omdMetaExpression)
    //             child.select(root);
    //     });
    //     if (this === root)
    //         this.unselectParents(root);
    // }

    // deselect(root)
    // {
    //     this.backRect.setFillColor( omdColor.lightGray );
    //     if ( this.defaultOpaqueBack == false )
    //         this.backRect.setOpacity(0.01);

    //     this.childList.forEach((child) => {
    //         if (child !== root && child instanceof omdMetaExpression) {
    //             child.deselect(root);
    //         }
    //     });

    //     if (this.parent instanceof omdMetaExpression)
    //         this.parent.select(this.parent);
    // }

    // unselectParents(root)
    // {
    //     if (this.parent instanceof omdMetaExpression) { 
    //         this.parent.unselectParents(root);
    //         this.parent.deselect(root);
    //     }
    // }

    hideBackgroundByDefault()
    {
        this.defaultOpaqueBack = false;
        this.backRect.setOpacity(0.01);
    }
    
    makeBackgroundLight() { this.backRect.setFillColor( this.getBackgroundColor() ) }
    makeBackgroundDark() { this.backRect.setFillColor( omdColor.mediumGray ) }

}