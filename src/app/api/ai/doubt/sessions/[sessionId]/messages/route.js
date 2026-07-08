import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { fetchGroq } from '@/lib/ai';

const SYSTEM_INSTRUCTION =
  "You are Mindora AI, a helpful and encouraging tutor for students preparing for Olympiads (NSO, IMO, Mathematics, Science, etc.). " +
  "CRITICAL RULE: You must ONLY answer questions related to mathematics, science, education, Olympiads, or the Mindora platform. " +
  "If the user asks about ANY unrelated topics (like weather, general knowledge outside syllabus, current events, coding, pop culture, etc.), you MUST politely decline and remind them that you are only here to help with their studies. " +
  "Answer questions concisely and provide step-by-step explanations for problems. " +
  "Use Markdown and clean LaTeX math notation (e.g., $$x^2 + y^2 = z^2$$ or $$E = mc^2$$) when explaining mathematical or scientific formulas so they render beautifully. " +
  "If an image is provided, examine it carefully to solve the question inside the image. Be friendly, encouraging, and motivating.";

// Helper: Download a public image URL and convert to data URL for Groq Vision
async function downloadImageAsDataUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Failed to convert image to data URL:', error);
    return null;
  }
}

// Helper: Generate structured mock replies when GROQ API key is missing or rate-limited
function generateMockResponse(userQuery) {
  const query = userQuery.trim();
  const lowerQuery = query.toLowerCase();

  // Helper to capitalize words
  const capitalize = (str) => str.replace(/\b\w/g, c => c.toUpperCase());

  // Clean stop words to get a clean topic name
  let cleanTopic = query
    .replace(/^(what is the|what is|explain|solve|calculate|find|give me the|formula of|formula for|concept of)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();
  
  if (!cleanTopic) cleanTopic = "this concept";
  const titleTopic = capitalize(cleanTopic);

  // 1. MATH & GEOMETRY SPECIFIC TRIGGERS
  if (lowerQuery.includes('triangle')) {
    return `### Math Solution: Equilateral Triangle 📐

An equilateral triangle is a triangle in which all three sides are equal.

- **Area Formula:**
  $$\\text{Area} = \\frac{\\sqrt{3}}{4} s^2$$
  Where $$s$$ is the length of any side.

- **Perimeter Formula:**
  $$\\text{Perimeter} = 3s$$

- **Height (Altitude):**
  $$\\text{Height} = \\frac{\\sqrt{3}}{2} s$$

**Example calculation:**
If the side length of the triangle is $$s = 4\\text{ cm}$$, the area is:
$$\\text{Area} = \\frac{\\sqrt{3}}{4} \\cdot 4^2 = 4\\sqrt{3} \\approx 6.93\\text{ cm}^2$$

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
  }

  if (lowerQuery.includes('circle')) {
    return `### Math Solution: Circle Geometry 📐

For a circle of radius $$r$$:

- **Area Formula:**
  $$\\text{Area} = \\pi r^2$$

- **Circumference Formula:**
  $$\\text{Circumference} = 2 \\pi r$$

- **Diameter:**
  $$d = 2r$$

**Example calculation:**
If the radius of the circle is $$r = 7\\text{ cm}$$ and we use $$\\pi \\approx \\frac{22}{7}$$:
$$\\text{Circumference} = 2 \\cdot \\frac{22}{7} \\cdot 7 = 44\\text{ cm}$$

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
  }

  if (lowerQuery.includes('quadratic') || lowerQuery.includes('roots')) {
    return `### Algebra: Quadratic Equations 📐

A quadratic equation is expressed in the standard form:
$$ax^2 + bx + c = 0$$

- **Quadratic Formula (Roots):**
  $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

- **Discriminant ($$D$$):**
  $$D = b^2 - 4ac$$
  * If $$D > 0$$: Two distinct real roots.
  * If $$D = 0$$: One real root (repeated).
  * If $$D < 0$$: Two complex conjugate roots.

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
  }

  // 2. SCIENCE SPECIFIC TRIGGERS
  if (lowerQuery.includes('gravity') || lowerQuery.includes('gravitation')) {
    return `### Physics Concept: Gravitation 🔬

**Gravitation** is a natural phenomenon by which all things with mass or energy are brought toward one another.

- **Newton's Law of Universal Gravitation:**
  $$F = G \\frac{m_1 m_2}{r^2}$$
  Where:
  * $$F$$ is the gravitational force between two masses.
  * $$G$$ is the gravitational constant ($$6.674 \\times 10^{-11}\\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$$).
  * $$m_1, m_2$$ are the masses of the two objects.
  * $$r$$ is the distance between the centers of their masses.

- **Acceleration due to gravity ($$g$$):**
  On Earth's surface, $$g \\approx 9.8\\text{ m/s}^2$$.

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
  }

  if (lowerQuery.includes('photosynthesis')) {
    return `### Biology Concept: Photosynthesis 🔬

**Photosynthesis** is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy.

- **Chemical Equation of Photosynthesis:**
  $$6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{Light/Chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$

- **Key Components:**
  1. **Carbon Dioxide ($$\\text{CO}_2$$):** Absorbed from the air through stomata.
  2. **Water ($$\\text{H}_2\\text{O}$$):** Absorbed by the roots from the soil.
  3. **Light:** Captured by chlorophyll pigments in chloroplasts.
  4. **Glucose ($$\\text{C}_6\\text{H}_{12}\\text{O}_6$$):** Used by the plant as food/energy.

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
  }

  // 3. GENERIC MATH/FORMULA GENERATOR
  if (lowerQuery.includes('solve') || lowerQuery.includes('math') || lowerQuery.includes('equation') || lowerQuery.includes('formula') || lowerQuery.includes('value of')) {
    return `### Mathematics: ${titleTopic} 📐

Let's explore the mathematical formula or solution for **${cleanTopic}**:

1. **Core Concept:**
   Olympiad math questions relating to **${cleanTopic}** require identifying the key variables and mathematical relations.

2. **Standard Equation:**
   Let's assume the relation is defined by:
   $$y = f(x)$$
   
   If we analyze the factors:
   * Dependent variable: $$y$$
   * Independent variable: $$x$$

3. **Step-by-Step Approach:**
   * Step 1: Identify all given constants and values.
   * Step 2: Substitute these values into the standard formula.
   * Step 3: Simplify the equation and solve for the unknown parameter.

Would you like to try a specific practice question on **${cleanTopic}**? Let me know the exact parameters!

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
  }

  // 4. GENERIC SCIENCE/CONCEPT GENERATOR
  if (lowerQuery.includes('explain') || lowerQuery.includes('science') || lowerQuery.includes('concept') || lowerQuery.includes('what is') || lowerQuery.includes('definition')) {
    return `### Science Concept: ${titleTopic} 🔬

Let's understand **${cleanTopic}** clearly:

- **Definition:** **${titleTopic}** represents a fundamental topic in Olympiad science and critical thinking.
- **Key Principle:** This concept describes physical, chemical, or biological interactions where:
  $$E = mc^2$$ or other proportional relationships govern the state.
- **Why It Matters:** Mastering **${cleanTopic}** helps solve multiple-choice and conceptual problems in competitive exams.

If you have a specific numerical question or sub-topic related to **${cleanTopic}**, paste it here and we can solve it step-by-step!

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
  }

  // 5. DEFAULT MOTIVATING FALLBACK
  return `Hello! I am **Mindora AI**, your personal Olympiad tutor. 🏆

I am ready to help you solve questions, verify your answers, or explain complex science and math concepts step-by-step.

You asked about: **"${query}"**

To help me give you a detailed walkthrough:
1. Provide the numbers or equations if it's a math problem.
2. Specify the subject (Physics, Chemistry, Biology) if it's a science question.

Let me know what you'd like to work on next!

*(Note: Mindora AI is in mock/sandbox mode because the Groq API key is not configured.)*`;
}

// POST /api/ai/doubt/sessions/[sessionId]/messages - Send a doubt message
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    // Check ownership of session
    const doubtSession = await prisma.aIDoubtSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!doubtSession) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    const { content, imageUrl } = await request.json();

    if (!content && !imageUrl) {
      return NextResponse.json({ error: 'Message content or image is required' }, { status: 400 });
    }

    // 1. Save user message to database
    const userMessage = await prisma.aIDoubtMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: content || 'Analyze this image:',
        imageUrl: imageUrl || null,
      },
    });

    // 2. Fetch full session history to feed context to AI
    const history = await prisma.aIDoubtMessage.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 3. Prepare Groq API Messages
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'assistant', content: 'Understood! I am Mindora AI, ready to tutor the student.' },
    ];
    
    let hasVision = false;

    for (const msg of history) {
      const contentArray = [];

      if (msg.content) {
        contentArray.push({ type: 'text', text: msg.content });
      }

      if (msg.imageUrl) {
        const dataUrl = await downloadImageAsDataUrl(msg.imageUrl);
        if (dataUrl) {
            contentArray.push({ type: 'image_url', image_url: { url: dataUrl } });
            hasVision = true;
        } else if (!msg.content) {
            contentArray.push({ type: 'text', text: '[Attached Media Failed to Load]' });
        }
      }

      messages.push({
        role: msg.role,
        content: contentArray.length === 1 && contentArray[0].type === 'text' ? contentArray[0].text : contentArray,
      });
    }

    // Determine model (Groq requires specific vision models if using image_url)
    const model = hasVision ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile';

    // 4. Query Groq API
    const groqRes = await fetchGroq(messages, { temperature: 0.7, maxOutputTokens: 2048, model });

    let assistantText = '';

    if (!groqRes) {
      // Mock Mode
      assistantText = generateMockResponse(content || '');
    } else {
        if (!groqRes.ok) {
          const errBody = await groqRes.json();
          console.error('Groq API error in Doubt Solver:', errBody);
    
          if (groqRes.status === 429) {
            assistantText = generateMockResponse(content || '') + 
              `\n\n*(Note: Displayed above is a fallback solution because the Groq API rate limit was temporarily exceeded.)*`;
          } else {
            return NextResponse.json(
              { error: errBody?.error?.message || 'AI request failed' },
              { status: groqRes.status }
            );
          }
        } else {
          const data = await groqRes.json();
          assistantText = data?.choices?.[0]?.message?.content ?? '';
          if (!assistantText) {
            assistantText = 'I am sorry, I was not able to generate a response. Please try again.';
          }
        }
    }

    // 5. Save assistant reply to database
    const assistantMessage = await prisma.aIDoubtMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: assistantText,
      },
    });

    // Update the session's title to be the first user prompt if it was the first message
    const isFirstPair = history.length <= 1; 
    const updateData = { updatedAt: new Date() };
    if (isFirstPair && content) {
      const cleanTitle = content.substring(0, 35) + (content.length > 35 ? '...' : '');
      updateData.title = cleanTitle;
    }

    await prisma.aIDoubtSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      userMessage,
      assistantMessage,
    });

  } catch (error) {
    console.error('Error posting doubt message:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
