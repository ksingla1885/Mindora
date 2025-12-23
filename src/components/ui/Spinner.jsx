import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  'animate-spin text-current',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
      variant: {
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
);

const Spinner = ({ 
  className, 
  size = 'md', 
  variant = 'primary',
  'aria-label': ariaLabel = 'Loading...',
  ...props 
}) => {
  return (
    <span 
      role="status" 
      aria-live="polite"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <svg
        className={cn(spinnerVariants({ size, variant }))}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{ariaLabel}</span>
    </span>
  );
};

export { Spinner };
