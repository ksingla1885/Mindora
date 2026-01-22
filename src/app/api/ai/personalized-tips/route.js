import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { auth } from '@/auth';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request) {
    try {
        const session = await auth();
        // Optional: Check authentication if tips should be private
        // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const testId = searchParams.get('testId');

        // Check if API key is configured
        const apiKey = process.env.OPENAI_API_KEY;
        const isMock = !apiKey || apiKey === 'your_api_key_here';

        let tips;

        if (isMock) {
            tips = [
                "Review your incorrect answers to understand your mistakes.",
                "Focus on the concepts where you scored below 50%.",
                "Take breaks between study sessions to improve retention.",
                "Practice with similar questions to reinforce your learning."
            ];
        } else {
            // In a real scenario, we would fetch user history and test performance
            const prompt = `Generate 3-5 personalized study tips for a student who just completed a test. 
      Focus on general study habits and test-taking strategies.`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful study coach.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 300,
            });

            const content = completion.choices[0].message.content;
            tips = content.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^\d+[.)]\s*/, '').trim());
        }

        return NextResponse.json({
            success: true,
            tips,
        });
    } catch (error) {
        console.error('Error getting personalized tips:', error);
        // Return fallback tips instead of error
        return NextResponse.json({
            success: true,
            tips: [
                "Review the test material one more time.",
                "Focus on understanding the 'Why' behind every answer.",
                "Stay consistent with your daily practice."
            ]
        });
    }
}
