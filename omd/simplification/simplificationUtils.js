import { omdConstantNode } from "../nodes/omdConstantNode.js";
import { omdBinaryExpressionNode } from "../nodes/omdBinaryExpressionNode.js";
import { omdNode } from "../nodes/omdNode.js";
import { omdRationalNode } from "../nodes/omdRationalNode.js";
import { omdUnaryExpressionNode } from "../nodes/omdUnaryExpressionNode.js";
import { omdPowerNode } from "../nodes/omdPowerNode.js";
import { omdVariableNode } from "../nodes/omdVariableNode.js";
import { SimplificationEngine } from "./omdSimplificationEngine.js";
import { getMultiplicationSymbol } from '../config/omdConfigManager.js';

// ===== MANUAL PROVENANCE HELPER FUNCTIONS =====

/**
 * Manually applies provenance from source nodes to a target node
 * @param {omdNode} targetNode - The node to apply provenance to
 * @param {...omdNode} sourceNodes - The source nodes to collect provenance from
 * @returns {omdNode} The target node with applied provenance
 */
export function applyProvenance(targetNode, ...sourceNodes) {
    if (!targetNode) return targetNode;
    
    targetNode.provenance = targetNode.provenance || [];
    
    for (const sourceNode of sourceNodes) {
        if (!sourceNode) continue;
        
        // Add the source node's ID
        if (sourceNode.id && !targetNode.provenance.includes(sourceNode.id)) {
            targetNode.provenance.push(sourceNode.id);
        }
        
        // Add all of the source node's provenance
        if (sourceNode.provenance && Array.isArray(sourceNode.provenance)) {
            sourceNode.provenance.forEach(id => {
                if (id && !targetNode.provenance.includes(id)) {
                    targetNode.provenance.push(id);
                }
            });
        }
        
        // Recursively collect from children
        collectChildIds(sourceNode, targetNode.provenance);
    }
    
    return targetNode;
}

/**
 * Recursively collects IDs from child nodes
 * @param {omdNode} node - The node to collect from
 * @param {Array} idSet - The array to add IDs to
 */
function collectChildIds(node, idSet) {
    if (!node || !idSet) return;
    
    // Visit common child properties
    const childProps = ['left', 'right', 'base', 'exponent', 'argument', 'expression', 
                       'numerator', 'denominator', 'content'];
    
    for (const prop of childProps) {
        const child = node[prop];
        if (child && child.id && !idSet.includes(child.id)) {
            idSet.push(child.id);
            // Recursively collect from grandchildren
            collectChildIds(child, idSet);
        }
    }
    
    // Handle array properties like args
    if (node.args && Array.isArray(node.args)) {
        node.args.forEach(arg => {
            if (arg && arg.id && !idSet.includes(arg.id)) {
                idSet.push(arg.id);
                collectChildIds(arg, idSet);
            }
        });
    }
}

/**
 * Calculates the greatest common divisor of two numbers.
 * @param {number} a
 * @param {number} b
 * @returns {number} The GCD of a and b.
 */
export function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while(b) {
        [a, b] = [b, a % b];
    }
    return a;
}

/**
 * Applies a mathematical operation to two numbers.
 * @param {string} op - The operator ('add', 'subtract', 'multiply', 'divide', or symbolic representation).
 * @param {number} left - The left operand.
 * @param {number} right - The right operand.
 * @returns {number|null} The result of the operation, or null if the operation is invalid (e.g., division by zero).
 */
export function _applyOperator(op, left, right) {
    switch (op) {
        case 'add':
            return left + right;
        case 'subtract':
            return left - right;
        case 'multiply':
            return left * right;
        case 'divide':
            return right !== 0 ? left / right : null;
        default:
            return null;
    }
}

/**
 * Creates a new, fully initialized `omdConstantNode`.
 * @param {number} value - The numerical value for the constant.
 * @param {number} fontSize - The font size to render the node with.
 * @returns {omdConstantNode} The newly created constant node.
 */
export function createConstantNode(value, fontSize) {
    const newConstantAST = { type: 'ConstantNode', value: value, clone: function () { return { ...this }; } };
    const newConstantNode = new omdConstantNode(newConstantAST);
    newConstantNode.setFontSize(fontSize);
    newConstantNode.initialize();
    return newConstantNode;
}

