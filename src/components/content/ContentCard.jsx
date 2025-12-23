'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Video, BookOpen, Clock, Bookmark, Star, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const getContentIcon = (type) => {
  switch (type) {
    case 'video':
      return <Video className="h-5 w-5 text-red-500" />;
    case 'pdf':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'formula':
      return <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>;
    default:
      return <BookOpen className="h-5 w-5 text-green-500" />;
  }
};

const getContentTypeLabel = (type) => {
  switch (type) {
    case 'video':
      return 'Video';
    case 'pdf':
      return 'PDF';
    case 'formula':
      return 'Formula Sheet';
    case 'summary':
      return 'Summary';
    case 'practice':
      return 'Practice';
    default:
      return 'Content';
  }
};

const ContentCard = ({
  id,
  title,
  description,
  type,
  duration,
  views = 0,
  rating = 0,
  isBookmarked = false,
  isFree = false,
  thumbnail,
  url,
  className = '',
  variant = 'grid', // 'grid' or 'list'
  onClick,
  onBookmark,
  onDownload,
  ...props
}) => {
  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmark?.(id, !isBookmarked);
  };

  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload?.(id, url);
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(id);
    }
  };

  const content = (
    <Card 
      className={cn(
        'group h-full flex flex-col transition-all hover:shadow-md overflow-hidden',
        variant === 'list' ? 'flex-row' : 'flex-col',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {thumbnail && (
        <div 
          className={cn(
            'relative bg-gray-100 overflow-hidden',
            variant === 'list' ? 'w-48 flex-shrink-0 h-full' : 'h-40'
          )}
        >
          <img 
            src={thumbnail} 
            alt={title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
          {isFree && (
            <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-700">
              Free
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="flex items-center text-white text-xs space-x-2">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{duration || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                <span>{views.toLocaleString()}</span>
              </div>
              <div className="flex items-center ml-auto">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col flex-1 p-4">
        <CardHeader className="p-0 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              {getContentIcon(type)}
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {title}
              </CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-yellow-500"
              onClick={handleBookmark}
            >
              <Bookmark 
                className={cn(
                  'h-4 w-4',
                  isBookmarked ? 'fill-yellow-400 text-yellow-500' : ''
                )} 
              />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {getContentTypeLabel(type)}
            </Badge>
            {type === 'pdf' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 py-2">
          {description && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {description}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="p-0 pt-2 mt-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last updated 2 days ago</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              View Details
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );

  if (onClick) {
    return (
      <div className="h-full">
        {content}
      </div>
    );
  }

  return (
    <Link href={`/content/${id}`} className="block h-full">
      {content}
    </Link>
  );
};

export default ContentCard;
