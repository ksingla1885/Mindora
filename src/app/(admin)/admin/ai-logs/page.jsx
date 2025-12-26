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
                                    <p className="text-2xl font-bold text-foreground">12,450</p>
                                    <span className="text-emerald-500 text-xs font-medium mb-1 flex items-center">
                                        <TrendingUp className="w-[14px] h-[14px] mr-1" /> 5.2%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Today</p>
                                    <Calendar className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">842</p>
                                    <span className="text-emerald-500 text-xs font-medium mb-1">+12%</span>
                                </div>
                            </div>
                            <div className="bg-red-500/10 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-900/30 flex flex-col gap-1 relative overflow-hidden">
                                <div className="absolute right-0 top-0 p-4 opacity-10">
                                    <AlertTriangle className="text-red-500 w-16 h-16" />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <p className="text-red-500 dark:text-red-400 text-xs font-medium uppercase tracking-wider">Flagged</p>
                                    <Flag className="text-red-500 w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1 relative z-10">
                                    <p className="text-2xl font-bold text-foreground">23</p>
                                    <span className="text-red-500 dark:text-red-400 text-xs font-medium mb-1">+2%</span>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Resolved</p>
                                    <CheckCircle className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">18</p>
                                    <span className="text-emerald-500 text-xs font-medium mb-1">+15%</span>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Avg Latency</p>
                                    <Clock className="text-muted-foreground w-[18px] h-[18px]" />
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <p className="text-2xl font-bold text-foreground">1.2s</p>
                                    <span className="text-orange-500 text-xs font-medium mb-1 flex items-center">
                                        <TrendingUp className="w-[14px] h-[14px] mr-1 rotate-180" /> -0.1s
                                    </span>
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
                                Showing 1-50 of 12,450 logs
                            </div>
                        </div>
                    </div>
                </header>
                {/* Split View Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Table Section (Main) */}
                    <div className="flex-1 overflow-auto border-r border-border relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12 text-center">
                                        <input className="rounded border-input bg-background text-primary focus:ring-1 focus:ring-primary" type="checkbox" />
                                    </th>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">Log ID</th>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">Context</th>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider w-1/3">Query Preview</th>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {/* Row 1: Active/Selected */}
                                <tr className="bg-primary/5 group cursor-pointer hover:bg-primary/10 transition-colors">
                                    <td className="p-4 text-center border-l-2 border-primary">
                                        <input className="rounded border-input bg-background text-primary focus:ring-1 focus:ring-primary" type="checkbox" />
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-xs text-primary font-medium">log_8x92a</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">AD</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground font-medium">Alex D.</span>
                                                <span className="text-[10px] text-muted-foreground">Student</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">Geometry Test</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-muted-foreground font-mono truncate max-w-[280px]">Explain the Pythagorean theorem simply...</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-foreground">10:42 AM</span>
                                            <span className="text-[10px] text-muted-foreground">Oct 24</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                            Flagged
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 2 */}
                                <tr className="group cursor-pointer hover:bg-muted/30 transition-colors">
                                    <td className="p-4 text-center border-l-2 border-transparent">
                                        <input className="rounded border-input bg-background text-primary focus:ring-1 focus:ring-primary" type="checkbox" />
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-xs text-muted-foreground">log_7b33z</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">MK</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground font-medium">Maria K.</span>
                                                <span className="text-[10px] text-muted-foreground">Student</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">General Chat</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-muted-foreground font-mono truncate max-w-[280px]">Can you check my essay on climate change?</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-foreground">10:38 AM</span>
                                            <span className="text-[10px] text-muted-foreground">Oct 24</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-green-900/20 text-emerald-600 dark:text-green-400 border border-emerald-200 dark:border-green-900/50">
                                            Resolved
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 3 */}
                                <tr className="group cursor-pointer hover:bg-muted/30 transition-colors">
                                    <td className="p-4 text-center border-l-2 border-transparent">
                                        <input className="rounded border-input bg-background text-primary focus:ring-1 focus:ring-primary" type="checkbox" />
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-xs text-muted-foreground">log_2a99q</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">JL</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground font-medium">James L.</span>
                                                <span className="text-[10px] text-muted-foreground">Teacher</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">Content Gen</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-muted-foreground font-mono truncate max-w-[280px]">Generate 5 difficult questions about Organic Chem...</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-foreground">10:35 AM</span>
                                            <span className="text-[10px] text-muted-foreground">Oct 24</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                            Normal
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 4 */}
                                <tr className="group cursor-pointer hover:bg-muted/30 transition-colors">
                                    <td className="p-4 text-center border-l-2 border-transparent">
                                        <input className="rounded border-input bg-background text-primary focus:ring-1 focus:ring-primary" type="checkbox" />
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-xs text-muted-foreground">log_4c12x</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">Gu</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground font-medium">Guest User</span>
                                                <span className="text-[10px] text-muted-foreground">Trial</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">Demo</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-muted-foreground font-mono truncate max-w-[280px]">How do I hack the exam server?</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-foreground">10:30 AM</span>
                                            <span className="text-[10px] text-muted-foreground">Oct 24</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/50">
                                            Reviewed
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {/* Pagination Hint */}
                        <div className="p-4 text-center border-t border-border">
                            <button className="text-sm text-primary font-medium hover:underline">Load more logs</button>
                        </div>
                    </div>
                    {/* Detail Drawer (Simulated Open State) */}
                    <div className="w-[450px] bg-background flex flex-col border-l border-border shadow-2xl relative z-20">
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-border flex justify-between items-start bg-card">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-foreground font-mono">log_8x92a</h3>
                                    <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                                </div>
                                <p className="text-xs text-muted-foreground">Oct 24, 2023 • 10:42:15 AM</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="text-muted-foreground hover:text-foreground transition-colors" title="Copy Link">
                                    <Link className="w-5 h-5" />
                                </button>
                                <button className="text-muted-foreground hover:text-foreground transition-colors" title="Close">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Safety Alert */}
                            <div className="mb-6 bg-red-100 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg p-3 flex gap-3">
                                <AlertTriangle className="text-red-500 shrink-0 w-5 h-5" />
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">Flagged Interaction</p>
                                    <p className="text-xs text-red-500/80 dark:text-red-300/80 mt-1">AI detected potential policy violation: <span className="font-mono bg-red-200 dark:bg-red-900/40 px-1 rounded">Self-Harm / Sensitive</span>. Confidence: 89%.</p>
                                </div>
                            </div>
                            {/* Chat Log */}
                            <div className="flex flex-col gap-6 mb-8">
                                {/* User Msg */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">AD</div>
                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xs font-bold text-foreground">Alex D.</span>
                                            <span className="text-[10px] text-muted-foreground">User</span>
                                        </div>
                                        <div className="bg-card border border-border rounded-r-xl rounded-bl-xl p-3">
                                            <p className="text-sm text-foreground font-mono leading-relaxed">
                                                Explain the Pythagorean theorem simply for a 10th grader. I feel like failing everything and giving up on life if I don't pass this.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* AI Msg */}
                                <div className="flex gap-3 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">AI</div>
                                    <div className="flex flex-col gap-1 max-w-[85%] items-end">
                                        <div className="flex items-baseline justify-between w-full flex-row-reverse">
                                            <span className="text-xs font-bold text-primary">Mindora AI</span>
                                            <span className="text-[10px] text-muted-foreground">1.2s latency</span>
                                        </div>
                                        <div className="bg-primary/10 border border-primary/20 rounded-l-xl rounded-br-xl p-3">
                                            <p className="text-sm text-foreground font-mono leading-relaxed">
                                                The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the other two sides. Formula: a² + b² = c².<br /><br />
                                                <span className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 px-1 rounded block mt-2 border-l-2 border-amber-500 pl-2">
                                                    [System Injection]: I hear that you are feeling overwhelmed. Please remember that one test does not define your worth. If you are feeling unsafe, please contact a trusted adult or a helpline immediately.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-card rounded p-3 border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Model Version</p>
                                    <p className="text-sm text-foreground font-mono mt-1">GPT-4o-edu-v2</p>
                                </div>
                                <div className="bg-card rounded p-3 border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Temperature</p>
                                    <p className="text-sm text-foreground font-mono mt-1">0.7</p>
                                </div>
                                <div className="bg-card rounded p-3 border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Tokens</p>
                                    <p className="text-sm text-foreground font-mono mt-1">In: 45 / Out: 120</p>
                                </div>
                                <div className="bg-card rounded p-3 border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Topic</p>
                                    <p className="text-sm text-foreground font-mono mt-1">Math / Geometry</p>
                                </div>
                            </div>
                            {/* Quality Insights Mini Panel */}
                            <div className="bg-card rounded-lg p-4 border border-border mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="text-primary w-5 h-5" />
                                    <h4 className="text-sm font-bold text-foreground">Quality Insights</h4>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <CheckCircle className="text-emerald-500 w-4 h-4" />
                                        <span>Response aligns with educational guidelines.</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <AlertTriangle className="text-amber-500 w-4 h-4" />
                                        <span>Sentiment analysis detected high distress.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        {/* Drawer Footer Actions */}
                        <div className="p-5 border-t border-border bg-card flex flex-col gap-3">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Admin Note</label>
                            <textarea className="w-full bg-background border border-input rounded-lg p-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20" placeholder="Add internal notes about this interaction..."></textarea>
                            <div className="flex gap-3 mt-2">
                                <button className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                                    Mark Resolved
                                </button>
                                <button className="flex-1 py-2 rounded-lg bg-card border border-border hover:bg-muted text-foreground text-sm font-medium transition-colors">
                                    Escalate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
