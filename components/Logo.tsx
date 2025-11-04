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
          
          {/* Message Bubble */}
          <path
            d="M20 30 C20 20, 30 15, 45 15 L70 15 C80 15, 85 20, 85 30 L85 55 C85 65, 80 70, 70 70 L50 70 L35 85 L35 70 L30 70 C20 70, 20 65, 20 55 Z"
            fill="url(#logoGradient)"
            filter="url(#glow)"
          />
          
          {/* Wing accent */}
          <path
            d="M70 40 Q 85 35, 95 30 Q 90 40, 85 45 Q 88 42, 90 40 Z"
            fill="url(#logoGradient)"
            opacity="0.9"
          />
          <path
            d="M70 50 Q 85 48, 95 45 Q 90 52, 85 55 Q 88 52, 90 50 Z"
            fill="url(#logoGradient)"
            opacity="0.7"
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
