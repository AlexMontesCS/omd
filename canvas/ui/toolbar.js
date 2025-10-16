import {omdColor} from '../../src/omdColor.js';
import { jsvgRect, jsvgGroup } from '@teachinglab/jsvg';
import { jsvgButton } from '@teachinglab/jsvg';

export class Toolbar {
    /**
     * @param {OMDCanvas} canvas - Canvas instance
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.buttons = new Map();
        this.activeButton = null;
        this.omdColor = omdColor; // Use omdColor for consistent styling
        
        
        
        // Create toolbar element
        this._createElement();
        
        // Create tool buttons
        this._createToolButtons();
        
        // Listen for tool changes
        this.canvas.on('toolChanged', (event) => {
            this._updateActiveButton(event.detail.name);
        });
        
        
    }
    
    /**
     * Create the toolbar SVG element
     * @private
     */
    _createElement() {
        
        
        // Create a jsvgGroup for the toolbar
        this.toolbarGroup = new jsvgGroup();
        
        
        // Create background rectangle
        this.background = new jsvgRect();
        
        
    // Initial size, will be updated after buttons are created
    this.background.setWidthAndHeight(100, 54);
    this.background.setCornerRadius(27); // Pill shape
    this.background.setFillColor(this.omdColor.mediumGray); // Modern dark, semi-transparent
        
        
        
        
        // Debug the background SVG object
        
        
        this.toolbarGroup.addChild(this.background);
        
        
        // Position the toolbar at bottom center
        this._updatePosition();``
        
    // Add to main SVG so it is rendered
    this.canvas.svg.appendChild(this.toolbarGroup.svgObject);
    }
    
    /**
     * Update toolbar position to bottom center
     * @private
     */
    _updatePosition() {
    const canvasRect = this.canvas.container.getBoundingClientRect();
    const toolbarWidth = this.background.width;
    const toolbarHeight = this.background.height;
            // Bottom center, 24px from bottom
        const x = (canvasRect.width - toolbarWidth) / 2;
        const y = canvasRect.height - toolbarHeight - 24;
        
        // Ensure toolbar stays within canvas bounds
        const clampedX = Math.max(0, Math.min(x, canvasRect.width - toolbarWidth));
        const clampedY = Math.max(0, Math.min(y, canvasRect.height - toolbarHeight));
    this.toolbarGroup.setPosition(x, y);
        
        // Debug the SVG object
        
        // Set z-index to ensure it's on top
        this.toolbarGroup.svgObject.style.zIndex = '1000';
        this.toolbarGroup.svgObject.style.pointerEvents = 'auto';
        
        // Fix the viewBox to include the toolbar position
        const bgWidth = this.background.width;
        const bgHeight = this.background.height;
        const viewBoxX = x;
        const viewBoxY = y;
        const viewBoxWidth = Math.max(500, x + bgWidth);
        const viewBoxHeight = Math.max(500, y + bgHeight);
        
        this.toolbarGroup.svgObject.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
        
        // Don't set x/y attributes - let setPosition handle it via transform
        // this.toolbarGroup.svgObject.setAttribute('x', x);
        // this.toolbarGroup.svgObject.setAttribute('y', y);
    }
    
    /**
     * Create tool buttons
     * @private
     */
    _createToolButtons() {
        const tools = this.canvas.toolManager.getAllToolMetadata();
        
        const buttonSize = 48;
        const spacing = 8;
        const padding = 6;
        let xPos = padding;
        const yPos = padding;
        tools.forEach(toolMeta => {
            const button = this._createJsvgButton(toolMeta, buttonSize);
            button.setPosition(xPos, yPos);
            this.toolbarGroup.addChild(button);
            this.buttons.set(toolMeta.name, button);
            xPos += buttonSize + spacing;
        });
        // Remove last spacing
        const totalWidth = xPos - spacing + padding;
        const totalHeight = buttonSize + 2 * padding;
        this.background.setWidthAndHeight(totalWidth, totalHeight);
        this.background.setCornerRadius(totalHeight / 2);
        // Reposition after sizing
        this._updatePosition();
        
        // Set initial active button
        const activeTool = this.canvas.toolManager.getActiveTool();
        if (activeTool) {
            this._updateActiveButton(activeTool.name);
        }
    }
    
    /**
     * Create individual tool button using jsvgButton
     * @private
     */
    _createJsvgButton(toolMeta, size = 48) {
        
        const button = new jsvgButton();
        button.setWidthAndHeight(size, size);
        button.setCornerRadius(size / 2); // Make it circular
        button.setFillColor('white');
        
        // Remove any default text from the button group (if present)
        // jsvgButton may add a <text> element by default; remove it
        button.setText(''); // Clear any default text

        // Set the icon SVG
        const iconSvg = this._getToolIconSvg(toolMeta.name);
        if (iconSvg) {
            const dataURI = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(iconSvg);
            button.addImage(dataURI, size * 0.5, size * 0.5); // Icon at 50% of button size
        }

        // Set click callback
        button.setClickCallback(() => {
            this.canvas.toolManager.setActiveTool(toolMeta.name);
        });
        
        // Store tool metadata
        button.toolMeta = toolMeta;
        return button;
    }
    
