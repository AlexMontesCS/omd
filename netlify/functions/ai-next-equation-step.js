import { aiNextEquationStep } from '../../omd/utils/aiNextEquationStep.js';

async function handler(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        let body = event.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
            }
        } else if (!body) {
            body = {};
        }
        const { equation } = body;

        if (!equation) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Equation is required' }) };
        }

        const resultJson = await aiNextEquationStep(equation, {
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-4o'
        });

        return { statusCode: 200, headers, body: JSON.stringify(resultJson) };

    } catch (error) {
        console.error('AI step error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to get next equation step', details: error?.message || String(error) }) };
    }
}

module.exports = {handler}    