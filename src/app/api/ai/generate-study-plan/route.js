import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const { testId, weakAreas } = await request.json();

        // Check if API key is configured
        const apiKey = process.env.OPENAI_API_KEY;
        const isMock = !apiKey || apiKey === 'your_api_key_here';

        let studyPlan;

        if (isMock) {
            studyPlan = `[Simulated Study Plan]
      
Based on your weak areas (${weakAreas.join(', ')}), here is a suggested study plan:

Day 1: Review ${weakAreas[0] || 'Topic 1'}
- Read the summary notes.
- Watch the video lecture (if available).
- Solve 15 easy questions.

Day 2: Deep Dive into ${weakAreas[1] || 'Topic 2'}
- Focus on sub-topics where you made mistakes.
- Create flashcards for key formulas.
- Solve 10 medium difficulty questions.

Day 3: Mixed Practice
- Take a mini-quiz covering both topics.
- Analyze your errors immediately.`;
        } else {
            const prompt = `Generate a 3-day study plan for a student who is weak in the following areas: ${weakAreas.join(', ')}.
      
      Structure the plan day by day with specific activities (e.g., "Read summary", "Solve 20 questions").`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful study planner.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 400,
            });

            studyPlan = completion.choices[0].message.content;
        }

        return NextResponse.json({
            success: true,
            studyPlan,
        });
    } catch (error) {
        console.error('Error generating study plan:', error);
        return NextResponse.json({
            success: true,
            studyPlan: 'Could not generate study plan at this time. Please try again later.'
        });
    }
}
