import { omdEquationSequenceNode } from './omdEquationSequenceNode.js';
import { jsvgGroup, jsvgLayoutGroup } from '@teachinglab/jsvg';
import { omdEquationNode } from './omdEquationNode.js';
import { omdOperationDisplayNode } from './omdOperationDisplayNode.js';

export class omdEquationStack extends jsvgGroup {
    constructor(steps = [], options = {}) {
        super();
        this.options = { ...options };
        this.sequence = new omdEquationSequenceNode(steps);

        if (options.styling?.equationBackground) {
            this.sequence.setDefaultEquationBackground(options.styling.equationBackground);
        }

        this.layoutGroup = new jsvgLayoutGroup();
        this.layoutGroup.setSpacer(16);
        this.layoutGroup.addChild(this.sequence);
        this.addChild(this.layoutGroup);
        this.updateLayout();
    }

    updateLayout() {
        this.sequence.updateLayout();
        this.layoutGroup.doVerticalLayout();
        this.width = this.layoutGroup.width;
        this.height = this.layoutGroup.height;
    }

    initialize() {
        if (typeof this.sequence.initialize === 'function') {
            this.sequence.initialize();
        } else {
            if (typeof this.sequence.computeDimensions === 'function') this.sequence.computeDimensions();
            if (typeof this.sequence.updateLayout === 'function') this.sequence.updateLayout();
        }
        this.updateLayout();
    }

    setFontSize(fontSize) {
        if (typeof this.sequence.setFontSize === 'function') this.sequence.setFontSize(fontSize);
        this.updateLayout();
    }

    getSequence() {
        return this.sequence;
    }

    undoLastOperation() {
        const seq = this.sequence;
        if (!seq || !Array.isArray(seq.steps) || seq.steps.length === 0) return false;

        let eqIndex = -1;
        for (let i = seq.steps.length - 1; i >= 0; i--) {
            const st = seq.steps[i];
            if (st instanceof omdEquationNode || st?.type === 'omdEquationNode') { eqIndex = i; break; }
        }
        if (eqIndex === -1) return false;

        let startIndex = eqIndex;
        for (let i = eqIndex; i >= 0; i--) {
            const st = seq.steps[i];
            if (st instanceof omdOperationDisplayNode || st?.type === 'omdOperationDisplayNode') { startIndex = i; break; }
        }

        for (let i = seq.steps.length - 1; i >= startIndex; i--) {
            try { seq.removeChild(seq.steps[i]); } catch (_) {}
        }
        seq.steps.splice(startIndex);
        seq.argumentNodeList.steps = seq.steps;
        if (Array.isArray(seq.stepDescriptions)) seq.stepDescriptions.length = seq.steps.length;
        if (Array.isArray(seq.importanceLevels)) seq.importanceLevels.length = seq.steps.length;

        if (typeof seq.currentStepIndex === 'number' && seq.currentStepIndex >= seq.steps.length) {
            seq.currentStepIndex = Math.max(0, seq.steps.length - 1);
        }

        if (typeof seq.rebuildNodeMap === 'function') seq.rebuildNodeMap();
        if (typeof seq.computeDimensions === 'function') seq.computeDimensions();
        if (typeof seq.updateLayout === 'function') seq.updateLayout();

        this.updateLayout();
        return true;
    }

    getSvg() {
        return this.svgObject;
    }
}
