import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchGroq } from '@/lib/ai';

const SYSTEM_INSTRUCTION =
    "You are Mindora AI, a helpful and encouraging tutor for students preparing for Olympiads (NSO, IMO, etc.). " +
    "CRITICAL RULE: You must ONLY answer questions related to mathematics, science, education, Olympiads, or the Mindora platform. " +
    "If the user asks about ANY unrelated topics (like weather, general knowledge outside syllabus, current events, coding, pop culture, etc.), you MUST politely decline and remind them that you are only here to help with their studies.";

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

        const safeMessages = messages.filter(
            m => m && (m.role === 'user' || m.role === 'assistant')
        );

        const formattedMessages = [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...safeMessages
        ];

        const res = await fetchGroq(formattedMessages, { temperature: 0.7, maxOutputTokens: 1024 });

        // Mock response if no keys exist
        if (!res) {
            await new Promise(r => setTimeout(r, 800)); // simulate latency
            return NextResponse.json({ role: 'assistant', content: "This is a **mock response** — add a valid `GROQ_PRIMARY_API_KEY` to your `.env` file to get real AI answers." });
        }

        if (!res.ok) {
            const errBody = await res.json();
            console.error('Groq API error:', errBody);
            
            if (res.status === 429) {
                const lastUserMsg = messages[messages.length - 1]?.content ?? 'your question';
                return NextResponse.json({
                    role: 'assistant',
                    content: `⚠️ **API quota exceeded** — Mindora AI is temporarily unavailable on both primary and fallback networks.\n\nYou asked: *"${lastUserMsg}"*`,
                });
            }

            return NextResponse.json(
                { error: errBody?.error?.message || 'Groq API request failed' },
                { status: res.status }
            );
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content ?? '';

        return NextResponse.json({ role: 'assistant', content: text });
    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
    }
}
