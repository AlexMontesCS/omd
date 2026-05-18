import { jsvgContainer } from '@teachinglab/jsvg';

export class omdCanvas {
    constructor(container, options = {}) {
        if (!container || typeof container.appendChild !== 'function') {
            throw new Error('omdCanvas requires a valid DOM container element.');
        }

        this.container = container;
        this.width  = options.width  || container.offsetWidth  || 800;
        this.height = options.height || container.offsetHeight || 600;
        this._items = [];

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
        this._items.push(component);
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
        this._items = this._items.filter(i => i !== component);
    }

    // Remove all components.
    clear() {
        for (const item of [...this._items]) this.svg.removeChild(item);
        this._items = [];
    }

    // Resize the canvas.
    resize(width, height) {
        this.width  = width;
        this.height = height;
        this.svg.setWidthAndHeight(width, height);
    }

    get items() {
        return [...this._items];
    }
}
