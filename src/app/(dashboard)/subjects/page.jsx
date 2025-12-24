'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator,
    FlaskConical,
    Atom,
    Rocket,
    GraduationCap,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    X,
    BookOpen,
    ArrowRight,
    Maximize2,
    Minimize2
} from 'lucide-react';
import Link from 'next/link';

// Data Structure
const educationData = [
    {
        classLevel: "Class 9",
        description: "Build a strong foundation for future competitive exams.",
        subjects: [
            {
                id: "class9-math",
                name: "Mathematics",
                icon: Calculator,
                colorClass: "text-indigo-600 dark:text-indigo-400",
                bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
                cardBg: "bg-[#eff2ff] dark:bg-[#1e1e2e]",
                borderClass: "border-indigo-500 dark:border-indigo-400",
                hoverBorder: "hover:border-indigo-600 dark:hover:border-indigo-300",
                hasPreview: true, // Specific flag for the demo feature
                topics: [
                    { name: "Number Systems", unit: "Unit 1", difficulty: "Easy", difficultyColor: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
                    { name: "Polynomials", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Coordinate Geometry", unit: "Unit 3", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            },
            {
                id: "class9-science",
                name: "Science",
                icon: FlaskConical,
                colorClass: "text-green-600 dark:text-green-400",
                bgClass: "bg-green-500/10 dark:bg-green-500/20",
                cardBg: "bg-[#dcfce7] dark:bg-[#1a2e22]",
                borderClass: "border-green-100 dark:border-green-900/30",
                hoverBorder: "hover:border-green-300 dark:hover:border-green-700",
                hasPreview: true,
                topics: [
                    { name: "Matter in Our Surroundings", unit: "Unit 1", difficulty: "Easy", difficultyColor: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
                    { name: "Is Matter Around Us Pure", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "The Fundamental Unit of Life", unit: "Unit 5", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" }
                ]
            }
        ]
    },
    {
        classLevel: "Class 10",
        description: "Master key concepts for board exams and Olympiads.",
        subjects: [
            {
                id: "class10-math",
                name: "Mathematics",
                icon: Calculator,
                colorClass: "text-indigo-600 dark:text-indigo-400",
                bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
                cardBg: "bg-[#e0e7ff] dark:bg-[#1e1e2e]",
                borderClass: "border-indigo-100 dark:border-indigo-900/30",
                hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-700",
                hasPreview: true,
                topics: [
                    { name: "Real Numbers", unit: "Unit 1", difficulty: "Easy", difficultyColor: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
                    { name: "Polynomials", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Triangles", unit: "Unit 4", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            },
            {
                id: "class10-science",
                name: "Science",
                icon: FlaskConical,
                colorClass: "text-green-600 dark:text-green-400",
                bgClass: "bg-green-500/10 dark:bg-green-500/20",
                cardBg: "bg-[#dcfce7] dark:bg-[#1a2e22]",
                borderClass: "border-green-100 dark:border-green-900/30",
                hoverBorder: "hover:border-green-300 dark:hover:border-green-700",
                hasPreview: true,
                topics: [
                    { name: "Chemical Reactions", unit: "Unit 1", difficulty: "Easy", difficultyColor: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
                    { name: "Acids, Bases and Salts", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Life Processes", unit: "Unit 5", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            }
        ]
    },
    {
        classLevel: "Class 11",
        description: "Advanced preparation for engineering and medical entrances.",
        subjects: [
            {
                id: "class11-physics",
                name: "Physics",
                icon: Atom,
                colorClass: "text-purple-600 dark:text-purple-400",
                bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
                cardBg: "bg-[#f3e8ff] dark:bg-[#2d2438]",
                borderClass: "border-purple-100 dark:border-purple-900/30",
                hoverBorder: "hover:border-purple-300 dark:hover:border-purple-700",
                hasPreview: true,
                topics: [
                    { name: "Kinematics", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Laws of Motion", unit: "Unit 3", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
                    { name: "Thermodynamics", unit: "Unit 8", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            },
            {
                id: "class11-chemistry",
                name: "Chemistry",
                icon: FlaskConical,
                colorClass: "text-teal-600 dark:text-teal-400",
                bgClass: "bg-teal-500/10 dark:bg-teal-500/20",
                cardBg: "bg-[#ccfbf1] dark:bg-[#134e4a]",
                borderClass: "border-teal-100 dark:border-teal-900/30",
                hoverBorder: "hover:border-teal-300 dark:hover:border-teal-700",
                hasPreview: true,
                topics: [
                    { name: "Structure of Atom", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Chemical Bonding", unit: "Unit 4", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
                    { name: "Hydrocarbons", unit: "Unit 13", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" }
                ]
            },
            {
                id: "class11-math",
                name: "Mathematics",
                icon: Calculator,
                colorClass: "text-indigo-600 dark:text-indigo-400",
                bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
                cardBg: "bg-[#e0e7ff] dark:bg-[#1e1e2e]",
                borderClass: "border-indigo-100 dark:border-indigo-900/30",
                hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-700",
                hasPreview: true,
                topics: [
                    { name: "Sets and Functions", unit: "Unit 1", difficulty: "Easy", difficultyColor: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
                    { name: "Trigonometric Functions", unit: "Unit 3", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
                    { name: "Conic Sections", unit: "Unit 11", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" }
                ]
            },
            {
                id: "class11-astro",
                name: "Astronomy",
                icon: Rocket,
                colorClass: "text-orange-600 dark:text-orange-400",
                bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
                cardBg: "bg-[#ffedd5] dark:bg-[#431407]",
                borderClass: "border-orange-100 dark:border-orange-900/30",
                hoverBorder: "hover:border-orange-300 dark:hover:border-orange-700",
                hasPreview: true,
                topics: [
                    { name: "Celestial Mechanics", unit: "Unit 1", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
                    { name: "Stellar Evolution", unit: "Unit 3", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Cosmology", unit: "Unit 5", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            }
        ]
    },
    {
        classLevel: "Class 12",
        description: "Final sprint towards competitive success and excellence.",
        subjects: [
            {
                id: "class12-physics",
                name: "Physics",
                icon: Atom,
                colorClass: "text-purple-600 dark:text-purple-400",
                bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
                cardBg: "bg-[#f3e8ff] dark:bg-[#2d2438]",
                borderClass: "border-purple-100 dark:border-purple-900/30",
                hoverBorder: "hover:border-purple-300 dark:hover:border-purple-700",
                hasPreview: true,
                topics: [
                    { name: "Electric Charges and Fields", unit: "Unit 1", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Current Electricity", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Ray Optics", unit: "Unit 6", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            },
            {
                id: "class12-chemistry",
                name: "Chemistry",
                icon: FlaskConical,
                colorClass: "text-teal-600 dark:text-teal-400",
                bgClass: "bg-teal-500/10 dark:bg-teal-500/20",
                cardBg: "bg-[#ccfbf1] dark:bg-[#134e4a]",
                borderClass: "border-teal-100 dark:border-teal-900/30",
                hoverBorder: "hover:border-teal-300 dark:hover:border-teal-700",
                hasPreview: true,
                topics: [
                    { name: "Solutions", unit: "Unit 2", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Electrochemistry", unit: "Unit 3", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
                    { name: "Coordination Compounds", unit: "Unit 9", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            },
            {
                id: "class12-math",
                name: "Mathematics",
                icon: Calculator,
                colorClass: "text-indigo-600 dark:text-indigo-400",
                bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
                cardBg: "bg-[#e0e7ff] dark:bg-[#1e1e2e]",
                borderClass: "border-indigo-100 dark:border-indigo-900/30",
                hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-700",
                hasPreview: true,
                topics: [
                    { name: "Relations and Functions", unit: "Unit 1", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Matrices", unit: "Unit 2", difficulty: "Easy", difficultyColor: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" },
                    { name: "Integrals", unit: "Unit 3", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" }
                ]
            },
            {
                id: "class12-astro",
                name: "Astronomy",
                icon: Rocket,
                colorClass: "text-orange-600 dark:text-orange-400",
                bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
                cardBg: "bg-[#ffedd5] dark:bg-[#431407]",
                borderClass: "border-orange-100 dark:border-orange-900/30",
                hoverBorder: "hover:border-orange-300 dark:hover:border-orange-700",
                hasPreview: true,
                topics: [
                    { name: "Galactic Structure", unit: "Unit 2", difficulty: "Hard", difficultyColor: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
                    { name: "Exoplanets", unit: "Unit 4", difficulty: "Medium", difficultyColor: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" },
                    { name: "Space Exploration", unit: "Unit 6", difficulty: "Easy", difficultyColor: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" }
                ]
            }
        ]
    }
];

export default function SubjectsPage() {
    const [activePreview, setActivePreview] = useState("class9-math"); // Default open for demo

    const togglePreview = (id) => {
        setActivePreview(activePreview === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col gap-10 p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">Subjects & Olympiads</h1>
                <p className="text-muted-foreground text-lg max-w-3xl">
                    Explore our comprehensive curriculum tailored for Classes 9 to 12. Select a subject to start your preparation journey.
                </p>
            </div>

            {educationData.map((level, idx) => (
                <section key={idx} className="flex flex-col gap-6">
                    {/* Class Header */}
                    <div className="border-b border-border pb-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 text-muted-foreground">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{level.classLevel}</h2>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                        {level.subjects.map((subject) => {
                            const isPreviewActive = activePreview === subject.id && subject.hasPreview;

                            return (
                                <div key={subject.id} className="contents">
                                    <div
                                        onClick={() => subject.hasPreview ? togglePreview(subject.id) : null}
                                        suppressHydrationWarning
                                        className={`
                      relative group flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all duration-300
                      ${subject.cardBg}
                      ${isPreviewActive ? 'border-primary shadow-md' : `${subject.borderClass} ${subject.hoverBorder} hover:shadow-lg hover:-translate-y-1`}
                    `}
                                    >
                                        {/* Triangle Indicator for active item */}
                                        {isPreviewActive && (
                                            <div className={`absolute -bottom-[11px] left-10 w-5 h-5 ${subject.cardBg} border-b-2 border-r-2 border-primary transform rotate-45 z-20 hidden md:block transition-all duration-300`}></div>
                                        )}

                                        <div className={`mb-4 h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${subject.bgClass} ${subject.colorClass} group-hover:bg-primary group-hover:text-primary-foreground`}>
                                            <subject.icon className="h-6 w-6" />
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{subject.name}</h3>

                                        <span className={`text-sm font-medium mt-auto pt-2 flex items-center gap-1 transition-colors ${isPreviewActive ? 'text-primary' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`}>
                                            {isPreviewActive ? (
                                                <>
                                                    Hide Syllabus
                                                    <ChevronUp className="h-4 w-4" />
                                                </>
                                            ) : (
                                                <>
                                                    View Syllabus
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    {/* Just a placeholder logic for non-previewable items to link somewhere if real app */}
                                </div>
                            );
                        })}

                        {/* Preview Panel - Rendered immediately after the row for mobile, or handled via grid placement */}
                        {/* 
               Grid logic note: content spanning full width in CSS grid needs 'col-span-full'. 
               In a responsive grid, this div naturally flows after the items if placed correctly.
               Since we map items, we can't easily inject this div *after* the row unless we know where the row ends.
               However, for this specific request matching the HTML provided: the HTML had the preview div INSIDE the grid container.
               CSS Grid 'dense' packing or col-span-full works well.
            */}

                        <AnimatePresence>
                            {level.subjects.map(subject => (
                                activePreview === subject.id && subject.hasPreview ? (
                                    <motion.div
                                        key={`${subject.id}-preview`}
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="col-span-1 md:col-span-2 lg:col-span-4 relative overflow-hidden"
                                    >
                                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative">
                                            <button
                                                onClick={() => setActivePreview(null)}
                                                suppressHydrationWarning
                                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted z-10"
                                                title="Collapse Preview"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>

                                            <div className="px-6 py-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="pr-8">
                                                    <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                        <BookOpen className="h-5 w-5 text-primary" />
                                                        Topic Preview
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Showing priority topics for <span className="font-medium text-foreground">{level.classLevel} {subject.name}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="divide-y divide-border">
                                                {subject.topics.map((topic, i) => (
                                                    <div key={i} className="p-4 sm:px-6 hover:bg-muted/40 transition-colors group cursor-default">
                                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4 w-full">
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex items-center gap-3">
                                                                        <h5 className="text-base font-semibold text-foreground">{topic.name}</h5>
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground border border-border">
                                                                            {topic.unit}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div
                                                className="bg-muted/40 p-3 text-center border-t border-border cursor-pointer hover:bg-muted/60 transition-colors group"
                                                onClick={() => setActivePreview(null)} // Or navigate to full page
                                            >
                                                <div className="flex flex-col gap-2 items-center justify-center">
                                                    <Link
                                                        href={`/subjects/${subject.id}`}
                                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                                    >
                                                        View Full Syllabus
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                    <button suppressHydrationWarning className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                                                        <ChevronUp className="h-3 w-3" />
                                                        Collapse Preview
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null
                            ))}
                        </AnimatePresence>
                    </div>
                </section>
            ))}
        </div>
    );
}
