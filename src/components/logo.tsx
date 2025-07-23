// components/logo.tsx - نسخة محسنة
"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
  withBackground?: boolean;
  animated?: boolean;
}

export function Logo({ 
  className = "", 
  showText = true, 
  size = 100,
  withBackground = false,
  animated = false
}: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className={`relative ${className} ${animated ? 'animate-pulse' : ''}`} 
        style={{ width: size, height: size }}
      >
        {withBackground && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-full opacity-20" />
        )}
        <Image
          src="/logo.png"
          alt="وصّل - Medical AI Intelligence"
          width={size}
          height={size}
          className="object-contain relative z-10"
          priority
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">وصّل</span>
          <span className="text-xs text-muted-foreground">Medical AI Intelligence</span>
        </div>
      )}
    </div>
  );
}