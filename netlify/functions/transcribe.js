import OpenAI from "openai";

// Prefer OPENAI_API_KEY; allow legacy GEMINI_API_KEY fallback for dev misconfig
const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('[transcribe] No OPENAI_API_KEY (or fallback GEMINI_API_KEY) set. Requests will fail.');
}

const openai = new OpenAI({ apiKey });

export async function handler(event, context) {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Parse the request body
        const body = JSON.parse(event.body);
    const { imageBase64, prompt, model: requestedModel, provider } = body;

        if (!imageBase64) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Image data is required' })
            };
        }

        const model = requestedModel || 'gpt-4o';

        const systemPrompt = 'You are a precise math transcription assistant. Return ONLY the clean linear mathematical expression captured in the image. No commentary, no LaTeX delimiters. Use ^ for exponents, / for fractions, sqrt() for square roots. Preserve variables and order. If the image is unclear, make the best reasonable transcription without apology.';
        const userPrompt = prompt || 'Transcribe the handwritten mathematical expression.';

        // Use new Responses API for multimodal (preferred) with fallback to chat.completions
        let transcribedText = '';
        try {
            const resp = await openai.responses.create({
                model,
                max_output_tokens: 300,
                input: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'input_text', text: userPrompt },
                            { type: 'input_image', image_url: `data:image/png;base64,${imageBase64}` }
                        ]
                    }
                ]
            });
            // Extract text segments
            const out = resp.output || resp.choices || [];
            if (Array.isArray(out)) {
                transcribedText = out.map(o => o?.content ? o.content.map(c => c.text || '').join('') : '').join('').trim();
            }
            if (!transcribedText) {
                // Attempt legacy field
                transcribedText = resp.output_text || '';
            }
        } catch (responsesErr) {
            console.warn('[transcribe] responses.create failed, falling back to chat.completions:', responsesErr.message);
            const messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
                    ]
                }
            ];
            const legacy = await openai.chat.completions.create({
                model: model === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o',
                messages,
                max_tokens: 300
            });
            transcribedText = legacy.choices?.[0]?.message?.content?.trim() || '';
        }

        if (!transcribedText) {
            transcribedText = '(unrecognized)';
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: transcribedText,
                provider: provider || 'openai',
                model,
                confidence: 1.0
            })
        };

    } catch (error) {
        console.error('Transcription error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Transcription failed',
                details: error.message 
            })
        };
    }
} 