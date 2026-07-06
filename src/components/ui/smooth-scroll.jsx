"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    // Only enable smooth scrolling (Lenis) on the landing page.
    // Dashboard and app pages use layout containers (h-screen overflow-hidden) with nested overflow-y-auto,
    // which Lenis breaks by hijacking global wheel events.
    if (pathname !== "/") {
      return;
    }

    // Only initialize on client
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easeOutExpo
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
      infinite: false,
    });

    // Hook into requestAnimationFrame for scroll update
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Expose lenis instance globally for testing or sub-components
    window.lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.lenis = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
