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
          
          {/* Left Angel Wing - Classic angelic design */}
          <g opacity="0.9" filter="url(#glow)">
            {/* Main wing shape */}
            <path
              d="M18 42 Q 8 40, 2 45 Q 1 38, 8 32 Q 2 35, 1 40 L 18 42 Z"
              fill="white"
              opacity="0.95"
            />
            {/* Secondary feathers */}
            <path
              d="M18 48 Q 10 48, 4 52 Q 3 46, 10 43 Q 6 47, 4 50 L 18 48 Z"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M18 54 Q 12 55, 7 58 Q 6 53, 12 51 Q 9 54, 7 56 L 18 54 Z"
              fill="white"
              opacity="0.85"
            />
            {/* Upper feathers */}
            <path
              d="M20 36 Q 11 33, 5 36 Q 4 30, 11 27 Q 7 31, 5 34 L 20 36 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M22 30 Q 14 26, 8 28 Q 7 23, 13 20 Q 10 24, 8 26 L 22 30 Z"
              fill="white"
              opacity="0.9"
            />
          </g>

          {/* Message Bubble */}
          <path
            d="M20 30 C20 20, 30 15, 45 15 L70 15 C80 15, 85 20, 85 30 L85 55 C85 65, 80 70, 70 70 L50 70 L35 85 L35 70 L30 70 C20 70, 20 65, 20 55 Z"
            fill="url(#logoGradient)"
            filter="url(#glow)"
          />
          
          {/* Right Angel Wing - Classic angelic design */}
          <g opacity="0.9" filter="url(#glow)">
            {/* Main wing shape */}
            <path
              d="M87 42 Q 92 40, 98 45 Q 99 38, 92 32 Q 98 35, 99 40 L 87 42 Z"
              fill="white"
              opacity="0.95"
            />
            {/* Secondary feathers */}
            <path
              d="M87 48 Q 90 48, 96 52 Q 97 46, 90 43 Q 94 47, 96 50 L 87 48 Z"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M87 54 Q 88 55, 93 58 Q 94 53, 88 51 Q 91 54, 93 56 L 87 54 Z"
              fill="white"
              opacity="0.85"
            />
            {/* Upper feathers */}
            <path
              d="M85 36 Q 89 33, 95 36 Q 96 30, 89 27 Q 93 31, 95 34 L 85 36 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M83 30 Q 86 26, 92 28 Q 93 23, 87 20 Q 90 24, 92 26 L 83 30 Z"
              fill="white"
              opacity="0.9"
            />
          </g>
          
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
