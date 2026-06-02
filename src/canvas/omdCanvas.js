import { jsvgContainer } from '@teachinglab/jsvg';
import { createFromJSON } from '../omdFactory.js';

export class omdCanvas {
    constructor(container, options = {}) {
        if (!container || typeof container.appendChild !== 'function') {
            throw new Error('omdCanvas requires a valid DOM container element.');
        }

        this.container = container;
        this.width  = options.width  || container.offsetWidth  || 800;
        this.height = options.height || container.offsetHeight || 600;

        this.svg = new jsvgContainer();
        this.svg.setWidthAndHeight(this.width, this.height);
        this.svg.svgObject.style.display = 'block';
        container.appendChild(this.svg.svgObject);
    }

    // Add a component at a given position. Returns the component.
    add(component, options = {}) {
        const { x = 0, y = 0, scale } = options;
        component.setPosition(x, y);
        if (scale != null) component.setScale(scale);
        this.svg.addChild(component);
        return component;
    }

    // Move a previously added component to a new position.
    move(component, x, y) {
        component.setPosition(x, y);
        return component;
    }

    // Scale a previously added component.
    scale(component, s) {
        component.setScale(s);
        return component;
    }

    // Remove a specific component.
    remove(component) {
        this.svg.removeChild(component);
    }

    // Remove all components.
    clear() {
        this.svg.removeAllChildren();
    }

    // Resize the canvas.
    resize(width, height) {
        this.width  = width;
        this.height = height;
        this.svg.setWidthAndHeight(width, height);
    }

    // Load a canvas scene from the JSON shape returned by ai-omd-canvas:
    // { width, height, components: [{ omdType, x, y, scale?, ...fields }] }
    loadFromJSON(json) {
        const { width, height, components } = typeof json === 'string' ? JSON.parse(json) : json;
        this.clear();
        this.resize(width, height);
        for (const { x = 0, y = 0, scale, ...omdJson } of components) {
            const component = createFromJSON(omdJson);
            this.add(component, { x, y, scale });
        }
    }

    get items() {
        return [...this.svg.childList];
    }
}
