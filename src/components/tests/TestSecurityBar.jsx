'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Maximize2, Minimize2, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * TestSecurityBar
 *
 * A slim, fixed security status bar shown at the top of the viewport during
 * an active proctored test. Surfaces at-a-glance status for:
 *  - Fullscreen mode (active / lost)
 *  - Monitoring status
 *  - Current violation count
 *
 * @param {boolean} isFullscreen      — Whether the browser is in fullscreen
 * @param {boolean} isTabMonitoring   — Whether tab monitoring is active
 * @param {number}  violationCount    — Number of violations logged so far
 * @param {boolean} isProctoringActive — Whether proctoring is running
 * @param {boolean} isVisible         — Whether to show the bar at all
 */
export function TestSecurityBar({
  isFullscreen = true,
  isTabMonitoring = true,
  violationCount = 0,
  isProctoringActive = false,
  isVisible = false,
}) {
  if (!isVisible || !isProctoringActive) return null;

  const hasViolations = violationCount > 0;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-[9000] h-10',
        'flex items-center justify-between px-4',
        'text-xs font-semibold backdrop-blur-sm select-none',
        isFullscreen
          ? 'bg-slate-900/90 border-b border-slate-700/60'
          : 'bg-red-950/95 border-b border-red-600/80 animate-pulse'
      )}
    >
      {/* Left: Shield + security label */}
      <div className="flex items-center gap-2">
        {isFullscreen ? (
          <Shield className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
        )}
        <span className={isFullscreen ? 'text-slate-300' : 'text-red-300'}>
          Secure Test Mode
        </span>
      </div>

      {/* Center: Status pills */}
      <div className="flex items-center gap-3">
        {/* Fullscreen indicator */}
        <StatusPill
          active={isFullscreen}
          activeIcon={<Maximize2 className="h-3 w-3" />}
          inactiveIcon={<Minimize2 className="h-3 w-3" />}
          activeLabel="Fullscreen"
          inactiveLabel="Not Fullscreen"
          activeClass="bg-green-900/60 text-green-300 border-green-700/50"
          inactiveClass="bg-red-900/70 text-red-300 border-red-600/60"
        />

        {/* Monitoring indicator */}
        {isTabMonitoring && (
          <StatusPill
            active={true}
            activeIcon={<Eye className="h-3 w-3" />}
            activeLabel="Monitored"
            activeClass="bg-blue-900/60 text-blue-300 border-blue-700/50"
          />
        )}
      </div>

      {/* Right: Violation count */}
      <div className="flex items-center gap-1.5">
        {hasViolations && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        )}
        <span className={cn(
          'transition-colors',
          hasViolations ? 'text-amber-300' : 'text-slate-400'
        )}>
          {violationCount === 0
            ? 'No violations'
            : `${violationCount} violation${violationCount !== 1 ? 's' : ''}`}
        </span>
      </div>
    </motion.div>
  );
}

/** Small status pill sub-component */
function StatusPill({
  active,
  activeIcon,
  inactiveIcon,
  activeLabel,
  inactiveLabel,
  activeClass,
  inactiveClass = '',
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active ? 'active' : 'inactive'}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide',
          active ? activeClass : inactiveClass
        )}
      >
        {active ? activeIcon : inactiveIcon}
        <span>{active ? activeLabel : inactiveLabel}</span>
      </motion.div>
    </AnimatePresence>
  );
}