/**
 * Helper to safely replace an old node with a new node in the tree.
 * Handles both root node replacement and child node replacement.
 * @param {omdNode} oldNode - The node to be replaced.
 * @param {omdNode} newNode - The new node to insert.
 * @param {omdNode} currentRoot - The current root of the entire expression tree.
 * @returns {{success: boolean, newRoot: omdNode}} The result of the operation.
 */
export function _replaceNodeInTree(oldNode, newNode, currentRoot) {
    if (oldNode === currentRoot) {
        return { success: true, newRoot: newNode };
    }
    
    // This ensures layout updates are triggered during the replacement itself to maintain visual consistency.
    const success = oldNode.replaceWith(newNode, { updateLayout: true });

    // Update the astNodeData for the new node and propagate changes upwards
    if (success) {
        newNode.astNodeData = newNode.toMathJSNode();
        let current = newNode.parent;
        while (current) {
            // Only update astNodeData for actual omdNodes
            if (current instanceof omdNode) {
                current.astNodeData = current.toMathJSNode();
            } else {
                // Stop traversing if we encounter a non-omdNode parent (like jsvgContainer)
                break;
            }
            current = current.parent;
        }
    }

    return { success: success, newRoot: currentRoot };
}

/**
 * Extracts all leaf nodes (constants and variables) from an expression tree
 * for granular provenance tracking
 */
export function extractLeafNodes(node) {
    const leafNodes = [];
    
    function traverse(n) {
        if (!n) return;
        
        // If it's a leaf node (constant or variable), add it
        if (n.type === 'omdConstantNode' || 
            n.type === 'omdVariableNode') {
            leafNodes.push(n);
            return;
        }
        
        // Recursively traverse child nodes
        if (n.left) traverse(n.left);
        if (n.right) traverse(n.right);
        if (n.base) traverse(n.base);
        if (n.exponent) traverse(n.exponent);
        if (n.argument) traverse(n.argument);
        if (n.expression) traverse(n.expression);
        if (n.numerator) traverse(n.numerator);
        if (n.denominator) traverse(n.denominator);
    }
    
    traverse(node);
    return leafNodes;
}

/**
 * Recursively flattens a tree of additions and subtractions into a single list of terms.
 * Each term is an object containing the node and its sign (1 for addition, -1 for subtraction).
 * For example, `a - (b + c)` becomes `[{node: a, sign: 1}, {node: b, sign: -1}, {node: c, sign: -1}]`.
 * @param {omdNode} node - The current node in the expression tree to process.
 * @param {Array<Object>} terms - An array to accumulate the flattened terms. This array is modified by the function.
 */
export function flattenSum(node, terms) {
    const op = node.operation;
    if (node.type === 'omdBinaryExpressionNode' && (op === 'add' || op === '+')) {
        flattenSum(node.left, terms);
        flattenSum(node.right, terms);
    } else if (node.type === 'omdBinaryExpressionNode' && (op === 'subtract' || op === '-')) {
        flattenSum(node.left, terms);
        const rightTerms = [];
        flattenSum(node.right, rightTerms);
        rightTerms.forEach(t => { t.sign *= -1; }); // Invert the sign for all terms on the right of a minus.
        terms.push(...rightTerms);
    } else {
        // This is a leaf node in the sum (could be a variable, a multiplication, etc.)
        // Extract leaf nodes for granular provenance tracking
        const leafNodes = extractLeafNodes(node);
        terms.push({ 
            node: node, 
            sign: 1,
            leafNodes: leafNodes // Add leaf nodes for provenance
        });
    }
}

