'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Bookmark, CheckCircle, Clock, Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
import { contentService } from '@/services/content/content.service';

export default function ContentViewPage() {
  const { slug } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const data = await contentService.getContentBySlug(slug, session?.user?.id);
        
        if (!data) {
          throw new Error('Content not found or you do not have access');
        }
        
        setContent(data);
        setViewCount(data.viewCount || 0);
        setLikeCount(data.likeCount || 0);
        setIsBookmarked(data.isBookmarked || false);
        setIsLiked(data.isLiked || false);
        
        // Track view
        if (session?.user?.id) {
          await contentService.trackView(data.id, session.user.id);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchContent();
    }
  }, [slug, session]);

  const handleBookmark = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    try {
      if (isBookmarked) {
        await contentService.removeBookmark(content.id, session.user.id);
      } else {
        await contentService.addBookmark(content.id, session.user.id);
      }
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Error updating bookmark:', err);
    }
  };

  const handleLike = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    try {
      if (isLiked) {
        await contentService.unlikeContent(content.id, session.user.id);
        setLikeCount(prev => prev - 1);
      } else {
        await contentService.likeContent(content.id, session.user.id);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: content.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-1/2 mb-6" />
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-5/6 mb-4" />
          <Skeleton className="h-6 w-4/6 mb-8" />
          <div className="h-[400px] bg-muted/20 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested content could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {content.parentId ? 'Module' : 'Course'}
        </Button>

        <article className="prose dark:prose-invert max-w-none">
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{content.type}</span>
              <span>•</span>
              <span>{content.duration} min read</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {content.title}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-6">
              {content.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{content.commentCount || 0} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart 
                  className={`h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} 
                />
                <span>{likeCount} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Updated {new Date(content.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </header>

          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />

          <footer className="mt-12 pt-6 border-t">
            <div className="flex flex-wrap gap-3">
              {content.tags?.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Button 
                variant={isBookmarked ? 'secondary' : 'outline'} 
                size="sm"
                onClick={handleBookmark}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              
              <Button 
                variant={isLiked ? 'secondary' : 'outline'} 
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                {isLiked ? 'Liked' : 'Like'} ({likeCount})
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              
              {content.completed && (
                <Button variant="success" size="sm">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </Button>
              )}
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
