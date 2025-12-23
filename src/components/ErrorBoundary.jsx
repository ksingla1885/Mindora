'use client';

import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({ 
  error, 
  resetErrorBoundary,
  fallback = null,
  className = ''
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error);
  }, [error]);

  // If a custom fallback is provided, render it
  if (fallback) {
    return fallback;
  }

  return (
    <div className={`p-4 ${className}`}>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>We encountered an error while loading this content. Please try again.</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetErrorBoundary}
            >
              Try again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 p-2 text-xs bg-red-50 rounded border border-red-100">
              <summary className="cursor-pointer font-medium text-red-700">Error details</summary>
              <pre className="mt-2 text-red-600 overflow-auto max-h-40">
                {error.message}\n{error.stack}
              </pre>
            </details>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Higher Order Component for error boundaries
export function withErrorBoundary(Component, FallbackComponent = null) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary
        fallback={FallbackComponent}
        onError={(error, errorInfo) => {
          // You can log errors to an error reporting service here
          console.error('Error caught by error boundary:', error, errorInfo);
        }}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
