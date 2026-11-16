'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';

/**
 * Full-screen viewer for uploaded screenshots. Opens fitted to the screen;
 * tapping the image switches to full width so a long thread is readable and
 * scrollable. Arrow keys and the side buttons move between screenshots.
 */
export function ScreenshotViewer({ images, index, onIndexChange, onClose }: {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = images.length;
  const current = Math.min(Math.max(index, 0), count - 1);

  const go = useCallback((step: number) => {
    if (count < 2) return;
    setZoomed(false);
    onIndexChange((current + step + count) % count);
  }, [count, current, onIndexChange]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [current, zoomed]);

  if (count === 0) return null;
  const controlClass = 'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/90 backdrop-blur transition-colors hover:bg-black/80 active:scale-95';

  // Rendered on <body> so a transformed or blurred ancestor cannot trap the overlay.
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-label="Screenshot preview">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="text-sm font-semibold text-white/70" aria-live="polite">
          {count > 1 ? `Screenshot ${current + 1} of ${count}` : 'Screenshot'}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoomed(value => !value)} aria-label={zoomed ? 'Fit to screen' : 'Show full size'} className={controlClass}>
            {zoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button ref={closeRef} onClick={onClose} aria-label="Close preview" className={controlClass}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        className={`relative min-h-0 flex-1 overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${zoomed ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden'}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, nothing for the image optimizer to do */}
        <img
          src={images[current]}
          alt={count > 1 ? `Screenshot ${current + 1} of ${count}` : 'Uploaded screenshot'}
          onClick={() => setZoomed(value => !value)}
          draggable={false}
          className={`rounded-xl ${zoomed ? 'mx-auto h-auto w-[200%] max-w-none cursor-zoom-out sm:w-full sm:max-w-3xl' : 'max-h-full max-w-full cursor-zoom-in object-contain'}`}
        />
      </div>

      {count > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous screenshot" className={`absolute left-3 top-1/2 -translate-y-1/2 ${controlClass}`}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Next screenshot" className={`absolute right-3 top-1/2 -translate-y-1/2 ${controlClass}`}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
