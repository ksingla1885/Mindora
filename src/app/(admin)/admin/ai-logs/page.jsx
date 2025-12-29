'use client';

import {
    ChevronRight,
    Search,
    Database,
    Calendar,
    Flag,
    CheckCircle,
    Clock,
    CalendarDays,
    Filter,
    Layers,
    MoreVertical,
    Link,
    X,
    AlertTriangle,
    Lightbulb,
    TrendingUp,
    Download,
    Hourglass
} from 'lucide-react';

export default function AILogsPage() {
    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-display selection:bg-primary selection:text-white">
            <style jsx global>{`
        /* Custom scrollbar for dark mode */
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
            <main className="flex-1 flex flex-col h-full min-w-0 bg-muted/10">
                {/* Header Section */}
                <header className="flex-shrink-0 border-b border-border bg-background/50 backdrop-blur-md z-10">
                    <div className="flex flex-col gap-6 p-6 pb-4">
                        {/* Top Bar: Title & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <span>Admin</span>
                                    <ChevronRight className="w-3 h-3" />
                                    <span>Monitoring</span>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-foreground font-medium">AI Logs</span>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">AI Interaction Logs</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Search */}
                                <div className="relative group w-full md:w-96">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg leading-5 bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="Search by Log ID, User, or Content keywords..."
                                        type="text"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                        <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</span>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-muted border border-border rounded-lg text-foreground text-sm font-medium transition-colors">
                                    <Download className="w-[18px] h-[18px]" />
                                    Export
                                </button>
                            </div>
                        </div>
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Queries</p>
                                    <Database className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">0</p>
                                    <span className="text-muted-foreground text-xs font-medium mb-1">No data</span>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Today</p>
                                    <Calendar className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">0</p>
                                    <span className="text-muted-foreground text-xs font-medium mb-1">No data</span>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Flagged</p>
                                    <Flag className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">0</p>
                                    <span className="text-muted-foreground text-xs font-medium mb-1">No data</span>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Resolved</p>
                                    <CheckCircle className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">0</p>
                                    <span className="text-muted-foreground text-xs font-medium mb-1">No data</span>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Avg Latency</p>
                                    <Clock className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">0s</p>
                                    <span className="text-muted-foreground text-xs font-medium mb-1">No data</span>
                                </div>
                            </div>
                        </div>
                        {/* Filters Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Dropdowns */}
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-md text-muted-foreground text-sm hover:text-foreground transition-colors">
                                    <CalendarDays className="w-[18px] h-[18px]" />
                                    Last 24 Hours
                                    <ChevronRight className="w-[18px] h-[18px] text-muted-foreground rotate-90" />
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-md text-muted-foreground text-sm hover:text-foreground transition-colors">
                                    <Filter className="w-[18px] h-[18px]" />
                                    Status: All
                                    <ChevronRight className="w-[18px] h-[18px] text-muted-foreground rotate-90" />
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-md text-muted-foreground text-sm hover:text-foreground transition-colors">
                                    <Layers className="w-[18px] h-[18px]" />
                                    Context
                                    <ChevronRight className="w-[18px] h-[18px] text-muted-foreground rotate-90" />
                                </button>
                                <div className="h-6 w-px bg-border mx-1"></div>
                                {/* Quick Filters */}
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full text-red-600 dark:text-red-300 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors">
                                    <AlertTriangle className="w-[14px] h-[14px]" />
                                    Flagged Only
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-full text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                                    <Hourglass className="w-[14px] h-[14px]" />
                                    Slow (&gt;5s)
                                </button>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                                Showing 0 of 0 logs
                            </div>
                        </div>
                    </div>
                </header>
                {/* Split View Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Empty State */}
                    <div className="flex-1 flex items-center justify-center p-20">
                        <div className="flex flex-col items-center justify-center text-center max-w-md">
                            <div className="p-6 bg-muted/30 rounded-full mb-6">
                                <Database className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No AI logs yet</h3>
                            <p className="text-muted-foreground mb-6">
                                AI interaction logs will appear here once students start using the AI solver and chat features.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
