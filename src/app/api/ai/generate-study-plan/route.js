import { NextResponse } from 'next/server';
import { fetchGroq } from '@/lib/ai';

export async function POST(request) {
  try {
    const { testId, weakAreas } = await request.json();

    let studyPlan;

    const systemPrompt = `You are a helpful study planner.`;
    const userPrompt = `Generate a 3-day study plan for a student who is weak in the following areas: ${weakAreas.join(', ')}.
    
Structure the plan day by day with specific activities (e.g., "Read summary", "Solve 20 questions").`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const openrouterRes = await fetchGroq(messages, { temperature: 0.7, maxOutputTokens: 400 });

    if (!openrouterRes) {
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
      if (!openrouterRes.ok) {
        throw new Error('OpenRouter API request failed');
      }

      const data = await openrouterRes.json();
      studyPlan = data?.choices?.[0]?.message?.content ?? '';
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
