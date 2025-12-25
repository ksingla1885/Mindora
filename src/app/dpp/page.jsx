'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Flame,
  Play,
  Bookmark,
  Brain,
  BarChart,
  Clock,
  Medal,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

// Layout Imports
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { Search, Bell, Menu, BookOpen } from "lucide-react";


// Mock Daily Problem Data
const DAILY_PROBLEM = {
  id: 'dpp-2023-12-25',
  date: 'December 25, 2025',
  subject: 'Deep Learning',
  topic: 'Optimization Algorithms',
  concept: 'Adam vs SGD',
  difficulty: 'Hard',
  streak: 12,
  question: {
    type: 'MCQ', // or 'SUBJECTIVE'
    text: "Which of the following statements about Adam optimization is TRUE compared to SGD?",
    options: [
      { id: 'A', text: "Adam uses a single learning rate for all parameters." },
      { id: 'B', text: "Adam adapts learning rates for each parameter based on first and second moments of gradients." },
      { id: 'C', text: "Adam never converges on non-convex surfaces." },
      { id: 'D', text: "SGD always converges faster than Adam on sparse data." }
    ],
    correctAnswer: 'B',
    explanation: "Adam (Adaptive Moment Estimation) maintains per-parameter learning rates that are adapted based on the average of recent magnitudes of the gradients for the weight (like RMSProp). This means it performs well on problems with sparse gradients and noisy problems.",
    formula: "m_t = β1*m_{t-1} + (1-β1)*g_t",
    hint: "Think about how adaptive moment estimation handles different parameters."
  }
};