export function buildSumTree(terms, fontSize) {
    if (terms.length === 0) return createConstantNode(0, fontSize);

    // Sort terms to handle subtractions gracefully
    terms.sort((a, b) => b.sign - a.sign);
    
    // If the expression starts with a negative term (e.g., -a + b), we prepend a '0'
    if (terms.length > 1 && terms[0].sign === -1) {
        if (terms[0].node.type === 'omdConstantNode') {
            const first = terms.shift();
            first.sign = 1; 
            terms.push(first);
        } else {
            terms.unshift({node: createConstantNode(0, fontSize), sign: 1});
        }
    }

    // Build the tree from left to right
    let firstTerm = terms.shift();
    let currentTree = firstTerm.node;
    
    // Ensure the first node is properly formed - clone it if needed
    if (!currentTree || typeof currentTree.updateLayoutUpwards !== 'function') {
        const originalId = currentTree.id;
        currentTree = currentTree.clone();
        currentTree.provenance = currentTree.provenance || [];
        if (originalId && !currentTree.provenance.includes(originalId)) {
            currentTree.provenance.push(originalId);
        }
        currentTree.setFontSize(fontSize);
        currentTree.initialize();
    }
    
    // If there's only one term, return it directly (it should already have correct provenance)
    if (terms.length === 0) {
        return currentTree;
    }
    
    while (terms.length > 0) {
        const term = terms.shift();
        const opSymbol = term.sign === 1 ? '+' : '-';
        const opFn = term.sign === 1 ? 'add' : 'subtract';

        let termNode = term.node;
        
        if (!termNode || typeof termNode.updateLayoutUpwards !== 'function') {
            const originalId = termNode.id;
            termNode = termNode.clone();
            termNode.provenance = termNode.provenance || [];
            if (originalId && !termNode.provenance.includes(originalId)) {
                termNode.provenance.push(originalId);
            }
            termNode.setFontSize(fontSize);
            termNode.initialize();
        }

        // Preserve expansion provenance metadata if it exists
        if (term.expansionProvenance) {
            // Add expansion metadata to the term node for later reference
            termNode.expansionProvenance = termNode.expansionProvenance || [];
            termNode.expansionProvenance.push(term.expansionProvenance);
            
            // Ensure all expansion source IDs are in the term's provenance
            [term.expansionProvenance.leftSource, term.expansionProvenance.rightSource, term.expansionProvenance.originalMultiplication].forEach(id => {
                if (id && !termNode.provenance.includes(id)) {
                    termNode.provenance.push(id);
                }
            });
        }

        // Create new binary expression
        const newAST = {
            type: 'OperatorNode',
            op: opSymbol,
            fn: opFn,
            args: [currentTree.toMathJSNode(), termNode.toMathJSNode()],
            clone: function () { return { ...this, args: this.args.map(arg => arg.clone()) }; }
        };
        
        const newNode = new omdBinaryExpressionNode(newAST);
        newNode.setFontSize(fontSize);
        newNode.initialize();
        
        // Binary operation nodes should inherit provenance from their operands
        // This allows tracking which terms contributed to the final expression
        const leftProvenance = currentTree.provenance || [];
        const rightProvenance = termNode.provenance || [];
        
        // Add provenance from both left and right operands
        [...leftProvenance, ...rightProvenance, currentTree.id, termNode.id].forEach(id => {
            if (id && !newNode.provenance.includes(id)) {
                newNode.provenance.push(id);
            }
        });
        
        // Preserve expansion provenance metadata in the binary expression
        if (termNode.expansionProvenance || currentTree.expansionProvenance) {
            newNode.expansionProvenance = newNode.expansionProvenance || [];
            if (termNode.expansionProvenance) {
                newNode.expansionProvenance.push(...termNode.expansionProvenance);
            }
            if (currentTree.expansionProvenance) {
                newNode.expansionProvenance.push(...currentTree.expansionProvenance);
            }
        }
        
        currentTree = newNode;
    }
    
    return currentTree;
}

/**
 * Creates a rational node (fraction) safely with proper initialization
 * @param {number} numerator - The numerator value
 * @param {number} denominator - The denominator value  
 * @param {number} fontSize - The font size for the node
 * @returns {omdNode} A properly initialized rational or constant node
 */
export function createRationalNode(numerator, denominator, fontSize) {
    // If denominator is 1, just return a constant
    if (denominator === 1) {
        return createConstantNode(numerator, fontSize);
    }
    
    // Create AST for the rational node
    const ast = {
        type: 'OperatorNode', 
        op: '/', 
        fn: 'divide',
        args: [
            { type: 'ConstantNode', value: Math.abs(numerator), clone: function() { return {...this}; } },
            { type: 'ConstantNode', value: denominator, clone: function() { return {...this}; } }
        ],
        clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
    };
    
    let node = new omdRationalNode(ast);
    
    // Handle negative fractions by wrapping in unary minus
    if (numerator < 0) {
        const unaryAST = {
            type: 'OperatorNode', 
            op: '-', 
            fn: 'unaryMinus',
            args: [node.toMathJSNode()],
            clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
        };
        node = new omdUnaryExpressionNode(unaryAST);
    }
    
    node.setFontSize(fontSize);
    node.initialize();
    
    return node;
}

