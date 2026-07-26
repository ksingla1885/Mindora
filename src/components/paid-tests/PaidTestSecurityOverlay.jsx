'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

/**
 * TestSecurityOverlay
 *
 * A full-screen blocking overlay shown whenever the candidate exits fullscreen
 * during an active test. The re-entry request is triggered by the button click
 * (a genuine user gesture), which is required by browsers to grant fullscreen.
 *
 * @param {boolean}  isVisible    — Whether the overlay should be shown
 * @param {number}   warningCount — Current violation count to display
 */
export function PaidTestSecurityOverlay({ isVisible, warningCount = 0 }) {
  const [isPending, setIsPending] = useState(false);

  // Direct native click handler — called synchronously from the button's onclick.
  // Must NOT be wrapped in useCallback or any async indirection before calling
  // requestFullscreen(), since browsers require the call to originate directly
  // from a user gesture (synchronous call stack from the click event).
  const handleReturnClick = () => {
    if (isPending) return;

    const el = document.documentElement;
    try {
      let promise;
      if (el.requestFullscreen) {
        promise = el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        promise = el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        promise = el.msRequestFullscreen();
      } else {
        console.error('Fullscreen API not available in this browser');
        return;
      }

      // Set pending state AFTER initiating request to ensure zero user-gesture delay
      setIsPending(true);

      if (promise instanceof Promise) {
        promise
          .catch((err) => {
            console.error('Fullscreen re-entry failed:', err);
          })
          .finally(() => {
            setTimeout(() => setIsPending(false), 1500);
          });
      } else {
        // If the browser did not return a promise, reset pending state after a short delay
        setTimeout(() => setIsPending(false), 1000);
      }
    } catch (err) {
      console.error('Fullscreen re-entry failed synchronously:', err);
      setIsPending(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="security-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // z-[9998] — above everything except the disqualification overlay (z-[9999])
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          {/* Pulsing border ring for urgency */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="absolute inset-4 rounded-2xl border-4 border-red-500/60 pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg mx-4 bg-slate-950 border-2 border-red-500 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Top accent stripe */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

            <div className="flex flex-col items-center text-center p-8 space-y-6">
              {/* Icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
              >
                <ShieldAlert className="h-12 w-12 text-red-400" />
              </motion.div>

              {/* Heading */}
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Fullscreen Required
                </h2>
                <p className="text-slate-300 text-base leading-relaxed max-w-sm">
                  You exited fullscreen mode. The test must run in fullscreen.
                  Please click the button below to continue.
                </p>
              </div>

              {/* Violation badge */}
              {warningCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-900/40 border border-amber-500/50 rounded-xl px-4 py-3 w-full justify-center">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-amber-300 text-sm font-semibold">
                    {warningCount} security violation{warningCount !== 1 ? 's' : ''} recorded
                  </span>
                </div>
              )}

              {/* CTA — using a native <button> to guarantee the click event is
                  treated as a direct user gesture by the browser's fullscreen API */}
              <button
                id="return-fullscreen-btn"
                type="button"
                onClick={handleReturnClick}
                disabled={isPending}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  fontSize: '1.125rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  background: isPending
                    ? 'linear-gradient(to right, #9b1c1c, #991b1b)'
                    : 'linear-gradient(to right, #dc2626, #ef4444)',
                  color: '#fff',
                  border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 20px 40px rgba(220,38,38,0.4)',
                  transition: 'transform 0.15s ease, opacity 0.15s ease',
                  opacity: isPending ? 0.75 : 1,
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 style={{ height: '20px', width: '20px' }} className="animate-spin" />
                    Entering Fullscreen...
                  </>
                ) : (
                  <>
                    <Maximize2 style={{ height: '20px', width: '20px' }} />
                    Return to Fullscreen
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500">
                This event has been recorded. Repeated violations may result in disqualification.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
