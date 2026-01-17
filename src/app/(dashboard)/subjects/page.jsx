'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    BookOpen,
    GraduationCap,
    Loader2,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubjectsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const userClass = session?.user?.class;

    useEffect(() => {
        fetchSubjects();
    }, [userClass]);

    const fetchSubjects = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/subjects');
            const data = await response.json();

            if (data.success) {
                console.log('All subjects:', data.data);
                console.log('User class:', userClass);

                // Filter subjects based on user's class
                let filteredSubjects = data.data;

                if (userClass) {
                    // Normalize class format (handle both "11" and "Class 11")
                    const normalizedClass = userClass.startsWith('Class') ? userClass : `Class ${userClass}`;
                    console.log('Normalized class:', normalizedClass);

                    const classSubjectMapping = {
                        "Class 9": ["Mathematics", "Science"],
                        "Class 10": ["Mathematics", "Science"],
                        "Class 11": ["Physics (Class 11)", "Chemistry (Class 11)", "Mathematics (Class 11)", "Astronomy (Class 11)"],
                        "Class 12": ["Physics (Class 12)", "Chemistry (Class 12)", "Mathematics (Class 12)", "Astronomy (Class 12)"]
                    };

                    const allowedSubjects = classSubjectMapping[normalizedClass] || [];
                    console.log('Allowed subjects:', allowedSubjects);

                    filteredSubjects = data.data.filter(subject =>
                        allowedSubjects.includes(subject.name)
                    );

                    console.log('Filtered subjects:', filteredSubjects);
                }

                setSubjects(filteredSubjects);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card/80 backdrop-blur-sm border-b border-border">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="size-8 text-primary" />
                        <h1 className="text-3xl font-bold">Subjects</h1>
                    </div>
                    {userClass && (
                        <p className="text-muted-foreground flex items-center gap-2">
                            <GraduationCap className="size-4" />
                            Showing subjects for {userClass}
                        </p>
                    )}
                </div>
            </header>

            {/* Subjects Grid */}
            <main className="container mx-auto px-4 py-8">
                {subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-6 bg-muted/30 rounded-full mb-6">
                            <BookOpen className="size-16 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No subjects available</h3>
                        <p className="text-muted-foreground max-w-md mb-4">
                            {userClass ? `No subjects found for ${userClass}. Please check the browser console for debugging info.` : 'Please set your class in your profile.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {subjects.map((subject, index) => (
                            <SubjectCard
                                key={subject.id}
                                subject={subject}
                                index={index}
                                onClick={() => router.push(`/subjects/${subject.id}`)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function SubjectCard({ subject, index, onClick }) {
    const colors = [
        'from-purple-500/10 to-purple-500/5 border-purple-500/30',
        'from-teal-500/10 to-teal-500/5 border-teal-500/30',
        'from-blue-500/10 to-blue-500/5 border-blue-500/30',
        'from-orange-500/10 to-orange-500/5 border-orange-500/30',
    ];

    const colorClass = colors[index % colors.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative bg-gradient-to-br ${colorClass} rounded-2xl border p-6 hover:shadow-xl transition-all duration-300 cursor-pointer`}
            onClick={onClick}
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="p-3 bg-background/50 rounded-xl">
                        <BookOpen className="size-6 text-primary" />
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {subject.name.replace(/\s\(Class\s\d+\)/, '')}
                    </h3>
                    {subject.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {subject.description}
                        </p>
                    )}
                </div>

                <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{subject._count?.topics || 0} Topics</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick();
                            }}
                        >
                            View Topics →
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
