import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { testId, results } = await request.json();

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    const isMock = !apiKey || apiKey === 'your_api_key_here';

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
      const prompt = `Analyze the following test results and provide improvement suggestions:
    
Test Results:
${JSON.stringify(results, null, 2)}

Provide 3-5 specific suggestions for improvement, focusing on areas where the user scored poorly.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful test preparation assistant. Analyze the test results and provide constructive feedback and improvement suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      analysis = completion.choices[0].message.content;
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
