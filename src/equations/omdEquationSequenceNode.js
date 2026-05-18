import { omdNode } from "./omdNode.js";
import { omdEquationNode } from "./omdEquationNode.js";
import { getNodeForAST } from "./omdUtilities.js";
import { omdMetaExpression } from "./omdMetaExpression.js";
import { omdOperationDisplayNode } from "./omdOperationDisplayNode.js";
import { getFontWeight } from "../config/omdConfigManager.js";
import { jsvgLayoutGroup } from '@teachinglab/jsvg';
/**
 * Represents a sequence of equations for a step-by-step calculation.
 * This node manages the layout of multiple equations, ensuring their
 * equals signs are vertically aligned for readability.
 * @extends omdNode
 */
export class omdEquationSequenceNode extends omdNode {
    static OPERATION_MAP = {
        'add': 'addToBothSides',
        'subtract': 'subtractFromBothSides',
        'multiply': 'multiplyBothSides',
        'divide': 'divideBothSides',
    };

    /**
     * Sets the alignment mode for equations in the sequence.
     * @param {string} mode - Either 'equals' (align by equals sign) or 'center' (center all equations)
     */
    setAlignmentMode(mode) {
        if (mode !== 'equals' && mode !== 'center') {
            console.warn(`Invalid alignment mode: ${mode}. Using 'equals'.`);
            this.alignmentMode = 'equals';
        } else {
            this.alignmentMode = mode;
        }
        // Trigger layout update if already initialized
        if (this.steps && this.steps.length > 0) {
            this.updateLayout();
        }
    }
    
    /**
     * Gets the current alignment mode.
     * @returns {string} Either 'equals' or 'center'
     */
    getAlignmentMode() {
        return this.alignmentMode || 'equals';
    }
    
    /**
     * Sets the filter level for visible steps in the sequence.
     * @param {number} level - The stepMark level to show (e.g., 0 for major steps)
     */
    setFilterLevel(level = 0) {
        this.currentFilterLevels = [level];
        this.updateStepsVisibility(step => (step.stepMark ?? 0) === level);
    }

    /**
     * Sets multiple filter levels for visible steps in the sequence.
     * @param {number[]} levels - Array of stepMark levels to show (e.g., [0, 1] for major and intermediate steps)
     */
    setFilterLevels(levels = [0]) {
        this.currentFilterLevels = [...levels]; // Store a copy of the levels
        this.updateStepsVisibility(step => {
            const stepLevel = step.stepMark ?? 0;
            return levels.includes(stepLevel);
        });
    }

    /**
     * Reapplies the current filter levels
     * @private
     */
    _reapplyCurrentFilter() {
        if (this.currentFilterLevels && this.currentFilterLevels.length > 0) {
            this.updateStepsVisibility(step => {
                const stepLevel = step.stepMark ?? 0;
                return this.currentFilterLevels.includes(stepLevel);
            });
        }
    }

    /**
     * Gets the current filter level (always returns 0 since we default to level 0)
     * @returns {number} The current filter level
     */
    getFilterLevel() {
        return 0; // Always return 0 since that's our default
    }

    /**
     * Creates a calculation node from an array of equation nodes.
     * @param {Array<omdEquationNode>} steps - An array of omdEquationNode objects.
     */
    constructor(steps) {
        super({}); // No specific AST for the container itself
        this.type = "omdEquationSequenceNode";
        this.steps = steps;
        this.argumentNodeList.steps = this.steps;
        this.steps.forEach(step => this.addChild(step));

        this._initializeState();
        this._initializeLayout();
        this._initializeNodeMap();
        this._disableContainerInteractions();

        this._markInitialSteps();
        
        // Apply default filter to show only level 0 steps by default
        this._applyDefaultFilter();

        // Default background style for new equation steps (optional)
        this.defaultEquationBackground = null;
    }

    /**
     * @private
     */
    _initializeState() {
        this.currentStepIndex = 0;
        this.stepDescriptions = [];
        this.importanceLevels = [];
        this.simplificationHistory = [];
        this.currentFilterLevels = [0]; // Track current filter state, default to level 0 only
    }

    /**
     * @private
     */
    _initializeLayout() {
        this.hideBackgroundByDefault();
        this.layoutHelper = new jsvgLayoutGroup();
        this.layoutHelper.setSpacer(15);
        
        // Alignment mode: 'equals' (default) or 'center'
        this.alignmentMode = 'equals';
    }

