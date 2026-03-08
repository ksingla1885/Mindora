

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
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

// Layout Imports
import { AppSidebar } from "@/components/app-sidebar";
import { useSession } from "next-auth/react";
import { Search, Bell, Menu, BookOpen } from "lucide-react";

export default function DailyPracticePage() {
  // States: 'entry', 'solve', 'feedback', 'reflection'
  const [viewState, setViewState] = useState('entry');
  const [dppData, setDppData] = useState(null); // The currently active/selected DPP
  const [allDpps, setAllDpps] = useState([]); // All available DPPs for the day
  const [isLoading, setIsLoading] = useState(true);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: { selectedOption: 'A', subjective: '...' } }
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [confidence, setConfidence] = useState([50]);

  // Auth Session
  const { data: session } = useSession();

  useEffect(() => {
    fetchDPP();
  }, []);

  const fetchDPP = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/student/dpp');
      if (res.ok) {
        const data = await res.json();
        if (data.dpps && data.dpps.length > 0) {
          setAllDpps(data.dpps);
          // If only one, or for compatibility, set it as default active
          setDppData(data.dpps[0]);
        } else {
          setAllDpps([]);
          setDppData(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch DPP", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const startProblem = (selectedDpp = null) => {
    const dppToStart = selectedDpp || dppData;
    if (!dppToStart || !dppToStart.questions || dppToStart.questions.length === 0) return;

    setDppData(dppToStart);
    setViewState('solve');
    setTimerActive(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setTimeElapsed(0);
  };

  const handleAnswerSelect = (qId, value, type) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: type === 'MCQ' || type === 'TRUE_FALSE'
        ? { selectedOption: value }
        : { subjective: value }
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < dppData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setTimerActive(false);
    setIsLoading(true);

    try {
      // Submit each answer one by one
      const submissionPromises = dppData.questions.map(qItem => {
        const userAns = answers[qItem.question.id];
        if (!userAns) return Promise.resolve();

        const answer = qItem.question.type === 'MCQ' || qItem.question.type === 'TRUE_FALSE'
          ? userAns.selectedOption
          : userAns.subjective;

        return fetch(`/api/dpp/${qItem.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer,
            timeSpent: Math.floor(timeElapsed / dppData.questions.length) // Distributed time
          })
        });
      });

      await Promise.all(submissionPromises);

      setIsSubmitted(true);
      setViewState('feedback');
    } catch (error) {
      console.error("Failed to submit DPP answers", error);
      alert("Something went wrong while saving your answers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfidenceSubmit = () => {
    // Submit confidence logic
    // Redirect or show success
  };

  // Animation Variants
  const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      );
    }

    if (!dppData) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-6">
            <Brain className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">No Daily Problem Available</h2>
          <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
            There is currently no daily practice problem available for your class. Check back tomorrow!
          </p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      );
    }

    const currentQData = dppData.questions[currentQuestionIndex];
    if (viewState === 'solve' && !currentQData) return null; // Safety

    // Helper to calculate score for feedback view
    // This is simple client-side calc. Ideally server returns results.
    let score = 0;
    let totalQuestions = dppData.questions.length;
    if (isSubmitted) {
      dppData.questions.forEach(qItem => {
        const q = qItem.question;
        const userAns = answers[q.id];

        // Standardize type check
        const type = q.type.toLowerCase();
        if (!userAns) return;

        if (type === 'mcq') {
          if (userAns.selectedOption === q.correctAnswer) score++;
        } else if (type === 'true_false') {
          // userAns.selectedOption is 'true' or 'false' string
          if (userAns.selectedOption === q.correctAnswer) score++;
        } else if (type === 'short_answer') {
          if (userAns.subjective?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) score++;
        }
      });
    }

    return (
      <AnimatePresence mode="wait">
        {/* 1. ENTRY STATE */}
        {viewState === 'entry' && (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1240px] w-full flex flex-col gap-8"
          >
            {/* Header Section */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Daily Practice Problems
              </h1>
              <p className="text-muted-foreground text-lg">
                Stay consistent with your goals. Here are your practice sets for today.
              </p>
            </div>

            {/* DPP Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDpps.map((dpp, idx) => (
                <motion.div
                  key={dpp.id || `dpp-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full">
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      {dpp.status === 'COMPLETED' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="size-3" />
                          <span>Finished</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                          <Play className="size-3 fill-current" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>

                    {/* Visual Header */}
                    <div className="h-40 relative bg-gradient-to-br from-[#1c2333] to-[#101622] flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent"></div>

                      <Brain className={`size-12 transition-transform duration-500 group-hover:scale-110 ${dpp.status === 'COMPLETED' ? 'text-emerald-500/50' : 'text-primary/50'}`} />

                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1 block">
                          {dpp.subject?.name || "General"}
                        </span>
                        <h3 className="text-xl font-bold text-foreground line-clamp-1">
                          {dpp.subject?.name} Practice
                        </h3>
                      </div>
                    </div>

                    {/* Stats & Content */}
                    <div className="p-6 flex-1 flex flex-col gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Questions</span>
                          <span className="text-foreground font-bold">{dpp.questions.length} Sets</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Class</span>
                          <span className="text-foreground font-bold">{dpp.class || "12th"}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border/50">
                        {dpp.status === 'COMPLETED' ? (
                          <Button
                            variant="outline"
                            className="w-full h-11 rounded-xl font-bold gap-2 group-hover:bg-emerald-500/5 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all"
                            onClick={() => {
                              setDppData(dpp);
                              setIsSubmitted(true);
                              setViewState('feedback');
                            }}
                          >
                            <Medal className="size-4" />
                            Review Results
                          </Button>
                        ) : (
                          <Button
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold gap-2 transition-all shadow-lg shadow-primary/20"
                            onClick={() => startProblem(dpp)}
                          >
                            <Play className="size-4 fill-current" />
                            Start Practice
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Streak/Stats Widget (Optional Footer) */}
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Flame className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">You're on a 5-day streak!</h4>
                  <p className="text-sm text-muted-foreground">Complete today's problems to keep it going.</p>
                </div>
              </div>
              <Button variant="ghost" className="text-primary font-bold hover:bg-primary/10" asChild>
                <Link href="/dashboard">View Leaderboard <ArrowRight className="size-4 ml-2" /></Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* 2. SOLVE MODE */}
        {viewState === 'solve' && (
          <motion.div
            key="solve"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-3xl flex flex-col gap-6"
          >
            <div className="flex items-center justify-between w-full mb-4">
              <Button variant="ghost" className="gap-2" onClick={() => setViewState('entry')}>
                <ChevronLeft className="w-4 h-4" /> Quit
              </Button>
              <div className="flex gap-2">
                {/* Navigation Dots if needed, or simple progress */}
                <span className="text-sm font-bold text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {dppData.questions.length}
                </span>
              </div>
            </div>

            {/* Problem Card */}
            <div className="bg-card w-full rounded-2xl border border-border shadow-sm p-6 md:p-10 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Question {currentQuestionIndex + 1}
                </h2>
                <div className="font-mono text-muted-foreground bg-accent/50 px-2 py-1 rounded text-sm flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {formatTime(timeElapsed)}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-foreground">
                  {currentQData.question.text}
                </p>

                {/* Options / Input based on type */}
                {(() => {
                  const q = currentQData.question;
                  const type = q.type.toLowerCase();
                  const currentAnswer = answers[q.id];

                  if (type === 'mcq') {
                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(q.options || {}).map(([key, value]) => (
                          <button
                            key={key}
                            onClick={() => handleAnswerSelect(q.id, key, 'MCQ')}
                            className={`p-5 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 group ${currentAnswer?.selectedOption === key
                              ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(var(--primary),0.2)]'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                              }`}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${currentAnswer?.selectedOption === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-muted-foreground/30 text-muted-foreground'}`}>
                              {key}
                            </span>
                            <span className="text-lg font-medium text-foreground">{value}</span>
                          </button>
                        ))}
                      </div>
                    );
                  } else if (type === 'true_false') {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['true', 'false'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleAnswerSelect(q.id, opt, 'TRUE_FALSE')}
                            className={`p-5 rounded-xl border-2 text-center transition-all duration-200 uppercase font-bold tracking-widest ${currentAnswer?.selectedOption === opt
                              ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(var(--primary),0.2)] text-primary'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50 text-muted-foreground'
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )
                  } else {
                    // Short Answer
                    return (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={currentAnswer?.subjective || ''}
                        onChange={(e) => handleAnswerSelect(q.id, e.target.value, 'SHORT_ANSWER')}
                        className="min-h-[150px] text-lg p-4 bg-muted/20 border-muted focus:border-primary resize-none"
                      />
                    )
                  }
                })()}

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="w-32"
              >
                Previous
              </Button>

              {currentQuestionIndex === dppData.questions.length - 1 ? (
                <Button
                  size="lg"
                  className="px-8 h-12 text-lg w-32 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={submitQuiz}
                >
                  Submit
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="px-8 h-12 text-lg w-32"
                  onClick={nextQuestion}
                >
                  Next
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. FEEDBACK STATE (Results) */}
        {(viewState === 'feedback' || viewState === 'reflection') && (
          <motion.div
            key="feedback"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-4xl space-y-8 pb-20"
          >
            {/* Score Header */}
            <div className="bg-card w-full rounded-2xl border border-border shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-4">
              <h2 className="text-3xl font-black text-foreground">
                {dppData.status === 'COMPLETED' ? "Practice Results" : "DPP Completed!"}
              </h2>
              <div className="text-5xl font-black text-primary">
                {score} / {totalQuestions}
              </div>
              <p className="text-muted-foreground">You answered {score} questions correctly.</p>
            </div>

            {/* Questions Review list */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold px-2">Detailed Review</h3>
              {dppData.questions.map((qItem, idx) => {
                const q = qItem.question;
                const type = q.type?.toLowerCase() || '';
                const userAns = answers[q.id];
                let isCorrect = qItem.isCorrect || false;
                let userAnswerText = "Not Answered";

                if (qItem.status === 'COMPLETED' && !userAns) {
                  if (type === 'mcq') userAnswerText = `Option ${qItem.userAnswer}`;
                  else if (type === 'true_false') userAnswerText = String(qItem.userAnswer).toUpperCase();
                  else userAnswerText = qItem.userAnswer;
                  isCorrect = qItem.isCorrect;
                } else {
                  if (type === 'mcq') {
                    if (userAns?.selectedOption === q.correctAnswer) isCorrect = true;
                    if (userAns?.selectedOption) userAnswerText = `Option ${userAns.selectedOption}`;
                  } else if (type === 'true_false') {
                    if (userAns?.selectedOption === q.correctAnswer) isCorrect = true;
                    if (userAns?.selectedOption) userAnswerText = userAns.selectedOption.toUpperCase();
                  } else {
                    if (userAns?.subjective?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) isCorrect = true;
                    if (userAns?.subjective) userAnswerText = userAns.subjective;
                  }
                }

                return (
                  <Card key={qItem.id} className={`p-6 border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <div className="flex gap-4 items-start">
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-lg">Question {idx + 1}</h4>
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <p className="text-lg text-foreground">{q.text}</p>

                        <div className="grid md:grid-cols-2 gap-4 text-sm mt-4 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <span className="block text-muted-foreground text-xs uppercase font-bold mb-1">Your Answer</span>
                            <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{userAnswerText}</span>
                          </div>
                          <div>
                            <span className="block text-muted-foreground text-xs uppercase font-bold mb-1">Correct Answer</span>
                            <span className="font-medium text-emerald-600">
                              {type === 'mcq' ? `Option ${q.correctAnswer}` : q.correctAnswer}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <Lightbulb className="w-4 h-4 mt-1 shrink-0 text-yellow-500" />
                            <p className="text-base">{q.explanation || "No explanation provided."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center pt-8">
              <Button size="lg" className="px-10" onClick={() => setViewState('entry')}>
                Back to Practices
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-display selection:bg-primary/20">
      <AppSidebar className="hidden lg:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 lg:px-8">
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
          <div className="hidden max-w-md flex-1 items-center rounded-lg bg-accent/50 px-3 py-2 lg:flex ml-4 border border-transparent focus-within:border-primary/20 transition-all">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              className="ml-2 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Search for tests, topics, or notes..."
              type="text"
              suppressHydrationWarning
            />
          </div>
          <div className="flex items-center gap-4 ml-auto">
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

