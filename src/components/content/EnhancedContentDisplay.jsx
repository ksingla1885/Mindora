'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { BookOpen, Clock, BarChart2, CheckCircle, XCircle, Bookmark, Share2, MessageSquare, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { contentService } from '@/services/content/content.service';

export function EnhancedContentDisplay({ contentId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [comment, setComment] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userProgress, setUserProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState('');

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await contentService.getContentById(contentId);
        setContent(data);
        
        // Check if content is bookmarked
        if (session?.user?.id) {
          const bookmarkStatus = await contentService.checkBookmarkStatus(contentId, session.user.id);
          setIsBookmarked(bookmarkStatus.isBookmarked);
          
          // Get user progress
          const progress = await contentService.getUserProgress(contentId, session.user.id);
          setUserProgress(progress.percentage);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchContent();
    }
  }, [contentId, session?.user?.id]);

  // Handle bookmark toggle
  const toggleBookmark = async () => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }
    
    try {
      setIsSubmitting(true);
      if (isBookmarked) {
        await contentService.removeBookmark(contentId, session.user.id);
        toast({
          title: 'Bookmark removed',
          description: 'Content removed from your bookmarks',
        });
      } else {
        await contentService.addBookmark(contentId, session.user.id);
        toast({
          title: 'Bookmark added',
          description: 'Content added to your bookmarks',
        });
      }
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Error updating bookmark:', err);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !session?.user?.id) return;
    
    try {
      setIsSubmitting(true);
      const newComment = await contentService.addComment({
        contentId,
        userId: session.user.id,
        text: comment,
      });
      
      setContent(prev => ({
        ...prev,
        comments: [newComment, ...(prev.comments || [])]
      }));
      
      setComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle answer submission for practice questions
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    try {
      setIsSubmitting(true);
      const result = await contentService.submitAnswer({
        contentId,
        questionId: content.practiceQuestions?.[0]?.id,
        userId: session?.user?.id,
        answer: userAnswer,
      });
      
      setIsCorrect(result.isCorrect);
      setFeedback(result.feedback);
      setShowAnswer(true);
      
      if (result.isCorrect) {
        // Update progress
        const newProgress = Math.min(userProgress + 25, 100);
        setUserProgress(newProgress);
        
        toast({
          title: 'Correct!',
          description: 'Great job! Your answer is correct.',
        });
      } else {
        toast({
          title: 'Incorrect',
          description: 'Check the explanation to learn more.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit answer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-destructive">
          {error || 'Content not found'}
        </h3>
        <p className="text-muted-foreground mt-2">
          We couldn't load the requested content. Please try again later.
        </p>
        <Button className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
          <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {content.readingTime || '5 min'} read
            </span>
            <span>•</span>
            <span>Updated {format(new Date(content.updatedAt), 'MMM d, yyyy')}</span>
            {content.difficulty && (
              <Badge variant="outline" className="ml-2">
                {content.difficulty}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleBookmark}
                disabled={isSubmitting}
              >
                <Bookmark 
                  className={`h-5 w-5 ${isBookmarked ? 'fill-current text-yellow-500' : ''}`} 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isBookmarked ? 'Remove bookmark' : 'Bookmark this content'}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share this content</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Your Progress</span>
          <span>{userProgress}%</span>
        </div>
        <Progress value={userProgress} className="h-2" />
      </div>

      {/* Main Content */}
      <Tabs 
        defaultValue="content" 
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6">
          <Card>
            <CardContent className="pt-6 prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content.content }} />
            </CardContent>
            
            <CardFooter className="border-t pt-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Helpful
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Not Helpful
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {content.views} views • {content.likes} likes
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Practice Tab */}
        <TabsContent value="practice" className="mt-6">
          {content.practiceQuestions?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Practice Questions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test your understanding with these practice questions
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {content.practiceQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <p>{question.question}</p>
                      
                      {question.type === 'MCQ' && question.options?.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {question.options.map((option, i) => (
                            <div 
                              key={i} 
                              className={`p-3 border rounded-md cursor-pointer hover:bg-accent ${
                                showAnswer && option.isCorrect 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800' 
                                  : ''
                              }`}
                              onClick={() => !showAnswer && setUserAnswer(option.text)}
                            >
                              <div className="flex items-center">
                                <div className={`flex items-center justify-center h-5 w-5 rounded-full border mr-3 ${
                                  userAnswer === option.text 
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : 'bg-background'
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </div>
                                <span>{option.text}</span>
                                {showAnswer && option.isCorrect && (
                                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'SHORT_ANSWER' && (
                        <div className="space-y-4 mt-4">
                          <Textarea
                            placeholder="Type your answer here..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={showAnswer}
                            className="min-h-[100px]"
                          />
                          
                          {showAnswer && (
                            <div className={`p-4 rounded-md ${
                              isCorrect 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            }`}>
                              <div className="flex items-center font-medium mb-2">
                                {isCorrect ? (
                                  <>
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                    Correct!
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                    Not quite right
                                  </>
                                )}
                              </div>
                              <p className="text-sm">{feedback || question.explanation}</p>
                              
                              {!isCorrect && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Correct answer:
                                  </p>
                                  <p className="text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                                    {question.correctAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      {!showAnswer ? (
                        <Button 
                          onClick={handleSubmitAnswer}
                          disabled={!userAnswer.trim() || isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Answer'
                          )}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowAnswer(false);
                            setUserAnswer('');
                            setIsCorrect(null);
                            setFeedback('');
                          }}
                        >
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No practice questions available</h3>
              <p className="text-muted-foreground">
                This content doesn't have any practice questions yet.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Discussion</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ask questions and discuss this content with other students
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="space-y-3">
                  <Label htmlFor="comment">Add a comment</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts or ask a question..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!comment.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </form>
              
              <div className="space-y-6">
                {content.comments?.length > 0 ? (
                  content.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.user.image} />
                        <AvatarFallback>
                          {comment.user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{comment.text}</p>
                        
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <button className="hover:text-foreground">Like</button>
                          <button className="hover:text-foreground">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="font-medium mb-1">No comments yet</h4>
                    <p className="text-sm text-muted-foreground">
                      Be the first to start the discussion!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Related Content */}
      {content.relatedContent?.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Related Content</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.relatedContent.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/content/${item.slug}`)}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-muted-foreground">
                    <span>{item.type}</span>
                    <span className="mx-2">•</span>
                    <span>{item.difficulty}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedContentDisplay;