    /**
     * @private
     */
    _initializeNodeMap() {
        this.nodeMap = new Map();
        this.rebuildNodeMap();
    }

    /**
     * @private
     */
    _disableContainerInteractions() {
        this.svgObject.onmouseenter = null;
        this.svgObject.onmouseleave = null;
        this.svgObject.style.cursor = "default";
        this.svgObject.onclick = null;
    }
    
    /**
     * Marks initial steps in the sequence
     * @private
     */
    _markInitialSteps() {
        if (!this.steps || !Array.isArray(this.steps)) return;
        
        this.steps.forEach((step, index) => {
            if (step instanceof omdEquationNode) {
                // Mark property for filtering
                step.stepMark = 0;
            }
        });
        // Don't apply filtering here - let it happen naturally when needed
    }

    /**
     * Applies the default filter (level 0) automatically
     * @private
     */
    _applyDefaultFilter() {
        // Only apply filter if we have steps and the steps array is properly initialized
        if (this.steps && Array.isArray(this.steps) && this.steps.length > 0) {
            this.updateStepsVisibility(step => (step.stepMark ?? 0) === 0);
        }
    }

    /**
     * Gets the last equation in the sequence (the current working equation)
     * @returns {omdEquationNode|null} The last equation, or null if no equations exist
     */
    getCurrentEquation() {
        if (!this.steps || this.steps.length === 0) return null;
        
        // Find the last equation in the sequence
        for (let i = this.steps.length - 1; i >= 0; i--) {
            if (this.steps[i] instanceof omdEquationNode) {
                return this.steps[i];
            }
        }
        return null;
    }

    /**
     * Adds a new step to the sequence.
     * Can be called with multiple signatures:
     * - addStep(omdNode, optionsObject)
     * - addStep(omdNode, description, importance)
     * - addStep(string, ...)
     * @param {omdNode|string} step - The node object or expression string for the step.
     * @param {Object|string} [descriptionOrOptions] - An options object or a description string.
     * @param {number} [importance] - The importance level (0, 1, 2) if using string description.
     * @returns {number} The index of the added step.
     */
    addStep(step, descriptionOrOptions, importance) {
        let options = {};
        if (typeof descriptionOrOptions === 'string') {
            options = { description: descriptionOrOptions, stepMark: importance ?? 2 };
        } else if (descriptionOrOptions) {
            options = descriptionOrOptions;
        }

        const stepNode = (typeof step === 'string') ? this._stringToNode(step) : step;
        const stepIndex = this.steps.length;

        // Store metadata
        if (options.description !== undefined) {
            this.stepDescriptions[stepIndex] = options.description;
        }
        if (options.stepMark !== undefined) {
            this.importanceLevels[stepIndex] = options.stepMark;
        } else {
            this.importanceLevels[stepIndex] = 0;
        }

        // Add node to sequence
        // Apply default equation background styling before initialization so layout includes padding
        if (this.defaultEquationBackground && typeof stepNode?.setBackgroundStyle === 'function') {
            stepNode.setBackgroundStyle(this.defaultEquationBackground);
        }
        stepNode.setFontSize(this.getFontSize());
        stepNode.initialize();
        this.steps.push(stepNode);
        this.addChild(stepNode);
        this.argumentNodeList.steps = this.steps;
        this.rebuildNodeMap();

        // Persist stepMark on the node for filtering
        if (stepNode instanceof omdEquationNode) {
            stepNode.stepMark = options.stepMark ?? this._determineStepMark(stepNode, options);
        } else if (options.stepMark !== undefined) {
            stepNode.stepMark = options.stepMark;
        } else {
            stepNode.stepMark = 0;
        }

        // Refresh layout and display
        this.computeDimensions();
        this.updateLayout();
        if (window.refreshDisplayAndFilters) {
            window.refreshDisplayAndFilters();
        }

        // Reapply current filter to maintain filter state
        this._reapplyCurrentFilter();

        return stepIndex;
    }

    /**
     * Sets a default background style to be applied to all equation steps added thereafter.
     * Also applies it to existing steps immediately.
     * @param {{ backgroundColor?: string, cornerRadius?: number, pill?: boolean, padding?: number|{x:number,y:number} }} style
     */
    setDefaultEquationBackground(style = null) {
        this.defaultEquationBackground = style;
        if (style) {
            (this.steps || []).forEach(step => {
                if (typeof step?.setBackgroundStyle === 'function') {
                    step.setBackgroundStyle(style);
                }
            });
            this.computeDimensions();
            this.updateLayout();
        }
    }
    
