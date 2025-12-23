'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2 } from 'lucide-react';

const SecureVideoPlayer = ({ videoKey, poster, className, controls = true, autoPlay = false }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls = null;
    let mounted = true;

    const loadVideo = async () => {
      try {
        // Get a presigned URL for the video
        const response = await fetch(`/api/videos/presigned-url?fileKey=${encodeURIComponent(videoKey)}`);
        
        if (!response.ok) {
          throw new Error('Failed to get video URL');
        }
        
        const { url } = await response.json();
        
        if (!mounted) return;

        if (Hls.isSupported()) {
          // For HLS streaming
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
          });
          
          hls.loadSource(url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (mounted) {
              setIsLoading(false);
              if (autoPlay) {
                video.play().catch(e => console.error('Auto-play failed:', e));
              }
            }
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  handleError(new Error('Failed to load video'));
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // For Safari which supports HLS natively
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            if (mounted) {
              setIsLoading(false);
              if (autoPlay) {
                video.play().catch(e => console.error('Auto-play failed:', e));
              }
            }
          });
        } else {
          throw new Error('HLS is not supported in this browser');
        }
      } catch (err) {
        console.error('Error loading video:', err);
        handleError(err);
      }
    };

    const handleError = (err) => {
      if (mounted) {
        setError(err.message || 'Failed to load video');
        setIsLoading(false);
      }
    };

    loadVideo();

    return () => {
      mounted = false;
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoKey, autoPlay]);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-400 p-4 text-center">
          <div>
            <p className="font-medium">Error loading video</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={poster}
          controls={controls}
          playsInline
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
