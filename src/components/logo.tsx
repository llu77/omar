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
          <path
            d="M50 95C74.8528 95 95 74.8528 95 50C95 25.1472 74.8528 5 50 5C25.1472 5 5 25.1472 5 50C5 74.8528 25.1472 95 50 95Z"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
          />
          <path 
            d="M30 65L40 35L50 55L60 35L70 65" 
            stroke="hsl(var(--primary))" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
           <path d="M68 44C71.3137 44 74 46.6863 74 50C74 53.3137 71.3137 56 68 56C64.6863 56 62 53.3137 62 50C62 46.6863 64.6863 44 68 44Z" fill="hsl(var(--primary-foreground))" />
           <path d="M68 56V65C68 67.7614 65.7614 70 63 70H58"  stroke="hsl(var(--primary-foreground))" strokeWidth="5" strokeLinecap="round"/>

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
