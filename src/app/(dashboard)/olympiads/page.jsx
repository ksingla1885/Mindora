'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, Bell, ExternalLink, Trophy, Info, ChevronRight, Clock, Sparkles, Pin } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/cn';

// --- Mock Data (Preserved) ---
const notices = [
    {
        id: 1,
        title: "International Math Olympiad (IMO) 2024 Registration Extended",
        category: "Important",
        date: "24 Dec 2023",
        icon: Bell,
        description: "The registration deadline for IMO 2024 has been extended to January 15, 2024. Ensure you complete your profile updates before applying.",
        link: "#",
        priority: "High",
        color: "text-red-500",
        border: "border-red-500/50",
        glow: "shadow-red-500/20"
    },
    {
        id: 2,
        title: "National Science Olympiad (NSO) Schedule Announced",
        category: "Schedule",
        date: "20 Dec 2023",
        icon: Calendar,
        description: "The NSO level 1 exams are scheduled for February 2024. Check the detailed timetable for your specific class and region.",
        link: "#",
        priority: "Medium",
        color: "text-blue-500",
        border: "border-blue-500/30",
        glow: "shadow-blue-500/10"
    },
    {
        id: 3,
        title: "New Study Material for Cyber Olympiad",
        category: "Resources",
        date: "18 Dec 2023",
        icon: Info,
        description: "Updated study materials and previous year papers for the National Cyber Olympiad have been uploaded to the portal.",
        link: "#",
        priority: "Low",
        color: "text-emerald-500",
        border: "border-emerald-500/30",
        glow: "shadow-emerald-500/10"
    },
    {
        id: 4,
        title: "Upcoming Olympiad: English International Olympiad (EIO)",
        category: "Upcoming",
        date: "15 Dec 2023",
        icon: Trophy,
        description: "Prepare for the English International Olympiad. Registration opens next week. Focus on grammar and comprehension modules.",
        link: "#",
        priority: "Medium",
        color: "text-purple-500",
        border: "border-purple-500/30",
        glow: "shadow-purple-500/10"
    }
];

// --- Components ---

const FeaturedNotice = ({ notice }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "relative group w-full p-8 rounded-2xl border bg-card/50 backdrop-blur-xl overflow-hidden mb-16",
                notice.border,
                "shadow-2xl",
                notice.glow
            )}
        >
            {/* Abstract Background Gradient */}
            <div className={cn("absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700")} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                        <span className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 border border-border", notice.color)}>
                            <Sparkles className="w-3 h-3" />
                            Featured
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {notice.date}
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
                        {notice.title}
                    </h2>

                    <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                        {notice.description}
                    </p>

                    <div className="pt-4">
                        <button className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors group/btn cursor-pointer">
                            Read Full Notice
                            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </div>
                </div>

                {/* Decorative Icon */}
                <div className={cn(
                    "hidden md:flex items-center justify-center w-24 h-24 rounded-2xl bg-background/50 border border-border/50 shadow-inner rotate-3 group-hover:rotate-6 transition-transform duration-500",
                    notice.color
                )}>
                    <notice.icon className="w-10 h-10 opacity-80" />
                </div>
            </div>
        </motion.div>
    );
};

const TimelineItem = ({ notice, index, isLast }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative flex gap-8 md:gap-12 group"
        >
            {/* Timeline Line & Dot */}
            <div className="flex flex-col items-center">
                <div className={cn(
                    "w-3 h-3 rounded-full border-2 bg-background z-10 transition-all duration-300 group-hover:scale-125 group-hover:bg-primary/20",
                    notice.color.replace('text-', 'border-')
                )} />
                {!isLast && (
                    <div className="w-[1px] flex-1 bg-border/50 my-2 group-hover:bg-border transition-colors relative">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                )}
            </div>

            {/* Date Column (Desktop) */}
            <div className="hidden md:block w-32 pt-0.5 text-right shrink-0">
                <span className="text-sm font-mono text-muted-foreground/70 group-hover:text-foreground transition-colors">
                    {notice.date}
                </span>
            </div>

            {/* Content Card */}
            <div className="flex-1 pb-16">
                {/* Date (Mobile) */}
                <div className="md:hidden text-xs font-mono text-muted-foreground mb-2 flex items-center gap-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full", notice.color.replace('text-', 'bg-'))} />
                    {notice.date}
                </div>

                <div
                    className={cn(
                        "relative p-6 rounded-xl border border-border/50 bg-card/30 hover:bg-card/80 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 group-hover:border-primary/20",
                        notice.priority === 'Low' ? "py-4 opacity-80 hover:opacity-100" : ""
                    )}
                >
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className={cn(
                            "font-bold text-lg leading-snug group-hover:text-primary transition-colors",
                            notice.priority === 'Low' ? "text-base font-medium" : ""
                        )}>
                            {notice.title}
                        </h3>
                        {notice.priority !== 'Low' && (
                            <notice.icon className={cn("w-5 h-5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity", notice.color)} />
                        )}
                    </div>

                    {notice.priority !== 'Low' && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                            {notice.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <span className={cn(
                            "text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-md bg-muted/50 border border-border/50 transition-colors",
                            notice.priority === 'Low' ? "text-xs" : ""
                        )}>
                            {notice.category}
                        </span>

                        {notice.priority !== 'Low' && (
                            <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                View Details <ExternalLink className="w-3 h-3" />
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function OlympiadNoticesPage() {
    // Determine Featured (Highest Priority)
    // Filter out the featured one for the timeline to avoid duplication if strictly separating,
    // OR keep logical order. The prompt implies structure separation.
    // Let's find index of first 'High'.

    // Sort notices by logic if needed, but array order is usually chronological. 
    // I'll pick the first 'High' as featured, rest as timeline.

    const featuredIndex = notices.findIndex(n => n.priority === 'High');
    const featuredNotice = featuredIndex !== -1 ? notices[featuredIndex] : notices[0];
    const timelineNotices = notices.filter(n => n.id !== featuredNotice.id);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 animate-fade-in">
            {/* Header Section */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">Olympiad Feed</h1>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground hidden sm:block">
                        LATEST_SYNC: {new Date().toISOString().split('T')[0]}
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Featured Section */}
                <FeaturedNotice notice={featuredNotice} />

                {/* Timeline Section */}
                <div className="relative pl-2 md:pl-0">
                    <div className="mb-12 flex items-center gap-4">
                        <h3 className="text-xl font-light text-muted-foreground">Recent Updates</h3>
                        <div className="h-[1px] flex-1 bg-border/50" />
                    </div>

                    <div className="space-y-0">
                        {timelineNotices.map((notice, index) => (
                            <TimelineItem
                                key={notice.id}
                                notice={notice}
                                index={index}
                                isLast={index === timelineNotices.length - 1}
                            />
                        ))}
                    </div>

                    {/* End of Feed Indicator */}
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30 gap-2">
                        <div className="w-1 h-12 bg-gradient-to-b from-border to-transparent" />
                        <span className="text-xs font-mono uppercase tracking-widest">End of Stream</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
