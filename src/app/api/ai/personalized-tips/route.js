import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchGroq } from '@/lib/ai';

export async function GET(request) {
  try {
    const session = await auth();
    // Optional: Check authentication if tips should be private
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const testId = searchParams.get('testId');

    let tips;

    // In a real scenario, we would fetch user history and test performance
    const systemPrompt = `You are a helpful study coach.`;
    const userPrompt = `Generate 3-5 personalized study tips for a student who just completed a test. 
Focus on general study habits and test-taking strategies.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const groqRes = await fetchGroq(messages, { temperature: 0.7, maxOutputTokens: 300 });

    if (!groqRes) {
      // Mock tips if API key is missing
      tips = [
        "Review your incorrect answers to understand your mistakes.",
        "Focus on the concepts where you scored below 50%.",
        "Take breaks between study sessions to improve retention.",
        "Practice with similar questions to reinforce your learning."
      ];
    } else {
      if (!groqRes.ok) {
        throw new Error('Groq API request failed');
      }

      const data = await groqRes.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
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
