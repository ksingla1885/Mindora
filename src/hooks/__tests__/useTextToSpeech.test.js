import { renderHook, act } from '@testing-library/react-hooks';
import { useTextToSpeech } from '../useTextToSpeech';

// Mock the Web Speech API
global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  voice: null,
  pitch: 1,
  rate: 1,
  volume: 1,
  onboundary: null,
  onend: null,
  onerror: null,
  onmark: null,
  onpause: null,
  onresume: null,
  onstart: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

const mockVoices = [
  { voiceURI: 'English', lang: 'en-US', name: 'English', default: true },
  { voiceURI: 'Spanish', lang: 'es-ES', name: 'Spanish' },
];

describe('useTextToSpeech', () => {
  let mockSpeechSynthesis;
  let originalSpeechSynthesis;
  let originalSpeechSynthesisUtterance;
  
  beforeEach(() => {
    // Store original implementations
    originalSpeechSynthesis = window.speechSynthesis;
    originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
    
    // Create fresh mocks for each test
    mockSpeechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn(),
      onvoiceschanged: null,
    };
    
    // Mock the getVoices implementation
    mockSpeechSynthesis.getVoices.mockReturnValue([...mockVoices]);
    
    // Override the global speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
    });
    
    // Reset all mocks before each test
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original implementations
    window.speechSynthesis = originalSpeechSynthesis;
    window.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });
  
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.voices).toEqual(mockVoices);
    expect(result.current.voice).toEqual(mockVoices[0]); // Should default to first voice
    expect(result.current.pitch).toBe(1);
    expect(result.current.rate).toBe(1);
    expect(result.current.volume).toBe(1);
  });
  
  it('should load voices when mounted', () => {
    renderHook(() => useTextToSpeech());
    
    expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
  });
  
  it('should handle voiceschanged event', () => {
    const newVoices = [...mockVoices, { lang: 'fr-FR', name: 'French' }];
    
    // Initial render with empty voices
    mockSpeechSynthesis.getVoices.mockReturnValueOnce([]);
    
    const { result } = renderHook(() => useTextToSpeech());
    
    // Simulate voiceschanged event
    mockSpeechSynthesis.getVoices.mockReturnValueOnce(newVoices);
    act(() => {
      mockSpeechSynthesis.onvoiceschanged();
    });
    
    expect(result.current.voices).toEqual(newVoices);
  });
  
  it('should handle speak functionality', () => {
    const { result } = renderHook(() => useTextToSpeech());
    const testText = 'Hello, world!';
    
    act(() => {
      result.current.speak(testText);
    });
    
    // Should create a new utterance
    expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith(testText);
    
    // Should call speak on the speechSynthesis
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    
    // Get the created utterance
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    
    // Simulate speech start
    act(() => {
      utterance.onstart();
    });
    
    expect(result.current.isSpeaking).toBe(true);
    
    // Simulate speech end
    act(() => {
      utterance.onend();
    });
    
    expect(result.current.isSpeaking).toBe(false);
  });
  
  it('should handle pause and resume', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    // Start speaking
    act(() => {
      result.current.speak('Test');
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      utterance.onstart();
    });
    
    // Pause
    act(() => {
      result.current.pause();
    });
    
    expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);
    
    // Resume
    act(() => {
      result.current.resume();
    });
    
    expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(false);
  });
  
  it('should handle stop', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    // Start speaking
    act(() => {
      result.current.speak('Test');
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      utterance.onstart();
    });
    
    // Stop
    act(() => {
      result.current.stop();
    });
    
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });
  
  it('should handle error during speech', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useTextToSpeech());
    
    // Start speaking
    act(() => {
      result.current.speak('Test');
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      utterance.onstart();
      
      // Simulate error
      utterance.onerror({ error: 'test error' });
    });
    
    expect(consoleError).toHaveBeenCalledWith('SpeechSynthesis error:', { error: 'test error' });
    expect(result.current.isSpeaking).toBe(false);
    
    consoleError.mockRestore();
  });
  
  it('should handle voice change', () => {
    const { result } = renderHook(() => useTextToSpeech());
    const newVoice = mockVoices[1];
    
    act(() => {
      result.current.setVoice(newVoice);
    });
    
    expect(result.current.voice).toBe(newVoice);
  });
  
  it('should handle pitch, rate, and volume changes', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.setPitch(1.5);
      result.current.setRate(1.2);
      result.current.setVolume(0.8);
    });
    
    expect(result.current.pitch).toBe(1.5);
    expect(result.current.rate).toBe(1.2);
    expect(result.current.volume).toBe(0.8);
  });
  
  it('should clean up on unmount', () => {
    const { result, unmount } = renderHook(() => useTextToSpeech());
    
    // Start speaking
    act(() => {
      result.current.speak('Test');
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      utterance.onstart();
    });
    
    // Unmount the component
    unmount();
    
    // Should cancel any ongoing speech
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });
  
  it('should handle unsupported browsers', () => {
    // Simulate browser without speech synthesis
    const originalSpeechSynthesis = window.speechSynthesis;
    delete window.speechSynthesis;
    
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useTextToSpeech());
    
    // Should handle speak gracefully
    act(() => {
      result.current.speak('Test');
      result.current.pause();
      result.current.resume();
      result.current.stop();
    });
    
    expect(consoleWarn).toHaveBeenCalledWith('Speech synthesis not supported in this browser');
    
    // Restore
    window.speechSynthesis = originalSpeechSynthesis;
    consoleWarn.mockRestore();
  });
  
  it('should handle empty text', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.speak('');
    });
    
    // Should not throw errors with empty text
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
  });
  
  it('should handle toggle speaking', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    // First call should start speaking
    act(() => {
      result.current.toggleSpeaking('Test');
    });
    
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    
    // Simulate speech start
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    act(() => {
      utterance.onstart();
    });
    
    // Second call should stop speaking
    act(() => {
      result.current.toggleSpeaking('Test');
    });
    
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  afterAll(() => {
    // Restore original globals
    window.speechSynthesis = originalSpeechSynthesis;
    window.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useTextToSpeech());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.voices).toHaveLength(2);
    expect(result.current.selectedVoice).toBeNull();
    expect(result.current.pitch).toBe(1);
    expect(result.current.rate).toBe(1);
    expect(result.current.volume).toBe(1);
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.resume).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.setPitch).toBe('function');
    expect(typeof result.current.setRate).toBe('function');
    expect(typeof result.current.setVolume).toBe('function');
    expect(typeof result.current.setVoice).toBe('function');
  });

  it('calls speechSynthesis.speak with correct parameters', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.speak('Test text');
    });

    // Verify SpeechSynthesisUtterance was created with correct text
    expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('Test text');
    
    // Verify speak was called with the utterance
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe('Test text');
    expect(utterance.pitch).toBe(1);
    expect(utterance.rate).toBe(1);
    expect(utterance.volume).toBe(1);
  });

  it('updates isSpeaking state when speech starts and ends', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.speak('Test text');
      // Simulate speech start
      const utterance = mockSpeak.mock.calls[0][0];
      utterance.onstart();
    });
    
    expect(result.current.isSpeaking).toBe(true);
    
    act(() => {
      // Simulate speech end
      const utterance = mockSpeak.mock.calls[0][0];
      utterance.onend();
    });
    
    expect(result.current.isSpeaking).toBe(false);
  });

  it('handles pausing and resuming speech', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    // Start speaking
    act(() => {
      result.current.speak('Test text');
      const utterance = mockSpeak.mock.calls[0][0];
      utterance.onstart();
    });
    
    // Pause
    act(() => {
      result.current.pause();
    });
    
    expect(mockPause).toHaveBeenCalledTimes(1);
    expect(result.current.isPaused).toBe(true);
    
    // Resume
    act(() => {
      result.current.resume();
    });
    
    expect(mockResume).toHaveBeenCalledTimes(1);
    expect(result.current.isPaused).toBe(false);
  });

  it('stops speech and resets state', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    // Start speaking
    act(() => {
      result.current.speak('Test text');
      const utterance = mockSpeak.mock.calls[0][0];
      utterance.onstart();
    });
    
    // Stop
    act(() => {
      result.current.stop();
    });
    
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('updates voice settings', () => {
    const { result } = renderHook(() => useTextToSpeech());
    const testVoice = { lang: 'es-ES', name: 'Spanish' };
    
    act(() => {
      result.current.setVoice(testVoice);
      result.current.setPitch(1.5);
      result.current.setRate(1.2);
      result.current.setVolume(0.8);
    });
    
    expect(result.current.selectedVoice).toEqual(testVoice);
    expect(result.current.pitch).toBe(1.5);
    expect(result.current.rate).toBe(1.2);
    expect(result.current.volume).toBe(0.8);
    
    // Verify settings are used when speaking
    act(() => {
      result.current.speak('Test text');
    });
    
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.voice).toBe(testVoice);
    expect(utterance.pitch).toBe(1.5);
    expect(utterance.rate).toBe(1.2);
    expect(utterance.volume).toBe(0.8);
  });

  it('handles errors during speech', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.speak('Test text');
      const utterance = mockSpeak.mock.calls[0][0];
      utterance.onerror('Test error');
    });
    
    expect(consoleError).toHaveBeenCalledWith('Error during speech synthesis:', 'Test error');
    expect(result.current.isSpeaking).toBe(false);
    
    consoleError.mockRestore();
  });

  it('cleans up event listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useTextToSpeech());
    
    // Start speaking to set up event listeners
    act(() => {
      result.current.speak('Test text');
    });
    
    const utterance = mockSpeak.mock.calls[0][0];
    const originalRemoveEventListener = utterance.removeEventListener;
    
    // Spy on removeEventListener
    utterance.removeEventListener = jest.fn(originalRemoveEventListener);
    
    // Unmount the component
    unmount();
    
    // Verify cleanup
    expect(utterance.removeEventListener).toHaveBeenCalledTimes(3);
    expect(utterance.removeEventListener).toHaveBeenCalledWith('end', expect.any(Function));
    expect(utterance.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    expect(utterance.removeEventListener).toHaveBeenCalledWith('boundary', expect.any(Function));
    
    // Verify cancel was called
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('handles voice changes during speech', () => {
    const { result } = renderHook(() => useTextToSpeech());
    const newVoice = { lang: 'es-ES', name: 'Spanish' };
    
    // Start speaking
    act(() => {
      result.current.speak('Test text');
      const utterance = mockSpeak.mock.calls[0][0];
      utterance.onstart();
    });
    
    // Change voice while speaking
    act(() => {
      result.current.setVoice(newVoice);
    });
    
    // The new voice should be set, but the current speech continues with old voice
    expect(result.current.selectedVoice).toEqual(newVoice);
    
    // The next speech should use the new voice
    act(() => {
      result.current.speak('New text');
    });
    
    const newUtterance = mockSpeak.mock.calls[1][0];
    expect(newUtterance.voice).toBe(newVoice);
  });

  it('handles empty text input', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.speak('');
    });
    
    // No utterance should be created for empty text
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('handles missing speech synthesis support', () => {
    // Temporarily remove speechSynthesis for this test
    const originalSpeechSynthesis = window.speechSynthesis;
    delete window.speechSynthesis;
    
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useTextToSpeech());
    
    // Should handle missing speechSynthesis gracefully
    act(() => {
      result.current.speak('Test text');
      result.current.pause();
      result.current.resume();
      result.current.stop();
    });
    
    expect(consoleWarn).toHaveBeenCalledWith('This browser does not support speech synthesis.');
    
    // Restore speechSynthesis
    window.speechSynthesis = originalSpeechSynthesis;
    consoleWarn.mockRestore();
  });
});
