import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-8 h-8", className)}
    >
      <path d="M4 14v-2a8 8 0 1 1 16 0v2" />
      <path d="M4 14h16" />
      <path d="M12 14v8" />
      <path d="M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M6 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M18 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}
