"use client";

import { useState } from "react";
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

// Mock Data from HTML
const WEEKLY_TESTS = [
    {
        id: 1,
        title: "IMO Algebra Challenge - Week 4",
        subject: "Math",
        subjectColor: "text-primary",
        olympiad: "IMO",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8ELx961eKfaWc2rNQaZpvqNXhxGFIUKbo61a50UR09SwYD9NyJokAMFAKEUuJG_G9SkSd8zbWAiWAe_jXuqHJR3u1b3H-q_pvGnAOatYb7kPu4E_h29TrlyAg3Ve73bpLAaokgJ8qpEW1niTKjRkXDuV61ms-7sPYSr0hy653XBzjbuj385e24bVEczE14cR7TB9d5lkUpmsh7KPN6TsPHRoy2D3Bc5QcF2T6rpsvd60bDAEIEDO6rwPNW96floWWNI_gVamU82fC",
        status: "Live",
        duration: "60 Mins",
        questions: "30 Qs",
        difficulty: "Hard",
        difficultyColor: "text-orange-500",
        class: "10",
        timeLeft: "Ends in 2h 15m",
        price: null,
        isPaid: false
    },
    {
        id: 2,
        title: "NSEC Full Mock Test Series",
        subject: "Chemistry",
        subjectColor: "text-purple-600 dark:text-purple-400",
        olympiad: "NSEC",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDt_5P8Jlwt40x7LsZt44TB54L1Y9kK_-8tL46ovRiJsAd6SPF-BtoJlz0w5nAevfHYsdbQTuQ_yWe7hLXgJCKjgIMsnR5jIoE6HHuptbD08011BWbeDb7AbX8BbOsE_F46BbjBVgQh10UntbssX_mjKMph6rbud6tH_Jy5MLobGIAaYfjE_O_MJktfHm24vIeBl-UA7drmQcG-71xvAjrAmc5r0d94zRCkXwAhbZlmYydAY5aSyuLj8xcdaFQ9oIoO3adtk0F98MAv",
        status: "Upcoming",
        duration: "120 Mins",
        questions: "60 Qs",
        difficulty: "Medium",
        difficultyColor: "text-yellow-500",
        class: "12",
        timeLeft: "Starts Oct 24, 10:00 AM",
        price: "$5.00",
        isPaid: true
    },
    {
        id: 3,
        title: "Physics Weekly - Motion & Laws",
        subject: "Physics",
        subjectColor: "text-teal-600 dark:text-teal-400",
        olympiad: "IPhO",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbJQf5-qf0BAEL8e2m4ClK5C_tR5-qy_N_vyQqK3owp6I4BIYlSfd00wl3rEsb-xutWa102h02B17asBL_10IEZgBcCd3trwoiT-Ur6S_LveLPuWLtnAda8HATEwGnGBAcX8Y07kVj_oOTCLe91bYkNJ6DuLBWnNlk0teYOm3SaaPb6XxfYNKAgmNtzHVVlMK0PisAdDaaSTmhKc9kBc5YAd0VMPsxXR2_7SfWH7b_hg9FNRdZeWC_X1R2xbxOFAEhzJvo9vgVe7QE",
        status: "Completed",
        duration: "45 Mins",
        questions: "25 Qs",
        difficulty: "Easy",
        difficultyColor: "text-green-500",
        class: "11",
        timeLeft: "Ended Yesterday",
        price: null,
        isPaid: false
    },
    {
        id: 4,
        title: "Genetics & Evolution Mastery",
        subject: "Biology",
        subjectColor: "text-pink-600 dark:text-pink-400",
        olympiad: "NSO",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMWkG6NGzaojH1l014oUuslUT508TkDYNlDmBC5krx7di4OxcaHZmPTG5pNV3rM7s_ab7SY32D8rmsd2GB6qf-D6u4-eRm-DquH-oG27NAhAeTOXEPlsU5eAGXSlOEr8Y2GK5LrToHOiJmje1hTo9gkaA3YEJvkli5XPOfFgEg2UqvXvKBIbJrfmF4Of6z8WPPsx4jHsXsb6buvjXRI-e0Tbk8w-Umelx4-aIxr8FD8ggFG2JxVP9Dt7lczlgL4-kLGsiUvmCGwHw2",
        status: "Upcoming",
        duration: "90 Mins",
        questions: "45 Qs",
        difficulty: "Medium",
        difficultyColor: "text-yellow-500",
        class: "12",
        timeLeft: "Starts Oct 26, 09:00 AM",
        price: null,
        isPaid: false
    },
    {
        id: 5,
        title: "Advanced Calculus Drills",
        subject: "Math",
        subjectColor: "text-primary",
        olympiad: "RMO",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX2ghCxNveuUydDf4j3Z-EiYEyvA8xXi9bkimFDQwcLrMh3JCdFJoAD6EoN0g1hcWh3Zh_79ZUy9s2y2-A6YXWFNWfRohYW65KDiJ-Sah-xJ0E12ofLlGHXVQI96RUVZeMcTO7UnHghZrpDU33351y32WqEmrnuD4HAemgPMySkr4JOIR6GWql_1I_1wkGGDTjfCjpU6vch8twTNq2jZbTlVARIT6QSTcSGVUFoqYwAy8K1EV1l4pYdboV9xV_fQmqW-_1QTYYfVrP",
        status: "Live",
        duration: "120 Mins",
        questions: "20 Qs",
        difficulty: "Hard",
        difficultyColor: "text-orange-500",
        class: "11",
        timeLeft: "Ends in 45m 10s",
        price: null,
        isPaid: false
    },
    {
        id: 6,
        title: "Astronomy & Space Physics",
        subject: "Physics",
        subjectColor: "text-indigo-600 dark:text-indigo-400",
        olympiad: "IAO",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8tC_xcpoUe79M_0VIVwfMopOe9Z0OwSuil-PVNyZdMgvRx2PTVeW4Jmw7qUgazTJRcl0-S71zlGfM3l5yicTshM8psBwrou6-9Qch6rjN5edv2Z5H3jLqbCrPZeTVMwlIFiUmegwgKqjcDmtaFXX4yEtjtTENvMNRg3eSuVwumTc25H4VQYQ4DhnFZBcAg8JjC9M4P8IFayyvmLwhoPxF5Y7vRSq9kr_IudZxUnYm7qzyPuJRr5URy3wfyRl4OXF0uncYPIddWeGA",
        status: "Upcoming",
        duration: "60 Mins",
        questions: "40 Qs",
        difficulty: "Easy",
        difficultyColor: "text-green-500",
        class: "9",
        timeLeft: "Starts Oct 30, 04:00 PM",
        price: "$2.50",
        isPaid: true
    }
];

