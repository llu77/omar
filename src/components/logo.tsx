import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ 
  className = "", 
  showText = true, 
}: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("relative w-24 h-24", className)}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          {/* Outer Circle */}
          <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary))" strokeWidth="8" />

          {/* Clean, professional 'W' */}
          <path
            d="M25 35 L40 65 L50 45 L60 65 L75 35"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">WASL AI</span>
          <span className="text-xs text-muted-foreground">Medical Artificial Intelligence</span>
        </div>
      )}
    </div>
  );
}