/**
 * Converts any omdNode into a human-readable string representation.
 * @param {omdNode} node - The node to convert.
 * @returns {string} A string representation of the node.
 */
export function nodeToString(node) {
    if (!node) return '';

    // Operation name to symbol mapping
    const operationSymbols = {
        'add': '+',
        'subtract': '-',
        'multiply': getMultiplicationSymbol(),
        'divide': '÷',
        'unaryMinus': '-',
        'unaryPlus': '+',
        'pow': '^'
    };

    // Check for a getValue method (constants) - but only if actually constant
    if (typeof node.getValue === 'function' && node.isConstant && node.isConstant()) {
        return node.getValue().toString();
    }

    // Check for a name property (variables)
    if (node.name) {
        return node.name;
    }

    // Handle binary expressions recursively
    if (node.type === 'omdBinaryExpressionNode') {
        const left = nodeToString(node.left);
        const right = nodeToString(node.right);
        // Handle cases where node.op might be null (implicit multiplication)
        let op;
        if (node.op && node.op.opName) {
            op = operationSymbols[node.op.opName] || node.op.opName;
        } else if (node.operation) {
            op = operationSymbols[node.operation] || node.operation;
        } else {
            // For implicit multiplication, use empty string
            op = ''; // This handles cases like "2x" where it's implicit multiplication
        }
        // Only add parentheses for explicit operations, not implicit multiplication
        return op ? `${left} ${op} ${right}` : `${left}${right}`;
    }

    // Handle unary expressions
    if (node.type === 'omdUnaryExpressionNode') {
        const arg = nodeToString(node.argument);
        let op;
        if (node.op && node.op.opName) {
            op = operationSymbols[node.op.opName] || node.op.opName;
        } else if (node.operation) {
            op = operationSymbols[node.operation] || node.operation;
        } else {
            op = '-'; // Default for unary
        }
        // Only add parentheses around the argument if it's a complex expression
        if (arg.includes(' ') || arg.includes('+') || arg.includes('-') || arg.includes(getMultiplicationSymbol()) || arg.includes('÷')) {
            return `${op}(${arg})`;
        }
        return `${op}${arg}`;
    }
    
    // Handle rational nodes
    if (node.type === 'omdRationalNode') {
        const num = nodeToString(node.numerator);
        const den = nodeToString(node.denominator);
        return `(${num}/${den})`;
    }

    // Handle parenthesis nodes
    if (node.type === 'omdParenthesisNode') {
        const content = nodeToString(node.content || node.expression);
        // Only add parentheses if the content doesn't already start and end with them
        if (content.startsWith('(') && content.endsWith(')')) {
            return content;
        }
        return `(${content})`;
    }

    // Handle power nodes
    if (node.type === 'omdPowerNode') {
        const base = nodeToString(node.base);
        const exp = nodeToString(node.exponent);
        return `${base}^${exp}`;
    }

    // Handle sqrt nodes
    if (node.type === 'omdSqrtNode') {
        const arg = nodeToString(node.argument);
        return `√(${arg})`;
    }

    // Handle function nodes
    if (node.type === 'omdFunctionNode') {
        const functionName = node.functionName || node.name || 'f';
        if (node.argNodes && node.argNodes.length > 0) {
            const args = node.argNodes.map(arg => nodeToString(arg)).join(', ');
            return `${functionName}(${args})`;
        } else if (node.args && node.args.length > 0) {
            const args = node.args.map(arg => nodeToString(arg)).join(', ');
            return `${functionName}(${args})`;
        }
        return `${functionName}()`;
    }

    // Handle equation nodes
    if (node.type === 'omdEquationNode') {
        const left = nodeToString(node.left);
        const right = nodeToString(node.right);
        return `${left} = ${right}`;
    }

    // Fallback for other node types - try toString method first
    if (typeof node.toString === 'function') {
        try {
            return node.toString();
        } catch (e) {
            // Continue to next fallback
        }
    }

    // Use math.js as final fallback
    if (node.toMathJSNode) {
        try {
            return math.parse(node.toMathJSNode()).toString();
        } catch (e) {
            // Continue to final fallback
        }
    }

    // Use node name if available, otherwise use constructor name as last resort
    return node.name || node.type || '[unknown]';
}

// ===== POLYNOMIAL EXPANSION HELPER FUNCTIONS =====

