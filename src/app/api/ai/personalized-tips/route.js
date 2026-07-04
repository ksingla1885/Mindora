import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';

export async function GET(request) {
  try {
    const session = await auth();
    // Optional: Check authentication if tips should be private
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const testId = searchParams.get('testId');

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey;

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
      const prompt = `System Instruction: You are a helpful study coach.
      
Generate 3-5 personalized study tips for a student who just completed a test. 
Focus on general study habits and test-taking strategies.`;

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!geminiRes.ok) {
        throw new Error('Gemini API request failed');
      }

      const data = await geminiRes.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
