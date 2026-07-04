import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cache } from '@/lib/redis-utils';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';

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
    const prompt = `System Instruction: You are a helpful tutor. Explain the question and answer in a clear, educational way.

Topic: ${question.topic?.name || 'General'}
Question: ${question.text}
Options: ${question.options ? JSON.stringify(question.options) : 'N/A'}
Correct Answer: ${question.correctAnswer || 'Hidden'}
User's Answer: ${userAnswer || 'Not answered'}

Provide a detailed, educational explanation suitable for a student.`;

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey;

    let explanation;

    if (isMock) {
      explanation = `[Simulated Explanation]
       
This is a mock explanation because the Gemini API key is not configured.
       
The correct answer is correct because it matches the definition provided in the study materials.
       
Concept: ${question.topic?.name || 'General Knowledge'}
Key Point: Understanding this concept is crucial for solving similar problems.`;
    } else {
      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!geminiRes.ok) {
        throw new Error('Gemini API request failed');
      }

      const data = await geminiRes.json();
      explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