    /**
     * Get SVG icon for tool
     * @param {string} toolName - Tool name
     * @returns {string} SVG string
     * @private
     */
    _getToolIconSvg(toolName) {
        const icons = {
            'pointer': `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.63448 2.04462C1.60922 1.98633 1.60208 1.92179 1.61397 1.85938C1.62585 1.79697 1.65623 1.73958 1.70116 1.69466C1.74608 1.64973 1.80347 1.61935 1.86588 1.60747C1.92829 1.59558 1.99283 1.60272 2.05112 1.62798L12.2911 5.78798C12.3534 5.81335 12.4061 5.85768 12.4417 5.91469C12.4774 5.9717 12.4941 6.03849 12.4897 6.10557C12.4852 6.17266 12.4597 6.23663 12.4169 6.28842C12.374 6.3402 12.3159 6.37717 12.2508 6.39406L8.33144 7.40526C8.11 7.46219 7.90784 7.5774 7.74599 7.73891C7.58415 7.90042 7.46852 8.10234 7.41112 8.32366L6.40056 12.2443C6.38367 12.3094 6.3467 12.3675 6.29492 12.4104C6.24313 12.4532 6.17916 12.4787 6.11207 12.4832C6.04499 12.4876 5.9782 12.4709 5.92119 12.4352C5.86419 12.3996 5.81985 12.3469 5.79448 12.2846L1.63448 2.04462Z" stroke="black" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            'pencil': `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.3658 4.68008C13.7041 4.34179 13.8943 3.88294 13.8943 3.40447C13.8944 2.926 13.7044 2.4671 13.3661 2.12872C13.0278 1.79035 12.5689 1.60022 12.0905 1.60016C11.612 1.6001 11.1531 1.79011 10.8147 2.1284L2.27329 10.6718C2.12469 10.8199 2.0148 11.0023 1.95329 11.203L1.10785 13.9882C1.09131 14.0436 1.09006 14.1024 1.10423 14.1584C1.11841 14.2144 1.14748 14.2655 1.18836 14.3063C1.22924 14.3471 1.28041 14.3761 1.33643 14.3902C1.39246 14.4043 1.45125 14.403 1.50657 14.3863L4.29249 13.5415C4.49292 13.4806 4.67532 13.3713 4.82369 13.2234L13.3658 4.68008Z" stroke="black" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.41443 3.52039L11.9744 6.08039" stroke="black" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            'eraser': `<svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.2591 12.76H4.93909C4.77032 12.7604 4.60314 12.7274 4.44717 12.663C4.29121 12.5985 4.14953 12.5038 4.03029 12.3844L1.47413 9.825C1.23417 9.58496 1.09937 9.25945 1.09937 8.92004C1.09937 8.58063 1.23417 8.25511 1.47413 8.01508L7.87413 1.61508C7.993 1.49616 8.13413 1.40183 8.28946 1.33747C8.44479 1.27312 8.61128 1.23999 8.77941 1.23999C8.94755 1.23999 9.11404 1.27312 9.26937 1.33747C9.4247 1.40183 9.56583 1.49616 9.68469 1.61508L13.5241 5.45508C13.764 5.69511 13.8988 6.02063 13.8988 6.36004C13.8988 6.69945 13.764 7.02496 13.5241 7.265L8.03285 12.76" stroke="black" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.07159 6.41772L8.72151 12.0676" stroke="black" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            'select': `<svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.5,3 C5.77614237,3 6,3.22385763 6,3.5 C6,3.77614237 5.77614237,4 5.5,4 C4.67157288,4 4,4.67157288 4,5.5 C4,5.77614237 3.77614237,6 3.5,6 C3.22385763,6 3,5.77614237 3,5.5 C3,4.11928813 4.11928813,3 5.5,3 Z M8.5,4 C8.22385763,4 8,3.77614237 8,3.5 C8,3.22385763 8.22385763,3 8.5,3 L10.5,3 C10.7761424,3 11,3.22385763 11,3.5 C11,3.77614237 10.7761424,4 10.5,4 L8.5,4 Z M13.5,4 C13.2238576,4 13,3.77614237 13,3.5 C13,3.22385763 13.2238576,3 13.5,3 L15.5,3 C15.7761424,3 16,3.22385763 16,3.5 C16,3.77614237 15.7761424,4 15.5,4 L13.5,4 Z M8.5,21 C8.22385763,21 8,20.7761424 8,20.5 C8,20.2238576 8.22385763,20 8.5,20 L10.5,20 C10.7761424,20 11,20.2238576 11,20.5 C11,20.7761424 10.7761424,21 10.5,21 L8.5,21 Z M13.5,21 C13.2238576,21 13,20.7761424 13,20.5 C13,20.2238576 13.2238576,20 13.5,20 L15.5,20 C15.7761424,20 16,20.2238576 16,20.5 C16,20.7761424 15.7761424,21 15.5,21 L13.5,21 Z M3,8.5 C3,8.22385763 3.22385763,8 3.5,8 C3.77614237,8 4,8.22385763 4,8.5 L4,10.5 C4,10.7761424 3.77614237,11 3.5,11 C3.22385763,11 3,10.7761424 3,10.5 L3,8.5 Z M3,13.5 C3,13.2238576 3.22385763,13 3.5,13 C3.77614237,13 4,13.2238576 4,13.5 L4,15.5 C4,15.7761424 3.77614237,16 3.5,16 C3.22385763,16 3,15.7761424 3,15.5 L3,13.5 Z M3,18.5 C3,18.2238576 3.22385763,18 3.5,18 C3.77614237,18 4,18.2238576 4,18.5 C4,19.3284271 4.67157288,20 5.5,20 C5.77614237,20 6,20.2238576 6,20.5 C6,20.7761424 5.77614237,21 5.5,21 C4.11928813,21 3,19.8807119 3,18.5 Z M18.5,21 C18.2238576,21 18,20.7761424 18,20.5 C18,20.2238576 18.2238576,20 18.5,20 C19.3284271,20 20,19.3284271 20,18.5 C20,18.2238576 20.2238576,18 20.5,18 C20.7761424,18 21,18.2238576 21,18.5 C21,19.8807119 19.8807119,21 18.5,21 Z M21,15.5 C21,15.7761424 20.7761424,16 20.5,16 C20.2238576,16 20,15.7761424 20,15.5 L20,13.5 C20,13.2238576 20.2238576,13 20.5,13 C20.7761424,13 21,13.2238576 21,13.5 L21,15.5 Z M21,10.5 C21,10.7761424 20.7761424,11 20.5,11 C20.2238576,11 20,10.7761424 20,10.5 L20,8.5 C20,8.22385763 20.2238576,8 20.5,8 C20.7761424,8 21,8.22385763 21,8.5 L21,10.5 Z M21,5.5 C21,5.77614237 20.7761424,6 20.5,6 C20.2238576,6 20,5.77614237 20,5.5 C20,4.67157288 19.3284271,4 18.5,4 C18.2238576,4 18,3.77614237 18,3.5 C18,3.22385763 18.2238576,3 18.5,3 C19.8807119,3 21,4.11928813 21,5.5 Z"/>
</svg>`
        };
        
        return icons[toolName] || icons['pencil'];
    }
    
    /**
     * Update active button styling
     * @param {string} toolName - Active tool name
     * @private
     */
    _updateActiveButton(toolName) {
        // Reset all buttons
        this.buttons.forEach(button => {
            button.setFillColor('white');
        });
        
        // Highlight active button
        const activeButton = this.buttons.get(toolName);
        if (activeButton) {
            activeButton.setFillColor(this.omdColor.lightGray);
            this.activeButton = activeButton;
        } else {
            this.activeButton = null;
        }
    }
    
    /**
     * Add custom button to toolbar
     * @param {Object} config - Button configuration
     * @param {string} config.id - Button ID
     * @param {string} config.icon - SVG icon string
     * @param {Function} config.callback - Click callback
     * @param {string} [config.tooltip] - Tooltip text
     */
    addButton(config) {
        const button = this._createJsvgButton({ name: config.id }, 48);
        
        // Set icon
        if (config.icon) {
            const dataURI = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(config.icon);
            button.addImage(dataURI, 24, 24);
        }
        
        // Set click callback
        if (config.callback) {
            button.setClickCallback(config.callback);
        }
        
        // Add to toolbar group
        this.toolbarGroup.addChild(button);
        
        // Store button
        this.buttons.set(config.id, button);
        
        return button;
    }
    
    /**
     * Remove button from toolbar
     * @param {string} buttonId - Button ID to remove
     */
    removeButton(buttonId) {
        const button = this.buttons.get(buttonId);
        if (button) {
            this.toolbarGroup.removeChild(button);
            this.buttons.delete(buttonId);
        }
    }
    
    /**
     * Show toolbar
     */
    show() {
        this.toolbarGroup.svgObject.style.display = 'block';
    }
    
    /**
     * Hide toolbar
     */
    hide() {
        this.toolbarGroup.svgObject.style.display = 'none';
    }
    

    
    /**
     * Destroy toolbar
     */
    destroy() {
        if (this.toolbarGroup.svgObject.parentNode) {
            this.toolbarGroup.svgObject.parentNode.removeChild(this.toolbarGroup.svgObject);
        }
        this.buttons.clear();
    }
} 