/**
 * Expands a polynomial power using multinomial expansion
 * For example: (a + b)^2 = a^2 + 2ab + b^2
 * @param {Array} terms - Array of {node, sign} objects representing the polynomial terms
 * @param {number} exponent - The power to expand to
 * @param {number} fontSize - Font size for new nodes
 * @returns {Array} Array of {node, sign} objects representing the expanded terms
 */
export function expandPolynomialPower(terms, exponent, fontSize) {
    if (exponent === 1) {
        return terms;
    }
    
    if (exponent === 2) {
        return expandBinomialSquare(terms, fontSize);
    }
    
    if (exponent === 3) {
        return expandBinomialCube(terms, fontSize);
    }
    
    if (exponent === 4) {
        return expandBinomialFourth(terms, fontSize);
    }
    
    // For higher powers, use recursive multiplication
    let result = terms;
    for (let i = 1; i < exponent; i++) {
        result = multiplyTermArrays(result, terms, fontSize);
    }
    
    return result;
}

/**
 * Expands (a + b + ...)^2 using the multinomial theorem
 */
export function expandBinomialSquare(terms, fontSize) {
    const expandedTerms = [];
    
    // Square terms: a^2, b^2, ...
    for (const term of terms) {
        const squaredNode = SimplificationEngine.createBinaryOp(
            term.node.clone(),
            'multiply',
            term.node.clone(),
            fontSize
        );
        
        // Use granular provenance from leaf nodes
        const leafNodes = term.leafNodes || [];
        leafNodes.forEach(leafNode => {
            [squaredNode.left, squaredNode.right, squaredNode].forEach(part => {
                if (part && !part.provenance.includes(leafNode.id)) {
                    part.provenance.push(leafNode.id);
                }
            });
        });
        
        expandedTerms.push({
            node: squaredNode,
            sign: term.sign * term.sign // Always positive since we're squaring
        });
    }
    
    // Cross terms: 2ab, 2ac, 2bc, ...
    for (let i = 0; i < terms.length; i++) {
        for (let j = i + 1; j < terms.length; j++) {
            const term1 = terms[i];
            const term2 = terms[j];
            
            // Create 2 * term1 * term2
            const coefficient2 = SimplificationEngine.createConstant(2, fontSize);
            const product1 = SimplificationEngine.createBinaryOp(
                coefficient2,
                'multiply',
                term1.node.clone(),
                fontSize
            );
            const finalProduct = SimplificationEngine.createBinaryOp(
                product1,
                'multiply',
                term2.node.clone(),
                fontSize
            );
            
            // Use granular provenance from both terms
            const allLeafNodes = [...(term1.leafNodes || []), ...(term2.leafNodes || [])];
            allLeafNodes.forEach(leafNode => {
                [product1.right, finalProduct.right, finalProduct].forEach(part => {
                    if (part && !part.provenance.includes(leafNode.id)) {
                        part.provenance.push(leafNode.id);
                    }
                });
            });
            
            expandedTerms.push({
                node: finalProduct,
                sign: term1.sign * term2.sign
            });
        }
    }
    
    return expandedTerms;
}

/**
 * Expands (a + b + ...)^3 for binomial/trinomial cases
 */
export function expandBinomialCube(terms, fontSize) {
    if (terms.length === 2) {
        const [term1, term2] = terms;
        const expandedTerms = [];
        
        // Use the efficient helper functions with provenance
        expandedTerms.push({ 
            node: createPowerTermWithProvenance(term1.node, 3, fontSize, term1.leafNodes), 
            sign: Math.pow(term1.sign, 3) 
        });
        expandedTerms.push({ 
            node: createCoefficientProductTermWithProvenance(3, term1.node, 2, term2.node, 1, fontSize, term1.leafNodes, term2.leafNodes), 
            sign: Math.pow(term1.sign, 2) * term2.sign 
        });
        expandedTerms.push({ 
            node: createCoefficientProductTermWithProvenance(3, term1.node, 1, term2.node, 2, fontSize, term1.leafNodes, term2.leafNodes), 
            sign: term1.sign * Math.pow(term2.sign, 2) 
        });
        expandedTerms.push({ 
            node: createPowerTermWithProvenance(term2.node, 3, fontSize, term2.leafNodes), 
            sign: Math.pow(term2.sign, 3) 
        });
        
        return expandedTerms;
    }
    
    // For more than 2 terms, use general multiplication
    return multiplyTermArrays(expandBinomialSquare(terms, fontSize), terms, fontSize);
}

