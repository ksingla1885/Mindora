import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { testId, results } = await request.json();

    // In a real app, fetch test details and user data from your database
    // const test = await getTestById(testId);
    // const userData = await getUserTestData(userId, testId);

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

    const analysis = completion.choices[0].message.content;
    
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
    });
  } catch (error) {
    console.error('Error analyzing performance:', error);
    return NextResponse.json(
      { error: 'Failed to analyze performance' },
      { status: 500 }
    );
  }
}
