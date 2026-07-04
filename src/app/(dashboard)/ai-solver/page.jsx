"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send,
    Bot,
    ImagePlus,
    Hash,
    Sigma,
    Sparkles,
    MessageSquare,
    Loader2,
    User,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    ImageIcon,
    ArrowRight
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function MathRenderer({ math, block = false }) {
    const htmlRef = useRef(null);

    useEffect(() => {
        if (htmlRef.current) {
            try {
                katex.render(math, htmlRef.current, {
                    displayMode: block,
                    throwOnError: false
                });
            } catch (e) {
                htmlRef.current.textContent = math;
            }
        }
    }, [math, block]);

    return <span ref={htmlRef} className={block ? "block my-2 overflow-x-auto" : "inline-block"} />;
}


const SUBJECT_OPTIONS = ['All Subjects', 'Mathematics', 'Science', 'Physics', 'Chemistry', 'Astronomy'];

const SUGGESTION_PROMPTS = [
    { icon: '📐', title: 'Solve a math problem', sub: 'Get step-by-step math answers', subject: 'Mathematics' },
    { icon: '🔬', title: 'Explain a science concept', sub: 'Understand NSO science topics', subject: 'Science' },
    { icon: '📝', title: 'Verify my Olympiad solution', sub: 'Check if your method is correct', subject: 'Mathematics' },
    { icon: '💡', title: 'Give me practice questions', sub: 'Get similar chemistry problems', subject: 'Chemistry' },
];

