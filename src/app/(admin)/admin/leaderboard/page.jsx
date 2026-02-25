'use client';

import { useState, useEffect, useCallback } from 'react';
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
    Award,
    Loader2,
    User
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [timeRange, setTimeRange] = useState('all');
    const [filters, setFilters] = useState({
        subjectId: '',
        classLevel: '',
        search: ''
    });

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                timeRange,
                subjectId: filters.subjectId,
                classLevel: filters.classLevel,
                search: filters.search
            });
            const response = await fetch(`/api/admin/leaderboard?${queryParams.toString()}`);
            const result = await response.json();
            if (result.success) {
                setLeaderboard(result.data);
            } else {
                toast.error(result.error || 'Failed to fetch leaderboard');
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            toast.error('Internal server error');
        } finally {
            setLoading(false);
        }
    }, [timeRange, filters]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const handleAction = async (action) => {
        if (action === 'reset' && !confirm('Are you sure you want to reset the entire leaderboard? This cannot be undone.')) {
            return;
        }

        setActionLoading(action);
        try {
            const response = await fetch('/api/admin/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const result = await response.json();
            if (result.success) {
                toast.success(result.message);
                fetchLeaderboard();
            } else {
                toast.error(result.error || 'Action failed');
            }
        } catch (error) {
            toast.error('Failed to perform action');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExport = () => {
        if (leaderboard.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Rank', 'Name', 'Email', 'Class', 'Total Score', 'Tests Taken', 'Last Updated'];
        const csvContent = [
            headers.join(','),
            ...leaderboard.map(entry => [
                entry.rank,
                entry.user.name || 'Anonymous',
                entry.user.email,
                entry.user.class || '-',
                entry.totalScore,
                entry.testsTaken,
                new Date(entry.lastUpdated).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leaderboard_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Leaderboard exported successfully');
    };

    const podium = leaderboard.slice(0, 3);
    const tableData = leaderboard.slice(3);

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
                                <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground">Admin Leaderboard</h1>
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
                            <p className="text-muted-foreground text-base font-normal leading-normal">Management interface for platform-wide student rankings.</p>
                        </div>
                        {/* Chips (Time Filter) */}
                        <div className="flex bg-muted/30 rounded-xl p-1 gap-1">
                            {['Today', 'This Week', 'Month', 'All-time'].map((label, idx) => (
                                <button
                                    key={label}
                                    onClick={() => setTimeRange(label.toLowerCase().replace(' ', '_'))}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                                        timeRange === label.toLowerCase().replace(' ', '_') || (idx === 3 && timeRange === 'all')
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="mb-8 border-b border-border">
                        <div className="flex gap-8 overflow-x-auto no-scrollbar">
                            <button className="flex flex-col items-center justify-center border-b-[3px] border-b-primary text-foreground pb-3 px-2 min-w-[80px]">
                                <p className="text-sm font-bold leading-normal tracking-wide">Overall</p>
                            </button>
                            <button className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-muted-foreground hover:text-foreground hover:border-b-border pb-3 px-2 min-w-[80px] transition-all">
                                <p className="text-sm font-bold leading-normal tracking-wide">By Subject</p>
                            </button>
                        </div>
                    </div>

                    {/* Top 3 Podium Section */}
                    <section className="mb-12">
                        <h2 className="text-foreground/60 tracking-wide text-sm font-bold uppercase text-center mb-8">Top 3 Highlight Podium</h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : podium.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end">
                                {/* 2nd Place */}
                                {podium[1] && (
                                    <div className="order-2 md:order-1 bg-card border border-border rounded-2xl p-6 flex flex-col items-center shadow-sm relative pt-12 mt-8">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-muted overflow-hidden bg-muted">
                                            {podium[1].user.image ? <Image src={podium[1].user.image} alt={podium[1].user.name} width={64} height={64} /> : <div className="w-full h-full flex items-center justify-center"><User className="text-muted-foreground" /></div>}
                                        </div>
                                        <div className="absolute top-4 right-4 text-muted-foreground font-black text-2xl italic opacity-20">#2</div>
                                        <h3 className="font-bold text-lg mb-1 truncate w-full text-center">{podium[1].user.name || 'Scholar'}</h3>
                                        <p className="text-primary font-black text-2xl mb-4">{podium[1].totalScore} pts</p>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-400" style={{ width: '85%' }}></div>
                                        </div>
                                    </div>
                                )}

                                {/* 1st Place */}
                                {podium[0] && (
                                    <div className="order-1 md:order-2 bg-primary/5 border-2 border-primary rounded-2xl p-8 flex flex-col items-center shadow-xl relative pt-16 scale-105 z-10">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-primary overflow-hidden bg-muted shadow-2xl">
                                            {podium[0].user.image ? <Image src={podium[0].user.image} alt={podium[0].user.name} width={80} height={80} /> : <div className="w-full h-full flex items-center justify-center"><User className="text-muted-foreground w-8 h-8" /></div>}
                                        </div>
                                        <Trophy className="absolute top-6 right-6 text-primary w-8 h-8 animate-bounce" />
                                        <div className="absolute top-4 left-4 text-primary font-black text-3xl italic opacity-20">#1</div>
                                        <h3 className="font-black text-xl mb-1 truncate w-full text-center">{podium[0].user.name || 'Champion'}</h3>
                                        <p className="text-primary font-black text-3xl mb-4">{podium[0].totalScore} pts</p>
                                        <div className="w-full h-3 bg-primary/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                )}

                                {/* 3rd Place */}
                                {podium[2] && (
                                    <div className="order-3 bg-card border border-border rounded-2xl p-6 flex flex-col items-center shadow-sm relative pt-12 mt-8">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-amber-800/20 overflow-hidden bg-muted">
                                            {podium[2].user.image ? <Image src={podium[2].user.image} alt={podium[2].user.name} width={64} height={64} /> : <div className="w-full h-full flex items-center justify-center"><User className="text-muted-foreground" /></div>}
                                        </div>
                                        <div className="absolute top-4 right-4 text-amber-800/20 font-black text-2xl italic">#3</div>
                                        <h3 className="font-bold text-lg mb-1 truncate w-full text-center">{podium[2].user.name || 'Top Scholar'}</h3>
                                        <p className="text-amber-800 font-black text-2xl mb-4">{podium[2].totalScore} pts</p>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-600/50" style={{ width: '70%' }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="p-6 bg-muted/30 rounded-full mb-6">
                                    <Trophy className="w-16 h-16 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">No rankings yet</h3>
                                <p className="text-muted-foreground max-w-md">
                                    The leaderboard will populate once students start taking tests and earning points.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Filter Toolbar & Search */}
                    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 border-b border-border mb-4">
                        <div className="flex flex-col xl:flex-row gap-4 justify-between">
                            <div className="flex flex-wrap gap-2 items-center flex-1">
                                {/* Subject Select */}
                                <div className="relative min-w-[140px]">
                                    <select
                                        value={filters.subjectId}
                                        onChange={(e) => setFilters(prev => ({ ...prev, subjectId: e.target.value }))}
                                        className="w-full h-10 bg-card text-foreground text-sm border border-border rounded-lg px-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                    >
                                        <option value="">All Subjects</option>
                                        <option value="math">Mathematics</option>
                                        <option value="physics">Physics</option>
                                        <option value="chem">Chemistry</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none w-5 h-5" />
                                </div>
                                {/* Class Select */}
                                <div className="relative min-w-[120px]">
                                    <select
                                        value={filters.classLevel}
                                        onChange={(e) => setFilters(prev => ({ ...prev, classLevel: e.target.value }))}
                                        className="w-full h-10 bg-card text-foreground text-sm border border-border rounded-lg px-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                    >
                                        <option value="">All Classes</option>
                                        <option value="11">Class 11</option>
                                        <option value="12">Class 12</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none w-5 h-5" />
                                </div>
                            </div>
                            {/* Search */}
                            <div className="relative w-full xl:w-72">
                                <input
                                    className="w-full h-10 bg-card text-foreground text-sm border border-border rounded-lg pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                                    placeholder="Search student name..."
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                                <Search className="absolute left-3 top-2.5 text-muted-foreground w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                                <p className="text-muted-foreground italic">Crunching the numbers...</p>
                            </div>
                        ) : leaderboard.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border">
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Rank</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Student</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Class</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Tests</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right md:pr-10">Total Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {leaderboard.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-muted/10 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                                                        entry.rank === 1 ? "bg-primary/20 text-primary" :
                                                            entry.rank === 2 ? "bg-slate-400/20 text-slate-600" :
                                                                entry.rank === 3 ? "bg-amber-600/20 text-amber-800" :
                                                                    "bg-muted text-muted-foreground"
                                                    )}>
                                                        {entry.rank}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                                            {entry.user.image ? <Image src={entry.user.image} alt="" width={40} height={40} /> : <div className="w-full h-full flex items-center justify-center"><User className="text-muted-foreground w-4 h-4" /></div>}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-foreground truncate max-w-[150px]">{entry.user.name || 'Anonymous'}</span>
                                                            <span className="text-xs text-muted-foreground">{entry.user.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {entry.user.class ? `Class ${entry.user.class}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-muted-foreground">
                                                    {entry.testsTaken}
                                                </td>
                                                <td className="px-6 py-4 text-right md:pr-10">
                                                    <div className="flex items-center justify-end gap-2 px-3 py-1 bg-primary/5 rounded-lg border border-primary/10 w-fit ml-auto">
                                                        <span className="font-black text-primary">{entry.totalScore}</span>
                                                        <Zap className="w-3 h-3 text-primary fill-primary" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="p-6 bg-muted/30 rounded-full mb-6">
                                    <Trophy className="w-16 h-16 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">No student data found</h3>
                                <p className="text-muted-foreground max-w-md mb-6">
                                    Try adjusting your filters or search term to see more results.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Admin Controls Section */}
                    <div className="mt-12 w-full border-t border-border pt-6 pb-20">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Admin-Only Controls</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleAction('recalculate')}
                                    disabled={actionLoading === 'recalculate'}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent text-foreground text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {actionLoading === 'recalculate' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                                    Recalculate Ranks
                                </button>
                                <button
                                    onClick={() => handleAction('reset')}
                                    disabled={actionLoading === 'reset'}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-destructive shadow-sm hover:text-destructive-foreground text-foreground text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {actionLoading === 'reset' ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                                    Reset Leaderboard
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 text-sm font-medium transition-all active:scale-95"
                                >
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
