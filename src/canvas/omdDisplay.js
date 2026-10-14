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

        // Components whose content is real HTML (mathText's foreignObject)
        // reflow after load — web fonts, and page translation rewriting the
        // prose. They announce the new box here so the <svg> follows.
        this._onComponentResize = () => { if (!this._destroyed) this._layout(); };
        this.svg.svgObject.addEventListener('omd:resize', this._onComponentResize);

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

        const boxW = Math.ceil(compW * scale + pad * 2);
        const boxH = Math.ceil(compH * scale + pad * 2);

        if (this._htmlNode) {
            // Plain DOM host: scale with a CSS transform instead of an SVG one.
            this._htmlNode.style.transform = scale === 1 ? '' : `scale(${scale})`;
            this._htmlNode.style.transformOrigin = 'top left';
            this._htmlNode.style.margin = `${pad}px`;
            this._htmlNode.style.width = `${compW}px`;
            this._htmlNode.style.height = `${compH}px`;
            return;
        }

        this._component.setScale(scale);
        this._component.setPosition(pad, pad);

        this.svg.setWidthAndHeight(boxW, boxH);
        this.svg.setViewbox(boxW, boxH);
        this.svg.svgObject.style.width = `${boxW}px`;
        this.svg.svgObject.style.height = `${boxH}px`;
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

        // Prose components render as real HTML next to the SVG, never inside
        // it: Chrome's page translator skips everything under an <svg>, so a
        // paragraph in a foreignObject is selectable but untranslatable.
        const htmlNode = typeof component.getHtmlNode === 'function' ? component.getHtmlNode() : null;
        if (htmlNode) {
            this._htmlNode = htmlNode;
            htmlNode.addEventListener('omd:resize', this._onComponentResize);
            this.svg.svgObject.style.display = 'none';
            this.container.appendChild(htmlNode);
        } else {
            this.svg.svgObject.style.display = 'block';
            this.svg.addChild(component);
            this._svgMounted = true;
        }

        this._layout();
    }

    _clearComponent() {
        if (this._htmlNode) {
            this._htmlNode.removeEventListener('omd:resize', this._onComponentResize);
            if (this._htmlNode.parentNode === this.container) this.container.removeChild(this._htmlNode);
            this._htmlNode = null;
        }
        if (this._component) {
            // Components that watch the DOM (mathText) would otherwise keep a
            // live ResizeObserver on a detached node.
            if (typeof this._component.destroy === 'function') this._component.destroy();
            if (this._svgMounted) this.svg.removeChild(this._component);
            this._svgMounted = false;
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
        this.svg.svgObject.removeEventListener('omd:resize', this._onComponentResize);
        if (this.container.contains(this.svg.svgObject)) {
            this.container.removeChild(this.svg.svgObject);
        }
    }
}
