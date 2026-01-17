'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
    PlayCircle,
    Download,
    Clock,
    Calendar,
    Loader2,
    Youtube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TopicContentPage() {
    const params = useParams();
    const router = useRouter();
    const { subjectId, topicId } = params;

    const [topic, setTopic] = useState(null);
    const [contentItems, setContentItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTopicContent();
    }, [topicId]);

    const fetchTopicContent = async () => {
        setIsLoading(true);
        try {
            // Fetch topic details
            const topicRes = await fetch(`/api/topics/${topicId}`);
            const topicData = await topicRes.json();

            if (topicData.success) {
                setTopic(topicData.data);
            }

            // Fetch content for this topic
            const contentRes = await fetch(`/api/content?topicId=${topicId}`);
            const contentData = await contentRes.json();

            if (contentData.success) {
                setContentItems(contentData.data);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
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
                            <h1 className="text-2xl font-bold">{topic?.name || 'Topic Content'}</h1>
                            <p className="text-sm text-muted-foreground">
                                {topic?.subject?.name} • {contentItems.length} items
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Grid */}
            <main className="container mx-auto px-4 py-8">
                {contentItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-6 bg-muted/30 rounded-full mb-6">
                            <FileText className="size-16 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No content available yet</h3>
                        <p className="text-muted-foreground max-w-md">
                            Content for this topic will be added soon. Check back later!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contentItems.map((item, index) => (
                            <ContentCard key={item.id} item={item} index={index} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function ContentCard({ item, index }) {
    const isVideo = item.type?.toLowerCase().includes('video') || item.type === 'YouTube';
    const isYoutube = item.type === 'YouTube';
    const isPDF = item.type?.toLowerCase().includes('pdf');
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : null;
    const isFree = item.metadata?.isFree !== false;

    const handleView = () => {
        if (item.url) {
            window.open(item.url, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
            onClick={handleView}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                {item.thumbnailUrl ? (
                    <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        {isVideo ? (
                            isYoutube ?
                                <Youtube className="size-16 text-red-600/50" /> :
                                <PlayCircle className="size-16 text-primary/30" />
                        ) : (
                            <FileText className="size-16 text-primary/30" />
                        )}
                    </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <Badge className={`text-[10px] font-black tracking-tighter uppercase px-2 py-0.5 border-none shadow-sm ${isYoutube ? 'bg-red-600 text-white' :
                            item.provider === 'supabase' ? 'bg-emerald-500 text-white' :
                                'bg-blue-500 text-white'
                        }`}>
                        {isYoutube ? 'YouTube' : isVideo ? 'Video' : 'PDF'}
                    </Badge>
                    {isFree && (
                        <Badge className="text-[10px] font-black bg-green-500 text-white border-none">
                            FREE
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 gap-3">
                <h3 className="font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                    {item.title}
                </h3>

                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                    </p>
                )}

                {/* Metadata */}
                <div className="mt-auto pt-3 border-t border-border space-y-2">
                    {item.metadata?.duration && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Clock className="size-3" />
                            <span>{item.metadata.duration} mins</span>
                        </div>
                    )}
                    {date && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Calendar className="size-3" />
                            <span>Added {date}</span>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <Button
                    className="w-full mt-2 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleView();
                    }}
                >
                    {isVideo ? (
                        <>
                            <PlayCircle className="size-4 mr-2" />
                            Watch Now
                        </>
                    ) : (
                        <>
                            <Download className="size-4 mr-2" />
                            View/Download
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
