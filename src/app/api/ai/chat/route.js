import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize OpenAI client
// Note: This requires OPENAI_API_KEY in .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key', // Fallback for build time, but will fail at runtime if not set
});

export async function POST(req) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Invalid messages format' },
                { status: 400 }
            );
        }

        // If no API key is configured, return a mock response
        if (!process.env.OPENAI_API_KEY) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            return NextResponse.json({
                role: 'assistant',
                content: "I'm a simulated AI assistant. To get real answers, please configure the OPENAI_API_KEY in your environment variables. For now, I can tell you that Mindora is a great platform for learning!"
            });
        }

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are Mindora AI, a helpful and encouraging tutor for students preparing for Olympiads (NSO, IMO, etc.). Answer questions concisely and provide step-by-step explanations for problems. If you don't know the answer, admit it. Be friendly and motivating."
                },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = completion.choices[0].message;

        return NextResponse.json(reply);

    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
