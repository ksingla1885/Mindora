'use client';

import { motion } from 'framer-motion';
import { Calendar, Bell, ExternalLink, Trophy, Info } from 'lucide-react';
import { useState } from 'react';

// Mock Notices Data
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
        colorClass: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
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
        colorClass: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
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
        colorClass: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
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
        colorClass: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
    }
];

export default function OlympiadsNoticesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Olympiad Notices</h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-3xl ml-1">
                    Stay updated with the latest announcements, schedules, and important information regarding upcoming Olympiads and competitions.
                </p>
            </div>

            {/* Notices Grid */}
            <div className="grid gap-6">
                {notices.map((notice, index) => (
                    <motion.div
                        key={notice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${notice.colorClass}`}>
                            {notice.category}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                            <div className={`p-4 rounded-full flex-shrink-0 ${notice.colorClass.replace("text-", "bg-opacity-20 ")}`}>
                                <notice.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{notice.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {notice.date}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs border ${notice.priority === 'High' ? 'border-red-200 text-red-600 dark:border-red-900/50 dark:text-red-400' :
                                            notice.priority === 'Medium' ? 'border-yellow-200 text-yellow-600 dark:border-yellow-900/50 dark:text-yellow-400' :
                                                'border-green-200 text-green-600 dark:border-green-900/50 dark:text-green-400'
                                        }`}>
                                        {notice.priority} Priority
                                    </span>
                                </div>
                                <p className="text-muted-foreground mb-4 leading-relaxed">
                                    {notice.description}
                                </p>
                                <button className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                                    Read More
                                    <ExternalLink className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State / Coming Soon Placeholder if needed */}
            {notices.length === 0 && (
                <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
                    <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-bold text-muted-foreground">No Notices Yet</h3>
                    <p className="text-muted-foreground/80 mt-2">Check back later for updates on Olympiad schedules.</p>
                </div>
            )}
        </div>
    );
}
