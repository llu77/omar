import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "p-2 bg-primary/10 rounded-full flex items-center justify-center",
        className
      )}
    >
      <Stethoscope className="text-primary w-full h-full" />
    </div>
  );
}
