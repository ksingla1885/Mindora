import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Event types
export const EVENT_TYPES = {
  PAGE_VIEW: 'PAGE_VIEW',
  CONTENT_VIEW: 'CONTENT_VIEW',
  TEST_START: 'TEST_START',
  TEST_COMPLETE: 'TEST_COMPLETE',
  QUESTION_ATTEMPT: 'QUESTION_ATTEMPT',
  CONTENT_COMPLETE: 'CONTENT_COMPLETE',
  SEARCH: 'SEARCH',
  DOWNLOAD: 'DOWNLOAD',
  LOGIN: 'LOGIN',
  SIGNUP: 'SIGNUP',
  PAYMENT: 'PAYMENT',
  ERROR: 'ERROR',
};

const useAnalytics = () => {
  const { data: session } = useSession();

  // Track a custom event
  const trackEvent = useCallback(
    async (eventType, metadata = {}) => {
      try {
        const userId = session?.user?.id;
        const payload = {
          eventType,
          metadata: {
            ...metadata,
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            timestamp: new Date().toISOString(),
          },
        };

        if (userId) {
          payload.userId = userId;
        }

        // Send event to the server
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error('Failed to track event:', await response.text());
        }
      } catch (error) {
        console.error('Error tracking event:', error);
      }
    },
    [session]
  );

  // Track page views
  const trackPageView = useCallback(
    (pageTitle, additionalData = {}) => {
      trackEvent(EVENT_TYPES.PAGE_VIEW, {
        pageTitle,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track content views
  const trackContentView = useCallback(
    (contentId, contentType, title, additionalData = {}) => {
      trackEvent(EVENT_TYPES.CONTENT_VIEW, {
        contentId,
        contentType,
        title,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track test attempts
  const trackTestAttempt = useCallback(
    (testId, score, totalQuestions, additionalData = {}) => {
      trackEvent(EVENT_TYPES.TEST_COMPLETE, {
        testId,
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track question attempts
  const trackQuestionAttempt = useCallback(
    (questionId, isCorrect, timeSpent, topic, difficulty, additionalData = {}) => {
      trackEvent(EVENT_TYPES.QUESTION_ATTEMPT, {
        questionId,
        isCorrect,
        timeSpent,
        topic,
        difficulty,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track content completion
  const trackContentComplete = useCallback(
    (contentId, contentType, timeSpent, additionalData = {}) => {
      trackEvent(EVENT_TYPES.CONTENT_COMPLETE, {
        contentId,
        contentType,
        timeSpent,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track search queries
  const trackSearch = useCallback(
    (query, resultCount, additionalData = {}) => {
      trackEvent(EVENT_TYPES.SEARCH, {
        query,
        resultCount,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track errors
  const trackError = useCallback(
    (error, context = {}, additionalData = {}) => {
      trackEvent(EVENT_TYPES.ERROR, {
        error: error?.message || String(error),
        stack: error?.stack,
        context,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track download events
  const trackDownload = useCallback(
    (fileId, fileName, fileType, additionalData = {}) => {
      trackEvent(EVENT_TYPES.DOWNLOAD, {
        fileId,
        fileName,
        fileType,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track payment events
  const trackPayment = useCallback(
    (amount, currency, productId, productType, additionalData = {}) => {
      trackEvent(EVENT_TYPES.PAYMENT, {
        amount,
        currency,
        productId,
        productType,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  // Track login/signup events
  const trackAuth = useCallback(
    (eventType, method, additionalData = {}) => {
      if (![EVENT_TYPES.LOGIN, EVENT_TYPES.SIGNUP].includes(eventType)) {
        console.error('Invalid auth event type:', eventType);
        return;
      }

      trackEvent(eventType, {
        method,
        ...additionalData,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackContentView,
    trackTestAttempt,
    trackQuestionAttempt,
    trackContentComplete,
    trackSearch,
    trackError,
    trackDownload,
    trackPayment,
    trackAuth,
    EVENT_TYPES,
  };
};

export default useAnalytics;