    /**
     * Determines the appropriate step mark for a step
     * @param {omdNode} step - The step being added
     * @param {Object} options - Options passed to addStep
     * @returns {number} The step mark (0, 1, or 2)
     * @private
     */
    _determineStepMark(step, options) {
        // If this is called from applyEquationOperation, it's already handled there
        // For other cases, we need to determine if it's a simplification step
        if (options.isSimplification) {
            return 2; // Verbose simplification step
        }
        
        // Check if this appears to be a final simplified result
        if (this._isFullySimplified(step)) {
            return 0; // Final result
        }
        
        // Default to verbose step
        return 2;
    }
    

    
    /**
     * Checks if an equation appears to be fully simplified
     * @param {omdNode} step - The step to check
     * @returns {boolean} Whether the step appears fully simplified
     * @private
     */
    _isFullySimplified(step) {
        // This is a heuristic - in practice you might want more sophisticated logic
        // For now, we'll consider it simplified if it doesn't contain complex nested operations
        if (!(step instanceof omdEquationNode)) return false;
        
        // Simple heuristic: check if both sides are relatively simple
        const leftIsSimple = this._isSimpleExpression(step.left);
        const rightIsSimple = this._isSimpleExpression(step.right);
        
        return leftIsSimple && rightIsSimple;
    }
    
    /**
     * Checks if an expression is simple (constant, variable, or simple operations)
     * @param {omdNode} node - The node to check
     * @returns {boolean} Whether the expression is simple
     * @private
     */
    _isSimpleExpression(node) {
        // This is a simplified heuristic
        if (node.isConstant() || node.type === 'omdVariableNode') {
            return true;
        }
        
        // Allow simple binary operations with constants/variables
        if (node.type === 'omdBinaryExpressionNode') {
            return this._isSimpleExpression(node.left) && this._isSimpleExpression(node.right);
        }
        
        return false;
    }

    /**
     * Rebuilds the nodeMap to include ALL nodes from ALL steps in the sequence
     * This is crucial for provenance tracking across multiple steps
     */
    rebuildNodeMap() {
        if (!this.nodeMap) {
            this.nodeMap = new Map();
        }
        
        // Don't clear the map yet - first collect all current nodes
        const newNodeMap = new Map();
        
        // Add all nodes from all steps to the new nodeMap
        this.steps.forEach((step, stepIndex) => {
            const stepNodes = step.findAllNodes();
            stepNodes.forEach(node => {
                newNodeMap.set(node.id, node);
            });
        });
        
        // Also add the sequence itself
        newNodeMap.set(this.id, this);
        
        // Now preserve historical nodes that are referenced in provenance chains
        this.preserveProvenanceHistory(newNodeMap);
        
        // Replace the old nodeMap with the new one
        this.nodeMap = newNodeMap;
    }
    
    /**
     * Preserves historical nodes that are referenced in provenance chains
     * This ensures the highlighting system can find all nodes it needs
     */
    preserveProvenanceHistory(newNodeMap) {
        const referencedIds = this._collectAllProvenanceIds(newNodeMap);
        this._preserveReferencedNodes(referencedIds, newNodeMap);
    }

    /** @private */
    _collectAllProvenanceIds(newNodeMap) {
        const referencedIds = new Set();
        const processedNodes = new Set();
        newNodeMap.forEach(node => this._collectNodeProvenanceIds(node, referencedIds, processedNodes));
        return referencedIds;
    }

    /** @private */
    _collectNodeProvenanceIds(node, referencedIds, processedNodes) {
        if (!node || !node.id || processedNodes.has(node.id)) return;
        processedNodes.add(node.id);

        if (node.provenance?.length > 0) {
            node.provenance.forEach(id => referencedIds.add(id));
        }

        if (node.argumentNodeList) {
            Object.values(node.argumentNodeList).flat().forEach(child => {
                this._collectNodeProvenanceIds(child, referencedIds, processedNodes);
            });
        }
    }

    /** @private */
    _preserveReferencedNodes(referencedIds, newNodeMap) {
        const processedIds = new Set();
        referencedIds.forEach(id => this._preserveNodeAndContext(id, newNodeMap, processedIds));
    }

