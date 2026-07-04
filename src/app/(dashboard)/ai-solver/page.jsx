"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    ImagePlus,
    Hash,
    Sigma,
    ChevronDown,
    Sparkles,
    MessageSquare,
    Loader2,
    User
} from 'lucide-react';

const SUGGESTION_PROMPTS = [
    { icon: '📐', title: 'Solve a math problem', sub: 'Get step-by-step solutions' },
    { icon: '🔬', title: 'Explain a concept', sub: 'Understand topics better' },
    { icon: '📝', title: 'Check my answer', sub: 'Verify your solutions' },
    { icon: '💡', title: 'Practice questions', sub: 'Get similar problems' },
];

export default function AIDoubtSolverPage() {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    const hasHistory = messages.length > 0;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || isLoading) return;

        const userMessage = { role: 'user', content: trimmed };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Something went wrong');
            }

            const reply = await res.json();
            setMessages(prev => [...prev, reply]);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestion = (title) => {
        setInputValue(title);
        textareaRef.current?.focus();
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-display overflow-hidden animate-fade-in" suppressHydrationWarning>
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
                                    <span className="text-foreground text-sm font-medium">All Subjects</span>
                                    <ChevronDown className="text-muted-foreground w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth" id="chat-container">
                    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-4">
                        {!hasHistory && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-border/50 flex items-center justify-center mb-6">
                                    <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-3">Start Your First Doubt</h2>
                                <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
                                    Ask any question and get detailed, step-by-step explanations from our AI tutor. Perfect for homework help and concept clarity!
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {SUGGESTION_PROMPTS.map(({ icon, title, sub }) => (
                                        <button
                                            key={title}
                                            onClick={() => handleSuggestion(title)}
                                            className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-card/80 transition-all text-left group"
                                        >
                                            <p className="text-sm font-medium text-foreground group-hover:text-primary">{icon} {title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat messages */}
                        {hasHistory && messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-card border border-border text-foreground rounded-bl-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="text-center">
                                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 inline-block">
                                    ⚠️ {error}
                                </p>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Input Composer Sticky Footer */}
                <div className="flex-none p-6 bg-background border-t border-border">
                    <div className="max-w-3xl mx-auto w-full relative">
                        <div className="bg-muted/30 rounded-2xl shadow-lg border border-border p-2 flex flex-col gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                            <textarea
                                ref={textareaRef}
                                className="w-full bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground resize-none min-h-[56px] px-3 py-2 text-base outline-none"
                                placeholder="Type your doubt or paste a question here..."
                                rows="2"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
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
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-2 font-bold text-sm transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Asking...
                                        </>
                                    ) : (
                                        <>
                                            Ask Doubt
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
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
