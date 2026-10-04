import { useCallback, useRef } from 'react';

/** Minimum horizontal travel (px) for a gesture to count as a swipe. */
const SWIPE_MIN_DISTANCE = 50;
/** Horizontal travel must dominate vertical travel by this factor, so vertical scrolling isn't a swipe. */
const SWIPE_DIRECTION_RATIO = 1.5;

/**
 * Horizontal touch swipe detection. Returns handlers to spread on the swipeable element.
 * A click that ends a swipe gesture is swallowed, so swiping across a picture doesn't vote.
 */
export default function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const startRef = useRef(null);
  const swipedRef = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) {
      startRef.current = null;
      return;
    }
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    swipedRef.current = false;
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTION_RATIO) return;

      swipedRef.current = true;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [onSwipeLeft, onSwipeRight]
  );

  const onTouchCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  const onClickCapture = useCallback((e) => {
    if (!swipedRef.current) return;
    swipedRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return { onTouchStart, onTouchEnd, onTouchCancel, onClickCapture };
}
