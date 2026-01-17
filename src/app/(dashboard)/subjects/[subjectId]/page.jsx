'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BookOpen,
    Clock,
    FileText,
    PlayCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { subjectId } = params;

    const [subject, setSubject] = useState(null);
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSubjectData();
    }, [subjectId]);

    const fetchSubjectData = async () => {
        setIsLoading(true);
        try {
            // Fetch subject details
            const subjectRes = await fetch(`/api/subjects/${subjectId}`);
            const subjectData = await subjectRes.json();

            if (subjectData.success) {
                setSubject(subjectData.data);
            }

            // Fetch topics for this subject
            const topicsRes = await fetch(`/api/topics?subjectId=${subjectId}`);
            const topicsData = await topicsRes.json();

            if (topicsData.success) {
                setTopics(topicsData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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
            <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="cursor-pointer"
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <BookOpen className="size-6 text-primary" />
                                <h1 className="text-2xl font-bold">{subject?.name || 'Subject'}</h1>
                            </div>
                            {subject?.description && (
                                <p className="text-sm text-muted-foreground">
                                    {subject.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Curriculum Path */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <BookOpen className="size-4" />
                        <span className="font-semibold">Curriculum Path</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {topics.length} Topics Available
                    </p>
                </div>

                {/* Topics List */}
                {topics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-6 bg-muted/30 rounded-full mb-6">
                            <FileText className="size-16 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No topics available yet</h3>
                        <p className="text-muted-foreground max-w-md">
                            Topics for this subject will be added soon. Check back later!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {topics.map((topic, index) => (
                            <TopicCard
                                key={topic.id}
                                topic={topic}
                                index={index}
                                subjectId={subjectId}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function TopicCard({ topic, index, subjectId }) {
    const router = useRouter();
    const contentCount = topic._count?.contentItems || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="size-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    Topic {index + 1}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">
                                {topic.name}
                            </h3>
                            {topic.summary && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {topic.summary}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {topic.difficulty && (
                            <div className="flex items-center gap-1">
                                <div className={`size-2 rounded-full ${topic.difficulty === 'beginner' ? 'bg-green-500' :
                                        topic.difficulty === 'intermediate' ? 'bg-yellow-500' :
                                            'bg-red-500'
                                    }`} />
                                <span className="capitalize">{topic.difficulty}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <FileText className="size-3" />
                            <span>{contentCount} {contentCount === 1 ? 'item' : 'items'}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => router.push(`/subjects/${subjectId}/${topic.id}`)}
                    >
                        <FileText className="size-4 mr-2" />
                        View Notes
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
