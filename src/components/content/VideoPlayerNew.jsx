'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Clock, Bookmark, BookmarkCheck, Settings, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayerNew({ 
  url, 
  thumbnail, 
  title, 
  onProgress, 
  onComplete,
  className = ''
}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const controlsTimeout = useRef(null);
  
  // Toggle play/pause
  const togglePlay = () => setPlaying(!playing);
  
  // Toggle mute
  const toggleMute = () => setMuted(!muted);
  
  // Handle volume change
  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (newVolume > 0) {
      setMuted(false);
    } else {
      setMuted(true);
    }
  };
  
  // Handle progress
  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
      
      // Call external progress handler if provided
      if (onProgress) {
        onProgress(state.played);
      }
    }
  };
  
  // Handle seek change
  const handleSeekChange = (value) => {
    setPlayed(value[0] / 100);
  };
  
  // Handle seek mouse up
  const handleSeekMouseUp = (value) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(value[0] / 100);
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    }
  };
  
  // Add bookmark at current time
  const addBookmark = () => {
    if (!playerRef.current) return;
    
    const currentTime = playerRef.current.getCurrentTime();
    if (!bookmarks.some(bm => Math.abs(bm.time - currentTime) < 5)) {
      const newBookmark = {
        id: Date.now(),
        time: currentTime,
        note: `Bookmark at ${formatTime(currentTime)}`,
        createdAt: new Date().toISOString()
      };
      setBookmarks([...bookmarks, newBookmark].sort((a, b) => a.time - b.time));
    }
  };
  
  // Jump to bookmark
  const jumpToBookmark = (time) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      setPlaying(true);
      setShowBookmarks(false);
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8).replace(/^00:/, '');
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!playerRef.current) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          setMuted(!muted);
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          playerRef.current.seekTo(Math.max(0, playerRef.current.getCurrentTime() - 5));
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          playerRef.current.seekTo(Math.min(duration, playerRef.current.getCurrentTime() + 5));
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'b':
          addBookmark();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [muted, duration]);
  
  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    return () => clearTimeout(controlsTimeout.current);
  }, [showControls, played]);
  
  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Handle video end
  const handleEnded = () => {
    setPlaying(false);
    if (onComplete) onComplete();
  };
  
  // Handle ready
  const handleReady = (player) => {
    playerRef.current = player;
    setIsLoading(false);
  };
  
  // Handle error
  const handleError = (error) => {
    console.error('Video player error:', error);
    setError('Failed to load video. Please try again later.');
    setIsLoading(false);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative w-full bg-black rounded-lg overflow-hidden aspect-video',
        'group hover:shadow-lg transition-shadow duration-200',
        className
      )}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={playerRef}
        src={url}
        poster={thumbnail}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const video = e.target;
          setCurrentTime(video.currentTime);
          setDuration(video.duration || 0);
        }}
        onEnded={handleEnded}
        onLoadedData={() => setIsLoading(false)}
        onError={handleError}
        playsInline
        preload="auto"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
          <div>
            <p className="text-red-400 font-medium mb-2">Error loading video</p>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      )}
      
      {/* Overlay controls */}
      <div 
        ref={controlsRef}
        className={cn(
          'absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Top controls */}
        <div className="flex justify-between items-center p-4">
          <div className="flex-1">
            <h3 className="text-white font-medium line-clamp-1">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Center play button */}
        <div className="flex-1 flex items-center justify-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-16 h-16 rounded-full bg-white/20 text-white hover:bg-white/30 hover:scale-110 transition-transform"
            onClick={togglePlay}
          >
            {playing ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>
        </div>
        
        {/* Bottom controls */}
        <div className="p-4 space-y-2">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer" onClick={handleProgressClick}>
            <div 
              className="h-full bg-blue-500 relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transform translate-x-1/2"></div>
            </div>
            <div 
              className="h-full bg-white/30 absolute top-0 left-0 pointer-events-none"
              style={{ width: `${(loaded / 1) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                
                <div className="w-24">
                  <Slider
                    value={[muted ? 0 : volume * 100]}
                    onValueChange={(value) => handleVolumeChange({ target: { value: value[0] / 100 } })}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-500">Playback Speed</div>
                  {PLAYBACK_RATES.map(rate => (
                    <DropdownMenuItem 
                      key={rate} 
                      className={cn(
                        'cursor-pointer',
                        playbackRate === rate && 'bg-gray-100 font-medium'
                      )}
                      onClick={() => {
                        if (playerRef.current) {
                          playerRef.current.playbackRate = rate;
                          setPlaybackRate(rate);
                        }
                      }}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant={bookmarks.some(bm => Math.abs(bm.time - currentTime) < 5) ? "default" : "ghost"}
                size="icon" 
                className={cn(
                  "text-white hover:bg-white/20",
                  bookmarks.some(bm => Math.abs(bm.time - currentTime) < 5) && "bg-blue-500 hover:bg-blue-600"
                )}
                onClick={addBookmark}
              >
                {bookmarks.some(bm => Math.abs(bm.time - currentTime) < 5) ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bookmarks panel */}
      {showBookmarks && bookmarks.length > 0 && (
        <div className="absolute top-4 right-4 w-64 max-h-[70vh] bg-black/90 rounded-lg p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-white font-medium">Bookmarks</h4>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={() => setShowBookmarks(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {bookmarks.map(bookmark => (
              <div 
                key={bookmark.id}
                className="p-2 bg-white/10 rounded hover:bg-white/20 cursor-pointer transition-colors"
                onClick={() => jumpToBookmark(bookmark.time)}
              >
                <div className="text-blue-400 text-sm">{formatTime(bookmark.time)}</div>
                <div className="text-white text-sm">{bookmark.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