/**
 * Expands (a + b)^4 = a^4 + 4a^3b + 6a^2b^2 + 4ab^3 + b^4
 */
export function expandBinomialFourth(terms, fontSize) {
    if (terms.length === 2) {
        const [term1, term2] = terms;
        const expandedTerms = [];
        
        // Use the efficient helper functions with provenance
        expandedTerms.push({ 
            node: createPowerTermWithProvenance(term1.node, 4, fontSize, term1.leafNodes), 
            sign: Math.pow(term1.sign, 4) 
        });
        expandedTerms.push({ 
            node: createCoefficientProductTermWithProvenance(4, term1.node, 3, term2.node, 1, fontSize, term1.leafNodes, term2.leafNodes), 
            sign: Math.pow(term1.sign, 3) * term2.sign 
        });
        expandedTerms.push({ 
            node: createCoefficientProductTermWithProvenance(6, term1.node, 2, term2.node, 2, fontSize, term1.leafNodes, term2.leafNodes), 
            sign: Math.pow(term1.sign, 2) * Math.pow(term2.sign, 2) 
        });
        expandedTerms.push({ 
            node: createCoefficientProductTermWithProvenance(4, term1.node, 1, term2.node, 3, fontSize, term1.leafNodes, term2.leafNodes), 
            sign: term1.sign * Math.pow(term2.sign, 3) 
        });
        expandedTerms.push({ 
            node: createPowerTermWithProvenance(term2.node, 4, fontSize, term2.leafNodes), 
            sign: Math.pow(term2.sign, 4) 
        });
        
        return expandedTerms;
    }
    
    // For more than 2 terms, use general multiplication
    const cubed = expandBinomialCube(terms, fontSize);
    return multiplyTermArrays(cubed, terms, fontSize);
}

/**
 * Creates a term like x^n with granular provenance tracking
 */
export function createPowerTermWithProvenance(baseNode, power, fontSize, leafNodes) {
    if (power === 1) {
        const cloned = baseNode.clone();
        // Add leaf node provenance
        if (leafNodes && leafNodes.length > 0) {
            leafNodes.forEach(leafNode => {
                if (!cloned.provenance.includes(leafNode.id)) {
                    cloned.provenance.push(leafNode.id);
                }
            });
        }
        return cloned;
    }
    
    const powerConstant = SimplificationEngine.createConstant(power, fontSize);
    
    // Create power node AST structure
    const powerAST = {
        type: 'OperatorNode',
        op: '^',
        fn: 'pow',
        args: [baseNode.toMathJSNode(), powerConstant.toMathJSNode()],
        clone: function() { 
            return { 
                ...this, 
                args: this.args.map(arg => arg.clone()) 
            }; 
        }
    };
    
    const powerNode = new omdPowerNode(powerAST);
    powerNode.setFontSize(fontSize);
    powerNode.initialize();
    
    // Add leaf node provenance
    if (leafNodes && leafNodes.length > 0) {
        leafNodes.forEach(leafNode => {
            if (!powerNode.base.provenance.includes(leafNode.id)) {
                powerNode.base.provenance.push(leafNode.id);
            }
            if (!powerNode.provenance.includes(leafNode.id)) {
                powerNode.provenance.push(leafNode.id);
            }
        });
    } else {
        powerNode.base.provenance.push(baseNode.id);
        powerNode.provenance.push(baseNode.id);
    }
    
    return powerNode;
}

/**
 * Creates a term like c * a^p1 * b^p2 with granular provenance tracking
 */
export function createCoefficientProductTermWithProvenance(coefficient, node1, power1, node2, power2, fontSize, leafNodes1, leafNodes2) {
    let result = SimplificationEngine.createConstant(coefficient, fontSize);
    
    // Multiply by node1^power1
    if (power1 > 0) {
        const term1 = createPowerTermWithProvenance(node1, power1, fontSize, leafNodes1);
        result = SimplificationEngine.createBinaryOp(result, 'multiply', term1, fontSize);
        
        // Add leaf node provenance to the result
        if (leafNodes1 && leafNodes1.length > 0) {
            leafNodes1.forEach(leafNode => {
                if (!result.provenance.includes(leafNode.id)) {
                    result.provenance.push(leafNode.id);
                }
            });
        }
    }
    
    // Multiply by node2^power2
    if (power2 > 0) {
        const term2 = createPowerTermWithProvenance(node2, power2, fontSize, leafNodes2);
        result = SimplificationEngine.createBinaryOp(result, 'multiply', term2, fontSize);
        
        // Add leaf node provenance to the result
        if (leafNodes2 && leafNodes2.length > 0) {
            leafNodes2.forEach(leafNode => {
                if (!result.provenance.includes(leafNode.id)) {
                    result.provenance.push(leafNode.id);
                }
            });
        }
    }
    
    return result;
}

