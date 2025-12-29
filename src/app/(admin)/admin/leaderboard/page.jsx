'use client';

import {
    Info,
    Medal,
    Trophy,
    Zap,
    CheckCircle,
    Flame,
    Calculator,
    TrendingUp,
    ChevronDown,
    Calendar,
    Search,
    ArrowUp,
    ArrowDown,
    Minus,
    Shield,
    RotateCcw,
    Download,
    History,
    Award
} from 'lucide-react';
import { cn } from '@/lib/cn';

export default function LeaderboardPage() {
    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-display selection:bg-primary selection:text-white">
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background-color: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted-foreground) / 0.3);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--muted-foreground) / 0.5);
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center w-full h-full overflow-y-auto custom-scrollbar">
                <div className="flex flex-col max-w-[1200px] w-full flex-1 px-4 md:px-10 py-8">
                    {/* Header Section: Title & Tooltip */}
                    <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground">Leaderboard</h1>
                                <div className="group relative flex items-center justify-center">
                                    <Info className="text-muted-foreground cursor-help w-6 h-6 hover:text-primary transition-colors" />
                                    <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 w-64 p-3 bg-popover border border-border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        <h4 className="text-popover-foreground font-bold text-xs mb-1 uppercase tracking-wider">Points System Transparency</h4>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Points = (Score * Difficulty Multiplier) + Streak Bonus.<br />
                                            Accuracy &gt; 90% grants a 1.2x boost.<br />
                                            Ties are broken by least time taken.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-muted-foreground text-base font-normal leading-normal">Track your progress and compete with the best scholars.</p>
                        </div>
                        {/* Chips (Time Filter) */}
                        <div className="flex bg-muted/30 rounded-xl p-1 gap-1">
                            <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm transition-all">Today</button>
                            <button className="px-4 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm font-medium transition-all">This Week</button>
                            <button className="px-4 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm font-medium transition-all">Month</button>
                            <button className="px-4 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm font-medium transition-all">All-time</button>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="mb-8 border-b border-border">
                        <div className="flex gap-8 overflow-x-auto no-scrollbar">
                            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-primary text-foreground pb-3 px-2 min-w-[80px]" href="#">
                                <p className="text-sm font-bold leading-normal tracking-wide">Overall</p>
                            </a>
                            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-muted-foreground hover:text-foreground hover:border-b-border pb-3 px-2 min-w-[80px] transition-all" href="#">
                                <p className="text-sm font-bold leading-normal tracking-wide">Subject-wise</p>
                            </a>
                            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-muted-foreground hover:text-foreground hover:border-b-border pb-3 px-2 min-w-[80px] transition-all" href="#">
                                <p className="text-sm font-bold leading-normal tracking-wide">Test-wise</p>
                            </a>
                            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-muted-foreground hover:text-foreground hover:border-b-border pb-3 px-2 min-w-[80px] transition-all" href="#">
                                <p className="text-sm font-bold leading-normal tracking-wide">Class-wise</p>
                            </a>
                        </div>
                    </div>

                    {/* Top 3 Podium Section */}
                    <section className="mb-12">
                        <h2 className="text-foreground/60 tracking-wide text-sm font-bold uppercase text-center mb-8">Top 3 Highlight Podium</h2>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-6 bg-muted/30 rounded-full mb-6">
                                <Trophy className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No rankings yet</h3>
                            <p className="text-muted-foreground max-w-md">
                                The leaderboard will populate once students start taking tests and earning points.
                            </p>
                        </div>
                    </section>

                    {/* Filter Toolbar & Search */}
                    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 border-b border-border mb-4">
                        <div className="flex flex-col xl:flex-row gap-4 justify-between">
                            <div className="flex flex-wrap gap-2 items-center flex-1">
                                {/* Subject Select */}
                                <div className="relative min-w-[140px]">
                                    <select className="w-full h-10 bg-card text-foreground text-sm border border-border rounded-lg px-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                        <option>All Subjects</option>
                                        <option>Mathematics</option>
                                        <option>Physics</option>
                                        <option>Chemistry</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none w-5 h-5" />
                                </div>
                                {/* Class Select */}
                                <div className="relative min-w-[120px]">
                                    <select className="w-full h-10 bg-card text-foreground text-sm border border-border rounded-lg px-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                        <option>All Classes</option>
                                        <option>Class 11</option>
                                        <option>Class 12</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none w-5 h-5" />
                                </div>
                                {/* Test Type Select */}
                                <div className="relative min-w-[140px]">
                                    <select className="w-full h-10 bg-card text-foreground text-sm border border-border rounded-lg px-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                        <option>All Tests</option>
                                        <option>DPP</option>
                                        <option>Weekly Test</option>
                                        <option>Olympiad</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none w-5 h-5" />
                                </div>
                                {/* Date Range (Mockup) */}
                                <div className="relative min-w-[160px]">
                                    <button className="flex items-center justify-between w-full h-10 bg-card text-muted-foreground text-sm border border-border rounded-lg px-3 hover:text-foreground">
                                        <span>Date Range</span>
                                        <Calendar className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            {/* Search */}
                            <div className="relative w-full xl:w-72">
                                <input
                                    className="w-full h-10 bg-card text-foreground text-sm border border-border rounded-lg pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                                    placeholder="Search student name..."
                                    type="text"
                                />
                                <Search className="absolute left-3 top-2.5 text-muted-foreground w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="p-6 bg-muted/30 rounded-full mb-6">
                                <Trophy className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No student data yet</h3>
                            <p className="text-muted-foreground max-w-md mb-6">
                                The leaderboard will display student rankings once they start taking tests and earning points.
                            </p>
                        </div>
                    </div>

                    {/* Admin Controls Section */}
                    <div className="mt-12 w-full border-t border-border pt-6 pb-20">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Admin-Only Controls</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent text-foreground text-sm font-medium transition-colors">
                                    <Calculator className="w-5 h-5" />
                                    Recalculate Ranks
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent text-foreground text-sm font-medium transition-colors">
                                    <RotateCcw className="w-5 h-5" />
                                    Reset Leaderboard
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-sm font-medium transition-colors">
                                    <Download className="w-5 h-5" />
                                    Export CSV
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent text-foreground text-sm font-medium transition-colors">
                                    <History className="w-5 h-5" />
                                    View Audit Log
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
