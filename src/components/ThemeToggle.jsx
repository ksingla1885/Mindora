'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { isHighContrast, toggleHighContrast } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleHighContrast}
      aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      className="relative"
    >
      <Contrast className="h-5 w-5" />
      <span className="sr-only">
        {isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      </span>
    </Button>
  );
}
