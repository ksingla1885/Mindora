'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Fullscreen, Loader2, 
  Maximize, Minimize, Settings, Captions, PictureInPicture, 
  RotateCw, Download, Clock, Zap, ZapOff, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const VideoPlayer = ({ 
  url, 
  provider = 's3', 
  className = '',
  title = 'Video',
  description = '',
  poster = '',
  autoPlay = false,
  loop = false,
  controls = true,
  onPlaybackChange = null,
  onTimeUpdate = null,
  onEnded = null,
  onError = null,
  onFullscreenChange = null,
  classNameContainer = '',
  downloadUrl = null,
  captions = [],
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
  defaultPlaybackRate = 1,
  defaultVolume = 0.8,
  hotkeys = true,
  showDownloadButton = true,
  showQualitySettings = true,
  showCaptionsButton = true,
  showPlaybackRate = true
}) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef(null);

  // State management
  // State management
  te(controls);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(defaultPlaybackRate);
  const [activeTrack, setActiveTrack] = useState(-1);
  const [buffered, setBuffered] = useState(0);
  const [showCaptions, setShowCaptions] = useState(!!captions?.length);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [qualities, setQualities] = useState([]);
  
  // Refs
  const containerRef = useRef(null);
  const settingsRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle different video providers
  const getVideoSource = useCallback(() => {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      
      // YouTube
      if (provider === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = getYoutubeVideoId(url);
        if (!videoId) throw new Error('Invalid YouTube URL');
        
        // Check if we're using embedded URL or need to create one
        if (url.includes('embed/')) {
          return url;
        }
        
        // Create embedded URL with enhanced parameters
        const params = new URLSearchParams({
          autoplay: autoPlay ? 1 : 0,
          rel: 0, // Don't show related videos at the end
          modestbranding: 1, // Remove YouTube logo
          showinfo: 0, // Hide video title and uploader
          iv_load_policy: 3, // Hide annotations
          enablejsapi: 1, // Enable JS API
          origin: window.location.origin,
          playsinline: 1, // Play inline on iOS
          ...(loop && { loop: 1, playlist: videoId }), // Loop for YouTube
          ...(!controls && { controls: 0 }),
        });
        
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      }
      
      // Vimeo
      if (provider === 'vimeo' || url.includes('vimeo.com')) {
        const videoId = getVimeoVideoId(url);
        if (!videoId) throw new Error('Invalid Vimeo URL');
        
        const params = new URLSearchParams({
          autoplay: autoPlay ? 1 : 0,
          title: 0,
          byline: 0,
          portrait: 0,
          transparent: 0,
          ...(loop && { loop: 1 }),
          ...(!controls && { controls: 0 }),
        });
        
        return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
      }
      
      // Direct video URL (S3 or other sources)
      if (provider === 's3' || url.match(/\.(mp4|webm|ogg|mov|m3u8|mpd)(\?.*)?$/i)) {
        // For HLS or DASH streams, we might need to use hls.js or dash.js
        return url;
      }
      
      return url;
    } catch (error) {
      console.error('Error processing video URL:', error);
      setError('Invalid video URL');
      return '';
    }
  }, [url, provider, autoPlay, loop, controls]);

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url) => {
    try {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11) ? match[7] : null;
    } catch (e) {
      return null;
    }
  };

  // Extract Vimeo video ID from URL
  const getVimeoVideoId = (url) => {
    try {
      const regExp = /(?:vimeo\.com\/(?:[^\/]+\/)*|\/video\/|\/)(\d+)(?:[?/]|$)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  };
  
  // Handle video source change
  const videoSource = getVideoSource();

  // Event Handlers
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play()
        .then(() => {
          // Playback started successfully
          trackEvent('VIDEO_PLAY', {
            videoUrl: url,
            provider,
            currentTime: videoRef.current?.currentTime || 0,
          });
        })
        .catch(err => {
          console.error('Error playing video:', err);
          setError('Error playing video. Please try again.');
        });
    }
    
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    onPlaybackChange?.(newIsPlaying);
  }, [isPlaying, onPlaybackChange, provider, url]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    
    // If unmuting and volume is 0, set to default
    if (newMuted === false && videoRef.current.volume === 0) {
      videoRef.current.volume = defaultVolume;
      setVolume(defaultVolume);
    }
  }, [isMuted, defaultVolume]);

  const handleVolumeChange = useCallback((e) => {
    if (!videoRef.current) return;
    
    let newVolume = parseFloat(e.target.value);
    newVolume = Math.min(1, Math.max(0, newVolume)); // Clamp between 0 and 1
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    
    // Update mute state based on volume
    if (newVolume > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 0;
    
    setCurrentTime(currentTime);
    setDuration(duration);
    
    // Calculate buffered amount
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const bufferedAmount = (bufferedEnd / duration) * 100 || 0;
      setBuffered(bufferedAmount);
    }
    
    onTimeUpdate?.({
      currentTime,
      duration,
      progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    });
  }, [onTimeUpdate]);

  const handleProgressClick = useCallback((e) => {
    if (!videoRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    // Track seek event
    trackEvent('VIDEO_SEEK', {
      videoUrl: url,
      provider,
      fromTime: currentTime,
      toTime: newTime,
      seekPercentage: pos * 100,
    });
  }, [currentTime, duration, provider, url]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    const newFullscreen = !isFullscreen;
    
    if (newFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) { // Safari
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) { // IE11
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE11
        document.msExitFullscreen();
      }
    }
    
    setIsFullscreen(newFullscreen);
    onFullscreenChange?.(newFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  const handlePlaybackRateChange = useCallback((rate) => {
    if (!videoRef.current) return;
    
    const newRate = parseFloat(rate);
    videoRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
    
    trackEvent('VIDEO_PLAYBACK_RATE_CHANGE', {
      videoUrl: url,
      provider,
      playbackRate: newRate,
    });
  }, [provider, url]);

  const handleQualityChange = useCallback((newQuality) => {
    setQuality(newQuality);
    // Implementation for quality change would depend on the video provider
    // For YouTube/Vimeo, this would use their respective APIs
    // For HLS/DASH, this would involve switching renditions
    
    trackEvent('VIDEO_QUALITY_CHANGE', {
      videoUrl: url,
      provider,
      quality: newQuality,
    });
  }, [provider, url]);

  const togglePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Error toggling Picture-in-Picture:', error);
    }
  }, []);
  };

  // Format time in seconds to MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Show/hide controls
  const showControlsWithTimeout = () => {
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration || 0);
    };

    const handleError = () => {
      setError('Failed to load video. Please try again later.');
      setIsLoading(false);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('click', togglePlay);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('click', togglePlay);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [url, provider]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowleft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, currentTime - 5);
          break;
        case 'arrowright':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(duration, currentTime + 5);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange({ target: { value: Math.min(1, volume + 0.1) } });
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange({ target: { value: Math.max(0, volume - 0.1) } });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hotkeys, isMuted, showCaptions, showCaptionsButton, toggleFullscreen, toggleMute, togglePlay, togglePictureInPicture]);

  // ... (rest of the code remains the same)

export default VideoPlayer;
