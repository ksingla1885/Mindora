## Question Bank System

### Overview

The Question Bank is the **core content engine** of Mindora, powering assessments, analytics, learning paths, and monetization. Each question serves multiple purposes across the entire student learning journey.

### Primary Uses

#### 1. Test Creation & Assessment

Questions from the question bank are used to create various types of tests:

- **Weekly Tests** - Free tests for students to practice regularly
- **Paid/Premium Tests** - Monetized assessments for revenue generation
- **Olympiad Tests** - Competition-based assessments for competitive exam preparation
- **Daily Practice Problems (DPP)** - Regular practice questions for consistent learning

The relationship is managed through the `TestQuestion` model which links questions to tests with:
- Custom sequencing for logical question flow
- Custom marks per question (can override default marks)
- Unique constraint to prevent duplicate questions in the same test

#### 2. Learning & Practice

Questions serve as:
- **Practice material** for students to test their understanding
- **Topic-specific assessments** linked to specific topics within subjects
- **Difficulty-based progression** (Easy → Medium → Hard) for adaptive learning

### Question Categorization & Organization

Questions are organized hierarchically:

```
Subject (e.g., Chemistry - Class 12)
  ↓
Topic (e.g., Alcohols, Phenols and Ethers)
  ↓
Question (e.g., "Which alcohol reacts fastest with Lucas reagent?")
```

Each question includes:
- **Subject**: The main subject area
- **Topic**: Specific topic within the subject
- **Difficulty**: Easy, Medium, or Hard
- **Type**: MCQ, Short Answer, or Long Answer
- **Marks**: Point value (default or custom)
- **Status**: Published or Draft
- **Explanation**: Detailed solution for learning

### Analytics & Performance Tracking

The `QuestionAnalytics` model provides comprehensive insights:

- **Total attempts**: Number of students who attempted the question
- **Correct attempts**: Success rate percentage
- **Average time**: Time students take to answer
- **Difficulty score**: Calculated based on actual performance (0-1 scale)
- **Discrimination index**: How well the question differentiates between strong and weak students
- **Distractor analysis**: Which wrong options are most commonly selected

**Benefits:**
- Identify poorly worded or ambiguous questions
- Detect questions that are too easy or too hard
- Improve question quality over time
- Understand common student misconceptions
- Optimize test difficulty distribution

### Student Progress Tracking

Questions contribute to:
- **Learning Progress**: Track which topics students struggle with
- **Study Sessions**: Monitor what students practice and for how long
- **Performance Reports**: Generate detailed analytics per student
- **Knowledge Gap Analysis**: Identify weak areas requiring attention

### Content Monetization

Questions enable the business model:
- **Free Tests**: Use questions to provide value and attract students
- **Paid Tests**: Premium question sets for revenue generation
- **Olympiad Preparation**: Specialized question banks for competitive exams
- **Subscription Plans**: Access to exclusive question banks

### Discussion & Community Learning

The `Discussion` model enables:
- Students to ask doubts about specific questions
- Peer-to-peer learning and collaboration
- Teacher/admin responses to clarify concepts
- Threaded discussions for detailed explanations
- Community-driven knowledge sharing

### Adaptive Learning Potential

With analytics data, the system can:
- Recommend questions based on student performance
- Create personalized practice sets
- Identify knowledge gaps automatically
- Suggest remedial topics and resources
- Adjust difficulty dynamically

### Question Workflow

```
1. Admin creates question via QuestionForm
   ↓
2. Question stored in database with:
   - Topic association
   - Difficulty level
   - Type (MCQ/Short/Long)
   - Options (for MCQ)
   - Correct answer
   - Explanation
   ↓
3. Question appears in Question Bank (admin/questions page)
   ↓
4. Admin can:
   - Edit question details
   - Delete question
   - Add to tests
   - Review analytics
   ↓
5. Question used in tests via TestQuestion junction table
   ↓
6. Students attempt questions during tests
   ↓
7. Analytics collected:
   - Performance metrics
   - Time spent per question
   - Common errors and patterns
   ↓
8. Insights used to:
   - Improve question quality
   - Identify weak topics
   - Personalize learning paths
   - Optimize test difficulty
```

