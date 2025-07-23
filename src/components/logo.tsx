"use client";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 200 200"
        className={`${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* الدائرة الخارجية مع التأثير المتلاشي */}
        <circle cx="100" cy="100" r="80" fill="url(#gradient)" opacity="0.1" />
        
        {/* النقاط والخطوط */}
        <g>
          {/* الخطوط */}
          <path d="M60 60 L100 60 L140 60 L140 100 L140 140 L100 140 L60 140 L60 100 Z" 
            stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.3" />
          <path d="M60 60 L100 100 L140 60" stroke="#3B82F6" strokeWidth="1" fill="none" />
          <path d="M60 140 L100 100 L140 140" stroke="#3B82F6" strokeWidth="1" fill="none" />
          <path d="M60 60 L60 100 L60 140" stroke="#3B82F6" strokeWidth="1" fill="none" />
          <path d="M140 60 L140 100 L140 140" stroke="#3B82F6" strokeWidth="1" fill="none" />
          <path d="M100 60 L100 140" stroke="#3B82F6" strokeWidth="1" fill="none" />
          <path d="M60 100 L140 100" stroke="#3B82F6" strokeWidth="1" fill="none" />
          
          {/* النقاط الرئيسية */}
          <circle cx="100" cy="100" r="8" fill="#3B82F6" />
          <circle cx="60" cy="60" r="6" fill="#3B82F6" />
          <circle cx="100" cy="60" r="6" fill="#3B82F6" />
          <circle cx="140" cy="60" r="6" fill="#3B82F6" />
          <circle cx="60" cy="100" r="6" fill="#3B82F6" />
          <circle cx="140" cy="100" r="6" fill="#3B82F6" />
          <circle cx="60" cy="140" r="6" fill="#3B82F6" />
          <circle cx="100" cy="140" r="6" fill="#3B82F6" />
          <circle cx="140" cy="140" r="6" fill="#3B82F6" />
          
          {/* النقاط الصغيرة المتناثرة */}
          <circle cx="120" cy="45" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="80" cy="45" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="155" cy="80" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="155" cy="120" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="45" cy="80" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="45" cy="120" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="120" cy="155" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="80" cy="155" r="2" fill="#3B82F6" opacity="0.6" />
          
          {/* نقاط إضافية للتأثير */}
          <circle cx="130" cy="30" r="1.5" fill="#3B82F6" opacity="0.4" />
          <circle cx="70" cy="30" r="1.5" fill="#3B82F6" opacity="0.4" />
          <circle cx="170" cy="70" r="1.5" fill="#3B82F6" opacity="0.4" />
          <circle cx="170" cy="130" r="1.5" fill="#3B82F6" opacity="0.4" />
          <circle cx="30" cy="70" r="1.5" fill="#3B82F6" opacity="0.4" />
          <circle cx="30" cy="130" r="1.5" fill="#3B82F6" opacity="0.4" />
          <circle cx="130" cy="170" r="1.5" fill="#3B82F6" opacity="0.4" />
          <circle cx="70" cy="170" r="1.5" fill="#3B82F6" opacity="0.4" />
        </g>
        
        {/* التدرج اللوني */}
        <defs>
          <radialGradient id="gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">وصّل</span>
          <span className="text-xs text-muted-foreground">Medical AI Intelligence</span>
        </div>
      )}
    </div>
  );
}