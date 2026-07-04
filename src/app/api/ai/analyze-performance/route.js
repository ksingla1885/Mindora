import { NextResponse } from 'next/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';

export async function POST(request) {
  try {
    const { testId, results } = await request.json();

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey;

    let analysis;

    if (isMock) {
      // Return mock analysis for development/testing without API key
      analysis = `Here is a simulated analysis of your test results:
      
1. Review the core concepts of the topics where you scored lowest.
2. Practice more questions related to the specific difficulty level you struggled with.
3. Managing your time better during the test could improve your score.
4. Focus on reading the questions carefully to avoid simple mistakes.
5. Use the elimination method for multiple-choice questions when unsure.`;
    } else {
      const prompt = `System Instruction: You are a helpful test preparation assistant. Analyze the test results and provide constructive feedback and improvement suggestions.

Test Results:
${JSON.stringify(results, null, 2)}

Provide 3-5 specific suggestions for improvement, focusing on areas where the user scored poorly.`;

      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!geminiRes.ok) {
        throw new Error('Gemini API request failed');
      }

      const data = await geminiRes.json();
      analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    // Parse the response to extract structured suggestions
    const suggestions = analysis
      .split('\n')
      .filter(line => line.trim().match(/^\d+[.)]/))
      .map(line => ({
        id: crypto.randomUUID(),
        text: line.replace(/^\d+[.)]\s*/, '').trim(),
        category: 'performance',
        priority: 'high',
      }));

    return NextResponse.json({
      success: true,
      suggestions,
      analysis,
      weakAreas: ['Mock Topic 1', 'Mock Topic 2'], // Added for study plan generation
    });
  } catch (error) {
    console.error('Error analyzing performance:', error);
    // Return a fallback instead of erroring out completely
    return NextResponse.json({
      success: true,
      suggestions: [
        {
          id: 'fallback-1',
          text: 'Review the topics where you missed questions.',
          category: 'performance',
          priority: 'high'
        },
        {
          id: 'fallback-2',
          text: 'Practice time management for future tests.',
          category: 'performance',
          priority: 'medium'
        }
      ],
      analysis: 'Could not generate detailed AI analysis at this time. Please review your answers manually.'
    });
  }
}