### Database Schema

**Question Model:**
```prisma
model Question {
  id            String       @id @default(cuid())
  topicId       String       @map("topic_id")
  text          String
  type          String       // mcq, short_answer, long_answer
  options       Json?        // For MCQs
  correctAnswer String?      @map("correct_answer")
  explanation   String?
  difficulty    String?      @default("medium")
  marks         Int          @default(1)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  topic             Topic             @relation(fields: [topicId], references: [id])
  testQuestions     TestQuestion[]
  discussions       Discussion[]
  questionAnalytics QuestionAnalytics[]
}
```

**TestQuestion Model (Junction Table):**
```prisma
model TestQuestion {
  id           String       @id @default(cuid())
  testId       String       @map("test_id")
  questionId   String       @map("question_id")
  sequence     Int          @default(0)
  marks        Int          @default(1)
  createdAt    DateTime     @default(now())
  
  test       Test      @relation(fields: [testId], references: [id])
  question   Question  @relation(fields: [questionId], references: [id])
  
  @@unique([testId, questionId])
}
```

### Quality Control Features

The question form includes:
- **Explanation field**: Provide detailed solutions for student learning
- **Multiple options management**: Add/remove options dynamically
- **Correct answer validation**: Ensures at least one correct answer is selected
- **Subject-Topic filtering**: Maintains proper categorization
- **Minimum option requirement**: At least 2 options for MCQs
- **Empty option prevention**: Cannot select empty option as correct answer

### Example Use Case

**Question**: "Which of the following alcohols will react fastest with Lucas reagent?"

**Purpose:**
1. Assess conceptual understanding of alcohol reactivity
2. Test application of Lucas test principles
3. Differentiate between primary, secondary, and tertiary alcohols
4. Prepare students for Class 12 board exams and competitive exams (JEE, NEET)
5. Track mastery of the "Alcohols, Phenols and Ethers" topic

**Analytics Insights:**
- If 70% students get it wrong → Question may need better explanation
- If average time is 5 minutes → Question might be too complex
- If distractor analysis shows option B is never selected → Option B needs improvement

### Recommendations for Enhancement

1. **Image Support**: Add support for diagrams, especially for Chemistry structures and Physics diagrams
2. **LaTeX/Math Support**: Implement MathJax or KaTeX for chemical equations and mathematical expressions
3. **Question Tagging**: Add tags like "NCERT", "JEE", "NEET", "Board Exam" for better filtering
4. **Bulk Import**: Implement Excel/CSV import for faster question bank building
5. **Question Versioning**: Track edits and improvements over time
6. **Collaborative Review**: Allow multiple admins to review questions before publishing
7. **Question Templates**: Create templates for common question patterns
8. **AI-Assisted Generation**: Use AI to suggest questions based on topics
9. **Plagiarism Detection**: Check for duplicate or similar questions
10. **Multi-language Support**: Support questions in multiple languages

### API Endpoints

**GET /api/questions**
- List questions with optional filtering
- Query params: `topicId`, `type`, `difficulty`, `limit`, `page`
- Returns paginated question list with topic and subject details

**POST /api/questions**
- Create a new question
- Requires admin authentication
- Validates required fields and MCQ options
- Returns created question with relationships

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx123...",
    "text": "Which alcohol reacts fastest with Lucas reagent?",
    "type": "mcq",
    "difficulty": "medium",
    "marks": 4,
    "topic": {
      "id": "clx456...",
      "name": "Alcohols, Phenols and Ethers",
      "subject": {
        "id": "clx789...",
        "name": "Chemistry (Class 12)"
      }
    }
  }
}
```

### Admin Interface

**Question Bank Page** (`/admin/questions`)
- Search questions by text, topic, or author
- Filter by subject, topic, difficulty, type
- View question statistics (total, unreviewed)
- Quick actions: Add single question, bulk import, export bank
- Edit/delete questions inline
- View question analytics

**Question Form Features:**
- Subject and topic selection with cascading dropdowns
- Rich text editor for question text
- Dynamic option management (add/remove)
- Radio button selection for correct answer
- Difficulty and marks configuration
- Optional explanation field
- Real-time validation