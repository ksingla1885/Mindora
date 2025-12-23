import React, { forwardRef } from 'react';
import { useAriaButton } from 'react-aria';
import { mergeProps } from '@react-aria/utils';
import { useButton } from '@react-aria/button';
import { useHover, useFocusRing } from 'react-aria';
import { useRef } from 'react';
import { Spinner } from './Spinner';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const AccessibleButton = forwardRef(({
  children,
  className,
  variant = 'default',
  size = 'default',
  isLoading = false,
  isDisabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  'aria-label': ariaLabel,
  'aria-live': ariaLive = 'polite',
  'aria-busy': ariaBusy = false,
  onPress,
  onPressStart,
  onPressEnd,
  onKeyDown,
  onKeyUp,
  ...props
}, ref) => {
  const buttonRef = useRef(ref);
  const { buttonProps, isPressed } = useButton({
    ...props,
    isDisabled: isDisabled || isLoading,
    elementType: 'button',
    onPress,
    onPressStart,
    onPressEnd,
    onKeyDown,
    onKeyUp,
  }, buttonRef);
  
  const { hoverProps, isHovered } = useHover({ isDisabled: isDisabled || isLoading });
  const { isFocusVisible, focusProps } = useFocusRing();
  const { buttonProps: ariaButtonProps } = useAriaButton({
    ...props,
    isDisabled: isDisabled || isLoading,
    elementType: 'button',
    onPress,
  }, buttonRef);

  // Merge all the props
  const mergedProps = mergeProps(
    buttonProps,
    hoverProps,
    focusProps,
    ariaButtonProps,
    {
      className: cn(
        buttonVariants({ variant, size, className }),
        isPressed && 'scale-95',
        isHovered && 'opacity-90',
        isFocusVisible && 'ring-2 ring-offset-2 ring-primary',
        (isDisabled || isLoading) && 'opacity-50 cursor-not-allowed'
      ),
      'aria-label': ariaLabel || (typeof children === 'string' ? children : undefined),
      'aria-live': ariaLive,
      'aria-busy': ariaBusy || isLoading,
      disabled: isDisabled || isLoading,
    }
  );

  return (
    <button
      ref={buttonRef}
      {...mergedProps}
    >
      {isLoading && (
        <span className="mr-2">
          <Spinner size="sm" />
        </span>
      )}
      {LeftIcon && !isLoading && <LeftIcon className="mr-2 h-4 w-4" aria-hidden="true" />}
      {children}
      {RightIcon && <RightIcon className="ml-2 h-4 w-4" aria-hidden="true" />}
      
      {/* Screen reader only text for loading state */}
      {isLoading && (
        <span className="sr-only" role="status">
          Loading...
        </span>
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton };
