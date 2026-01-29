"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Filter,
    ChevronDown,
    Check,
    Clock,
    List,
    Lock,
    Unlock,
    ArrowRight,
    LogIn,
    Play
} from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

const CLASS_SUBJECTS = {
    '9': ['Mathematics', 'Science'],
    '10': ['Mathematics', 'Science'],
    '11': ['Physics', 'Chemistry', 'Mathematics', 'Astronomy'],
    '12': ['Physics', 'Chemistry', 'Mathematics', 'Astronomy'],
};

export default function PremiumTestsPage() {
    const { data: session } = useSession();
    const [premiumTests, setPremiumTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await fetch('/api/tests?isPaid=true&isPublished=true');
                const data = await res.json();
                if (data.success) {
                    setPremiumTests(data.data.map(t => ({
                        id: t.id,
                        title: t.title,
                        tags: [t.subject, `Class ${t.class}`, t.olympiad?.name || 'Olympiad'],
                        duration: `${t.durationMinutes} mins`,
                        questions: `${t._count?.testQuestions || 0} Questions`,
                        difficulty: t.difficulty || 'Medium',
                        price: t.price,
                        originalPrice: Math.floor(t.price * 1.25), // Mock original price for discount effect
                        status: new Date(t.startTime) > new Date() ? 'Starts Soon' : 'Live Now',
                        statusColor: new Date(t.startTime) > new Date() ? 'ring-red-500/20 text-red-400 bg-red-900/10' : 'ring-green-500/20 text-green-400 bg-green-900/10',
                        bgColor: 'bg-card', // Simplify or randomize if needed
                        icon: 'functions', // Default or map from subject
                        features: ['Detailed Ranking', 'Performance Analysis', 'Video Solutions'],
                        action: 'Unlock Now',
                        isPurchased: false // TODO: Check with user purchases
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch premium tests", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, []);

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';

    // Filter States
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [selectedOlympiad, setSelectedOlympiad] = useState('All');
    const [showLiveOnly, setShowLiveOnly] = useState(false);

    // Derived unique options
    const userClass = session?.user?.class;
    const availableSubjects = userClass ? CLASS_SUBJECTS[userClass] : null;

    // If we have a class map, use it. Otherwise fall back to what's in the tests.
    const subjects = ['All', ...(availableSubjects || [...new Set(premiumTests.map(t => t.tags[0]))])];

    const displayedTests = premiumTests.filter(test => {
        // Search Filter
        const matchesSearch = !searchQuery || (
            test.title.toLowerCase().includes(searchQuery) ||
            test.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );

        // Dropdown Filters
        const matchesSubject = selectedSubject === 'All' || test.tags[0] === selectedSubject;
        const matchesOlympiad = selectedOlympiad === 'All' || (test.tags[2] === selectedOlympiad);

        // Toggle Filter
        const matchesLive = !showLiveOnly || test.status === 'Live Now';

        return matchesSearch && matchesSubject && matchesOlympiad && matchesLive;
    });
    return (
        <div className="flex-1 flex justify-center py-8 px-4 lg:px-8 bg-background-light dark:bg-background-dark min-h-screen">
            <div className="w-full max-w-[1200px] flex flex-col gap-8">

                {/* Page Heading & Filters */}
                <section className="flex flex-col gap-8">
                    {/* Heading */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">
                            Premium Olympiad Tests
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
                            Real exam simulations with rankings & detailed analytics to boost your preparation.
                        </p>
                    </div>

                    {/* Filters (Chips) */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mr-2">
                            <Filter className="w-5 h-5" />
                            Filter by:
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn("group flex h-9 items-center gap-2 rounded-lg bg-card border border-border px-3 hover:border-primary/50 hover:bg-accent transition-all", selectedSubject !== 'All' && "border-primary/50 bg-primary/5 text-primary")}>
                                    <span className="text-sm font-medium">{selectedSubject === 'All' ? 'Subject' : selectedSubject}</span>
                                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {subjects.map(s => (
                                    <DropdownMenuItem key={s} onClick={() => setSelectedSubject(s)}>
                                        {s}
                                        {selectedSubject === s && <Check className="ml-auto w-4 h-4" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            onClick={() => setShowLiveOnly(!showLiveOnly)}
                            className={cn(
                                "group flex h-9 items-center gap-2 rounded-lg border px-3 transition-all",
                                showLiveOnly
                                    ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                                    : "bg-card border-border hover:border-primary/50 hover:bg-accent text-foreground"
                            )}
                        >
                            <span className="text-sm font-medium">Live Only</span>
                            {showLiveOnly && <Check className="w-4 h-4" />}
                        </button>
                        <div className="ml-auto hidden md:block text-sm text-muted-foreground">
                            Showing <span className="text-foreground font-bold">{displayedTests.length}</span> tests
                        </div>
                    </div>
                </section>

                {/* Test Cards Grid */}
                <section>
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : displayedTests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-6">
                                <Lock className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-3">No Premium Tests Available</h2>
                            <p className="text-muted-foreground max-w-md leading-relaxed">
                                There are currently no premium olympiad tests available. Check back soon for new premium content!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedTests.map((test) => (
                                <div key={test.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">

                                    {/* Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                    {/* Header Image / Banner Area */}
                                    <div className={cn("relative h-28 px-5 py-4 flex flex-col justify-between", test.bgColor)}>
                                        <div className="flex justify-between items-start z-10">
                                            <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ring-1 ring-inset", test.statusColor)}>
                                                {test.status.includes('Live') && (
                                                    <span className="relative flex h-2 w-2 mr-1">
                                                        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                )}
                                                {test.status.includes('Starts') && (
                                                    <span className="relative flex h-2 w-2 mr-1">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                )}
                                                {test.status}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/10">
                                                {test.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex flex-1 flex-col gap-4 p-5 pt-0 -mt-8 relative z-10">
                                        {/* Icon Placeholder (Since Material Symbols aren't standard in lucide) */}
                                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#282e39] border border-border shadow-md text-3xl font-bold">
                                            {/* Simplified icon representation using text or generic icon if mapping is complex */}
                                            <span className={cn("material-symbols-outlined", test.iconColor)} style={{ fontFamily: 'Material Symbols Outlined' }}>
                                                {/* For React, we might need a trusted way to render material icons if linked in head, 
                         or replace with Lucide. I'll use a generic Lucide fallback for safety if font isn't loaded, 
                         but since user asked to convert, I will assume font link is present or I should use Lucide.
                         I'll use Lucide for consistency with React ecosystem. */}
                                                {test.icon === 'science' && '🧪'}
                                                {test.icon === 'calculate' && '➗'}
                                                {test.icon === 'translate' && '文'}
                                                {test.icon === 'psychology' && '🧠'}
                                                {test.icon === 'functions' && '∫'}
                                                {test.icon === 'public' && '🌍'}
                                            </span>
                                        </div>

                                        {/* Title & Meta */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                {test.tags.map((tag, i) => (
                                                    <span key={i} className="flex gap-2">
                                                        {tag}
                                                        {i < test.tags.length - 1 && <span>•</span>}
                                                    </span>
                                                ))}
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                                                {test.title}
                                            </h3>
                                        </div>

                                        {/* Specs */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-4">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-[18px] h-[18px]" />
                                                <span>{test.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <List className="w-[18px] h-[18px]" />
                                                <span>{test.questions}</span>
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Included</p>
                                            <div className="flex flex-col gap-1.5">
                                                {test.features.map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Check className="w-4 h-4 text-green-500" />
                                                        {feature}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto flex items-center justify-between pt-4">
                                            <div className="flex flex-col">
                                                {test.isPurchased ? (
                                                    <>
                                                        <span className="text-xs text-muted-foreground">Purchased</span>
                                                        <span className="text-sm font-bold text-green-500 flex items-center gap-1">
                                                            <Check className="w-4 h-4" /> Owned
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs text-muted-foreground line-through">₹{test.originalPrice}</span>
                                                        <span className="text-xl font-bold text-foreground">₹{test.price}</span>
                                                    </>
                                                )}
                                            </div>

                                            {test.isPurchased ? (
                                                <Link href={`/tests/${test.id}`}>
                                                    <button className="flex items-center gap-2 rounded-lg bg-card border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2 text-sm font-bold transition-all">
                                                        Start Test
                                                        <Play className="w-[18px] h-[18px]" />
                                                    </button>
                                                </Link>
                                            ) : (
                                                <Link href={`/tests/${test.id}`}>
                                                    <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all">
                                                        {test.action}
                                                        {test.action === 'Join Now' ? <LogIn className="w-[18px] h-[18px]" /> : <ArrowRight className="w-[18px] h-[18px]" />}
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>



            </div>
        </div>
    );
}
