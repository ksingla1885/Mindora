import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const questions = body.questions;

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: 'Payload must contain a "questions" array' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const rowNum = i + 1;
      try {
        if (!q.text || !q.text.trim()) {
          throw new Error('Question text is required');
        }

        const type = q.type ? q.type.trim().toLowerCase() : 'mcq';
        if (!['mcq', 'true_false', 'short_answer', 'long_answer'].includes(type)) {
          throw new Error(`Unsupported question type: "${type}". Expected mcq, true_false, short_answer, or long_answer`);
        }

        // Normalize subject
        const subjectName = q.subject ? q.subject.trim() : 'General';
        let subject = await prisma.subject.findFirst({
          where: { name: { equals: subjectName, mode: 'insensitive' } }
        });
        if (!subject) {
          subject = await prisma.subject.create({
            data: { name: subjectName }
          });
        }

        // Normalize topic
        const topicName = q.topic ? q.topic.trim() : 'General';
        let topic = await prisma.topic.findFirst({
          where: {
            subjectId: subject.id,
            name: { equals: topicName, mode: 'insensitive' }
          }
        });
        if (!topic) {
          topic = await prisma.topic.create({
            data: {
              name: topicName,
              subjectId: subject.id,
              difficulty: 'medium'
            }
          });
        }

        let formattedOptions = null;
        let finalCorrectAnswer = null;

        if (type === 'mcq') {
          if (!q.options || !Array.isArray(q.options)) {
            throw new Error('Options array is required for MCQs');
          }

          const optionsList = q.options
            .map((optText, idx) => ({
              id: (idx + 1).toString(),
              text: typeof optText === 'string' ? optText.trim() : String(optText || '').trim()
            }))
            .filter(opt => opt.text !== '');

          if (optionsList.length < 2) {
            throw new Error('At least 2 non-empty options are required for MCQs');
          }

          const rawAns = q.correctAnswer ? String(q.correctAnswer).trim() : '';
          if (!rawAns) {
            throw new Error('Correct answer is required for MCQs');
          }

          // Resolve correct answer option text
          let matchedOpt = null;
          const letterIndex = rawAns.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
          if (rawAns.length === 1 && letterIndex >= 0 && letterIndex < optionsList.length) {
            matchedOpt = optionsList[letterIndex];
          } else {
            const parsedIndex = parseInt(rawAns, 10);
            if (!isNaN(parsedIndex) && parsedIndex >= 1 && parsedIndex <= optionsList.length) {
              matchedOpt = optionsList[parsedIndex - 1];
            } else {
              matchedOpt = optionsList.find(opt => opt.text.toLowerCase() === rawAns.toLowerCase());
            }
          }

          if (matchedOpt) {
            finalCorrectAnswer = matchedOpt.text;
          } else {
            finalCorrectAnswer = rawAns;
          }

          formattedOptions = JSON.stringify(optionsList);

        } else if (type === 'true_false') {
          const optionsList = [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' }
          ];

          const rawAns = q.correctAnswer ? String(q.correctAnswer).trim().toLowerCase() : '';
          if (['true', 'yes', 't', 'y', '1'].includes(rawAns)) {
            finalCorrectAnswer = 'True';
          } else if (['false', 'no', 'f', 'n', '0'].includes(rawAns)) {
            finalCorrectAnswer = 'False';
          } else {
            throw new Error('Correct answer for true/false must be True or False');
          }

          formattedOptions = JSON.stringify(optionsList);
        } else {
          // short_answer or long_answer
          finalCorrectAnswer = q.correctAnswer ? String(q.correctAnswer).trim() : null;
        }

        const difficulty = q.difficulty ? q.difficulty.trim().toLowerCase() : 'medium';
        const marks = q.marks ? parseInt(q.marks, 10) : 4;

        await prisma.question.create({
          data: {
            text: q.text.trim(),
            type,
            options: formattedOptions,
            correctAnswer: finalCorrectAnswer,
            explanation: q.explanation ? String(q.explanation).trim() : null,
            difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
            marks: isNaN(marks) ? 4 : marks,
            topic: {
              connect: { id: topic.id }
            }
          }
        });

        successCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          row: rowNum,
          text: q.text ? (q.text.length > 50 ? q.text.substring(0, 50) + '...' : q.text) : 'Empty question text',
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: successCount,
      failedCount: failedCount,
      errors: errors
    });

  } catch (error) {
    console.error('Error in bulk question import:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk import request' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request) {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const body = await request.json();
    const { questionIds } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payload must contain a non-empty "questionIds" array' },
        { status: 400 }
      );
    }

    // If force is false, check if any of the requested questions are used in tests
    if (!force) {
      const referencedQuestions = await prisma.testQuestion.findMany({
        where: {
          questionId: { in: questionIds }
        },
        select: {
          questionId: true
        }
      });

      if (referencedQuestions.length > 0) {
        return NextResponse.json({
          success: false,
          code: 'USED_IN_TESTS',
          error: `Cannot delete questions because some of them are used in active tests.`,
          referencedCount: referencedQuestions.length
        }, { status: 400 });
      }
    }

    // Perform the bulk deletion inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all TestQuestion links
      await tx.testQuestion.deleteMany({
        where: { questionId: { in: questionIds } }
      });
      // 2. Delete all dPPQuestion links
      await tx.dPPQuestion.deleteMany({
        where: { questionId: { in: questionIds } }
      });
      // 3. Delete all dPPAssignment links
      await tx.dPPAssignment.deleteMany({
        where: { questionId: { in: questionIds } }
      });
      // 4. Delete all questionAnalytics links
      await tx.questionAnalytics.deleteMany({
        where: { questionId: { in: questionIds } }
      });
      // 5. Delete all discussion links
      await tx.discussion.deleteMany({
        where: { questionId: { in: questionIds } }
      });
      // 6. Delete all the questions themselves
      await tx.question.deleteMany({
        where: { id: { in: questionIds } }
      });
    });

    return NextResponse.json({
      success: true,
      deletedCount: questionIds.length,
      message: 'Questions deleted successfully'
    });

  } catch (error) {
    console.error('Error in bulk question deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete selected questions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
