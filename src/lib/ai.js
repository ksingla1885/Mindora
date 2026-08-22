const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3.5-lightning:free';

export async function fetchGroq(messages, generationConfig = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return null; // Mock mode
    }

    const max_tokens = generationConfig.maxOutputTokens || 1024;
    const temperature = generationConfig.temperature ?? 0.7;
    let model = generationConfig.model || DEFAULT_MODEL;

    // Map old Groq models to OpenRouter free models
    if (model === 'llama-3.3-70b-versatile') {
        model = 'nvidia/nemotron-3.5-lightning:free';
    } else if (model === 'llama-3.2-90b-vision-preview') {
        model = 'meta-llama/llama-3.2-11b-vision-instruct:free';
    } else if (model === 'llama-3.1-8b-instant') {
        model = 'nvidia/nemotron-3.5-lightning:free';
    }

    const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Mindora'
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens,
        }),
    });

    return res;
}

