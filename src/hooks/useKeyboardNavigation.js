import { useEffect, useCallback } from 'react';

export function useKeyboardNavigation({
  onNext,
  onPrevious,
  onSubmit,
  onSkip,
  canGoNext = true,
  canGoPrevious = true,
  canSubmit = true,
  canSkip = true,
  activeElementId = null,
}) {
  const handleKeyDown = useCallback((event) => {
    // Don't trigger navigation if the user is typing in an input or textarea
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.isContentEditable
    ) {
      return;
    }

    // Handle keyboard shortcuts
    switch (event.key) {
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (canGoNext) {
          event.preventDefault();
          onNext?.();
        }
        break;

      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (canGoPrevious) {
          event.preventDefault();
          onPrevious?.();
        }
        break;

      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          if (canSubmit) {
            event.preventDefault();
            onSubmit?.();
          }
        }
        break;

      case 's':
      case 'S':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (canSkip) {
            onSkip?.();
          }
        }
        break;

      // Number keys 1-9 for selecting options
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        if (activeElementId) {
          const optionIndex = parseInt(event.key) - 1;
          const optionElement = document.getElementById(`${activeElementId}-${optionIndex}`);
          if (optionElement) {
            event.preventDefault();
            optionElement.click();
          }
        }
        break;

      default:
        break;
    }
  }, [onNext, onPrevious, onSubmit, onSkip, canGoNext, canGoPrevious, canSubmit, canSkip, activeElementId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Expose a function to programmatically focus on the first interactive element
  const focusFirstInteractiveElement = useCallback(() => {
    if (activeElementId) {
      const firstOption = document.getElementById(`${activeElementId}-0`);
      if (firstOption) {
        firstOption.focus();
        return true;
      }
    }
    return false;
  }, [activeElementId]);

  return { focusFirstInteractiveElement };
}
