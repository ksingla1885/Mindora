'use client';

import {
    History,
    Settings,
    CreditCard,
    UserCog,
    ShieldCheck,
    Bell,
    RefreshCcw,
    Save,
    Bot,
    CircuitBoard,
    ChevronDown,
    EyeOff,
    Files
} from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-display selection:bg-primary selection:text-white">
            <style jsx global>{`
        /* Custom scrollbar for Webkit browsers */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent; 
        }
        ::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5); 
        }
      `}</style>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-muted/10">
                {/* Header */}
                <header className="h-20 bg-background/95 backdrop-blur-md sticky top-0 z-10 border-b border-border flex items-center justify-between px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-foreground text-2xl font-bold tracking-tight">Settings</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                            <span className="block w-2 h-2 rounded-full bg-emerald-500"></span>
                            Last updated: 2 mins ago
                        </p>
                        <div className="h-6 w-px bg-border"></div>
                        <div className="flex gap-3">
                            <button className="flex items-center justify-center h-9 px-4 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                                Reset
                            </button>
                            <button className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left Sub-nav */}
                            <nav className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-0">
                                <div className="flex flex-col gap-1">
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card transition-colors">
                                        <input className="hidden" name="settings_tab" type="radio" />
                                        <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">General</span>
                                    </label>
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card transition-colors">
                                        <input className="hidden" name="settings_tab" type="radio" />
                                        <UserCog className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">Account & Roles</span>
                                    </label>
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card transition-colors">
                                        <input className="hidden" name="settings_tab" type="radio" />
                                        <ShieldCheck className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">Security</span>
                                    </label>
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card transition-colors">
                                        <input className="hidden" name="settings_tab" type="radio" />
                                        <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">Payments</span>
                                    </label>
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card transition-colors">
                                        <input className="hidden" name="settings_tab" type="radio" />
                                        <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">Notifications</span>
                                    </label>
                                    {/* Active Tab */}
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer bg-card border-l-[3px] border-primary transition-colors">
                                        <input defaultChecked className="hidden" name="settings_tab" type="radio" />
                                        <Bot className="w-5 h-5 text-primary" />
                                        <span className="text-foreground text-sm font-medium">AI Configuration</span>
                                    </label>
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card transition-colors">
                                        <input className="hidden" name="settings_tab" type="radio" />
                                        <CircuitBoard className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">Integrations</span>
                                    </label>
                                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card transition-colors">
                                        <input className="hidden" name="settings_tab" type="radio" />
                                        <History className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">Audit & Logs</span>
                                    </label>
                                </div>
                            </nav>

                            {/* Active Content Panel */}
                            <div className="flex-1 min-w-0">
                                {/* Page Title & Intro */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-foreground mb-2">AI Configuration</h2>
                                    <p className="text-muted-foreground text-sm max-w-2xl">Configure the Large Language Models (LLM) powering the Mindora platform. Manage API keys, set token limits, and adjust safety protocols for student interactions.</p>
                                </div>

                                {/* Card 1: Provider Settings */}
                                <div className="bg-card border border-border rounded-xl p-6 mb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                                <Bot className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-base font-semibold text-foreground">Model Provider</h3>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Primary Model</label>
                                            <div className="relative">
                                                <select className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 appearance-none">
                                                    <option value="gpt-4">GPT-4 Turbo (Recommended)</option>
                                                    <option value="gpt-3.5">GPT-3.5 Turbo</option>
                                                    <option value="claude-3">Claude 3 Opus</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-2.5 text-muted-foreground pointer-events-none w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fallback Model</label>
                                            <div className="relative">
                                                <select className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 appearance-none">
                                                    <option value="gpt-3.5">GPT-3.5 Turbo</option>
                                                    <option value="claude-haiku">Claude 3 Haiku</option>
                                                    <option value="none">None</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-2.5 text-muted-foreground pointer-events-none w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">API Key</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        className="w-full bg-background border border-border text-muted-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 font-mono"
                                                        readOnly
                                                        type="password"
                                                        value="sk-proj-********************************"
                                                    />
                                                    <button className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
                                                        <EyeOff className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <button className="flex items-center justify-center px-4 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors border border-border">
                                                    <Files className="w-5 h-5" />
                                                </button>
                                                <button className="flex items-center justify-center px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 text-sm font-medium whitespace-nowrap">
                                                    Rotate Key
                                                </button>
                                            </div>
                                            <p className="mt-2 text-xs text-muted-foreground">Key last rotated 14 days ago.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Configuration & Safety */}
                                <div className="bg-card border border-border rounded-xl p-6 mb-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-base font-semibold text-foreground">Safety & Parameters</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {/* Parameter Sliders */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-medium text-foreground">Temperature (Creativity)</label>
                                                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">0.7</span>
                                            </div>
                                            <input className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" max="1" min="0" step="0.1" type="range" defaultValue="0.7" />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                <span>Precise (0.0)</span>
                                                <span>Balanced (0.5)</span>
                                                <span>Creative (1.0)</span>
                                            </div>
                                        </div>
                                        <div className="h-px bg-border"></div>
                                        {/* Toggles */}
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-sm font-medium text-foreground">Strict Profanity Filter</p>
                                                    <p className="text-xs text-muted-foreground">Automatically block and flag inappropriate content in student queries.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-sm font-medium text-foreground">Hallucination Check</p>
                                                    <p className="text-xs text-muted-foreground">Run a secondary pass to verify factual accuracy for Olympiad topics.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-sm font-medium text-foreground">PII Redaction</p>
                                                    <p className="text-xs text-muted-foreground">Redact personally identifiable information before sending to LLM.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input className="sr-only peer" type="checkbox" value="" />
                                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 3: System Prompt */}
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                                                <Files className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-base font-semibold text-foreground">Base System Prompt</h3>
                                        </div>
                                        <button className="text-xs text-primary hover:text-primary/80 font-medium">Restore Default</button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">This prompt is prepended to every student interaction session to define the AI's persona.</p>
                                    <textarea
                                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-3 font-mono leading-relaxed"
                                        rows="6"
                                        spellCheck="false"
                                        defaultValue={`You are Mindora AI, a helpful and encouraging tutor specifically designed to help students prepare for International Mathematics and Science Olympiads. 

Your goal is to guide students to the answer by asking Socratic questions rather than providing the solution immediately. Be concise, use LaTeX for math formulas, and maintain a friendly tone.`}
                                    ></textarea>
                                    <div className="flex justify-end mt-3">
                                        <p className="text-xs text-muted-foreground">342 characters</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
