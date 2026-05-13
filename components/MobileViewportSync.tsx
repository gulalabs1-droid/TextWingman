'use client';

import { useEffect } from 'react';

/**
 * Sets two CSS variables that mobile layouts can rely on:
 *   --vh         → 1% of the visual viewport height (more reliable than 100vh on iOS Safari)
 *   --kb-inset   → height (px) currently obscured by the on-screen keyboard
 *
 * Tracks `window.visualViewport` so the coach footer / chat threads can grow
 * and shrink correctly when the iOS keyboard opens. Capacitor's Keyboard
 * plugin can also dispatch keyboardWillShow/keyboardWillHide events; we
 * read the same prop set and stay compatible.
 *
 * Renders nothing.
 */
export default function MobileViewportSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const vv = window.visualViewport;

    const update = () => {
      const h = vv ? vv.height : window.innerHeight;
      root.style.setProperty('--vh', `${h * 0.01}px`);
      const kb = Math.max(0, window.innerHeight - h - (vv?.offsetTop || 0));
      root.style.setProperty('--kb-inset', `${kb}px`);
      // Tag <html> so CSS can react to keyboard-open state without JS reflow per consumer
      if (kb > 80) root.setAttribute('data-keyboard', 'open');
      else root.removeAttribute('data-keyboard');
    };

    update();

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('orientationchange', update);
    window.addEventListener('resize', update);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return null;
}
