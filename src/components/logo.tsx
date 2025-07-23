import { cn } from "@/lib/utils";
import { BrainCircuit } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return <BrainCircuit className={cn("w-full h-full", className)} />;
}
