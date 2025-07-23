import { cn } from "@/lib/utils";
import { BrainCircuit } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return <BrainCircuit className={cn("w-8 h-8", className)} />;
}