    /** @private */
    _preserveNodeAndContext(id, newNodeMap, processedIds) {
        if (processedIds.has(id) || newNodeMap.has(id) || !this.nodeMap?.has(id)) {
            return;
        }
        processedIds.add(id);

        const historicalNode = this.nodeMap.get(id);
        newNodeMap.set(id, historicalNode);

        // Preserve this node's own provenance chain
        if (historicalNode.provenance?.length > 0) {
            historicalNode.provenance.forEach(nestedId => {
                this._preserveNodeAndContext(nestedId, newNodeMap, processedIds);
            });
        }

        // Preserve parent and sibling context
        this._preserveParentContext(historicalNode, newNodeMap);
        this._preserveSiblingContext(historicalNode, newNodeMap);
    }
    
    /** @private */
    _preserveParentContext(node, newNodeMap) {
        let parent = node.parent;
        while (parent && parent.id) {
            if (!newNodeMap.has(parent.id) && this.nodeMap.has(parent.id)) {
                newNodeMap.set(parent.id, this.nodeMap.get(parent.id));
            }
            parent = parent.parent;
        }
    }
    
    /** @private */
    _preserveSiblingContext(node, newNodeMap) {
        if (!node.parent?.argumentNodeList) return;

        Object.values(node.parent.argumentNodeList).flat().forEach(sibling => {
            if (sibling && sibling.id && !newNodeMap.has(sibling.id) && this.nodeMap.has(sibling.id)) {
                newNodeMap.set(sibling.id, this.nodeMap.get(sibling.id));
            }
        });
    }

    /**
     * Records a simplification step in the history
     * @param {string} name - The name of the simplification rule that was applied
     * @param {Array<string>} affectedNodes - Array of node IDs that were affected by the simplification
     * @param {string} message - Human-readable description of what was simplified
     * @param {Object} [metadata={}] - Additional metadata about the simplification
     */
    recordSimplificationHistory(name, affectedNodes, message, metadata = {}) {
        const historyEntry = {
            name,
            affectedNodes: [...affectedNodes], // Create a copy of the array
            message,
            stepNumber: this.steps.length,
            ...metadata
        };
        
        this.simplificationHistory.push(historyEntry);
    }

    /**
     * Gets the complete simplification history for this sequence
     * @returns {Array<Object>} Array of simplification history entries
     */
    getSimplificationHistory() {
        return [...this.simplificationHistory]; // Return a copy
    }

    /**
     * Clears the simplification history
     */
    clearSimplificationHistory() {
        this.simplificationHistory = [];
    }

    /**
     * Override setFontSize to propagate to all steps
     * @param {number} fontSize - The new font size
     */
    setFontSize(fontSize) {
        super.setFontSize(fontSize);
        
        // Propagate the font size to all existing steps
        this.steps.forEach(step => {
            step.setFontSize(fontSize);
        });
        
        // Recompute dimensions and layout with the new font size
        this.computeDimensions();
        this.updateLayout();
    }

    /**
     * Convenience helper: recompute dimensions, update layout, and optionally render via a renderer.
     * Use this instead of calling computeDimensions/updateLayout everywhere.
     * @param {object} [renderer] - Optional renderer (e.g., an omdDisplay instance) to re-render the sequence
     */
    refresh(renderer, center=true) {
        this.computeDimensions();
        this.updateLayout();
        renderer.render(this);

        if (center) {
            renderer.centerNode();
        }
    }

    /**
     * Applies a specified operation to the current equation in the sequence and adds the result as a new step.
     * @param {number|string} value - The constant value or expression string to apply.
     * @param {string} operation - The operation name ('add', 'subtract', 'multiply', 'divide').
     * @returns {omdEquationSequenceNode} Returns this sequence for chaining.
     */
    applyEquationOperation(value, operation) {
        if (!omdEquationSequenceNode.OPERATION_MAP[operation]) {
            console.error(`Invalid operation: ${operation}`);
            return this;
        }

        const currentEquation = this.getCurrentEquation();
        if (!currentEquation) {
            console.error("No equation to apply operation to.");
            return this;
        }

        let operationValue = value;
        if (typeof value === 'string') {
            if (!window.math) throw new Error("Math.js is required for parsing expressions");
            operationValue = isNaN(value) ? window.math.parse(value) : parseFloat(value);
        }

        // Step 1: Add visual operation display
        const operationDisplay = new omdOperationDisplayNode(operation, value);
        this.addStep(operationDisplay, { stepMark: 0 });

        // Step 2: Apply operation to a clone of the equation
        const clonedEquation = currentEquation.clone();
        const equationMethod = omdEquationSequenceNode.OPERATION_MAP[operation];
        const unsimplifiedEquation = clonedEquation[equationMethod](operationValue, operationDisplay.id);

        this.addStep(unsimplifiedEquation, {
            stepMark: 0,
            description: this._getOperationDescription(operation, value, false)
        });

        return this;
    }