export default function DailyPracticePage() {
  // States: 'entry', 'solve', 'feedback', 'reflection'
  const [viewState, setViewState] = useState('entry');
  const [selectedOption, setSelectedOption] = useState(null);
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [confidence, setConfidence] = useState([50]);
  const [timerActive, setTimerActive] = useState(false);

  // Auth Session
  const { data: session } = useSession();

  // Timer logic
  useEffect(() => {
    let interval;
    if (timerActive && viewState === 'solve') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, viewState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startProblem = () => {
    setViewState('solve');
    setTimerActive(true);
  };

  const submitAnswer = () => {
    setTimerActive(false);
    setIsSubmitted(true);

    // Check answer logic
    let correct = false;
    if (DAILY_PROBLEM.question.type === 'MCQ') {
      correct = selectedOption === DAILY_PROBLEM.question.correctAnswer;
    } else {
      correct = true;
    }

    setIsCorrect(correct);
    setViewState('feedback');
  };

  const handleConfidenceSubmit = () => {
    // Submit confidence logic
  };

  // Animation Variants
  const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  // Render logic for the internal states (Entry, Solve, Feedback)
  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        {/* 1. ENTRY STATE (From HTML Design) */}
        {viewState === 'entry' && (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1024px] w-full flex flex-col gap-10"
          >
            {/* Breadcrumbs/Date Chips */}
            <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/10 dark:bg-[#282e39] border border-primary/10 dark:border-transparent pl-4 pr-4">
                <Calendar className="size-4 text-primary dark:text-blue-400" />
                <p className="text-primary dark:text-blue-100 text-xs font-bold uppercase tracking-wider">{DAILY_PROBLEM.date}</p>
              </div>
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-orange-500/10 dark:bg-orange-900/20 border border-orange-500/20 pl-4 pr-4">
                <Flame className="size-4 text-orange-600 dark:text-orange-400" />
                <p className="text-orange-700 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">Daily Challenge</p>
              </div>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
              {/* Text Content */}
              <div className="flex flex-col gap-6 flex-1 min-w-0">
                <div className="flex flex-col gap-3">
                  <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.03em] text-foreground">
                    Optimization <br className="hidden sm:block" /> Algorithms
                  </h1>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl font-light">
                    Today we dive into the mechanics of <span className="text-foreground font-medium">Adam vs. SGD</span>. Analyze the convergence rates and select the appropriate learning rate for the given dataset to minimize loss efficiently.
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={startProblem}
                    suppressHydrationWarning
                    className="flex min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-xl h-14 px-8 bg-[#135bec] hover:bg-blue-600 text-white text-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
                  >
                    <Play className="size-5 fill-current" />
                    <span>Start Problem</span>
                  </button>
                  <button
                    suppressHydrationWarning
                    className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-xl h-14 px-6 bg-card border border-border hover:bg-gray-50 dark:hover:bg-[#323946] text-foreground text-base font-medium transition-colors"
                  >
                    <Bookmark className="size-5" />
                    <span>Save for later</span>
                  </button>
                </div>
              </div>

              {/* Visual Block */}
              <div className="w-full lg:w-[420px] shrink-0">
                <div className="relative w-full aspect-video lg:aspect-square bg-gradient-to-br from-[#1c2333] to-[#101622] rounded-2xl border border-border overflow-hidden flex items-center justify-center group shadow-2xl">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101622]/80 to-transparent"></div>
                  <div
                    className="relative z-10 w-full h-full bg-center bg-cover mix-blend-lighten opacity-80"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBfOAlCJ2EfVIZCXHEUq1lpk7il5uRwxuR5kziy7c0bLft4SDeUQ-8SQE4fJMHXFah_phybsE4a4L8PkqLa1voraIUy12IJpYaPUNBGA6EcW96UfhbNY9BrW4WfEKsnVOm7d2vnmWibHIXFObezgVcHeDbX2dpmM4zL3lr0z2lUFvJGwyTrnlWTdU6paNfZUvncTjHm6I2r1PWxgsDu94ghorBC8Qc_ISnqK17LQJiOVHf90GZfnI61ml8UxU8jGCzpekvPIef0spM")' }}
                  ></div>
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#282e39]/90 backdrop-blur-md border border-[#3b4555] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Focus Topic</span>
                      <span className="text-white font-bold text-lg">Deep Learning</span>
                    </div>
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Brain className="size-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
              {[
                { icon: Flame, color: 'text-orange-500', bg: 'bg-card', label: 'Streak', value: `Day ${DAILY_PROBLEM.streak}` },
                { icon: BarChart, color: 'text-red-500', bg: 'bg-card', label: 'Difficulty', value: DAILY_PROBLEM.difficulty },
                { icon: Clock, color: 'text-blue-400', bg: 'bg-card', label: 'Est. Time', value: '15 mins' },
                { icon: Medal, color: 'text-purple-400', bg: 'bg-card', label: 'Reward', value: '+50 XP' },
              ].map((stat, i) => (
                <div key={i} className={`flex flex-col gap-1 rounded-xl p-5 ${stat.bg} border border-border shadow-sm hover:border-primary/50 transition-colors group cursor-default`}>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`size-5 ${stat.color}`} />
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                  </div>
                  <p className={`text-foreground text-2xl font-bold leading-tight group-hover:${stat.color.replace('text-', 'text-')} transition-colors`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 2. SOLVE MODE (Custom React Implementation reusing HTML styling ideas) */}
        {viewState === 'solve' && (
          <motion.div
            key="solve"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-3xl flex flex-col gap-6"
          >
            <Button variant="ghost" className="self-start gap-2 mb-4" onClick={() => setViewState('entry')}>
              <ChevronLeft className="w-4 h-4" /> Back to Overview
            </Button>

            {/* Problem Card */}
            <div className="bg-card w-full rounded-2xl border border-border shadow-sm p-6 md:p-10 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Problem</h2>
                <div className="font-mono text-muted-foreground bg-accent/50 px-2 py-1 rounded text-sm flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {formatTime(timeElapsed)}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-foreground">
                  {DAILY_PROBLEM.question.text}
                </p>

                {/* Options */}
                {DAILY_PROBLEM.question.type === 'MCQ' ? (
                  <div className="grid grid-cols-1 gap-4">
                    {DAILY_PROBLEM.question.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`p-5 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 group ${selectedOption === opt.id
                          ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(var(--primary),0.2)]'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${selectedOption === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-muted-foreground/30 text-muted-foreground'
                          }`}>
                          {opt.id}
                        </span>
                        <span className="text-lg font-medium text-foreground">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Textarea
                    placeholder="Write your answer here..."
                    value={subjectiveAnswer}
                    onChange={(e) => setSubjectiveAnswer(e.target.value)}
                    className="min-h-[150px] text-lg p-4 bg-muted/20 border-muted focus:border-primary resize-none"
                  />
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                className="px-8 h-12 text-lg"
                disabled={DAILY_PROBLEM.question.type === 'MCQ' ? !selectedOption : !subjectiveAnswer}
                onClick={submitAnswer}
              >
                Submit Answer
              </Button>
            </div>
          </motion.div>
        )}

        {/* 3 & 4. FEEDBACK & REFLECTION STATE */}
        {(viewState === 'feedback' || viewState === 'reflection') && (
          <motion.div
            key="feedback"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-3xl space-y-6"
          >
            {/* Feedback Banner */}
            <div className={`w-full rounded-2xl p-6 md:p-8 flex items-start gap-4 ${isCorrect
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
              }`}>
              {isCorrect ? <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" /> : <XCircle className="w-8 h-8 text-red-500 shrink-0" />}
              <div>
                <h2 className={`text-xl font-bold mb-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {isCorrect ? 'Correct Answer!' : 'Incorrect'}
                </h2>
                <p className="text-muted-foreground">
                  {isCorrect ? "Excellent work. You nailed the concept." : `The correct answer is ${DAILY_PROBLEM.question.correctAnswer}. Let's understand why.`}
                </p>
              </div>
            </div>

            {/* Explanation Card */}
            <Card className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Explanation
                </h3>
                <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed text-foreground">
                  <p>{DAILY_PROBLEM.question.explanation}</p>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-xs font-bold uppercase text-primary mb-2">Key Formula</h4>
                <p className="font-mono text-lg text-foreground">{DAILY_PROBLEM.question.formula}</p>
              </div>
            </Card>

            {/* Reflection / Next */}
            {viewState === 'feedback' ? (
              <div className="flex gap-4 justify-between items-center pt-4">
                <Button variant="outline" className="gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Ask AI to Explain
                </Button>
                <Button
                  className="gap-2 px-8"
                  onClick={() => setViewState('reflection')}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="bg-card w-full rounded-2xl border border-border shadow-sm p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-foreground">Daily Reflection</h3>
                  <p className="text-muted-foreground">How confident do you feel about this concept?</p>

                  <div className="max-w-md mx-auto py-6">
                    <Slider
                      defaultValue={[50]}
                      max={100}
                      step={1}
                      value={confidence}
                      onValueChange={setConfidence}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Confused</span>
                      <span>Somewhat</span>
                      <span>Confident</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link href="/dashboard">
                      <Button size="lg" className="w-full md:w-auto min-w-[200px]" onClick={handleConfidenceSubmit}>
                        Complete Session
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-display selection:bg-primary/20">
      {/* Reusing AppSidebar from layout */}
      <AppSidebar className="hidden lg:flex" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Reusing Header logic from layout */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 lg:px-8">
          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">Mindora</span>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile, visible on lg */}
          <div className="hidden max-w-md flex-1 items-center rounded-lg bg-accent/50 px-3 py-2 lg:flex ml-4 border border-transparent focus-within:border-primary/20 transition-all">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              className="ml-2 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Search for tests, topics, or notes..."
              type="text"
              suppressHydrationWarning
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <button
              className="relative rounded-full bg-accent/50 p-2 text-muted-foreground hover:text-primary transition-colors"
              suppressHydrationWarning
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {session?.user?.name || "Student"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.class
                    ? `Class ${session.user.class}`
                    : (session?.user?.role
                      ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1).toLowerCase()
                      : 'Student')}
                </p>
              </div>
              <div className="h-10 w-10 overflow-hidden rounded-full border border-border">
                <img
                  alt="Profile"
                  className="h-full w-full object-cover"
                  src={session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuC0YT5nhftwsOfovnhrb11Wqm_bKO9g85B0QGT2j4TFdfYADrM5HAInhgDCbcx6mvHc0qqwQuo9gzMK_4kC12EDCK_V6MN0TlvmuVp7Pr0CwVs0PX2Bm6RAgx6kjVfJueqQa9JM1sCeWPYXr-y3ssDYe1LP1LUorNYmUtGRm1zpz4yHw6tmrACnFx2_GKCdBpHB9specw94pk8yxs_LY1bg2686Ndyi1M_nJELAkdFwzt2Gp9LhOVUxRZqO1RPtcLVV4pCB4i5HbEuo"}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-start w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-12 overflow-y-auto scroll-smooth bg-background">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