export default function AIDoubtSolverPage() {
    const { data: session } = useSession();
    const [inputValue, setInputValue] = useState('');
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('All Subjects');
    
    // UI States
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [error, setError] = useState(null);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Fetch doubt sessions from database
    const fetchSessions = useCallback(async (subjectFilter = 'All Subjects') => {
        try {
            const url = `/api/ai/doubt/sessions${subjectFilter !== 'All Subjects' ? `?subject=${subjectFilter}` : ''}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSessions(data.data);
                }
            }
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
    }, []);

    // Load initial sessions
    useEffect(() => {
        if (session?.user?.id) {
            fetchSessions(selectedSubject);
        }
    }, [session?.user?.id, selectedSubject, fetchSessions]);

    // Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Handle session selection
    const handleSelectSession = async (s) => {
        setActiveSession(s);
        setError(null);
        setMessages([]);
        try {
            const res = await fetch(`/api/ai/doubt/sessions/${s.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    setMessages(data.data.messages || []);
                }
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
            setError('Failed to load conversation history.');
        }
    };

    // Handle creating a new session
    const handleCreateSession = async (title = 'New Doubt', subject = null) => {
        try {
            const res = await fetch('/api/ai/doubt/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    subject: subject || (selectedSubject !== 'All Subjects' ? selectedSubject : null),
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    setSessions(prev => [data.data, ...prev]);
                    setActiveSession(data.data);
                    setMessages([]);
                    return data.data;
                }
            }
        } catch (err) {
            console.error('Failed to create session:', err);
            setError('Failed to create a new session.');
        }
        return null;
    };

    // Handle deleting a session (triggers confirmation modal)
    const handleDeleteSession = (e, sessionId) => {
        e.stopPropagation();
        setSessionToDelete(sessionId);
    };

    // Confirms deletion of the session
    const confirmDeleteSession = async () => {
        if (!sessionToDelete) return;
        try {
            const res = await fetch(`/api/ai/doubt/sessions/${sessionToDelete}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
                if (activeSession?.id === sessionToDelete) {
                    setActiveSession(null);
                    setMessages([]);
                }
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
        } finally {
            setSessionToDelete(null);
        }
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File exceeds 10MB limit.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'doubts');

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            if (data.url) {
                setUploadedImageUrl(data.url);
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setError('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Handle sending a message
    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed && !uploadedImageUrl) return;
        if (isLoading) return;

        setError(null);
        setIsLoading(true);

        let currentSession = activeSession;
        if (!currentSession) {
            // Automatically create a session if none is active
            const cleanTitle = trimmed ? trimmed.substring(0, 30) + (trimmed.length > 30 ? '...' : '') : 'Visual Doubt';
            currentSession = await handleCreateSession(cleanTitle);
            if (!currentSession) {
                setIsLoading(false);
                return;
            }
        }

        // Add user message locally
        const userMsg = {
            role: 'user',
            content: trimmed || 'Analyze this image:',
            imageUrl: uploadedImageUrl
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setUploadedImageUrl(null);

        try {
            const res = await fetch(`/api/ai/doubt/sessions/${currentSession.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: userMsg.content,
                    imageUrl: userMsg.imageUrl,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to get answer');
            }

            const data = await res.json();
            if (data.success && data.assistantMessage) {
                setMessages(prev => [...prev, data.assistantMessage]);
                // Refresh sessions to sync updated session list and title
                fetchSessions(selectedSubject);
            }
        } catch (err) {
            console.error('Message post failed:', err);
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

    const handleSuggestion = async (title, subject) => {
        let currentSession = activeSession;
        if (!currentSession) {
            currentSession = await handleCreateSession(title, subject);
        }
        setInputValue(title);
        textareaRef.current?.focus();
    };

    // Custom lightweight Markdown & LaTeX formatter
    const formatResponseText = (text) => {
        if (!text) return null;

        // Split text by LaTeX block math delimiters $$...$$
        const blockParts = text.split(/(\$\$[\s\S]+?\$\$)/g);

        return blockParts.map((blockPart, blockIdx) => {
            // Check if it's block math
            if (blockPart.startsWith('$$') && blockPart.endsWith('$$')) {
                const mathExpression = blockPart.slice(2, -2).trim();
                return (
                    <div
                        key={`math-block-${blockIdx}`}
                        className="my-4 p-4 rounded-xl bg-[#1e293b]/40 border border-indigo-500/20 shadow-inner flex flex-col items-center justify-center overflow-x-auto select-all"
                    >
                        <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mb-2 uppercase tracking-wider">
                            <Sigma className="w-3.5 h-3.5" /> Formula
                        </div>
                        <MathRenderer math={mathExpression} block={true} />
                    </div>
                );
            }

            // Otherwise, parse standard formatting (inline math $$, headers, bullet points, bold)
            const lines = blockPart.split('\n');
            return (
                <div key={`block-text-${blockIdx}`} className="space-y-2">
                    {lines.map((line, lineIdx) => {
                        let parsedLine = line;

                        // Skip empty lines
                        if (!parsedLine.trim()) return <div key={lineIdx} className="h-2" />;

                        // Header h3
                        if (parsedLine.startsWith('### ')) {
                            return (
                                <h3 key={lineIdx} className="text-lg font-extrabold text-foreground mt-4 mb-2 tracking-tight flex items-center gap-1">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    {parsedLine.slice(4)}
                                </h3>
                            );
                        }

                        // Header h2
                        if (parsedLine.startsWith('## ')) {
                            return (
                                <h2 key={lineIdx} className="text-xl font-black text-foreground mt-5 mb-3 tracking-tight border-b border-border pb-1">
                                    {parsedLine.slice(3)}
                                </h2>
                            );
                        }

                        // List item
                        const isListItem = parsedLine.startsWith('- ') || parsedLine.startsWith('* ');
                        if (isListItem) {
                            parsedLine = parsedLine.slice(2);
                        }

                        // Inline elements parsing: inline math, bold
                        const inlineParts = parsedLine.split(/(\$\$[^\$]+?\$\$|\*\*.*?\*\*)/g);
                        const renderedInline = inlineParts.map((part, partIdx) => {
                            if (part.startsWith('$$') && part.endsWith('$$')) {
                                const mathExp = part.slice(2, -2);
                                return (
                                    <MathRenderer key={partIdx} math={mathExp} block={false} />
                                );
                            }
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <strong key={partIdx} className="font-extrabold text-white">
                                        {part.slice(2, -2)}
                                    </strong>
                                );
                            }
                            return part;
                        });

                        if (isListItem) {
                            return (
                                <li key={lineIdx} className="list-none pl-5 relative text-slate-300 before:content-['•'] before:absolute before:left-1 before:text-indigo-400 before:font-bold">
                                    {renderedInline}
                                </li>
                            );
                        }

                        return <p key={lineIdx} className="text-slate-300 font-normal leading-relaxed">{renderedInline}</p>;
                    })}
                </div>
            );
        });
    };

    return (
        <div className="flex h-screen bg-slate-950 text-foreground overflow-hidden font-sans">
            
            {/* COLLAPSIBLE SIDEBAR: Chat History */}
            <aside
                className={`flex-none bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 relative z-20 ${
                    isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
                }`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        <h2 className="font-bold text-white text-base">Previous Doubts</h2>
                    </div>
                    <button
                        onClick={() => handleCreateSession()}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        title="New Doubt"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Sidebar Filter */}
                <div className="p-3 border-b border-slate-800">
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 text-xs px-2.5 text-slate-200 outline-none focus:border-indigo-500"
                    >
                        {SUBJECT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.length === 0 ? (
                        <div className="p-4 text-center">
                            <p className="text-xs text-slate-500">No session history found</p>
                        </div>
                    ) : (
                        sessions.map((s) => {
                            const isSelected = activeSession?.id === s.id;
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectSession(s)}
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-indigo-600/20 border border-indigo-500/35 text-white'
                                            : 'hover:bg-slate-800/40 border border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <div className="flex flex-col gap-0.5 truncate flex-1 pr-2">
                                        <span className="text-xs font-semibold truncate text-left">{s.title}</span>
                                        {s.subject && (
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider text-left">
                                                {s.subject}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteSession(e, s.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-400 rounded transition-all"
                                        title="Delete Session"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* User info footer */}
                {session?.user && (
                    <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-slate-200 truncate">{session.user.name || 'Student'}</span>
                            <span className="text-[10px] text-slate-500 truncate">{session.user.email}</span>
                        </div>
                    </div>
                )}
            </aside>

            {/* Collapse Trigger Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute top-1/2 left-0 transform -translate-y-1/2 z-30 bg-slate-900 border-y border-r border-slate-800 hover:bg-slate-800 p-1 rounded-r-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
                style={{ left: isSidebarOpen ? '320px' : '0' }}
            >
                {isSidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {/* CHAT WORKSPACE */}
            <main className="flex-1 flex flex-col relative bg-slate-950">
                {/* Header */}
                <div className="flex-none px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                AI Doubt Solver
                                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">Solve math equations, explain science concepts, upload photos.</p>
                        </div>
                        
                        {activeSession && (
                            <button
                                onClick={() => {
                                    setActiveSession(null);
                                    setMessages([]);
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 border border-indigo-500/25 px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/5 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> New Doubt
                            </button>
                        )}
                    </div>
                </div>

                {/* Conversation History / Landing Page */}
                <div className="flex-1 overflow-y-auto px-6 py-6" id="chat-container">
                    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-4">
                        
                        {/* Welcome Landing Screen */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center my-auto">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/5">
                                    <Sparkles className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Solve Your Olympiad Doubts</h2>
                                <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
                                    Ask anything or upload a photo of your problem to get step-by-step solutions using math formulas.
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {SUGGESTION_PROMPTS.map(({ icon, title, sub, subject }) => (
                                        <button
                                            key={title}
                                            onClick={() => handleSuggestion(title, subject)}
                                            className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all text-left group"
                                        >
                                            <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 flex items-center gap-1.5">
                                                <span>{icon}</span>
                                                <span>{title}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">{sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages Log */}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-indigo-600/20">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none'
                                    }`}
                                >
                                    {/* Embedded image preview if message has one */}
                                    {msg.imageUrl && (
                                        <div className="mb-3 rounded-lg overflow-hidden border border-slate-800 max-w-xs bg-slate-950 flex items-center justify-center">
                                            <img src={msg.imageUrl} alt="Uploaded Doubt" className="max-h-48 object-contain" />
                                        </div>
                                    )}
                                    <div className="text-sm space-y-2 select-text">
                                        {msg.role === 'user' ? (
                                            <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            formatResponseText(msg.content)
                                        )}
                                    </div>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="w-4 h-4 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Thinking/loading state */}
                        {isLoading && (
                            <div className="flex gap-4 justify-start">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-white animate-pulse" />
                                </div>
                                <div className="bg-slate-900 border border-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-md">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    <span className="text-sm text-slate-400">Processing solution...</span>
                                </div>
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="text-center py-2">
                                <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 inline-block">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Input Area (Sticky Footer) */}
                <div className="flex-none p-6 bg-slate-950 border-t border-slate-900 z-10">
                    <div className="max-w-3xl mx-auto w-full relative">
                        
                        {/* Image Upload Status Card */}
                        {(isUploading || uploadedImageUrl) && (
                            <div className="absolute bottom-full left-0 right-0 mb-3 bg-slate-900/95 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-2xl backdrop-blur-sm z-20">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                                        {isUploading ? (
                                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                        ) : (
                                            <img src={uploadedImageUrl} alt="Upload thumbnail" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-200">
                                            {isUploading ? 'Uploading doubt photo...' : 'Photo attached successfully'}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {isUploading ? 'Sending to cloud storage' : 'Ready to be solved by AI'}
                                        </span>
                                    </div>
                                </div>
                                {!isUploading && (
                                    <button
                                        onClick={() => setUploadedImageUrl(null)}
                                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Input compose box */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-col gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-xl">
                            <textarea
                                ref={textareaRef}
                                className="w-full bg-transparent border-none focus:ring-0 text-slate-200 placeholder:text-slate-500 resize-none min-h-[50px] px-3 py-2 text-sm outline-none border-0"
                                placeholder="Type your Olympiad question, or paste equations..."
                                rows="2"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            ></textarea>
                            
                            <div className="flex items-center justify-between px-2 pb-1 pt-1 border-t border-slate-800/40">
                                <div className="flex items-center gap-1">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading || isUploading}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                        title="Upload Doubt Image"
                                    >
                                        <ImagePlus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={(!inputValue.trim() && !uploadedImageUrl) || isLoading || isUploading}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2 font-bold text-xs transition-colors shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>Ask Doubt</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-slate-600 mt-2.5">
                            Mindora AI provides helpful tutoring explanations. Always double check formulas and solution steps.
                        </p>
                    </div>
                </div>
            </main>

            {/* CONFIRMATION MODAL */}
            {sessionToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl mx-4 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-4">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Doubt History?</h3>
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                Are you sure you want to delete this doubt session? All messages and solutions will be permanently removed. This action cannot be undone.
                            </p>
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={() => setSessionToDelete(null)}
                                    className="flex-1 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-all border border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteSession}
                                    className="flex-1 h-10 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-600/10"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
