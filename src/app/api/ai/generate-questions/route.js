import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Use the same auth method as questions route
import { PrismaClient } from '@prisma/client';
import { fetchGroq } from '@/lib/ai';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { topic, subject, count = 5, difficulty = 'medium' } = body;

    console.log("Generating questions for:", { topic, subject, count, difficulty });

    const systemPrompt = `You are an expert exam question generator. You output strict JSON only. Do not enclose the output in markdown code blocks.`;
    const userPrompt = `Generate ${count} ${difficulty} level multiple choice questions (MCQ) on the topic "${topic}" (Subject: ${subject}).
    
Return ONLY a raw JSON array of objects with no markdown formatting. Each object must have:
- text: The question text
- type: "mcq"
- options: Array of objects [{ "text": "Option A", "isCorrect": false }, { "text": "Option B", "isCorrect": true }, ...] (At least 4 options)
- explanation: Brief explanation of the answer
- difficulty: "${difficulty}"
- marks: 4

Ensure the JSON is valid.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const openrouterRes = await fetchGroq(messages, { temperature: 0.7, maxOutputTokens: 2048 });

    if (!openrouterRes) {
      // Mock response if no key
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        success: true,
        message: "Generated mock questions (No API Key)",
        count: 0
      });
    }

    if (!openrouterRes.ok) {
      throw new Error('OpenRouter API request failed');
    }

    const data = await openrouterRes.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    let questionsData;

    try {
      // Try to parse, removing potential markdown code blocks if present
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      questionsData = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (!Array.isArray(questionsData)) {
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 });
    }

    // Find or create topic
    let targetTopic = await prisma.topic.findFirst({
      where: {
        name: { equals: topic, mode: 'insensitive' },
        ...(body.subjectId ? { subjectId: body.subjectId } : {})
      }
    });

    if (!targetTopic) {
      // If we have subjectId, create it.
      if (body.subjectId) {
        targetTopic = await prisma.topic.create({
          data: {
            name: topic,
            subjectId: body.subjectId,
            difficulty: difficulty
          }
        });
      } else {
        return NextResponse.json({ error: "Topic not found and cannot create without subject ID" }, { status: 400 });
      }
    }

    const createdQuestions = [];

    for (const q of questionsData) {
      const created = await prisma.question.create({
        data: {
          text: q.text,
          type: 'mcq',
          options: JSON.stringify(q.options),
          correctAnswer: q.options.find(o => o.isCorrect)?.text || q.options[0].text,
          explanation: q.explanation,
          difficulty: q.difficulty,
          marks: q.marks || 4,
          topicId: targetTopic.id
        }
      });
      createdQuestions.push(created);
    }

    return NextResponse.json({
      success: true,
      data: createdQuestions,
      count: createdQuestions.length
    });

  } catch (error) {
    console.error('Generate Questions Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
