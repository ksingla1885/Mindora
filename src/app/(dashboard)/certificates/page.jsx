"use client";

import React from 'react';
import {
    Share2,
    Trophy,
    Award,
    Flame,
    Search,
    ChevronDown,
    SlidersHorizontal,
    BadgeCheck,
    Star,
    Download,
    CheckCircle2,
    Medal
} from 'lucide-react';

export default function CertificatesPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground animate-fade-in" suppressHydrationWarning>
            <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Page Heading */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">My Certificates</h1>
                            <p className="text-base md:text-lg text-muted-foreground">Your learning milestones and achievements in one place</p>
                        </div>
                        <button className="hidden md:flex items-center gap-2 text-primary font-semibold hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                            <Share2 className="w-5 h-5" />
                            Share Public Profile
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Card */}
                        <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-default">
                            <div className="size-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                                <p className="text-3xl font-bold text-foreground">12</p>
                            </div>
                        </div>
                        {/* Latest Achievement Card */}
                        <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-default">
                            <div className="size-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                <Award className="w-8 h-8" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Latest Achievement</p>
                                <p className="text-lg font-bold text-foreground truncate" title="Physics Olympiad">Physics Olympiad</p>
                            </div>
                        </div>
                        {/* Streak Card */}
                        <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-default">
                            <div className="size-14 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                <Flame className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Completion Streak</p>
                                <p className="text-3xl font-bold text-foreground">5 Weeks</p>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters Toolbar */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[280px]">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                <Search className="w-5 h-5" />
                            </span>
                            <input
                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-secondary border-none rounded-lg focus:ring-2 focus:ring-primary placeholder:text-muted-foreground text-foreground outline-none"
                                placeholder="Search by certificate title..."
                                type="text"
                            />
                        </div>
                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="relative group">
                                <select className="appearance-none bg-secondary border-none text-foreground text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg cursor-pointer focus:ring-2 focus:ring-primary outline-none">
                                    <option>All Subjects</option>
                                    <option>Mathematics</option>
                                    <option>Physics</option>
                                    <option>Computer Science</option>
                                </select>
                                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                                    <ChevronDown className="w-5 h-5" />
                                </span>
                            </div>
                            <div className="relative group">
                                <select className="appearance-none bg-secondary border-none text-foreground text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg cursor-pointer focus:ring-2 focus:ring-primary outline-none">
                                    <option>All Types</option>
                                    <option>Exam</option>
                                    <option>Course</option>
                                    <option>Olympiad</option>
                                </select>
                                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                                    <ChevronDown className="w-5 h-5" />
                                </span>
                            </div>
                            <div className="relative group">
                                <select className="appearance-none bg-secondary border-none text-foreground text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg cursor-pointer focus:ring-2 focus:ring-primary outline-none">
                                    <option>Year: 2024</option>
                                    <option>Year: 2023</option>
                                </select>
                                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                                    <ChevronDown className="w-5 h-5" />
                                </span>
                            </div>
                            <div className="h-6 w-px bg-border mx-2 hidden md:block"></div>
                            <button className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                <SlidersHorizontal className="w-5 h-5" />
                                <span className="hidden sm:inline">Sort by: Newest</span>
                            </button>
                        </div>
                    </div>

                    {/* Certificate Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                        {/* Certificate Card 1 (Physics Olympiad) */}
                        <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col">
                            {/* Header / Preview Area */}
                            <div className="relative h-48 w-full bg-secondary/50 p-6 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
                                <div className="relative z-10 bg-card shadow-md w-32 aspect-[1/1.414] flex flex-col p-2 items-center gap-1 transform group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-sm mb-1"></div>
                                    <div className="w-3/4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm mt-2"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                    <div className="mt-auto size-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
                                        <BadgeCheck className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="absolute top-3 right-3 bg-card/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-primary border border-primary/20 shadow-sm flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    Honors
                                </div>
                            </div>
                            {/* Body */}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Olympiad</span>
                                    <span className="text-xs text-muted-foreground">Oct 15, 2024</span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">National Physics Olympiad 2024</h3>
                                <p className="text-sm text-muted-foreground mb-4">Physics • Grade 10</p>
                                <div className="flex items-center gap-3 mb-6 bg-secondary/50 p-2.5 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Rank</p>
                                        <p className="text-sm font-bold text-foreground">Top 1%</p>
                                    </div>
                                    <div className="w-px h-8 bg-border"></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Score</p>
                                        <p className="text-sm font-bold text-foreground">98/100</p>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-2">
                                    <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm shadow-primary/30">
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </button>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                                            View Details
                                        </button>
                                        <button className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Share">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Card 2 (Advanced Calc) */}
                        <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col">
                            <div className="relative h-48 w-full bg-secondary/50 p-6 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-teal-600/5"></div>
                                <div className="relative z-10 bg-card shadow-md w-32 aspect-[1/1.414] flex flex-col p-2 items-center gap-1 transform group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-sm mb-1"></div>
                                    <div className="w-3/4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm mt-2"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                </div>
                                <div className="absolute top-3 right-3 bg-card/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-green-600 border border-green-600/20 shadow-sm flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Passed
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Exam</span>
                                    <span className="text-xs text-muted-foreground">Sep 28, 2024</span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">Advanced Calculus Module 1</h3>
                                <p className="text-sm text-muted-foreground mb-4">Mathematics • Grade 10</p>
                                <div className="flex items-center gap-3 mb-6 bg-secondary/50 p-2.5 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Grade</p>
                                        <p className="text-sm font-bold text-foreground">A+</p>
                                    </div>
                                    <div className="w-px h-8 bg-border"></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Score</p>
                                        <p className="text-sm font-bold text-foreground">92%</p>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-2">
                                    <button className="w-full flex items-center justify-center gap-2 bg-card border border-primary text-primary hover:bg-primary/5 font-medium py-2.5 rounded-lg transition-colors">
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </button>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                                            View Details
                                        </button>
                                        <button className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Share">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Card 3 (Python) */}
                        <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col">
                            <div className="relative h-48 w-full bg-secondary/50 p-6 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-blue-600/5"></div>
                                <div className="relative z-10 bg-card shadow-md w-32 aspect-[1/1.414] flex flex-col p-2 items-center gap-1 transform group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-sm mb-1"></div>
                                    <div className="w-3/4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm mt-2"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                </div>
                                <div className="absolute top-3 right-3 bg-card/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-muted-foreground border border-border shadow-sm flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Completed
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course</span>
                                    <span className="text-xs text-muted-foreground">Aug 12, 2024</span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">Intro to Python Programming</h3>
                                <p className="text-sm text-muted-foreground mb-4">Computer Science • Beginner</p>
                                <div className="flex items-center gap-3 mb-6 bg-secondary/50 p-2.5 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                                        <p className="text-sm font-bold text-foreground">Verified</p>
                                    </div>
                                    <div className="w-px h-8 bg-border"></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Hours</p>
                                        <p className="text-sm font-bold text-foreground">24 Hrs</p>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-2">
                                    <button className="w-full flex items-center justify-center gap-2 bg-card border border-primary text-primary hover:bg-primary/5 font-medium py-2.5 rounded-lg transition-colors">
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </button>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                                            View Details
                                        </button>
                                        <button className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Share">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Card 4 (Chemistry) */}
                        <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col">
                            <div className="relative h-48 w-full bg-secondary/50 p-6 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-orange-600/5"></div>
                                <div className="relative z-10 bg-card shadow-md w-32 aspect-[1/1.414] flex flex-col p-2 items-center gap-1 transform group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-sm mb-1"></div>
                                    <div className="w-3/4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm mt-2"></div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                                </div>
                                <div className="absolute top-3 right-3 bg-card/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-purple-600 border border-purple-600/20 shadow-sm flex items-center gap-1">
                                    <Medal className="w-3.5 h-3.5" />
                                    Merit
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exam</span>
                                    <span className="text-xs text-muted-foreground">July 05, 2024</span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">Organic Chemistry Fundamentals</h3>
                                <p className="text-sm text-muted-foreground mb-4">Chemistry • Grade 10</p>
                                <div className="flex items-center gap-3 mb-6 bg-secondary/50 p-2.5 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Grade</p>
                                        <p className="text-sm font-bold text-foreground">A</p>
                                    </div>
                                    <div className="w-px h-8 bg-border"></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-0.5">Score</p>
                                        <p className="text-sm font-bold text-foreground">88%</p>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-2">
                                    <button className="w-full flex items-center justify-center gap-2 bg-card border border-primary text-primary hover:bg-primary/5 font-medium py-2.5 rounded-lg transition-colors">
                                        <Download className="w-5 h-5" />
                                        Download PDF
                                    </button>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                                            View Details
                                        </button>
                                        <button className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Share">
                                            <Share2 className="w-5 h-5" />
                                        </button>
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
