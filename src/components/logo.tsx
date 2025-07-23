import Image from "next/image";
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
        <Image
          src="/logo.png"
          alt="WASL AI - Medical artificial Intelligence"
          fill
          className="object-contain"
          priority
        />
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
