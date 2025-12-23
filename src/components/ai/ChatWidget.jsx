'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Brain } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ChatWidget() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m Mindora AI. How can I help you with your studies today?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(({ role, content }) => ({ role, content }))
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            setMessages(prev => [...prev, data]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again later.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Bubble (simulated open/minimized state based on isOpen) */}
            {isOpen && (
                <div className={`mb-2 flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-[#1f2937] dark:ring-white/10 transition-all duration-300 ${isMinimized ? 'w-80 h-14' : 'w-80 h-[32rem]'}`}>
                    <div className="flex items-center justify-between bg-[#135bec] px-4 py-3 text-white cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            <span className="font-medium text-sm">Mindora AI</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                                className="text-white/80 hover:text-white p-1 cursor-pointer"
                                suppressHydrationWarning
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="text-white/80 hover:text-white p-1 cursor-pointer"
                                suppressHydrationWarning
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            <div className="flex flex-1 flex-col gap-3 p-4 overflow-y-auto bg-gray-50 dark:bg-[#111318]">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`self-${msg.role === 'user' ? 'end' : 'start'} max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary text-white rounded-br-none'
                                        : 'bg-white text-[#111318] dark:bg-[#1f2937] dark:text-white rounded-tl-none border border-gray-100 dark:border-[#333]'
                                        }`}>
                                        {msg.content}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="self-start rounded-2xl rounded-tl-none bg-white px-4 py-3 shadow-sm border border-gray-100 dark:bg-[#1f2937] dark:border-[#333]">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="border-t border-[#e5e7eb] p-3 dark:border-[#333] bg-white dark:bg-[#1f2937]">
                                <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-full bg-[#f0f2f4] px-4 py-2 dark:bg-[#111318] border border-transparent focus-within:border-primary/50 transition-colors">
                                    <input
                                        className="w-full bg-transparent text-sm focus:outline-none dark:text-white placeholder-gray-500"
                                        placeholder="Ask a doubt..."
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={isLoading}
                                        suppressHydrationWarning
                                    />
                                    <button type="submit" disabled={!input.trim() || isLoading} className="text-primary hover:text-primary-hover disabled:opacity-50 cursor-pointer" suppressHydrationWarning>
                                        <Send className="h-5 w-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#135bec] text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-[#0f4bc4] focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:ring-offset-2 cursor-pointer"
                    suppressHydrationWarning
                >
                    <MessageCircle className="h-7 w-7" />
                    <span className="absolute right-0 top-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                </button>
            )}
        </div>
    );
}
