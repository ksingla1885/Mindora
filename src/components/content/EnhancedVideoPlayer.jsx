'use client';

import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export function EnhancedVideoPlayer({ url, thumbnail, title, onProgress, onComplete }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
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
    playerRef.current.seekTo(value[0] / 100);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
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
    playerRef.current.seekTo(time);
    setPlaying(true);
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space: play/pause
      if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
      
      // M: mute/unmute
      if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
      
      // F: toggle fullscreen
      if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
      
      // Left/Right arrow: seek -/+ 5 seconds
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        playerRef.current.seekTo(playerRef.current.getCurrentTime() - 5);
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        playerRef.current.seekTo(playerRef.current.getCurrentTime() + 5);
      }
      
      // B: add bookmark
      if (e.code === 'KeyB') {
        e.preventDefault();
        addBookmark();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, muted, bookmarks]);
  
  // Auto-hide controls after delay
  useEffect(() => {
    if (!playing) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [playing, showControls]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden aspect-video group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={muted ? 0 : volume}
        onProgress={handleProgress}
        onDuration={setDuration}
        onEnded={() => {
          setPlaying(false);
          if (onComplete) onComplete();
        }}
        width="100%"
        height="100%"
        style={{ backgroundColor: '#000' }}
        playsinline
        light={!playing && thumbnail}
        playIcon={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        }
      />
      
      {/* Overlay Controls */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300",
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
          <h3 className="text-white font-medium text-lg">{title}</h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={() => setShowBookmarks(!showBookmarks)}
              title="Bookmarks"
            >
              {bookmarks.length > 0 ? (
                <BookmarkCheck className="h-5 w-5 text-yellow-400" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Bookmarks Panel */}
        {showBookmarks && (
          <div className="absolute top-16 right-4 w-64 bg-black/90 rounded-lg p-4 shadow-lg z-10">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-medium">Bookmarks</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addBookmark}
                className="text-white hover:bg-white/20"
              >
                Add Bookmark
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {bookmarks.length > 0 ? (
                <ul className="space-y-2">
                  {bookmarks.map(bookmark => (
                    <li 
                      key={bookmark.id}
                      className="flex items-center justify-between p-2 hover:bg-white/10 rounded cursor-pointer"
                      onClick={() => jumpToBookmark(bookmark.time)}
                    >
                      <span className="text-sm text-white/80">{bookmark.note}</span>
                      <span className="text-xs text-white/60">{formatTime(bookmark.time)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/60 text-center py-4">
                  No bookmarks yet. Click 'Add Bookmark' to save your position.
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="mb-2">
            <Slider
              value={[played * 100]}
              onValueChange={handleSeekChange}
              onMouseDown={() => setSeeking(true)}
              onMouseUp={handleSeekMouseUp}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/80 mt-1">
              <span>{formatTime(played * duration)}</span>
              <div className="flex items-center gap-2">
                <span>Speed: </span>
                <select 
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="bg-black/50 text-white text-xs p-1 rounded border border-white/20"
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <option key={speed} value={speed}>
                      {speed}x
                    </option>
                  ))}
                </select>
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              
              <div className="w-24">
                <Slider
                  value={[muted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <span className="text-sm text-white/80 ml-2">
                {formatTime(played * duration)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={() => {
                  // Toggle between 0.5x, 1x, 1.5x, 2x
                  setPlaybackRate(prev => {
                    const rates = [0.5, 1, 1.5, 2];
                    const currentIndex = rates.indexOf(prev);
                    return rates[(currentIndex + 1) % rates.length];
                  });
                }}
                title={`Playback speed: ${playbackRate}x`}
              >
                <span className="text-sm font-mono">{playbackRate}x</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      {loaded < 1 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