    /**
     * Generates a description for an equation operation.
     * @param {string} operation - The operation name.
     * @param {number|string} value - The value used in the operation.
     * @param {boolean} isUnsimplified - Whether the result is unsimplified.
     * @returns {string} The formatted description.
     * @private
     */
    _getOperationDescription(operation, value, isUnsimplified) {
        const templates = {
            'add': `Added ${value} to both sides`,
            'subtract': `Subtracted ${value} from both sides`,
            'multiply': `Multiplied both sides by ${value}`,
            'divide': `Divided both sides by ${value}`
        };
        const baseDescription = templates[operation] || `Applied ${operation} with ${value}`;
        return isUnsimplified ? `${baseDescription} (unsimplified)` : baseDescription;
    }

    /**
     * Applies a function to both sides of the current equation in the sequence and adds the result as a new step.
     * @param {string} functionName - The name of the function to apply.
     * @returns {omdEquationSequenceNode} Returns this sequence for chaining.
     */
    applyEquationFunction(functionName) {
        const currentEquation = this.getCurrentEquation();
        if (!currentEquation) {
            throw new Error("No equation found in sequence to operate on");
        }

        // Clone the current equation
        const clonedEquation = currentEquation.clone();
        
        // Apply the function to the clone
        const newEquation = clonedEquation.applyFunction(functionName);

        this.addStep(newEquation, {
            stepMark: 0,
            description: `Applied ${functionName} to both sides`
        });
        
        return this;
    }



    /**
     * Evaluates the current step in the sequence with the given variables.
     * Logs the result to the console.
     * @param {Object} variables - A map of variable names to their numeric values.
     */
    evaluate(variables = {}) {
        const targetNode = this.getCurrentStep();
        if (!targetNode || typeof targetNode.evaluate !== 'function') {
            console.warn("Evaluation not supported for the current step.");
            return;
        }

        try {
            const result = targetNode.evaluate(variables);

            if (typeof result === 'object' && result.left !== undefined && result.right !== undefined) {
                const { left, right } = result;
                const isEqual = Math.abs(left - right) < 1e-9;

            } else {

            }
        } catch (error) {
            console.error("Evaluation failed:", error.message);
        }
    }

    /**
     * Validates the provenance integrity across all steps in the sequence
     * @returns {Array} Array of validation issues found
     */
    validateSequenceProvenance() {
        const issues = [];
        this._validateStepsProvenance(issues);
        this._findOrphanedNodes(issues);
        return issues;
    }

    /** @private */
    _validateStepsProvenance(issues) {
        this.steps.forEach((step, index) => {
            const stepIssues = step.validateProvenance(this.nodeMap);
            stepIssues.forEach(issue => issues.push({ ...issue, stepIndex: index }));
        });
    }

    /** @private */
    _findOrphanedNodes(issues) {
        const currentNodeIds = new Set(this.steps.flatMap(step => step.findAllNodes().map(n => n.id)));
        const allProvenanceIds = this._collectAllProvenanceIds(this.nodeMap);

        this.nodeMap.forEach((node, id) => {
            if (!currentNodeIds.has(id) && !allProvenanceIds.has(id)) {
                issues.push({
                    type: 'orphaned_node',
                    nodeId: id,
                    nodeType: node.type,
                });
            }
        });
    }

    /**
     * Overrides the default select behavior to prevent the container from highlighting.
     * This container should be inert and not react to selection events.
     */
    select() {
    }

    /**
     * Overrides the default deselect behavior to prevent the container from highlighting.
     */
    deselect() {
    }

    /**
     * Override highlight to prevent the sequence container itself from highlighting
     * but still allow children to be highlighted
     */
    highlight(color) {
        // Don't highlight the sequence container itself
        // Just propagate to children (but not the backRect)
        this.childList.forEach((child) => {
            if (child instanceof omdMetaExpression && child !== this.backRect) {
                child.highlight(color);
            }
        });
    }
    
    /**
     * Override clearProvenanceHighlights to work with the sequence
     */
    clearProvenanceHighlights() {
        // Don't change the sequence container's background
        // Just clear highlights from children
        this.childList.forEach((child) => {
            if (child instanceof omdMetaExpression && typeof child.clearProvenanceHighlights === 'function' && child !== this.backRect) {
                child.clearProvenanceHighlights();
            }
        });
    }

