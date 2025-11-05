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
          
          {/* Left Angel Wing - Bold and white */}
          <g opacity="0.95">
            {/* Outer large feather */}
            <path
              d="M22 50 Q 5 52, 1 58 Q 3 48, 12 45 Q 8 50, 5 54 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Middle feather */}
            <path
              d="M22 42 Q 7 43, 3 48 Q 5 40, 13 38 Q 9 43, 6 46 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Upper feather */}
            <path
              d="M22 34 Q 8 34, 4 38 Q 6 32, 14 30 Q 10 34, 7 37 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Top feather */}
            <path
              d="M24 26 Q 10 25, 6 28 Q 8 24, 15 22 Q 12 26, 9 28 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
          </g>

          {/* Message Bubble */}
          <path
            d="M20 30 C20 20, 30 15, 45 15 L70 15 C80 15, 85 20, 85 30 L85 55 C85 65, 80 70, 70 70 L50 70 L35 85 L35 70 L30 70 C20 70, 20 65, 20 55 Z"
            fill="url(#logoGradient)"
            filter="url(#glow)"
          />
          
          {/* Right Angel Wing - Bold and white */}
          <g opacity="0.95">
            {/* Outer large feather */}
            <path
              d="M83 50 Q 95 52, 99 58 Q 97 48, 88 45 Q 92 50, 95 54 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Middle feather */}
            <path
              d="M83 42 Q 93 43, 97 48 Q 95 40, 87 38 Q 91 43, 94 46 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Upper feather */}
            <path
              d="M83 34 Q 92 34, 96 38 Q 94 32, 86 30 Q 90 34, 93 37 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Top feather */}
            <path
              d="M81 26 Q 90 25, 94 28 Q 92 24, 85 22 Q 88 26, 91 28 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Extra top feather for more presence */}
            <path
              d="M80 18 Q 88 16, 92 18 Q 90 16, 84 14 Q 87 17, 90 19 Z"
              fill="white"
              stroke="white"
              strokeWidth="0.5"
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
