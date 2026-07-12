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
  blockRightClick = true,
  blockCopyPaste = true,
} = {}) => {
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceDetectionInterval = useRef(null);
  const fullscreenGraceTimerRef = useRef(null);
  
  // Use a ref for onViolation to prevent stale closures in event listeners
  // without needing to recreate the listeners every time it changes.
  const onViolationRef = useRef(onViolation);
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);
  
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
    if (typeof window === 'undefined') {
      return {
        basic: false,
        faceDetection: false,
        fullscreen: false,
      };
    }
    const basicSupport = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
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
    
    if (onViolationRef.current) {
      onViolationRef.current(violation);
    }
    
    // Show a warning toast
    toast({
      title: 'Proctoring Alert',
      description: message,
      variant: 'destructive',
      duration: 5000,
    });
    
    return violation;
  }, [testId, toast]);

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

  // Tracks whether we've already logged a violation for the current focus-loss event
  const focusLostRef = useRef(false);
  // Tracks whether proctoring is in startup grace period (to ignore transient focus events on init)
  const isStartupGraceRef = useRef(false);
  // Timer for the blur grace period (short blur events like permission dialogs are ignored)
  const blurGraceTimerRef = useRef(null);

  // Handle tab focus changes via the Page Visibility API.
  // This is the PRIMARY source of truth for tab switching.
  const handleVisibilityChange = useCallback(() => {
    if (!enableTabMonitoring) return;
    if (isStartupGraceRef.current) return;

    if (document.hidden) {
      // Cancel any pending blur grace timer since visibility API confirms the tab is hidden
      if (blurGraceTimerRef.current) {
        clearTimeout(blurGraceTimerRef.current);
        blurGraceTimerRef.current = null;
      }

      if (!focusLostRef.current) {
        focusLostRef.current = true;
        setProctoringState(prev => ({
          ...prev,
          tabFocusLost: true,
        }));

        logViolation(
          'TAB_SWITCH_DETECTED',
          'Please return to the test window. Switching tabs is not allowed.'
        );
      }
    } else {
      focusLostRef.current = false;
      setProctoringState(prev => ({
        ...prev,
        tabFocusLost: false,
      }));
    }
  }, [enableTabMonitoring, logViolation]);

  // Handle window blur — used as a secondary signal for switching to another app/window
  // (e.g., Alt+Tab to another app, where the tab stays "visible" but focus is lost).
  // Uses a 500ms grace period to ignore transient blur events (permission dialogs, etc.).
  const handleWindowBlur = useCallback(() => {
    if (!enableTabMonitoring) return;
    if (isStartupGraceRef.current) return;
    // Don't schedule another timer if one is already pending
    if (blurGraceTimerRef.current) return;

    blurGraceTimerRef.current = setTimeout(() => {
      blurGraceTimerRef.current = null;
      // After grace period, only log if the tab is still focused (not hidden).
      // If document.hidden is true, visibilitychange already logged the violation.
      if (!document.hidden && !focusLostRef.current) {
        focusLostRef.current = true;
        setProctoringState(prev => ({
          ...prev,
          tabFocusLost: true,
        }));

        logViolation(
          'TAB_SWITCH_DETECTED',
          'Please return to the test window. Switching to another application is not allowed.'
        );
      }
    }, 500);
  }, [enableTabMonitoring, logViolation]);

  const handleWindowFocus = useCallback(() => {
    if (!enableTabMonitoring) return;

    // Cancel any pending blur grace timer
    if (blurGraceTimerRef.current) {
      clearTimeout(blurGraceTimerRef.current);
      blurGraceTimerRef.current = null;
    }

    focusLostRef.current = false;
    setProctoringState(prev => ({
      ...prev,
      tabFocusLost: false,
    }));
  }, [enableTabMonitoring]);

  // Handle fullscreen changes — uses a 2s grace period to avoid false positives
  // from transient exits (e.g., permission dialogs, screen sharing prompts).
  // Violation is only logged if the user hasn't re-entered fullscreen after the grace period.
  const handleFullscreenChange = useCallback(() => {
    if (!enforceFullscreen) return;
    if (isStartupGraceRef.current) return;

    const currentlyFullscreen = !!(document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement);

    setProctoringState(prev => ({
      ...prev,
      isFullscreen: currentlyFullscreen,
    }));

    if (currentlyFullscreen) {
      // Re-entered fullscreen — cancel any pending grace timer
      if (fullscreenGraceTimerRef.current) {
        clearTimeout(fullscreenGraceTimerRef.current);
        fullscreenGraceTimerRef.current = null;
      }
    } else {
      // Exited fullscreen — start grace period before logging violation
      if (fullscreenGraceTimerRef.current) return; // already counting down

      fullscreenGraceTimerRef.current = setTimeout(() => {
        fullscreenGraceTimerRef.current = null;

        // Check again — user may have re-entered during grace period
        const stillNotFullscreen = !(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        );

        if (stillNotFullscreen) {
          logViolation(
            'FULLSCREEN_EXIT',
            'Please keep the test in fullscreen mode. Exiting fullscreen is not allowed.'
          );
        }
      }, 2000);
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

  // Block copy, paste, and cut
  const handleCopyPaste = useCallback((e) => {
    e.preventDefault();
    logViolation(
      'CLIPBOARD_ACTION_BLOCKED',
      'Copying or pasting is not allowed during the test.'
    );
  }, [logViolation]);

  // Block right-click / context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    logViolation(
      'CONTEXT_MENU_BLOCKED',
      'Right-clicking or opening context menu is not allowed during the test.'
    );
  }, [logViolation]);

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
    
    // If face detection is explicitly enabled but not supported, we can warn,
    // but we should STILL start tab monitoring and fullscreen.
    if (enableFaceDetection && !support.basic) {
      console.warn('Camera proctoring not supported in this browser, but other features will still run.');
    }
    
    // 1. Enter fullscreen IMMEDIATELY as the very first synchronous action in response to user gesture.
    if (enforceFullscreen) {
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

    setProctoringState(prev => ({
      ...prev,
      isActive: true,
      // Immediately sync the real fullscreen state — the fullscreenchange event fired
      // during requestFullscreen() above will be missed because the listener isn't
      // registered yet (it's set up in the useEffect that reacts to isActive becoming true).
      // Without this, isFullscreen stays false and the overlay shows even though we ARE
      // already in fullscreen, making the "Return to Fullscreen" button a no-op.
      isFullscreen: !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement),
    }));

    // Enter startup grace period: ignore focus/blur events during initialization
    // (e.g., fullscreen request, permission dialogs temporarily steal focus)
    isStartupGraceRef.current = true;
    
    // Start media capture and face detection (awaits user camera permission action)
    const stream = await startMediaCapture();
    if (stream) {
      startFaceDetection();
    }

    // Start the settling grace period AFTER camera prompt is resolved and proctoring is fully initialized
    setTimeout(() => {
      isStartupGraceRef.current = false;
    }, 5000); // 5 seconds settling period
    
    return true;
  }, [
    enableFaceDetection,
    enforceFullscreen,
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
    
    // Clear intervals and timers
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
      faceDetectionInterval.current = null;
    }
    if (blurGraceTimerRef.current) {
      clearTimeout(blurGraceTimerRef.current);
      blurGraceTimerRef.current = null;
    }
    if (fullscreenGraceTimerRef.current) {
      clearTimeout(fullscreenGraceTimerRef.current);
      fullscreenGraceTimerRef.current = null;
    }
    isStartupGraceRef.current = false;
    focusLostRef.current = false;
    
    // Exit fullscreen
    const isFullscreen = !!(document.fullscreenElement || 
                          document.webkitFullscreenElement || 
                          document.msFullscreenElement);
    
    if (isFullscreen) {
      try {
        const exitFullscreen = (
          document.exitFullscreen || 
          document.webkitExitFullscreen || 
          document.msExitFullscreen
        );
        
        if (exitFullscreen) {
          const result = exitFullscreen.call(document);
          if (result instanceof Promise) {
            result.catch(err => {
              const message = err?.message || '';
              if (!message.includes('Document not active') && !message.includes('no element')) {
                console.warn('exitFullscreen failed:', err);
              }
            });
          }
        }
      } catch (error) {
        console.debug('Failed to exit fullscreen synchronously:', error);
      }
    }
    
    setProctoringState(prev => ({
      ...prev,
      isActive: false,
      faceDetected: true,
      tabFocusLost: false,
    }));
  }, []);

  // React-compliant Event Listener Management
  useEffect(() => {
    if (!proctoringState.isActive) return;

    // Set up event listeners
    if (enableTabMonitoring) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('focus', handleWindowFocus);
    }
    
    if (enforceFullscreen) {
      // Sync actual fullscreen state at listener-registration time.
      // This is a safety net: if the fullscreenchange event fired before
      // this effect ran (e.g., initial startProctoring race), we catch it here.
      const currentlyFullscreen = !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement);
      setProctoringState(prev => {
        if (prev.isFullscreen !== currentlyFullscreen) {
          return { ...prev, isFullscreen: currentlyFullscreen };
        }
        return prev;
      });

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);
    }
    
    if (blockKeyboardShortcuts) {
      document.addEventListener('keydown', handleKeyDown, true);
    }
    
    if (blockCopyPaste) {
      document.addEventListener('copy', handleCopyPaste);
      document.addEventListener('cut', handleCopyPaste);
      document.addEventListener('paste', handleCopyPaste);
    }
    
    if (blockRightClick) {
      document.addEventListener('contextmenu', handleContextMenu);
    }
    
    return () => {
      // Clean up event listeners
      if (enableTabMonitoring) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
      }
      
      if (enforceFullscreen) {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      }
      
      if (blockKeyboardShortcuts) {
        document.removeEventListener('keydown', handleKeyDown, true);
      }
      
      if (blockCopyPaste) {
        document.removeEventListener('copy', handleCopyPaste);
        document.removeEventListener('cut', handleCopyPaste);
        document.removeEventListener('paste', handleCopyPaste);
      }
      
      if (blockRightClick) {
        document.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [
    proctoringState.isActive,
    enableTabMonitoring,
    enforceFullscreen,
    blockKeyboardShortcuts,
    blockCopyPaste,
    blockRightClick,
    handleVisibilityChange,
    handleWindowBlur,
    handleWindowFocus,
    handleFullscreenChange,
    handleKeyDown,
    handleCopyPaste,
    handleContextMenu,
  ]);

  const stopProctoringRef = useRef(stopProctoring);
  useEffect(() => {
    stopProctoringRef.current = stopProctoring;
  }, [stopProctoring]);

  // Clean up on unmount ONLY
  useEffect(() => {
    return () => {
      if (stopProctoringRef.current) {
        stopProctoringRef.current();
      }
    };
  }, []);

  return {
    ...proctoringState,
    // Explicitly surface isFullscreen so consumers can react without spreading all state
    isFullscreen: proctoringState.isFullscreen,
    videoRef,
    startProctoring,
    stopProctoring,
    isProctoringSupported: isProctoringSupported(),
  };
};
