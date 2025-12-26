"use client";

import React, { useState } from 'react';
import {
    Send,
    Bot,
    User,
    PlayCircle,
    ThumbsUp,
    ThumbsDown,
    Flag,
    Lightbulb,
    HelpCircle,
    ImagePlus,
    Hash,
    Sigma,
    ChevronDown,
    Atom,
    LayoutGrid,
    Clock,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/cn';

export default function AIDoubtSolverPage() {
    const [inputValue, setInputValue] = useState('');

    return (
        <div className="flex h-screen bg-background text-foreground font-display overflow-hidden animate-fade-in" suppressHydrationWarning>
            {/* Left Sidebar: Context & History */}
            <aside className="w-80 flex-none flex flex-col border-r border-border bg-card hidden lg:flex">
                {/* Context Summary */}
                <div className="p-6 border-b border-border">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Current Session</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border/50">
                            <div>
                                <p className="text-xs text-muted-foreground">Subject</p>
                                <p className="text-sm font-semibold text-foreground">Physics</p>
                            </div>
                            <Atom className="text-primary w-5 h-5" />
                        </div>
                        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border/50">
                            <div>
                                <p className="text-xs text-muted-foreground">Topic</p>
                                <p className="text-sm font-semibold text-foreground">Kinematics</p>
                            </div>
                            <LayoutGrid className="text-primary w-5 h-5" />
                        </div>
                    </div>
                </div>
                {/* Recent Doubts */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Recent Doubts</h3>
                    <ul className="flex flex-col gap-1">
                        <li>
                            <button className="w-full text-left p-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors group">
                                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary">Projectile motion max height?</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 2 mins ago
                                </p>
                            </button>
                        </li>
                        <li>
                            <button className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary">Explain Newton's 2nd Law</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Yesterday
                                </p>
                            </button>
                        </li>
                        <li>
                            <button className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary">Difference between speed and velocity</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 2 days ago
                                </p>
                            </button>
                        </li>
                    </ul>
                </div>
                {/* Learning Suggestions */}
                <div className="p-4 border-t border-border bg-card">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recommended</h3>
                    <a className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group" href="#">
                        <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 group-hover:scale-105 transition-transform">
                            <PlayCircle className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-foreground truncate">Visualizing Vectors</p>
                            <p className="text-xs text-muted-foreground">5 min video</p>
                        </div>
                    </a>
                </div>
            </aside>

            {/* Center: Chat Workspace */}
            <section className="flex-1 flex flex-col relative bg-muted/10">
                {/* Page Heading & Context Filters */}
                <div className="flex-none px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border z-10 sticky top-0">
                    <div className="max-w-4xl mx-auto w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                                    AI Doubt Solver
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </h1>
                                <p className="text-sm text-muted-foreground">Ask questions. Get clear explanations. Learn smarter.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-card border border-border px-3 hover:bg-muted transition-colors">
                                    <span className="text-foreground text-sm font-medium">Class 12</span>
                                    <ChevronDown className="text-muted-foreground w-4 h-4" />
                                </button>
                                <button className="flex h-9 items-center justify-center gap-x-2 rounded-lg bg-card border border-border px-3 hover:bg-muted transition-colors">
                                    <span className="text-foreground text-sm font-medium">Physics</span>
                                    <ChevronDown className="text-muted-foreground w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth" id="chat-container">
                    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-4">
                        {/* Date Separator */}
                        <div className="flex justify-center">
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">Today, 10:23 AM</span>
                        </div>

                        {/* User Message */}
                        <div className="flex justify-end">
                            <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                                <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-br-sm shadow-sm text-base font-normal leading-relaxed">
                                    <p>A projectile is fired with a velocity of 50 m/s at an angle of 30 degrees with the horizontal. Calculate the maximum height reached.</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Response */}
                        <div className="flex justify-start w-full">
                            <div className="flex gap-4 max-w-[90%] lg:max-w-[85%]">
                                {/* AI Avatar */}
                                <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0 mt-1 ring-2 ring-background">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="bg-card border border-border p-6 rounded-2xl rounded-bl-sm shadow-sm text-foreground">
                                        {/* Structured Answer */}
                                        <div className="flex flex-col gap-4">
                                            {/* Summary Section */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-green-200 dark:border-green-800">Answer</span>
                                                </div>
                                                <p className="font-medium text-lg text-foreground">The maximum height reached is approximately 31.86 meters.</p>
                                            </div>
                                            <hr className="border-border" />
                                            {/* Step by Step */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                    Step-by-Step Explanation
                                                </h4>
                                                {/* Step 1 */}
                                                <div className="relative pl-4 border-l-2 border-primary/20">
                                                    <p className="text-sm font-semibold text-foreground mb-1">1. Identify the given values</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Initial velocity (<span className="font-mono text-xs">v₀</span>) = 50 m/s <br />
                                                        Angle (<span className="font-mono text-xs">θ</span>) = 30° <br />
                                                        Gravity (<span className="font-mono text-xs">g</span>) ≈ 9.8 m/s²
                                                    </p>
                                                </div>
                                                {/* Step 2 */}
                                                <div className="relative pl-4 border-l-2 border-primary/20">
                                                    <p className="text-sm font-semibold text-foreground mb-1">2. Apply the maximum height formula</p>
                                                    <p className="text-sm text-muted-foreground mb-2">The formula for maximum height in projectile motion is:</p>
                                                    <div className="font-mono text-sm bg-muted/50 p-2 rounded-md border border-border text-foreground inline-block">
                                                        H = (v₀² * sin²θ) / 2g
                                                    </div>
                                                </div>
                                                {/* Step 3 */}
                                                <div className="relative pl-4 border-l-2 border-primary/20">
                                                    <p className="text-sm font-semibold text-foreground mb-1">3. Substitute and Calculate</p>
                                                    <div className="text-sm text-muted-foreground space-y-1">
                                                        <p>sin(30°) = 0.5</p>
                                                        <p>sin²(30°) = 0.25</p>
                                                        <p>H = (50² * 0.25) / (2 * 9.8)</p>
                                                        <p>H = (2500 * 0.25) / 19.6</p>
                                                        <p>H = 625 / 19.6 ≈ <span className="font-bold text-primary">31.88 m</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Expand/Collapse for Concepts */}
                                            <div className="mt-2">
                                                <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                                    <span>Show related concepts</span>
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Feedback & Actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Helpful">
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Not Helpful">
                                                <ThumbsDown className="w-4 h-4" />
                                            </button>
                                            <button className="ml-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                                <Flag className="w-3.5 h-3.5" /> Report
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted shadow-sm transition-colors flex items-center gap-1">
                                                <Lightbulb className="w-4 h-4" />
                                                Explain simpler
                                            </button>
                                            <button className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1">
                                                <HelpCircle className="w-4 h-4" />
                                                Practice similar Qs
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 pl-1">AI-generated answer. Verify with your syllabus.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Composer Sticky Footer */}
                <div className="flex-none p-6 bg-background border-t border-border">
                    <div className="max-w-3xl mx-auto w-full relative">
                        <div className="bg-muted/30 rounded-2xl shadow-lg border border-border p-2 flex flex-col gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                            <textarea
                                className="w-full bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground resize-none min-h-[56px] px-3 py-2 text-base outline-none"
                                placeholder="Type your doubt or paste a question here..."
                                rows="2"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            ></textarea>
                            <div className="flex items-center justify-between px-2 pb-1">
                                <div className="flex items-center gap-1">
                                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors" title="Upload Image">
                                        <ImagePlus className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors" title="Attach Question ID">
                                        <Hash className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors" title="Mathematical Formula">
                                        <Sigma className="w-5 h-5" />
                                    </button>
                                </div>
                                <button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-2 font-bold text-sm transition-colors shadow-md flex items-center gap-2">
                                    Ask Doubt
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-3">Mindora AI can make mistakes. Consider checking important info.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
