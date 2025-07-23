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
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative w-24 h-24", className)}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          <g stroke="hsl(var(--primary))" strokeWidth="1.5">
            {/* Main connections */}
            <path d="M100,20 L130,40" />
            <path d="M100,20 L70,40" />
            <path d="M70,40 L45,60" />
            <path d="M70,40 L85,65" />
            <path d="M130,40 L155,60" />
            <path d="M130,40 L115,65" />
            <path d="M100,20 L100,55" />
            <path d="M45,60 L25,90" />
            <path d="M45,60 L60,95" />
            <path d="M155,60 L175,90" />
            <path d="M155,60 L140,95" />
            <path d="M85,65 L70,100" />
            <path d="M85,65 L100,80" />
            <path d="M115,65 L130,100" />
            <path d="M115,65 L100,80" />
            <path d="M100,55 L85,65" />
            <path d="M100,55 L115,65" />
            <path d="M25,90 L50,120" />
            <path d="M60,95 L50,120" />
            <path d="M60,95 L80,125" />
            <path d="M70,100 L80,125" />
            <path d="M100,80 L80,125" />
            <path d="M100,80 L120,125" />
            <path d="M130,100 L120,125" />
            <path d="M140,95 L150,120" />
            <path d="M140,95 L120,125" />
            <path d="M175,90 L150,120" />
            <path d="M50,120 L80,145" />
            <path d="M80,125 L80,145" />
            <path d="M80,125 L100,150" />
            <path d="M120,125 L120,145" />
            <path d="M120,125 L100,150" />
            <path d="M150,120 L120,145" />
            <path d="M80,145 L100,170" />
            <path d="M120,145 L100,170" />
            <path d="M100,150 L100,170" />
            {/* Dissolving connections */}
            <path d="M175,90 L185,105" />
            <path d="M155,60 L168,75" />
            <path d="M130,40 L145,35" />
          </g>

          <g fill="hsl(var(--primary))">
            {/* Large Nodes */}
            <circle cx="100" cy="20" r="5" />
            <circle cx="70" cy="40" r="6" />
            <circle cx="130" cy="40" r="6" />
            <circle cx="100" cy="80" r="7" />
            <circle cx="60" cy="95" r="5" />
            <circle cx="140" cy="95" r="5" />
            <circle cx="80" cy="125" r="6" />
            <circle cx="120" cy="125" r="6" />
            <circle cx="100" cy="150" r="5" />
            <circle cx="100" cy="170" r="4" />
            
            {/* Medium Nodes */}
            <circle cx="45" cy="60" r="4" />
            <circle cx="155" cy="60" r="4" />
            <circle cx="85" cy="65" r="4.5" />
            <circle cx="115" cy="65" r="4.5" />
            <circle cx="25" cy="90" r="3.5" />
            <circle cx="175" cy="90" r="3.5" />
            <circle cx="50" cy="120" r="4" />
            <circle cx="150" cy="120" r="4" />
            <circle cx="80" cy="145" r="3.5" />
            <circle cx="120" cy="145" r="3.5" />

            {/* Small floating nodes */}
            <circle cx="145" cy="35" r="2" />
            <circle cx="168" cy="75" r="2.5" />
            <circle cx="185" cy="105" r="2" />
            <circle cx="180" cy="45" r="1.5" />
            <circle cx="190" cy="65" r="1.5" />
            <circle cx="195" cy="85" r="1" />
            <circle cx="192" cy="120" r="1.5" />
            <circle cx="170" cy="140" r="1" />
            <circle cx="150" cy="160" r="1.5" />
            <circle cx="165.5" r="1" />
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-primary">WASL AI</span>
          <span className="text-xs text-muted-foreground -mt-1">Medical Artificial Intelligence</span>
        </div>
      )}
    </div>
  );
}
