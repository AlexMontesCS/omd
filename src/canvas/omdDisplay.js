import { jsvgContainer } from '@teachinglab/jsvg';
import { omdExpression } from '../equations/omdExpression.js';
import { omdEquation } from '../equations/omdEquation.js';
import { createFromJSON } from '../omdFactory.js';

export class omdDisplay {
    constructor(container, options = {}) {
        if (!container || typeof container.appendChild !== 'function') {
            throw new Error('omdDisplay requires a valid DOM container element.');
        }

        this.container = container;
        this.options = {
            alignment: 'center',
            autoScale: true,
            maxScale: 1,
            padding: 8,
            onChange: null,
            ...options
        };

        this._component = null;
        this._destroyed = false;

        const alignment = this.options.alignment;
        if (alignment === 'center' || alignment === 'left' || alignment === 'right') {
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent =
                alignment === 'left'  ? 'flex-start' :
                alignment === 'right' ? 'flex-end'   : 'center';
        }

        this.svg = new jsvgContainer();
        this.svg.svgObject.style.display = 'block';
        container.appendChild(this.svg.svgObject);

        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(() => this._layout());
            this._resizeObserver.observe(container);
        }

        if (typeof document !== 'undefined' && document.fonts?.ready) {
            document.fonts.ready.then(() => {
                if (!this._destroyed && this._component) this._layout();
            }).catch(() => {});
        }
    }

    _layout() {
        if (!this._component) return;

        const cw = this.container.offsetWidth || 400;
        const ch = this.container.offsetHeight || 200;
        const pad = this.options.padding;
        const compW = this._component.width || 0;
        const compH = this._component.height || 0;

        if (!compW || !compH) return;

        let scale = 1;
        if (this.options.autoScale) {
            const maxScale = typeof this.options.maxScale === 'number' ? this.options.maxScale : 1;
            const sx = (cw - pad * 2) / compW;
            const sy = (ch - pad * 2) / compH;
            scale = Math.max(0.1, Math.min(sx, sy, maxScale));
        }

        const svgW = Math.ceil(compW * scale + pad * 2);
        const svgH = Math.ceil(compH * scale + pad * 2);

        this._component.setScale(scale);
        this._component.setPosition(pad, pad);

        this.svg.setWidthAndHeight(svgW, svgH);
        this.svg.setViewbox(svgW, svgH);
        this.svg.svgObject.style.width = `${svgW}px`;
        this.svg.svgObject.style.height = `${svgH}px`;
    }

    render(string) {
        let component;
        if (typeof string !== 'string') {
            throw new Error('omdDisplay.render() expects a string. Use load() for components or loadFromJSON() for JSON configs.');
        }

        const text = string.trim();
        if (!text) {
            throw new Error('omdDisplay.render() received an empty expression string.');
        }

        if (text.includes('=')) {
            component = new omdEquation();
            component.loadFromJSON(text);
        } else {
            component = new omdExpression();
            component.loadFromJSON(text);
        }

        this._setComponent(component);
    }

    load(component) {
        if (!component || !component.svgObject) return;
        this._setComponent(component);
    }

    loadFromJSON(json) {
        const component = createFromJSON(json);
        this._setComponent(component);
    }

    _setComponent(component) {
        this._clearComponent();
        this._component = component;
        if (typeof this.options.onChange === "function") {
            component.onChange = (payload) => this.options.onChange(payload);
        }
        this.svg.addChild(component);
        this._layout();
    }

    _clearComponent() {
        if (this._component) {
            this.svg.removeChild(this._component);
            this._component = null;
        }
    }

    clear() {
        this._clearComponent();
    }

    destroy() {
        this._destroyed = true;
        this._clearComponent();
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (this.container.contains(this.svg.svgObject)) {
            this.container.removeChild(this.svg.svgObject);
        }
    }
}
