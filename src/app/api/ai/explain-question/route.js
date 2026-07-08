import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cache } from '@/lib/redis-utils';
import { fetchGroq } from '@/lib/ai';

export async function POST(request) {
  try {
    const { questionId, userAnswer } = await request.json();

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Cache key for the explanation
    const cacheKey = `ai:explanation:${questionId}:${userAnswer || 'none'}`;
    
    // Try to get from cache
    const cachedExplanation = await cache.get(cacheKey);
    if (cachedExplanation) {
      return NextResponse.json({
        success: true,
        explanation: cachedExplanation,
        questionId,
        fromCache: true
      });
    }

    // Fetch real question from database
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        topic: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Construct the prompt with real data
    const systemPrompt = `You are a helpful tutor. Explain the question and answer in a clear, educational way.`;
    const userPrompt = `Topic: ${question.topic?.name || 'General'}
Question: ${question.text}
Options: ${question.options ? JSON.stringify(question.options) : 'N/A'}
Correct Answer: ${question.correctAnswer || 'Hidden'}
User's Answer: ${userAnswer || 'Not answered'}

Provide a detailed, educational explanation suitable for a student.`;

    let explanation;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const groqRes = await fetchGroq(messages, { temperature: 0.5, maxOutputTokens: 500 });

    if (!groqRes) {
      explanation = `[Simulated Explanation]
       
This is a mock explanation because the Groq API key is not configured.
       
The correct answer is correct because it matches the definition provided in the study materials.
       
Concept: ${question.topic?.name || 'General Knowledge'}
Key Point: Understanding this concept is crucial for solving similar problems.`;
    } else {
      if (!groqRes.ok) {
        throw new Error('Groq API request failed');
      }

      const data = await groqRes.json();
      explanation = data?.choices?.[0]?.message?.content ?? '';
    }

    // Store in cache for 24 hours (86400 seconds)
    await cache.set(cacheKey, explanation, 86400);

    return NextResponse.json({
      success: true,
      explanation,
      questionId,
    });
  } catch (error) {
    console.error('Error explaining question:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
