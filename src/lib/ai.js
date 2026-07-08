const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'; 

export async function fetchGroq(messages, generationConfig = {}) {
    const primaryKey = process.env.GROQ_PRIMARY_API_KEY;
    const fallbackKey = process.env.GROQ_FALLBACK_API_KEY;

    if (!primaryKey && !fallbackKey) {
        return null; // Mock mode
    }

    const max_tokens = generationConfig.maxOutputTokens || 1024;
    const temperature = generationConfig.temperature ?? 0.7;
    const model = generationConfig.model || DEFAULT_MODEL;

    let res;
    
    // Try primary key
    if (primaryKey) {
        res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${primaryKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens,
            }),
        });
    }

    // Fallback if primary fails
    if ((!res || !res.ok) && fallbackKey) {
        if (res) console.warn(`Primary Groq API failed with status ${res.status}. Falling back...`);
        res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${fallbackKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens,
            }),
        });
    }

    return res;
}
