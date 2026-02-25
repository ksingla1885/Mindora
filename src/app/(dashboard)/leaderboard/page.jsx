'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Trophy,
    Medal,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Clock,
    User as UserIcon,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ leaderboard: [], currentUserRank: null, pagination: {} });
    const [timeRange, setTimeRange] = useState('all');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/leaderboard/all?timeRange=${timeRange}&page=${page}&limit=20`);
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [timeRange, page]);

    const topThree = data.leaderboard.slice(0, 3);
    const rest = data.leaderboard.slice(3);

    const Podium = () => (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12 mt-8 px-4">
            {/* 2nd Place */}
            {topThree[1] && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="order-2 md:order-1 flex flex-col items-center"
                >
                    <div className="relative mb-4">
                        <Avatar className="h-20 w-20 border-4 border-slate-300 shadow-xl">
                            <AvatarImage src={topThree[1].image} />
                            <AvatarFallback className="bg-slate-100 text-slate-600"><UserIcon /></AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-slate-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white">2</div>
                    </div>
                    <div className="text-center mb-2">
                        <p className="font-bold text-foreground truncate max-w-[120px]">{topThree[1].name}</p>
                        <p className="text-xs text-muted-foreground">{topThree[1].score}%</p>
                    </div>
                    <div className="h-24 w-28 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-t-xl shadow-inner flex items-center justify-center border-t border-x border-slate-300/30">
                        <Medal className="h-8 w-8 text-slate-400" />
                    </div>
                </motion.div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="order-1 md:order-2 flex flex-col items-center z-10"
                >
                    <div className="relative mb-4">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                            <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
                        </div>
                        <Avatar className="h-28 w-28 border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-400/20">
                            <AvatarImage src={topThree[0].image} />
                            <AvatarFallback className="bg-yellow-50 text-yellow-600"><UserIcon /></AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-black border-4 border-white text-lg">1</div>
                    </div>
                    <div className="text-center mb-2">
                        <p className="font-black text-lg text-foreground truncate max-w-[150px]">{topThree[0].name}</p>
                        <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <p className="text-sm font-bold text-yellow-600">{topThree[0].score}%</p>
                        </div>
                    </div>
                    <div className="h-36 w-32 bg-gradient-to-t from-yellow-200 to-yellow-100 dark:from-yellow-900/40 dark:to-yellow-800/20 rounded-t-2xl shadow-xl flex items-center justify-center border-t-2 border-x-2 border-yellow-400/50">
                        <Trophy className="h-12 w-12 text-yellow-500" />
                    </div>
                </motion.div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="order-3 flex flex-col items-center"
                >
                    <div className="relative mb-4">
                        <Avatar className="h-16 w-16 border-4 border-amber-600/30 shadow-lg">
                            <AvatarImage src={topThree[2].image} />
                            <AvatarFallback className="bg-amber-50 text-amber-700"><UserIcon /></AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold border-2 border-white text-sm">3</div>
                    </div>
                    <div className="text-center mb-2">
                        <p className="font-bold text-foreground truncate max-w-[100px]">{topThree[2].name}</p>
                        <p className="text-xs text-muted-foreground">{topThree[2].score}%</p>
                    </div>
                    <div className="h-16 w-24 bg-gradient-to-t from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/10 rounded-t-lg shadow-inner flex items-center justify-center border-t border-x border-amber-600/20">
                        <Medal className="h-6 w-6 text-amber-600" />
                    </div>
                </motion.div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950 pb-20">
            <div className="max-w-5xl mx-auto px-4 pt-8">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Global Leaderboard</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Compete with the best and climb to the top!</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                {loading && data.leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                        <p className="text-slate-500 animate-pulse">Fetching champions...</p>
                    </div>
                ) : data.leaderboard.length > 0 ? (
                    <>
                        <Podium />

                        <Card className="border-none shadow-2xl shadow-slate-200 dark:shadow-none bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl mb-8 overflow-hidden">
                            <CardHeader className="pb-0 pt-6 px-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold">Rankings</CardTitle>
                                    <div className="relative w-full max-w-[240px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search students..."
                                            className="pl-9 bg-slate-100/50 dark:bg-slate-800/50 border-none h-9 text-sm"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto mt-4">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                                                <th className="py-4 px-6 w-16">Rank</th>
                                                <th className="py-4 px-6">Student</th>
                                                <th className="py-4 px-6 text-center">Class</th>
                                                <th className="py-4 px-6 text-right">Avg Score</th>
                                                <th className="py-4 px-6 text-right w-32">Time Spent</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            <AnimatePresence mode='popLayout'>
                                                {/* If we have data, filter and map it */}
                                                {data.leaderboard.filter(user => user.name.toLowerCase().includes(search.toLowerCase())).map((user) => (
                                                    <motion.tr
                                                        layout
                                                        key={user.userId}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className={cn(
                                                            "group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                                                            user.isCurrentUser && "bg-primary/5 dark:bg-primary/10"
                                                        )}
                                                    >
                                                        <td className="py-4 px-6">
                                                            <span className={cn(
                                                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                                                                user.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                                                                    user.rank === 2 ? "bg-slate-100 text-slate-700" :
                                                                        user.rank === 3 ? "bg-amber-100 text-amber-700" :
                                                                            "text-slate-500 group-hover:text-primary transition-colors"
                                                            )}>
                                                                {user.rank}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary/20 transition-all">
                                                                    <AvatarImage src={user.image} />
                                                                    <AvatarFallback className="bg-slate-100 text-xs font-medium"><UserIcon className="h-4 w-4" /></AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 dark:text-white leading-none">
                                                                        {user.name}
                                                                        {user.isCurrentUser && <Badge className="ml-2 py-0 h-4 text-[10px] uppercase font-bold">You</Badge>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className="text-sm font-medium text-slate-500">{user.class || '-'}</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className="font-black text-slate-900 dark:text-white">{user.score}%</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-1.5 text-slate-500 text-sm">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                <span>{Math.floor(user.timeSpent / 60)}m {user.timeSpent % 60}s</span>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current User Sticky Bar */}
                        {data.currentUserRank && (
                            <motion.div
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50"
                            >
                                <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-white/20 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white/20 flex flex-col items-center justify-center">
                                            <span className="text-[10px] uppercase font-bold opacity-70 leading-none">Rank</span>
                                            <span className="text-lg font-black">{data.currentUserRank.rank}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm opacity-90">Your Performance</p>
                                            <p className="text-xs opacity-70">{timeRange === 'all' ? 'All time' : `Last ${timeRange}`} stats</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 mr-4">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold opacity-70">Best Score</p>
                                            <p className="text-lg font-black">{data.currentUserRank.score}%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold opacity-70 whitespace-nowrap">Avg Time</p>
                                            <p className="text-lg font-black">{Math.floor(data.currentUserRank.timeSpent / 60)}m</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-inner border border-slate-200 dark:border-slate-800">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                            <Trophy className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">The arena is empty!</h2>
                        <p className="text-slate-500 max-w-sm mt-2">
                            Looks like no one has finished a test in this period yet.
                            Be the first to step up and claim the throne!
                        </p>
                        <Button className="mt-8 px-8 py-6 rounded-xl font-bold text-lg" onClick={() => window.location.href = '/tests'}>
                            Take a Test Now
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
