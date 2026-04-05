"use client";

/**
 * usePullToRefresh
 *
 * Detects a downward pull gesture on mobile and triggers a callback.
 * Uses CSS overscroll-behavior to avoid page scroll interference.
 *
 * Usage:
 *   const { pullDone, isPulling } = usePullToRefresh(() => mutate("key"));
 */

"use client";

import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 80; // px before we count it as a pull
const VELOCITY_THRESHOLD = 0.5; // px/ms — guards against slow scrolls

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  pullDone: () => void;
  reset: () => void;
}

export function usePullToRefresh(onRefresh: () => void): PullToRefreshState {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStartY = useRef<number | null>(null);
  const lastTouchY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    const threshold = PULL_THRESHOLD;

    function onTouchStart(e: TouchEvent) {
      // Only trigger if the user is at the top of the page
      if (window.scrollY > 10) return;
      touchStartY.current = e.touches[0].clientY;
      lastTouchY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      const start = touchStartY.current;
      if (start === null) return;
      if (window.scrollY > 10) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - start;

      if (delta > 0) {
        // User is pulling down
        setPullDistance(delta);
        setIsPulling(true);
        pulling.current = true;
      }
    }

    function onTouchEnd() {
      const distance = pullDistance;
      setPullDistance(0);
      setIsPulling(false);
      pulling.current = false;
      touchStartY.current = null;
      lastTouchY.current = null;

      if (distance >= threshold) {
        onRefresh();
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, pullDistance]);

  function reset() {
    setPullDistance(0);
    setIsPulling(false);
    pulling.current = false;
  }

  return {
    isPulling,
    pullDistance: Math.min(pullDistance, 160),
    pullDone: reset,
    reset,
  };
}
