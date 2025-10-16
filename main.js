/**
 * OMD Testing Environment - Condensed version using the new library structure
 */
import {
    omdDisplay,
    omdEquationSequenceNode,
    omdEquationStack,
    omdConstantNode,
    omdEquationNode,
    omdNodeOverlay,
    omdNodeOverlayPresets
} from './omd/core/index.js';
import { jsvgLayoutGroup, jsvgRect} from '@teachinglab/jsvg';
// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
        // Create renderers for split panes
        const renderer = new omdDisplay(document.getElementById('equationPane'), {
        fontSize: 32,
        centerContent: true,
        topMargin: 40
    });
        const visualRenderer = new omdDisplay(document.getElementById('visualPane'), {
            fontSize: 16,
            centerContent: true,
            topMargin: 20
        });
        // Layout group to stack visuals vertically in the right pane
        const visualLayout = new jsvgLayoutGroup();
        visualLayout.setSpacer(12);
        visualRenderer.svg.addChild(visualLayout);
    
    // UI Elements
    const elements = {
        expressionInput: document.getElementById('expressionInput'),
        operationValue: document.getElementById('operationValueInput'),
        functionName: document.getElementById('functionNameInput'),
        variablesInput: document.getElementById('variablesInput'),
        statusMessage: document.getElementById('statusMessage'),
        historyList: document.getElementById('historyList'),
        autoSimplify: document.getElementById('autoSimplifyCheckbox'),
        level0: document.getElementById('level0'),
        level1: document.getElementById('level1'),
        level2: document.getElementById('level2'),
        // Render To controls
        renderToPanel: document.getElementById('renderToPanel'),
        renderToType: document.getElementById('renderToType'),
        renderToSide: document.getElementById('renderToSide'),
        rtXMin: document.getElementById('rtXMin'),
        rtXMax: document.getElementById('rtXMax'),
        rtYMin: document.getElementById('rtYMin'),
        rtYMax: document.getElementById('rtYMax'),
        rtStep: document.getElementById('rtStep'),
        visualRenderer,
        visualLayout
    };
    
    // Status display helper
    const showStatus = (message, type = 'success') => {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = type;
        elements.statusMessage.style.display = 'block';
        if (type === 'success') setTimeout(() => elements.statusMessage.style.display = 'none', 6000);
    };
    
    // Render expression
    const renderExpression = () => {
        console.group('Render Expression Debug');
        try {
            const expression = elements.expressionInput.value.trim();
            console.debug('[render] Clicked. Raw expression:', expression);
            console.debug('[render] window.math present:', typeof window.math !== 'undefined');
            if (typeof window.math !== 'undefined') {
                try {
                    const test = window.math.parse('1+1');
                    console.debug('[render] math.js sanity parse ok:', !!test);
                } catch (e) {
                    console.warn('[render] math.js parse test failed:', e);
                }
            } else {
                console.warn('[render] window.math is undefined. math.js may not be loaded yet.');
            }

            if (!expression) {
                console.warn('[render] Empty expression. Aborting render.');
                showStatus('Enter an equation (e.g., 3*x+2=14)', 'warning');
                return;
            }

            let node;
            try {
                node = omdEquationNode.fromString(expression);
            } catch (parseErr) {
                console.error('[render] fromString parse error:', parseErr);
                showStatus(`Parse error: ${parseErr.message}. Tip: Use explicit multiplication like 3*x.`, 'error');
                return;
            }
            console.debug('[render] Created omdEquationNode. Left/Right types:', node?.left?.constructor?.name, node?.right?.constructor?.name);

            const sequence = new omdEquationStack([node], { stepVisualizer: true });
            console.debug('[render] Created omdEquationStack. Sequence type:', sequence?.getSequence()?.constructor?.name);

            // Clear visual pane when re-rendering main equation
            visualRenderer.clear();

            const renderedNode = renderer.render(sequence);
            // Ensure it's visible and centered in the left pane
            try {
                if (renderer.centerNode) renderer.centerNode();
                // Avoid overriding centering by not resetting content position
            } catch (sizingErr) {
                console.warn('[render] sizing fallback failed:', sizingErr);
            }
            console.debug('[render] Renderer returned node type:', renderedNode?.constructor?.name);
            console.debug('[render] Display node dims (w x h):', renderer.getCurrentNode()?.width, 'x', renderer.getCurrentNode()?.height);

            elements.statusMessage.style.display = 'none';
        } catch (error) {
            console.error('Render error:', error);
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            console.groupEnd();
        }
    };

    // Render To (graph/table/hanger)
    const renderToOutput = async () => {
        try {
            const node = renderer.getCurrentNode()?.getSequence?.()?.getCurrentEquation?.() || null;
            if (!node || !(node.left && node.right)) {
                return showStatus('Render To requires a single equation rendered first.', 'warning');
            }

            const type = elements.renderToType.value;
            const side = elements.renderToSide.value;
            const xMin = parseFloat(elements.rtXMin.value);
            const xMax = parseFloat(elements.rtXMax.value);
            const yMin = parseFloat(elements.rtYMin.value);
            const yMax = parseFloat(elements.rtYMax.value);
            const stepSize = parseFloat(elements.rtStep.value) || 1;

            const json = node.renderTo(type, { side, xMin, xMax, yMin, yMax, stepSize });

            // Create and render the visualization in the right pane
            let visInstance;
            if (json.omdType === 'coordinatePlane') {
                const { omdCoordinatePlane } = await import('./src/omdCoordinatePlane.js');
                visInstance = new omdCoordinatePlane();
                visInstance.loadFromJSON(json);
            } else if (json.omdType === 'table') {
                const { omdTable } = await import('./src/omdTable.js');
                visInstance = new omdTable();
                visInstance.loadFromJSON(json);
            } else if (json.omdType === 'balanceHanger') {
                const { omdBalanceHanger } = await import('./src/omdBalanceHanger.js');
                visInstance = new omdBalanceHanger();
                visInstance.loadFromJSON(json);
            } else {
                return showStatus('Unsupported visualization type.', 'error');
            }

            // Add to vertical layout and size the right pane to fit all visuals
            const pad = 10;
            elements.visualLayout.addChild(visInstance);
            elements.visualLayout.doVerticalLayout();
            const layoutW = elements.visualLayout.width;
            const layoutH = elements.visualLayout.height;
            // Center within the pane width, not just content width
            const paneW = visualRenderer.container?.offsetWidth || (layoutW + pad * 2);
            const viewW = Math.max(paneW, layoutW + pad * 2);
            const viewH = layoutH + pad * 2;
            visualRenderer.svg.setViewbox(viewW, viewH);
            visualRenderer.svg.setWidthAndHeight(viewW, viewH);
            // Center the layout horizontally inside the pane/view
            const layoutX = Math.max(pad, (paneW - layoutW) / 2);
            elements.visualLayout.setPosition(layoutX, pad);

            showStatus('Rendered output below.', 'success');
        } catch (err) {
            console.error('Render To error:', err);
            showStatus(`Render To error: ${err.message}`, 'error');
        }
    };
    
    // Simplification
    const simplify = async (all = false) => {
        const node = renderer.getCurrentNode().getSequence();
        if (!node) return showStatus('No expression to simplify', 'warning');
        
        if (!(node instanceof omdEquationSequenceNode)) return;

        const result = all ? node.simplifyAll() : node.simplify();
        showStatus(result.message, result.success ? 'success' : 'warning');
        
        // Update history
        const history = node.getSimplificationHistory();
        elements.historyList.innerHTML = history.length ? 
            history.map((entry, i) => 
                `<div style="margin-bottom: 8px;">
                    <strong>${i + 1}. ${entry.name}</strong><br>
                    <span style="color: #666;">${entry.message}</span>
                </div>`
            ).join('') : 'No simplifications performed yet.';
    };
    
    // Equation operations
    const applyOperation = (op) => {
        const node = renderer.getCurrentNode().getSequence();
        if (!(node instanceof omdEquationSequenceNode)) 
            return showStatus('Expression must be an equation', 'warning');
        
        const value = elements.operationValue.value.trim();
        if (!value) return showStatus('Enter a value', 'error');
        
        const parsedValue = isNaN(value) ? window.math.parse(value) : parseFloat(value);
        
        const opMap = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
        node.applyEquationOperation(parsedValue, opMap[op]);
        node.initialize();
        
        showStatus(`${op === '+' ? 'Added' : op === '-' ? 'Subtracted' : 
                     op === '*' ? 'Multiplied' : 'Divided'} ${value}`, 'success');
        
        if (elements.autoSimplify.checked) simplify(true);
    };
    
    // Function application
    const applyFunction = () => {
        const node = renderer.getCurrentNode().getSequence();
        const funcName = elements.functionName.value.trim().toLowerCase();
        
        if (!funcName) return showStatus('Enter a function name', 'error');
        if (!(node instanceof omdEquationSequenceNode)) 
            return showStatus('Expression must be an equation', 'error');
        
        node.applyEquationFunction(funcName);
        node.initialize();
        showStatus(`Applied ${funcName} to both sides`, 'success');
        
        if (elements.autoSimplify.checked) simplify(true);
    };
    
    // Evaluate expression
    const evaluateExpression = () => {
        const node = renderer.getCurrentNode().getSequence();

        const variablesText = elements.variablesInput.value.trim();
        const variables = {};
        if (variablesText) {
            variablesText.split(',').forEach(pair => {
                const parts = pair.trim().split('=');
                if (parts.length === 2) {
                    const key = parts[0].trim();
                    const value = parseFloat(parts[1].trim());
                    if (!isNaN(value)) {
                        variables[key] = value;
                    }
                }
            });
        }
        // Call the library's evaluate method
        node.evaluate(variables);
        
        showStatus('Evaluated! Check the console for the evaluation result.', 'success');
    };
    
    // Step filtering
    // Filtering is now handled by the library; only level 0 steps are shown by default.
    // If you want to support UI filtering, use node.setFilterLevel(level) in your event listeners.
    
    // Event listeners
    document.getElementById('renderButton').onclick = renderExpression;
    document.getElementById('simplifyButton').onclick = () => simplify();
    document.getElementById('simplifyAllButton').onclick = () => simplify(true);
    document.getElementById('addBothSidesButton').onclick = () => applyOperation('+');
    document.getElementById('subtractBothSidesButton').onclick = () => applyOperation('-');
    document.getElementById('multiplyBothSidesButton').onclick = () => applyOperation('*');
    document.getElementById('divideBothSidesButton').onclick = () => applyOperation('/');
    document.getElementById('applyFunctionButton').onclick = applyFunction;
    document.getElementById('evaluateButton').onclick = evaluateExpression;
    document.getElementById('renderToButton').onclick = renderToOutput;
    document.getElementById('clearRenderToButton').onclick = () => {
        // Clear stacked visuals
        try { elements.visualLayout.removeAllChildren(); } catch(_) {}
        // Resize right pane to a minimal size
        const vp = visualRenderer.container;
        const initW = Math.max(300, vp?.offsetWidth || 300);
        const initH = 120;
        visualRenderer.svg.setViewbox(initW, initH);
        visualRenderer.svg.setWidthAndHeight(initW, initH);

        // Resize back left pane to fit only the main equation node
        const cur = renderer.getCurrentNode();
        if (cur && cur.width && cur.height) {
            const pad = 12;
            const w = cur.width + pad * 2;
            const h = cur.height + pad * 2;
            renderer.svg.setViewbox(w, h);
            renderer.svg.setWidthAndHeight(w, h);
            if (renderer.centerNode) renderer.centerNode();
        }
    };
    
    // Overlay control buttons
    document.getElementById('hideLeftButton').onclick = () => window.demoOverlays.hideLeft();
    document.getElementById('hideRightButton').onclick = () => window.demoOverlays.hideRight();
    document.getElementById('clearOverlaysButton').onclick = () => window.demoOverlays.clearAll();
    
    
    [elements.level0, elements.level1, elements.level2].forEach(cb => {
        cb.addEventListener('change', () => {
            const node = renderer.getCurrentNode().getSequence();
            if (!node) return;
            
            // Get which levels are checked
            const checkedLevels = [];
            if (elements.level0.checked) checkedLevels.push(0);
            if (elements.level1.checked) checkedLevels.push(1);
            if (elements.level2.checked) checkedLevels.push(2);
            
            // Apply filter to show all checked levels
            if (typeof node.setFilterLevels === 'function') {
                node.setFilterLevels(checkedLevels);
            } else {
                // Fallback to manual filtering
                node.updateStepsVisibility(step => {
                    const stepLevel = step.stepMark ?? 0;
                    return checkedLevels.includes(stepLevel);
                });
            }
            
            renderer.centerNode();
        });
    });

    // Set up overlay button event listeners (if buttons exist)
    const overlayButtons = {
        hideLeftBtn: () => window.demoOverlays.hideLeft(),
        hideRightBtn: () => window.demoOverlays.hideRight(),
        clearAllBtn: () => window.demoOverlays.clearAll()
    };
    
    // Add event listeners for overlay buttons if they exist
    Object.entries(overlayButtons).forEach(([buttonId, handler]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = handler;
        }
    });
    
    // Global refresh function for sequence nodes
    window.refreshDisplayAndFilters = () => {
        renderer.centerNode();
    };
    
    // Add overlay functionality for hiding parts of equations
    window.demoOverlays = {
        // Hide left side of equation (with text input capability)
        hideLeft: () => {
            const node = renderer.getCurrentNode().getSequence();
            if (node.steps && node.steps.length > 0) {
                const lastStep = node.steps[node.steps.length - 1]; // Get bottommost equation
                if (lastStep && lastStep.left) {
                    console.log('Left side node structure:', {
                        constructor: lastStep.left.constructor.name,
                        text: lastStep.left.text,
                        toString: lastStep.left.toString(),
                        width: lastStep.left.width,
                        height: lastStep.left.height,
                        hasBackRect: !!lastStep.left.backRect,
                        children: lastStep.left.childList ? lastStep.left.childList.length : 'no children'
                    });
                    
                    // Create hiding overlay with text input enabled (empty text by default)
                    const overlay = omdNodeOverlayPresets.createHidingOverlay(true, "");
                    overlay.coverNode(lastStep.left).show(true);
                    console.log('Left side hidden with editable text overlay');
                    return overlay;
                }
            }
            console.warn('No left side found to hide');
        },
        
        // Hide right side of equation (with text input capability)
        hideRight: () => {
            const node = renderer.getCurrentNode().getSequence();
            if (node.steps && node.steps.length > 0) {
                const lastStep = node.steps[node.steps.length - 1]; // Get bottommost equation
                if (lastStep && lastStep.right) {
                    // Create hiding overlay with text input enabled (empty text by default)
                    const overlay = omdNodeOverlayPresets.createHidingOverlay(true, "");
                    overlay.coverNode(lastStep.right).show(true);
                    console.log('Right side hidden with editable text overlay');
                    return overlay;
                }
            }
            console.warn('No right side found to hide');
        },
        
        // Clear all overlays
        clearAll: () => {
            const node = renderer.getCurrentNode().getSequence();
            let overlayCount = 0;
            
            // Recursively find and remove overlays from the node hierarchy
            const removeOverlaysFromNode = (targetNode) => {
                if (!targetNode || !targetNode.childList) return;
                
                const overlays = targetNode.childList.filter(child => 
                    child.constructor.name === 'omdNodeOverlay'
                );
                
                overlays.forEach(overlay => {
                    overlayCount++;
                    if (overlay.destroy && typeof overlay.destroy === 'function') {
                        // The overlay's destroy() method handles all cleanup including popup removal
                        overlay.destroy();
                    }
                });
                
                // Recursively check child nodes
                targetNode.childList.forEach(child => {
                    removeOverlaysFromNode(child);
                });
            };
            
            removeOverlaysFromNode(node);
            console.log(`Cleared ${overlayCount} overlays`);
        }
    };
    
    console.info('OMD Testing Environment loaded. Use window.demoOverlays.hideLeft() or window.demoOverlays.hideRight() to hide equation parts.');
    window.addEventListener('error', (e) => {
        console.error('[global] window.onerror:', e?.message, e?.error);
    });
    
});