/**
 * Creates a term like x^n
 */
export function createPowerTerm(baseNode, power, fontSize) {
    if (power === 1) {
        return baseNode.clone();
    }
    
    const powerConstant = SimplificationEngine.createConstant(power, fontSize);
    
    // Create power node AST structure
    const powerAST = {
        type: 'OperatorNode',
        op: '^',
        fn: 'pow',
        args: [baseNode.toMathJSNode(), powerConstant.toMathJSNode()],
        clone: function() { 
            return { 
                ...this, 
                args: this.args.map(arg => arg.clone()) 
            }; 
        }
    };
    
    const powerNode = new omdPowerNode(powerAST);
    powerNode.setFontSize(fontSize);
    powerNode.initialize();
    
    return powerNode;
}

/**
 * Creates a term like c * a^p1 * b^p2
 */
export function createCoefficientProductTerm(coefficient, node1, power1, node2, power2, fontSize) {
    let result = SimplificationEngine.createConstant(coefficient, fontSize);
    
    // Multiply by node1^power1
    if (power1 > 0) {
        const term1 = createPowerTerm(node1, power1, fontSize);
        result = SimplificationEngine.createBinaryOp(result, 'multiply', term1, fontSize);
    }
    
    // Multiply by node2^power2
    if (power2 > 0) {
        const term2 = createPowerTerm(node2, power2, fontSize);
        result = SimplificationEngine.createBinaryOp(result, 'multiply', term2, fontSize);
    }
    
    return result;
}

/**
 * Multiplies two arrays of terms (for general polynomial multiplication)
 */
export function multiplyTermArrays(terms1, terms2, fontSize) {
    const result = [];
    
    for (const term1 of terms1) {
        for (const term2 of terms2) {
            const productNode = SimplificationEngine.createBinaryOp(
                term1.node.clone(),
                'multiply',
                term2.node.clone(),
                fontSize
            );
            
            // Add granular provenance from leaf nodes of both terms
            const allLeafNodes = [...(term1.leafNodes || []), ...(term2.leafNodes || [])];
            allLeafNodes.forEach(leafNode => {
                [productNode.left, productNode.right, productNode].forEach(part => {
                    if (part && !part.provenance.includes(leafNode.id)) {
                        part.provenance.push(leafNode.id);
                    }
                });
            });
            
            result.push({
                node: productNode,
                sign: term1.sign * term2.sign,
                leafNodes: allLeafNodes
            });
        }
    }
    
    return result;
}

/**
 * Creates a monomial with granular provenance tracking for coefficients and variables separately
 */
