import React from 'react';
import { Send } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const MARK = {
  sm: { tile: 'h-8 w-8 rounded-[10px]', icon: 17, text: 'text-lg' },
  md: { tile: 'h-10 w-10 rounded-xl', icon: 21, text: 'text-2xl' },
  lg: { tile: 'h-14 w-14 rounded-2xl', icon: 29, text: 'text-3xl' },
  xl: { tile: 'h-20 w-20 rounded-3xl', icon: 42, text: 'text-5xl' },
} as const;

/** The Text Wingman mark: the same tilted lime tile and wordmark as the homepage header. */
export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const mark = MARK[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`${mark.tile} grid shrink-0 -rotate-[11deg] place-items-center bg-brand text-brand-ink`} aria-hidden={showText}>
        <Send size={mark.icon} strokeWidth={2.4} className="rotate-[11deg]" />
      </span>
      {showText ? (
        <span className={`${mark.text} whitespace-nowrap font-medium tracking-[-0.06em] text-cream`}>
          text<strong className="font-black text-brand">wingman</strong>
        </span>
      ) : (
        <span className="sr-only">Text Wingman</span>
      )}
    </div>
  );
}