    /**
     * Calculates the dimensions of the entire calculation block.
     * It determines the correct alignment for all equals signs and calculates
     * the total width and height required.
     * @override
     */
    computeDimensions() {
        const visibleSteps = this.steps.filter(s => s.visible !== false);
        if (visibleSteps.length === 0) {
            this.setWidthAndHeight(0, 0);
            return;
        }

        visibleSteps.forEach(step => step.computeDimensions());

        this.alignPointX = this._calculateAlignmentPoint(visibleSteps);

        const { maxWidth, totalHeight } = this._calculateTotalDimensions(visibleSteps);
        this.setWidthAndHeight(maxWidth, totalHeight);
    }

    /** @private */
    _calculateAlignmentPoint(visibleSteps) {
        const equalsCenters = [];
        visibleSteps.forEach(step => {
            if (step instanceof omdEquationNode) {
                if (typeof step.getEqualsAnchorX === 'function') {
                    equalsCenters.push(step.getEqualsAnchorX());
                } else if (step.equalsSign && step.left) {
                    const spacing = 8 * step.getFontSize() / step.getRootFontSize();
                    equalsCenters.push(step.left.width + spacing + (step.equalsSign.width / 2));
                }
            }
        });
        return equalsCenters.length > 0 ? Math.max(...equalsCenters) : 0;
    }

    /** @private */
    _calculateTotalDimensions(visibleSteps) {
        let maxWidth = 0;
        let totalHeight = 0;
        const verticalPadding = 15 * this.getFontSize() / this.getRootFontSize();

        visibleSteps.forEach((step, index) => {
            let stepWidth = 0;
            if (step instanceof omdEquationNode) {
                stepWidth = this.alignPointX + step.equalsSign.width + step.right.width;
            } else {
                stepWidth = step.width;
            }

            maxWidth = Math.max(maxWidth, stepWidth);
            totalHeight += step.height;
            if (index < visibleSteps.length - 1) {
                totalHeight += verticalPadding;
            }
        });

        return { maxWidth, totalHeight };
    }

	/**
	 * Computes the horizontal offset needed to align a step with the master equals anchor.
	 * Equations align their equals sign center to alignPointX; operation displays align their
	 * virtual equals (middle of the gap); other steps are centered within the sequence width.
	 * @param {omdNode} step
	 * @returns {number} x offset in local coordinates
	 * @private
	 */
	_computeStepXOffset(step) {
		// If alignment mode is 'center', always center all steps
		if (this.alignmentMode === 'center') {
			return (this.width - step.width) / 2;
		}
		
		// Default 'equals' mode behavior
		if (step instanceof omdEquationNode) {
			const equalsAnchorX = (typeof step.getEqualsAnchorX === 'function') ? step.getEqualsAnchorX() : step.left.width;
			return this.alignPointX - equalsAnchorX;
		}
		if (step instanceof omdOperationDisplayNode) {
			const leftWidth = (typeof step.getLeftWidthForAlignment === 'function')
				? step.getLeftWidthForAlignment()
				: step.width / 2;
			const halfGap = (typeof step.gap === 'number' ? step.gap : 0) / 2;
			return this.alignPointX - (leftWidth + halfGap);
		}
		return (this.width - step.width) / 2;
	}

    /**
     * Updates the layout of the calculation block.
     * This method positions each equation vertically and aligns their
     * equals signs to the calculated alignment point.
     * @override
     */
	updateLayout() {
		const verticalPadding = 15 * this.getFontSize() / this.getRootFontSize();
		const visibleSteps = this.steps.filter(s => s.visible !== false);

		visibleSteps.forEach(step => step.updateLayout());

		this.alignPointX = this._calculateAlignmentPoint(visibleSteps);

		let yCurrent = 0;
		visibleSteps.forEach((step, index) => {
			const xOffset = this._computeStepXOffset(step);
			step.setPosition(xOffset, yCurrent);

			yCurrent += step.height;
			if (index < visibleSteps.length - 1) yCurrent += verticalPadding;
		});
	}

    /**
     * Creates an omdEquationSequenceNode instance from an array of strings.
     * @param {Array<string>} stepStrings - An array of strings, each representing a calculation step.
     * @returns {omdEquationSequenceNode} A new instance of omdEquationSequenceNode.
     */
    static fromStringArray(stepStrings) {
        const stepNodes = stepStrings.map(str => {
            const trimmedStr = str.trim();
            // If the string contains an equals sign, parse it as a full equation.
            if (trimmedStr.includes('=')) {
                return omdEquationNode.fromString(trimmedStr);
            }
            
            // If it doesn't contain an equals sign, it's not a valid equation step for a sequence.
            throw new Error(`Step string "${trimmedStr}" is not a valid equation for omdEquationSequenceNode.`);
        });
        return new omdEquationSequenceNode(stepNodes);
    }

