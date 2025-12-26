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
                        <div className="flex flex-wrap justify-center items-end gap-6 md:gap-10">
                            {/* Rank 2 (Silver) */}
                            <div className="order-1 md:order-1 flex flex-col items-center">
                                <div className="relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                        <Award className="text-slate-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]" />
                                    </div>
                                    <div className="w-64 bg-card border-t-4 border-slate-400 rounded-2xl p-6 flex flex-col items-center shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ring-1 ring-border">
                                        <div className="w-20 h-20 rounded-full border-4 border-slate-400 mb-3 bg-muted flex items-center justify-center text-xl font-bold text-slate-500">
                                            SJ
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-foreground font-bold text-lg truncate w-full">Sarah Jenkins</h3>
                                            <p className="text-muted-foreground text-xs mb-3">Class 11-A</p>
                                            <div className="bg-slate-400/10 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-bold mb-3">4,120 XP</div>
                                            <div className="flex gap-2 justify-center">
                                                <Zap className="text-muted-foreground w-5 h-5" title="Consistent" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-3 bg-slate-400 text-slate-900 font-black text-xs px-3 py-1 rounded-full">RANK 2</div>
                                    </div>
                                </div>
                            </div>
                            {/* Rank 1 (Gold) */}
                            <div className="order-0 md:order-2 flex flex-col items-center -mt-8 md:-mt-0">
                                <div className="relative group z-10">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                        <Trophy className="text-yellow-500 w-14 h-14 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
                                    </div>
                                    <div className="w-72 bg-card border-t-4 border-yellow-500 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_30px_rgba(234,179,8,0.15)] transform hover:scale-105 transition-transform duration-300 ring-1 ring-border">
                                        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 mb-3 bg-muted flex items-center justify-center text-2xl font-bold text-yellow-600">
                                            MC
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-foreground font-bold text-xl truncate w-full">Michael Chen</h3>
                                            <p className="text-yellow-600/80 text-sm mb-4 font-medium">Class 12-B</p>
                                            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-4 py-1.5 rounded-full text-base font-bold mb-4 shadow-[0_0_10px_rgba(234,179,8,0.2)]">5,450 XP</div>
                                            <div className="flex gap-2 justify-center">
                                                <CheckCircle className="text-yellow-500 w-6 h-6" title="Top Performer" />
                                                <Flame className="text-orange-500 w-6 h-6" title="On Fire" />
                                                <Calculator className="text-blue-500 w-6 h-6" title="Math Whiz" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-4 bg-yellow-500 text-yellow-950 font-black text-sm px-4 py-1.5 rounded-full shadow-lg">RANK 1</div>
                                    </div>
                                </div>
                            </div>
                            {/* Rank 3 (Bronze) */}
                            <div className="order-2 md:order-3 flex flex-col items-center">
                                <div className="relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                        <Medal className="text-orange-700 w-10 h-10 drop-shadow-[0_0_10px_rgba(194,65,12,0.5)]" />
                                    </div>
                                    <div className="w-64 bg-card border-t-4 border-orange-700 rounded-2xl p-6 flex flex-col items-center shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ring-1 ring-border">
                                        <div className="w-20 h-20 rounded-full border-4 border-orange-700 mb-3 bg-muted flex items-center justify-center text-xl font-bold text-orange-800">
                                            PP
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-foreground font-bold text-lg truncate w-full">Priya Patel</h3>
                                            <p className="text-muted-foreground text-xs mb-3">Class 11-C</p>
                                            <div className="bg-orange-700/10 text-orange-700 dark:text-orange-500 px-3 py-1 rounded-full text-sm font-bold mb-3">3,980 XP</div>
                                            <div className="flex gap-2 justify-center">
                                                <TrendingUp className="text-muted-foreground w-5 h-5" title="Rising Star" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-3 bg-orange-700 text-white font-black text-xs px-3 py-1 rounded-full">RANK 3</div>
                                    </div>
                                </div>
                            </div>
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
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[900px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 text-muted-foreground text-xs font-bold uppercase tracking-wider border-b border-border">
                                        <th className="p-4 w-16 text-center">Rank</th>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Class</th>
                                        <th className="p-4 text-center">Tests</th>
                                        <th className="p-4 text-center">Avg Score</th>
                                        <th className="p-4 text-center">Accuracy</th>
                                        <th className="p-4 text-right">Total Points</th>
                                        <th className="p-4 text-center">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {/* Rank 1 */}
                                    <tr className="group hover:bg-muted/30 transition-colors">
                                        <td className="p-4 text-center">
                                            <div className="w-8 h-8 mx-auto bg-yellow-500 text-yellow-950 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">MC</div>
                                                <span className="text-foreground font-medium">Michael Chen</span>
                                                <CheckCircle className="text-yellow-500 w-4 h-4 ml-1" />
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">12-B</td>
                                        <td className="p-4 text-center text-foreground text-sm">42</td>
                                        <td className="p-4 text-center text-foreground text-sm font-medium">96%</td>
                                        <td className="p-4 text-center text-emerald-500 text-sm font-medium">92%</td>
                                        <td className="p-4 text-right text-yellow-600 dark:text-yellow-500 font-bold">5,450</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center text-emerald-500 gap-1 text-xs font-bold">
                                                <ArrowUp className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Rank 2 */}
                                    <tr className="group hover:bg-muted/30 transition-colors">
                                        <td className="p-4 text-center">
                                            <div className="w-8 h-8 mx-auto bg-slate-400 text-slate-900 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">SJ</div>
                                                <span className="text-foreground font-medium">Sarah Jenkins</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">11-A</td>
                                        <td className="p-4 text-center text-foreground text-sm">38</td>
                                        <td className="p-4 text-center text-foreground text-sm font-medium">94%</td>
                                        <td className="p-4 text-center text-emerald-500 text-sm font-medium">89%</td>
                                        <td className="p-4 text-right text-foreground font-bold">4,120</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center text-muted-foreground gap-1 text-xs font-bold">
                                                <Minus className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Rank 3 */}
                                    <tr className="group hover:bg-muted/30 transition-colors">
                                        <td className="p-4 text-center">
                                            <div className="w-8 h-8 mx-auto bg-orange-700 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">PP</div>
                                                <span className="text-foreground font-medium">Priya Patel</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">11-C</td>
                                        <td className="p-4 text-center text-foreground text-sm">35</td>
                                        <td className="p-4 text-center text-foreground text-sm font-medium">91%</td>
                                        <td className="p-4 text-center text-emerald-500 text-sm font-medium">88%</td>
                                        <td className="p-4 text-right text-foreground font-bold">3,980</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center text-emerald-500 gap-1 text-xs font-bold">
                                                <ArrowUp className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Regular Rows */}
                                    <tr className="group hover:bg-muted/30 transition-colors">
                                        <td className="p-4 text-center text-muted-foreground font-medium">4</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs text-foreground">DK</div>
                                                <span className="text-foreground font-medium">David Kim</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">12-A</td>
                                        <td className="p-4 text-center text-foreground text-sm">31</td>
                                        <td className="p-4 text-center text-foreground text-sm font-medium">89%</td>
                                        <td className="p-4 text-center text-muted-foreground text-sm font-medium">84%</td>
                                        <td className="p-4 text-right text-foreground font-bold">3,450</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center text-red-500 gap-1 text-xs font-bold">
                                                <ArrowDown className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="group hover:bg-muted/30 transition-colors">
                                        <td className="p-4 text-center text-muted-foreground font-medium">5</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">AJ</div>
                                                <span className="text-foreground font-medium">Alex Johnson</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">11-B</td>
                                        <td className="p-4 text-center text-foreground text-sm">29</td>
                                        <td className="p-4 text-center text-foreground text-sm font-medium">87%</td>
                                        <td className="p-4 text-center text-muted-foreground text-sm font-medium">81%</td>
                                        <td className="p-4 text-right text-foreground font-bold">3,120</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center text-muted-foreground gap-1 text-xs font-bold">
                                                <Minus className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Current User Row (Sticky / Highlighted) */}
                                    <tr className="bg-primary/20 hover:bg-primary/30 transition-colors border-l-4 border-primary">
                                        <td className="p-4 text-center text-foreground font-bold">12</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full border border-primary bg-muted flex items-center justify-center font-bold text-xs">U</div>
                                                <span className="text-foreground font-bold">You (Jessica)</span>
                                                <span className="px-2 py-0.5 rounded bg-primary text-[10px] text-white uppercase font-bold tracking-wide">Me</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">11-A</td>
                                        <td className="p-4 text-center text-foreground text-sm">22</td>
                                        <td className="p-4 text-center text-foreground text-sm font-medium">82%</td>
                                        <td className="p-4 text-center text-muted-foreground text-sm font-medium">78%</td>
                                        <td className="p-4 text-right text-foreground font-bold">2,450</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center text-emerald-500 gap-1 text-xs font-bold">
                                                <ArrowUp className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination (Simple) */}
                        <div className="bg-card p-4 flex items-center justify-between border-t border-border">
                            <p className="text-muted-foreground text-sm">Showing 1-5 of 145 students</p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 rounded bg-muted text-foreground text-sm hover:bg-muted/80 disabled:opacity-50">Prev</button>
                                <button className="px-3 py-1 rounded bg-muted text-foreground text-sm hover:bg-muted/80">Next</button>
                            </div>
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
