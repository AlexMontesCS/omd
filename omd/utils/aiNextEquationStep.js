import OpenAI from 'openai';

/**
 * Ask the AI for the next algebraic step for an equation.
 * This helper can be called in Node (server) with an API key, or can proxy to an endpoint.
 *
 * @param {string} equation - The equation string (e.g. "3x+2=14")
 * @param {object} [options]
 * @param {string} [options.apiKey] - API key for the OpenAI-compatible client (GEMINI_API_KEY)
 * @param {string} [options.baseURL] - Optional baseURL override for the OpenAI client
 * @param {string} [options.model] - Model name (default: "gemini-2.0-flash")
 * @param {string} [options.endpoint] - If provided, POSTs to this endpoint with { equation } and expects the same JSON response
 */
export async function aiNextEquationStep(equation, options = {}) {
    if (!equation) throw new Error('equation is required');

    const prompt = `Given the equation ${equation}, return ONLY the next algebraic step required to solve for the variable, in one of the following strict JSON formats:

For an operation (add, subtract, multiply, divide):
{ "operation": "add|subtract|multiply|divide", "value": number or string }

For a function applied to both sides (e.g., sqrt, log, sin):
{ "function": "functionName" }

If the equation is already solved (like x=4) or no valid algebraic step can be applied:
{ "operation": "none" }

Important rules for solving:
1. When variables appear on both sides, first move all variables to one side by adding/subtracting variable terms
2. When constants appear on both sides, move all constants to one side by adding/subtracting constants
3. Focus on isolating the variable systematically
4. For equations like 2x-5=3x+7, subtract the smaller variable term (2x) from both sides first

Do not include any explanation, LaTeX, or extra text. Only output the JSON object.`;

    // If an endpoint is provided, proxy the request there (useful for browser usage)
    if (options.endpoint) {
        const res = await fetch(options.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ equation })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Remote endpoint error: ${res.status} ${text}`);
        }

        const json = await res.json();
        return json;
    }

    const apiKey = options.apiKey || (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY);
    if (!apiKey) throw new Error('API key is required when not using a remote endpoint');

    const baseURL = options.baseURL || 'https://generativelanguage.googleapis.com/v1beta/openai/';
    const model = options.model || 'gemini-2.0-flash';

    const client = new OpenAI({ apiKey, baseURL, dangerouslyAllowBrowser: true });

    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: prompt
                }
            ]
        }
    ];

    const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 150
    });

    // Extract JSON object from model output
    let aiText = '';
    try {
        aiText = (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) || '';
        if (Array.isArray(aiText)) {
            // Some SDKs return arrays of content objects
            aiText = aiText.map(c => c.text || c.content || '').join('');
        }
        if (typeof aiText === 'object' && aiText.text) aiText = aiText.text;
        aiText = String(aiText).trim();
    } catch (e) {
        throw new Error('Unexpected AI response format');
    }

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return a JSON object');

    try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
    } catch (e) {
        throw new Error('Failed to parse AI JSON response: ' + e.message + ' -- raw: ' + aiText);
    }
}

export default aiNextEquationStep;