export default function WeeklyTestsPage() {
    const [activeTab, setActiveTab] = useState("Free");

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
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {WEEKLY_TESTS.map((test) => (
                        <Link key={test.id} href={`/tests/${test.id}`} className="block">
                            <div className="group flex flex-col bg-white dark:bg-[#1a2332] rounded-xl overflow-hidden border border-slate-200 dark:border-[#232f48] hover:border-primary/50 dark:hover:border-primary hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(19,91,236,0.15)] transition-all duration-300 h-full">
                                {/* Image Header */}
                                <div
                                    className={cn(
                                        "h-40 bg-cover bg-center relative transition-all duration-500",
                                        test.status === "Completed" && "grayscale group-hover:grayscale-0",
                                        test.status === "Completed" && "opacity-90 group-hover:opacity-100"
                                    )}
                                    style={{ backgroundImage: `url('${test.image}')` }}
                                >
                                    <div className="absolute top-3 right-3">
                                        {test.status === 'Live' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/90 text-white backdrop-blur-sm shadow-sm animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                LIVE NOW
                                            </span>
                                        )}
                                        {test.status === 'Upcoming' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/90 text-white backdrop-blur-sm shadow-sm">
                                                UPCOMING
                                            </span>
                                        )}
                                        {test.status === 'Completed' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-600/90 text-white backdrop-blur-sm shadow-sm">
                                                COMPLETED
                                            </span>
                                        )}
                                    </div>

                                    {test.price && (
                                        <div className="absolute bottom-3 left-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-900/60 text-white backdrop-blur-sm border border-white/20">
                                                {test.price}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className={cn("flex items-center gap-2 text-xs font-semibold tracking-wide uppercase", test.subjectColor)}>
                                            <span>{test.subject}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                            <span>{test.olympiad}</span>
                                        </div>
                                        <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
                                            {test.title}
                                        </h3>
                                    </div>

                                    {/* Meta Info Grid */}
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 dark:text-[#92a4c9]">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-[18px] h-[18px]" />
                                            <span>{test.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <List className="w-[18px] h-[18px]" />
                                            <span>{test.questions}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart2 className="w-[18px] h-[18px]" />
                                            <span className={cn("font-medium", test.difficultyColor)}>{test.difficulty}</span>
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
                                                {test.status === 'Live' ? 'Ends in' : test.status === 'Completed' ? 'Ended' : 'Starts'}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {test.timeLeft.replace('Ends in ', '').replace('Starts ', '').replace('Ended ', '')}
                                            </span>
                                        </div>

                                        {test.status === 'Live' ? (
                                            <button className="bg-primary hover:bg-blue-600 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors shadow-lg shadow-primary/20">
                                                Start Test
                                            </button>
                                        ) : test.status === 'Completed' ? (
                                            <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors">
                                                View Results
                                            </button>
                                        ) : test.isPaid ? (
                                            <button className="bg-white dark:bg-transparent border border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 text-sm font-medium py-2 px-5 rounded-lg transition-colors">
                                                Buy & Register
                                            </button>
                                        ) : (
                                            <button className="bg-white dark:bg-transparent border border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 text-sm font-medium py-2 px-5 rounded-lg transition-colors">
                                                Register
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>

            </div>
        </div>
    );
}