    clone() {
        const clonedSteps = this.steps.map(step => step.clone());
        const clone = new omdEquationSequenceNode(clonedSteps);
        
        // The crucial step: link the clone to its origin (following the pattern from omdNode)
        clone.provenance.push(this.id);
        
        // The clone gets a fresh nodeMap, as its history is self-contained
        clone.nodeMap = new Map();
        clone.findAllNodes().forEach(node => clone.nodeMap.set(node.id, node));
        return clone;
    }

    /**
     * Converts the omdEquationSequenceNode to a math.js AST node.
     * Since sequences are containers, we return a custom representation.
     * @returns {Object} A custom AST node representing the sequence.
     */
    toMathJSNode() {
        const astNode = this.steps[this.steps.length-1].toMathJSNode();

        return astNode;
    }

    /**
     * Get the current step node
     * @returns {omdNode} The current step
     */
    getCurrentStep() {
        // No steps → no current step
        if (!this.steps || this.steps.length === 0) return null;

        // Prefer the bottom-most VISIBLE equation step, falling back gracefully
        let chosenIndex = -1;
        for (let i = this.steps.length - 1; i >= 0; i--) {
            const step = this.steps[i];
            if (!step) continue;
            // If visibility is explicitly false, skip
            if (step.visible === false) continue;
            // Prefer equation nodes when present
            if (step instanceof omdEquationNode || step.type === 'omdEquationNode') {
                chosenIndex = i;
                break;
            }
            // Remember last visible non-equation as a fallback if no equation exists
            if (chosenIndex === -1) chosenIndex = i;
        }

        if (chosenIndex === -1) {
            // If everything is hidden or invalid, fall back to the last step
            chosenIndex = this.steps.length - 1;
        }

        // Clamp and store
        if (chosenIndex < 0) chosenIndex = 0;
        if (chosenIndex >= this.steps.length) chosenIndex = this.steps.length - 1;
        this.currentStepIndex = chosenIndex;
        return this.steps[chosenIndex];
    }

    /**
     * Navigate to a specific step
     * @param {number} index - The step index to navigate to
     * @returns {boolean} Whether navigation was successful
     */
    navigateToStep(index) {
        if (index < 0 || index >= this.steps.length) {
            return false;
        }
        this.currentStepIndex = index;
        
        // Trigger any UI updates if needed
        if (window.refreshDisplayAndFilters) {
            window.refreshDisplayAndFilters();
        }
        
        return true;
    }

    /**
     * Navigate to the next step
     * @returns {boolean} Whether there was a next step
     */
    nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            
            // Trigger any UI updates if needed
            if (window.refreshDisplayAndFilters) {
                window.refreshDisplayAndFilters();
            }
            
