import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Message bubble with wing */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Left Angel Wing - Lower feathers */}
          <path
            d="M20 55 Q 8 58, 3 62 Q 6 55, 12 52 Q 10 54, 8 56 Z"
            fill="url(#logoGradient)"
            opacity="0.5"
          />
          <path
            d="M20 48 Q 6 50, 2 54 Q 5 48, 10 46 Q 8 48, 6 50 Z"
            fill="url(#logoGradient)"
            opacity="0.6"
          />
          <path
            d="M20 41 Q 5 42, 1 46 Q 4 41, 9 39 Q 7 41, 5 43 Z"
            fill="url(#logoGradient)"
            opacity="0.7"
          />
          <path
            d="M20 34 Q 6 34, 2 38 Q 5 34, 10 32 Q 8 34, 6 36 Z"
            fill="url(#logoGradient)"
            opacity="0.8"
          />

          {/* Message Bubble */}
          <path
            d="M20 30 C20 20, 30 15, 45 15 L70 15 C80 15, 85 20, 85 30 L85 55 C85 65, 80 70, 70 70 L50 70 L35 85 L35 70 L30 70 C20 70, 20 65, 20 55 Z"
            fill="url(#logoGradient)"
            filter="url(#glow)"
          />
          
          {/* Right Angel Wing - Lower feathers */}
          <path
            d="M85 55 Q 92 58, 97 62 Q 94 55, 88 52 Q 90 54, 92 56 Z"
            fill="url(#logoGradient)"
            opacity="0.5"
          />
          <path
            d="M85 48 Q 94 50, 98 54 Q 95 48, 90 46 Q 92 48, 94 50 Z"
            fill="url(#logoGradient)"
            opacity="0.6"
          />
          <path
            d="M85 41 Q 95 42, 99 46 Q 96 41, 91 39 Q 93 41, 95 43 Z"
            fill="url(#logoGradient)"
            opacity="0.7"
          />
          <path
            d="M85 34 Q 94 34, 98 38 Q 95 34, 90 32 Q 92 34, 94 36 Z"
            fill="url(#logoGradient)"
            opacity="0.8"
          />
          <path
            d="M85 27 Q 96 26, 99 30 Q 96 27, 91 25 Q 93 27, 95 29 Z"
            fill="url(#logoGradient)"
            opacity="0.9"
          />
          
          {/* Sparkle dots inside bubble */}
          <circle cx="40" cy="38" r="3" fill="white" opacity="0.9" />
          <circle cx="52" cy="38" r="3" fill="white" opacity="0.9" />
          <circle cx="64" cy="38" r="3" fill="white" opacity="0.9" />
          
          {/* Small sparkle accents */}
          <circle cx="25" cy="25" r="2" fill="#EC4899" opacity="0.6" />
          <circle cx="78" cy="22" r="2" fill="#EC4899" opacity="0.6" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold tracking-tight bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent`}>
            Text Wingman
          </span>
        </div>
      )}
    </div>
  );
}
