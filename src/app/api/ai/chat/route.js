import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';

const SYSTEM_INSTRUCTION =
    "You are Mindora AI, a helpful and encouraging tutor for students preparing for Olympiads (NSO, IMO, etc.). Answer questions concisely and provide step-by-step explanations for problems. If you don't know the answer, admit it. Be friendly and motivating.";

const MOCK_RESPONSES = [
    "Great question! Let me break this down step by step for you. 🧠\n\nThis is a **mock response** — add a valid `GEMINI_API_KEY` (starts with `AIzaSy`) to your `.env` file to get real AI answers.",
    "Here's how I'd approach this problem:\n\n1. First, identify what's given\n2. Then, apply the relevant formula\n3. Finally, verify your answer\n\n*(Mock mode — real AI coming once a valid API key is added!)*",
    "Excellent! This concept is fundamental to your Olympiad prep. 🏆\n\nIn real mode, I'll give you a detailed explanation with examples. For now, this is a **mock response** — update `GEMINI_API_KEY` in `.env` to activate Mindora AI.",
];

export async function POST(req) {
    try {
        // Check authentication
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // Use mock mode only if no API key is set at all
        if (!apiKey) {
            await new Promise(r => setTimeout(r, 800)); // simulate latency
            const mock = MOCK_RESPONSES[messages.length % MOCK_RESPONSES.length];
            return NextResponse.json({ role: 'assistant', content: mock });
        }

        // Prepend system prompt as a user/model exchange (v1 doesn't support system_instruction)
        const contents = [
            { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] },
            { role: 'model', parts: [{ text: 'Understood! I am Mindora AI, ready to help.' }] },
            ...messages.map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            })),
        ];

        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errBody = await geminiRes.json();
            console.error('Gemini API error:', errBody);

            // Quota exceeded — fall back to mock so UI stays testable
            if (geminiRes.status === 429) {
                const lastUserMsg = messages[messages.length - 1]?.content ?? 'your question';
                return NextResponse.json({
                    role: 'assistant',
                    content: `⚠️ **API quota exceeded** — Mindora AI is temporarily unavailable.\n\nYou asked: *"${lastUserMsg}"*\n\nTo restore AI responses, add a fresh \`GEMINI_API_KEY\` from [Google AI Studio](https://aistudio.google.com/apikey) to your \`.env\` file and restart the server.`,
                });
            }

            return NextResponse.json(
                { error: errBody?.error?.message || 'Gemini API request failed' },
                { status: geminiRes.status }
            );
        }

        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        return NextResponse.json({ role: 'assistant', content: text });
    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
    }
}
