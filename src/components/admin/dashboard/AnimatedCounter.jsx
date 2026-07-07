'use client';

import { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 800 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Parse target number from value if it's passed as a string with symbols, or use directly
    const target = typeof value === 'number' 
      ? value 
      : parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;

    if (target === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad formula
      const easeProgress = progress * (2 - progress);
      const currentCount = start + easeProgress * (target - start);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  // Format the output
  const formatNumber = (num) => {
    if (Number.isInteger(num)) {
      return num.toLocaleString();
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  };

  return (
    <span>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
