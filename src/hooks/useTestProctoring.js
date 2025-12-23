import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

/**
 * Hook for handling test proctoring functionality
 * @param {Object} config - Configuration object
 * @param {string} config.testId - The ID of the test
 * @param {Function} config.onViolation - Callback when a proctoring violation occurs
 * @param {boolean} config.enableFaceDetection - Whether to enable face detection
 * @param {boolean} config.enableTabMonitoring - Whether to monitor tab focus
 * @param {boolean} config.enforceFullscreen - Whether to enforce fullscreen mode
 * @param {boolean} config.blockKeyboardShortcuts - Whether to block keyboard shortcuts
 * @returns {Object} - Proctoring state and methods
 */
export const useTestProctoring = ({
  testId,
  onViolation,
  enableFaceDetection = true,
  enableTabMonitoring = true,
  enforceFullscreen = true,
  blockKeyboardShortcuts = true,
} = {}) => {
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceDetectionInterval = useRef(null);
  
  const [proctoringState, setProctoringState] = useState({
    isActive: false,
    isFullscreen: false,
    faceDetected: true,
    tabFocusLost: false,
    violations: [],
    violationCount: 0,
    lastWarning: null,
  });

  // Check if proctoring is supported
  const isProctoringSupported = useCallback(() => {
    const basicSupport = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    const faceDetectionSupport = 'FaceDetector' in window;
    return {
      basic: basicSupport,
      faceDetection: faceDetectionSupport,
      fullscreen: 'fullscreenEnabled' in document,
    };
  }, []);

  // Log a violation
  const logViolation = useCallback((type, message) => {
    const violation = {
      type,
      message,
      timestamp: new Date().toISOString(),
      testId,
    };
    
    setProctoringState(prev => ({
      ...prev,
      violations: [...prev.violations, violation],
      violationCount: prev.violationCount + 1,
      lastWarning: violation,
    }));
    
    if (onViolation) {
      onViolation(violation);
    }
    
    // Show a warning toast
    toast({
      title: 'Proctoring Alert',
      description: message,
      variant: 'destructive',
      duration: 5000,
    });
    
    return violation;
  }, [testId, onViolation, toast]);

  // Handle face detection (simplified - in a real app, use a proper face detection library)
  const startFaceDetection = useCallback(() => {
    if (!enableFaceDetection) return;
    
    const checkFace = async () => {
      try {
        // In a real app, you would use a proper face detection library here
        // This is a simplified simulation
        const hasFace = Math.random() > 0.1; // 90% chance of detecting a face
        
        setProctoringState(prev => ({
          ...prev,
          faceDetected: hasFace,
        }));
        
        if (!hasFace) {
          logViolation(
            'NO_FACE_DETECTED', 
            'No face detected in the camera feed. Please ensure your face is visible.'
          );
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    };
    
    // Check for face every 5 seconds
    faceDetectionInterval.current = setInterval(checkFace, 5000);
    checkFace(); // Initial check
    
    return () => {
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
    };
  }, [enableFaceDetection, logViolation]);

  // Handle tab focus changes
  const handleVisibilityChange = useCallback(() => {
    if (!enableTabMonitoring) return;
    
    if (document.hidden) {
      setProctoringState(prev => ({
        ...prev,
        tabFocusLost: true,
      }));
      
      logViolation(
        'TAB_SWITCH_DETECTED',
        'Please return to the test window. Switching tabs is not allowed.'
      );
    } else {
      setProctoringState(prev => ({
        ...prev,
        tabFocusLost: false,
      }));
    }
  }, [enableTabMonitoring, logViolation]);

  // Handle fullscreen changes
  const handleFullscreenChange = useCallback(() => {
    if (!enforceFullscreen) return;
    
    const isFullscreen = !!(document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.msFullscreenElement);
    
    setProctoringState(prev => ({
      ...prev,
      isFullscreen,
    }));
    
    if (!isFullscreen) {
      logViolation(
        'FULLSCREEN_EXIT',
        'Please keep the test in fullscreen mode.'
      );
      
      // Try to re-enter fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(console.error);
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    }
  }, [enforceFullscreen, logViolation]);

  // Block keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (!blockKeyboardShortcuts) return;
    
    // Block common keyboard shortcuts
    const blockedKeys = [
      'F1', 'F5', 'F12', // Function keys
      'Escape', // Escape key
      'ContextMenu', // Right-click menu
      'PrintScreen', // Screenshot
    ];
    
    // Block Ctrl+ combinations
    const ctrlCombos = ['c', 'v', 'x', 'z', 'y', 's', 'p', 'n', 'o'];
    
    if (
      blockedKeys.includes(e.key) ||
      (e.ctrlKey && ctrlCombos.includes(e.key.toLowerCase())) ||
      (e.altKey && e.key === 'Tab') // Alt+Tab
    ) {
      e.preventDefault();
      e.stopPropagation();
      
      logViolation(
        'KEYBOARD_SHORTCUT_BLOCKED',
        'This keyboard shortcut is not allowed during the test.'
      );
    }
  }, [blockKeyboardShortcuts, logViolation]);

  // Request camera and microphone access
  const startMediaCapture = useCallback(async () => {
    if (!enableFaceDetection) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false, // Disable audio for now
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      logViolation(
        'MEDIA_ACCESS_DENIED',
        'Could not access camera. Please allow camera access for proctoring.'
      );
      return null;
    }
  }, [enableFaceDetection, logViolation]);

  // Start proctoring
  const startProctoring = useCallback(async () => {
    const support = isProctoringSupported();
    
    if (!support.basic) {
      console.warn('Proctoring not supported in this browser');
      return false;
    }
    
    setProctoringState(prev => ({
      ...prev,
      isActive: true,
    }));
    
    // Set up event listeners
    if (enableTabMonitoring) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    if (enforceFullscreen) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);
      
      // Request fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          await document.documentElement.msRequestFullscreen();
        }
      } catch (error) {
        console.error('Error entering fullscreen:', error);
        logViolation(
          'FULLSCREEN_ERROR',
          'Could not enter fullscreen mode. Some features may be limited.'
        );
      }
    }
    
    if (blockKeyboardShortcuts) {
      document.addEventListener('keydown', handleKeyDown, true);
    }
    
    // Start media capture and face detection
    await startMediaCapture();
    startFaceDetection();
    
    return true;
  }, [
    enableTabMonitoring,
    enforceFullscreen,
    blockKeyboardShortcuts,
    handleVisibilityChange,
    handleFullscreenChange,
    handleKeyDown,
    isProctoringSupported,
    logViolation,
    startFaceDetection,
    startMediaCapture,
  ]);

  // Stop proctoring
  const stopProctoring = useCallback(() => {
    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear intervals
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
      faceDetectionInterval.current = null;
    }
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    document.removeEventListener('keydown', handleKeyDown, true);
    
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(console.error);
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    setProctoringState(prev => ({
      ...prev,
      isActive: false,
      faceDetected: true,
      tabFocusLost: false,
    }));
  }, [
    handleFullscreenChange,
    handleKeyDown,
    handleVisibilityChange,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, [stopProctoring]);

  return {
    ...proctoringState,
    videoRef,
    startProctoring,
    stopProctoring,
    isProctoringSupported: isProctoringSupported(),
  };
};
