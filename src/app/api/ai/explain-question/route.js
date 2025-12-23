import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import prisma from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { questionId, userAnswer } = await request.json();

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
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
    const prompt = `Explain the following question and why the correct answer is correct. 
    Also, provide additional context or related concepts that would help understand this topic better.

    Topic: ${question.topic?.name || 'General'}
    Question: ${question.text}
    Options: ${question.options ? JSON.stringify(question.options) : 'N/A'}
    Correct Answer: ${question.correctAnswer || 'Hidden'}
    User's Answer: ${userAnswer || 'Not answered'}

    Provide a detailed, educational explanation suitable for a student.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful tutor. Explain the question and answer in a clear, educational way.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const explanation = completion.choices[0].message.content;

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