            return true;
        }
        return false;
    }

    /**
     * Navigate to the previous step
     * @returns {boolean} Whether there was a previous step
     */
    previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            
            // Trigger any UI updates if needed
            if (window.refreshDisplayAndFilters) {
                window.refreshDisplayAndFilters();
            }
            
            return true;
        }
        return false;
    }

    /**
     * Get steps filtered by importance level
     * @param {number} maxImportance - Maximum importance level to include (0, 1, or 2)
     * @returns {Object[]} Array of objects containing step, description, importance, and index
     */
    getFilteredSteps(maxImportance) {
        const filteredSteps = [];
        
        this.steps.forEach((step, index) => {
            const importance = this.importanceLevels[index] !== undefined ? this.importanceLevels[index] :
                              (step.stepMark !== undefined ? step.stepMark : 0);
            
            if (importance <= maxImportance) {
                filteredSteps.push({
                    step: step,
                    description: this.stepDescriptions[index] || '',
                    importance: importance,
                    index: index
                });
            }
        });
        
        return filteredSteps;
    }

    /**
     * Renders only the current step
     * @returns {SVGElement} The current step's rendering
     */
    renderCurrentStep() {
        const currentStep = this.getCurrentStep();
        if (!currentStep) {
            // Return empty SVG group if no current step
            const emptyGroup = new jsvgGroup();
            return emptyGroup.svgObject;
        }
        
        // Create a temporary container to render just the current step
        const tempContainer = new jsvgGroup();
        
        // Compute dimensions and render the current step
        currentStep.computeDimensions();
        currentStep.updateLayout();
        const stepRendering = currentStep.render();
        
        tempContainer.addChild(stepRendering);
        return tempContainer.svgObject;
    }

    /**
     * Convert the entire sequence to a string
     * @returns {string} Multi-line string of all steps
     */
    toString() {
        if (this.steps.length === 0) {
            return '';
        }
        return this.steps.map((step, index) => {
            const description = this.stepDescriptions[index] ? ` (${this.stepDescriptions[index]})` : '';
            return `Step ${index + 1}: ${step.toString()}${description}`;
        }).join('\\n');
    }

    /**
     * Clear all steps from the sequence
     */
    clear() {
        // Remove all children
        this.steps.forEach(step => {
            this.removeChild(step);
        });
        
        // Clear arrays
        this.steps = [];
        this.stepDescriptions = [];
        this.importanceLevels = [];
        this.argumentNodeList.steps = [];
        this.currentStepIndex = 0;
        
        // Clear history
        this.clearSimplificationHistory();
        
        // Rebuild node map
        this.rebuildNodeMap();
        
        // Update dimensions
        this.computeDimensions();
        this.updateLayout();
        
        // Trigger any UI updates if needed
        if (window.refreshDisplayAndFilters) {
            window.refreshDisplayAndFilters();
        }
    }

    /**
     * Create a sequence from an array of expressions
     * @param {string[]} stepsArray - Array of expression strings
     * @returns {omdEquationSequenceNode} A new sequence node
     * @static
     */
    static fromSteps(stepsArray) {
        if (!Array.isArray(stepsArray)) {
            throw new Error('fromSteps requires an array of expression strings');
        }
        
        const sequence = new omdEquationSequenceNode([]);
        
        stepsArray.forEach((stepStr, index) => {
            const trimmedStr = stepStr.trim();
            let stepNode;
            
            // If the string contains an equals sign, parse it as an equation
            if (trimmedStr.includes('=')) {
                stepNode = omdEquationNode.fromString(trimmedStr);
            } else {
                // Otherwise, parse it as a general expression
                if (!window.math) {
                    throw new Error("Math.js is required for parsing expressions");
                }
                
                const ast = window.math.parse(trimmedStr);
                const NodeType = getNodeForAST(ast);
                stepNode = new NodeType(ast);
            }
            
            // Add the step with default importance
            sequence.addStep(stepNode, {
                stepMark: 0,  // Default to major step
                description: ''
            });
        });
        
        return sequence;
    }

    /**
     * Converts an expression string into a proper omdNode.
     * @param {string} str - The expression string.
     * @returns {omdNode} The corresponding node.
     * @private
     */
    _stringToNode(str) {
        const trimmedStr = str.trim();
        if (trimmedStr.includes('=')) {
            return omdEquationNode.fromString(trimmedStr);
        }

        if (!window.math) {
            throw new Error("Math.js is required for parsing expressions");
        }

        const ast = window.math.parse(trimmedStr);
        const NodeType = getNodeForAST(ast);
        return new NodeType(ast);
    }

    show() {
        super.show();
        if (this.layoutManager) {
            this.layoutManager.updateVisualVisibility();
        }
    }

    hide() {
        super.hide();
        if (this.layoutManager) {
            this.layoutManager.updateVisualVisibility();
        }
    }

    /**
     * Updates visibility of multiple steps at once
     * @param {Function} visibilityPredicate Function that takes a step and returns true if it should be visible
     */
    updateStepsVisibility(visibilityPredicate) {
        // Safety check - ensure steps array exists and is properly initialized
        if (!this.steps || !Array.isArray(this.steps)) {
            return;
        }

        this.steps.forEach(step => {
            if (!step) return; // Skip null/undefined steps
            
            if (visibilityPredicate(step)) {
                step.visible = true;
                if (step.svgObject) step.svgObject.style.display = '';
            } else {
                step.visible = false;
                if (step.svgObject) step.svgObject.style.display = 'none';
            }

            // Apply font weight based on stepMark
            const weight = getFontWeight(step.stepMark ?? 0);
            if (step.svgObject) {
                step.svgObject.style.fontWeight = weight.toString();
            }
        });

        if (this.layoutManager) {
            this.layoutManager.updateVisualVisibility();
        }
        
        this.computeDimensions();
        this.updateLayout();
    }
}
