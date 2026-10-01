import { useEffect, useRef } from 'preact/hooks';
import Lenis from 'lenis';

/**
 * useLenisScroll
 * Attaches Lenis smooth scrolling ONLY when:
 *   1. currentView is 'home' or 'newhome' (homepage only — never on other pages)
 *   2. The pointer device is "fine" (mouse / trackpad, NOT touch)
 *   3. The viewport is at least 1024px wide
 *
 * On mobile/touch or any non-homepage view, no Lenis instance is created and
 * the native scroll physics are left completely untouched.
 */
export function useLenisScroll(currentView) {
  const lenisRef = useRef(null);
  const rafRef = useRef(null);

  const isHomepage = currentView === 'home' || currentView === 'newhome';

  useEffect(() => {
    // Only activate on homepage
    if (!isHomepage) return;

    // Only activate on desktop (fine pointer = mouse/trackpad, not touch)
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isTooNarrow = window.innerWidth < 1024;
    if (isTouch || isTooNarrow) return;

    // Create Lenis instance
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false, // Never hijack native touch physics
      wheelMultiplier: 1.0,
    });

    lenisRef.current = lenis;

    // Drive Lenis via rAF loop
    function raf(time) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    // Cleanup: destroy Lenis and cancel rAF when view changes or component unmounts
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
  }, [isHomepage]);

  return lenisRef;
}
