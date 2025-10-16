import { getRulesForNode } from './simplificationRules.js';
import { setSimplifyStep } from '../nodes/omdNode.js';

/**
 * Finds all simplification opportunities within an expression tree.
 * Now much faster - only checks relevant rules for each node type!
 * @param {omdNode} rootNode - The root of the expression tree to search.
 * @returns {Array<Object>} Array of simplification opportunities.
 */
export function findSimplificationOpportunities(rootNode) {
    const opportunities = [];
    const visitedNodes = new Set();

    function traverse(node) {
        if (!node || visitedNodes.has(node)) return;
        visitedNodes.add(node);

        // Traverse children first (depth-first)
        if (node.childList && node.childList.length > 0) {

            for (const child of node.childList) {
                traverse(child);
            }
        }

        // Only check rules that apply to this node type
        const relevantRules = getRulesForNode(node);

        
        for (const rule of relevantRules) {
            const ruleData = rule.canApply(node);
            if (ruleData) {

                opportunities.push({ node, rule, ruleData });
                break; // Only apply the first matching rule
            }
        }
    }

    traverse(rootNode);
    return opportunities;
}

export function simplifyStep(rootNode) {
    let foldedCount = 0;
    let newRoot = rootNode;
    let historyEntry = null;

    // Find all simplification opportunities
    const opportunities = findSimplificationOpportunities(rootNode);

    if (opportunities.length > 0) {
        // Apply the first opportunity
        const opportunity = opportunities[0];
        
        try {
            const result = opportunity.rule.apply(opportunity.node, opportunity.ruleData, rootNode);
            
            if (result && result.success && result.newRoot) {
                newRoot = result.newRoot;
                foldedCount = 1;
                historyEntry = result.historyEntry || {
                    name: opportunity.rule.name,
                    affectedNodes: [rootNode.id],
                    message: `Applied ${opportunity.rule.name}`
                };
            }
        } catch (error) {
            console.error(`Error applying rule '${opportunity.rule.name}':`, error);
        }
    }

    return { newRoot, foldedCount, historyEntry };
}

/**
 * Simplifies an entire mathematical expression tree by repeatedly applying rules.
 * @param {omdNode} rootNode - The root node of the expression to simplify.
 * @returns {{foldedCount: number, newRoot: omdNode}}
 */
export function simplifyExpression(rootNode) {
    let totalFolded = 0;
    let currentRoot = rootNode;
    let iterations = 0;
    const maxIterations = 50; // Prevent infinite loops

    while (iterations < maxIterations) {
        const { foldedCount, newRoot } = simplifyStep(currentRoot);

        if (foldedCount === 0) {
            break; // No more simplifications possible
        }

        currentRoot = newRoot;
        totalFolded += foldedCount;
        iterations++;
    }

    // Return a fresh clone if any simplifications occurred
    if (totalFolded > 0) {
        const cleanRoot = currentRoot.clone();
        cleanRoot.setFontSize(rootNode.getFontSize());
        return { foldedCount: totalFolded, newRoot: cleanRoot };
    }

    return { foldedCount: totalFolded, newRoot: currentRoot };
}

/**
 * Debug function to show which rules are available for a node
 * @param {omdNode} node - The node to check
 * @returns {Array<string>} Array of rule names
 */
export function getAvailableRulesForNode(node) {
    const rules = getRulesForNode(node);
    return rules.map(rule => rule.name);
}

/**
 * Debug function to show which rules can be applied to a node
 * @param {omdNode} node - The node to check  
 * @returns {Array<string>} Array of applicable rule names
 */
export function getApplicableRulesForNode(node) {
    const rules = getRulesForNode(node);
    const applicable = [];
    
    for (const rule of rules) {
        try {
            const ruleData = rule.canApply(node);
            if (ruleData) {
                applicable.push(rule.name);
            }
        } catch (error) {
        }
    }
    
    return applicable;
}

setSimplifyStep(simplifyStep);