export function createMonomialWithGranularProvenance(coefficient, variable, power, fontSize, coefficientProvenance = [], variableProvenance = []) {
    // Create variable node
    const variableAST = { type: 'SymbolNode', name: variable, clone: function() { return {...this}; } };
    const variableNode = new (SimplificationEngine.getNodeClass('omdVariableNode'))(variableAST);
    variableNode.setFontSize(fontSize);
    variableNode.initialize();
    
    // Set variable-specific provenance
    if (variableProvenance && variableProvenance.length > 0) {
        variableNode.provenance = [...variableProvenance];
    }
    
    let termNode = variableNode;
    
    // Add power if not 1
    if (power !== 1) {
        const powerAST = {
            type: 'OperatorNode',
            op: '^',
            fn: 'pow',
            args: [variableAST, { type: 'ConstantNode', value: power, clone: function() { return {...this}; } }],
            clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
        };
        termNode = new (SimplificationEngine.getNodeClass('omdPowerNode'))(powerAST);
        termNode.setFontSize(fontSize);
        termNode.initialize();
        
        // Set variable provenance on the base, power gets no special provenance
        if (termNode.base && variableProvenance && variableProvenance.length > 0) {
            termNode.base.provenance = [...variableProvenance];
        }
    }
    
    let result;
    if (coefficient === 1) {
        result = termNode;
    } else if (coefficient === -1) {
        // Create unary minus
        const unaryAST = {
            type: 'OperatorNode',
            op: '-',
            fn: 'unaryMinus',
            args: [termNode.toMathJSNode()],
            clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
        };
        result = new (SimplificationEngine.getNodeClass('omdUnaryExpressionNode'))(unaryAST);
        result.setFontSize(fontSize);
        result.initialize();
        
        // The argument preserves variable provenance
        if (result.argument && variableProvenance && variableProvenance.length > 0) {
            result.argument.provenance = [...variableProvenance];
        }
    } else {
        // Create coefficient * term
        const coeffNode = SimplificationEngine.createConstant(Math.abs(coefficient), fontSize);
        
        // Set coefficient-specific provenance
        if (coefficientProvenance && coefficientProvenance.length > 0) {
            coeffNode.provenance = [...coefficientProvenance];
        }
        
        const multiplicationNode = SimplificationEngine.createBinaryOp(coeffNode, 'multiply', termNode, fontSize);
        
        // Apply granular provenance: coefficient to left, variable to right
        if (multiplicationNode.left && coefficientProvenance && coefficientProvenance.length > 0) {
            multiplicationNode.left.provenance = [...coefficientProvenance];
        }
        if (multiplicationNode.right && variableProvenance && variableProvenance.length > 0) {
            multiplicationNode.right.provenance = [...variableProvenance];
        }
        
        // Wrap in unary minus if coefficient is negative
        if (coefficient < 0) {
            const unaryAST = {
                type: 'OperatorNode',
                op: '-',
                fn: 'unaryMinus',
                args: [multiplicationNode.toMathJSNode()],
                clone: function() { return { ...this, args: this.args.map(arg => arg.clone()) }; }
            };
            result = new (SimplificationEngine.getNodeClass('omdUnaryExpressionNode'))(unaryAST);
            result.setFontSize(fontSize);
            result.initialize();
            
            // Preserve granular provenance within the unary minus
            if (result.argument) {
                if (result.argument.left && coefficientProvenance && coefficientProvenance.length > 0) {
                    result.argument.left.provenance = [...coefficientProvenance];
                }
                if (result.argument.right && variableProvenance && variableProvenance.length > 0) {
                    result.argument.right.provenance = [...variableProvenance];
                }
            }
        } else {
            result = multiplicationNode;
        }
    }
    
    return result;
}

/**
 * Extracts coefficient and variable leaf nodes separately from a monomial term
 * for granular provenance tracking in like term combination
 */
export function extractMonomialProvenance(termNode) {
    const coefficientNodes = [];
    const variableNodes = [];
    
    function traverse(node, isInCoefficient = false) {
        if (!node) return;
        
        // If we find a variable node, it goes to variables
        if (node.type === 'omdVariableNode') {
            variableNodes.push(node);
            return;
        }
        
        // If we find a constant node
        if (node.type === 'omdConstantNode') {
            // If we're in a power expression, this is likely an exponent, not a coefficient
            if (node.parent && node.parent.type === 'omdPowerNode' && node.parent.exponent === node) {
                // Skip exponents for provenance purposes
                return;
            }
            // Otherwise, it's a coefficient
            coefficientNodes.push(node);
            return;
        }
        
        // For power nodes, traverse base for variables
        if (node.type === 'omdPowerNode') {
            if (node.base) traverse(node.base, false);
            // Don't traverse exponent for provenance
            return;
        }
        
        // For binary operations, determine what we're looking at
        if (node.type === 'omdBinaryExpressionNode') {
            if (node.operation === 'multiply') {
                // In multiplication, left is often coefficient, right is often variable
                if (node.left) traverse(node.left, true);
                if (node.right) traverse(node.right, false);
            } else {
                // For other operations, traverse both sides
                if (node.left) traverse(node.left, isInCoefficient);
                if (node.right) traverse(node.right, isInCoefficient);
            }
            return;
        }
        
        // For unary operations, traverse the argument
        if (node.type === 'omdUnaryExpressionNode') {
            if (node.argument) traverse(node.argument, isInCoefficient);
            return;
        }
        
        // For other node types, try to traverse child properties
        ['left', 'right', 'base', 'exponent', 'argument', 'expression', 'numerator', 'denominator'].forEach(prop => {
            if (node[prop]) traverse(node[prop], isInCoefficient);
        });
    }
    
    traverse(termNode);
    
    return {
        coefficientNodes,
        variableNodes
    };
}