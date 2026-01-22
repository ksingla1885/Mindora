"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    KeyboardArrowDown, // Replaced by ChevronDown 
    Schedule, // Replaced by Clock
    FormatListBulleted, // Replaced by List
    BarChart, // Replaced by BarChart2
    School, // Replaced by GraduationCap
    Search
} from "lucide-react"; // I'll use Lucide icons mapping

import {
    ChevronDown,
    Clock,
    List,
    BarChart2,
    GraduationCap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

// No static data - will be fetched from API
const WEEKLY_TESTS = [];

const WeeklyTestsPage = () => {
    const [activeTab, setActiveTab] = useState("Free");
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                // Fetch tests based on active tab (Free/Paid)
                // Note: The API currently returns all tests, checking isPaid property on the client side for now 
                // or pass as param if API supported it. API supports isPublished.
                // We'll filter by isPaid on the client or add param to API.
                // Assuming /api/tests handles class filtering automatically via session.
                const response = await fetch('/api/tests', { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error('Failed to fetch tests');
                }
                const result = await response.json();
                if (result.success) {
                    setTests(result.data);
                }
            } catch (err) {
                console.error("Error fetching tests:", err);
                setError("Failed to load tests");
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    const filteredTests = tests.filter(test =>
        activeTab === "Free" ? !test.isPaid : test.isPaid
    );

    return (
        <div className="flex-1 flex justify-center py-8 px-4 lg:px-8">
            <div className="w-full max-w-[1200px] flex flex-col gap-8">

                {/* Page Heading & Filters */}
                <section className="flex flex-col gap-6">
                    {/* Heading */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                            Weekly Olympiad Tests
                        </h1>
                        <p className="text-muted-foreground text-base font-normal leading-normal max-w-2xl">
                            Sharpen your skills with timed, exam-like practice tests updated every Monday. Track your progress and compete with peers.
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#1a2332] p-2 rounded-xl border border-slate-200 dark:border-[#232f48] shadow-sm">
                        {/* Dropdowns */}
                        <div className="flex flex-wrap gap-2 p-1">
                            <button className="group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-100 dark:bg-[#232f48] hover:bg-slate-200 dark:hover:bg-[#2d3b55] pl-4 pr-3 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                                <p className="text-slate-700 dark:text-white text-sm font-medium">Subject</p>
                                <ChevronDown className="w-5 h-5 text-slate-500 dark:text-white group-hover:rotate-180 transition-transform" />
                            </button>
                            <button className="group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-100 dark:bg-[#232f48] hover:bg-slate-200 dark:hover:bg-[#2d3b55] pl-4 pr-3 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                                <p className="text-slate-700 dark:text-white text-sm font-medium">Class</p>
                                <ChevronDown className="w-5 h-5 text-slate-500 dark:text-white group-hover:rotate-180 transition-transform" />
                            </button>
                            <button className="group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-100 dark:bg-[#232f48] hover:bg-slate-200 dark:hover:bg-[#2d3b55] pl-4 pr-3 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                                <p className="text-slate-700 dark:text-white text-sm font-medium">Olympiad</p>
                                <ChevronDown className="w-5 h-5 text-slate-500 dark:text-white group-hover:rotate-180 transition-transform" />
                            </button>
                        </div>

                        <div className="w-full h-px bg-slate-200 dark:bg-[#232f48] md:hidden"></div>

                        {/* Toggle & Reset */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end px-1">
                            <button className="text-sm font-medium text-slate-500 dark:text-[#92a4c9] hover:text-primary dark:hover:text-white underline underline-offset-4">
                                Reset
                            </button>
                            <div className="flex h-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#232f48] p-1 border border-slate-200 dark:border-transparent">
                                {['Free', 'Paid'].map((type) => (
                                    <label key={type} className={cn(
                                        "flex cursor-pointer h-full items-center justify-center overflow-hidden rounded-[4px] px-4 transition-all text-sm font-medium",
                                        activeTab === type
                                            ? "bg-white text-blue-600 shadow-sm dark:bg-blue-600 dark:text-white"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    )}>
                                        <span className="truncate">{type}</span>
                                        <input
                                            type="radio"
                                            name="pricing-toggle"
                                            className="invisible w-0 h-0"
                                            value={type}
                                            checked={activeTab === type}
                                            onChange={() => setActiveTab(type)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Grid Content */}
                <section>
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[50vh]">
                            <p className="text-muted-foreground">Loading tests...</p>
                        </div>
                    ) : filteredTests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-6">
                                <BarChart2 className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-3">No {activeTab} Tests Available</h2>
                            <p className="text-muted-foreground max-w-md leading-relaxed">
                                There are currently no {activeTab.toLowerCase()} olympiad tests available. Check back later!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTests.map((test) => {
                                const isCompleted = !test.allowMultipleAttempts && test.attempts && test.attempts.length > 0;

                                return (
                                    <Link
                                        key={test.id}
                                        href={isCompleted ? '#' : `/tests/${test.id}`}
                                        className={cn("block", isCompleted && "pointer-events-none opacity-80")}
                                    >
                                        <div className="group flex flex-col bg-white dark:bg-[#1a2332] rounded-xl overflow-hidden border border-slate-200 dark:border-[#232f48] hover:border-primary/50 dark:hover:border-primary hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(19,91,236,0.15)] transition-all duration-300 h-full">
                                            {/* Image Header */}
                                            <div
                                                className={cn(
                                                    "h-40 bg-cover bg-center relative transition-all duration-500",
                                                    // Using a placeholder or test.image if available
                                                    "bg-slate-200 dark:bg-slate-800"
                                                )}
                                                style={test.image ? { backgroundImage: `url('${test.image}')` } : {}}
                                            >
                                                <div className="absolute top-3 right-3">
                                                    {/* Status Badge Logic - Simplified for now */}
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm",
                                                        "bg-blue-500/90 text-white"
                                                    )}>
                                                        {test.isPublished ? 'PUBLISHED' : 'DRAFT'}
                                                    </span>
                                                </div>

                                                {test.isPaid && test.price > 0 && (
                                                    <div className="absolute bottom-3 left-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-900/60 text-white backdrop-blur-sm border border-white/20">
                                                            ₹{test.price}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 flex flex-col flex-1 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-400">
                                                        <span>{test.olympiad?.name || 'Olympiad'}</span>
                                                    </div>
                                                    <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight line-clamp-2">
                                                        {test.title}
                                                    </h3>
                                                </div>

                                                {/* Meta Info Grid */}
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 dark:text-[#92a4c9]">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-[18px] h-[18px]" />
                                                        <span>{test.durationMinutes} min</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <List className="w-[18px] h-[18px]" />
                                                        <span>{test._count?.testQuestions || 0} Qs</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <GraduationCap className="w-[18px] h-[18px]" />
                                                        <span>Class {test.class}</span>
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#232f48] flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {test.startTime ? 'Starts' : 'Availability'}
                                                        </span>
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {test.startTime ? new Date(test.startTime).toLocaleDateString() : 'Available Now'}
                                                        </span>
                                                    </div>

                                                    <button
                                                        className={cn(
                                                            "text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors shadow-lg",
                                                            isCompleted
                                                                ? "bg-green-600 hover:bg-green-700 shadow-green-600/20 cursor-default"
                                                                : "bg-primary hover:bg-blue-600 shadow-primary/20"
                                                        )}
                                                        disabled={isCompleted}
                                                    >
                                                        {isCompleted ? 'Completed' : 'View Details'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

            </div >
        </div >
    );
};

export default WeeklyTestsPage;
