// Small parsers to convert simple equation/expression strings into OMD JSON

// Parse an expression like "3x+4-2y" into a termsAndOpers array:
// ['3x', '+', '4', '-', '2y'] -> [{omdType:'term', coefficient:3, variable:'x' }, {omdType:'operator', operator:'+'}, ...]
export function parseExpressionString(str) {
    const cleaned = String(str || '').replace(/\s+/g, '');
    if (!cleaned) return null;

    // Tokenize numbers, variables, operators, and superscripts
    // Token regex covers +/- as signs attached to numbers/vars, or standalone operators
    const tokenRe = /([+-]?\d*\.?\d+[a-zA-Z]*)|([+-]?[a-zA-Z]+\^?\d*)|([+\-*/=×÷])/g;
    const matches = cleaned.match(tokenRe) || [];
    if (matches.length === 0) return null;

    const out = [];
    for (let tok of matches) {
        // operator-only tokens
        if (/^[+\-*/=×÷]$/.test(tok)) {
            out.push({ omdType: 'operator', operator: tok.replace('*', '×') });
            continue;
        }
        // term or number/variable
        const m = tok.match(/^([+-]?)(\d*\.?\d*)([a-zA-Z]?)(?:\^(\d+))?$/);
        if (m) {
            const signStr = m[1];
            let sign = signStr === '-' ? -1 : 1;
            const coefRaw = m[2];
            const varChar = m[3] || '';
            const exp = m[4] ? Number(m[4]) : 1;
            let coef = 1;
            if (coefRaw && coefRaw.length > 0) coef = Number(coefRaw);

            // Logic to split sign into operator if needed
            // If we have a sign (+ or -), and we are NOT at the start and NOT following an operator,
            // we should split it into an operator and a positive term.
            let splitSign = false;
            if (signStr) {
                const isStart = out.length === 0;
                const prevIsOperator = !isStart && out[out.length-1].omdType === 'operator';
                
                if (!isStart && !prevIsOperator) {
                    splitSign = true;
                }
            }

            if (splitSign) {
                out.push({ omdType: 'operator', operator: signStr });
                sign = 1; // Term becomes positive
            }

            if (!varChar && coefRaw) {
                // pure number
                out.push({ omdType: 'number', value: sign * coef });
            } else {
                out.push({ omdType: 'term', coefficient: sign * coef, variable: varChar, exponent: exp });
            }
        } else {
            // fallback to string token
            out.push({ omdType: 'string', name: tok });
        }
    }

    // If first token is an operator like '+' or '-', and followed by a term/number, fold it
    // ONLY if it is a unary operator (at start or after another operator)
    const folded = [];
    for (let i = 0; i < out.length; i++) {
        const t = out[i];
        if (t.omdType === 'operator' && (t.operator === '+' || t.operator === '-')) {
            const isStart = folded.length === 0;
            const prevIsOperator = !isStart && folded[folded.length-1].omdType === 'operator';

            // Only fold if it's unary
            if (isStart || prevIsOperator) {
                const next = out[i+1];
                if (next && (next.omdType === 'term' || next.omdType === 'number')) {
                    if (next.omdType === 'number') {
                        next.value = (t.operator === '-') ? -next.value : next.value;
                    } else if (next.omdType === 'term') {
                        next.coefficient = (t.operator === '-') ? -next.coefficient : next.coefficient;
                    }
                    i++; // skip next because we've merged
                    folded.push(next);
                    continue;
                }
            }
        }
        folded.push(t);
    }

    // Interleave operators where missing: if folded array alternates term/number and operator
    const result = [];
    for (let i = 0; i < folded.length; i++) {
        result.push(folded[i]);
    }

    return { termsAndOpers: result };
}

// Parse an equation like "3x+4=2x+1" into left/right expression JSON
export function parseEquationString(str) {
    const s = String(str || '');
    const parts = s.split('=');
    if (parts.length !== 2) return null;
    const left = parts[0].trim();
    const right = parts[1].trim();
    const leftJson = parseExpressionString(left);
    const rightJson = parseExpressionString(right);
    if (!leftJson || !rightJson) return null;
    return { leftExpression: leftJson, rightExpression: rightJson };
}
