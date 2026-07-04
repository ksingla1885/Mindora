import { NextResponse } from 'next/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';

export async function POST(request) {
  try {
    const { testId, weakAreas } = await request.json();

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey;

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
      const prompt = `System Instruction: You are a helpful study planner.
      
Generate a 3-day study plan for a student who is weak in the following areas: ${weakAreas.join(', ')}.
      
Structure the plan day by day with specific activities (e.g., "Read summary", "Solve 20 questions").`;

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          },
        }),
      });

      if (!geminiRes.ok) {
        throw new Error('Gemini API request failed');
      }

      const data = await geminiRes.json();
      studyPlan = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
